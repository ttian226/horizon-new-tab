/**
 * Firebase Cloud Functions for Horizon
 * Multi-category wallpaper system with scheduled updates
 * AI-powered weather quotes using Vertex AI
 */

import {setGlobalOptions} from "firebase-functions/v2";
import {onSchedule} from "firebase-functions/v2/scheduler";
import {onRequest} from "firebase-functions/v2/https";
import {defineSecret} from "firebase-functions/params";
import * as logger from "firebase-functions/logger";
import {initializeApp} from "firebase-admin/app";
import {getFirestore, FieldValue} from "firebase-admin/firestore";
import {VertexAI} from "@google-cloud/vertexai";

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();

// Define secret for Unsplash API Key
const unsplashApiKey = defineSecret("UNSPLASH_API_KEY");

// Global options for cost control
setGlobalOptions({maxInstances: 10, region: "us-central1"});

// Wallpaper categories - curated for high-quality landscape photos
const CATEGORIES = ["nature", "travel", "architecture", "earth"];

// Image optimization parameters for 4K WebP
const IMAGE_PARAMS = "w=3840&h=2160&fit=crop&fm=webp&q=85";

// Unsplash API response types
interface UnsplashPhoto {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
  };
  user: {
    name: string;
    links: {
      html: string;
    };
  };
  links: {
    html: string;
  };
}

// Wallpaper document structure
interface WallpaperDoc {
  category: string;
  imageUrl: string;
  fullUrl: string;
  photographer: string;
  photographerUrl: string;
  photoUrl: string;
  unsplashId: string;
  createdAt: FieldValue;
}

/**
 * Fetch a single photo from Unsplash for a given category
 * @param {string} category - The wallpaper category
 * @param {string} apiKey - Unsplash API key
 * @return {Promise<WallpaperDoc | null>} Wallpaper data or null
 */
async function fetchPhotoForCategory(
  category: string,
  apiKey: string
): Promise<WallpaperDoc | null> {
  try {
    const unsplashUrl = new URL("https://api.unsplash.com/photos/random");
    unsplashUrl.searchParams.set("query", category);
    unsplashUrl.searchParams.set("orientation", "landscape");
    unsplashUrl.searchParams.set("content_filter", "high");

    const res = await fetch(unsplashUrl.toString(), {
      headers: {
        Authorization: `Client-ID ${apiKey}`,
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      logger.error(`Unsplash API error for ${category}:`, errorText);
      return null;
    }

    const photo: UnsplashPhoto = await res.json();

    // Build optimized image URL from raw URL
    // raw URL format: https://images.unsplash.com/photo-xxx
    // Add parameters for 2K WebP optimization
    const optimizedUrl = `${photo.urls.raw}&${IMAGE_PARAMS}`;

    return {
      category,
      imageUrl: optimizedUrl, // 2K WebP optimized
      fullUrl: photo.urls.full, // Keep full for reference
      photographer: photo.user.name,
      photographerUrl: photo.user.links.html,
      photoUrl: photo.links.html,
      unsplashId: photo.id,
      createdAt: FieldValue.serverTimestamp(),
    };
  } catch (error) {
    logger.error(`Error fetching photo for ${category}:`, error);
    return null;
  }
}

/**
 * Scheduled function: Update wallpapers every hour
 * Fetches 4 photos (one per category) in parallel
 * No limit on wallpapers per category - accumulates over time
 * Runs every hour: "0 * * * *"
 */
export const updateWallpapers = onSchedule(
  {
    schedule: "0 * * * *", // Every hour at minute 0
    timeZone: "UTC",
    secrets: [unsplashApiKey],
  },
  async () => {
    const apiKey = unsplashApiKey.value();

    if (!apiKey) {
      logger.error("Unsplash API key not configured");
      return;
    }

    logger.info("Starting wallpaper update for all categories");

    // Fetch all categories in parallel
    const results = await Promise.all(
      CATEGORIES.map((category) => fetchPhotoForCategory(category, apiKey))
    );

    // Save successful results to Firestore
    let successCount = 0;

    for (const wallpaper of results) {
      if (wallpaper) {
        // Use unsplashId as document ID to avoid duplicates
        const docRef = db
          .collection("wallpapers")
          .doc(wallpaper.category)
          .collection("photos")
          .doc(wallpaper.unsplashId);

        await docRef.set(wallpaper);
        successCount++;
      }
    }

    if (successCount > 0) {
      logger.info(
        `Successfully added ${successCount}/${CATEGORIES.length} wallpapers`
      );
    } else {
      logger.error("Failed to fetch any wallpapers");
    }
  }
);

/**
 * HTTP trigger for manual wallpaper update (for testing)
 * Can be removed in production
 */
export const triggerWallpaperUpdate = onRequest(
  {
    cors: true,
    secrets: [unsplashApiKey],
  },
  async (request, response) => {
    const apiKey = unsplashApiKey.value();

    if (!apiKey) {
      response.status(500).json({error: "API key not configured"});
      return;
    }

    logger.info("Manual trigger: Starting wallpaper update");

    // Fetch all categories in parallel
    const results = await Promise.all(
      CATEGORIES.map((category) => fetchPhotoForCategory(category, apiKey))
    );

    // Save successful results to Firestore
    const savedWallpapers: WallpaperDoc[] = [];

    for (const wallpaper of results) {
      if (wallpaper) {
        // Use unsplashId as document ID to avoid duplicates
        const docRef = db
          .collection("wallpapers")
          .doc(wallpaper.category)
          .collection("photos")
          .doc(wallpaper.unsplashId);

        await docRef.set(wallpaper);
        savedWallpapers.push(wallpaper);
      }
    }

    if (savedWallpapers.length > 0) {
      const msg = `Added ${savedWallpapers.length}/${CATEGORIES.length}`;
      response.json({
        success: true,
        message: msg,
        categories: savedWallpapers.map((w) => w.category),
      });
    } else {
      response.status(500).json({error: "Failed to fetch any wallpapers"});
    }
  }
);

/**
 * One-time migration: Upgrade all existing wallpapers from 2K to 4K
 * Updates imageUrl parameters from w=2560&h=1440&q=80 to w=3840&h=2160&q=85
 * Safe to run multiple times - idempotent operation
 */
export const migrateWallpapersTo4K = onRequest(
  {
    cors: true,
    timeoutSeconds: 300, // 5 minutes for large migrations
  },
  async (request, response) => {
    logger.info("Starting 2K to 4K migration for all wallpapers");

    let totalUpdated = 0;
    let totalSkipped = 0;
    const results: {category: string; updated: number; skipped: number}[] = [];

    for (const category of CATEGORIES) {
      const photosRef = db
        .collection("wallpapers")
        .doc(category)
        .collection("photos");

      const snapshot = await photosRef.get();
      let updated = 0;
      let skipped = 0;

      for (const doc of snapshot.docs) {
        const data = doc.data();
        const oldUrl = data.imageUrl as string;

        // Check if already 4K
        if (oldUrl.includes("w=3840") && oldUrl.includes("h=2160")) {
          skipped++;
          continue;
        }

        // Replace 2K parameters with 4K parameters
        let newUrl = oldUrl
          .replace(/w=\d+/, "w=3840")
          .replace(/h=\d+/, "h=2160")
          .replace(/q=\d+/, "q=85");

        // If no q parameter exists, add it
        if (!newUrl.includes("q=")) {
          newUrl += "&q=85";
        }

        await doc.ref.update({imageUrl: newUrl});
        updated++;
      }

      results.push({category, updated, skipped});
      totalUpdated += updated;
      totalSkipped += skipped;

      logger.info(`${category}: ${updated} updated, ${skipped} skipped`);
    }

    const message =
      `Migration complete: ${totalUpdated} updated, ${totalSkipped} already 4K`;
    logger.info(message);

    response.json({
      success: true,
      message,
      totalUpdated,
      totalSkipped,
      details: results,
    });
  }
);

/**
 * AI Weather Quote Generator using Vertex AI Gemini
 * Generates a short, healing quote based on weather description
 */
export const getWeatherQuote = onRequest(
  {
    cors: true,
    memory: "256MiB",
  },
  async (request, response) => {
    try {
      const {weatherDescription} = request.query;

      if (!weatherDescription || typeof weatherDescription !== "string") {
        response.status(400).json({error: "weatherDescription is required"});
        return;
      }

      logger.info(`Generating quote for weather: ${weatherDescription}`);

      // Initialize Vertex AI with project from environment
      const vertexAI = new VertexAI({
        project: "horizon-30aa6",
        location: "us-central1",
      });

      // Use Gemini 1.5 Flash for speed
      const model = vertexAI.getGenerativeModel({
        model: "gemini-1.5-flash-001",
      });

      const systemPrompt = "You are a poetic companion. " +
        "Generate a short (max 15 words), healing, " +
        "and beautiful English quote based on the weather. " +
        "Return ONLY the quote text, no quotation marks.";
      const prompt = `${systemPrompt} Weather: ${weatherDescription}`;

      const result = await model.generateContent(prompt);
      const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error("No response from AI");
      }

      const quote = text.trim().replace(/^["']|["']$/g, "");

      logger.info(`Generated quote: ${quote}`);

      response.json({
        success: true,
        quote,
        weather: weatherDescription,
      });
    } catch (error) {
      logger.error("Error generating weather quote:", error);
      response.status(500).json({
        error: "Failed to generate quote",
        fallback: "Every weather brings its own kind of beauty.",
      });
    }
  }
);
