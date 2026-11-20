/* =====================================================================
   引擎 · 工具③ 吃瓜表态器
   机制（规格）：点一个选项 = 投一票 → 卡片大字是自己的选择，
   附全选项票数条 + 多数派/少数派文案（自己选项得票最高 = 多数派，
   并列最高也算多数派）。
   票数口径（M1，前端版）：pack.topic.options[].baseVotes 是配置
   里的基础票数（雇主按热点改配置即换话题）；本机这一票落
   localStorage（键 cardlab.stance.v1.<topicId>），同设备同话题
   只计一票。跨用户实时总票数要等后端 KV 计数接口（规格第 4 阶段
   的 Worker 接口），前端结构已按"基础票数 + 本机票"分离，后端
   接入时只需把 baseVotes 换成接口返回值，本引擎不动。
   不存任何个人信息，只存投了哪个选项 id。
   ===================================================================== */
(function () {
  'use strict';
  var U = CL.Utils;

  function storeKey(pack) { return 'cardlab.stance.v1.' + pack.topic.id; }
  function myVote(pack) {
    var saved = U.storeGet(storeKey(pack));
    return saved && typeof saved.optionId === 'string' ? saved.optionId : null;
  }
  function castVote(pack, optionId) {
    U.storeSet(storeKey(pack), { optionId: optionId });
    return optionId;
  }
  function counts(pack) {
    var mine = myVote(pack);
    var map = {};
    pack.topic.options.forEach(function (o) {
      map[o.id] = o.baseVotes + (mine === o.id ? 1 : 0);
    });
    return { map: map, mine: mine };
  }

  function buildResult(pack) {
    var c = counts(pack);
    if (!c.mine) return null;
    var total = 0, top = -1;
    pack.topic.options.forEach(function (o) {
      total += c.map[o.id];
      if (c.map[o.id] > top) top = c.map[o.id];
    });
    var myOption = null;
    pack.topic.options.forEach(function (o) { if (o.id === c.mine) myOption = o; });
    if (!myOption) return null;
    var isMajority = c.map[c.mine] >= top;
    var pool = isMajority ? pack.copies.majority : pack.copies.minority;
    var pick = pool[U.fnv1a(pack.topic.id + ':' + c.mine) % pool.length];
    var cardCfg = pack.card || {};
    return {
      headline: pack.topic.question,
      label: cardCfg.label || '',
      bigText: myOption.text,
      bigIsText: true,
      equivText: null,
      badgeText: isMajority ? pack.majorityLabel : pack.minorityLabel,
      extra: {
        kind: 'bars',
        items: pack.topic.options.map(function (o) {
          return {
            label: o.text,
            pct: total > 0 ? Math.round(c.map[o.id] / total * 100) : 0,
            numText: U.commas(c.map[o.id]) + ' · ' + (total > 0 ? Math.round(c.map[o.id] / total * 100) : 0) + '%',
            mine: o.id === c.mine
          };
        })
      },
      copy: pick,
      note: cardCfg.note || '',
      watermarkName: cardCfg.watermarkName || '',
      countUp: null,
      fileSlug: 'stance-' + pack.topic.id + '-' + c.mine,
      _total: total,
      _isMajority: isMajority
    };
  }

  CL.Registry.provideEngine({
    myVote: myVote,
    castVote: castVote,
    counts: counts,
    /* run = 投票并出结果；rebuild = 不重复投票、按已存票重出结果 */
    run: function (optionId, pack) { castVote(pack, optionId); return buildResult(pack); },
    rebuild: function (rerun, pack) { return buildResult(pack); },
    rerunOf: function () { return {}; },
    buildResult: buildResult
  });
})();
