(function () {
 'use strict';
 var resources;
 function setup(pack) {
  if (!resources) resources = Promise.all([pack.stylesPack, pack.blocklistPack].map(function(path){return fetch(path).then(function(r){if(!r.ok)throw new Error('config_unavailable');return r.json();});})).then(function(r){return {styles:r[0].styles,words:r[1].words};}).catch(function(e){resources=null;throw e;});
  return resources;
 }
 async function request(path, body) {
  var controller=new AbortController(),timer=setTimeout(function(){controller.abort();},10000);
  try {var r=await fetch((window.CL_API_BASE||'/api').replace(/\/$/,'')+'/bouquet'+path,{method:body===undefined?'GET':'POST',signal:controller.signal,headers:body===undefined?{}:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});var p;try{p=await r.json();}catch(err){if(r.ok)throw err;}if(!r.ok){var e=new Error(p&&p.error||'http_error');e.code=p&&p.error||'http_error';e.status=r.status;var ra=Number(r.headers.get('Retry-After'));if(ra>0)e.retryAfter=ra;throw e;}return p;}finally{clearTimeout(timer);}
 }
 function telemetry(action){try{var ref;try{var p=JSON.parse(localStorage.getItem('cardlab.referral.v1'));if(p&&p.has&&p.code)ref=p.code;}catch(_){}ref=ref||'OFFICIAL';navigator.sendBeacon('https://earnway.shop/central-dashboard/api/ew-telemetry.php',new Blob([JSON.stringify({site:'cardlab',toolId:'bouquet',action:action,ref:ref})],{type:'text/plain;charset=UTF-8'}));}catch(_){}}
 // Only fixed, locally authored SVG geometry and allowlisted colors enter the renderer.
 function visual(style){
  var k=style==='sunny_sunflower'?1:style==='spring_tulip'?2:0,
    s='<svg xmlns="http://www.w3.org/2000/svg" width="400" height="360" viewBox="0 0 400 360" aria-hidden="true">',
    V=[0,0,0,1],H=[0,0,1,0],
    GT=[[-16,-30],[-6,-40],[6,-45],[16,-34],[22,-22],[-22,-20],[0,-28],[-12,-49],[12,-24]],
    j,F,LV,GB,GF,fn,df,bk,tl,tr,cone;
  function n(v){return Math.round(v*10)/10;}
  function P(a,b){return n(a)+' '+n(b);}
  function u(id){return 'url(#'+id+')';}
  function st(a){var r='',i;for(i=0;i<a.length;i++)r+='<stop offset="'+a[i][0]+'" stop-color="'+a[i][1]+'"'+(a[i].length>2?' stop-opacity="'+a[i][2]+'"':'')+'/>';return r;}
  function lg(id,c,a){return '<linearGradient id="'+id+'" x1="'+c[0]+'" y1="'+c[1]+'" x2="'+c[2]+'" y2="'+c[3]+'">'+st(a)+'</linearGradient>';}
  function rg(id,c,a){return '<radialGradient id="'+id+'" cx="'+c[0]+'" cy="'+c[1]+'" r="'+c[2]+'" fx="'+c[3]+'" fy="'+c[4]+'">'+st(a)+'</radialGradient>';}
  function pa(d,f,x){return '<path d="'+d+'" fill="'+f+'"'+(x||'')+'/>';}
  function ln(d,c,o,w){return '<path d="'+d+'" fill="none" stroke="'+c+'" stroke-opacity="'+o+'" stroke-width="'+w+'" stroke-linecap="round"/>';}
  function g(x,y,a,sx,sy){return '<g transform="translate('+n(x)+' '+n(y)+') rotate('+n(a)+')'+(sx?' scale('+sx+' '+sy+')':'')+'">';}

  function stem(x,y,i,w){
    var ex=192+(i*5)%17,d='M'+P(x,y)+'Q'+P(x+(ex-x)*.25,y+(300-y)*.55)+' '+ex+' 300';
    return ln(d,'#3A6A42',1,w)+'<path d="'+d+'" fill="none" stroke="#A3D09B" stroke-opacity=".5" stroke-width="1.1" transform="translate(-1 0)"/>';
  }
  function leaf(x,y,l,w,a){
    var e='M0 0C'+P(w,-l*.18)+' '+P(w*.92,-l*.72)+' 0 '+n(-l),i,yy,m,
      o=g(x,y,a)+pa(e+'C'+P(-w*.92,-l*.72)+' '+P(-w,-l*.18)+' 0 0Z',u('bqLeaf'),' stroke="#24452C" stroke-opacity=".35" stroke-width=".6"')+
        pa(e+'Q'+P(w*.12,-l*.5)+' 0 0Z',u('bqLeafHi'))+
        ln('M0 '+n(-l*.04)+'Q'+P(w*.12,-l*.5)+' 0 '+n(-l*.95),'#D6ECD0',.8,1.1);
    for(i=1;i<4;i++){yy=-l*(.12+i*.2);m=w*(.72-.14*i);
      o+=ln('M'+P(w*.06,yy)+'Q'+P(m*.5,yy-l*.04)+' '+P(m,yy-l*.13)+'M'+P(w*.04,yy)+'Q'+P(-m*.5,yy-l*.04)+' '+P(-m,yy-l*.13),'#D6ECD0',.5,.7);}
    return o+'</g>';
  }
  function gyp(x,y,sc,a){
    var o=g(x,y,a,sc,sc)+ln('M0 0L0 -16','#7FA878',1,1.1),c='',i,t,b=' fill="url(#bqBaby)" stroke="#C9D6C4" stroke-width=".4"/>';
    for(i=0;i<GT.length;i++){t=GT[i];
      o+=ln('M0 -16Q'+P(t[0]*.3,t[1]*.7)+' '+t[0]+' '+t[1],'#7FA878',1,.7);
      c+='<circle cx="'+t[0]+'" cy="'+t[1]+'" r="2.4"'+b+'<circle cx="'+(t[0]+2.3)+'" cy="'+(t[1]+1.5)+'" r="1.7"'+b+'<circle cx="'+(t[0]-1.9)+'" cy="'+(t[1]+1.8)+'" r="1.5"'+b+'<circle cx="'+t[0]+'" cy="'+t[1]+'" r=".75" fill="#EBD3D9"/>';}
    return o+c+'</g>';
  }

  function rp(l,w){return 'M0 0C'+P(-w,-l*.2)+' '+P(-w*1.15,-l*.85)+' '+P(-w*.4,-l)+'Q0 '+n(-l*.93)+' '+P(w*.4,-l)+'C'+P(w*1.15,-l*.85)+' '+P(w,-l*.2)+' 0 0Z';}
  function rose(x,y,r,a){
    var o=g(x,y,0)+'<circle r="'+n(r*.86)+'" fill="#6A2036"/>',i,b,lit,l=r*1.04,w=r*.62,c=-r*.14;
    for(i=0;i<6;i++){b=(i*60+a)*Math.PI/180;lit=Math.cos(b)-Math.sin(b)>0;
      o+='<g transform="rotate('+(i*60+a)+')">'+pa(rp(l,w),u(lit?'bqRoseL':'bqRoseA'),' stroke="#5A1A2D" stroke-opacity=".35" stroke-width=".8"')+
        (lit?ln('M'+P(-w*.4,-l)+'Q0 '+n(-l*.93)+' '+P(w*.4,-l),'#F2B0C0',.55,.9):'')+'</g>';}
    for(i=0;i<5;i++)o+=pa(rp(r*.8,r*.5),u('bqRoseB'),' transform="rotate('+(i*72+a+30)+')" stroke="#6E2238" stroke-opacity=".3" stroke-width=".7"');
    o+='<ellipse cy="'+n(-r*.04)+'" rx="'+n(r*.62)+'" ry="'+n(r*.54)+'" fill="url(#bqRoseC)"/>'+
      pa('M'+P(-r*.62,-r*.02)+'Q'+P(-r*.7,-r*.44)+' '+P(-r*.18,-r*.5)+'Q'+P(-r*.5,-r*.3)+' '+P(-r*.44,r*.06)+'Z',u('bqRoseE'),' opacity=".9"')+
      pa('M'+P(r*.62,-r*.02)+'Q'+P(r*.7,-r*.44)+' '+P(r*.18,-r*.5)+'Q'+P(r*.5,-r*.3)+' '+P(r*.44,r*.06)+'Z',u('bqRoseB'))+
      '<ellipse cy="'+n(c)+'" rx="'+n(r*.34)+'" ry="'+n(r*.24)+'" fill="url(#bqRoseD)"/>'+
      pa('M'+P(-r*.34,c)+'Q'+P(-r*.3,c-r*.3)+' '+P(r*.05,c-r*.26)+'Q'+P(r*.3,c-r*.22)+' '+P(r*.32,c-r*.02)+'Q'+P(r*.2,c-r*.14)+' '+P(r*.02,c-r*.15)+'Q'+P(-r*.22,c-r*.16)+' '+P(-r*.34,c)+'Z',u('bqRoseE'))+
      pa('M'+P(r*.22,c+r*.02)+'Q'+P(r*.18,c+r*.17)+' '+P(-r*.04,c+r*.14)+'Q'+P(-r*.2,c+r*.11)+' '+P(-r*.2,c-r*.02)+'Q'+P(-r*.12,c+r*.06)+' '+P(r*.02,c+r*.06)+'Q'+P(r*.14,c+r*.06)+' '+P(r*.22,c+r*.02)+'Z','#C45E78')+
      '<ellipse cx="'+n(r*.02)+'" cy="'+n(c-r*.03)+'" rx="'+n(r*.1)+'" ry="'+n(r*.065)+'" fill="#5E1A2E"/>'+
      ln('M'+P(r*.08,c-r*.04)+'Q'+P(r*.02,c-r*.12)+' '+P(-r*.1,c-r*.04)+'Q'+P(-r*.04,c+r*.04)+' '+P(r*.06,c),'#E58CA1',.8,.9)+
      ln('M'+P(-r*.3,c-r*.04)+'Q'+P(-r*.24,c-r*.27)+' '+P(r*.06,c-r*.25),'#F8C6D2',.75,1)+
      pa('M'+P(-r*.64,-r*.06)+'Q'+P(0,r*.8)+' '+P(r*.64,-r*.06)+'Q'+P(0,r*.36)+' '+P(-r*.64,-r*.06)+'Z',u('bqRoseE'),' stroke="#7A2B40" stroke-opacity=".35" stroke-width=".7"')+
      ln('M'+P(-r*.5,r*.03)+'Q'+P(0,r*.38)+' '+P(r*.5,r*.03),'#FBD3DC',.7,1.2);
    return o+'</g>';
  }

  function sp(l,w){return 'M0 0C'+P(w,-l*.2)+' '+P(w*1.05,-l*.68)+' 0 '+n(-l)+'C'+P(-w*1.05,-l*.68)+' '+P(-w,-l*.2)+' 0 0Z';}
  function sun(x,y,r,a,q){
    var o=g(x,y,a,1,q),i,l,t,rr,tf,dr=r*.36,N=Math.round(dr*dr*.22);
    for(i=0;i<18;i++){l=r*(.72+.05*Math.sin(i*2.7));
      o+=pa(sp(l,r*.12),u('bqSunB'),' transform="rotate('+(i*20+10)+') translate(0 '+n(-r*.28)+')"');}
    o+='<circle r="'+n(r*.55)+'" fill="#5A3A10" opacity=".22"/>';
    for(i=0;i<18;i++){l=r*(.62+.05*Math.sin(i*1.9+1));tf=' transform="rotate('+(i*20)+') translate(0 '+n(-r*.3)+')"';
      o+=pa(sp(l,r*.115),u('bqSunA'),tf+' stroke="#C48A1A" stroke-opacity=".35" stroke-width=".5"')+
        '<path d="M0 '+n(-l*.12)+'L0 '+n(-l*.8)+'"'+tf+' fill="none" stroke="#C98D1B" stroke-opacity=".5" stroke-width=".6"/>';}
    o+='<circle r="'+n(dr*1.1)+'" fill="#3E2810"/><circle r="'+n(dr)+'" fill="url(#bqSunC)"/>'+
      '<circle r="'+n(dr*.93)+'" fill="none" stroke="#B5862F" stroke-width="'+n(dr*.12)+'" stroke-dasharray="1.2 1.6" opacity=".75"/>';
    for(i=1;i<N;i++){rr=dr*.82*Math.sqrt(i/N);t=i*2.39996;
      o+='<circle cx="'+n(Math.cos(t)*rr)+'" cy="'+n(Math.sin(t)*rr)+'" r="'+n(.55+.6*i/N)+'" fill="'+(i%4?'#2A1909':'#A67A3E')+'"/>';}
    return o+'<ellipse cx="'+n(-dr*.3)+'" cy="'+n(-dr*.35)+'" rx="'+n(dr*.55)+'" ry="'+n(dr*.38)+'" fill="url(#bqSunD)"/></g>';
  }

  function tp(w,h,m){return 'M0 0C'+P(-w*.75*m,0)+' '+P(-w*1.2*m,-h*.36)+' '+P(-w*1.06*m,-h*.7)+'Q'+P(-w*m,-h*.88)+' '+P(-w*1.14*m,-h)+'C'+P(-w*.7*m,-h*.92)+' '+P(-w*.3*m,-h*.72)+' '+P(-w*.06*m,-h*.3)+'Q'+P(0,-h*.12)+' 0 0Z';}
  function tulip(x,y,h,a){
    var w=h*.4,e=' stroke="#7A2F55" stroke-opacity=".3" stroke-width=".6"';
    return g(x,y,a)+
      pa('M'+P(-w*.6,-h*.3)+'C'+P(-w*.66,-h*.8)+' '+P(-w*.18,-h)+' '+P(0,-h*1.04)+'C'+P(w*.18,-h)+' '+P(w*.66,-h*.8)+' '+P(w*.6,-h*.3)+'Z',u('bqTulB'))+
      pa(tp(w,h,1),u('bqTulL'),e)+pa(tp(w,h,-1),u('bqTulR'),e)+
      ln('M'+P(-w*.12,-h*.1)+'Q'+P(-w*1.08,-h*.42)+' '+P(-w*1.04,-h*.9),'#FAD0DF',.5,.7)+
      ln('M'+P(w*.12,-h*.1)+'Q'+P(w*1.08,-h*.42)+' '+P(w*1.04,-h*.9),'#C77A9E',.45,.7)+
      pa('M0 '+n(h*.01)+'C'+P(-w*.8,-h*.02)+' '+P(-w*.84,-h*.62)+' '+P(-w*.46,-h*.86)+'C'+P(-w*.3,-h*.96)+' '+P(-w*.1,-h*.98)+' 0 '+n(-h*.94)+'C'+P(w*.1,-h*.98)+' '+P(w*.3,-h*.96)+' '+P(w*.46,-h*.86)+'C'+P(w*.84,-h*.62)+' '+P(w*.8,-h*.02)+' 0 '+n(h*.01)+'Z',u('bqTulF'),e)+
      ln('M0 '+n(-h*.06)+'Q'+P(w*.06,-h*.5)+' 0 '+n(-h*.86),'#A24D76',.35,.7)+
      ln('M'+P(-w*.24,-h*.18)+'Q'+P(-w*.46,-h*.52)+' '+P(-w*.22,-h*.8),'#FDDCE7',.6,n(h*.035))+
      '<ellipse cy="'+n(-h*.02)+'" rx="'+n(w*.42)+'" ry="'+n(h*.05)+'" fill="#6E2A4C" opacity=".35"/>'+
      '<ellipse cy="'+n(h*.03)+'" rx="'+n(w*.16)+'" ry="'+n(h*.045)+'" fill="#3F7347"/></g>';
  }

  df='<defs>'+
    rg('bqShadow',[.5,.5,.5,.5,.5],[[0,'#1F3A27',.34],[.6,'#1F3A27',.12],[1,'#1F3A27',0]])+
    lg('bqPaperLiner',V,[[0,'#8FBF88'],[1,'#4F8457']])+
    lg('bqPaperIn',V,[[0,'#DCEED8'],[1,'#9FC998']])+
    lg('bqPaperL',[0,0,1,1],[[0,'#F7FBF6'],[.45,'#EAF4E8'],[1,'#C3E0BE']])+
    lg('bqPaperR',H,[[0,'#E2F0DF'],[.35,'#C9E4C5'],[1,'#93C28C']])+
    lg('bqGloss',H,[[0,'#FFFFFF',0],[.5,'#FFFFFF',.8],[1,'#FFFFFF',0]])+
    lg('bqRib',V,[[0,'#609A66'],[.45,'#3C6E45'],[1,'#22402A']])+
    lg('bqRibT',H,[[0,'#26482D'],[.5,'#4C8653'],[1,'#26482D']])+
    rg('bqKnot',[.5,.5,.6,.38,.3],[[0,'#86BA80'],[.5,'#3F7347'],[1,'#1F3A27']])+
    lg('bqLeaf',V,[[0,'#86BA80'],[.5,'#4E8657'],[1,'#2C5233']])+
    lg('bqLeafHi',V,[[0,'#F0F8EE',.42],[1,'#F0F8EE',0]])+
    rg('bqBaby',[.5,.5,.5,.4,.35],[[0,'#FFFFFF'],[.7,'#F8F4F5'],[1,'#DCD5D8']]);

  if(k===0){
    df+=lg('bqRoseA',V,[[0,'#8C4456'],[.22,'#B84C65'],[.6,'#9E3E59'],[1,'#661F34']])+
      lg('bqRoseL',V,[[0,'#A85A6B'],[.2,'#D77A92'],[.6,'#BC536E'],[1,'#7A2840']])+
      lg('bqRoseB',V,[[0,'#B05A6E'],[.22,'#DE8299'],[.65,'#C25872'],[1,'#8A2F49']])+
      rg('bqRoseC',[.45,.35,.7,.4,.25],[[0,'#F0AABB'],[.45,'#CC6680'],[1,'#8A3049']])+
      rg('bqRoseD',[.5,.4,.6,.5,.3],[[0,'#4E1424'],[1,'#8E3550']])+
      lg('bqRoseE',V,[[0,'#F4B8C6'],[.4,'#DB7C94'],[1,'#A8435E']]);
    F=[[200,64,31,10],[130,104,34,40],[274,100,33,75],[104,170,24,20],[164,152,40,0],[240,160,41,30],[202,192,35,55]];
    LV=[[152,234,60,20,-56],[250,232,62,21,54],[126,212,44,15,-72],[282,210,44,15,64],[232,98,34,12,38],[160,92,32,11,-40]];
    GB=[[108,214,1.1,-44],[284,206,.95,36],[236,104,.8,14],[166,98,.8,-16],[100,150,.8,-30]];
    GF=[[124,224,.75,-24],[278,222,.75,26]];fn=rose;
  }else if(k===1){
    df+=lg('bqSunA',V,[[0,'#FCE49A'],[.3,'#F5CB4A'],[.75,'#E4AF27'],[1,'#B07414']])+
      lg('bqSunB',V,[[0,'#E9B43C'],[.5,'#CF941C'],[1,'#8A560E']])+
      rg('bqSunC',[.5,.5,.5,.45,.4],[[0,'#5C3D1A'],[.5,'#79562E'],[.82,'#694420'],[1,'#3E2810']])+
      rg('bqSunD',[.5,.5,.5,.5,.5],[[0,'#FFFFFF',.32],[1,'#FFFFFF',0]]);
    F=[[200,72,42,0,1],[124,116,36,14,.9],[282,110,38,-12,.88],[98,184,26,-24,.62],[164,170,40,6,1],[248,176,44,-8,.95]];
    LV=[[146,232,62,28,-58],[256,228,64,29,56],[292,206,40,18,50],[106,150,38,17,-62],[296,156,32,14,44]];
    GB=[[108,220,1.05,-46],[288,206,.95,38],[150,74,.8,-22],[252,72,.8,22],[204,124,.75,0]];
    GF=[[132,226,.7,-20],[268,226,.7,24]];fn=sun;
  }else{
    df+=lg('bqTulB',V,[[0,'#B4618A'],[1,'#7A2F55']])+
      lg('bqTulL',H,[[0,'#F4BCD1'],[.45,'#DA8CAC'],[1,'#B05A80']])+
      lg('bqTulR',H,[[0,'#B25C84'],[.55,'#9E4A74'],[.88,'#843660'],[1,'#A2557E']])+
      rg('bqTulF',[.38,.3,.85,.35,.2],[[0,'#F9CFDF'],[.35,'#E197B6'],[.75,'#C66E92'],[1,'#8E3D66']])+
      lg('bqLeafTL',[1,1,0,0],[[0,'#2C5233'],[.5,'#4E8657'],[1,'#86BA80']])+
      lg('bqLeafTR',[0,1,1,0],[[0,'#2C5233'],[.5,'#4E8657'],[1,'#86BA80']]);
    F=[[200,92,54,0],[146,112,48,-14],[256,106,50,12],[116,166,42,-26],[288,160,42,24],[170,198,50,-6],[234,202,50,8]];
    LV=[[166,230,52,12,-30],[236,228,54,12,28]];
    GB=[[200,158,1,0],[110,216,1.05,-44],[292,212,1,42],[146,150,.8,-22],[258,146,.8,22]];
    GF=[[138,226,.7,-18],[262,226,.7,20]];fn=tulip;
  }
  s+=df+'</defs>';

  /* 投影：地面双层椭圆 + 纸筒柔和偏移影 */
  cone='M88 206Q150 238 216 228L220 274L212 343L178 343L170 274Q128 244 88 206ZM314 204Q262 236 194 240L190 274L198 343L222 343L230 274Q272 246 314 204Z';
  s+='<ellipse cx="206" cy="346" rx="150" ry="12" fill="url(#bqShadow)" opacity=".5"/><ellipse cx="204" cy="344" rx="84" ry="9" fill="url(#bqShadow)"/>'+
    '<path d="'+cone+'" fill="#1F3A27" opacity=".06" transform="translate(9 6)"/><path d="'+cone+'" fill="#1F3A27" opacity=".07" transform="translate(4 3)"/>';

  /* 衬纸 + 内层背光纸（波浪上沿、折痕、亮边） */
  bk='M88 206C92 186 112 172 134 186C152 166 180 166 196 184C214 164 244 166 260 184C284 170 306 184 314 204';
  s+=pa('M80 216C82 184 100 166 122 174L170 274Q128 244 80 216Z',u('bqPaperLiner'))+
    pa('M320 214C318 182 300 164 278 172L230 274Q272 246 320 214Z',u('bqPaperLiner'))+
    pa(bk+'Q272 246 230 274L170 274Q128 244 88 206Z',u('bqPaperIn'))+
    ln('M134 186L178 268M196 184L198 268M260 184L222 268','#7FAF78',.45,.9)+ln(bk,'#F7FBF6',.9,1.3);

  /* 茎 → 叶 → 后景满天星 → 花头 → 前景满天星 */
  for(j=0;j<F.length;j++)s+=stem(F[j][0],F[j][1],j,k===2?5:4);
  if(k===2)s+=pa('M190 262C150 236 96 200 80 120C118 170 160 212 198 246Z',u('bqLeafTL'),' stroke="#24452C" stroke-opacity=".35" stroke-width=".6"')+
    pa('M190 262C150 236 96 200 80 120C108 176 152 218 194 254Z','#E4F2E0',' opacity=".22"')+
    ln('M194 254C152 220 104 176 80 120','#D6ECD0',.75,1.1)+
    pa('M210 262C250 234 302 196 316 112C286 166 246 204 202 246Z',u('bqLeafTR'),' stroke="#24452C" stroke-opacity=".35" stroke-width=".6"')+
    pa('M210 262C250 234 302 196 316 112C292 172 250 216 206 254Z','#E4F2E0',' opacity=".18"')+
    ln('M206 254C250 218 296 172 316 112','#D6ECD0',.75,1.1);
  for(j=0;j<LV.length;j++)s+=leaf.apply(null,LV[j]);
  for(j=0;j<GB.length;j++)s+=gyp.apply(null,GB[j]);
  for(j=0;j<F.length;j++)s+=fn.apply(null,F[j]);
  for(j=0;j<GF.length;j++)s+=gyp.apply(null,GF[j]);

  /* 前片包装纸：左受光 / 右背光，折痕、光泽、翻角、上沿高光与花影 */
  tl='M88 206Q150 238 216 228';tr='M314 204Q262 236 194 240';
  s+=pa(tl+'L220 274L212 343L178 343L170 274Q128 244 88 206Z',u('bqPaperL'))+
    ln('M118 224Q148 250 174 274M150 232Q170 252 182 274','#86B97F',.6,.9)+
    ln('M119.6 223Q149.6 249 175.6 273M151.6 231Q171.6 251 183.6 273','#FFFFFF',.75,.8)+
    pa('M104 214Q136 236 168 270L176 270Q146 234 116 214Z',u('bqGloss'))+
    '<path d="M100 216Q150 241 214 232" fill="none" stroke="#315C3B" stroke-opacity=".09" stroke-width="6"/>'+
    ln(tl,'#FFFFFF',.9,1.3)+
    pa(tr+'L190 274L198 343L222 343L230 274Q272 246 314 204Z',u('bqPaperR'))+
    ln('M286 222Q256 250 226 274M250 236Q236 254 214 274','#79AD72',.6,.9)+
    ln('M287.5 223.5Q257.5 251.5 227.5 275.5M251.5 237.5Q237.5 255.5 215.5 275.5','#F4FAF2',.6,.8)+
    pa('M296 214Q270 236 238 268L245 268Q276 236 303 211Z','#FFFFFF',' opacity=".28"')+
    '<path d="M302 212Q262 240 198 244" fill="none" stroke="#315C3B" stroke-opacity=".1" stroke-width="6"/>'+
    ln(tr,'#F4FAF2',.85,1.2)+
    pa('M194 240L213 237.5L199 258Z','#F7FBF6',' stroke="#9CC995" stroke-width=".6"')+
    ln('M185 292L187 340M207 292L205 340','#86B97F',.55,.8)+ln('M178 343L222 343','#79AD72',.7,1);

  /* 丝带结：飘带 → 束带 → 双耳（内侧暗面 + 高光） → 结心 */
  s+=pa('M197 280C191 298 181 314 168 332L178 329L181 340C192 320 200 302 205 282Z',u('bqRibT'))+
    pa('M203 280C211 298 223 312 238 328L228 328L226 339C215 320 206 302 197 284Z',u('bqRibT'))+
    ln('M199 287C194 302 186 316 175 328','#FFFFFF',.32,1.1)+ln('M206 288C213 302 221 313 231 323','#FFFFFF',.25,1.1)+
    pa('M168 268Q200 280 232 268L231 282Q200 294 169 282Z',u('bqRib'))+ln('M172 271.5Q200 282 228 271.5','#FFFFFF',.35,1.3)+
    pa('M200 276C184 258 152 254 152 270C152 288 182 288 200 276Z',u('bqRib'))+
    pa('M196 276C182 266 164 264 162 271C162 279 182 281 196 276Z','#1C3822',' opacity=".45"')+
    ln('M191 267C178 258 161 258 156.5 266','#FFFFFF',.45,1.6)+
    pa('M200 276C216 258 248 254 248 270C248 288 218 288 200 276Z',u('bqRib'))+
    pa('M204 276C218 266 236 264 238 271C238 279 218 281 204 276Z','#1C3822',' opacity=".45"')+
    ln('M209 267C222 258 239 258 243.5 266','#FFFFFF',.4,1.6)+
    '<ellipse cx="200" cy="277" rx="9" ry="10" fill="url(#bqKnot)"/>'+
    ln('M195.5 270Q197.5 277 195.5 285M204.5 270Q202.5 277 204.5 285','#1F3A27',.45,.8)+
    '<ellipse cx="197.5" cy="272.5" rx="3.2" ry="2.2" fill="#FFFFFF" opacity=".5"/>';
  return s+'</svg>';
}

 function result(p,pack){return {layout:'compact',headline:pack.ui.recipient+': '+p.recipient,label:pack.card.label,bigText:'',equivText:pack.ui.sender+': '+p.sender,badgeText:'',extra:{kind:'illustration',svg:visual(p.style)},copy:p.note,note:pack.card.note,watermarkName:pack.card.watermarkName,fileSlug:p.id,deepLink:location.origin+'/?tool=bouquet&id='+encodeURIComponent(p.id),onExport:function(){telemetry('card_generated');}};}
 CL.Registry.provideEngine({setup:setup,visual:visual,create:async function(p,pack){var r=await setup(pack);var text=[p.sender,p.recipient,p.note].join(' ').normalize('NFKC').toLowerCase();if(r.words.some(function(w){return /^[a-z]+$/i.test(w)?new RegExp('\\b'+w+'\\b','i').test(text):text.includes(w);})){var e=new Error('blocked');e.code='blocked';throw e;}var created=await request('/create',p);telemetry('bouquet_created');return created;},load:function(id){return request('/'+encodeURIComponent(id));},open:function(id){return request('/'+encodeURIComponent(id)+'/open',{});},run:result,rebuild:function(r,p){return result(r.bouquet,p);},rerunOf:function(p){return {bouquet:p};}});
})();
