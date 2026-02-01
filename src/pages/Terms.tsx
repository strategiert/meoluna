/**
 * Terms Page - AGB
 */

import { Navbar } from '@/components/layout/Navbar';

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-16 max-w-3xl">
        <h1 className="text-4xl font-bold mb-8">Allgemeine Geschäftsbedingungen</h1>
        
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <p className="text-muted-foreground italic mb-8">
            Stand: Februar 2026
          </p>

          <h2>§ 1 Geltungsbereich</h2>
          <p>
            Diese Allgemeinen Geschäftsbedingungen gelten für die Nutzung der 
            Plattform Meoluna (nachfolgend "Plattform") und aller damit verbundenen 
            Dienste.
          </p>

          <h2>§ 2 Vertragsgegenstand</h2>
          <p>
            Meoluna ist eine Lernplattform, die es Nutzern ermöglicht, interaktive 
            Lernwelten zu erstellen und zu nutzen. Die Plattform verwendet 
            künstliche Intelligenz zur Unterstützung der Inhaltserstellung.
          </p>

          <h2>§ 3 Registrierung und Nutzerkonto</h2>
          <p>
            (1) Die Nutzung bestimmter Funktionen der Plattform setzt eine 
            Registrierung voraus.
          </p>
          <p>
            (2) Der Nutzer ist verpflichtet, bei der Registrierung wahrheitsgemäße 
            Angaben zu machen und diese aktuell zu halten.
          </p>
          <p>
            (3) Der Nutzer ist für die Sicherheit seiner Zugangsdaten 
            selbst verantwortlich.
          </p>

          <h2>§ 4 Nutzungsrechte</h2>
          <p>
            (1) Der Nutzer erhält das nicht-exklusive, nicht-übertragbare Recht, 
            die Plattform im Rahmen dieser AGB zu nutzen.
          </p>
          <p>
            (2) An selbst erstellten Lernwelten behält der Nutzer die Rechte. 
            Durch das Veröffentlichen erteilt der Nutzer Meoluna eine Lizenz zur 
            Darstellung auf der Plattform.
          </p>

          <h2>§ 5 Verbotene Nutzung</h2>
          <p>Es ist untersagt:</p>
          <ul>
            <li>Rechtswidrige Inhalte zu erstellen oder zu verbreiten</li>
            <li>Die Plattform für kommerzielle Zwecke zu nutzen ohne Genehmigung</li>
            <li>Technische Schutzmaßnahmen zu umgehen</li>
            <li>Automatisierte Zugriffe ohne Erlaubnis durchzuführen</li>
            <li>Andere Nutzer zu belästigen oder zu bedrohen</li>
          </ul>

          <h2>§ 6 KI-generierte Inhalte</h2>
          <p>
            (1) Die Plattform verwendet KI zur Unterstützung der Inhaltserstellung. 
            KI-generierte Inhalte können Fehler enthalten.
          </p>
          <p>
            (2) Der Nutzer ist für die Überprüfung und Verwendung der generierten 
            Inhalte selbst verantwortlich.
          </p>

          <h2>§ 7 Haftung</h2>
          <p>
            (1) Die Haftung von Meoluna für leicht fahrlässige Pflichtverletzungen 
            ist ausgeschlossen, sofern keine wesentlichen Vertragspflichten verletzt 
            werden.
          </p>
          <p>
            (2) Die vorstehenden Haftungsbeschränkungen gelten nicht für Schäden 
            aus der Verletzung des Lebens, des Körpers oder der Gesundheit.
          </p>

          <h2>§ 8 Änderungen der AGB</h2>
          <p>
            Meoluna behält sich vor, diese AGB zu ändern. Änderungen werden dem 
            Nutzer mitgeteilt. Bei wesentlichen Änderungen ist die Zustimmung 
            des Nutzers erforderlich.
          </p>

          <h2>§ 9 Schlussbestimmungen</h2>
          <p>
            (1) Es gilt das Recht der Bundesrepublik Deutschland.
          </p>
          <p>
            (2) Sollten einzelne Bestimmungen dieser AGB unwirksam sein, bleibt 
            die Wirksamkeit der übrigen Bestimmungen unberührt.
          </p>

          <h2>Kontakt</h2>
          <p>
            Bei Fragen zu diesen AGB wenden Sie sich bitte an:<br />
            <a href="mailto:legal@meoluna.com" className="text-primary">
              legal@meoluna.com
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
