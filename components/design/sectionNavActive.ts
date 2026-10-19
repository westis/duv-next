"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * The active item of a section list. Route items ("/events/1/results") match
 * the pathname, the longest match winning so /events/1 is not active on
 * /events/1/results. In-page items ("#results") follow the scroll position:
 * the last section whose top has passed below the sticky header.
 */
export function useActiveSection(hrefs: string[]): string | undefined {
  const pathname = usePathname();
  const anchors = hrefs.filter((href) => href.startsWith("#"));
  const anchorKey = anchors.join(" ");
  const [anchor, setAnchor] = useState<string | undefined>(anchors[0]);

  useEffect(() => {
    const ids = anchorKey ? anchorKey.split(" ").map((href) => href.slice(1)) : [];
    if (ids.length === 0) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const offset = Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
      let current = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= offset + 8) current = id;
      }
      // At the very bottom the last section is the one being read, however short.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) current = ids[ids.length - 1];
      setAnchor(`#${current}`);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [anchorKey]);

  const route = hrefs
    .filter((href) => !href.startsWith("#"))
    .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0];
  return route ?? (anchors.length ? anchor : undefined);
}
