(function () {
  var CATEGORIES = {
    representative: "代表",
    staff: "社員",
    company: "会社"
  };

  var PRICE_LABELS = ["インサートなし", "インサートあり"];

  var BASE = [
    { category: "representative", name: "代表者メッセージ" },
    { category: "representative", name: "事業計画" },
    { category: "representative", name: "代表が答える100の質問" },
    { category: "staff", name: "社員紹介（1名）" },
    { category: "staff", name: "社員が答える100の質問" },
    { category: "staff", name: "代表×社員 対談" },
    { category: "staff", name: "社員×社員 対談" },
    { category: "staff", name: "座談会（3〜4名）" },
    { category: "company", name: "会社紹介" },
    { category: "company", name: "事業内容紹介" },
    { category: "company", name: "福利厚生紹介" },
    { category: "company", name: "ルームツアー" }
  ];

  function findTagged(selector, id) {
    var nodes = document.querySelectorAll(selector);
    var i;
    for (i = 0; i < nodes.length; i++) {
      if (nodes[i].dataset.id === id) return nodes[i];
    }
    return null;
  }

  function safeUrl(value) {
    try {
      var url = new URL(String(value || "").trim());
      if (url.protocol !== "https:") return "";
      return url.href;
    } catch (error) {
      return "";
    }
  }

  function yen(value) {
    var text = String(value || "").replace(/[０-９]/g, function (ch) {
      return String.fromCharCode(ch.charCodeAt(0) - 65248);
    }).trim();
    if (!text || text === "対象外" || text === "提供対象外" || text === "対応対象外") return "";
    if (/^\d+(?:\.\d+)?$/.test(text)) return text + "万円";
    if (/^\d+(?:\.\d+)?万$/.test(text)) return text + "円";
    return text;
  }

  function showPrice(value) {
    var text = String(value || "").replace(/[０-９]/g, function (ch) {
      return String.fromCharCode(ch.charCodeAt(0) - 65248);
    }).replace(/\s/g, "");
    if (!text || text === "対象外" || text === "提供対象外" || text === "対応対象外" || text === "-" || text === "－" || text === "—" || text === "−") {
      return { text: "提供対象外", empty: true, kind: "off" };
    }
    if (text === "別途見積もり" || text === "別途見積" || text === "未定") {
      return { text: "別途見積もり", empty: false, kind: "quote" };
    }
    return { text: yen(value), empty: false, kind: "price" };
  }

  function writeShown(node, shown) {
    node.classList.remove("na", "is-quote");
    node.textContent = "";
    if (shown.kind === "price") {
      node.append(document.createTextNode(shown.text));
      markYen(node);
      return;
    }
    var mark = document.createElement("span");
    mark.className = shown.kind === "quote" ? "status status-quote" : "status status-off";
    mark.textContent = shown.text;
    node.classList.add(shown.kind === "quote" ? "is-quote" : "na");
    node.append(mark);
  }

  function markYen(node) {
    if (!node) return;
    Array.prototype.forEach.call(node.childNodes, function (child) {
      if (child.nodeType !== 3 || child.nodeValue.indexOf("万円") === -1) return;
      var match = child.nodeValue.match(/^(.*?)(万円)(\s*)$/);
      if (!match) return;
      child.nodeValue = match[1];
      var unit = document.createElement("span");
      unit.className = "yen-unit";
      unit.textContent = "万円";
      child.after(unit);
      if (match[3]) unit.after(document.createTextNode(match[3]));
    });
  }

  function decoratePrices() {
    document.querySelectorAll(".price, .amount, .card-prices strong, .plan-amount").forEach(markYen);
  }

  function normalizeVideos(value) {
    var list = [];
    function push(label, url) {
      var safe = safeUrl(url);
      if (!safe) return;
      list.push({ label: String(label || "").trim() || "参考動画", url: safe });
    }
    if (!value) return list;
    if (typeof value === "string") {
      push("参考動画", value);
      return list;
    }
    if (!Array.isArray(value)) return list;
    value.forEach(function (item) {
      if (typeof item === "string") push("参考動画", item);
      else if (item) push(item.label, item.url);
    });
    return list;
  }

  function isSingle(fields) {
    return !!fields && Object.prototype.hasOwnProperty.call(fields, "single");
  }

  function sampleList(list) {
    var wrap = document.createElement("div");
    wrap.className = "samples";
    list.forEach(function (item) {
      var link = document.createElement("a");
      link.className = "sample";
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.href = item.url;
      link.textContent = item.label;
      wrap.appendChild(link);
    });
    return wrap;
  }

  function ensureSamplesCell(tr) {
    var cell = null;
    Array.prototype.forEach.call(tr.children, function (child) {
      if (child.classList && child.classList.contains("samples")) cell = child;
    });
    if (cell) return cell;
    cell = document.createElement("td");
    cell.className = "samples";
    var duration = tr.querySelector("td.duration");
    if (duration) duration.after(cell);
    else {
      var heading = tr.querySelector("th");
      if (heading) heading.after(cell);
      else tr.appendChild(cell);
    }
    return cell;
  }

  function clearInlineSamples(root) {
    if (!root) return;
    root.querySelectorAll("th .samples, th > a.sample").forEach(function (node) { node.remove(); });
    root.querySelectorAll(".desc-row").forEach(function (row) {
      var desc = row.querySelector(".desc");
      if (desc) row.replaceWith(desc);
      else row.remove();
    });
  }

  function placeCardSamples(card, block) {
    var prices = card.querySelector(".card-prices");
    if (prices) prices.before(block);
    else {
      var meta = card.querySelector(".meta");
      if (meta) meta.after(block);
      else card.appendChild(block);
    }
  }

  function setVideos(host, value) {
    var list = normalizeVideos(value);
    if (host.classList && host.classList.contains("talk-line")) {
      var card = host.closest("article");
      if (!card) return;
      var lineId = host.getAttribute("data-line") || "";
      host.querySelectorAll(".samples, a.sample").forEach(function (node) { node.remove(); });
      var stack = card.querySelector(".sample-stack");
      if (stack) {
        Array.prototype.forEach.call(Array.prototype.slice.call(stack.children), function (node) {
          if (node.getAttribute("data-line") === lineId) node.remove();
        });
        if (!stack.children.length) stack.remove();
      }
      if (!list.length) return;
      stack = card.querySelector(".sample-stack");
      if (!stack) {
        stack = document.createElement("div");
        stack.className = "sample-stack";
        placeCardSamples(card, stack);
      }
      var block = sampleList(list);
      block.setAttribute("data-line", lineId);
      stack.appendChild(block);
      return;
    }
    var tr = host.closest ? host.closest("tr") : null;
    if (tr) {
      clearInlineSamples(tr);
      var cell = ensureSamplesCell(tr);
      cell.querySelectorAll(".samples, a.sample").forEach(function (node) { node.remove(); });
      if (list.length) cell.appendChild(sampleList(list));
      return;
    }
    host.querySelectorAll(":scope > .samples, :scope > a.sample").forEach(function (node) { node.remove(); });
    clearInlineSamples(host);
    if (!list.length) return;
    placeCardSamples(host, sampleList(list));
  }

  function peelNote(value) {
    var text = String(value || "");
    var match = text.match(/（一律）|（インサート込み）/);
    if (!match) return { amount: text, note: "" };
    return { amount: text.replace(match[0], "").trim(), note: match[0] };
  }

  function renderNoted(cell, value, note) {
    var shown = showPrice(value);
    cell.classList.remove("na", "is-quote");
    cell.textContent = "";
    if (shown.kind !== "price") {
      writeShown(cell, shown);
      return;
    }
    if (!note) {
      cell.textContent = shown.text;
      markYen(cell);
      return;
    }
    cell.append(document.createTextNode(shown.text));
    markYen(cell);
    var unit = document.createElement("span");
    unit.className = "unit";
    unit.textContent = note;
    cell.append(unit);
  }

  function setPriceCell(cell, value) {
    writeShown(cell, showPrice(value));
  }

  function priceLine(label, value, note) {
    var line = document.createElement("p");
    var span = document.createElement("span");
    span.textContent = label;
    var shown = showPrice(value);
    var strong = document.createElement("strong");
    writeShown(strong, shown);
    if (note && shown.kind === "price") {
      var unit = document.createElement("span");
      unit.className = "unit";
      unit.textContent = note;
      strong.append(unit);
    }
    line.append(span, strong);
    return line;
  }

  function writePrices(tr, fields) {
    var cells = [];
    Array.prototype.forEach.call(tr.children, function (child) {
      if (child.classList.contains("price")) cells.push(child);
    });
    if (!cells.length) return;
    if (isSingle(fields)) {
      if (cells[1]) cells[1].remove();
      cells[0].colSpan = 2;
      var peeled = peelNote(fields.single);
      renderNoted(cells[0], peeled.amount, fields.note || peeled.note);
      return;
    }
    if (cells.length === 1) {
      cells[0].colSpan = 1;
      var second = document.createElement("td");
      second.className = "price";
      cells[0].after(second);
      cells.push(second);
    }
    setPriceCell(cells[0], fields.interview);
    setPriceCell(cells[1], fields.workplace);
  }

  function writeRow(tr, fields) {
    if (!tr || !fields) return;
    if (fields.name != null && tr.querySelector(".name")) tr.querySelector(".name").textContent = fields.name;
    if (fields.description != null && tr.querySelector(".desc")) tr.querySelector(".desc").textContent = fields.description;
    if (fields.duration != null && tr.querySelector("td.duration")) tr.querySelector("td.duration").textContent = fields.duration;
    if (isSingle(fields) || fields.interview != null || fields.workplace != null) writePrices(tr, fields);
  }

  function writeCard(card, fields) {
    if (!card || !fields) return;
    if (fields.name != null && card.querySelector("h4")) card.querySelector("h4").textContent = fields.name;
    if (fields.description != null && card.querySelector(".desc")) card.querySelector(".desc").textContent = fields.description;
    if (fields.duration != null && card.querySelector(".meta")) card.querySelector(".meta").textContent = "動画の尺：" + fields.duration;
    if (!isSingle(fields) && fields.interview == null && fields.workplace == null) return;
    var prices = card.querySelector(".card-prices");
    if (!prices) return;
    prices.textContent = "";
    if (isSingle(fields)) {
      var peeled = peelNote(fields.single);
      prices.append(priceLine("料金", peeled.amount, fields.note || peeled.note));
      return;
    }
    prices.append(priceLine(PRICE_LABELS[0], fields.interview));
    prices.append(priceLine(PRICE_LABELS[1], fields.workplace));
  }

  function writeLine(id, fields) {
    if (!fields) return;
    var line = null;
    document.querySelectorAll(".talk-line").forEach(function (node) {
      if (node.getAttribute("data-line") === id) line = node;
    });
    if (!line) return;
    var name = line.querySelector("h4, .name");
    var desc = line.querySelector(".desc");
    if (fields.name != null && name) name.textContent = fields.name;
    if (fields.description != null && desc) desc.textContent = fields.description;
  }

  function applyFields(id, fields) {
    writeRow(findTagged("tr[data-id]", id), fields);
    writeCard(findTagged("article[data-id]", id), fields);
    writeLine(id, fields);
  }

  function appendItem(item) {
    var section = document.getElementById(item.category);
    if (!section) return;
    var id = item.id || item.name;
    var url = safeUrl(item.video);
    var row = document.createElement("tr");
    row.dataset.id = id;
    row.dataset.extra = "1";
    var heading = document.createElement("th");
    heading.scope = "row";
    var name = document.createElement("span");
    name.className = "name";
    name.textContent = item.name || "";
    var desc = document.createElement("span");
    desc.className = "desc";
    desc.textContent = item.description || "";
    heading.append(name, desc);
    var duration = document.createElement("td");
    duration.className = "duration";
    duration.textContent = item.duration || "";
    var samples = document.createElement("td");
    samples.className = "samples";
    row.append(heading, duration, samples);
    if (isSingle(item) || item.single) {
      var single = document.createElement("td");
      single.className = "price";
      single.colSpan = 2;
      var peeled = peelNote(item.single);
      renderNoted(single, peeled.amount, item.note || peeled.note);
      row.append(single);
    } else {
      [item.interview, item.workplace].forEach(function (value) {
        var cell = document.createElement("td");
        cell.className = "price";
        setPriceCell(cell, value);
        row.append(cell);
      });
    }
    if (url) setVideos(row, url);
    section.querySelector("tbody").append(row);

    var card = document.createElement("article");
    card.className = "card";
    card.dataset.id = id;
    card.dataset.extra = "1";
    var title = document.createElement("h4");
    title.textContent = item.name || "";
    var cardDesc = document.createElement("p");
    cardDesc.className = "desc";
    cardDesc.textContent = item.description || "";
    var meta = document.createElement("p");
    meta.className = "meta";
    meta.textContent = "動画の尺：" + (item.duration || "");
    var prices = document.createElement("div");
    prices.className = "card-prices";
    card.append(title, cardDesc, meta, prices);
    writeCard(card, item.single ? { single: item.single, note: item.note } : { interview: item.interview, workplace: item.workplace });
    var tax = document.createElement("p");
    tax.className = "tax-note";
    tax.textContent = "税別";
    card.append(tax);
    if (url) setVideos(card, url);
    section.querySelector(".cards").append(card);
  }

  function stampBase() {
    BASE.forEach(function (item) {
      var section = document.getElementById(item.category);
      if (!section) return;
      section.querySelectorAll("tbody tr").forEach(function (tr) {
        if (tr.dataset.id) return;
        var name = tr.querySelector(".name");
        if (name && name.textContent.trim() === item.name) tr.dataset.id = item.name;
      });
      section.querySelectorAll(".cards article").forEach(function (card) {
        if (card.dataset.id) return;
        var title = card.querySelector("h4");
        if (title && title.textContent.trim() === item.name) card.dataset.id = item.name;
      });
    });
  }

  function reorder(container, ids) {
    if (!container || !ids) return;
    var rank = {};
    ids.forEach(function (id, index) { rank[id] = index; });
    var rows = Array.prototype.filter.call(container.children, function (node) {
      return node.dataset && node.dataset.id;
    });
    rows.forEach(function (row, index) {
      if (!Object.prototype.hasOwnProperty.call(rank, row.dataset.id)) rank[row.dataset.id] = 1000 + index;
    });
    rows.sort(function (a, b) { return rank[a.dataset.id] - rank[b.dataset.id]; });
    rows.forEach(function (row) { container.appendChild(row); });
  }

  var TALK = ["代表×社員 対談", "社員×社員 対談", "座談会（3〜4名）"];

  function placeGroups(root) {
    (root || document).querySelectorAll("tbody").forEach(function (tbody) {
      var rows = [];
      TALK.forEach(function (id) {
        Array.prototype.forEach.call(tbody.children, function (node) {
          if (node.dataset && node.dataset.id === id) rows.push(node);
        });
      });
      if (rows.length < 2) return;
      rows.forEach(function (row, index) {
        if (index > 0) tbody.insertBefore(row, rows[index - 1].nextSibling);
      });
      rows.forEach(function (row, index) {
        row.classList.add("talk");
        row.classList.toggle("talk-lead", index === 0);
        row.classList.toggle("talk-end", index === rows.length - 1);
        if (index > 0) row.dataset.talk = rows[0].dataset.id;
        Array.prototype.forEach.call(row.children, function (cell) {
          if (cell.classList.contains("duration") || cell.classList.contains("price")) cell.rowSpan = rows.length;
        });
      });
    });
  }

  function applyVideos(videos) {
    document.querySelectorAll(".menu-block tbody tr").forEach(function (tr) {
      if (!tr.classList.contains("add-row")) ensureSamplesCell(tr);
    });
    document.querySelectorAll("tr[data-id], article.card[data-id]").forEach(function (node) {
      var id = node.dataset.id;
      var nameEl = node.querySelector(".name, h4");
      var name = nameEl ? nameEl.textContent.trim() : "";
      var hasId = Object.prototype.hasOwnProperty.call(videos, id);
      var hasName = !!name && Object.prototype.hasOwnProperty.call(videos, name);
      if (!hasId && !hasName) return;
      var list = hasId ? videos[id] : videos[name];
      if (node.tagName === "ARTICLE" && node.querySelector(".talk-line")) return;
      setVideos(node, list);
      document.querySelectorAll(".talk-line").forEach(function (line) {
        if (line.getAttribute("data-line") === id) setVideos(line, list);
      });
    });
  }

  function seriesArticle(item) {
    item = item || {};
    var article = document.createElement("article");
    var head = document.createElement("div");
    head.className = "series-head";
    var titles = document.createElement("div");
    var h3 = document.createElement("h3");
    h3.textContent = item.title || "新しいシリーズ";
    var lead = document.createElement("p");
    lead.className = "series-lead";
    lead.textContent = item.lead || "";
    titles.append(h3, lead);
    var plan = document.createElement("div");
    plan.className = "plan";
    var main = document.createElement("p");
    main.className = "plan-main";
    var badge = document.createElement("span");
    badge.className = "plan-badge";
    badge.textContent = item.badge || "2本以上で";
    var strong = document.createElement("strong");
    var amount = document.createElement("span");
    amount.className = "plan-amount";
    amount.textContent = item.price || "15万円";
    var unit = document.createElement("span");
    unit.className = "plan-unit";
    unit.textContent = item.unit != null ? item.unit : "／本";
    strong.append(amount, unit);
    main.append(badge, strong);
    var single = document.createElement("p");
    single.className = "plan-single";
    single.textContent = item.single || "1本のみ 20万円／本";
    var insert = document.createElement("p");
    insert.className = "plan-insert";
    insert.textContent = item.insert != null ? item.insert : "インサート撮影込み";
    plan.append(main, single, insert);
    head.append(titles, plan);
    var rule = document.createElement("hr");
    rule.className = "series-line";
    var list = document.createElement("ul");
    list.className = "themes";
    (item.themes || []).forEach(function (theme) {
      var li = document.createElement("li");
      var name = document.createElement("span");
      name.className = "theme-name";
      name.textContent = theme;
      li.appendChild(name);
      list.appendChild(li);
    });
    article.append(head, rule, list);
    return article;
  }

  function applySeries(data) {
    var heading = document.getElementById("series");
    if (data.seriesIntro && heading) {
      if (data.seriesIntro.title != null) heading.textContent = data.seriesIntro.title;
      var intro = heading.nextElementSibling;
      if (intro && intro.classList.contains("section-lead") && data.seriesIntro.lead != null) {
        intro.textContent = data.seriesIntro.lead;
      }
    }
    if (!Array.isArray(data.series)) return;
    var host = document.querySelector(".series");
    if (!host) return;
    host.textContent = "";
    data.series.forEach(function (item) {
      host.appendChild(seriesArticle(item));
    });
  }

  function noteItem(text) {
    var li = document.createElement("li");
    var name = document.createElement("span");
    name.className = "note-name";
    name.textContent = text;
    li.appendChild(name);
    return li;
  }

  function applyText(id, fields, leadClass) {
    if (!fields) return;
    var heading = document.getElementById(id);
    if (heading && fields.title != null) heading.textContent = fields.title;
    var intro = heading && heading.nextElementSibling;
    if (intro && intro.classList.contains(leadClass || "section-lead") && fields.lead != null) {
      intro.textContent = fields.lead;
    }
  }

  function applyPage(page) {
    if (!page) return;
    if (page.company != null) {
      document.querySelectorAll(".company").forEach(function (node) {
        node.textContent = page.company;
      });
    }
    var kicker = document.querySelector(".kicker");
    var title = document.getElementById("page-title");
    var promise = document.querySelector(".promise");
    var lead = document.querySelector("p.lead");
    if (kicker && page.kicker != null) kicker.textContent = page.kicker;
    if (title && page.title != null) title.textContent = page.title;
    if (promise && page.promise != null) promise.textContent = page.promise;
    if (lead && page.lead != null) lead.textContent = page.lead;
  }

  function conditionItem(text) {
    var li = document.createElement("li");
    var name = document.createElement("span");
    name.className = "condition-name";
    name.textContent = text;
    li.appendChild(name);
    return li;
  }

  function applyConditions(data) {
    applyText("conditions", data.conditionsIntro, "section-lead");
    if (!Array.isArray(data.conditions)) return;
    var host = document.querySelector("ul.conditions");
    if (!host) return;
    host.textContent = "";
    data.conditions.forEach(function (text) {
      var line = String(text || "").trim();
      if (line) host.appendChild(conditionItem(line));
    });
  }

  function applyNotes(data) {
    var heading = document.getElementById("notes");
    if (data.notesIntro && heading) {
      if (data.notesIntro.title != null) heading.textContent = data.notesIntro.title;
      var intro = heading.nextElementSibling;
      if (intro && intro.classList.contains("section-lead") && data.notesIntro.lead != null) {
        intro.textContent = data.notesIntro.lead;
      }
    }
    if (!Array.isArray(data.notes)) return;
    var host = document.querySelector("ul.notes");
    if (!host) return;
    host.textContent = "";
    data.notes.forEach(function (text) {
      var line = String(text || "").trim();
      if (line) host.appendChild(noteItem(line));
    });
  }

  function applyAims(aims) {
    if (!aims) return;
    Object.keys(aims).forEach(function (id) {
      var link = document.querySelector('.aims a[href="#' + id + '"]');
      if (!link) return;
      var fields = aims[id] || {};
      var label = link.querySelector("span");
      var title = link.querySelector("strong");
      var examples = link.querySelector("em");
      if (fields.label != null && label) label.textContent = fields.label;
      if (fields.title != null && title) title.textContent = fields.title;
      if (fields.examples != null && examples) examples.textContent = fields.examples;
    });
  }

  var SPEAK = {
    "代表者メッセージ": ["なぜこの会社を続けているか", "求職者に期待すること", "入社後に大事にしてほしいこと"],
    "事業計画": ["これからの事業の方向", "成長していく分野", "その中で任せる仕事"],
    "代表が答える100の質問": ["休日の過ごし方", "学生時代に夢中だったこと", "最近うれしかったこと"],
    "社員紹介（1名）": ["入社のきっかけ", "一日の仕事", "この会社で成長したこと"],
    "社員の一日": ["出社してからの流れ", "午前と午後の仕事", "まわりとの関わり"],
    "row-1794462275393": ["出社してからの流れ", "午前と午後の仕事", "まわりとの関わり"],
    "社員が答える100の質問": ["入社前後のギャップ", "上司との距離感", "仕事でうれしい瞬間"],
    "代表×社員 対談": ["ふだんの呼び方", "意見が分かれたときの話", "お互いの印象"],
    "社員×社員 対談": ["同期との関係", "教えてもらったこと", "部署を越えたやり取り"],
    "座談会（3〜4名）": ["社内の空気", "ランチや休憩の話", "困ったときの助け合い"],
    "会社紹介": ["会社の成り立ち", "事業の全体像", "働く人の雰囲気"],
    "row-1794462538667": ["会社の成り立ち", "事業の全体像", "働く人の雰囲気"],
    "事業内容紹介": ["主な仕事の流れ", "お客様との関わり", "他社との違い"],
    "row-1794529192476": ["主な仕事の流れ", "お客様との関わり", "他社との違い"],
    "福利厚生紹介": ["実際に使っている制度", "休みの取り方", "制度を使う人の声"],
    "ルームツアー": ["入り口から執務室まで", "打ち合わせする場所", "休憩できる場所"],
    "オフィスツアー": ["入り口から執務室まで", "打ち合わせする場所", "休憩できる場所"],
    "HPトップムービー": ["会社の第一印象", "仕事をしている場面", "人の表情"],
    "row-1794807835279": ["会社の第一印象", "仕事をしている場面", "人の表情"]
  };

  function speakLines(id, name) {
    if (id && Object.prototype.hasOwnProperty.call(SPEAK, id)) return SPEAK[id];
    if (name && Object.prototype.hasOwnProperty.call(SPEAK, name)) return SPEAK[name];
    return null;
  }

  function speakPop(lines) {
    var hint = document.createElement("span");
    hint.className = "speak-hint";
    hint.textContent = "テーマ例";
    var pop = document.createElement("div");
    pop.className = "speak-pop";
    var label = document.createElement("p");
    label.textContent = "話すテーマの例";
    var list = document.createElement("ul");
    lines.forEach(function (text) {
      var item = document.createElement("li");
      item.textContent = text;
      list.appendChild(item);
    });
    pop.append(label, list);
    return { hint: hint, pop: pop };
  }

  function placeSpeak(host, id, name) {
    if (!host) return;
    host.querySelectorAll(":scope > .speak-hint, :scope > .speak-pop").forEach(function (node) { node.remove(); });
    var lines = speakLines(id, name);
    if (!lines) return;
    var built = speakPop(lines);
    var desc = host.querySelector(":scope > .desc");
    if (desc) desc.after(built.hint, built.pop);
    else host.append(built.hint, built.pop);
  }

  function applyThemes() {
    document.querySelectorAll(".menu-block tbody tr[data-id]").forEach(function (tr) {
      var name = tr.querySelector(".name");
      placeSpeak(tr.querySelector("th"), tr.dataset.id, name ? name.textContent.trim() : "");
      var cell = tr.querySelector("th");
      if (cell) cell.tabIndex = 0;
    });
    document.querySelectorAll(".menu-block article.card").forEach(function (card) {
      if (card.querySelector(".talk-line")) return;
      var name = card.querySelector("h4");
      placeSpeak(card, card.dataset.id, name ? name.textContent.trim() : "");
    });
    document.querySelectorAll(".talk-line").forEach(function (line) {
      var name = line.querySelector("h4, .name");
      placeSpeak(line, line.getAttribute("data-line"), name ? name.textContent.trim() : "");
    });
  }

  function apply(data) {
    data = data || {};
    applyPage(data.page);
    applyAims(data.aims);
    applyText("single", data.menuIntro, "section-lead");
    applySeries(data);
    applyNotes(data);
    applyConditions(data);
    document.querySelectorAll("[data-extra]").forEach(function (node) { node.remove(); });
    stampBase();
    (data.removed || []).forEach(function (id) {
      var row = findTagged("tr[data-id]", id);
      var card = findTagged("article.card[data-id]", id);
      if (row) row.remove();
      if (card) card.remove();
    });
    var overrides = data.overrides || {};
    Object.keys(overrides).forEach(function (id) { applyFields(id, overrides[id]); });
    (data.items || []).forEach(appendItem);
    var order = data.order || {};
    Object.keys(CATEGORIES).forEach(function (category) {
      if (!order[category]) return;
      var section = document.getElementById(category);
      if (!section) return;
      reorder(section.querySelector("tbody"), order[category]);
      reorder(section.querySelector(".cards"), order[category]);
    });
    applyVideos(data.videos || {});
    placeGroups();
    applyThemes();
    decoratePrices();
  }

  function load() {
    fetch("menu.json?t=" + Date.now(), { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) throw new Error("missing");
        return response.json();
      })
      .then(apply)
      .catch(function () { decoratePrices(); });
  }

  window.MenuKit = {
    categories: CATEGORIES,
    base: BASE,
    safeUrl: safeUrl,
    yen: yen,
    showPrice: showPrice,
    markYen: markYen,
    normalizeVideos: normalizeVideos,
    apply: apply,
    placeGroups: placeGroups,
    addItem: appendItem,
    seriesArticle: seriesArticle,
    load: load
  };
})();
