# 🗄️ Supabase Database Setup für Meoluna

## Setup Anleitung

1. **Gehe zu deinem Supabase Dashboard**: https://izotecavlccunsbssxho.supabase.co
2. **Klicke auf "SQL Editor"** im linken Menü
3. **Kopiere den kompletten SQL Code unten** und füge ihn ein
4. **Klicke "Run"** um alle Tabellen zu erstellen

## SQL Schema (Copy & Paste):

```sql
-- Meoluna Database Schema
-- Transform Klassenarbeiten into magical learning worlds

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Meoluna Worlds - Each subdomain represents a unique learning world
CREATE TABLE meoluna_worlds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subdomain TEXT UNIQUE NOT NULL, -- e.g. "mathe-binomisch-8a"
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  grade_level INTEGER,
  theme_config JSONB NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  is_public BOOLEAN DEFAULT true, -- For community gallery
  play_count INTEGER DEFAULT 0,
  avg_rating DECIMAL(2,1) DEFAULT 0.0,
  saved_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meoluna Content - Different types of interactive content within worlds
CREATE TABLE meoluna_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  world_id UUID REFERENCES meoluna_worlds(id) ON DELETE CASCADE NOT NULL,
  content_type TEXT NOT NULL, -- 'info', 'quiz', 'interactive', 'game', 'drag_drop'
  content_data JSONB NOT NULL,
  difficulty_level INTEGER DEFAULT 1, -- Moon phases: 1-4
  order_index INTEGER NOT NULL,
  title TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meoluna Sessions - Anonymous user sessions for tracking
CREATE TABLE meoluna_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  world_id UUID REFERENCES meoluna_worlds(id) ON DELETE CASCADE NOT NULL,
  anonymous_id TEXT NOT NULL, -- Hashed browser fingerprint
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ DEFAULT NOW(),
  completed BOOLEAN DEFAULT FALSE,
  total_score DECIMAL(3,2) DEFAULT 0.00 -- 0.00 to 1.00
);

-- Meoluna Progress - Track interactions and progress
CREATE TABLE meoluna_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES meoluna_sessions(id) ON DELETE CASCADE NOT NULL,
  content_id UUID REFERENCES meoluna_content(id) ON DELETE CASCADE NOT NULL,
  interaction_data JSONB NOT NULL,
  score DECIMAL(3,2), -- 0.00 to 1.00
  completed BOOLEAN DEFAULT FALSE,
  attempts INTEGER DEFAULT 1,
  time_spent INTEGER DEFAULT 0, -- in seconds
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meoluna Themes - Predefined theme configurations
CREATE TABLE meoluna_themes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  config JSONB NOT NULL,
  preview_image TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meoluna Analytics - Aggregated analytics for teachers
CREATE TABLE meoluna_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  world_id UUID REFERENCES meoluna_worlds(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  unique_visitors INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  avg_completion_rate DECIMAL(3,2) DEFAULT 0.00,
  avg_score DECIMAL(3,2) DEFAULT 0.00,
  most_difficult_content_id UUID REFERENCES meoluna_content(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(world_id, date)
);

-- Indexes for performance
CREATE INDEX idx_meoluna_worlds_subdomain ON meoluna_worlds(subdomain);
CREATE INDEX idx_meoluna_worlds_created_by ON meoluna_worlds(created_by);
CREATE INDEX idx_meoluna_worlds_subject ON meoluna_worlds(subject);
CREATE INDEX idx_meoluna_worlds_public ON meoluna_worlds(is_public) WHERE is_public = true;

CREATE INDEX idx_meoluna_content_world_id ON meoluna_content(world_id);
CREATE INDEX idx_meoluna_content_order ON meoluna_content(world_id, order_index);

CREATE INDEX idx_meoluna_sessions_world_id ON meoluna_sessions(world_id);
CREATE INDEX idx_meoluna_sessions_anonymous ON meoluna_sessions(anonymous_id);

CREATE INDEX idx_meoluna_progress_session ON meoluna_progress(session_id);
CREATE INDEX idx_meoluna_progress_content ON meoluna_progress(content_id);

CREATE INDEX idx_meoluna_analytics_world_date ON meoluna_analytics(world_id, date);

-- Row Level Security (RLS) Policies
ALTER TABLE meoluna_worlds ENABLE ROW LEVEL SECURITY;
ALTER TABLE meoluna_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE meoluna_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE meoluna_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE meoluna_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE meoluna_analytics ENABLE ROW LEVEL SECURITY;

-- Policies for meoluna_worlds
CREATE POLICY "Public worlds are viewable by everyone" 
  ON meoluna_worlds FOR SELECT 
  USING (is_public = true);

CREATE POLICY "Users can view their own worlds" 
  ON meoluna_worlds FOR SELECT 
  USING (auth.uid() = created_by);

CREATE POLICY "Users can create worlds" 
  ON meoluna_worlds FOR INSERT 
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own worlds" 
  ON meoluna_worlds FOR UPDATE 
  USING (auth.uid() = created_by);

-- Policies for meoluna_content
CREATE POLICY "Content is viewable if world is accessible"
  ON meoluna_content FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM meoluna_worlds 
      WHERE id = world_id 
      AND (is_public = true OR created_by = auth.uid())
    )
  );

CREATE POLICY "Users can manage content in their worlds"
  ON meoluna_content FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM meoluna_worlds 
      WHERE id = world_id 
      AND created_by = auth.uid()
    )
  );

-- Policies for sessions and progress (anonymous access)
CREATE POLICY "Sessions are viewable by session owner or world creator"
  ON meoluna_sessions FOR SELECT
  USING (
    true -- Anonymous sessions are viewable for analytics
  );

CREATE POLICY "Anyone can create sessions"
  ON meoluna_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Sessions can be updated by anyone"
  ON meoluna_sessions FOR UPDATE
  USING (true);

-- Policies for progress
CREATE POLICY "Progress is viewable for analytics"
  ON meoluna_progress FOR SELECT
  USING (true);

CREATE POLICY "Anyone can track progress"
  ON meoluna_progress FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Progress can be updated"
  ON meoluna_progress FOR UPDATE
  USING (true);

-- Policies for themes (public read, admin write)
CREATE POLICY "Themes are publicly viewable"
  ON meoluna_themes FOR SELECT
  USING (is_active = true);

-- Policies for analytics
CREATE POLICY "Analytics viewable by world creators"
  ON meoluna_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM meoluna_worlds 
      WHERE id = world_id 
      AND created_by = auth.uid()
    )
  );

-- Functions for maintaining data
CREATE OR REPLACE FUNCTION update_meoluna_world_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_meoluna_worlds_updated_at
  BEFORE UPDATE ON meoluna_worlds
  FOR EACH ROW
  EXECUTE FUNCTION update_meoluna_world_updated_at();

-- Function to increment play count
CREATE OR REPLACE FUNCTION increment_world_play_count(world_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE meoluna_worlds 
  SET play_count = play_count + 1 
  WHERE id = world_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate world completion rate
CREATE OR REPLACE FUNCTION calculate_world_completion_rate(world_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
  total_sessions INTEGER;
  completed_sessions INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_sessions
  FROM meoluna_sessions
  WHERE world_id = world_uuid;
  
  SELECT COUNT(*) INTO completed_sessions
  FROM meoluna_sessions
  WHERE world_id = world_uuid AND completed = true;
  
  IF total_sessions = 0 THEN
    RETURN 0.00;
  END IF;
  
  RETURN ROUND(completed_sessions::DECIMAL / total_sessions::DECIMAL, 2);
END;
$$ LANGUAGE plpgsql;

-- Insert default themes
INSERT INTO meoluna_themes (name, subject, config) VALUES
('Geometrische Galaxie', 'mathematics', '{
  "colors": {
    "primary": "#1e40af",
    "secondary": "#3b82f6", 
    "accent": "#60a5fa",
    "background": "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
    "surface": "#ffffff"
  },
  "patterns": {
    "hero": "constellation-math",
    "background": "geometric-grid",
    "decorative": "floating-formulas"
  },
  "animations": {
    "entrance": "slide-up-fade",
    "interaction": "pulse-on-hover", 
    "success": "starburst"
  }
}'),
('Lebendiger Garten', 'biology', '{
  "colors": {
    "primary": "#059669",
    "secondary": "#10b981",
    "accent": "#34d399", 
    "background": "linear-gradient(180deg, #f0fdf4 0%, #dcfce7 100%)",
    "surface": "#ffffff"
  },
  "patterns": {
    "hero": "growing-vines",
    "background": "organic-cells",
    "decorative": "floating-leaves"
  },
  "animations": {
    "entrance": "grow-from-seed",
    "interaction": "gentle-sway",
    "success": "bloom"
  }
}'),
('Geschichtenbuch', 'german', '{
  "colors": {
    "primary": "#7c3aed",
    "secondary": "#8b5cf6",
    "accent": "#a78bfa",
    "background": "linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)",
    "surface": "#fffbf0"
  },
  "patterns": {
    "hero": "open-book", 
    "background": "paper-texture",
    "decorative": "floating-letters"
  },
  "animations": {
    "entrance": "page-turn",
    "interaction": "typewriter",
    "success": "sparkle-text"
  }
}');
```

## Nach dem Setup:

1. **Prüfe** ob alle 6 Tabellen erstellt wurden:
   - `meoluna_worlds`
   - `meoluna_content` 
   - `meoluna_sessions`
   - `meoluna_progress`
   - `meoluna_themes`
   - `meoluna_analytics`

2. **Teste** die Verbindung durch eine neue Lernwelt-Generierung

3. **Schaue** im Table Editor nach gespeicherten Welten

## Troubleshooting:

- **Fehler bei Policies?** → RLS kann deaktiviert werden für Tests
- **UUID Extension fehlt?** → Supabase sollte das automatisch haben
- **Permissions?** → Service Role Key muss korrekt sein

Nach dem Setup funktioniert die komplette Pipeline: KI → Database → Dynamic Rendering! 🚀