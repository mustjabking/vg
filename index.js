/* ============================================================
   LYRAMOON — AI Builder + Video Generator
   Home: Name + AI Name + Web Link → generates shareable AI link
   AI page: personalized video generator (single 9:16, 15s load)
============================================================ */

const app = document.getElementById('app');

/* ---------- helpers ---------- */
function esc(s){
  return String(s ?? '').replace(/[&<>"']/g,
    c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

let toastEl = null, toastTimer = null;
function toast(msg){
  if(!toastEl){
    toastEl = document.createElement('div');
    toastEl.className = 'toast';
    document.body.appendChild(toastEl);
  }
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200);
}

/* ---------- URL building / parsing ---------- */
function buildHash(web, user, ai){
  return [web, user, ai]
    .map(p => encodeURIComponent(String(p).trim()))
    .join('+');
}

function parseHash(hash){
  if(!hash) return null;
  let raw = hash.replace(/^#\/?/, '').trim();
  if(!raw) return null;

  let parts = raw.split('+');
  if(parts.length < 3){
    if(raw.includes('|')) parts = raw.split('|');
    else if(raw.includes('::')) parts = raw.split('::');
  }
  if(parts.length < 3) return null;

  try{
    const dec = parts.map(p => decodeURIComponent(p));
    const web  = dec[0].trim();
    const user = dec[1].trim();
    const ai   = dec.slice(2).join(' ').trim();
    if(!web || !user || !ai) return null;
    return { web, user, ai };
  }catch(e){
    return null;
  }
}

function cleanWeb(input){
  let s = String(input || '').trim();
  s = s.replace(/^https?:\/\//i, '');
  s = s.replace(/\/+$/, '');
  s = s.replace(/\s+/g, '');
  return s;
}

function resolveRoute(){
  if(location.hash && location.hash.length > 1){
    const r = parseHash(location.hash);
    if(r) return r;
  }
  const q = new URLSearchParams(location.search);
  if(q.get('w') && q.get('u') && q.get('a')){
    return {
      web:  q.get('w').trim(),
      user: q.get('u').trim(),
      ai:   q.get('a').trim()
    };
  }
  const segs = location.pathname.split('/').filter(Boolean);
  if(segs.length === 3 && /\./.test(segs[0]) && !/\.html?$/i.test(segs[0])){
    try{
      return {
        web:  decodeURIComponent(segs[0]),
        user: decodeURIComponent(segs[1]),
        ai:   decodeURIComponent(segs[2])
      };
    }catch(e){}
  }
  return null;
}

function navigate(web, user, ai){
  location.hash = buildHash(web, user, ai);
}

function baseUrl(){
  let b = location.origin + location.pathname;
  b = b.replace(/\/index\.html?$/i, '/');
  return b;
}

/* ============================================================
   ROUTER
============================================================ */
function render(){
  const route = resolveRoute();
  if(route) renderAIPage(route);
  else      renderHome();
}

/* ============================================================
   HOME PAGE — AI Builder
============================================================ */
function renderHome(){
  document.title = 'LYRAMOON — AI Builder & Video Generator';

  app.innerHTML = `
    <div class="topbar">
      <div class="topbar-inner">
        <span class="top-icon">✦</span>
        <b>LYRAMOON AI Builder</b>
        <span class="dot">•</span>
        <span>by Muhammad Taqi</span>
      </div>
    </div>

    <div class="home-wrap">
      <header class="home-head">
        <div class="brand">
          <span class="logo">
            <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <path d="M20.8 4.8a10.8 10.8 0 1 0 6.4 20A11.5 11.5 0 0 1 20.8 4.8Z" fill="white"/>
              <path d="M8.1 22.6 18.7 12" stroke="#9B3DFF" stroke-width="2.7" stroke-linecap="round"/>
              <path d="M14.2 11.3 17 8.5M18.7 16.2l2.9-2.9M10.5 20.2l-2.3.2.2-2.3M21.9 9.1l.2-2.2 2.2-.2-.2 2.2-2.2.2Z"
                    stroke="white" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
          <h1>LYRAMOON</h1>
        </div>
        <div class="tagline">Build Your AI · Generate Videos</div>
        <div class="creator">
          <a href="https://taqi.oneapp.dev/" target="_blank" rel="noopener noreferrer">
            Created by <b>MUHAMMAD TAQI</b>
          </a>
        </div>
      </header>

      <div class="builder-card">
        <div class="field">
          <label>Your Name</label>
          <input id="inUser" type="text" placeholder="e.g. Muhammad Taqi"
                 maxlength="40" autocomplete="off" spellcheck="false">
        </div>

        <div class="field">
          <label>Your AI Name</label>
          <input id="inAI" type="text" placeholder="e.g. Lyra"
                 maxlength="40" autocomplete="off" spellcheck="false">
        </div>

        <div class="field">
          <label>Your Web Link</label>
          <div class="input-wrap prefix-wrap">
            <input id="inWeb" type="text" placeholder="example.com"
                   maxlength="80" autocomplete="off" spellcheck="false">
          </div>
          <div class="hint">https:// nahi likhna — sirf domain likhein.</div>
        </div>

        <div class="preview-box">
          <span class="label">Your AI Link</span>
          <span class="url" id="previewUrl">Fill all fields to see your link…</span>
        </div>

        <button class="btn-primary" id="buildBtn" disabled>🚀 Build My AI</button>
        <button class="btn-ghost" id="copyBtn">📋 Copy Link</button>

        <div class="divider">OR OPEN EXISTING</div>

        <div class="direct-row">
          <input id="directIn" type="text"
                 placeholder="Paste link: example.com+taqi+lyra"
                 autocomplete="off" spellcheck="false">
          <button id="directBtn">Open</button>
        </div>
      </div>
    </div>
  `;

  const inUser    = document.getElementById('inUser');
  const inAI      = document.getElementById('inAI');
  const inWeb     = document.getElementById('inWeb');
  const previewUrl= document.getElementById('previewUrl');
  const buildBtn  = document.getElementById('buildBtn');
  const copyBtn   = document.getElementById('copyBtn');
  const directIn  = document.getElementById('directIn');
  const directBtn = document.getElementById('directBtn');

  function currentLink(){
    const u = inUser.value.trim();
    const a = inAI.value.trim();
    const w = cleanWeb(inWeb.value);
    if(!u || !a || !w) return null;
    return baseUrl() + '#' + buildHash(w, u, a);
  }

  function updatePreview(){
    const link = currentLink();
    previewUrl.textContent = link || 'Fill all fields to see your link…';
    buildBtn.disabled = !link;
  }

  [inUser, inAI, inWeb].forEach(el => el.addEventListener('input', updatePreview));
  updatePreview();

  buildBtn.addEventListener('click', () => {
    const u = inUser.value.trim();
    const a = inAI.value.trim();
    const w = cleanWeb(inWeb.value);
    if(!u || !a || !w){ toast('Please fill all fields'); return; }
    navigate(w, u, a);
  });

  copyBtn.addEventListener('click', async () => {
    const link = currentLink();
    if(!link){ toast('Fill all fields first'); return; }
    try{
      await navigator.clipboard.writeText(link);
      toast('✓ Link copied');
    }catch(e){
      const ta = document.createElement('textarea');
      ta.value = link;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      toast('✓ Link copied');
    }
  });

  directBtn.addEventListener('click', () => {
    const raw = directIn.value.trim();
    if(!raw){ toast('Paste a link first'); return; }
    handleDirect(raw);
  });
  directIn.addEventListener('keydown', e => {
    if(e.key === 'Enter') directBtn.click();
  });
  [inUser, inAI, inWeb].forEach(el => {
    el.addEventListener('keydown', e => {
      if(e.key === 'Enter') buildBtn.click();
    });
  });

  setTimeout(() => inUser.focus(), 100);
}

/* ---------- handle direct paste ---------- */
function handleDirect(raw){
  raw = raw.trim();

  if(raw.includes('#')){
    const h = raw.slice(raw.indexOf('#'));
    const r = parseHash(h);
    if(r){ navigate(r.web, r.user, r.ai); return; }
  }

  let s = raw.replace(/^https?:\/\//i, '').replace(/^#\/?/,'').replace(/^\/+/, '');

  const slashIdx = s.indexOf('/');
  if(slashIdx > 0 && /\./.test(s.slice(0, slashIdx))){
    s = s.slice(slashIdx + 1);
  }

  let r = parseHash('#' + s);
  if(r){ navigate(r.web, r.user, r.ai); return; }

  const segs = s.split('/').filter(Boolean);
  if(segs.length >= 3 && /\./.test(segs[0])){
    navigate(
      decodeURIComponent(segs[0]),
      decodeURIComponent(segs[1]),
      decodeURIComponent(segs.slice(2).join(' '))
    );
    return;
  }

  toast('Invalid link format');
}

/* ============================================================
   AI PAGE — Personalized Video Generator
============================================================ */
function renderAIPage(route){
  const { web, user, ai } = route;
  const aiInitial = (ai[0] || 'A').toUpperCase();

  document.title = `${ai} — AI Video Generator by ${user}`;

  app.innerHTML = `
    <div class="ai-page">
      <div class="ai-topbar">
        <button class="ai-back" id="aiBack" aria-label="Home" title="Create your own AI">←</button>
        <div class="ai-avatar">${esc(aiInitial)}</div>
        <div class="ai-meta">
          <div class="ai-name">${esc(ai)}</div>
          <div class="ai-by">AI by <b>${esc(user)}</b></div>
        </div>
        <a class="ai-weblink"
           href="https://${esc(web)}" target="_blank" rel="noopener noreferrer"
           title="${esc(web)}">${esc(web)}</a>
      </div>

      <div class="ai-main">
        <div class="ai-hero">
          <div class="ai-hero-orb">${esc(aiInitial)}</div>
          <div class="ai-hero-name">${esc(ai)}</div>
          <div class="ai-hero-sub">AI Video Generator by <b>${esc(user)}</b></div>
        </div>

        <form class="prompt-form" id="promptForm" autocomplete="off">
          <input id="q" type="text"
                 placeholder="Enter any prompt e.g. cute boy, funny cat…"
                 maxlength="200">
          <button id="btn" type="submit">✨ Generate Video</button>
        </form>

        <div class="chips" id="chips">
          <span class="chip">Cute boy</span>
          <span class="chip">Funny cat videos</span>
          <span class="chip">Cricket best shots</span>
          <span class="chip">Easy pasta recipe</span>
          <span class="chip">Car drifting</span>
          <span class="chip">Study motivation</span>
          <span class="chip">Tech review 2025</span>
        </div>

        <div id="stage"></div>
      </div>

      <footer class="ai-foot">
        <div class="fb">LYRA<span>MOON</span></div>
        <div class="fc">
          <a href="https://nexura.oneapp.dev/" target="_blank" rel="noopener noreferrer">
            Created by <b>MUHAMMAD TAQI</b>
          </a>
        </div>
        Powered by NEXURA
      </footer>
    </div>
  `;

  /* wire up */
  const stageEl   = document.getElementById('stage');
  const input     = document.getElementById('q');
  const btn       = document.getElementById('btn');
  const formEl    = document.getElementById('promptForm');
  const chipsEl   = document.getElementById('chips');
  const backBtn   = document.getElementById('aiBack');

  backBtn.addEventListener('click', () => { location.hash = ''; });

  formEl.addEventListener('submit', e => {
    e.preventDefault();
    run(route, stageEl, input, btn);
  });

  chipsEl.addEventListener('click', e => {
    if(e.target.classList.contains('chip')){
      input.value = e.target.textContent.trim();
      run(route, stageEl, input, btn);
    }
  });

  setTimeout(() => input.focus(), 200);
}

/* ============================================================
   VIDEO MIRRORS
============================================================ */
const INVIDIOUS = [
  'https://inv.nadeko.net',
  'https://invidious.nerdvpn.de',
  'https://yewtu.be',
  'https://invidious.f5.si',
  'https://iv.melmac.space',
  'https://invidious.privacyredirect.com',
  'https://inv.tux.pizza'
];
const PIPED = [
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.adminforge.de',
  'https://api.piped.private.coffee',
  'https://pipedapi.reallyaweso.me'
];

/* ---------- YT API loader ---------- */
let ytReadyPromise = null;
function ensureYT(){
  if(ytReadyPromise) return ytReadyPromise;
  ytReadyPromise = new Promise(resolve => {
    if(window.YT && window.YT.Player){ resolve(window.YT); return; }
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function(){
      if(typeof prev === 'function') prev();
      resolve(window.YT);
    };
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  });
  return ytReadyPromise;
}

/* ---------- helpers ---------- */
function fmtDur(sec){
  sec = Number(sec) || 0;
  if(!sec) return '--:--';
  const m = Math.floor((sec%3600)/60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2,'0')}`;
}
async function fetchJSON(url, ms=8000){
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try{
    const r = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'Accept': 'application/json' }
    });
    if(!r.ok) throw new Error('HTTP ' + r.status);
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

/* ---------- normalizers ---------- */
function normInvidious(items){
  if(!Array.isArray(items)) return [];
  return items
    .filter(i => i && i.type === 'video' && i.videoId)
    .map(i => ({
      id: i.videoId,
      title: i.title || 'Untitled',
      author: i.author || '',
      dur: Number(i.lengthSeconds) || 0
    }));
}
function normPiped(data){
  const items = data && Array.isArray(data.items) ? data.items : [];
  return items
    .filter(i => i && typeof i.url === 'string' && i.url.includes('v='))
    .map(i => {
      const id = i.url.split('v=')[1].split('&')[0];
      return {
        id,
        title: i.title || 'Untitled',
        author: i.uploaderName || '',
        dur: Number(i.duration) || 0
      };
    })
    .filter(v => v.id);
}

/* ---------- tasks ---------- */
function invTask(base, q){
  return (async () => {
    const data = await fetchJSON(
      `${base}/api/v1/search?q=${encodeURIComponent(q)}&type=video&page=1`
    );
    const list = normInvidious(data);
    if(!list.length) throw new Error('empty');
    return list;
  })();
}
function pipedTask(base, q){
  return (async () => {
    const data = await fetchJSON(
      `${base}/search?q=${encodeURIComponent(q)}&filter=videos`
    );
    const list = normPiped(data);
    if(!list.length) throw new Error('empty');
    return list;
  })();
}
async function searchAll(q){
  try{
    return await Promise.any(INVIDIOUS.map(base => invTask(base, q)));
  }catch(e){}
  try{
    return await Promise.any(PIPED.map(base => pipedTask(base, q)));
  }catch(e){}
  return [];
}

/* ---------- prompt ---------- */
function cleanPrompt(raw){
  let p = raw.trim().replace(/\s+/g,' ');
  p = p.replace(
    /^(please|plz|mujhe|muje|mere liye|i want|show me|find|dhoondo|dhundo|dekhna hai|chahiye)\s+/i, ''
  );
  p = p.replace(
    /\s+(chahiye|de do|dikhao|dikha do|batao|search karo|dhundo)$/i, ''
  );
  return p.trim() || raw.trim();
}
function withAiPrefix(prompt){
  if(/^ai\s+generated\b/i.test(prompt)) return prompt;
  return 'AI generated ' + prompt;
}

/* ---------- links ---------- */
function youtubeLink(id){
  return 'https://www.youtube.com/watch?v=' + encodeURIComponent(id);
}
function ssLink(id){
  return 'https://ssyoutube.com/watch?v=' + encodeURIComponent(id);
}
function openVidmate(id){
  const yt = youtubeLink(id);
  const ua = navigator.userAgent || '';
  const isAndroid = /Android/i.test(ua);
  if(isAndroid){
    const fallback = encodeURIComponent('https://vidmate.app/?url=' + encodeURIComponent(yt));
    window.location.href =
      'intent://www.youtube.com/watch?v=' + id +
      '#Intent;scheme=https;' +
      'package=com.tube.mate.vidmate;' +
      'S.browser_fallback_url=' + fallback + ';end';
  }else{
    window.open('https://vidmate.app/?url=' + encodeURIComponent(yt), '_blank', 'noopener');
  }
}
async function shareVideo(id, title, button){
  const videoUrl = youtubeLink(id);
  try{
    if(navigator.share){
      await navigator.share({
        title: title || 'AI Video',
        text: title || 'Watch this AI generated video',
        url: videoUrl
      });
      return;
    }
    if(navigator.clipboard && window.isSecureContext){
      await navigator.clipboard.writeText(videoUrl);
    }else{
      const ta = document.createElement('textarea');
      ta.value = videoUrl;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus(); ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    const oldText = button.innerHTML;
    button.classList.add('copied');
    button.innerHTML = '✓ Link copied';
    setTimeout(() => {
      button.classList.remove('copied');
      button.innerHTML = oldText;
    }, 1800);
  }catch(err){
    if(err && err.name === 'AbortError') return;
    console.error('Share failed:', err);
  }
}

/* ============================================================
   LOADING (15s)
============================================================ */
const GEN_STEPS = [
  'Analyzing your prompt…',
  'Building scene composition…',
  'Rendering neural frames…',
  'Upscaling to HD 9:16…',
  'Finalizing your video…'
];
let stepTimer = null;

function showLoading(stageEl, prompt){
  stageEl.innerHTML = `
    <div class="gen-panel">
      <div class="gen-orb"></div>
      <div class="gen-title">Generating your AI video…</div>
      <div class="gen-sub">"${esc(prompt)}"</div>
      <div class="gen-bar"><span></span></div>
      <div class="gen-step" id="genStep">${esc(GEN_STEPS[0])}</div>
    </div>
  `;
  const stepEl = document.getElementById('genStep');
  let idx = 0;
  clearInterval(stepTimer);
  stepTimer = setInterval(() => {
    idx++;
    if(idx >= GEN_STEPS.length){ clearInterval(stepTimer); return; }
    if(stepEl){
      stepEl.style.opacity = '0';
      setTimeout(() => {
        if(stepEl){
          stepEl.innerHTML = `<b>${esc(GEN_STEPS[idx])}</b>`;
          stepEl.style.opacity = '1';
        }
      }, 180);
    }
  }, 3000);
}

function stopLoading(){
  clearInterval(stepTimer);
  stepTimer = null;
}

/* ============================================================
   CARD
============================================================ */
let ytUidCounter = 0;

function makeCard(v){
  const el = document.createElement('div');
  el.className = 'card';
  const uid = 'yt-' + (++ytUidCounter) + '-' + Math.random().toString(36).slice(2,7);

  el.innerHTML = `
    <div class="frame">
      <div class="yt-holder" id="${uid}">
        <img class="yt-thumb"
             src="https://i.ytimg.com/vi/${encodeURIComponent(v.id)}/hqdefault.jpg"
             alt="" loading="lazy">
      </div>
      <div class="ai-badge">AI GENERATED</div>
      <div class="brand-mask-top"></div>
      <div class="brand-mask-br"></div>
      <div class="video-shield js-shield" aria-label="Play or pause"></div>
      <button type="button" class="lyra-center-play js-lyra-play"
              aria-label="Play ${esc(v.title)}" title="Play">L</button>
    </div>

    <div class="meta">
      <a class="title" target="_blank" rel="noopener noreferrer"
         href="${youtubeLink(v.id)}">${esc(v.title)}</a>
      <div class="sub">
        <span>${esc(v.author || 'YouTube')}</span>
        <span>${fmtDur(v.dur)}</span>
      </div>
      <div class="dl-row">
        <a class="dl-btn ss" target="_blank" rel="noopener noreferrer"
           href="${ssLink(v.id)}" title="Download">⬇️ Download</a>
        <button type="button" class="dl-btn vm js-vidmate"
                data-id="${esc(v.id)}" title="VidMate">📥 VidMate</button>
        <button type="button" class="share-btn js-share"
                data-id="${esc(v.id)}"
                data-title="${esc(v.title)}">↗️ Share this video</button>
      </div>
    </div>
  `;

  const holder  = el.querySelector('#' + CSS.escape(uid));
  const shield  = el.querySelector('.js-shield');
  const playBtn = el.querySelector('.js-lyra-play');

  let player = null, ready = false, creating = false;

  function createPlayer(){
    if(creating || player) return;
    creating = true;

    const thumb = holder.querySelector('.yt-thumb');
    if(thumb) thumb.remove();

    const inner = document.createElement('div');
    inner.id = uid + '-inner';
    holder.appendChild(inner);

    ensureYT().then(YT => {
      player = new YT.Player(inner.id, {
        videoId: v.id,
        playerVars: {
          autoplay: 1, controls: 0, disablekb: 1, fs: 0,
          modestbranding: 1, rel: 0, showinfo: 0,
          iv_load_policy: 3, playsinline: 1,
          cc_load_policy: 0, enablejsapi: 1,
          origin: location.origin
        },
        events: {
          onReady: (e) => {
            ready = true;
            try { e.target.playVideo(); } catch(_) {}
          },
          onStateChange: (e) => {
            if(e.data === 1) playBtn.classList.add('hidden');
            else if(e.data === 2 || e.data === 0) playBtn.classList.remove('hidden');
          }
        }
      });
    }).catch(err => {
      console.error('YT load failed:', err);
      creating = false;
    });
  }

  function togglePlay(){
    if(!player){ createPlayer(); return; }
    if(!ready) return;
    try{
      if(player.getPlayerState() === 1) player.pauseVideo();
      else player.playVideo();
    }catch(err){ console.error(err); }
  }

  shield.addEventListener('click', togglePlay);
  playBtn.addEventListener('click', e => { e.stopPropagation(); togglePlay(); });

  const vm = el.querySelector('.js-vidmate');
  if(vm) vm.addEventListener('click', e => {
    e.preventDefault();
    openVidmate(vm.dataset.id);
  });

  const share = el.querySelector('.js-share');
  if(share) share.addEventListener('click', () => {
    shareVideo(share.dataset.id, share.dataset.title, share);
  });

  return el;
}

/* ============================================================
   RENDER helpers
============================================================ */
function renderVideo(stageEl, v){
  stageEl.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'stage-wrap';
  wrap.appendChild(makeCard(v));
  stageEl.appendChild(wrap);
}

function renderFallback(stageEl, prompt){
  stageEl.innerHTML = `
    <div class="empty">
      <b>Video generate nahi ho saka.</b>
      <br>
      Public mirror servers kabhi kabhi down ho jate hain.
      <br>
      Neeche se direct YouTube par search khol sakte hain 👇
      <br>
      <a class="yt-direct" target="_blank" rel="noopener noreferrer"
         href="https://www.youtube.com/results?search_query=${encodeURIComponent(prompt + ' shorts')}">
        ▶️ YouTube par kholein
      </a>
    </div>`;
}

/* ============================================================
   MAIN RUN — single 9:16 video with 15s load
============================================================ */
const GEN_TIME = 15000;

async function run(route, stageEl, input, btn){
  const rawPrompt = input.value;
  const cleaned = cleanPrompt(rawPrompt);
  if(!cleaned){ toast('Please enter a prompt'); input.focus(); return; }

  const prompt = withAiPrefix(cleaned);

  btn.disabled = true;
  input.disabled = true;

  showLoading(stageEl, prompt);

  const startedAt = Date.now();
  let results = [];

  try{
    const [a, b] = await Promise.all([
      searchAll(prompt + ' shorts vertical'),
      searchAll(prompt)
    ]);
    const seen = new Set();
    for(const v of [...a, ...b]){
      if(v.id && !seen.has(v.id)){ seen.add(v.id); results.push(v); }
    }
  }catch(err){
    console.error('Search error:', err);
  }

  const elapsed = Date.now() - startedAt;
  const remaining = Math.max(0, GEN_TIME - elapsed);
  if(remaining) await new Promise(r => setTimeout(r, remaining));

  stopLoading();

  let chosen = results.find(v => v.dur > 0 && v.dur <= 70);
  if(!chosen) chosen = results.find(v => v.dur > 0);
  if(!chosen) chosen = results[0];

  if(chosen){
    renderVideo(stageEl, chosen);
  }else{
    renderFallback(stageEl, prompt);
  }

  btn.disabled = false;
  input.disabled = false;
}

/* ============================================================
   BOOT
============================================================ */
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', render);
}else{
  render();
}
window.addEventListener('hashchange', render);
