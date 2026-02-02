import { useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { initAnalytics, getAnalytics, MeolunaAnalytics } from "@/lib/analytics/MeolunaAnalytics";
import type { MeolunaEventType } from "@/lib/analytics/types";

/**
 * Hook to initialize and use Meoluna Analytics
 *
 * Features:
 * - Auto-initializes on first render
 * - Tracks page views on route changes
 * - Links user ID when authenticated
 */
export function useAnalytics() {
  const location = useLocation();
  const { user, isLoaded } = useUser();
  const analyticsRef = useRef<MeolunaAnalytics | null>(null);
  const initializedRef = useRef(false);
  const linkedUserRef = useRef<string | null>(null);

  // Initialize analytics on mount
  useEffect(() => {
    if (initializedRef.current) return;

    const convexUrl = import.meta.env.VITE_CONVEX_URL;
    if (!convexUrl) {
      console.warn("[useAnalytics] VITE_CONVEX_URL not set, analytics disabled");
      return;
    }

    const isDebug = import.meta.env.DEV;
    analyticsRef.current = initAnalytics(convexUrl, isDebug);
    analyticsRef.current.init();
    initializedRef.current = true;
  }, []);

  // Track page views on route change
  useEffect(() => {
    if (!analyticsRef.current || !initializedRef.current) return;

    analyticsRef.current.trackPageView(location.pathname);
  }, [location.pathname]);

  // Link user ID when authenticated
  useEffect(() => {
    if (!analyticsRef.current || !isLoaded) return;

    if (user && linkedUserRef.current !== user.id) {
      analyticsRef.current.setUserId(
        user.id,
        user.primaryEmailAddress?.emailAddress
      );
      linkedUserRef.current = user.id;
    }
  }, [user, isLoaded]);

  // Track custom event function
  const track = useCallback(
    async (eventType: MeolunaEventType | string, properties: Record<string, unknown> = {}) => {
      if (!analyticsRef.current) return;
      await analyticsRef.current.track(eventType, properties);
    },
    []
  );

  // Get analytics instance for advanced usage
  const getAnalyticsInstance = useCallback(() => {
    return analyticsRef.current;
  }, []);

  return {
    track,
    getAnalyticsInstance,
    isReady: initializedRef.current,
  };
}
