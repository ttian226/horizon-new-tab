/**
 * Firebase Cloud Functions for Horizon
 * Multi-category wallpaper system with scheduled updates
 */

import {setGlobalOptions} from "firebase-functions/v2";
import {onSchedule} from "firebase-functions/v2/scheduler";
import {onRequest} from "firebase-functions/v2/https";
import {defineSecret} from "firebase-functions/params";
import * as logger from "firebase-functions/logger";
import {initializeApp} from "firebase-admin/app";
import {getFirestore, FieldValue} from "firebase-admin/firestore";

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();

// Define secret for Unsplash API Key
const unsplashApiKey = defineSecret("UNSPLASH_API_KEY");

// Global options for cost control
setGlobalOptions({maxInstances: 10, region: "us-central1"});

// Wallpaper categories
const CATEGORIES = ["nature", "architecture", "minimalist", "technology"];

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

    return {
      category,
      imageUrl: photo.urls.regular,
      fullUrl: photo.urls.full,
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
    const batch = db.batch();
    let successCount = 0;

    results.forEach((wallpaper) => {
      if (wallpaper) {
        // Use category as document ID for easy querying
        const docRef = db.collection("wallpapers").doc(wallpaper.category);
        batch.set(docRef, wallpaper);
        successCount++;
      }
    });

    if (successCount > 0) {
      await batch.commit();
      logger.info(
        `Successfully updated ${successCount}/${CATEGORIES.length} wallpapers`
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
    const batch = db.batch();
    const savedWallpapers: WallpaperDoc[] = [];

    results.forEach((wallpaper) => {
      if (wallpaper) {
        const docRef = db.collection("wallpapers").doc(wallpaper.category);
        batch.set(docRef, wallpaper);
        savedWallpapers.push(wallpaper);
      }
    });

    if (savedWallpapers.length > 0) {
      await batch.commit();
      const msg = `Updated ${savedWallpapers.length}/${CATEGORIES.length}`;
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
