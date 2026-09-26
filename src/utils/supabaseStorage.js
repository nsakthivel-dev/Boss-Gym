import { supabase } from '../supabase/config';

// Cache for mapped member profile pictures
let cachedPhotoMap = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 60000; // 1 minute cache

/**
 * Retrieves a map of memberId -> public Supabase profile picture URL
 * by scanning the 'member-profiles' bucket under 'profile-pictures/'.
 */
export const getMemberPhotoMap = async (forceRefresh = false) => {
  const now = Date.now();
  if (!forceRefresh && cachedPhotoMap && (now - lastFetchTime < CACHE_TTL_MS)) {
    return cachedPhotoMap;
  }

  try {
    const { data, error } = await supabase.storage
      .from('member-profiles')
      .list('profile-pictures', { limit: 100 });

    if (error) {
      console.warn('Could not list Supabase member profile pictures:', error);
      return cachedPhotoMap || {};
    }

    const photoMap = {};
    if (Array.isArray(data)) {
      for (const file of data) {
        if (!file?.name || file.name === '.emptyFolderPlaceholder') continue;
        // Filename pattern is usually: <memberId>_<timestamp>.<ext> or <memberId>.<ext>
        const memberId = file.name.split('_')[0].split('.')[0];
        if (memberId && memberId !== 'undefined') {
          const { data: urlData } = supabase.storage
            .from('member-profiles')
            .getPublicUrl(`profile-pictures/${file.name}`);
          
          if (urlData?.publicUrl) {
            photoMap[memberId] = urlData.publicUrl;
          }
        }
      }
    }

    cachedPhotoMap = photoMap;
    lastFetchTime = now;
    return photoMap;
  } catch (err) {
    console.error('Error fetching Supabase photo map:', err);
    return cachedPhotoMap || {};
  }
};

/**
 * Returns the profile picture URL for a member, checking both the member's own field
 * and the Supabase storage map.
 */
export const resolveMemberPhoto = (member, photoMap = {}) => {
  if (member?.profilePictureUrl) return member.profilePictureUrl;
  if (member?.id && photoMap[member.id]) return photoMap[member.id];
  return null;
};
