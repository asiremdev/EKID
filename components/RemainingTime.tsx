import React, { useEffect, useState } from 'react';
import { KText } from './ui/KText';

export function useRemainingSeconds(expiresAt: number | null): number {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!expiresAt) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [expiresAt]);
  if (!expiresAt) return 0;
  return Math.max(0, Math.round((expiresAt - now) / 1000));
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function RemainingTime({ expiresAt, color }: { expiresAt: number | null; color?: string }) {
  const remaining = useRemainingSeconds(expiresAt);
  return (
    <KText variant="label" color={color}>
      ⏱️ {formatDuration(remaining)}
    </KText>
  );
}
