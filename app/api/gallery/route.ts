/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { writeFile, readFile, mkdir } from 'fs/promises';
import path from 'path';

// Force dynamic to enable file system operations
export const dynamic = 'force-dynamic';

// External JSON storage for gallery metadata
const GALLERY_JSON_URL = process.env.GALLERY_JSON_URL;
const GALLERY_JSON_KEY = process.env.GALLERY_JSON_KEY;

const GALLERY_JSON_PATH = path.join(process.cwd(), 'app', 'data', 'gallery.json');
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads', 'gallery');

// Helper to get headers for external request
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

// Helper to read gallery data
async function getGalleryData(): Promise<any[]> {
  try {
    if (GALLERY_JSON_URL) {
      const response = await fetch(GALLERY_JSON_URL, {
        headers: getHeaders(),
        cache: 'no-store'
      });
      if (!response.ok) {
        throw new Error(`External storage fetch failed: ${response.statusText}`);
      }
      const data = await response.json();
      return data.record || data || [];
    }

    // Fallback to local file
    const fileContent = await readFile(GALLERY_JSON_PATH, 'utf-8');
    return JSON.parse(fileContent);
  } catch {
    return [];
  }
}

// Helper to save gallery data
async function saveGalleryData(data: any[]): Promise<boolean> {
  try {
    if (GALLERY_JSON_URL) {
      const method = GALLERY_JSON_URL.includes('npoint.io') ? 'POST' : 'PUT';
      const response = await fetch(GALLERY_JSON_URL, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      return response.ok;
    }

    // Fallback to local file
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

// POST - Upload new image or video
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const caption = formData.get('caption') as string || '';
    const uploadedBy = formData.get('uploadedBy') as string || 'Anonymous Hunter';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Ensure uploads directory exists
    await mkdir(UPLOADS_DIR, { recursive: true });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const timestamp = Date.now();
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isVideo && !isImage) {
      return NextResponse.json(
        { success: false, error: 'Only images and videos are allowed' },
        { status: 400 }
      );
    }

    let finalPath: string;

    if (isImage) {
      // Check if already webp, otherwise use original extension
      const isWebp = file.type === 'image/webp';
      const ext = isWebp ? 'webp' : (file.name.split('.').pop() || 'png');
      const imageFilename = `img_${timestamp}.${ext}`;
      const imagePath = path.join(UPLOADS_DIR, imageFilename);
      
      await writeFile(imagePath, buffer);
      finalPath = `/uploads/gallery/${imageFilename}`;
    } else {
      // For videos, keep original format
      const ext = file.name.split('.').pop() || 'mp4';
      const videoFilename = `vid_${timestamp}.${ext}`;
      const videoPath = path.join(UPLOADS_DIR, videoFilename);
      
      await writeFile(videoPath, buffer);
      finalPath = `/uploads/gallery/${videoFilename}`;
    }

    // Create gallery item
    const galleryItem = {
      id: `gallery_${timestamp}`,
      type: isVideo ? 'video' : 'image',
      path: finalPath,
      thumbnail: null, // No thumbnail without sharp
      caption,
      uploadedBy,
      uploadedAt: new Date().toISOString(),
    };

    // Add to gallery data
    const gallery = await getGalleryData();
    gallery.unshift(galleryItem); // Add to beginning
    await saveGalleryData(gallery);

    console.log('Gallery item uploaded:', galleryItem);
    return NextResponse.json({ success: true, item: galleryItem });
  } catch (error) {
    console.error('Error uploading to gallery:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

// DELETE - Remove gallery item
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
    const updatedGallery = gallery.filter((item: any) => item.id !== id);

    if (gallery.length === updatedGallery.length) {
      return NextResponse.json(
        { success: false, error: 'Item not found' },
        { status: 404 }
      );
    }

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
