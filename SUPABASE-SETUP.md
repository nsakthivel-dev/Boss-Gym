# Supabase Setup Guide for Member Profile Pictures

## Overview
This guide will help you set up Supabase to store member profile pictures for the Boss Gym application.

## Prerequisites
1. A Supabase account (sign up at https://supabase.com)
2. A Supabase project created

## Step 1: Get Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy the following values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (e.g., `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

## Step 2: Update Environment Variables

Open your `.env` file and replace the placeholder values:

```env
# Supabase Configuration
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key-here"
```

## Step 3: Create Storage Bucket in Supabase

1. In your Supabase dashboard, navigate to **Storage** in the left sidebar
2. Click **New Bucket**
3. Configure the bucket:
   - **Name**: `member-profiles`
   - **Public**: ✅ Yes (make it public)
   - Click **Create Bucket**

## Step 4: Configure Storage Policies

For security, you need to set up Row Level Security (RLS) policies:

1. Go to **Storage** → **member-profiles** bucket
2. Click on **Policies** tab
3. Click **New Policy** for each of the following:

### Policy 1: Allow Public Read (for viewing profile pictures)
- **Policy Name**: `Allow public read access`
- **Operation**: `SELECT`
- **Target Roles**: `anon`, `authenticated`
- **Policy Definition**: `true`

### Policy 2: Allow Authenticated Upload (for admins)
- **Policy Name**: `Allow authenticated users to upload`
- **Operation**: `INSERT`
- **Target Roles**: `authenticated`
- **Policy Definition**: `true`

### Policy 3: Allow Authenticated Update (for editing profile pictures)
- **Policy Name**: `Allow authenticated users to update`
- **Operation**: `UPDATE`
- **Target Roles**: `authenticated`
- **Policy Definition**: `true`

### Policy 4: Allow Authenticated Delete (for removing profile pictures)
- **Policy Name**: `Allow authenticated users to delete`
- **Operation**: `DELETE`
- **Target Roles**: `authenticated`
- **Policy Definition**: `true`

**Note**: If you're using the anon key for development (not recommended for production), you can set all policies to allow `anon` role as well.

## Step 5: Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the Members page
3. Try adding a new member with a profile picture
4. Try editing an existing member's profile picture
5. Verify that profile pictures display correctly in:
   - Member list
   - Member profile modal

## File Structure

The profile pictures will be stored in Supabase Storage with the following structure:
```
member-profiles/
  ├── {memberId}_{timestamp}.jpg
  ├── {memberId}_{timestamp}.png
  └── ...
```

## Security Best Practices (Production)

1. **Use authenticated access**: Instead of using the anon key, implement Supabase authentication for admin users
2. **Set file size limits**: The app currently limits uploads to 5MB
3. **Validate file types**: Only allow image files (jpg, png, gif, webp)
4. **Regular cleanup**: Remove unused profile pictures periodically

## Troubleshooting

### Issue: Profile pictures not uploading
- Check that your Supabase URL and anon key are correct in `.env`
- Verify the `member-profiles` bucket exists and is public
- Check browser console for error messages
- Ensure storage policies are configured correctly

### Issue: Profile pictures not displaying
- Verify the bucket is set to public
- Check that the public URL is being generated correctly
- Ensure the member document has the `profilePictureUrl` field in Firestore

### Issue: CORS errors
- In Supabase dashboard, go to **Settings** → **API**
- Check CORS settings and add your development/production URLs

## Database Schema

The member profile picture URL is stored in Firestore in the `members` collection:

```javascript
{
  name: "John Doe",
  phone: "+91 1234567890",
  email: "john@example.com",
  price: 5000,
  durationDays: 30,
  startDate: Timestamp,
  endDate: Timestamp,
  status: "active",
  profilePictureUrl: "https://xxxxx.supabase.co/storage/v1/object/public/member-profiles/...",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## Next Steps

- Consider migrating all member data from Firebase to Supabase for a unified backend
- Implement Supabase authentication for enhanced security
- Add image compression before upload to reduce storage usage
- Implement profile picture cropping functionality
