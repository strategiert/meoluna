import { useEffect, useRef } from "react";
import { useUser } from "@clerk/clerk-react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

/**
 * Syncs Clerk user data to Convex users table.
 * Runs once per session when user is signed in.
 */
export function useUserSync() {
  const { user, isSignedIn } = useUser();
  const syncUser = useMutation(api.users.syncUser);
  const hasSynced = useRef(false);

  useEffect(() => {
    if (!isSignedIn || !user || hasSynced.current) return;

    hasSynced.current = true;

    syncUser({
      clerkId: user.id,
      email: user.primaryEmailAddress?.emailAddress,
      name: user.fullName ?? user.firstName ?? undefined,
      imageUrl: user.imageUrl,
    }).catch((err) => {
      console.error("User sync failed:", err);
      // Retry erlauben bei nächstem Render
      hasSynced.current = false;
    });
  }, [isSignedIn, user, syncUser]);
}
