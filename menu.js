(function () {
  var CATEGORIES = {
    representative: "代表",
    staff: "社員",
    company: "会社"
  };

  var PRICE_LABELS = ["インタビュー", "インタビュー＋インサート"];

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
    if (!text || text === "対象外") return "";
    if (/^\d+(?:\.\d+)?$/.test(text)) return text + "万円";
    if (/^\d+(?:\.\d+)?万$/.test(text)) return text + "円";
    return text;
  }

  function showPrice(value) {
    var text = yen(value);
    if (!text) return { text: "対象外", empty: true };
    return { text: text, empty: false };
  }

  function isSingle(fields) {
    return !!fields && Object.prototype.hasOwnProperty.call(fields, "single");
  }

  function setVideo(host, url) {
    var current = host.querySelector("a.sample");
    if (!url) {
      if (current) current.remove();
      return;
    }
    if (!current) {
      current = document.createElement("a");
      current.className = "sample";
      current.target = "_blank";
      current.rel = "noopener noreferrer";
      current.textContent = "参考動画";
      var desc = host.querySelector(".desc");
      var prices = host.querySelector(".card-prices");
      if (prices) prices.before(current);
      else if (desc) desc.after(current);
      else host.appendChild(current);
    }
    current.href = url;
  }

  function setPriceCell(cell, value) {
    var shown = showPrice(value);
    cell.classList.toggle("na", shown.empty);
    cell.textContent = shown.text;
  }

  function priceLine(label, value) {
    var line = document.createElement("p");
    var span = document.createElement("span");
    span.textContent = label;
    var shown = showPrice(value);
    var strong = document.createElement("strong");
    if (shown.empty) strong.className = "na";
    strong.textContent = shown.text;
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
      setPriceCell(cells[0], fields.single);
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
      var text = yen(fields.single);
      if (fields.note && text.indexOf(fields.note) === -1) text += fields.note;
      prices.append(priceLine("料金", text));
      return;
    }
    prices.append(priceLine(PRICE_LABELS[0], fields.interview));
    prices.append(priceLine(PRICE_LABELS[1], fields.workplace));
  }

  function applyFields(id, fields) {
    writeRow(findTagged("tr[data-id]", id), fields);
    writeCard(findTagged("article[data-id]", id), fields);
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
    if (url) setVideo(heading, url);
    var duration = document.createElement("td");
    duration.className = "duration";
    duration.textContent = item.duration || "";
    row.append(heading, duration);
    if (isSingle(item) || item.single) {
      var single = document.createElement("td");
      single.className = "price";
      single.colSpan = 2;
      var singleText = yen(item.single);
      if (item.note && singleText.indexOf(item.note) === -1) singleText += item.note;
      setPriceCell(single, singleText);
      row.append(single);
    } else {
      [item.interview, item.workplace].forEach(function (value) {
        var cell = document.createElement("td");
        cell.className = "price";
        setPriceCell(cell, value);
        row.append(cell);
      });
    }
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
    if (url) setVideo(card, url);
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

  function applyVideos(videos) {
    document.querySelectorAll("tr[data-id], article.card[data-id]").forEach(function (node) {
      var id = node.dataset.id;
      var nameEl = node.querySelector(".name, h4");
      var name = nameEl ? nameEl.textContent.trim() : "";
      var hasId = Object.prototype.hasOwnProperty.call(videos, id);
      var hasName = !!name && Object.prototype.hasOwnProperty.call(videos, name);
      if (!hasId && !hasName) return;
      var host = node.tagName === "TR" ? node.querySelector("th") : node;
      setVideo(host, safeUrl(hasId ? videos[id] : videos[name]));
    });
  }

  function apply(data) {
    data = data || {};
    document.querySelectorAll("[data-extra]").forEach(function (node) { node.remove(); });
    stampBase();
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
  }

  function load() {
    fetch("menu.json?t=" + Date.now(), { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) throw new Error("missing");
        return response.json();
      })
      .then(apply)
      .catch(function () {});
  }

  window.MenuKit = {
    categories: CATEGORIES,
    base: BASE,
    safeUrl: safeUrl,
    yen: yen,
    showPrice: showPrice,
    apply: apply,
    addItem: appendItem,
    load: load
  };
})();
