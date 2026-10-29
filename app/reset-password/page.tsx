"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import PasswordField from "@/components/PasswordField";
import { LOGO } from "@/lib/config";
import { configured, sb } from "@/lib/supabase";

export default function ResetPassword() {
  const [st, setSt] = useState<"load" | "form" | "invalid" | "done">("load");
  const [a, setA] = useState(""), [b, setB] = useState(""), [err, setErr] = useState(""), [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!configured) { setSt("invalid"); return; }
    if (/error|access_denied|otp_expired/i.test(window.location.hash + window.location.search)) { setSt("invalid"); return; }
    const { data: sub } = sb().auth.onAuthStateChange((e) => { if (e === "PASSWORD_RECOVERY") setSt("form"); });
    sb().auth.getSession().then(({ data }) => { if (data.session) setSt("form"); });
    const t = setTimeout(() => setSt((s) => (s === "load" ? "invalid" : s)), 4000);
    return () => { sub.subscription.unsubscribe(); clearTimeout(t); };
  }, []);
  const submit = async () => {
    setErr("");
    if (a.length < 8 || !/[A-Za-z]/.test(a) || !/[0-9]/.test(a)) { setErr("Use at least 8 characters, with at least one letter and one number."); return; }
    if (a !== b) { setErr("The two passwords do not match."); return; }
    setBusy(true);
    const { error } = await sb().auth.updateUser({ password: a });
    if (error) { setErr("We could not change your password. The reset link may have expired. Please request a new one."); setBusy(false); return; }
    await sb().auth.signOut(); setSt("done");
  };
  return (
    <div className="login">
      <img src={LOGO} alt="ScentbyBecca" style={{ height: 56, width: "auto", marginBottom: 12 }} />
      <h1 style={{ fontSize: 20, marginBottom: 12 }}>Choose a new password</h1>
      {st === "load" && <p className="muted">Checking your reset link...</p>}
      {st === "invalid" && <><p className="err" role="alert">This reset link is invalid or has expired.</p><Link className="btn" href="/admin">Request a new link</Link></>}
      {st === "done" && <><p className="fb" role="status">Your password has been changed.</p><Link className="btn" href="/admin">Go to sign in</Link></>}
      {st === "form" && <>
        <PasswordField id="np" label="New password" value={a} onChange={setA} autoComplete="new-password" />
        <PasswordField id="cp" label="Confirm new password" value={b} onChange={setB} autoComplete="new-password" onEnter={submit} />
        <p className="hint">At least 8 characters, with a letter and a number.</p>
        {err && <p className="err" role="alert">{err}</p>}
        <button className="btn" style={{ marginTop: 16 }} onClick={submit} disabled={busy}>{busy ? "Saving..." : "Change password"}</button>
      </>}
    </div>
  );
}
