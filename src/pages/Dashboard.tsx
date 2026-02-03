/**
 * Dashboard Page - Eigene Welten verwalten
 * Redesigned with StarField, Aurora effects, and Meoluna branding
 */

import { Link } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Doc, Id } from '../../convex/_generated/dataModel';
import { motion } from 'framer-motion';
import {
  Plus,
  Globe,
  Lock,
  ExternalLink,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { StarField } from '@/components/landing/StarField';
import { Navbar } from '@/components/layout/Navbar';
import { MoonLogo } from '@/components/icons/MoonLogo';
import { ProgressStats } from '@/components/ProgressStats';
import {
  SignedIn,
  SignedOut,
  SignInButton,
  useUser,
} from '@clerk/clerk-react';
import { useState, useMemo } from 'react';
import { WorldCreatorModal } from '@/components/WorldCreator';

// Moon phase icons for world cards
const moonPhases = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];

function getMoonPhase(index: number): string {
  return moonPhases[index % moonPhases.length];
}

// Greeting based on time of day
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Guten Morgen';
  if (hour < 18) return 'Guten Tag';
  return 'Guten Abend';
}

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const worlds = useQuery(api.worlds.listByUser, user?.id ? { userId: user.id } : 'skip');
  const togglePublic = useMutation(api.worlds.togglePublic);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPublic, setFilterPublic] = useState<boolean | null>(null);
  const [showCreator, setShowCreator] = useState(false);

  // Toggle public/private
  const handleTogglePublic = async (worldId: Id<"worlds">, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent card click
    e.stopPropagation();
    await togglePublic({ id: worldId });
  };

  // Filter worlds based on search and filter
  const filteredWorlds = useMemo(() => {
    if (!worlds) return [];
    return worlds.filter((world: Doc<"worlds">) => {
      const matchesSearch = world.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterPublic === null || world.isPublic === filterPublic;
      return matchesSearch && matchesFilter;
    });
  }, [worlds, searchQuery, filterPublic]);

  return (
    <div className="min-h-screen bg-hero relative">
      {/* Star background */}
      <StarField />

      {/* Aurora effects */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-aurora blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-accent blur-[120px]" />
      </div>

      {/* Navigation */}
      <Navbar />

      {/* Content */}
      <main className="container mx-auto px-4 py-8 pt-24 relative z-10">
        <SignedOut>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-moon/20 rounded-full blur-2xl scale-150" />
              <MoonLogo size="xl" className="relative z-10" />
            </div>
            <h1 className="text-3xl font-bold mb-3">
              Willkommen bei <span className="text-moon">Meoluna</span>
            </h1>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Melde dich an, um deine magischen Lernwelten zu erstellen und zu verwalten.
            </p>
            <SignInButton mode="modal">
              <Button
                size="lg"
                className="gap-2 bg-gradient-to-r from-moon to-aurora hover:opacity-90 text-background font-semibold"
              >
                Jetzt anmelden
              </Button>
            </SignInButton>
          </motion.div>
        </SignedOut>

        <SignedIn>
          {/* Dashboard Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold">
                  {getGreeting()}, {user?.firstName || 'Lernender'} 👋
                </h1>
                <p className="text-muted-foreground mt-1">
                  Verwalte deine magischen Lernwelten
                </p>
              </div>
              <Button 
                onClick={() => setShowCreator(true)}
                className="gap-2 bg-gradient-to-r from-moon to-aurora hover:opacity-90 text-background font-medium"
              >
                <Plus className="w-4 h-4" />
                Neue Welt erstellen
              </Button>
            </div>

            {/* Progress Stats */}
            {user?.id && (
              <ProgressStats userId={user.id} variant="compact" className="mb-6" />
            )}

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Welten durchsuchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-card/50 border-border/50"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterPublic === null ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterPublic(null)}
                  className={filterPublic === null ? 'bg-moon/20 text-moon border-moon/30' : ''}
                >
                  Alle
                </Button>
                <Button
                  variant={filterPublic === true ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterPublic(true)}
                  className={filterPublic === true ? 'bg-moon/20 text-moon border-moon/30' : ''}
                >
                  <Globe className="w-3 h-3 mr-1" />
                  Öffentlich
                </Button>
                <Button
                  variant={filterPublic === false ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterPublic(false)}
                  className={filterPublic === false ? 'bg-moon/20 text-moon border-moon/30' : ''}
                >
                  <Lock className="w-3 h-3 mr-1" />
                  Privat
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Worlds Grid */}
          {!isLoaded || worlds === undefined ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="bg-card/50 border-border/50">
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-32 w-full rounded-lg" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredWorlds.length === 0 ? (
            worlds.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-20 px-4 text-center"
              >
                <div className="relative mb-6">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-moon/20 to-aurora/20 flex items-center justify-center">
                    <MoonLogo size="lg" animate={false} className="opacity-70" />
                  </div>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -inset-2 rounded-full border border-dashed border-moon/30"
                  />
                </div>

                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Noch keine Lernwelten
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  Erstelle deine erste Lernwelt und verwandle Unterrichtsmaterial in
                  interaktive Lernabenteuer für deine Schüler.
                </p>

                <Link to="/create">
                  <Button className="bg-gradient-to-r from-moon to-aurora text-night-sky hover:opacity-90">
                    <Plus className="w-4 h-4 mr-2" />
                    Erste Lernwelt erstellen
                  </Button>
                </Link>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <p className="text-muted-foreground mb-4">
                  Keine Lernwelten gefunden für "{searchQuery}"
                </p>
                <Button variant="outline" onClick={() => {
                  setSearchQuery('');
                  setFilterPublic(null);
                }}>
                  Filter zurücksetzen
                </Button>
              </motion.div>
            )
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredWorlds.map((world: Doc<"worlds">, index: number) => (
                <motion.div
                  key={world._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="group bg-card/50 border-border/50 hover:border-moon/30 transition-all duration-300 hover:shadow-lg hover:shadow-moon/5 backdrop-blur-sm">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{getMoonPhase(index)}</span>
                          <div>
                            <CardTitle className="line-clamp-1 group-hover:text-moon transition-colors">
                              {world.title}
                            </CardTitle>
                            <CardDescription>
                              {new Date(world._creationTime).toLocaleDateString('de-DE', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge
                          variant={world.isPublic ? 'default' : 'secondary'}
                          className={`cursor-pointer hover:opacity-80 transition-opacity ${world.isPublic ? 'bg-aurora/20 text-aurora border-aurora/30' : ''}`}
                          onClick={(e) => handleTogglePublic(world._id, e)}
                        >
                          {world.isPublic ? (
                            <><Globe className="w-3 h-3 mr-1" /> Öffentlich</>
                          ) : (
                            <><Lock className="w-3 h-3 mr-1" /> Privat</>
                          )}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-28 bg-gradient-to-br from-moon/10 via-primary/10 to-aurora/10 rounded-lg flex items-center justify-center mb-4 group-hover:from-moon/20 group-hover:via-primary/20 group-hover:to-aurora/20 transition-colors">
                        <MoonLogo size="lg" animate={false} className="opacity-30 group-hover:opacity-50 transition-opacity" />
                      </div>
                      <Link to={`/w/${world._id}`} className="block">
                        <Button
                          variant="outline"
                          className="w-full gap-2 border-moon/20 hover:bg-moon/10 hover:text-moon hover:border-moon/40"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Welt betreten
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </SignedIn>
      </main>

      {/* World Creator Modal */}
      <WorldCreatorModal open={showCreator} onOpenChange={setShowCreator} />
    </div>
  );
}
