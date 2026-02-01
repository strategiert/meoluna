/**
 * Meoluna - Magische Lernwelten
 * App mit Routing
 */

import { Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

// Pages
import Index from '@/pages/Index';
import Dashboard from '@/pages/Dashboard';
import Create from '@/pages/Create';
import WorldView from '@/pages/WorldView';
import Explore from '@/pages/Explore';
import NotFound from '@/pages/NotFound';

export default function App() {
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
        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  );
}
