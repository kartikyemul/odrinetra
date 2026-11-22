import { useEffect, useRef, useState } from 'react';
import { detect, loadModel } from './detector';
import { LABELS } from './labels';
import { Hazard, loadHazards, saveHazards, toGeoJSON } from './store';
import MapView from './MapView';

export default function App() {
  const video = useRef<HTMLVideoElement>(null);
  const overlay = useRef<HTMLCanvasElement>(null);
  const pos = useRef<GeolocationCoordinates | null>(null);
  const lastLogged = useRef<Record<string, number>>({});
  const running = useRef(false);
  const [hazards, setHazards] = useState<Hazard[]>(loadHazards);
  const [status, setStatus] = useState('Loading model');
  const [on, setOn] = useState(false);

  useEffect(() => {
    loadModel()
      .then(() => setStatus('Ready'))
      .catch(() => setStatus('Model not found. Put hazard.onnx in public/models, see the README.'));
    const id = navigator.geolocation.watchPosition(
      p => { pos.current = p.coords; },
      () => setStatus('Location is blocked. Allow it so hazards get pinned.'),
      { enableHighAccuracy: true },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  useEffect(() => { saveHazards(hazards); }, [hazards]);

  async function start() {
    const v = video.current!;
    v.srcObject = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    await v.play();
    running.current = true;
    setOn(true);
    loop();
  }

  function stop() {
    running.current = false;
    setOn(false);
    (video.current?.srcObject as MediaStream | null)?.getTracks().forEach(t => t.stop());
  }

  async function loop() {
    const v = video.current!, c = overlay.current!;
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    const g = c.getContext('2d')!;
    while (running.current) {
      const found = await detect(v);
      g.clearRect(0, 0, c.width, c.height);
      g.lineWidth = 4;
      g.font = '800 24px Jost, sans-serif';
      for (const b of found) {
        const name = LABELS[b.cls];
        g.strokeStyle = g.fillStyle = '#f6c915';
        g.strokeRect(b.x, b.y, b.w, b.h);
        g.fillText(`${name} ${Math.round(b.score * 100)}`, b.x, Math.max(24, b.y - 8));
        log(name, b.score);
      }
      await new Promise(requestAnimationFrame);
    }
    g.clearRect(0, 0, c.width, c.height);
  }

  function log(label: string, score: number) {
    const p = pos.current, now = Date.now();
    if (!p || now - (lastLogged.current[label] ?? 0) < 4000) return;
    lastLogged.current[label] = now;
    setHazards(h => [{ id: crypto.randomUUID(), label, score, lat: p.latitude, lng: p.longitude, at: now }, ...h]);
  }

  function download() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(toGeoJSON(hazards))], { type: 'application/geo+json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'odrinetra-hazards.geojson';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main>
      <header className="hero">
        <h1>ODRINETRA</h1>
        <p>Point your phone at the road. Every pothole it sees gets a pin.</p>
      </header>
      <div className="centreline" aria-hidden />

      <section className="scanner">
        <div className="frame">
          <video ref={video} playsInline muted />
          <canvas ref={overlay} />
        </div>
        <div className="bar">
          <button onClick={on ? stop : start}>{on ? 'Stop scanning' : 'Start scanning'}</button>
          <span role="status">{status}</span>
        </div>
      </section>

      <section className="ledger">
        <h2>{hazards.length} logged</h2>
        {hazards.length === 0 && <p className="empty">Nothing logged yet. Start scanning and move slowly.</p>}
        <ul>
          {hazards.slice(0, 8).map(h => (
            <li key={h.id}>
              <b>{h.label}</b>
              <span>{new Date(h.at).toLocaleTimeString()}</span>
              <span>{h.lat.toFixed(5)}, {h.lng.toFixed(5)}</span>
            </li>
          ))}
        </ul>
        <div className="bar">
          <button onClick={download} disabled={!hazards.length}>Download GeoJSON</button>
          <button className="quiet" onClick={() => setHazards([])} disabled={!hazards.length}>Clear log</button>
        </div>
      </section>

      <section className="mapwrap"><MapView hazards={hazards} /></section>
      <footer>Video never leaves your phone. The model runs in your browser.</footer>
    </main>
  );
}
