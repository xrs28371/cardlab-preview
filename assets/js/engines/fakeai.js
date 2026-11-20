(function () {
  'use strict';
  var resources;
  function setup(pack) {
    if (!resources) resources = Promise.all([pack.questionsPack, pack.markersPack, pack.blocklistPack].map(function (path) {
      return fetch(path).then(function (r) { if (!r.ok) throw new Error('config_unavailable'); return r.json(); });
    })).then(function (r) {
      return { questions: r[0].questions, ai: r[1].ai.map(regex), human: r[1].human.map(regex), blocked: r[2].patterns.map(regex) };
    }).catch(function (e) { resources = null; throw e; });
    return resources;
  }
  function regex(pattern) { return new RegExp(pattern, 'iu'); }
  function normalized(text) { return text.normalize('NFKC'); }
  function count(patterns, text) { return patterns.filter(function (p) { return p.test(normalized(text)); }).length; }
  function telemetry(action) {
    try {
      var ref;
      try { var p = JSON.parse(localStorage.getItem('cardlab.referral.v1')); if (p && p.has && p.code) ref = p.code; } catch (_) {}
      ref = ref || localStorage.getItem('cl_ref') || 'OFFICIAL';
      navigator.sendBeacon('https://earnway.shop/central-dashboard/api/ew-telemetry.php', new Blob([JSON.stringify({ site: 'cardlab', toolId: 'fakeai', action: action, ref: ref })], { type: 'text/plain;charset=UTF-8' }));
    } catch (_) {}
  }
  // All transitions use one deadline; a late submit cannot beat a delayed timer.
  // now/random are dependencies for deterministic clock and draw tests.
  function createSession(data, options) {
    options = options || {};
    var now = options.now || function () { return performance.now(); }, random = options.random || Math.random;
    var state = 'start', lastId, remaining = [], round, started;
    function start() {
      if (state === 'answering') return round;
      if (!remaining.length) remaining = data.questions.slice();
      var choices = remaining.filter(function (q) { return q.id !== lastId; });
      if (!choices.length) choices = remaining;
      var q = choices[Math.floor(random() * choices.length)];
      remaining = remaining.filter(function (p) { return p.id !== q.id; }); lastId = q.id;
      started = now(); round = { question: q, answer: '', elapsed: 0, score: 0, ai: 0, human: 0, verdict: '', remaining: 60 };
      state = 'answering'; telemetry('fakeai_round'); return round;
    }
    function tick() {
      if (state !== 'answering') return round;
      round.remaining = Math.max(0, Math.ceil((60000 - (now() - started)) / 1000));
      if (round.remaining === 0) { round.elapsed = 60; round.verdict = 'timeout'; state = 'result'; }
      return round;
    }
    function submit(text) {
      if (state !== 'answering') return { error: 'inactive' };
      tick(); if (state === 'result') return { round: round };
      if (!text.trim() || Array.from(text).length > 300) return { error: 'invalid' };
      if (count(data.blocked, text)) return { error: 'blocked' };
      round.answer = text; round.ai = count(data.ai, text); round.human = count(data.human, text);
      round.score = Math.max(0, Math.min(100, 40 + round.ai * 20 - round.human * 15));
      round.elapsed = Math.min(60, Math.max(0, Math.round((now() - started) / 100) / 10));
      round.verdict = round.score >= 80 ? 'high' : round.score >= 50 ? 'mid' : 'low'; state = 'result';
      return { round: round };
    }
    return { start: start, tick: tick, submit: submit, state: function () { return state; }, round: function () { return round; } };
  }
  function explanation(round, ui) {
    return round.verdict === 'timeout' ? ui.timedOut : ui.breakdown.replace('{ai}', round.ai).replace('{human}', round.human).replace('{score}', round.score);
  }
  function buildResult(round, pack) {
    var ui = pack.ui, answer = Array.from(round.answer).slice(0, 100).join('') + (Array.from(round.answer).length > 100 ? '…' : '');
    // Only the card excerpt gains invisible wrap opportunities for long tokens.
    // Keep the submitted answer and scoring intact; shared cards need no changes.
    answer = answer.replace(/\S{20,}/gu, function (token) { return Array.from(token).join('\u200b'); });
    return { layout: 'compact', headline: ui.reportTitle, label: ui.score, bigText: String(round.score),
      equivText: ui.elapsed + ': ' + round.elapsed + 's', badgeText: ui[round.verdict],
      copy: round.question[CL.Config.lang()] + '\n\n' + (answer || ui.empty), note: ui.note,
      watermarkName: pack.card.watermarkName, fileSlug: 'fakeai-report', deepLink: location.origin + '/?tool=fakeai',
      onExport: function () { telemetry('card_generated'); } };
  }
  async function report() {
    try {
      var r = await fetch((window.CL_API_BASE || '/api').replace(/\/$/, '') + '/report', {
        method: 'POST', credentials: 'omit', referrerPolicy: 'no-referrer', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId: 'fakeai', reason: 'user_report' }), keepalive: true
      });
      return r.status === 204;
    } catch (_) { return false; }
  }
  CL.Registry.provideEngine({ setup: setup, createSession: createSession, explanation: explanation, report: report,
    run: buildResult, rebuild: function (r, pack) { return buildResult(r.round, pack); }, rerunOf: function (round) { return { round: round }; } });
})();
