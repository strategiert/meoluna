/**
 * Meoluna - Magische Lernwelten
 * App mit Routing
 */

import { Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useUserSync } from '@/hooks/useUserSync';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useAnimatedTitle } from '@/hooks/useAnimatedTitle';

// Pages
import Index from '@/pages/Index';
import Dashboard from '@/pages/Dashboard';
import Create from '@/pages/Create';
import WorldView from '@/pages/WorldView';
import Explore from '@/pages/Explore';
import Blog from '@/pages/Blog';
import BlogPost from '@/pages/BlogPost';
import About from '@/pages/About';
import Contact from '@/pages/Contact';
import Privacy from '@/pages/Privacy';
import Imprint from '@/pages/Imprint';
import Terms from '@/pages/Terms';
import TeacherDashboard from '@/pages/TeacherDashboard';
import ClassroomDetail from '@/pages/ClassroomDetail';
import JoinClassroom from '@/pages/JoinClassroom';
import NotFound from '@/pages/NotFound';
import BackgroundsDemo from '@/pages/demo/Backgrounds';

export default function App() {
  useUserSync();
  useAnalytics();
  useAnimatedTitle();

  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/create" element={<Create />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/w/:worldId" element={<WorldView />} />
        {/* Blog */}
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        {/* Teacher / Classroom */}
        <Route path="/teacher" element={<TeacherDashboard />} />
        <Route path="/teacher/classroom/:classroomId" element={<ClassroomDetail />} />
        <Route path="/join" element={<JoinClassroom />} />
        {/* Static Pages */}
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/imprint" element={<Imprint />} />
        <Route path="/terms" element={<Terms />} />
        {/* Demo Pages */}
        <Route path="/demo/backgrounds" element={<BackgroundsDemo />} />
        {/* Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  );
}
