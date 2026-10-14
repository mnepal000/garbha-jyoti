// Shubh Muhurta engine for GarbhaJyoti: auspicious birth timing (planned/C-section window).
// Pure JS, no dependencies. Astronomy uses well-known low-precision algorithms
// (Schlyter-style Sun/Moon, Lahiri ayanamsa approximation). Results are APPROXIMATE:
// tithi/nakshatra boundaries are typically within about an hour. Not a substitute
// for a qualified jyotishi, and never a reason to delay medically needed care.
(function () {
"use strict";

var RAD = Math.PI / 180, DEG = 180 / Math.PI;
function norm(d) { d %= 360; return d < 0 ? d + 360 : d; }
function clampDay(h) { return h; }

// ---------- Julian day (UTC) ----------
function jdUTC(y, mo, d, h, mi, s) {
  if (mo <= 2) { y -= 1; mo += 12; }
  var A = Math.floor(y / 100), B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (mo + 1)) + d + B - 1524.5 +
    ((h || 0) + (mi || 0) / 60 + (s || 0) / 3600) / 24;
}

// ---------- Sun (tropical longitude, low precision) ----------
function sunPos(jd) {
  var d = jd - 2451543.5;
  var w = 282.9404 + 4.70935e-5 * d;
  var e = 0.016709 - 1.151e-9 * d;
  var M = norm(356.0470 + 0.9856002585 * d);
  var E = M + e * DEG * Math.sin(M * RAD) * (1 + e * Math.cos(M * RAD));
  var x = Math.cos(E * RAD) - e;
  var yy = Math.sin(E * RAD) * Math.sqrt(1 - e * e);
  var v = norm(Math.atan2(yy, x) * DEG);
  return { lon: norm(v + w), M: M, w: w, e: e, d: d };
}

// ---------- Moon (tropical longitude, major perturbations) ----------
function moonPos(jd, sp) {
  var d = jd - 2451543.5;
  var N = norm(125.1228 - 0.0529538083 * d);
  var incl = 5.1454;
  var w = norm(318.0634 + 0.1643573223 * d);
  var e = 0.054900;
  var M = norm(115.3654 + 13.0649929509 * d);
  var E = M + e * DEG * Math.sin(M * RAD) * (1 + e * Math.cos(M * RAD));
  var Ms = sp.M, Ws = sp.w;
  var Lm = norm(N + w + M);
  var Ls = norm(Ms + Ws);
  var D = norm(Lm - Ls);
  var F = norm(Lm - N);
  var lonM = -1.274 * Math.sin((M - 2 * D) * RAD)
    + 0.658 * Math.sin(2 * D * RAD)
    - 0.186 * Math.sin(Ms * RAD)
    - 0.059 * Math.sin((2 * M - 2 * D) * RAD)
    - 0.057 * Math.sin((M - 2 * D + Ms) * RAD);
  var x = Math.cos(E * RAD) - e, y = Math.sin(E * RAD) * Math.sqrt(1 - e * e);
  var v = Math.atan2(y, x) * DEG, r = Math.sqrt(x * x + y * y);
  var u = norm(v + w); // argument of latitude
  var xh = r * Math.cos(u * RAD), yh = r * Math.sin(u * RAD);
  var ye = yh * Math.cos(incl * RAD);
  var lone = norm(Math.atan2(ye, xh) * DEG + N);
  return { lon: norm(lone + lonM) };
}

// ---------- Lahiri ayanamsa (approximation) ----------
function ayanamsa(jd) { return 23.853 + (jd - 2451545.0) / 36525 * 1.397; }

// ---------- Panchanga at an instant ----------
var TITHI_NAMES = ["Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shashthi",
  "Saptami", "Ashtami", "Navami", "Dashami", "Ekadashi", "Dwadashi", "Trayodashi",
  "Chaturdashi", "Purnima", "Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami",
  "Shashthi", "Saptami", "Ashtami", "Navami", "Dashami", "Ekadashi", "Dwadashi",
  "Trayodashi", "Chaturdashi", "Amavasya"];
var NAK_NAMES = ["Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
  "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
  "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha", "Moola",
  "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha",
  "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"];
var YOGA_NAMES = ["Vishkambha", "Priti", "Ayushman", "Saubhagya", "Shobhana", "Atiganda",
  "Sukarma", "Dhriti", "Shula", "Ganda", "Vriddhi", "Dhruva", "Vyaghata", "Harshana",
  "Vajra", "Siddhi", "Vyatipata", "Variyana", "Parigha", "Shiva", "Siddha", "Sadhya",
  "Shubha", "Shukla", "Brahma", "Indra", "Vaidhriti"];
var KARANA_SEQ = ["Bava", "Balava", "Kaulava", "Taitila", "Gara", "Vanija", "Vishti"];
var RASHI_NAMES = ["Mesha", "Vrishabha", "Mithuna", "Kataka", "Simha", "Kanya",
  "Tula", "Vrishchika", "Dhanu", "Makara", "Kumbha", "Meena"];

function karanaName(k) {
  if (k === 0) return "Kimstughna";
  if (k >= 57) return ["Shakuni", "Chatushpada", "Naga"][k - 57];
  return KARANA_SEQ[1 + ((k - 1) % 7)];
}

function panchanga(jd) {
  var sp = sunPos(jd), mp = moonPos(jd, sp), A = ayanamsa(jd);
  var sun = norm(sp.lon - A), moon = norm(mp.lon - A);
  var elong = norm(moon - sun);
  var tithi = Math.floor(elong / 12) + 1;
  var nak = Math.floor(moon / (360 / 27));
  var yoga = Math.floor(norm(sun + moon) / (360 / 27)) % 27;
  var kar = Math.floor(elong / 6);
  return {
    tithi: tithi, tithiName: TITHI_NAMES[tithi - 1],
    paksha: tithi <= 15 ? "shukla" : "krishna",
    nak: nak, nakName: NAK_NAMES[nak],
    pada: Math.floor((moon % (360 / 27)) / (360 / 108)) + 1,
    rashi: Math.floor(moon / 30), rashiName: RASHI_NAMES[Math.floor(moon / 30)],
    yoga: yoga, yogaName: YOGA_NAMES[yoga],
    karana: kar, karanaName: karanaName(kar),
    sun: sun, moon: moon
  };
}

// Gandanta: last 3deg20m of water signs (Kataka, Vrishchika, Meena)
function isGandanta(sidLon) {
  var m = sidLon % 120;
  return (sidLon >= 116.6667 && sidLon < 120) ||
         (sidLon >= 236.6667 && sidLon < 240) ||
         (sidLon >= 356.6667 && sidLon < 360);
}

// ---------- Timezone helpers (all instants handled in UTC ms) ----------
var dtfCache = {};
function tzOffsetMin(tz, utcMs) {
  var dtf = dtfCache[tz];
  if (!dtf) {
    dtf = new Intl.DateTimeFormat("en-US", {
      timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit"
    });
    dtfCache[tz] = dtf;
  }
  var p = {};
  dtf.formatToParts(new Date(utcMs)).forEach(function (x) { p[x.type] = x.value; });
  var asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return (asUTC - utcMs) / 60000;
}
// local wall time -> UTC ms
function localToUTC(tz, y, mo, d, h, mi) {
  var guess = Date.UTC(y, mo - 1, d, h || 0, mi || 0);
  for (var k = 0; k < 3; k++) guess = Date.UTC(y, mo - 1, d, h || 0, mi || 0) - tzOffsetMin(tz, guess) * 60000;
  return guess;
}
// UTC ms -> local wall parts
function utcToLocal(tz, utcMs) {
  var dtf = dtfCache[tz + "|d"];
  if (!dtf) {
    dtf = new Intl.DateTimeFormat("en-US", {
      timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", weekday: "short"
    });
    dtfCache[tz + "|d"] = dtf;
  }
  var p = {};
  dtf.formatToParts(new Date(utcMs)).forEach(function (x) { p[x.type] = x.value; });
  return { y: +p.year, mo: +p.month, d: +p.day, h: +p.hour, mi: +p.minute, wd: p.weekday };
}
function fmtTime(tz, utcMs) {
  var l = utcToLocal(tz, utcMs);
  function z(n) { return (n < 10 ? "0" : "") + n; }
  return z(l.h) + ":" + z(l.mi);
}

// ---------- Sunrise / sunset (UTC ms) for a local date ----------
function sunTimesUTC(y, mo, d, tz, lat, lon) {
  // declination near local noon
  var noonUTC = localToUTC(tz, y, mo, d, 12, 0);
  var jd = noonUTC / 86400000 + 2440587.5;
  var sp = sunPos(jd);
  var eps = (23.4393 - 3.563e-7 * sp.d) * RAD;
  var L0 = norm(sp.w + sp.M);
  var yy = Math.tan(eps / 2); yy *= yy;
  var eot = 4 * DEG * (yy * Math.sin(2 * L0 * RAD) - 2 * sp.e * Math.sin(sp.M * RAD) +
    4 * sp.e * yy * Math.sin(sp.M * RAD) * Math.cos(2 * L0 * RAD) -
    0.5 * yy * yy * Math.sin(4 * L0 * RAD) - 1.25 * sp.e * sp.e * Math.sin(2 * sp.M * RAD));
  var decl = Math.asin(Math.sin(eps) * Math.sin(sp.lon * RAD));
  var latR = lat * RAD;
  var cosH = (Math.sin(-0.833 * RAD) - Math.sin(latR) * Math.sin(decl)) / (Math.cos(latR) * Math.cos(decl));
  cosH = Math.max(-1, Math.min(1, cosH));
  var H = Math.acos(cosH) * DEG;
  var noonMin = 720 - 4 * lon - eot; // UTC minutes of solar noon
  var dayStartUTC = Date.UTC(y, mo - 1, d, 0, 0) - tzOffsetMin(tz, Date.UTC(y, mo - 1, d, 12, 0)) * 60000;
  // express sunrise/sunset as UTC ms anchored on this UTC midnight guess, then they are absolute
  var base = Date.UTC(y, mo - 1, d, 0, 0, 0);
  var sunrise = base + (noonMin - H * 4) * 60000;
  var sunset = base + (noonMin + H * 4) * 60000;
  // shift by whole days so sunrise falls on the intended local date
  var loc = utcToLocal(tz, sunrise);
  var shift = 0;
  if (loc.y !== y || loc.mo !== mo || loc.d !== d) {
    shift = Date.UTC(y, mo - 1, d) - Date.UTC(loc.y, loc.mo - 1, loc.d);
  }
  return { sunrise: sunrise + shift, sunset: sunset + shift };
}

// ---------- Rahu Kalam / Yamagandam (0-based segment of 8 daytime parts) ----------
var RAHU_IDX = { 0: 7, 1: 1, 2: 6, 3: 4, 4: 5, 5: 3, 6: 2 }; // Sun..Sat
var YAMA_IDX = { 0: 4, 1: 3, 2: 2, 3: 1, 4: 0, 5: 6, 6: 5 };
function inauspiciousWindows(sunrise, sunset, weekday) {
  var seg = (sunset - sunrise) / 8;
  function win(i) { return { from: sunrise + seg * i, to: sunrise + seg * (i + 1) }; }
  return { rahu: win(RAHU_IDX[weekday]), yama: win(YAMA_IDX[weekday]) };
}
function inWindow(utcMs, w) { return utcMs >= w.from && utcMs < w.to; }

// ---------- Lagna (sidereal ascendant, degrees) ----------
function lagna(jd, lat, lonEast) {
  var T = (jd - 2451545) / 36525;
  var gmst = norm(280.46061837 + 360.98564736629 * (jd - 2451545) + 0.000387933 * T * T);
  var lst = norm(gmst + lonEast) * RAD;
  var eps = (23.4393 - 3.563e-7 * (jd - 2451543.5)) * RAD;
  var asc = Math.atan2(Math.cos(lst), -(Math.sin(lst) * Math.cos(eps) + Math.tan(lat * RAD) * Math.sin(eps))) * DEG;
  return norm(norm(asc) - ayanamsa(jd));
}

// ---------- Classical guideline tables (simplified, disclosed as guidelines) ----------
var GOOD_NAK = { Ashwini: 1, Rohini: 1, Mrigashira: 1, Punarvasu: 1, Pushya: 1, Hasta: 1,
  Chitra: 1, Swati: 1, Anuradha: 1, Shravana: 1, Dhanishta: 1, Shatabhisha: 1,
  "Uttara Phalguni": 1, "Uttara Ashadha": 1, "Uttara Bhadrapada": 1, Revati: 1 };
var BAD_NAK = { Bharani: 1, Krittika: 1, Ardra: 1, Ashlesha: 1, Magha: 1,
  "Purva Phalguni": 1, Vishakha: 1, Jyeshtha: 1, Moola: 1, "Purva Ashadha": 1,
  "Purva Bhadrapada": 1 };
var GOOD_YOGA = { Ayushman: 1, Saubhagya: 1, Shobhana: 1, Sukarma: 1, Dhriti: 1,
  Vriddhi: 1, Dhruva: 1, Harshana: 1, Siddhi: 1, Shiva: 1, Siddha: 1, Sadhya: 1,
  Shubha: 1, Shukla: 1, Brahma: 1, Indra: 1 };
var BAD_YOGA = { Atiganda: 1, Shula: 1, Ganda: 1, Vyaghata: 1, Vajra: 1,
  Vyatipata: 1, Parigha: 1, Vaidhriti: 1 };
var GOOD_TITHI = { 2: 1, 3: 1, 5: 1, 7: 1, 10: 1, 11: 1, 12: 1, 13: 1, 17: 1, 18: 1,
  20: 1, 22: 1, 25: 1, 26: 1, 27: 1, 28: 1 };
var RIKTA = { 4: 1, 9: 1, 14: 1, 19: 1, 24: 1, 29: 1 };
var GOOD_TARA = { 2: 1, 4: 1, 6: 1, 8: 1, 9: 1 };
var BAD_TARA = { 1: 1, 3: 1, 5: 1, 7: 1 };
var GOOD_CHANDRA = { 1: 1, 3: 1, 6: 1, 7: 1, 10: 1, 11: 1 };
// Gandmoola: dosha is pada-specific (classical): 1st pada of Ashwini/Magha/Moola,
// 4th pada of Ashlesha/Jyeshtha/Revati.
var GANDMOOLA_PADA = { Ashwini: [1], Magha: [1], Moola: [1], Ashlesha: [4], Jyeshtha: [4], Revati: [4] };
// Eclipse days (solar + umbral lunar), verified against astronomical tables.
// Tradition avoids new beginnings, including planned birth, on these days.
var ECLIPSE = {
  "2026-02-17": 1, "2026-03-03": 1, "2026-08-12": 1, "2026-08-28": 1,
  "2027-02-06": 1, "2027-08-02": 1,
  "2028-01-12": 1, "2028-01-26": 1, "2028-07-06": 1, "2028-07-22": 1, "2028-12-31": 1
};
var STHIRA = { 1: 1, 4: 1, 7: 1, 10: 1 }; // Vrishabha, Simha, Vrishchika, Kumbha
var DWISHVA = { 2: 1, 5: 1, 8: 1, 11: 1 };

// ---------- Numerology (Chaldean-flavored date root) ----------
function numRoot(y, mo, d) {
  var s = ("" + y + (mo < 10 ? "0" : "") + mo + (d < 10 ? "0" : "") + d).split("");
  var n = s.reduce(function (a, c) { return a + (+c); }, 0);
  while (n > 9) n = ("" + n).split("").reduce(function (a, c) { return a + (+c); }, 0);
  return n;
}
function numScore(root) {
  if ([1, 3, 5, 6, 9].indexOf(root) >= 0) return 1;
  if ([4, 8].indexOf(root) >= 0) return -1;
  return 0;
}

// ---------- Score one day ----------
function scoreDay(pg, weekday, momNak, momRashi, y, mo, d, extra) {
  var pts = [], score = 0;
  function add(n, label) { score += n; if (n !== 0) pts.push({ n: n, label: label }); }

  add(pg.paksha === "shukla" ? 2 : 0, "paksha");
  var t = pg.tithi;
  if (t === 15) add(2, "tithi-purnima");
  else if (t === 30) add(-3, "tithi-amavasya");
  else if (RIKTA[t]) add(-3, "tithi-rikta");
  else if (GOOD_TITHI[t]) add(3, "tithi-good");
  else if (t === 1 || t === 6 || t === 16 || t === 21) add(1, "tithi-ok");
  else add(-1, "tithi-other");

  var vd = [1, 2, 0, 2, 2, 2, -1][weekday]; // Sun..Sat
  add(vd, "vara");

  if (GOOD_NAK[pg.nakName]) add(3, "nak-good");
  else if (BAD_NAK[pg.nakName]) add(-3, "nak-bad");
  var gmp = GANDMOOLA_PADA[pg.nakName];
  if (gmp && gmp.indexOf(pg.pada) >= 0) add(-4, "gandmoola");

  if (GOOD_YOGA[pg.yogaName]) add(1, "yoga-good");
  else if (BAD_YOGA[pg.yogaName]) add(-2, "yoga-bad");

  if (pg.karanaName === "Vishti") add(-2, "karana-vishti");
  else if (pg.karanaName === "Bava" || pg.karanaName === "Taitila") add(1, "karana-good");

  var tara = null, chandra = null;
  if (momNak !== null && momNak !== undefined && momNak !== "") {
    tara = ((pg.nak - (+momNak) + 27) % 9) + 1;
    if (GOOD_TARA[tara]) add(1, "tara-good");
    else if (BAD_TARA[tara]) add(-2, "tara-bad");
  }
  if (momRashi !== null && momRashi !== undefined && momRashi !== "") {
    chandra = ((pg.rashi - (+momRashi) + 12) % 12) + 1;
    if (GOOD_CHANDRA[chandra]) add(1, "chandra-good");
    else add(-1, "chandra-bad");
  }

  var root = numRoot(y, mo, d);
  add(numScore(root), "numero");

  if (extra) {
    if (extra.eclipse) add(-4, "eclipse");
    if (extra.sankranti) add(-2, "sankranti");
  }

  var verdict = score >= 8 ? "uttam" : score >= 5 ? "shubh" : score >= 2 ? "madhyam" : "avoid";
  return { score: score, pts: pts, verdict: verdict, tara: tara, chandra: chandra, numRoot: root };
}

// ---------- Abhijit Muhurta: 8th of 15 daytime parts, around solar noon ----------
// Traditionally auspicious for all purposes; not observed on Wednesdays.
function abhijitMuhurta(sunrise, sunset) {
  var part = (sunset - sunrise) / 15;
  var mid = (sunrise + sunset) / 2;
  return { from: mid - part / 2, to: mid + part / 2 };
}

// ---------- Hora: planetary hour, Chaldean order, day starts with weekday lord ----------
var HORA_SEQ = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
var WD_LORD = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"]; // Sun..Sat
var HORA_SA = { Sun: "Surya", Moon: "Chandra", Mars: "Mangala", Mercury: "Budha", Jupiter: "Guru", Venus: "Shukra", Saturn: "Shani" };
var BENEFIC_HORA = { Jupiter: 1, Venus: 1, Mercury: 1, Moon: 1 };
function horaAt(utc, sunrise, sunset, weekday) {
  var dur = (sunset - sunrise) / 12;
  var idx = Math.floor((utc - sunrise) / dur);
  if (idx < 0 || idx > 11) return null;
  return HORA_SEQ[(HORA_SEQ.indexOf(WD_LORD[weekday]) + idx) % 7];
}

// ---------- Suggested time windows within a day ----------
function findWindows(day) {
  // day: {y,mo,d,tz,lat,lon,sunrise,sunset,weekday,pg}
  var wins = day.inausp;
  var slots = [];
  var startMin = 6 * 60, endMin = 20 * 60;
  var loc0 = localToUTC(day.tz, day.y, day.mo, day.d, 0, 0);
  for (var m = startMin; m < endMin; m += 30) {
    var h = Math.floor(m / 60), mi = m % 60;
    var utc = localToUTC(day.tz, day.y, day.mo, day.d, h, mi);
    if (inWindow(utc, wins.rahu) || inWindow(utc, wins.yama)) continue;
    var jd = utc / 86400000 + 2440587.5;
    var lg = lagna(jd, day.lat, day.lon);
    var pg = panchanga(jd);
    if (isGandanta(lg) || isGandanta(pg.moon)) continue;
    var rashi = Math.floor(lg / 30);
    var s = 0;
    if (STHIRA[rashi]) s += 2; else if (DWISHVA[rashi]) s += 1;
    if (day.tara && GOOD_TARA[day.tara]) s += 1;
    var hl = horaAt(utc + 15 * 60000, day.sunrise, day.sunset, day.weekday);
    var horaName = hl ? HORA_SA[hl] : null;
    if (hl && BENEFIC_HORA[hl]) s += 1;
    if (s <= 0) continue;
    slots.push({ from: utc, to: utc + 30 * 60000, score: s, lagna: rashi, lagnaName: RASHI_NAMES[rashi], hora: horaName });
  }
  // merge contiguous
  var merged = [];
  slots.forEach(function (s) {
    var last = merged[merged.length - 1];
    if (last && last.to === s.from && last.lagna === s.lagna) {
      last.to = s.to; last.score = Math.max(last.score, s.score);
    } else merged.push(s);
  });
  merged.sort(function (a, b) { return b.score - a.score || a.from - b.from; });
  return merged.slice(0, 3);
}

// ---------- Main: compute ranked days ----------
function compute(opts) {
  // opts: {fromY,fromMo,fromD,toY,toMo,toD,tz,lat,lon,momNak,momRashi}
  var days = [];
  var cur = Date.UTC(opts.fromY, opts.fromMo - 1, opts.fromD);
  var end = Date.UTC(opts.toY, opts.toMo - 1, opts.toD);
  var n = 0;
  while (cur <= end && n < 46) {
    var dt = new Date(cur);
    var y = dt.getUTCFullYear(), mo = dt.getUTCMonth() + 1, d = dt.getUTCDate();
    var st = sunTimesUTC(y, mo, d, opts.tz, opts.lat, opts.lon);
    // local weekday of this date
    var weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
      .indexOf(utcToLocal(opts.tz, localToUTC(opts.tz, y, mo, d, 12, 0)).wd);
    var jdRise = st.sunrise / 86400000 + 2440587.5;
    var pg = panchanga(jdRise);
    // Sankranti: Sun changes rashi between this sunrise and the next (traditionally avoided).
    // The panchang day runs sunrise to sunrise, so a nighttime ingress flags this day.
    var r1 = Math.floor(panchanga(jdRise).sun / 30);
    var nxt = new Date(Date.UTC(y, mo - 1, d) + 86400000);
    var stN = sunTimesUTC(nxt.getUTCFullYear(), nxt.getUTCMonth() + 1, nxt.getUTCDate(), opts.tz, opts.lat, opts.lon);
    var r2 = Math.floor(panchanga(stN.sunrise / 86400000 + 2440587.5).sun / 30);
    var dkey = y + "-" + (mo < 10 ? "0" : "") + mo + "-" + (d < 10 ? "0" : "") + d;
    var sc = scoreDay(pg, weekday, opts.momNak, opts.momRashi, y, mo, d,
      { sankranti: r1 !== r2, eclipse: !!ECLIPSE[dkey] });
    var inausp = inauspiciousWindows(st.sunrise, st.sunset, weekday);
    var abh = null;
    if (weekday !== 3) {
      var ab = abhijitMuhurta(st.sunrise, st.sunset);
      // only show Abhijit if it does not clash with Rahu Kalam / Yamagandam
      if (!(ab.from < inausp.rahu.to && ab.to > inausp.rahu.from) &&
          !(ab.from < inausp.yama.to && ab.to > inausp.yama.from)) abh = ab;
    }
    var day = {
      y: y, mo: mo, d: d, tz: opts.tz, lat: opts.lat, lon: opts.lon,
      weekday: weekday, sunrise: st.sunrise, sunset: st.sunset,
      inausp: inausp, abhijit: abh, eclipse: !!ECLIPSE[dkey], sankranti: r1 !== r2,
      pg: pg, score: sc.score, pts: sc.pts, verdict: sc.verdict,
      tara: sc.tara, chandra: sc.chandra, numRoot: sc.numRoot
    };
    day.windows = findWindows(day);
    days.push(day);
    cur += 86400000; n++;
  }
  days.sort(function (a, b) { return b.score - a.score || (a.y * 10000 + a.mo * 100 + a.d) - (b.y * 10000 + b.mo * 100 + b.d); });
  return days;
}

window.MUHURTA = {
  compute: compute, panchanga: panchanga, jdUTC: jdUTC, sunPos: sunPos,
  moonPos: moonPos, ayanamsa: ayanamsa, lagna: lagna, sunTimesUTC: sunTimesUTC,
  localToUTC: localToUTC, utcToLocal: utcToLocal, fmtTime: fmtTime,
  abhijitMuhurta: abhijitMuhurta, horaAt: horaAt,
  TITHI_NAMES: TITHI_NAMES, NAK_NAMES: NAK_NAMES, YOGA_NAMES: YOGA_NAMES, RASHI_NAMES: RASHI_NAMES,
  numRoot: numRoot, isGandanta: isGandanta
};
})();

// ---------- Display name tables ----------
var VARA_NAMES = {
  hi: ["रविवार", "सोमवार", "मंगलवार", "बुधवार", "बृहस्पतिवार", "शुक्रवार", "शनिवार"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  ne: ["आइतबार", "सोमबार", "मंगलबार", "बुधबार", "बिहीबार", "शुक्रबार", "शनिबार"]
};
var TARA_NAMES = ["Janma", "Sampat", "Vipat", "Kshema", "Pratyari", "Sadhaka", "Vadha", "Mitra", "Parama Mitra"];
window.MUHURTA.VARA_NAMES = VARA_NAMES;
window.MUHURTA.TARA_NAMES = TARA_NAMES;
