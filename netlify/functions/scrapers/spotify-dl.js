export async function getSpotify(spotifyUrl) {
  const res = await fetch("https://gamepvz.com/api/download/get-url", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({ url: spotifyUrl })
  });
  const data = await res.json();
  if (data.code !== 200) throw new Error(data.message || "Failed");

  const b64 = new URLSearchParams(data.originalVideoUrl.split("?")[1]).get("url");
  let directUrl = Buffer.from(b64, "base64").toString("utf8");
  if (directUrl) {
    directUrl = directUrl.replace(/https?:\/\/cdn-spotify[a-zA-Z0-9_-]*\.zm\.io\.vn/g, 'https://cdn-spotify.zm.io.vn');
  }

  return {
    title: data.title,
    artist: data.authorName,
    cover: data.coverUrl,
    download: directUrl
  };
}
