/**
 * Join Classroom - Schüler tritt einer Klasse bei
 */

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { motion } from 'framer-motion';
import { Users, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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

export default function JoinClassroom() {
  const [searchParams] = useSearchParams();
  const initialCode = searchParams.get('code') || '';
  const [code, setCode] = useState(initialCode);
  const [isJoining, setIsJoining] = useState(false);
  const [joinResult, setJoinResult] = useState<{
    success: boolean;
    message: string;
    classroomName?: string;
  } | null>(null);

  const { user } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Preview der Klasse wenn Code eingegeben
  const classroomPreview = useQuery(
    api.classrooms.getByInviteCode,
    code.length === 6 ? { inviteCode: code.toUpperCase() } : 'skip'
  );

  const joinClassroom = useMutation(api.classrooms.joinWithCode);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || code.length !== 6) return;

    setIsJoining(true);
    setJoinResult(null);

    try {
      const result = await joinClassroom({
        inviteCode: code.toUpperCase(),
        userId: user.id,
      });

      if (result.success) {
        setJoinResult({
          success: true,
          message: `Du bist der Klasse "${result.classroomName}" beigetreten!`,
          classroomName: result.classroomName,
        });
        toast({
          title: 'Erfolgreich beigetreten!',
          description: `Du bist jetzt Mitglied der Klasse "${result.classroomName}"`,
        });
      } else {
        setJoinResult({
          success: false,
          message: result.error || 'Ein Fehler ist aufgetreten',
        });
      }
    } catch (error) {
      setJoinResult({
        success: false,
        message: 'Ein unerwarteter Fehler ist aufgetreten',
      });
    } finally {
      setIsJoining(false);
    }
  };

  const formatCode = (value: string) => {
    // Nur Buchstaben und Zahlen, max 6 Zeichen
    return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  };

  return (
    <div className="min-h-screen bg-background relative">
      <StarField />

      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-aurora/10 rounded-full blur-3xl animate-pulse-soft" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '3s' }} />
      </div>

      <Navbar />

      <main className="container mx-auto px-4 py-8 pt-24 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto"
        >
          <div className="text-center mb-8">
            <div className="relative inline-block mb-4">
              <div className="absolute inset-0 bg-moon/20 rounded-full blur-2xl scale-150" />
              <Users className="w-16 h-16 text-moon relative z-10" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Klasse beitreten</h1>
            <p className="text-muted-foreground">
              Gib den Einladungscode deines Lehrers ein
            </p>
          </div>

          <SignedOut>
            <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground mb-4">
                  Melde dich an, um einer Klasse beizutreten
                </p>
                <SignInButton mode="modal">
                  <Button className="gap-2 bg-gradient-to-r from-moon to-aurora hover:opacity-90 text-background font-medium">
                    Jetzt anmelden
                  </Button>
                </SignInButton>
              </CardContent>
            </Card>
          </SignedOut>

          <SignedIn>
            {joinResult?.success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
                  <CardContent className="pt-8 pb-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                    <h2 className="text-xl font-semibold mb-2">Willkommen!</h2>
                    <p className="text-muted-foreground mb-6">
                      {joinResult.message}
                    </p>
                    <Button
                      onClick={() => navigate('/dashboard')}
                      className="gap-2 bg-gradient-to-r from-moon to-aurora hover:opacity-90 text-background font-medium"
                    >
                      Zum Dashboard
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Einladungscode</CardTitle>
                  <CardDescription>
                    Der Code besteht aus 6 Zeichen
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Input
                        value={code}
                        onChange={(e) => setCode(formatCode(e.target.value))}
                        placeholder="ABC123"
                        className="text-center text-2xl font-mono tracking-widest h-14"
                        maxLength={6}
                        autoFocus
                      />
                    </div>

                    {/* Preview */}
                    {code.length === 6 && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        {classroomPreview ? (
                          <div className="p-4 rounded-lg bg-moon/5 border border-moon/20">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="p-2 rounded-lg bg-moon/10">
                                <Users className="w-5 h-5 text-moon" />
                              </div>
                              <div>
                                <h3 className="font-semibold">{classroomPreview.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {classroomPreview.description || 'Keine Beschreibung'}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2 mt-2">
                              {classroomPreview.gradeLevel && (
                                <Badge variant="secondary">{classroomPreview.gradeLevel}</Badge>
                              )}
                              {classroomPreview.subject && (
                                <Badge variant="outline">{classroomPreview.subject}</Badge>
                              )}
                            </div>
                          </div>
                        ) : classroomPreview === null ? (
                          <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20 flex items-center gap-3">
                            <XCircle className="w-5 h-5 text-destructive" />
                            <span className="text-sm text-destructive">
                              Ungültiger Einladungscode
                            </span>
                          </div>
                        ) : (
                          <div className="p-4 rounded-lg bg-muted/50 text-center">
                            <span className="text-sm text-muted-foreground">
                              Klasse wird gesucht...
                            </span>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* Error message */}
                    {joinResult && !joinResult.success && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm"
                      >
                        {joinResult.message}
                      </motion.div>
                    )}

                    <Button
                      type="submit"
                      disabled={code.length !== 6 || !classroomPreview || isJoining}
                      className="w-full gap-2 bg-gradient-to-r from-moon to-aurora hover:opacity-90 text-background font-medium"
                    >
                      {isJoining ? (
                        'Trete bei...'
                      ) : (
                        <>
                          <Users className="w-4 h-4" />
                          Klasse beitreten
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </SignedIn>
        </motion.div>
      </main>
    </div>
  );
}
