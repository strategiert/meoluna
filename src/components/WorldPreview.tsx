/**
 * WorldPreview - Wrapper um die Sandbox
 *
 * Vereinfachte Version für Convex - Auto-Fix wird von App.tsx gesteuert
 */

import React, { useState, useCallback, useRef } from 'react';
import { Sandbox } from './Sandbox';

interface WorldPreviewProps {
  /** Der generierte React-Code */
  code: string;
  /** Callback um Code zu aktualisieren */
  onCodeUpdate?: (newCode: string) => void;
  /** Callback bei Fehlern (für Auto-Fix in App.tsx) */
  onError?: (error: string, code: string) => void;
}

export const WorldPreview: React.FC<WorldPreviewProps> = ({
  code,
  onCodeUpdate: _onCodeUpdate, // Reserved for future use
  onError
}) => {
  const [retryCount, setRetryCount] = useState(0);
  const retryCountRef = useRef(0);

  // Reset retry count when code changes
  React.useEffect(() => {
    retryCountRef.current = 0;
    setRetryCount(0);
  }, [code]);

  const handleError = useCallback((error: string, failedCode: string) => {
    // Nur 1 Auto-Fix Versuch um Rate Limits zu vermeiden
    if (!onError || retryCountRef.current >= 1) return;

    retryCountRef.current += 1;
    setRetryCount(retryCountRef.current);
    onError(error, failedCode);
  }, [onError]);

  const handleSuccess = useCallback(() => {
    // Success - could track analytics here
  }, []);

  return (
    <div className="relative w-full h-full">
      {/* Retry Count Badge */}
      {retryCount > 0 && (
        <div className="absolute top-2 left-14 z-10 bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-xs">
          {retryCount}x repariert
        </div>
      )}

      <Sandbox
        code={code}
        onError={handleError}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default WorldPreview;
