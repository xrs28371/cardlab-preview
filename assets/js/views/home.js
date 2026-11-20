/* =====================================================================
   视图 · 首页（工具矩阵）
   全部由 config/tools.json 渲染：live 可点、skeleton（配置就绪待
   闸门）可点进筹备页、soon/later 只展示。新增工具只改配置，本
   视图不改。
   ===================================================================== */
(function () {
  'use strict';
  var Config = CL.Config, $ = CL.$;

  function render() {
    CL.applyChrome();
    var s = Config.site, u = Config.ui();
    $('site-name').textContent = s.site.name;
    $('site-name-en').textContent = s.site.nameEn;
    $('site-slogan').textContent = s.site.slogan;
    $('site-trust').textContent = s.site.trustLine;
    var grid = $('tool-grid');
    grid.innerHTML = '';
    s.tools.forEach(function (t) {
      var b = document.createElement('button');
      b.type = 'button';
      var clickable = t.status === 'live' || t.status === 'skeleton';
      b.className = 'tool-card' +
        (t.status === 'live' ? ' live' + (t.no === '01' ? ' featured' : '') :
         t.status === 'skeleton' ? ' off skeleton' : ' off');
      var tag = t.status === 'live' ? (u.liveTag || Config.fb('立即测', 'Try it'))
        : t.status === 'skeleton' ? (u.skeletonTag || Config.fb('筹备中', 'In prep'))
        : (u.soonTag || Config.fb('即将上线', 'Coming soon'));
      b.innerHTML =
        '<span class="tool-no-badge">' + t.no + '</span>' +
        '<span class="tool-main"><span class="tool-name">' + CL.Utils.esc(t.name) + '</span>' +
        '<span class="tool-desc">' + CL.Utils.esc(t.desc) + '</span></span>' +
        '<span class="tool-tag' + (t.status === 'live' ? ' live' : '') + '">' + CL.Utils.esc(tag) + '</span>';
      if (clickable) {
        b.addEventListener('click', function () { CL.openTool(t); });
      }
      grid.appendChild(b);
    });
  }

  CL.Views = CL.Views || {};
  CL.Views.home = { render: render };
})();
