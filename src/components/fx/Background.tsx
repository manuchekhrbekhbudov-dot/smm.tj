/** Fixed ambient background: large soft violet light orbs + faint grain. Pure CSS. */
const noise =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.5 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

export function Background() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-bg-0">
      <div className="absolute inset-0" style={{ opacity: "var(--orb-opacity)" }}>
        <div className="absolute left-[-15vw] top-[-20vh] h-[70vmax] w-[70vmax] animate-blob rounded-full blur-[140px]"
          style={{ background: "radial-gradient(circle, rgb(124 58 237 / 0.45) 0%, transparent 62%)" }} />
        <div className="absolute right-[-20vw] top-[25vh] h-[60vmax] w-[60vmax] animate-blob rounded-full blur-[140px]"
          style={{ background: "radial-gradient(circle, rgb(192 38 211 / 0.32) 0%, transparent 62%)", animationDelay: "-9s" }} />
        <div className="absolute bottom-[-30vh] left-[15vw] h-[55vmax] w-[55vmax] animate-blob rounded-full blur-[140px]"
          style={{ background: "radial-gradient(circle, rgb(99 102 241 / 0.22) 0%, transparent 62%)", animationDelay: "-17s" }} />
      </div>
      <div className="absolute inset-0 opacity-[0.025] mix-blend-overlay" style={{ backgroundImage: noise }} />
    </div>
  );
}
