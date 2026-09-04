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
    const url = `https://yt-meta.convert1s.com/search?q=${encodeURIComponent(query.trim())}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Origin': 'https://media.ytmp3.gg',
        'Referer': 'https://media.ytmp3.gg/'
      }
    });

    if (!res.ok) throw new Error(`Search failed: ${res.status}`);
    const data = await res.json();
    const items = (data?.items || [])
      .filter(item => item.type === 'stream' || item.type === 'video')
      .slice(0, 10)
      .map(item => {
        let videoId = item.id;
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
          thumbnail: item.thumbnailUrl || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
        };
      });

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
