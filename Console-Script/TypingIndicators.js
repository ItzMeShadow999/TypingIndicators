(() => {
  if (window.__cti) window.__cti.stop();

  const { FluxDispatcher, UserStore, SelectedChannelStore, React } = Vencord.Webpack.Common;
  const cache = new Map();
  const typing = new Map();
  const warned = new Set();

  let SHIFT = 26;

  const WORDS = { 0: "typing", 1: "yapping", 2: "venting", 3: "oversharing", 4: "barking", 5: "babbling", 6: "daydreaming", 7: "meowing" };
  const ANIMS = { 0: "none", 1: "pulse", 2: "ring", 3: "wave" };

  const SIZE = 18, K = SIZE / 54, WAVE = 6;
  const STAGGER = { pulse: 0.32, wave: 0.32, ring: 0.3 };
  const RING = [[1.69,-0.09],[0.49,0.25],[-0.74,0.18],[-1.94,-0.22],[-2.88,-1.26],[-3.25,-2.47],[-3.22,-3.77],[-2.75,-5.02],[-1.80,-5.89],[-0.48,-6.25],[0.82,-6.25],[2.05,-5.75],[2.90,-4.77],[3.25,-3.54],[3.20,-2.18],[2.71,-1.02],[1.70,-0.09]];
  const ringFrames = () => RING.map(([x, y], i) =>
    (i * 100 / (RING.length - 1)).toFixed(2) + "% { transform: translate(" + (x * K).toFixed(2) + "px," + (y * K).toFixed(2) + "px); }").join(" ");

  const style = document.createElement("style");
  style.id = "cti-style";
  const css = () => `
    [class*="typingDots_"]:has(.cti-emojis) [class*="dots_"] { display: none !important; }
    [class*="typingDots_"]:has(.cti-emojis) { margin-left: -${SHIFT}px !important; }
    .cti-emojis { display: inline-flex; align-items: center; gap: 3px; margin-right: 5px; vertical-align: middle; }
    .cti-emojis > * { width: ${SIZE}px; height: ${SIZE}px; object-fit: contain; font-size: 16px; line-height: ${SIZE}px; }
    @keyframes cti-pulse {
      0% { transform: scale(1); animation-timing-function: ease-in-out; }
      17.5% { transform: scale(1.16); }
      23% { transform: scale(1.16); animation-timing-function: ease-in-out; }
      40.5%, 100% { transform: scale(1); }
    }
    @keyframes cti-ring { ${ringFrames()} }
    @keyframes cti-wave {
      0% { transform: translateY(0); animation-timing-function: ease-in-out; }
      14.5% { transform: translateY(-${(WAVE * K).toFixed(2)}px); }
      24.4% { transform: translateY(-${(WAVE * K).toFixed(2)}px); animation-timing-function: ease-in-out; }
      40.5%, 100% { transform: translateY(0); }
    }
    .cti-pulse > * { animation: cti-pulse 1.31s infinite; }
    .cti-ring > * { animation: cti-ring 1.61s linear infinite; }
    .cti-wave > * { animation: cti-wave 1.31s infinite; }
    @media (prefers-reduced-motion: reduce) { .cti-emojis > * { animation: none !important; } }
  `;
  style.textContent = css();
  document.head.appendChild(style);

  const warnOnce = (kind, val) => {
    const k = kind + ":" + val;
    if (warned.has(k)) return;
    warned.add(k);
    console.warn("[CTI] unknown " + kind + " value " + val + ", falling back");
  };
  const wordOf = cfg => {
    const n = cfg?.typingSuggestion ?? 0;
    if (n in WORDS) return WORDS[n];
    warnOnce("typingSuggestion", n);
    return "typing";
  };
  const animOf = cfg => {
    const n = cfg?.animation ?? 0;
    if (n in ANIMS) return ANIMS[n];
    warnOnce("animation", n);
    return "none";
  };

  const soleTyper = channelId => {
    const m = typing.get(channelId);
    if (!m) return null;
    const now = Date.now();
    const ids = [];
    for (const [id, exp] of m) {
      if (exp < now) { m.delete(id); continue; }
      ids.push(id);
    }
    return ids.length === 1 ? ids[0] : null;
  };

  const Row = ({ cfg }) => {
    const anim = animOf(cfg);
    const emojis = Array.isArray(cfg.emojis) ? cfg.emojis : [];
    return React.createElement("span", { className: "cti-emojis cti-" + anim },
      emojis.map((e, i) => {
        const st = { animationDelay: (i * (STAGGER[anim] ?? 0)) + "s" };
        return e.id
          ? React.createElement("img", { key: i, style: st, src: "https://cdn.discordapp.com/emojis/" + e.id + "." + (e.animated ? "gif" : "webp") + "?size=44&quality=lossless" })
          : React.createElement("span", { key: i, style: st }, e.name ?? "");
      }));
  };

  const flat = c => Array.isArray(c) ? c.flatMap(flat) : [c];
  const swapWord = (c, word) => Array.isArray(c) ? c.map(x => swapWord(x, word)) :
    typeof c === "string" ? c.replace(/\btyping\b/, word) : c;

  const mutate = props => {
    const id = soleTyper(SelectedChannelStore.getChannelId());
    if (!id) return props;
    const cfg = UserStore.getUser(id)?.typingIndicatorStyle ?? cache.get(id);
    if (!cfg) return props;
    const word = wordOf(cfg);
    const key = "cti|" + id + "|" + animOf(cfg) + "|" + (cfg.emojis || []).map(e => e.id ?? e.name).join(",");
    return { ...props, children: [React.createElement(Row, { key, cfg }), swapWord(props.children, word)] };
  };

  const isTypingText = (type, props) => {
    if (type !== "span" || !props || props.children == null) return false;
    const cls = typeof props.className === "string" ? props.className : "";
    if (props["aria-atomic"] === undefined && !/(^|\s)text_/.test(cls)) return false;
    return flat(props.children).some(c => (c && c.type === "strong") || (typeof c === "string" && /typing/.test(c)));
  };

  const hooks = [];
  let api;
  const hook = (obj, name) => {
    const orig = obj?.[name];
    if (typeof orig !== "function" || orig.__cti) return;
    const wrapped = function (type, props, ...rest) {
      try {
        if (api.debug && type === "span" && props && /text_/.test(String(props.className))) console.log("[CTI] span", props, "match:", isTypingText(type, props), "typer:", soleTyper(SelectedChannelStore.getChannelId()));
        if (isTypingText(type, props)) props = mutate(props);
      } catch (e) { console.warn("[CTI] hook failed", e); }
      return orig.call(this, type, props, ...rest);
    };
    wrapped.__cti = true;
    try { obj[name] = wrapped; } catch { return; }
    if (obj[name] === wrapped) hooks.push(() => { obj[name] = orig; });
  };

  const W = Vencord.Webpack;
  let rts = [];
  try { rts = W.findAll(W.filters.byProps("jsx", "jsxs")); } catch {}
  if (!rts.length) { try { rts = [W.findByProps("jsx", "jsxs")]; } catch {} }
  for (const rt of rts) { hook(rt, "jsx"); hook(rt, "jsxs"); hook(rt, "jsxDEV"); }
  let rc = [];
  try { rc = W.findAll(W.filters.byProps("createElement", "useState")); } catch {}
  for (const r in rc) hook(rc[r], "createElement");
  hook(React, "createElement");
  if (hooks.length) console.log("[CTI] hooked " + hooks.length + " React element creators");
  else console.warn("[CTI] could not hook React jsx/createElement");

  const onStart = ({ channelId, userId, customTypingIndicatorConfig }) => {
    if (userId === UserStore.getCurrentUser().id) return;
    if (!typing.has(channelId)) typing.set(channelId, new Map());
    typing.get(channelId).set(userId, Date.now() + 10000);
    let cfg = customTypingIndicatorConfig;
    if (cfg === undefined) cfg = UserStore.getUser(userId)?.typingIndicatorStyle;
    cache.set(userId, cfg ?? null);
  };
  const onStop = ({ channelId, userId }) => { typing.get(channelId)?.delete(userId); };

  FluxDispatcher.subscribe("TYPING_START", onStart);
  FluxDispatcher.subscribe("TYPING_STOP", onStop);

  api = window.__cti = {
    debug: false,
    cache,
    words: WORDS,
    anims: ANIMS,
    hooked: hooks.length,
    shift(n) { SHIFT = n; style.textContent = css(); },
    stop() {
      FluxDispatcher.unsubscribe("TYPING_START", onStart);
      FluxDispatcher.unsubscribe("TYPING_STOP", onStop);
      hooks.forEach(f => f());
      style.remove();
      delete window.__cti;
    }
  };

  console.log("[CTI] running");
})();
