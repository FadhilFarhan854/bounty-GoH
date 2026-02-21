/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// External JSON storage for gallery metadata
const GALLERY_JSON_URL = process.env.GALLERY_JSON_URL;
const GALLERY_JSON_KEY = process.env.GALLERY_JSON_KEY;
const GALLERY_JSON_PATH = path.join(process.cwd(), 'app', 'data', 'gallery.json');

// Helper to get headers for external JSON request
const getHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (GALLERY_JSON_KEY) {
    headers['X-Master-Key'] = GALLERY_JSON_KEY;
    headers['X-Access-Key'] = GALLERY_JSON_KEY;
    headers['secret-key'] = GALLERY_JSON_KEY;
  }
  return headers;
};

// Helper to read gallery metadata
async function getGalleryData(): Promise<any[]> {
  try {
    if (GALLERY_JSON_URL) {
      const response = await fetch(GALLERY_JSON_URL, {
        headers: getHeaders(),
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error(`External storage fetch failed: ${response.statusText}`);
      }
      const data = await response.json();
      return data.record || data || [];
    }

    // Fallback to local file (dev only)
    const fileContent = await readFile(GALLERY_JSON_PATH, 'utf-8');
    return JSON.parse(fileContent);
  } catch {
    return [];
  }
}

// Helper to save gallery metadata
async function saveGalleryData(data: any[]): Promise<boolean> {
  try {
    if (GALLERY_JSON_URL) {
      const method = GALLERY_JSON_URL.includes('npoint.io') ? 'POST' : 'PUT';
      const response = await fetch(GALLERY_JSON_URL, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return response.ok;
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
    await saveGalleryData(gallery);

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
    await saveGalleryData(updatedGallery);

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
