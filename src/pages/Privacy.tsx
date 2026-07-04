/**
 * Privacy Page - Datenschutz
 */

import { Navbar } from '@/components/layout/Navbar';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-16 max-w-3xl">
        <h1 className="text-4xl font-bold mb-8">Datenschutzerklärung</h1>
        
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <p className="text-muted-foreground italic mb-8">
            Stand: Februar 2026
          </p>

          <h2>1. Verantwortlicher</h2>
          <p>
            Verantwortlich für die Datenverarbeitung auf dieser Website ist:<br />
            Janike Arent<br />
            Lavendelweg 7<br />
            30880 Laatzen<br />
            E-Mail: privacy@meoluna.com
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

          <h2>4a. Eigene Reichweitenmessung (zweistufig)</h2>
          <p>
            Wir messen die Nutzung mit einer eigenen, cookielosen Statistik ohne
            Drittanbieter-Tracker. Ohne Einwilligung wird beim Seitenaufruf eine Meldung an
            unseren eigenen Server (Cloudflare) gesendet: aufgerufener Pfad, Herkunfts-Domain
            (Referrer), Kampagnen-Parameter der Adresszeile, Land, grober Gerätetyp und Browser.
            Aus IP-Adresse und Browser-Kennung wird ein täglich wechselnder, anonymer Kurzwert
            gebildet; die IP-Adresse selbst wird nicht gespeichert. Eine Wiedererkennung über den
            Tag hinaus ist nicht möglich. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO; es erfolgt
            kein Zugriff auf Informationen in Ihrem Endgerät.
          </p>
          <p>
            Nur mit Ihrer Einwilligung im Hinweis-Banner speichern wir eine zufällig erzeugte
            Kennung im lokalen Speicher Ihres Browsers und erfassen zusätzlich Bildschirmbreite
            und Verweildauer, um wiederkehrende Besuche zu erkennen. Rechtsgrundlage: § 25 Abs. 1
            TDDDG i. V. m. Art. 6 Abs. 1 lit. a DSGVO. Sie können die Einwilligung jederzeit
            widerrufen, indem Sie den lokalen Speicher Ihres Browsers für meoluna.com löschen.
            Es werden keine Daten an Werbe-Netzwerke weitergegeben.
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
