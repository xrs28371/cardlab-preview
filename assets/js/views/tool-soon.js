/* =====================================================================
   视图 · 筹备中工具页（工具⑥真人假装 AI 的配置骨架页）
   规格硬闸门：⑥涉及真人 UGC，必须先落实关键词过滤＋举报按钮＋
   封禁警告（pack.moderation 三项 configured）才许开放。本页只
   展示"为什么还没开 + 配置里已备好的玩法参数"，不提供任何
   输入与提交入口。审核方案经雇主确认后，再按 pack 实现正式
   玩法视图，本页即退役。
   ===================================================================== */
(function () {
  'use strict';
  var Config = CL.Config, $ = CL.$, U = CL.Utils;

  function gateText(v) {
    return v === 'configured'
      ? Config.fb('已就绪', 'Ready')
      : Config.fb('待落实（上线闸门）', 'Pending — launch gate');
  }

  function mount(tool) {
    var u = Config.ui();
    $('soon-no').textContent = (u.toolNoTpl || Config.fb('工具 {no} · {batch}', 'Tool {no} · {batch}'))
      .replace('{no}', tool.no).replace('{batch}', tool.batch);
    $('soon-title').textContent = tool.name;
    $('soon-desc').textContent = tool.desc + (Config.lang() === 'en' ? '' : '。');
    $('soon-trust').textContent = tool.trustLine || '';
    $('soon-fineprint').textContent = tool.fineprint || '';
    $('soon-notice').textContent = u.skeletonNotice || '';
    $('soon-plan-title').textContent = u.skeletonPlanTitle || '';
    var pack = Config.packs[tool.id];
    var list = $('soon-list');
    list.innerHTML = '';
    if (!pack) return;
    var rows = [
      [Config.fb('每轮答题倒计时', 'Countdown per answer'), pack.countdownSec + Config.fb(' 秒', 's')],
      [Config.fb('问题长度上限', 'Question max length'), String(pack.questionMaxLen)],
      [Config.fb('回答长度上限', 'Answer max length'), String(pack.answerMaxLen)],
      [Config.fb('关键词过滤', 'Keyword filter'), gateText(pack.moderation.keywordFilter)],
      [Config.fb('举报按钮', 'Report button'), gateText(pack.moderation.reportButton)],
      [Config.fb('封禁警告', 'Ban warning'), gateText(pack.moderation.banWarning)]
    ];
    rows.forEach(function (r) {
      var li = document.createElement('li');
      var a = document.createElement('span'); a.textContent = r[0];
      var b = document.createElement('span'); b.textContent = r[1];
      li.appendChild(a); li.appendChild(b);
      list.appendChild(li);
    });
  }

  CL.Views = CL.Views || {};
  CL.Views.soon = { mount: mount };
  CL.Registry.registerViewShell('soon', CL.Views.soon);
})();
