/* =====================================================================
   视图 · 问答型工具页（工具②职业测试）
   一题一屏、二选一按钮；答完走假分析 → 引擎评分 → 卡片。
   会话状态留在模块内：切语言原地重渲染不丢进度；从卡片页
   「再测一个」回来时经 reset() 重新开始。
   ===================================================================== */
(function () {
  'use strict';
  var Config = CL.Config, $ = CL.$;

  var session = { toolId: null, step: 0, answers: [] };

  function reset(tool) {
    session = { toolId: tool ? tool.id : null, step: 0, answers: [] };
  }

  function mount(tool) {
    var u = Config.ui();
    if (session.toolId !== tool.id) reset(tool);
    $('quiz-no').textContent = (u.toolNoTpl || Config.fb('工具 {no} · {batch}', 'Tool {no} · {batch}'))
      .replace('{no}', tool.no).replace('{batch}', tool.batch);
    $('quiz-title').textContent = tool.name;
    $('quiz-desc').textContent = tool.desc + (Config.lang() === 'en' ? '' : '。');
    $('quiz-trust').textContent = tool.trustLine || '';
    $('quiz-fineprint').textContent = tool.fineprint || '';
    CL.Referral.mountBox($('quiz-ref-mount'));
    CL.Referral.applyAll();
    renderStep(tool);
  }

  function renderStep(tool) {
    var pack = Config.packs[tool.id];
    var u = Config.ui();
    if (!pack) {
      $('quiz-progress').textContent = u.formErrorNoPack || '';
      $('quiz-q').textContent = '';
      $('quiz-opts').classList.add('hidden');
      return;
    }
    $('quiz-opts').classList.remove('hidden');
    var q = pack.questions[session.step];
    $('quiz-progress').textContent = (u.quizProgress || Config.fb('第 {n} / {total} 题', 'Question {n} of {total}'))
      .replace('{n}', String(session.step + 1)).replace('{total}', String(pack.questions.length));
    $('quiz-bar-fill').style.width = (session.step / pack.questions.length * 100) + '%';
    $('quiz-q').textContent = q.text;
    q.options.forEach(function (opt, i) {
      var btn = $('quiz-opt-' + i);
      btn.textContent = opt.text;
      btn.dataset.optionId = opt.id;
    });
  }

  function pick(tool, optionId) {
    var pack = Config.packs[tool.id];
    if (!pack) return;
    session.answers[session.step] = optionId;
    session.step++;
    if (session.step < pack.questions.length) { renderStep(tool); return; }
    var answers = session.answers.slice();
    CL.Analysis.run(pack, function () {
      var engine = CL.Registry.engineFor(tool);
      var r = engine.run(answers, pack);
      if (r) CL.Card.show(tool, r, pack, { answers: answers });
      reset(tool);
    });
  }

  function init() {
    [0, 1].forEach(function (i) {
      $('quiz-opt-' + i).addEventListener('click', function () {
        var tool = CL.state.currentTool;
        if (tool) pick(tool, $('quiz-opt-' + i).dataset.optionId);
      });
    });
  }

  CL.Views = CL.Views || {};
  CL.Views.quiz = { mount: mount, init: init, reset: reset };
  CL.Registry.registerViewShell('quiz', CL.Views.quiz);
})();
