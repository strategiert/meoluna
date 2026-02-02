// Meoluna Analytics Types

export type Platform = "web" | "ios" | "android";

// Event types for Meoluna
export type MeolunaEventType =
  | "session_started"
  | "page_viewed"
  | "signup_started"
  | "signup_completed"
  | "world_creation_started"
  | "world_generation_completed"
  | "world_opened"
  | "lesson_completed"
  | "classroom_created"
  | "classroom_joined"
  | "error";

// Event properties
export interface SessionStartedProps {
  platform: Platform;
  userAgent: string;
  language: string;
  screenSize: string;
}

export interface PageViewedProps {
  route: string;
  previousRoute?: string;
  referrer?: string;
}

export interface SignupStartedProps {
  signup_method: string;
}

export interface SignupCompletedProps {
  user_type: string;
  signup_method: string;
}

export interface WorldCreationStartedProps {
  entry_point: string;
  creation_method: "prompt" | "pdf";
}

export interface WorldGenerationCompletedProps {
  world_id: string;
  duration_ms: number;
  success: boolean;
  subject?: string;
}

export interface WorldOpenedProps {
  world_id: string;
  world_type: "own" | "public" | "assigned";
  open_source: "explore" | "dashboard" | "classroom" | "direct";
}

export interface LessonCompletedProps {
  world_id: string;
  lesson_id?: string;
  score?: number;
  time_ms?: number;
}

export interface ClassroomCreatedProps {
  classroom_id: string;
  subject?: string;
  grade_level?: string;
}

export interface ClassroomJoinedProps {
  classroom_id: string;
}

export interface ErrorProps {
  message: string;
  stack?: string;
  route?: string;
}

// Union type for all event properties
export type EventProperties =
  | SessionStartedProps
  | PageViewedProps
  | SignupStartedProps
  | SignupCompletedProps
  | WorldCreationStartedProps
  | WorldGenerationCompletedProps
  | WorldOpenedProps
  | LessonCompletedProps
  | ClassroomCreatedProps
  | ClassroomJoinedProps
  | ErrorProps
  | Record<string, unknown>;

// Analytics configuration
export interface AnalyticsConfig {
  convexUrl: string;
  platform: Platform;
  debug?: boolean;
}

// Click/Session data sent to server
export interface PageviewData {
  sessionId: string;
  anonymousId: string;
  landingPage: string;
  referrer?: string;
  fbclid?: string;
  gclid?: string;
  ttclid?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

// Event data sent to server
export interface EventData {
  canonicalUserId: string;
  sessionId: string;
  eventType: MeolunaEventType | string;
  eventData: Record<string, unknown>;
  platform: Platform;
  route?: string;
}
