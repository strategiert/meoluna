/**
 * Imprint Page - Impressum
 */

import { Navbar } from '@/components/layout/Navbar';

export default function Imprint() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-16 max-w-3xl">
        <h1 className="text-4xl font-bold mb-8">Impressum</h1>
        
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <h2>Angaben gemäß § 5 TMG</h2>
          <p>
            [Name / Firma]<br />
            [Straße Hausnummer]<br />
            [PLZ Ort]<br />
            Deutschland
          </p>

          <h2>Kontakt</h2>
          <p>
            Telefon: [Telefonnummer]<br />
            E-Mail: <a href="mailto:hello@meoluna.com" className="text-primary">
              hello@meoluna.com
            </a>
          </p>

          <h2>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
          <p>
            [Name]<br />
            [Adresse]
          </p>

          <h2>EU-Streitschlichtung</h2>
          <p>
            Die Europäische Kommission stellt eine Plattform zur 
            Online-Streitbeilegung (OS) bereit:{' '}
            <a 
              href="https://ec.europa.eu/consumers/odr" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary"
            >
              https://ec.europa.eu/consumers/odr
            </a>
          </p>
          <p>
            Unsere E-Mail-Adresse finden Sie oben im Impressum.
          </p>

          <h2>Verbraucherstreitbeilegung/Universalschlichtungsstelle</h2>
          <p>
            Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren 
            vor einer Verbraucherschlichtungsstelle teilzunehmen.
          </p>

          <h2>Haftung für Inhalte</h2>
          <p>
            Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte 
            auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach 
            §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, 
            übermittelte oder gespeicherte fremde Informationen zu überwachen oder 
            nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
          </p>

          <h2>Haftung für Links</h2>
          <p>
            Unser Angebot enthält Links zu externen Websites Dritter, auf deren 
            Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden 
            Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten 
            Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten 
            verantwortlich.
          </p>

          <h2>Urheberrecht</h2>
          <p>
            Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen 
            Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, 
            Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der 
            Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des 
            jeweiligen Autors bzw. Erstellers.
          </p>
        </div>
      </main>
    </div>
  );
}
