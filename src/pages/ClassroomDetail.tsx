/**
 * Classroom Detail - Einzelne Klasse verwalten
 */

import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id, Doc } from '../../convex/_generated/dataModel';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Users,
  BookOpen,
  Copy,
  Check,
  RefreshCw,
  UserMinus,
  Plus,
  Calendar,
  Trophy,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StarField } from '@/components/landing/StarField';
import { Navbar } from '@/components/layout/Navbar';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@clerk/clerk-react';

function InviteCodeSection({ code, classroomId }: { code: string; classroomId: Id<"classrooms"> }) {
  const [copied, setCopied] = useState(false);
  const regenerateCode = useMutation(api.classrooms.regenerateInviteCode);
  const { toast } = useToast();

  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = async () => {
    try {
      const result = await regenerateCode({ classroomId });
      toast({
        title: 'Neuer Code generiert',
        description: `Der neue Einladungscode lautet: ${result.inviteCode}`,
      });
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Der Code konnte nicht neu generiert werden.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader>
        <CardTitle className="text-base">Einladungscode</CardTitle>
        <CardDescription>
          Teile diesen Code mit deinen Schülern
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <button
            onClick={copyCode}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-moon/10 hover:bg-moon/20 rounded-lg font-mono text-2xl text-moon transition-colors"
          >
            {code}
            {copied ? (
              <Check className="w-5 h-5" />
            ) : (
              <Copy className="w-5 h-5" />
            )}
          </button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRegenerate}
            title="Neuen Code generieren"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Schüler können unter meoluna.de/join diesen Code eingeben
        </p>
      </CardContent>
    </Card>
  );
}

function AssignWorldDialog({
  classroomId,
  userId,
  existingWorldIds
}: {
  classroomId: Id<"classrooms">;
  userId: string;
  existingWorldIds: string[];
}) {
  const [open, setOpen] = useState(false);
  const [selectedWorld, setSelectedWorld] = useState('');
  const [instructions, setInstructions] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const worlds = useQuery(api.worlds.listByUser, { userId });
  const publicWorlds = useQuery(api.worlds.listPublic, {});
  const assignWorld = useMutation(api.classrooms.assignWorld);
  const { toast } = useToast();

  // Kombiniere eigene und öffentliche Welten, filtere bereits zugewiesene
  const availableWorlds = [
    ...(worlds || []).filter((w: Doc<"worlds">) => !existingWorldIds.includes(w._id)),
    ...(publicWorlds || []).filter((w: Doc<"worlds">) =>
      !existingWorldIds.includes(w._id) &&
      w.userId !== userId
    ),
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorld) return;

    setIsLoading(true);
    try {
      const result = await assignWorld({
        classroomId,
        worldId: selectedWorld as Id<"worlds">,
        assignedBy: userId,
        instructions: instructions.trim() || undefined,
        dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
        isRequired: true,
      });

      if (result.success) {
        toast({
          title: 'Welt zugewiesen',
          description: 'Die Lernwelt wurde der Klasse zugewiesen.',
        });
        setOpen(false);
        setSelectedWorld('');
        setInstructions('');
        setDueDate('');
      } else {
        toast({
          title: 'Fehler',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Die Welt konnte nicht zugewiesen werden.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Welt zuweisen
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Lernwelt zuweisen</DialogTitle>
            <DialogDescription>
              Wähle eine Lernwelt aus, die du dieser Klasse zuweisen möchtest.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Lernwelt *</Label>
              <Select value={selectedWorld} onValueChange={setSelectedWorld}>
                <SelectTrigger>
                  <SelectValue placeholder="Welt auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  {availableWorlds.length === 0 ? (
                    <SelectItem value="_none" disabled>
                      Keine verfügbaren Welten
                    </SelectItem>
                  ) : (
                    availableWorlds.map((world) => (
                      <SelectItem key={world._id} value={world._id}>
                        {world.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="instructions">Anweisungen für Schüler</Label>
              <Textarea
                id="instructions"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Optionale Anweisungen..."
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dueDate">Fälligkeitsdatum</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={isLoading || !selectedWorld}>
              {isLoading ? 'Weise zu...' : 'Zuweisen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function ClassroomDetail() {
  const { classroomId } = useParams<{ classroomId: string }>();
  const { user } = useUser();
  const { toast } = useToast();

  const classroom = useQuery(
    api.classrooms.getById,
    classroomId ? { classroomId: classroomId as Id<"classrooms"> } : 'skip'
  );
  const members = useQuery(
    api.classrooms.getMembers,
    classroomId ? { classroomId: classroomId as Id<"classrooms"> } : 'skip'
  );

  const removeMember = useMutation(api.classrooms.removeMember);
  const removeAssignment = useMutation(api.classrooms.removeAssignment);

  const handleRemoveMember = async (userId: string) => {
    if (!classroomId) return;
    if (!confirm('Möchtest du diesen Schüler wirklich aus der Klasse entfernen?')) return;

    try {
      await removeMember({
        classroomId: classroomId as Id<"classrooms">,
        userId,
      });
      toast({
        title: 'Schüler entfernt',
        description: 'Der Schüler wurde aus der Klasse entfernt.',
      });
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Der Schüler konnte nicht entfernt werden.',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveAssignment = async (assignmentId: Id<"classroomAssignments">) => {
    if (!confirm('Möchtest du diese Zuweisung wirklich entfernen?')) return;

    try {
      await removeAssignment({ assignmentId });
      toast({
        title: 'Zuweisung entfernt',
        description: 'Die Lernwelt wurde von der Klasse entfernt.',
      });
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Die Zuweisung konnte nicht entfernt werden.',
        variant: 'destructive',
      });
    }
  };

  if (!classroom) {
    return (
      <div className="min-h-screen bg-background relative">
        <StarField />
        <Navbar />
        <main className="container mx-auto px-4 py-8 pt-24 relative z-10">
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72" />
            <div className="grid md:grid-cols-2 gap-6 mt-8">
              <Skeleton className="h-40" />
              <Skeleton className="h-40" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  const existingWorldIds = classroom.assignments?.map((a: any) => a.worldId) || [];

  return (
    <div className="min-h-screen bg-background relative">
      <StarField />
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-aurora/10 rounded-full blur-3xl animate-pulse-soft" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '3s' }} />
      </div>

      <Navbar />

      <main className="container mx-auto px-4 py-8 pt-24 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            to="/teacher"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück zum Dashboard
          </Link>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">{classroom.name}</h1>
              <p className="text-muted-foreground mt-1">
                {classroom.description || 'Keine Beschreibung'}
              </p>
              <div className="flex gap-2 mt-2">
                {classroom.gradeLevel && (
                  <Badge variant="secondary">{classroom.gradeLevel}</Badge>
                )}
                {classroom.subject && (
                  <Badge variant="outline">{classroom.subject}</Badge>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Invite Code + Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <InviteCodeSection
            code={classroom.inviteCode}
            classroomId={classroom._id}
          />
          <Card className="bg-card/50 border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-aurora/10">
                  <Users className="w-6 h-6 text-aurora" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{members?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Schüler</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-moon/10">
                  <BookOpen className="w-6 h-6 text-moon" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{classroom.assignments?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Lernwelten</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="students" className="space-y-6">
          <TabsList className="bg-card/50">
            <TabsTrigger value="students" className="gap-2">
              <Users className="w-4 h-4" />
              Schüler
            </TabsTrigger>
            <TabsTrigger value="assignments" className="gap-2">
              <BookOpen className="w-4 h-4" />
              Lernwelten
            </TabsTrigger>
          </TabsList>

          {/* Students Tab */}
          <TabsContent value="students">
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle>Schüler</CardTitle>
                <CardDescription>
                  Übersicht aller Schüler und deren Fortschritt
                </CardDescription>
              </CardHeader>
              <CardContent>
                {members && members.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Schüler</TableHead>
                        <TableHead>Beigetreten</TableHead>
                        <TableHead>XP gesamt</TableHead>
                        <TableHead>Fortschritt</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {members.map((member: any) => (
                        <TableRow key={member._id}>
                          <TableCell className="font-medium">
                            {member.userId.slice(0, 8)}...
                          </TableCell>
                          <TableCell>
                            {new Date(member.joinedAt).toLocaleDateString('de-DE')}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Trophy className="w-4 h-4 text-moon" />
                              {member.totalXP} XP
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress
                                value={
                                  member.totalAssignments > 0
                                    ? (member.completedAssignments / member.totalAssignments) * 100
                                    : 0
                                }
                                className="w-20 h-2"
                              />
                              <span className="text-sm text-muted-foreground">
                                {member.completedAssignments}/{member.totalAssignments}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleRemoveMember(member.userId)}
                            >
                              <UserMinus className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Noch keine Schüler in dieser Klasse</p>
                    <p className="text-sm mt-1">
                      Teile den Einladungscode, damit Schüler beitreten können
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assignments Tab */}
          <TabsContent value="assignments">
            <Card className="bg-card/50 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Zugewiesene Lernwelten</CardTitle>
                  <CardDescription>
                    Lernwelten, die dieser Klasse zugewiesen wurden
                  </CardDescription>
                </div>
                {user?.id && (
                  <AssignWorldDialog
                    classroomId={classroom._id}
                    userId={user.id}
                    existingWorldIds={existingWorldIds}
                  />
                )}
              </CardHeader>
              <CardContent>
                {classroom.assignments && classroom.assignments.length > 0 ? (
                  <div className="space-y-4">
                    {classroom.assignments.map((assignment: any) => (
                      <div
                        key={assignment._id}
                        className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-card/30"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium">
                            {assignment.world?.title || 'Unbekannte Welt'}
                          </h4>
                          {assignment.instructions && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {assignment.instructions}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            {assignment.dueDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Fällig: {new Date(assignment.dueDate).toLocaleDateString('de-DE')}
                              </span>
                            )}
                            <span>
                              Zugewiesen: {new Date(assignment.createdAt).toLocaleDateString('de-DE')}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link to={`/w/${assignment.worldId}`}>
                            <Button variant="outline" size="sm" className="gap-1">
                              <ExternalLink className="w-3 h-3" />
                              Öffnen
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleRemoveAssignment(assignment._id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Noch keine Lernwelten zugewiesen</p>
                    <p className="text-sm mt-1">
                      Weise dieser Klasse Lernwelten zu, die die Schüler bearbeiten sollen
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
