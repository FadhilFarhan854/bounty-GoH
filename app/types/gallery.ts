export interface GalleryItem {
  id: string;
  type: 'image' | 'video';
  path: string;
  thumbnail: string | null;
  caption: string;
  uploadedBy: string;
  uploadedAt: string;
}
