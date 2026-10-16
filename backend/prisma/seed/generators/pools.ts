// Content pools used by the activity generators. Words are chosen to render
// nicely with the client's emoji map where possible.

export const ANIMALS = ['cat', 'dog', 'cow', 'pig', 'lion', 'elephant', 'giraffe'];
export const FRUITS = ['apple', 'banana', 'orange', 'cherry', 'grape', 'strawberry'];
export const VEHICLES = ['car', 'bus', 'truck', 'plane', 'boat', 'train'];
export const SHAPES = ['circle', 'square', 'triangle', 'star', 'heart'];

export const CATEGORIES: Record<string, string[]> = {
  animals: ANIMALS,
  fruits: FRUITS,
  vehicles: VEHICLES,
  shapes: SHAPES,
};

export const SIMPLE_WORDS = [
  'CAT', 'DOG', 'COW', 'PIG', 'SUN', 'HAT', 'BED', 'CUP', 'BOX', 'PEN',
  'BUS', 'CAR', 'FOX', 'OWL', 'BEE', 'ANT', 'EGG', 'MAP', 'NET', 'JAM',
];

export const READING_SENTENCES: { text: string; question: string; answer: string }[] = [
  { text: 'The cat sat on the mat.', question: 'Where did the cat sit?', answer: 'mat' },
  { text: 'The dog ran in the park.', question: 'Where did the dog run?', answer: 'park' },
  { text: 'A bird flew over the tree.', question: 'What flew over the tree?', answer: 'bird' },
  { text: 'Sam ate a red apple.', question: 'What did Sam eat?', answer: 'apple' },
  { text: 'The sun is very hot.', question: 'What is hot?', answer: 'sun' },
  { text: 'We saw a big blue whale.', question: 'What color was the whale?', answer: 'blue' },
  { text: 'The frog jumped in the pond.', question: 'Where did the frog jump?', answer: 'pond' },
  { text: 'My ball is round and bouncy.', question: 'What shape is the ball?', answer: 'round' },
  { text: 'The bus stops at the school.', question: 'Where does the bus stop?', answer: 'school' },
  { text: 'She put milk in her tea.', question: 'What did she put in her tea?', answer: 'milk' },
];

export const CAPITALS: { country: string; capital: string }[] = [
  { country: 'France', capital: 'Paris' },
  { country: 'Italy', capital: 'Rome' },
  { country: 'Spain', capital: 'Madrid' },
  { country: 'Japan', capital: 'Tokyo' },
  { country: 'Egypt', capital: 'Cairo' },
  { country: 'Canada', capital: 'Ottawa' },
  { country: 'Germany', capital: 'Berlin' },
  { country: 'Greece', capital: 'Athens' },
  { country: 'Russia', capital: 'Moscow' },
  { country: 'Brazil', capital: 'Brasilia' },
  { country: 'China', capital: 'Beijing' },
  { country: 'India', capital: 'New Delhi' },
  { country: 'Kenya', capital: 'Nairobi' },
  { country: 'Norway', capital: 'Oslo' },
  { country: 'Peru', capital: 'Lima' },
  { country: 'Cuba', capital: 'Havana' },
];

export const SCIENCE_QA: { q: string; a: string; d: string[] }[] = [
  { q: 'Frozen water is called?', a: 'Ice', d: ['Steam', 'Rain', 'Snow'] },
  { q: 'What do plants need to grow?', a: 'Sunlight', d: ['Candy', 'Plastic', 'Glass'] },
  { q: 'How many legs does a spider have?', a: '8', d: ['6', '4', '10'] },
  { q: 'The closest star to Earth is?', a: 'The Sun', d: ['The Moon', 'Mars', 'Pluto'] },
  { q: 'What gas do we breathe in?', a: 'Oxygen', d: ['Helium', 'Smoke', 'Sugar'] },
  { q: 'Which animal lays eggs?', a: 'Chicken', d: ['Dog', 'Cat', 'Cow'] },
  { q: 'Water boils into?', a: 'Steam', d: ['Ice', 'Sand', 'Wood'] },
  { q: 'The center of our solar system is?', a: 'The Sun', d: ['Earth', 'Mars', 'Jupiter'] },
  { q: 'A baby frog is called a?', a: 'Tadpole', d: ['Puppy', 'Kitten', 'Calf'] },
  { q: 'Which is a magnet attracted to?', a: 'Iron', d: ['Wood', 'Paper', 'Water'] },
];

export const HISTORY_QA: { q: string; a: string; d: string[] }[] = [
  { q: 'First US president?', a: 'Washington', d: ['Lincoln', 'Jefferson', 'Adams'] },
  { q: 'The Great Wall is in?', a: 'China', d: ['Egypt', 'India', 'Peru'] },
  { q: 'Pyramids were built in?', a: 'Egypt', d: ['Italy', 'Greece', 'Spain'] },
  { q: 'Who painted the Mona Lisa?', a: 'Da Vinci', d: ['Picasso', 'Van Gogh', 'Monet'] },
  { q: 'The Titanic was a famous?', a: 'Ship', d: ['Plane', 'Train', 'Car'] },
  { q: 'Ancient Romans spoke?', a: 'Latin', d: ['English', 'French', 'Greek'] },
  { q: 'The Olympics began in?', a: 'Greece', d: ['Rome', 'Egypt', 'China'] },
  { q: 'Knights wore?', a: 'Armor', d: ['Pajamas', 'Swimsuits', 'Raincoats'] },
];

export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
