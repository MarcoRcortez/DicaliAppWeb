import { useEffect, useRef, useState } from "react";

/**
 * Editor para recortar/ajustar una imagen antes de subirla.
 * El usuario ajusta el ZOOM (slider/rueda) y la POSICIÓN (arrastrando).
 * Al confirmar, exporta un cuadrado `out`×`out` en WebP base64, sin deformar.
 *
 * Props:
 *  - src: object URL o dataURL de la imagen a recortar
 *  - out: tamaño de salida en px (default 300)
 *  - shape: "circle" | "square" (solo afecta la máscara de vista previa)
 *  - onConfirm(base64), onCancel()
 */
const VP = 260; // tamaño del área de edición en px

const ImageCropper = ({ src, out = 300, shape = "circle", onConfirm, onCancel }) => {
  const [img, setImg] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef(null);

  useEffect(() => {
    const image = new Image();
    image.onload = () => { setImg(image); setZoom(1); setOffset({ x: 0, y: 0 }); };
    image.src = src;
  }, [src]);

  if (!img) return null;

  // Escala "cover": la imagen siempre cubre el área, sin dejar huecos.
  const baseScale = Math.max(VP / img.width, VP / img.height);
  const totalScale = baseScale * zoom;
  const dispW = img.width * totalScale;
  const dispH = img.height * totalScale;

  // Limitar el desplazamiento para que la imagen no deje bordes vacíos.
  const clamp = (o) => {
    const maxX = Math.max(0, (dispW - VP) / 2);
    const maxY = Math.max(0, (dispH - VP) / 2);
    return { x: Math.max(-maxX, Math.min(maxX, o.x)), y: Math.max(-maxY, Math.min(maxY, o.y)) };
  };
  const off = clamp(offset);

  const left = (VP - dispW) / 2 + off.x;
  const top = (VP - dispH) / 2 + off.y;

  const onPointerDown = (e) => {
    drag.current = { startX: e.clientX, startY: e.clientY, ox: off.x, oy: off.y };
  };
  const onPointerMove = (e) => {
    if (!drag.current) return;
    setOffset(clamp({ x: drag.current.ox + (e.clientX - drag.current.startX), y: drag.current.oy + (e.clientY - drag.current.startY) }));
  };
  const onPointerUp = () => { drag.current = null; };

  const onWheel = (e) => {
    e.preventDefault();
    setZoom((z) => Math.max(1, Math.min(3, z + (e.deltaY < 0 ? 0.1 : -0.1))));
  };

  const confirmar = () => {
    const canvas = document.createElement("canvas");
    canvas.width = out;
    canvas.height = out;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, out, out);
    const s = out / VP; // el canvas replica exactamente lo que se ve en el área de edición
    ctx.drawImage(img, left * s, top * s, dispW * s, dispH * s);
    onConfirm(canvas.toDataURL("image/webp", 0.85));
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4" onClick={onCancel}>
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm text-center" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-black text-blue-950 mb-1">Ajusta tu imagen</h3>
        <p className="text-xs text-gray-400 mb-4">Arrastra para mover y usa el control para acercar.</p>

        <div
          className="relative mx-auto overflow-hidden bg-gray-100 select-none cursor-move"
          style={{ width: VP, height: VP, borderRadius: shape === "circle" ? "9999px" : "1rem" }}
          onMouseDown={onPointerDown}
          onMouseMove={onPointerMove}
          onMouseUp={onPointerUp}
          onMouseLeave={onPointerUp}
          onWheel={onWheel}
        >
          <img
            src={src}
            alt="editar"
            draggable={false}
            style={{ position: "absolute", left, top, width: dispW, height: dispH, maxWidth: "none" }}
          />
          {/* Borde guía */}
          <div className="pointer-events-none absolute inset-0 ring-2 ring-white/70" style={{ borderRadius: shape === "circle" ? "9999px" : "1rem" }} />
        </div>

        <div className="flex items-center gap-3 mt-4">
          <span className="text-xs text-gray-400">−</span>
          <input type="range" min="1" max="3" step="0.01" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="flex-1 accent-blue-600" />
          <span className="text-xs text-gray-400">+</span>
        </div>

        <div className="flex gap-3 mt-5">
          <button onClick={onCancel} className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-xl font-bold hover:bg-gray-300">Cancelar</button>
          <button onClick={confirmar} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-bold hover:bg-blue-700">Usar imagen</button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;
