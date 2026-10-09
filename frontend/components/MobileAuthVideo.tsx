"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./MobileAuthVideo.module.css";

export default function MobileAuthVideo() {
  const video = useRef<HTMLVideoElement>(null);
  const [mobile, setMobile] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  useEffect(() => {
    const size = window.matchMedia("(max-width: 1023px)");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => { setMobile(size.matches); setReducedMotion(motion.matches); };
    update();
    size.addEventListener("change", update);
    motion.addEventListener("change", update);
    return () => { size.removeEventListener("change", update); motion.removeEventListener("change", update); };
  }, []);
  useEffect(() => {
    if (!video.current) return;
    if (reducedMotion) video.current.pause();
    else void video.current.play().catch(() => { /* Keep the first frame if autoplay is unavailable. */ });
  }, [mobile, reducedMotion]);
  return <div className={styles.hero} aria-hidden="true">
    {mobile && <video ref={video} src="/video/auth-intro.mp4#t=0.001" muted loop playsInline autoPlay={!reducedMotion} preload="auto" tabIndex={-1} />}
  </div>;
}
