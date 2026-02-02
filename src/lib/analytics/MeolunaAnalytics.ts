import type {
  AnalyticsConfig,
  PageviewData,
  EventData,
  MeolunaEventType,
} from "./types";

// Storage keys
const STORAGE_KEYS = {
  ANONYMOUS_ID: "meoluna_anonymous_id",
  SESSION_ID: "meoluna_session_id",
  SESSION_START: "meoluna_session_start",
};

// Session timeout: 30 minutes
const SESSION_TIMEOUT = 30 * 60 * 1000;

/**
 * Meoluna Analytics - Server-Side First Tracking
 */
export class MeolunaAnalytics {
  private config: AnalyticsConfig;
  private anonymousId: string;
  private sessionId: string;
  private userId: string | null = null; // For identity resolution
  private initialized = false;
  private currentRoute: string = "";

  constructor(config: AnalyticsConfig) {
    this.config = config;
    this.anonymousId = this.getOrCreateAnonymousId();
    this.sessionId = this.getOrCreateSessionId();
  }

  /**
   * Initialize analytics - call once on app load
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    const urlParams = this.extractUrlParams();
    const pageviewData: PageviewData = {
      sessionId: this.sessionId,
      anonymousId: this.anonymousId,
      landingPage: window.location.href,
      referrer: document.referrer || undefined,
      ...urlParams,
    };

    await this.sendPageview(pageviewData);

    // Track session start
    await this.track("session_started", {
      platform: this.config.platform,
      userAgent: navigator.userAgent,
      language: navigator.language,
      screenSize: `${window.screen.width}x${window.screen.height}`,
    });

    this.currentRoute = window.location.pathname;
    this.initialized = true;

    if (this.config.debug) {
      console.log("[MeolunaAnalytics] Initialized", {
        anonymousId: this.anonymousId,
        sessionId: this.sessionId,
        urlParams,
      });
    }
  }

  /**
   * Link user ID after login/signup
   */
  setUserId(id: string, email?: string): void {
    this.userId = id;

    // Call identity linking endpoint
    this.linkIdentity(id, email);

    if (this.config.debug) {
      console.log("[MeolunaAnalytics] User linked", { userId: id, email: email ? "[SET]" : "[NOT SET]" });
    }
  }

  /**
   * Track a page view
   */
  async trackPageView(route: string): Promise<void> {
    const previousRoute = this.currentRoute;
    this.currentRoute = route;

    await this.track("page_viewed", {
      route,
      previousRoute,
      referrer: document.referrer || undefined,
    });
  }

  /**
   * Track a custom event
   */
  async track(eventType: MeolunaEventType | string, properties: Record<string, unknown> = {}): Promise<void> {
    const eventData: EventData = {
      canonicalUserId: this.anonymousId,
      sessionId: this.sessionId,
      eventType,
      eventData: properties,
      platform: this.config.platform,
      route: this.currentRoute,
    };

    await this.sendEvent(eventData);

    if (this.config.debug) {
      console.log("[MeolunaAnalytics] Event tracked", { eventType, properties });
    }
  }

  /**
   * Get the canonical user ID (logged-in userId or anonymousId)
   */
  getCanonicalUserId(): string {
    return this.userId || this.anonymousId;
  }

  /**
   * Get session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  // ---- Private Methods ----

  private getOrCreateAnonymousId(): string {
    let id = localStorage.getItem(STORAGE_KEYS.ANONYMOUS_ID);
    if (!id) {
      id = this.generateId();
      localStorage.setItem(STORAGE_KEYS.ANONYMOUS_ID, id);
    }
    return id;
  }

  private getOrCreateSessionId(): string {
    const existingId = sessionStorage.getItem(STORAGE_KEYS.SESSION_ID);
    const sessionStart = sessionStorage.getItem(STORAGE_KEYS.SESSION_START);

    // Check if session is still valid
    if (existingId && sessionStart) {
      const elapsed = Date.now() - parseInt(sessionStart, 10);
      if (elapsed < SESSION_TIMEOUT) {
        // Refresh session start time
        sessionStorage.setItem(STORAGE_KEYS.SESSION_START, Date.now().toString());
        return existingId;
      }
    }

    // Create new session
    const newId = this.generateId();
    sessionStorage.setItem(STORAGE_KEYS.SESSION_ID, newId);
    sessionStorage.setItem(STORAGE_KEYS.SESSION_START, Date.now().toString());
    return newId;
  }

  private generateId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 11)}`;
  }

  private extractUrlParams(): Partial<PageviewData> {
    const params = new URLSearchParams(window.location.search);
    return {
      fbclid: params.get("fbclid") || undefined,
      gclid: params.get("gclid") || undefined,
      ttclid: params.get("ttclid") || undefined,
      utm_source: params.get("utm_source") || undefined,
      utm_medium: params.get("utm_medium") || undefined,
      utm_campaign: params.get("utm_campaign") || undefined,
      utm_term: params.get("utm_term") || undefined,
      utm_content: params.get("utm_content") || undefined,
    };
  }

  private async sendPageview(data: PageviewData): Promise<void> {
    try {
      const response = await fetch(`${this.config.convexUrl}/api/track/pageview`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok && this.config.debug) {
        console.error("[MeolunaAnalytics] Pageview failed", response.status);
      }
    } catch (error) {
      if (this.config.debug) {
        console.error("[MeolunaAnalytics] Pageview error", error);
      }
    }
  }

  private async sendEvent(data: EventData): Promise<void> {
    try {
      const response = await fetch(`${this.config.convexUrl}/api/track/event`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok && this.config.debug) {
        console.error("[MeolunaAnalytics] Event failed", response.status);
      }
    } catch (error) {
      if (this.config.debug) {
        console.error("[MeolunaAnalytics] Event error", error);
      }
    }
  }

  private async linkIdentity(userId: string, email?: string): Promise<void> {
    // This would typically call a Convex mutation directly
    // For now, we'll track an event that triggers identity linking
    await this.track("user_identified", {
      userId,
      hasEmail: !!email,
    });
  }
}

// Singleton instance
let analyticsInstance: MeolunaAnalytics | null = null;

/**
 * Get or create the analytics singleton
 */
export function getAnalytics(config?: AnalyticsConfig): MeolunaAnalytics {
  if (!analyticsInstance && config) {
    analyticsInstance = new MeolunaAnalytics(config);
  }
  if (!analyticsInstance) {
    throw new Error("MeolunaAnalytics not initialized. Call getAnalytics(config) first.");
  }
  return analyticsInstance;
}

/**
 * Initialize analytics with Convex URL
 */
export function initAnalytics(convexUrl: string, debug = false): MeolunaAnalytics {
  return getAnalytics({
    convexUrl,
    platform: "web",
    debug,
  });
}
