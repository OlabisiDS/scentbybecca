"use client";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
export default function PasswordField({ id, label, value, onChange, autoComplete, onEnter }: { id: string; label: string; value: string; onChange: (v: string) => void; autoComplete: string; onEnter?: () => void }) {
  const [show, setShow] = useState(false);
  return (
    <>
      <label className="lab" htmlFor={id}>{label}</label>
      <div style={{ position: "relative" }}>
        <input id={id} className="in-t" type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete} onKeyDown={(e) => e.key === "Enter" && onEnter?.()} style={{ paddingRight: 52 }} />
        <button type="button" className="ib" aria-label={show ? "Hide password" : "Show password"} aria-pressed={show} onClick={() => setShow((s) => !s)} style={{ position: "absolute", right: 2, top: 2 }}>{show ? <EyeOff size={20} strokeWidth={1.5} /> : <Eye size={20} strokeWidth={1.5} />}</button>
      </div>
    </>
  );
}
