import { useEffect, useRef, useState } from 'react';
import { detect, loadModel } from './detector';
import { LABELS } from './labels';
import { Box } from './postprocess';
import { Hazard, loadHazards, saveHazards, toGeoJSON } from './store';
import MapView from './MapView';

export default function App() {
  const video = useRef<HTMLVideoElement>(null);
  const img = useRef<HTMLImageElement>(null);
  const overlay = useRef<HTMLCanvasElement>(null);
  const pos = useRef<GeolocationCoordinates | null>(null);
  const lastLogged = useRef<Record<string, number>>({});
  const running = useRef(false);
  const minScore = useRef(0.4);
  const [hazards, setHazards] = useState<Hazard[]>(loadHazards);
  const [status, setStatus] = useState('Loading model');
  const [on, setOn] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [conf, setConf] = useState(40);

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
    try {
      setPhoto(null);
      const v = video.current!;
      v.srcObject = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      await v.play();
      running.current = true;
      setOn(true);
      loop();
    } catch {
      setStatus('Camera is blocked or missing. You can still try a photo.');
    }
  }

  function stop() {
    running.current = false;
    setOn(false);
    (video.current?.srcObject as MediaStream | null)?.getTracks().forEach(t => t.stop());
  }

  function drawBoxes(found: Box[], w: number, h: number, save: boolean) {
    const c = overlay.current!;
    if (c.width !== w) { c.width = w; c.height = h; }
    const g = c.getContext('2d')!;
    g.clearRect(0, 0, w, h);
    g.lineWidth = Math.max(3, w / 300);
    g.font = `800 ${Math.max(20, w / 40)}px Jost, sans-serif`;
    for (const b of found) {
      const name = LABELS[b.cls];
      g.strokeStyle = g.fillStyle = '#f6c915';
      g.strokeRect(b.x, b.y, b.w, b.h);
      g.fillText(`${name} ${Math.round(b.score * 100)}`, b.x, Math.max(24, b.y - 8));
      if (save) log(name, b.score);
    }
  }

  async function loop() {
    const v = video.current!;
    try {
      while (running.current) {
        drawBoxes(await detect(v, minScore.current), v.videoWidth, v.videoHeight, true);
        await new Promise(requestAnimationFrame);
      }
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Detection failed.');
      stop();
    }
    overlay.current!.getContext('2d')!.clearRect(0, 0, 9999, 9999);
  }

  function log(label: string, score: number) {
    const p = pos.current, now = Date.now();
    if (!p || now - (lastLogged.current[label] ?? 0) < 4000) return;
    lastLogged.current[label] = now;
    setHazards(h => [{ id: crypto.randomUUID(), label, score, lat: p.latitude, lng: p.longitude, at: now }, ...h]);
  }

  function pickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    stop();
    setPhoto(URL.createObjectURL(file));
  }

  async function checkPhoto() {
    const i = img.current!;
    try {
      const found = await detect(i, minScore.current);
      drawBoxes(found, i.naturalWidth, i.naturalHeight, false);
      setStatus(found.length ? `${found.length} found in this photo` : 'Nothing found in this photo');
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Detection failed.');
    }
  }

  function changeConf(value: number) {
    minScore.current = value / 100;
    setConf(value);
    if (photo) checkPhoto();
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
        <p className="tag">Not an ordinary eye.</p>
        <p>Point your phone at the road. Every pothole it sees gets a pin.</p>
      </header>
      <div className="centreline" aria-hidden />

      <section className="scanner">
        <div className="frame">
          <video ref={video} playsInline muted style={{ display: photo ? 'none' : 'block' }} />
          {photo && <img ref={img} src={photo} onLoad={checkPhoto} alt="Uploaded road" />}
          <canvas ref={overlay} />
        </div>
        <div className="bar">
          <button onClick={on ? stop : start}>{on ? 'Stop scanning' : 'Start scanning'}</button>
          <label className="button quiet">
            Try a photo
            <input type="file" accept="image/*" onChange={pickPhoto} hidden />
          </label>
          <span role="status">{status}</span>
        </div>
        <label className="slider">
          Confidence {conf}%
          <input type="range" min={10} max={90} value={conf} onChange={e => changeConf(+e.target.value)} />
        </label>
      </section>

      <section className="ledger">
        <h2>{hazards.length} logged</h2>
        <div className="chips">
          {LABELS.map(l => (
            <span className="chip" key={l}>{l} <b>{hazards.filter(h => h.label === l).length}</b></span>
          ))}
        </div>
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
