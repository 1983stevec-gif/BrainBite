(function installBrainBiteRegistry(root, factory) {
  const registry = factory();
  root.BrainBiteRegistry = registry;
  if (typeof module === 'object' && module.exports) module.exports = registry;
})(typeof globalThis === 'object' ? globalThis : this, function createBrainBiteRegistry() {
  'use strict';

  const registryVersion = 1;
  const progressionVersion = 1;
  const activityFamilies = Object.freeze({
    targetSmash: 'Target Smash',
    letterTrail: 'Letter Trail',
    knowledgePlatforms: 'Knowledge Platforms',
  });

  const realms = [
    { id: 'jungle-circuit', name: 'Jungle Circuit', hubId: 'brainbase', status: 'playable' },
  ];

  const worlds = [
    { id: 'math', realmId: 'jungle-circuit', name: 'Number Nebula', tag: 'Math', art: 'assets/art/number-nebula.svg', accent: 'num', summary: 'Orbit through number-sense, facts, and fractions.', missionIds: [1,2,3,4,5,6,7,8,9,10], startMissionId: 1, bossIds: ['astro-muncher'] },
    { id: 'words', realmId: 'jungle-circuit', name: 'Wordwood', tag: 'Words', art: 'assets/art/wordwood.svg', accent: 'word', summary: 'Move through forested language paths and grammar vines.', missionIds: [11,12,13,14,15,16,17,18,19,20], startMissionId: 11, bossIds: ['word-warp'] },
    { id: 'spanish', realmId: 'jungle-circuit', name: 'Spanish Portal', tag: 'Spanish', art: 'assets/art/language-portals.svg', accent: 'spanish', summary: 'Step through portals for vocabulary, phrases, and fluency.', missionIds: [21,22,23,24,25,26,27,28,29,30], startMissionId: 21, bossIds: ['el-eco'] },
  ];

  const missions = [
    {id:1,title:'Even Number Hunt',world:'math',skill:'even-numbers',activityFamily:activityFamilies.targetSmash,prompt:'Bite all even numbers.',correct:['2','4','6','8','10','12','14','16','18','20'],wrong:['1','3','5','7','9','11','13','15','17','19']},
    {id:2,title:'Addition to 10',world:'math',skill:'add-to-10',activityFamily:activityFamilies.targetSmash,prompt:'Bite all number sentences that make 10.',correct:['1+9','2+8','3+7','4+6','5+5'],wrong:['1+8','2+7','3+6','4+5','6+5']},
    {id:3,title:'Addition to 20',world:'math',skill:'add-to-20',activityFamily:activityFamilies.targetSmash,prompt:'Bite all number sentences that make 20.',correct:['11+9','12+8','13+7','14+6','15+5'],wrong:['11+8','12+7','13+6','14+5','10+7']},
    {id:4,title:'Subtraction',world:'math',skill:'subtraction-facts',activityFamily:activityFamilies.targetSmash,prompt:'Bite all subtraction number sentences.',correct:['10-2','9-1','8-3','7-4','6-2'],wrong:['10+3','9+2','8×1','7+1','6÷1']},
    {id:5,title:'Multiples of 3',world:'math',skill:'multiples-of-3',activityFamily:activityFamilies.targetSmash,prompt:'Bite all multiples of 3.',correct:['3','6','9','12','15','18','21','24','27','30'],wrong:['2','4','5','7','8','10','11','13','14','16']},
    {id:6,title:'Multiplication Facts',world:'math',skill:'multiplication-facts',activityFamily:activityFamilies.targetSmash,prompt:'Bite all multiplication facts.',correct:['2x3','2x4','3x3','4x2','5x2'],wrong:['2+3','3+3','4+2','5-2','6-1']},
    {id:7,title:'Division Facts',world:'math',skill:'division-facts',activityFamily:activityFamilies.targetSmash,prompt:'Bite all division facts.',correct:['12÷3','15÷5','18÷6','20÷4','24÷6'],wrong:['12+3','15+5','18-6','20-4','24-6']},
    {id:8,title:'Fractions',world:'math',skill:'fractions',activityFamily:activityFamilies.knowledgePlatforms,prompt:'Bite all equivalent fractions.',correct:['1/2','2/4','3/6','4/8','5/10'],wrong:['1/3','2/3','3/5','4/7','5/8']},
    {id:9,title:'Prime Numbers',world:'math',skill:'prime-numbers',activityFamily:activityFamilies.targetSmash,prompt:'Bite all prime numbers.',correct:['2','3','5','7','11','13','17','19'],wrong:['4','6','8','9','10','12','14','15']},
    {id:10,title:'Astro Muncher',world:'math',skill:'astro-muncher',activityFamily:activityFamilies.targetSmash,prompt:'Bite all prime numbers to power up Astro Muncher.',correct:['2','3','5','7','11','13','17','19'],wrong:['4','6','8','9','10','12','14','15'],boss:true,bossId:'astro-muncher',bossName:'Astro Muncher'},
    {id:11,title:'Animal Hunt',world:'words',skill:'animal-words',activityFamily:activityFamilies.targetSmash,prompt:'Bite all animal words.',correct:['cat','dog','lion','zebra','otter','panda','horse','frog'],wrong:['table','chair','window','pencil','paper','cloud','river','stone']},
    {id:12,title:'Synonym Sprint',world:'words',skill:'synonyms',activityFamily:activityFamilies.knowledgePlatforms,prompt:'Bite all synonym words.',correct:['big','large','happy','glad','quick','fast'],wrong:['tiny','small','sad','slow','hot','cold']},
    {id:13,title:'Antonym Alley',world:'words',skill:'antonyms',activityFamily:activityFamilies.knowledgePlatforms,prompt:'Bite all antonym matches.',correct:['hot/cold','start/stop','up/down','in/out','light/dark'],wrong:['hot/warm','start/begin','up/high','in/inside','light/bright']},
    {id:14,title:'Rhyming River',world:'words',skill:'rhyming',activityFamily:activityFamilies.letterTrail,prompt:'Bite all rhyming words.',correct:['cake','make','lake','bake','snake','grape'],wrong:['cat','dog','fish','book','tree','ball']},
    {id:15,title:'Noun Forest',world:'words',skill:'nouns',activityFamily:activityFamilies.targetSmash,prompt:'Bite all noun words.',correct:['tree','river','robot','school','rocket','garden'],wrong:['run','jump','sing','bright','quick','soft']},
    {id:16,title:'Verb Vines',world:'words',skill:'verbs',activityFamily:activityFamilies.targetSmash,prompt:'Bite all verb words.',correct:['run','jump','climb','spin','write','dance'],wrong:['cat','river','blue','music','table','stone']},
    {id:17,title:'Spelling Street',world:'words',skill:'spelling-patterns',activityFamily:activityFamilies.letterTrail,prompt:'Bite all correctly spelled words.',correct:['garden','planet','signal','silver','tunnel','pocket'],wrong:['gardan','planit','signel','silvar','tunel','pockit']},
    {id:18,title:'Homophone Hollow',world:'words',skill:'homophones',activityFamily:activityFamilies.letterTrail,prompt:'Bite all homophone matches.',correct:['two','to','too','see','sea','pair','pear'],wrong:['tue','boat','tree','bird','road','stone']},
    {id:19,title:'Context Clue Cave',world:'words',skill:'context-clues',activityFamily:activityFamilies.knowledgePlatforms,prompt:'Bite all context clue words.',correct:['cautious','enormous','ancient','sprint','whisper','glimmer'],wrong:['quick','slow','red','blue','chair','table']},
    {id:20,title:'Word Warp',world:'words',skill:'word-warp',activityFamily:activityFamilies.targetSmash,prompt:'Bite all word warp targets to defeat Word Warp.',correct:['cautious','enormous','ancient','sprint','whisper','glimmer'],wrong:['quick','slow','red','blue','chair','table'],boss:true,bossId:'word-warp',bossName:'Word Warp'},
    {id:21,title:'Hola Portal',world:'spanish',skill:'spanish-greetings',activityFamily:activityFamilies.targetSmash,prompt:'Bite all Spanish greeting words.',correct:['hola','adiós','gracias','por favor','buenos días'],wrong:['cat','house','blue','run','school']},
    {id:22,title:'Color Chase',world:'spanish',skill:'spanish-colors',activityFamily:activityFamilies.targetSmash,prompt:'Bite all Spanish color words.',correct:['rojo','azul','verde','amarillo','negro','blanco'],wrong:['perro','casa','mesa','libro','comer','correr']},
    {id:23,title:'Animal Trail',world:'spanish',skill:'spanish-animals',activityFamily:activityFamilies.letterTrail,prompt:'Bite all Spanish animal words.',correct:['gato','perro','conejo','pájaro','caballo','pez'],wrong:['rojo','azul','grande','pequeño','arriba','abajo']},
    {id:24,title:'Food Market',world:'spanish',skill:'spanish-food',activityFamily:activityFamilies.targetSmash,prompt:'Bite all Spanish food words.',correct:['manzana','pan','leche','queso','arroz','sopa'],wrong:['casa','escuela','rojo','azul','jugar','mirar']},
    {id:25,title:'Family Plaza',world:'spanish',skill:'spanish-family',activityFamily:activityFamilies.targetSmash,prompt:'Bite all Spanish family words.',correct:['madre','padre','hermano','hermana','abuela','abuelo'],wrong:['mesa','silla','ventana','puerta','rojo','azul']},
    {id:26,title:'Number Steps',world:'spanish',skill:'spanish-numbers',activityFamily:activityFamilies.letterTrail,prompt:'Bite all Spanish number words.',correct:['uno','dos','tres','cuatro','cinco','seis'],wrong:['rojo','azul','grande','pequeño','correr','saltar']},
    {id:27,title:'Action Avenue',world:'spanish',skill:'spanish-actions',activityFamily:activityFamilies.targetSmash,prompt:'Bite all Spanish action words.',correct:['correr','saltar','mirar','comer','leer','escribir'],wrong:['casa','mesa','libro','rojo','azul','pez']},
    {id:28,title:'Places Path',world:'spanish',skill:'spanish-places',activityFamily:activityFamilies.knowledgePlatforms,prompt:'Bite all Spanish place words.',correct:['escuela','casa','parque','tienda','ciudad','playa'],wrong:['madre','padre','gato','pan','rojo','uno']},
    {id:29,title:'Phrase Finder',world:'spanish',skill:'spanish-phrases',activityFamily:activityFamilies.letterTrail,prompt:'Bite all useful Spanish phrases.',correct:['buenos días','por favor','lo siento','muchas gracias','hasta luego'],wrong:['gato','rojo','correr','casa','libro']},
    {id:30,title:'El Eco',world:'spanish',skill:'el-eco',activityFamily:activityFamilies.targetSmash,prompt:'Bite all Spanish phrase echoes to defeat El Eco.',correct:['buenos días','por favor','lo siento','muchas gracias','hasta luego'],wrong:['gato','rojo','correr','casa','libro'],boss:true,bossId:'el-eco',bossName:'El Eco'},
  ];

  const bosses = [
    { id: 'astro-muncher', name: 'Astro Muncher', worldId: 'math', missionId: 10, liveMissionBoss: true },
    { id: 'word-warp', name: 'Word Warp', worldId: 'words', missionId: 20, liveMissionBoss: true },
    { id: 'el-eco', name: 'El Eco', worldId: 'spanish', missionId: 30, liveMissionBoss: true },
    { id: 'fraction-kraken', name: 'Fraction Kraken', worldId: 'jungle-circuit', missionId: null, liveMissionBoss: false, rewardId: 'brainifact-kraken' },
  ];

  const verticalSlice = {
    worldDefinitions: [{ id: 'jungle-circuit', name: 'Jungle Circuit', hub: 'BrainBase', reward: 'Kraken Brainifact' }],
    activityDefinitions: [
      { id: 'target-smash-jungle', family: activityFamilies.targetSmash, skillId: 'number-facts', difficulty: 'normal', answers: ['12','18','24'], distractors: ['13','16','27'] },
      { id: 'letter-trail-jungle', family: activityFamilies.letterTrail, skillId: 'word-order', difficulty: 'normal' },
      { id: 'knowledge-platforms-jungle', family: activityFamilies.knowledgePlatforms, skillId: 'fraction-meaning', difficulty: 'normal' },
    ],
    bossDefinitions: [{ id: 'fraction-kraken', name: 'Fraction Kraken', rewardId: 'brainifact-kraken', worldId: 'jungle-circuit' }],
    rewardDefinitions: [
      { id: 'brainifact-kraken', name: 'Kraken Brainifact', unique: true, type: 'brainifact' },
      { id: 'brainbase-upgrade', name: 'BrainBase Upgrade', unique: false, type: 'upgrade' },
    ],
  };

  const missionById = new Map(missions.map(mission => [mission.id, mission]));
  const worldById = new Map(worlds.map(world => [world.id, world]));
  const validMissionIds = new Set(missionById.keys());
  const firstMissionIds = worlds.map(world => world.startMissionId);

  function uniqueValidIds(values) {
    return [...new Set((Array.isArray(values) ? values : []).map(Number).filter(id => validMissionIds.has(id)))].sort((left, right) => left - right);
  }

  function createProgression() {
    return { version: progressionVersion, completedMissionIds: [], unlockedMissionIds: [...firstMissionIds], lastMissionId: 1 };
  }

  function normalizeProgression(value = {}) {
    const profile = value && typeof value === 'object' ? value : {};
    const source = profile.progression && typeof profile.progression === 'object' ? profile.progression : profile;
    const completedMissionIds = uniqueValidIds(source.completedMissionIds ?? source.completed ?? profile.completed);
    const unlocked = new Set(uniqueValidIds(source.unlockedMissionIds));
    firstMissionIds.forEach(id => unlocked.add(id));
    const legacyThresholds = { math: profile.unlockedMath ?? source.unlockedMath, words: profile.unlockedWords ?? source.unlockedWords, spanish: profile.unlockedSpanish ?? source.unlockedSpanish };
    for (const world of worlds) {
      const threshold = Number(legacyThresholds[world.id]);
      if (Number.isInteger(threshold)) world.missionIds.filter(id => id <= threshold).forEach(id => unlocked.add(id));
    }
    for (const id of completedMissionIds) {
      unlocked.add(id);
      const world = worldById.get(missionById.get(id).world);
      const index = world.missionIds.indexOf(id);
      if (index >= 0 && index + 1 < world.missionIds.length) unlocked.add(world.missionIds[index + 1]);
    }
    const requestedLast = Number(source.lastMissionId ?? source.lastMission ?? profile.lastMission);
    const lastMissionId = validMissionIds.has(requestedLast) ? requestedLast : 1;
    return { version: progressionVersion, completedMissionIds, unlockedMissionIds: uniqueValidIds([...unlocked]), lastMissionId };
  }

  function getMission(id) {
    return missionById.get(Number(id)) || null;
  }

  function getWorld(id) {
    return worldById.get(String(id)) || null;
  }

  function isMissionUnlocked(progression, missionId) {
    return normalizeProgression(progression).unlockedMissionIds.includes(Number(missionId));
  }

  function completeMission(progression, missionId) {
    const mission = getMission(missionId);
    if (!mission) return normalizeProgression(progression);
    const next = normalizeProgression(progression);
    if (!next.unlockedMissionIds.includes(mission.id)) return next;
    if (!next.completedMissionIds.includes(mission.id)) next.completedMissionIds.push(mission.id);
    if (!next.unlockedMissionIds.includes(mission.id)) next.unlockedMissionIds.push(mission.id);
    const world = getWorld(mission.world);
    const index = world.missionIds.indexOf(mission.id);
    if (index + 1 < world.missionIds.length) next.unlockedMissionIds.push(world.missionIds[index + 1]);
    next.completedMissionIds = uniqueValidIds(next.completedMissionIds);
    next.unlockedMissionIds = uniqueValidIds(next.unlockedMissionIds);
    next.lastMissionId = mission.id;
    return next;
  }

  function mergeProgression(local, remote, options = {}) {
    const left = normalizeProgression(local);
    const right = normalizeProgression(remote);
    return normalizeProgression({
      completedMissionIds: [...left.completedMissionIds, ...right.completedMissionIds],
      unlockedMissionIds: [...left.unlockedMissionIds, ...right.unlockedMissionIds],
      lastMissionId: options.preferRemote ? right.lastMissionId : left.lastMissionId,
    });
  }

  function validateRegistry() {
    const errors = [];
    if (new Set(missions.map(mission => mission.id)).size !== missions.length) errors.push('Mission IDs must be unique.');
    if (new Set(worlds.map(world => world.id)).size !== worlds.length) errors.push('World IDs must be unique.');
    const listed = worlds.flatMap(world => world.missionIds);
    if (listed.length !== missions.length || new Set(listed).size !== missions.length) errors.push('Every mission must be listed by exactly one world.');
    for (const mission of missions) {
      const world = getWorld(mission.world);
      if (!world || !world.missionIds.includes(mission.id)) errors.push(`Mission ${mission.id} has an invalid world.`);
      if (!Object.values(activityFamilies).includes(mission.activityFamily)) errors.push(`Mission ${mission.id} has an invalid activity family.`);
      if (!Array.isArray(mission.correct) || !mission.correct.length || !Array.isArray(mission.wrong) || !mission.wrong.length) errors.push(`Mission ${mission.id} has incomplete answers.`);
      const correct = new Set((mission.correct || []).map(String));
      const wrong = new Set((mission.wrong || []).map(String));
      if (correct.size !== (mission.correct || []).length) errors.push(`Mission ${mission.id} has duplicate correct answers.`);
      if (wrong.size !== (mission.wrong || []).length) errors.push(`Mission ${mission.id} has duplicate wrong answers.`);
      if ([...correct].some(answer => wrong.has(answer))) errors.push(`Mission ${mission.id} has an ambiguous answer.`);
      if (mission.skill === 'subtraction-facts' && ([...correct].some(answer => !answer.includes('-')) || [...wrong].some(answer => answer.includes('-')))) errors.push(`Mission ${mission.id} has an invalid subtraction classification.`);
    }
    for (const boss of bosses.filter(boss => boss.liveMissionBoss)) {
      const mission = getMission(boss.missionId);
      if (!mission?.boss || mission.bossId !== boss.id || mission.world !== boss.worldId) errors.push(`Boss ${boss.id} does not match its mission.`);
    }
    if (bosses.filter(boss => boss.liveMissionBoss).length !== 3) errors.push('Exactly three live mission bosses are required.');
    if (!bosses.some(boss => boss.id === 'fraction-kraken' && boss.liveMissionBoss === false)) errors.push('Fraction Kraken encounter is required.');
    if (verticalSlice.activityDefinitions.length !== 3) errors.push('The vertical slice requires three activity families.');
    return { valid: errors.length === 0, errors };
  }

  function deepFreeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
    return value;
  }

  return deepFreeze({
    registryVersion,
    progressionVersion,
    realms,
    worlds,
    missions,
    bosses,
    activityFamilies,
    verticalSlice,
    validateRegistry,
    getMission,
    getWorld,
    createProgression,
    normalizeProgression,
    isMissionUnlocked,
    completeMission,
    mergeProgression,
  });
});
