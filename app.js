const root = document.documentElement;

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const setVar = (k, v) => root.style.setProperty(k, v);
const getVar = (k) => getComputedStyle(root).getPropertyValue(k).trim();

const setPx = (k, px) => setVar(k, `${px}px`);
const setNum = (k, n) => setVar(k, String(n));

const getPx = (k) => {
  const v = parseFloat(getVar(k));
  return Number.isFinite(v) ? v : 0;
};

function computeScale(){
  const w = getPx('--card-w');
  const h = getPx('--card-h');
  const base = 320;
  const s = clamp(Math.min(w, h) / base, 0.25, 2.5);
  setVar('--scale', String(s));
  updateValueDisplays();
}

function actualPx(baseNum){
  const s = parseFloat(getVar('--scale')) || 1;
  return Math.round((+baseNum || 0) * s);
}

function updateValueDisplays(){
  const cardWEl = document.getElementById('cardW');
  const cardHEl = document.getElementById('cardH');

  if (cardWEl) document.getElementById('cardWVal').textContent = `${cardWEl.value}px`;
  if (cardHEl) document.getElementById('cardHVal').textContent = `${cardHEl.value}px`;

  const titleSizeEl = document.getElementById('titleSize');
  const wdSizeEl = document.getElementById('wdSize');
  const dtSizeEl = document.getElementById('dtSize');

  if (titleSizeEl) document.getElementById('titleSizeVal').textContent = `${actualPx(titleSizeEl.value)}px`;
  if (wdSizeEl) document.getElementById('wdSizeVal').textContent = `${actualPx(wdSizeEl.value)}px`;
  if (dtSizeEl) document.getElementById('dtSizeVal').textContent = `${actualPx(dtSizeEl.value)}px`;
}

function bindRangePx(id, cssVar, min, max){
  const el = document.getElementById(id);
  if (!el) return;

  if (min != null) el.min = String(min);
  if (max != null) el.max = String(max);

  const apply = () => setPx(cssVar, +el.value);

  el.addEventListener('input', () => {
    apply();
    updateValueDisplays();
    if (cssVar === '--card-w' || cssVar === '--card-h') computeScale();
  });

  apply();
}

function bindRangeNum(id, cssVar){
  const el = document.getElementById(id);
  if (!el) return;

  const apply = () => setNum(cssVar, +el.value);

  el.addEventListener('input', () => {
    apply();
    updateValueDisplays();
  });

  apply();
}

function bindColor(id, cssVar){
  const el = document.getElementById(id);
  if (!el) return;

  const apply = () => setVar(cssVar, el.value);
  el.addEventListener('input', apply);
  apply();
}

function bindSelect(id, cssVar){
  const el = document.getElementById(id);
  if (!el) return;

  const apply = () => setVar(cssVar, el.value);
  el.addEventListener('change', () => {
    apply();
    updateValueDisplays();
  });
  apply();
}

/* ===== Card ===== */
bindRangePx('cardW', '--card-w', 200, 400);
bindRangePx('cardH', '--card-h', 200, 400);

const bgInput = document.getElementById('cardBg');
if (bgInput){
  bgInput.addEventListener('input', () => {
    if (!document.getElementById('transparentBg')?.checked) {
      setVar('--card-bg', bgInput.value);
    }
  });
  setVar('--card-bg', bgInput.value);
}

const cardEl = document.getElementById('calendarCard');
const transparentEl = document.getElementById('transparentBg');

function applyTransparency(){
  const isT = !!transparentEl?.checked;
  cardEl?.classList.toggle('isTransparent', isT);

  if (bgInput){
    bgInput.disabled = isT;
    setVar('--card-bg', isT ? 'transparent' : bgInput.value);
  }
}

transparentEl?.addEventListener('change', applyTransparency);
applyTransparency();

/* ===== Title ===== */
const titleEl = document.getElementById('monthTitle');
const hideTitleEl = document.getElementById('hideTitle');
const titleFontEl = document.getElementById('titleFont');
const titleSizeEl = document.getElementById('titleSize');
const titleAlignEl = document.getElementById('titleAlign');

bindSelect('titleFont', '--title-font');
bindRangeNum('titleSize', '--title-size');
bindSelect('titleAlign', '--title-align');

function applyTitleHidden(){
  const hide = !!hideTitleEl?.checked;
  titleEl?.classList.toggle('isHidden', hide);

  if (titleFontEl) titleFontEl.disabled = hide;
  if (titleSizeEl) titleSizeEl.disabled = hide;
  if (titleAlignEl) titleAlignEl.disabled = hide;

  updateValueDisplays();
}

hideTitleEl?.addEventListener('change', applyTitleHidden);
applyTitleHidden();

/* ===== Weekday & Date ===== */
bindSelect('wdFont', '--wd-font');
bindRangeNum('wdSize', '--wd-size');
bindColor('wdColor', '--wd-color');

bindSelect('dtFont', '--dt-font');
bindRangeNum('dtSize', '--dt-size');
bindColor('dtColor', '--dt-color');
bindColor('dtWeekendColor', '--dt-weekend-color');

/* ===== Render month ===== */
const wdLangEl = document.getElementById('wdLang');
const wdGrid = document.getElementById('wdGrid');
const dateGrid = document.getElementById('dateGrid');

const WEEKDAYS_EN = ['S','M','T','W','T','F','S'];
const WEEKDAYS_ZH = ['日','一','二','三','四','五','六'];
const MONTH_CN = ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'];

function renderMonth(year, month){
  wdGrid.innerHTML = '';
  dateGrid.innerHTML = '';

  if (titleEl){
    titleEl.textContent = MONTH_CN[month - 1] ?? `${month}月`;
  }

  const lang = wdLangEl?.value ?? 'zh';
  const labels = (lang === 'en') ? WEEKDAYS_EN : WEEKDAYS_ZH;

  for (const w of labels){
    const d = document.createElement('div');
    d.className = 'wd';
    d.textContent = w;
    wdGrid.appendChild(d);
  }

  const firstDow = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  for (let i = 0; i < firstDow; i++){
    const c = document.createElement('div');
    c.className = 'cell blank';
    dateGrid.appendChild(c);
  }

  for (let d = 1; d <= daysInMonth; d++){
    const dow = (firstDow + (d - 1)) % 7;
    const isWeekend = (dow === 0 || dow === 6);

    const c = document.createElement('div');
    c.className = 'cell' + (isWeekend ? ' weekend' : '');

    const t = document.createElement('div');
    t.className = 'dt';
    t.textContent = String(d);

    c.appendChild(t);
    dateGrid.appendChild(c);
  }
}

const yearEl = document.getElementById('year');
const monthEl = document.getElementById('month');

document.getElementById('renderBtn')?.addEventListener('click', () => {
  renderMonth(+yearEl.value, +monthEl.value);
});

wdLangEl?.addEventListener('change', () => {
  renderMonth(+yearEl.value, +monthEl.value);
});

/* ===== Buttons ===== */
document.getElementById('resetBtn')?.addEventListener('click', () => location.reload());

document.getElementById('copyCssBtn')?.addEventListener('click', async (e) => {
  const btn = e.currentTarget;
  const styles = getComputedStyle(root);

  const vars = [
    '--card-w','--card-h','--card-bg','--card-pad','--card-radius',
    '--title-font','--title-size','--title-color','--title-align',
    '--wd-font','--wd-size','--wd-color',
    '--dt-font','--dt-size','--dt-color','--dt-weekend-color',
    '--scale',
  ];

  const text =
    `:root{\n` +
    vars.map(k => `  ${k}: ${styles.getPropertyValue(k).trim()};`).join('\n') +
    `\n}`;

  await navigator.clipboard.writeText(text);

  btn.textContent = '已复制';
  setTimeout(() => (btn.textContent = '复制 CSS'), 900);
});

/* ===== Export PNG ===== */
const nextFrame = () => new Promise(requestAnimationFrame);

async function waitFonts(){
  if (document.fonts && document.fonts.ready) await document.fonts.ready;
  await nextFrame();
}

document.getElementById('exportPngBtn')?.addEventListener('click', async (e) => {
  const btn = e.currentTarget;
  if (!cardEl) return;

  btn.disabled = true;
  const old = btn.textContent;
  btn.textContent = '导出中…';

  try{
    document.querySelector('.preview')?.scrollTo({ top: 0, left: 0 });
    await waitFonts();

    const canvas = await html2canvas(cardEl, {
      backgroundColor: null,
      scale: 2,
      useCORS: true
    });

    const m = String(monthEl.value).padStart(2, '0');
    const link = document.createElement('a');
    link.download = `calendar-${m}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } finally {
    btn.disabled = false;
    btn.textContent = old;
  }
});

/* init */
computeScale();
renderMonth(+yearEl.value, +monthEl.value);
updateValueDisplays();
