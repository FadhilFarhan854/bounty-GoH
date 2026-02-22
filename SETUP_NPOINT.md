# Setup Npoint untuk Guild Bounty System

## Apa itu Npoint?
Npoint adalah layanan JSON storage gratis yang memungkinkan kita menyimpan dan mengakses data JSON melalui API tanpa perlu backend server.

## Setup untuk Bounty System

### 1. Buat Npoint untuk Active Bounties
1. Kunjungi https://www.npoint.io/
2. Klik "New Document"
3. Isi dengan array kosong: `[]`
4. Klik "Create" 
5. Copy URL yang diberikan (contoh: `https://api.npoint.io/abc123def456`)
6. Paste ke `.env.local` sebagai `JSON_STORAGE_URL`

### 2. Buat Npoint untuk Gallery
1. Kunjungi https://www.npoint.io/ lagi
2. Klik "New Document"
3. Isi dengan array kosong: `[]`
4. Klik "Create"
5. Copy URL yang diberikan (contoh: `https://api.npoint.io/xyz789uvw012`)
6. Paste ke `.env.local` sebagai `GALLERY_JSON_URL`

### 3. Setup .env.local
Buat file `.env.local` di root project dengan isi:

```bash
# Bounty System
JSON_STORAGE_URL=https://api.npoint.io/abc123def456

# Gallery System
GALLERY_JSON_URL=https://api.npoint.io/xyz789uvw012

# Cloudinary (untuk upload gambar/video)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-upload-preset
```

## Cara Kerja

### Active Bounties
- Ketika Invoke Fate dijalankan, 10 boss dipilih secara random
- Data disimpan ke npoint URL (JSON_STORAGE_URL)
- Setiap kali user mark boss as hunted, data diupdate di npoint
- Data persisten dan bisa diakses dari mana saja

### Gallery System  
- User upload gambar/video ke Cloudinary
- Metadata (URL, caption, dll) disimpan ke npoint (GALLERY_JSON_URL)
- Gallery list dibaca dari npoint
- Ketika delete, file dihapus dari Cloudinary dan metadata dihapus dari npoint

## Testing
1. Jalankan `npm run dev`
2. Test Invoke Fate - cek data tersimpan di npoint
3. Test upload gallery - cek metadata tersimpan di npoint
4. Refresh halaman - data harus tetap ada

## Troubleshooting

### Error 404 pada Gallery
- Pastikan `GALLERY_JSON_URL` sudah diset dengan benar di `.env.local`
- Pastikan URL npoint valid dan accessible
- Cek console log untuk melihat URL yang digunakan

### Data tidak tersimpan
- Pastikan npoint document sudah dibuat dengan format array `[]`
- Cek browser console untuk error messages
- Pastikan tidak ada typo di environment variable names
