"use client";

import React, { useRef, useState } from "react";

function Element({ id, kind, payload, transform, focused, onFocus, onUpdate }) {
  const ref = useRef();

  function handlePointerDown(e) {
    e.stopPropagation();
    onFocus(id);
    try { ref.current.setPointerCapture(e.pointerId); } catch {}
    ref.current.dataset.dragging = "true";
    ref.current._startX = e.clientX;
    ref.current._startY = e.clientY;
  }

  function handlePointerMove(e) {
    if (!ref.current || ref.current.dataset.dragging !== "true") return;
    const dx = e.clientX - ref.current._startX;
    const dy = e.clientY - ref.current._startY;
    ref.current._startX = e.clientX;
    ref.current._startY = e.clientY;
    onUpdate(id, (s) => ({ ...s, x: s.x + dx, y: s.y + dy }));
  }

  function handlePointerUp() {
    if (ref.current) ref.current.dataset.dragging = "false";
  }

  const style = {
    transform: `translate(${transform.x}px, ${transform.y}px) rotate(${transform.rot}deg) scale(${transform.sx})`,
    zIndex: transform.z,
    left: 0,
    top: 0,
    position: 'absolute'
  };

  return (
    <div
      ref={ref}
      className={`touch-none select-none ${focused ? "ring-2 ring-pink-400" : ""}`}
      style={style}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {kind === "image" && (
        <img
          src={payload.src}
          className="max-w-[320px] max-h-[320px] rounded shadow"
          alt="uploaded"
          draggable="false"
        />
      )}

      {kind === "text" && (
        <div
          style={{ fontSize: payload.size + 'px', fontFamily: payload.font }}
          className="p-1"
        >
          {payload.text}
        </div>
      )}

      {kind === "icon" && <div className="text-4xl">{payload.icon}</div>}
    </div>
  );
}

export default function Page() {
  const [elements, setElements] = useState([]);
  const [focusedId, setFocusedId] = useState(null);
  const fileInputRef = useRef();

  function addImage(file) {
  if (!file) return;
  const url = URL.createObjectURL(file);
  const id = Date.now();
  setElements((prev) => [
    ...prev,
    {
      id,
      kind: "image",
      payload: { src: url, name: file.name },
      transform: { x: 60, y: 60, sx: 1, rot: 0, z: id },
    },
  ]);
  setFocusedId(id);
}

  function addText() {
    const id = Date.now();
    setElements((prev) => [
      ...prev,
      {
        id,
        kind: "text",
        payload: {
          text: "Your romantic message…",
          size: 32,
          font: "serif",
        },
        transform: { x: 80, y: 80, sx: 1, rot: 0, z: id },
      },
    ]);
    setFocusedId(id);
  }

  function addIcon(icon) {
    const id = Date.now();
    setElements((p) => [
      ...p,
      {
        id,
        kind: "icon",
        payload: { icon },
        transform: { x: 100, y: 100, sx: 1, rot: 0, z: id },
      },
    ]);
    setFocusedId(id);
  }

  function update(id, fn) {
    setElements((prev) =>
      prev.map((el) =>
        el.id === id ? { ...el, transform: fn(el.transform) } : el
      )
    );
  }

  function updatePayload(id, patch) {
    setElements((prev) =>
      prev.map((el) =>
        el.id === id ? { ...el, payload: { ...el.payload, ...patch } } : el
      )
    );
  }

  function remove(id) {
    setElements((p) => p.filter(x => x.id !== id));
    if (focusedId === id) setFocusedId(null);
  }

  function exportAsPNG() {
    const stage = document.querySelector('.export-stage');
    if (!stage) return;
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    const canvas = document.createElement('canvas');
    canvas.width = w * 2;
    canvas.height = h * 2;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    const sorted = [...elements].sort((a,b) => (a.transform.z||0)-(b.transform.z||0));
    const promises = sorted.map(el => {
      if (el.kind === 'image') {
        return new Promise(resolve => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            const scale = 2;
            const x = el.transform.x * scale;
            const y = el.transform.y * scale;
            const w0 = img.width * (el.transform.sx || 1) * scale;
            const h0 = img.height * (el.transform.sx || 1) * scale;
            ctx.save();
            ctx.translate(x + w0/2, y + h0/2);
            ctx.rotate((el.transform.rot||0)*Math.PI/180);
            ctx.drawImage(img, -w0/2, -h0/2, w0, h0);
            ctx.restore();
            resolve();
          };
          img.onerror = () => resolve();
          img.src = el.payload.src;
        });
      }
      if (el.kind === 'text') {
        return new Promise(resolve => {
          const scale = 2;
          const x = el.transform.x * scale;
          const y = el.transform.y * scale;
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate((el.transform.rot||0)*Math.PI/180);
          ctx.font = `${(el.payload.size||24)*scale}px ${el.payload.font||'serif'}`;
          ctx.fillStyle = '#000';
          ctx.textBaseline = 'top';
          const lines = (el.payload.text||'').split('\n');
          for (let i=0;i<lines.length;i++) ctx.fillText(lines[i], 0, i*((el.payload.size||24)*scale + 4));
          ctx.restore();
          resolve();
        });
      }
      if (el.kind === 'icon') {
        return new Promise(resolve => {
          const scale = 2;
          const x = el.transform.x * scale;
          const y = el.transform.y * scale;
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate((el.transform.rot||0)*Math.PI/180);
          ctx.font = `${48*scale}px serif`;
          ctx.fillText(el.payload.icon||'❤', 0, 0);
          ctx.restore();
          resolve();
        });
      }
      return Promise.resolve();
    });

    Promise.all(promises).then(() => {
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = 'romantic-composition.png';
      a.click();
    });
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Romantic Composer ❤️</h1>

      <div className="flex gap-4">
        <button
          className="px-3 py-2 bg-pink-500 text-white rounded"
          onClick={() => fileInputRef.current.click()}
        >
          Upload Image
        </button>
        <button className="px-3 py-2 bg-pink-200 rounded" onClick={addText}>
          Add Text
        </button>
        <button className="px-3 py-2 bg-pink-200 rounded" onClick={() => addIcon('❤️')}>
          Add Heart
        </button>
        <button className="px-3 py-2 bg-pink-200 rounded" onClick={() => addIcon('💌')}>
          Add Envelope
        </button>
        <button className="px-3 py-2 bg-rose-500 text-white rounded" onClick={exportAsPNG}>
          Export PNG
        </button>
      </div>

      <input
        type="file"
        className="hidden"
        ref={fileInputRef}
        onChange={(e) => addImage(e.target.files && e.target.files[0])}
      />

      <div className="relative w-full h-[520px] bg-white border mt-4 rounded overflow-hidden export-stage">
        <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">💘</div>
        {elements.map((el) => (
          <Element
            key={el.id}
            id={el.id}
            kind={el.kind}
            payload={el.payload}
            transform={el.transform}
            focused={focusedId === el.id}
            onFocus={setFocusedId}
            onUpdate={update}
          />
        ))}
      </div>

      <div className="mt-6 space-y-2">
        {focusedId && (() => {
          const el = elements.find(x => x.id === focusedId);
          if (!el) return null;
          return (
            <div className="bg-white p-3 rounded border">
              <div className="flex justify-between items-center">
                <div className="font-medium">Selected element — {el.kind}</div>
                <div className="space-x-2">
                  <button className="px-2 py-1 bg-pink-50 rounded" onClick={() => update(el.id, s => ({ ...s, z: (Math.max(...elements.map(e=>e.transform.z||0))+1) }))}>Bring forward</button>
                  <button className="px-2 py-1 bg-red-50 rounded" onClick={() => remove(el.id)}>Delete</button>
                </div>
              </div>

              {el.kind === 'text' && (
                <div className="mt-2">
                  <label className="block text-sm">Text</label>
                  <textarea className="w-full border rounded p-1" rows={3} value={el.payload.text} onChange={e => updatePayload(el.id, { text: e.target.value })}></textarea>
                  <label className="block text-sm mt-2">Size</label>
                  <input type="range" min={12} max={96} value={el.payload.size} onChange={e => updatePayload(el.id, { size: Number(e.target.value) })} />
                </div>
              )}

              <div className="mt-2 grid grid-cols-3 gap-2">
                <label className="text-xs">X<input className="w-full border rounded p-1" type="number" value={Math.round(el.transform.x)} onChange={e => update(el.id, s => ({ ...s, x: Number(e.target.value) }))} /></label>
                <label className="text-xs">Y<input className="w-full border rounded p-1" type="number" value={Math.round(el.transform.y)} onChange={e => update(el.id, s => ({ ...s, y: Number(e.target.value) }))} /></label>
                <label className="text-xs">Rotate<input className="w-full" type="range" min={-180} max={180} value={el.transform.rot} onChange={e => update(el.id, s => ({ ...s, rot: Number(e.target.value) }))} /></label>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
