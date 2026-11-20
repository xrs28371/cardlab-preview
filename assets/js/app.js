/* =====================================================================
   CardLab 生产版 · app 装配层
   只做装配：路由（视图切换 + hash 深链）、全局文案刷新、假"分析中"
   遮罩、语言切换、启动。业务逻辑在各模块里：
     config.js 配置层 / referral.js 推荐人 / card.js 卡片渲染器 /
     engines/*.js 工具引擎（纯函数） / views/*.js 工具视图。
   新增工具的标准动作（本文件不改）：
     1. config/tools(.en).json 加一条（pack 指向新配置，template 同 id，
        engine 指向新引擎文件，view 指向要复用的视图壳名）；
     2. config/packs/ 加一份玩法配置（先过 schema 校验）；
     3. engines/ 加一个新文件（末尾调 CL.Registry.provideEngine 交出实现）；
     4. 复用已有视图壳时什么都不用加；需要新壳才加一个壳文件。
   视图容器 id 约定：view-home / view-card / view-tool-<壳名>，由 DOM
   直接推导成清单，不在代码里列工具或列壳。
   ===================================================================== */
(function () {
  'use strict';
  var Config = CL.Config, $ = CL.$;

  CL.state = { currentTool: null };

  /* ================= Router 路由层 ================= */
  /* 视图清单由 DOM 推导：id 约定 view-home / view-card /
     view-tool-<壳名>，不在代码里列工具或列壳。新增视图容器 = 在
     index.html 加一个 <main class="view">，本文件不改。 */
  var VIEW_IDS = {};
  document.querySelectorAll('main.view').forEach(function (el) {
    var name = el.id === 'view-home' ? 'home'
      : el.id === 'view-card' ? 'card'
      : el.id.replace('view-tool-', '');
    VIEW_IDS[name] = el.id;
  });
  var Router = {
    current: 'home',
    show: function (name) {
      Router.current = name;
      Object.keys(VIEW_IDS).forEach(function (k) {
        $(VIEW_IDS[k]).classList.toggle('hidden', k !== name);
      });
      window.scrollTo(0, 0);
    },
    setHash: function (h) { try { history.replaceState(null, '', h); } catch (e) { console.warn('app: 写 hash 失败：', e && e.message); } },
    isVisible: function (name) { return Router.current === name; }
  };
  CL.Router = Router;

  /* template → 视图壳：只查配置（tool.view）+ 注册表，未登记的 template
     退回单输入壳。 */
  CL.openTool = function (tool, opts) {
    opts = opts || {};
    CL.state.currentTool = tool;
    Router.setHash('#' + tool.id);
    var viewName = tool.view || 'single';
    var view = CL.Registry.viewShell(viewName);
    if (!view) { viewName = 'single'; view = CL.Registry.viewShell('single'); }
    if (opts.reset && view && view.reset) view.reset(tool);
    Router.show(viewName);
    if (view) view.mount(tool);
    var firstInput = $(VIEW_IDS[viewName]).querySelector('input');
    if (firstInput && viewName === 'single') firstInput.focus();
  };

  function goHome() {
    Router.setHash(window.location.pathname);
    Router.show('home');
  }

  /* ================= 全局文案（标题/页脚/收入块/卡片页按钮） ================= */
  CL.applyChrome = function () {
    var u = Config.ui();
    document.documentElement.lang = Config.lang() === 'en' ? 'en' : 'zh-CN';
    if (u.pageTitle) document.title = u.pageTitle;
    $('home-foot').textContent = u.homeFoot || '';
    $('btn-save').textContent = u.saveBtn || Config.fb('保存图片', 'Save image');
    $('btn-again').textContent = u.againBtn || '';
    $('lang-toggle').textContent = u.toggleLabel || 'EN';
    $('lang-toggle').setAttribute('aria-label',
      u.langToggleLabel || Config.fb('切换语言', 'Switch language'));
    var inc = Config.income();
    $('income-title').textContent = u.incomeTitle || '';
    $('income-text').textContent = u.incomeText || '';
    $('income-btn').textContent = u.incomeBtn || '';
    var blog = $('income-blog');
    blog.textContent = u.incomeBlog || '';
    if (inc && inc.blogUrl) blog.href = inc.blogUrl;
    document.querySelectorAll('[data-back]').forEach(function (b) {
      b.setAttribute('aria-label', u.backLabel || Config.fb('返回', 'Back'));
    });
    $('save-img').alt = u.cardAlt || Config.fb('结果卡片', 'Result card');
    $('btn-save-close').setAttribute('aria-label',
      u.saveCloseLabel || Config.fb('关闭', 'Close'));
    $('save-open').textContent = u.saveOpenImage ||
      Config.fb('打开大图保存', 'Open full image to save');
    /* 保存浮层的默认提示也跟语言走（首次导出前不许漏英文） */
    $('save-hint').textContent = u.saveHintMobile ||
      Config.fb('长按图片，保存到相册', 'Long-press the image to save it');
    CL.Referral.applyAll();
  };

  /* ================= 假"分析中"遮罩（文案与时长来自 pack） ================= */
  CL.Analysis = {
    /* 分析进行中标记：置位期间重复提交（连点、回车连发）直接忽略，
       避免多个数字动画叠跑（审稿 B3 口径的 isCalculating 守卫，收在
       分析入口一处，单输入与答题两条线同时生效）。 */
    isCalculating: false,
    run: function (pack, done) {
      if (CL.Analysis.isCalculating) return;
      var texts = (pack && pack.analysisTexts) || [];
      var ms = (pack && pack.analysisMs) || 0;
      if (!ms || !texts.length) { done(); return; }
      CL.Analysis.isCalculating = true;
      var overlay = $('analysis'), textEl = $('analysis-text'), bar = $('progress-bar');
      var idx = 0, t0 = Date.now();
      textEl.textContent = texts[0];
      bar.style.width = '0%';
      overlay.classList.remove('hidden');
      var timer = setInterval(function () {
        var elapsed = Date.now() - t0;
        bar.style.width = Math.min(elapsed / ms * 100, 100) + '%';
        var next = Math.min(Math.floor(elapsed / (ms / texts.length)), texts.length - 1);
        if (next !== idx) { idx = next; textEl.textContent = texts[idx]; }
        if (elapsed >= ms) {
          clearInterval(timer);
          CL.Analysis.isCalculating = false;
          overlay.classList.add('hidden');
          done();
        }
      }, 60);
    }
  };

  /* ================= 语言切换：整套配置重载，当前视图原地重渲染 ================= */
  function bindLangToggle() {
    $('lang-toggle').addEventListener('click', function () {
      Config.setLang(Config.lang() === 'zh' ? 'en' : 'zh');
      var onCard = Router.isVisible('card');
      var cardLast = onCard ? CL.Card.last : null;
      var currentToolId = CL.state.currentTool ? CL.state.currentTool.id : null;
      Config.load().then(function () {
        CL.Views.home.render();
        if (onCard && cardLast) {
          var t2 = Config.toolById(cardLast.tool.id);
          var pack2 = Config.packs[cardLast.tool.id];
          var engine2 = CL.Registry.engineFor(cardLast.tool);
          var r2 = (t2 && pack2 && engine2 && cardLast.rerun)
            ? engine2.rebuild(cardLast.rerun, pack2) : null;
          if (t2 && r2) {
            CL.state.currentTool = t2;
            CL.Card.show(t2, r2, pack2, cardLast.rerun);
            return;
          }
          Router.show('home');
        } else if (!Router.isVisible('home') && currentToolId) {
          var t3 = Config.toolById(currentToolId);
          if (t3) { CL.openTool(t3); } else { Router.show('home'); }
        } else {
          Router.show('home');
        }
      });
    });
  }

  /* ================= 启动 ================= */
  function routeFromHash() {
    if (!Config.site) return;
    var hash = window.location.hash.replace('#', '').replace('/', '') ||
      new URLSearchParams(window.location.search).get('tool');
    var target = null;
    Config.site.tools.forEach(function (t) {
      if ((t.status === 'live' || t.status === 'skeleton') && t.id === hash) target = t;
    });
    if (target) { CL.openTool(target); } else { Router.show('home'); }
  }

  document.querySelectorAll('[data-back]').forEach(function (b) {
    b.addEventListener('click', goHome);
  });
  $('btn-again').addEventListener('click', function () {
    var tool = CL.state.currentTool;
    if (!tool) { goHome(); return; }
    /* 通用重测：壳的 reset() 自己清状态（单输入壳清输入框），本文件
       不许按工具名分支。 */
    CL.openTool(tool, { reset: true });
  });
  window.addEventListener('resize', function () {
    if (Router.isVisible('card')) CL.Card.refit();
  });
  /* 移动端地址栏收起/展开只触发 visualViewport resize（window resize
     不一定跟随），卡片缩放须跟着重算，防地址栏动效期间卡片溢出/留白 */
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', function () {
      if (Router.isVisible('card')) CL.Card.refit();
    });
  }
  window.addEventListener('hashchange', routeFromHash);

  /* 启动：配置 → 按配置加载引擎/视图模块 → 各视图通用 init → 渲染首页。
     视图 init 不许按壳名逐个点名，遍历 CL.Views 通用调用。模块加载失败
     则启动停在首页并报控制台错误，不许带着缺失的工具静默跑。 */
  CL.Card.init();
  CL.Referral.load();
  CL.Referral.bindHome();
  bindLangToggle();
  Config.load().then(function () {
    return CL.Registry.loadToolModules(Config.site.tools);
  }).then(function () {
    Object.keys(CL.Views).forEach(function (k) {
      var v = CL.Views[k];
      if (v && v.init) v.init();
    });
    CL.Views.home.render();
    routeFromHash();
    CL.AppReady = true;
  }).catch(function (e) {
    console.error('app: 启动失败：', e && e.message);
    CL.Views.home.render();
    Router.show('home');
  });
})();
