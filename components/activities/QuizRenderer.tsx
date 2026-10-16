import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { SPACING } from '../../constants/theme';
import { KText } from '../ui/KText';
import { KButton } from '../ui/KButton';
import { ActivityShell } from './ActivityShell';
import { OptionButton } from './OptionButton';
import { RendererProps } from './types';
import { emojiFor, hasEmoji } from './emoji';

interface Normalized {
  prompt: string;
  options: string[];
  answerIndex: number;
  visual?: React.ReactNode;
  bigOptions?: boolean;
}

function repeatEmoji(word: string | number, n: number) {
  return Array.from({ length: n }).map(() => emojiFor(word)).join(' ');
}

/** Normalizes the many choice-based activity types into one quiz shape. */
function normalize(activity: RendererProps['activity']): Normalized {
  const m = activity.metadata ?? {};
  const fallbackPrompt = activity.description || activity.title;

  switch (activity.type) {
    case 'counting': {
      const count = Number(m.count ?? 0);
      return {
        prompt: 'How many do you see?',
        options: (m.options ?? []).map(String),
        answerIndex: Number(m.answerIndex ?? 0),
        visual: <KText style={{ fontSize: 40, textAlign: 'center' }}>{repeatEmoji('star', count)}</KText>,
        bigOptions: true,
      };
    }
    case 'sequence': {
      const seq = (m.sequence ?? []) as (string | number)[];
      return {
        prompt: 'What comes next?',
        options: (m.options ?? []).map(String),
        answerIndex: Number(m.answerIndex ?? 0),
        visual: (
          <KText style={{ fontSize: 40, textAlign: 'center' }}>
            {seq.map((s) => (hasEmoji(s) ? emojiFor(s) : `${s} `)).join(' ')} ❓
          </KText>
        ),
      };
    }
    case 'odd_one_out': {
      const items = (m.items ?? []) as (string | number)[];
      return {
        prompt: 'Which one does not belong?',
        options: items.map((i) => (hasEmoji(i) ? emojiFor(i) : String(i))),
        answerIndex: Number(m.answerIndex ?? 0),
        bigOptions: true,
      };
    }
    case 'missing_letter': {
      return {
        prompt: `Complete the word`,
        options: (m.options ?? []).map(String),
        answerIndex: Number(m.answerIndex ?? 0),
        visual: <KText style={{ fontSize: 56, textAlign: 'center', letterSpacing: 6 }}>{String(m.masked ?? '')}</KText>,
        bigOptions: true,
      };
    }
    default:
      // multiple_choice, geography, science, history, fractions, math, logic-as-choice
      return {
        prompt: String(m.question ?? fallbackPrompt),
        options: (m.options ?? []).map(String),
        answerIndex: Number(m.answerIndex ?? 0),
      };
  }
}

export function QuizRenderer({ activity, onComplete }: RendererProps) {
  const n = useMemo(() => normalize(activity), [activity]);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  const isCorrect = selected === n.answerIndex;

  const finish = () => onComplete(isCorrect ? 100 : 0, { selected });

  return (
    <ActivityShell prompt={n.prompt} step={0} total={1}>
      {n.visual ? <View style={{ marginBottom: SPACING.lg }}>{n.visual}</View> : null}

      {n.options.map((opt, i) => {
        let state: 'idle' | 'correct' | 'wrong' | 'selected' = 'idle';
        if (revealed) {
          if (i === n.answerIndex) state = 'correct';
          else if (i === selected) state = 'wrong';
        } else if (i === selected) state = 'selected';
        return (
          <OptionButton
            key={i}
            label={opt}
            big={n.bigOptions}
            state={state}
            disabled={revealed}
            onPress={() => setSelected(i)}
          />
        );
      })}

      {!revealed ? (
        <KButton label="Check" disabled={selected === null} onPress={() => setRevealed(true)} />
      ) : (
        <KButton
          label={isCorrect ? 'Continue 🎉' : 'Continue'}
          variant={isCorrect ? 'success' : 'primary'}
          onPress={finish}
        />
      )}
    </ActivityShell>
  );
}
