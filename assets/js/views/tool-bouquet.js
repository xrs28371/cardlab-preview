(function(){
 'use strict';var generation=0,timer;
 function el(tag,text,cls){var n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;}
 async function mount(tool){
  clearTimeout(timer);var version=++generation,pack=CL.Config.packs[tool.id],ui=pack.ui,engine=CL.Registry.engineFor(tool),body=CL.$('bouquet-body'),status=CL.$('bouquet-status'),id=new URLSearchParams(location.search).get('id');
  body.replaceChildren();status.textContent=ui.loading;CL.$('bouquet-title').textContent=tool.name;CL.$('bouquet-desc').textContent=tool.desc;CL.$('bouquet-trust').textContent=tool.trustLine;CL.Referral.mountBox(CL.$('bouquet-ref-mount'));CL.Referral.applyAll();
  function active(){return version===generation;}
  function say(s){if(active())status.textContent=s;}
  function button(text,fn,parent){var b=el('button',text,'bouquet-button');b.type='button';b.onclick=fn;(parent||body).appendChild(b);return b;}
  function fail(e){if(e.status===429){var s=ui.rateLimited||ui.error;if(e.retryAfter)s+=' '+CL.Config.fb('（'+e.retryAfter+' 秒后可重试）','(retry in '+e.retryAfter+'s)');say(s);return;}say(e.code==='not_found'?ui.notFound:e.code==='blocked'?ui.blocked:({400:ui.inputError,413:ui.tooLarge,405:ui.unsupported,503:ui.unavailable}[e.status]||ui.error));}
  function cta(){var a=el('a',ui.cta,'bouquet-cta');var u=new URLSearchParams(location.search);u.set('tool','bouquet');u.delete('id');a.href='/?'+u.toString()+'#bouquet';a.onclick=function(e){e.preventDefault();history.replaceState(null,'','/?'+u.toString()+'#bouquet');mount(tool);};body.appendChild(a);}
  function art(style,parent){var v=el('div','','bouquet-art');v.innerHTML=engine.visual(style);parent.appendChild(v);return v;}
  /* 创建者标记（sessionStorage，同一标签页内有效）：create 成功后写
     下 `bouquet:created:<id>`，刷新/语言切换重挂时凭此标记认出创建
     者，重渲染分享屏——不走收花人 keepsake、不调 open 端点，收花人
     的拆开动画不受影响。sessionStorage 只在同一标签页共享：创建者
     在新标签页打开自己的分享链接时会被当成收花人（这是对的——新
     标签页无法区分创建者与收花人）。标记里不含任何敏感信息，只有
     id 本身；隐私模式下 setItem/getItem 抛错时兜底，退回旧行为。 */
  function markCreated(createdId){try{sessionStorage.setItem('bouquet:created:'+createdId,'1');}catch(_){}}
  function isCreated(createdId){try{return sessionStorage.getItem('bouquet:created:'+createdId)==='1';}catch(_){return false;}}
  /* 分享屏（创建者视角）：提交成功与创建者刷新/语言切换共用。只渲染
     分享链接与复制按钮，不调 open、不渲染 keepsake。 */
  function shareScreen(p,createdId){
   var u=new URLSearchParams(location.search);u.set('tool','bouquet');u.set('id',createdId);history.replaceState(null,'','/?'+u.toString()+'#bouquet');body.replaceChildren();say(ui.share);art(p.style,body);['/?tool=bouquet&id=','/b/'].forEach(function(path){var url=location.origin+path+encodeURIComponent(createdId),a=el('a',url,'bouquet-share');a.href=url;body.appendChild(a);button(ui.copy,async function(){try{await navigator.clipboard.writeText(url);say(ui.copied);}catch(_){say(url);}});});button(ui.makeAnother,function(){var u2=new URLSearchParams(location.search);u2.delete('id');history.replaceState(null,'','/?'+u2.toString()+'#bouquet');mount(tool);});
  }
  function keepsake(p,opening){
   body.replaceChildren();var section=el('section','','bouquet-keepsake');section.appendChild(el('h2',ui.recipient+': '+p.recipient));var stage=el('div','','bouquet-stage');art(p.style,stage);section.appendChild(stage);section.appendChild(el('blockquote',p.note));section.appendChild(el('p',ui.sender+': '+p.sender));body.appendChild(section);
   var exportBtn=button(ui.export,function(){CL.Card.show(tool,engine.run(p,pack),pack,engine.rerunOf(p));});cta();
   if(opening){section.classList.add('bouquet-opening');exportBtn.disabled=true;var wrap=el('div','','bouquet-wrap');wrap.appendChild(el('div','','bouquet-paper left'));wrap.appendChild(el('div','','bouquet-paper right'));wrap.appendChild(el('div','✧','bouquet-ribbon'));stage.appendChild(wrap);var skip=button(ui.skip,finish);function finish(){if(!active())return;clearTimeout(timer);section.classList.remove('bouquet-opening');wrap.remove();skip.remove();exportBtn.disabled=false;}timer=setTimeout(finish,2600);recordOpen();function recordOpen(){if(!active())return;engine.open(id).then(function(next){if(active()){p.openedAt=next.openedAt;say('');}}).catch(function(e){if(!active())return;fail(e);var retry=button(ui.retry,function(){retry.remove();recordOpen();});});}}
  }
  async function load(){say(ui.loading);try{var p=await engine.load(id);if(!active())return;say('');keepsake(p,p.openedAt===null);}catch(e){if(!active())return;body.replaceChildren();fail(e);if(e.code!=='not_found')button(ui.retry,load);cta();}}
  /* 创建者刷新/语言切换：凭 sessionStorage 标记重渲染分享屏，不走
     keepsake、不调 open（见上）。收花人（无标记）仍走 load()。 */
  if(id&&isCreated(id)){say(ui.loading);try{var created=await engine.load(id);if(!active())return;say('');shareScreen(created,id);}catch(e){if(!active())return;body.replaceChildren();fail(e);if(e.code!=='not_found')button(ui.retry,function(){mount(tool);});cta();}return;}
  if(id){load();return;}
  var resources;try{resources=await engine.setup(pack);}catch(e){if(active()){fail(e);button(ui.retry,function(){mount(tool);});}return;}if(!active())return;say('');
  var form=el('form'),label=el('label',ui.style),select=el('select');select.id='bouquet-style';resources.styles.forEach(function(s){var o=el('option',s[CL.Config.lang()]||s.en);o.value=s.id;select.appendChild(o);});label.appendChild(select);form.appendChild(label);var preview=art(select.value,form);select.onchange=function(){preview.innerHTML=engine.visual(select.value);};
  var inputs={};['sender','recipient','note'].forEach(function(key){var l=el('label',ui[key]),input=el(key==='note'?'textarea':'input');input.id='bouquet-'+key;input.required=true;inputs[key]=input;l.appendChild(input);if(key==='note'){var count=el('span','0/60','bouquet-counter');input.oninput=function(){count.textContent=Array.from(input.value).length+'/60';};l.appendChild(count);}form.appendChild(l);});
  form.appendChild(el('p',ui.privacy));var submit=el('button',ui.create,'bouquet-button');submit.type='submit';form.appendChild(submit);body.appendChild(form);var busy=false;
  form.onsubmit=async function(e){e.preventDefault();if(busy)return;var p={style:select.value};Object.keys(inputs).forEach(function(k){p[k]=inputs[k].value.trim();});if(['sender','recipient','note'].some(function(k){var n=Array.from(p[k]).length;return !n||n>(k==='note'?60:24);})){say(ui.invalid);return;}busy=true;submit.disabled=true;say(ui.loading);try{var created=await engine.create(p,pack);if(!active())return;markCreated(created.id);shareScreen(p,created.id);}catch(err){fail(err);}finally{busy=false;submit.disabled=false;}};
 }
 CL.Views.bouquet={mount:mount};CL.Registry.registerViewShell('bouquet',CL.Views.bouquet);
})();
