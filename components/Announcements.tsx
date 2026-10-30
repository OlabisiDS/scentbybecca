"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
// One-line messages above the header, written in Admin > Announcements. They take turns every 5 seconds.
export default function AnnouncementBar() {
  const { announcements } = useStore();
  const list = announcements.filter((a) => a.active), [i, setI] = useState(0);
  useEffect(() => { if (list.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return; const t = setInterval(() => setI((v) => v + 1), 5000); return () => clearInterval(t); }, [list.length]);
  if (!list.length) return null;
  const a = list[i % list.length];
  return <div className="ann" role="region" aria-label="Announcements"><span key={a.id}>{a.href ? (/^https?:/.test(a.href) ? <a href={a.href} target="_blank" rel="noopener noreferrer">{a.text}</a> : <Link href={a.href}>{a.text}</Link>) : a.text}</span></div>;
}
