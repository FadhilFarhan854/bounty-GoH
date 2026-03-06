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

### 3. Buat Npoint untuk Firekeeper Memories
1. Kunjungi https://www.npoint.io/ lagi
2. Klik "New Document"
3. Isi dengan object: `{"users":{}}`
4. Klik "Create"
5. Copy URL yang diberikan (contoh: `https://api.npoint.io/mem123abc456`)
6. Paste ke `.env.local` sebagai `MEMORIES_JSON_URL`

### 4. Setup .env.local
Buat file `.env.local` di root project dengan isi:

```bash
# Bounty System
JSON_STORAGE_URL=https://api.npoint.io/abc123def456

# Gallery System
GALLERY_JSON_URL=https://api.npoint.io/xyz789uvw012

# Firekeeper Memories (RAG)
MEMORIES_JSON_URL=https://api.npoint.io/mem123abc456

# OpenAI
OPENAI_API_KEY=your-openai-api-key

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

### Firekeeper Memories (RAG)
- Fate Maiden mengingat semua pengembara yang pernah berkunjung
- Memory disimpan ke npoint (MEMORIES_JSON_URL) dengan format `{"users": {...}}`
- Setiap user punya: nama, firstSeen, lastSeen, depths (progress lore), quest history, trait, visitCount, summary
- Cross-user knowledge: bisa tanya "kau kenal Frentzie?" dan AI akan menjawab berdasarkan memory

## Testing
1. Jalankan `npm run dev`
2. Test Invoke Fate - cek data tersimpan di npoint
3. Test upload gallery - cek metadata tersimpan di npoint
4. Test Firekeeper chat - cek memory tersimpan di npoint setelah percakapan
5. Refresh halaman - data harus tetap ada

## Troubleshooting

### Error 404 pada Gallery
- Pastikan `GALLERY_JSON_URL` sudah diset dengan benar di `.env.local`
- Pastikan URL npoint valid dan accessible
- Cek console log untuk melihat URL yang digunakan

### Data tidak tersimpan
- Pastikan npoint document sudah dibuat dengan format yang benar:
  - Bounties & Gallery: array kosong `[]`
  - Memories: object `{"users":{}}`
- Cek browser console untuk error messages
- Pastikan tidak ada typo di environment variable names
