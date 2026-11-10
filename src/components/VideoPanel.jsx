import { useEffect, useRef, useState } from 'react';
import { normalizeEntry, parseVideoUrl } from '../video';

let youtubeApi;
function getYoutubeApi() {
  if (youtubeApi) return youtubeApi;
  youtubeApi = new Promise((resolve, reject) => {
    if (window.YT?.Player) return resolve(window.YT);
    const old = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { old?.(); resolve(window.YT); };
    if (!document.querySelector('script[data-quadview-youtube]')) {
      const script = document.createElement('script');
      script.dataset.quadviewYoutube = 'true';
      script.src = 'https://www.youtube.com/iframe_api';
      script.onerror = () => reject(new Error('YouTube player could not load'));
      document.head.appendChild(script);
    }
  });
  return youtubeApi;
}

export default function VideoPanel({ panelId }) {
  const [queue, setQueue] = useState(() => {
    try { return (JSON.parse(localStorage.getItem(`playlist-${panelId}`)) || []).map(normalizeEntry).filter(Boolean); }
    catch { return []; }
  });
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState('');
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [error, setError] = useState('');
  const playerMount = useRef(null);
  const player = useRef(null);
  const current = queue[index];
  const currentKey = current ? `${current.platform}:${current.id}` : '';

  useEffect(() => { localStorage.setItem(`playlist-${panelId}`, JSON.stringify(queue.map(e => e.url))); }, [panelId, queue]);
  useEffect(() => {
    if (!current || current.platform !== 'youtube' || !playerMount.current) return;
    let disposed = false;
    let ticker;
    const node = document.createElement('div');
    playerMount.current.replaceChildren(node);
    getYoutubeApi().then(YT => {
      if (disposed) return;
      player.current = new YT.Player(node, {
        width: '100%', height: '100%', videoId: current.id,
        playerVars: { autoplay: 1, rel: 0, playsinline: 1 },
        events: {
          onReady: ev => {
            const saved = Number(localStorage.getItem(`video-time-${panelId}-${current.id}`));
            if (saved > 0) ev.target.seekTo(saved, true);
            ticker = window.setInterval(() => {
              try { const time = ev.target.getCurrentTime(); if (Number.isFinite(time)) localStorage.setItem(`video-time-${panelId}-${current.id}`, String(time)); } catch { /* player destroyed */ }
            }, 1000);
          },
          onStateChange: ev => {
            if (ev.data === YT.PlayerState.ENDED) {
              localStorage.removeItem(`video-time-${panelId}-${current.id}`);
              setQueue(prev => {
                const pos = prev.findIndex((entry, i) => i === index && entry.platform === 'youtube' && entry.id === current.id);
                if (pos < 0) return prev;
                const next = prev.filter((_, i) => i !== pos);
                setIndex(Math.min(pos, Math.max(0, next.length - 1)));
                return next;
              });
            }
          }
        }
      });
    }).catch(() => { if (!disposed) setError('Unable to load YouTube player.'); });
    return () => { disposed = true; clearInterval(ticker); try { player.current?.destroy(); } catch { /* noop */ } player.current = null; if (playerMount.current?.contains(node)) playerMount.current.replaceChildren(); };
  }, [currentKey, panelId, index]);

  function add() {
    const parsed = parseVideoUrl(input);
    if (!parsed) { setError('Paste a supported YouTube or Twitch video/channel URL.'); return; }
    setError('');
    setQueue(prev => [...prev, parsed]);
    setInput('');
  }
  function remove(i) {
    setQueue(prev => prev.filter((_, j) => j !== i));
    setIndex(prev => i < prev ? prev - 1 : i === prev ? Math.min(prev, Math.max(0, queue.length - 2)) : prev);
  }
  const twitchSrc = current?.platform === 'twitch' ? `https://player.twitch.tv/?channel=${encodeURIComponent(current.id)}&parent=${encodeURIComponent(window.location.hostname)}&autoplay=false` : current?.platform === 'twitch-vod' ? `https://player.twitch.tv/?video=v${encodeURIComponent(current.id)}&parent=${encodeURIComponent(window.location.hostname)}&autoplay=false` : '';
  return <section className="video-panel" aria-label={`Video panel ${panelId}`}>
    <div className="video-stage">
      {current?.platform === 'youtube' && <div className="youtube-mount" ref={playerMount} />}
      {twitchSrc && <iframe key={currentKey} className="player-frame" src={twitchSrc} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen title={`Twitch ${current.id}`} />}
      {!current && <div className="empty-state"><strong>QuadView</strong><span>Paste a YouTube or Twitch URL to begin</span></div>}
    </div>
    <div className="panel-controls">
      <div className="panel-input-row">
        <input aria-label={`Video URL for ${panelId}`} placeholder="YouTube or Twitch URL" value={input} onChange={e => { setInput(e.target.value); setError(''); }} onKeyDown={e => { if (e.key === 'Enter') add(); }} />
        <button onClick={add}>Add</button>
        <button onClick={() => setPlaylistOpen(v => !v)} aria-expanded={playlistOpen}>Queue ({queue.length})</button>
        <button disabled={!current} onClick={() => remove(index)}>Skip</button>
      </div>
      {error && <div className="panel-error" role="alert">{error}</div>}
      {playlistOpen && <div className="queue-list">{queue.length === 0 ? <p>Queue is empty</p> : queue.map((item, i) => <div key={`${item.url}-${i}`} className={i === index ? 'queue-item active' : 'queue-item'}><button className="queue-select" title={item.url} onClick={() => setIndex(i)}>{i + 1}. {item.platform === 'youtube' ? 'YouTube' : 'Twitch'} · {item.id}</button><button aria-label={`Remove ${item.id}`} onClick={() => remove(i)}>×</button></div>)}</div>}
    </div>
  </section>;
}
