# 🌙 Meoluna - KI-Lernwelt Generator

Transformiere Klassenarbeiten in magische, interaktive Lernwelten. Jede Lernwelt ist ein einzigartiges Universum, thematisch perfekt abgestimmt und als eigenständige Web-App erreichbar.

## ✨ Features

- **🤖 KI-generierte Inhalte**: OpenAI/DeepSeek powered content generation
- **🎨 Thematische Welten**: Jedes Fach bekommt sein eigenes visuelles Universum
- **🌐 Multi-Tenant**: Jede Lernwelt auf eigener Subdomain (*.meoluna.com)
- **📊 Analytics**: Detaillierte Einblicke für Lehrer
- **🎮 Interaktiv**: Drag&Drop, Quiz, Spiele und mehr
- **📱 Responsive**: Funktioniert auf allen Geräten

## 🏗️ Architektur

```
meoluna/
├── apps/
│   ├── platform/           # Hauptplattform (meoluna.com)
│   └── world/             # Lernwelten (*.meoluna.com)
├── packages/
│   ├── @meoluna/database/ # Supabase Schema & Client
│   ├── @meoluna/ai-core/  # AI Provider Abstraction
│   └── @meoluna/ui/       # Shared Components
└── infrastructure/        # Deployment Configs
```

## 🚀 Quick Start

### 1. Prerequisites

- Node.js 18+
- npm oder yarn
- Supabase Account
- OpenAI API Key

### 2. Installation

```bash
# Clone repository
git clone <repository-url>
cd meoluna

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Fill in your API keys and URLs
```

### 3. Database Setup

```bash
# Set up Supabase project
# Copy SQL from packages/@meoluna/database/src/schema.sql
# Run in Supabase SQL Editor

# Generate types (optional)
cd packages/@meoluna/database
npm run generate-types
```

### 4. Development

```bash
# Start platform app (Port 3000)
npm run dev

# In separate terminal: Start world app (Port 3001)
cd apps/world
npm run dev
```

### 5. Environment Variables

Create `.env.local` with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_key
```

## 📱 Usage

### Creating a Learning World

1. Navigate to `http://localhost:3000/create`
2. Upload or paste your Klassenarbeit content
3. Select subject and grade level
4. Choose a visual theme
5. Let AI generate your world
6. Deploy to unique subdomain

### Accessing Learning Worlds

- Production: `https://your-world.meoluna.com`
- Development: `http://localhost:3001/world/your-world`

## 🎨 Themes

Meoluna includes predefined themes for different subjects:

- **Mathematics**: Geometrische Galaxie (Blue cosmic theme)
- **Biology**: Lebendiger Garten (Green nature theme)
- **German**: Geschichtenbuch (Purple literary theme)
- **History**: Zeitreise-Portal (Amber historical theme)
- **Physics**: Kosmisches Labor (Gray scientific theme)
- **Chemistry**: Molekulare Werkstatt (Red molecular theme)

## 🔧 Development

### Project Structure

```
apps/platform/
├── app/
│   ├── (auth)/           # Authentication pages
│   ├── dashboard/        # Teacher dashboard
│   ├── create/          # World creation
│   ├── gallery/         # Community gallery
│   └── api/             # API routes
├── components/          # Platform components
└── middleware.ts        # Subdomain routing

apps/world/
├── app/
│   ├── world/[subdomain]/ # Dynamic world pages
│   └── api/              # Progress tracking
└── components/           # World components
```

### Available Scripts

```bash
# Development
npm run dev          # Start all apps
npm run build        # Build all apps
npm run lint         # Lint all packages
npm run type-check   # TypeScript checking

# Individual apps
cd apps/platform && npm run dev
cd apps/world && npm run dev
```

### Adding New AI Providers

1. Implement `MeolunaAIProvider` interface
2. Add to `packages/@meoluna/ai-core/src/providers/`
3. Update factory in `src/index.ts`

Example:
```typescript
export class MeolunaDeepSeek extends BaseMeolunaProvider {
  // Implement interface methods
}
```

## 🚀 Deployment

### Vercel Deployment

1. Connect repository to Vercel
2. Set up wildcard domain: `*.meoluna.com`
3. Configure environment variables
4. Deploy platform and world apps separately

### Domain Configuration

```
meoluna.com           → Platform app
*.meoluna.com         → World app
api.meoluna.com       → API endpoints
```

## 📊 Analytics

Track learning progress with built-in analytics:

- Session tracking (anonymous)
- Content interaction data
- Completion rates
- Difficulty analysis
- Teacher dashboard insights

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

## 🎯 Roadmap

- [ ] DeepSeek integration for cost optimization
- [ ] Advanced gamification features
- [ ] Real-time collaboration
- [ ] Mobile app
- [ ] Offline mode
- [ ] Teacher community features
- [ ] Advanced analytics
- [ ] White-label solutions

## 🆘 Support

- Documentation: [docs.meoluna.com](https://docs.meoluna.com)
- Issues: [GitHub Issues](https://github.com/your-org/meoluna/issues)
- Discord: [Community Discord](https://discord.gg/meoluna)

---

Made with 🌙 by the Meoluna Team