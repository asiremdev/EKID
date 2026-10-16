export interface AchievementSeed {
    code: string;
    title: string;
    description: string;
    icon: string;
    metric: 'stars' | 'streak' | 'level' | 'activities';
    threshold: number;
    starsReward: number;
    xpReward: number;
}
export declare const ACHIEVEMENTS: AchievementSeed[];
