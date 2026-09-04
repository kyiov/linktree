export async function handler(event) {
  const videoId = event.queryStringParameters?.id || '';
  if (!videoId) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ success: false, error: 'videoId is required' })
    };
  }

  try {
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

    if (!initRes.ok || initRes.status === 403) {
      const fbRes = await fetch(`https://uprising-nugget-dispatch.ngrok-free.dev/api/music/play?id=${encodeURIComponent(videoId)}`, {
        headers: { 'ngrok-skip-browser-warning': '1' }
      });
      if (fbRes.ok) {
        const fbData = await fbRes.json();
        if (fbData.success && fbData.downloadUrl) {
          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify(fbData)
          };
        }
      }
    }

    const initText = await initRes.text();
    let initData;
    try {
      initData = JSON.parse(initText);
    } catch {
      const fbRes = await fetch(`https://uprising-nugget-dispatch.ngrok-free.dev/api/music/play?id=${encodeURIComponent(videoId)}`, {
        headers: { 'ngrok-skip-browser-warning': '1' }
      });
      if (fbRes.ok) {
        const fbData = await fbRes.json();
        if (fbData.success && fbData.downloadUrl) {
          return {
            statusCode: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify(fbData)
          };
        }
      }

      return {
        statusCode: 502,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          success: false,
          error: `Konversi audio sedang sibuk. Silakan coba beberapa detik lagi.`
        })
      };
    }

    if (!initData.statusUrl) {
      throw new Error(initData.msg || 'Gagal membuat antrean konversi audio');
    }

    for (let i = 0; i < 15; i++) {
      await new Promise(r => setTimeout(r, 1200));
      const statusRes = await fetch(initData.statusUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Origin': 'https://media.ytmp3.gg',
          'Referer': 'https://media.ytmp3.gg/'
        }
      });

      const statusText = await statusRes.text();
      let statusData;
      try {
        statusData = JSON.parse(statusText);
      } catch {
        continue;
      }
      if (statusData.downloadUrl) {
        return {
          statusCode: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({
            success: true,
            title: statusData.title || initData.title,
            downloadUrl: statusData.downloadUrl,
            duration: statusData.duration || initData.duration
          })
        };
      }
      if (statusData.status === 'failed') {
        throw new Error('Konversi audio gagal pada server sumber.');
      }
    }

    throw new Error('Waktu tunggu konversi habis. Silakan coba lagu lain.');
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
