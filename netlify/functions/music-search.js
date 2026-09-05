import { spotifyPlay } from './scrapers/spotify-play.js';

export async function handler(event) {
  const query = (event.queryStringParameters?.q || '').trim();
  if (!query) {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ success: true, results: [] })
    };
  }

  const isSpotifyUrl = /open\.spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/i.test(query);
  if (isSpotifyUrl) {
    try {
      const single = await spotifyPlay(query);
      const matchId = query.match(/track\/([a-zA-Z0-9]+)/)?.[1] || '';
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: true,
          results: [
            {
              id: `sp-${matchId || 'direct'}`,
              spotifyId: matchId,
              title: single.title,
              artist: single.artist,
              duration: 0,
              thumbnail: single.cover,
              audioUrl: single.download_url,
              url: single.url || query,
              source: 'spotify'
            }
          ]
        })
      };
    } catch {}
  }

  try {
    const searchRes = await fetch(`https://api.kyio.web.id/api/search/spotify-v2?q=${encodeURIComponent(query)}`);
    if (searchRes.ok) {
      const sData = await searchRes.json();
      const list = Array.isArray(sData) ? sData : (Array.isArray(sData?.result) ? sData.result : (Array.isArray(sData?.tracks) ? sData.tracks : []));
      if (list.length > 0) {
        const results = list.slice(0, 15).map((t, idx) => {
          const trackId = t.id || '';
          return {
            id: `sp-${trackId || idx}`,
            spotifyId: trackId,
            title: t.title || t.name || 'Spotify Track',
            artist: t.artist || t.artists?.[0]?.name || 'Spotify Artist',
            duration: t.duration_ms ? Math.floor(t.duration_ms / 1000) : 0,
            thumbnail: t.thumbnail || t.album?.images?.[0]?.url || t.images?.[0]?.url || '',
            url: t.url || (trackId ? `https://open.spotify.com/track/${trackId}` : ''),
            source: 'spotify'
          };
        });

        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: JSON.stringify({ success: true, results })
        };
      }
    }
  } catch {}

  try {
    const fallbackPlay = await spotifyPlay(query);
    const trackId = fallbackPlay.url?.match(/track\/([a-zA-Z0-9]+)/)?.[1] || '';
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        results: [
          {
            id: `sp-${trackId || 'top'}`,
            spotifyId: trackId,
            title: fallbackPlay.title,
            artist: fallbackPlay.artist,
            duration: 0,
            thumbnail: fallbackPlay.cover,
            audioUrl: fallbackPlay.download_url,
            url: fallbackPlay.url || query,
            source: 'spotify'
          }
        ]
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ success: false, error: err.message })
    };
  }
}
