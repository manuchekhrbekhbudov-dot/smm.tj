"use client";
/** Random per-browser id: a device used by a removed account is refused even with a new number. */
const ID = "smmtj_did";
const BLK = "smmtj_blk";

export function deviceId(): string | null {
  try {
    let d = localStorage.getItem(ID);
    if (!d) { d = crypto.randomUUID(); localStorage.setItem(ID, d); }
    return d;
  } catch { return null; }
}
export function setLocalBlocked(v: boolean) {
  try { if (v) localStorage.setItem(BLK, "1"); else localStorage.removeItem(BLK); } catch { /* private mode */ }
}
export function localBlocked(): boolean {
  try { return localStorage.getItem(BLK) === "1"; } catch { return false; }
}
