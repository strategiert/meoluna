import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ============================================================================
  // USER STATS (Denormalisierte User-Level Statistiken)
  // ============================================================================
  userStats: defineTable({
    userId: v.string(),           // Clerk User ID
    totalXP: v.number(),          // Aggregiertes XP (denormalisiert für schnellen Zugriff)
    level: v.number(),            // Aktuelles Level
    lifetimeXP: v.number(),       // Gesamt-XP (nie verringert, auch wenn totalXP reset)
    lastActivityAt: v.number(),   // Letzter Fortschritt
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_level", ["level"]),   // Für Leaderboards

  // ============================================================================
  // WORLD CONFIG (XP-Konvertierung pro Welt)
  // ============================================================================
  worldConfig: defineTable({
    worldId: v.id("worlds"),
    xpConversionRate: v.number(),    // z.B. 0.5 = 100 Punkte → 50 XP
    xpPerModule: v.optional(v.number()),      // XP für Modul-Abschluss
    xpForCompletion: v.optional(v.number()),  // XP für Welt-Abschluss
    scoreType: v.optional(v.string()),        // "points", "stars", "percentage"
    scoreLabel: v.optional(v.string()),       // "Punkte", "Sterne", etc.
    maxScore: v.optional(v.number()),         // Maximale Punktzahl
    createdAt: v.number(),
  })
    .index("by_world", ["worldId"]),

  // ============================================================================
  // LERNWELTEN
  // ============================================================================
  // Lernwelten
  worlds: defineTable({
    title: v.string(),
    prompt: v.optional(v.string()),
    code: v.string(),
    userId: v.optional(v.string()),
    gradeLevel: v.optional(v.string()),
    subject: v.optional(v.string()),
    isPublic: v.boolean(),
    views: v.optional(v.number()),
    likes: v.optional(v.number()),
    createdAt: v.optional(v.number()),

    // Pipeline v3: Qualitätsstatus
    status: v.optional(v.union(
      v.literal("published"),
      v.literal("quarantined"),  // Structural Gate failed → gespeichert aber verborgen
      v.literal("failed")
    )),
    qualityScore: v.optional(v.number()),
    error: v.optional(v.string()),
    validationMetadata: v.optional(v.object({
      validatorSuccess: v.boolean(),
      validatorIterations: v.number(),
      gateScore: v.number(),
      gatePassed: v.boolean(),
      gateViolations: v.array(v.string()),
    })),
  })
    .index("by_user", ["userId"])
    .index("by_public", ["isPublic"])
    .index("by_status", ["status"]),

  // Generation History (für Chat)
  messages: defineTable({
    worldId: v.optional(v.id("worlds")),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    code: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_world", ["worldId"]),

  // User Profiles (synced from Clerk)
  users: defineTable({
    clerkId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    role: v.optional(v.union(
      v.literal("student"),
      v.literal("creator"),
      v.literal("teacher"),
      v.literal("admin")
    )),
    createdAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"]),

  // ============================================================================
  // WORLD PROGRESS (Lernfortschritt pro User pro Welt)
  // ============================================================================
  progress: defineTable({
    userId: v.string(),
    worldId: v.id("worlds"),

    // Modul-Tracking
    moduleIndex: v.number(),

    // Legacy: Wird für Abwärtskompatibilität behalten
    xp: v.number(),

    // NEU: Welt-spezifische Punkte (Rohpunkte der Welt)
    worldScore: v.optional(v.number()),

    // NEU: XP-Beitrag zum User-Account (konvertierte XP)
    xpEarned: v.optional(v.number()),

    // NEU: Erweitertes Tracking
    bestScore: v.optional(v.number()),        // Beste erreichte Punktzahl
    attempts: v.optional(v.number()),         // Anzahl der Versuche

    completedAt: v.optional(v.number()),
    updatedAt: v.number(),
  })
    .index("by_user_world", ["userId", "worldId"])
    .index("by_user", ["userId"]),

  // Classrooms (Teacher-managed groups)
  classrooms: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    teacherId: v.string(), // Clerk ID
    inviteCode: v.string(), // 6-stelliger Code zum Beitreten
    gradeLevel: v.optional(v.string()),
    subject: v.optional(v.string()),
    isArchived: v.optional(v.boolean()),
    createdAt: v.number(),
  })
    .index("by_teacher", ["teacherId"])
    .index("by_invite_code", ["inviteCode"]),

  // Classroom Members (Students in a classroom)
  classroomMembers: defineTable({
    classroomId: v.id("classrooms"),
    userId: v.string(), // Clerk ID
    role: v.union(v.literal("student"), v.literal("assistant")),
    joinedAt: v.number(),
  })
    .index("by_classroom", ["classroomId"])
    .index("by_user", ["userId"])
    .index("by_classroom_user", ["classroomId", "userId"]),

  // Classroom Assignments (Worlds assigned to a classroom)
  classroomAssignments: defineTable({
    classroomId: v.id("classrooms"),
    worldId: v.id("worlds"),
    assignedBy: v.string(), // Teacher's Clerk ID
    title: v.optional(v.string()), // Optional custom title
    instructions: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    isRequired: v.optional(v.boolean()),
    createdAt: v.number(),
  })
    .index("by_classroom", ["classroomId"])
    .index("by_world", ["worldId"]),

  // ============================================================================
  // CURRICULUM (Schulcurricula für modulare Welt-Erstellung)
  // ============================================================================

  // Fächer (Mathematik, Deutsch, etc.)
  subjects: defineTable({
    name: v.string(),           // "Mathematik"
    slug: v.string(),           // "mathematik"
    icon: v.string(),           // "Calculator" (Lucide icon name)
    color: v.string(),          // "#3B82F6" (Tailwind-kompatibel)
    order: v.number(),          // Sortierreihenfolge
    isActive: v.boolean(),      // Für UI anzeigen?
  })
    .index("by_slug", ["slug"])
    .index("by_active", ["isActive", "order"]),

  // Themen aus dem Curriculum (pro Fach + Klassenstufe)
  topics: defineTable({
    subjectId: v.id("subjects"),
    name: v.string(),           // "Addition und Subtraktion bis 100"
    slug: v.string(),           // "addition-subtraktion-100"
    gradeLevel: v.number(),     // 1-13
    bundesland: v.optional(v.string()), // null = bundesweit, sonst z.B. "bayern"
    keywords: v.array(v.string()),      // ["addieren", "subtrahieren", "rechnen"]
    competencies: v.optional(v.array(v.string())), // Kompetenzen aus Lehrplan
    sourceUrl: v.optional(v.string()),  // Link zum Original-PDF
    isActive: v.boolean(),
  })
    .index("by_subject", ["subjectId"])
    .index("by_subject_grade", ["subjectId", "gradeLevel"])
    .index("by_grade", ["gradeLevel"])
    .index("by_bundesland", ["bundesland"]),

  // Curriculum-Quelldateien (PDFs)
  curriculumSources: defineTable({
    bundesland: v.string(),     // "bayern", "nrw", etc.
    schulart: v.optional(v.string()), // "grundschule", "gymnasium", etc.
    fach: v.optional(v.string()),     // "mathematik", etc.
    filename: v.string(),       // "lehrplan_mathe_gs.pdf"
    url: v.optional(v.string()), // Original-URL
    isParsed: v.boolean(),      // Wurde bereits extrahiert?
    parsedAt: v.optional(v.number()),
    topicsExtracted: v.optional(v.number()), // Anzahl extrahierter Themen
    createdAt: v.number(),
  })
    .index("by_bundesland", ["bundesland"])
    .index("by_parsed", ["isParsed"]),

  // Blog Posts
  blogPosts: defineTable({
    slug: v.string(),
    title: v.string(),
    excerpt: v.string(),
    content: v.string(),
    coverImage: v.optional(v.string()),
    category: v.string(),
    tags: v.array(v.string()),
    author: v.string(),
    isPublished: v.boolean(),
    publishedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_published", ["isPublished", "publishedAt"])
    .index("by_category", ["category", "isPublished"]),

  // ============================================================================
  // ANALYTICS - Server-Side Tracking Engine
  // ============================================================================

  // Session Clicks - Server-Side Click Tracking
  sessionClicks: defineTable({
    sessionId: v.string(),
    anonymousId: v.string(),
    // Ad Attribution
    fbclid: v.optional(v.string()),
    gclid: v.optional(v.string()),
    ttclid: v.optional(v.string()),
    // UTM Parameters
    utm_source: v.optional(v.string()),
    utm_medium: v.optional(v.string()),
    utm_campaign: v.optional(v.string()),
    utm_term: v.optional(v.string()),
    utm_content: v.optional(v.string()),
    // Context
    referrer: v.optional(v.string()),
    landingPage: v.string(),
    ipHash: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    acceptLanguage: v.optional(v.string()),
    // Timestamps
    firstClickTime: v.number(),
    lastSeenTime: v.number(),
  })
    .index("by_session", ["sessionId"])
    .index("by_anonymous", ["anonymousId"])
    .index("by_fbclid", ["fbclid"])
    .index("by_gclid", ["gclid"]),

  // User Identity Graph - Cross-Platform Identity Resolution
  userIdentityGraph: defineTable({
    canonicalUserId: v.string(),
    userId: v.optional(v.string()), // Clerk ID wenn eingeloggt
    emailHash: v.optional(v.string()), // SHA-256 gehasht für DSGVO
    devices: v.array(v.object({
      platform: v.string(),
      deviceId: v.optional(v.string()),
      fingerprint: v.optional(v.string()),
      sessionIds: v.array(v.string()),
      firstSeen: v.number(),
      lastSeen: v.number(),
    })),
    // Attribution
    firstTouchAttribution: v.optional(v.object({
      source: v.optional(v.string()),
      medium: v.optional(v.string()),
      campaign: v.optional(v.string()),
      fbclid: v.optional(v.string()),
      gclid: v.optional(v.string()),
      timestamp: v.number(),
    })),
    lastTouchAttribution: v.optional(v.object({
      source: v.optional(v.string()),
      medium: v.optional(v.string()),
      campaign: v.optional(v.string()),
      fbclid: v.optional(v.string()),
      gclid: v.optional(v.string()),
      timestamp: v.number(),
    })),
    // Timestamps
    firstSeen: v.number(),
    lastActivity: v.number(),
  })
    .index("by_canonical_id", ["canonicalUserId"])
    .index("by_user_id", ["userId"])
    .index("by_email_hash", ["emailHash"]),

  // Analytics Events - All Tracked Events
  analyticsEvents: defineTable({
    canonicalUserId: v.string(),
    sessionId: v.string(),
    eventType: v.string(),
    eventData: v.string(), // JSON string für flexible event properties
    platform: v.union(v.literal("web"), v.literal("ios"), v.literal("android")),
    route: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_canonical_user", ["canonicalUserId"])
    .index("by_session", ["sessionId"])
    .index("by_event_type", ["eventType"])
    .index("by_timestamp", ["timestamp"]),

  // Conversions - Conversion Tracking for Ad Platforms
  conversions: defineTable({
    canonicalUserId: v.string(),
    userId: v.optional(v.string()),
    emailHash: v.optional(v.string()),
    conversionType: v.string(),
    value: v.optional(v.number()),
    currency: v.optional(v.string()),
    // Attribution
    fbclid: v.optional(v.string()),
    gclid: v.optional(v.string()),
    utm_source: v.optional(v.string()),
    utm_campaign: v.optional(v.string()),
    // API Status
    sentToFacebook: v.boolean(),
    sentToGoogle: v.boolean(),
    facebookEventId: v.optional(v.string()),
    googleEventId: v.optional(v.string()),
    // Timestamp
    timestamp: v.number(),
  })
    .index("by_canonical_user", ["canonicalUserId"])
    .index("by_conversion_type", ["conversionType"])
    .index("by_timestamp", ["timestamp"]),

  // ============================================================================
  // PIPELINE V2 - Generation Sessions (Real-time Progress Tracking)
  // ============================================================================
  generationSessions: defineTable({
    sessionId: v.string(),
    userId: v.string(),
    status: v.string(),              // "running" | "completed" | "failed"
    currentStep: v.number(),         // 0-9 (index in STEP_ORDER)
    stepLabel: v.string(),           // Human-readable label
    error: v.optional(v.string()),
    worldId: v.optional(v.id("worlds")),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),

    // Pipeline v3: Telemetrie
    errorCode: v.optional(v.string()),         // E_GATE, E_NAV_001, E_STRUCT_001, etc.
    qualityScore: v.optional(v.number()),      // Quality Gate Score 0-10
    gateViolations: v.optional(v.array(v.string())), // Structural Gate Violations
    stepOutputs: v.optional(v.any()),          // JSON der Step-Ergebnisse (für Debug)
    pipelineState: v.optional(v.any()),       // Zwischenzustand zwischen Pipeline-Phasen
  })
    .index("by_session", ["sessionId"])
    .index("by_user", ["userId"]),
});
