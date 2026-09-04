export async function searchYouTubeMusic(query) {
  if (!query || !query.trim()) return [];

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

  return items;
}

export async function getAudioDownloadUrl(videoId) {
  if (!videoId) throw new Error('videoId is required');

  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const payload = {
    url: watchUrl,
    os: 'windows',
    output: { type: 'audio', format: 'mp3', quality: '128kbps' },
    audio: { bitrate: '128k' }
  };

  const initRes = await fetch('https://hub.convert1s.com/api/download', {
    method: 'POST',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Origin': 'https://media.ytmp3.gg',
      'Referer': 'https://media.ytmp3.gg/'
    },
    body: JSON.stringify(payload)
  });

  const initData = await initRes.json();
  if (!initData.statusUrl) {
    throw new Error(initData.msg || 'Gagal membuat antrean konversi audio');
  }

  for (let i = 0; i < 16; i++) {
    await new Promise(r => setTimeout(r, 1500));
    const statusRes = await fetch(initData.statusUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Origin': 'https://media.ytmp3.gg',
        'Referer': 'https://media.ytmp3.gg/'
      }
    });

    const statusData = await statusRes.json();
    if (statusData.downloadUrl) {
      return {
        status: true,
        title: statusData.title || initData.title,
        downloadUrl: statusData.downloadUrl,
        duration: statusData.duration || initData.duration
      };
    }
    if (statusData.status === 'failed') {
      throw new Error('Konversi audio gagal pada server sumber.');
    }
  }

  throw new Error('Waktu tunggu konversi habis. Silakan coba lagu lain.');
}
