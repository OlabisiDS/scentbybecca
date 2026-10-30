"use client";
import { useEffect } from "react";
import { X } from "lucide-react";
export default function Panel({ title, onClose, children, footer }: { title: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", k); document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [onClose]);
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className="panel" role="dialog" aria-modal="true" aria-label={title}>
        <div className="pn-h"><h2>{title}</h2><button className="ib" aria-label="Close" onClick={onClose} autoFocus><X size={24} strokeWidth={1.5} /></button></div>
        <div className="pn-b">{children}</div>
        {footer && <div className="pn-f">{footer}</div>}
      </div>
    </>
  );
}
