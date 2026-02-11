const root = document.documentElement;

const bind = (id, cssVar, format = v => v) => {
  const el = document.getElementById(id);
  if (!el) return null;

  const apply = () => root.style.setProperty(cssVar, format(el.value));
  el.addEventListener('input', apply);
  apply();
  return el;
};

// ===== Card =====
bind('cardW', '--card-w', v => `${v}px`);
bind('cardH', '--card-h', v => `${v}px`);
bind('cardBg', '--card-bg');
bind('cardPad', '--card-pad', v => `${v}px`);
bind('cardMargin', '--card-margin', v => `${v}px`);
bind('cardRadius', '--card-radius', v => `${v}px`);

bind('shadowA', '--shadow-a');
bind('shadowBlur', '--shadow-blur', v => `${v}px`);
bind('shadowY', '--shadow-y', v => `${v}px`);

// ===== Grid =====
bind('gridGap', '--grid-gap', v => `${v}px`);
bind('cellRadius', '--cell-radius', v => `${v}px`);
bind('cellPadY', '--cell-pad-y', v => `${v}px`);

// ===== Weekday =====
bind('wdFont', '--wd-font');
bind('wdSize', '--wd-size', v => `${v}px`);
bind('wdColor', '--wd-color');
bind('wdLine', '--wd-line');

// ===== Date =====
bind('dtFont', '--dt-font');
bind('dtSize', '--dt-size', v => `${v}px`);
bind('dtColor', '--dt-color');
bind('dtLine', '--dt-line');

// ===== Render month =====
const grid = document.getElementById('grid');
const title = document.getElementById('monthTitle');

const WEEKDAYS = ['SUN','MON','TUE','WED','THU','FRI','SAT'];

function pad2(n){ return String(n).padStart(2,'0'); }

function renderMonth(year, month){
  // month: 1-12
  grid.innerHTML = '';
  title.textContent = `${year}-${pad2(month)}`;

  // weekday header
  for (const w of WEEKDAYS){
    const d = document.createElement('div');
    d.className = 'wd';
    d.textContent = w;
    grid.appendChild(d);
  }

  const firstDow = new Date(year, month - 1, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month, 0).getDate();

  // blanks before day 1
  for (let i = 0; i < firstDow; i++){
    const c = document.createElement('div');
    c.className = 'cell blank';
    grid.appendChild(c);
  }

  // days
  for (let d = 1; d <= daysInMonth; d++){
    const c = document.createElement('div');
    c.className = 'cell';

    const t = document.createElement('div');
    t.className = 'dt';
    t.textContent = String(d);

    c.appendChild(t);
    grid.appendChild(c);
  }
}

const yearEl = document.getElementById('year');
const monthEl = document.getElementById('month');
document.getElementById('renderBtn')?.addEventListener('click', () => {
  renderMonth(+yearEl.value, +monthEl.value);
});

// ===== Buttons =====
document.getElementById('resetBtn')?.addEventListener('click', () => location.reload());

document.getElementById('copyCssBtn')?.addEventListener('click', async (e) => {
  const btn = e.currentTarget;
  const styles = getComputedStyle(root);
  const vars = [
    '--card-w','--card-h','--card-bg','--card-pad','--card-margin','--card-radius',
    '--shadow-a','--shadow-blur','--shadow-y',
    '--grid-gap','--cell-radius','--cell-pad-y',
    '--wd-font','--wd-size','--wd-color','--wd-line',
    '--dt-font','--dt-size','--dt-color','--dt-line',
  ];
  const text = `:root{\n` + vars.map(k => `  ${k}: ${styles.getPropertyValue(k).trim()};`).join('\n') + `\n}`;
  await navigator.clipboard.writeText(text);

  btn.textContent = '已复制';
  setTimeout(() => (btn.textContent = '复制 CSS'), 900);
});

// ===== Export PNG (wait fonts) =====
const nextFrame = () => new Promise(requestAnimationFrame);

async function waitFonts(){
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }
  await nextFrame(); // ensure reflow after font swap
}

document.getElementById('exportPngBtn')?.addEventListener('click', async (e) => {
  const btn = e.currentTarget;
  const card = document.getElementById('calendarCard');
  if (!card) return;

  btn.disabled = true;
  const old = btn.textContent;
  btn.textContent = '导出中…';

  try{
    await waitFonts();

    const canvas = await html2canvas(card, {
      backgroundColor: null,
      scale: 2,
      useCORS: true
    });

    const link = document.createElement('a');
    link.download = `calendar-${yearEl.value}-${pad2(monthEl.value)}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } finally {
    btn.disabled = false;
    btn.textContent = old;
  }
});

// initial
renderMonth(+yearEl.value, +monthEl.value);
