import styles from "./album.module.css";

export function campusScene(title: string) {
  if (/librar/i.test(title)) return "wits library.jpg";
  if (/tower\s+of\s+light/i.test(title)) return "Tower of  light.jpg";
  if (/\bmsl\b/i.test(title)) return "TW Khambule building @Wits University.jpg";
  if (/great hall|history|heritage/i.test(title)) return "Wits university (1).jpg";
  if (/khambule|science|mathemat/i.test(title)) return "TW Khambule building @Wits University.jpg";
  if (/\bclm\b|commerce|law|management/i.test(title)) return "Wits CLM building.jpg";
  if (/fountain|water/i.test(title)) return "Wits university fountain.jpg";
  if (/garden|tree|nature|park|ecolog/i.test(title)) return "wits university.jpg";
  if (/bus|transport/i.test(title)) return "Wits.jpg";
  const scenes = ["995436323902947317.jpg", "🤍.jpg", "wits university.jpg", "Wits university fountain.jpg"];
  const hash = Array.from(title).reduce((value, letter) => (value * 31 + letter.charCodeAt(0)) >>> 0, 0);
  return scenes[hash % scenes.length];
}

export default function CampusArtwork({ title, className = "" }: { title: string; className?: string }) {
  const photo = campusScene(title);
  return <span aria-hidden="true" className={`${styles.art} ${className}`} style={{ backgroundImage: `url("/wits%20pictures/${encodeURIComponent(photo)}")`, backgroundPosition: photo === "Wits university (1).jpg" ? "center 65%" : "center" }} />;
}
