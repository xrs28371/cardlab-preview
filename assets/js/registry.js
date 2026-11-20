/* =====================================================================
   CardLab 生产版 · Registry 注册表 + 模块加载器
   引擎与视图由加载器按配置动态加载；app.js 只按注册表解析，不再有
   逐工具硬编码。新增工具的标准动作（零改动任何既有文件）：
     1. config/tools(.en).json 加一条：pack 指向新配置，template 同 id，
        engine 指向新引擎文件，view 指向要复用的视图壳名；
     2. config/packs/ 加一份玩法配置（先过 schema 校验）；
     3. engines/ 加一个新文件：纯逻辑（run / rebuild / rerunOf），
        末尾只调一次 CL.Registry.provideEngine({...}) 交出实现——
        文件里不写 template 名、不调注册，绑定由加载器按配置完成；
     4. 视图壳是通用 UI 容器（single / quiz / stance / soon），一个壳
        服务多个工具；壳文件只调一次 registerViewShell('<壳名>', 视图)，
        里面不含任何工具名。需要新壳才加壳文件 + 壳名到文件的命名约定
        （见 loadToolModules）。
   视图容器 id 约定见 app.js：view-home / view-card / view-tool-<壳名>，
   由 DOM 直接推导，不在代码里列清单。
   ===================================================================== */
(function () {
  'use strict';
  window.CL = window.CL || {};
  var engines = {};    // template -> { run, rebuild, rerunOf, ... }
  var viewShells = {}; // 壳名 -> 视图对象
  var loadedScripts = {}; // src -> Promise（同一脚本只加载一次）
  var engineBySrc = {}; // src -> 引擎实现（按模块 URL 记槽）
  var loadingSrc = null; // 当前正在加载的脚本 src；加载严格串行，同一时刻最多一个

  function loadScript(src) {
    if (loadedScripts[src]) return loadedScripts[src];
    var p = new Promise(function (resolve, reject) {
      /* 经典脚本在插入后、onload 前执行：provideEngine 在执行期被调，
         此时 loadingSrc 仍是本文件，交出的实现按 src 记槽，不会串位 */
      loadingSrc = src;
      var s = document.createElement('script');
      s.src = src;
      s.onload = function () { loadingSrc = null; resolve(src); };
      s.onerror = function () { loadingSrc = null; reject(new Error('加载失败：' + src)); };
      document.head.appendChild(s);
    });
    loadedScripts[src] = p;
    return p;
  }

  CL.Registry = {
    /* 引擎文件末尾调用：交出实现，不含 template 名；按当前正在加载
       的模块 URL 记槽——同一引擎文件被多个工具复用时，第二次加载
       直接走已完成 Promise、不再调 provideEngine，但槽里已有实现，
       各工具仍能拿到自己的引擎。不在模块加载期调用是装配错误，
       直接抛错，不许静默落到别的工具头上 */
    provideEngine: function (engine) {
      if (!loadingSrc) throw new Error('provideEngine 在模块加载之外调用，未关联到任何引擎文件');
      engineBySrc[loadingSrc] = engine;
    },
    /* 视图壳文件调用：按壳名登记一次，不含工具名 */
    registerViewShell: function (name, view) { viewShells[name] = view; },
    engine: function (template) { return engines[template] || null; },
    engineFor: function (tool) {
      if (!tool) return null;
      return engines[tool.template || tool.id] || null;
    },
    viewShell: function (name) { return viewShells[name] || null; },
    /* 按工具配置加载全部模块：引擎文件由 tool.engine 指定，视图壳文件
       按壳名约定 assets/js/views/tool-<壳名>.js。加载严格按工具顺序
       串行；引擎实现按模块 URL 记槽（engineBySrc），同一引擎文件
       被多个工具复用也不串位；加载完把该文件交出的引擎实现绑定到
       该工具的 template 上。任一文件加载失败即 reject，启动不许
       带着缺失的工具静默跑。 */
    loadToolModules: function (tools) {
      var chain = Promise.resolve();
      (tools || []).forEach(function (t) {
        if (t.status !== 'live' && t.status !== 'skeleton') return;
        if (t.engine) {
          chain = chain.then(function () {
            return loadScript(t.engine);
          }).then(function () {
            var key = t.template || t.id;
            var engine = engineBySrc[t.engine];
            if (!engine) {
              throw new Error('引擎文件未交出实现：' + t.engine + '（工具 ' + key + '）');
            }
            engines[key] = engine;
          });
        }
        if (t.view) {
          chain = chain.then(function () {
            return loadScript('assets/js/views/tool-' + t.view + '.js');
          });
        }
      });
      return chain;
    }
  };
  CL.Views = CL.Views || {};
})();
