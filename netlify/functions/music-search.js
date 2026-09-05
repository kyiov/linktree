import CryptoJS from 'crypto-js';

const DES_KEY = CryptoJS.enc.Utf8.parse('38346591');

function decryptMediaUrl(encUrl) {
  try {
    const decrypted = CryptoJS.DES.decrypt(
      { ciphertext: CryptoJS.enc.Base64.parse(encUrl) },
      DES_KEY,
      {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
      }
    ).toString(CryptoJS.enc.Utf8);
    if (!decrypted) return null;
    return decrypted.replace('_96.mp4', '_320.mp4');
  } catch {
    return null;
  }
}

function decodeHtml(html) {
  return html
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

export async function handler(event) {
  const query = event.queryStringParameters?.q || '';
  if (!query || !query.trim()) {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({ success: true, results: [] })
    };
  }

  try {
    const trimmed = query.trim();
    const saavnUrl = `https://www.jiosaavn.com/api.php?__call=search.getResults&_format=json&_marker=0&cc=in&includeMetaTags=1&q=${encodeURIComponent(trimmed)}`;
    const saavnRes = await fetch(saavnUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*'
      }
    });

    let items = [];
    if (saavnRes.ok) {
      const data = await saavnRes.json();
      if (Array.isArray(data?.results) && data.results.length > 0) {
        items = data.results
          .filter(r => r.encrypted_media_url)
          .map(r => {
            const streamUrl = decryptMediaUrl(r.encrypted_media_url);
            const durationSec = parseInt(r.duration, 10) || 0;
            const img = (r.image || '').replace('150x150', '500x500');
            return {
              id: `saavn-${r.id}`,
              title: decodeHtml(r.song || ''),
              artist: decodeHtml(r.primary_artists || r.singers || r.music || 'Artist'),
              duration: durationSec,
              thumbnail: img,
              audioUrl: streamUrl,
              source: 'search'
            };
          })
          .filter(r => !!r.audioUrl);
      }
    }

    if (items.length === 0) {
      const ytUrl = `https://yt-meta.convert1s.com/search?q=${encodeURIComponent(trimmed)}`;
      try {
        const ytRes = await fetch(ytUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json'
          }
        });
        if (ytRes.ok) {
          const ytData = await ytRes.json();
          items = (ytData?.items || [])
            .filter(item => item.type === 'stream' || item.type === 'video')
            .slice(0, 10)
            .map(item => {
              let videoId = item.id || '';
              if (videoId.includes('watch?v=')) {
                videoId = videoId.split('watch?v=')[1].split('&')[0];
              } else if (videoId.includes('youtu.be/')) {
                videoId = videoId.split('youtu.be/')[1].split('?')[0];
              }
              return {
                id: videoId,
                title: item.title,
                artist: item.uploaderName || 'YouTube Music',
                duration: item.duration || 0,
                thumbnail: item.thumbnailUrl || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
                source: 'search'
              };
            });
        }
      } catch {}
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ success: true, results: items })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ success: false, error: err.message })
    };
  }
}
