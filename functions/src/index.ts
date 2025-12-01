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

// Maximum wallpapers to keep per category (to control storage costs)
const MAX_WALLPAPERS_PER_CATEGORY = 20;

/**
 * Scheduled function: Update wallpapers every hour
 * Fetches 4 photos (one per category) in parallel
 * Stores multiple wallpapers per category (up to MAX_WALLPAPERS_PER_CATEGORY)
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

        // Clean up old wallpapers if exceeding limit
        const photosRef = db
          .collection("wallpapers")
          .doc(wallpaper.category)
          .collection("photos");

        const snapshot = await photosRef
          .orderBy("createdAt", "desc")
          .offset(MAX_WALLPAPERS_PER_CATEGORY)
          .get();

        if (!snapshot.empty) {
          const batch = db.batch();
          snapshot.docs.forEach((doc) => batch.delete(doc.ref));
          await batch.commit();
          const cat = wallpaper.category;
          logger.info(`Cleaned up ${snapshot.size} old wallpapers from ${cat}`);
        }
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
