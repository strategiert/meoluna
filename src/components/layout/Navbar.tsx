/**
 * Navbar - Main navigation with Clerk authentication
 */

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MoonLogo } from '@/components/icons/MoonLogo';
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useUser,
} from '@clerk/clerk-react';

const navLinks = [
  { label: 'Lernwelten', href: '/explore' },
  { label: 'Über uns', href: '/about' },
];

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user } = useUser();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <MoonLogo size={32} className="transition-transform group-hover:scale-110" />
          <span className="font-bold text-xl bg-gradient-to-r from-moon to-foreground bg-clip-text text-transparent">
            Meoluna
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`text-sm font-medium transition-colors hover:text-moon ${
                location.pathname === link.href
                  ? 'text-moon'
                  : 'text-muted-foreground'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Auth Area */}
        <div className="hidden md:flex items-center gap-3">
          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="ghost" size="sm">
                Anmelden
              </Button>
            </SignInButton>
            <SignInButton mode="modal">
              <Button
                size="sm"
                className="bg-gradient-to-r from-moon to-aurora hover:opacity-90 text-background font-medium"
              >
                Kostenlos starten
              </Button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                Dashboard
              </Button>
            </Link>
            <Link to="/teacher">
              <Button variant="ghost" size="sm" className="gap-1.5">
                <GraduationCap className="w-4 h-4" />
                Lehrer
              </Button>
            </Link>
            <Link to="/create">
              <Button
                size="sm"
                className="bg-gradient-to-r from-moon to-aurora hover:opacity-90 text-background font-medium"
              >
                Neue Welt
              </Button>
            </Link>
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: 'w-8 h-8',
                },
              }}
            />
          </SignedIn>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-muted-foreground hover:text-foreground"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background/95 backdrop-blur-xl border-b border-border"
          >
            <div className="container mx-auto px-4 py-4 space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block text-sm font-medium py-2 ${
                    location.pathname === link.href
                      ? 'text-moon'
                      : 'text-muted-foreground'
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              <div className="pt-4 border-t border-border space-y-2">
                <SignedOut>
                  <SignInButton mode="modal">
                    <Button variant="ghost" className="w-full justify-start">
                      Anmelden
                    </Button>
                  </SignInButton>
                  <SignInButton mode="modal">
                    <Button className="w-full bg-gradient-to-r from-moon to-aurora text-background">
                      Kostenlos starten
                    </Button>
                  </SignInButton>
                </SignedOut>

                <SignedIn>
                  <div className="flex items-center gap-3 py-2">
                    <UserButton afterSignOutUrl="/" />
                    <span className="text-sm text-muted-foreground">
                      {user?.firstName || 'Benutzer'}
                    </span>
                  </div>
                  <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      Dashboard
                    </Button>
                  </Link>
                  <Link to="/teacher" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <GraduationCap className="w-4 h-4" />
                      Lehrer-Bereich
                    </Button>
                  </Link>
                  <Link to="/create" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full bg-gradient-to-r from-moon to-aurora text-background">
                      Neue Welt erstellen
                    </Button>
                  </Link>
                </SignedIn>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
