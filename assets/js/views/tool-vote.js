(function () {
  'use strict';
  var timer, generation = 0;
  function el(tag, text, cls) { var n = document.createElement(tag); if (text) n.textContent = text; if (cls) n.className = cls; return n; }
  function mount(tool) {
    clearInterval(timer); var version = ++generation, pack = CL.Config.packs[tool.id], engine = CL.Registry.engineFor(tool);
    var ui = pack.ui, body = CL.$('vote-body'), status = CL.$('vote-status');
    body.replaceChildren(); status.textContent = ''; CL.$('vote-title').textContent = tool.name; CL.$('vote-desc').textContent = tool.desc;
    CL.$('vote-trust').textContent = tool.trustLine; CL.$('vote-fineprint').textContent = tool.fineprint + ' ' + ui.privacy;
    CL.Referral.mountBox(CL.$('vote-ref-mount')); CL.Referral.applyAll();
    var id = new URLSearchParams(location.search).get('id'), poll, busy = false, mutationEpoch = 0;
    function say(text) { if (version === generation) status.textContent = text; }
    function button(text, fn, parent) { var b = el('button', text, 'vote-button'); b.type = 'button'; b.onclick = fn; (parent || body).appendChild(b); return b; }
    function stopPolling() { if (version === generation) { clearInterval(timer); timer = undefined; } }
    function fail(e) { if (e.code === 'not_found' || e.code === 'closed') stopPolling(); say(e.code === 'already_voted' ? ui.voted : e.code === 'closed' ? ui.closed : e.code === 'not_found' ? ui.notFound : e.code === 'forbidden' ? ui.forbidden : ui.error); }
    function shares() {
      var section = el('section', '', 'vote-shares'); section.appendChild(el('h2', ui.share));
      ['/?tool=vote&id=', '/v/'].forEach(function (path) {
        var url = location.origin + path + encodeURIComponent(id), a = el('a', url); a.href = url; section.appendChild(a);
        button(ui.copy, async function () { try { await navigator.clipboard.writeText(url); say(ui.copied); } catch (_) { say(url); } }, section);
      }); body.appendChild(section);
    }
    function results() {
      if (poll.closed) stopPolling();
      body.replaceChildren(); body.appendChild(el('h2', poll.question, 'vote-question'));
      var total = poll.options.reduce(function (a, o) { return a + o.count; }, 0), locked = engine.myVote(id) || poll.closed;
      poll.options.forEach(function (o, index) {
        var row = el('div', '', 'vote-result'), b = button(o.text, async function () {
          if (busy) return; busy = true; results();
          try { poll = await engine.castVote(id, index); mutationEpoch++; say(ui.voted); }
          catch (e) { if (e.code === 'already_voted') engine.markVoted(id); if (e.code === 'closed') poll.closed = true; fail(e); }
          finally { busy = false; if (version === generation) results(); }
        }, row); b.disabled = locked || busy;
        var pct = total ? Math.round(o.count / total * 100) : 0;
        row.appendChild(el('span', o.count + ' · ' + pct + '%', 'vote-count'));
        var track = el('div', '', 'vote-track'), fill = el('div', '', 'vote-fill'); fill.style.width = '0%'; track.appendChild(fill); row.appendChild(track); body.appendChild(row);
        requestAnimationFrame(function () { fill.style.width = pct + '%'; });
      });
      body.appendChild(el('p', poll.closed ? ui.closed : engine.myVote(id) ? ui.voted : ui.privacy));
      button(ui.export, function () { CL.Card.show(tool, engine.run(poll, pack), pack, engine.rerunOf(poll)); });
      if (engine.isCreator(id) && !poll.closed) {
        var close = button(ui.close, async function () { close.disabled = true; try { poll = await engine.close(id); mutationEpoch++; results(); say(ui.closed); } catch (e) { fail(e); close.disabled = false; } });
      }
      shares();
    }
    async function load() {
      if (busy || !CL.Router.isVisible(tool.view)) return;
      var epoch = mutationEpoch;
      try { var next = await engine.load(id); if (epoch !== mutationEpoch || version !== generation) return; poll = next; results(); say(''); }
      catch (e) { if (epoch !== mutationEpoch || version !== generation) return; fail(e); if (!poll && version === generation) { body.replaceChildren(); if (e.code !== 'not_found') button(ui.retry, load); } }
    }
    if (id) { say(ui.loading); load(); timer = setInterval(load, 15000); return; }
    function counter(input, max, parent) { var count = el('span'); function update() { count.textContent = Array.from(input.value).length + '/' + max; } input.addEventListener('input', update); update(); parent.appendChild(count); }
    var form = el('form'), label = el('label', ui.question), question = el('input'); question.id = 'vote-question';  question.required = true; label.appendChild(question); counter(question, 80, label); form.appendChild(label);
    var list = el('div'), add;
    function addOption() {
      var row = el('div', '', 'vote-option-input'), l = el('label', ui.option), input = el('input');  input.required = true; l.appendChild(input); counter(input, 30, l); row.appendChild(l);
      button(ui.remove, function () { if (list.children.length > 2) row.remove(); sync(); }, row); list.appendChild(row); sync();
    }
    function sync() { if (add) add.disabled = list.children.length >= 6; Array.from(list.children).forEach(function (row) { row.querySelector('button').disabled = list.children.length <= 2; }); }
    form.appendChild(list); add = button(ui.add, addOption, form); addOption(); addOption();
    var submit = el('button', ui.create, 'cta'); submit.type = 'submit'; form.appendChild(submit); body.appendChild(form);
    form.onsubmit = async function (event) {
      event.preventDefault(); if (busy) return;
      var q = question.value.trim(), options = Array.from(list.querySelectorAll('input')).map(function (i) { return i.value.trim(); });
      if (!q || Array.from(q).length > 80 || options.some(function (o) { return !o || Array.from(o).length > 30; })) { say(ui.invalid); return; }
      busy = true; submit.disabled = true; say(ui.loading);
      try { var created = await engine.create(q, options); if (version !== generation) return; var u = new URLSearchParams(location.search); u.set('tool', tool.id); u.set('id', created.id); history.replaceState(null, '', '/?' + u.toString() + '#' + tool.id); mount(tool); }
      catch (e) { fail(e); } finally { busy = false; submit.disabled = false; }
    };
  }
  CL.Views.vote = { mount: mount };
  CL.Registry.registerViewShell('vote', CL.Views.vote);
})();
