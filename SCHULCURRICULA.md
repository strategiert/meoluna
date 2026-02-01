# Schulcurricula - Datensammlung

## Auftrag

Alle Lehrpläne/Curricula der 16 deutschen Bundesländer sammeln, normalisieren und in die Meoluna-Datenbank überführen.

**Ziel:** Meoluna kennt alle Themen die in deutschen Schulen gelehrt werden → Lernwelten können passgenau zu Lehrplan erstellt werden.

---

## Bundesländer & Kultusministerien

| # | Bundesland | Kürzel | Kultusministerium |
|---|-----------|--------|-------------------|
| 1 | Baden-Württemberg | BW | kultusministerium-bw.de |
| 2 | Bayern | BY | km.bayern.de |
| 3 | Berlin | BE | berlin.de/sen/bildung |
| 4 | Brandenburg | BB | mbjs.brandenburg.de |
| 5 | Bremen | HB | bildung.bremen.de |
| 6 | Hamburg | HH | hamburg.de/bsb |
| 7 | Hessen | HE | kultusministerium.hessen.de |
| 8 | Mecklenburg-Vorpommern | MV | regierung-mv.de/Landesregierung/bm |
| 9 | Niedersachsen | NI | mk.niedersachsen.de |
| 10 | Nordrhein-Westfalen | NW | schulministerium.nrw |
| 11 | Rheinland-Pfalz | RP | bm.rlp.de |
| 12 | Saarland | SL | saarland.de/mbk |
| 13 | Sachsen | SN | schule.sachsen.de |
| 14 | Sachsen-Anhalt | ST | mb.sachsen-anhalt.de |
| 15 | Schleswig-Holstein | SH | schleswig-holstein.de/bildung |
| 16 | Thüringen | TH | bildung.thueringen.de |

---

## Zu sammelnde Daten

Pro Bundesland:
- **Schulformen:** Grundschule, Hauptschule, Realschule, Gymnasium, Gesamtschule, etc.
- **Klassenstufen:** 1-13
- **Fächer:** Mathe, Deutsch, Englisch, Naturwissenschaften, Geschichte, etc.
- **Themen/Kompetenzen:** Was wird wann gelehrt?

---

## Datenformat (normalisiert)

```typescript
interface Curriculum {
  bundesland: string;      // "BW" | "BY" | ...
  schulform: string;       // "gymnasium" | "realschule" | ...
  klassenstufe: number;    // 1-13
  fach: string;            // "mathematik" | "deutsch" | ...
  thema: string;           // "Bruchrechnung" | "Lyrik" | ...
  kompetenzen: string[];   // ["kann Brüche addieren", ...]
  quelleUrl: string;       // Link zum Original-Lehrplan
}
```

---

## Fortschritt

| Bundesland | Status | Notizen |
|------------|--------|---------|
| BW | ⏳ TODO | |
| BY | 🔄 IN PROGRESS | LehrplanPLUS: https://www.lehrplanplus.bayern.de/ |
| BE | ⏳ TODO | |
| BB | ⏳ TODO | |
| HB | ⏳ TODO | |
| HH | ⏳ TODO | |
| HE | ⏳ TODO | |
| MV | ⏳ TODO | |
| NI | ⏳ TODO | |
| NW | 🔄 IN PROGRESS | Lehrplannavigator: https://lehrplannavigator.nrw.de/ |
| RP | ⏳ TODO | |
| SL | ⏳ TODO | |
| SN | ⏳ TODO | |
| ST | ⏳ TODO | |
| SH | ⏳ TODO | |
| TH | ⏳ TODO | |

---

## Convex Schema (zu erstellen)

```typescript
// Vorschlag für convex/schema.ts Erweiterung
curricula: defineTable({
  bundesland: v.string(),
  schulform: v.string(),
  klassenstufe: v.number(),
  fach: v.string(),
  thema: v.string(),
  kompetenzen: v.array(v.string()),
  quelleUrl: v.string(),
})
  .index("by_bundesland", ["bundesland"])
  .index("by_fach_klasse", ["fach", "klassenstufe"])
  .index("by_schulform", ["schulform", "klassenstufe"])
```

---

*Letzte Aktualisierung: 2026-02-01*
