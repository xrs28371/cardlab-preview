(function () {
  'use strict';
  var generation = 0, timer, session;
  function el(tag, text, cls) { var n = document.createElement(tag); if (text) n.textContent = text; if (cls) n.className = cls; return n; }
  async function mount(tool) {
    clearInterval(timer);
    var version = ++generation, pack = CL.Config.packs[tool.id], ui = pack.ui, engine = CL.Registry.engineFor(tool);
    var body = CL.$('fakeai-body'), status = CL.$('fakeai-status');
    body.replaceChildren(); status.textContent = ui.loading;
    CL.$('fakeai-title').textContent = tool.name; CL.$('fakeai-desc').textContent = tool.desc;
    CL.$('fakeai-warning').textContent = ui.warning;
    CL.Referral.mountBox(CL.$('fakeai-ref-mount')); CL.Referral.applyAll();
    function active() { return version === generation && CL.Router.isVisible('fakeai'); }
    function button(id, text, fn, parent) { var b = el('button', text, 'fakeai-button'); b.id = id; b.type = 'button'; b.onclick = fn; (parent || body).appendChild(b); return b; }
    function reportButton() {
      button('fakeai-report', ui.report, async function () {
        this.disabled = true;
        var ok = await engine.report();
        if (active()) { status.textContent = ok ? ui.reported : ui.reportError; this.disabled = false; }
      }).classList.add('fakeai-report');
    }
    var data;
    try { data = await engine.setup(pack); }
    catch (_) { if (active()) { status.textContent = ui.error; button('fakeai-retry', ui.retry, function () { mount(tool); }); } return; }
    if (!active()) return;
    if (!session) session = engine.createSession(data);
    status.textContent = '';
    function result() {
      clearInterval(timer); body.replaceChildren(); status.textContent = '';
      var r = session.round();
      body.appendChild(el('h2', ui[r.verdict], 'fakeai-verdict'));
      body.appendChild(el('p', r.question[CL.Config.lang()], 'fakeai-question'));
      body.appendChild(el('blockquote', r.answer || ui.empty, 'fakeai-answer'));
      body.appendChild(el('p', ui.elapsed + ': ' + r.elapsed + 's · ' + ui.score + ': ' + r.score));
      body.appendChild(el('p', engine.explanation(r, ui), 'fakeai-breakdown'));
      button('fakeai-next', ui.next, start);
      button('fakeai-export', ui.export, function () { CL.Card.show(tool, engine.run(r, pack), pack, engine.rerunOf(r)); });
      reportButton();
    }
    function answering() {
      body.replaceChildren(); status.textContent = '';
      var r = session.tick(); if (session.state() === 'result') { result(); return; }
      var clock = el('div', '', 'fakeai-clock'); clock.id = 'fakeai-clock'; clock.setAttribute('role', 'timer'); body.appendChild(clock);
      var progress = el('progress'); progress.max = 60; body.appendChild(progress);
      body.appendChild(el('h2', r.question[CL.Config.lang()], 'fakeai-question'));
      var form = el('form'), label = el('label', ui.answer), input = el('textarea'); input.id = 'fakeai-input'; input.rows = 6;
      input.value = session.draft || ''; label.appendChild(input); form.appendChild(label);
      var counter = el('span', Array.from(input.value).length + '/300', 'fakeai-counter'); form.appendChild(counter);
      input.oninput = function () { input.value = Array.from(input.value).slice(0, 300).join(''); session.draft = input.value; counter.textContent = Array.from(input.value).length + '/300'; };
      var submit = button('fakeai-submit', ui.submit, null, form); submit.type = 'submit'; body.appendChild(form); reportButton();
      form.onsubmit = function (event) { event.preventDefault(); var outcome = session.submit(input.value); if (outcome.error) status.textContent = ui[outcome.error] || ui.invalid; else { session.draft = ''; result(); } };
      function update() {
        if (!active()) { clearInterval(timer); return; }
        var current = session.tick();
        if (session.state() === 'result') { session.draft = ''; result(); return; }
        clock.textContent = current.remaining + 's'; clock.classList.toggle('urgent', current.remaining <= 10); progress.value = current.remaining;
      }
      update(); timer = setInterval(update, 100);
    }
    function start() { session.draft = ''; session.start(); answering(); }
    if (session.state() === 'answering') answering();
    else if (session.state() === 'result') result();
    else { body.appendChild(el('p', ui.intro, 'fakeai-intro')); button('fakeai-start', ui.start, start); }
  }
  // Shared card 'again' requests a reset; retain this round and draw queue so
  // the result's next-prompt action can continue without repeating it.
  CL.Views.fakeai = { mount: mount };
  CL.Registry.registerViewShell('fakeai', CL.Views.fakeai);
})();
