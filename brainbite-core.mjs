import './content/experience-registry.js';

const CORE_VERSION = 1;
const STORAGE_KEY = 'bb-brainbite-foundation-v1';
const BACKUP_KEY = 'bb-brainbite-foundation-v1-backup';
const RECOVERY_KEY = 'bb-brainbite-foundation-v1-recovery';
const LEGACY_PROFILE_KEY = 'bb-core-v3';
const OFFLINE_QUEUE_LIMIT = 500;
const SENT_EVENT_ID_LIMIT = 2000;
const EXPERIENCE_REGISTRY = globalThis.BrainBiteRegistry;
if (!EXPERIENCE_REGISTRY?.validateRegistry().valid) throw new Error('BrainBite experience registry is unavailable or invalid.');
const MASTERY_STATES = ['Unknown', 'Introduced', 'Practicing', 'Developing', 'Strong', 'Mastered'];

const ACTIVITY_FAMILIES = EXPERIENCE_REGISTRY.activityFamilies;

const DEFAULT_WORLD_DEFINITIONS = EXPERIENCE_REGISTRY.verticalSlice.worldDefinitions;
const DEFAULT_ACTIVITY_DEFINITIONS = EXPERIENCE_REGISTRY.verticalSlice.activityDefinitions;
const DEFAULT_BOSS_DEFINITIONS = EXPERIENCE_REGISTRY.verticalSlice.bossDefinitions;
const DEFAULT_REWARD_DEFINITIONS = EXPERIENCE_REGISTRY.verticalSlice.rewardDefinitions;

const DEFAULT_CONTENT_BUNDLE = {
  worldDefinitions: DEFAULT_WORLD_DEFINITIONS,
  activityDefinitions: DEFAULT_ACTIVITY_DEFINITIONS,
  bossDefinitions: DEFAULT_BOSS_DEFINITIONS,
  rewardDefinitions: DEFAULT_REWARD_DEFINITIONS,
};

const CURRICULUM_SUBJECTS = Object.freeze(['math', 'reading', 'spelling', 'vocabulary', 'grammar']);
const CURRICULUM_GRADES = Object.freeze(['K', '1', '2', '3', '4', '5', '6']);
const CURRICULUM_DIFFICULTY_BANDS = Object.freeze(['easy', 'normal', 'hard']);
const LEGACY_VERTICAL_SLICE_SKILL_IDS = new Set(['number-facts', 'word-order', 'fraction-meaning']);

const CURRICULUM_SKILLS = [
  { id: 'math-k-counting', subject: 'math', grade: 'K', domain: 'number-sense', name: 'Counting and Cardinality', keyword: 'counting', prerequisites: [], supportedActivityTypes: [ACTIVITY_FAMILIES.targetSmash, ACTIVITY_FAMILIES.knowledgePlatforms], representations: ['number', 'visual quantity'], hint: 'Count each object once.' },
  { id: 'math-1-addition', subject: 'math', grade: '1', domain: 'operations', name: 'Addition within 20', keyword: 'addition', prerequisites: ['math-k-counting'], supportedActivityTypes: [ACTIVITY_FAMILIES.targetSmash, ACTIVITY_FAMILIES.knowledgePlatforms], representations: ['number', 'symbol'], hint: 'Look for two parts that make one whole.' },
  { id: 'math-2-place-value', subject: 'math', grade: '2', domain: 'number-sense', name: 'Place Value', keyword: 'place value', prerequisites: ['math-1-addition'], supportedActivityTypes: [ACTIVITY_FAMILIES.targetSmash, ACTIVITY_FAMILIES.knowledgePlatforms], representations: ['number', 'symbol'], hint: 'Think tens and ones.' },
  { id: 'math-3-multiplication', subject: 'math', grade: '3', domain: 'operations', name: 'Multiplication Facts', keyword: 'multiplication', prerequisites: ['math-2-place-value'], supportedActivityTypes: [ACTIVITY_FAMILIES.targetSmash, ACTIVITY_FAMILIES.knowledgePlatforms], representations: ['number', 'symbol'], hint: 'Equal groups help.' },
  { id: 'math-4-fractions', subject: 'math', grade: '4', domain: 'fractions', name: 'Fractions', keyword: 'fractions', prerequisites: ['math-3-multiplication'], supportedActivityTypes: [ACTIVITY_FAMILIES.targetSmash, ACTIVITY_FAMILIES.knowledgePlatforms], representations: ['fraction', 'symbol', 'visual quantity'], hint: 'Compare parts of the same whole.' },
  { id: 'math-5-decimals', subject: 'math', grade: '5', domain: 'decimals', name: 'Decimals', keyword: 'decimals', prerequisites: ['math-4-fractions'], supportedActivityTypes: [ACTIVITY_FAMILIES.targetSmash, ACTIVITY_FAMILIES.knowledgePlatforms], representations: ['number', 'fraction', 'symbol'], hint: 'Relate tenths to fractions.' },
  { id: 'math-6-ratios', subject: 'math', grade: '6', domain: 'ratios', name: 'Ratios and Rates', keyword: 'ratios', prerequisites: ['math-5-decimals'], supportedActivityTypes: [ACTIVITY_FAMILIES.targetSmash, ACTIVITY_FAMILIES.knowledgePlatforms], representations: ['number', 'symbol', 'geometry'], hint: 'Compare quantities with a clear relationship.' },

  { id: 'reading-k-phonological', subject: 'reading', grade: 'K', domain: 'phonological-awareness', name: 'Phonological Awareness', keyword: 'sounds', prerequisites: [], supportedActivityTypes: [ACTIVITY_FAMILIES.letterTrail, ACTIVITY_FAMILIES.targetSmash], representations: ['text', 'symbol'], hint: 'Listen for the first sound.' },
  { id: 'reading-1-decoding', subject: 'reading', grade: '1', domain: 'decoding', name: 'Decoding CVC Words', keyword: 'decoding', prerequisites: ['reading-k-phonological'], supportedActivityTypes: [ACTIVITY_FAMILIES.letterTrail, ACTIVITY_FAMILIES.targetSmash], representations: ['text', 'symbol'], hint: 'Blend each sound in order.' },
  { id: 'reading-2-fluency', subject: 'reading', grade: '2', domain: 'fluency', name: 'Reading Fluency', keyword: 'fluency', prerequisites: ['reading-1-decoding'], supportedActivityTypes: [ACTIVITY_FAMILIES.letterTrail, ACTIVITY_FAMILIES.targetSmash], representations: ['text', 'sequence'], hint: 'Read smoothly and accurately.' },
  { id: 'reading-3-main-idea', subject: 'reading', grade: '3', domain: 'comprehension', name: 'Main Idea', keyword: 'main idea', prerequisites: ['reading-2-fluency'], supportedActivityTypes: [ACTIVITY_FAMILIES.knowledgePlatforms, ACTIVITY_FAMILIES.letterTrail], representations: ['text', 'symbol'], hint: 'Look for what the whole text is mostly about.' },
  { id: 'reading-4-inference', subject: 'reading', grade: '4', domain: 'comprehension', name: 'Inference', keyword: 'inference', prerequisites: ['reading-3-main-idea'], supportedActivityTypes: [ACTIVITY_FAMILIES.knowledgePlatforms, ACTIVITY_FAMILIES.letterTrail], representations: ['text', 'symbol'], hint: 'Use clues from the text and what you know.' },
  { id: 'reading-5-evidence', subject: 'reading', grade: '5', domain: 'text-evidence', name: 'Text Evidence', keyword: 'evidence', prerequisites: ['reading-4-inference'], supportedActivityTypes: [ACTIVITY_FAMILIES.knowledgePlatforms, ACTIVITY_FAMILIES.letterTrail], representations: ['text', 'symbol'], hint: 'Point to the words that prove it.' },
  { id: 'reading-6-argument', subject: 'reading', grade: '6', domain: 'argument', name: 'Argument and Reasoning', keyword: 'argument', prerequisites: ['reading-5-evidence'], supportedActivityTypes: [ACTIVITY_FAMILIES.knowledgePlatforms, ACTIVITY_FAMILIES.letterTrail], representations: ['text', 'symbol'], hint: 'Claim, reasons, and evidence stay connected.' },

  { id: 'spelling-k-sight', subject: 'spelling', grade: 'K', domain: 'high-frequency', name: 'Sight Words', keyword: 'sight words', prerequisites: [], supportedActivityTypes: [ACTIVITY_FAMILIES.letterTrail, ACTIVITY_FAMILIES.targetSmash], representations: ['text'], hint: 'Recognize the word by sight.' },
  { id: 'spelling-1-cvc', subject: 'spelling', grade: '1', domain: 'phonics', name: 'CVC Patterns', keyword: 'cvc', prerequisites: ['spelling-k-sight'], supportedActivityTypes: [ACTIVITY_FAMILIES.letterTrail, ACTIVITY_FAMILIES.targetSmash], representations: ['text', 'symbol'], hint: 'Use each sound to build the word.' },
  { id: 'spelling-2-digraphs', subject: 'spelling', grade: '2', domain: 'phonics', name: 'Digraphs', keyword: 'digraphs', prerequisites: ['spelling-1-cvc'], supportedActivityTypes: [ACTIVITY_FAMILIES.letterTrail, ACTIVITY_FAMILIES.targetSmash], representations: ['text', 'symbol'], hint: 'Listen for the two-letter sound.' },
  { id: 'spelling-3-prefixes', subject: 'spelling', grade: '3', domain: 'morphology', name: 'Prefixes', keyword: 'prefixes', prerequisites: ['spelling-2-digraphs'], supportedActivityTypes: [ACTIVITY_FAMILIES.letterTrail, ACTIVITY_FAMILIES.targetSmash], representations: ['text', 'symbol'], hint: 'The beginning changes the word meaning.' },
  { id: 'spelling-4-suffixes', subject: 'spelling', grade: '4', domain: 'morphology', name: 'Suffixes', keyword: 'suffixes', prerequisites: ['spelling-3-prefixes'], supportedActivityTypes: [ACTIVITY_FAMILIES.letterTrail, ACTIVITY_FAMILIES.targetSmash], representations: ['text', 'symbol'], hint: 'The ending can change tense or meaning.' },
  { id: 'spelling-5-patterns', subject: 'spelling', grade: '5', domain: 'orthography', name: 'Spelling Patterns', keyword: 'patterns', prerequisites: ['spelling-4-suffixes'], supportedActivityTypes: [ACTIVITY_FAMILIES.letterTrail, ACTIVITY_FAMILIES.targetSmash], representations: ['text', 'symbol'], hint: 'Look for recurring spellings.' },
  { id: 'spelling-6-academic', subject: 'spelling', grade: '6', domain: 'orthography', name: 'Academic Spelling', keyword: 'academic spelling', prerequisites: ['spelling-5-patterns'], supportedActivityTypes: [ACTIVITY_FAMILIES.letterTrail, ACTIVITY_FAMILIES.targetSmash], representations: ['text', 'symbol'], hint: 'Use roots and patterns to spell precisely.' },

  { id: 'vocabulary-k-categories', subject: 'vocabulary', grade: 'K', domain: 'categories', name: 'Category Words', keyword: 'categories', prerequisites: [], supportedActivityTypes: [ACTIVITY_FAMILIES.knowledgePlatforms, ACTIVITY_FAMILIES.targetSmash], representations: ['text', 'symbol'], hint: 'Group words by meaning.' },
  { id: 'vocabulary-1-meaning', subject: 'vocabulary', grade: '1', domain: 'word-meaning', name: 'Word Meaning', keyword: 'meaning', prerequisites: ['vocabulary-k-categories'], supportedActivityTypes: [ACTIVITY_FAMILIES.knowledgePlatforms, ACTIVITY_FAMILIES.targetSmash], representations: ['text', 'symbol'], hint: 'Use a simple definition.' },
  { id: 'vocabulary-2-synonyms', subject: 'vocabulary', grade: '2', domain: 'relationships', name: 'Synonyms', keyword: 'synonyms', prerequisites: ['vocabulary-1-meaning'], supportedActivityTypes: [ACTIVITY_FAMILIES.knowledgePlatforms, ACTIVITY_FAMILIES.targetSmash], representations: ['text', 'symbol'], hint: 'Find a word with a similar meaning.' },
  { id: 'vocabulary-3-context', subject: 'vocabulary', grade: '3', domain: 'context', name: 'Context Clues', keyword: 'context clues', prerequisites: ['vocabulary-2-synonyms'], supportedActivityTypes: [ACTIVITY_FAMILIES.knowledgePlatforms, ACTIVITY_FAMILIES.targetSmash], representations: ['text', 'symbol'], hint: 'Use nearby words to infer meaning.' },
  { id: 'vocabulary-4-multiple', subject: 'vocabulary', grade: '4', domain: 'polysemy', name: 'Multiple Meaning Words', keyword: 'multiple meaning', prerequisites: ['vocabulary-3-context'], supportedActivityTypes: [ACTIVITY_FAMILIES.knowledgePlatforms, ACTIVITY_FAMILIES.targetSmash], representations: ['text', 'symbol'], hint: 'One word can have more than one meaning.' },
  { id: 'vocabulary-5-roots', subject: 'vocabulary', grade: '5', domain: 'morphology', name: 'Roots and Affixes', keyword: 'roots', prerequisites: ['vocabulary-4-multiple'], supportedActivityTypes: [ACTIVITY_FAMILIES.knowledgePlatforms, ACTIVITY_FAMILIES.targetSmash], representations: ['text', 'symbol'], hint: 'A root helps unlock the meaning.' },
  { id: 'vocabulary-6-academic', subject: 'vocabulary', grade: '6', domain: 'academic-language', name: 'Academic Vocabulary', keyword: 'academic vocabulary', prerequisites: ['vocabulary-5-roots'], supportedActivityTypes: [ACTIVITY_FAMILIES.knowledgePlatforms, ACTIVITY_FAMILIES.targetSmash], representations: ['text', 'symbol'], hint: 'Use precise school language.' },

  { id: 'grammar-k-sentence', subject: 'grammar', grade: 'K', domain: 'sentence-awareness', name: 'Sentence Awareness', keyword: 'sentence', prerequisites: [], supportedActivityTypes: [ACTIVITY_FAMILIES.letterTrail, ACTIVITY_FAMILIES.targetSmash], representations: ['text', 'symbol'], hint: 'A sentence tells a complete thought.' },
  { id: 'grammar-1-capitalization', subject: 'grammar', grade: '1', domain: 'conventions', name: 'Capitalization', keyword: 'capitalization', prerequisites: ['grammar-k-sentence'], supportedActivityTypes: [ACTIVITY_FAMILIES.letterTrail, ACTIVITY_FAMILIES.targetSmash], representations: ['text', 'symbol'], hint: 'Start with a capital letter where needed.' },
  { id: 'grammar-2-punctuation', subject: 'grammar', grade: '2', domain: 'conventions', name: 'Punctuation', keyword: 'punctuation', prerequisites: ['grammar-1-capitalization'], supportedActivityTypes: [ACTIVITY_FAMILIES.letterTrail, ACTIVITY_FAMILIES.targetSmash], representations: ['text', 'symbol'], hint: 'Choose the mark that fits the sentence.' },
  { id: 'grammar-3-parts', subject: 'grammar', grade: '3', domain: 'syntax', name: 'Parts of Speech', keyword: 'parts of speech', prerequisites: ['grammar-2-punctuation'], supportedActivityTypes: [ACTIVITY_FAMILIES.knowledgePlatforms, ACTIVITY_FAMILIES.targetSmash], representations: ['text', 'symbol'], hint: 'Word jobs help the sentence work.' },
  { id: 'grammar-4-agreement', subject: 'grammar', grade: '4', domain: 'syntax', name: 'Subject-Verb Agreement', keyword: 'agreement', prerequisites: ['grammar-3-parts'], supportedActivityTypes: [ACTIVITY_FAMILIES.knowledgePlatforms, ACTIVITY_FAMILIES.targetSmash], representations: ['text', 'symbol'], hint: 'The subject and verb must match.' },
  { id: 'grammar-5-combining', subject: 'grammar', grade: '5', domain: 'sentence-structure', name: 'Sentence Combining', keyword: 'combining', prerequisites: ['grammar-4-agreement'], supportedActivityTypes: [ACTIVITY_FAMILIES.letterTrail, ACTIVITY_FAMILIES.knowledgePlatforms], representations: ['text', 'symbol'], hint: 'Join ideas without losing clarity.' },
  { id: 'grammar-6-clauses', subject: 'grammar', grade: '6', domain: 'sentence-structure', name: 'Clauses and Phrases', keyword: 'clauses', prerequisites: ['grammar-5-combining'], supportedActivityTypes: [ACTIVITY_FAMILIES.letterTrail, ACTIVITY_FAMILIES.knowledgePlatforms], representations: ['text', 'symbol'], hint: 'Break a sentence into meaningful parts.' },
].map(skill => ({ ...skill, difficultyBands: [...CURRICULUM_DIFFICULTY_BANDS] }));

const CURRICULUM_CONTENT_STATUS = 'internally-programmatically-validated-prototype';

function curriculumItemTemplate(prompt, answer, distractors, explanation, hint, answerVerification) {
  const frozenVerification = Object.fromEntries(Object.entries(answerVerification).map(([key, value]) => [
    key,
    Array.isArray(value) ? Object.freeze([...value]) : value,
  ]));
  return Object.freeze({
    contentStatus: CURRICULUM_CONTENT_STATUS,
    prompt,
    answers: Object.freeze([answer]),
    distractors: Object.freeze([...distractors]),
    explanation,
    hintMetadata: Object.freeze({ hint, strategy: hint }),
    answerVerification: Object.freeze({ ...frozenVerification, expected: answer }),
  });
}

const CURRICULUM_ITEM_TEMPLATES = Object.freeze({
  'math-k-counting': curriculumItemTemplate(
    'Count the stars: star, star, star, star, star. How many stars are there?', '5', ['4', '6', '7'],
    'There are five stars because each of the five listed stars is counted once.', 'Touch each word "star" once as you count.',
    { type: 'count-equals', itemCount: 5 },
  ),
  'math-1-addition': curriculumItemTemplate(
    'Mina has 7 shells and finds 5 more. How many shells does she have now?', '12', ['10', '11', '13'],
    'Adding the two groups gives 7 + 5 = 12 shells.', 'Start at 7 and count on 5 more.',
    { type: 'sum-equals', addends: [7, 5] },
  ),
  'math-2-place-value': curriculumItemTemplate(
    'In the number 472, what value does the digit 7 represent?', '70', ['7', '700', '72'],
    'The 7 is in the tens place, so its value is 7 tens, or 70.', 'Name the places from right to left: ones, tens, hundreds.',
    { type: 'place-value-equals', numeral: 472, place: 'tens' },
  ),
  'math-3-multiplication': curriculumItemTemplate(
    'There are 4 bags with 6 marbles in each bag. How many marbles are there?', '24', ['10', '20', '26'],
    'Four equal groups of six make 4 x 6 = 24 marbles.', 'Add 6 four times or use the fact 4 x 6.',
    { type: 'product-equals', factors: [4, 6] },
  ),
  'math-4-fractions': curriculumItemTemplate(
    'Which fraction is equivalent to 1/2?', '2/4', ['1/3', '2/3', '3/4'],
    'Multiplying the numerator and denominator of 1/2 by 2 gives 2/4.', 'Equivalent fractions name the same part of a whole.',
    { type: 'fraction-equivalent', targetNumerator: 1, targetDenominator: 2 },
  ),
  'math-5-decimals': curriculumItemTemplate(
    'Which decimal is equal to 3/10?', '0.3', ['0.03', '3.0', '0.13'],
    'Three tenths is written as 0.3 because the 3 is in the tenths place.', 'A denominator of 10 points to the tenths place.',
    { type: 'decimal-equivalent', numerator: 3, denominator: 10 },
  ),
  'math-6-ratios': curriculumItemTemplate(
    'Which ratio is equivalent to 2:3?', '4:6', ['3:4', '4:5', '6:4'],
    'Multiplying both parts of 2:3 by 2 gives the equivalent ratio 4:6.', 'Equivalent ratios multiply or divide both parts by the same number.',
    { type: 'ratio-equivalent', antecedent: 2, consequent: 3 },
  ),

  'reading-k-phonological': curriculumItemTemplate(
    'Which word begins with the /m/ sound?', 'moon', ['sun', 'cat', 'fish'],
    'Moon begins with the /m/ sound.', 'Say each word slowly and listen to its first sound.',
    { type: 'exact-match' },
  ),
  'reading-1-decoding': curriculumItemTemplate(
    'Blend these sounds in order: /s/ /u/ /n/. Which word do they make?', 'sun', ['sit', 'run', 'fun'],
    'The sounds /s/, /u/, and /n/ blend to make sun.', 'Say the sounds without pausing between them.',
    { type: 'exact-match' },
  ),
  'reading-2-fluency': curriculumItemTemplate(
    'The sentence is "Watch out!" Which choice describes a fluent reading?', 'Read it smoothly with a strong warning voice.', ['Read one letter at a time.', 'Pause after every word for five seconds.', 'Use a cheerful question voice.'],
    'The exclamation mark and warning words call for smooth reading with a strong warning voice.', 'Use the words and punctuation to choose an expressive voice.',
    { type: 'exact-match' },
  ),
  'reading-3-main-idea': curriculumItemTemplate(
    'Bees visit flowers to collect nectar. As they move, they carry pollen between flowers. This helps many plants make seeds. What is the main idea?', 'Bees help plants while collecting nectar.', ['Bees only visit red flowers.', 'Seeds are a kind of pollen.', 'All insects make honey.'],
    'Every sentence supports the idea that bees help plants as they collect nectar.', 'Choose the idea supported by the whole passage, not one small detail.',
    { type: 'exact-match' },
  ),
  'reading-4-inference': curriculumItemTemplate(
    'Lena zipped her coat, pulled on mittens, and saw her breath form a cloud outside. What can you infer about the weather?', 'It is cold outside.', ['It is very hot outside.', 'It is raining hard.', 'It is windy indoors.'],
    'A coat, mittens, and visible breath are clues that the outdoor air is cold.', 'Combine the clothing and breath clues.',
    { type: 'exact-match' },
  ),
  'reading-5-evidence': curriculumItemTemplate(
    'Passage: "Niko practiced the violin every day. At the concert, he played the difficult song without a mistake." Which sentence best supports the claim that Niko was well prepared?', 'Niko practiced the violin every day.', ['The concert had a difficult song.', 'Niko owned a violin.', 'The song was played at a concert.'],
    'Daily practice is direct evidence that Niko prepared for the concert.', 'Find the sentence that shows what Niko did to prepare.',
    { type: 'exact-match' },
  ),
  'reading-6-argument': curriculumItemTemplate(
    'Claim: The school should add a refill station for water bottles. Which reason most directly supports the claim?', 'A refill station would reduce disposable plastic bottle waste.', ['Many students like the color blue.', 'The gym floor was replaced last year.', 'Some classes begin before lunch.'],
    'Reducing disposable bottle waste is a relevant benefit of adding a refill station.', 'Choose a reason that explains a benefit of the proposed action.',
    { type: 'exact-match' },
  ),

  'spelling-k-sight': curriculumItemTemplate(
    'Which choice correctly spells the sight word "the"?', 'the', ['teh', 'tne', 'tha'],
    'The sight word is spelled t-h-e.', 'Look at the order of all three letters.',
    { type: 'exact-match' },
  ),
  'spelling-1-cvc': curriculumItemTemplate(
    'Which word correctly spells the CVC word for an animal that says meow?', 'cat', ['cta', 'kat', 'cot'],
    'Cat uses the sounds /k/, /a/, and /t/ in consonant-vowel-consonant order.', 'Say each sound: /k/ /a/ /t/.',
    { type: 'exact-match' },
  ),
  'spelling-2-digraphs': curriculumItemTemplate(
    'Which word correctly spells the word /ship/, using the two-letter sound /sh/?', 'ship', ['sip', 'chip', 'thip'],
    'The letters s and h work together to spell the first sound in ship.', 'Listen for /sh/ at the beginning.',
    { type: 'exact-match' },
  ),
  'spelling-3-prefixes': curriculumItemTemplate(
    'Add a prefix to happy to make a word meaning "not happy." Which spelling is correct?', 'unhappy', ['rehappy', 'dishappy', 'inhappy'],
    'The prefix un- means not, so un + happy is spelled unhappy.', 'Use the prefix un- for "not."',
    { type: 'exact-match' },
  ),
  'spelling-4-suffixes': curriculumItemTemplate(
    'Add the suffix -ed to jump. Which spelling correctly shows that the action happened in the past?', 'jumped', ['jumpt', 'jumpd', 'jumpied'],
    'The base word jump keeps its spelling when -ed is added: jumped.', 'Write the whole base word before adding -ed.',
    { type: 'exact-match' },
  ),
  'spelling-5-patterns': curriculumItemTemplate(
    'Which word is spelled correctly?', 'neighbor', ['nieghbor', 'neigbor', 'neighbur'],
    'Neighbor uses the letter pattern eigh followed by bor.', 'Check the vowel pattern in the first syllable.',
    { type: 'exact-match' },
  ),
  'spelling-6-academic': curriculumItemTemplate(
    'Which choice correctly spells the academic word meaning "needed"?', 'necessary', ['neccessary', 'necessery', 'necesary'],
    'Necessary is spelled n-e-c-e-s-s-a-r-y.', 'Notice one c and two s letters.',
    { type: 'exact-match' },
  ),

  'vocabulary-k-categories': curriculumItemTemplate(
    'Which word names an animal?', 'rabbit', ['spoon', 'sock', 'chair'],
    'A rabbit is an animal; the other choices are objects.', 'Think about which choice can move and grow on its own.',
    { type: 'exact-match' },
  ),
  'vocabulary-1-meaning': curriculumItemTemplate(
    'What does the word tiny mean?', 'very small', ['very loud', 'very fast', 'very wet'],
    'Tiny means very small.', 'Think of something that can fit in your hand.',
    { type: 'exact-match' },
  ),
  'vocabulary-2-synonyms': curriculumItemTemplate(
    'Which word is a synonym for happy?', 'glad', ['angry', 'tired', 'empty'],
    'Glad and happy have similar meanings.', 'A synonym has nearly the same meaning.',
    { type: 'exact-match' },
  ),
  'vocabulary-3-context': curriculumItemTemplate(
    'The narrow path was only wide enough for one person. What does narrow mean in this sentence?', 'not wide', ['very noisy', 'made of stone', 'hard to see'],
    'The clue "only wide enough for one person" shows that narrow means not wide.', 'Use the words after narrow as a definition clue.',
    { type: 'exact-match' },
  ),
  'vocabulary-4-multiple': curriculumItemTemplate(
    'In the sentence "Ava swung the bat and hit the ball," what does bat mean?', 'a piece of sports equipment', ['a flying mammal', 'to blink quickly', 'a winter coat'],
    'The words swung and hit the ball show that bat means sports equipment.', 'Use the action and the ball as context clues.',
    { type: 'exact-match' },
  ),
  'vocabulary-5-roots': curriculumItemTemplate(
    'The Latin root spect means "look." What does inspect mean?', 'to look at closely', ['to speak very softly', 'to carry something away', 'to build something again'],
    'The prefix in- and root spect form inspect, meaning to look at closely.', 'Use the meaning of spect in the word.',
    { type: 'exact-match' },
  ),
  'vocabulary-6-academic': curriculumItemTemplate(
    'In an essay, what does it mean to contrast two ideas?', 'to explain how they differ', ['to list them alphabetically', 'to prove both are false', 'to repeat both word for word'],
    'To contrast ideas is to explain their differences.', 'Think about differences rather than similarities.',
    { type: 'exact-match' },
  ),

  'grammar-k-sentence': curriculumItemTemplate(
    'Which choice is a complete sentence?', 'Birds fly.', ['The blue bird', 'Under the tree', 'Running fast'],
    'Birds fly names who and tells what they do, so it expresses a complete thought.', 'Look for a choice that tells a whole idea.',
    { type: 'exact-match' },
  ),
  'grammar-1-capitalization': curriculumItemTemplate(
    'Which sentence uses capital letters correctly?', 'Maya feeds her fish.', ['maya feeds the fish.', 'Maya Feeds a fish.', 'My friend maya feeds fish.'],
    'Maya is a name at the start of the sentence, so it begins with a capital M; the other words do not need capitals.', 'Capitalize the first word and a person\'s name.',
    { type: 'exact-match' },
  ),
  'grammar-2-punctuation': curriculumItemTemplate(
    'Which punctuation mark completes the question "Where is my backpack"?', '?', ['.', '!', ','],
    'A direct question ends with a question mark.', 'The sentence asks for information.',
    { type: 'exact-match' },
  ),
  'grammar-3-parts': curriculumItemTemplate(
    'In the sentence "The bright kite soared," which word is an adjective?', 'bright', ['kite', 'soared', 'the'],
    'Bright is an adjective because it describes the noun kite.', 'Find the word that describes the kite.',
    { type: 'exact-match' },
  ),
  'grammar-4-agreement': curriculumItemTemplate(
    'Which sentence has correct subject-verb agreement?', 'The dogs bark at the mail carrier.', ['The dogs barks at the mail carrier.', 'The dogs is barking at the mail carrier.', 'The dogs was loud at the mail carrier.'],
    'The plural subject dogs agrees with the plural verb bark.', 'A plural subject takes the verb form without -s here.',
    { type: 'exact-match' },
  ),
  'grammar-5-combining': curriculumItemTemplate(
    'Combine these sentences without changing their meaning: "Kai finished his homework. Kai played soccer."', 'After Kai finished his homework, he played soccer.', ['Kai finished his homework, because soccer.', 'Finishing homework and Kai played soccer.', 'Kai played homework after he finished soccer.'],
    'The answer joins both complete ideas and keeps their original time order.', 'Use a joining word that shows which action happened first.',
    { type: 'exact-match' },
  ),
  'grammar-6-clauses': curriculumItemTemplate(
    'In the sentence "When the rain stopped, we walked home," which words form the independent clause?', 'we walked home', ['When the rain stopped', 'When the rain', 'stopped, we'],
    'We walked home has a subject and verb and can stand alone as a complete thought.', 'Find the group of words that makes sense by itself.',
    { type: 'exact-match' },
  ),
});

function curriculumTaxonomy() {
  return {
    version: '2.0',
    subjects: [...CURRICULUM_SUBJECTS],
    difficultyBands: [...CURRICULUM_DIFFICULTY_BANDS],
    skills: clone(CURRICULUM_SKILLS),
  };
}

function createCurriculumTaxonomy() {
  return curriculumTaxonomy();
}

function validateCurriculumTaxonomy(taxonomy = curriculumTaxonomy()) {
  const errors = [];
  const quarantined = [];
  if (!taxonomy || typeof taxonomy !== 'object') {
    return { valid: false, approved: false, errors: ['Curriculum taxonomy must be an object.'], quarantined: ['taxonomy'] };
  }

  const subjects = Array.isArray(taxonomy.subjects) ? taxonomy.subjects : [];
  if (subjects.length !== CURRICULUM_SUBJECTS.length || subjects.some((subject, index) => subject !== CURRICULUM_SUBJECTS[index])) {
    errors.push(`Curriculum subjects must be exactly ${CURRICULUM_SUBJECTS.join(', ')}.`);
  }
  const taxonomyBands = Array.isArray(taxonomy.difficultyBands) ? taxonomy.difficultyBands : [];
  if (!taxonomyBands.length || taxonomyBands.some(band => !String(band || '').trim())) errors.push('Curriculum taxonomy needs nonempty difficulty bands.');
  const skills = Array.isArray(taxonomy.skills) ? taxonomy.skills : [];
  if (!Array.isArray(taxonomy.skills)) errors.push('Curriculum taxonomy skills must be an array.');

  const ids = new Set();
  const cells = new Set();
  const byId = new Map();
  for (const skill of skills) {
    const id = typeof skill?.id === 'string' ? skill.id.trim() : '';
    if (!id) {
      errors.push('Every curriculum skill must have a nonempty id.');
      quarantined.push('skill');
      continue;
    }
    if (ids.has(id)) {
      errors.push(`Curriculum skill id ${id} must be unique.`);
      quarantined.push(id);
    }
    ids.add(id);
    byId.set(id, skill);

    const subject = skill.subject;
    const grade = normalizeGradeLevel(skill.grade);
    const cell = `${subject}:${grade || String(skill.grade ?? '')}`;
    if (cells.has(cell)) {
      errors.push(`Curriculum subject/grade cell ${cell} must be unique.`);
      quarantined.push(id);
    }
    cells.add(cell);
    if (!CURRICULUM_SUBJECTS.includes(subject)) errors.push(`Curriculum skill ${id} has an invalid subject.`);
    if (!grade || !CURRICULUM_GRADES.includes(grade)) errors.push(`Curriculum skill ${id} has an invalid grade.`);
    if (!String(skill.domain || '').trim()) errors.push(`Curriculum skill ${id} needs a domain.`);

    const families = Array.isArray(skill.supportedActivityTypes) ? skill.supportedActivityTypes : [];
    if (!families.length) errors.push(`Curriculum skill ${id} needs a supported activity family.`);
    if (families.some(family => !Object.values(ACTIVITY_FAMILIES).includes(family))) {
      errors.push(`Curriculum skill ${id} has an invalid activity family.`);
    }
    const bands = Array.isArray(skill.difficultyBands) ? skill.difficultyBands : [];
    if (!bands.length || bands.some(band => !String(band || '').trim())) errors.push(`Curriculum skill ${id} needs nonempty difficulty bands.`);
    const representations = Array.isArray(skill.representations) ? skill.representations : [];
    if (!representations.length || representations.some(value => !String(value || '').trim())) errors.push(`Curriculum skill ${id} needs nonempty representations.`);
    const hintMetadata = skill.hintMetadata && typeof skill.hintMetadata === 'object' ? skill.hintMetadata : null;
    const hasHintMetadata = !!hintMetadata && Object.keys(hintMetadata).length > 0 && Object.values(hintMetadata).some(value => String(value ?? '').trim());
    if (!String(skill.hint || '').trim() && !hasHintMetadata) {
      errors.push(`Curriculum skill ${id} needs hint metadata.`);
    }
    if (!Array.isArray(skill.prerequisites)) errors.push(`Curriculum skill ${id} prerequisites must be an array.`);
  }

  for (const subject of CURRICULUM_SUBJECTS) {
    const subjectGrades = skills.filter(skill => skill?.subject === subject).map(skill => normalizeGradeLevel(skill.grade));
    const actual = new Set(subjectGrades);
    if (subjectGrades.length !== CURRICULUM_GRADES.length || CURRICULUM_GRADES.some(grade => !actual.has(grade))) {
      errors.push(`Curriculum subject ${subject} must cover K-6 exactly once.`);
    }
  }

  for (const skill of skills) {
    const id = skill?.id;
    for (const prerequisite of Array.isArray(skill?.prerequisites) ? skill.prerequisites : []) {
      if (!byId.has(prerequisite)) {
        errors.push(`Curriculum skill ${id} references unknown prerequisite ${prerequisite}.`);
        quarantined.push(id);
      }
    }
  }

  const visiting = new Set();
  const visited = new Set();
  const visit = id => {
    if (visiting.has(id)) return true;
    if (visited.has(id)) return false;
    visiting.add(id);
    const skill = byId.get(id);
    const cycle = (Array.isArray(skill?.prerequisites) ? skill.prerequisites : []).some(visit);
    visiting.delete(id);
    visited.add(id);
    return cycle;
  };
  for (const id of byId.keys()) {
    if (visit(id)) {
      errors.push(`Curriculum prerequisites contain a cycle at ${id}.`);
      quarantined.push(id);
    }
  }

  return {
    valid: errors.length === 0,
    approved: errors.length === 0,
    errors,
    quarantined: [...new Set(quarantined)],
  };
}

function normalizeGradeLevel(value) {
  if (value === 'K' || value === 'k') return 'K';
  const num = Number(value);
  return Number.isInteger(num) && num >= 1 && num <= 6 ? String(num) : null;
}

function curriculumSkillMap(taxonomy = curriculumTaxonomy()) {
  const map = new Map();
  for (const skill of Array.isArray(taxonomy.skills) ? taxonomy.skills : []) {
    map.set(skill.id, skill);
  }
  return map;
}

function findCurriculumSkill(skillId, taxonomy = curriculumTaxonomy()) {
  return curriculumSkillMap(taxonomy).get(skillId) || null;
}

function curriculumSkillsForGrade({ subject, grade, taxonomy = curriculumTaxonomy() } = {}) {
  const gradeLevel = normalizeGradeLevel(grade);
  return (Array.isArray(taxonomy.skills) ? taxonomy.skills : []).filter(skill => {
    if (subject && skill.subject !== subject) return false;
    if (gradeLevel && skill.grade !== gradeLevel) return false;
    return true;
  });
}

function normalizedChallengeValue(value) {
  return String(value ?? '').trim().toLowerCase();
}

function isCurriculumTaxonomy(value) {
  return !!value && typeof value === 'object' && Array.isArray(value.skills) && Array.isArray(value.subjects);
}

function isExplicitCustomSkill(skillDefinition, challenge, options = {}) {
  const source = String(challenge?.source || skillDefinition?.source || '').toLowerCase();
  return options.allowCustomSkill === true
    || skillDefinition?.custom === true
    || skillDefinition?.canonical === false
    || challenge?.customSkill === true
    || ['custom', 'legacy', 'vertical-slice', 'vertical-slice-registry', 'mission-registry'].includes(source);
}

function checkHookResult(label, result, errors) {
  if (result === undefined || result === null || result === true) return;
  if (result === false) {
    errors.push(`${label} check rejected the challenge.`);
    return;
  }
  if (typeof result === 'string') {
    errors.push(result.trim() || `${label} check rejected the challenge.`);
    return;
  }
  if (typeof result === 'object' && (result.valid === false || result.approved === false || result.ok === false || result.pass === false || result.safe === false || result.readable === false || result.suitable === false)) {
    const hookErrors = Array.isArray(result.errors) ? result.errors : [result.message || result.reason || `${label} check rejected the challenge.`];
    hookErrors.filter(Boolean).forEach(error => errors.push(String(error)));
  }
}

function runDeterministicChallengeChecks(challenge, skill, options, errors) {
  const hooks = options?.hooks && typeof options.hooks === 'object'
    ? options.hooks
    : options?.qualityHooks && typeof options.qualityHooks === 'object'
      ? options.qualityHooks
      : {};
  const readabilityHooks = [options?.readabilityCheck, options?.validateReadability, options?.gradeReadabilityCheck, options?.readabilityHook, options?.isReadable, options?.readability, hooks.readability, hooks.readabilityCheck, hooks.checkReadability].filter(fn => typeof fn === 'function');
  const safetyHooks = [options?.safetyCheck, options?.validateSafety, options?.safetyHook, options?.isSafe, options?.safety, hooks.safety, hooks.safetyCheck, hooks.checkSafety].filter(fn => typeof fn === 'function');
  const gradeHooks = [options?.gradeCheck, options?.validateGrade, options?.gradeFitCheck, options?.gradeFit, options?.gradeReadability, options?.grade, hooks.grade, hooks.gradeCheck].filter(fn => typeof fn === 'function');
  const context = { challenge, skillDefinition: skill || null, options };
  for (const hook of readabilityHooks) {
    try { checkHookResult('Readability', hook(challenge, skill || null, context), errors); } catch (error) { errors.push(`Readability check failed: ${error.message}`); }
  }
  for (const hook of safetyHooks) {
    try { checkHookResult('Safety', hook(challenge, skill || null, context), errors); } catch (error) { errors.push(`Safety check failed: ${error.message}`); }
  }
  for (const hook of gradeHooks) {
    try { checkHookResult('Grade fit', hook(challenge, skill || null, context), errors); } catch (error) { errors.push(`Grade fit check failed: ${error.message}`); }
  }
  if (typeof options?.readability !== 'function') checkHookResult('Readability', options?.readability, errors);
  if (typeof options?.safety !== 'function') checkHookResult('Safety', options?.safety, errors);

  const readability = typeof options?.readability === 'object' ? options.readability : {};
  const prompt = String(challenge?.prompt || '').trim();
  const promptWords = prompt ? prompt.split(/\s+/u) : [];
  const maxCharacters = Number(readability.maxCharacters ?? options?.maxPromptCharacters);
  const maxWords = Number(readability.maxWords ?? options?.maxPromptWords);
  const maxWordLength = Number(readability.maxWordLength);
  if (Number.isFinite(maxCharacters) && maxCharacters >= 0 && prompt.length > maxCharacters) errors.push('Challenge prompt exceeds the readability character limit.');
  if (Number.isFinite(maxWords) && maxWords >= 0 && promptWords.length > maxWords) errors.push('Challenge prompt exceeds the readability word limit.');
  if (Number.isFinite(maxWordLength) && maxWordLength >= 0 && promptWords.some(word => word.length > maxWordLength)) errors.push('Challenge prompt exceeds the readability word-length limit.');

  const allowedGrades = options?.allowedGrades || readability.allowedGrades;
  if (Array.isArray(allowedGrades) && challenge?.grade && !allowedGrades.map(normalizeGradeLevel).includes(normalizeGradeLevel(challenge.grade))) {
    errors.push(`Challenge grade ${challenge.grade} is outside the allowed readability grades.`);
  }
  const maxGrade = normalizeGradeLevel(options?.maxReadableGrade ?? readability.maxGrade);
  if (maxGrade && normalizeGradeLevel(challenge?.grade) && CURRICULUM_GRADES.indexOf(normalizeGradeLevel(challenge.grade)) > CURRICULUM_GRADES.indexOf(maxGrade)) {
    errors.push(`Challenge grade ${challenge.grade} is above the readability grade ceiling.`);
  }

  const safety = typeof options?.safety === 'object' ? options.safety : {};
  const blockedTerms = [...(Array.isArray(safety.blockedTerms) ? safety.blockedTerms : []), ...(Array.isArray(options?.blockedSafetyTerms) ? options.blockedSafetyTerms : [])]
    .map(term => String(term || '').trim().toLowerCase()).filter(Boolean);
  const contentText = [challenge?.prompt, ...(Array.isArray(challenge?.answers) ? challenge.answers : []), ...(Array.isArray(challenge?.targetSequence) ? challenge.targetSequence : []), ...(Array.isArray(challenge?.platformOrder) ? challenge.platformOrder : []), ...(Array.isArray(challenge?.distractors) ? challenge.distractors : []), ...(Array.isArray(challenge?.choices) ? challenge.choices.map(choice => choice && typeof choice === 'object' ? choice.value : choice) : [])].map(value => String(value ?? '').toLowerCase()).join(' ');
  for (const term of blockedTerms) if (contentText.includes(term)) errors.push(`Challenge contains blocked safety content: ${term}.`);
}

function parseFractionValue(value, separator = '/') {
  const parts = String(value ?? '').trim().split(separator).map(part => Number(part.trim()));
  return parts.length === 2 && parts.every(Number.isFinite) && parts[1] !== 0 ? parts : null;
}

function verifyCurriculumAnswer(challengeOrVerification, candidate) {
  const verification = challengeOrVerification?.answerVerification || challengeOrVerification;
  if (!verification || typeof verification !== 'object') return false;
  const normalizedCandidate = normalizedChallengeValue(candidate);
  switch (verification.type) {
    case 'exact-match':
      return normalizedCandidate === normalizedChallengeValue(verification.expected);
    case 'count-equals':
      return Number(candidate) === Number(verification.itemCount);
    case 'sum-equals':
      return Array.isArray(verification.addends)
        && Number(candidate) === verification.addends.reduce((sum, value) => sum + Number(value), 0);
    case 'place-value-equals': {
      const placePowers = { ones: 0, tens: 1, hundreds: 2, thousands: 3 };
      const power = placePowers[verification.place];
      if (power === undefined || !Number.isInteger(Number(verification.numeral))) return false;
      const digit = Math.floor(Math.abs(Number(verification.numeral)) / (10 ** power)) % 10;
      return Number(candidate) === digit * (10 ** power);
    }
    case 'product-equals':
      return Array.isArray(verification.factors)
        && Number(candidate) === verification.factors.reduce((product, value) => product * Number(value), 1);
    case 'fraction-equivalent': {
      const fraction = parseFractionValue(candidate);
      return !!fraction
        && fraction[0] * Number(verification.targetDenominator) === Number(verification.targetNumerator) * fraction[1];
    }
    case 'decimal-equivalent':
      return Number.isFinite(Number(candidate))
        && Math.abs(Number(candidate) - (Number(verification.numerator) / Number(verification.denominator))) < Number.EPSILON * 10;
    case 'ratio-equivalent': {
      const ratio = parseFractionValue(candidate, ':');
      return !!ratio
        && ratio[0] * Number(verification.consequent) === Number(verification.antecedent) * ratio[1];
    }
    default:
      return false;
  }
}

function deterministicStringHash(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function deterministicOrder(values, key) {
  return [...values]
    .map((value, index) => ({ value, index, rank: deterministicStringHash(`${key}:${index}:${value}`) }))
    .sort((left, right) => left.rank - right.rank || left.index - right.index)
    .map(entry => entry.value);
}

function createCurriculumChallenge(skillId, options = {}) {
  const taxonomy = options.taxonomy || curriculumTaxonomy();
  const skill = findCurriculumSkill(skillId, taxonomy);
  if (!skill) throw new Error(`Unknown curriculum skill: ${skillId}`);
  const template = CURRICULUM_ITEM_TEMPLATES[skillId];
  if (!template) throw new Error(`No deterministic curriculum template exists for ${skillId}.`);
  const family = options.family && skill.supportedActivityTypes.includes(options.family)
    ? options.family
    : skill.supportedActivityTypes[0] || ACTIVITY_FAMILIES.targetSmash;
  const seed = Number.isFinite(Number(options.seed)) ? Math.trunc(Number(options.seed)) : 0;
  const defaultDifficulty = Array.isArray(skill.difficultyBands) && skill.difficultyBands.length
    ? (skill.difficultyBands.includes('normal') ? 'normal' : skill.difficultyBands[0])
    : 'normal';
  const difficulty = options.difficulty || defaultDifficulty;
  const deterministicKey = `${skillId}:${family}:${difficulty}:${seed}`;
  const supportByDifficulty = {
    easy: { level: 'guided', scaffold: template.hintMetadata.hint },
    normal: { level: 'strategic', scaffold: template.hintMetadata.strategy },
    hard: { level: 'independent', scaffold: 'Answer from the information in the prompt, then check your reasoning.' },
  };
  const common = {
    id: `curriculum-${deterministicStringHash(deterministicKey).toString(36)}`,
    skillId,
    subject: skill.subject,
    grade: skill.grade,
    domain: skill.domain,
    source: 'curriculum',
  };
  const semanticMetadata = {
    contentStatus: template.contentStatus,
    templateId: skillId,
    explanation: template.explanation,
    hintMetadata: clone(template.hintMetadata),
    supportMetadata: clone(supportByDifficulty[difficulty] || supportByDifficulty.normal),
    answerVerification: clone(template.answerVerification),
  };
  let challenge;
  if (family === ACTIVITY_FAMILIES.letterTrail) {
    challenge = createLetterTrailChallenge({
      ...common,
      prompt: template.prompt,
      targetSequence: [...template.answers],
      distractors: [...template.distractors],
      difficulty,
    });
    challenge.choices = deterministicOrder([...challenge.targetSequence, ...challenge.distractors], deterministicKey);
  } else if (family === ACTIVITY_FAMILIES.knowledgePlatforms) {
    challenge = createKnowledgePlatformChallenge({
      ...common,
      prompt: template.prompt,
      platformOrder: [...template.answers],
      distractors: [...template.distractors],
      difficulty,
    });
    challenge.platforms = deterministicOrder([...challenge.platformOrder, ...challenge.distractors], deterministicKey);
  } else {
    challenge = createTargetSmashChallenge({
      ...common,
      prompt: template.prompt,
      answerType: 'text',
      answers: [...template.answers],
      distractors: [...template.distractors],
      difficulty,
    });
    const orderedChoices = deterministicOrder([...template.answers, ...template.distractors], deterministicKey);
    challenge.choices = orderedChoices.map((value, index) => ({
      id: `choice-${index + 1}`,
      value,
      correct: challenge.answers.includes(value),
      x: index % 3,
      y: Math.floor(index / 3),
    }));
  }
  return { ...challenge, ...semanticMetadata };
}

function createApprovedCurriculumChallenge(skillId, options = {}) {
  const taxonomy = options.taxonomy || curriculumTaxonomy();
  const resultFor = (challenge, validation, extra = {}) => ({
    status: validation.valid ? 'approved' : 'quarantined',
    approved: validation.valid,
    quarantined: !validation.valid,
    challenge: challenge ? clone(challenge) : null,
    validation,
    errors: [...validation.errors],
    quarantine: validation.valid ? null : { id: challenge?.id || skillId || 'challenge', errors: [...validation.errors] },
    ...extra,
  });
  const taxonomyValidation = validateCurriculumTaxonomy(taxonomy);
  if (!taxonomyValidation.valid) {
    return resultFor(null, {
      valid: false,
      approved: false,
      errors: ['Curriculum taxonomy is invalid.', ...taxonomyValidation.errors],
      quarantined: [...taxonomyValidation.quarantined, skillId || 'challenge'],
    });
  }
  let challenge;
  try {
    challenge = createCurriculumChallenge(skillId, options);
  } catch (error) {
    return resultFor(null, { valid: false, approved: false, errors: [error.message], quarantined: [skillId || 'challenge'] });
  }
  const skill = findCurriculumSkill(skillId, taxonomy);
  const validationOptions = { ...options, ...(options.validationOptions || {}), ...(options.validation || {}) };
  if (options.family && !skill?.supportedActivityTypes?.includes(options.family)) {
    validationOptions.requestedFamily = options.family;
  }
  const validation = validateGeneratedChallenge(challenge, skill, validationOptions);
  if (validationOptions.requestedFamily) validation.errors.push(`Unsupported requested activity family: ${validationOptions.requestedFamily}.`);
  validation.valid = validation.errors.length === 0;
  validation.approved = validation.valid;
  validation.quarantined = validation.valid ? [] : [challenge.id || skillId || 'challenge'];
  return resultFor(challenge, validation);
}

function validateGeneratedChallenge(challenge, skillDefinition = {}, options = {}) {
  const errors = [];
  if (!challenge || typeof challenge !== 'object') errors.push('Challenge must be an object.');
  if (!challenge?.skillId) errors.push('Challenge must include a skillId.');
  if (!challenge?.family) errors.push('Challenge must include an activity family.');

  const suppliedOptions = skillDefinition?.validationOptions && typeof skillDefinition.validationOptions === 'object' ? skillDefinition.validationOptions : {};
  const validationOptions = { ...suppliedOptions, ...(options && typeof options === 'object' ? options : {}) };
  const taxonomy = isCurriculumTaxonomy(skillDefinition)
    ? skillDefinition
    : validationOptions.taxonomy || curriculumTaxonomy();
  const suppliedSkill = isCurriculumTaxonomy(skillDefinition)
    ? null
    : skillDefinition?.id
      ? skillDefinition
      : skillDefinition?.skillId
        ? { ...skillDefinition, id: skillDefinition.skillId }
        : null;
  const canonicalSkill = challenge?.skillId ? findCurriculumSkill(challenge.skillId, taxonomy) : null;
  const customSkill = suppliedSkill?.id === challenge?.skillId ? suppliedSkill : null;
  const skill = customSkill || canonicalSkill;
  const explicitCustom = isExplicitCustomSkill(customSkill || skillDefinition, challenge, validationOptions);
  if (suppliedSkill?.id && suppliedSkill.id !== challenge?.skillId) errors.push(`Skill definition does not match ${challenge?.skillId || 'the challenge'}.`);
  if (!canonicalSkill && !explicitCustom && challenge?.skillId) errors.push(`Unknown canonical curriculum skill: ${challenge.skillId}.`);

  const supportedFamilies = skill?.supportedActivityTypes || [];
  if (challenge?.family && !Object.values(ACTIVITY_FAMILIES).includes(challenge.family)) errors.push(`Unsupported activity family: ${challenge.family}.`);
  if (skill && challenge?.family && !supportedFamilies.includes(challenge.family)) errors.push(`Activity family ${challenge.family} is not supported by ${challenge.skillId}.`);
  if (skill?.subject && challenge?.subject !== undefined && challenge.subject !== skill.subject) errors.push(`Subject mismatch for ${challenge.skillId}.`);
  if (skill?.grade && challenge?.grade !== undefined && normalizeGradeLevel(skill.grade) !== normalizeGradeLevel(challenge.grade)) errors.push(`Grade mismatch for ${challenge.skillId}.`);
  if (skill?.domain && challenge?.domain !== undefined && challenge.domain !== skill.domain) errors.push(`Domain mismatch for ${challenge.skillId}.`);
  if (skill?.difficultyBands?.length && challenge?.difficulty && !skill.difficultyBands.includes(challenge.difficulty)) errors.push(`Difficulty ${challenge.difficulty} is not supported by ${challenge.skillId}.`);

  const family = challenge?.family;
  const answers = family === ACTIVITY_FAMILIES.letterTrail
    ? challenge?.targetSequence
    : family === ACTIVITY_FAMILIES.knowledgePlatforms
      ? challenge?.platformOrder
      : challenge?.answers;
  const distractors = Array.isArray(challenge?.distractors)
    ? challenge.distractors
    : Array.isArray(challenge?.choices)
      ? challenge.choices.filter(choice => !choice?.correct).map(choice => choice?.value)
      : [];
  const normalizedAnswers = Array.isArray(answers) ? answers : [];
  const normalizedDistractors = Array.isArray(distractors) ? distractors : [];
  const answerKeys = normalizedAnswers.map(normalizedChallengeValue);
  const distractorKeys = normalizedDistractors.map(normalizedChallengeValue);
  const prompt = String(challenge?.prompt || '').trim();
  if (!prompt) errors.push('Challenge prompt must be nonempty.');

  if (family === ACTIVITY_FAMILIES.targetSmash) {
    if (!Array.isArray(challenge?.answers) || !normalizedAnswers.length) errors.push('Target Smash needs at least one answer.');
    if (normalizedAnswers.length > 6) errors.push('Target Smash answer count exceeds six.');
  } else if (family === ACTIVITY_FAMILIES.letterTrail) {
    if (!Array.isArray(challenge?.targetSequence) || !normalizedAnswers.length) errors.push('Letter Trail needs a nonempty target sequence.');
  } else if (family === ACTIVITY_FAMILIES.knowledgePlatforms) {
    if (!Array.isArray(challenge?.platformOrder) || !normalizedAnswers.length) errors.push('Knowledge Platforms needs a nonempty platform order.');
  }
  if (normalizedAnswers.some(value => !String(value ?? '').trim())) errors.push('Challenge answers cannot be blank.');
  if (normalizedDistractors.some(value => !String(value ?? '').trim())) errors.push('Challenge distractors cannot be blank.');
  if (family !== ACTIVITY_FAMILIES.letterTrail && answerKeys.length !== new Set(answerKeys).size) errors.push('Challenge answers must be unique.');
  if (family === ACTIVITY_FAMILIES.knowledgePlatforms && answerKeys.length !== new Set(answerKeys).size) errors.push('Platform order entries must be unique.');
  if (distractorKeys.length !== new Set(distractorKeys).size) errors.push('Challenge distractors must be unique.');
  const answerSet = new Set(answerKeys.filter(Boolean));
  if (distractorKeys.some(key => key && answerSet.has(key))) errors.push('Challenge contains overlapping answers and distractors.');
  if (Array.isArray(challenge?.choices)) {
    const choiceKeys = challenge.choices.map(choice => normalizedChallengeValue(choice && typeof choice === 'object' ? choice.value : choice));
    if (choiceKeys.some(key => !key)) errors.push('Challenge choices cannot be blank.');
    if (choiceKeys.length !== new Set(choiceKeys).size) errors.push('Challenge choices must be unique.');
  }

  const canonicalGenerated = !!canonicalSkill && challenge?.source === 'curriculum';
  if (canonicalGenerated) {
    const template = CURRICULUM_ITEM_TEMPLATES[challenge.skillId];
    const hasMetadata = value => !!value && typeof value === 'object' && Object.keys(value).length > 0;
    if (challenge.subject !== canonicalSkill.subject) errors.push('Canonical generated content must match its taxonomy subject.');
    if (normalizeGradeLevel(challenge.grade) !== normalizeGradeLevel(canonicalSkill.grade)) errors.push('Canonical generated content must match its taxonomy grade.');
    if (challenge.domain !== canonicalSkill.domain) errors.push('Canonical generated content must match its taxonomy domain.');
    if (challenge.contentStatus !== CURRICULUM_CONTENT_STATUS) {
      errors.push(`Canonical generated content must declare contentStatus ${CURRICULUM_CONTENT_STATUS}.`);
    }
    if (!String(challenge.explanation || '').trim()) errors.push('Canonical generated content must include an explanation.');
    if (!hasMetadata(challenge.hintMetadata)) errors.push('Canonical generated content must include hint metadata.');
    if (!hasMetadata(challenge.supportMetadata)) errors.push('Canonical generated content must include support metadata.');
    if (!hasMetadata(challenge.answerVerification)) errors.push('Canonical generated content must include answer-verification metadata.');
    if (!template || challenge.templateId !== challenge.skillId) errors.push('Canonical generated content must link to its reviewed template.');
    if (template) {
      const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
      if (challenge.prompt !== template.prompt) errors.push('Canonical generated prompt does not match its reviewed template.');
      if (!same(normalizedAnswers, template.answers)) errors.push('Canonical generated answers do not match its reviewed template.');
      if (!same(normalizedDistractors, template.distractors)) errors.push('Canonical generated distractors do not match its reviewed template.');
      if (challenge.explanation !== template.explanation) errors.push('Canonical generated explanation does not match its reviewed template.');
      if (!same(challenge.hintMetadata, template.hintMetadata)) errors.push('Canonical generated hint metadata does not match its reviewed template.');
      const expectedSupportByDifficulty = {
        easy: { level: 'guided', scaffold: template.hintMetadata.hint },
        normal: { level: 'strategic', scaffold: template.hintMetadata.strategy },
        hard: { level: 'independent', scaffold: 'Answer from the information in the prompt, then check your reasoning.' },
      };
      const expectedSupport = expectedSupportByDifficulty[challenge.difficulty] || expectedSupportByDifficulty.normal;
      if (!same(challenge.supportMetadata, expectedSupport)) errors.push('Canonical generated support metadata does not match its reviewed difficulty.');
      if (!same(challenge.answerVerification, template.answerVerification)) errors.push('Canonical generated answer verification does not match its reviewed template.');
      if (family === ACTIVITY_FAMILIES.targetSmash && Array.isArray(challenge.choices)) {
        const choiceValues = challenge.choices.map(choice => choice && typeof choice === 'object' ? choice.value : choice);
        const expectedValues = [...template.answers, ...template.distractors];
        if (choiceValues.length !== expectedValues.length || expectedValues.some(value => !choiceValues.includes(value))) errors.push('Canonical generated choices do not match its reviewed template.');
        if (challenge.choices.some(choice => !!choice.correct !== template.answers.includes(choice.value))) errors.push('Canonical generated choice correctness does not match its reviewed template.');
      }
      if (family === ACTIVITY_FAMILIES.letterTrail && Array.isArray(challenge.choices)) {
        const choiceValues = challenge.choices.map(choice => choice && typeof choice === 'object' ? choice.value : choice);
        const expectedValues = [...template.answers, ...template.distractors];
        if (choiceValues.length !== expectedValues.length || expectedValues.some(value => !choiceValues.includes(value))) errors.push('Canonical generated sequence choices do not match its reviewed template.');
      }
      if (family === ACTIVITY_FAMILIES.knowledgePlatforms && Array.isArray(challenge.platforms)) {
        const platformValues = challenge.platforms.map(platform => platform && typeof platform === 'object' ? (platform.value ?? platform.label ?? platform.text) : platform);
        const expectedValues = [...template.answers, ...template.distractors];
        if (platformValues.length !== expectedValues.length || expectedValues.some(value => !platformValues.includes(value))) errors.push('Canonical generated platforms do not match its reviewed template.');
      }
    }
    if (/^(?:show mastery|practice|answer the question|choose the answer)\b/iu.test(prompt)) {
      errors.push('Canonical generated content must use a determinate, self-contained prompt.');
    }
    if (hasMetadata(challenge.answerVerification)) {
      if (normalizedAnswers.some(answer => !verifyCurriculumAnswer(challenge, answer))) {
        errors.push('Canonical generated content has a correct response that fails its answer predicate.');
      }
      if (normalizedDistractors.some(distractor => verifyCurriculumAnswer(challenge, distractor))) {
        errors.push('Canonical generated content has a distractor that satisfies its answer predicate.');
      }
    }
  }

  runDeterministicChallengeChecks(challenge, skill, validationOptions, errors);
  return {
    valid: errors.length === 0,
    errors,
    quarantined: errors.length ? [challenge.id || challenge.skillId || 'challenge'] : [],
    approved: errors.length === 0,
  };
}

function scoreContentQuality(challenge, skillDefinition = {}) {
  const validation = validateGeneratedChallenge(challenge, skillDefinition);
  const answers = Array.isArray(challenge?.answers) ? challenge.answers : Array.isArray(challenge?.targetSequence) ? challenge.targetSequence : Array.isArray(challenge?.platformOrder) ? challenge.platformOrder : [];
  const distractors = Array.isArray(challenge?.distractors) ? challenge.distractors : [];
  const hasExplanation = !!String(challenge?.explanation || '').trim();
  const hasHint = !!challenge?.hintMetadata && typeof challenge.hintMetadata === 'object' && Object.keys(challenge.hintMetadata).length > 0;
  const hasSupport = !!challenge?.supportMetadata && typeof challenge.supportMetadata === 'object' && Object.keys(challenge.supportMetadata).length > 0;
  const hasVerification = !!challenge?.answerVerification && typeof challenge.answerVerification === 'object'
    && answers.every(answer => verifyCurriculumAnswer(challenge, answer))
    && distractors.every(distractor => !verifyCurriculumAnswer(challenge, distractor));
  const semanticReady = hasExplanation && hasHint && hasSupport && hasVerification;
  let score = 20;
  if (validation.valid) score += 35;
  score += Math.min(answers.length, 3) * 5;
  score += Math.min(distractors.length, 3) * 4;
  if (hasExplanation) score += 8;
  if (hasHint && hasSupport) score += 8;
  if (hasVerification) score += 12;
  return {
    score: clamp(score, 0, 100),
    clarity: validation.valid && semanticReady ? 'clear' : 'needs-review',
    uniqueness: [...new Set([...answers, ...distractors].map(v => String(v).trim().toLowerCase()))].length === answers.length + distractors.length,
    gradeFit: validation.valid && !!skillDefinition?.grade,
    usefulness: validation.valid && semanticReady && score >= 70,
    validation,
  };
}

function buildCurriculumSession({
  learner,
  taxonomy = curriculumTaxonomy(),
  subject = null,
  grade = null,
  sessionMinutes = 20,
  skillStates = {},
  ratios = { currentLearning: 0.4, weak: 0.25, review: 0.2, confidence: 0.1, stretch: 0.05 },
} = {}) {
  const targeted = curriculumSkillsForGrade({ subject, grade, taxonomy });
  const skills = targeted.length ? targeted : curriculumSkillsForGrade({ subject, taxonomy });
  const availableStates = { ...(learner?.skills || {}), ...(skillStates || {}) };
  const learnerSkills = Object.fromEntries(skills.map(skill => [
    skill.id,
    normalizeSkillState(availableStates[skill.id], skill),
  ]));
  const base = buildAdaptiveSession({
    learner,
    skillStates: learnerSkills,
    desiredSessionMinutes: sessionMinutes,
    gradeLevel: normalizeGradeLevel(grade) || 'K',
    weakSkills: Object.values(learnerSkills).filter(skill => skill.masteryScore < 45),
    masteredSkills: Object.values(learnerSkills).filter(skill => skill.masteryState === 'Mastered'),
    staleSkills: selectStaleSkills(learnerSkills),
    reviewSchedule: Object.values(learnerSkills),
  });
  let previousFamily = null;
  const curriculumItems = base.items.map((item, index) => {
    const skill = findCurriculumSkill(item.skillId, taxonomy);
    if (!skill) return null;
    const supportedFamilies = skill.supportedActivityTypes.filter(family => Object.values(ACTIVITY_FAMILIES).includes(family));
    const family = supportedFamilies.find(candidate => candidate !== previousFamily) || supportedFamilies[0];
    if (!family) return null;
    const approval = createApprovedCurriculumChallenge(item.skillId, { taxonomy, family, seed: index });
    if (!approval.approved || !approval.challenge) return null;
    previousFamily = family;
    const challenge = { ...approval.challenge, approved: true, approvalStatus: approval.status };
    return {
      ...item,
      family,
      challenge,
      approvedChallenge: challenge,
      challengeApproval: {
        status: approval.status,
        approved: approval.approved,
        quarantined: approval.quarantined,
        errors: [...approval.errors],
      },
      what: {
        skillId: skill.id,
        subject: skill.subject,
        grade: skill.grade,
        domain: skill.domain,
        reason: item.reason,
        supportLevel: item.supportLevel,
      },
      how: {
        family,
        challengeId: challenge.id,
        approvalStatus: approval.status,
      },
    };
  }).filter(Boolean);
  const current = curriculumItems.filter(item => item.reason === 'current-learning').length;
  const review = curriculumItems.filter(item => item.reason === 'spaced-review').length;
  const weak = curriculumItems.filter(item => item.reason === 'weak-skill').length;
  const stretch = curriculumItems.filter(item => item.reason === 'stretch').length;
  return {
    ...base,
    items: curriculumItems,
    taxonomyVersion: taxonomy.version,
    subject,
    grade: normalizeGradeLevel(grade),
    ratios,
    curriculumSkills: skills.map(skill => ({ id: skill.id, subject: skill.subject, grade: skill.grade, domain: skill.domain })),
    counts: { current, review, weak, stretch },
  };
}

function buildParentInsights(learner, taxonomy = curriculumTaxonomy(), at = Date.now()) {
  const skillMap = curriculumSkillMap(taxonomy);
  const skills = Object.values(learner?.skills || {});
  const weekStart = at - 7 * 24 * 60 * 60 * 1000;
  const sessions = (learner?.sessions || []).filter(session => (session.ts || 0) >= weekStart);
  const practiceItems = (learner?.practice || []).filter(item => (item.ts || 0) >= weekStart);
  const bySubject = new Map();
  const enrich = skill => {
    const def = skillMap.get(skill.skillId) || null;
    const subject = def?.subject || 'custom';
    const current = bySubject.get(subject) || { subject, mastered: 0, practicing: 0, due: 0, weak: 0 };
    if (skill.masteryState === 'Mastered' || skill.masteryState === 'Strong') current.mastered += 1;
    if (skill.masteryState === 'Practicing' || skill.masteryState === 'Introduced') current.practicing += 1;
    if (skill.masteryScore < 45 || skill.evidence?.incorrectAttempts > skill.evidence?.independentSuccesses) current.weak += 1;
    if (skill.nextReviewAt && skill.nextReviewAt <= at) current.due += 1;
    bySubject.set(subject, current);
  };
  skills.forEach(enrich);
  const priority = skills
    .map(skill => {
      const def = skillMap.get(skill.skillId) || null;
      const due = !!skill.nextReviewAt && skill.nextReviewAt <= at;
      const weak = skill.masteryScore < 45 || skill.evidence?.incorrectAttempts > skill.evidence?.independentSuccesses;
      const stale = isSkillStale(skill, at);
      const score = 100 - skill.masteryScore + (due ? 20 : 0) + (weak ? 15 : 0) + (stale ? 10 : 0) - Math.round(skill.confidence * 10);
      return {
        skillId: skill.skillId,
        name: def?.name || skill.skillId,
        subject: def?.subject || 'custom',
        grade: def?.grade || null,
        masteryState: skill.masteryState,
        masteryScore: skill.masteryScore,
        confidence: skill.confidence,
        score,
        reason: stale ? 'stale-review' : due ? 'spaced-review' : weak ? 'weak-skill' : skill.masteryState === 'Mastered' ? 'stretch' : 'current-learning',
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const strength = [...skills].sort((a, b) => (b.confidence + b.masteryScore) - (a.confidence + a.masteryScore)).slice(0, 3).map(skill => ({ skillId: skill.skillId, masteryState: skill.masteryState, masteryScore: skill.masteryScore, confidence: skill.confidence }));
  const struggles = [...skills].sort((a, b) => (a.masteryScore + a.confidence * 10) - (b.masteryScore + b.confidence * 10)).slice(0, 3).map(skill => ({ skillId: skill.skillId, masteryState: skill.masteryState, masteryScore: skill.masteryScore, confidence: skill.confidence }));
  const improving = skills.filter(skill => skill.recentPerformance.slice(-3).filter(entry => entry.correct).length >= 2 && skill.recentPerformance.slice(-3).length >= 2).map(skill => ({ skillId: skill.skillId, masteryState: skill.masteryState, masteryScore: skill.masteryScore }));
  const totalAccuracy = sessions.length ? Math.round((sessions.reduce((sum, session) => sum + (session.accuracy || 0), 0) / sessions.length)) : null;
  return {
    generatedAt: new Date(at).toISOString(),
    weeklySummary: {
      sessions: sessions.length,
      practiceItems: practiceItems.length,
      homework: practiceItems.filter(item => item.homework || item.type === 'homework').length,
      avgAccuracy: totalAccuracy,
      recentSessions: sessions.slice(-5).map(session => ({ mission: session.mission, world: session.world, accuracy: session.accuracy, ts: session.ts })),
    },
    subjects: [...bySubject.values()].sort((a, b) => b.weak + b.due - (a.weak + a.due)),
    priority,
    strengths: strength,
    struggles,
    improving,
    nextSteps: priority.slice(0, 3).map(item => `${item.name} (${item.reason})`),
  };
}

function recordHomeworkAttempt(learner, skillId, attempt, definition = {}) {
  return recordLearnerAttempt(learner, skillId, { ...attempt, assisted: true, source: 'homework', homeworkMode: true, independent: false }, definition);
}

const DEFAULT_STAGE_ORDER = [
  'child-profile',
  'brainbase',
  'play-portal',
  'jungle-circuit',
  'target-smash',
  'letter-trail',
  'knowledge-platforms',
  'secret-reward',
  'fraction-kraken',
  'brainbase-upgrade',
  'save',
  'exit',
  'reopen',
  'continue',
];

const SUPPORT_BY_DIFFICULTY = {
  easy: 0.85,
  normal: 0.6,
  hard: 0.35,
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function clone(value) {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function deterministicEventId(value) {
  const source = stableJson(value);
  const words = [0x811c9dc5, 0x9e3779b9, 0x85ebca6b, 0xc2b2ae35];
  for (let index = 0; index < source.length; index += 1) {
    const code = source.charCodeAt(index);
    for (let lane = 0; lane < words.length; lane += 1) {
      words[lane] = Math.imul(words[lane] ^ (code + lane * 131), 0x01000193) >>> 0;
    }
  }
  const hex = words.map(word => word.toString(16).padStart(8, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

function boundedUniqueStrings(values, limit) {
  const unique = [];
  const seen = new Set();
  for (let index = values.length - 1; index >= 0; index -= 1) {
    const value = String(values[index] ?? '').trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    unique.push(value);
    if (unique.length >= limit) break;
  }
  return unique.reverse();
}

function uuid() {
  return globalThis.crypto?.randomUUID?.() ?? `bb-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function hasWindow() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function storageAdapter(storage) {
  if (storage) return storage;
  if (typeof localStorage !== 'undefined') return localStorage;
  const memory = new Map();
  return {
    getItem(key) {
      return memory.has(key) ? memory.get(key) : null;
    },
    setItem(key, value) {
      memory.set(key, String(value));
    },
    removeItem(key) {
      memory.delete(key);
    },
  };
}

function defaultLearner(name = 'Kid 1', profileId = uuid()) {
  return {
    profileId,
    name,
    stage: 'child-profile',
    completedStages: [],
    currentChallenge: null,
    activeActivity: null,
    hub: {
      variant: 'starter',
      expansionUnlocked: false,
      visibleChangeCount: 0,
      upgrades: [],
    },
    mastery: {},
    skills: {},
    rewards: [],
    rewardLedger: {},
    practice: [],
    sessions: [],
    telemetry: [],
    offlineQueue: [],
    sentEventIds: [],
    contentQuarantine: {},
    quarantinedRecords: [],
    recoverySnapshot: null,
    settings: {
      reducedMotion: false,
      highContrast: false,
      textScale: 1,
      captions: false,
      cameraMotionReduction: false,
      colorIndependentFeedback: true,
    },
    saveMeta: {
      version: CORE_VERSION,
      lastSavedAt: null,
      recoveryCreatedAt: null,
    },
  };
}

function normalizeLegacyProfiles(legacyStore) {
  const profiles = Array.isArray(legacyStore?.profiles) ? legacyStore.profiles : [];
  const active = Number.isInteger(legacyStore?.active) ? legacyStore.active : 0;
  return profiles.map((profile, index) => ({
    profileId: profile.id || `legacy-${index}`,
    name: String(profile.name || `Kid ${index + 1}`).trim() || `Kid ${index + 1}`,
    active: index === active,
  }));
}

function legacyActiveProfile(legacyStore) {
  const list = normalizeLegacyProfiles(legacyStore);
  return list.find(profile => profile.active) || list[0] || { profileId: 'legacy-default', name: 'Kid 1', active: true };
}

function createSkillState(skillId, definition = {}) {
  return {
    skillId,
    definitionId: definition.id || skillId,
    masteryScore: 0,
    confidence: 0.1,
    masteryState: 'Unknown',
    evidence: {
      attempts: 0,
      independentSuccesses: 0,
      assistedSuccesses: 0,
      hintsUsed: 0,
      incorrectAttempts: 0,
      rapidAttempts: 0,
      responseTimeMsTotal: 0,
    },
    evidenceProvenance: {
      version: 5,
      legacy: [0, 0, 0, 0, 0, 0, 0],
      packed: 'p2:',
    },
    recentPerformance: [],
    reviewHistory: [],
    prerequisiteState: {
      met: [],
      missing: clone(definition.prerequisites || []),
    },
    lastPracticedAt: null,
    lastIndependentSuccessAt: null,
    nextReviewAt: null,
    remediationLevel: 0,
    rewardIds: [],
  };
}

function masteryStateFor(score, confidence, evidence) {
  if (score >= 85 && confidence >= 0.72 && evidence.independentSuccesses >= 2 && evidence.incorrectAttempts <= 1) return 'Mastered';
  if (score >= 65) return 'Strong';
  if (score >= 45) return 'Developing';
  if (score >= 25) return 'Practicing';
  if (score >= 10) return 'Introduced';
  return 'Unknown';
}

function normalizeSkillState(skillState, definition = {}) {
  const base = createSkillState(skillState?.skillId || definition.id || 'skill', definition);
  if (!skillState || typeof skillState !== 'object') return base;
  const out = { ...base, ...clone(skillState) };
  out.evidence = { ...base.evidence, ...(skillState.evidence || {}) };
  out.recentPerformance = Array.isArray(skillState.recentPerformance) ? clone(skillState.recentPerformance) : [];
  out.reviewHistory = Array.isArray(skillState.reviewHistory) ? clone(skillState.reviewHistory) : [];
  out.prerequisiteState = {
    met: Array.isArray(skillState.prerequisiteState?.met) ? clone(skillState.prerequisiteState.met) : [...base.prerequisiteState.met],
    missing: Array.isArray(skillState.prerequisiteState?.missing) ? clone(skillState.prerequisiteState.missing) : [...base.prerequisiteState.missing],
  };
  out.rewardIds = Array.isArray(skillState.rewardIds) ? clone(skillState.rewardIds) : [];
  out.masteryScore = clamp(Number(out.masteryScore) || 0, 0, 100);
  out.confidence = clamp(Number(out.confidence) || 0, 0, 1);
  out.masteryState = MASTERY_STATES.includes(out.masteryState) ? out.masteryState : masteryStateFor(out.masteryScore, out.confidence, out.evidence);
  out.evidenceProvenance = evidenceProvenanceFor(skillState);
  return out;
}

function computeConfidence(evidence) {
  const base = 0.08;
  const score =
    base +
    evidence.independentSuccesses * 0.15 +
    evidence.assistedSuccesses * 0.07 -
    evidence.incorrectAttempts * 0.1 -
    evidence.hintsUsed * 0.015 -
    evidence.rapidAttempts * 0.12;
  return clamp(score, 0, 1);
}

function computeMasteryScore(skillState) {
  const evidence = skillState.evidence;
  const correctWeight = evidence.independentSuccesses * 16 + evidence.assistedSuccesses * 8;
  const penaltyWeight = evidence.incorrectAttempts * 7 + evidence.hintsUsed * 1.5 + evidence.rapidAttempts * 4;
  const responseBonus = evidence.attempts ? clamp(evidence.responseTimeMsTotal / evidence.attempts, 0, 15000) < 3500 ? 4 : 0 : 0;
  return clamp(correctWeight - penaltyWeight + responseBonus, 0, 100);
}

const EVIDENCE_KEYS = Object.freeze([
  'attempts',
  'independentSuccesses',
  'assistedSuccesses',
  'hintsUsed',
  'incorrectAttempts',
  'rapidAttempts',
  'responseTimeMsTotal',
]);

// Metadata-free callers stay bounded here; exact divergent merges require distinct stable origins and sequences.
const LOCAL_UNSCOPED_EVIDENCE_SOURCE = 'local-unscoped';
// The packed scalar remains exact through the supported operational ceiling.
// New writers fail closed before the provenance field can approach Firestore's
// 1 MiB document limit; existing evidence is never retired or approximated.
const PROVENANCE_SOURCE_LIMIT = 8192;
const PROVENANCE_PACKED_LIMIT = 480 * 1024;
const PROVENANCE_PACKED_PREFIX = 'p2:';
const PROVENANCE_SOURCE_CACHE = new WeakMap();
const UUID_SOURCE_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SKILL_QUARANTINE_REASON = 'invalid-skill-state';

function evidenceVector(evidence = {}) {
  if (Array.isArray(evidence)) return EVIDENCE_KEYS.map((_, index) => Math.max(0, Number(evidence[index]) || 0));
  return EVIDENCE_KEYS.map(key => Math.max(0, Number(evidence[key]) || 0));
}

function evidenceObject(vector = []) {
  return Object.fromEntries(EVIDENCE_KEYS.map((key, index) => [key, Math.max(0, Number(vector[index]) || 0)]));
}

function addEvidenceVectors(left = [], right = []) {
  return EVIDENCE_KEYS.map((_, index) => (Number(left[index]) || 0) + (Number(right[index]) || 0));
}

function provenanceSource(id, sequence, evidence = {}) {
  return {
    id: String(id),
    sequence: Math.max(0, Math.floor(Number(sequence) || 0)),
    ...evidenceObject(evidenceVector(evidence)),
  };
}

function writeVarint(bytes, rawValue) {
  let value = Math.max(0, Math.floor(Number(rawValue) || 0));
  if (!Number.isSafeInteger(value)) throw new Error('Evidence provenance contains an unsafe integer.');
  while (value >= 128) {
    bytes.push((value % 128) | 128);
    value = Math.floor(value / 128);
  }
  bytes.push(value);
}

function readVarint(bytes, cursor) {
  let value = 0;
  let factor = 1;
  for (let count = 0; count < 8; count += 1) {
    if (cursor.index >= bytes.length) throw new Error('Truncated evidence provenance.');
    const byte = bytes[cursor.index++];
    value += (byte & 127) * factor;
    if ((byte & 128) === 0) {
      if (!Number.isSafeInteger(value)) throw new Error('Evidence provenance contains an unsafe integer.');
      return value;
    }
    factor *= 128;
  }
  throw new Error('Invalid evidence provenance varint.');
}

function uuidBytes(value) {
  const hex = String(value).replaceAll('-', '');
  return Uint8Array.from(hex.match(/../g).map(pair => Number.parseInt(pair, 16)));
}

function uuidFromBytes(bytes) {
  const hex = [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function sourceIdentityBytes(id) {
  const value = String(id);
  const parts = value.split(':');
  if (parts.length === 2 && parts.every(part => UUID_SOURCE_PATTERN.test(part))) return Uint8Array.from([1, ...uuidBytes(parts[0]), ...uuidBytes(parts[1])]);
  if (UUID_SOURCE_PATTERN.test(value)) return Uint8Array.from([2, ...uuidBytes(value)]);
  return Uint8Array.from([0, ...new TextEncoder().encode(value)]);
}

function sourceIdentityFromBytes(bytes) {
  if (bytes[0] === 1 && bytes.length === 33) return `${uuidFromBytes(bytes.slice(1, 17))}:${uuidFromBytes(bytes.slice(17))}`;
  if (bytes[0] === 2 && bytes.length === 17) return uuidFromBytes(bytes.slice(1));
  if (bytes[0] === 0) return new TextDecoder().decode(bytes.slice(1));
  throw new Error('Invalid evidence provenance source identity.');
}

function bytesToBase64(bytes) {
  let binary = '';
  for (let index = 0; index < bytes.length; index += 0x8000) binary += String.fromCharCode(...bytes.slice(index, index + 0x8000));
  return btoa(binary);
}

function base64ToBytes(value) {
  const binary = atob(value);
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}

function encodeProvenanceSource(source, previousIdentity = new Uint8Array()) {
  const bytes = [];
  const identity = sourceIdentityBytes(source.id);
  let shared = 0;
  while (shared < previousIdentity.length && shared < identity.length && previousIdentity[shared] === identity[shared]) shared += 1;
  writeVarint(bytes, shared);
  writeVarint(bytes, identity.length - shared);
  for (let index = shared; index < identity.length; index += 1) bytes.push(identity[index]);
  writeVarint(bytes, source.sequence);
  for (const value of evidenceVector(source)) writeVarint(bytes, value);
  return bytesToBase64(Uint8Array.from(bytes));
}

function encodeProvenanceSources(rawSources) {
  const sources = [...rawSources].sort((left, right) => left.id.localeCompare(right.id));
  if (sources.length > PROVENANCE_SOURCE_LIMIT) throw new Error(`Evidence provenance writer limit (${PROVENANCE_SOURCE_LIMIT}) exceeded.`);
  let previousIdentity = new Uint8Array();
  const records = sources.map(source => {
    const encoded = encodeProvenanceSource(source, previousIdentity);
    previousIdentity = sourceIdentityBytes(source.id);
    return encoded;
  });
  const packed = `${PROVENANCE_PACKED_PREFIX}${records.join('.')}`;
  if (packed.length > PROVENANCE_PACKED_LIMIT) throw new Error(`Evidence provenance packed limit (${PROVENANCE_PACKED_LIMIT} bytes) exceeded.`);
  return packed;
}

function decodeProvenanceSources(packed) {
  if (typeof packed !== 'string' || !packed.startsWith(PROVENANCE_PACKED_PREFIX)) throw new Error('Invalid evidence provenance encoding.');
  const encodedRecords = packed.slice(PROVENANCE_PACKED_PREFIX.length) ? packed.slice(PROVENANCE_PACKED_PREFIX.length).split('.') : [];
  if (encodedRecords.length > PROVENANCE_SOURCE_LIMIT) throw new Error('Evidence provenance writer limit exceeded.');
  const sources = [];
  let previousIdentity = new Uint8Array();
  for (const encodedRecord of encodedRecords) {
    const bytes = base64ToBytes(encodedRecord);
    const cursor = { index: 0 };
    const shared = readVarint(bytes, cursor);
    const suffixLength = readVarint(bytes, cursor);
    if (shared > previousIdentity.length || cursor.index + suffixLength > bytes.length) throw new Error('Invalid evidence provenance prefix encoding.');
    const identity = new Uint8Array(shared + suffixLength);
    identity.set(previousIdentity.slice(0, shared));
    identity.set(bytes.slice(cursor.index, cursor.index + suffixLength), shared);
    cursor.index += suffixLength;
    const sequence = readVarint(bytes, cursor);
    const evidence = EVIDENCE_KEYS.map(() => readVarint(bytes, cursor));
    if (cursor.index !== bytes.length) throw new Error('Trailing evidence provenance bytes.');
    sources.push(provenanceSource(sourceIdentityFromBytes(identity), sequence, evidence));
    previousIdentity = identity;
  }
  return sources;
}

function provenanceRecord(legacy, sources) {
  const canonicalSources = [...sources].map(source => provenanceSource(source.id, source.sequence, source)).sort((left, right) => left.id.localeCompare(right.id));
  const record = { version: 5, legacy: evidenceVector(legacy), packed: encodeProvenanceSources(canonicalSources) };
  const represented = canonicalSources.reduce((sum, source) => addEvidenceVectors(sum, evidenceVector(source)), record.legacy);
  PROVENANCE_SOURCE_CACHE.set(record, { sources: canonicalSources, represented });
  return record;
}

function sourcesForProvenance(provenance) {
  const cached = PROVENANCE_SOURCE_CACHE.get(provenance);
  if (cached) return cached.sources;
  const sources = decodeProvenanceSources(provenance.packed);
  const represented = sources.reduce((sum, source) => addEvidenceVectors(sum, evidenceVector(source)), evidenceVector(provenance.legacy));
  PROVENANCE_SOURCE_CACHE.set(provenance, { sources, represented });
  return sources;
}

function appendProvenanceSource(provenance, source) {
  const sources = sourcesForProvenance(provenance);
  if (sources.length >= PROVENANCE_SOURCE_LIMIT) throw new Error(`Evidence provenance writer limit (${PROVENANCE_SOURCE_LIMIT}) exceeded.`);
  const previousIdentity = sources.length ? sourceIdentityBytes(sources.at(-1).id) : new Uint8Array();
  const encoded = encodeProvenanceSource(source, previousIdentity);
  const packed = `${provenance.packed}${sources.length ? '.' : ''}${encoded}`;
  if (packed.length > PROVENANCE_PACKED_LIMIT) throw new Error(`Evidence provenance packed limit (${PROVENANCE_PACKED_LIMIT} bytes) exceeded.`);
  const nextSources = [...sources, source];
  const record = { version: 5, legacy: provenance.legacy, packed };
  const represented = addEvidenceVectors(PROVENANCE_SOURCE_CACHE.get(provenance).represented, evidenceVector(source));
  PROVENANCE_SOURCE_CACHE.set(record, { sources: nextSources, represented });
  return record;
}

function evidenceProvenanceSources(value) {
  const provenance = value?.evidenceProvenance || value;
  try{return sourcesForProvenance(provenance).map(source => clone(source))}catch{return []}
}

function attemptIdentity(entry) {
  return entry?.id != null ? String(entry.id) : JSON.stringify({
    at: entry?.at || 0,
    correct: !!entry?.correct,
    assisted: !!entry?.assisted,
    hintsUsed: Number(entry?.hintsUsed) || 0,
    responseTimeMs: Number(entry?.responseTimeMs) || 0,
    source: entry?.source || 'practice',
    homeworkMode: !!entry?.homeworkMode,
    randomLike: !!entry?.randomLike,
    repeatedPattern: !!entry?.repeatedPattern,
  });
}

function evidenceFromRecords(records = []) {
  const evidence = evidenceObject();
  for (const entry of records) {
    evidence.attempts += 1;
    evidence.responseTimeMsTotal += Math.max(0, Number(entry.responseTimeMs) || 0);
    const assisted = !!entry.assisted || Number(entry.hintsUsed) > 0;
    if (entry.correct) {
      if (assisted) evidence.assistedSuccesses += 1;
      else evidence.independentSuccesses += 1;
      evidence.hintsUsed += Math.max(0, Number(entry.hintsUsed) || 0);
    } else evidence.incorrectAttempts += 1;
    if (Number(entry.responseTimeMs) > 0 && Number(entry.responseTimeMs) < 600) evidence.rapidAttempts += 1;
    if (entry.repeatedPattern) evidence.rapidAttempts += 1;
  }
  return evidence;
}

function mergeRecords(first, second, limit) {
  const unique = new Map();
  for (const entry of [...(first || []), ...(second || [])]) {
    if (entry && typeof entry === 'object' && !unique.has(attemptIdentity(entry))) unique.set(attemptIdentity(entry), clone(entry));
  }
  return [...unique.values()].sort((a, b) => (Number(a.at) || 0) - (Number(b.at) || 0)).slice(-limit);
}

function evidenceProvenanceFor(skillState) {
  const total = evidenceVector(skillState.evidence);
  const stored = skillState.evidenceProvenance;
  if (stored?.version === 5) {
    if (!Array.isArray(stored.legacy) || stored.legacy.length !== EVIDENCE_KEYS.length || typeof stored.packed !== 'string') {
      throw new Error('Invalid version 5 evidence provenance.');
    }
    if (stored.packed.length > PROVENANCE_PACKED_LIMIT) {
      throw new Error(`Evidence provenance packed limit (${PROVENANCE_PACKED_LIMIT} bytes) exceeded.`);
    }
    const cached = PROVENANCE_SOURCE_CACHE.get(stored);
    if (cached && cached.represented.every((value, index) => value === total[index])) return stored;
    sourcesForProvenance(stored);
    const represented = PROVENANCE_SOURCE_CACHE.get(stored).represented;
    if (represented.every((value, index) => value === total[index])) return stored;
    throw new Error('Version 5 evidence provenance does not match evidence totals.');
  }
  if ((stored?.version === 3 || stored?.version === 4) && Array.isArray(stored.legacy) && Array.isArray(stored.sources)) {
    const sources = new Map();
    let valid = stored.legacy.length === EVIDENCE_KEYS.length;
    const retired = stored.version === 4 ? evidenceVector(stored.retired?.evidence) : evidenceVector();
    if (stored.version === 4 && (!Array.isArray(stored.retired?.evidence) || stored.retired.evidence.length !== EVIDENCE_KEYS.length)) valid = false;
    for (const source of stored.sources) {
      const sequence = Number(source?.sequence);
      if (Array.isArray(source) || !source || typeof source !== 'object' || source.id == null
        || !Number.isSafeInteger(sequence) || sequence < 0 || sources.has(String(source.id))) {
        valid = false;
        break;
      }
      const canonical = provenanceSource(source.id, sequence, source);
      sources.set(canonical.id, canonical);
    }
    const migratedLegacy = addEvidenceVectors(stored.legacy, retired);
    const normalized = provenanceRecord(migratedLegacy, sources.values());
    const represented = [...sources.values()].reduce((sum, source) => addEvidenceVectors(sum, evidenceVector(source)), migratedLegacy);
    if (valid && represented.every((value, index) => value === total[index])) return normalized;
  }
  // Older attempt-list and provenance-free saves become one conservative, bounded aggregate.
  return provenanceRecord(total, []);
}

function scoreAttempt(attempt = {}, skillState = createSkillState('skill')) {
  const correct = !!attempt.correct;
  const assisted = !!attempt.assisted || (Number(attempt.hintsUsed) || 0) > 0;
  const independent = correct && !assisted && !!attempt.independent;
  const hintsUsed = Math.max(0, Number(attempt.hintsUsed) || 0);
  const responseTimeMs = Math.max(0, Number(attempt.responseTimeMs) || 0);
  const rapid = responseTimeMs > 0 && responseTimeMs < 600;

  const next = normalizeSkillState(skillState);
  const provenance = evidenceProvenanceFor(next);
  const provenanceSources = sourcesForProvenance(provenance);
  const hasExplicitOrigin = attempt.originId != null && attempt.originSequence != null;
  const sourceId = attempt.originId != null ? String(attempt.originId) : LOCAL_UNSCOPED_EVIDENCE_SOURCE;
  const existingSource = provenanceSources.find(source => source.id === sourceId);
  // A replayed attempt (same id, no or same origin) must not count twice. The
  // recent-performance ring is the cheapest durable record of what was scored.
  const attemptId = attempt.id || attempt.attemptId;
  if (attemptId != null && next.recentPerformance.some(record => record?.id === String(attemptId))) return next;
  const explicitSequence = Number(attempt.originSequence);
  const sourceSequence = hasExplicitOrigin && Number.isSafeInteger(explicitSequence) && explicitSequence > 0
    ? explicitSequence
    : (existingSource?.sequence || 0) + 1;
  if (existingSource && sourceSequence <= existingSource.sequence) return next;
  const performance = {
    id: String(attemptId || uuid()),
    correct,
    assisted,
    hintsUsed,
    responseTimeMs,
    at: attempt.at || Date.now(),
    source: attempt.source || 'practice',
    homeworkMode: !!attempt.homeworkMode,
    randomLike: !!attempt.randomLike,
    repeatedPattern: !!attempt.repeatedPattern,
    originId: sourceId,
    originSequence: sourceSequence,
  };
  next.evidence.attempts += 1;
  next.evidence.responseTimeMsTotal += responseTimeMs;
  next.lastPracticedAt = performance.at;
  next.recentPerformance.push(performance);
  next.recentPerformance = next.recentPerformance.slice(-12);

  if (correct) {
    if (independent) {
      next.evidence.independentSuccesses += 1;
      next.lastIndependentSuccessAt = next.lastPracticedAt;
      next.masteryScore += 18;
    } else {
      next.evidence.assistedSuccesses += 1;
      next.masteryScore += 9;
    }
    if (hintsUsed) next.evidence.hintsUsed += hintsUsed;
    if (rapid) next.evidence.rapidAttempts += 1;
  } else {
    next.evidence.incorrectAttempts += 1;
    next.masteryScore -= assisted ? 4 : 8;
    if (rapid) next.evidence.rapidAttempts += 1;
  }

  if (hintsUsed) next.masteryScore -= hintsUsed * 1.2;
  if (attempt.prerequisiteMissing) next.masteryScore -= 3;
  if (attempt.randomLike) next.masteryScore -= 4;
  if (attempt.repeatedPattern) next.evidence.rapidAttempts += 1;

  next.masteryScore = clamp(Math.round(next.masteryScore), 0, 100);
  next.confidence = computeConfidence(next.evidence);
  next.masteryState = masteryStateFor(next.masteryScore, next.confidence, next.evidence);
  next.prerequisiteState = {
    met: Array.isArray(attempt.prerequisitesMet) ? clone(attempt.prerequisitesMet) : next.prerequisiteState.met,
    missing: Array.isArray(attempt.prerequisitesMissing) ? clone(attempt.prerequisitesMissing) : next.prerequisiteState.missing,
  };
  const sourceEvidence = addEvidenceVectors(evidenceVector(existingSource), evidenceVector(evidenceFromRecords([performance])));
  const advancedSource = provenanceSource(sourceId, sourceSequence, evidenceObject(sourceEvidence));
  if (existingSource) {
    const advancedSources = provenanceSources.filter(source => source.id !== sourceId);
    advancedSources.push(advancedSource);
    next.evidenceProvenance = provenanceRecord(provenance.legacy, advancedSources);
  } else {
    next.evidenceProvenance = appendProvenanceSource(provenance, advancedSource);
  }

  return next;
}

function mergeSkillStates(leftValue, rightValue, { preferRight = false } = {}) {
  if (!leftValue) return normalizeSkillState(rightValue);
  if (!rightValue) return normalizeSkillState(leftValue);
  const left = normalizeSkillState(leftValue);
  const right = normalizeSkillState(rightValue);
  const preferred = preferRight ? right : left;
  const other = preferRight ? left : right;
  const mergedAllRecent = mergeRecords(left.recentPerformance, right.recentPerformance, 24);
  const leftProvenance = evidenceProvenanceFor(left);
  const rightProvenance = evidenceProvenanceFor(right);
  const mergedLegacy = leftProvenance.legacy.map((value, index) => Math.max(value, rightProvenance.legacy[index]));
  const legacyOutcomes = mergedLegacy[1] + mergedLegacy[2] + mergedLegacy[4];
  mergedLegacy[0] = Math.max(mergedLegacy[0], legacyOutcomes);
  const mergedSources = new Map();
  const preferredProvenance = preferRight ? rightProvenance : leftProvenance;
  const otherProvenance = preferRight ? leftProvenance : rightProvenance;
  for (const source of [...sourcesForProvenance(otherProvenance), ...sourcesForProvenance(preferredProvenance)]) {
    const existing = mergedSources.get(source.id);
    if (!existing || source.sequence > existing.sequence) {
      mergedSources.set(source.id, source);
    } else if (source.sequence === existing.sequence) {
      const tiedEvidence = evidenceVector(existing).map((value, index) => Math.max(value, evidenceVector(source)[index]));
      const tiedOutcomes = tiedEvidence[1] + tiedEvidence[2] + tiedEvidence[4];
      tiedEvidence[0] = Math.max(tiedEvidence[0], tiedOutcomes);
      mergedSources.set(source.id, provenanceSource(source.id, source.sequence, evidenceObject(tiedEvidence)));
    }
  }
  const mergedProvenance = provenanceRecord(mergedLegacy, mergedSources.values());
  const mergedEvidenceVector = sourcesForProvenance(mergedProvenance).reduce(
    (sum, source) => addEvidenceVectors(sum, evidenceVector(source)),
    mergedProvenance.legacy,
  );
  const merged = { ...clone(other), ...clone(preferred) };
  merged.evidence = evidenceObject(mergedEvidenceVector);
  merged.evidenceProvenance = mergedProvenance;
  merged.recentPerformance = mergedAllRecent.slice(-12);
  merged.reviewHistory = mergeRecords(left.reviewHistory, right.reviewHistory, 32);
  merged.lastPracticedAt = Math.max(Number(left.lastPracticedAt) || 0, Number(right.lastPracticedAt) || 0) || null;
  merged.lastIndependentSuccessAt = Math.max(Number(left.lastIndependentSuccessAt) || 0, Number(right.lastIndependentSuccessAt) || 0) || null;
  const reviewDates = [left.nextReviewAt, right.nextReviewAt].map(Number).filter(value => value > 0);
  merged.nextReviewAt = reviewDates.length ? Math.min(...reviewDates) : null;
  merged.remediationLevel = Math.max(Number(left.remediationLevel) || 0, Number(right.remediationLevel) || 0);
  merged.rewardIds = [...new Set([...(left.rewardIds || []), ...(right.rewardIds || [])])];
  merged.prerequisiteState = {
    met: [...new Set([...(left.prerequisiteState?.met || []), ...(right.prerequisiteState?.met || [])])],
    missing: [...new Set([...(left.prerequisiteState?.missing || []), ...(right.prerequisiteState?.missing || [])])],
  };
  const importedMasteryFloor = Math.max(left.legacyImported ? left.masteryScore : 0, right.legacyImported ? right.masteryScore : 0);
  // The incremental scorer (scoreAttempt) and the evidence formula
  // (computeMasteryScore) are tuned differently on purpose, so recomputing on
  // every merge would nudge a score even when the merge added no evidence.
  // When one side already holds exactly the merged evidence, its score stands;
  // only a merge that genuinely combines new evidence recomputes.
  const sameEvidence = (a, b) => EVIDENCE_KEYS.every(key => Number(a?.evidence?.[key]) === Number(b?.evidence?.[key]));
  if (merged.evidence.attempts > 0 && sameEvidence(merged, right) && !right.legacyImported) merged.masteryScore = right.masteryScore;
  else if (merged.evidence.attempts > 0 && sameEvidence(merged, left) && !left.legacyImported) merged.masteryScore = left.masteryScore;
  else merged.masteryScore = merged.evidence.attempts > 0 ? Math.round(computeMasteryScore(merged)) : importedMasteryFloor;
  merged.confidence = computeConfidence(merged.evidence);
  merged.masteryState = masteryStateFor(merged.masteryScore, merged.confidence, merged.evidence);
  return normalizeSkillState(merged);
}

function scheduleReview(skillState, attempt = {}, at = Date.now()) {
  const next = normalizeSkillState(skillState);
  const correct = !!attempt.correct;
  const independent = correct && !!attempt.independent && !(Number(attempt.hintsUsed) > 0 || attempt.assisted);
  const assisted = !!attempt.assisted || Number(attempt.hintsUsed) > 0;

  let minutes = 5;
  if (correct && independent) {
    const tier = next.masteryState === 'Mastered' ? 3 : next.masteryState === 'Strong' ? 2 : next.masteryState === 'Developing' ? 1.5 : 1;
    minutes = 30 * tier * (1 + next.confidence);
  } else if (correct && assisted) {
    minutes = 12;
  } else {
    minutes = 4;
  }

  if (next.evidence.rapidAttempts > 2) minutes = Math.min(minutes, 8);
  if (Number(attempt.hintsUsed) > 0) minutes *= 0.8;
  if (attempt.randomLike) minutes *= 0.5;

  const nextReviewAt = at + Math.round(clamp(minutes, 3, 60 * 24 * 7) * 60 * 1000);
  next.nextReviewAt = nextReviewAt;
  next.reviewHistory.push({
    at,
    correct,
    assisted,
    independent,
    hintsUsed: Number(attempt.hintsUsed) || 0,
    responseTimeMs: Math.max(0, Number(attempt.responseTimeMs) || 0),
    nextReviewAt,
  });
  next.reviewHistory = next.reviewHistory.slice(-32);
  return next;
}

function isSkillStale(skillState, at = Date.now()) {
  const state = normalizeSkillState(skillState);
  if (!state.lastIndependentSuccessAt) return false;
  const days = (at - state.lastIndependentSuccessAt) / (24 * 60 * 60 * 1000);
  return days >= 3 && state.masteryState !== 'Mastered';
}

function isReviewDue(skillState, at = Date.now()) {
  const state = normalizeSkillState(skillState);
  return !!state.nextReviewAt && state.nextReviewAt <= at;
}

function selectStaleSkills(skillStates, at = Date.now()) {
  return Object.values(skillStates || {}).filter(skillState => isSkillStale(skillState, at));
}

function selectDueSkills(skillStates, at = Date.now()) {
  return Object.values(skillStates || {}).filter(skillState => isReviewDue(skillState, at));
}

function createTargetSmashChallenge({
  id = uuid(),
  skillId,
  subject,
  grade,
  domain,
  source,
  prompt,
  answerType = 'text',
  answers = [],
  distractors = [],
  difficulty = 'normal',
  allowMovement = false,
  timed = false,
  supportLevel = SUPPORT_BY_DIFFICULTY[difficulty] ?? SUPPORT_BY_DIFFICULTY.normal,
}) {
  const uniqueAnswers = [...new Set(answers)];
  const uniqueDistractors = [...new Set(distractors)].filter(answer => !uniqueAnswers.includes(answer));
  const totalChoices = clamp(uniqueAnswers.length + uniqueDistractors.length, 2, 6);
  const pool = [...uniqueAnswers, ...uniqueDistractors].slice(0, totalChoices);
  const shuffled = pool.sort(() => Math.random() - 0.5);
  return {
    id,
    skillId,
    ...(subject !== undefined ? { subject } : {}),
    ...(grade !== undefined ? { grade } : {}),
    ...(domain !== undefined ? { domain } : {}),
    ...(source !== undefined ? { source } : {}),
    family: ACTIVITY_FAMILIES.targetSmash,
    prompt,
    answerType,
    difficulty,
    allowMovement,
    timed,
    supportLevel,
    answers: uniqueAnswers,
    distractors: uniqueDistractors,
    choices: shuffled.map((value, index) => ({
      id: `choice-${index + 1}`,
      value,
      correct: uniqueAnswers.includes(value),
      x: index % 3,
      y: Math.floor(index / 3),
    })),
    attempts: [],
    selected: [],
    completed: false,
  };
}

function resolveTargetSmashResult(challenge, selection, meta = {}) {
  const picked = Array.isArray(selection) ? selection : [selection];
  const correct = challenge.answers.every(answer => picked.includes(answer)) && picked.every(choice => challenge.answers.includes(choice));
  const attempt = {
    correct,
    assisted: !!meta.assisted,
    hintsUsed: Math.max(0, Number(meta.hintsUsed) || 0),
    responseTimeMs: Math.max(0, Number(meta.responseTimeMs) || 0),
    independent: !!meta.independent,
    randomLike: !!meta.randomLike,
  };
  return {
    challenge: {
      ...challenge,
      selected: picked,
      completed: correct,
      attempts: [...challenge.attempts, attempt],
    },
    attempt,
  };
}

function createLetterTrailChallenge({
  id = uuid(),
  skillId,
  subject,
  grade,
  domain,
  source,
  prompt,
  targetSequence = [],
  distractors = [],
  difficulty = 'normal',
}) {
  const uniqueSequence = [...new Set(targetSequence)];
  const choices = [...new Set([...uniqueSequence, ...distractors])].sort(() => Math.random() - 0.5);
  return {
    id,
    skillId,
    ...(subject !== undefined ? { subject } : {}),
    ...(grade !== undefined ? { grade } : {}),
    ...(domain !== undefined ? { domain } : {}),
    ...(source !== undefined ? { source } : {}),
    family: ACTIVITY_FAMILIES.letterTrail,
    prompt,
    difficulty,
    targetSequence: uniqueSequence,
    distractors: [...new Set(distractors)],
    choices,
    revealed: [],
    completed: false,
    hintsUsed: 0,
    errors: 0,
  };
}

function resolveLetterTrailChoice(challenge, letter, meta = {}) {
  const index = challenge.revealed.length;
  const expected = challenge.targetSequence[index];
  const correct = letter === expected;
  const revealed = correct ? [...challenge.revealed, letter] : [...challenge.revealed];
  return {
    challenge: {
      ...challenge,
      revealed,
      completed: revealed.length === challenge.targetSequence.length,
      hintsUsed: challenge.hintsUsed + (meta.hintUsed ? 1 : 0),
      errors: challenge.errors + (correct ? 0 : 1),
    },
    attempt: {
      correct,
      assisted: !!meta.assisted || !!meta.hintUsed,
      hintsUsed: meta.hintUsed ? 1 : 0,
      responseTimeMs: Math.max(0, Number(meta.responseTimeMs) || 0),
      independent: !!meta.independent,
      randomLike: !!meta.randomLike,
    },
  };
}

function createKnowledgePlatformChallenge({
  id = uuid(),
  skillId,
  subject,
  grade,
  domain,
  source,
  prompt,
  platformOrder = [],
  distractors = [],
  difficulty = 'normal',
}) {
  const order = [...new Set(platformOrder)];
  const platforms = [...new Set([...order, ...distractors])].sort(() => Math.random() - 0.5);
  return {
    id,
    skillId,
    ...(subject !== undefined ? { subject } : {}),
    ...(grade !== undefined ? { grade } : {}),
    ...(domain !== undefined ? { domain } : {}),
    ...(source !== undefined ? { source } : {}),
    family: ACTIVITY_FAMILIES.knowledgePlatforms,
    prompt,
    difficulty,
    platformOrder: order,
    distractors: [...new Set(distractors)],
    platforms,
    visited: [],
    completed: false,
  };
}

function resolveMissionChallenge(missionOrId, options = {}) {
  const missionId = typeof missionOrId === 'object' ? missionOrId?.id : missionOrId;
  const mission = EXPERIENCE_REGISTRY.getMission(missionId);
  const quarantine = (errors, challenge = null) => ({
    status: 'quarantined',
    approved: false,
    quarantined: true,
    challenge: challenge ? clone(challenge) : null,
    missionId: mission?.id ?? missionId ?? null,
    mission: mission ? clone(mission) : null,
    validation: { valid: false, approved: false, errors: [...errors], quarantined: [challenge?.id || `mission-${missionId || 'unknown'}`] },
    errors: [...errors],
    quarantine: { id: challenge?.id || `mission-${missionId || 'unknown'}`, errors: [...errors] },
  });
  if (!mission) return quarantine([`Unknown registry mission: ${missionId}.`]);
  const family = mission.activityFamily;
  if (!Object.values(ACTIVITY_FAMILIES).includes(family)) return quarantine([`Mission ${mission.id} has an unsupported activity family.`]);

  const skillDefinition = {
    id: mission.skill,
    subject: mission.world,
    grade: options.grade || 'K',
    domain: options.domain || `mission:${mission.skill}`,
    supportedActivityTypes: [family],
    difficultyBands: [...CURRICULUM_DIFFICULTY_BANDS],
    custom: true,
    canonical: false,
  };
  const common = {
    id: options.id || `mission-${mission.id}`,
    skillId: mission.skill,
    subject: skillDefinition.subject,
    grade: skillDefinition.grade,
    domain: skillDefinition.domain,
    source: 'mission-registry',
    prompt: mission.prompt,
    difficulty: options.difficulty || 'normal',
  };
  let challenge;
  try {
    if (family === ACTIVITY_FAMILIES.targetSmash) {
      const answers = mission.correct.slice(0, 3);
      const distractors = mission.wrong.filter(value => !answers.some(answer => normalizedChallengeValue(answer) === normalizedChallengeValue(value))).slice(0, Math.max(1, 6 - answers.length));
      challenge = createTargetSmashChallenge({ ...common, answers, distractors });
    } else if (family === ACTIVITY_FAMILIES.letterTrail) {
      challenge = createLetterTrailChallenge({
        ...common,
        targetSequence: mission.correct.slice(),
        distractors: mission.wrong.slice(0, 3),
      });
    } else {
      const platformOrder = mission.correct.slice(0, 3);
      const distractors = mission.wrong.filter(value => !platformOrder.some(answer => normalizedChallengeValue(answer) === normalizedChallengeValue(value))).slice(0, 3);
      challenge = createKnowledgePlatformChallenge({ ...common, platformOrder, distractors });
    }
  } catch (error) {
    return quarantine([`Mission ${mission.id} could not create a challenge: ${error.message}`]);
  }

  const validationOptions = {
    ...options,
    ...(options.validationOptions || {}),
    ...(options.validation || {}),
    allowCustomSkill: true,
  };
  const validation = validateGeneratedChallenge(challenge, skillDefinition, validationOptions);
  return {
    status: validation.valid ? 'approved' : 'quarantined',
    approved: validation.valid,
    quarantined: !validation.valid,
    challenge: clone(challenge),
    missionId: mission.id,
    mission: clone(mission),
    validation,
    errors: [...validation.errors],
    quarantine: validation.valid ? null : { id: challenge.id, errors: [...validation.errors] },
  };
}

function resolveKnowledgePlatformChoice(challenge, platform, meta = {}) {
  const index = challenge.visited.length;
  const expected = challenge.platformOrder[index];
  const correct = platform === expected;
  const visited = correct ? [...challenge.visited, platform] : [...challenge.visited];
  return {
    challenge: {
      ...challenge,
      visited,
      completed: visited.length === challenge.platformOrder.length,
    },
    attempt: {
      correct,
      assisted: !!meta.assisted,
      hintsUsed: Math.max(0, Number(meta.hintsUsed) || 0),
      responseTimeMs: Math.max(0, Number(meta.responseTimeMs) || 0),
      independent: !!meta.independent,
      randomLike: !!meta.randomLike,
    },
  };
}

function buildAdaptiveSession({
  learner,
  skillStates = {},
  desiredSessionMinutes = 20,
  gradeLevel = 'K',
  recentAttempts = [],
  weakSkills = [],
  masteredSkills = [],
  staleSkills = [],
  reviewSchedule = [],
} = {}) {
  const allSkills = Object.values(skillStates).map(skillState => normalizeSkillState(skillState));
  const dueSkills = reviewSchedule.filter(item => item.nextReviewAt && item.nextReviewAt <= Date.now());
  const prioritized = [
    ...staleSkills,
    ...dueSkills,
    ...weakSkills,
    ...allSkills.filter(state => state.masteryState === 'Unknown' || state.masteryState === 'Introduced' || state.masteryState === 'Practicing'),
    ...allSkills.filter(state => state.masteryState === 'Developing' || state.masteryState === 'Strong'),
    ...masteredSkills,
  ].filter(Boolean);

  const targetCount = clamp(Math.round(desiredSessionMinutes / 4), 3, 8);
  const unique = [];
  const seen = new Set();
  for (const skill of prioritized) {
    const id = typeof skill === 'string' ? skill : skill.skillId;
    if (!id || seen.has(id)) continue;
    seen.add(id);
    unique.push(typeof skill === 'string' ? { skillId: skill } : skill);
    if (unique.length >= targetCount) break;
  }

  const cycles = [ACTIVITY_FAMILIES.targetSmash, ACTIVITY_FAMILIES.letterTrail, ACTIVITY_FAMILIES.knowledgePlatforms];
  return {
    learner: learner ? clone(learner) : null,
    gradeLevel,
    desiredSessionMinutes,
    recentAttempts: clone(recentAttempts).slice(-20),
    items: unique.map((skill, index) => ({
      skillId: skill.skillId,
      family: cycles[index % cycles.length],
      supportLevel: skill.masteryState === 'Mastered' ? 0.25 : skill.masteryState === 'Strong' ? 0.4 : 0.8,
      reason: staleSkills.some(stale => stale.skillId === skill.skillId)
        ? 'stale-review'
        : weakSkills.some(weak => weak.skillId === skill.skillId)
          ? 'weak-skill'
          : dueSkills.some(due => due.skillId === skill.skillId)
            ? 'spaced-review'
            : skill.masteryState === 'Mastered'
              ? 'stretch'
              : 'current-learning',
    })),
  };
}

function remediateChallenge(challenge, skillState, reason = 'incorrect') {
  const next = clone(challenge);
  next.remediationLevel = (next.remediationLevel || 0) + 1;
  next.reason = reason;
  next.guided = true;
  next.supported = true;
  next.prompt = `${challenge.prompt} (guided)`;

  if (next.family === ACTIVITY_FAMILIES.targetSmash) {
    next.timed = false;
    next.allowMovement = false;
    next.choices = next.choices.slice(0, Math.max(2, Math.min(4, next.choices.length)));
    next.hints = [...(next.hints || []), 'Look for the exact answer first.'];
  } else if (next.family === ACTIVITY_FAMILIES.letterTrail) {
    next.choices = next.choices.slice(0, Math.max(3, Math.min(5, next.choices.length)));
    next.hints = [...(next.hints || []), 'Follow the path one step at a time.'];
  } else if (next.family === ACTIVITY_FAMILIES.knowledgePlatforms) {
    next.choices = next.choices.slice(0, Math.max(3, Math.min(5, next.choices.length)));
    next.hints = [...(next.hints || []), 'Use the sequence to choose the next platform.'];
  }

  if (skillState?.prerequisiteState?.missing?.length) {
    next.reviewPrerequisite = skillState.prerequisiteState.missing[0];
  }

  return next;
}

function validateContentBundle(bundle) {
  const errors = [];
  const quarantined = [];
  if (!bundle || typeof bundle !== 'object') {
    return { valid: false, errors: ['Content bundle must be an object.'], quarantined: ['bundle'] };
  }

  const identityOwners = new Map();
  const checkUnique = (items, type) => {
    const seen = new Set();
    for (const item of Array.isArray(items) ? items : []) {
      if (!item || typeof item !== 'object') {
        errors.push(`${type} entry must be an object.`);
        quarantined.push(type);
        continue;
      }
      if (!item.id) {
        errors.push(`${type} entry is missing id.`);
        quarantined.push(type);
      }
      if (seen.has(item.id)) {
        errors.push(`${type} entry has duplicate id ${item.id}.`);
        quarantined.push(item.id);
      }
      seen.add(item.id);
      if (item.id) {
        const owner = identityOwners.get(item.id);
        if (owner && owner !== type) {
          errors.push(`Content identity ${item.id} is duplicated by ${owner} and ${type}.`);
          quarantined.push(item.id);
        } else {
          identityOwners.set(item.id, type);
        }
      }
    }
  };

  checkUnique(bundle.worldDefinitions, 'world');
  checkUnique(bundle.activityDefinitions, 'activity');
  checkUnique(bundle.bossDefinitions, 'boss');
  checkUnique(bundle.rewardDefinitions, 'reward');

  for (const activity of Array.isArray(bundle.activityDefinitions) ? bundle.activityDefinitions : []) {
    if (!activity || typeof activity !== 'object') continue;
    const skillId = String(activity.skillId || '').trim();
    const skill = skillId ? findCurriculumSkill(skillId) : null;
    const source = String(activity.source || '').toLowerCase();
    const explicitCustom = activity.custom === true
      || activity.customSkill === true
      || activity.canonical === false
      || ['custom', 'legacy', 'vertical-slice', 'vertical-slice-registry', 'mission-registry'].includes(source)
      || LEGACY_VERTICAL_SLICE_SKILL_IDS.has(skillId);
    if (!skillId) {
      errors.push(`Activity ${activity.id} must declare a skillId.`);
      quarantined.push(activity.id);
    } else if (!skill && !explicitCustom) {
      errors.push(`Activity ${activity.id} references unknown canonical skill ${skillId}.`);
      quarantined.push(activity.id);
    }
    if (!Object.values(ACTIVITY_FAMILIES).includes(activity.family)) {
      errors.push(`Activity ${activity.id} has an unsupported activity family.`);
      quarantined.push(activity.id);
    }
    if (skill && !skill.supportedActivityTypes.includes(activity.family)) {
      errors.push(`Activity ${activity.id} uses a family unsupported by ${skillId}.`);
      quarantined.push(activity.id);
    }
    if (skill?.subject && activity.subject !== undefined && activity.subject !== skill.subject) {
      errors.push(`Activity ${activity.id} has a subject mismatch.`);
      quarantined.push(activity.id);
    }
    if (skill?.grade && activity.grade !== undefined && normalizeGradeLevel(activity.grade) !== normalizeGradeLevel(skill.grade)) {
      errors.push(`Activity ${activity.id} has a grade mismatch.`);
      quarantined.push(activity.id);
    }
    if (skill?.domain && activity.domain !== undefined && activity.domain !== skill.domain) {
      errors.push(`Activity ${activity.id} has a domain mismatch.`);
      quarantined.push(activity.id);
    }
    if (activity.family === ACTIVITY_FAMILIES.targetSmash) {
      const count = Array.isArray(activity.answers) ? activity.answers.length : 0;
      if (count < 1 || count > 6) {
        errors.push(`Target Smash activity ${activity.id} must have between 1 and 6 answers.`);
        quarantined.push(activity.id);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    quarantined: [...new Set(quarantined)],
  };
}

function contentManifest() {
  return clone(DEFAULT_CONTENT_BUNDLE);
}

function createFoundationState() {
  return {
    schemaVersion: CORE_VERSION,
    learners: {},
    activeLearnerId: null,
    version: CORE_VERSION,
    worldDefinitions: clone(DEFAULT_WORLD_DEFINITIONS),
    activityDefinitions: clone(DEFAULT_ACTIVITY_DEFINITIONS),
    bossDefinitions: clone(DEFAULT_BOSS_DEFINITIONS),
    rewardDefinitions: clone(DEFAULT_REWARD_DEFINITIONS),
    recoverySnapshot: null,
    saveMeta: {
      version: CORE_VERSION,
      lastSavedAt: null,
      recoveryCreatedAt: null,
    },
  };
}

function cleanRecoverySnapshot(value) {
  const snapshot = jsonSafeClone(value);
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) return null;
  // A snapshot is a single generation. Never carry its own snapshot forward.
  snapshot.recoverySnapshot = null;
  return snapshot;
}

function normalizeFoundationSaveMeta(value, fallback = {}) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? jsonSafeClone(value) : {};
  return {
    ...fallback,
    ...(source || {}),
    version: CORE_VERSION,
  };
}

function normalizeFoundationState(value, legacyStore) {
  const state = createFoundationState();
  if (value && typeof value === 'object') {
    if (value.learners && typeof value.learners === 'object') {
      for (const [key, learner] of Object.entries(value.learners)) {
        state.learners[key] = normalizeLearner(learner, key);
      }
    }
    if (value.activeLearnerId) state.activeLearnerId = String(value.activeLearnerId);
    if (Array.isArray(value.worldDefinitions)) state.worldDefinitions = clone(value.worldDefinitions);
    if (Array.isArray(value.activityDefinitions)) state.activityDefinitions = clone(value.activityDefinitions);
    if (Array.isArray(value.bossDefinitions)) state.bossDefinitions = clone(value.bossDefinitions);
    if (Array.isArray(value.rewardDefinitions)) state.rewardDefinitions = clone(value.rewardDefinitions);
    if (Object.prototype.hasOwnProperty.call(value, 'recoverySnapshot')) {
      state.recoverySnapshot = cleanRecoverySnapshot(value.recoverySnapshot);
    }
    if (Object.prototype.hasOwnProperty.call(value, 'saveMeta')) {
      state.saveMeta = normalizeFoundationSaveMeta(value.saveMeta, state.saveMeta);
    }
  }

  state.activityDefinitions = state.activityDefinitions.map(activity => {
    if (activity?.family !== ACTIVITY_FAMILIES.targetSmash) return activity;
    const answers = Array.isArray(activity.answers) ? activity.answers : [];
    if (answers.length >= 1 && answers.length <= 6) return activity;
    return {
      ...activity,
      answers: ['12', '18', '24'],
      distractors: Array.isArray(activity.distractors) && activity.distractors.length ? activity.distractors : ['13', '16', '27'],
    };
  });

  const legacy = normalizeLegacyProfiles(legacyStore);
  if (legacy.length) {
    for (const profile of legacy) {
      if (!state.learners[profile.profileId]) {
        state.learners[profile.profileId] = defaultLearner(profile.name, profile.profileId);
      }
    }
    state.activeLearnerId = state.activeLearnerId || legacyActiveProfile(legacyStore).profileId;
  }

  if (!state.activeLearnerId) {
    const firstKey = Object.keys(state.learners)[0];
    if (firstKey) state.activeLearnerId = firstKey;
  }
  if (state.activeLearnerId && !state.learners[state.activeLearnerId]) {
    const firstKey = Object.keys(state.learners)[0];
    state.activeLearnerId = firstKey || null;
  }
  if (!state.activeLearnerId) {
    const learner = defaultLearner();
    state.learners[learner.profileId] = learner;
    state.activeLearnerId = learner.profileId;
  }

  return state;
}

function normalizeLearner(learner, profileId) {
  const base = defaultLearner(learner?.name || 'Kid 1', profileId || learner?.profileId || uuid());
  if (!learner || typeof learner !== 'object') return base;
  const out = { ...base, ...clone(learner) };
  out.profileId = String(out.profileId || profileId || uuid());
  out.name = String(out.name || 'Kid 1').trim() || 'Kid 1';
  out.completedStages = Array.isArray(out.completedStages) ? [...new Set(out.completedStages)] : [];
  out.rewards = Array.isArray(out.rewards) ? clone(out.rewards) : [];
  out.rewardLedger = out.rewardLedger && typeof out.rewardLedger === 'object' ? { ...out.rewardLedger } : {};
  out.practice = Array.isArray(out.practice) ? clone(out.practice) : [];
  out.sessions = Array.isArray(out.sessions) ? clone(out.sessions) : [];
  // profileId is an opaque id, so any string containing it is private. The
  // child's name is ordinary text: only a whole-word, case-insensitive match
  // of a name at least three characters long counts, so a child called "Al"
  // or "e" does not erase every telemetry field that happens to contain those
  // letters. Structural key removal below still drops name-bearing fields.
  const privateIds = [out.profileId].filter(value => String(value || '').length > 0).map(String);
  const nameToken = String(out.name || '').trim();
  const namePattern = nameToken.length >= 3
    ? new RegExp(`(^|[^\\p{L}\\p{N}])${nameToken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=$|[^\\p{L}\\p{N}])`, 'iu')
    : null;
  const containsPrivateValue = value => privateIds.some(privateValue => value.includes(privateValue)) || (namePattern ? namePattern.test(value) : false);
  const privateValues = [...privateIds, ...(nameToken.length >= 3 ? [nameToken] : [])];
  const contentEventTypes = new Set(['LearningAttemptRecorded', 'ContentAttemptRecorded', 'ContentOutcomeObserved', 'ContentOutcomeFlagged']);
  const scrubCloudValue = value => {
    if (typeof value === 'string' && containsPrivateValue(value)) return undefined;
    if (Array.isArray(value)) return value.map(scrubCloudValue).filter(item => item !== undefined);
    if (!value || typeof value !== 'object') return value;
    return Object.fromEntries(Object.entries(value).flatMap(([key, child]) => {
      if (/^(?:profileId|childName|learnerName|answer|answers|prompt|selected)$/i.test(key)) return [];
      const scrubbed = scrubCloudValue(child);
      return scrubbed === undefined ? [] : [[key, scrubbed]];
    }));
  };
  const sanitizeContentEvent = (event, { keepProfileId = false, legacyIndex = 0 } = {}) => {
    const nextEvent = scrubCloudValue(clone(event)) || {};
    if (!keepProfileId) delete nextEvent.profileId;
    else nextEvent.profileId = out.profileId;
    nextEvent.id = String(nextEvent.id || nextEvent.eventId || deterministicEventId({ profileId: out.profileId, event: nextEvent }));
    delete nextEvent.eventId;
    nextEvent.payload = scrubCloudValue(nextEvent.payload || {});
    return nextEvent;
  };
  out.telemetry = Array.isArray(out.telemetry) ? clone(out.telemetry).map((event, legacyIndex) => contentEventTypes.has(event?.type) ? sanitizeContentEvent(event, { legacyIndex }) : event) : [];
  out.sentEventIds = boundedUniqueStrings(Array.isArray(out.sentEventIds) ? out.sentEventIds : [], SENT_EVENT_ID_LIMIT);
  const sentEventIds = new Set(out.sentEventIds);
  const queuedEventIds = new Set();
  const normalizedOfflineQueue = [];
  for (const [legacyIndex, value] of (Array.isArray(out.offlineQueue) ? clone(out.offlineQueue) : []).entries()) {
    if (!value || typeof value !== 'object') continue;
    const event = contentEventTypes.has(value.type)
      ? sanitizeContentEvent(value, { keepProfileId: true, legacyIndex })
      : { ...value, id: String(value.id || value.eventId || deterministicEventId({ profileId: out.profileId, event: value })), profileId: out.profileId };
    delete event.eventId;
    if (sentEventIds.has(event.id) || queuedEventIds.has(event.id)) continue;
    queuedEventIds.add(event.id);
    normalizedOfflineQueue.push(event);
  }
  out.offlineQueue = normalizedOfflineQueue.slice(-OFFLINE_QUEUE_LIMIT);
  out.contentQuarantine = out.contentQuarantine && typeof out.contentQuarantine === 'object' ? clone(out.contentQuarantine) : {};
  const quarantinedRecords = normalizeQuarantinedRecords(out.quarantinedRecords);
  out.recoverySnapshot = out.recoverySnapshot && typeof out.recoverySnapshot === 'object' ? clone(out.recoverySnapshot) : null;
  out.settings = { ...base.settings, ...(out.settings || {}) };
  out.hub = {
    ...base.hub,
    ...(out.hub || {}),
    upgrades: Array.isArray(out.hub?.upgrades) ? [...new Set(out.hub.upgrades)] : [],
  };
  out.mastery = out.mastery && typeof out.mastery === 'object' ? { ...out.mastery } : {};
  out.skills = learner.skills && typeof learner.skills === 'object'
    ? normalizeSkillStates(learner.skills, quarantinedRecords)
    : {};
  out.quarantinedRecords = quarantinedRecords;
  for (const skill of Object.values(out.skills)) for (const attempt of skill.recentPerformance || []) {
    if (privateValues.some(privateValue => String(attempt.id || '').includes(privateValue))) attempt.id = uuid();
    for (const key of ['profileId', 'childName', 'learnerName', 'answer', 'answers', 'prompt', 'selected']) delete attempt[key];
  }
  out.currentChallenge = out.currentChallenge && typeof out.currentChallenge === 'object' ? clone(out.currentChallenge) : null;
  out.activeActivity = out.activeActivity && typeof out.activeActivity === 'object' ? clone(out.activeActivity) : null;
  out.saveMeta = {
    ...base.saveMeta,
    ...(out.saveMeta || {}),
    version: CORE_VERSION,
  };
  if (quarantinedRecords.length) {
    const existingWarnings = Array.isArray(out.saveMeta.recoveryWarnings) ? out.saveMeta.recoveryWarnings : [];
    const generatedWarnings = quarantinedRecords.map(record => ({
      kind: record.kind,
      recordId: record.recordId,
      reason: SKILL_QUARANTINE_REASON,
    }));
    const warningKeys = new Set();
    out.saveMeta.recoveryWarnings = [...existingWarnings, ...generatedWarnings].filter(warning => {
      const key = `${warning?.kind || 'record'}:${warning?.recordId || 'unknown'}:${warning?.reason || SKILL_QUARANTINE_REASON}`;
      if (warningKeys.has(key)) return false;
      warningKeys.add(key);
      return !!warning && typeof warning === 'object';
    });
  }
  return out;
}

function jsonSafeClone(value) {
  try {
    const next = clone(value);
    JSON.stringify(next);
    return next;
  } catch {
    return undefined;
  }
}

function normalizeQuarantinedRecords(records) {
  if (!Array.isArray(records)) return [];
  return records.flatMap((record, index) => {
    if (!record || typeof record !== 'object' || Array.isArray(record)) return [];
    const next = jsonSafeClone(record) || {};
    const recordId = next.recordId ?? next.skillId ?? `quarantined-${index + 1}`;
    const normalized = {
      ...next,
      kind: String(next.kind || 'skill-state'),
      recordId: String(recordId),
      reason: next.kind === 'skill-state' || !next.reason ? SKILL_QUARANTINE_REASON : String(next.reason),
    };
    if (next.skillId != null) normalized.skillId = String(next.skillId);
    if ('raw' in normalized && jsonSafeClone(normalized.raw) === undefined) delete normalized.raw;
    return [normalized];
  });
}

function quarantineSkillRecord(skillId, skillState) {
  const record = {
    kind: 'skill-state',
    recordId: String(skillId),
    skillId: String(skillId),
    reason: SKILL_QUARANTINE_REASON,
  };
  const raw = jsonSafeClone(skillState);
  if (raw !== undefined) record.raw = raw;
  return record;
}

function normalizeSkillStates(skills, quarantinedRecords = []) {
  const next = {};
  for (const [skillId, skillState] of Object.entries(skills || {})) {
    try {
      if (!skillState || typeof skillState !== 'object' || Array.isArray(skillState)) {
        throw new Error('Invalid skill state record.');
      }
      if (Object.prototype.hasOwnProperty.call(skillState, 'evidence')) {
        const evidence = skillState.evidence;
        if (!evidence || typeof evidence !== 'object' || Array.isArray(evidence)) {
          throw new Error('Invalid skill evidence record.');
        }
        for (const key of EVIDENCE_KEYS) {
          if (evidence[key] === undefined || evidence[key] === null) continue;
          if (!Number.isFinite(Number(evidence[key])) || Number(evidence[key]) < 0) {
            throw new Error('Invalid skill evidence value.');
          }
        }
      }
      next[skillId] = normalizeSkillState(skillState, { id: skillId });
    } catch {
      quarantinedRecords.push(quarantineSkillRecord(skillId, skillState));
    }
  }
  return next;
}

function getActiveLearner(state) {
  const normalized = normalizeFoundationState(state);
  return normalized.learners[normalized.activeLearnerId];
}

function ensureLearnerSkill(learner, skillId, definition = {}) {
  const next = normalizeLearner(learner);
  if (!next.skills[skillId]) next.skills[skillId] = createSkillState(skillId, definition);
  return next.skills[skillId];
}

function recordLearnerAttempt(learner, skillId, attempt, definition = {}) {
  const next = normalizeLearner(learner);
  const current = ensureLearnerSkill(next, skillId, definition);
  const scored = scoreAttempt(attempt, current);
  if (scored.evidence.attempts === current.evidence.attempts) {
    next.skills[skillId] = scored;
    next.mastery[skillId] = scored.masteryScore;
    return next;
  }
  const reviewed = scheduleReview(scored, attempt, attempt.at || Date.now());
  next.skills[skillId] = reviewed;
  next.mastery[skillId] = reviewed.masteryScore;
  return next;
}

function recordBossVictory(learner, bossId, rewardDefinition = DEFAULT_REWARD_DEFINITIONS[0]) {
  const next = normalizeLearner(learner);
  const rewardId = rewardDefinition?.id || `reward-${bossId}`;
  const uniqueRewardId = `${bossId}:${rewardId}`;
  if (!next.rewardLedger[uniqueRewardId]) {
    next.rewardLedger[uniqueRewardId] = true;
    next.rewards.push({
      id: uniqueRewardId,
      bossId,
      rewardId,
      name: rewardDefinition?.name || 'Boss Reward',
      unique: rewardDefinition?.unique !== false,
      awardedAt: Date.now(),
    });
  }
  return next;
}

function grantBrainifact(learner, bossId = 'fraction-kraken') {
  return recordBossVictory(learner, bossId, DEFAULT_REWARD_DEFINITIONS[0]);
}

function upgradeBrainBase(learner) {
  const next = normalizeLearner(learner);
  next.hub.variant = 'upgraded';
  next.hub.expansionUnlocked = true;
  next.hub.visibleChangeCount += 1;
  if (!next.hub.upgrades.includes('brainbase-upgrade')) next.hub.upgrades.push('brainbase-upgrade');
  return next;
}

function queueOfflineEvent(learner, event) {
  const next = normalizeLearner(learner);
  if (!event || typeof event !== 'object' || !event.id) return next;
  const alreadyQueued = next.offlineQueue.some(item => item.id === event.id);
  const alreadySent = next.sentEventIds.includes(event.id);
  if (!alreadyQueued && !alreadySent) {
    next.offlineQueue.push({
      id: event.id,
      profileId: next.profileId,
      type: event.type || 'unknown',
      schemaVersion: Number.isFinite(Number(event.schemaVersion)) ? Number(event.schemaVersion) : CORE_VERSION,
      timestamp: event.timestamp || event.createdAt || Date.now(),
      payload: clone(event.payload || {}),
      createdAt: event.createdAt || Date.now(),
    });
  }
  return normalizeLearner(next);
}

function replayOfflineQueue(learner, transport) {
  const next = normalizeLearner(learner);
  const sent = [];
  const remaining = [];
  for (const event of next.offlineQueue) {
    if (next.sentEventIds.includes(event.id)) continue;
    const accepted = transport ? !!transport(clone(event)) : true;
    if (accepted) {
      next.sentEventIds.push(event.id);
      sent.push(event.id);
    } else {
      remaining.push(event);
    }
  }
  next.offlineQueue = remaining;
  return { learner: normalizeLearner(next), sent, skipped: remaining.length };
}

function addTelemetry(learner, event) {
  const next = normalizeLearner(learner);
  if (!event || typeof event !== 'object') return next;
  const telemetryEvent = {
    id: event.id || uuid(),
    type: event.type || 'event',
    createdAt: event.createdAt || Date.now(),
    payload: clone(event.payload || {}),
  };
  const existing = next.telemetry.some(item => item.id === telemetryEvent.id);
  if (!existing) next.telemetry.push(telemetryEvent);
  next.telemetry = next.telemetry.slice(-200);
  return normalizeLearner(next);
}

function isFoundationCandidate(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  if (!value.learners || typeof value.learners !== 'object' || Array.isArray(value.learners)) return false;
  const hasFoundationMarker = Object.prototype.hasOwnProperty.call(value, 'activeLearnerId')
    || Object.prototype.hasOwnProperty.call(value, 'schemaVersion')
    || Object.prototype.hasOwnProperty.call(value, 'version')
    || Object.prototype.hasOwnProperty.call(value, 'worldDefinitions')
    || Object.prototype.hasOwnProperty.call(value, 'activityDefinitions');
  if (!hasFoundationMarker) return false;
  if (value.activeLearnerId !== null && value.activeLearnerId !== undefined
    && typeof value.activeLearnerId !== 'string' && typeof value.activeLearnerId !== 'number') return false;
  for (const learner of Object.values(value.learners)) {
    if (!learner || typeof learner !== 'object' || Array.isArray(learner)) return false;
  }
  return true;
}

function persistFoundationState(state, storage) {
  const adapter = storageAdapter(storage);
  const normalized = normalizeFoundationState(state);
  const previousPrimary = readValidatedState(adapter, STORAGE_KEY);
  const previousBackup = readValidatedState(adapter, BACKUP_KEY);
  const currentPayload = JSON.stringify(normalized);
  const backupState = previousPrimary ? normalizeFoundationState(previousPrimary) : normalized;
  const recoveryState = previousBackup
    ? normalizeFoundationState(previousBackup)
    : previousPrimary
      ? normalizeFoundationState(previousPrimary)
      : normalized;

  // Compute every generation before writing so a save rotates older valid data
  // instead of replacing all three slots with the current payload.
  adapter.setItem(RECOVERY_KEY, JSON.stringify(recoveryState));
  adapter.setItem(BACKUP_KEY, JSON.stringify(backupState));
  adapter.setItem(STORAGE_KEY, currentPayload);
  return normalized;
}

function readParsedState(adapter, key) {
  const raw = adapter.getItem(key);
  if (!raw) return null;
  return JSON.parse(raw);
}

function readValidatedState(adapter, key) {
  try {
    const parsed = readParsedState(adapter, key);
    return isFoundationCandidate(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function loadFoundationState(storage, legacyStore) {
  const adapter = storageAdapter(storage);
  const legacy = legacyStore || tryReadLegacyStore(adapter);
  for (const key of [STORAGE_KEY, BACKUP_KEY, RECOVERY_KEY]) {
    const candidate = readValidatedState(adapter, key);
    if (!candidate) continue;
    try {
      return normalizeFoundationState(candidate, legacy);
    } catch {
      // A malformed child record must not prevent trying the next generation.
    }
  }
  return normalizeFoundationState(createFoundationState(), legacy);
}

function tryReadLegacyStore(adapter) {
  try {
    return JSON.parse(adapter.getItem(LEGACY_PROFILE_KEY) || 'null');
  } catch {
    return null;
  }
}

function createRecoverySnapshot(state) {
  const next = normalizeFoundationState(state);
  const snapshot = clone(next);
  snapshot.recoverySnapshot = null;
  next.saveMeta = normalizeFoundationSaveMeta(next.saveMeta, createFoundationState().saveMeta);
  next.recoverySnapshot = snapshot;
  next.saveMeta.recoveryCreatedAt = Date.now();
  return next;
}

function restoreFromRecoverySnapshot(state) {
  const next = normalizeFoundationState(state);
  if (next.recoverySnapshot && typeof next.recoverySnapshot === 'object') {
    const snapshot = cleanRecoverySnapshot(next.recoverySnapshot);
    if (snapshot && isFoundationCandidate(snapshot)) {
      const restored = normalizeFoundationState(snapshot);
      restored.recoverySnapshot = null;
      return restored;
    }
  }
  return next;
}

function resolveLegacyProfileName(storage) {
  const legacy = tryReadLegacyStore(storageAdapter(storage));
  return legacyActiveProfile(legacy);
}

function createVerticalSliceContent() {
  return {
    worldDefinitions: clone(DEFAULT_WORLD_DEFINITIONS),
    activityDefinitions: clone(DEFAULT_ACTIVITY_DEFINITIONS),
    bossDefinitions: clone(DEFAULT_BOSS_DEFINITIONS),
    rewardDefinitions: clone(DEFAULT_REWARD_DEFINITIONS),
  };
}

function mapChallengeResultToSkill(challenge, result) {
  if (!challenge || !result) return null;
  return {
    skillId: challenge.skillId,
    family: challenge.family,
    correct: !!result.attempt?.correct,
    assisted: !!result.attempt?.assisted,
    hintsUsed: Number(result.attempt?.hintsUsed) || 0,
    responseTimeMs: Number(result.attempt?.responseTimeMs) || 0,
    independent: !!result.attempt?.independent,
    randomLike: !!result.attempt?.randomLike,
  };
}

function setStageComplete(learner, stageId) {
  const next = normalizeLearner(learner);
  if (!next.completedStages.includes(stageId)) next.completedStages.push(stageId);
  next.stage = stageId;
  return next;
}

function advanceStage(learner, stageId) {
  const next = setStageComplete(learner, stageId);
  const index = DEFAULT_STAGE_ORDER.indexOf(stageId);
  if (index >= 0 && index < DEFAULT_STAGE_ORDER.length - 1) {
    next.stage = DEFAULT_STAGE_ORDER[index + 1];
  }
  return next;
}

function exportFoundationEnvelope(state) {
  const normalized = normalizeFoundationState(state);
  return {
    version: CORE_VERSION,
    exportedAt: new Date().toISOString(),
    payload: normalized,
  };
}

function importFoundationEnvelope(envelope, legacyStore) {
  if (!envelope || typeof envelope !== 'object' || !envelope.payload) {
    throw new Error('Invalid foundation envelope');
  }
  return normalizeFoundationState(envelope.payload, legacyStore);
}

function createPersistentStagePlan(state) {
  const foundation = normalizeFoundationState(state);
  const active = foundation.learners[foundation.activeLearnerId];
  return {
    activeLearnerId: foundation.activeLearnerId,
    learner: active,
    stages: DEFAULT_STAGE_ORDER.map(stageId => ({
      id: stageId,
      label: stageLabel(stageId),
      complete: active.completedStages.includes(stageId),
      active: active.stage === stageId,
    })),
    hub: clone(active.hub),
  };
}

function stageLabel(stageId) {
  const labels = {
    'child-profile': 'Child Profile',
    brainbase: 'BrainBase',
    'play-portal': 'Play Portal',
    'jungle-circuit': 'Jungle Circuit',
    'target-smash': 'Target Smash',
    'letter-trail': 'Letter Trail',
    'knowledge-platforms': 'Knowledge Platforms',
    'secret-reward': 'Secret / Reward',
    'fraction-kraken': 'Fraction Kraken',
    'brainbase-upgrade': 'BrainBase Upgrade',
    save: 'Save',
    exit: 'Exit',
    reopen: 'Reopen',
    continue: 'Continue',
  };
  return labels[stageId] || stageId;
}

function krakenPhaseLabel(phase) {
  const labels = {
    1: 'INTRO / RECOGNITION',
    2: 'EQUIVALENCE',
    3: 'COMPARISON / BRAINBLAST',
    4: 'VICTORY',
  };
  return labels[phase] || `PHASE ${phase}`;
}

function brainBaseZoneCards(foundation, learner) {
  const upgraded = learner.hub.variant === 'upgraded';
  const rewardCount = Array.isArray(learner.rewards) ? learner.rewards.length : 0;
  return [
    {
      title: 'Child Profile',
      state: learner.name,
      note: 'Child profile dock. Identity is isolated per child.',
      tone: 'profile',
    },
    {
      title: 'Play Portal',
      state: upgraded ? 'Open' : 'Ready',
      note: upgraded ? 'Replays the full slice.' : 'Launch into Jungle Circuit.',
      tone: 'portal',
    },
    {
      title: 'World Gate',
      state: upgraded ? 'Unlocked' : 'Sealed',
      note: upgraded ? 'The hub now routes to Jungle upgrade flow.' : 'Locked until the slice is cleared.',
      tone: 'gate',
    },
    {
      title: 'Bite House',
      state: learner.bite || 'Nib',
      note: 'Placeholder home for the current Bite.',
      tone: 'house',
    },
    {
      title: 'Brainifact Nook',
      state: `${rewardCount} reward${rewardCount === 1 ? '' : 's'}`,
      note: upgraded ? 'The Kraken Brainifact is on display.' : 'Trophy and reward space stay visible.',
      tone: 'trophy',
    },
    {
      title: 'Locked Expansion',
      state: upgraded ? 'Opening' : 'Locked',
      note: upgraded ? 'The Jungle upgrade has transformed the hub.' : 'Future world wing remains hidden.',
      tone: 'expansion',
    },
    {
      title: 'Upgrade Hooks',
      state: learner.hub.expansionUnlocked ? 'Active' : 'Dormant',
      note: 'Learning gains physically change the BrainBase.',
      tone: 'upgrade',
    },
  ];
}

function brainBaseReactivity(learner) {
  return learner.hub.variant === 'upgraded'
    ? [
        { verb: 'Activate', state: 'on' },
        { verb: 'Reveal', state: 'on' },
        { verb: 'Repair', state: 'on' },
        { verb: 'Grow', state: 'on' },
        { verb: 'Illuminate', state: 'on' },
        { verb: 'Transform', state: 'on' },
      ]
    : [
        { verb: 'Activate', state: 'ready' },
        { verb: 'Reveal', state: 'ready' },
        { verb: 'Repair', state: 'ready' },
        { verb: 'Grow', state: 'locked' },
        { verb: 'Illuminate', state: 'locked' },
        { verb: 'Transform', state: 'locked' },
      ];
}

function renderBrainBaseShell(root, state, options = {}) {
  if (!root) return null;
  const foundation = normalizeFoundationState(state, options.legacyStore);
  const learner = foundation.learners[foundation.activeLearnerId];
  const profile = legacyActiveProfile(options.legacyStore || tryReadLegacyStore(storageAdapter(options.storage)));
  const stagePlan = createPersistentStagePlan(foundation);
  const zones = brainBaseZoneCards(foundation, learner);
  const reactions = brainBaseReactivity(learner);
  const trail = DEFAULT_STAGE_ORDER.map(stageId => `
    <span class="bbf-trail-chip ${learner.completedStages.includes(stageId) ? 'complete' : stagePlan.stages.find(stage => stage.id === stageId)?.active ? 'active' : ''}">
      ${stageLabel(stageId)}
    </span>
  `).join('');
  const stageItems = stagePlan.stages.map(stage => `
    <button class="bbf-stage ${stage.active ? 'active' : ''} ${stage.complete ? 'complete' : ''}" data-stage="${stage.id}">
      <span>${stage.complete ? '✓' : stage.active ? '▶' : '•'}</span>
      <strong>${stage.label}</strong>
    </button>
  `).join('');

  root.innerHTML = `
    <div class="bbf-shell ${learner.hub.variant === 'upgraded' ? 'bbf-upgraded' : 'bbf-starter'}">
      <div class="bbf-hero">
        <div>
          <p class="bbf-kicker">Greybox vertical slice</p>
          <h2>BrainBase</h2>
          <p class="bbf-subtitle">Profile: <strong>${escapeHtml(profile.name)}</strong></p>
          <p class="bbf-subtitle">Visible change: <strong>${learner.hub.variant === 'upgraded' ? 'Kraken Brainifact installed' : 'Starter hub'}</strong></p>
          <div class="bbf-reactivity">${reactions.map(item => `<span class="bbf-react-chip ${item.state}">${item.verb}</span>`).join('')}</div>
        </div>
        <div class="bbf-hub-mark ${learner.hub.variant === 'upgraded' ? 'expanded' : ''}">
          <span class="bbf-hub-core"></span>
          <span class="bbf-hub-ring"></span>
        </div>
      </div>
      <div class="bbf-trailbar">${trail}</div>
      <div class="bbf-grid">
        <section class="bbf-panel">
          <h3>Hub</h3>
          <div class="bbf-zone-grid">
            ${zones.map(zone => `
              <article class="bbf-zone bbf-zone-${zone.tone}">
                <p class="bbf-zone-state">${escapeHtml(zone.state)}</p>
                <h4>${escapeHtml(zone.title)}</h4>
                <p>${escapeHtml(zone.note)}</p>
              </article>
            `).join('')}
          </div>
        </section>
        <section class="bbf-panel">
          <h3>Progression</h3>
          <div class="bbf-stage-list">${stageItems}</div>
        </section>
        <section class="bbf-panel">
          <h3>Learning Core</h3>
          <p id="bbf-recommendation">${sessionRecommendation(foundation, learner)}</p>
          <p id="bbf-review">${reviewSummary(learner)}</p>
          <div id="bbf-activity"></div>
        </section>
      </div>
      <div class="bbf-actions">
        <button data-action="refresh">Refresh Profile</button>
        <button data-action="save">Save</button>
        <button data-action="reopen">Reopen</button>
        <button data-action="exit">Exit</button>
        <button data-action="continue">Continue</button>
      </div>
    </div>
  `;

  const activity = root.querySelector('#bbf-activity');
  const refresh = () => renderActivity(root, foundation, learner, options);
  const saveState = () => {
    const latest = persistFoundationState(foundation, options.storage);
    if (options.onSave) options.onSave(latest);
    return latest;
  };

  root.querySelectorAll('[data-stage]').forEach(button => {
    button.addEventListener('click', () => {
      const stageId = button.getAttribute('data-stage');
      learner.stage = stageId;
      renderActivity(root, foundation, learner, options);
      saveState();
    });
  });
  root.querySelectorAll('[data-action]').forEach(button => {
    button.addEventListener('click', () => {
      const action = button.getAttribute('data-action');
      if (action === 'refresh') {
        const reloaded = loadFoundationState(options.storage, options.legacyStore);
        renderBrainBaseShell(root, reloaded, options);
        if (options.onRefresh) options.onRefresh(reloaded);
        return;
      }
      if (action === 'save') {
        learner.saveMeta.lastSavedAt = Date.now();
        saveState();
        refresh();
        return;
      }
      if (action === 'exit' && hasWindow()) {
        const exitButton = document.querySelector('button[data-screen="home"]');
        if (exitButton) exitButton.click();
      }
      if (action === 'reopen') {
        learner.stage = 'brainbase';
        renderActivity(root, foundation, learner, options);
        saveState();
        return;
      }
      if (action === 'continue') {
        learner.stage = nextIncompleteStage(learner) || learner.stage || 'brainbase';
        renderActivity(root, foundation, learner, options);
        saveState();
      }
    });
  });

  if (activity) renderActivity(root, foundation, learner, options);
  persistFoundationState(foundation, options.storage);
  return foundation;
}

function nextIncompleteStage(learner) {
  return DEFAULT_STAGE_ORDER.find(stageId => !learner.completedStages.includes(stageId)) || learner.stage || 'brainbase';
}

function sessionRecommendation(foundation, learner) {
  const plan = createPersistentStagePlan(foundation);
  const activeStage = plan.stages.find(stage => stage.active);
  if (!activeStage) return 'No active stage selected yet.';
  if (learner.hub.variant === 'upgraded') return 'BrainBase upgraded. Continue from the hub or replay the slice.';
  return `Current stage: ${activeStage.label}. Clear the greybox flow to reveal the hub upgrade.`;
}

function reviewSummary(learner) {
  const dueCount = selectDueSkills(learner.skills).length;
  const staleCount = selectStaleSkills(learner.skills).length;
  return `${dueCount} skill(s) due for review, ${staleCount} stale skill(s) awaiting recheck.`;
}

function renderActivity(root, foundation, learner, options) {
  const slot = root.querySelector('#bbf-activity');
  if (!slot) return;
  const stage = learner.stage || 'brainbase';
  const existing = learner.activeActivity;
  const expectedFamily = activityFamilyForStage(stage);
  const current = existing && existing.family === expectedFamily ? existing : createActivityForStage(stage, learner, foundation);
  learner.activeActivity = current;
  slot.innerHTML = activityMarkup(stage, current, learner);
  wireActivity(slot, foundation, learner, options);
}

function activityFamilyForStage(stage) {
  switch (stage) {
    case 'target-smash':
      return ACTIVITY_FAMILIES.targetSmash;
    case 'letter-trail':
      return ACTIVITY_FAMILIES.letterTrail;
    case 'knowledge-platforms':
      return ACTIVITY_FAMILIES.knowledgePlatforms;
    case 'fraction-kraken':
      return 'Fraction Kraken';
    case 'secret-reward':
      return 'Reward Chest';
    default:
      return stageLabel(stage);
  }
}

function createActivityForStage(stage, learner, foundation) {
  switch (stage) {
    case 'target-smash':
      return createTargetSmashChallenge({
        skillId: 'number-facts',
        prompt: 'Smash the correct paths to open Jungle Circuit.',
        answerType: 'numeric',
        answers: ['12', '18', '24'],
        distractors: ['13', '16', '27'],
        difficulty: 'normal',
        allowMovement: false,
      });
    case 'letter-trail':
      return createLetterTrailChallenge({
        skillId: 'word-order',
        prompt: 'Follow the trail through Jungle Circuit.',
        targetSequence: ['J', 'U', 'N', 'G', 'L', 'E'],
        distractors: ['B', 'R', 'A', 'I', 'N'],
      });
    case 'knowledge-platforms':
      return createKnowledgePlatformChallenge({
        skillId: 'fraction-meaning',
        prompt: 'Step on the knowledge platforms in the right order.',
        platformOrder: ['Count', 'Compare', 'Explain'],
        distractors: ['Guess', 'Skip', 'Rush'],
      });
    case 'secret-reward':
      return { family: 'Reward Chest', prompt: 'Open the secret chest to unlock the brainifact.', open: false };
    case 'fraction-kraken':
      return {
        family: 'Fraction Kraken',
        prompt: 'Defeat the Kraken in three greybox phases.',
        phase: 1,
        health: 3,
        choices: ['1/2', '2/4', '3/4', '1/3'],
        rewards: [],
      };
    default:
      return { family: stageLabel(stage), prompt: 'Advance the greybox flow.' };
  }
}

function activityMarkup(stage, activity, learner) {
  const stageLabelText = stageLabel(stage);
  if (stage === 'secret-reward') {
    return `
      <div class="bbf-activity-card">
        <h4>${stageLabelText}</h4>
        <p>${activity.prompt}</p>
        <button data-reward-open>Open chest</button>
        <p class="bbf-feedback">${activity.open ? 'Chest opened.' : 'Chest is sealed.'}</p>
      </div>
    `;
  }
  if (stage === 'fraction-kraken') {
    return `
      <div class="bbf-activity-card">
        <h4>${stageLabelText}</h4>
        <p>${activity.prompt}</p>
        <p class="bbf-phase">Kraken stage: <strong>${krakenPhaseLabel(activity.phase)}</strong></p>
        <p class="bbf-phase">Health: ${activity.health} tentacles remaining</p>
        <div class="bbf-choice-grid">${activity.choices.map(choice => `<button data-choice="${choice}">${choice}</button>`).join('')}</div>
        <p class="bbf-feedback">${learner.hub.expansionUnlocked ? 'The BrainBase already shows the Kraken upgrade.' : 'The hub is still in starter form.'}</p>
      </div>
    `;
  }
  if (activity.family === ACTIVITY_FAMILIES.targetSmash) {
    return `
      <div class="bbf-activity-card">
        <h4>${stageLabelText}</h4>
        <p>${activity.prompt}</p>
        <div class="bbf-choice-grid">${activity.choices.map(choice => `<button data-choice="${escapeHtml(choice.value)}">${escapeHtml(choice.value)}</button>`).join('')}</div>
        <p class="bbf-feedback">${activity.completed ? 'Target Smash complete.' : 'Pop the correct answers.'}</p>
      </div>
    `;
  }
  if (activity.family === ACTIVITY_FAMILIES.letterTrail) {
    return `
      <div class="bbf-activity-card">
        <h4>${stageLabelText}</h4>
        <p>${activity.prompt}</p>
        <div class="bbf-trail">${activity.choices.map(choice => `<button data-letter="${escapeHtml(choice)}">${escapeHtml(choice)}</button>`).join('')}</div>
        <p class="bbf-feedback">Trail progress: ${activity.revealed.join('')}</p>
      </div>
    `;
  }
  if (activity.family === ACTIVITY_FAMILIES.knowledgePlatforms) {
    return `
      <div class="bbf-activity-card">
        <h4>${stageLabelText}</h4>
        <p>${activity.prompt}</p>
        <div class="bbf-choice-grid">${activity.platforms.map(choice => `<button data-platform="${escapeHtml(choice)}">${escapeHtml(choice)}</button>`).join('')}</div>
        <p class="bbf-feedback">Platform path: ${activity.visited.join(' → ') || 'None yet'}</p>
      </div>
    `;
  }
  return `
    <div class="bbf-activity-card">
      <h4>${stageLabelText}</h4>
      <p>${activity.prompt}</p>
      <button data-stage-advance>Advance</button>
      <p class="bbf-feedback">Greybox placeholder.</p>
    </div>
  `;
}

function wireActivity(slot, foundation, learner, options) {
  const commitLearner = nextLearner => {
    const normalized = normalizeLearner(nextLearner, foundation.activeLearnerId);
    foundation.learners[foundation.activeLearnerId] = normalized;
    return normalized;
  };
  const persist = () => {
    learner.saveMeta.lastSavedAt = Date.now();
    foundation.learners[foundation.activeLearnerId] = learner;
    const next = persistFoundationState(foundation, options.storage);
    if (options.onSave) options.onSave(next);
  };
  const advanceTo = stageId => {
    learner.stage = stageId;
    if (!learner.completedStages.includes(stageId)) learner.completedStages.push(stageId);
    foundation.learners[foundation.activeLearnerId] = learner;
    const shellRoot = slot.closest('.bbf-shell') ? slot.closest('.bbf-shell') : slot.parentElement;
    renderBrainBaseShell(shellRoot, foundation, options);
    persist();
  };

  if (learner.activeActivity?.family === ACTIVITY_FAMILIES.targetSmash) {
    slot.querySelectorAll('[data-choice]').forEach(button => {
      button.addEventListener('click', () => {
        const value = button.getAttribute('data-choice');
        const current = learner.activeActivity;
        const picked = [...new Set([...(current.selected || []), value])];
        const result = resolveTargetSmashResult(current, picked, { independent: true, responseTimeMs: 1800 });
        learner.activeActivity = result.challenge;
        learner = commitLearner(recordLearnerAttempt(learner, current.skillId, result.attempt, { id: current.skillId }));
        if (result.challenge.completed) {
          advanceTo('letter-trail');
        } else {
          persist();
          renderActivity(slot.closest('.bbf-shell') ? slot.closest('.bbf-shell') : slot.parentElement, foundation, learner, options);
        }
      });
    });
  }

  slot.querySelectorAll('[data-letter]').forEach(button => {
    button.addEventListener('click', () => {
      const value = button.getAttribute('data-letter');
      const current = learner.activeActivity;
      const result = resolveLetterTrailChoice(current, value, { independent: true, responseTimeMs: 1600 });
      learner.activeActivity = result.challenge;
      learner = commitLearner(recordLearnerAttempt(learner, current.skillId, result.attempt, { id: current.skillId }));
      if (result.challenge.completed) {
        advanceTo('knowledge-platforms');
      } else {
        persist();
        renderActivity(slot.closest('.bbf-shell') ? slot.closest('.bbf-shell') : slot.parentElement, foundation, learner, options);
      }
    });
  });

  slot.querySelectorAll('[data-platform]').forEach(button => {
    button.addEventListener('click', () => {
      const value = button.getAttribute('data-platform');
      const current = learner.activeActivity;
      const result = resolveKnowledgePlatformChoice(current, value, { independent: true, responseTimeMs: 2000 });
      learner.activeActivity = result.challenge;
      learner = commitLearner(recordLearnerAttempt(learner, current.skillId, result.attempt, { id: current.skillId }));
      if (result.challenge.completed) {
        advanceTo('secret-reward');
      } else {
        persist();
        renderActivity(slot.closest('.bbf-shell') ? slot.closest('.bbf-shell') : slot.parentElement, foundation, learner, options);
      }
    });
  });

  const rewardButton = slot.querySelector('[data-reward-open]');
  if (rewardButton) {
    rewardButton.addEventListener('click', () => {
      learner.activeActivity.open = true;
      advanceTo('fraction-kraken');
    });
  }

  if (learner.stage === 'fraction-kraken') {
    slot.querySelectorAll('[data-choice]').forEach(button => {
      button.addEventListener('click', () => {
        const current = learner.activeActivity;
        const value = button.getAttribute('data-choice');
        const correct = value === '1/2' || value === '2/4';
        if (correct) {
          current.health -= 1;
          if (current.health <= 0) {
            learner = commitLearner(grantBrainifact(learner, 'fraction-kraken'));
            learner = commitLearner(upgradeBrainBase(learner));
            learner = setStageComplete(learner, 'fraction-kraken');
            learner.stage = 'brainbase-upgrade';
            learner.activeActivity = null;
            foundation.learners[foundation.activeLearnerId] = learner;
            const shellRoot = slot.closest('.bbf-shell') ? slot.closest('.bbf-shell') : slot.parentElement;
            renderBrainBaseShell(shellRoot, foundation, options);
            persist();
          } else {
            learner = commitLearner(recordLearnerAttempt(learner, 'fraction-meaning', {
              correct: true,
              independent: true,
              responseTimeMs: 1900,
            }, { id: 'fraction-meaning' }));
            const shellRoot = slot.closest('.bbf-shell') ? slot.closest('.bbf-shell') : slot.parentElement;
            renderBrainBaseShell(shellRoot, foundation, options);
            persist();
          }
        } else {
          learner = commitLearner(recordLearnerAttempt(learner, 'fraction-meaning', {
            correct: false,
            independent: true,
            responseTimeMs: 2200,
            randomLike: false,
          }, { id: 'fraction-meaning' }));
          current.phase = Math.min(3, current.phase + 1);
          current.health = Math.max(1, current.health - 1);
          const shellRoot = slot.closest('.bbf-shell') ? slot.closest('.bbf-shell') : slot.parentElement;
          renderBrainBaseShell(shellRoot, foundation, options);
          persist();
        }
      });
    });
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function mountBrainBiteFoundation(root, options = {}) {
  if (!root) return null;
  const state = loadFoundationState(options.storage, options.legacyStore);
  renderBrainBaseShell(root, state, options);
  return state;
}

const BrainBiteCore = {
  CORE_VERSION,
  STORAGE_KEY,
  BACKUP_KEY,
  RECOVERY_KEY,
  LEGACY_PROFILE_KEY,
  OFFLINE_QUEUE_LIMIT,
  SENT_EVENT_ID_LIMIT,
  MASTERY_STATES,
  ACTIVITY_FAMILIES,
  DEFAULT_CONTENT_BUNDLE,
  DEFAULT_STAGE_ORDER,
  CURRICULUM_ITEM_TEMPLATES,
  curriculumTaxonomy,
  createCurriculumTaxonomy,
  validateCurriculumTaxonomy,
  curriculumSkillMap,
  findCurriculumSkill,
  curriculumSkillsForGrade,
  createCurriculumChallenge,
  createApprovedCurriculumChallenge,
  validateGeneratedChallenge,
  verifyCurriculumAnswer,
  scoreContentQuality,
  buildCurriculumSession,
  buildParentInsights,
  recordHomeworkAttempt,
  defaultLearner,
  createSkillState,
  normalizeSkillState,
  scoreAttempt,
  mergeSkillStates,
  evidenceProvenanceSources,
  scheduleReview,
  isSkillStale,
  isReviewDue,
  selectStaleSkills,
  selectDueSkills,
  createTargetSmashChallenge,
  resolveTargetSmashResult,
  createLetterTrailChallenge,
  resolveMissionChallenge,
  resolveLetterTrailChoice,
  createKnowledgePlatformChallenge,
  resolveKnowledgePlatformChoice,
  buildAdaptiveSession,
  remediateChallenge,
  validateContentBundle,
  contentManifest,
  createFoundationState,
  normalizeFoundationState,
  getActiveLearner,
  ensureLearnerSkill,
  recordLearnerAttempt,
  recordBossVictory,
  grantBrainifact,
  upgradeBrainBase,
  queueOfflineEvent,
  replayOfflineQueue,
  addTelemetry,
  persistFoundationState,
  loadFoundationState,
  createRecoverySnapshot,
  restoreFromRecoverySnapshot,
  resolveLegacyProfileName,
  mapChallengeResultToSkill,
  setStageComplete,
  advanceStage,
  exportFoundationEnvelope,
  importFoundationEnvelope,
  createPersistentStagePlan,
  renderBrainBaseShell,
  mountBrainBiteFoundation,
  createVerticalSliceContent,
};

if (hasWindow()) {
  window.BrainBiteCore = BrainBiteCore;
  window.mountBrainBiteFoundation = mountBrainBiteFoundation;
  // LearningCore is available. app.js runs earlier as a classic script, so it waits for
  // this signal before reconciling saved generations with the real merge (the fallback
  // merge used before core exists cannot union per-writer evidence provenance).
  window.dispatchEvent(new Event('bb:core-ready'));
  window.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('brainbase-root');
    if (!root) return;
    if (window.BrainBiteFoundationBridge?.mount) window.BrainBiteFoundationBridge.mount(root);
    else mountBrainBiteFoundation(root);
  });
}

export {
  CORE_VERSION,
  STORAGE_KEY,
  BACKUP_KEY,
  RECOVERY_KEY,
  LEGACY_PROFILE_KEY,
  OFFLINE_QUEUE_LIMIT,
  SENT_EVENT_ID_LIMIT,
  MASTERY_STATES,
  ACTIVITY_FAMILIES,
  DEFAULT_CONTENT_BUNDLE,
  DEFAULT_STAGE_ORDER,
  CURRICULUM_ITEM_TEMPLATES,
  curriculumTaxonomy,
  createCurriculumTaxonomy,
  validateCurriculumTaxonomy,
  curriculumSkillMap,
  findCurriculumSkill,
  curriculumSkillsForGrade,
  createCurriculumChallenge,
  createApprovedCurriculumChallenge,
  validateGeneratedChallenge,
  verifyCurriculumAnswer,
  scoreContentQuality,
  buildCurriculumSession,
  buildParentInsights,
  recordHomeworkAttempt,
  defaultLearner,
  createSkillState,
  normalizeSkillState,
  scoreAttempt,
  mergeSkillStates,
  evidenceProvenanceSources,
  scheduleReview,
  isSkillStale,
  isReviewDue,
  selectStaleSkills,
  selectDueSkills,
  createTargetSmashChallenge,
  resolveTargetSmashResult,
  createLetterTrailChallenge,
  resolveMissionChallenge,
  resolveLetterTrailChoice,
  createKnowledgePlatformChallenge,
  resolveKnowledgePlatformChoice,
  buildAdaptiveSession,
  remediateChallenge,
  validateContentBundle,
  contentManifest,
  createFoundationState,
  normalizeFoundationState,
  getActiveLearner,
  ensureLearnerSkill,
  recordLearnerAttempt,
  recordBossVictory,
  grantBrainifact,
  upgradeBrainBase,
  queueOfflineEvent,
  replayOfflineQueue,
  addTelemetry,
  persistFoundationState,
  loadFoundationState,
  createRecoverySnapshot,
  restoreFromRecoverySnapshot,
  resolveLegacyProfileName,
  mapChallengeResultToSkill,
  setStageComplete,
  advanceStage,
  exportFoundationEnvelope,
  importFoundationEnvelope,
  createPersistentStagePlan,
  renderBrainBaseShell,
  mountBrainBiteFoundation,
  createVerticalSliceContent,
};
