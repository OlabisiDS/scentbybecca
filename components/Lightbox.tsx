"use client";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
export default function Lightbox({ images, start = 0, onClose }: { images: string[]; start?: number; onClose: () => void }) {
  const [i, setI] = useState(start);
  const x0 = useRef(0);
  const go = (d: number) => setI((v) => (v + d + images.length) % images.length);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); };
    document.addEventListener("keydown", k); document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", k); document.body.style.overflow = ""; };
    // eslint-disable-next-line
  }, []);
  return (
    <div className="lb" role="dialog" aria-modal="true" aria-label="Photo viewer" onClick={onClose}
      onTouchStart={(e) => (x0.current = e.touches[0].clientX)} onTouchEnd={(e) => { const d = e.changedTouches[0].clientX - x0.current; if (Math.abs(d) > 50 && images.length > 1) go(d < 0 ? 1 : -1); }}>
      <button className="ib lbx" aria-label="Close photo viewer" onClick={onClose} autoFocus><X size={26} strokeWidth={1.5} /></button>
      <img key={i} src={images[i]} alt={`Photo ${i + 1} of ${images.length}`} onClick={(e) => e.stopPropagation()} />
      {images.length > 1 && <>
        <button className="ib lbp" aria-label="Previous photo" onClick={(e) => { e.stopPropagation(); go(-1); }}><ChevronLeft size={30} strokeWidth={1.5} /></button>
        <button className="ib lbn" aria-label="Next photo" onClick={(e) => { e.stopPropagation(); go(1); }}><ChevronRight size={30} strokeWidth={1.5} /></button>
        <span className="lbc">{i + 1} / {images.length}</span></>}
    </div>
  );
}
