import { ActivityType, AgeGroup } from '@prisma/client';
export interface ActivitySeed {
    type: ActivityType;
    slug: string;
    title: string;
    description: string;
    ageGroup: AgeGroup;
    difficulty: number;
    subject: string;
    starsReward: number;
    xpReward: number;
    metadata: Record<string, unknown>;
}
export declare const ACTIVITIES: ActivitySeed[];
