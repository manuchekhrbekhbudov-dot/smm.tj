"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LogoMark } from "@/components/ui/Logo";

const KEY = "smmtj:preloaded";

/** Short glass-orb intro, once per browser session. */
export function Preloader() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem(KEY) === "1"; } catch {}
    if (seen || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setShow(false); return; }
    const id = setTimeout(() => { setShow(false); try { sessionStorage.setItem(KEY, "1"); } catch {} }, 1400);
    return () => clearTimeout(id);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          aria-hidden
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-bg-0"
          exit={{ opacity: 0, scale: 1.04, filter: "blur(10px)" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div className="relative" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 160, damping: 14 }}>
            <motion.div className="absolute -inset-10 rounded-full bg-purple/40 blur-3xl" animate={{ scale: [1, 1.25, 1], opacity: [0.6, 1, 0.6] }} transition={{ duration: 1.4, repeat: Infinity }} />
            <div className="relative flex h-28 w-28 items-center justify-center rounded-[36px] glass glass-edge">
              <LogoMark className="h-14 w-14" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
