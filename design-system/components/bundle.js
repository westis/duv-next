/* @ds-bundle: {"format":4,"namespace":"DUV","components":[{"name":"SiteHeader"},{"name":"SearchField"},{"name":"Button"},{"name":"FilterChips"},{"name":"Tag"},{"name":"RecordMarker"},{"name":"PageHeader"},{"name":"SectionHeading"},{"name":"StatStrip"},{"name":"ResultsTable"},{"name":"CalendarList"},{"name":"Panel"}]} */
(function () {
  "use strict";
  var React = window.React;
  var h = React.createElement;

  function cx() {
    var out = [];
    for (var i = 0; i < arguments.length; i++) { if (arguments[i]) out.push(arguments[i]); }
    return out.join(" ");
  }
  function rest(props, omit) {
    var o = {};
    for (var k in props) { if (Object.prototype.hasOwnProperty.call(props, k) && omit.indexOf(k) < 0) o[k] = props[k]; }
    return o;
  }
  function pad2(r) { var s = String(r); return /^\d$/.test(s) ? "0" + s : s; }

  var DEFAULT_NAV = [
    { label: "Calendar", href: "#" },
    { label: "Results", href: "#" },
    { label: "Rankings", href: "#" },
    { label: "Records", href: "#" },
    { label: "Countries", href: "#" }
  ];

  function SearchField(props) {
    var id = props.id || "sg-search";
    return h("div", { className: cx("sg-search", props.onHeader && "sg-search--on-header", props.className) },
      h("label", { htmlFor: id, className: "sg-visually-hidden" }, props.label || "Search runner or race"),
      h("input", { id: id, type: "search", className: "sg-search__input", placeholder: props.placeholder || "Search runner or race", defaultValue: props.defaultValue, onChange: props.onChange })
    );
  }

  function SiteHeader(props) {
    var items = props.items || DEFAULT_NAV;
    return h("header", { className: cx("sg-header", props.className) },
      h("a", { href: props.homeHref || "#", "aria-label": "DUV home" },
        props.logoSrc ? h("img", { className: "sg-header__logo", src: props.logoSrc, alt: "DUV" }) : h("span", { className: "sg-display", style: { fontSize: 24, fontWeight: 800 } }, "DUV")),
      h("nav", { "aria-label": "Main", style: { flex: "1 1 auto" } },
        h("ul", { className: "sg-header__nav" }, items.map(function (it) {
          return h("li", { key: it.label }, h("a", { href: it.href || "#", "aria-current": it.label === props.active ? "page" : undefined }, it.label));
        }))),
      props.search === false ? null : h(SearchField, { onHeader: true, id: "sg-header-search" })
    );
  }

  function Button(props) {
    var variant = props.variant || "primary";
    var size = props.size || "md";
    var other = rest(props, ["variant", "size", "className", "children"]);
    other.className = cx("sg-btn", "sg-btn--" + variant, size === "sm" && "sg-btn--sm", props.className);
    if (!other.type) other.type = "button";
    return h("button", other, props.children);
  }

  function FilterChips(props) {
    var opts = (props.options || []).map(function (o) { return typeof o === "string" ? { value: o, label: o } : o; });
    var _s = React.useState(props.value != null ? props.value : props.defaultValue != null ? props.defaultValue : (opts[0] && opts[0].value));
    var current = props.value != null ? props.value : _s[0];
    return h("div", { className: cx("sg-chips", props.className), role: "group", "aria-label": props.label || "Filter" },
      opts.map(function (o) {
        return h("button", { key: o.value, type: "button", className: "sg-chip", "aria-pressed": o.value === current ? "true" : "false",
          onClick: function () { _s[1](o.value); if (props.onChange) props.onChange(o.value); } }, o.label);
      }));
  }

  function Tag(props) {
    var tone = props.tone || "default";
    var dot = props.status ? h("span", { "aria-hidden": "true", className: "sg-tag__dot sg-tag__dot--" + props.status }) : null;
    return h("span", { className: cx("sg-tag", tone !== "default" && "sg-tag--" + tone, props.className) }, dot, props.children);
  }

  function RecordMarker(props) {
    var kind = props.kind || "NR";
    var variant = props.body ? "body" : kind === "CR" ? "cr" : kind === "PB" ? "pb" : "record";
    var label = [props.body, kind, props.category].filter(Boolean).join(" ");
    return h("span", { className: cx("sg-marker", "sg-marker--" + variant, props.className), title: props.title }, label);
  }

  function PageHeader(props) {
    var meta = props.meta;
    var metaNode = Array.isArray(meta) ? meta.map(function (m, i) { return h(React.Fragment, { key: i }, i > 0 ? h("br") : null, m); }) : meta;
    return h("header", { className: cx("sg-pagehead", props.className) },
      h("div", { className: "sg-pagehead__main" },
        props.kicker ? h("p", { className: "sg-pagehead__kicker" }, props.kicker) : null,
        h("h1", { className: "sg-pagehead__title" }, props.title)),
      meta ? h("p", { className: "sg-pagehead__meta" }, metaNode) : null
    );
  }

  function SectionHeading(props) {
    var Tag = props.as || "h2";
    return h(Tag, { id: props.id, className: cx("sg-section", props.className) },
      h("span", null, props.children),
      props.aside ? h("span", { className: "sg-section__aside" }, props.aside) : null);
  }

  function StatStrip(props) {
    var items = props.items || [];
    return h("dl", { className: cx("sg-stats", props.className), style: { "--sg-cols": String(props.columns || items.length || 3) } },
      items.map(function (it, i) {
        return h("div", { key: i, className: "sg-stat" },
          h("dt", { className: "sg-stat__label" }, it.label),
          h("dd", { className: "sg-stat__value" }, it.value, it.unit ? h("span", { className: "sg-stat__unit" }, " " + it.unit) : null),
          it.detail ? h("dd", { className: "sg-stat__detail" }, it.detail) : null);
      }));
  }

  function ResultsTable(props) {
    var rows = props.rows || [];
    var unit = props.unit == null ? "km" : props.unit;
    return h("div", { className: cx("sg-table-wrap", props.className) },
      h("table", { className: "sg-table" },
        props.caption ? h("caption", { className: "sg-visually-hidden" }, props.caption) : null,
        h("thead", null, h("tr", null,
          h("th", { scope: "col" }, "Rank"),
          h("th", { scope: "col", className: "sg-num" }, "Performance"),
          h("th", { scope: "col" }, "Name"),
          h("th", { scope: "col" }, "Club"),
          h("th", { scope: "col" }, "Nat."),
          h("th", { scope: "col" }, "YOB"),
          h("th", { scope: "col" }, "Cat."),
          h("th", { scope: "col", className: "sg-num" }, "Cat. rank"),
          h("th", { scope: "col", className: "sg-num" }, "km/h"))),
        h("tbody", null, rows.map(function (r, i) {
          var first = String(r.rank) === "1";
          return h("tr", { key: r.id || i, "data-highlight": props.highlight != null && String(props.highlight) === String(r.id || r.rank) ? "" : undefined },
            h("td", null, h("span", { className: cx("sg-table__rank", first && "sg-table__rank--first") }, pad2(r.rank))),
            h("td", { className: "sg-num sg-table__perf" }, r.perf + (unit ? " " + unit : ""), r.marker ? h("span", null, " ", h(RecordMarker, r.marker)) : null),
            h("td", null, h("a", { className: "sg-link", href: r.href || "#" }, r.name)),
            h("td", { className: "sg-table__muted" }, r.club || "—"),
            h("td", null, r.nat),
            h("td", null, r.yob),
            h("td", null, r.cat),
            h("td", { className: "sg-num" }, r.catRank),
            h("td", { className: "sg-num" }, r.speed));
        }))));
  }

  function CalendarList(props) {
    var items = props.items || [];
    return h("ul", { className: cx("sg-cal", props.className) }, items.map(function (c, i) {
      var meta = (c.edition ? c.edition + " edition · " : "") + c.place + (c.nat ? ", " + c.nat : "");
      return h("li", { key: c.id || i, className: "sg-cal__row" },
        h("div", { className: "sg-cal__date" },
          h("span", { className: "sg-cal__day" }, c.day),
          h("span", { className: "sg-cal__wd" }, c.weekday)),
        h("div", { className: "sg-cal__name" },
          h("a", { className: "sg-link sg-cal__title", href: c.href || "#" }, c.name),
          h("span", { className: "sg-cal__meta" }, meta)),
        h("span", { className: "sg-cal__dist" }, c.distance),
        h("span", { className: "sg-cal__type" }, c.type, c.cup ? h("span", { className: "sg-cal__cup" }, c.cup) : null));
    }));
  }

  function Panel(props) {
    return h("section", { className: cx("sg-panel", props.className), "aria-label": props.label }, props.children);
  }

  var api = { SiteHeader: SiteHeader, SearchField: SearchField, Button: Button, FilterChips: FilterChips, Tag: Tag, RecordMarker: RecordMarker, PageHeader: PageHeader, SectionHeading: SectionHeading, StatStrip: StatStrip, ResultsTable: ResultsTable, CalendarList: CalendarList, Panel: Panel };
  window.DUV = window.DUV || {};
  for (var k in api) window.DUV[k] = api[k];
})();
