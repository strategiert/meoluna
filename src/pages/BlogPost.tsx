/**
 * BlogPost Page - Einzelner Artikel
 */

import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, User, Tag, Share2, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Navbar } from '@/components/layout/Navbar';

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  
  const post = useQuery(api.blog.getBySlug, { slug: slug ?? '' });

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title,
          text: post?.excerpt,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      // TODO: Show toast
    }
  };

  if (post === undefined) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 pt-24 pb-8 max-w-3xl">
          <Skeleton className="h-8 w-24 mb-8" />
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-6 w-48 mb-8" />
          <Skeleton className="h-64 w-full mb-8" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </main>
      </div>
    );
  }

  if (post === null) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center pt-24">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Artikel nicht gefunden</h1>
            <p className="text-muted-foreground mb-4">
              Dieser Artikel existiert nicht oder wurde entfernt.
            </p>
            <Button onClick={() => navigate('/blog')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zurück zum Blog
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Article */}
      <article className="container mx-auto px-4 pt-24 pb-8 max-w-3xl">
        {/* Back Link */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Link 
            to="/blog" 
            className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zum Blog
          </Link>
        </motion.div>

        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Badge variant="secondary" className="mb-4">
            {post.category}
          </Badge>
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
            {post.title}
          </h1>
          
          <p className="text-xl text-muted-foreground mb-6">
            {post.excerpt}
          </p>
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center">
              <User className="w-4 h-4 mr-1" />
              {post.author}
            </span>
            {post.publishedAt && (
              <span className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {formatDate(post.publishedAt)}
              </span>
            )}
            <Button variant="ghost" size="sm" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-1" />
              Teilen
            </Button>
          </div>
        </motion.header>

        {/* Cover Image */}
        {post.coverImage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 rounded-lg overflow-hidden"
          >
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full aspect-video object-cover"
            />
          </motion.div>
        )}

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="prose prose-lg dark:prose-invert max-w-none mb-12"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Tags */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap gap-2 mb-12"
        >
          {post.tags.map((tag) => (
            <Badge key={tag} variant="outline">
              <Tag className="w-3 h-3 mr-1" />
              {tag}
            </Badge>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-primary/10 to-purple-600/10 rounded-lg p-8 text-center"
        >
          <h2 className="text-2xl font-bold mb-2">
            Bereit, magisch zu lernen?
          </h2>
          <p className="text-muted-foreground mb-4">
            Erstelle deine eigenen interaktiven Lernwelten mit KI.
          </p>
          <Link to="/create">
            <Button size="lg">
              <Moon className="w-4 h-4 mr-2" />
              Jetzt starten
            </Button>
          </Link>
        </motion.div>
      </article>
    </div>
  );
}
