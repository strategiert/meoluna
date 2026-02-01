# MEOLUNA VISION

> **Meoluna ist keine Lernapp. Meoluna ist eine Social Learning Platform.**

---

## Core Philosophy: Share-First

**"Es soll sich schlecht anfühlen, nicht zu teilen."**

Das ist das zentrale Design-Prinzip. Lernen ist kein Solo-Akt — es ist sozial. Wenn jemand eine Lernwelt erstellt, soll der natürliche Impuls sein: teilen, nicht horten.

### Was das bedeutet:
- Jede erstellte Welt hat einen klaren Pfad zum Teilen
- Sharing wird belohnt (XP? Badges? Sichtbarkeit?)
- Private Welten sind möglich, aber nicht der Default
- Community-Feed zeigt was andere lernen/erstellen
- Remix-Kultur: Welten können geforkt/verbessert werden

---

## Zielgruppen & Rollen

### 1. Schüler (Students)
- Konsumieren Lernwelten
- Tracken ihren Fortschritt
- Können selbst Welten erstellen
- Sammeln XP, leveln auf

### 2. Ersteller (Creators)
- Erstellen und teilen Lernwelten
- Können Welten monetarisieren? (später)
- Bekommen Feedback/Stats zu ihren Welten
- Community-Standing basiert auf Impact

### 3. Lehrer (Teachers)
- **Klassensteuerung:** Gruppen/Klassen erstellen
- **Zuweisung:** Welten an Klassen zuweisen
- **Auswertung:** Fortschritt der Schüler sehen
- **Reports:** Wer hat was gemacht, wie gut, wann
- **Eigene Welten:** Aus Arbeitsblättern generieren (PDF-Upload)

### 4. Admins
- Plattform-Moderation
- Content-Review
- User-Management

---

## Fehlende Systeme (Stand: 2026-02-01)

### ❌ Progress System
- Schema hat `progress` Tabelle, aber keine Implementierung
- Kein XP-Tracking im Frontend
- Keine Level/Badges
- Kein "was hab ich gelernt" Dashboard

### ❌ Rollen-System
- Schema hat `role` Feld (student|creator|admin)
- Keine Teacher-Rolle!
- Keine rollenbasierte UI
- Keine Permissions-Logik

### ❌ Lehrer-Features
- Keine Klassenräume/Gruppen
- Keine Zuweisung von Welten
- Keine Fortschritts-Auswertung
- Keine Schüler-Übersicht

### ⚠️ Social Features (KLARSTELLUNG)
**KEIN klassisches Social Network!** Kein Feed, keine Follower, keine Timeline.

Stattdessen "Social" durch:
- **Explore** — Lernwelten entdecken
- **Bewerten** — Likes, Ratings
- **Teilen** — Link teilen, in Klassen zuweisen
- **Badges/Preise** — für gute Creators
- **Monetarisierung** (später) — Geld verdienen mit perfekten Lernwelten die viele nutzen

---

## Nächste Schritte (zu definieren)

1. **Progress System Design** — Wie funktioniert XP? Was sind Level? Badges?
2. **Rollen erweitern** — Teacher-Rolle hinzufügen, Permissions definieren
3. **Classroom Feature** — Gruppen, Zuweisung, Auswertung
4. **Social Layer** — Feed, Sharing-Flow, Remix

---

## Links

- **Produktion:** https://meoluna.com
- **GitHub:** https://github.com/strategiert/meoluna
- **Lokal:** C:\Users\karent\Documents\Software\meoluna

---

*Letzte Aktualisierung: 2026-02-01*
