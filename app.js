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
bindColor('titleColor', '--title-color');
bindColor('dividerColor', '--divider-color');

function applyTitleHidden(){
  const hide = !!hideTitleEl?.checked;

  titleEl?.classList.toggle('isHidden', hide);

  const dividerEl = document.getElementById('titleDivider');
  dividerEl?.classList.toggle('isHidden', hide);

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

const yearEl = document.getElementById('year');
const monthEl = document.getElementById('month');

/* ===== Ranges UI: dynamic add/remove (max 5) ===== */
const MAX_RANGES = 5;
const rangesPanel = document.getElementById('rangesPanel');
const addRangeBtn = document.getElementById('addRangeBtn');
const removeRangeBtn = document.getElementById('removeRangeBtn');

const RANGE_PALETTE = ['#deee85', '#b8e076', '#ffa743', '#97a0ff', '#ff7aa2'];

function buildRangeItem(index, init){

  const enabled = init?.enabled ?? true;
  const start = init?.start ?? 1;
  const end = init?.end ?? 5;
  const color = init?.color ?? RANGE_PALETTE[index % RANGE_PALETTE.length];

  const wrap = document.createElement('div');
  wrap.className = 'rngItem';
  wrap.dataset.i = String(index);

  const inline = document.createElement('div');
  inline.className = 'inline';

  // 胶囊：启用 + 颜色
  const pillLabel = document.createElement('label');
  pillLabel.className = 'check';
  pillLabel.style.margin = '0';

  const enableInput = document.createElement('input');
  enableInput.type = 'checkbox';
  enableInput.className = 'rngEnable';
  enableInput.checked = !!enabled;

  const pillText = document.createElement('span');
  pillText.textContent = `第${index + 1}组`;

  const colorInput = document.createElement('input');
  colorInput.type = 'color';
  colorInput.className = 'rngColor';
  colorInput.value = color;
  colorInput.style.verticalAlign = 'middle';
  colorInput.style.marginLeft = '8px';
  colorInput.style.transform = 'translateY(1px)';

  pillLabel.appendChild(enableInput);
  pillLabel.appendChild(pillText);
  pillLabel.appendChild(colorInput);

  // 起止
  const startLabel = document.createElement('label');
  startLabel.textContent = '开始日期';
  const startInput = document.createElement('input');
  startInput.type = 'number';
  startInput.className = 'rngStart';
  startInput.min = '1';
  startInput.max = '31';
  startInput.value = String(start);
  startLabel.appendChild(startInput);

  const endLabel = document.createElement('label');
  endLabel.textContent = '结束日期';
  const endInput = document.createElement('input');
  endInput.type = 'number';
  endInput.className = 'rngEnd';
  endInput.min = '1';
  endInput.max = '31';
  endInput.value = String(end);
  endLabel.appendChild(endInput);

  inline.appendChild(pillLabel);
  inline.appendChild(startLabel);
  inline.appendChild(endLabel);

  wrap.appendChild(inline);
  return wrap;
}



function getRangeCount(){
  return rangesPanel ? rangesPanel.querySelectorAll('.rngItem').length : 0;
}

function reindexRanges(){
  if (!rangesPanel) return;
  const items = [...rangesPanel.querySelectorAll('.rngItem')];
  items.forEach((item, idx) => {
    item.dataset.i = String(idx);
    const colorLabel = item.querySelector('label:last-child');
   
  });
}

function suggestNextRange(){
  const y = +yearEl.value;
  const m = +monthEl.value;
  const dim = new Date(y, m, 0).getDate();

  const items = [...rangesPanel.querySelectorAll('.rngItem')];
  if (items.length === 0) return { start: 1, end: Math.min(5, dim) };

  const last = items[items.length - 1];
  const lastEnd = +last.querySelector('.rngEnd')?.value || 1;
  const start = clamp(lastEnd + 1, 1, dim);
  const end = clamp(start + 4, 1, dim);
  return { start, end };
}

function addRange(){
  if (!rangesPanel) return;
  const n = getRangeCount();
  if (n >= MAX_RANGES){
    alert('最多只能添加5个日程安排！');
    return;
  }
  const sug = suggestNextRange();
  const item = buildRangeItem(n, {
    enabled: true,
    start: sug.start,
    end: sug.end,
    color: RANGE_PALETTE[n % RANGE_PALETTE.length],
  });
  rangesPanel.appendChild(item);
  reindexRanges();
  applyRanges();
}

function removeRange(){
  if (!rangesPanel) return;
  const items = rangesPanel.querySelectorAll('.rngItem');
  if (items.length <= 1) return; 
  items[items.length - 1].remove();
  reindexRanges();
  applyRanges();
}

addRangeBtn?.addEventListener('click', addRange);
removeRangeBtn?.addEventListener('click', removeRange);

rangesPanel?.addEventListener('input', () => applyRanges());
rangesPanel?.addEventListener('change', () => applyRanges());

/* ===== Range highlight logic (pill) ===== */
function clearCellRanges(){
  dateGrid?.querySelectorAll('.cell[data-day]').forEach(c => {
    c.classList.remove('rng', 'start', 'end', 'single');
    c.style.removeProperty('--rng-bg');
  });
}

function readRangesFromDOM(){
  if (!rangesPanel) return [];
  const items = [...rangesPanel.querySelectorAll('.rngItem')];

  return items.map((item, idx) => {
    const enabled = !!item.querySelector('.rngEnable')?.checked;
    const start = +item.querySelector('.rngStart')?.value || 1;
    const end = +item.querySelector('.rngEnd')?.value || 1;
    const color = item.querySelector('.rngColor')?.value || RANGE_PALETTE[idx % RANGE_PALETTE.length];
    return { enabled, start, end, color, idx };
  });
}

function applyRanges(){
  if (!dateGrid) return;

  clearCellRanges();

  const y = +yearEl.value;
  const m = +monthEl.value;
  const daysInMonth = new Date(y, m, 0).getDate();

  const ranges = readRangesFromDOM();

  // 后面的组覆盖前面的组：按顺序画，后画的覆盖
  for (const r of ranges){
    if (!r.enabled) continue;

    let a = clamp(r.start, 1, daysInMonth);
    let b = clamp(r.end, 1, daysInMonth);
    if (a > b) [a, b] = [b, a];

    const byRow = new Map(); // row -> [{cell, col}]
    for (let d = a; d <= b; d++){
      const cell = dateGrid.querySelector(`.cell[data-day="${d}"]`);
      if (!cell) continue;

      const row = +cell.dataset.row;
      const col = +cell.dataset.col;

      if (!byRow.has(row)) byRow.set(row, []);
      byRow.get(row).push({ cell, col });
    }

    for (const [, arr] of byRow){
      arr.sort((x, y) => x.col - y.col);

      let segStart = 0;
      for (let i = 0; i <= arr.length; i++){
        const isBreak =
          i === arr.length ||
          (i > 0 && arr[i].col !== arr[i - 1].col + 1);

        if (!isBreak) continue;

        const seg = arr.slice(segStart, i);

        if (seg.length === 1){
          const c = seg[0].cell;
          c.classList.add('rng', 'single');
          c.style.setProperty('--rng-bg', r.color);
        } else if (seg.length > 1){
          seg.forEach(x => {
            x.cell.classList.add('rng');
            x.cell.style.setProperty('--rng-bg', r.color);
          });
          seg[0].cell.classList.add('start');
          seg[seg.length - 1].cell.classList.add('end');
        }

        segStart = i;
      }
    }
  }
}

function renderMonth(year, month){
  wdGrid.innerHTML = '';
  dateGrid.innerHTML = '';

  if (titleEl){
    titleEl.textContent = MONTH_CN[month - 1] ?? `${month}月`;
  }

  const lang = wdLangEl?.value ?? 'en';
  const labels = (lang === 'zh') ? WEEKDAYS_ZH : WEEKDAYS_EN;

  for (const w of labels){
    const d = document.createElement('div');
    d.className = 'wd';
    d.textContent = w;
    wdGrid.appendChild(d);
  }

  const firstDow = new Date(year, month - 1, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month, 0).getDate();

  for (let i = 0; i < firstDow; i++){
    const c = document.createElement('div');
    c.className = 'cell blank';
    dateGrid.appendChild(c);
  }

  for (let d = 1; d <= daysInMonth; d++){
    const idx = firstDow + (d - 1);
    const col = idx % 7;
    const row = Math.floor(idx / 7);

    const isWeekend = (col === 0 || col === 6);

    const c = document.createElement('div');
    c.className = 'cell' + (isWeekend ? ' weekend' : '');
    c.dataset.day = String(d);
    c.dataset.col = String(col);
    c.dataset.row = String(row);

    const t = document.createElement('div');
    t.className = 'dt';
    t.textContent = String(d);

    c.appendChild(t);
    dateGrid.appendChild(c);
  }

  // 月份更新后：限制 input max，并重算色带
  const dim = daysInMonth;
  rangesPanel?.querySelectorAll('.rngStart, .rngEnd').forEach(inp => inp.max = String(dim));
  applyRanges();
}

document.getElementById('renderBtn')?.addEventListener('click', () => {
  renderMonth(+yearEl.value, +monthEl.value);
});

wdLangEl?.addEventListener('change', () => {
  renderMonth(+yearEl.value, +monthEl.value);
});

/* ===== Buttons ===== */
document.getElementById('resetBtn')?.addEventListener('click', () => location.reload());

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

// 默认 1 组
if (rangesPanel && getRangeCount() === 0){
  const y = +yearEl.value;
  const m = +monthEl.value;
  const dim = new Date(y, m, 0).getDate();
  rangesPanel.appendChild(buildRangeItem(0, {
    enabled: true,
    start: 1,
    end: Math.min(7, dim),
    color: RANGE_PALETTE[0],
  }));
  reindexRanges();
}

renderMonth(+yearEl.value, +monthEl.value);
updateValueDisplays();
applyRanges();
