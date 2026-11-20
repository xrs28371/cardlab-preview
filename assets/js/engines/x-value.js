/* =====================================================================
   引擎 · 工具① X 价值计算器（从演示版逐字移植，行为已验收）
   同名恒定：哈希种子保证同一用户名永远同一结果；对数分布＋幂次
   整形，三档大致各占三分之一。公式纯属虚构，参数全在 pack 配置里。
   输入 → 结果对象（契约见 card.js），不碰 DOM。
   ===================================================================== */
(function () {
  'use strict';
  var U = CL.Utils;

  function run(rawInput, pack) {
    var handle = String(rawInput == null ? '' : rawInput).replace(/[@\s]/g, '');
    if (!handle) return null;
    var rand = U.mulberry32(U.fnv1a(handle.toLowerCase()));
    var value = Math.floor(pack.min * Math.pow(pack.max / pack.min, Math.pow(rand(), pack.exponent)));
    var tiers = pack.tiers.slice().sort(function (a, b) { return b.min - a.min; });
    var tier = tiers[tiers.length - 1];
    for (var i = 0; i < tiers.length; i++) {
      if (value >= tiers[i].min) { tier = tiers[i]; break; }
    }
    var pool = pack.copies[tier.id];
    var copy = pool[Math.floor(rand() * pool.length)];
    var cardCfg = pack.card || {};
    return {
      headline: '@' + handle,
      label: cardCfg.label || '',
      bigText: pack.currency + U.commas(value),
      bigIsText: false,
      equivText: '≈ ' + U.commas(Math.round(value / (pack.coffeePrice || pack.milkTeaPrice || 18))) + ' ' + pack.equivUnit,
      badgeText: tier.label,
      extra: null,
      copy: copy,
      note: cardCfg.note || '',
      watermarkName: cardCfg.watermarkName || '',
      countUp: { target: value, prefix: pack.currency },
      fileSlug: 'x-value-' + handle,
      _handle: handle
    };
  }

  CL.Registry.provideEngine({
    run: run,
    /* 语言切换重跑：同名同结果，只是换一套文案配置 */
    rebuild: function (rerun, pack) { return run(rerun.handle, pack); },
    rerunOf: function (result) { return { handle: result._handle }; }
  });
})();
