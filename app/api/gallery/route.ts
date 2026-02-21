/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

// Log config on startup (no secrets)
console.log('Gallery API Config:', {
  hasCloudinary: !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY),
  hasJsonUrl: !!process.env.GALLERY_JSON_URL,
  cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'NOT SET',
});

export const dynamic = 'force-dynamic';

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// External JSON storage for gallery metadata
const GALLERY_JSON_URL = process.env.GALLERY_JSON_URL;
const GALLERY_JSON_PATH = path.join(process.cwd(), 'app', 'data', 'gallery.json');

// Helper to read gallery metadata
async function getGalleryData(): Promise<any[]> {
  try {
    if (GALLERY_JSON_URL) {
      console.log('Fetching gallery from:', GALLERY_JSON_URL);
      const response = await fetch(GALLERY_JSON_URL, {
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error(`External storage fetch failed: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      // Handle JSONBin.io structure where data is wrapped in 'record'
      const result = Array.isArray(data) ? data : (data.record || data || []);
      return Array.isArray(result) ? result : [];
    }

    // Fallback to local file (dev only)
    const fileContent = await readFile(GALLERY_JSON_PATH, 'utf-8');
    return JSON.parse(fileContent);
  } catch (err) {
    console.error('Error reading gallery data:', err);
    return [];
  }
}

// Helper to save gallery metadata
async function saveGalleryData(data: any[]): Promise<boolean> {
  try {
    if (GALLERY_JSON_URL) {
      console.log('Saving gallery to:', GALLERY_JSON_URL, 'items:', data.length);
      const response = await fetch(GALLERY_JSON_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Save failed:', response.status, errorText);
        return false;
      }
      console.log('Gallery saved successfully');
      return true;
    }

    // Fallback to local file (dev only)
    await writeFile(GALLERY_JSON_PATH, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving gallery data:', error);
    return false;
  }
}

// GET - Fetch all gallery items
export async function GET() {
  try {
    const gallery = await getGalleryData();
    return NextResponse.json(gallery);
  } catch (error) {
    console.error('Error reading gallery:', error);
    return NextResponse.json([]);
  }
}

// POST - Save gallery metadata (file already uploaded to Cloudinary from browser)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, publicId, resourceType, caption, uploadedBy } = body;

    if (!url || !publicId) {
      return NextResponse.json(
        { success: false, error: 'Missing url or publicId' },
        { status: 400 }
      );
    }

    const isVideo = resourceType === 'video';
    const timestamp = Date.now();

    // Create gallery item
    const galleryItem = {
      id: `gallery_${timestamp}`,
      type: isVideo ? 'video' : 'image',
      path: url,
      publicId,
      thumbnail: isVideo
        ? url.replace(/\.[^/.]+$/, '.jpg')
        : null,
      caption: caption || '',
      uploadedBy: uploadedBy || 'Anonymous Hunter',
      uploadedAt: new Date().toISOString(),
    };

    // Save metadata to JSON storage
    const gallery = await getGalleryData();
    gallery.unshift(galleryItem);
    const saved = await saveGalleryData(gallery);

    if (!saved) {
      console.error('Failed to save gallery metadata');
      return NextResponse.json(
        { success: false, error: 'Failed to save metadata' },
        { status: 500 }
      );
    }

    console.log('Gallery item saved:', galleryItem.id);
    return NextResponse.json({ success: true, item: galleryItem });
  } catch (error) {
    console.error('Error saving gallery item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save gallery item' },
      { status: 500 }
    );
  }
}

// DELETE - Remove gallery item from Cloudinary and JSON
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'No ID provided' },
        { status: 400 }
      );
    }

    const gallery = await getGalleryData();
    const itemToDelete = gallery.find((item: any) => item.id === id);

    if (!itemToDelete) {
      return NextResponse.json(
        { success: false, error: 'Item not found' },
        { status: 404 }
      );
    }

    // Delete from Cloudinary if publicId exists
    if (itemToDelete.publicId) {
      try {
        const resourceType = itemToDelete.type === 'video' ? 'video' : 'image';
        await cloudinary.uploader.destroy(itemToDelete.publicId, {
          resource_type: resourceType,
        });
        console.log('Deleted from Cloudinary:', itemToDelete.publicId);
      } catch (cloudErr) {
        console.error('Cloudinary delete error (continuing):', cloudErr);
        // Continue to remove from JSON even if Cloudinary delete fails
      }
    }

    // Remove from JSON storage
    const updatedGallery = gallery.filter((item: any) => item.id !== id);
    const saved = await saveGalleryData(updatedGallery);

    if (!saved) {
      console.error('Failed to save gallery metadata after delete');
      return NextResponse.json(
        { success: false, error: 'Failed to persist deletion' },
        { status: 500 }
      );
    }

    console.log('Gallery item deleted:', id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting gallery item:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete item' },
      { status: 500 }
    );
  }
}
