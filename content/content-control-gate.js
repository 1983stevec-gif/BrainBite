(function installContentControlGate(root, factory) {
  const api = factory(root, root.BrainBiteContentReviewManifest);
  root.BrainBiteContentControl = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof globalThis === 'object' ? globalThis : this, function createContentControlGate(root, manifest) {
  'use strict';

  const RUNTIME_MODES = Object.freeze({
    internalReview: 'internal-review',
    production: 'production',
  });
  const SUSPICIOUS_THRESHOLDS = Object.freeze({
    minimumAttempts: 4,
    windowAttempts: 8,
    minimumDistinctLearners: 3,
    minimumAnomalousLearners: 3,
    missRate: 0.75,
    retryCount: 3,
    hintRate: 0.75,
    minimumResponseTimeMs: 450,
    maximumResponseTimeMs: 120000,
  });
  // Capture build/test switches once. Runtime callers must not be able to
  // downgrade a hosted production page by mutating window globals later.
  const BOOT_FLAGS = Object.freeze({
    test: root.__BRAINBITE_TEST__ === true,
    internalReview: root.__BRAINBITE_INTERNAL_REVIEW__ === true,
    release: root.__BRAINBITE_RELEASE__ === true,
    production: root.__BRAINBITE_PRODUCTION__ === true,
    beta: root.__BRAINBITE_BETA__ === true,
    rc: root.__BRAINBITE_RC__ === true,
  });

  function unique(values) {
    return [...new Set(values.filter(Boolean).map(String))];
  }

  function canonicalize(value) {
    if (value === undefined) return 'null';
    if (value === null || typeof value !== 'object') return JSON.stringify(value);
    if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalize(value[key])}`).join(',')}}`;
  }

  // The launch path is synchronous for compatibility with the legacy game API.
  function sha256Hex(input) {
    const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input;
    const bitLength = bytes.length * 8;
    const paddedLength = Math.ceil((bytes.length + 9) / 64) * 64;
    const padded = new Uint8Array(paddedLength);
    padded.set(bytes);
    padded[bytes.length] = 0x80;
    const view = new DataView(padded.buffer);
    view.setUint32(paddedLength - 8, Math.floor(bitLength / 0x100000000) >>> 0);
    view.setUint32(paddedLength - 4, bitLength >>> 0);

    const constants = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
    ];
    let h0 = 0x6a09e667;
    let h1 = 0xbb67ae85;
    let h2 = 0x3c6ef372;
    let h3 = 0xa54ff53a;
    let h4 = 0x510e527f;
    let h5 = 0x9b05688c;
    let h6 = 0x1f83d9ab;
    let h7 = 0x5be0cd19;
    const words = new Uint32Array(64);
    const rotateRight = (value, bits) => (value >>> bits) | (value << (32 - bits));

    for (let offset = 0; offset < padded.length; offset += 64) {
      for (let index = 0; index < 16; index++) words[index] = view.getUint32(offset + index * 4);
      for (let index = 16; index < 64; index++) {
        const s0 = rotateRight(words[index - 15], 7) ^ rotateRight(words[index - 15], 18) ^ (words[index - 15] >>> 3);
        const s1 = rotateRight(words[index - 2], 17) ^ rotateRight(words[index - 2], 19) ^ (words[index - 2] >>> 10);
        words[index] = (words[index - 16] + s0 + words[index - 7] + s1) >>> 0;
      }
      let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
      for (let index = 0; index < 64; index++) {
        const s1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
        const ch = (e & f) ^ (~e & g);
        const temp1 = (h + s1 + ch + constants[index] + words[index]) >>> 0;
        const s0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const temp2 = (s0 + maj) >>> 0;
        h = g; g = f; f = e; e = (d + temp1) >>> 0; d = c; c = b; b = a; a = (temp1 + temp2) >>> 0;
      }
      h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0;
      h4 = (h4 + e) >>> 0; h5 = (h5 + f) >>> 0; h6 = (h6 + g) >>> 0; h7 = (h7 + h) >>> 0;
    }
    return [h0, h1, h2, h3, h4, h5, h6, h7].map(value => value.toString(16).padStart(8, '0')).join('');
  }

  function digest(value) {
    return sha256Hex(canonicalize(value));
  }

  function getRuntimeMode(options = {}) {
    const explicit = options.mode || root.__BRAINBITE_RUNTIME_MODE__ || root.__BRAINBITE_TEST_MODE__;
    const href = options.href || root.location?.href || '';
    let url = null;
    try { url = new URL(href || 'http://localhost/'); } catch {}
    const queryMode = url?.searchParams.get('contentMode') || url?.searchParams.get('runtimeMode') || url?.searchParams.get('mode');
    const requested = String(explicit || queryMode || '').trim().toLowerCase();
    const productionRequested = ['production', 'prod', 'release', 'rc', 'beta', 'beta-release'].includes(requested);
    const releaseRuntime = ['release', 'production', 'beta', 'rc'].some(flag => url?.searchParams.get(flag) === '1')
      || BOOT_FLAGS.release || BOOT_FLAGS.production || BOOT_FLAGS.beta || BOOT_FLAGS.rc;
    if (productionRequested || releaseRuntime) return RUNTIME_MODES.production;
    const localhost = ['localhost', '127.0.0.1', '::1'].includes(url?.hostname);
    const trustedHarness = options.trustedTestHarness === true || BOOT_FLAGS.test || BOOT_FLAGS.internalReview;
    if (trustedHarness) return RUNTIME_MODES.internalReview;
    if (localhost && ['internal-review', 'internal', 'review', 'test', 'testing'].includes(requested)) return RUNTIME_MODES.internalReview;
    if (localhost && url?.searchParams.get('test') === '1') return RUNTIME_MODES.internalReview;
    if (localhost && !requested) return RUNTIME_MODES.internalReview;
    return RUNTIME_MODES.production;
  }

  function getReviewRecord(identity) {
    if (!manifest?.getReviewRecord) return null;
    return manifest.getReviewRecord(String(identity));
  }

  function resolveRuntimeSource(record, options = {}) {
    if (!record) return undefined;
    if (record.kind === 'registry-mission') {
      const missions = options.registry?.missions;
      return Array.isArray(missions)
        ? missions.find(mission => String(mission.id) === String(record.source?.sourceId))
        : undefined;
    }
    if (record.kind === 'generated-template') return options.core?.CURRICULUM_ITEM_TEMPLATES?.[record.source?.sourceId];
    return undefined;
  }

  function reviewGate(record, currentDigest, gateMode) {
    if (!manifest?.evaluateReview) return { gate: gateMode, recordIdentity: null, eligible: false, reasons: ['manifest-unavailable'] };
    return manifest.evaluateReview(record, { currentDigest }, gateMode);
  }

  function evaluateRecord(identityOrRecord, options = {}) {
    const record = typeof identityOrRecord === 'object' ? identityOrRecord : getReviewRecord(identityOrRecord);
    const gateMode = getRuntimeMode(options);
    const sourceValue = options.sourceValue !== undefined ? options.sourceValue : resolveRuntimeSource(record, options);
    const currentDigest = sourceValue === undefined ? options.currentDigest || null : digest(sourceValue);
    const base = reviewGate(record, currentDigest, gateMode);
    const reasons = [...(base.reasons || [])];
    if (sourceValue === undefined && !options.currentDigest) reasons.push('runtime-source-unavailable');
    if (gateMode === RUNTIME_MODES.production && record?.runtime?.prototype === true) reasons.push('prototype-not-production');
    if (gateMode === RUNTIME_MODES.production && record?.runtime?.production !== true) reasons.push('production-runtime-not-enabled');
    return {
      ...base,
      gateMode,
      recordIdentity: record?.identity || base.recordIdentity || null,
      actualDigest: currentDigest,
      eligible: unique(reasons).length === 0,
      reasons: unique(reasons),
      record,
    };
  }

  function validationPassed(validation) {
    return validation === true || validation?.valid === true || validation?.approved === true;
  }

  function evaluateLaunch(options = {}) {
    const result = evaluateRecord(options.identity || options.record, options);
    const reasons = [...result.reasons];
    const launchedPayloadDigest = options.launchedPayload === undefined ? null : digest(options.launchedPayload);
    const contentIdentity = launchedPayloadDigest && result.record?.kind !== 'registry-mission'
      ? `${result.recordIdentity || 'unknown'}@sha256:${launchedPayloadDigest}`
      : result.recordIdentity;
    if (result.record?.kind === 'registry-mission' && launchedPayloadDigest !== result.actualDigest) {
      reasons.push('launched-payload-source-mismatch');
    }
    if (Array.isArray(options.quarantinedContentIdentities) && options.quarantinedContentIdentities.includes(contentIdentity)) {
      reasons.push('runtime-content-quarantine-active');
    }
    if (!validationPassed(options.programmaticValidation)) reasons.push('programmatic-runtime-validation-missing');
    const eligible = unique(reasons).length === 0;
    const launch = {
      ...result,
      templateIdentity: result.recordIdentity,
      contentIdentity,
      launchedPayloadDigest,
      eligible,
      approved: eligible,
      reasons: unique(reasons),
    };
    return { ...launch, telemetry: toTelemetryContext(launch) };
  }

  function toTelemetryContext(result = {}) {
    const record = result.record;
    return {
      contentIdentity: String(result.contentIdentity || record?.identity || result.recordIdentity || 'unknown'),
      templateIdentity: String(result.templateIdentity || record?.identity || result.recordIdentity || 'unknown'),
      templateDigest: String(result.actualDigest || 'unknown'),
      launchedPayloadDigest: result.launchedPayloadDigest ? String(result.launchedPayloadDigest) : null,
      contentKind: String(record?.kind || 'unknown'),
      manifestStatus: String(record?.promotion?.status || record?.runtime?.status || 'unknown'),
      runtimeStatus: String(record?.runtime?.status || 'unknown'),
      verificationStatus: String(record?.verification?.status || 'unknown'),
      provenance: {
        sourceFile: String(record?.source?.file || 'unknown'),
        sourcePath: String(record?.source?.path || 'unknown'),
        authority: String(record?.provenance?.authority || 'unknown'),
        declaration: String(record?.provenance?.declaration || 'unknown'),
        exactSource: String(record?.provenance?.exactSource || 'unknown'),
      },
      gateMode: String(result.gateMode || result.gate || getRuntimeMode()),
      gateDecision: result.eligible ? 'allowed' : 'denied',
    };
  }

  function inspectLearnerWindow(attempts = [], thresholds = {}) {
    const recent = (Array.isArray(attempts) ? attempts : []).slice(-thresholds.windowAttempts);
    const attemptCount = recent.length;
    const incorrectAttempts = recent.filter(attempt => !attempt?.correct).length;
    const hintAttempts = recent.filter(attempt => Number(attempt?.hintsUsed) > 0 || attempt?.assisted === true).length;
    const retryCount = incorrectAttempts;
    const responseTimes = recent.map(attempt => Number(attempt?.responseTimeMs) || 0).filter(value => value > 0);
    const missRate = attemptCount ? incorrectAttempts / attemptCount : 0;
    const hintRate = attemptCount ? hintAttempts / attemptCount : 0;
    const signals = [];
    if (attemptCount >= thresholds.minimumAttempts && missRate >= thresholds.missRate) signals.push('high-miss-rate');
    if (attemptCount >= thresholds.minimumAttempts && retryCount >= thresholds.retryCount) signals.push('high-retry-count');
    if (attemptCount >= thresholds.minimumAttempts && hintRate >= thresholds.hintRate) signals.push('high-hint-rate');
    const timingOutlier = value => value > 0 && (value < thresholds.minimumResponseTimeMs || value > thresholds.maximumResponseTimeMs);
    const responseTimeAnomaly = responseTimes.some(timingOutlier);
    // Fast correct answers are valid. Timing evidence is only review evidence
    // when the unreliable response itself is incorrect; it is not a learner
    // punishment and is not a content quarantine by itself.
    const corroboratedByUnreliableResponse = recent.some(attempt => !attempt?.correct && timingOutlier(Number(attempt?.responseTimeMs)));
    if (attemptCount >= thresholds.minimumAttempts && responseTimeAnomaly && corroboratedByUnreliableResponse) signals.push('response-time-anomaly');
    return {
      attempts: recent,
      metrics: { attemptCount, incorrectAttempts, retryCount, hintAttempts, missRate, hintRate },
      signals,
    };
  }

  function observationWindows(options = {}, thresholds = {}) {
    const supplied = options.contentObservations || options.crossLearnerObservations || options.qualityObservations || options.observations;
    if (!Array.isArray(supplied) || supplied.length === 0) return [];
    if (supplied.every(item => item && Array.isArray(item.attempts))) {
      return supplied.map((item, index) => ({
        learnerId: item.learnerId ?? item.profileId ?? item.userId ?? null,
        observationId: item.id ?? `observation-${index}`,
        ...inspectLearnerWindow(item.attempts, thresholds),
      }));
    }
    // Accept a flat cross-learner event stream as a convenience for telemetry
    // callers, but require a stable learner/profile identity before it can be
    // treated as corroboration.
    if (supplied.every(item => item && ('correct' in item || 'responseTimeMs' in item))) {
      const groups = new Map();
      supplied.forEach((attempt, index) => {
        const learnerId = attempt.learnerId ?? attempt.profileId ?? attempt.userId;
        if (learnerId == null) return;
        const key = String(learnerId);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(attempt);
      });
      return [...groups.entries()].map(([learnerId, learnerAttempts]) => ({
        learnerId,
        observationId: `learner-${learnerId}`,
        ...inspectLearnerWindow(learnerAttempts, thresholds),
      }));
    }
    return [];
  }

  function corroboratedQualitySignals(windows, thresholds) {
    const identified = windows.filter(window => window.learnerId != null && window.metrics.attemptCount >= thresholds.minimumAttempts);
    const distinctLearners = new Set(identified.map(window => String(window.learnerId))).size;
    const totalAttempts = identified.reduce((sum, window) => sum + window.metrics.attemptCount, 0);
    const anomalousLearners = identified.filter(window => window.signals.length > 0);
    const completeWindow = totalAttempts >= thresholds.minimumDistinctLearners * thresholds.minimumAttempts;
    const enoughLearners = distinctLearners >= thresholds.minimumDistinctLearners;
    const enoughAnomalousLearners = anomalousLearners.length >= thresholds.minimumAnomalousLearners;
    const qualitySignals = [];
    if (completeWindow && enoughLearners && enoughAnomalousLearners) {
      for (const signal of ['high-miss-rate', 'high-retry-count', 'high-hint-rate', 'response-time-anomaly']) {
        const count = anomalousLearners.filter(window => window.signals.includes(signal)).length;
        if (count >= thresholds.minimumAnomalousLearners) qualitySignals.push(signal);
      }
    }
    return {
      signals: qualitySignals,
      metrics: {
        observationCount: windows.length,
        distinctLearners,
        anomalousLearners: anomalousLearners.length,
        totalAttempts,
        completeWindow,
      },
    };
  }

  function inspectOutcome(attempts = [], options = {}) {
    const thresholds = { ...SUSPICIOUS_THRESHOLDS };
    const learnerWindow = inspectLearnerWindow(attempts, thresholds);
    const windows = observationWindows(options, thresholds);
    const quality = corroboratedQualitySignals(windows, thresholds);
    const reviewSignals = learnerWindow.signals;
    return {
      // `signals` remains the learner-level telemetry surface for callers that
      // already record it. It does not imply quarantine; `qualitySignals` is
      // the only signal set eligible to quarantine content.
      suspicious: quality.signals.length > 0,
      signals: reviewSignals,
      reviewSignals,
      qualitySignals: quality.signals,
      qualityMetrics: quality.metrics,
      thresholds,
      metrics: learnerWindow.metrics,
      action: quality.signals.length ? 'quarantine-review' : reviewSignals.length ? 'review-telemetry' : 'none',
      learnerPunishment: 'none',
    };
  }

  function quarantineSuspiciousOutcome(attempts = [], options = {}) {
    const outcome = inspectOutcome(attempts, options);
    return {
      ...outcome,
      // A single learner's errors, retries, hints, or timing cannot quarantine
      // the content or lock the learner out. Only corroborated quality signals
      // from a complete, cross-learner observation window can do so.
      signals: outcome.qualitySignals,
      quarantined: outcome.qualitySignals.length > 0,
      suspicious: outcome.qualitySignals.length > 0,
      contentIdentity: options.contentIdentity ? String(options.contentIdentity) : null,
    };
  }

  return Object.freeze({
    RUNTIME_MODES,
    SUSPICIOUS_THRESHOLDS,
    manifestAvailable: !!manifest,
    canonicalize,
    digest,
    getRuntimeMode,
    getReviewRecord,
    resolveRuntimeSource,
    evaluateRecord,
    evaluateLaunch,
    toTelemetryContext,
    inspectOutcome,
    quarantineSuspiciousOutcome,
  });
});
