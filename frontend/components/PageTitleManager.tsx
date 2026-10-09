"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { resolvePageTitle } from "@/lib/pageTitles";

export default function PageTitleManager() {
  const pathname = usePathname();

  useEffect(() => {
    const title = resolvePageTitle(pathname);
    const finalTitle = title === "WitsQuest" ? "WitsQuest" : `${title} · WitsQuest`;

    function enforceTitle() {
      if (document.title !== finalTitle) {
        document.title = finalTitle;
      }
    }

    enforceTitle();

    const observer = new MutationObserver(enforceTitle);
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });

    return () => {
      observer.disconnect();
    };
  }, [pathname]);

  return null;
}