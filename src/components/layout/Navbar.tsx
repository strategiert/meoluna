/**
 * Navbar - Main navigation with Clerk authentication (Original Design)
 */

import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogIn, LogOut, GraduationCap, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MoonLogo } from "@/components/icons/MoonLogo";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useClerk,
} from "@clerk/clerk-react";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { signOut } = useClerk();

  const isLandingPage = location.pathname === "/";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/";
  };

  // Determine navbar style based on page and scroll
  const navbarBg = isLandingPage && !isScrolled
    ? "bg-transparent"
    : "bg-background/80 backdrop-blur-xl border-b border-border/40";

  const textColor = isLandingPage && !isScrolled
    ? "text-white/70 hover:text-white"
    : "text-muted-foreground hover:text-foreground";

  const logoTextColor = isLandingPage && !isScrolled
    ? "text-white"
    : "text-foreground";

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navbarBg}`}
    >
      <div className="container px-4">
        <nav className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <MoonLogo size="sm" animate={false} />
            <span className="text-xl font-bold">
              <span className={logoTextColor}>Meo</span>
              <span className="text-moon">luna</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/explore"
              className={`text-sm font-medium transition-colors ${textColor}`}
            >
              Entdecken
            </Link>
            <Link
              to="/about"
              className={`text-sm font-medium transition-colors ${textColor}`}
            >
              Über uns
            </Link>

            <SignedIn>
              <Link
                to="/dashboard"
                className={`text-sm font-medium transition-colors ${textColor}`}
              >
                Meine Welten
              </Link>
            </SignedIn>

            <SignedOut>
              <SignInButton mode="modal">
                <Button
                  variant="ghost"
                  size="sm"
                  className={isLandingPage && !isScrolled ? "text-white hover:bg-white/10" : ""}
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Anmelden
                </Button>
              </SignInButton>
            </SignedOut>

            <SignedIn>
              <div className="flex items-center gap-3">
                <Link to="/teacher">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={isLandingPage && !isScrolled ? "text-white hover:bg-white/10" : ""}
                  >
                    <GraduationCap className="w-4 h-4 mr-2" />
                    Lehrer
                  </Button>
                </Link>
                <Link to="/create">
                  <Button
                    size="sm"
                    className="bg-moon text-night-sky hover:bg-moon-glow"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Neue Welt
                  </Button>
                </Link>
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8",
                    },
                  }}
                />
              </div>
            </SignedIn>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2"
          >
            {isMobileMenuOpen ? (
              <X className={`w-6 h-6 ${isLandingPage && !isScrolled ? "text-white" : ""}`} />
            ) : (
              <Menu className={`w-6 h-6 ${isLandingPage && !isScrolled ? "text-white" : ""}`} />
            )}
          </button>
        </nav>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background/95 backdrop-blur-lg border-b border-border"
          >
            <div className="container px-4 py-4 flex flex-col gap-4">
              <Link
                to="/explore"
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                Entdecken
              </Link>
              <Link
                to="/about"
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                Über uns
              </Link>

              <SignedIn>
                <Link
                  to="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  Meine Welten
                </Link>
                <Link
                  to="/teacher"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  Lehrer-Bereich
                </Link>
                <Link to="/create" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full bg-moon text-night-sky hover:bg-moon-glow">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Neue Welt erstellen
                  </Button>
                </Link>
                <Button onClick={handleLogout} variant="outline" className="w-full">
                  <LogOut className="w-4 h-4 mr-2" />
                  Abmelden
                </Button>
              </SignedIn>

              <SignedOut>
                <SignInButton mode="modal">
                  <Button className="w-full bg-moon text-night-sky hover:bg-moon-glow">
                    <LogIn className="w-4 h-4 mr-2" />
                    Anmelden
                  </Button>
                </SignInButton>
              </SignedOut>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

export default Navbar;
