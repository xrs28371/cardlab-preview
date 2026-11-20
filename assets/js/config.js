/* =====================================================================
   CardLab 生产版 · Config 配置层
   站点/工具矩阵来自 config/tools.json（中）/ config/tools.en.json（英）；
   每个工具的玩法配置路径写在该工具自己的 "pack" 字段里，启动时按表
   动态加载、按工具 id 登记。新增工具 = 加一条工具配置 + 一份 pack，
   本层不改。拉取失败回退 fallbacks.js 的内置配置，页面永远能跑。
   配置文件的结构契约见 config/schema/*.json，改配置先跑
   tools/validate-config.mjs。
   语言：默认英文（雇主定版）；?lang=zh / ?lang=en 以 URL 为准；
   语言偏好不落 localStorage（v3 旧偏好顶掉默认英文的教训）。
   ===================================================================== */
(function () {
  'use strict';
  window.CL = window.CL || {};
  var U = CL.Utils;

  var LANG_FILES = { zh: 'config/tools.json', en: 'config/tools.en.json' };
  var lang = 'en';
  try {
    var qLang = new URLSearchParams(window.location.search).get('lang');
    if (qLang && LANG_FILES[qLang]) lang = qLang;
  } catch (e) { console.warn('config: 语言参数解析失败，用默认英文：', e && e.message); }

  function fetchJson(url) {
    return fetch(url).then(function (r) { if (!r.ok) throw new Error(url); return r.json(); });
  }
  function fallbackFor() { return lang === 'en' ? CL.FALLBACK_EN : CL.FALLBACK; }

  var Config = {
    site: null,
    packs: {},
    i18n: null,
    lang: function () { return lang; },
    setLang: function (l) { if (LANG_FILES[l]) lang = l; },
    ui: function () {
      return (Config.i18n && Config.i18n.ui && Config.i18n.ui[lang]) ||
        (CL.FALLBACK_I18N.ui && CL.FALLBACK_I18N.ui[lang]) || {};
    },
    income: function () {
      return (Config.i18n && Config.i18n.income) || CL.FALLBACK_I18N.income;
    },
    /* 按当前语言取兜底文案对，避免英文模式露出中文 */
    fb: function (zh, en) { return lang === 'en' ? en : zh; },
    loadI18n: function () {
      if (Config.i18n) return Promise.resolve(Config.i18n);
      return fetchJson('config/i18n.json').then(function (d) { Config.i18n = d; return d; })
        .catch(function (e) { console.warn('config: i18n.json 拉取失败，用内置兜底：', e && e.message); Config.i18n = CL.FALLBACK_I18N; return Config.i18n; });
    },
    load: function () {
      return Config.loadI18n().then(function () {
        return fetchJson(LANG_FILES[lang]).catch(function (e) {
          console.warn('config: 工具注册表拉取失败，用内置兜底：', e && e.message);
          return null;
        });
      }).then(function (site) {
        if (!site) {
          var fbk = fallbackFor();
          Config.site = fbk.site; Config.packs = fbk.packs;
          return Config;
        }
        Config.site = site;
        Config.packs = {};
        var jobs = site.tools.filter(function (t) { return t.pack; }).map(function (t) {
          return fetchJson(t.pack).then(function (pack) { Config.packs[t.id] = pack; })
            .catch(function (e) {
              console.warn('config: 玩法包拉取失败（' + t.id + '），用内置兜底：', e && e.message);
              var fbk2 = fallbackFor();
              if (fbk2.packs[t.id]) Config.packs[t.id] = fbk2.packs[t.id];
            });
        });
        return Promise.all(jobs).then(function () { return Config; });
      });
    },
    toolById: function (id) {
      if (!Config.site) return null;
      var found = null;
      Config.site.tools.forEach(function (t) { if (t.id === id) found = t; });
      return found;
    }
  };
  CL.Config = Config;
  CL.$ = U.$;
})();
