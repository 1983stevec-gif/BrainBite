(function installContentReviewManifest(root, factory) {
  const api = factory();
  root.BrainBiteContentReviewManifest = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis === "object" ? globalThis : this, function createContentReviewManifest() {
  "use strict";

  const rows = [
  [
    "registry-mission:1",
    "registry-mission",
    {
      "file": "content/experience-registry.js",
      "export": "missions",
      "path": "$.missions[0]",
      "sourceId": "1"
    },
    {
      "authority": "experience-registry.js",
      "declaration": "canonical missions export",
      "exactSource": "missions[0]"
    },
    "c9a274f452371d4da61bac0ed33ea8e2a4302c6ee2927497e6aaa687a8620a37",
    [
      "experience-registry.validateRegistry",
      "mission-shape-and-answer-partition"
    ],
    null,
    [],
    "internal-review"
  ],
  [
    "registry-mission:2",
    "registry-mission",
    {
      "file": "content/experience-registry.js",
      "export": "missions",
      "path": "$.missions[1]",
      "sourceId": "2"
    },
    {
      "authority": "experience-registry.js",
      "declaration": "canonical missions export",
      "exactSource": "missions[1]"
    },
    "208a01f25ca85ddca8905ba46daa01e1208f3e55f5bbffd544701c56db3e3824",
    [
      "experience-registry.validateRegistry",
      "mission-shape-and-answer-partition"
    ],
    null,
    [],
    "internal-review"
  ],
  [
    "registry-mission:3",
    "registry-mission",
    {
      "file": "content/experience-registry.js",
      "export": "missions",
      "path": "$.missions[2]",
      "sourceId": "3"
    },
    {
      "authority": "experience-registry.js",
      "declaration": "canonical missions export",
      "exactSource": "missions[2]"
    },
    "1a45d3345c781de2a3b1404b15ba74e14ad824e894b58b433380e5590084d7bf",
    [
      "experience-registry.validateRegistry",
      "mission-shape-and-answer-partition"
    ],
    null,
    [],
    "internal-review"
  ],
  [
    "registry-mission:4",
    "registry-mission",
    {
      "file": "content/experience-registry.js",
      "export": "missions",
      "path": "$.missions[3]",
      "sourceId": "4"
    },
    {
      "authority": "experience-registry.js",
      "declaration": "canonical missions export",
      "exactSource": "missions[3]"
    },
    "eab1478e53761a39215e54f83c05709761de70623394e95d4917a3cd93bdb6a9",
    [
      "experience-registry.validateRegistry",
      "mission-shape-and-answer-partition"
    ],
    null,
    [],
    "internal-review"
  ],
  [
    "registry-mission:5",
    "registry-mission",
    {
      "file": "content/experience-registry.js",
      "export": "missions",
      "path": "$.missions[4]",
      "sourceId": "5"
    },
    {
      "authority": "experience-registry.js",
      "declaration": "canonical missions export",
      "exactSource": "missions[4]"
    },
    "3cef0579fbcc62a0c08500d6ed41193c5443644a91f7efb4377f7aba636e98e5",
    [
      "experience-registry.validateRegistry",
      "mission-shape-and-answer-partition"
    ],
    null,
    [],
    "internal-review"
  ],
  [
    "registry-mission:6",
    "registry-mission",
    {
      "file": "content/experience-registry.js",
      "export": "missions",
      "path": "$.missions[5]",
      "sourceId": "6"
    },
    {
      "authority": "experience-registry.js",
      "declaration": "canonical missions export",
      "exactSource": "missions[5]"
    },
    "7985bc2afdde6a4954b8e4e8d5b012012628dc0ac83e485e708ff7782beb4f20",
    [
      "experience-registry.validateRegistry",
      "mission-shape-and-answer-partition"
    ],
    null,
    [],
    "internal-review"
  ],
  [
    "registry-mission:7",
    "registry-mission",
    {
      "file": "content/experience-registry.js",
      "export": "missions",
      "path": "$.missions[6]",
      "sourceId": "7"
    },
    {
      "authority": "experience-registry.js",
      "declaration": "canonical missions export",
      "exactSource": "missions[6]"
    },
    "1cfd7b85606caa6258a73934ce6362f82f01c7e61300e771c703637044f6097a",
    [
      "experience-registry.validateRegistry",
      "mission-shape-and-answer-partition"
    ],
    null,
    [],
    "internal-review"
  ],
  [
    "registry-mission:8",
    "registry-mission",
    {
      "file": "content/experience-registry.js",
      "export": "missions",
      "path": "$.missions[7]",
      "sourceId": "8"
    },
    {
      "authority": "experience-registry.js",
      "declaration": "canonical missions export",
      "exactSource": "missions[7]"
    },
    "d0862b98b8c1d9a2135e9b5ba848ddefdb66be070e766d998be87f7732d3f5f5",
    [
      "experience-registry.validateRegistry",
      "mission-shape-and-answer-partition"
    ],
    null,
    [],
    "internal-review"
  ],
  [
    "registry-mission:9",
    "registry-mission",
    {
      "file": "content/experience-registry.js",
      "export": "missions",
      "path": "$.missions[8]",
      "sourceId": "9"
    },
    {
      "authority": "experience-registry.js",
      "declaration": "canonical missions export",
      "exactSource": "missions[8]"
    },
    "73cdec03fab8078cb48cc7d9eb1afd343a36656e2873460de1d8d55406d34485",
    [
      "experience-registry.validateRegistry",
      "mission-shape-and-answer-partition"
    ],
    null,
    [],
    "internal-review"
  ],
  [
    "registry-mission:10",
    "registry-mission",
    {
      "file": "content/experience-registry.js",
      "export": "missions",
      "path": "$.missions[9]",
      "sourceId": "10"
    },
    {
      "authority": "experience-registry.js",
      "declaration": "canonical missions export",
      "exactSource": "missions[9]"
    },
    "0fe2c702bc9a6a566c9fb2d821964cf8bc66dd4f95def15ecdf6742348f49590",
    [
      "experience-registry.validateRegistry",
      "mission-shape-and-answer-partition"
    ],
    null,
    [],
    "internal-review"
  ],
  [
    "registry-mission:11",
    "registry-mission",
    {
      "file": "content/experience-registry.js",
      "export": "missions",
      "path": "$.missions[10]",
      "sourceId": "11"
    },
    {
      "authority": "experience-registry.js",
      "declaration": "canonical missions export",
      "exactSource": "missions[10]"
    },
    "e3f26b09e1ee027519bf0a69968868b96b7f0b4e595196a8a692654ea5523f78",
    [
      "experience-registry.validateRegistry",
      "mission-shape-and-answer-partition"
    ],
    null,
    [],
    "internal-review"
  ],
  [
    "registry-mission:12",
    "registry-mission",
    {
      "file": "content/experience-registry.js",
      "export": "missions",
      "path": "$.missions[11]",
      "sourceId": "12"
    },
    {
      "authority": "experience-registry.js",
      "declaration": "canonical missions export",
      "exactSource": "missions[11]"
    },
    "dd3f68f98d8fee4e4cd388dde84f40108b706a74fa891d55bf74bcce4356793a",
    [
      "experience-registry.validateRegistry",
      "mission-shape-and-answer-partition"
    ],
    null,
    [],
    "internal-review"
  ],
  [
    "registry-mission:13",
    "registry-mission",
    {
      "file": "content/experience-registry.js",
      "export": "missions",
      "path": "$.missions[12]",
      "sourceId": "13"
    },
    {
      "authority": "experience-registry.js",
      "declaration": "canonical missions export",
      "exactSource": "missions[12]"
    },
    "b3824883129295f4d8f4f1f76b47c1115f64fb62da3eb31e10cdc9b2cd4eab71",
    [
      "experience-registry.validateRegistry",
      "mission-shape-and-answer-partition"
    ],
    null,
    [],
    "internal-review"
  ],
  [
    "registry-mission:14",
    "registry-mission",
    {
      "file": "content/experience-registry.js",
      "export": "missions",
      "path": "$.missions[13]",
      "sourceId": "14"
    },
    {
      "authority": "experience-registry.js",
      "declaration": "canonical missions export",
      "exactSource": "missions[13]"
    },
    "3dac684056e16edcc8fbd70ece24080b9dcdcfd131fa3ce28a08be8df283edb2",
    [
      "experience-registry.validateRegistry",
      "mission-shape-and-answer-partition"
    ],
    null,
    [],
    "internal-review"
  ],
  [
    "registry-mission:15",
    "registry-mission",
    {
      "file": "content/experience-registry.js",
      "export": "missions",
      "path": "$.missions[14]",
      "sourceId": "15"
    },
    {
      "authority": "experience-registry.js",
      "declaration": "canonical missions export",
      "exactSource": "missions[14]"
    },
    "405b07b9d6c9dabb2c2a691d63cac203b1a621827912562ea81f0e0c3ed9364d",
    [
      "experience-registry.validateRegistry",
      "mission-shape-and-answer-partition"
    ],
    null,
    [],
    "internal-review"
  ],
  [
    "registry-mission:16",
    "registry-mission",
    {
      "file": "content/experience-registry.js",
      "export": "missions",
      "path": "$.missions[15]",
      "sourceId": "16"
    },
    {
      "authority": "experience-registry.js",
      "declaration": "canonical missions export",
      "exactSource": "missions[15]"
    },
    "1b3e071bc23ccfc6bdb18f037b35443c516c23509a672b9598ff88603f046a37",
    [
      "experience-registry.validateRegistry",
      "mission-shape-and-answer-partition"
    ],
    null,
    [],
    "internal-review"
  ],
  [
    "registry-mission:17",
    "registry-mission",
    {
      "file": "content/experience-registry.js",
      "export": "missions",
      "path": "$.missions[16]",
      "sourceId": "17"
    },
    {
      "authority": "experience-registry.js",
      "declaration": "canonical missions export",
      "exactSource": "missions[16]"
    },
    "1bbf32f3d479603783596db38e630c44fa93faf31ae599a7e8446440f5418a7a",
    [
      "experience-registry.validateRegistry",
      "mission-shape-and-answer-partition"
    ],
    null,
    [],
    "internal-review"
  ],
  [
    "registry-mission:18",
    "registry-mission",
    {
      "file": "content/experience-registry.js",
      "export": "missions",
      "path": "$.missions[17]",
      "sourceId": "18"
    },
    {
      "authority": "experience-registry.js",
      "declaration": "canonical missions export",
      "exactSource": "missions[17]"
    },
    "36bdab3d0475d3a111304d0d670bb817a5bb4cf0811b90bc6542d39bd5c6f9fe",
    [
      "experience-registry.validateRegistry",
      "mission-shape-and-answer-partition"
    ],
    null,
    [],
    "internal-review"
  ],
  [
    "registry-mission:19",
    "registry-mission",
    {
      "file": "content/experience-registry.js",
      "export": "missions",
      "path": "$.missions[18]",
      "sourceId": "19"
    },
    {
      "authority": "experience-registry.js",
      "declaration": "canonical missions export",
      "exactSource": "missions[18]"
    },
    "26aeeed85349af963ab271776df157088bdb07b3848ed3cf5f8e6b2e43f9e569",
    [
      "experience-registry.validateRegistry",
      "mission-shape-and-answer-partition"
    ],
    null,
    [],
    "internal-review"
  ],
  [
    "registry-mission:20",
    "registry-mission",
    {
      "file": "content/experience-registry.js",
      "export": "missions",
      "path": "$.missions[19]",
      "sourceId": "20"
    },
    {
      "authority": "experience-registry.js",
      "declaration": "canonical missions export",
      "exactSource": "missions[19]"
    },
    "c30260c603762f3d433a50eaff71533e4398733b24e3aeec83b4da4ce51ed498",
    [
      "experience-registry.validateRegistry",
      "mission-shape-and-answer-partition"
    ],
    null,
    [],
    "internal-review"
  ],
  [
    "registry-mission:21",
    "registry-mission",
    {
      "file": "content/experience-registry.js",
      "export": "missions",
      "path": "$.missions[20]",
      "sourceId": "21"
    },
    {
      "authority": "experience-registry.js",
      "declaration": "canonical missions export",
      "exactSource": "missions[20]"
    },
    "93b7912e12d9f39052c42918cef0ad9175acca0343192da1eb063039e7208ed7",
    [
      "experience-registry.validateRegistry",
      "mission-shape-and-answer-partition"
    ],
    null,
    [],
    "internal-review"
  ],
  [
    "registry-mission:22",
    "registry-mission",
    {
      "file": "content/experience-registry.js",
      "export": "missions",
      "path": "$.missions[21]",
      "sourceId": "22"
    },
    {
      "authority": "experience-registry.js",
      "declaration": "canonical missions export",
      "exactSource": "missions[21]"
    },
    "e56bb40f37d941efb12d245f470401e53c2c8dad13f4dd9f504bbd1266cc56bb",
    [
      "experience-registry.validateRegistry",
      "mission-shape-and-answer-partition"
    ],
    null,
    [],
    "internal-review"
  ],
  [
    "registry-mission:23",
    "registry-mission",
    {
      "file": "content/experience-registry.js",
      "export": "missions",
      "path": "$.missions[22]",
      "sourceId": "23"
    },
    {
      "authority": "experience-registry.js",
      "declaration": "canonical missions export",
      "exactSource": "missions[22]"
    },
    "e6d1a568dc7027ae1d8ee509b6308f91ce00b655369b9d07759611b5bed03edf",
    [
      "experience-registry.validateRegistry",
      "mission-shape-and-answer-partition"
    ],
    null,
    [],
    "internal-review"
  ],
  [
    "registry-mission:24",
    "registry-mission",
    {
      "file": "content/experience-registry.js",
      "export": "missions",
      "path": "$.missions[23]",
      "sourceId": "24"
    },
    {
      "authority": "experience-registry.js",
      "declaration": "canonical missions export",
      "exactSource": "missions[23]"
    },
    "070df65c4a0b3f7834c91e7221ef03ad58394e764362f6ea6baa35d7e7acd7c5",
    [
      "experience-registry.validateRegistry",
      "mission-shape-and-answer-partition"
    ],
    null,
    [],
    "internal-review"
  ],
  [
    "registry-mission:25",
    "registry-mission",
    {
      "file": "content/experience-registry.js",
      "export": "missions",
      "path": "$.missions[24]",
      "sourceId": "25"
    },
    {
      "authority": "experience-registry.js",
      "declaration": "canonical missions export",
      "exactSource": "missions[24]"
    },
    "145fe789bebe8e5b4e86202b1376ead715db6b2f7ddb5d937ac7a0b42b20a1bb",
    [
      "experience-registry.validateRegistry",
      "mission-shape-and-answer-partition"
    ],
    null,
    [],
    "internal-review"
  ],
  [
    "registry-mission:26",
    "registry-mission",
    {
      "file": "content/experience-registry.js",
      "export": "missions",
      "path": "$.missions[25]",
      "sourceId": "26"
    },
    {
      "authority": "experience-registry.js",
      "declaration": "canonical missions export",
      "exactSource": "missions[25]"
    },
    "4a80ff84a813ee5f6b89de3738ec1159a1d48e9e12bf3bd2e0261552f18cc8bf",
    [
      "experience-registry.validateRegistry",
      "mission-shape-and-answer-partition"
    ],
    null,
    [],
    "internal-review"
  ],
  [
    "registry-mission:27",
    "registry-mission",
    {
      "file": "content/experience-registry.js",
      "export": "missions",
      "path": "$.missions[26]",
      "sourceId": "27"
    },
    {
      "authority": "experience-registry.js",
      "declaration": "canonical missions export",
      "exactSource": "missions[26]"
    },
    "2635f41c049ed429082ce38c6ea8b705685174d2e1c99bc99e90b6eb69e2ab36",
    [
      "experience-registry.validateRegistry",
      "mission-shape-and-answer-partition"
    ],
    null,
    [],
    "internal-review"
  ],
  [
    "registry-mission:28",
    "registry-mission",
    {
      "file": "content/experience-registry.js",
      "export": "missions",
      "path": "$.missions[27]",
      "sourceId": "28"
    },
    {
      "authority": "experience-registry.js",
      "declaration": "canonical missions export",
      "exactSource": "missions[27]"
    },
    "07fe0645e6e16b98eeafb3d3e6505ca28589282609f11cded0f3884ad184cd2c",
    [
      "experience-registry.validateRegistry",
      "mission-shape-and-answer-partition"
    ],
    null,
    [],
    "internal-review"
  ],
  [
    "registry-mission:29",
    "registry-mission",
    {
      "file": "content/experience-registry.js",
      "export": "missions",
      "path": "$.missions[28]",
      "sourceId": "29"
    },
    {
      "authority": "experience-registry.js",
      "declaration": "canonical missions export",
      "exactSource": "missions[28]"
    },
    "afd476d231b9d7104246265ea7944cfd0f696f6dfd18e3c3e4f12e64a4e2bcf0",
    [
      "experience-registry.validateRegistry",
      "mission-shape-and-answer-partition"
    ],
    null,
    [],
    "internal-review"
  ],
  [
    "registry-mission:30",
    "registry-mission",
    {
      "file": "content/experience-registry.js",
      "export": "missions",
      "path": "$.missions[29]",
      "sourceId": "30"
    },
    {
      "authority": "experience-registry.js",
      "declaration": "canonical missions export",
      "exactSource": "missions[29]"
    },
    "665f02bf22aff3a459fe12ca9db4466a83f2bfc72c166e1b9283070a6c3db298",
    [
      "experience-registry.validateRegistry",
      "mission-shape-and-answer-partition"
    ],
    null,
    [],
    "internal-review"
  ],
  [
    "generated-template:math-k-counting",
    "generated-template",
    {
      "file": "brainbite-core.mjs",
      "export": "CURRICULUM_ITEM_TEMPLATES",
      "path": "$.CURRICULUM_ITEM_TEMPLATES[\"math-k-counting\"]",
      "sourceId": "math-k-counting"
    },
    {
      "authority": "brainbite-core.mjs",
      "declaration": "canonical generated curriculum template",
      "exactSource": "CURRICULUM_ITEM_TEMPLATES[\"math-k-counting\"]"
    },
    "b9eca70aa24d564475d568bec1954dae389d6901995d294a7c0e93917d37b49c",
    [
      "brainbite-core.validateGeneratedChallenge",
      "brainbite-core.verifyCurriculumAnswer",
      "template-semantic-verification"
    ],
    {
      "version": "2.0",
      "skillId": "math-k-counting",
      "subject": "math",
      "grade": "K",
      "domain": "number-sense"
    },
    [],
    "internal-review"
  ],
  [
    "generated-template:math-1-addition",
    "generated-template",
    {
      "file": "brainbite-core.mjs",
      "export": "CURRICULUM_ITEM_TEMPLATES",
      "path": "$.CURRICULUM_ITEM_TEMPLATES[\"math-1-addition\"]",
      "sourceId": "math-1-addition"
    },
    {
      "authority": "brainbite-core.mjs",
      "declaration": "canonical generated curriculum template",
      "exactSource": "CURRICULUM_ITEM_TEMPLATES[\"math-1-addition\"]"
    },
    "73b038a358be831272be449cb4bbb5f71fa19f3de801043f8833a7d174aab333",
    [
      "brainbite-core.validateGeneratedChallenge",
      "brainbite-core.verifyCurriculumAnswer",
      "template-semantic-verification"
    ],
    {
      "version": "2.0",
      "skillId": "math-1-addition",
      "subject": "math",
      "grade": "1",
      "domain": "operations"
    },
    [],
    "internal-review"
  ],
  [
    "generated-template:math-2-place-value",
    "generated-template",
    {
      "file": "brainbite-core.mjs",
      "export": "CURRICULUM_ITEM_TEMPLATES",
      "path": "$.CURRICULUM_ITEM_TEMPLATES[\"math-2-place-value\"]",
      "sourceId": "math-2-place-value"
    },
    {
      "authority": "brainbite-core.mjs",
      "declaration": "canonical generated curriculum template",
      "exactSource": "CURRICULUM_ITEM_TEMPLATES[\"math-2-place-value\"]"
    },
    "976dd70b99ad8b2c3c9046b430a85d9ccbe73a4fbf1d57b6856ffb5dff6c72d2",
    [
      "brainbite-core.validateGeneratedChallenge",
      "brainbite-core.verifyCurriculumAnswer",
      "template-semantic-verification"
    ],
    {
      "version": "2.0",
      "skillId": "math-2-place-value",
      "subject": "math",
      "grade": "2",
      "domain": "number-sense"
    },
    [],
    "internal-review"
  ],
  [
    "generated-template:math-3-multiplication",
    "generated-template",
    {
      "file": "brainbite-core.mjs",
      "export": "CURRICULUM_ITEM_TEMPLATES",
      "path": "$.CURRICULUM_ITEM_TEMPLATES[\"math-3-multiplication\"]",
      "sourceId": "math-3-multiplication"
    },
    {
      "authority": "brainbite-core.mjs",
      "declaration": "canonical generated curriculum template",
      "exactSource": "CURRICULUM_ITEM_TEMPLATES[\"math-3-multiplication\"]"
    },
    "1e47a2952eb6fa41fdb81696d5027217c34d53db801f9e729a12f70579c56b2a",
    [
      "brainbite-core.validateGeneratedChallenge",
      "brainbite-core.verifyCurriculumAnswer",
      "template-semantic-verification"
    ],
    {
      "version": "2.0",
      "skillId": "math-3-multiplication",
      "subject": "math",
      "grade": "3",
      "domain": "operations"
    },
    [],
    "internal-review"
  ],
  [
    "generated-template:math-4-fractions",
    "generated-template",
    {
      "file": "brainbite-core.mjs",
      "export": "CURRICULUM_ITEM_TEMPLATES",
      "path": "$.CURRICULUM_ITEM_TEMPLATES[\"math-4-fractions\"]",
      "sourceId": "math-4-fractions"
    },
    {
      "authority": "brainbite-core.mjs",
      "declaration": "canonical generated curriculum template",
      "exactSource": "CURRICULUM_ITEM_TEMPLATES[\"math-4-fractions\"]"
    },
    "81f2bfc9ed917e7a5848a5d30f4f83c2b6009f5a2fe08c9b1078bffafa335cff",
    [
      "brainbite-core.validateGeneratedChallenge",
      "brainbite-core.verifyCurriculumAnswer",
      "template-semantic-verification"
    ],
    {
      "version": "2.0",
      "skillId": "math-4-fractions",
      "subject": "math",
      "grade": "4",
      "domain": "fractions"
    },
    [],
    "internal-review"
  ],
  [
    "generated-template:math-5-decimals",
    "generated-template",
    {
      "file": "brainbite-core.mjs",
      "export": "CURRICULUM_ITEM_TEMPLATES",
      "path": "$.CURRICULUM_ITEM_TEMPLATES[\"math-5-decimals\"]",
      "sourceId": "math-5-decimals"
    },
    {
      "authority": "brainbite-core.mjs",
      "declaration": "canonical generated curriculum template",
      "exactSource": "CURRICULUM_ITEM_TEMPLATES[\"math-5-decimals\"]"
    },
    "03e4e958f2a8b57877182cdbd0fb4f2110318f61bf0b0a15e97a2d8adac244f0",
    [
      "brainbite-core.validateGeneratedChallenge",
      "brainbite-core.verifyCurriculumAnswer",
      "template-semantic-verification"
    ],
    {
      "version": "2.0",
      "skillId": "math-5-decimals",
      "subject": "math",
      "grade": "5",
      "domain": "decimals"
    },
    [],
    "internal-review"
  ],
  [
    "generated-template:math-6-ratios",
    "generated-template",
    {
      "file": "brainbite-core.mjs",
      "export": "CURRICULUM_ITEM_TEMPLATES",
      "path": "$.CURRICULUM_ITEM_TEMPLATES[\"math-6-ratios\"]",
      "sourceId": "math-6-ratios"
    },
    {
      "authority": "brainbite-core.mjs",
      "declaration": "canonical generated curriculum template",
      "exactSource": "CURRICULUM_ITEM_TEMPLATES[\"math-6-ratios\"]"
    },
    "7009a1a5489bc19190fe9d21d303f06d3121b6ddac8a9c859d9b60fda8d3762c",
    [
      "brainbite-core.validateGeneratedChallenge",
      "brainbite-core.verifyCurriculumAnswer",
      "template-semantic-verification"
    ],
    {
      "version": "2.0",
      "skillId": "math-6-ratios",
      "subject": "math",
      "grade": "6",
      "domain": "ratios"
    },
    [],
    "internal-review"
  ],
  [
    "generated-template:reading-k-phonological",
    "generated-template",
    {
      "file": "brainbite-core.mjs",
      "export": "CURRICULUM_ITEM_TEMPLATES",
      "path": "$.CURRICULUM_ITEM_TEMPLATES[\"reading-k-phonological\"]",
      "sourceId": "reading-k-phonological"
    },
    {
      "authority": "brainbite-core.mjs",
      "declaration": "canonical generated curriculum template",
      "exactSource": "CURRICULUM_ITEM_TEMPLATES[\"reading-k-phonological\"]"
    },
    "4170f01dcd44a288e64d2fc5de763aebd1de19445ed3f1beedf5e53f4dede831",
    [
      "brainbite-core.validateGeneratedChallenge",
      "brainbite-core.verifyCurriculumAnswer",
      "template-semantic-verification"
    ],
    {
      "version": "2.0",
      "skillId": "reading-k-phonological",
      "subject": "reading",
      "grade": "K",
      "domain": "phonological-awareness"
    },
    [],
    "internal-review"
  ],
  [
    "generated-template:reading-1-decoding",
    "generated-template",
    {
      "file": "brainbite-core.mjs",
      "export": "CURRICULUM_ITEM_TEMPLATES",
      "path": "$.CURRICULUM_ITEM_TEMPLATES[\"reading-1-decoding\"]",
      "sourceId": "reading-1-decoding"
    },
    {
      "authority": "brainbite-core.mjs",
      "declaration": "canonical generated curriculum template",
      "exactSource": "CURRICULUM_ITEM_TEMPLATES[\"reading-1-decoding\"]"
    },
    "810835255200e8c57e0d8cdc4a8d0956296ddba97ab174f6acdac0c7e9730a4f",
    [
      "brainbite-core.validateGeneratedChallenge",
      "brainbite-core.verifyCurriculumAnswer",
      "template-semantic-verification"
    ],
    {
      "version": "2.0",
      "skillId": "reading-1-decoding",
      "subject": "reading",
      "grade": "1",
      "domain": "decoding"
    },
    [],
    "internal-review"
  ],
  [
    "generated-template:reading-2-fluency",
    "generated-template",
    {
      "file": "brainbite-core.mjs",
      "export": "CURRICULUM_ITEM_TEMPLATES",
      "path": "$.CURRICULUM_ITEM_TEMPLATES[\"reading-2-fluency\"]",
      "sourceId": "reading-2-fluency"
    },
    {
      "authority": "brainbite-core.mjs",
      "declaration": "canonical generated curriculum template",
      "exactSource": "CURRICULUM_ITEM_TEMPLATES[\"reading-2-fluency\"]"
    },
    "e3d15136127c621e6caf79f0d7fd1fe86720e186600870a2c4484ec8f152dc29",
    [
      "brainbite-core.validateGeneratedChallenge",
      "brainbite-core.verifyCurriculumAnswer",
      "template-semantic-verification"
    ],
    {
      "version": "2.0",
      "skillId": "reading-2-fluency",
      "subject": "reading",
      "grade": "2",
      "domain": "fluency"
    },
    [],
    "internal-review"
  ],
  [
    "generated-template:reading-3-main-idea",
    "generated-template",
    {
      "file": "brainbite-core.mjs",
      "export": "CURRICULUM_ITEM_TEMPLATES",
      "path": "$.CURRICULUM_ITEM_TEMPLATES[\"reading-3-main-idea\"]",
      "sourceId": "reading-3-main-idea"
    },
    {
      "authority": "brainbite-core.mjs",
      "declaration": "canonical generated curriculum template",
      "exactSource": "CURRICULUM_ITEM_TEMPLATES[\"reading-3-main-idea\"]"
    },
    "605e3b826bd77a8a0441742b21803596f0e397359d09130e1bf4a9a017f16e8c",
    [
      "brainbite-core.validateGeneratedChallenge",
      "brainbite-core.verifyCurriculumAnswer",
      "template-semantic-verification"
    ],
    {
      "version": "2.0",
      "skillId": "reading-3-main-idea",
      "subject": "reading",
      "grade": "3",
      "domain": "comprehension"
    },
    [],
    "internal-review"
  ],
  [
    "generated-template:reading-4-inference",
    "generated-template",
    {
      "file": "brainbite-core.mjs",
      "export": "CURRICULUM_ITEM_TEMPLATES",
      "path": "$.CURRICULUM_ITEM_TEMPLATES[\"reading-4-inference\"]",
      "sourceId": "reading-4-inference"
    },
    {
      "authority": "brainbite-core.mjs",
      "declaration": "canonical generated curriculum template",
      "exactSource": "CURRICULUM_ITEM_TEMPLATES[\"reading-4-inference\"]"
    },
    "f058e049c0643699faf528b8431b9a37f4f0ca50d8b50d4e2a98dd0f66d23967",
    [
      "brainbite-core.validateGeneratedChallenge",
      "brainbite-core.verifyCurriculumAnswer",
      "template-semantic-verification"
    ],
    {
      "version": "2.0",
      "skillId": "reading-4-inference",
      "subject": "reading",
      "grade": "4",
      "domain": "comprehension"
    },
    [],
    "internal-review"
  ],
  [
    "generated-template:reading-5-evidence",
    "generated-template",
    {
      "file": "brainbite-core.mjs",
      "export": "CURRICULUM_ITEM_TEMPLATES",
      "path": "$.CURRICULUM_ITEM_TEMPLATES[\"reading-5-evidence\"]",
      "sourceId": "reading-5-evidence"
    },
    {
      "authority": "brainbite-core.mjs",
      "declaration": "canonical generated curriculum template",
      "exactSource": "CURRICULUM_ITEM_TEMPLATES[\"reading-5-evidence\"]"
    },
    "d9f01aacc087254fe277ab6bfd3410e95c86f2d493b9b45ce8c2f0efc9cbd634",
    [
      "brainbite-core.validateGeneratedChallenge",
      "brainbite-core.verifyCurriculumAnswer",
      "template-semantic-verification"
    ],
    {
      "version": "2.0",
      "skillId": "reading-5-evidence",
      "subject": "reading",
      "grade": "5",
      "domain": "text-evidence"
    },
    [],
    "internal-review"
  ],
  [
    "generated-template:reading-6-argument",
    "generated-template",
    {
      "file": "brainbite-core.mjs",
      "export": "CURRICULUM_ITEM_TEMPLATES",
      "path": "$.CURRICULUM_ITEM_TEMPLATES[\"reading-6-argument\"]",
      "sourceId": "reading-6-argument"
    },
    {
      "authority": "brainbite-core.mjs",
      "declaration": "canonical generated curriculum template",
      "exactSource": "CURRICULUM_ITEM_TEMPLATES[\"reading-6-argument\"]"
    },
    "c7228c64dedf7062b741faa5d6ee21eb3b9a2c1a78903f377c7f26ea64e70bef",
    [
      "brainbite-core.validateGeneratedChallenge",
      "brainbite-core.verifyCurriculumAnswer",
      "template-semantic-verification"
    ],
    {
      "version": "2.0",
      "skillId": "reading-6-argument",
      "subject": "reading",
      "grade": "6",
      "domain": "argument"
    },
    [],
    "internal-review"
  ],
  [
    "generated-template:spelling-k-sight",
    "generated-template",
    {
      "file": "brainbite-core.mjs",
      "export": "CURRICULUM_ITEM_TEMPLATES",
      "path": "$.CURRICULUM_ITEM_TEMPLATES[\"spelling-k-sight\"]",
      "sourceId": "spelling-k-sight"
    },
    {
      "authority": "brainbite-core.mjs",
      "declaration": "canonical generated curriculum template",
      "exactSource": "CURRICULUM_ITEM_TEMPLATES[\"spelling-k-sight\"]"
    },
    "9a6f2c05473b95957b5cf3edbdaf5122a05a8dfc28193fdd073f643485a89de6",
    [
      "brainbite-core.validateGeneratedChallenge",
      "brainbite-core.verifyCurriculumAnswer",
      "template-semantic-verification"
    ],
    {
      "version": "2.0",
      "skillId": "spelling-k-sight",
      "subject": "spelling",
      "grade": "K",
      "domain": "high-frequency"
    },
    [],
    "internal-review"
  ],
  [
    "generated-template:spelling-1-cvc",
    "generated-template",
    {
      "file": "brainbite-core.mjs",
      "export": "CURRICULUM_ITEM_TEMPLATES",
      "path": "$.CURRICULUM_ITEM_TEMPLATES[\"spelling-1-cvc\"]",
      "sourceId": "spelling-1-cvc"
    },
    {
      "authority": "brainbite-core.mjs",
      "declaration": "canonical generated curriculum template",
      "exactSource": "CURRICULUM_ITEM_TEMPLATES[\"spelling-1-cvc\"]"
    },
    "076d121255f6979ea6115c33b18f796090e0976f491c0969a0c928d55d494700",
    [
      "brainbite-core.validateGeneratedChallenge",
      "brainbite-core.verifyCurriculumAnswer",
      "template-semantic-verification"
    ],
    {
      "version": "2.0",
      "skillId": "spelling-1-cvc",
      "subject": "spelling",
      "grade": "1",
      "domain": "phonics"
    },
    [],
    "internal-review"
  ],
  [
    "generated-template:spelling-2-digraphs",
    "generated-template",
    {
      "file": "brainbite-core.mjs",
      "export": "CURRICULUM_ITEM_TEMPLATES",
      "path": "$.CURRICULUM_ITEM_TEMPLATES[\"spelling-2-digraphs\"]",
      "sourceId": "spelling-2-digraphs"
    },
    {
      "authority": "brainbite-core.mjs",
      "declaration": "canonical generated curriculum template",
      "exactSource": "CURRICULUM_ITEM_TEMPLATES[\"spelling-2-digraphs\"]"
    },
    "c565f438d26ae3336dd975dd61e4168b497c07973c241429ddec188dcd76f386",
    [
      "brainbite-core.validateGeneratedChallenge",
      "brainbite-core.verifyCurriculumAnswer",
      "template-semantic-verification"
    ],
    {
      "version": "2.0",
      "skillId": "spelling-2-digraphs",
      "subject": "spelling",
      "grade": "2",
      "domain": "phonics"
    },
    [],
    "internal-review"
  ],
  [
    "generated-template:spelling-3-prefixes",
    "generated-template",
    {
      "file": "brainbite-core.mjs",
      "export": "CURRICULUM_ITEM_TEMPLATES",
      "path": "$.CURRICULUM_ITEM_TEMPLATES[\"spelling-3-prefixes\"]",
      "sourceId": "spelling-3-prefixes"
    },
    {
      "authority": "brainbite-core.mjs",
      "declaration": "canonical generated curriculum template",
      "exactSource": "CURRICULUM_ITEM_TEMPLATES[\"spelling-3-prefixes\"]"
    },
    "4f072523dd4a352ea99b5f5e40a752680458127e35046f4393c7cd864b3130f2",
    [
      "brainbite-core.validateGeneratedChallenge",
      "brainbite-core.verifyCurriculumAnswer",
      "template-semantic-verification"
    ],
    {
      "version": "2.0",
      "skillId": "spelling-3-prefixes",
      "subject": "spelling",
      "grade": "3",
      "domain": "morphology"
    },
    [],
    "internal-review"
  ],
  [
    "generated-template:spelling-4-suffixes",
    "generated-template",
    {
      "file": "brainbite-core.mjs",
      "export": "CURRICULUM_ITEM_TEMPLATES",
      "path": "$.CURRICULUM_ITEM_TEMPLATES[\"spelling-4-suffixes\"]",
      "sourceId": "spelling-4-suffixes"
    },
    {
      "authority": "brainbite-core.mjs",
      "declaration": "canonical generated curriculum template",
      "exactSource": "CURRICULUM_ITEM_TEMPLATES[\"spelling-4-suffixes\"]"
    },
    "e94a87e23a4fb4d92ba85e048d07d6bdae74994985dbd7e9622cae69d57dac1c",
    [
      "brainbite-core.validateGeneratedChallenge",
      "brainbite-core.verifyCurriculumAnswer",
      "template-semantic-verification"
    ],
    {
      "version": "2.0",
      "skillId": "spelling-4-suffixes",
      "subject": "spelling",
      "grade": "4",
      "domain": "morphology"
    },
    [],
    "internal-review"
  ],
  [
    "generated-template:spelling-5-patterns",
    "generated-template",
    {
      "file": "brainbite-core.mjs",
      "export": "CURRICULUM_ITEM_TEMPLATES",
      "path": "$.CURRICULUM_ITEM_TEMPLATES[\"spelling-5-patterns\"]",
      "sourceId": "spelling-5-patterns"
    },
    {
      "authority": "brainbite-core.mjs",
      "declaration": "canonical generated curriculum template",
      "exactSource": "CURRICULUM_ITEM_TEMPLATES[\"spelling-5-patterns\"]"
    },
    "7b721d620fed2cc95e6cf2b8eba7d7398292a9903733fc004b38a4ff25e85db0",
    [
      "brainbite-core.validateGeneratedChallenge",
      "brainbite-core.verifyCurriculumAnswer",
      "template-semantic-verification"
    ],
    {
      "version": "2.0",
      "skillId": "spelling-5-patterns",
      "subject": "spelling",
      "grade": "5",
      "domain": "orthography"
    },
    [],
    "internal-review"
  ],
  [
    "generated-template:spelling-6-academic",
    "generated-template",
    {
      "file": "brainbite-core.mjs",
      "export": "CURRICULUM_ITEM_TEMPLATES",
      "path": "$.CURRICULUM_ITEM_TEMPLATES[\"spelling-6-academic\"]",
      "sourceId": "spelling-6-academic"
    },
    {
      "authority": "brainbite-core.mjs",
      "declaration": "canonical generated curriculum template",
      "exactSource": "CURRICULUM_ITEM_TEMPLATES[\"spelling-6-academic\"]"
    },
    "b78d0d0520e745ddfad1ae5b797efe3eaa5203116e226b65f6db755ae4809626",
    [
      "brainbite-core.validateGeneratedChallenge",
      "brainbite-core.verifyCurriculumAnswer",
      "template-semantic-verification"
    ],
    {
      "version": "2.0",
      "skillId": "spelling-6-academic",
      "subject": "spelling",
      "grade": "6",
      "domain": "orthography"
    },
    [],
    "internal-review"
  ],
  [
    "generated-template:vocabulary-k-categories",
    "generated-template",
    {
      "file": "brainbite-core.mjs",
      "export": "CURRICULUM_ITEM_TEMPLATES",
      "path": "$.CURRICULUM_ITEM_TEMPLATES[\"vocabulary-k-categories\"]",
      "sourceId": "vocabulary-k-categories"
    },
    {
      "authority": "brainbite-core.mjs",
      "declaration": "canonical generated curriculum template",
      "exactSource": "CURRICULUM_ITEM_TEMPLATES[\"vocabulary-k-categories\"]"
    },
    "7c7d88db49502fdc1e94480484f80f6909d21517b395e44342ca5cf602fefe75",
    [
      "brainbite-core.validateGeneratedChallenge",
      "brainbite-core.verifyCurriculumAnswer",
      "template-semantic-verification"
    ],
    {
      "version": "2.0",
      "skillId": "vocabulary-k-categories",
      "subject": "vocabulary",
      "grade": "K",
      "domain": "categories"
    },
    [],
    "internal-review"
  ],
  [
    "generated-template:vocabulary-1-meaning",
    "generated-template",
    {
      "file": "brainbite-core.mjs",
      "export": "CURRICULUM_ITEM_TEMPLATES",
      "path": "$.CURRICULUM_ITEM_TEMPLATES[\"vocabulary-1-meaning\"]",
      "sourceId": "vocabulary-1-meaning"
    },
    {
      "authority": "brainbite-core.mjs",
      "declaration": "canonical generated curriculum template",
      "exactSource": "CURRICULUM_ITEM_TEMPLATES[\"vocabulary-1-meaning\"]"
    },
    "0ed80ab98bbece09ab14cd3608c34dd36fc2a414d8cd301c627c0df8497102ce",
    [
      "brainbite-core.validateGeneratedChallenge",
      "brainbite-core.verifyCurriculumAnswer",
      "template-semantic-verification"
    ],
    {
      "version": "2.0",
      "skillId": "vocabulary-1-meaning",
      "subject": "vocabulary",
      "grade": "1",
      "domain": "word-meaning"
    },
    [],
    "internal-review"
  ],
  [
    "generated-template:vocabulary-2-synonyms",
    "generated-template",
    {
      "file": "brainbite-core.mjs",
      "export": "CURRICULUM_ITEM_TEMPLATES",
      "path": "$.CURRICULUM_ITEM_TEMPLATES[\"vocabulary-2-synonyms\"]",
      "sourceId": "vocabulary-2-synonyms"
    },
    {
      "authority": "brainbite-core.mjs",
      "declaration": "canonical generated curriculum template",
      "exactSource": "CURRICULUM_ITEM_TEMPLATES[\"vocabulary-2-synonyms\"]"
    },
    "1d6c4536937ef5e24bca1852fe56f7e24dff5cea8dc98dc216b5cf50dbaece59",
    [
      "brainbite-core.validateGeneratedChallenge",
      "brainbite-core.verifyCurriculumAnswer",
      "template-semantic-verification"
    ],
    {
      "version": "2.0",
      "skillId": "vocabulary-2-synonyms",
      "subject": "vocabulary",
      "grade": "2",
      "domain": "relationships"
    },
    [],
    "internal-review"
  ],
  [
    "generated-template:vocabulary-3-context",
    "generated-template",
    {
      "file": "brainbite-core.mjs",
      "export": "CURRICULUM_ITEM_TEMPLATES",
      "path": "$.CURRICULUM_ITEM_TEMPLATES[\"vocabulary-3-context\"]",
      "sourceId": "vocabulary-3-context"
    },
    {
      "authority": "brainbite-core.mjs",
      "declaration": "canonical generated curriculum template",
      "exactSource": "CURRICULUM_ITEM_TEMPLATES[\"vocabulary-3-context\"]"
    },
    "1abc95ccc27b8ad5b62d06f7b5f305fc2c69f72b42171a38ee7f55a47bab028c",
    [
      "brainbite-core.validateGeneratedChallenge",
      "brainbite-core.verifyCurriculumAnswer",
      "template-semantic-verification"
    ],
    {
      "version": "2.0",
      "skillId": "vocabulary-3-context",
      "subject": "vocabulary",
      "grade": "3",
      "domain": "context"
    },
    [],
    "internal-review"
  ],
  [
    "generated-template:vocabulary-4-multiple",
    "generated-template",
    {
      "file": "brainbite-core.mjs",
      "export": "CURRICULUM_ITEM_TEMPLATES",
      "path": "$.CURRICULUM_ITEM_TEMPLATES[\"vocabulary-4-multiple\"]",
      "sourceId": "vocabulary-4-multiple"
    },
    {
      "authority": "brainbite-core.mjs",
      "declaration": "canonical generated curriculum template",
      "exactSource": "CURRICULUM_ITEM_TEMPLATES[\"vocabulary-4-multiple\"]"
    },
    "69799b095227a0a6a2527534027abd64e2fa8d49399222ef0b62a70be4777637",
    [
      "brainbite-core.validateGeneratedChallenge",
      "brainbite-core.verifyCurriculumAnswer",
      "template-semantic-verification"
    ],
    {
      "version": "2.0",
      "skillId": "vocabulary-4-multiple",
      "subject": "vocabulary",
      "grade": "4",
      "domain": "polysemy"
    },
    [],
    "internal-review"
  ],
  [
    "generated-template:vocabulary-5-roots",
    "generated-template",
    {
      "file": "brainbite-core.mjs",
      "export": "CURRICULUM_ITEM_TEMPLATES",
      "path": "$.CURRICULUM_ITEM_TEMPLATES[\"vocabulary-5-roots\"]",
      "sourceId": "vocabulary-5-roots"
    },
    {
      "authority": "brainbite-core.mjs",
      "declaration": "canonical generated curriculum template",
      "exactSource": "CURRICULUM_ITEM_TEMPLATES[\"vocabulary-5-roots\"]"
    },
    "44e2a874d3b7ffe77d4e0a265ba1c88c4f4e4f31f228c1e7bd467448f46d3a48",
    [
      "brainbite-core.validateGeneratedChallenge",
      "brainbite-core.verifyCurriculumAnswer",
      "template-semantic-verification"
    ],
    {
      "version": "2.0",
      "skillId": "vocabulary-5-roots",
      "subject": "vocabulary",
      "grade": "5",
      "domain": "morphology"
    },
    [],
    "internal-review"
  ],
  [
    "generated-template:vocabulary-6-academic",
    "generated-template",
    {
      "file": "brainbite-core.mjs",
      "export": "CURRICULUM_ITEM_TEMPLATES",
      "path": "$.CURRICULUM_ITEM_TEMPLATES[\"vocabulary-6-academic\"]",
      "sourceId": "vocabulary-6-academic"
    },
    {
      "authority": "brainbite-core.mjs",
      "declaration": "canonical generated curriculum template",
      "exactSource": "CURRICULUM_ITEM_TEMPLATES[\"vocabulary-6-academic\"]"
    },
    "d272447322f213bfe574db697c7d4fde436b20e90c459c39057d03dbc4bd1cd1",
    [
      "brainbite-core.validateGeneratedChallenge",
      "brainbite-core.verifyCurriculumAnswer",
      "template-semantic-verification"
    ],
    {
      "version": "2.0",
      "skillId": "vocabulary-6-academic",
      "subject": "vocabulary",
      "grade": "6",
      "domain": "academic-language"
    },
    [],
    "internal-review"
  ],
  [
    "generated-template:grammar-k-sentence",
    "generated-template",
    {
      "file": "brainbite-core.mjs",
      "export": "CURRICULUM_ITEM_TEMPLATES",
      "path": "$.CURRICULUM_ITEM_TEMPLATES[\"grammar-k-sentence\"]",
      "sourceId": "grammar-k-sentence"
    },
    {
      "authority": "brainbite-core.mjs",
      "declaration": "canonical generated curriculum template",
      "exactSource": "CURRICULUM_ITEM_TEMPLATES[\"grammar-k-sentence\"]"
    },
    "913acfe7e8c1e7471370345a7ffc9a474cd3979f8bf05b1c4d6630f14c4febbc",
    [
      "brainbite-core.validateGeneratedChallenge",
      "brainbite-core.verifyCurriculumAnswer",
      "template-semantic-verification"
    ],
    {
      "version": "2.0",
      "skillId": "grammar-k-sentence",
      "subject": "grammar",
      "grade": "K",
      "domain": "sentence-awareness"
    },
    [],
    "internal-review"
  ],
  [
    "generated-template:grammar-1-capitalization",
    "generated-template",
    {
      "file": "brainbite-core.mjs",
      "export": "CURRICULUM_ITEM_TEMPLATES",
      "path": "$.CURRICULUM_ITEM_TEMPLATES[\"grammar-1-capitalization\"]",
      "sourceId": "grammar-1-capitalization"
    },
    {
      "authority": "brainbite-core.mjs",
      "declaration": "canonical generated curriculum template",
      "exactSource": "CURRICULUM_ITEM_TEMPLATES[\"grammar-1-capitalization\"]"
    },
    "96590aaccfd7e8003724ef83534e37825a38c46029c169fe378b8dd732886fa6",
    [
      "brainbite-core.validateGeneratedChallenge",
      "brainbite-core.verifyCurriculumAnswer",
      "template-semantic-verification"
    ],
    {
      "version": "2.0",
      "skillId": "grammar-1-capitalization",
      "subject": "grammar",
      "grade": "1",
      "domain": "conventions"
    },
    [],
    "internal-review"
  ],
  [
    "generated-template:grammar-2-punctuation",
    "generated-template",
    {
      "file": "brainbite-core.mjs",
      "export": "CURRICULUM_ITEM_TEMPLATES",
      "path": "$.CURRICULUM_ITEM_TEMPLATES[\"grammar-2-punctuation\"]",
      "sourceId": "grammar-2-punctuation"
    },
    {
      "authority": "brainbite-core.mjs",
      "declaration": "canonical generated curriculum template",
      "exactSource": "CURRICULUM_ITEM_TEMPLATES[\"grammar-2-punctuation\"]"
    },
    "27609644773fb57b55724cccac9f239d97949a44f6697505d2711c99e072c623",
    [
      "brainbite-core.validateGeneratedChallenge",
      "brainbite-core.verifyCurriculumAnswer",
      "template-semantic-verification"
    ],
    {
      "version": "2.0",
      "skillId": "grammar-2-punctuation",
      "subject": "grammar",
      "grade": "2",
      "domain": "conventions"
    },
    [],
    "internal-review"
  ],
  [
    "generated-template:grammar-3-parts",
    "generated-template",
    {
      "file": "brainbite-core.mjs",
      "export": "CURRICULUM_ITEM_TEMPLATES",
      "path": "$.CURRICULUM_ITEM_TEMPLATES[\"grammar-3-parts\"]",
      "sourceId": "grammar-3-parts"
    },
    {
      "authority": "brainbite-core.mjs",
      "declaration": "canonical generated curriculum template",
      "exactSource": "CURRICULUM_ITEM_TEMPLATES[\"grammar-3-parts\"]"
    },
    "bde3622db1b6fcd0115c95798e52ebc890ae5a52df9d3d943397f10c8f4548ed",
    [
      "brainbite-core.validateGeneratedChallenge",
      "brainbite-core.verifyCurriculumAnswer",
      "template-semantic-verification"
    ],
    {
      "version": "2.0",
      "skillId": "grammar-3-parts",
      "subject": "grammar",
      "grade": "3",
      "domain": "syntax"
    },
    [],
    "internal-review"
  ],
  [
    "generated-template:grammar-4-agreement",
    "generated-template",
    {
      "file": "brainbite-core.mjs",
      "export": "CURRICULUM_ITEM_TEMPLATES",
      "path": "$.CURRICULUM_ITEM_TEMPLATES[\"grammar-4-agreement\"]",
      "sourceId": "grammar-4-agreement"
    },
    {
      "authority": "brainbite-core.mjs",
      "declaration": "canonical generated curriculum template",
      "exactSource": "CURRICULUM_ITEM_TEMPLATES[\"grammar-4-agreement\"]"
    },
    "18c8358a04050fed902fe70aff3175ce2d99d19210fed77658c10d1e4d6c9ec5",
    [
      "brainbite-core.validateGeneratedChallenge",
      "brainbite-core.verifyCurriculumAnswer",
      "template-semantic-verification"
    ],
    {
      "version": "2.0",
      "skillId": "grammar-4-agreement",
      "subject": "grammar",
      "grade": "4",
      "domain": "syntax"
    },
    [],
    "internal-review"
  ],
  [
    "generated-template:grammar-5-combining",
    "generated-template",
    {
      "file": "brainbite-core.mjs",
      "export": "CURRICULUM_ITEM_TEMPLATES",
      "path": "$.CURRICULUM_ITEM_TEMPLATES[\"grammar-5-combining\"]",
      "sourceId": "grammar-5-combining"
    },
    {
      "authority": "brainbite-core.mjs",
      "declaration": "canonical generated curriculum template",
      "exactSource": "CURRICULUM_ITEM_TEMPLATES[\"grammar-5-combining\"]"
    },
    "c8e6d3fa9cb668131e530d5f167e6e1ef094f58b0f96410baef9d9620fb6c731",
    [
      "brainbite-core.validateGeneratedChallenge",
      "brainbite-core.verifyCurriculumAnswer",
      "template-semantic-verification"
    ],
    {
      "version": "2.0",
      "skillId": "grammar-5-combining",
      "subject": "grammar",
      "grade": "5",
      "domain": "sentence-structure"
    },
    [],
    "internal-review"
  ],
  [
    "generated-template:grammar-6-clauses",
    "generated-template",
    {
      "file": "brainbite-core.mjs",
      "export": "CURRICULUM_ITEM_TEMPLATES",
      "path": "$.CURRICULUM_ITEM_TEMPLATES[\"grammar-6-clauses\"]",
      "sourceId": "grammar-6-clauses"
    },
    {
      "authority": "brainbite-core.mjs",
      "declaration": "canonical generated curriculum template",
      "exactSource": "CURRICULUM_ITEM_TEMPLATES[\"grammar-6-clauses\"]"
    },
    "2e5eba1967f87264a2c75e61dc1afe4f0eccea2cc6d0271f80aa305c6ad2c458",
    [
      "brainbite-core.validateGeneratedChallenge",
      "brainbite-core.verifyCurriculumAnswer",
      "template-semantic-verification"
    ],
    {
      "version": "2.0",
      "skillId": "grammar-6-clauses",
      "subject": "grammar",
      "grade": "6",
      "domain": "sentence-structure"
    },
    [],
    "internal-review"
  ],
  [
    "json-pack-item:language-question-bank-v1.7.json::$.sets[0]",
    "json-pack-item",
    {
      "file": "content/language-question-bank-v1.7.json",
      "sidecar": "content/skill-links.v1.json",
      "path": "$.sets[0]",
      "sourceId": "language-question-bank-v1.7.json::$.sets[0]"
    },
    {
      "authority": "content/skill-links.v1.json",
      "declaration": "answer-bearing pack item classification",
      "exactSource": "language-question-bank-v1.7.json$.sets[0]"
    },
    "ba4a772b6882b9ac4755a31d06329ff681de5c48b2c739a92e39b9a367f07f28",
    [
      "scripts/validate-content.mjs:answer-shape",
      "skill-links.v1:quarantine-reason"
    ],
    null,
    [
      "no-canonical-language-skill"
    ],
    "quarantined"
  ],
  [
    "json-pack-item:language-question-bank-v1.7.json::$.sets[1]",
    "json-pack-item",
    {
      "file": "content/language-question-bank-v1.7.json",
      "sidecar": "content/skill-links.v1.json",
      "path": "$.sets[1]",
      "sourceId": "language-question-bank-v1.7.json::$.sets[1]"
    },
    {
      "authority": "content/skill-links.v1.json",
      "declaration": "answer-bearing pack item classification",
      "exactSource": "language-question-bank-v1.7.json$.sets[1]"
    },
    "ea19228c63e89e23671c0d08c790b6378a943130e098b38336467d4e06bea49d",
    [
      "scripts/validate-content.mjs:answer-shape",
      "skill-links.v1:quarantine-reason"
    ],
    null,
    [
      "no-canonical-language-skill"
    ],
    "quarantined"
  ],
  [
    "json-pack-item:language-question-bank-v1.7.json::$.sets[2]",
    "json-pack-item",
    {
      "file": "content/language-question-bank-v1.7.json",
      "sidecar": "content/skill-links.v1.json",
      "path": "$.sets[2]",
      "sourceId": "language-question-bank-v1.7.json::$.sets[2]"
    },
    {
      "authority": "content/skill-links.v1.json",
      "declaration": "answer-bearing pack item classification",
      "exactSource": "language-question-bank-v1.7.json$.sets[2]"
    },
    "e16c737013d51ea24eb41d893fe8cc1a51c7b7fe16fb424830c7c3d4e1863521",
    [
      "scripts/validate-content.mjs:answer-shape",
      "skill-links.v1:quarantine-reason"
    ],
    null,
    [
      "no-canonical-language-skill"
    ],
    "quarantined"
  ],
  [
    "json-pack-item:language-question-bank-v1.7.json::$.sets[3]",
    "json-pack-item",
    {
      "file": "content/language-question-bank-v1.7.json",
      "sidecar": "content/skill-links.v1.json",
      "path": "$.sets[3]",
      "sourceId": "language-question-bank-v1.7.json::$.sets[3]"
    },
    {
      "authority": "content/skill-links.v1.json",
      "declaration": "answer-bearing pack item classification",
      "exactSource": "language-question-bank-v1.7.json$.sets[3]"
    },
    "da2cbedc8a7336c314b55d01314df28bf05d044cd9e88435e7a2597d9a4b435c",
    [
      "scripts/validate-content.mjs:answer-shape",
      "skill-links.v1:quarantine-reason"
    ],
    null,
    [
      "no-canonical-language-skill"
    ],
    "quarantined"
  ],
  [
    "json-pack-item:language-question-bank-v1.7.json::$.sets[4]",
    "json-pack-item",
    {
      "file": "content/language-question-bank-v1.7.json",
      "sidecar": "content/skill-links.v1.json",
      "path": "$.sets[4]",
      "sourceId": "language-question-bank-v1.7.json::$.sets[4]"
    },
    {
      "authority": "content/skill-links.v1.json",
      "declaration": "answer-bearing pack item classification",
      "exactSource": "language-question-bank-v1.7.json$.sets[4]"
    },
    "06061737b504ce188ffc470552005caeeea1b72a257d939af5fc9d789812d9a9",
    [
      "scripts/validate-content.mjs:answer-shape",
      "skill-links.v1:quarantine-reason"
    ],
    null,
    [
      "no-canonical-language-skill"
    ],
    "quarantined"
  ],
  [
    "json-pack-item:language-question-bank-v1.9.json::$.sets[0]",
    "json-pack-item",
    {
      "file": "content/language-question-bank-v1.9.json",
      "sidecar": "content/skill-links.v1.json",
      "path": "$.sets[0]",
      "sourceId": "language-question-bank-v1.9.json::$.sets[0]"
    },
    {
      "authority": "content/skill-links.v1.json",
      "declaration": "answer-bearing pack item classification",
      "exactSource": "language-question-bank-v1.9.json$.sets[0]"
    },
    "1c909c2febd1f0395b3aa2bc15eb92172b91400488cb7b1a9f8556c86e97da8c",
    [
      "scripts/validate-content.mjs:answer-shape",
      "skill-links.v1:quarantine-reason"
    ],
    null,
    [
      "no-canonical-language-skill"
    ],
    "quarantined"
  ],
  [
    "json-pack-item:language-question-bank-v1.9.json::$.sets[1]",
    "json-pack-item",
    {
      "file": "content/language-question-bank-v1.9.json",
      "sidecar": "content/skill-links.v1.json",
      "path": "$.sets[1]",
      "sourceId": "language-question-bank-v1.9.json::$.sets[1]"
    },
    {
      "authority": "content/skill-links.v1.json",
      "declaration": "answer-bearing pack item classification",
      "exactSource": "language-question-bank-v1.9.json$.sets[1]"
    },
    "67debab27e8b033036c299882ce0fbb06414984e5a01bd5030501cf2eaceaaee",
    [
      "scripts/validate-content.mjs:answer-shape",
      "skill-links.v1:quarantine-reason"
    ],
    null,
    [
      "no-canonical-language-skill"
    ],
    "quarantined"
  ],
  [
    "json-pack-item:language-question-bank-v1.9.json::$.sets[2]",
    "json-pack-item",
    {
      "file": "content/language-question-bank-v1.9.json",
      "sidecar": "content/skill-links.v1.json",
      "path": "$.sets[2]",
      "sourceId": "language-question-bank-v1.9.json::$.sets[2]"
    },
    {
      "authority": "content/skill-links.v1.json",
      "declaration": "answer-bearing pack item classification",
      "exactSource": "language-question-bank-v1.9.json$.sets[2]"
    },
    "c9e457c81ae168f9ac8e92f78a670effeba8bd94e8cd7186577713ace73907aa",
    [
      "scripts/validate-content.mjs:answer-shape",
      "skill-links.v1:quarantine-reason"
    ],
    null,
    [
      "no-canonical-language-skill"
    ],
    "quarantined"
  ],
  [
    "json-pack-item:language-question-bank-v1.9.json::$.sets[3]",
    "json-pack-item",
    {
      "file": "content/language-question-bank-v1.9.json",
      "sidecar": "content/skill-links.v1.json",
      "path": "$.sets[3]",
      "sourceId": "language-question-bank-v1.9.json::$.sets[3]"
    },
    {
      "authority": "content/skill-links.v1.json",
      "declaration": "answer-bearing pack item classification",
      "exactSource": "language-question-bank-v1.9.json$.sets[3]"
    },
    "e3fd87514c58d97dea8263fd4a494423205b4eddacb933e4d9798c91fef11c82",
    [
      "scripts/validate-content.mjs:answer-shape",
      "skill-links.v1:quarantine-reason"
    ],
    null,
    [
      "no-canonical-language-skill"
    ],
    "quarantined"
  ],
  [
    "json-pack-item:language-question-bank-v1.9.json::$.sets[4]",
    "json-pack-item",
    {
      "file": "content/language-question-bank-v1.9.json",
      "sidecar": "content/skill-links.v1.json",
      "path": "$.sets[4]",
      "sourceId": "language-question-bank-v1.9.json::$.sets[4]"
    },
    {
      "authority": "content/skill-links.v1.json",
      "declaration": "answer-bearing pack item classification",
      "exactSource": "language-question-bank-v1.9.json$.sets[4]"
    },
    "a0999539806743e58009608761fe43cd2f89c02a39d307c5401958f480ab141a",
    [
      "scripts/validate-content.mjs:answer-shape",
      "skill-links.v1:quarantine-reason"
    ],
    null,
    [
      "no-canonical-language-skill"
    ],
    "quarantined"
  ],
  [
    "json-pack-item:math-curated-v3.json::$.skills.fractions_half[0]",
    "json-pack-item",
    {
      "file": "content/math-curated-v3.json",
      "sidecar": "content/skill-links.v1.json",
      "path": "$.skills.fractions_half[0]",
      "sourceId": "math-curated-v3.json::$.skills.fractions_half[0]"
    },
    {
      "authority": "content/skill-links.v1.json",
      "declaration": "answer-bearing pack item classification",
      "exactSource": "math-curated-v3.json$.skills.fractions_half[0]"
    },
    "8d6ef8e61d002383bc5e0a4712c5b216ddc13ea0e97315fcb26dc33631ecc8af",
    [
      "scripts/validate-content.mjs:answer-shape",
      "skill-links.v1:linked-taxonomy-metadata"
    ],
    {
      "version": "2.0",
      "skillId": "math-4-fractions",
      "sourceSkillId": "fractions_half",
      "subject": "math",
      "linkage": "linked"
    },
    [],
    "non-production"
  ],
  [
    "json-pack-item:math-curated-v3.json::$.skills.fractions_half[1]",
    "json-pack-item",
    {
      "file": "content/math-curated-v3.json",
      "sidecar": "content/skill-links.v1.json",
      "path": "$.skills.fractions_half[1]",
      "sourceId": "math-curated-v3.json::$.skills.fractions_half[1]"
    },
    {
      "authority": "content/skill-links.v1.json",
      "declaration": "answer-bearing pack item classification",
      "exactSource": "math-curated-v3.json$.skills.fractions_half[1]"
    },
    "90818d2d51eb13da7c6c9f56c16ebf9ab96eb5029d98dc7e50de424e96f99933",
    [
      "scripts/validate-content.mjs:answer-shape",
      "skill-links.v1:linked-taxonomy-metadata"
    ],
    {
      "version": "2.0",
      "skillId": "math-4-fractions",
      "sourceSkillId": "fractions_half",
      "subject": "math",
      "linkage": "linked"
    },
    [],
    "non-production"
  ],
  [
    "json-pack-item:math-curated-v3.json::$.skills.addition_20[0]",
    "json-pack-item",
    {
      "file": "content/math-curated-v3.json",
      "sidecar": "content/skill-links.v1.json",
      "path": "$.skills.addition_20[0]",
      "sourceId": "math-curated-v3.json::$.skills.addition_20[0]"
    },
    {
      "authority": "content/skill-links.v1.json",
      "declaration": "answer-bearing pack item classification",
      "exactSource": "math-curated-v3.json$.skills.addition_20[0]"
    },
    "1bbd7c62f866a2d05427ac862a789a45fe998e2faab06b1b12471ba5e199c438",
    [
      "scripts/validate-content.mjs:answer-shape",
      "skill-links.v1:linked-taxonomy-metadata"
    ],
    {
      "version": "2.0",
      "skillId": "math-1-addition",
      "sourceSkillId": "addition_20",
      "subject": "math",
      "linkage": "linked"
    },
    [],
    "non-production"
  ],
  [
    "json-pack-item:math-expanded-v2.json::$.questionSets.addition_20[0]",
    "json-pack-item",
    {
      "file": "content/math-expanded-v2.json",
      "sidecar": "content/skill-links.v1.json",
      "path": "$.questionSets.addition_20[0]",
      "sourceId": "math-expanded-v2.json::$.questionSets.addition_20[0]"
    },
    {
      "authority": "content/skill-links.v1.json",
      "declaration": "answer-bearing pack item classification",
      "exactSource": "math-expanded-v2.json$.questionSets.addition_20[0]"
    },
    "ec1649b9366da8a12d00c255b8ef12039cd0f85247af063f1b19c1cfd98ac2d3",
    [
      "scripts/validate-content.mjs:answer-shape",
      "skill-links.v1:linked-taxonomy-metadata"
    ],
    {
      "version": "2.0",
      "skillId": "math-1-addition",
      "sourceSkillId": "addition_20",
      "subject": "math",
      "linkage": "linked"
    },
    [],
    "non-production"
  ],
  [
    "json-pack-item:math-expanded-v2.json::$.questionSets.addition_20[1]",
    "json-pack-item",
    {
      "file": "content/math-expanded-v2.json",
      "sidecar": "content/skill-links.v1.json",
      "path": "$.questionSets.addition_20[1]",
      "sourceId": "math-expanded-v2.json::$.questionSets.addition_20[1]"
    },
    {
      "authority": "content/skill-links.v1.json",
      "declaration": "answer-bearing pack item classification",
      "exactSource": "math-expanded-v2.json$.questionSets.addition_20[1]"
    },
    "8fb806ddc0e355d52f77c22ae11b8f762e60cdaf9f882261ac3a6bfaf2f46320",
    [
      "scripts/validate-content.mjs:answer-shape",
      "skill-links.v1:linked-taxonomy-metadata"
    ],
    {
      "version": "2.0",
      "skillId": "math-1-addition",
      "sourceSkillId": "addition_20",
      "subject": "math",
      "linkage": "linked"
    },
    [],
    "non-production"
  ],
  [
    "json-pack-item:math-expanded-v2.json::$.questionSets.fractions_half[0]",
    "json-pack-item",
    {
      "file": "content/math-expanded-v2.json",
      "sidecar": "content/skill-links.v1.json",
      "path": "$.questionSets.fractions_half[0]",
      "sourceId": "math-expanded-v2.json::$.questionSets.fractions_half[0]"
    },
    {
      "authority": "content/skill-links.v1.json",
      "declaration": "answer-bearing pack item classification",
      "exactSource": "math-expanded-v2.json$.questionSets.fractions_half[0]"
    },
    "1440335db6be26251ffaa2730e4157d349d36109e6a6f3bcb3a502a0a09fc81f",
    [
      "scripts/validate-content.mjs:answer-shape",
      "skill-links.v1:linked-taxonomy-metadata"
    ],
    {
      "version": "2.0",
      "skillId": "math-4-fractions",
      "sourceSkillId": "fractions_half",
      "subject": "math",
      "linkage": "linked"
    },
    [],
    "non-production"
  ],
  [
    "json-pack-item:math-question-bank-v1.7.json::$.sets[0]",
    "json-pack-item",
    {
      "file": "content/math-question-bank-v1.7.json",
      "sidecar": "content/skill-links.v1.json",
      "path": "$.sets[0]",
      "sourceId": "math-question-bank-v1.7.json::$.sets[0]"
    },
    {
      "authority": "content/skill-links.v1.json",
      "declaration": "answer-bearing pack item classification",
      "exactSource": "math-question-bank-v1.7.json$.sets[0]"
    },
    "87b1552c334ae9839c67326b980a44eaad2e0b16236435a1a44f23df7a095a14",
    [
      "scripts/validate-content.mjs:answer-shape",
      "skill-links.v1:linked-taxonomy-metadata"
    ],
    {
      "version": "2.0",
      "skillId": "math-1-addition",
      "sourceSkillId": "addition_20",
      "subject": "math",
      "linkage": "linked"
    },
    [],
    "non-production"
  ],
  [
    "json-pack-item:math-question-bank-v1.7.json::$.sets[1]",
    "json-pack-item",
    {
      "file": "content/math-question-bank-v1.7.json",
      "sidecar": "content/skill-links.v1.json",
      "path": "$.sets[1]",
      "sourceId": "math-question-bank-v1.7.json::$.sets[1]"
    },
    {
      "authority": "content/skill-links.v1.json",
      "declaration": "answer-bearing pack item classification",
      "exactSource": "math-question-bank-v1.7.json$.sets[1]"
    },
    "9049cba3545a375e4721d468895b3e7681ac4c292217f5dead9898aa921b0c23",
    [
      "scripts/validate-content.mjs:answer-shape",
      "skill-links.v1:linked-taxonomy-metadata"
    ],
    {
      "version": "2.0",
      "skillId": "math-3-multiplication",
      "sourceSkillId": "multiplication",
      "subject": "math",
      "linkage": "linked"
    },
    [],
    "non-production"
  ],
  [
    "json-pack-item:math-question-bank-v1.7.json::$.sets[2]",
    "json-pack-item",
    {
      "file": "content/math-question-bank-v1.7.json",
      "sidecar": "content/skill-links.v1.json",
      "path": "$.sets[2]",
      "sourceId": "math-question-bank-v1.7.json::$.sets[2]"
    },
    {
      "authority": "content/skill-links.v1.json",
      "declaration": "answer-bearing pack item classification",
      "exactSource": "math-question-bank-v1.7.json$.sets[2]"
    },
    "ea9a691f46d8152dbc43b8ccaa79c1242406a8702bd7df67b2e6080f60277a93",
    [
      "scripts/validate-content.mjs:answer-shape",
      "skill-links.v1:quarantine-reason"
    ],
    null,
    [
      "no-canonical-division-skill"
    ],
    "quarantined"
  ],
  [
    "json-pack-item:math-question-bank-v1.7.json::$.sets[3]",
    "json-pack-item",
    {
      "file": "content/math-question-bank-v1.7.json",
      "sidecar": "content/skill-links.v1.json",
      "path": "$.sets[3]",
      "sourceId": "math-question-bank-v1.7.json::$.sets[3]"
    },
    {
      "authority": "content/skill-links.v1.json",
      "declaration": "answer-bearing pack item classification",
      "exactSource": "math-question-bank-v1.7.json$.sets[3]"
    },
    "5a3fb107494945e9ee523539f7429fabf7eac3577e76b16c29a0a51c358e4001",
    [
      "scripts/validate-content.mjs:answer-shape",
      "skill-links.v1:linked-taxonomy-metadata"
    ],
    {
      "version": "2.0",
      "skillId": "math-4-fractions",
      "sourceSkillId": "fractions_half",
      "subject": "math",
      "linkage": "linked"
    },
    [],
    "non-production"
  ],
  [
    "json-pack-item:math-question-bank-v1.7.json::$.sets[4]",
    "json-pack-item",
    {
      "file": "content/math-question-bank-v1.7.json",
      "sidecar": "content/skill-links.v1.json",
      "path": "$.sets[4]",
      "sourceId": "math-question-bank-v1.7.json::$.sets[4]"
    },
    {
      "authority": "content/skill-links.v1.json",
      "declaration": "answer-bearing pack item classification",
      "exactSource": "math-question-bank-v1.7.json$.sets[4]"
    },
    "ab9de5e338a17cb780ee658ae1fcfaa4793075aaad056077df09b362cc3684c9",
    [
      "scripts/validate-content.mjs:answer-shape",
      "skill-links.v1:linked-taxonomy-metadata"
    ],
    {
      "version": "2.0",
      "skillId": "math-5-decimals",
      "sourceSkillId": "decimals",
      "subject": "math",
      "linkage": "linked"
    },
    [],
    "non-production"
  ],
  [
    "json-pack-item:math-question-bank-v1.7.json::$.sets[5]",
    "json-pack-item",
    {
      "file": "content/math-question-bank-v1.7.json",
      "sidecar": "content/skill-links.v1.json",
      "path": "$.sets[5]",
      "sourceId": "math-question-bank-v1.7.json::$.sets[5]"
    },
    {
      "authority": "content/skill-links.v1.json",
      "declaration": "answer-bearing pack item classification",
      "exactSource": "math-question-bank-v1.7.json$.sets[5]"
    },
    "7e66f2fb4f9398f7e119c546fd14ebe95c4f86c770eaf5f56ddfe67404ddaa99",
    [
      "scripts/validate-content.mjs:answer-shape",
      "skill-links.v1:linked-taxonomy-metadata"
    ],
    {
      "version": "2.0",
      "skillId": "math-6-ratios",
      "sourceSkillId": "ratios",
      "subject": "math",
      "linkage": "linked"
    },
    [],
    "non-production"
  ],
  [
    "json-pack-item:math-question-bank-v1.9.json::$.sets[0]",
    "json-pack-item",
    {
      "file": "content/math-question-bank-v1.9.json",
      "sidecar": "content/skill-links.v1.json",
      "path": "$.sets[0]",
      "sourceId": "math-question-bank-v1.9.json::$.sets[0]"
    },
    {
      "authority": "content/skill-links.v1.json",
      "declaration": "answer-bearing pack item classification",
      "exactSource": "math-question-bank-v1.9.json$.sets[0]"
    },
    "6f8998ff9b9352ebd6e5e2ff7b19ecd361464c08f75279a8008777658adb1342",
    [
      "scripts/validate-content.mjs:answer-shape",
      "skill-links.v1:linked-taxonomy-metadata"
    ],
    {
      "version": "2.0",
      "skillId": "math-3-multiplication",
      "sourceSkillId": "multiplication",
      "subject": "math",
      "linkage": "linked"
    },
    [],
    "non-production"
  ],
  [
    "json-pack-item:math-question-bank-v1.9.json::$.sets[1]",
    "json-pack-item",
    {
      "file": "content/math-question-bank-v1.9.json",
      "sidecar": "content/skill-links.v1.json",
      "path": "$.sets[1]",
      "sourceId": "math-question-bank-v1.9.json::$.sets[1]"
    },
    {
      "authority": "content/skill-links.v1.json",
      "declaration": "answer-bearing pack item classification",
      "exactSource": "math-question-bank-v1.9.json$.sets[1]"
    },
    "78359fb9cdca94bf624e710e31da85adc275b0d4280ef1a5aac652c98cad2959",
    [
      "scripts/validate-content.mjs:answer-shape",
      "skill-links.v1:quarantine-reason"
    ],
    null,
    [
      "no-canonical-division-skill"
    ],
    "quarantined"
  ],
  [
    "json-pack-item:math-question-bank-v1.9.json::$.sets[2]",
    "json-pack-item",
    {
      "file": "content/math-question-bank-v1.9.json",
      "sidecar": "content/skill-links.v1.json",
      "path": "$.sets[2]",
      "sourceId": "math-question-bank-v1.9.json::$.sets[2]"
    },
    {
      "authority": "content/skill-links.v1.json",
      "declaration": "answer-bearing pack item classification",
      "exactSource": "math-question-bank-v1.9.json$.sets[2]"
    },
    "6e664d83d5efdd58e98d222d3ede4d6b1904627f3cf1ef581d273a1f601b24e1",
    [
      "scripts/validate-content.mjs:answer-shape",
      "skill-links.v1:linked-taxonomy-metadata"
    ],
    {
      "version": "2.0",
      "skillId": "math-4-fractions",
      "sourceSkillId": "fractions",
      "subject": "math",
      "linkage": "linked"
    },
    [],
    "non-production"
  ],
  [
    "json-pack-item:math-question-bank-v1.9.json::$.sets[3]",
    "json-pack-item",
    {
      "file": "content/math-question-bank-v1.9.json",
      "sidecar": "content/skill-links.v1.json",
      "path": "$.sets[3]",
      "sourceId": "math-question-bank-v1.9.json::$.sets[3]"
    },
    {
      "authority": "content/skill-links.v1.json",
      "declaration": "answer-bearing pack item classification",
      "exactSource": "math-question-bank-v1.9.json$.sets[3]"
    },
    "6ab423469633ad1527980b20bec6aa1bfe748de3c5df9fd945479aa65402d945",
    [
      "scripts/validate-content.mjs:answer-shape",
      "skill-links.v1:linked-taxonomy-metadata"
    ],
    {
      "version": "2.0",
      "skillId": "math-5-decimals",
      "sourceSkillId": "decimals",
      "subject": "math",
      "linkage": "linked"
    },
    [],
    "non-production"
  ],
  [
    "json-pack-item:math-question-bank-v1.9.json::$.sets[4]",
    "json-pack-item",
    {
      "file": "content/math-question-bank-v1.9.json",
      "sidecar": "content/skill-links.v1.json",
      "path": "$.sets[4]",
      "sourceId": "math-question-bank-v1.9.json::$.sets[4]"
    },
    {
      "authority": "content/skill-links.v1.json",
      "declaration": "answer-bearing pack item classification",
      "exactSource": "math-question-bank-v1.9.json$.sets[4]"
    },
    "5c21e2f4827ef7a4519bf8e387b541625e49a59a0c6f3351ba53c2a8303b1e0a",
    [
      "scripts/validate-content.mjs:answer-shape",
      "skill-links.v1:quarantine-reason"
    ],
    null,
    [
      "no-canonical-integer-skill"
    ],
    "quarantined"
  ],
  [
    "json-pack-item:words-curated-v3.json::$.skills.context_clues[0]",
    "json-pack-item",
    {
      "file": "content/words-curated-v3.json",
      "sidecar": "content/skill-links.v1.json",
      "path": "$.skills.context_clues[0]",
      "sourceId": "words-curated-v3.json::$.skills.context_clues[0]"
    },
    {
      "authority": "content/skill-links.v1.json",
      "declaration": "answer-bearing pack item classification",
      "exactSource": "words-curated-v3.json$.skills.context_clues[0]"
    },
    "a1064f70f5adda17e0fe3d319cca702dd0e7a3d6d44eb931dd6975dca841a14b",
    [
      "scripts/validate-content.mjs:answer-shape",
      "skill-links.v1:quarantine-reason"
    ],
    null,
    [
      "source-skill-content-mismatch-needs-review"
    ],
    "quarantined"
  ],
  [
    "json-pack-item:words-curated-v3.json::$.skills.context_clues[1]",
    "json-pack-item",
    {
      "file": "content/words-curated-v3.json",
      "sidecar": "content/skill-links.v1.json",
      "path": "$.skills.context_clues[1]",
      "sourceId": "words-curated-v3.json::$.skills.context_clues[1]"
    },
    {
      "authority": "content/skill-links.v1.json",
      "declaration": "answer-bearing pack item classification",
      "exactSource": "words-curated-v3.json$.skills.context_clues[1]"
    },
    "432db3381b4ddae407d103568945aa3eba36b0cd520f94efb34daacc29fc0a50",
    [
      "scripts/validate-content.mjs:answer-shape",
      "skill-links.v1:quarantine-reason"
    ],
    null,
    [
      "source-skill-content-mismatch-needs-review"
    ],
    "quarantined"
  ],
  [
    "json-pack-item:words-curated-v3.json::$.skills.homophones[0]",
    "json-pack-item",
    {
      "file": "content/words-curated-v3.json",
      "sidecar": "content/skill-links.v1.json",
      "path": "$.skills.homophones[0]",
      "sourceId": "words-curated-v3.json::$.skills.homophones[0]"
    },
    {
      "authority": "content/skill-links.v1.json",
      "declaration": "answer-bearing pack item classification",
      "exactSource": "words-curated-v3.json$.skills.homophones[0]"
    },
    "f44fe5b39808f037f899092d6fc775d4b1c7b0d12e235c349994b1d5b89807c0",
    [
      "scripts/validate-content.mjs:answer-shape",
      "skill-links.v1:quarantine-reason"
    ],
    null,
    [
      "no-canonical-homophone-skill"
    ],
    "quarantined"
  ],
  [
    "json-pack-item:words-expanded-v2.json::$.questionSets.context_clues[0]",
    "json-pack-item",
    {
      "file": "content/words-expanded-v2.json",
      "sidecar": "content/skill-links.v1.json",
      "path": "$.questionSets.context_clues[0]",
      "sourceId": "words-expanded-v2.json::$.questionSets.context_clues[0]"
    },
    {
      "authority": "content/skill-links.v1.json",
      "declaration": "answer-bearing pack item classification",
      "exactSource": "words-expanded-v2.json$.questionSets.context_clues[0]"
    },
    "1511bbc94ba9789037090e8fc509d8780a4b50a4631de5fa1d3659b724d68cb0",
    [
      "scripts/validate-content.mjs:answer-shape",
      "skill-links.v1:quarantine-reason"
    ],
    null,
    [
      "source-skill-content-mismatch-needs-review"
    ],
    "quarantined"
  ],
  [
    "json-pack-item:words-expanded-v2.json::$.questionSets.homophones[0]",
    "json-pack-item",
    {
      "file": "content/words-expanded-v2.json",
      "sidecar": "content/skill-links.v1.json",
      "path": "$.questionSets.homophones[0]",
      "sourceId": "words-expanded-v2.json::$.questionSets.homophones[0]"
    },
    {
      "authority": "content/skill-links.v1.json",
      "declaration": "answer-bearing pack item classification",
      "exactSource": "words-expanded-v2.json$.questionSets.homophones[0]"
    },
    "64c038b1a897432de30a03d054e13b7cfa5e75e9aed7fd3259ece37ba138015f",
    [
      "scripts/validate-content.mjs:answer-shape",
      "skill-links.v1:quarantine-reason"
    ],
    null,
    [
      "no-canonical-homophone-skill"
    ],
    "quarantined"
  ],
  [
    "json-pack-item:words-question-bank-v1.7.json::$.sets[0]",
    "json-pack-item",
    {
      "file": "content/words-question-bank-v1.7.json",
      "sidecar": "content/skill-links.v1.json",
      "path": "$.sets[0]",
      "sourceId": "words-question-bank-v1.7.json::$.sets[0]"
    },
    {
      "authority": "content/skill-links.v1.json",
      "declaration": "answer-bearing pack item classification",
      "exactSource": "words-question-bank-v1.7.json$.sets[0]"
    },
    "be9d5b9250486ff1253cf993a8d9c8cb704441fbbcda19ea24df2cc7d4630bca",
    [
      "scripts/validate-content.mjs:answer-shape",
      "skill-links.v1:linked-taxonomy-metadata"
    ],
    {
      "version": "2.0",
      "skillId": "vocabulary-2-synonyms",
      "sourceSkillId": "synonyms",
      "subject": "vocabulary",
      "linkage": "linked"
    },
    [],
    "non-production"
  ],
  [
    "json-pack-item:words-question-bank-v1.7.json::$.sets[1]",
    "json-pack-item",
    {
      "file": "content/words-question-bank-v1.7.json",
      "sidecar": "content/skill-links.v1.json",
      "path": "$.sets[1]",
      "sourceId": "words-question-bank-v1.7.json::$.sets[1]"
    },
    {
      "authority": "content/skill-links.v1.json",
      "declaration": "answer-bearing pack item classification",
      "exactSource": "words-question-bank-v1.7.json$.sets[1]"
    },
    "c25cf9974ddbc084034c6ba5e3fb48a03358f98413b99a4a7fe2fa3d42accb94",
    [
      "scripts/validate-content.mjs:answer-shape",
      "skill-links.v1:quarantine-reason"
    ],
    null,
    [
      "no-canonical-antonym-skill"
    ],
    "quarantined"
  ],
  [
    "json-pack-item:words-question-bank-v1.7.json::$.sets[2]",
    "json-pack-item",
    {
      "file": "content/words-question-bank-v1.7.json",
      "sidecar": "content/skill-links.v1.json",
      "path": "$.sets[2]",
      "sourceId": "words-question-bank-v1.7.json::$.sets[2]"
    },
    {
      "authority": "content/skill-links.v1.json",
      "declaration": "answer-bearing pack item classification",
      "exactSource": "words-question-bank-v1.7.json$.sets[2]"
    },
    "6e1afaa3f88acac84c4f738d4990b42f5f686d6da45ccad3bfe1814ee437b03a",
    [
      "scripts/validate-content.mjs:answer-shape",
      "skill-links.v1:quarantine-reason"
    ],
    null,
    [
      "source-skill-content-mismatch-needs-review"
    ],
    "quarantined"
  ],
  [
    "json-pack-item:words-question-bank-v1.7.json::$.sets[3]",
    "json-pack-item",
    {
      "file": "content/words-question-bank-v1.7.json",
      "sidecar": "content/skill-links.v1.json",
      "path": "$.sets[3]",
      "sourceId": "words-question-bank-v1.7.json::$.sets[3]"
    },
    {
      "authority": "content/skill-links.v1.json",
      "declaration": "answer-bearing pack item classification",
      "exactSource": "words-question-bank-v1.7.json$.sets[3]"
    },
    "efe45d6e1d9a03bf5313e32390098214fd44850a000c0dadf384f958be945121",
    [
      "scripts/validate-content.mjs:answer-shape",
      "skill-links.v1:quarantine-reason"
    ],
    null,
    [
      "no-canonical-homophone-skill"
    ],
    "quarantined"
  ],
  [
    "json-pack-item:words-question-bank-v1.7.json::$.sets[4]",
    "json-pack-item",
    {
      "file": "content/words-question-bank-v1.7.json",
      "sidecar": "content/skill-links.v1.json",
      "path": "$.sets[4]",
      "sourceId": "words-question-bank-v1.7.json::$.sets[4]"
    },
    {
      "authority": "content/skill-links.v1.json",
      "declaration": "answer-bearing pack item classification",
      "exactSource": "words-question-bank-v1.7.json$.sets[4]"
    },
    "392f9e05dc24a6b22fbd7b2e19f6972bba051fdead6fa16b849c849bf55f07a5",
    [
      "scripts/validate-content.mjs:answer-shape",
      "skill-links.v1:linked-taxonomy-metadata"
    ],
    {
      "version": "2.0",
      "skillId": "vocabulary-5-roots",
      "sourceSkillId": "roots",
      "subject": "vocabulary",
      "linkage": "linked"
    },
    [],
    "non-production"
  ],
  [
    "json-pack-item:words-question-bank-v1.9.json::$.sets[0]",
    "json-pack-item",
    {
      "file": "content/words-question-bank-v1.9.json",
      "sidecar": "content/skill-links.v1.json",
      "path": "$.sets[0]",
      "sourceId": "words-question-bank-v1.9.json::$.sets[0]"
    },
    {
      "authority": "content/skill-links.v1.json",
      "declaration": "answer-bearing pack item classification",
      "exactSource": "words-question-bank-v1.9.json$.sets[0]"
    },
    "d95a26f331e78fdba8b16b0dba9090d7c278ffc6ebe66f821fe4c928d5a467a4",
    [
      "scripts/validate-content.mjs:answer-shape",
      "skill-links.v1:linked-taxonomy-metadata"
    ],
    {
      "version": "2.0",
      "skillId": "vocabulary-5-roots",
      "sourceSkillId": "roots",
      "subject": "vocabulary",
      "linkage": "linked"
    },
    [],
    "non-production"
  ],
  [
    "json-pack-item:words-question-bank-v1.9.json::$.sets[1]",
    "json-pack-item",
    {
      "file": "content/words-question-bank-v1.9.json",
      "sidecar": "content/skill-links.v1.json",
      "path": "$.sets[1]",
      "sourceId": "words-question-bank-v1.9.json::$.sets[1]"
    },
    {
      "authority": "content/skill-links.v1.json",
      "declaration": "answer-bearing pack item classification",
      "exactSource": "words-question-bank-v1.9.json$.sets[1]"
    },
    "fcd5e8ab727736b06896ed7dc462956ce56dae5c33ae42f387bc19763d71c1a4",
    [
      "scripts/validate-content.mjs:answer-shape",
      "skill-links.v1:quarantine-reason"
    ],
    null,
    [
      "no-canonical-figurative-language-skill"
    ],
    "quarantined"
  ],
  [
    "json-pack-item:words-question-bank-v1.9.json::$.sets[2]",
    "json-pack-item",
    {
      "file": "content/words-question-bank-v1.9.json",
      "sidecar": "content/skill-links.v1.json",
      "path": "$.sets[2]",
      "sourceId": "words-question-bank-v1.9.json::$.sets[2]"
    },
    {
      "authority": "content/skill-links.v1.json",
      "declaration": "answer-bearing pack item classification",
      "exactSource": "words-question-bank-v1.9.json$.sets[2]"
    },
    "5ebb78aaa02cbfcd4739e92752920b2ba685cfdff5381163b5efc328a6843e1f",
    [
      "scripts/validate-content.mjs:answer-shape",
      "skill-links.v1:quarantine-reason"
    ],
    null,
    [
      "source-skill-content-mismatch-needs-review"
    ],
    "quarantined"
  ]
];

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
    return value;
  }

  // Educator approvals are data, not code. The digest gate still protects the content:
  // if a source value changes, its recorded digest no longer matches and the approval
  // stops being eligible until a reviewer re-signs the new digest.
  // Populate with: node scripts/approve-content.mjs --reviewer <id> --role <role> --ids <file>
  const EDUCATOR_APPROVALS = {
  };

  function recordFromRow(row) {
    const [identity, kind, source, provenance, digest, evidence, taxonomy, quarantineReasons, runtimeStatus] = row;
    const quarantined = quarantineReasons.length > 0;
    const productionRegistry = kind === "registry-mission" && !quarantined;
    const approval = quarantined ? null : EDUCATOR_APPROVALS[identity] || null;
    const productionEligible = productionRegistry || Boolean(approval);
    return {
      identity,
      kind,
      source,
      provenance,
      digest: {
        algorithm: "sha256",
        encoding: "hex",
        input: "canonical-json-source-value",
        value: digest,
      },
      verification: {
        status: "validated",
        mode: "programmatic",
        evidence,
      },
      taxonomy,
      educatorReview: approval
        ? { status: "approved", reviewer: approval.reviewer, reviewedAt: approval.reviewedAt }
        : { status: "pending-educator", reviewer: null, reviewedAt: null },
      quarantine: {
        status: quarantined ? "quarantined" : "clear",
        reasons: quarantineReasons,
      },
      runtime: {
        status: productionEligible ? "production-reviewed" : runtimeStatus,
        prototype: !productionEligible,
        production: productionEligible,
      },
      promotion: {
        status: quarantined ? "quarantined" : productionEligible ? "production-reviewed" : "pending-educator",
        reasons: quarantined ? ["quarantine-active"] : productionEligible ? [] : ["educator-review-pending"],
      },
    };
  }

  const records = rows.map(recordFromRow);
  const recordByIdentity = new Map(records.map(record => [record.identity, record]));

  const manifest = deepFreeze({
    version: "3.3.0",
    manifestVersion: "3.3.0",
    schemaVersion: 1,
    digestContract: {
      algorithm: "sha256",
      encoding: "hex",
      input: "canonical-json-source-value",
      canonicalization: "JSON objects use lexicographically sorted keys; arrays preserve order.",
    },
    educatorReviewPolicy: {
      requiredForProduction: true,
      currentState: "pending-educator",
      approvalMetadata: ["reviewer.id", "reviewer.role", "reviewer.reviewedAt"],
    },
    coverage: {
      registryMissions: 30,
      generatedTemplates: 35,
      jsonPackItems: 40,
      linkedJsonPackItems: 17,
      quarantinedJsonPackItems: 23,
      totalRecords: 105,
    },
    records,
  });

  function isObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }

  function nonEmpty(value) {
    return typeof value === "string" && value.trim().length > 0;
  }

  function resolveRecord(input) {
    return typeof input === "string" ? recordByIdentity.get(input) || null : input;
  }

  function suppliedDigest(options) {
    if (!isObject(options)) return null;
    return options.currentDigest ?? options.sourceDigest ?? options.digest ?? null;
  }

  function educatorReviewIssues(review) {
    if (!isObject(review)) return ["educator-review-metadata-invalid"];
    if (review.status === "approved") {
      const reviewer = isObject(review.reviewer) ? review.reviewer : review;
      const reviewerId = reviewer.id ?? review.reviewerId;
      const reviewerRole = reviewer.role ?? review.reviewerRole;
      const reviewedAt = reviewer.reviewedAt ?? review.reviewedAt;
      return nonEmpty(reviewerId) && nonEmpty(reviewerRole) && nonEmpty(reviewedAt)
        ? []
        : ["educator-review-metadata-invalid"];
    }
    if (review.status === "pending-educator") {
      return review.reviewer === null && review.reviewedAt === null
        ? []
        : ["educator-review-metadata-invalid"];
    }
    return ["educator-review-state-invalid"];
  }

  function uniqueReasons(reasons) {
    return [...new Set(reasons)];
  }

  function evaluateReview(input, options = {}, gate = "production") {
    const record = resolveRecord(input);
    if (!record) {
      return { gate, recordIdentity: null, eligible: false, reasons: ["record-not-found"] };
    }

    const reasons = [];
    const actualDigest = suppliedDigest(options);
    if (record.digest?.algorithm !== "sha256" || record.digest?.encoding !== "hex" || !/^[0-9a-f]{64}$/.test(record.digest?.value || "")) {
      reasons.push("digest-contract-invalid");
    }
    if (!nonEmpty(actualDigest)) reasons.push("source-digest-not-supplied");
    else if (actualDigest !== record.digest?.value) reasons.push("source-digest-mismatch");

    if (!isObject(record.source) || !nonEmpty(record.source.file) || !nonEmpty(record.source.path)) {
      reasons.push("provenance-source-missing");
    }
    if (!isObject(record.provenance) || !nonEmpty(record.provenance.authority) || !nonEmpty(record.provenance.exactSource)) {
      reasons.push("provenance-metadata-missing");
    }
    if (record.verification?.status !== "validated" || record.verification?.mode !== "programmatic") {
      reasons.push("programmatic-verification-missing");
    }
    if (!Array.isArray(record.verification?.evidence) || record.verification.evidence.length === 0) {
      reasons.push("verification-evidence-missing");
    }
    if (record.quarantine?.status !== "clear" || !Array.isArray(record.quarantine?.reasons) || record.quarantine.reasons.length !== 0) {
      reasons.push("quarantine-active");
    }
    reasons.push(...educatorReviewIssues(record.educatorReview));

    const productionRegistry = record.kind === "registry-mission"
      && record.runtime?.status === "production-reviewed"
      && record.runtime?.prototype === false
      && record.runtime?.production === true
      && record.promotion?.status === "production-reviewed";
    if (gate === "internal-review") {
      if (!productionRegistry) {
        if (record.runtime?.prototype !== true) reasons.push("record-is-not-a-prototype");
        if (!["internal-review", "non-production"].includes(record.runtime?.status)) reasons.push("runtime-not-internal-review");
        if (record.runtime?.production === true) reasons.push("prototype-marked-production");
      }
    } else {
      if (!productionRegistry && record.educatorReview?.status !== "approved") reasons.push("educator-review-required");
    }

    return {
      gate,
      recordIdentity: record.identity || null,
      eligible: uniqueReasons(reasons).length === 0,
      reasons: uniqueReasons(reasons),
    };
  }

  function getReviewManifest() {
    return manifest;
  }

  function getReviewRecord(identity) {
    return recordByIdentity.get(String(identity)) || null;
  }

  function evaluateReviewRecord(input, options = {}) {
    return evaluateReview(input, options, "production");
  }

  function evaluateInternalReviewGate(input, options = {}) {
    return evaluateReview(input, options, "internal-review");
  }

  function evaluateProductionGate(input, options = {}) {
    return evaluateReview(input, options, "production");
  }

  function evaluatePromotionGate(input, options = {}) {
    const gate = options && options.gate === "internal-review" ? "internal-review" : "production";
    return evaluateReview(input, options, gate);
  }

  return Object.freeze({
    manifest,
    records: manifest.records,
    approvals: EDUCATOR_APPROVALS,
    getReviewManifest,
    getReviewRecord,
    evaluateReview,
    evaluateReviewRecord,
    evaluateInternalReviewGate,
    evaluateProductionGate,
    evaluatePromotionGate,
  });
});
