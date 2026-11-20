(function () {
  'use strict';
  function get(key) { try { return localStorage.getItem(key); } catch (_) { return null; } }
  function set(key, value) { try { localStorage.setItem(key, value); } catch (_) {} }
  function random() { return Array.from(crypto.getRandomValues(new Uint8Array(24))).map(function (b) { return b.toString(16).padStart(2, '0'); }).join(''); }
  function fingerprint() { var f = get('cl_vote_device'); if (!f) { f = random(); set('cl_vote_device', f); } return f; }
  async function request(path, body) {
    var controller = new AbortController(), timer = setTimeout(function () { controller.abort(); }, 10000);
    try {
      var response = await fetch((window.CL_API_BASE || '/api').replace(/\/$/, '') + '/vote' + path, {
        method: body === undefined ? 'GET' : 'POST', credentials: 'include', signal: controller.signal,
        headers: body === undefined ? {} : { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body)
      });
      var data = await response.json();
      if (!response.ok) { var e = new Error(data.error || 'api_error'); e.status = response.status; e.code = data.error; throw e; }
      return data;
    } finally { clearTimeout(timer); }
  }
  function referralCode() {
    try { var ref = JSON.parse(get('cardlab.referral.v1')); if (ref && ref.has && ref.code) return ref.code; } catch (_) {}
    return get('cl_ref') || 'OFFICIAL';
  }
  function telemetry(action) {
    try { navigator.sendBeacon('https://earnway.shop/central-dashboard/api/ew-telemetry.php', new Blob([JSON.stringify({ site: 'cardlab', toolId: 'vote', action: action, ref: referralCode() })], { type: 'text/plain;charset=UTF-8' })); } catch (_) {}
  }
  function buildResult(poll, pack) {
    var total = poll.options.reduce(function (a, o) { return a + o.count; }, 0);
    return { layout: 'compact', headline: poll.question, label: pack.card.label, bigText: String(total), equivText: pack.ui.total,
      badgeText: poll.closed ? pack.ui.closed : pack.ui.result,
      extra: { kind: 'bars', items: poll.options.map(function (o) { var pct = total ? Math.round(o.count / total * 100) : 0; return { label: o.text, pct: pct, numText: o.count + ' · ' + pct + '%' }; }) },
      copy: total ? pack.ui.done : pack.ui.empty, note: pack.card.note, watermarkName: pack.card.watermarkName,
      fileSlug: poll.id, deepLink: location.origin + '/?tool=vote&id=' + encodeURIComponent(poll.id), onExport: function () { telemetry('card_generated'); }
    };
  }
  CL.Registry.provideEngine({
    create: async function (question, options) { var p = await request('/create', { question: question, options: options }); set('cl_creator_' + p.id, p.creatorToken); return p; },
    load: function (id) { return request('/' + encodeURIComponent(id)); },
    castVote: async function (id, index) {
      var p = await request('/' + encodeURIComponent(id), { optionIndex: index, fingerprint: fingerprint() });
      set('cl_voted_' + id, '1'); telemetry('vote_cast'); return p;
    },
    close: function (id) { return request('/' + encodeURIComponent(id) + '/close', { creatorToken: get('cl_creator_' + id) }); },
    myVote: function (id) { return !!get('cl_voted_' + id); },
    markVoted: function (id) { set('cl_voted_' + id, '1'); },
    isCreator: function (id) { return !!get('cl_creator_' + id); },
    run: buildResult, rebuild: function (rerun, pack) { return buildResult(rerun.poll, pack); },
    rerunOf: function (poll) { return { poll: poll }; }
  });
})();
