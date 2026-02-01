/**
 * Footer - Site footer (Original Design)
 */

import { Link } from "react-router-dom";
import { MoonLogo } from "@/components/icons/MoonLogo";

export function Footer() {
  return (
    <footer className="py-12 bg-card border-t border-border">
      <div className="container px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <MoonLogo size="sm" animate={false} />
            <span className="text-xl font-bold">
              <span className="text-foreground">Meo</span>
              <span className="text-moon">luna</span>
            </span>
          </div>

          <nav className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <Link
              to="/about"
              className="hover:text-foreground transition-colors"
            >
              Über uns
            </Link>
            <Link
              to="/explore"
              className="hover:text-foreground transition-colors"
            >
              Lernwelten
            </Link>
            <Link
              to="/blog"
              className="hover:text-foreground transition-colors"
            >
              Blog
            </Link>
            <Link
              to="/privacy"
              className="hover:text-foreground transition-colors"
            >
              Datenschutz
            </Link>
            <Link
              to="/terms"
              className="hover:text-foreground transition-colors"
            >
              AGB
            </Link>
            <Link
              to="/imprint"
              className="hover:text-foreground transition-colors"
            >
              Impressum
            </Link>
          </nav>

          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Meoluna. Alle Rechte vorbehalten.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
