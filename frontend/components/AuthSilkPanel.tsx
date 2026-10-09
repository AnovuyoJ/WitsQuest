"use client";

import dynamic from "next/dynamic";
import { Component, useEffect, useState, type ReactNode } from "react";
import { useTheme } from "./ThemeProvider";
import styles from "./AuthSilkPanel.module.css";

const Silk = dynamic(() => import("./Silk"), { ssr: false });
const colours = { wits: "#043673", forest: "#164b36", ocean: "#004671", plum: "#69306d", blush: "#70494e" };

class AnimationBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}

export default function AuthSilkPanel({ children }: { children: ReactNode }) {
  const { palette } = useTheme();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const update = () => setVisible(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return <aside className={styles.panel}>
    <div className={styles.animation} aria-hidden="true">
      {visible && <AnimationBoundary><Silk key={palette} color={colours[palette]} speed={2} noiseIntensity={0.4} scale={1} /></AnimationBoundary>}
    </div>
    <div className={styles.content}>{children}</div>
  </aside>;
}
