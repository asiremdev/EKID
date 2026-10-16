import { ActivityType, AgeGroup } from '@prisma/client';
export interface GeneratedActivity {
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
export declare function genMath(age: AgeGroup, difficulty: number, ops: ('add' | 'sub' | 'mul' | 'div')[], max: number): GeneratedActivity[];
export declare function genCounting(age: AgeGroup, difficulty: number, maxCount: number): GeneratedActivity[];
export declare function genTapObject(age: AgeGroup, difficulty: number): GeneratedActivity[];
export declare function genOddOneOut(age: AgeGroup, difficulty: number): GeneratedActivity[];
export declare function genMemory(age: AgeGroup, difficulty: number): GeneratedActivity[];
export declare function genShadowMatch(age: AgeGroup, difficulty: number): GeneratedActivity[];
export declare function genTracing(age: AgeGroup, difficulty: number): GeneratedActivity[];
export declare function genMatchPairs(age: AgeGroup, difficulty: number): GeneratedActivity[];
export declare function genMissingLetter(age: AgeGroup, difficulty: number): GeneratedActivity[];
export declare function genMissingNumber(age: AgeGroup, difficulty: number, max: number): GeneratedActivity[];
export declare function genSequence(age: AgeGroup, difficulty: number): GeneratedActivity[];
export declare function genCategorization(age: AgeGroup, difficulty: number): GeneratedActivity[];
export declare function genReading(age: AgeGroup, difficulty: number): {
    metadata: {
        text: string;
        question: string;
        answer: string;
    };
    starsReward: number;
    xpReward: number;
    type: ActivityType;
    slug: string;
    title: string;
    description: string;
    ageGroup: import(".prisma/client").$Enums.AgeGroup;
    difficulty: number;
    subject: string;
}[];
export declare function genGeography(age: AgeGroup, difficulty: number): {
    metadata: {
        question: string;
        options: string[];
        answerIndex: number;
    };
    starsReward: number;
    xpReward: number;
    type: ActivityType;
    slug: string;
    title: string;
    description: string;
    ageGroup: import(".prisma/client").$Enums.AgeGroup;
    difficulty: number;
    subject: string;
}[];
export declare function genScience(age: AgeGroup, difficulty: number): {
    metadata: {
        question: string;
        options: string[];
        answerIndex: number;
    };
    starsReward: number;
    xpReward: number;
    type: ActivityType;
    slug: string;
    title: string;
    description: string;
    ageGroup: import(".prisma/client").$Enums.AgeGroup;
    difficulty: number;
    subject: string;
}[];
export declare function genHistory(age: AgeGroup, difficulty: number): {
    metadata: {
        question: string;
        options: string[];
        answerIndex: number;
    };
    starsReward: number;
    xpReward: number;
    type: ActivityType;
    slug: string;
    title: string;
    description: string;
    ageGroup: import(".prisma/client").$Enums.AgeGroup;
    difficulty: number;
    subject: string;
}[];
export declare function genFractions(age: AgeGroup, difficulty: number): GeneratedActivity[];
export declare function genLogic(age: AgeGroup, difficulty: number): GeneratedActivity[];
export declare function genMaze(age: AgeGroup, difficulty: number): GeneratedActivity[];
export declare function genWordSearch(age: AgeGroup, difficulty: number): GeneratedActivity[];
export declare function genCrossword(age: AgeGroup, difficulty: number): GeneratedActivity[];
export declare function genAlphabetMC(age: AgeGroup, difficulty: number): GeneratedActivity[];
