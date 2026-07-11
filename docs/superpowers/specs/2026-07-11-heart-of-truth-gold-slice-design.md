# Das Herz der Wahrheit — Gold-Slice-Design

**Status:** Vom Auftraggeber am 2026-07-11 zur Umsetzung freigegeben

**Ziel:** Ein 60–90 Sekunden langer, visuell eigenständiger und ohne externe Erklärung verständlicher Spielabschnitt, der die altägyptische Vorstellung vom Wiegen des Herzens durch Handlung vermittelt.

## 1. Zweck

Der Slice prüft nicht, ob Meoluna automatisch Spiele generieren kann. Er definiert erstmals, wie ein Ergebnis aussehen und sich anfühlen muss, bevor eine Generatorarchitektur daran ausgerichtet wird.

Der bestehende Phaser-Shell, die CSP-Sandbox und die MessageChannel-Bridge werden wiederverwendet. Nicht wiederverwendet werden die bisherigen Ägypten-GDDs, Spielmechaniken, Grafikstile oder automatischen Lösungspläne.

## 2. Historische Grundlage

Die visuelle und fachliche Primärreferenz ist das öffentlich zugängliche Werk **Book of the Dead for the Chantress of Amun, Nauny**, ca. 1050 v. Chr., The Metropolitan Museum of Art, Objekt 548344. Das Werk ist Public Domain und darf über die Met Open Access Policy verwendet werden.

Quelle und Bild:

- <https://www.metmuseum.org/art/collection/search/548344>
- <https://images.metmuseum.org/CRDImages/eg/original/DT11633.jpg>

Fachliche Rollen im dargestellten Totengericht:

- Anubis bedient die Waage.
- Das Herz der verstorbenen Person wird gegen Ma’at beziehungsweise ihr Zeichen für Wahrheit und Ordnung gewogen.
- Thoth hält das Ergebnis fest.
- Osiris empfängt die für würdig erklärte Person im Jenseits.

Ergänzende Referenzen:

- The Met, Judgment before Osiris: <https://www.metmuseum.org/art/collection/search/557657>
- British Museum, Papyrus of Ani, Hall of Judgment: <https://www.britishmuseum.org/collection/object/Y_EA10470-3>

Der Slice behauptet nicht, dass eine Ba-Seele historisch selbst das Herz getragen oder die Waage bedient habe. Die spielbare Ba-Figur dient als Blickpunkt und Führungsfigur, die eine bereits dargestellte Zeremonie wieder zum Leben erweckt.

## 3. Spielerfantasie

Der Spieler ist eine leuchtende Ba-Seele in der altägyptischen Bildform eines kleinen Vogels mit menschlichem Kopf. Ein beschädigter Papyrus ist dunkel und reglos. Durch Bewegung, Nähe und Licht erweckt der Spieler nacheinander die Figuren des Totengerichts.

Die zentrale Fantasie lautet:

> Ich fliege durch einen uralten Papyrus und bringe seine Geschichte wieder zum Leben.

## 4. Kernlernziel

Nach dem Slice soll der Spieler aus eigener Erinnerung erklären können:

1. Das Herz stand für die Taten beziehungsweise das moralische Leben einer Person.
2. Es wurde gegen Ma’ats Zeichen für Wahrheit und Ordnung gewogen.
3. Anubis bediente die Waage.
4. Thoth dokumentierte das Ergebnis.
5. Das Urteil entschied über den Zugang zu Osiris und dem Jenseits.

Der Spieler lernt diese Rollen durch sichtbare Ursache-Wirkung. Begriffe werden erst eingeblendet, nachdem ihre Funktion in der Szene erlebt wurde.

## 5. Spielbogen

### 5.1 Ankunft — 0 bis 10 Sekunden

- Vollbild, keine Admin-UI innerhalb des Spiels.
- Der Papyrus liegt als dunkle, leicht räumlich gekrümmte Welt im Hintergrund.
- Nur die Ba-Seele leuchtet.
- Anubis bewegt Kopf und Arm zur Waage. Ein Lichtpfad entsteht, ohne Text oder Pfeil.
- Der Spieler lernt die Bewegung durch einen einzigen pulsierenden Zielpunkt in unmittelbarer Nähe.

### 5.2 Das Herz erwacht — 10 bis 30 Sekunden

- Tippen/Klicken bewegt die Ba-Seele weich zum Zielpunkt.
- In der Nähe des Herzens erscheint eine kontextuelle Lichtaktion.
- Die Aktion löst eine kurze Animation aus: Das Herz hebt sich, die linke Waagschale senkt sich, Anubis stabilisiert die Waage.
- Erst danach erscheint klein und kurz: `Das Herz trug die Taten eines Menschen.`
- Ein sichtbarer Lichtstrom führt zur Feder, nicht zu einem UI-Button.

### 5.3 Ma’ats Feder — 30 bis 50 Sekunden

- Die Ba-Seele folgt dem Lichtstrom zur Feder.
- Beim Aktivieren wird die Feder auf die zweite Waagschale gesetzt.
- Die Waage pendelt physikalisch, beruhigt sich und steht im Gleichgewicht.
- Die Umgebung reagiert: Dunkle Tinte weicht, Goldlinien laufen durch den Papyrus.
- Erst danach erscheint: `Ma’at stand für Wahrheit und Ordnung.`

### 5.4 Das Urteil wird sichtbar — 50 bis 70 Sekunden

- Thoth beginnt sichtbar zu schreiben.
- Der Spieler folgt der sich zeichnenden Tintenlinie zu Thoth.
- Durch Nähe wird keine neue Antwort verlangt; die Figur vollendet ihre bereits kausal ausgelöste Handlung.
- Anschließend öffnet sich Osiris’ Tor mit Licht, Tiefe, Sound und Partikeln.
- Kurze Begriffszuordnung in der Welt: `Anubis wog. Thoth schrieb. Osiris empfing.`

### 5.5 Erinnerungsecho — 70 bis 90 Sekunden

- Die Szene zieht sich kurz zu einer dunklen Papyrus-Silhouette zusammen.
- Herz, Feder und Schreibtafel erscheinen als drei räumlich getrennte leuchtende Motive.
- Ohne erklärenden Text fliegt der Spieler die zuvor erlebte Reihenfolge ab.
- Falsche Reihenfolge führt nicht zu rot/grün oder Reset. Die gewählte Figur reagiert noch nicht und blickt zur aktuell benötigten Station. Der kausale Lichtstrom bleibt bei der richtigen Station sichtbar.
- Nach der korrekten Sequenz erscheint der originale Papyrus unverfälscht. Die erlebten Figuren werden kurz nacheinander hervorgehoben.
- `completeGoal` wird für die fünf Rollen-/Bedeutungsziele erst nach diesem Erinnerungsecho ausgelöst.
- `completeGame` wird genau einmal ausgelöst.

## 6. Steuerung

### Touch und Maus

- Tippen/Klicken in die Welt setzt das Bewegungsziel der Ba-Seele.
- Die Figur fliegt mit Beschleunigung und weichem Abbremsen, nicht teleportierend.
- Befindet sie sich im Interaktionsradius, erscheint direkt am Weltobjekt ein kreisförmiges, golden pulsierendes Lichtsymbol. Es ist das einzige Aktionssymbol des Slice und bleibt an derselben Bildschirmposition relativ zum Zielobjekt.
- Die Aktion kann per Tap/Klick ausgelöst werden.

### Tastatur

- Pfeiltasten und WASD bewegen die Ba-Seele.
- Leertaste löst die kontextuelle Aktion aus.

Es gibt keine Pflicht-Drag-Geste, keine Hover-only-Information und keine versteckten Klickflächen.

## 7. Verständlichkeit ohne Bedienungsanleitung

- Zu jedem Zeitpunkt existiert genau ein kausal sinnvoller nächster Weltzustand.
- Die nächste Station wird durch Blickrichtung, Bewegung, Licht und Sound angekündigt.
- Nicht relevante Figuren sind sichtbar, aber noch nicht interaktiv.
- Das goldene Lichtsymbol erscheint nur in Reichweite. Sein erstes Auftreten wird durch eine kurze Ausbreitungsanimation mit sichtbarer Reaktion des Zielobjekts eingeführt; danach bleibt seine Bedeutung im gesamten Slice unverändert.
- Innerhalb der ersten fünf Sekunden verursacht die erste Nutzereingabe eine sichtbare Reaktion.
- Der Spieler kann nicht durch flächiges Klicken mehrere Zustände überspringen.

## 8. Art Direction

### Leitidee

**Lebende Museumsgrafik:** Der historische Papyrus bleibt als glaubwürdige Quelle erkennbar, wird aber durch Licht, Tiefe, Bewegung und räumlichen Sound zu einer spielbaren Welt.

### Visuelle Ebenen

1. Public-Domain-Papyrus als hochauflösende Bitmap-Grundlage.
2. Mehrere Ausschnitte derselben Quelle als getrennte Tiefenebenen.
3. Dunkle Vignette und lokales Licht um die Ba-Seele.
4. Animierte Goldtinte für aktivierte Zusammenhänge.
5. Staub-, Faser- und Tintenpartikel mit geringer Dichte.
6. Figurenbewegung durch kleine, respektvolle Cutout-Animationen; keine cartoonhafte Verzerrung der historischen Quelle.

### Farbrollen

- Papyrus: warmes Ocker und gebrochenes Elfenbein.
- Inaktive Welt: dunkles Umbra und entsättigtes Braun.
- Spielerführung: Türkisblau.
- erkannte Zusammenhänge: Blattgold.
- Gefahr oder Fehler: keine rote UI-Farbe; Reaktion erfolgt über Bewegung, Sound und ausbleibende Kausalität.

### Verboten

- Emojis
- generische UI-Karten
- großflächige Textpanels
- sichtbare Debug-Hitboxen
- primitive Rechtecke als zentrale Figuren oder Requisiten
- Fortschrittsbalken, Punkte oder Sterne im Slice

## 9. Audio und Bewegung

- Ton startet stumm. Die erste bewusste Eingabe initialisiert WebAudio und blendet den Ton sanft ein; ein dauerhaft sichtbares Lautsprechersymbol kann ihn wieder stummschalten.
- Kurze instrumentale Texturen: tiefer Raumton, Papyrusrascheln, Federklang, Schreibgeräusch und Torresonanz.
- Keine dauerhafte Musikschleife im ersten Slice.
- Bewegung nutzt Phaser-Tweens und Physik nur dort, wo sie Bedeutung trägt.
- Kamera fährt sanft zwischen Stationen und bleibt nie länger als 600 ms der Spielereingabe entzogen.

## 10. Technische Einordnung

- Runtime: bestehendes `phaser-v1`-Shell.
- Basisauflösung: `1280 x 720`.
- Portrait-Geräte zeigen einen gestalteten Drehhinweis und werden in `844 x 390` getestet.
- Source bleibt Plain JavaScript mit `bootMeolunaGame(context)`.
- Spiel-ID: `heart-of-truth`.
- Source: `public/game-studio/games/heart-of-truth/game.js`.
- Assets: `public/game-studio/games/heart-of-truth/assets/`.
- Quellenmetadaten: `public/game-studio/games/heart-of-truth/assets/sources.json`.
- Registrierung ausschließlich im Admin-Game-Studio-Manifest.
- Keine Änderung an produktiver Welterstellung, Convex-Schema oder bestehenden Spielen.

## 11. Teststrategie

Automatische Tests bleiben ein Sicherheitsnetz, kein Designdirektor.

### Vor dem menschlichen Spieltest

- Source-Validator besteht.
- Runtime lädt ohne Fehler.
- erster Input erzeugt innerhalb von 500 ms sichtbare Reaktion.
- alle Pflichtaktionen sind per Touch, Maus und Tastatur erreichbar; dafür dürfen Tests einzelne benannte Phasen direkt initialisieren.
- kein Zustand kann durch wiederholtes wahlloses Klicken übersprungen werden.
- `completeGame` feuert genau einmal.
- drei Ziel-Viewports zeigen keine abgeschnittenen Pflichtaktionen.

### Bewusst nicht automatisiert vor dem ersten Gate

- Ein Bot erhält keinen vollständigen Lösungsplan für das Erinnerungsecho. Automatische Prüfungen testen Zustände isoliert und beweisen nur technische Erreichbarkeit, nicht Verständlichkeit oder Spielqualität.
- Es wird kein Originality-Score als Qualitätsbeweis verwendet.
- Es werden keine weiteren Szenen gebaut.

## 12. Menschliches Gold-Gate

Der Auftraggeber spielt den Slice ohne vorherige Erklärung. Danach werden ausschließlich folgende Fragen bewertet:

1. Wusstest du innerhalb weniger Sekunden, wie du die Welt steuerst?
2. War jederzeit erkennbar, warum die nächste Reaktion ausgelöst wurde?
3. Konntest du Herz, Ma’at, Anubis, Thoth und Osiris anschließend in eigenen Worten zuordnen?
4. Hat sich die Szene wie ein Spiel und nicht wie eine Lernoberfläche angefühlt?
5. Möchtest du sehen, wie es weitergeht?

Der Slice besteht nur, wenn die Antworten 1 bis 4 eindeutig positiv sind und Frage 5 nicht eindeutig negativ beantwortet wird.

Bei Nichtbestehen wird derselbe Slice überarbeitet. Es entstehen weder weitere Räume noch Generatorlogik.

## 13. Nicht-Ziele

- keine automatische Generierung
- kein zweites Spiel
- kein vollständiges Ägypten-Curriculum
- keine Punkteökonomie oder Meta-Progression
- kein Speichern mitten im Slice
- kein produktiver Rollout außerhalb des Admin-Labs
- kein Ersatz oder Umbau der bestehenden Engines
