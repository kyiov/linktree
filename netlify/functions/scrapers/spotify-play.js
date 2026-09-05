import { getSpotify } from './spotify-dl.js';

export async function spotifyPlay(query) {
  if (!query || typeof query !== 'string') {
    throw new Error("Parameter query wajib diisi.");
  }

  const trimmed = query.trim();
  const isSpotifyUrl = /open\.spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/i.test(trimmed);

  if (isSpotifyUrl) {
    try {
      const direct = await getSpotify(trimmed);
      if (direct?.download) {
        return {
          title: direct.title,
          artist: direct.artist,
          album: 'Single',
          cover: direct.cover,
          url: trimmed,
          download_url: direct.download,
          source: 'spotify-dl'
        };
      }
    } catch {}
  }

  try {
    const res = await fetch(`https://api.kyio.web.id/api/dl/spotify-play?q=${encodeURIComponent(trimmed)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.status && data?.result?.download_url) {
        return {
          title: data.result.title,
          artist: data.result.artist,
          album: data.result.album || 'Single',
          cover: data.result.cover || '',
          url: data.result.url || trimmed,
          download_url: data.result.download_url,
          source: data.result.source || 'spotify-play'
        };
      }
    }
  } catch {}

  try {
    const res = await fetch(`https://api.kyio.web.id/api/spotify?q=${encodeURIComponent(trimmed)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.status && data?.result?.download_url) {
        return {
          title: data.result.title,
          artist: data.result.artist,
          album: 'Single',
          cover: data.result.cover || '',
          url: data.result.url || trimmed,
          download_url: data.result.download_url,
          source: 'kyioapi-spotify'
        };
      }
    }
  } catch {}

  try {
    const searchRes = await fetch(`https://api.kyio.web.id/api/search/spotify-v2?q=${encodeURIComponent(trimmed)}`);
    if (searchRes.ok) {
      const sData = await searchRes.json();
      const list = Array.isArray(sData) ? sData : (Array.isArray(sData?.result) ? sData.result : (Array.isArray(sData?.tracks) ? sData.tracks : []));
      const top = list[0];
      const trackUrl = top?.url || (top?.id ? `https://open.spotify.com/track/${top.id}` : null);
      if (trackUrl) {
        const direct = await getSpotify(trackUrl);
        if (direct?.download) {
          return {
            title: direct.title || top.title || top.name,
            artist: direct.artist || top.artist,
            album: top.album?.name || 'Single',
            cover: direct.cover || top.thumbnail,
            url: trackUrl,
            download_url: direct.download,
            source: 'spotify-dl'
          };
        }
      }
    }
  } catch {}

  throw new Error('Semua engine Spotify Play gagal memproses lagu.');
}
