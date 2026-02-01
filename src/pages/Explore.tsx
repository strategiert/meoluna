/**
 * Explore Page - Öffentliche Welten entdecken
 */

import { Link } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { motion } from 'framer-motion';
import { Moon, Search, Globe, Heart, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';
import { useState } from 'react';

export default function Explore() {
  const [searchQuery, setSearchQuery] = useState('');
  const worlds = useQuery(api.worlds.listPublic);

  const filteredWorlds = worlds?.filter(world =>
    world.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <SignedOut>
              <SignInButton mode="modal">
                <Button variant="ghost">Anmelden</Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link to="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Lernwelten entdecken</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Erkunde von der Community erstellte interaktive Lernwelten zu verschiedenen Themen.
          </p>
        </div>

        {/* Search */}
        <div className="max-w-md mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Suche nach Themen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Worlds Grid */}
        {worlds === undefined ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
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
        ) : filteredWorlds && filteredWorlds.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 bg-card rounded-2xl border border-border"
          >
            <Globe className="w-16 h-16 mx-auto mb-4 text-primary opacity-50" />
            <h2 className="text-xl font-semibold mb-2">Keine Welten gefunden</h2>
            <p className="text-muted-foreground mb-6">
              {searchQuery
                ? `Keine Ergebnisse für "${searchQuery}"`
                : 'Noch keine öffentlichen Lernwelten vorhanden.'}
            </p>
            <Link to="/create">
              <Button>Erste Welt erstellen</Button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorlds?.map((world, index) => (
              <motion.div
                key={world._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="group hover:border-primary/50 transition-colors h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="line-clamp-2">{world.title}</CardTitle>
                        <CardDescription>
                          {new Date(world._creationTime).toLocaleDateString('de-DE')}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        <Globe className="w-3 h-3 mr-1" />
                        Öffentlich
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-32 bg-gradient-to-br from-primary/20 to-purple-600/20 rounded-lg flex items-center justify-center mb-4 group-hover:from-primary/30 group-hover:to-purple-600/30 transition-colors">
                      <Moon className="w-12 h-12 text-primary/50 group-hover:text-primary/70 transition-colors" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {world.views || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          {world.likes || 0}
                        </span>
                      </div>
                      <Link to={`/w/${world._id}`}>
                        <Button size="sm">Öffnen</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
