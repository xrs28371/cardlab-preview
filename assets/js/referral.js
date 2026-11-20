/* =====================================================================
   CardLab 生产版 · Referral 推荐人机制（雇主定版行为，逐条保留）
     · 首页收入块与每个工具页都有推荐人入口（工具页为显眼高亮区块），
       全站共用同一份状态，任一处修改其他处立即同步；
     · 没有推荐人 → 主按钮走 income.url 普通链接；
     · 有推荐人 → 粘完整链接（含 ref=）原样使用整条链接（域名可能是
       .shop 等变体，不抽码重拼）；只填裸推荐码时才按 income.refBase +
       income.refPath + 推荐码拼：默认
       https://earnway.art/register.php?ref=<推荐码>；
       还没填出有效码时先回普通链接。输入框不预填任何示例真码；
     · 粘短链接：雇主域名（earnway.art / earnway.shop）的短链整条原样
       生效——短链本身就是雇主推荐体系的链接，不再要求带 ref= 参数
       （Tyagraj 2026-11-20 点名缺陷）；其他像链接却抽不到 ref 码的
       → 输入框旁亮可见提示（ui.refLinkHint），不许静默失效；
       像链接（含斜杠）却抽不到码的输入不许误当裸码拼接；
     · 佣金只用定性口径文案（ui.refNote），income.commissionNote
       保持为空——全站不出现任何佣金比例数字；
     · 生效时卡面显示推荐链接色带，二维码改编这条链接。
   M1 新增（演示版遗留项）：状态落 localStorage 持久化
   （键 cardlab.referral.v1），刷新/重进页面不丢；语言偏好不持久化，
   两者别混。隐私模式下读写静默失败，退化为页面内状态。
   ===================================================================== */
(function () {
  'use strict';
  var Config = CL.Config, U = CL.Utils, $ = U.$;
  var STORE_KEY = 'cardlab.referral.v1';

  var referral = { has: false, code: '' };
  var boxes = []; // mountBox 注册的工具页入口组件 {root, yes, no, fields, input}

  function load() {
    var saved = U.storeGet(STORE_KEY);
    if (saved && typeof saved === 'object') {
      referral.has = !!saved.has;
      referral.code = typeof saved.code === 'string' ? saved.code : '';
    }
  }
  function persist() {
    U.storeSet(STORE_KEY, { has: referral.has, code: referral.code });
  }

  function extractRefCode(raw) {
    var v = String(raw || '').trim();
    if (!v) return '';
    if (/^https?:\/\//i.test(v)) {
      try {
        var fromUrl = new URL(v).searchParams.get('ref');
        if (fromUrl) return fromUrl;
      } catch (e) { console.warn('referral: 推荐链接解析失败，改用正则抽 ref：', e && e.message); }
      var m = v.match(/[?&]ref=([^&#]+)/);
      if (m) { try { return decodeURIComponent(m[1]); } catch (e2) { console.warn('referral: ref 解码失败，用原值：', e2 && e2.message); return m[1]; } }
      return ''; /* 粘了链接但里面没有 ref 参数：不把整条链接当推荐码拼 */
    }
    /* 没带协议的链接（如 earnway.art/register.php?ref=XXX）：同样抽 ref 值 */
    if (v.indexOf('/') !== -1) {
      var m2 = v.match(/ref=([^&#\s]+)/);
      if (m2) { try { return decodeURIComponent(m2[1]); } catch (e3) { console.warn('referral: ref 解码失败，用原值：', e3 && e3.message); return m2[1]; } }
      return ''; /* 含斜杠却抽不到 ref：是链接不是裸码，不许把整串当码拼 */
    }
    return v.replace(/\s+/g, '');
  }

  /* 输入本身是含 ref= 的完整链接（http(s):// 开头）：原样使用整条
     链接（仅 trim），不抽码重拼——雇主的原始链接域名可能是 .shop 等
     变体，用默认 refBase 重拼会把域名改掉（雇主录屏实证）。只有裸码
     才走 refBase + refPath 拼接。多余参数不清洗，整条 URL 原样保留。 */
  function pastedFullUrl(raw) {
    var v = String(raw || '').trim();
    if (!/^https?:\/\//i.test(v)) return '';
    if (extractRefCode(v)) return v;
    return trustedHostUrl(v);
  }

  /* 雇主自有域名的短链接（如 https://earnway.art/xxxx，无 ref= 参数）：
     链接本身就指向雇主的推荐体系，整条原样生效。仅限 earnway.art /
     earnway.shop 两个雇主域名（www. 子域同样算雇主域名，2026-11-20
     Tyagraj 复核时指出 www. 未放行后补上）；第三方短链（bit.ly 等）
     跳转目标不可知，维持抽不到码就亮提示的旧口径。 */
  function trustedHostUrl(v) {
    try {
      var host = new URL(v).hostname.toLowerCase().replace(/^www\./, '');
      if (host === 'earnway.art' || host === 'earnway.shop') return v;
    } catch (e) { /* 解析不了就不当完整链接 */ }
    return '';
  }

  /* 输入看起来像链接（协议开头 / 含斜杠 / 含域名）但抽不到 ref 码：
     多半是短链接——跳转后推荐码被藏起来，本工具读不到，必须给出
     可见提示，不许静默失效。 */
  function looksLikeLink(raw) {
    var v = String(raw || '').trim();
    if (!v) return false;
    if (/^https?:\/\//i.test(v)) return true;
    if (v.indexOf('/') !== -1) return true;
    return /^[^\s]+\.[a-z]{2,}([/?#]|$)/i.test(v);
  }

  function incomeUrl() {
    var inc = Config.income();
    var plain = (inc && inc.url) || 'https://earnway.art';
    if (!referral.has) return plain;
    var pasted = pastedFullUrl(referral.code);
    if (pasted) return pasted; /* 完整链接原样用，不重拼域名 */
    var code = extractRefCode(referral.code);
    if (!code) return plain;
    var refBase = (inc && inc.refBase) || plain;
    var refPath = (inc && inc.refPath) || '/register.php?ref=';
    return refBase.replace(/\/$/, '') + refPath + encodeURIComponent(code);
  }
  /* 推荐人是否真正生效（选了有推荐人且填出有效码）：生效返回拼好的
     推荐链接全文，否则空串。卡片层据此决定色带与二维码内容。 */
  function activeRefUrl() {
    if (!referral.has) return '';
    if (!extractRefCode(referral.code) && !pastedFullUrl(referral.code)) return '';
    return incomeUrl();
  }

  function syncPair(yes, no, fields, input) {
    var u = Config.ui();
    yes.textContent = u.refYes || Config.fb('有推荐人', 'I have a referrer');
    no.textContent = u.refNo || Config.fb('没有推荐人', 'No referrer');
    yes.classList.toggle('active', referral.has);
    no.classList.toggle('active', !referral.has);
    yes.setAttribute('aria-pressed', referral.has ? 'true' : 'false');
    no.setAttribute('aria-pressed', referral.has ? 'false' : 'true');
    fields.classList.toggle('hidden', !referral.has);
    input.placeholder = u.refPlaceholder || '';
    if (input.value !== referral.code) input.value = referral.code;
    /* 短链接提示：像链接却抽不到码时亮出来，不许静默失效 */
    var hint = fields.querySelector('.ref-hint');
    if (hint) {
      var showHint = referral.has && looksLikeLink(referral.code) && !extractRefCode(referral.code) && !pastedFullUrl(referral.code);
      hint.textContent = u.refLinkHint ||
        Config.fb('粘贴的是短链接：跳转后推荐码被藏起来，本工具读不到。请粘贴原始推荐链接（…register.php?ref=推荐码），或直接粘贴 10 位推荐码。',
                  "That looks like a short link — the referral code is hidden after the redirect, so this tool can't read it. Paste the original referral link (…register.php?ref=CODE) or the 10-character referral code itself.");
      hint.classList.toggle('hidden', !showHint);
    }
  }
  function bindPair(yes, no, input) {
    yes.addEventListener('click', function () {
      referral.has = true; persist(); applyAll(); input.focus();
    });
    no.addEventListener('click', function () {
      referral.has = false; persist(); applyAll();
    });
    input.addEventListener('input', function () {
      referral.code = input.value; persist(); applyAll();
    });
  }

  /* 全站同步：首页收入块（静态 HTML）＋全部工具页组件＋主按钮链接 */
  function applyAll() {
    var u = Config.ui();
    var inc = Config.income();
    if ($('ref-yes')) {
      $('ref-label').textContent = u.refLabel || Config.fb('推荐人', 'Referrer');
      syncPair($('ref-yes'), $('ref-no'), $('ref-fields'), $('ref-input'));
      $('ref-note').textContent = u.refNote || '';
      var note = (inc && inc.commissionNote) || '';
      $('ref-commission').textContent = note;
      $('ref-commission').classList.toggle('hidden', !note);
      $('income-btn').href = incomeUrl();
    }
    /* 推荐人分组的无障碍标签跟语言走（不许写死英文） */
    document.querySelectorAll('.ref-toggle').forEach(function (g) {
      g.setAttribute('aria-label', u.refLabel || Config.fb('推荐人', 'Referrer'));
    });
    boxes.forEach(function (b) { syncPair(b.yes, b.no, b.fields, b.input); });
  }

  /* 工具页推荐人入口组件：显眼高亮区块，DOM 由本模块生成并绑定，
     新工具页只需放一个 <div class="ref-mount"></div> 挂载点。 */
  function mountBox(container) {
    if (!container || container.dataset.refMounted) return;
    container.dataset.refMounted = '1';
    container.innerHTML =
      '<section class="tool-ref">' +
        '<p class="tool-ref-title"></p>' +
        '<div class="ref-toggle" role="group">' +
          '<button type="button" class="ref-opt rb-yes" aria-pressed="false"></button>' +
          '<button type="button" class="ref-opt rb-no" aria-pressed="true"></button>' +
        '</div>' +
        '<div class="ref-fields hidden"><input type="text" maxlength="500" autocomplete="off"><p class="ref-hint hidden"></p></div>' +
      '</section>';
    var box = {
      root: container,
      title: container.querySelector('.tool-ref-title'),
      yes: container.querySelector('.rb-yes'),
      no: container.querySelector('.rb-no'),
      fields: container.querySelector('.ref-fields'),
      input: container.querySelector('input')
    };
    boxes.push(box);
    bindPair(box.yes, box.no, box.input);
    applyAll();
  }
  /* 语言切换后标题文案要跟着换：applyAll 里一并刷组件标题 */
  var applyAllBase = applyAll;
  applyAll = function () {
    applyAllBase();
    var u = Config.ui();
    boxes.forEach(function (b) {
      b.title.textContent = u.toolRefTitle ||
        Config.fb('有推荐人？填上推荐码，你生成的卡就会带上他的推荐链接',
                  'Have a referrer? Add their code — your card will carry their referral link');
    });
  };

  function bindHome() {
    if ($('ref-yes')) bindPair($('ref-yes'), $('ref-no'), $('ref-input'));
  }

  CL.Referral = {
    state: referral,
    load: load,
    extractRefCode: extractRefCode,
    incomeUrl: incomeUrl,
    activeUrl: activeRefUrl,
    applyAll: applyAll,
    mountBox: mountBox,
    bindHome: bindHome
  };
})();
