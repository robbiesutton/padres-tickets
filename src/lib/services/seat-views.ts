// A View From My Seat API integration
// API docs: https://developer.aviewfrommyseat.com/docs.php

interface SeatViewPhoto {
  imageUrl: string;
  section: string;
  row: string;
  seat: string;
  rating: number;
  notes: string;
  venue: string;
}

// In-memory cache (24h TTL)
const cache = new Map<string, { data: SeatViewPhoto[]; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export async function getSeatViewPhotos(
  venueName: string,
  section: string
): Promise<SeatViewPhoto[]> {
  const cacheKey = `${venueName}:${section}`;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const apiKey = process.env.AVFMS_API_KEY;
  if (!apiKey) {
    console.log('AVFMS_API_KEY not set — seat view photos disabled');
    return [];
  }

  try {
    // Search for photos by venue and section
    const searchUrl = `https://aviewfrommyseat.com/api/search.php?key=${apiKey}&venue=${encodeURIComponent(venueName)}&section=${encodeURIComponent(section)}&format=json`;

    const res = await fetch(searchUrl, {
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      console.error(`AVFMS API error: ${res.status}`);
      return [];
    }

    const data = await res.json();

    // Parse the API response
    const photos: SeatViewPhoto[] = [];
    const items = Array.isArray(data) ? data : data.photos || data.results || [];

    for (const item of items) {
      if (item.filename || item.image || item.url) {
        photos.push({
          imageUrl: item.url || item.image || `https://aviewfrommyseat.com/photos/${item.filename}`,
          section: item.section || section,
          row: item.row || '',
          seat: item.seat || '',
          rating: item.rating ? parseFloat(item.rating) : 0,
          notes: item.notes || '',
          venue: item.venue || venueName,
        });
      }
    }

    // Sort by rating (best first)
    photos.sort((a, b) => b.rating - a.rating);

    // Cache results
    cache.set(cacheKey, { data: photos, timestamp: Date.now() });

    return photos;
  } catch (error) {
    console.error('Failed to fetch seat view photos:', error);
    return [];
  }
}

export function getBestSeatViewUrl(photos: SeatViewPhoto[]): string | null {
  if (photos.length === 0) return null;
  return photos[0].imageUrl;
}
