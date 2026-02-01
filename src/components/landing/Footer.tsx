/**
 * Footer - Site footer with links
 */

import { Link } from 'react-router-dom';
import { MoonLogo } from '@/components/icons/MoonLogo';

const footerLinks = {
  product: [
    { label: 'Lernwelten', href: '/explore' },
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Welt erstellen', href: '/create' },
  ],
  company: [
    { label: 'Über uns', href: '/about' },
    { label: 'Blog', href: '/blog' },
    { label: 'Kontakt', href: '/contact' },
  ],
  legal: [
    { label: 'Datenschutz', href: '/privacy' },
    { label: 'Impressum', href: '/imprint' },
    { label: 'AGB', href: '/terms' },
  ],
};

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-12 px-4 border-t border-border/50 bg-card/30">
      <div className="container mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <MoonLogo size={32} />
              <span className="font-bold text-xl">Meoluna</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Wo Wissen zum Abenteuer wird.
              Magische Lernwelten mit KI erstellen.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-semibold mb-4 text-sm">Produkt</h4>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-moon transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold mb-4 text-sm">Unternehmen</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-moon transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-semibold mb-4 text-sm">Rechtliches</h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-moon transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} Meoluna. Mit Liebe für Bildung gemacht.
          </p>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="text-sm">Made with</span>
            <span className="text-moon">🌙</span>
            <span className="text-sm">under the moonlight</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
