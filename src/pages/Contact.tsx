/**
 * Contact Page - Kontakt
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, MessageSquare, Twitter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Navbar } from '@/components/layout/Navbar';
import { useState } from 'react';

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement form submission
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 pt-24 pb-16 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold mb-4">Kontakt</h1>
          <p className="text-lg text-muted-foreground">
            Hast du Fragen, Feedback oder Ideen? Wir freuen uns von dir zu hören!
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Nachricht senden</CardTitle>
                <CardDescription>
                  Fülle das Formular aus und wir melden uns so schnell wie möglich.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {submitted ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-primary mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nachricht gesendet!</h3>
                    <p className="text-muted-foreground">
                      Danke für deine Nachricht. Wir antworten so schnell wie möglich.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input id="name" placeholder="Dein Name" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-Mail</Label>
                      <Input id="email" type="email" placeholder="deine@email.de" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Betreff</Label>
                      <Input id="subject" placeholder="Worum geht es?" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Nachricht</Label>
                      <Textarea 
                        id="message" 
                        placeholder="Deine Nachricht..." 
                        rows={5} 
                        required 
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      <Mail className="w-4 h-4 mr-2" />
                      Absenden
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  E-Mail
                </CardTitle>
              </CardHeader>
              <CardContent>
                <a 
                  href="mailto:hello@meoluna.com" 
                  className="text-primary hover:underline"
                >
                  hello@meoluna.com
                </a>
                <p className="text-sm text-muted-foreground mt-2">
                  Für allgemeine Anfragen und Feedback.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Twitter className="w-5 h-5" />
                  Social Media
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Folge uns für Updates, Tipps und Neuigkeiten.
                </p>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://twitter.com/meoluna" target="_blank" rel="noopener noreferrer">
                      Twitter
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://instagram.com/meoluna" target="_blank" rel="noopener noreferrer">
                      Instagram
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-primary/10 to-purple-600/10 border-primary/20">
              <CardHeader>
                <CardTitle>FAQ</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Viele Fragen werden in unserem Blog beantwortet.
                </p>
                <Link to="/blog">
                  <Button variant="outline">Zum Blog</Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
