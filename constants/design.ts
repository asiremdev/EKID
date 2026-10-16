import type { AgeGroup } from '../lib/api/types';

export const AGE_GROUPS = [
  {
    id: 'AGE_3_5' as AgeGroup,
    label: 'Little Sprouts',
    range: '3–5',
    emoji: '🌱',
    color: '#FF6FA5',
    blurb: 'Color Garden — 50 levels across 5 color worlds',
    game: 'Color Garden',
  },
  {
    id: 'AGE_5_7' as AgeGroup,
    label: 'Curious Kids',
    range: '5–7',
    emoji: '🔢',
    color: '#4FC3F7',
    blurb: 'Number Quest — 50 levels across 5 math worlds',
    game: 'Number Quest',
  },
  {
    id: 'AGE_7_10' as AgeGroup,
    label: 'Word Wizards',
    range: '7–10',
    emoji: '📚',
    color: '#7C6FF7',
    blurb: 'Word Lab — 50 levels across 5 word worlds',
    game: 'Word Lab',
  },
];

export function ageGroupMeta(id: AgeGroup) {
  return AGE_GROUPS.find((g) => g.id === id) ?? AGE_GROUPS[0];
}

export const AVATARS = [
  { id: 'fox', emoji: '🦊', color: '#FF8A3D' },
  { id: 'lion', emoji: '🦁', color: '#FFC53D' },
  { id: 'panda', emoji: '🐼', color: '#8E8E93' },
  { id: 'unicorn', emoji: '🦄', color: '#7C6FF7' },
];

export function avatarFor(id?: string | null) {
  return AVATARS.find((a) => a.id === id) ?? AVATARS[0];
}

export function subjectMeta(_subject?: string | null) {
  return { emoji: '⭐', color: '#7C6FF7', label: 'Game' };
}

/** Apps parents can block on the child's device (package names). */
export const COMMON_BLOCKED_APPS = [
  { packageName: 'com.google.android.youtube', appName: 'YouTube', emoji: '▶️' },
  { packageName: 'com.facebook.katana', appName: 'Facebook', emoji: '📘' },
  { packageName: 'com.instagram.android', appName: 'Instagram', emoji: '📷' },
  { packageName: 'com.zhiliaoapp.musically', appName: 'TikTok', emoji: '🎵' },
  { packageName: 'com.snapchat.android', appName: 'Snapchat', emoji: '👻' },
  { packageName: 'com.roblox.client', appName: 'Roblox', emoji: '🎮' },
  { packageName: 'com.android.chrome', appName: 'Chrome', emoji: '🌐' },
  { packageName: 'com.netflix.mediaclient', appName: 'Netflix', emoji: '🎬' },
  { packageName: 'com.discord', appName: 'Discord', emoji: '💬' },
  { packageName: 'com.google.android.apps.youtube.kids', appName: 'YouTube Kids', emoji: '▶️' },
];
