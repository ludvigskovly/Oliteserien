const DATE_FORMAT = new Intl.DateTimeFormat("no-NO", { day: "2-digit", month: "2-digit", year: "numeric" });
const SHORT_DATE = new Intl.DateTimeFormat("no-NO", { day: "2-digit", month: "2-digit" });

const state = {
  rows: [],
  source: "",
};

const $ = (selector) => document.querySelector(selector);
const PLAYER_META = {
  "Jøgge": {
    fullName: "Jørgen",
    nickname: "Jøgge",
    preferredBeer: "Hansa pilsner",
    image: "./jogge.jpg",
    role: "Formspiller",
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

  return { names, days, activeDays, totals, league, latest, totalBeer, weeks, duos, xp, cumulative };
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

function renderMetric(label, value) {
  return `<div class="metric"><span>${label}</span><strong>${value}</strong></div>`;
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

function render(model) {
  $("#source").textContent = state.source;
  $("#updated").textContent = `Oppdatert ${new Date().toLocaleTimeString("no-NO", { hour: "2-digit", minute: "2-digit" })}`;
  $("#range").textContent = `${DATE_FORMAT.format(model.days[0].date)} - ${DATE_FORMAT.format(model.days.at(-1).date)}`;

  $("#metrics").innerHTML = [
    renderMetric("Totalt pils", formatNumber(model.totalBeer)),
    renderMetric("Leder", model.league[0]?.name || "-"),
    renderMetric("Siste pilsdag", model.latest ? DATE_FORMAT.format(model.latest.date) : "-"),
    renderMetric("Aktive dager", model.activeDays.filter((day) => sum(day.values) > 0).length),
  ].join("");

  renderMarket(model);
  renderPlayers(model);
  renderCumulativeChart(model);

  $("#league-table").innerHTML = model.league.map((player, index) => `
    <tr>
      <td>${index + 1}.</td>
      <td><strong>${player.name}</strong></td>
      <td>${formatNumber(player.total)}</td>
      <td>${formatNumber(player.pr)}</td>
    </tr>
  `).join("");

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
          <div class="player-rank">#${rankIndex + 1}</div>
        </div>
        <div class="player-body">
          <div class="player-kicker">${meta.role || "Øliteserien spiller"}</div>
          <h3>${displayName}</h3>
          <p class="player-alias">${nickname}${meta.preferredBeer ? ` · ${meta.preferredBeer}` : ""}</p>
          <div class="player-meter">
            <span style="width:${Math.max(4, (player.total / maxTotal) * 100)}%"></span>
          </div>
          <div class="player-stats">
            <div class="machine-rating"><span>Maskinrating</span><strong>${player.machineRating ?? "-"}</strong></div>
            <div><span>Total</span><strong>${formatNumber(player.total)}</strong></div>
            <div><span>PR</span><strong>${formatNumber(player.pr)}</strong></div>
            <div><span>Form</span><strong>${formLabel}</strong></div>
            <div><span>TOTW</span><strong>${player.totw}</strong></div>
            <div><span>Carry</span><strong>${pct(carry)}</strong></div>
            <div><span>Drikkedager</span><strong>${player.drinkingDays}</strong></div>
            <div><span>Snitt</span><strong>${formatNumber(player.average)}</strong></div>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function renderMarket(model) {
  const leader = model.league[0];
  const chaser = model.league[1];
  const hottest = model.totals.slice().sort((a, b) => b.last7Total - a.last7Total || b.total - a.total)[0];
  const biggestMover = model.totals.slice().sort((a, b) => b.momentum - a.momentum || b.last7Total - a.last7Total)[0];

  $("#market-watch").innerHTML = [
    ["Leder", leader?.name || "-", leader ? `${formatNumber(leader.total)} pils` : "-"],
    ["Avstand", leader && chaser ? `${formatNumber(leader.total - chaser.total)} til ${chaser.name}` : "-", "til andreplass"],
    ["Siste 7 dager", hottest?.name || "-", hottest ? `${formatNumber(hottest.last7Total)} pils` : "-"],
    ["Momentum", biggestMover?.name || "-", biggestMover ? `${biggestMover.momentum >= 0 ? "+" : ""}${formatNumber(biggestMover.momentum)}` : "-"],
  ].map(([label, main, sub]) => `
    <div class="ticker-card">
      <span>${label}</span>
      <strong>${main}</strong>
      <small>${sub}</small>
    </div>
  `).join("");

  $("#power-index").innerHTML = model.league.slice(0, 6).map((player, index) => `
    <div class="stat-line">
      <span>${index + 1}. ${player.name}</span>
      <strong>MR ${player.machineRating ?? "-"} / ${formatNumber(player.total)}</strong>
    </div>
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
