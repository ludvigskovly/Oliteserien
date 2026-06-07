const DATE_FORMAT = new Intl.DateTimeFormat("no-NO", { day: "2-digit", month: "2-digit", year: "numeric" });
const SHORT_DATE = new Intl.DateTimeFormat("no-NO", { day: "2-digit", month: "2-digit" });

const state = {
  rows: [],
  source: "",
};

const $ = (selector) => document.querySelector(selector);
const PLAYER_META = {
  "Aleks": {
    fullName: "Aleks",
    nickname: "Aleks",
    preferredBeer: "Hansa Pilsner",
    image: "./aleks.jpg",
    role: "Øliteserien spiller",
  },
  "Jøgge": {
    fullName: "Jøgge",
    nickname: "Jøgge",
    preferredBeer: "Hansa Pilsner",
    image: "./jogge.jpg",
    role: "Formspiller",
  },
  "Stegane": {
    fullName: "Stegane",
    nickname: "Stegane",
    preferredBeer: "Hansa Premium",
    image: "./stegane.jpg",
    role: "Power ranking-profil",
  },
  "Augen": {
    fullName: "Augen",
    nickname: "Augen",
    preferredBeer: "Tuborg Lite Mango Passion",
    image: "./augen.jpg",
    role: "Tabelljeger",
  },
  "Knut": {
    fullName: "Knut",
    nickname: "Knut",
    preferredBeer: "Hansa Pilsner",
    image: "./knut.jpg",
    role: "Øliteserien spiller",
  },
  "Ivar": {
    fullName: "Ivar",
    nickname: "Ivar",
    preferredBeer: "Hansa Pilsner",
    image: "./ivar.jpg",
    role: "Øliteserien spiller",
  },
  "Siggen": {
    fullName: "Siggen",
    nickname: "Siggen",
    preferredBeer: "Hansa Pilsner",
    image: "./siggen.jpg",
    role: "Øliteserien spiller",
  },
  "Kal": {
    fullName: "Kal",
    nickname: "Kal",
    preferredBeer: "Hansa Pilsner",
    image: "./kal.jpg",
    role: "Øliteserien spiller",
  },
  "Kiffen": {
    fullName: "Kiffen",
    nickname: "Kiffen",
    preferredBeer: "Mythos",
    image: "./kiffen.jpg",
    role: "Øliteserien spiller",
  },
  "Jens": {
    fullName: "Jens",
    nickname: "Jens",
    preferredBeer: "Birra Moretti",
    image: "./jens.jpg",
    role: "Øliteserien spiller",
  },
  "Hegre": {
    fullName: "Hegre",
    nickname: "Hegre",
    preferredBeer: "Hansa Pilsner",
    image: "./hegre.jpg",
    role: "Øliteserien spiller",
  },
  "Sindre": {
    fullName: "Sindre",
    nickname: "Sindre",
    preferredBeer: "Schous Pilsner",
    image: "./sindre.jpg",
    role: "Øliteserien spiller",
  },
  "Nikolai": {
    fullName: "Nikolai",
    nickname: "Nikolai",
    preferredBeer: "Hansa Pilsner",
    image: "./nikolai.jpg",
    role: "Øliteserien spiller",
  },
  "Madslien": {
    fullName: "Madslien",
    nickname: "Madslien",
    preferredBeer: "Hansa Pilsner",
    image: "./madslien.jpg",
    role: "Øliteserien spiller",
  },
  "Espen": {
    fullName: "Espen",
    nickname: "Espen",
    preferredBeer: "Isbjørn Lite",
    image: "./espen.jpg",
    role: "Maskinrating-profil",
  },
  "Elling": {
    fullName: "Elling",
    nickname: "Elling",
    preferredBeer: "Hansa Pilsner",
    image: "./elling.jpg",
    role: "Øliteserien spiller",
  },
  "Alf": {
    fullName: "Alf",
    nickname: "Alf",
    preferredBeer: "Hansa Pilsner",
    image: "./alf.jpg",
    role: "Øliteserien spiller",
  },
  "Ludde": {
    fullName: "Ludde",
    nickname: "Ludde",
    preferredBeer: "Hansa Pilsner",
    image: "./ludde.jpg",
    role: "PR-spesialist",
  },
  "Tage": {
    fullName: "Tage",
    nickname: "Tage",
    preferredBeer: "Kuli Eple",
    image: "./tage.jpg",
    role: "Øliteserien spiller",
  },
};
const COLORS = [
  "#f6c85f", "#6dd3ce", "#ff6b6b", "#8fd694", "#b388ff", "#ff9f1c", "#4dabf7",
  "#f06595", "#94d82d", "#ffd43b", "#63e6be", "#c0eb75", "#a5d8ff", "#ffa8a8",
  "#d0bfff", "#ffc078", "#91a7ff", "#e599f7", "#66d9e8",
];

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (quoted) {
      if (char === '"' && next === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function parseNumber(value) {
  if (typeof value !== "string") return Number(value) || 0;
  const normalized = value.replace(/\s/g, "").replace(",", ".");
  const number = Number(normalized);
  return Number.isFinite(number) ? number : 0;
}

function parseDate(value) {
  const text = String(value || "").trim();
  let match = text.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (match) return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));

  match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));

  match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) return new Date(Number(match[3]), Number(match[1]) - 1, Number(match[2]));

  const serial = Number(text);
  if (Number.isFinite(serial) && serial > 30000) {
    return new Date((serial - 25569) * 86400 * 1000);
  }

  return null;
}

function sameOrBeforeToday(date) {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return date <= today;
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function pct(value) {
  return `${Math.round(value * 1000) / 10}%`;
}

function formatNumber(value) {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function text(value) {
  return String(value || "").trim();
}

function escapeHtml(value) {
  return text(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function cell(rows, row, column) {
  return text(rows[row]?.[column]);
}

function tableFromColumns(rows, title, headerRow, columns, startRow, endRow, options = {}) {
  const headers = columns.map((column) => cell(rows, headerRow, column));
  const body = [];

  for (let row = startRow; row <= endRow; row += 1) {
    const values = columns.map((column) => cell(rows, row, column));
    if (values.some(Boolean)) body.push(values);
  }

  return {
    type: "table",
    title,
    description: options.description || "",
    notes: options.notes || [],
    headers,
    rows: options.limit ? body.slice(0, options.limit) : body,
  };
}

function valueCard(title, value, description = "") {
  return { type: "value", title, value, description };
}

function buildSheetSections(rows) {
  return [
    {
      title: cell(rows, 172, 5),
      items: [
        tableFromColumns(rows, cell(rows, 172, 5), 174, [5, 6, 8, 9, 10, 11, 12], 175, 193),
        {
          type: "notes",
          title: cell(rows, 172, 16),
          notes: [cell(rows, 174, 16), cell(rows, 177, 16), cell(rows, 179, 16), cell(rows, 182, 16), cell(rows, 185, 16), cell(rows, 190, 16)].filter(Boolean),
        },
      ],
    },
    {
      title: cell(rows, 196, 0),
      items: [
        tableFromColumns(rows, cell(rows, 198, 0), 200, [0, 1, 3], 201, 219),
        tableFromColumns(rows, cell(rows, 198, 4), 200, [4, 5, 7], 201, 219),
        tableFromColumns(rows, "The Clutch Factor", 200, [11, 12], 201, 219, { description: cell(rows, 200, 9) }),
        tableFromColumns(rows, "The Tap-In Merchant", 200, [17, 18], 201, 219, { description: cell(rows, 200, 15) }),
      ],
    },
    {
      title: cell(rows, 220, 0),
      items: [
        tableFromColumns(rows, "Ligatotal (antall pils)", 222, [0, 1, 2], 223, 263),
        tableFromColumns(rows, "League Carry (%)", 250, [17, 18], 226, 244, { description: cell(rows, 223, 17) }),
        tableFromColumns(rows, "Social Influence", 250, [17, 18], 251, 269, { description: cell(rows, 247, 17) }),
        tableFromColumns(rows, cell(rows, 252, 11), 257, [11, 12, 13, 14], 258, 267, { description: cell(rows, 253, 11) }),
        tableFromColumns(rows, cell(rows, 228, 11), 229, [11, 12, 14, 15], 230, 248),
        tableFromColumns(rows, cell(rows, 228, 6), 229, [6, 7, 9], 230, 230),
        tableFromColumns(rows, cell(rows, 234, 6), 235, [6, 7, 9], 236, 236),
        tableFromColumns(rows, cell(rows, 240, 6), 241, [6, 8], 242, 242),
        tableFromColumns(rows, cell(rows, 246, 6), 247, [6, 8], 248, 248),
        tableFromColumns(rows, cell(rows, 252, 6), 253, [6, 8], 254, 254),
        tableFromColumns(rows, cell(rows, 258, 6), 259, [6, 8], 260, 260),
        valueCard(cell(rows, 264, 6), cell(rows, 267, 6), cell(rows, 265, 6)),
      ],
    },
    {
      title: cell(rows, 270, 0),
      description: cell(rows, 272, 5),
      notes: [cell(rows, 275, 5), cell(rows, 275, 8), cell(rows, 278, 5), `${cell(rows, 280, 5)} ${cell(rows, 280, 8)} ${cell(rows, 280, 10)}`].filter(Boolean),
      items: [
        tableFromColumns(rows, cell(rows, 270, 0), 283, [6, 7], 285, 303),
      ],
    },
    {
      title: cell(rows, 309, 0),
      notes: [cell(rows, 311, 0), cell(rows, 314, 0), cell(rows, 317, 0), cell(rows, 318, 0), cell(rows, 319, 0), cell(rows, 320, 0), cell(rows, 321, 0), cell(rows, 322, 0), cell(rows, 323, 0)].filter(Boolean),
      items: [
        tableFromColumns(rows, cell(rows, 311, 2), 311, [2, 3, 4, 6], 312, 330),
        tableFromColumns(rows, cell(rows, 311, 8), 311, [8, 9], 312, 330),
        tableFromColumns(rows, cell(rows, 311, 11), 311, [11, 12], 312, 330),
        tableFromColumns(rows, cell(rows, 311, 14), 311, [14, 15], 312, 330),
        tableFromColumns(rows, cell(rows, 311, 17), 311, [17, 18], 312, 330),
      ],
    },
    {
      title: cell(rows, 331, 0),
      description: cell(rows, 333, 5),
      notes: [cell(rows, 335, 5), cell(rows, 335, 7), cell(rows, 335, 9), cell(rows, 339, 5), cell(rows, 339, 7), cell(rows, 339, 9)].filter(Boolean),
      items: [
        tableFromColumns(rows, cell(rows, 331, 0), 344, [5, 7, 9], 345, 363),
      ],
    },
  ].filter((section) => section.title);
}

function buildModel(rows) {
  const headerIndex = rows.findIndex((row) => String(row[0]).trim().toLowerCase() === "dato");
  if (headerIndex < 0) {
    throw new Error("Fant ikke datatabellen i CSV-en");
  }

  const names = rows[headerIndex].slice(1, 20);
  const sheetMachineRatings = readSheetMachineRatings(rows);
  const totalIndex = rows.findIndex((row, index) => index > headerIndex && String(row[0]).trim().toLowerCase() === "totalt");
  const endIndex = totalIndex > headerIndex ? totalIndex : headerIndex + 75;
  const dataRows = rows.slice(headerIndex + 1, endIndex).filter((row) => parseDate(row[0]));
  const days = dataRows.map((row) => ({
    date: parseDate(row[0]),
    values: row.slice(1, 20).map(parseNumber),
  })).filter((day) => day.date && day.values.length === names.length);

  if (!days.length) {
    throw new Error("Fant ingen datoer i CSV-en");
  }

  const activeDays = days.filter((day) => sameOrBeforeToday(day.date));
  const totals = names.map((name, index) => {
    const values = days.map((day) => day.values[index] || 0);
    const activeValues = activeDays.map((day) => day.values[index] || 0);
    const drinkingDays = activeValues.filter((value) => value > 0).length;
    const total = sum(values);
    const pr = Math.max(0, ...values);
    const average = drinkingDays ? sum(activeValues) / drinkingDays : 0;
    const last7 = activeDays.slice(-7).map((day) => day.values[index] || 0);
    const previous7 = activeDays.slice(-14, -7).map((day) => day.values[index] || 0);
    const last7Total = sum(last7);
    const previous7Total = sum(previous7);
    const formRatio = previous7Total > 0 ? last7Total / previous7Total : last7Total > 0 ? 2 : 0;
    const streak = currentStreak(activeDays, index);
    const bestStreak = longestStreak(activeDays, index);

    return {
      name,
      index,
      total,
      pr,
      drinkingDays,
      sleepDays: activeDays.length - drinkingDays,
      average,
      last7Total,
      previous7Total,
      formRatio,
      momentum: last7Total - previous7Total,
      streak,
      bestStreak,
      machineRating: sheetMachineRatings[name] ?? null,
    };
  });

  const league = totals.slice().sort((a, b) => b.total - a.total || b.pr - a.pr || a.name.localeCompare(b.name, "no"));
  const latest = days.filter((day) => sum(day.values) > 0).at(-1);
  const totalBeer = sum(totals.map((player) => player.total));
  const weeks = buildWeeks(days, names);
  const totwCounts = buildTotwCounts(weeks, names);
  applyTotwCounts(totals, totwCounts);
  const duos = buildDuos(activeDays, names);
  const xp = buildXp(days, names, latest?.date || new Date());
  const cumulative = buildCumulative(days, names);

  const sheetSections = buildSheetSections(rows);

  return { names, days, activeDays, totals, league, latest, totalBeer, weeks, duos, xp, cumulative, sheetSections };
}

function readSheetMachineRatings(rows) {
  const headerIndex = rows.findIndex((row) => (
    row.some((cell) => String(cell).trim().toLowerCase() === "navn") &&
    row.some((cell) => String(cell).trim().toLowerCase() === "maskinrating")
  ));
  if (headerIndex < 0) return {};

  const header = rows[headerIndex];
  const nameIndex = header.findIndex((cell) => String(cell).trim().toLowerCase() === "navn");
  const ratingIndex = header.findIndex((cell) => String(cell).trim().toLowerCase() === "maskinrating");
  const ratings = {};

  for (let index = headerIndex + 1; index < rows.length; index += 1) {
    const row = rows[index];
    const name = String(row[nameIndex] || "").trim();
    if (!name) continue;
    if (name.toLowerCase() === "league stats") break;

    const rawRating = String(row[ratingIndex] || "").trim();
    if (!rawRating || rawRating === "#N/A") continue;
    ratings[name] = parseNumber(rawRating);
  }

  return ratings;
}

function buildTotwCounts(weeks, names) {
  const counts = Object.fromEntries(names.map((name) => [name, 0]));
  for (const week of weeks) {
    for (const entry of week.entries) {
      counts[entry.name] += 1;
    }
  }
  return counts;
}

function applyTotwCounts(players, totwCounts) {
  for (const player of players) {
    player.totw = totwCounts[player.name] || 0;
  }
}

function currentStreak(days, index) {
  let count = 0;
  for (let i = days.length - 1; i >= 0; i -= 1) {
    if ((days[i].values[index] || 0) <= 0) break;
    count += 1;
  }
  return count;
}

function longestStreak(days, index) {
  let best = 0;
  let current = 0;
  for (const day of days) {
    if ((day.values[index] || 0) > 0) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  }
  return best;
}

function buildWeeks(days, names) {
  const first = days[0]?.date;
  const last = days.at(-1)?.date;
  if (!first) return [];

  const weeks = [];
  for (let cursor = new Date(first); cursor <= last; cursor.setDate(cursor.getDate() + 7)) {
    const start = new Date(cursor);
    const end = new Date(cursor);
    end.setDate(end.getDate() + 6);
    if (end > last) end.setTime(last.getTime());

    const weekDays = days.filter((day) => day.date >= start && day.date <= end);
    const entries = names.map((name, index) => {
      const values = weekDays.map((day) => day.values[index] || 0);
      return {
        name,
        total: sum(values),
        pr: Math.max(0, ...values),
      };
    }).filter((entry) => entry.total > 0);

    entries.sort((a, b) => b.total - a.total || b.pr - a.pr || a.name.localeCompare(b.name, "no"));
    weeks.push({ start, end, total: sum(entries.map((entry) => entry.total)), entries: entries.slice(0, 3) });
  }

  return weeks;
}

function buildDuos(activeDays, names) {
  const duos = [];

  for (let first = 0; first < names.length; first += 1) {
    for (let second = first + 1; second < names.length; second += 1) {
      const shared = activeDays.filter((day) => day.values[first] > 0 && day.values[second] > 0);
      const firstTotal = sum(shared.map((day) => day.values[first]));
      const secondTotal = sum(shared.map((day) => day.values[second]));

      if (!shared.length) continue;

      duos.push({
        broder1: firstTotal >= secondTotal ? names[first] : names[second],
        broder2: firstTotal >= secondTotal ? names[second] : names[first],
        days: shared.length,
        total: firstTotal + secondTotal,
      });
    }
  }

  return duos.sort((a, b) => b.days - a.days || b.total - a.total || a.broder1.localeCompare(b.broder1, "no")).slice(0, 10);
}

function buildXp(days, names, date) {
  const weekday = date.getDay() === 0 ? 7 : date.getDay();

  return names.map((name, index) => {
    const values = days.map((day) => ({ date: day.date, value: day.values[index] || 0 }));
    const positive = values.filter((item) => item.value > 0);
    const totalAverage = positive.length ? sum(positive.map((item) => item.value)) / positive.length : 0;
    const weekdayValues = values.filter((item) => {
      const day = item.date.getDay() === 0 ? 7 : item.date.getDay();
      return item.value > 0 && day === weekday;
    });
    const weekdayAverage = weekdayValues.length ? sum(weekdayValues.map((item) => item.value)) / weekdayValues.length : totalAverage;
    const recent = values.filter((item) => item.value > 0 && item.date >= addDays(date, -6) && item.date <= date);
    const prior = values.filter((item) => item.value > 0 && item.date >= addDays(date, -13) && item.date <= addDays(date, -7));
    const recentAverage = recent.length ? sum(recent.map((item) => item.value)) / recent.length : totalAverage;
    const priorAverage = prior.length ? sum(prior.map((item) => item.value)) / prior.length : totalAverage;
    const form = priorAverage ? Math.min(2, Math.max(0.5, recentAverage / priorAverage)) : 1;
    return { name, xp: Math.round(weekdayAverage * (1 + 0.35 * (form - 1)) * 100) / 100 };
  }).sort((a, b) => b.xp - a.xp || a.name.localeCompare(b.name, "no"));
}

function buildCumulative(days, names) {
  const running = names.map(() => 0);
  return days.map((day) => {
    day.values.forEach((value, index) => {
      running[index] += value || 0;
    });
    return { date: day.date, values: running.slice() };
  });
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function renderMetric(label, value, className = "") {
  return `<div class="metric ${className}"><span>${label}</span><strong>${value}</strong></div>`;
}

function renderRank(items, target, valueKey, formatter = (value) => value) {
  const max = Math.max(1, ...items.map((item) => item[valueKey]));
  $(target).innerHTML = items.slice(0, 8).map((item) => `
    <div class="rank">
      <b>${item.name}</b>
      <strong>${formatter(item[valueKey], item)}</strong>
      <div class="bar"><span style="width:${Math.max(4, (item[valueKey] / max) * 100)}%"></span></div>
    </div>
  `).join("");
}

function playerStat(label, value, description, className = "") {
  return `
    <div class="player-stat has-tooltip ${className}" title="${escapeHtml(description)}" data-tooltip="${escapeHtml(description)}">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `;
}

function render(model) {
  $("#source").textContent = state.source;
  $("#updated").textContent = `Oppdatert ${new Date().toLocaleTimeString("no-NO", { hour: "2-digit", minute: "2-digit" })}`;
  $("#range").textContent = `${DATE_FORMAT.format(model.days[0].date)} - ${DATE_FORMAT.format(model.days.at(-1).date)}`;

  $("#metrics").innerHTML = renderMetric("TOTAL BEER COUNT (ØLITESERIEN)", formatNumber(model.totalBeer), "league-total");

  renderMarket(model);
  renderPlayers(model);
  renderCumulativeChart(model);
  renderSheetStats(model);

  $("#totw-list").innerHTML = model.weeks.map((week) => `
    <div class="week">
      <div class="week-head">
        <span>${SHORT_DATE.format(week.start)} - ${SHORT_DATE.format(week.end)}</span>
        <span>${formatNumber(week.total)} pils</span>
      </div>
      ${week.entries.length ? week.entries.map((entry, index) => `
        <div class="totw-row">
          <span class="position">${index + 1}</span>
          <b>${entry.name}</b>
          <span>${formatNumber(entry.total)}</span>
        </div>
      `).join("") : `<div class="totw-row"><span class="position">-</span><b>Ikke spilt</b><span>0</span></div>`}
    </div>
  `).join("");

  renderRank(model.totals.slice().sort((a, b) => b.drinkingDays - a.drinkingDays || b.total - a.total), "#drinking-days", "drinkingDays", (value, item) => `${value} (${pct(value / Math.max(1, model.activeDays.length))})`);
  renderRank(model.totals.slice().sort((a, b) => b.sleepDays - a.sleepDays || a.total - b.total), "#sleep-days", "sleepDays", (value, item) => `${value} (${pct(value / Math.max(1, model.activeDays.length))})`);
  renderRank(model.xp, "#xp-list", "xp", (value) => value.toFixed(2));
  renderRank(model.totals.slice().sort((a, b) => b.pr - a.pr || b.total - a.total), "#pr-list", "pr", formatNumber);
  renderRank(model.totals.slice().sort((a, b) => b.total - a.total), "#carry-list", "total", (value) => pct(value / Math.max(1, model.totalBeer)));
  renderRank(model.totals.slice().sort((a, b) => b.bestStreak - a.bestStreak || b.drinkingDays - a.drinkingDays), "#streak-list", "bestStreak", (value, item) => `${value} / nå ${item.streak}`);

  $("#duo-table").innerHTML = model.duos.map((duo) => `
    <tr>
      <td><strong>${duo.broder1}</strong></td>
      <td>${duo.broder2}</td>
      <td>${duo.days}</td>
    </tr>
  `).join("");

  const dayTotals = model.activeDays.map((day) => ({ date: day.date, total: sum(day.values), drinkers: day.values.filter((value) => value > 0).length }));
  const bestDay = dayTotals.slice().sort((a, b) => b.total - a.total)[0];
  const worstDay = dayTotals.slice().sort((a, b) => a.total - b.total)[0];
  const bestWeek = model.weeks.slice().filter((week) => week.total > 0).sort((a, b) => b.total - a.total)[0];
  const worstWeek = model.weeks.slice().filter((week) => week.total > 0).sort((a, b) => a.total - b.total)[0];

  $("#league-stats").innerHTML = [
    ["Beste dag", bestDay ? `${DATE_FORMAT.format(bestDay.date)} (${bestDay.total})` : "-"],
    ["Verste dag", worstDay ? `${DATE_FORMAT.format(worstDay.date)} (${worstDay.total})` : "-"],
    ["Beste uke", bestWeek ? `${SHORT_DATE.format(bestWeek.start)} - ${SHORT_DATE.format(bestWeek.end)} (${formatNumber(bestWeek.total)})` : "-"],
    ["Verste uke", worstWeek ? `${SHORT_DATE.format(worstWeek.start)} - ${SHORT_DATE.format(worstWeek.end)} (${formatNumber(worstWeek.total)})` : "-"],
    ["Mest aktive dag", bestDay ? `${DATE_FORMAT.format(dayTotals.slice().sort((a, b) => b.drinkers - a.drinkers || b.total - a.total)[0].date)} (${dayTotals.slice().sort((a, b) => b.drinkers - a.drinkers || b.total - a.total)[0].drinkers})` : "-"],
    ["Snitt per aktiv dag", formatNumber(model.totalBeer / Math.max(1, dayTotals.filter((day) => day.total > 0).length))],
  ].map(([label, value]) => `<div class="stat-line"><span>${label}</span><strong>${value}</strong></div>`).join("");
}

function renderPlayers(model) {
  const maxTotal = Math.max(1, ...model.league.map((player) => player.total));
  $("#player-view").innerHTML = model.league.map((player, rankIndex) => {
    const meta = PLAYER_META[player.name] || {};
    const displayName = meta.fullName || player.name;
    const nickname = meta.nickname || player.name;
    const carry = player.total / Math.max(1, model.totalBeer);
    const formLabel = player.formRatio >= 1.5 ? "Sterk" : player.formRatio >= 1 ? "Stabil" : player.formRatio > 0 ? "Rolig" : "Ukjent";
    const initials = player.name.slice(0, 2).toUpperCase();
    const image = meta.image
      ? `<img class="player-photo" src="${meta.image}" alt="${displayName}" />`
      : `<div class="player-initials">${initials}</div>`;

    return `
      <article class="player-card">
        <div class="player-media">
          ${image}
          <div class="player-rank rank-${rankIndex + 1}">#${rankIndex + 1}</div>
        </div>
        <div class="player-body">
          <div class="player-kicker">${meta.role || "Øliteserien spiller"}</div>
          <h3>${displayName}</h3>
          <p class="player-alias">${nickname}${meta.preferredBeer ? ` · ${meta.preferredBeer}` : ""}</p>
          <div class="player-meter">
            <span style="width:${Math.max(4, (player.total / maxTotal) * 100)}%"></span>
          </div>
          <div class="player-stats">
            ${playerStat("Maskinrating", player.machineRating ?? "-", "Sammensatt rating fra regnearket basert på total, snitt, PR, TOTW og form.", "machine-rating")}
            ${playerStat("Total", formatNumber(player.total), "Totalt antall pils registrert for spilleren.")}
            ${playerStat("PR", formatNumber(player.pr), "Personlig rekord: høyeste antall pils spilleren har registrert på én dag.")}
            ${playerStat("Form", formLabel, "Form viser om spilleren har drukket mer eller mindre de siste 7 dagene sammenlignet med perioden før.")}
            ${playerStat("TOTW", player.totw, "Antall ganger spilleren har vært på Team of the Week.")}
            ${playerStat("League Carry", pct(carry), "Andel av ligaens totale pils som spilleren står for.")}
            ${playerStat("Drikkedager", player.drinkingDays, "Antall dager spilleren har registrert minst én pils.")}
            ${playerStat("Snitt", formatNumber(player.average), "Gjennomsnittlig antall pils på dagene spilleren faktisk har drukket.")}
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function renderMarket(model) {
  $("#market-watch").innerHTML = [
    {
      title: "LIGATABELL",
      headers: ["#", "Navn", "Pils"],
      rows: model.league.map((player, index) => [`${index + 1}.`, player.name, formatNumber(player.total)]),
    },
    {
      title: "PR (Personlig Rekord)",
      headers: ["#", "Navn", "Pils"],
      rows: model.totals
        .slice()
        .sort((a, b) => b.pr - a.pr || b.total - a.total || a.name.localeCompare(b.name, "no"))
        .map((player, index) => [`${index + 1}.`, player.name, formatNumber(player.pr)]),
    },
  ].map(renderMiniTable).join("");
}

function renderMiniTable(table) {
  return `
    <div class="sheet-card compact sheet-table-card">
      <h4>${escapeHtml(table.title)}</h4>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>${table.headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${table.rows.map((row, index) => `<tr class="${index < 3 ? `podium podium-${index + 1}` : ""}">${row.map((value) => `<td>${escapeHtml(value)}</td>`).join("")}</tr>`).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function numericCellValue(value) {
  const normalized = text(value).replace(/\s/g, "").replace(",", ".");
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function isFormColumn(header) {
  return text(header).trim().toLowerCase() === "form";
}

function isMaskinratingTable(item) {
  return item.type === "table" && text(item.title).trim().toUpperCase() === "MASKINRATING";
}

function maxColumnsForTable(item) {
  const maxByColumn = item.headers.map(() => null);

  item.rows.forEach((row) => {
    row.forEach((value, columnIndex) => {
      if (columnIndex === 0 || isFormColumn(item.headers[columnIndex])) return;
      const numeric = numericCellValue(value);
      if (numeric === null) return;
      maxByColumn[columnIndex] = maxByColumn[columnIndex] === null ? numeric : Math.max(maxByColumn[columnIndex], numeric);
    });
  });

  return maxByColumn;
}

function renderSheetItem(item) {
  if (item.type === "value") {
    return `
      <article class="sheet-card value-card">
        <h4>${escapeHtml(item.title)}</h4>
        ${item.description ? `<p>${escapeHtml(item.description)}</p>` : ""}
        <strong>${escapeHtml(item.value)}</strong>
      </article>
    `;
  }

  if (item.type === "notes") {
    return `
      <article class="sheet-card notes-card">
        <h4>${escapeHtml(item.title)}</h4>
        ${item.notes.map((note) => `<p>${escapeHtml(note)}</p>`).join("")}
      </article>
    `;
  }

  const isMachineTable = isMaskinratingTable(item);
  const maxByColumn = isMachineTable ? maxColumnsForTable(item) : [];
  const cardClass = isMachineTable ? " machine-sheet-card" : "";

  return `
    <article class="sheet-card${cardClass}">
      <h4>${escapeHtml(item.title)}</h4>
      ${item.description ? `<p>${escapeHtml(item.description)}</p>` : ""}
      <div class="table-wrap">
        <table>
          <thead>
            <tr>${item.headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${item.rows.map((row) => `
              <tr>${row.map((value, columnIndex) => {
                const numeric = numericCellValue(value);
                const isTopValue = isMachineTable
                  && numeric !== null
                  && maxByColumn[columnIndex] === numeric
                  && !isFormColumn(item.headers[columnIndex]);
                return `<td class="${isTopValue ? "stat-top-value" : ""}">${escapeHtml(value)}</td>`;
              }).join("")}</tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </article>
  `;
}

function renderSheetStats(model) {
  const target = $("#sheet-stats-content");
  if (!target) return;

  target.innerHTML = model.sheetSections.map((section) => `
    <section class="sheet-section">
      <div class="sheet-section-head">
        <h3>${escapeHtml(section.title)}</h3>
        ${section.description ? `<p>${escapeHtml(section.description)}</p>` : ""}
        ${(section.notes || []).map((note) => `<p>${escapeHtml(note)}</p>`).join("")}
      </div>
      <div class="sheet-card-grid">
        ${section.items.map(renderSheetItem).join("")}
      </div>
    </section>
  `).join("");
}

function renderCumulativeChart(model) {
  const width = 1120;
  const height = 420;
  const pad = { top: 24, right: 140, bottom: 42, left: 50 };
  const plotWidth = width - pad.left - pad.right;
  const plotHeight = height - pad.top - pad.bottom;
  const maxY = Math.max(1, ...model.cumulative.flatMap((day) => day.values));
  const maxX = Math.max(1, model.cumulative.length - 1);
  const topPlayers = model.league.slice(0, 10).map((player) => player.index);
  const x = (dayIndex) => pad.left + (dayIndex / maxX) * plotWidth;
  const y = (value) => pad.top + plotHeight - (value / maxY) * plotHeight;
  const grid = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
    const value = maxY * ratio;
    return `
      <line x1="${pad.left}" x2="${width - pad.right}" y1="${y(value)}" y2="${y(value)}" class="grid-line" />
      <text x="${pad.left - 12}" y="${y(value) + 4}" class="axis-label" text-anchor="end">${formatNumber(value)}</text>
    `;
  }).join("");

  const paths = topPlayers.map((playerIndex, seriesIndex) => {
    const points = model.cumulative.map((day, dayIndex) => `${x(dayIndex)},${y(day.values[playerIndex] || 0)}`).join(" ");
    const last = model.cumulative.at(-1);
    const lastValue = last.values[playerIndex] || 0;
    const color = COLORS[seriesIndex % COLORS.length];
    return `
      <polyline points="${points}" fill="none" stroke="${color}" stroke-width="${seriesIndex < 4 ? 3 : 1.8}" stroke-linecap="round" stroke-linejoin="round" />
      <circle cx="${x(maxX)}" cy="${y(lastValue)}" r="3.5" fill="${color}" />
      <text x="${width - pad.right + 12}" y="${y(lastValue) + 4}" class="legend-label" fill="${color}">${model.names[playerIndex]} ${formatNumber(lastValue)}</text>
    `;
  }).join("");

  const firstDate = model.days[0]?.date;
  const lastDate = model.days.at(-1)?.date;

  $("#cumulative-chart").innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Kumulativ pils per person">
      <rect x="0" y="0" width="${width}" height="${height}" rx="0" class="chart-bg" />
      ${grid}
      <line x1="${pad.left}" x2="${width - pad.right}" y1="${pad.top + plotHeight}" y2="${pad.top + plotHeight}" class="axis-line" />
      <text x="${pad.left}" y="${height - 14}" class="axis-label">${SHORT_DATE.format(firstDate)}</text>
      <text x="${width - pad.right}" y="${height - 14}" class="axis-label" text-anchor="end">${SHORT_DATE.format(lastDate)}</text>
      ${paths}
    </svg>
  `;
}

async function load() {
  try {
    $("#refresh").disabled = true;
    const isLocal = ["localhost", "127.0.0.1", ""].includes(window.location.hostname);
    const payload = isLocal ? (window.__SHEET_PAYLOAD__ || {}) : {};
    if (payload.error) throw new Error(payload.error);
    if (!payload.csv && typeof fetch === "function") {
      const response = await fetch("/api/sheet");
      Object.assign(payload, await response.json());
      if (!response.ok) throw new Error(payload.error || "Kunne ikke hente data");
    }
    if (!payload.csv) throw new Error("Mangler regnearkdata");
    state.rows = parseCsv(payload.csv);
    state.source = payload.warning ? `${payload.source} (${payload.warning})` : payload.source;
    render(buildModel(state.rows));
  } catch (error) {
    document.querySelector("main").insertAdjacentHTML("afterbegin", `<div class="error">${error.message}</div>`);
  } finally {
    $("#refresh").disabled = false;
  }
}

$("#refresh").addEventListener("click", load);
load();
