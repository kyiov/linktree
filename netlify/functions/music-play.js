import { spotifyPlay } from './scrapers/spotify-play.js';

export async function handler(event) {
  const id = (event.queryStringParameters?.id || '').trim();
  let q = (event.queryStringParameters?.q || event.queryStringParameters?.url || '').trim();

  if (!q && id) {
    if (id.startsWith('sp-')) {
      q = `https://open.spotify.com/track/${id.replace('sp-', '')}`;
    } else if (/^[a-zA-Z0-9]{22}$/.test(id)) {
      q = `https://open.spotify.com/track/${id}`;
    } else {
      q = id;
    }
  }

  if (!q) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ success: false, error: 'Parameter query atau id wajib diisi' })
    };
  }

  try {
    const playRes = await spotifyPlay(q);
    const rawDl = playRes.download_url || '';
    const downloadUrl = rawDl.replace(/https?:\/\/cdn-spotify[a-zA-Z0-9_-]*\.zm\.io\.vn/g, 'https://cdn-spotify.zm.io.vn');
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        title: playRes.title,
        artist: playRes.artist,
        album: playRes.album,
        cover: playRes.cover,
        downloadUrl,
        url: playRes.url,
        source: 'spotify'
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
