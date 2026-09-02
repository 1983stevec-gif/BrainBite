const CORE_VERSION = 1;
const STORAGE_KEY = 'bb-brainbite-foundation-v1';
const BACKUP_KEY = 'bb-brainbite-foundation-v1-backup';
const RECOVERY_KEY = 'bb-brainbite-foundation-v1-recovery';
const LEGACY_PROFILE_KEY = 'bb-core-v3';
const MASTERY_STATES = ['Unknown', 'Introduced', 'Practicing', 'Developing', 'Strong', 'Mastered'];

const ACTIVITY_FAMILIES = {
  targetSmash: 'Target Smash',
  letterTrail: 'Letter Trail',
  knowledgePlatforms: 'Knowledge Platforms',
};

const DEFAULT_WORLD_DEFINITIONS = [
  { id: 'jungle-circuit', name: 'Jungle Circuit', hub: 'BrainBase', reward: 'Kraken Brainifact' },
];

const DEFAULT_ACTIVITY_DEFINITIONS = [
  { id: 'target-smash-jungle', family: ACTIVITY_FAMILIES.targetSmash, skillId: 'number-facts', difficulty: 'normal', answers: ['12', '18', '24'], distractors: ['13', '16', '27'] },
  { id: 'letter-trail-jungle', family: ACTIVITY_FAMILIES.letterTrail, skillId: 'word-order', difficulty: 'normal' },
  { id: 'knowledge-platforms-jungle', family: ACTIVITY_FAMILIES.knowledgePlatforms, skillId: 'fraction-meaning', difficulty: 'normal' },
];

const DEFAULT_BOSS_DEFINITIONS = [
  { id: 'fraction-kraken', name: 'Fraction Kraken', rewardId: 'brainifact-kraken', worldId: 'jungle-circuit' },
];

const DEFAULT_REWARD_DEFINITIONS = [
  { id: 'brainifact-kraken', name: 'Kraken Brainifact', unique: true, type: 'brainifact' },
  { id: 'brainbase-upgrade', name: 'BrainBase Upgrade', unique: false, type: 'upgrade' },
];

const DEFAULT_CONTENT_BUNDLE = {
  worldDefinitions: DEFAULT_WORLD_DEFINITIONS,
  activityDefinitions: DEFAULT_ACTIVITY_DEFINITIONS,
  bossDefinitions: DEFAULT_BOSS_DEFINITIONS,
  rewardDefinitions: DEFAULT_REWARD_DEFINITIONS,
};

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
];

function curriculumTaxonomy() {
  return {
    version: '2.0',
    subjects: ['math', 'reading', 'spelling', 'vocabulary', 'grammar'],
    skills: clone(CURRICULUM_SKILLS),
  };
}

function createCurriculumTaxonomy() {
  return curriculumTaxonomy();
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

function defaultCurriculumAnswer(skill, seed = 0) {
  const variant = (seed + skill.grade.charCodeAt(0)) % 4;
  if (skill.subject === 'math') {
    if (skill.keyword.includes('fraction')) return variant % 2 === 0 ? '1/2' : '2/4';
    if (skill.keyword.includes('decimal')) return variant % 2 === 0 ? '0.5' : '50%';
    if (skill.keyword.includes('ratio')) return variant % 2 === 0 ? '2:3' : '4:6';
    if (skill.keyword.includes('multiplication')) return String(12 + variant * 3);
    if (skill.keyword.includes('addition')) return String(8 + variant * 2);
    return String(5 + variant);
  }
  if (skill.subject === 'reading') return skill.keyword;
  if (skill.subject === 'spelling') return skill.keyword.replaceAll(' ', '');
  if (skill.subject === 'vocabulary') return skill.keyword;
  if (skill.subject === 'grammar') return skill.keyword;
  return skill.name.toLowerCase();
}

function defaultCurriculumDistractors(skill, answer, seed = 0) {
  const normalized = String(answer);
  const base = skill.subject === 'math'
    ? [String(Number.parseFloat(normalized) + 1), String(Number.parseFloat(normalized) - 1), String(Number.parseFloat(normalized) + 2)]
    : [skill.keyword + 's', skill.name.toLowerCase(), `${skill.keyword}-${seed}`];
  return [...new Set(base.map(value => String(value).trim()).filter(value => value && value !== normalized))].slice(0, 3);
}

function createCurriculumChallenge(skillId, options = {}) {
  const taxonomy = options.taxonomy || curriculumTaxonomy();
  const skill = findCurriculumSkill(skillId, taxonomy);
  if (!skill) throw new Error(`Unknown curriculum skill: ${skillId}`);
  const family = options.family && skill.supportedActivityTypes.includes(options.family)
    ? options.family
    : skill.supportedActivityTypes[0] || ACTIVITY_FAMILIES.targetSmash;
  const answer = options.answer ?? defaultCurriculumAnswer(skill, Number(options.seed) || 0);
  const answers = Array.isArray(options.answers) && options.answers.length ? options.answers : [answer];
  const distractors = Array.isArray(options.distractors) && options.distractors.length ? options.distractors : defaultCurriculumDistractors(skill, answers[0], Number(options.seed) || 0);
  const prompt = options.prompt || `Show mastery for ${skill.name}.`;
  const common = {
    skillId,
    subject: skill.subject,
    grade: skill.grade,
    domain: skill.domain,
    source: 'curriculum',
  };
  if (family === ACTIVITY_FAMILIES.letterTrail) {
    return createLetterTrailChallenge({
      ...common,
      prompt,
      targetSequence: Array.isArray(options.targetSequence) && options.targetSequence.length ? options.targetSequence : String(answers[0]).split(''),
      distractors,
      difficulty: options.difficulty || 'normal',
    });
  }
  if (family === ACTIVITY_FAMILIES.knowledgePlatforms) {
    return createKnowledgePlatformChallenge({
      ...common,
      prompt,
      platformOrder: Array.isArray(options.platformOrder) && options.platformOrder.length ? options.platformOrder : [answers[0]],
      distractors,
      difficulty: options.difficulty || 'normal',
    });
  }
  return createTargetSmashChallenge({
    ...common,
    prompt,
    answerType: options.answerType || 'text',
    answers,
    distractors,
    difficulty: options.difficulty || 'normal',
  });
}

function validateGeneratedChallenge(challenge, skillDefinition = {}) {
  const errors = [];
  if (!challenge || typeof challenge !== 'object') errors.push('Challenge must be an object.');
  if (!challenge?.skillId) errors.push('Challenge must include a skillId.');
  if (!challenge?.family) errors.push('Challenge must include an activity family.');

  const seen = new Set();
  const asText = value => String(value ?? '').trim().toLowerCase();
  const addUnique = value => {
    const key = asText(value);
    if (!key) return false;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  };

  const answers = challenge?.answers || challenge?.targetSequence || challenge?.platformOrder || [];
  const distractors = challenge?.distractors || challenge?.choices?.filter(choice => !choice.correct).map(choice => choice.value) || [];
  const normalizedAnswers = Array.isArray(answers) ? answers : [answers];
  const normalizedDistractors = Array.isArray(distractors) ? distractors : [distractors];
  normalizedAnswers.forEach(addUnique);
  const overlaps = normalizedDistractors.filter(value => seen.has(asText(value)));
  if (overlaps.length) errors.push('Challenge contains overlapping answers and distractors.');
  if ((challenge.family === ACTIVITY_FAMILIES.targetSmash || challenge.family === 'Target Smash') && normalizedAnswers.length < 1) errors.push('Target Smash needs at least one answer.');
  if (challenge.family === ACTIVITY_FAMILIES.targetSmash && normalizedAnswers.length > 6) errors.push('Target Smash answer count exceeds six.');
  if (normalizedAnswers.some(value => !String(value).trim())) errors.push('Challenge answers cannot be blank.');
  if (normalizedAnswers.length !== [...new Set(normalizedAnswers.map(asText))].length) errors.push('Challenge answers must be unique.');
  if (normalizedDistractors.length !== [...new Set(normalizedDistractors.map(asText))].length) errors.push('Challenge distractors must be unique.');
  if (skillDefinition?.grade && challenge?.grade && normalizeGradeLevel(skillDefinition.grade) !== normalizeGradeLevel(challenge.grade)) {
    errors.push(`Grade mismatch for ${challenge.skillId}.`);
  }
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
  let score = 50;
  if (validation.valid) score += 20;
  score += Math.min(answers.length, 3) * 5;
  score += Math.min(distractors.length, 3) * 4;
  if ((skillDefinition?.hint || challenge?.prompt || '').length > 15) score += 8;
  if ((skillDefinition?.supportedActivityTypes || []).length > 1) score += 4;
  if (challenge?.family === ACTIVITY_FAMILIES.knowledgePlatforms) score += 3;
  if (challenge?.family === ACTIVITY_FAMILIES.letterTrail) score += 3;
  return {
    score: clamp(score, 0, 100),
    clarity: validation.valid ? 'clear' : 'needs-review',
    uniqueness: [...new Set([...answers, ...distractors].map(v => String(v).trim().toLowerCase()))].length === answers.length + distractors.length,
    gradeFit: validation.valid && !!skillDefinition?.grade,
    usefulness: validation.valid && score >= 70,
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
  const learnerSkills = Object.fromEntries(Object.entries(skillStates || {}).map(([skillId, state]) => [skillId, normalizeSkillState(state, { id: skillId })]));
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
  const current = base.items.filter(item => item.reason === 'current-learning').length;
  const review = base.items.filter(item => item.reason === 'spaced-review').length;
  const weak = base.items.filter(item => item.reason === 'weak-skill').length;
  const stretch = base.items.filter(item => item.reason === 'stretch').length;
  return {
    ...base,
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

function scoreAttempt(attempt = {}, skillState = createSkillState('skill')) {
  const correct = !!attempt.correct;
  const assisted = !!attempt.assisted || (Number(attempt.hintsUsed) || 0) > 0;
  const independent = correct && !assisted && !!attempt.independent;
  const hintsUsed = Math.max(0, Number(attempt.hintsUsed) || 0);
  const responseTimeMs = Math.max(0, Number(attempt.responseTimeMs) || 0);
  const rapid = responseTimeMs > 0 && responseTimeMs < 600;

  const next = normalizeSkillState(skillState);
  next.evidence.attempts += 1;
  next.evidence.responseTimeMsTotal += responseTimeMs;
  next.lastPracticedAt = attempt.at || Date.now();
  next.recentPerformance.push({
    correct,
    assisted,
    hintsUsed,
    responseTimeMs,
    at: next.lastPracticedAt,
    source: attempt.source || 'practice',
    homeworkMode: !!attempt.homeworkMode,
  });
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

  return next;
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
    }
  };

  checkUnique(bundle.worldDefinitions, 'world');
  checkUnique(bundle.activityDefinitions, 'activity');
  checkUnique(bundle.bossDefinitions, 'boss');
  checkUnique(bundle.rewardDefinitions, 'reward');

  for (const activity of Array.isArray(bundle.activityDefinitions) ? bundle.activityDefinitions : []) {
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
  out.telemetry = Array.isArray(out.telemetry) ? clone(out.telemetry) : [];
  out.offlineQueue = Array.isArray(out.offlineQueue) ? clone(out.offlineQueue) : [];
  out.sentEventIds = Array.isArray(out.sentEventIds) ? clone(out.sentEventIds) : [];
  out.recoverySnapshot = out.recoverySnapshot && typeof out.recoverySnapshot === 'object' ? clone(out.recoverySnapshot) : null;
  out.settings = { ...base.settings, ...(out.settings || {}) };
  out.hub = {
    ...base.hub,
    ...(out.hub || {}),
    upgrades: Array.isArray(out.hub?.upgrades) ? [...new Set(out.hub.upgrades)] : [],
  };
  out.mastery = out.mastery && typeof out.mastery === 'object' ? { ...out.mastery } : {};
  out.skills = out.skills && typeof out.skills === 'object' ? normalizeSkillStates(out.skills) : {};
  out.currentChallenge = out.currentChallenge && typeof out.currentChallenge === 'object' ? clone(out.currentChallenge) : null;
  out.activeActivity = out.activeActivity && typeof out.activeActivity === 'object' ? clone(out.activeActivity) : null;
  out.saveMeta = {
    ...base.saveMeta,
    ...(out.saveMeta || {}),
    version: CORE_VERSION,
  };
  return out;
}

function normalizeSkillStates(skills) {
  const next = {};
  for (const [skillId, skillState] of Object.entries(skills || {})) {
    next[skillId] = normalizeSkillState(skillState, { id: skillId });
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
      type: event.type || 'unknown',
      profileId: event.profileId || next.profileId,
      schemaVersion: Number.isFinite(Number(event.schemaVersion)) ? Number(event.schemaVersion) : CORE_VERSION,
      timestamp: event.timestamp || event.createdAt || Date.now(),
      payload: clone(event.payload || {}),
      createdAt: event.createdAt || Date.now(),
    });
  }
  return next;
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
  return { learner: next, sent, skipped: remaining.length };
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
  return next;
}

function persistFoundationState(state, storage) {
  const adapter = storageAdapter(storage);
  const normalized = normalizeFoundationState(state);
  const payload = JSON.stringify(normalized);
  adapter.setItem(STORAGE_KEY, payload);
  adapter.setItem(BACKUP_KEY, payload);
  adapter.setItem(RECOVERY_KEY, payload);
  return normalized;
}

function readParsedState(adapter, key) {
  const raw = adapter.getItem(key);
  if (!raw) return null;
  return JSON.parse(raw);
}

function loadFoundationState(storage, legacyStore) {
  const adapter = storageAdapter(storage);
  const legacy = legacyStore || tryReadLegacyStore(adapter);
  try {
    const primary = readParsedState(adapter, STORAGE_KEY);
    if (primary) return normalizeFoundationState(primary, legacy);
  } catch {}
  try {
    const backup = readParsedState(adapter, BACKUP_KEY);
    if (backup) return normalizeFoundationState(backup, legacy);
  } catch {}
  try {
    const recovery = readParsedState(adapter, RECOVERY_KEY);
    if (recovery) return normalizeFoundationState(recovery, legacy);
  } catch {}
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
  next.recoverySnapshot = clone(next);
  next.saveMeta = next.saveMeta || { version: CORE_VERSION, lastSavedAt: null, recoveryCreatedAt: null };
  next.saveMeta.recoveryCreatedAt = Date.now();
  return next;
}

function restoreFromRecoverySnapshot(state) {
  const next = normalizeFoundationState(state);
  if (next.recoverySnapshot && typeof next.recoverySnapshot === 'object') {
    return normalizeFoundationState(next.recoverySnapshot);
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
  LEGACY_PROFILE_KEY,
  MASTERY_STATES,
  ACTIVITY_FAMILIES,
  DEFAULT_CONTENT_BUNDLE,
  DEFAULT_STAGE_ORDER,
  curriculumTaxonomy,
  createCurriculumTaxonomy,
  curriculumSkillMap,
  findCurriculumSkill,
  curriculumSkillsForGrade,
  createCurriculumChallenge,
  validateGeneratedChallenge,
  scoreContentQuality,
  buildCurriculumSession,
  buildParentInsights,
  recordHomeworkAttempt,
  defaultLearner,
  createSkillState,
  normalizeSkillState,
  scoreAttempt,
  scheduleReview,
  isSkillStale,
  isReviewDue,
  selectStaleSkills,
  selectDueSkills,
  createTargetSmashChallenge,
  resolveTargetSmashResult,
  createLetterTrailChallenge,
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
  window.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('brainbase-root');
    if (root) mountBrainBiteFoundation(root);
  });
}

export {
  CORE_VERSION,
  STORAGE_KEY,
  BACKUP_KEY,
  LEGACY_PROFILE_KEY,
  MASTERY_STATES,
  ACTIVITY_FAMILIES,
  DEFAULT_CONTENT_BUNDLE,
  DEFAULT_STAGE_ORDER,
  curriculumTaxonomy,
  createCurriculumTaxonomy,
  curriculumSkillMap,
  findCurriculumSkill,
  curriculumSkillsForGrade,
  createCurriculumChallenge,
  validateGeneratedChallenge,
  scoreContentQuality,
  buildCurriculumSession,
  buildParentInsights,
  recordHomeworkAttempt,
  defaultLearner,
  createSkillState,
  normalizeSkillState,
  scoreAttempt,
  scheduleReview,
  isSkillStale,
  isReviewDue,
  selectStaleSkills,
  selectDueSkills,
  createTargetSmashChallenge,
  resolveTargetSmashResult,
  createLetterTrailChallenge,
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
