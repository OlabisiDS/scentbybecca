export default function Setup({ kind }: { kind: "setup" | "load" }) {
  return (
    <div className="setup">
      <h1 style={{ fontSize: 24, marginBottom: 12 }}>{kind === "setup" ? "Almost ready" : "Could not load the store"}</h1>
      {kind === "setup" ? (
        <><p>This store is not connected to its database yet. Add your Supabase details to the <b>.env.local</b> file, then restart with <b>npm run dev</b>.</p><p className="muted">The README explains each step.</p></>
      ) : (
        <><p>Something went wrong while loading. Please refresh the page. If it keeps happening, check that the database setup file was run in Supabase.</p></>
      )}
    </div>
  );
}
