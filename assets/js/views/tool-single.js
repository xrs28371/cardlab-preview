/* =====================================================================
   视图 · 单输入型工具页（工具①估值器使用；表单壳与演示版一致）
   流程：输入 → 假分析（文案/时长来自 pack）→ 引擎出结果 → 卡片。
   工具页带推荐人显眼入口（组件挂载点 #single-ref-mount）。
   ===================================================================== */
(function () {
  'use strict';
  var Config = CL.Config, $ = CL.$;

  function mount(tool) {
    var u = Config.ui();
    $('single-no').textContent = (u.toolNoTpl || Config.fb('工具 {no} · {batch}', 'Tool {no} · {batch}'))
      .replace('{no}', tool.no).replace('{batch}', tool.batch);
    $('single-title').textContent = tool.name;
    $('single-desc').textContent = tool.desc + (Config.lang() === 'en' ? '' : '。');
    $('single-cta').textContent = tool.cta || u.defaultCta || Config.fb('开始', 'Start');
    $('single-trust').textContent = tool.trustLine || '';
    $('single-fineprint').textContent = tool.fineprint || '';
    $('handle-input').placeholder = tool.inputPlaceholder || '';
    $('form-error').classList.add('hidden');
    CL.Referral.mountBox($('single-ref-mount'));
    CL.Referral.applyAll();
  }

  /* 「再测一个」通用入口：清空本壳输入与报错，由 app.js 经 reset 调用，
     不许在 app.js 里按工具名分支清输入。 */
  function reset() {
    $('handle-input').value = '';
    $('form-error').classList.add('hidden');
  }

  function init() {
    $('value-form').addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
      var tool = CL.state.currentTool;
      if (!tool) return;
      var pack = Config.packs[tool.id];
      var engine = CL.Registry.engineFor(tool);
      if (!pack || !engine) {
        $('form-error').textContent = Config.ui().formErrorNoPack ||
          Config.fb('这个工具还在准备中，过几天再来', 'This tool is still in the works. Check back soon.');
        $('form-error').classList.remove('hidden');
        return;
      }
      var r = engine.run($('handle-input').value, pack);
      if (!r) {
        $('form-error').textContent = Config.ui().formErrorEmpty ||
          Config.fb('先填一个用户名，随便谁的都行', "Enter a username first — anyone's will do");
        $('form-error').classList.remove('hidden');
        return;
      }
      $('form-error').classList.add('hidden');
      CL.Analysis.run(pack, function () {
        CL.Card.show(tool, r, pack, engine.rerunOf(r));
      });
    });
  }

  CL.Views = CL.Views || {};
  CL.Views.single = { mount: mount, init: init, reset: reset };
  CL.Registry.registerViewShell('single', CL.Views.single);
})();
