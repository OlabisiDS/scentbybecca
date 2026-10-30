/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useCallback, useEffect, useState } from "react";
import { useAdmin } from "@/components/AdminShell";
import { sb } from "@/lib/supabase";
import type { HeroVideo } from "@/lib/types";

function capturePoster(file: File): Promise<string> {
  return new Promise((res) => {
    const v = document.createElement("video"), u = URL.createObjectURL(file);
    v.muted = true; v.playsInline = true; v.preload = "metadata"; v.src = u;
    const done = (d: string) => { URL.revokeObjectURL(u); res(d); };
    v.onloadeddata = () => { v.currentTime = Math.min(0.5, (v.duration || 1) / 2); };
    v.onseeked = () => { try { const k = Math.min(1, 900 / Math.max(v.videoWidth, v.videoHeight)), c = document.createElement("canvas"); c.width = Math.round(v.videoWidth * k); c.height = Math.round(v.videoHeight * k); c.getContext("2d")!.drawImage(v, 0, 0, c.width, c.height); done(c.toDataURL("image/jpeg", 0.8)); } catch { done(""); } };
    v.onerror = () => done("");
  });
}
export default function VideoAdmin() {
  const { api } = useAdmin();
  const [items, setItems] = useState<HeroVideo[] | null>(null), [file, setFile] = useState<File | null>(null), [preview, setPreview] = useState(""), [title, setTitle] = useState(""), [busy, setBusy] = useState(false), [msg, setMsg] = useState(""), [err, setErr] = useState("");
  const load = useCallback(() => api("hero-videos").then((j) => setItems(j.items)).catch((e) => setErr(e.message)), [api]);
  useEffect(() => { load(); }, [load]);
  const choose = (f?: File) => {
    setErr(""); setFile(null); setPreview(""); if (!f) return;
    if (!["video/mp4", "video/webm"].includes(f.type)) { setErr("Please choose an MP4 or WebM video."); return; }
    if (f.size > 40 * 1024 * 1024) { setErr("That video is larger than 40 MB. Please compress it first. Short clips under 10 MB load best on phones."); return; }
    setFile(f); setPreview(URL.createObjectURL(f)); if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
  };
  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 3500); };
  const upload = async () => {
    if (!file) return; setBusy(true); setErr("");
    try {
      const { path, token } = await api("video-upload-url", { method: "POST", body: { ext: file.type === "video/webm" ? "webm" : "mp4" } });
      const { error } = await sb().storage.from("media").uploadToSignedUrl(path, token, file, { contentType: file.type });
      if (error) throw new Error("The upload failed. Check your connection and try again.");
      const poster = await capturePoster(file); let posterUrl = "";
      if (poster) { try { posterUrl = (await api("upload", { method: "POST", body: { dataUrl: poster, folder: "videos" } })).url; } catch { /* poster is optional */ } }
      await api("hero-videos", { method: "POST", body: { title, path, posterUrl } });
      setFile(null); setPreview(""); setTitle(""); flash("Video uploaded. Preview it below, then publish it."); load();
    } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  };
  const publish = async (id: string | null) => { try { await api("hero-videos-publish", { method: "POST", body: { id } }); flash(id ? "Published. The home page now shows this video." : "The original video is back on the home page."); load(); } catch (e) { setErr((e as Error).message); } };
  return (
    <>
      <h1>Video library</h1>
      <p className="muted small">Upload videos here, then use them as a slide in Hero slides. Use a short MP4, ideally under 10 MB, since most visitors are on phones. A still image from the video is used while it loads and for visitors who prefer less motion.</p>
      {msg && <div className="fb" role="status">{msg}</div>}{err && <p className="err" role="alert">{err}</p>}
      <div className="cardx">
        <b>Add a new video</b>
        <input type="file" accept="video/mp4,video/webm" aria-label="Choose a video" style={{ display: "block", margin: "10px 0" }} onChange={(e) => choose(e.target.files?.[0])} />
        {preview && <><video src={preview} controls muted playsInline preload="metadata" style={{ width: "100%", maxHeight: 320, background: "#000" }} /><p className="hint">{(file!.size / 1048576).toFixed(1)} MB{file!.size > 12 * 1048576 ? ". This is large for mobile data. A smaller file is recommended." : ""}</p>
          <label className="lab" htmlFor="vt">Name (only you see this)</label><input id="vt" className="in-t" maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Example: Christmas 2026" />
          <button className="btn" style={{ marginTop: 12 }} onClick={upload} disabled={busy}>{busy ? "Uploading, please wait..." : "Upload video"}</button></>}
      </div>
      <h2 style={{ fontSize: 16, margin: "20px 0 8px" }}>Your videos</h2>
      {items === null ? <p className="muted">Loading...</p> : <>
        <div className="cardx"><b>Original video</b> {!items.some((v) => v.active) && <span className="tag g">Published</span>}<p className="small muted">The video the site launched with. Old home videos only show when there are no hero slides.</p>{items.some((v) => v.active) && <button className="btn o sm fit" onClick={() => publish(null)}>Use the original video</button>}</div>
        {items.map((v) => (
          <div className="cardx" key={v.id}>
            <b>{v.title}</b> {v.active && <span className="tag g">Published</span>}
            <video src={v.videoUrl} poster={v.posterUrl || undefined} controls muted playsInline preload="none" style={{ width: "100%", maxHeight: 260, background: "#000", margin: "8px 0" }} />
            <div className="acts">{!v.active && <button className="btn sm fit" onClick={() => publish(v.id)}>Use as old home video</button>}
              <button className="btn red sm fit" onClick={async () => { if (confirm(`Delete "${v.title}" permanently?${v.active ? " The original video will be shown instead." : ""}`)) { try { await api("hero-videos", { method: "DELETE", query: `id=${v.id}` }); load(); } catch (e) { setErr((e as Error).message); } } }}>Delete</button></div>
          </div>
        ))}</>}
    </>
  );
}
