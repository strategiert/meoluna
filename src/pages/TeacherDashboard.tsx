/**
 * Teacher Dashboard - Klassen verwalten
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { motion } from 'framer-motion';
import {
  Plus,
  Users,
  BookOpen,
  Copy,
  Check,
  MoreVertical,
  Trash2,
  Settings,
  GraduationCap,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StarField } from '@/components/landing/StarField';
import { Navbar } from '@/components/layout/Navbar';
import { MoonLogo } from '@/components/icons/MoonLogo';
import { useToast } from '@/hooks/use-toast';
import {
  SignedIn,
  SignedOut,
  SignInButton,
  useUser,
} from '@clerk/clerk-react';

const gradeLevels = [
  '1. Klasse', '2. Klasse', '3. Klasse', '4. Klasse',
  '5. Klasse', '6. Klasse', '7. Klasse', '8. Klasse',
  '9. Klasse', '10. Klasse', '11. Klasse', '12. Klasse', '13. Klasse',
];

const subjects = [
  'Mathematik', 'Deutsch', 'Englisch', 'Physik', 'Chemie', 'Biologie',
  'Geschichte', 'Geographie', 'Informatik', 'Kunst', 'Musik', 'Sport',
  'Ethik', 'Religion', 'Wirtschaft', 'Politik', 'Sonstiges',
];

function CreateClassroomDialog({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [subject, setSubject] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const createClassroom = useMutation(api.classrooms.create);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      const result = await createClassroom({
        name: name.trim(),
        description: description.trim() || undefined,
        teacherId: userId,
        gradeLevel: gradeLevel || undefined,
        subject: subject || undefined,
      });

      toast({
        title: 'Klasse erstellt!',
        description: `Einladungscode: ${result.inviteCode}`,
      });

      setOpen(false);
      setName('');
      setDescription('');
      setGradeLevel('');
      setSubject('');
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Die Klasse konnte nicht erstellt werden.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-gradient-to-r from-moon to-aurora hover:opacity-90 text-background font-medium">
          <Plus className="w-4 h-4" />
          Neue Klasse
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Neue Klasse erstellen</DialogTitle>
            <DialogDescription>
              Erstelle eine neue Klasse und lade Schüler mit dem Einladungscode ein.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Klassenname *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="z.B. Mathe 7a"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optionale Beschreibung..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Klassenstufe</Label>
                <Select value={gradeLevel} onValueChange={setGradeLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {gradeLevels.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Fach</Label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim()}>
              {isLoading ? 'Erstelle...' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function InviteCodeBadge({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={copyCode}
      className="inline-flex items-center gap-1.5 px-2 py-1 bg-moon/10 hover:bg-moon/20 rounded text-sm font-mono text-moon transition-colors"
    >
      {code}
      {copied ? (
        <Check className="w-3.5 h-3.5" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );
}

function ClassroomCard({ classroom, onDelete }: {
  classroom: {
    _id: string;
    name: string;
    description?: string;
    inviteCode: string;
    gradeLevel?: string;
    subject?: string;
    memberCount: number;
  };
  onDelete: (id: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="group bg-card/50 border-border/50 hover:border-moon/30 transition-all duration-300 hover:shadow-lg hover:shadow-moon/5 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="group-hover:text-moon transition-colors">
                {classroom.name}
              </CardTitle>
              <CardDescription className="mt-1">
                {classroom.description || 'Keine Beschreibung'}
              </CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to={`/teacher/classroom/${classroom._id}`}>
                    <Settings className="w-4 h-4 mr-2" />
                    Verwalten
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onDelete(classroom._id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Löschen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            {classroom.gradeLevel && (
              <Badge variant="secondary">{classroom.gradeLevel}</Badge>
            )}
            {classroom.subject && (
              <Badge variant="outline">{classroom.subject}</Badge>
            )}
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              <span>{classroom.memberCount} Schüler</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs">Code:</span>
              <InviteCodeBadge code={classroom.inviteCode} />
            </div>
          </div>

          <Link to={`/teacher/classroom/${classroom._id}`}>
            <Button variant="outline" className="w-full">
              Klasse öffnen
            </Button>
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function TeacherDashboard() {
  const { user, isLoaded } = useUser();
  const classrooms = useQuery(
    api.classrooms.listByTeacher,
    user?.id ? { teacherId: user.id } : 'skip'
  );
  const overview = useQuery(
    api.classrooms.getTeacherOverview,
    user?.id ? { teacherId: user.id } : 'skip'
  );
  const deleteClassroom = useMutation(api.classrooms.remove);
  const { toast } = useToast();

  const handleDelete = async (classroomId: string) => {
    if (!confirm('Möchtest du diese Klasse wirklich löschen? Alle Mitgliedschaften und Zuweisungen werden entfernt.')) {
      return;
    }

    try {
      await deleteClassroom({ classroomId: classroomId as any });
      toast({
        title: 'Klasse gelöscht',
        description: 'Die Klasse wurde erfolgreich gelöscht.',
      });
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Die Klasse konnte nicht gelöscht werden.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background relative">
      <StarField />

      {/* Aurora effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div
          className="absolute -top-40 -right-40 w-96 h-96 bg-aurora/10 rounded-full blur-3xl animate-pulse-soft"
          style={{ animationDelay: '0s' }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse-soft"
          style={{ animationDelay: '3s' }}
        />
      </div>

      <Navbar />

      <main className="container mx-auto px-4 py-8 pt-24 relative z-10">
        <SignedOut>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-moon/20 rounded-full blur-2xl scale-150" />
              <GraduationCap className="w-20 h-20 text-moon relative z-10" />
            </div>
            <h1 className="text-3xl font-bold mb-3">
              Lehrer-Dashboard
            </h1>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Melde dich an, um deine Klassen zu verwalten und Lernwelten zuzuweisen.
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
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <GraduationCap className="w-8 h-8 text-moon" />
                  Lehrer-Dashboard
                </h1>
                <p className="text-muted-foreground mt-1">
                  Verwalte deine Klassen und verfolge den Lernfortschritt
                </p>
              </div>
              {user?.id && <CreateClassroomDialog userId={user.id} />}
            </div>

            {/* Stats */}
            {overview && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <Card className="bg-card/50 border-border/50">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-moon/10">
                        <BookOpen className="w-5 h-5 text-moon" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{overview.totalClassrooms}</p>
                        <p className="text-xs text-muted-foreground">Klassen</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card/50 border-border/50">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-aurora/10">
                        <Users className="w-5 h-5 text-aurora" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{overview.totalStudents}</p>
                        <p className="text-xs text-muted-foreground">Schüler</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card/50 border-border/50">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <TrendingUp className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{overview.totalAssignments}</p>
                        <p className="text-xs text-muted-foreground">Aufgaben</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card/50 border-border/50">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-nebula/10">
                        <Clock className="w-5 h-5 text-nebula" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{overview.recentActivity.length}</p>
                        <p className="text-xs text-muted-foreground">Aktivitäten</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </motion.div>

          {/* Classrooms Grid */}
          {!isLoaded || classrooms === undefined ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="bg-card/50 border-border/50">
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full rounded-lg" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : classrooms.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20 bg-card/30 rounded-2xl border border-border/50 backdrop-blur-sm"
            >
              <div className="relative inline-block mb-4">
                <div className="absolute inset-0 bg-moon/20 rounded-full blur-xl scale-150" />
                <GraduationCap className="w-16 h-16 text-moon/50 relative z-10" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Noch keine Klassen</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Erstelle deine erste Klasse und lade Schüler mit einem Einladungscode ein.
              </p>
              {user?.id && <CreateClassroomDialog userId={user.id} />}
            </motion.div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classrooms.map((classroom) => (
                <ClassroomCard
                  key={classroom._id}
                  classroom={classroom as any}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </SignedIn>
      </main>
    </div>
  );
}
