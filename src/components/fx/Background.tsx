/** Fixed ambient background: blurred purple light blobs + film-grain noise. Pure CSS, no JS. */
const noise =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.6 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

export function Background() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-bg-0">
      <div className="absolute inset-0" style={{ opacity: "var(--blob-opacity)" }}>
      <div
        className="absolute -left-[10vw] -top-[10vh] h-[60vmax] w-[60vmax] rounded-full opacity-40 blur-[120px] animate-blob"
        style={{ background: "radial-gradient(circle, #8b5cf6 0%, transparent 65%)" }}
      />
      <div
        className="absolute -right-[15vw] top-[30vh] h-[50vmax] w-[50vmax] rounded-full opacity-30 blur-[120px] animate-blob"
        style={{ background: "radial-gradient(circle, #c026d3 0%, transparent 65%)", animationDelay: "-7s" }}
      />
      <div
        className="absolute bottom-[-20vh] left-[20vw] h-[45vmax] w-[45vmax] rounded-full opacity-25 blur-[120px] animate-blob"
        style={{ background: "radial-gradient(circle, #a855f7 0%, transparent 65%)", animationDelay: "-14s" }}
      />
      </div>
      {/* vignette */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 40%, var(--bg-0) 100%)" }} />
      {/* grain */}
      <div className="absolute inset-0 opacity-[0.035] mix-blend-overlay" style={{ backgroundImage: noise }} />
    </div>
  );
}
