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

// POST - Upload file to Cloudinary and save metadata to JSON
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const caption = (formData.get('caption') as string) || '';
    const uploadedBy = (formData.get('uploadedBy') as string) || 'Anonymous Hunter';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isVideo && !isImage) {
      return NextResponse.json(
        { success: false, error: 'Only images and videos are allowed' },
        { status: 400 }
      );
    }

    // Convert file to base64 data URI for Cloudinary upload
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataUri = `data:${file.type};base64,${base64}`;

    const timestamp = Date.now();

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(dataUri, {
      folder: 'goh-gallery',
      public_id: `${isVideo ? 'vid' : 'img'}_${timestamp}`,
      resource_type: isVideo ? 'video' : 'image',
      overwrite: true,
    });

    // Create gallery item with Cloudinary URL
    const galleryItem = {
      id: `gallery_${timestamp}`,
      type: isVideo ? 'video' : 'image',
      path: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      thumbnail: isVideo
        ? uploadResult.secure_url.replace(/\.[^/.]+$/, '.jpg')
        : null,
      caption,
      uploadedBy,
      uploadedAt: new Date().toISOString(),
    };

    // Save metadata to JSON storage
    const gallery = await getGalleryData();
    gallery.unshift(galleryItem);
    const saved = await saveGalleryData(gallery);

    if (!saved) {
      console.error('Failed to save gallery metadata after Cloudinary upload');
      return NextResponse.json(
        { success: false, error: 'File uploaded but failed to save metadata' },
        { status: 500 }
      );
    }

    console.log('Gallery item uploaded to Cloudinary:', galleryItem.id);
    return NextResponse.json({ success: true, item: galleryItem });
  } catch (error) {
    console.error('Error uploading to gallery:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload file' },
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
