/**
 * Explore Page - Öffentliche Welten entdecken (Original Design)
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { motion } from "framer-motion";
import { Search, Filter, Sparkles, TrendingUp, Clock, Star, Eye, Heart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Navbar } from "@/components/layout/Navbar";
import { MoonLogo } from "@/components/icons/MoonLogo";

type SortOption = "newest" | "popular" | "likes";

const subjects = [
  { value: "all", label: "Alle Fächer" },
  { value: "mathematik", label: "Mathematik" },
  { value: "deutsch", label: "Deutsch" },
  { value: "englisch", label: "Englisch" },
  { value: "biologie", label: "Biologie" },
  { value: "physik", label: "Physik" },
  { value: "chemie", label: "Chemie" },
  { value: "geschichte", label: "Geschichte" },
  { value: "geografie", label: "Geografie" },
  { value: "kunst", label: "Kunst" },
  { value: "musik", label: "Musik" },
  { value: "sport", label: "Sport" },
  { value: "informatik", label: "Informatik" },
  { value: "allgemein", label: "Allgemein" },
];

const subjectColors: Record<string, string> = {
  mathematik: "bg-blue-500",
  deutsch: "bg-amber-500",
  englisch: "bg-red-500",
  biologie: "bg-green-500",
  physik: "bg-indigo-500",
  chemie: "bg-purple-500",
  geschichte: "bg-orange-500",
  geografie: "bg-teal-500",
  kunst: "bg-pink-500",
  musik: "bg-rose-500",
  sport: "bg-lime-500",
  informatik: "bg-cyan-500",
  allgemein: "bg-slate-500",
};

export default function Explore() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  const worlds = useQuery(api.worlds.listPublic);

  // Filter and sort worlds
  const filteredWorlds = worlds
    ?.filter((world) => {
      const matchesSearch = world.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSubject = selectedSubject === "all" || world.subject === selectedSubject;
      return matchesSearch && matchesSubject;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "popular":
          return (b.views || 0) - (a.views || 0);
        case "likes":
          return (b.likes || 0) - (a.likes || 0);
        case "newest":
        default:
          return b._creationTime - a._creationTime;
      }
    });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Lernwelten entdecken
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Erkunde von der Community erstellte Lernwelten und finde Inspiration für deinen Unterricht
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col md:flex-row gap-4 mb-8"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Lernwelten durchsuchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-full md:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Fach wählen" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((subject) => (
                <SelectItem key={subject.value} value={subject.value}>
                  {subject.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Sortieren" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Neueste
                </div>
              </SelectItem>
              <SelectItem value="popular">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Beliebteste
                </div>
              </SelectItem>
              <SelectItem value="likes">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Meiste Likes
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Results count */}
        {worlds !== undefined && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-muted-foreground mb-6"
          >
            {filteredWorlds?.length || 0} Lernwelt{filteredWorlds?.length !== 1 ? "en" : ""} gefunden
          </motion.p>
        )}

        {/* Grid */}
        {worlds === undefined ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-xl" />
            ))}
          </div>
        ) : filteredWorlds && filteredWorlds.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-medium mb-2">Keine Lernwelten gefunden</h3>
            <p className="text-muted-foreground mb-6">
              Versuche andere Suchbegriffe oder Filter
            </p>
            <Link to="/create">
              <Button className="bg-moon text-night-sky hover:bg-moon-glow">
                <Sparkles className="w-4 h-4 mr-2" />
                Erste Welt erstellen
              </Button>
            </Link>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredWorlds?.map((world, index) => {
              const subjectColor = subjectColors[world.subject || "allgemein"] || subjectColors.allgemein;

              return (
                <motion.div
                  key={world._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -4 }}
                  className="group"
                >
                  <Link to={`/w/${world._id}`}>
                    <Card className="overflow-hidden border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
                      {/* Thumbnail */}
                      <div className="h-40 relative overflow-hidden bg-gradient-to-br from-moon/20 via-primary/10 to-aurora/20">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <MoonLogo size="lg" animate={false} className="opacity-30 group-hover:opacity-50 transition-opacity" />
                        </div>

                        {/* Subject Badge */}
                        {world.subject && (
                          <Badge
                            className={`absolute top-3 left-3 text-white border-0 ${subjectColor}`}
                          >
                            {world.subject}
                          </Badge>
                        )}

                        {/* Stats overlay */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 pt-8">
                          <div className="flex items-center gap-3 text-white/90 text-sm">
                            <div className="flex items-center gap-1">
                              <Eye className="h-3.5 w-3.5" />
                              <span>{world.views || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Heart className="h-3.5 w-3.5" />
                              <span>{world.likes || 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <CardContent className="p-4">
                        {/* Title */}
                        <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                          {world.title}
                        </h3>

                        {/* Grade Level */}
                        {world.gradeLevel && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Klasse {world.gradeLevel}
                          </p>
                        )}

                        {/* Date */}
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(world._creationTime).toLocaleDateString("de-DE", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </main>
    </div>
  );
}
