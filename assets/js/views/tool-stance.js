/* =====================================================================
   视图 · 表态型工具页（工具③吃瓜表态）
   话题与选项全部来自 pack 配置（雇主按热点换配置即换话题）。
   未投票：点选项即投票并出卡。已投票（本机已存）：选项锁定、
   高亮自己那项，可直接再看卡片。是否允许改票待雇主确认（见
   README 待确认清单），M1 先按"一票锁定"实现。
   ===================================================================== */
(function () {
  'use strict';
  var Config = CL.Config, $ = CL.$;

  function mount(tool) {
    var u = Config.ui();
    $('stance-no').textContent = (u.toolNoTpl || Config.fb('工具 {no} · {batch}', 'Tool {no} · {batch}'))
      .replace('{no}', tool.no).replace('{batch}', tool.batch);
    $('stance-title').textContent = tool.name;
    $('stance-desc').textContent = tool.desc + (Config.lang() === 'en' ? '' : '。');
    $('stance-trust').textContent = tool.trustLine || '';
    $('stance-fineprint').textContent = tool.fineprint || '';
    CL.Referral.mountBox($('stance-ref-mount'));
    CL.Referral.applyAll();
    render(tool);
  }

  function render(tool) {
    var pack = Config.packs[tool.id];
    var engine = CL.Registry.engineFor(tool);
    var u = Config.ui();
    var box = $('stance-opts');
    box.innerHTML = '';
    if (!pack || !engine) {
      $('stance-q').textContent = u.formErrorNoPack || '';
      return;
    }
    $('stance-q').textContent = pack.topic.question;
    var mine = engine.myVote(pack);
    pack.topic.options.forEach(function (o) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'stance-opt' + (mine === o.id ? ' mine' : '');
      b.textContent = o.text;
      if (mine) {
        b.disabled = true;
      } else {
        b.addEventListener('click', function () {
          var r = engine.run(o.id, pack);
          if (r) CL.Card.show(tool, r, pack, {});
        });
      }
      box.appendChild(b);
    });
    var note = $('stance-note');
    var viewBtn = $('stance-view-card');
    if (mine) {
      var c = engine.counts(pack);
      var total = 0;
      Object.keys(c.map).forEach(function (k) { total += c.map[k]; });
      note.textContent = (u.stanceVotedTitle || Config.fb('你已经表过态了', 'You already picked a side')) +
        ' · ' + (u.stanceTotalVotes || '{total}').replace('{total}', CL.Utils.commas(total));
      note.classList.remove('hidden');
      viewBtn.textContent = u.stanceViewCard || Config.fb('看我的卡片', 'See my card');
      viewBtn.classList.remove('hidden');
      viewBtn.onclick = function () {
        var r = engine.buildResult(pack);
        if (r) CL.Card.show(tool, r, pack, {});
      };
    } else {
      note.classList.add('hidden');
      viewBtn.classList.add('hidden');
    }
  }

  CL.Views = CL.Views || {};
  CL.Views.stance = { mount: mount };
  CL.Registry.registerViewShell('stance', CL.Views.stance);
})();
