/**
 * Dashboard Page - Eigene Welten verwalten
 */

import { Link } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { motion } from 'framer-motion';
import { Moon, Plus, Globe, Lock, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/clerk-react';

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const worlds = useQuery(api.worlds.listByUser, user?.id ? { userId: user.id } : 'skip');

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center">
              <Moon className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">Meoluna</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link to="/explore">
              <Button variant="ghost">Entdecken</Button>
            </Link>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        <SignedOut>
          <div className="text-center py-20">
            <Moon className="w-16 h-16 mx-auto mb-4 text-primary opacity-50" />
            <h1 className="text-2xl font-bold mb-2">Melde dich an</h1>
            <p className="text-muted-foreground mb-6">
              Um deine Lernwelten zu verwalten, musst du angemeldet sein.
            </p>
            <SignInButton mode="modal">
              <Button size="lg">Jetzt anmelden</Button>
            </SignInButton>
          </div>
        </SignedOut>

        <SignedIn>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Meine Lernwelten</h1>
              <p className="text-muted-foreground mt-1">
                Erstelle und verwalte deine interaktiven Lernwelten
              </p>
            </div>
            <Link to="/create">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Neue Welt
              </Button>
            </Link>
          </div>

          {/* Worlds Grid */}
          {!isLoaded || worlds === undefined ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
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
          ) : worlds.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20 bg-card rounded-2xl border border-border"
            >
              <Moon className="w-16 h-16 mx-auto mb-4 text-primary opacity-50" />
              <h2 className="text-xl font-semibold mb-2">Noch keine Lernwelten</h2>
              <p className="text-muted-foreground mb-6">
                Erstelle deine erste interaktive Lernwelt!
              </p>
              <Link to="/create">
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Erste Welt erstellen
                </Button>
              </Link>
            </motion.div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {worlds.map((world, index) => (
                <motion.div
                  key={world._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="group hover:border-primary/50 transition-colors">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="line-clamp-1">{world.title}</CardTitle>
                          <CardDescription>
                            {new Date(world._creationTime).toLocaleDateString('de-DE')}
                          </CardDescription>
                        </div>
                        <Badge variant={world.isPublic ? 'default' : 'secondary'}>
                          {world.isPublic ? (
                            <><Globe className="w-3 h-3 mr-1" /> Öffentlich</>
                          ) : (
                            <><Lock className="w-3 h-3 mr-1" /> Privat</>
                          )}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-32 bg-gradient-to-br from-primary/20 to-purple-600/20 rounded-lg flex items-center justify-center mb-4">
                        <Moon className="w-12 h-12 text-primary/50" />
                      </div>
                      <div className="flex gap-2">
                        <Link to={`/w/${world._id}`} className="flex-1">
                          <Button variant="outline" className="w-full gap-2">
                            <ExternalLink className="w-4 h-4" />
                            Öffnen
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </SignedIn>
      </main>
    </div>
  );
}
