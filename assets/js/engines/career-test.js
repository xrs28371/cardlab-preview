/* =====================================================================
   引擎 · 工具② 职业人格调侃测试
   机制（规格）：10 道二选一 → 每题选项带 trait 权重 → 各 trait 按
   可达最大值归一化为百分制 → 与原型 profile 逐维求距离，最近的
   原型胜出（并列取配置顺序第一个）→ 原型名（大字）+ tagline 徽章
   + 三行以上特质条 + 原型文案出卡。同样的答案永远同一结果。
   题目/原型/权重全部来自 pack 配置；pack 里 contentStatus =
   "sample-placeholder" 表示内容为示例占位，待雇主确认后替换
   （换内容只改配置，本引擎不动）。
   ===================================================================== */
(function () {
  'use strict';

  function score(pack, answers) {
    var totals = {}, maxes = {};
    pack.traits.forEach(function (t) { totals[t.id] = 0; maxes[t.id] = 0; });
    pack.questions.forEach(function (q, qi) {
      var picked = null;
      q.options.forEach(function (o) { if (o.id === answers[qi]) picked = o; });
      // 每题对每个 trait 的可达最大值 = 两选项权重取大者
      var traitKeys = {};
      q.options.forEach(function (o) { Object.keys(o.traits).forEach(function (k) { traitKeys[k] = true; }); });
      Object.keys(traitKeys).forEach(function (k) {
        var m = 0;
        q.options.forEach(function (o) { m = Math.max(m, o.traits[k] || 0); });
        if (maxes[k] !== undefined) maxes[k] += m;
      });
      if (picked) {
        Object.keys(picked.traits).forEach(function (k) {
          if (totals[k] !== undefined) totals[k] += picked.traits[k];
        });
      }
    });
    var pcts = {};
    pack.traits.forEach(function (t) {
      pcts[t.id] = maxes[t.id] > 0 ? Math.round(totals[t.id] / maxes[t.id] * 100) : 0;
    });
    return pcts;
  }

  function pickArchetype(pack, pcts) {
    var best = null, bestDist = Infinity;
    pack.archetypes.forEach(function (a) {
      var d = 0;
      Object.keys(a.profile).forEach(function (k) {
        d += Math.abs((pcts[k] || 0) - a.profile[k]);
      });
      if (d < bestDist) { bestDist = d; best = a; }
    });
    return best;
  }

  function run(answers, pack) {
    if (!answers || answers.length !== pack.questions.length) return null;
    var pcts = score(pack, answers);
    var arch = pickArchetype(pack, pcts);
    if (!arch) return null;
    var cardCfg = pack.card || {};
    return {
      headline: '',
      label: cardCfg.label || '',
      bigText: arch.name,
      bigIsText: true,
      equivText: null,
      badgeText: arch.tagline,
      extra: {
        kind: 'traits',
        items: pack.traits.map(function (t) { return { label: t.label, pct: pcts[t.id] }; })
      },
      copy: arch.copy,
      note: cardCfg.note || '',
      watermarkName: cardCfg.watermarkName || '',
      countUp: null,
      fileSlug: 'career-test-' + arch.id,
      _archetypeId: arch.id,
      _pcts: pcts
    };
  }

  CL.Registry.provideEngine({
    run: run,
    rebuild: function (rerun, pack) { return run(rerun.answers, pack); },
    rerunOf: function (result, answers) { return { answers: answers }; },
    /* 供视图/测试直接用 */
    score: score,
    pickArchetype: pickArchetype
  });
})();
