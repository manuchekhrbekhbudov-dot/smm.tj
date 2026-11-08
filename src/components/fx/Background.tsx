/** Fixed ambient background: static soft violet light (no animation = smooth scrolling on phones). */
export function Background() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-bg-0">
      <div className="absolute inset-0" style={{
        opacity: "var(--orb-opacity)",
        background:
          "radial-gradient(60vmax 60vmax at 10% 0%, rgb(124 58 237 / 0.35), transparent 60%)," +
          "radial-gradient(50vmax 50vmax at 100% 45%, rgb(192 38 211 / 0.22), transparent 60%)," +
          "radial-gradient(45vmax 45vmax at 30% 110%, rgb(99 102 241 / 0.16), transparent 60%)",
      }} />
    </div>
  );
}
