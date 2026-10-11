"use client";

import dynamic from "next/dynamic";
import { Component, useEffect, useState, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";
import { useTheme } from "./ThemeProvider";
import styles from "./AuthSidePanel.module.css";

const ColorBends = dynamic(() => import("./ColorBends"), { ssr: false });
const colours = { wits: ["#c9a24b", "#96c8ff"], forest: ["#25815b", "#b4dfc5"], ocean: ["#3b8ab1", "#bed6e0"], plum: ["#a5668b", "#f2d7ee"], blush: ["#ffc6c6", "#ffe3e3"], buttermilk: ["#fff1b5", "#c1dbe8"], graphite: ["#606060", "#c4c4c4"] };

class AnimationBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}

export default function AuthSidePanel({ children }: { children: ReactNode }) {
  const { palette } = useTheme();
  const reducedMotion = useReducedMotion();
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
      {visible && !reducedMotion && <AnimationBoundary><ColorBends colors={colours[palette]} speed={0.12} intensity={0.8} noise={0.04} mouseInfluence={0} parallax={0} /></AnimationBoundary>}
    </div>
    <div className={styles.content}>{children}</div>
  </aside>;
}
