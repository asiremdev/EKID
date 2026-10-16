import React from 'react';
import type { ActivityType } from '../../lib/api/types';
import { ActivityRenderer, RendererProps } from './types';
import { QuizRenderer } from './QuizRenderer';
import { TapObjectRenderer } from './TapObjectRenderer';
import { MatchRenderer } from './MatchRenderer';
import { MemoryRenderer } from './MemoryRenderer';
import { MissingNumberRenderer } from './MissingNumberRenderer';
import { CategorizationRenderer } from './CategorizationRenderer';
import { ReadingRenderer } from './ReadingRenderer';
import { TracingRenderer } from './TracingRenderer';
import { FallbackRenderer } from './FallbackRenderer';

/** Maps every activity type to a concrete, reusable renderer. */
export const RENDERERS: Record<ActivityType, ActivityRenderer> = {
  // Choice-based
  multiple_choice: QuizRenderer,
  sequence: QuizRenderer,
  missing_letter: QuizRenderer,
  odd_one_out: QuizRenderer,
  counting: QuizRenderer,
  geography: QuizRenderer,
  science: QuizRenderer,
  history: QuizRenderer,
  fractions: QuizRenderer,
  math: QuizRenderer,
  logic: QuizRenderer,
  // Specialized
  missing_number: MissingNumberRenderer,
  tap_object: TapObjectRenderer,
  match_pairs: MatchRenderer,
  shadow_match: MatchRenderer,
  memory: MemoryRenderer,
  categorization: CategorizationRenderer,
  reading: ReadingRenderer,
  letter_tracing: TracingRenderer,
  number_tracing: TracingRenderer,
  // Construction-style (interactive-lite)
  puzzle: FallbackRenderer,
  maze: FallbackRenderer,
  word_search: FallbackRenderer,
  crossword: FallbackRenderer,
};

export function ActivityEngine({ activity, onComplete }: RendererProps) {
  const Renderer = RENDERERS[activity.type] ?? FallbackRenderer;
  // `logic` may carry a free-form { prompt, answer } shape rather than options.
  if (activity.type === 'logic' && !Array.isArray(activity.metadata?.options)) {
    return <FallbackRenderer activity={activity} onComplete={onComplete} />;
  }
  return <Renderer activity={activity} onComplete={onComplete} />;
}
