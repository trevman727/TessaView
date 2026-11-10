export function parseVideoUrl(raw) {
  try {
    const u = new URL(raw.trim().startsWith('http') ? raw.trim() : `https://${raw.trim()}`);
    const host = u.hostname.toLowerCase().replace(/^www\./, '').replace(/^m\./, '');
    if (host === 'youtu.be' || host === 'youtube.com' || host === 'youtube-nocookie.com') {
      let id = host === 'youtu.be' ? u.pathname.split('/')[1] : u.searchParams.get('v');
      if (!id) id = u.pathname.match(/^\/(?:shorts|embed|live)\/([^/?]+)/)?.[1];
      if (/^[\w-]{11}$/.test(id || '')) return { platform: 'youtube', id, url: `https://www.youtube.com/watch?v=${id}` };
    }
    if (host === 'twitch.tv' || host === 'player.twitch.tv') {
      const parts = u.pathname.split('/').filter(Boolean);
      const channel = host === 'player.twitch.tv' ? u.searchParams.get('channel') : parts[0];
      const video = host === 'player.twitch.tv' ? u.searchParams.get('video') : parts[0] === 'videos' ? parts[1] : null;
      if (video && /^\d+$/.test(video.replace(/^v/, ''))) return { platform: 'twitch-vod', id: video.replace(/^v/, ''), url: `https://www.twitch.tv/videos/${video.replace(/^v/, '')}` };
      if (channel && /^[\w]{3,25}$/.test(channel) && !['directory','downloads','settings','search','videos'].includes(channel.toLowerCase())) return { platform: 'twitch', id: channel, url: `https://www.twitch.tv/${channel}` };
    }
  } catch { /* invalid URL */ }
  return null;
}
export function normalizeEntry(entry) {
  if (typeof entry === 'string') return parseVideoUrl(entry);
  if (entry && typeof entry.url === 'string') return parseVideoUrl(entry.url);
  return null;
}
