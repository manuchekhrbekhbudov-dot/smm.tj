/** No JS-driven route animation: content must be visible from the first paint. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-in">{children}</div>;
}
