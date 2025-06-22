import { useEffect } from "react";
import { useFeedStore } from "../store/feedStore";

export function useSectionScrollRestore(sectionKey) {
  const scrollPos = useFeedStore(s => s.sections[sectionKey]?.scrollPos || 0);
  const setScrollPos = useFeedStore(s => s.setScrollPos);

  useEffect(() => {
    window.scrollTo(0, scrollPos);
    const onScroll = () => setScrollPos(sectionKey, window.scrollY);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [sectionKey, scrollPos]);
}