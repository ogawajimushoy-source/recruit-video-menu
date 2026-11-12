(function () {
  var CATEGORIES = {
    representative: "代表",
    staff: "社員",
    company: "会社"
  };

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
    var text = String(value || "").trim();
    if (!text || text === "対象外") return "";
    if (/^\d+(?:\.\d+)?$/.test(text)) return text + "万円";
    if (/^\d+(?:\.\d+)?万$/.test(text)) return text + "円";
    return text;
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

  function priceNode(value) {
    var strong = document.createElement("strong");
    if (!value) {
      strong.className = "na";
      strong.textContent = "対象外";
      return strong;
    }
    strong.textContent = value;
    return strong;
  }

  function appendItem(item) {
    var section = document.getElementById(item.category);
    if (!section) return;
    var url = safeUrl(item.video);
    var interview = yen(item.interview);
    var workplace = yen(item.workplace);

    var row = document.createElement("tr");
    row.setAttribute("data-extra", "1");
    var heading = document.createElement("th");
    heading.scope = "row";
    var name = document.createElement("span");
    name.className = "name";
    name.textContent = item.name;
    var desc = document.createElement("span");
    desc.className = "desc";
    desc.textContent = item.description || "";
    heading.append(name, desc);
    if (url) setVideo(heading, url);
    var duration = document.createElement("td");
    duration.className = "duration";
    duration.textContent = item.duration || "";
    row.append(heading, duration);

    if (item.single) {
      var single = document.createElement("td");
      single.className = "price";
      single.colSpan = 2;
      single.append(document.createTextNode(yen(item.single)));
      if (item.note) {
        var unit = document.createElement("span");
        unit.className = "unit";
        unit.textContent = item.note;
        single.append(unit);
      }
      row.append(single);
    } else {
      [interview, workplace].forEach(function (value) {
        var cell = document.createElement("td");
        cell.className = value ? "price" : "price na";
        cell.textContent = value || "対象外";
        row.append(cell);
      });
    }
    section.querySelector("tbody").append(row);

    var card = document.createElement("article");
    card.className = "card";
    card.setAttribute("data-extra", "1");
    var title = document.createElement("h4");
    title.textContent = item.name;
    var cardDesc = document.createElement("p");
    cardDesc.className = "desc";
    cardDesc.textContent = item.description || "";
    var meta = document.createElement("p");
    meta.className = "meta";
    meta.textContent = "動画の尺：" + (item.duration || "");
    var prices = document.createElement("div");
    prices.className = "card-prices";
    if (item.single) {
      var line = document.createElement("p");
      var label = document.createElement("span");
      label.textContent = "料金";
      var amount = document.createElement("strong");
      amount.textContent = yen(item.single);
      if (item.note) {
        var note = document.createElement("span");
        note.className = "unit";
        note.textContent = item.note;
        amount.append(note);
      }
      line.append(label, amount);
      prices.append(line);
    } else {
      [
        ["インタビューのみ", interview],
        ["仕事風景の撮影込み", workplace]
      ].forEach(function (pair) {
        var line = document.createElement("p");
        var label = document.createElement("span");
        label.textContent = pair[0];
        line.append(label, priceNode(pair[1]));
        prices.append(line);
      });
    }
    var tax = document.createElement("p");
    tax.className = "tax-note";
    tax.textContent = "税別";
    card.append(title, cardDesc, meta, prices, tax);
    if (url) setVideo(card, url);
    section.querySelector(".cards").append(card);
  }

  function apply(data) {
    document.querySelectorAll("[data-extra]").forEach(function (node) {
      node.remove();
    });
    var videos = data.videos || {};
    document.querySelectorAll(".name, article.card > h4").forEach(function (nameEl) {
      var name = nameEl.textContent.trim();
      if (!Object.prototype.hasOwnProperty.call(videos, name)) return;
      setVideo(nameEl.closest("tr, article.card"), safeUrl(videos[name]));
    });
    (data.items || []).forEach(appendItem);
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
    load: load
  };
})();
