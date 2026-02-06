import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const MOON_PHASES = ["🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘"];

const PAGE_TITLES: Record<string, string> = {
  "/": "Magische Lernwelten",
  "/dashboard": "Meine Welten",
  "/create": "Neue Welt erstellen",
  "/explore": "Welten entdecken",
  "/blog": "Blog",
  "/about": "Über uns",
  "/contact": "Kontakt",
  "/teacher": "Lehrerbereich",
  "/privacy": "Datenschutz",
  "/imprint": "Impressum",
  "/terms": "AGB",
};

export function useAnimatedTitle() {
  const location = useLocation();
  const frameRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    const path = location.pathname;

    // Seitentitel bestimmen
    let pageTitle = PAGE_TITLES[path];
    if (!pageTitle && path.startsWith("/w/")) pageTitle = "Lernwelt";
    if (!pageTitle && path.startsWith("/blog/")) pageTitle = "Blog";
    if (!pageTitle && path.startsWith("/teacher/")) pageTitle = "Lehrerbereich";
    if (!pageTitle) pageTitle = "Magische Lernwelten";

    // Mond-Animation starten
    frameRef.current = 0;

    intervalRef.current = setInterval(() => {
      const moon = MOON_PHASES[frameRef.current % MOON_PHASES.length];
      document.title = `${moon} Meoluna — ${pageTitle}`;
      frameRef.current++;
    }, 400);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [location.pathname]);
}
