import type { Activity } from '../../lib/api/types';

export interface RendererProps {
  activity: Activity;
  /** Called once the activity is finished, with a score 0..100. */
  onComplete: (score: number, answers?: Record<string, unknown>) => void;
}

export type ActivityRenderer = React.ComponentType<RendererProps>;
