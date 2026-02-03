# Schulcurriculum Status

## Gesammelte Daten (Stand: 2026-02-02)

### Bundesländer mit PDFs

| Bundesland | PDFs | Bildungsserver |
|------------|------|----------------|
| Baden-Württemberg | 20 | bildungsplaene-bw.de |
| Bayern | 12 | lehrplanplus.bayern.de |
| Berlin | 66 | berlin.de/sen/bildung |
| Hamburg | 5 | bildungsplaene.hamburg.de |
| Hessen | 94 | kultusministerium.hessen.de |
| **Gesamt** | **197** | |

### Fehlende Bundesländer (11)

| Bundesland | Bildungsserver | Priorität |
|------------|----------------|-----------|
| Nordrhein-Westfalen | schulentwicklung.nrw.de | HOCH (größtes BL) |
| Niedersachsen | cuvo.nibis.de | HOCH |
| Sachsen | schule.sachsen.de | MITTEL |
| Brandenburg | bildungsserver.berlin-brandenburg.de | MITTEL |
| Rheinland-Pfalz | lehrplaene.bildung-rp.de | MITTEL |
| Schleswig-Holstein | lehrplan.lernnetz.de | MITTEL |
| Thüringen | schulportal-thueringen.de | NIEDRIG |
| Sachsen-Anhalt | bildung-lsa.de | NIEDRIG |
| Mecklenburg-Vorpommern | bildung-mv.de | NIEDRIG |
| Saarland | saarland.de/bildung | NIEDRIG |
| Bremen | lis.bremen.de | NIEDRIG |

## Datenstruktur

```
data/curricula/raw/
├── baden-wuerttemberg/
│   └── *.pdf
├── bayern/
│   └── *.pdf
├── berlin/
│   └── *.pdf
├── hamburg/
│   └── *.pdf
└── hessen/
    └── *.pdf
```

## Nächste Schritte

### 1. Weitere Bundesländer crawlen (Priorität: NRW, Niedersachsen)
### 2. PDFs parsen und Metadaten extrahieren:
- Fach (Mathematik, Deutsch, Sachkunde, ...)
- Klassenstufe (1-4 für Grundschule, 5-10 für Sek I, 11-13 für Sek II)
- Themen/Kompetenzen
- Bundesland

### 3. Normalisierte Datenbank erstellen:
```typescript
// convex/schema.ts
subjects: defineTable({
  name: v.string(),           // "Mathematik"
  slug: v.string(),           // "mathematik"
  icon: v.string(),           // "Calculator"
  color: v.string(),          // "#3B82F6"
}),

topics: defineTable({
  subjectId: v.id("subjects"),
  name: v.string(),           // "Addition und Subtraktion"
  gradeLevel: v.number(),     // 1-13
  bundesland: v.optional(v.string()), // null = bundesweit
  keywords: v.array(v.string()),
}),
```

### 4. Filter-UI (Popup statt Chat)
Siehe FILTER-CONCEPT.md
