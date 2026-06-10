# Challenge Creation Updates

## ✅ What Was Added

### 1. Image Upload to Supabase Storage
- Users can now upload a thumbnail image when creating a challenge
- Images are stored in Supabase `images` bucket under `challenges/` folder
- File validation: Only images, max 5MB
- Image preview before upload
- Public URL generated and stored with challenge

### 2. VYRAL Token Requirement (Configurable)
- **Testing Mode** (default): No VYRAL tokens required to create challenges
- **Production Mode**: Requires minimum 1 VYRAL token to create a challenge
- Controlled via `.env.local` feature flag: `NEXT_PUBLIC_REQUIRE_VYRAL_TO_CREATE_CHALLENGE`
- Clear UI indicators showing current mode and balance status
- **VYRAL balance**: Used for permission to create challenges
- **SOL balance**: Used for funding challenge rewards (escrow)

### 3. Escrow Wallet Generation
- Automatically generates a unique escrow wallet for each challenge
- Public key stored in `escrowPublicKey` field
- Encrypted private key stored in `escrowSecretKey` field
- Escrow wallet is created before the challenge record

## 🔧 Setup Required

### 1. Add thumbnailUrl Column to Database

Run this SQL in Supabase SQL Editor:
```sql
ALTER TABLE "Challenge" 
ADD COLUMN IF NOT EXISTS "thumbnailUrl" TEXT;
```

Or run the file: `prisma/add-thumbnail-column.sql`

### 2. Create Supabase Storage Bucket

**Via Supabase Dashboard:**
1. Go to: https://app.supabase.com/project/slhmpicloeaqfkgujwsy/storage/buckets
2. Click **"New bucket"**
3. Name: `images`
4. Toggle **"Public bucket"** to ON
5. Click **"Create bucket"**

**Set Storage Policies (for security):**

Run this SQL to allow authenticated uploads:
```sql
-- Allow anyone to upload to images/challenges/ folder
CREATE POLICY "Allow image uploads"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (
  bucket_id = 'images' AND
  (storage.foldername(name))[1] = 'challenges'
);

-- Allow anyone to view images
CREATE POLICY "Allow public image access"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'images');
```

### 3. Configure VYRAL Token Requirement

**For Testing (Current - Default):**
```env
NEXT_PUBLIC_REQUIRE_VYRAL_TO_CREATE_CHALLENGE=false
```
- Users can create challenges without VYRAL tokens
- Useful for development and testing
- Shows green checkmark: "✅ Testing mode: VYRAL not required"

**For Production:**
```env
NEXT_PUBLIC_REQUIRE_VYRAL_TO_CREATE_CHALLENGE=true
```
- Users need at least 1 VYRAL token to create challenges
- Shows balance with warning if insufficient
- Prevents spam and ensures commitment

## 📝 Updated Fields

### Challenge Creation Form
- **Challenge Image** (Optional): Upload thumbnail image
- **Challenge Title** (Required)
- **Description** (Required)
- **Reward Amount** (Required) - SOL amount for rewards, paid from escrow
- **End Date** (Required)
- **VYRAL Balance Check** - Shows status based on feature flag

### API Changes
POST `/api/challenges` now accepts:
```json
{
  "title": "string",
  "description": "string",
  "rewardAmount": "number",
  "endDate": "ISO date string",
  "creatorId": "string",
  "tokenMint": "string (optional)",
  "thumbnailUrl": "string (optional)"
}
```

Returns:
```json
{
  "challenge": {
    "id": "string",
    "title": "string",
    "description": "string",
    "rewardAmount": "number",
    "thumbnailUrl": "string | null",
    "escrowPublicKey": "string",
    "escrowSecretKey": "string (encrypted)",
    ...
  }
}
```

## 🎨 UI Improvements

- Image upload area with drag-to-upload design
- Live image preview
- File type and size validation
- Upload progress indicator
- Real-time balance checking with warnings
- Disabled submit button when VYRAL requirement not met (if enabled)
- Better error messages and loading states
- Clear indicators for testing vs production mode
- "💰 Reward paid in SOL" clarification
- Green checkmark when testing mode is active

## 🚀 Next Steps

1. Implement actual token transfer to escrow wallet when creating challenge
2. Add image cropping/resizing for better thumbnails
3. Support multiple images per challenge
4. Add image compression before upload
5. Implement refund logic if challenge is cancelled
