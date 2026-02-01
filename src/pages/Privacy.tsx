/**
 * Privacy Page - Datenschutz
 */

import { Link } from 'react-router-dom';
import { Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center">
              <Moon className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">Meoluna</span>
          </Link>
          <Link to="/">
            <Button variant="ghost">Zurück zur Startseite</Button>
          </Link>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="text-4xl font-bold mb-8">Datenschutzerklärung</h1>
        
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <p className="text-muted-foreground italic mb-8">
            Stand: Februar 2026
          </p>

          <h2>1. Verantwortlicher</h2>
          <p>
            Verantwortlich für die Datenverarbeitung auf dieser Website ist:<br />
            [Name/Firma]<br />
            [Adresse]<br />
            [E-Mail]
          </p>

          <h2>2. Erhebung und Speicherung personenbezogener Daten</h2>
          <p>
            Beim Besuch unserer Website werden automatisch Informationen an den 
            Server unserer Website gesendet. Diese Informationen werden temporär 
            in einem sog. Logfile gespeichert.
          </p>
          <p>Folgende Informationen werden dabei ohne Ihr Zutun erfasst:</p>
          <ul>
            <li>IP-Adresse des anfragenden Rechners</li>
            <li>Datum und Uhrzeit des Zugriffs</li>
            <li>Name und URL der abgerufenen Datei</li>
            <li>Website, von der aus der Zugriff erfolgt</li>
            <li>Verwendeter Browser und ggf. Betriebssystem</li>
          </ul>

          <h2>3. Nutzerkonto</h2>
          <p>
            Bei der Registrierung für ein Nutzerkonto erheben wir:
          </p>
          <ul>
            <li>E-Mail-Adresse</li>
            <li>Name (optional)</li>
            <li>Profilbild (optional)</li>
          </ul>
          <p>
            Die Authentifizierung erfolgt über Clerk (clerk.dev). Bitte beachten 
            Sie auch deren Datenschutzerklärung.
          </p>

          <h2>4. Cookies</h2>
          <p>
            Wir verwenden Cookies, um unsere Website nutzerfreundlicher zu gestalten. 
            Einige Cookies bleiben auf Ihrem Endgerät gespeichert, bis Sie diese 
            löschen.
          </p>

          <h2>5. Ihre Rechte</h2>
          <p>Sie haben das Recht auf:</p>
          <ul>
            <li>Auskunft über Ihre bei uns gespeicherten Daten</li>
            <li>Berichtigung unrichtiger Daten</li>
            <li>Löschung Ihrer Daten</li>
            <li>Einschränkung der Datenverarbeitung</li>
            <li>Widerspruch gegen die Verarbeitung</li>
            <li>Datenübertragbarkeit</li>
          </ul>

          <h2>6. Kontakt</h2>
          <p>
            Bei Fragen zum Datenschutz wenden Sie sich bitte an:<br />
            <a href="mailto:privacy@meoluna.com" className="text-primary">
              privacy@meoluna.com
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
