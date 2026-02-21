export interface GalleryItem {
  id: string;
  type: 'image' | 'video';
  path: string;
  publicId?: string; // Cloudinary public_id for deletion
  thumbnail: string | null;
  caption: string;
  uploadedBy: string;
  uploadedAt: string;
}
