import { useEffect, useRef, useState } from 'react';
import VideoPanel from './components/VideoPanel';
import './App.css';

const OPTIONS = { '1×2': [1,2], '2×1': [2,1], '2×2': [2,2], '3×2': [3,2], '3×3': [3,3] };
const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const equal = n => Array(n).fill(100/n);

export default function App() {
  const [layout, setLayout] = useState(() => OPTIONS[read('quadview-layout','2×2')] ? read('quadview-layout','2×2') : '2×2');
  const [sizes, setSizes] = useState(() => read('quadview-sizes', {}));
  const [toolbarOpen, setToolbarOpen] = useState(true);
  const [playback, setPlayback] = useState({ paused: false, sequence: 0 });
  const grid = useRef(null);
  const drag = useRef(null);
  const [rows, cols] = OPTIONS[layout];
  const config = sizes[layout] || {};
  const widths = config.cols?.length === cols ? config.cols : equal(cols);
  const heights = config.rows?.length === rows ? config.rows : equal(rows);
  useEffect(() => localStorage.setItem('quadview-layout', JSON.stringify(layout)), [layout]);
  useEffect(() => localStorage.setItem('quadview-sizes', JSON.stringify(sizes)), [sizes]);
  useEffect(() => {
    function move(e) {
      if (!drag.current || !grid.current) return;
      const { axis, index, start, original, length } = drag.current;
      const delta = (axis === 'cols' ? e.clientX - start : e.clientY - start) / length * 100;
      const a = original[index] + delta, b = original[index+1] - delta;
      if (a < 8 || b < 8) return;
      setSizes(prev => ({ ...prev, [layout]: { ...prev[layout], [axis]: original.map((v,i) => i === index ? a : i === index+1 ? b : v) } }));
    }
    function up() { drag.current = null; document.body.classList.remove('dragging'); }
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
  }, [layout]);
  function beginDrag(e, axis, index) {
    e.preventDefault();
    const rect = grid.current.getBoundingClientRect();
    drag.current = { axis, index, start: axis === 'cols' ? e.clientX : e.clientY, original: [...(axis === 'cols' ? widths : heights)], length: axis === 'cols' ? rect.width : rect.height };
    document.body.classList.add('dragging');
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }
  return <main className="app-shell">
    <div className="global-controls">
      <button className="toolbar-toggle" onClick={() => setToolbarOpen(v => !v)} aria-expanded={toolbarOpen} title="Show or hide layout controls">▦</button>
      {toolbarOpen && <div className="toolbar-content"><span className="brand">QuadView <small>2.0 preview</small></span><label>Layout <select value={layout} onChange={e => setLayout(e.target.value)}>{Object.keys(OPTIONS).map(k => <option key={k}>{k}</option>)}</select></label><button onClick={() => setPlayback(prev => ({ paused: !prev.paused, sequence: prev.sequence + 1 }))} aria-label={playback.paused ? "Play all videos" : "Pause all videos"} title={playback.paused ? "Play all videos" : "Pause all videos"}>{playback.paused ? "▶ Play All" : "⏸ Pause All"}</button><button onClick={() => setSizes(prev => ({ ...prev, [layout]: {} }))}>Equalize</button><button onClick={() => { if (!document.fullscreenElement) document.documentElement.requestFullscreen?.(); else document.exitFullscreen?.(); }}>Fullscreen</button></div>}
    </div>
    <div className="video-grid" ref={grid} style={{ gridTemplateColumns: widths.map(n => `${n}fr`).join(' '), gridTemplateRows: heights.map(n => `${n}fr`).join(' ') }}>
      {Array.from({length: rows*cols}, (_,i) => <VideoPanel key={`panel-${i+1}`} panelId={`panel-${i+1}`} playback={playback} />)}
      {Array.from({length: cols-1}, (_,i) => <div key={`col-${i}`} className="resize-handle vertical" role="separator" aria-label={`Resize column ${i+1}`} onPointerDown={e => beginDrag(e,'cols',i)} style={{left: `${widths.slice(0,i+1).reduce((a,b)=>a+b,0)}%`}} />)}
      {Array.from({length: rows-1}, (_,i) => <div key={`row-${i}`} className="resize-handle horizontal" role="separator" aria-label={`Resize row ${i+1}`} onPointerDown={e => beginDrag(e,'rows',i)} style={{top: `${heights.slice(0,i+1).reduce((a,b)=>a+b,0)}%`}} />)}
    </div>
  </main>;
}
