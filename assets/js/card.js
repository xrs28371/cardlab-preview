/* =====================================================================
   CardLab 生产版 · Card 卡片渲染器（独立模块）
   职责只有一件：把引擎产出的结果数据对象渲染成 9:16 卡片，并负责
   导出 1080×1920 PNG。渲染器不认识任何具体工具——工具差异全部在
   结果对象里（大字/徽章/扩展区/文案），新增工具不许改本文件。

   结果对象契约（引擎产出，见 engines/*.js）：
     {
       headline:  string,        // 大字上方一行（如 @username），'' 隐藏
       label:     string,        // 大字上方的标签（如 ESTIMATED WORTH）
       bigText:   string,        // 卡片主角：大数字或大标签
       bigIsText: boolean,       // true = 文字型大字（原型名/表态选项）
       equivText: string|null,   // 大字下方胶囊（如 ≈ 21,740 cups of coffee）
       badgeText: string|null,   // 渐变徽章（如档位名/多数派标签）
       extra:     null | {kind:'traits', items:[{label, pct}]}
                        | {kind:'bars',   items:[{label, pct, numText, mine}]}
                        | {kind:'illustration', svg:string}, // 引擎内本地绘制的 SVG
       copy:      string,        // 一句替用户说话的文案
       note:      string,        // 卡脚注（免责/娱乐口径，来自 pack.card.note）
       watermarkName: string,
       countUp:   null | {target:number, prefix:string},  // 数字滚动（仅数字型）
       fileSlug:  string         // 导出文件名主体
     }
   推荐人色带与二维码规则（雇主定版）：Referral.activeUrl() 非空时
   显示色带（链接全文）且二维码改编该链接；否则整行隐藏、二维码编
   本站工具深链，卡面与无推荐人时完全一致。
   ===================================================================== */
(function () {
  'use strict';
  var Config = CL.Config, U = CL.Utils, $ = U.$;

  var last = null; // {tool, result, pack, rerun}
  var lastQrText = '';

  /* 轻震反馈：无用户激活时浏览器会拦并刷控制台报错，先查激活状态 */
  function vibrate() {
    if (!navigator.vibrate) return;
    try {
      if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
      navigator.vibrate(15);
    } catch (e) { console.warn('card: vibrate 失败：', e && e.message); }
  }

  function deepLink(tool, snapshot) {
    var state = snapshot || last;
    return (state && state.tool.id === tool.id && state.result.deepLink) ||
      window.location.origin + window.location.pathname + '#' + tool.id;
  }
  /* 二维码生成：使用 L 级以减少长链接的模块密度。返回值 { ok, fallback }。
     有推荐人时主文本编不出来不许静默退回深链——那会导出错误载荷，
     调用方必须亮出可见报错并拦截导出；无推荐人时深链本就是正确载荷，
     退回深链不受影响。 */
  /* 二维码库生成的 img 默认没有 alt：生成后给容器挂 role/aria-label、
     给 img 补 alt，读屏器才知道这块是什么（审稿无障碍项）。 */
  function labelQR(el) {
    var label = Config.fb('二维码，扫码打开链接', 'QR code — scan to open the link');
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', label);
    var img = el.querySelector('img');
    if (img) img.alt = label;
  }

  function makeQR(el, text, fallbackText) {
    /* global QRCode */
    lastQrText = text;
    // Keep the 92px CSS box; supersample its bitmap for the 184px export.
    var levels = [QRCode.CorrectLevel.L];
    for (var i = 0; i < levels.length; i++) {
      try {
        el.innerHTML = '';
        new QRCode(el, { text: text, width: 736, height: 736, colorDark: '#203B29', colorLight: '#ffffff', correctLevel: levels[i] });
        labelQR(el);
        return { ok: true, fallback: false };
      } catch (e) {
        console.warn('card: 二维码生成失败（纠错级 L）：', e && e.message);
      }
    }
    if (fallbackText && fallbackText !== text) {
      /* 有推荐人：拒绝用深链顶替推荐链接，交给调用方报错 */
      return { ok: false, fallback: false };
    }
    try {
      el.innerHTML = '';
      new QRCode(el, { text: fallbackText, width: 736, height: 736, colorDark: '#203B29', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.M });
      labelQR(el);
      lastQrText = fallbackText;
      return { ok: true, fallback: true };
    } catch (e2) {
      console.warn('card: 二维码兜底生成失败：', e2 && e2.message);
      return { ok: false, fallback: false };
    }
  }

  /* 底部安全区高度（刘海/小横条）：用临时探针读 env(safe-area-inset-bottom)
     的实际像素，无安全区设备/桌面端为 0。fitCard 只在显示与 resize 时
     调用，探针开销可忽略。 */
  function safeInsetBottom() {
    var probe = document.createElement('div');
    probe.style.cssText = 'position:fixed;left:0;bottom:0;width:1px;height:0;padding-bottom:env(safe-area-inset-bottom,0px);visibility:hidden;pointer-events:none';
    document.body.appendChild(probe);
    var h = probe.getBoundingClientRect().height;
    probe.remove();
    return h || 0;
  }
  /* 顶部安全区高度（刘海）：与 safeInsetBottom() 同款临时探针。
     只在窄屏计入 fitCard 预算（见下），宽屏不扣。 */
  function safeInsetTop() {
    var probe = document.createElement('div');
    probe.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:0;padding-top:env(safe-area-inset-top,0px);visibility:hidden;pointer-events:none';
    document.body.appendChild(probe);
    var h = probe.getBoundingClientRect().height;
    probe.remove();
    return h || 0;
  }
  /* 卡片视图能滚动时（极短视口触及 0.2 最小缩放），滚动后 fixed 的
     语言胶囊会重新压住卡片顶部：滚出顶部就把药丸淡出（.pill-hidden，
     见 base.css），回到顶部恢复。只在卡片视图可见时生效。 */
  function syncPill() {
    var pill = document.getElementById('lang-toggle');
    if (!pill) return;
    var onCard = false;
    try { onCard = !!(CL.Router && CL.Router.isVisible('card')); } catch (_) {}
    pill.classList.toggle('pill-hidden', onCard && window.scrollY > 4);
  }

  function fitCard() {
    var wrap = document.querySelector('.card-scale-wrap');
    if (!wrap) return;
    var scaleW = Math.min(wrap.parentElement.clientWidth - 40, 430) / 540;
    /* 高度约束：卡片＋保存按钮＋再测链接必须同屏，移动端不滚动找按钮。
       视口高度优先取 visualViewport：移动端地址栏收起/展开时 innerHeight
       会跳变，visualViewport 才连续准确；再扣底部安全区。预算 196 =
       卡片视图顶部留白 28＋底部留白 44＋保存按钮与再测链接约 124；
       只在窄屏（max-width:560px，与 card.css 的断点一致）再加 32px
       顶部留白（躲语言胶囊，见 card.css）与顶部安全区 inset，宽屏
       卡片恢复修前尺寸。已知限制：0.2 是最小缩放，极短视口下内容仍
       可能超高滚动（不保证同屏），滚动时药丸由 syncPill 藏起。 */
    var vv = window.visualViewport;
    var viewH = vv ? vv.height : window.innerHeight;
    var narrow = window.matchMedia ? window.matchMedia('(max-width:560px)').matches : window.innerWidth <= 560;
    var budget = 196 + (narrow ? 32 + safeInsetTop() : 0);
    var scaleH = (viewH - budget - safeInsetBottom()) / 960;
    var scale = Math.max(Math.min(scaleW, scaleH), 0.2);
    wrap.style.width = (540 * scale) + 'px';
    wrap.style.height = (960 * scale) + 'px';
    $('card').style.transform = 'scale(' + scale + ')';
    syncPill();
  }
  function fitBig() {
    var el = $('card-big');
    var isText = el.classList.contains('card-big-text');
    var size = isText ? 92 : 160;
    var min = isText ? 38 : 46;
    el.style.fontSize = size + 'px';
    var guard = 0;
    while (el.scrollWidth > 452 && size > min && guard++ < 40) {
      size -= isText ? 4 : 6;
      el.style.fontSize = size + 'px';
    }
    /* 文字型大字可能换行：再按高度收一档，防把扩展区挤出卡外 */
    if (isText) {
      guard = 0;
      while (el.scrollHeight > 320 && size > min && guard++ < 40) {
        size -= 4;
        el.style.fontSize = size + 'px';
      }
    }
  }
  function countUp(el, target, prefix) {
    var start = null, dur = 750;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + U.commas(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function renderExtra(extra) {
    var box = $('card-extra');
    box.innerHTML = '';
    if (!extra) { box.classList.add('hidden'); return; }
    box.classList.remove('hidden');
    if (extra.kind === 'illustration') {
      // SVG stays in an image document; user text is rendered separately with textContent.
      var image = document.createElement('img');
      image.className = 'card-illustration'; image.alt = '';
      image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(extra.svg);
      box.appendChild(image);
    } else if (extra.kind === 'traits') {
      extra.items.forEach(function (it) {
        var row = document.createElement('div');
        row.className = 'trait-row';
        var label = document.createElement('span');
        label.className = 'trait-label'; label.textContent = it.label;
        var track = document.createElement('div');
        track.className = 'trait-track';
        var fill = document.createElement('div');
        fill.className = 'trait-fill';
        fill.style.width = Math.max(0, Math.min(100, it.pct)) + '%';
        track.appendChild(fill);
        var val = document.createElement('span');
        val.className = 'trait-val'; val.textContent = it.pct;
        row.appendChild(label); row.appendChild(track); row.appendChild(val);
        box.appendChild(row);
      });
    } else if (extra.kind === 'bars') {
      extra.items.forEach(function (it) {
        var row = document.createElement('div');
        row.className = 'bar-row' + (it.mine ? ' mine' : '');
        var head = document.createElement('div');
        head.className = 'bar-head';
        var name = document.createElement('span');
        name.className = 'bar-name';
        name.textContent = it.label;
        if (it.mine) {
          var tag = document.createElement('span');
          tag.className = 'mine-tag';
          tag.textContent = Config.ui().stanceMineTag || Config.fb('你', 'You');
          name.appendChild(tag);
        }
        var num = document.createElement('span');
        num.className = 'bar-num'; num.textContent = it.numText;
        head.appendChild(name); head.appendChild(num);
        var track = document.createElement('div');
        track.className = 'bar-track';
        var fill = document.createElement('div');
        fill.className = 'bar-fill';
        fill.style.width = Math.max(0, Math.min(100, it.pct)) + '%';
        track.appendChild(fill);
        row.appendChild(head); row.appendChild(track);
        box.appendChild(row);
      });
    }
  }

  /* 渲染一张卡：tool = 工具配置，result = 结果对象，pack = 玩法配置，
     rerun = 语言切换时重跑引擎所需的数据（引擎自带 rebuild 时用） */
  function show(tool, result, pack, rerun) {
    last = { tool: tool, result: result, pack: pack, rerun: rerun || null };
    var u = Config.ui();
    $('card').classList.toggle('card-compact', result.layout === 'compact');
    $('card-tool-name').textContent = tool.name;
    $('card-brand').textContent = '▣ ' + Config.site.site.name;
    var headline = $('card-headline');
    headline.textContent = result.headline || '';
    headline.classList.toggle('hidden', !result.headline);
    /* 超长标题自动降字号（与演示版同一规则） */
    var hl = result.headline || '';
    headline.style.fontSize = hl.length > 24 ? '22px' : (hl.length > 16 ? '26px' : '');
    $('card-label').textContent = result.label || '';
    var big = $('card-big');
    big.classList.toggle('card-big-text', !!result.bigIsText);
    big.textContent = result.bigText;
    var equiv = $('card-equiv');
    equiv.textContent = result.equivText || '';
    equiv.parentElement.classList.toggle('hidden', !result.equivText);
    var badge = $('card-badge');
    badge.textContent = result.badgeText || '';
    badge.parentElement.classList.toggle('hidden', !result.badgeText);
    renderExtra(result.extra || null);
    $('card').classList.toggle('has-extra', !!result.extra);
    $('card-copy').textContent = result.copy || '';
    $('card-wm-name').textContent = result.watermarkName || '';
    $('card-wm-note').textContent = result.note || '';
    var base = window.location.origin + window.location.pathname;
    $('card-link').textContent = base.replace(/^https?:\/\//, '').replace(/\/$/, '');
    /* 推荐人色带：生效才显示；链接全文逐字显示（色带文本必须与粘贴
       原文逐字一致），超长时只降字号、CSS 换行（.card-ref-url 已有
       word-break:break-all），不许截断、不许省略号；链接本体不受
       影响——主按钮与二维码编的仍是完整链接 */
    var refUrl = CL.Referral.activeUrl();
    $('card-ref-label').textContent = u.cardRefLabel || Config.fb('通过我的链接加入：', 'Join via my link:');
    var refUrlEl = $('card-ref-url');
    var rl = refUrl.length;
    refUrlEl.textContent = refUrl;
    refUrlEl.style.fontSize = rl > 400 ? '9px' : (rl > 200 ? '11px' : (rl > 120 ? '13px' : (rl > 64 ? '15.5px' : '')));
    refUrlEl.style.lineHeight = rl > 64 ? '1.3' : '';
    $('card-ref').classList.toggle('hidden', !refUrl);
    $('card').classList.toggle('has-ref', !!refUrl);
    /* 有推荐人且二维码编不出来：卡面亮可见报错，导出随后会被拦截 */
    var qr = makeQR($('card-qr'), refUrl || deepLink(tool), deepLink(tool));
    last.qrFailed = !qr.ok;
    var qrErr = $('card-qr-error');
    if (last.qrFailed) {
      qrErr.textContent = u.qrError ||
        Config.fb('推荐链接过长，二维码生成失败，请缩短推荐码后重试',
                  'Referral link too long — QR code failed. Shorten the referral code and try again.');
      qrErr.classList.remove('hidden');
    } else {
      qrErr.classList.add('hidden');
    }

    CL.Router.show('card');
    /* 先按终值定字号，再归零启动滚动（防首帧闪出终值剧透） */
    fitCard();
    fitBig();
    if (result.countUp) {
      big.textContent = result.countUp.prefix + '0';
      countUp(big, result.countUp.target, result.countUp.prefix);
    }
    vibrate();
  }

  /* ================= 导出层：离屏克隆 → 1080×1920 PNG ================= */
  function isMobile() {
    if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return true;
    if (/iphone|ipad|ipod|android/i.test(navigator.userAgent)) return true;
    return /Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1; // iPadOS 桌面 UA
  }
  /* 导出文件名消毒：fileSlug 含用户输入（工具①的 handle），路径分隔符、
     通配符、控制字符（C0/C1）、双向覆盖字符一律换成连字符（不是删掉，
     免得 "a\u0000b" 粘成 "ab"），连续连字符折叠、首尾点/连字符去掉；
     按码点截断到 80（不拆 emoji）；截断后可能又露出尾部圆点，再去
     一次；全非法字符的名字与 Windows 保留名（CON、NUL 等）退回工具 id。 */
  function safeFileName(slug, fallback) {
    var out = [];
    Array.from(String(slug || '')).forEach(function (ch) {
      var code = ch.codePointAt(0);
      if (code <= 0x1F || (code >= 0x7F && code <= 0x9F) || (code >= 0x202A && code <= 0x202E) || (code >= 0x2066 && code <= 0x2069) || code === 0xFEFF || /[\\/:*?"<>|]/.test(ch) || /\s/.test(ch)) out.push('-');
      else out.push(ch);
    });
    var name = out.join('').replace(/-+/g, '-').replace(/^-+/, '').replace(/-+$/, '').replace(/^[.\s]+/, '').replace(/[.\s]+$/, '');
    name = Array.from(name).slice(0, 80).join('').replace(/[.]+$/, '').replace(/-+$/, '');
    if (!name || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(name)) return fallback + '.png';
    return name + '.png';
  }
  /* 保存浮层（dialog）：打开时把焦点移进浮层并给背景加 inert，关闭
     （按钮或 Esc）后把焦点还回去，读屏/键盘用户不丢位置。
     返回焦点在导出点击时同步记下（不要放在 toBlob 回调里异步记：
     那时焦点可能已跑到别处，iOS 上点按钮本就不聚焦，常记到
     <body>）。浮层已打开时不重记（防把关闭按钮存成返回目标）。
     上一个 blob URL 在新导出时回收（预览图与打开链接已换成新地址，
     旧地址不再被引用）；页面卸载时也回收。 */
  var overlayReturnFocus = null;
  var lastBlobUrl = null;
  function openSaveOverlay() {
    var overlay = $('save-overlay');
    overlay.classList.remove('hidden');
    /* 背景 inert：键盘焦点进不了浮层后面的内容（不支持 inert 的旧
       浏览器仍有下面的 Tab 陷阱兜底）。 */
    Array.prototype.forEach.call(document.body.children, function (child) {
      if (child !== overlay && child.tagName !== 'SCRIPT') child.inert = true;
    });
    $('btn-save-close').focus();
  }
  function closeSaveOverlay() {
    $('save-overlay').classList.add('hidden');
    Array.prototype.forEach.call(document.body.children, function (child) {
      if (child.id !== 'save-overlay' && child.tagName !== 'SCRIPT') child.inert = false;
    });
    /* 返回焦点：只在元素仍在页面上、不是 <body>、不是关闭按钮本身、
       未被禁用且能聚焦时才还原，否则回退到 btn-save。 */
    var target = overlayReturnFocus;
    if (!target || !target.isConnected || target === document.body || target === $('btn-save-close') || target.disabled || typeof target.focus !== 'function') target = $('btn-save');
    target.focus();
    overlayReturnFocus = null;
  }
  function exportPNG() {
    if (!last) return;
    /* 返回焦点在点击时同步记下（浮层已打开时不重记，见上）。 */
    if ($('save-overlay').classList.contains('hidden')) overlayReturnFocus = document.activeElement;
    var snapshot = { tool: last.tool, result: Object.assign({}, last.result), qrFailed: last.qrFailed };
    var btn = $('btn-save');
    if (snapshot.qrFailed) {
      /* 推荐链接二维码失败时拒绝导出：不许把错误载荷的卡发出去 */
      console.warn('card: 导出已拦截——推荐链接二维码生成失败，拒绝导出错误载荷');
      btn.textContent = Config.ui().saveFailed || Config.fb('生成失败，再点一次', 'Failed — tap to retry');
      return;
    }
    if (btn.dataset.busy) return; /* 生成中连点不重复导出 */
    btn.dataset.busy = '1';
    btn.textContent = Config.ui().saveGenerating || Config.fb('正在生成…', 'Generating…');
    var holder = document.createElement('div');
    holder.style.cssText = 'position:fixed;left:-9999px;top:0;width:540px;height:960px;overflow:hidden';
    var clone = $('card').cloneNode(true);
    clone.removeAttribute('id');
    clone.style.transform = 'none';
    clone.classList.toggle('card-compact', snapshot.result.layout === 'compact');
    clone.classList.add('export-flat'); /* 去噪点压 PNG 体积，见 card.css */
    /* 克隆里重绘二维码：cloneNode 不复制 canvas 位图，空白二维码是最常见的导出坑 */
    var cloneQr = clone.querySelector('.card-qr');
    if (cloneQr) makeQR(cloneQr, CL.Referral.activeUrl() || deepLink(snapshot.tool, snapshot), deepLink(snapshot.tool, snapshot));
    /* 克隆里写终值并同步已算好的终值字号，避免导出到滚动动画中间帧或字号溢出 */
    var cloneBig = clone.querySelector('.card-big');
    if (cloneBig) {
      cloneBig.textContent = snapshot.result.bigText;
      cloneBig.style.fontSize = $('card-big').style.fontSize;
    }
    holder.appendChild(clone);
    document.body.appendChild(holder);
    /* global html2canvas */
    html2canvas(clone, { scale: 2, backgroundColor: '#F8FAF6', logging: false }).then(function (canvas) {
      holder.remove();
      btn.textContent = Config.ui().saveBtn || Config.fb('保存图片', 'Save image');
      canvas.toBlob(function (blob) {
        delete btn.dataset.busy;
        if (!blob) { btn.textContent = Config.ui().saveFailed || Config.fb('生成失败，再点一次', 'Failed — tap to retry'); return; }
        var url = URL.createObjectURL(blob);
        /* 上一个 blob URL 在新导出时回收（见上）。 */
        if (lastBlobUrl && lastBlobUrl !== url) URL.revokeObjectURL(lastBlobUrl);
        lastBlobUrl = url;
        if (!isMobile()) {
          var a = document.createElement('a');
          a.href = url;
          a.download = safeFileName(snapshot.result.fileSlug, snapshot.tool.id);
          document.body.appendChild(a);
          a.click();
          a.remove();
          $('save-hint').textContent = Config.ui().saveHintDesktop || Config.fb('已下载 · 也可以长按或右键保存这张图', 'Downloaded · you can also long-press or right-click to save');
        } else {
          /* 移动端（含安卓 WebView）一律浮层长按保存，不走假下载 */
          $('save-hint').textContent = Config.ui().saveHintMobile || Config.fb('长按图片，保存到相册', 'Long-press the image to save it');
        }
        $('save-img').src = url;
        if (snapshot.result.onExport) snapshot.result.onExport();
        /* 除长按外再给一个明确的「打开大图保存」入口，不依赖单一
           浏览器行为。移动端一律用与预览图同一个 blob 对象 URL：
           Chromium 自 60 起拦截页面发起的 data: 顶层导航，Android
           Chrome 点 data: 链接打不开新标签页；iOS Safari 同样拦截
           data:。data: 只在 blob 不可用时作兜底。桌面维持 data:
           （直接下载走 blob <a download>，两者互为兜底）。 */
        var openLink = $('save-open');
        if (isMobile()) {
          if (url) openLink.href = url;
          else { try { openLink.href = canvas.toDataURL('image/png'); } catch (e) { console.warn('card: 大图 data URL 生成失败：', e && e.message); openLink.href = ''; } }
        } else {
          try { openLink.href = canvas.toDataURL('image/png'); }
          catch (e) {
            console.warn('card: 大图 data URL 生成失败，改用对象 URL：', e && e.message);
            openLink.href = url;
          }
        }
        openLink.classList.remove('hidden');
        openSaveOverlay();
        vibrate();
      }, 'image/png');
    }).catch(function (err) {
      console.warn('card: 导出失败：', err && err.message);
      holder.remove();
      delete btn.dataset.busy;
      btn.textContent = Config.ui().saveFailed || Config.fb('生成失败，再点一次', 'Failed — tap to retry');
    });
  }

  function init() {
    $('btn-save').addEventListener('click', exportPNG);
    $('btn-save-close').addEventListener('click', closeSaveOverlay);
    window.addEventListener('scroll', syncPill);
    /* 页面卸载时回收最后一个 blob URL（见上）。 */
    window.addEventListener('pagehide', function () { if (lastBlobUrl) { URL.revokeObjectURL(lastBlobUrl); lastBlobUrl = null; } });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !$('save-overlay').classList.contains('hidden')) closeSaveOverlay();
      /* 焦点陷阱：浮层打开时 Tab 只在浮层内循环（关闭按钮 ⇄ 打开
         大图链接），不跑到背景里；背景 inert 是第一道防线（不支持
         inert 的旧浏览器靠这道兜底）。 */
      if (e.key === 'Tab' && !$('save-overlay').classList.contains('hidden')) {
        var f = [$('btn-save-close'), $('save-open')].filter(function (el) { return el && !el.classList.contains('hidden'); });
        if (!f.length) return;
        var first = f[0], lastEl = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastEl.focus(); }
        else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus(); }
      }
    });
  }

  CL.Card = {
    show: show,
    init: init,
    refit: fitCard,
    /* 供验收/测试核对二维码实际编码内容与当前结果（只读） */
    debugState: function () {
      return {
        qrText: lastQrText,
        qrFailed: last ? !!last.qrFailed : false,
        fileSlug: last ? last.result.fileSlug : null,
        toolId: last ? last.tool.id : null
      };
    },
    get last() { return last; }
  };
})();
