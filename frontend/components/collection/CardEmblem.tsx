import styles from "./album.module.css";

function symbolFor(text: string) {
  if (/librar|book|read|knowledge|study/i.test(text)) return "book";
  if (/garden|tree|nature|park|ecolog|plant/i.test(text)) return "leaf";
  if (/science|math|laborat|research|physics/i.test(text)) return "atom";
  if (/history|heritage|hall|architect|law/i.test(text)) return "column";
  if (/art|music|culture|creativ/i.test(text)) return "spark";
  return null;
}

export default function CardEmblem({ title, category, questTitle }: { title: string; category?: string | null; questTitle: string }) {
  const symbol = symbolFor(title) || symbolFor(category || "") || symbolFor(questTitle) || "compass";
  return <div className={styles.emblem} aria-hidden="true">
    <span className={styles.emblemOrbit} />
    <div className={styles.medallion}>
      <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        {symbol === "book" && <><path d="M50 29C39 21 26 23 18 26v48c12-5 22-3 32 4 10-7 20-9 32-4V26c-8-3-21-5-32 3v49" /><path d="m27 37 14 3m-14 9 14 3m18-12 14-3m-14 15 14-3" /></>}
        {symbol === "leaf" && <><path d="M24 74C7 36 46 19 80 20c1 36-14 71-49 53" /><path d="M22 81 65 36M40 62V43m0 19h20" /></>}
        {symbol === "atom" && <><ellipse cx="50" cy="50" rx="36" ry="14" /><ellipse cx="50" cy="50" rx="36" ry="14" transform="rotate(60 50 50)" /><ellipse cx="50" cy="50" rx="36" ry="14" transform="rotate(120 50 50)" /><circle cx="50" cy="50" r="5" fill="currentColor" stroke="none" /></>}
        {symbol === "column" && <><path d="m17 34 33-17 33 17H17Zm5 7h56M19 76h62M15 83h70M28 43v27m15-27v27m14-27v27m15-27v27" /></>}
        {symbol === "spark" && <><path d="m50 17 8 24 25 9-25 8-8 25-8-25-25-8 25-9Z" /><path d="m77 17 2 6 6 2-6 2-2 6-2-6-6-2 6-2Z" /></>}
        {symbol === "compass" && <><circle cx="50" cy="50" r="32" /><path d="m63 36-7 21-20 7 7-21Z" /><path d="M50 12v9m0 58v9M12 50h9m58 0h9" /><circle cx="50" cy="50" r="3" fill="currentColor" /></>}
      </svg>
    </div>
    <span className={styles.emblemLabel}>Wits Quest · Discovery</span>
  </div>;
}
