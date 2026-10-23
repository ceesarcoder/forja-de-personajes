var SUPABASE_URL = "https://janguhfxpnabszyagmqe.supabase.co";
var SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imphbmd1aGZ4cG5hYnN6eWFnbXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1Mzg2MTUsImV4cCI6MjEwODExNDYxNX0.bH8IdiHyQd5dSL0jEvneMoj7QkvdiIl9J-KWAj_HaP8";

var CATS = [
  { id: "hab", name: "Habilidades", cls: "Erudito", stats: [
    { id: "int", name: "Inteligencia", hint: "Razonar y resolver problemas" },
    { id: "cre", name: "Creatividad", hint: "Ideas y soluciones originales" },
    { id: "tec", name: "Técnica", hint: "Dominio práctico de un oficio" },
    { id: "com", name: "Comunicación", hint: "Expresarse y hacerse entender" }
  ]},
  { id: "fis", name: "Físico", cls: "Guerrero", stats: [
    { id: "fue", name: "Fuerza", hint: "Potencia muscular" },
    { id: "res", name: "Resistencia", hint: "Aguante y energía sostenida" },
    { id: "agi", name: "Agilidad", hint: "Coordinación y velocidad" },
    { id: "por", name: "Porte", hint: "Presencia y cuidado físico" }
  ]},
  { id: "ada", name: "Adaptabilidad", cls: "Explorador", stats: [
    { id: "apr", name: "Aprendizaje", hint: "Incorpora lo nuevo rápido" },
    { id: "rsl", name: "Resiliencia", hint: "Se recupera de los golpes" },
    { id: "imp", name: "Improvisación", hint: "Reacciona bien sin plan" }
  ]},
  { id: "per", name: "Personalidad", cls: "Bardo", stats: [
    { id: "car", name: "Carisma", hint: "Atrae y cae bien" },
    { id: "emp", name: "Empatía", hint: "Entiende a los demás" },
    { id: "lid", name: "Liderazgo", hint: "Guía y decide por otros" },
    { id: "dis", name: "Disciplina", hint: "Constancia y autocontrol" }
  ]}
];
var STATS = [];
CATS.forEach(function (c) { c.stats.forEach(function (s) { STATS.push({ id: s.id, name: s.name, cat: c.id, hint: s.hint }); }); });
var N = STATS.length;
var MAXPTS = N * 10;

function $(s) { return document.querySelector(s); }
function esc(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

function rpc(fn, args, opts) {
  return fetch(SUPABASE_URL + "/rest/v1/rpc/" + fn, {
    method: "POST",
    headers: { "apikey": SUPABASE_KEY, "Authorization": "Bearer " + SUPABASE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(args || {}),
    keepalive: !!(opts && opts.keepalive)
  }).then(function (r) {
    return r.text().then(function (t) {
      var j = null;
      try { j = t ? JSON.parse(t) : null; } catch (e) {}
      if (!r.ok) {
        var err = new Error((j && j.message) || ("Error " + r.status));
        err.status = r.status;
        throw err;
      }
      return j;
    });
  });
}

function total(st) { var t = 0; STATS.forEach(function (s) { t += st[s.id] || 0; }); return t; }
function rankOf(t) { t = Math.round(t); return t >= 135 ? "S" : t >= 115 ? "A" : t >= 95 ? "B" : t >= 75 ? "C" : t >= 55 ? "D" : "E"; }
function catAvg(st, c) { var t = 0; c.stats.forEach(function (s) { t += st[s.id] || 0; }); return t / c.stats.length; }
function classOf(st) {
  if (total(st) === 0) return "Sin clase";
  var avgs = CATS.map(function (c) { return catAvg(st, c); });
  var mx = Math.max.apply(null, avgs), mn = Math.min.apply(null, avgs);
  if (mx - mn < 0.8) return "Polivalente";
  return CATS[avgs.indexOf(mx)].cls;
}
function fmtNum(v) { return Number.isInteger(v) ? String(v) : v.toFixed(1); }

function pt(i, r) {
  var a = -Math.PI / 2 + i * 2 * Math.PI / N;
  return [260 + r * Math.cos(a), 220 + r * Math.sin(a), a];
}
function radarSvg(st) {
  var R = 135, LR = 152, s = "";
  for (var r = 2; r <= 10; r += 2) {
    var pts = STATS.map(function (_, i) { var q = pt(i, R * r / 10); return q[0].toFixed(1) + "," + q[1].toFixed(1); }).join(" ");
    s += '<polygon class="ring' + (r === 10 ? " outer" : "") + '" points="' + pts + '"/>';
  }
  STATS.forEach(function (_, i) {
    var q = pt(i, R);
    s += '<line class="axis" x1="260" y1="220" x2="' + q[0].toFixed(1) + '" y2="' + q[1].toFixed(1) + '"/>';
  });
  var shape = STATS.map(function (x, i) { var q = pt(i, R * (st[x.id] || 0) / 10); return q[0].toFixed(1) + "," + q[1].toFixed(1); }).join(" ");
  s += '<polygon class="shape" points="' + shape + '"/>';
  STATS.forEach(function (x, i) {
    var q = pt(i, R * (st[x.id] || 0) / 10);
    s += '<circle class="dot ' + x.cat + '" cx="' + q[0].toFixed(1) + '" cy="' + q[1].toFixed(1) + '" r="5"/>';
  });
  STATS.forEach(function (x, i) {
    var q = pt(i, LR), c = Math.cos(q[2]), sn = Math.sin(q[2]);
    var anchor = c > 0.25 ? "start" : c < -0.25 ? "end" : "middle";
    var dy = sn > 0.4 ? "0.85em" : sn < -0.4 ? "-0.15em" : "0.35em";
    s += '<text class="lab" x="' + q[0].toFixed(1) + '" y="' + q[1].toFixed(1) + '" text-anchor="' + anchor + '" dy="' + dy + '">' + x.name + "</text>";
  });
  return s;
}

function groupsHtml(prefix) {
  return CATS.map(function (c) {
    var rows = c.stats.map(function (s) {
      var pips = "";
      for (var i = 1; i <= 10; i++) pips += '<button type="button" class="pip" data-stat="' + s.id + '" data-n="' + i + '" aria-label="' + s.name + ": " + i + ' de 10"></button>';
      return '<div class="stat"><div class="stat-top"><div><div class="stat-name">' + s.name + '</div><div class="stat-hint" id="' + prefix + 'hint-' + s.id + '">' + s.hint +
        '</div></div><div class="stat-val" id="' + prefix + 'val-' + s.id + '">–</div></div><div class="pips" role="group" aria-label="' + s.name + '" data-row="' + prefix + s.id + '">' + pips + "</div></div>";
    }).join("");
    return '<section class="panel group ' + c.id + '"><h3>' + c.name + "</h3>" + rows + "</section>";
  }).join("");
}

function setPips(container, id, v) {
  var row = container.querySelector('[data-row="' + id + '"]');
  if (!row) return;
  var k = Math.round(v);
  row.querySelectorAll(".pip").forEach(function (b, i) { b.classList.toggle("on", i < k); });
}
