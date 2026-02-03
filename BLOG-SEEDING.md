# Blog-Seeding Todo

## Vorhandene Blog-Posts (Markdown)

Location: `workspace/meoluna/content/blog/`

| Datei | Titel | Kategorie |
|-------|-------|-----------|
| lernmotivation-kinder-steigern.md | 7 Wege, die Lernmotivation deines Kindes nachhaltig zu steigern | Lerntipps |
| bildschirmzeit-sinnvoll-nutzen.md | Bildschirmzeit sinnvoll nutzen | Lerntipps |
| hausaufgaben-ohne-stress.md | Hausaufgaben ohne Stress | Lerntipps |
| kind-will-nicht-lernen.md | Kind will nicht lernen | Lerntipps |
| konzentration-kinder-verbessern.md | Konzentration bei Kindern verbessern | Lerntipps |
| lerntypen-kinder-erkennen.md | Lerntypen bei Kindern erkennen | Lerntipps |
| lesekompetenz-foerdern.md | Lesekompetenz fördern | Lerntipps |
| mathe-angst-ueberwinden.md | Mathe-Angst überwinden | Lerntipps |
| spielerisch-lernen-wissenschaft.md | Spielerisch lernen - Wissenschaft | Lerntipps |
| beste-lernapp-grundschule.md | Beste Lernapp Grundschule | Vergleich |

## Frontmatter-Struktur

```yaml
---
title: "Titel des Posts"
slug: slug-ohne-umlaute
description: "SEO-Beschreibung"
keywords: [keyword1, keyword2]
author: Kai Linden
date: 2026-02-01
category: Lerntipps
---
```

## Aufgabe

1. Script schreiben das Markdown liest und Frontmatter parsed
2. Für jeden Post: `ctx.db.insert("blogPosts", {...})`
3. Oder: Manuell in seed.ts hinzufügen

## Convex Blog-Schema

```typescript
blogPosts: defineTable({
  slug: v.string(),
  title: v.string(),
  excerpt: v.string(),
  content: v.string(),
  category: v.string(),
  tags: v.array(v.string()),
  author: v.string(),
  coverImage: v.optional(v.string()),
  isPublished: v.boolean(),
  publishedAt: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
```

## Quick-Fix

Falls Blog-Posts schnell erscheinen sollen:
```bash
npx convex run seed:seedBlogPosts
```

(Seed-Funktion existiert bereits mit 3 Demo-Posts)
