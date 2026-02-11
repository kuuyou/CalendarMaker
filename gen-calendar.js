// gen-calendar.js
// 用法：node gen-calendar.js 2026 3
// 输出：calendar-2026-03.png

const fs = require("fs");
const path = require("path");
const { createCanvas, registerFont } = require("canvas");

// ===== 注册字体（按你的配置）=====
registerFont(path.join(__dirname, "fonts/乐米惠圆体.ttf"), {
  family: "MyLemihuiFont",
});
registerFont(path.join(__dirname, "fonts/BoutiqueBitmap9x9_1.6.ttf"), {
  family: "MyPixieFont",
});
registerFont(path.join(__dirname, "fonts/YDWaosagi.otf"), {
  family: "MyAosagiFont",
});

// ===== 小工具 =====
function pad2(n) {
  return String(n).padStart(2, "0");
}
function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate(); // month: 1-12
}
// 周一为一周第一天：Mon=0 ... Sun=6
function firstWeekdayMon0(year, month) {
  const d = new Date(year, month - 1, 1);
  const wd = d.getDay(); // 0=Sun..6=Sat
  return (wd + 6) % 7;
}
function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawCalendar(year, month, opts = {}) {
  // ===== 你可以在这里调视觉参数 =====
  const {
    width = 500,
    height = 400,
    padding = 20,
    radius = 20,
    showTitle = false, // 想隐藏标题就改成 false
    outFile = `calendar-${year}-${pad2(month)}.png`,
  } = opts;

  // ===== 配色配置：星期行 / 日期行 分开 =====
  const COLORS = {
    cardBg: "#ffffff",

    title: "#111111",

    // 星期行颜色（独立）
    week: {
      weekday: "#111110",
      weekend: "#111110",
    },

    // 日期数字颜色（独立）
    day: {
      weekday: "#795a48",
      weekend: "#6b2e2b",
    },
  };

  // 周末判断（周一为第一天：index 0..6 对应 一..日）
  const isWeekendCol = (colIndex) => colIndex >= 5; // 5=六, 6=日

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // 透明背景 PNG（想要纯白底就改成 fillRect 白色）
  ctx.clearRect(0, 0, width, height);

  // 圆角矩形卡片底
  roundRectPath(ctx, 0, 0, width, height, radius);
  ctx.fillStyle = COLORS.cardBg;
  ctx.fill();

  // 标题
  const titleH = showTitle ? 40 : 10; // 不显示标题就给很小高度
  if (showTitle) {
    const title = `${year}-${pad2(month)}`;
    ctx.fillStyle = COLORS.title;
    ctx.font = "700 22px MyLemihuiFont"; // 标题字体
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(title, padding, padding);
  }

  // 星期（汉字 一~日）
  const week = ["一", "二", "三", "四", "五", "六", "日"];

  // 布局：标题区 + 星期行 + 日期区（6 行）
  const weekH = 50;

  const gridTop = padding + titleH + weekH;
  const gridLeft = padding;
  const gridRight = width - padding;
  const gridBottom = height - padding;
  const gridW = gridRight - gridLeft;
  const gridH = gridBottom - gridTop;

  const cols = 7;
  const rows = 6;
  const cellW = gridW / cols;
  const cellH = gridH / rows;

  // ===== 星期行（只负责星期颜色）=====
  ctx.font = "700 20px MyLemihuiFont";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const weekY = padding + titleH + weekH / 2;

  for (let c = 0; c < cols; c++) {
    const x = gridLeft + c * cellW + cellW / 2;
    ctx.fillStyle = isWeekendCol(c) ? COLORS.week.weekend : COLORS.week.weekday;
    ctx.fillText(week[c], x, weekY);
  }

  // ===== 日期数字（只负责日期颜色）=====
  const totalDays = daysInMonth(year, month);
  const startIndex = firstWeekdayMon0(year, month);

  ctx.font = "700 20px MyLemihuiFont";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let day = 1; day <= totalDays; day++) {
    const idx = startIndex + (day - 1);
    const r = Math.floor(idx / 7);
    const c = idx % 7;

    const cx = gridLeft + c * cellW + cellW / 2;
    const cy = gridTop + r * cellH + cellH / 2;

    ctx.fillStyle = isWeekendCol(c) ? COLORS.day.weekend : COLORS.day.weekday;
    ctx.fillText(String(day), cx, cy);
  }

  fs.writeFileSync(outFile, canvas.toBuffer("image/png"));
  console.log("生成完成：", outFile);
}

function main() {
  const [y, m] = process.argv.slice(2).map(Number);
  if (!y || !m || m < 1 || m > 12) {
    console.log("用法：node gen-calendar.js <year> <month>");
    console.log("例：  node gen-calendar.js 2026 3");
    process.exit(1);
  }
  drawCalendar(y, m);
}

main();
