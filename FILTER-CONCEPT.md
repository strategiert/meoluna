# Filter-Konzept: Modulare Welt-Erstellung

## Vision (von Klaus)

> "Es sollte so einfach sein, dass ein Erstklässler alles intuitiv versteht."
> "Kein Chat — Menschen werden damit nicht zurecht kommen."
> "Popup mit Auswahlmöglichkeiten wie in der Original-App."

## User Flow

### 1. "Neue Welt erstellen" Button
- Großer, freundlicher Button auf Dashboard/Explore
- Öffnet Fullscreen-Popup/Modal

### 2. Schritt 1: Fach wählen
```
┌────────────────────────────────────────┐
│  🎓 Was möchtest du lernen?            │
│                                        │
│  ┌──────┐  ┌──────┐  ┌──────┐         │
│  │ 🔢  │  │ 📖  │  │ 🌍  │          │
│  │Mathe │  │Deutsch│ │Sachkd│          │
│  └──────┘  └──────┘  └──────┘         │
│                                        │
│  ┌──────┐  ┌──────┐  ┌──────┐         │
│  │ 🇬🇧  │  │ 🎨  │  │ 🎵  │          │
│  │Englisch│ │Kunst │  │Musik │          │
│  └──────┘  └──────┘  └──────┘         │
└────────────────────────────────────────┘
```

### 3. Schritt 2: Klassenstufe wählen
```
┌────────────────────────────────────────┐
│  📚 Für welche Klasse?                 │
│                                        │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐             │
│  │ 1 │ │ 2 │ │ 3 │ │ 4 │  Grundschule │
│  └───┘ └───┘ └───┘ └───┘             │
│                                        │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ │
│  │ 5 │ │ 6 │ │ 7 │ │ 8 │ │ 9 │ │10 │ │
│  └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ │
└────────────────────────────────────────┘
```

### 4. Schritt 3: Thema wählen (basierend auf Curriculum)
```
┌────────────────────────────────────────┐
│  🎯 Welches Thema?                     │
│                                        │
│  Mathe · Klasse 2                      │
│                                        │
│  ○ Addition und Subtraktion bis 100    │
│  ○ Einmaleins (1x1 bis 10x10)         │
│  ○ Geometrie: Formen erkennen          │
│  ○ Größen und Messen                   │
│  ○ Sachaufgaben                        │
│                                        │
│  [ Zufälliges Thema ]                  │
└────────────────────────────────────────┘
```

### 5. Schritt 4: Lernwelt wird generiert
```
┌────────────────────────────────────────┐
│                                        │
│         🌙                             │
│    Deine Lernwelt                      │
│    wird erschaffen...                  │
│                                        │
│    ████████████░░░░░░  65%             │
│                                        │
│    "Einmaleins mit den Sternen"        │
│                                        │
└────────────────────────────────────────┘
```

## Komponenten-Struktur

```
src/components/
├── WorldCreator/
│   ├── WorldCreatorModal.tsx      # Hauptkomponente
│   ├── SubjectPicker.tsx          # Schritt 1
│   ├── GradePicker.tsx            # Schritt 2
│   ├── TopicPicker.tsx            # Schritt 3
│   ├── GenerationProgress.tsx     # Schritt 4
│   └── index.ts
```

## Datenmodell

```typescript
// Fächer (statisch oder aus DB)
const subjects = [
  { id: 'mathe', name: 'Mathematik', icon: 'Calculator', color: '#3B82F6' },
  { id: 'deutsch', name: 'Deutsch', icon: 'BookOpen', color: '#10B981' },
  { id: 'sachkunde', name: 'Sachkunde', icon: 'Globe', color: '#8B5CF6' },
  { id: 'englisch', name: 'Englisch', icon: 'Languages', color: '#F59E0B' },
  // ...
];

// Themen aus Curriculum-DB
const topics = await ctx.db
  .query("topics")
  .withIndex("by_subject_grade", q => 
    q.eq("subjectId", selectedSubject).eq("gradeLevel", selectedGrade)
  )
  .collect();
```

## Prompt-Generierung

Statt freier Chat-Eingabe wird ein strukturierter Prompt erstellt:

```typescript
const prompt = `
Erstelle eine Lernwelt zum Thema "${topic.name}" 
für Klasse ${gradeLevel} im Fach ${subject.name}.

Lernziele aus dem Curriculum:
${topic.competencies.join('\n')}

Die Welt soll kindgerecht und spielerisch sein.
`;
```

## Migration von Chat zu Popup

### Phase 1: Popup als Alternative
- Chat bleibt erhalten
- "Schnell-Erstellung" Button führt zu Popup

### Phase 2: Popup als Default
- Popup ist Standard
- Chat nur für "Fortgeschrittene" oder versteckt

### Phase 3: Chat entfernen
- Nur noch modulare Erstellung
- Bessere UX, konsistentere Welten

## Vorteile

1. **Einfacher für Kinder** — Keine Texteingabe nötig
2. **Curriculum-basiert** — Welten passen zum Lehrplan
3. **Konsistenter** — Weniger "halluzinierte" Inhalte
4. **Schneller** — 3 Klicks statt Prompt schreiben
5. **Filterbar** — Explore kann nach Fach/Klasse filtern

## Technische Anforderungen

1. **Curriculum-Datenbank** füllen (aus PDFs extrahieren)
2. **Subject/Topic Schema** in Convex
3. **WorldCreator Komponenten** bauen
4. **Prompt-Template** für strukturierte Generierung
5. **Explore-Filter** nach Fach/Klasse
