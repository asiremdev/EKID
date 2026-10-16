"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.genMath = genMath;
exports.genCounting = genCounting;
exports.genTapObject = genTapObject;
exports.genOddOneOut = genOddOneOut;
exports.genMemory = genMemory;
exports.genShadowMatch = genShadowMatch;
exports.genTracing = genTracing;
exports.genMatchPairs = genMatchPairs;
exports.genMissingLetter = genMissingLetter;
exports.genMissingNumber = genMissingNumber;
exports.genSequence = genSequence;
exports.genCategorization = genCategorization;
exports.genReading = genReading;
exports.genGeography = genGeography;
exports.genScience = genScience;
exports.genHistory = genHistory;
exports.genFractions = genFractions;
exports.genLogic = genLogic;
exports.genMaze = genMaze;
exports.genWordSearch = genWordSearch;
exports.genCrossword = genCrossword;
exports.genAlphabetMC = genAlphabetMC;
const pools_1 = require("./pools");
const slugify = (s) => s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
function reward(difficulty) {
    return { starsReward: 4 + difficulty * 2, xpReward: 8 + difficulty * 4 };
}
function choiceMeta(question, correct, distractors) {
    const options = [correct, ...distractors];
    const rot = question.length % options.length;
    const rotated = [...options.slice(rot), ...options.slice(0, rot)];
    return { question, options: rotated, answerIndex: rotated.indexOf(correct) };
}
function numericDistractors(answer, n = 2) {
    const set = new Set();
    let delta = 1;
    while (set.size < n) {
        if (answer + delta >= 0)
            set.add(answer + delta);
        if (set.size < n && answer - delta >= 0 && answer - delta !== answer)
            set.add(answer - delta);
        delta++;
    }
    return Array.from(set).map(String);
}
function genMath(age, difficulty, ops, max) {
    const out = [];
    const r = reward(difficulty);
    for (const op of ops) {
        for (let a = op === 'mul' || op === 'div' ? 1 : 0; a <= max; a++) {
            for (let b = op === 'mul' || op === 'div' ? 1 : 0; b <= max; b++) {
                let q;
                let ans;
                if (op === 'add') {
                    q = `${a} + ${b} = ?`;
                    ans = a + b;
                }
                else if (op === 'sub') {
                    if (b > a)
                        continue;
                    q = `${a} - ${b} = ?`;
                    ans = a - b;
                }
                else if (op === 'mul') {
                    q = `${a} × ${b} = ?`;
                    ans = a * b;
                }
                else {
                    const product = a * b;
                    q = `${product} ÷ ${a} = ?`;
                    ans = b;
                }
                out.push({
                    type: 'math',
                    slug: `${age}-math-${op}-${a}-${b}`,
                    title: 'Math Challenge',
                    description: q,
                    ageGroup: age,
                    difficulty,
                    subject: 'math',
                    ...r,
                    metadata: choiceMeta(q, String(ans), numericDistractors(ans)),
                });
            }
        }
    }
    return out;
}
function genCounting(age, difficulty, maxCount) {
    const out = [];
    const r = reward(difficulty);
    const targets = ['star', 'apple', 'cat', 'car', 'heart'];
    for (const t of targets) {
        for (let c = 1; c <= maxCount; c++) {
            const opts = [c - 1, c, c + 1].filter((x) => x >= 1);
            out.push({
                type: 'counting',
                slug: `${age}-count-${t}-${c}`,
                title: 'Count Them!',
                description: `How many ${t}s do you see?`,
                ageGroup: age,
                difficulty,
                subject: 'counting',
                ...r,
                metadata: { count: c, target: t, options: opts, answerIndex: opts.indexOf(c) },
            });
        }
    }
    return out;
}
function genTapObject(age, difficulty) {
    const out = [];
    const r = reward(difficulty);
    const cats = Object.entries(pools_1.CATEGORIES);
    for (const [name, items] of cats) {
        const others = cats.filter(([n]) => n !== name).flatMap(([, v]) => v);
        for (const target of items) {
            for (let count = 2; count <= 4; count++) {
                const distractors = others.slice(0, 2);
                out.push({
                    type: 'tap_object',
                    slug: `${age}-tap-${target}-${count}`,
                    title: `Tap the ${target}s`,
                    description: `Tap all the ${target}s`,
                    ageGroup: age,
                    difficulty,
                    subject: 'counting',
                    ...r,
                    metadata: { target, count, distractors },
                });
            }
        }
    }
    return out;
}
function genOddOneOut(age, difficulty) {
    const out = [];
    const r = reward(difficulty);
    const cats = Object.entries(pools_1.CATEGORIES);
    for (const [name, items] of cats) {
        const others = cats.filter(([n]) => n !== name).flatMap(([, v]) => v);
        for (let i = 0; i + 2 < items.length; i++) {
            const trio = items.slice(i, i + 3);
            for (let d = 0; d < Math.min(3, others.length); d++) {
                const odd = others[d];
                const arr = [...trio, odd];
                out.push({
                    type: 'odd_one_out',
                    slug: `${age}-odd-${name}-${i}-${d}`,
                    title: 'Odd One Out',
                    description: 'Which one does not belong?',
                    ageGroup: age,
                    difficulty,
                    subject: 'logic',
                    ...r,
                    metadata: { items: arr, answerIndex: 3 },
                });
            }
        }
    }
    return out;
}
function genMemory(age, difficulty) {
    const out = [];
    const r = reward(difficulty);
    for (const [name, items] of Object.entries(pools_1.CATEGORIES)) {
        for (let i = 0; i + 3 <= items.length; i++) {
            const cards = items.slice(i, i + 3);
            out.push({
                type: 'memory',
                slug: `${age}-memory-${name}-${i}`,
                title: 'Memory Match',
                description: 'Find the matching cards',
                ageGroup: age,
                difficulty,
                subject: 'memory',
                ...r,
                metadata: { cards, pairs: cards.length },
            });
        }
    }
    return out;
}
function genShadowMatch(age, difficulty) {
    const out = [];
    const r = reward(difficulty);
    for (const [name, items] of Object.entries(pools_1.CATEGORIES)) {
        for (let i = 0; i + 3 <= items.length; i++) {
            const objects = items.slice(i, i + 3);
            out.push({
                type: 'shadow_match',
                slug: `${age}-shadow-${name}-${i}`,
                title: 'Match the Shadow',
                description: 'Match each object to its shadow',
                ageGroup: age,
                difficulty,
                subject: 'logic',
                ...r,
                metadata: { objects },
            });
        }
    }
    return out;
}
function genTracing(age, difficulty) {
    const out = [];
    const r = reward(difficulty);
    for (const letter of pools_1.ALPHABET) {
        out.push({
            type: 'letter_tracing',
            slug: `${age}-trace-letter-${letter}`,
            title: `Trace the Letter ${letter}`,
            description: `Follow the path to trace ${letter}`,
            ageGroup: age,
            difficulty,
            subject: 'reading',
            ...r,
            metadata: { letter, strokes: [] },
        });
    }
    for (let n = 0; n <= 20; n++) {
        out.push({
            type: 'number_tracing',
            slug: `${age}-trace-number-${n}`,
            title: `Trace the Number ${n}`,
            description: `Follow the path to trace ${n}`,
            ageGroup: age,
            difficulty,
            subject: 'math',
            ...r,
            metadata: { number: n, strokes: [] },
        });
    }
    return out;
}
function genMatchPairs(age, difficulty) {
    const out = [];
    const r = reward(difficulty);
    for (let i = 0; i + 3 <= pools_1.ALPHABET.length; i += 3) {
        const letters = pools_1.ALPHABET.slice(i, i + 3);
        out.push({
            type: 'match_pairs',
            slug: `${age}-match-letters-${i}`,
            title: 'Match Capitals',
            description: 'Match uppercase to lowercase',
            ageGroup: age,
            difficulty,
            subject: 'reading',
            ...r,
            metadata: { pairs: letters.map((l) => [l, l.toLowerCase()]) },
        });
    }
    return out;
}
function genMissingLetter(age, difficulty) {
    const out = [];
    const r = reward(difficulty);
    const vowels = ['A', 'E', 'I', 'O', 'U'];
    for (const word of pools_1.SIMPLE_WORDS) {
        const idx = [...word].findIndex((c) => vowels.includes(c));
        if (idx === -1)
            continue;
        const masked = word.slice(0, idx) + '_' + word.slice(idx + 1);
        const correct = word[idx];
        const distractors = vowels.filter((v) => v !== correct).slice(0, 2);
        const options = [correct, ...distractors];
        const rot = word.length % options.length;
        const rotated = [...options.slice(rot), ...options.slice(0, rot)];
        out.push({
            type: 'missing_letter',
            slug: `${age}-missingletter-${slugify(word)}`,
            title: 'Missing Letter',
            description: `Complete the word ${masked}`,
            ageGroup: age,
            difficulty,
            subject: 'reading',
            ...r,
            metadata: { word, masked, options: rotated, answerIndex: rotated.indexOf(correct) },
        });
    }
    return out;
}
function genMissingNumber(age, difficulty, max) {
    const out = [];
    const r = reward(difficulty);
    for (let a = 1; a <= max; a++) {
        out.push({
            type: 'missing_number',
            slug: `${age}-missingnumber-${a}`,
            title: 'Missing Number',
            description: `What is missing? ${a}, _, ${a + 2}`,
            ageGroup: age,
            difficulty,
            subject: 'math',
            ...r,
            metadata: { sequence: [a, null, a + 2], answer: a + 1 },
        });
    }
    return out;
}
function genSequence(age, difficulty) {
    const out = [];
    const r = reward(difficulty);
    const pools = [pools_1.ANIMALS, pools_1.FRUITS, pools_1.VEHICLES, pools_1.SHAPES];
    for (const pool of pools) {
        for (let i = 0; i + 1 < pool.length; i++) {
            const a = pool[i];
            const b = pool[i + 1];
            const seq = [a, b, a, b];
            out.push({
                type: 'sequence',
                slug: `${age}-seq-${slugify(a)}-${slugify(b)}`,
                title: 'What Comes Next?',
                description: 'Continue the pattern',
                ageGroup: age,
                difficulty,
                subject: 'logic',
                ...r,
                metadata: { sequence: seq, options: [a, b], answerIndex: 0 },
            });
        }
    }
    return out;
}
function genCategorization(age, difficulty) {
    const out = [];
    const r = reward(difficulty);
    const cats = Object.entries(pools_1.CATEGORIES);
    for (let i = 0; i < cats.length; i++) {
        for (let j = i + 1; j < cats.length; j++) {
            const [n1, i1] = cats[i];
            const [n2, i2] = cats[j];
            const items = {};
            i1.slice(0, 2).forEach((it) => (items[it] = n1));
            i2.slice(0, 2).forEach((it) => (items[it] = n2));
            out.push({
                type: 'categorization',
                slug: `${age}-sort-${n1}-${n2}`,
                title: `Sort: ${n1} vs ${n2}`,
                description: 'Put each item in the right group',
                ageGroup: age,
                difficulty,
                subject: 'logic',
                ...r,
                metadata: { groups: [n1, n2], items },
            });
        }
    }
    return out;
}
function genReading(age, difficulty) {
    const r = reward(difficulty);
    return pools_1.READING_SENTENCES.map((s, i) => ({
        type: 'reading',
        slug: `${age}-reading-${i}`,
        title: 'Reading Time',
        description: 'Read the short sentence',
        ageGroup: age,
        difficulty,
        subject: 'reading',
        ...r,
        metadata: { text: s.text, question: s.question, answer: s.answer },
    }));
}
function genGeography(age, difficulty) {
    const r = reward(difficulty);
    return pools_1.CAPITALS.map((c, i) => {
        const distractors = pools_1.CAPITALS.filter((x) => x.capital !== c.capital)
            .slice(i, i + 2)
            .map((x) => x.capital);
        const fill = distractors.length === 2 ? distractors : [...distractors, pools_1.CAPITALS[(i + 3) % pools_1.CAPITALS.length].capital];
        const q = `Capital of ${c.country}?`;
        return {
            type: 'geography',
            slug: `${age}-geo-${slugify(c.country)}`,
            title: 'World Capitals',
            description: q,
            ageGroup: age,
            difficulty,
            subject: 'geography',
            ...r,
            metadata: choiceMeta(q, c.capital, fill),
        };
    });
}
function genScience(age, difficulty) {
    const r = reward(difficulty);
    return pools_1.SCIENCE_QA.map((s, i) => ({
        type: 'science',
        slug: `${age}-science-${i}`,
        title: 'Science Quiz',
        description: s.q,
        ageGroup: age,
        difficulty,
        subject: 'science',
        ...r,
        metadata: choiceMeta(s.q, s.a, s.d.slice(0, 2)),
    }));
}
function genHistory(age, difficulty) {
    const r = reward(difficulty);
    return pools_1.HISTORY_QA.map((s, i) => ({
        type: 'history',
        slug: `${age}-history-${i}`,
        title: 'History Quiz',
        description: s.q,
        ageGroup: age,
        difficulty,
        subject: 'history',
        ...r,
        metadata: choiceMeta(s.q, s.a, s.d.slice(0, 2)),
    }));
}
function genFractions(age, difficulty) {
    const out = [];
    const r = reward(difficulty);
    const fracs = ['1/2', '1/3', '1/4', '2/3', '3/4', '1/5'];
    for (let i = 0; i < fracs.length; i++) {
        for (let j = 0; j < fracs.length; j++) {
            if (i === j)
                continue;
            const q = `Which is bigger: ${fracs[i]} or ${fracs[j]}?`;
            const fracValue = (f) => {
                const [n, d] = f.split('/').map(Number);
                return n / d;
            };
            const correct = fracValue(fracs[i]) > fracValue(fracs[j]) ? fracs[i] : fracs[j];
            out.push({
                type: 'fractions',
                slug: `${age}-frac-${i}-${j}`,
                title: 'Fractions',
                description: q,
                ageGroup: age,
                difficulty,
                subject: 'fractions',
                ...r,
                metadata: { question: q, options: [fracs[i], fracs[j]], answerIndex: correct === fracs[i] ? 0 : 1 },
            });
        }
    }
    return out;
}
function genLogic(age, difficulty) {
    const out = [];
    const r = reward(difficulty);
    for (let i = 1; i <= 20; i++) {
        const q = `What comes next? ${i}, ${i * 2}, ${i * 3}, ?`;
        const ans = i * 4;
        out.push({
            type: 'logic',
            slug: `${age}-logic-mult-${i}`,
            title: 'Logic Puzzle',
            description: q,
            ageGroup: age,
            difficulty,
            subject: 'logic',
            ...r,
            metadata: choiceMeta(q, String(ans), numericDistractors(ans)),
        });
    }
    return out;
}
function genMaze(age, difficulty) {
    const out = [];
    const r = reward(difficulty);
    for (let grid = 4; grid <= 7; grid++) {
        for (let v = 0; v < 8; v++) {
            out.push({
                type: 'maze',
                slug: `${age}-maze-${grid}-${v}`,
                title: 'Find the Exit',
                description: 'Guide the fox to the exit',
                ageGroup: age,
                difficulty,
                subject: 'logic',
                ...r,
                metadata: { grid, start: [0, 0], end: [grid - 1, grid - 1], seed: v },
            });
        }
    }
    return out;
}
function genWordSearch(age, difficulty) {
    const out = [];
    const r = reward(difficulty);
    for (let i = 0; i + 4 <= pools_1.SIMPLE_WORDS.length; i += 2) {
        const words = pools_1.SIMPLE_WORDS.slice(i, i + 4);
        out.push({
            type: 'word_search',
            slug: `${age}-wordsearch-${i}`,
            title: 'Word Search',
            description: 'Find the hidden words',
            ageGroup: age,
            difficulty,
            subject: 'reading',
            ...r,
            metadata: { size: 8, words },
        });
    }
    return out;
}
function genCrossword(age, difficulty) {
    const out = [];
    const r = reward(difficulty);
    for (let i = 0; i + 1 < pools_1.SIMPLE_WORDS.length; i += 2) {
        const across = pools_1.SIMPLE_WORDS[i];
        const down = pools_1.SIMPLE_WORDS[i + 1];
        out.push({
            type: 'crossword',
            slug: `${age}-crossword-${i}`,
            title: 'Mini Crossword',
            description: 'Fill in the crossword',
            ageGroup: age,
            difficulty,
            subject: 'reading',
            ...r,
            metadata: { across: { 1: across }, down: { 1: down }, size: 3 },
        });
    }
    return out;
}
function genAlphabetMC(age, difficulty) {
    const out = [];
    const r = reward(difficulty);
    for (let i = 0; i < pools_1.ALPHABET.length - 1; i++) {
        const q = `Which letter comes after ${pools_1.ALPHABET[i]}?`;
        const correct = pools_1.ALPHABET[i + 1];
        const distractors = [pools_1.ALPHABET[(i + 3) % 26], pools_1.ALPHABET[(i + 5) % 26]];
        out.push({
            type: 'multiple_choice',
            slug: `${age}-alpha-after-${pools_1.ALPHABET[i]}`,
            title: 'Alphabet',
            description: q,
            ageGroup: age,
            difficulty,
            subject: 'reading',
            ...r,
            metadata: choiceMeta(q, correct, distractors),
        });
    }
    return out;
}
//# sourceMappingURL=factories.js.map