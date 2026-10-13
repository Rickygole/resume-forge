/* Resume Forge
   Paste a job description, get a filled-in prompt for Claude, paste the JSON
   back, render the exact resume layout, and run the mechanical gates.
   No network calls, no API key, nothing leaves the browser. */

(function () {
  "use strict";

  var $ = function (s) { return document.querySelector(s); };
  var CONTACT = [
    { text: "(410) 390-1904" },
    { text: "rickygole32@gmail.com" },
    { text: "LinkedIn", href: "https://www.linkedin.com/in/ricky-gole-69178419b/" },
    { text: "Google Scholar", href: "https://scholar.google.com/citations?user=iSRJouQAAAAJ&hl=en&oi=ao" },
    { text: "Website", href: "https://rickygole.github.io/" }
  ];

  /* ---------- weld guard: ported from nohyph() in build.py ---------- */
  var HY = /\S*[-/]\S*/g;
  function nohyph(s) {
    return s.replace(HY, function (t) {
      if (t.length > 34) return t;
      if (t.indexOf("<") !== -1) return t;
      return '<span class="nb">' + t + "</span>";
    });
  }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function f(s) { return nohyph(esc(s)); }

  /* ---------- prompt ---------- */
  function buildPrompt(jd, pages, notes) {
    var C = window.CORPUS || { master_cv: "", sources: {} };
    var srcNames = Object.keys(C.sources);
    var parts = [];

    parts.push("You are tailoring Ricky Gole's resume for one specific job posting.");
    parts.push("Return ONLY a single JSON object matching the schema at the end. No prose, no markdown fence.");
    parts.push("");
    parts.push("=== THE POSTING ===");
    parts.push(jd.trim());
    parts.push("");
    if (notes && notes.trim()) {
      parts.push("=== EXTRA INSTRUCTIONS FROM RICKY ===");
      parts.push(notes.trim());
      parts.push("");
    }
    parts.push("=== HIS MASTER CV (source of truth for everything he has done) ===");
    parts.push(C.master_cv.trim());
    parts.push("");
    parts.push("=== AUTHORIZED PROJECT SOURCES (" + srcNames.length + " files) ===");
    parts.push("Every number and proper noun you write must trace to the master CV or to one of these.");
    srcNames.forEach(function (k) {
      parts.push("");
      parts.push("--- " + k + " ---");
      parts.push(C.sources[k].trim());
    });
    parts.push("");
    parts.push(RULES.replace("{{PAGES}}", String(pages)));
    parts.push("");
    parts.push(SCHEMA);
    return parts.join("\n");
  }

  var RULES = [
    "=== RULES. THESE ARE NOT NEGOTIABLE. ===",
    "",
    "LENGTH: exactly {{PAGES}} page(s). Cut content to fit; never compress line spacing.",
    "",
    "TRUTH",
    "- Never invent or estimate a number. If a bullet needs a figure that is not in the",
    "  sources, leave the bullet out and list it under notes.needs_facts.",
    "- A README sentence in the present tense describing what a system DOES is design",
    "  intent, not something he DID. Converting capability prose into an accomplishment",
    "  bullet is the single most common failure here. Check every bullet on that axis.",
    "- A posting phrase is a target ONLY where his material independently earns it.",
    "  Where a required line has no support, leave it uncovered and say so in",
    "  notes.uncovered. Do not stretch.",
    "- He has NEVER been employed as a software engineer or data scientist. Applied",
    "  research begins January 2025. Never write production, uptime, SLA, on-call,",
    "  operated systems, industry experience, or business revenue impact.",
    "- Verified authorship: FIVE accepted publications, THREE as first author.",
    "  He is SECOND author on Prescriptive Persistence (Leonard, D., Gole, R., Dacon, J.).",
    "  The Semantic Gap has eight authors and is a full paper, pp. 123-134.",
    "  Never write 'four as first author'.",
    "- Every project built in a hackathon keeps that fact, and every synthetic-data or",
    "  scope limitation keeps its disclosure. Put them in the entry's scope array, BELOW",
    "  the bullets, written verb-led with him as the subject. Never in the title line.",
    "",
    "STYLE",
    "- ZERO em dashes and ZERO en dashes. Pure ASCII only. Use a plain hyphen.",
    "- Email is rickygole32@gmail.com. No relocation or availability language anywhere.",
    "- Degrees are immutable: 'Bachelor of Science in Computer Information Systems and",
    "  Financial Economics, conferred December 2023' and 'Master of Science in Advanced",
    "  Computing, expected December 2026'. Use 'and', never '&'.",
    "- XYZ is a CONTENT spec, not a grammar spec: a bullet carries the result, the",
    "  measure, and the method. It does NOT have to be '[result], by [verb]ing [method]'.",
    "  Uniform ', by' grammar across every bullet is what makes a page read as machine",
    "  written. Roughly ONE THIRD of bullets must carry no ', by' clause at all, and",
    "  bullet length must vary deliberately.",
    "- Maximum 24 words per bullet; aim for a median of 15 to 17 so most render on one line.",
    "- 3 to 5 bullets per entry. Never more than 6.",
    "- Start bullets with varied past-tense verbs. Do not reuse an opening verb more than",
    "  twice across the whole document, and avoid opening a bullet with a noun subject.",
    "- Every entry heading must carry the employer or project AND its date.",
    "",
    "ORDER",
    "- Lead with whatever the posting is actually hiring for. A research-forward layout is",
    "  wrong for an engineering req, and the reverse is equally wrong.",
    "- Publications are a credential, not the product, unless the posting is research."
  ].join("\n");

  var SCHEMA = [
    "=== OUTPUT SCHEMA. Return exactly this shape and nothing else. ===",
    "{",
    '  "role": "job title you tailored for",',
    '  "summary": "three rendered lines maximum",',
    '  "sections": [',
    '    { "heading": "EDUCATION", "type": "education",',
    '      "entries": [ { "bold": "Morgan State University,", "tail": " Baltimore, Maryland",',
    '                     "date": "Jan 2025 - Dec 2026 (Expected)", "lines": ["degree line", "GPA line"] } ] },',
    '    { "heading": "SECTION NAME", "type": "entries",',
    '      "entries": [ { "bold": "Project or Employer.", "tail": " (Role or context)",',
    '                     "date": "Mon YYYY - Mon YYYY", "bullets": ["..."], "scope": ["optional disclosure"] } ] },',
    '    { "heading": "PUBLICATIONS", "type": "publications", "items": ["full citation", "..."] },',
    '    { "heading": "SKILLS", "type": "skills", "rows": [["Label", "comma, separated, values"]] }',
    '  ],',
    '  "notes": {',
    '    "covered":     ["posting requirement -> the bullet that answers it"],',
    '    "uncovered":   ["posting requirement with no support in his material"],',
    '    "dropped":     ["what you left off and why"],',
    '    "needs_facts": ["bullet that needs a real number only Ricky has"]',
    '  }',
    "}"
  ].join("\n");

  /* ---------- renderer: mirrors build.py ---------- */
  function contactHtml() {
    return CONTACT.map(function (c) {
      return c.href ? '<a href="' + esc(c.href) + '">' + esc(c.text) + "</a>" : esc(c.text);
    }).join(" | ");
  }
  function entryHtml(e) {
    var h = '<div class="entry"><div class="eh"><span class="ehl"><b>' + f(e.bold || "") + "</b>" +
      f(e.tail || "") + '</span><span class="ehd">' + f(e.date || "") + "</span></div>";
    if (e.bullets && e.bullets.length) {
      h += "<ul>" + e.bullets.map(function (b) { return "<li>" + f(b) + "</li>"; }).join("") + "</ul>";
    }
    (e.scope || []).forEach(function (s) { h += '<p class="scope">' + f(s) + "</p>"; });
    return h + "</div>";
  }
  function sectionHtml(s) {
    var h = "<h2>" + esc(s.heading || "") + "</h2>";
    if (s.type === "education") {
      h += (s.entries || []).map(function (e) {
        var x = '<div class="entry"><div class="eh"><span class="ehl"><b>' + f(e.bold || "") + "</b>" +
          f(e.tail || "") + '</span><span class="ehd">' + f(e.date || "") + "</span></div>";
        (e.lines || []).forEach(function (l) { x += '<p class="edu">' + f(l) + "</p>"; });
        return x + "</div>";
      }).join("");
    } else if (s.type === "publications") {
      h += "<ul>" + (s.items || []).map(function (i) { return "<li>" + f(i) + "</li>"; }).join("") + "</ul>";
    } else if (s.type === "skills") {
      h += (s.rows || []).map(function (r) {
        return '<p class="sk"><b>' + esc(r[0]) + ":</b> " + f(r[1]) + "</p>";
      }).join("");
    } else {
      h += (s.entries || []).map(entryHtml).join("");
    }
    return h;
  }
  function render(doc) {
    var h = "<h1>" + esc(doc.name || "RICKY GOLE") + "</h1>";
    h += '<div class="contact">' + contactHtml() + "</div>";
    if (doc.summary) h += '<p class="summary">' + f(doc.summary) + "</p>";
    h += (doc.sections || []).map(sectionHtml).join("");
    return h;
  }

  /* ---------- gates ---------- */
  var FORBIDDEN = [
    "in production", "production deployment", "production-grade system", "uptime", "on-call",
    "SLA", "stakeholder management", "industry experience", "relationship extraction",
    "sentiment analysis", "Azure", "Databricks", "Keras", "NLTK", "LangChain",
    "Semantic Kernel", "Terraform", "infrastructure-as-code", "Kubernetes", "Ray",
    "Anyscale", "Spark", "Delta Lake", "MLflow", "MCAP", "Parquet", "PyArrow",
    "fraud prevention", "deepfake", "sensor fusion", "autonomy stack", "double major",
    "187 KB", "103 automated tests", "willing to relocate", "available immediately"
  ];

  function collectBullets(doc) {
    var out = [];
    (doc.sections || []).forEach(function (s) {
      if (s.type === "education" || s.type === "skills") return;
      if (s.type === "publications") return;
      (s.entries || []).forEach(function (e) {
        (e.bullets || []).forEach(function (b) { out.push(b); });
      });
    });
    return out;
  }
  function words(s) { return s.trim().split(/\s+/).filter(Boolean); }
  function median(a) {
    if (!a.length) return 0;
    var b = a.slice().sort(function (x, y) { return x - y; });
    var m = Math.floor(b.length / 2);
    return b.length % 2 ? b[m] : Math.round((b[m - 1] + b[m]) / 2);
  }

  function gates(doc, rawText, pages, measuredPages) {
    var r = [];
    function add(level, label, detail) { r.push({ level: level, label: label, detail: detail }); }

    var dashes = (rawText.match(/[—–]/g) || []).length;
    add(dashes ? "fail" : "pass", "Em and en dashes", dashes ? dashes + " found" : "none");

    var bad = rawText.split("").filter(function (c) { return c.charCodeAt(0) > 126; });
    var uniq = Array.from(new Set(bad));
    add(uniq.length ? "fail" : "pass", "Pure ASCII",
      uniq.length ? "non-ASCII: " + uniq.slice(0, 8).map(function (c) { return JSON.stringify(c); }).join(" ") : "clean");

    var hits = FORBIDDEN.filter(function (t) {
      return new RegExp("\\b" + t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i").test(rawText);
    });
    add(hits.length ? "fail" : "pass", "Forbidden claims",
      hits.length ? hits.join(", ") : "none of " + FORBIDDEN.length + " present");

    if (/four as first author|four first-author/i.test(rawText)) {
      add("fail", "Publication authorship", "says four first-author; verified count is three");
    } else if (/Prescriptive Persistence/i.test(rawText) && !/Leonard/i.test(rawText)) {
      add("fail", "Publication authorship", "Prescriptive Persistence cited without Leonard first");
    } else {
      add("pass", "Publication authorship", "consistent with the verified record");
    }

    var bs = collectBullets(doc);
    var lens = bs.map(function (b) { return words(b).length; });
    var over = lens.filter(function (n) { return n > 24; }).length;
    add(over ? "warn" : "pass", "Bullet length",
      bs.length + " bullets, median " + median(lens) + " words, max " + (lens.length ? Math.max.apply(null, lens) : 0) +
      (over ? ", " + over + " over 24" : ""));

    var noBy = bs.filter(function (b) { return !/,\s*by\s/i.test(b); }).length;
    var pct = bs.length ? Math.round((noBy / bs.length) * 100) : 0;
    add(pct >= 25 && pct <= 55 ? "pass" : "warn", "Grammar variety",
      pct + "% of bullets carry no ', by' clause (target 25-55%)");

    var openers = {};
    bs.forEach(function (b) {
      var w = words(b)[0] || "";
      openers[w] = (openers[w] || 0) + 1;
    });
    var distinct = Object.keys(openers).length;
    var worst = Object.keys(openers).sort(function (a, b) { return openers[b] - openers[a]; })[0];
    var worstN = worst ? openers[worst] : 0;
    add(worstN > 3 ? "warn" : "pass", "Opening verbs",
      distinct + " distinct across " + bs.length + " bullets" + (worst ? ', most repeated "' + worst + '" x' + worstN : ""));

    if (measuredPages != null) {
      add(measuredPages === pages ? "pass" : "fail", "Page count",
        "renders to " + measuredPages + ", target " + pages);
    }
    return r;
  }

  /* ---------- wiring ---------- */
  var state = { doc: null };

  function setStep(n) {
    [1, 2, 3].forEach(function (i) {
      $("#step" + i).classList.toggle("active", i === n);
    });
  }

  function measurePages() {
    var sheet = $("#sheet");
    if (!sheet) return null;
    // 11in page minus 0.19in top and 0.35in bottom margin
    var usable = (11 - 0.19 - 0.35) * 96;
    return Math.max(1, Math.ceil(sheet.getBoundingClientRect().height / usable));
  }

  function show(msg, kind) {
    var el = $("#msg");
    el.textContent = msg || "";
    el.className = "msg " + (kind || "");
  }

  function doGenerate() {
    var jd = $("#jd").value;
    if (!jd.trim()) { show("Paste a job description first.", "err"); return; }
    var p = buildPrompt(jd, parseInt($("#pages").value, 10), $("#notes").value);
    $("#prompt").value = p;
    $("#promptMeta").textContent = p.length.toLocaleString() + " characters";
    setStep(2);
    show("");
  }

  function doRender() {
    var raw = $("#json").value.trim();
    if (!raw) { show("Paste Claude's JSON output first.", "err"); return; }
    raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    var first = raw.indexOf("{"), last = raw.lastIndexOf("}");
    if (first > 0 || last < raw.length - 1) raw = raw.slice(first, last + 1);
    var doc;
    try { doc = JSON.parse(raw); }
    catch (e) { show("That is not valid JSON: " + e.message, "err"); return; }

    state.doc = doc;
    $("#sheet").innerHTML = render(doc);
    setStep(3);

    var pages = parseInt($("#pages").value, 10);
    var measured = measurePages();
    var text = $("#sheet").innerText;
    var results = gates(doc, text, pages, measured);

    $("#gates").innerHTML = results.map(function (g) {
      return '<li class="g-' + g.level + '"><span class="dot"></span><b>' + esc(g.label) +
        "</b><span class='gd'>" + esc(g.detail) + "</span></li>";
    }).join("");

    var fails = results.filter(function (g) { return g.level === "fail"; }).length;
    var warns = results.filter(function (g) { return g.level === "warn"; }).length;
    $("#verdict").textContent = fails ? fails + " gate" + (fails > 1 ? "s" : "") + " failed"
      : warns ? "Passed with " + warns + " warning" + (warns > 1 ? "s" : "")
        : "All gates passed";
    $("#verdict").className = "verdict " + (fails ? "err" : warns ? "warn" : "ok");

    var n = doc.notes || {};
    function list(title, arr) {
      if (!arr || !arr.length) return "";
      return "<h4>" + esc(title) + "</h4><ul>" + arr.map(function (x) {
        return "<li>" + esc(x) + "</li>";
      }).join("") + "</ul>";
    }
    $("#notesOut").innerHTML =
      list("Covered", n.covered) + list("Not covered", n.uncovered) +
      list("Dropped", n.dropped) + list("Needs a real figure from you", n.needs_facts);
    show("");
  }

  function copy(sel, btn) {
    var el = $(sel);
    el.select(); el.setSelectionRange(0, el.value.length);
    navigator.clipboard.writeText(el.value).then(function () {
      var o = btn.textContent; btn.textContent = "Copied"; btn.classList.add("ok");
      setTimeout(function () { btn.textContent = o; btn.classList.remove("ok"); }, 1400);
    }).catch(function () { document.execCommand("copy"); });
  }

  document.addEventListener("DOMContentLoaded", function () {
    $("#gen").addEventListener("click", doGenerate);
    $("#copyPrompt").addEventListener("click", function () { copy("#prompt", this); });
    $("#renderBtn").addEventListener("click", doRender);
    $("#printBtn").addEventListener("click", function () { window.print(); });
    $("#dlBtn").addEventListener("click", function () {
      if (!state.doc) return;
      var blob = new Blob([JSON.stringify(state.doc, null, 2)], { type: "application/json" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "resume-" + (state.doc.role || "tailored").toLowerCase().replace(/[^a-z0-9]+/g, "-") + ".json";
      a.click();
    });
    [1, 2, 3].forEach(function (i) {
      $("#step" + i + " .head").addEventListener("click", function () { setStep(i); });
    });
    var srcs = Object.keys((window.CORPUS || {}).sources || {});
    $("#corpusInfo").textContent = srcs.length + " project sources + master CV loaded";
  });
})();
