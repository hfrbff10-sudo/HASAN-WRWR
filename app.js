const card = document.getElementById('card');
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
let tx = 0, ty = 0, cx = 0, cy = 0, lastMove = 0;

function point(e) {
  const r = card.getBoundingClientRect();
  const px = (e.clientX - r.left) / r.width - 0.5;
  const py = (e.clientY - r.top) / r.height - 0.5;
  ty = Math.max(-1, Math.min(1, px * 2)) * 12;
  tx = Math.max(-1, Math.min(1, py * 2)) * -9;
  card.style.setProperty('--gx', (px + 0.5) * 100 + '%');
  card.style.setProperty('--gy', (py + 0.5) * 100 + '%');
  lastMove = performance.now();
}
if (!still) {
  window.addEventListener('pointermove', point, { passive: true });
  (function frame(t) {
    if (t - lastMove > 1800) {           // idle: the card sways on its own
      ty = Math.sin(t / 1700) * 9;
      tx = Math.cos(t / 2300) * 4;
    }
    cx += (tx - cx) * 0.08;
    cy += (ty - cy) * 0.08;
    card.style.setProperty('--rx', cx.toFixed(2) + 'deg');
    card.style.setProperty('--ry', cy.toFixed(2) + 'deg');
    requestAnimationFrame(frame);
  })(0);
}

// background: glowing dust flying toward the viewer in 3D
(function () {
  const c = document.getElementById('sky'), g = c.getContext('2d');
  let w, h, pts = [];
  const N = 110, D = 900;
  function size() {
    const r = Math.min(devicePixelRatio || 1, 2);
    w = innerWidth; h = innerHeight;
    c.width = w * r; c.height = h * r; g.setTransform(r, 0, 0, r, 0, 0);
  }
  function seed(p, far) {
    p.x = (Math.random() - .5) * 1600; p.y = (Math.random() - .5) * 1600;
    p.z = far ? D : Math.random() * D; p.s = Math.random() * 1.6 + .6;
    p.c = ['#f0c66a', '#fff1c9', '#5a8cff'][Math.floor(Math.random() * 3)];
  }
  function draw(move) {
    g.clearRect(0, 0, w, h);
    for (const p of pts) {
      if (move) { p.z -= 1.1; if (p.z < 1) seed(p, true); }
      const k = 420 / p.z, x = w / 2 + p.x * k, y = h / 2 + p.y * k;
      if (x < -20 || x > w + 20 || y < -20 || y > h + 20) { if (move) seed(p, true); continue; }
      g.globalAlpha = Math.min(1, (1 - p.z / D) * 1.2) * .8;
      g.fillStyle = p.c;
      g.beginPath(); g.arc(x, y, p.s * k * .6 + .4, 0, 6.283); g.fill();
    }
  }
  size(); addEventListener('resize', size);
  for (let i = 0; i < N; i++) { const p = {}; seed(p, false); pts.push(p); }
  if (still) draw(false);
  else (function loop() { draw(true); requestAnimationFrame(loop); })();
})();

// language
const T = {
  ar: { on: 'متاح الآن', off: 'غير متاح حالياً', link: 'تم نسخ رابط البطاقة', nolink: 'انسخ الرابط من شريط العنوان', shareTitle: 'بطاقة حسن أسعد', copied: 'تم النسخ', saved: 'تم تنزيل جهة الاتصال، افتحها واحفظها', nosave: 'الحفظ يشتغل من رابط الصفحة المباشر. الرقم: 07707368351' },
  en: { on: 'Available now', off: 'Not available right now', link: 'Card link copied', nolink: 'Copy the link from the address bar', shareTitle: 'Hasan Asaad', copied: 'Copied', saved: 'Contact downloaded. Open it to save.', nosave: 'Saving works from the direct page link. Number: 07707368351' }
};
const langBtn = document.getElementById('lang');
function setLang(l) {
  LANG = l;
  document.documentElement.lang = l;
  document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-ar]').forEach(el => { el.textContent = el.dataset[l]; });
  langBtn.textContent = l === 'ar' ? 'EN' : 'ع';
  document.getElementById('introName').textContent = l === 'ar' ? 'حسن أسعد' : 'Hasan Asaad';
  document.getElementById('note').textContent = '';
  if (typeof showStatus === 'function') showStatus();
  try { localStorage.setItem('card-lang', l); } catch (e) {}
}
setLang(LANG);
langBtn.addEventListener('click', () => setLang(LANG === 'ar' ? 'en' : 'ar'));

// live clock, always Baghdad time
function showClock() {
  let t;
  try {
    t = new Intl.DateTimeFormat(LANG === 'ar' ? 'ar-IQ-u-nu-latn' : 'en-US', { timeZone: 'Asia/Baghdad', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).format(new Date());
  } catch (e) {
    t = new Date(Date.now() + 3 * 3600 * 1000).toISOString().slice(11, 19);
  }
  document.getElementById('clock').textContent = t;
}
showClock();
setInterval(showClock, 1000);

// availability: Sunday to Thursday, by Baghdad time (UTC+3)
function showStatus() {
  const day = new Date(Date.now() + 3 * 3600 * 1000).getUTCDay(); // 0 = Sunday
  const on = day <= 4;
  document.getElementById('status').classList.toggle('on', on);
  document.getElementById('statusText').textContent = T[LANG][on ? 'on' : 'off'];
}
showStatus();
setInterval(showStatus, 60000);

// share the card: system share sheet where it exists, otherwise copy the link
document.getElementById('share').addEventListener('click', async () => {
  const note = document.getElementById('note');
  const url = location.href.split('#')[0];
  try {
    if (navigator.share) { await navigator.share({ title: T[LANG].shareTitle, url }); return; }
    await navigator.clipboard.writeText(url);
    note.textContent = T[LANG].link;
  } catch (e) {
    if (e && e.name === 'AbortError') return;
    try { await navigator.clipboard.writeText(url); note.textContent = T[LANG].link; }
    catch (e2) { note.textContent = T[LANG].nolink; }
  }
});

// intro: tap to skip
const intro = document.getElementById('intro');
intro.addEventListener('click', () => intro.classList.add('skip'));

// soft click sound on every button and link
let actx;
function tick() {
  try { if (navigator.vibrate) navigator.vibrate(12); } catch (e) {}
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    const t = actx.currentTime, o = actx.createOscillator(), g = actx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(1150, t);
    o.frequency.exponentialRampToValueAtTime(520, t + 0.07);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.11, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
    o.connect(g).connect(actx.destination);
    o.start(t); o.stop(t + 0.12);
  } catch (e) {}
}
document.querySelectorAll('a.row, .row.phone a, button').forEach(el => el.addEventListener('pointerdown', tick));

// visit counter (free Abacus counting service); stays hidden if the service can't be reached
(function () {
  const key = 'hfrbff10-sudo.github.io/hasan-wrwr';
  let seen = false;
  try { seen = sessionStorage.getItem('card-seen') === '1'; } catch (e) {}
  fetch('https://abacus.jasoncameron.dev/' + (seen ? 'get/' : 'hit/') + key)
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(d => {
      if (typeof d.value !== 'number') return;
      document.getElementById('vnum').textContent = d.value.toLocaleString('en');
      document.getElementById('visits').hidden = false;
      try { sessionStorage.setItem('card-seen', '1'); } catch (e) {}
    })
    .catch(() => {});
})();

// copy number
const btn = document.getElementById('copy');
btn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText('07707368351');
    btn.textContent = T[LANG].copied;
  } catch (e) {
    btn.textContent = '07707368351';
  }
  setTimeout(() => { btn.textContent = btn.dataset[LANG]; }, 2000);
});

// save contact as a vCard file
document.getElementById('save').addEventListener('click', () => {
  const note = document.getElementById('note');
  const vcf = [
    'BEGIN:VCARD', 'VERSION:3.0',
    'N;CHARSET=UTF-8:أسعد;حسن;;;', 'FN;CHARSET=UTF-8:حسن أسعد',
    'TEL;TYPE=CELL:+9647707368351',
    'URL:https://www.instagram.com/7_hsssp',
    'END:VCARD'
  ].join('\r\n');
  try {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([vcf], { type: 'text/vcard;charset=utf-8' }));
    a.download = 'Hasan-Asaad.vcf';
    document.body.appendChild(a); a.click(); a.remove();
    note.textContent = T[LANG].saved;
  } catch (e) {
    note.textContent = T[LANG].nosave;
  }
});
