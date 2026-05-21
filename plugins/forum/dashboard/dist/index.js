"use strict";
(() => {
  // src/dashboard/sdk.ts
  var SDK = window.__HERMES_PLUGIN_SDK__;
  if (!SDK) {
    console.error(
      "forum: window.__HERMES_PLUGIN_SDK__ not found at import time. The plugin cannot run outside Hermes's dashboard shell."
    );
  }
  var React = SDK?.React;
  var useState = SDK?.hooks?.useState;
  var useEffect = SDK?.hooks?.useEffect;
  var useRef = SDK?.hooks?.useRef;
  var useCallback = SDK?.hooks?.useCallback;
  var useMemo = SDK?.hooks?.useMemo;
  var components = SDK?.components ?? {};
  var Card = components.Card;
  var CardHeader = components.CardHeader;
  var CardTitle = components.CardTitle;
  var CardContent = components.CardContent;
  var Badge = components.Badge;
  var Button = components.Button;
  var fetchJSON = SDK?.fetchJSON;
  var HERMES_PLUGINS = window.__HERMES_PLUGINS__;

  // src/dashboard/data/useForumState.ts
  var ATHENA_WS_URL = "ws://localhost:8765/ws";
  var RECONNECT_DELAY_MS = 2e3;
  function useForumState() {
    const [state, setState] = useState(null);
    const [status, setStatus] = useState("idle");
    const [lastUpdateAt, setLastUpdateAt] = useState(null);
    const wsRef = useRef(null);
    const reconnectTimerRef = useRef(null);
    useEffect(() => {
      let mounted = true;
      function connect() {
        if (!mounted) return;
        setStatus("connecting");
        const ws = new WebSocket(ATHENA_WS_URL);
        wsRef.current = ws;
        ws.onopen = () => {
          if (!mounted) return;
          setStatus("open");
        };
        ws.onmessage = (ev) => {
          if (!mounted) return;
          try {
            const msg = JSON.parse(ev.data);
            if (msg.type === "initial_state" || msg.type === "heartbeat") {
              setState(msg);
              setLastUpdateAt(Date.now());
            }
          } catch (err) {
            console.warn("forum: failed to parse WS message", err);
          }
        };
        ws.onerror = () => {
          if (!mounted) return;
          setStatus("error");
        };
        ws.onclose = () => {
          if (!mounted) return;
          setStatus("closed");
          if (reconnectTimerRef.current !== null) {
            clearTimeout(reconnectTimerRef.current);
          }
          reconnectTimerRef.current = window.setTimeout(connect, RECONNECT_DELAY_MS);
        };
      }
      connect();
      return () => {
        mounted = false;
        if (reconnectTimerRef.current !== null) {
          clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = null;
        }
        if (wsRef.current) {
          wsRef.current.close();
          wsRef.current = null;
        }
      };
    }, []);
    return { state, status, lastUpdateAt };
  }

  // src/dashboard/design/tokens.ts
  var COLOR = {
    // Foundation
    background: { l: 0.08, c: 0.025, h: 260 },
    // deep dark indigo
    formBase: { l: 0.94, c: 0.015, h: 90 },
    // pale luminous off-white
    typography: { l: 0.85, c: 0.015, h: 90 },
    // slightly dimmer warm off-white
    // Four drive palette
    drive: {
      curiosity: { l: 0.72, c: 0.11, h: 240 },
      // cool ultramarine
      projectHealth: { l: 0.75, c: 0.12, h: 70 },
      // warm amber
      connection: { l: 0.74, c: 0.09, h: 155 },
      // soft sage
      anticipation: { l: 0.71, c: 0.11, h: 320 }
      // gentle violet
    },
    // Atmosphere weather mode tints (subtle washes over background)
    atmosphere: {
      clear: { l: 0.2, c: 0.02, h: 260 },
      clouded: { l: 0.25, c: 0.03, h: 250 },
      stormy: { l: 0.22, c: 0.04, h: 280 },
      twilight: { l: 0.3, c: 0.035, h: 30 }
    },
    // Audience direction (TOM warmth gradient — 5 states)
    audience: {
      available: { l: 0.75, c: 0.08, h: 60 },
      // warm steady glow
      interruptible: { l: 0.6, c: 0.05, h: 60 },
      // dimmer warm
      focused: { l: 0.45, c: 0.04, h: 220 },
      // dim blue ("in flow elsewhere")
      unavailable: { l: 0.2, c: 0.02, h: 260 },
      // very dim
      quiet: { l: 0.12, c: 0.02, h: 260 }
      // near-absent
    },
    // NEEDS_REVIEW orbs — pale neutral warmth
    needsReviewOrb: { l: 0.78, c: 0.04, h: 80 }
  };
  var DRIVE_IDS = [
    "curiosity",
    "projectHealth",
    "connection",
    "anticipation"
  ];
  var PANTHEON_POSITIONS = {
    curiosity: { nx: 0.18, ny: 0.45 },
    // upper-left
    anticipation: { nx: 0.82, ny: 0.45 },
    // upper-right
    connection: { nx: 0.18, ny: 0.85 },
    // lower-left
    projectHealth: { nx: 0.82, ny: 0.85 }
    // lower-right
  };
  var LAYOUT = {
    // Stage occupies the central region. Slightly below center to leave
    // room for the atmosphere band above + the audience warmth below.
    stage: {
      centerYRatio: 0.54,
      // 54% down — close to center but biased down
      radiusXRatio: 0.1,
      // 10% of canvas WIDTH for spotlight extent
      radiusYRatio: 0.1
      // 10% of canvas HEIGHT (ellipse foreshortening
      //   emerges naturally from non-square canvas)
    },
    // Pantheon ring sits OUTSIDE the stage. Width-scaled X radius gives
    // horizontal spread; height-scaled Y radius keeps the foreshortened
    // perspective of looking down at a flattened ring.
    pantheon: {
      centerYRatio: 0.54,
      ringRadiusXRatio: 0.28,
      // 28% of canvas WIDTH
      ringRadiusYRatio: 0.32,
      // 32% of canvas HEIGHT (taller than wide
      //   per unit, but width is typically larger
      //   so the ring appears wider than tall)
      glyphRadiusRatio: 0.025
      // smaller per-glyph baseline; bloom extends ~3x
    },
    // Atmosphere fills the top portion of the canvas
    atmosphere: {
      topYRatio: 0,
      bottomYRatio: 0.32
    },
    // Substrate fills the bottom portion
    substrate: {
      topYRatio: 0.68,
      bottomYRatio: 1
    },
    // Audience warmth — bottom-edge glow representing TOM presence
    audience: {
      centerYRatio: 0.96,
      glowRadiusXRatio: 0.45,
      // wide warmth across the bottom-front
      glowRadiusYRatio: 0.3
      // less tall (foreshortened)
    }
  };

  // src/dashboard/canvas/geometry.ts
  function configureCanvasForDpr(canvas, ctx, size) {
    canvas.width = Math.floor(size.width * size.dpr);
    canvas.height = Math.floor(size.height * size.dpr);
    canvas.style.width = `${size.width}px`;
    canvas.style.height = `${size.height}px`;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(size.dpr, size.dpr);
  }
  function stageEllipse(size) {
    return {
      x: size.width / 2,
      y: size.height * LAYOUT.stage.centerYRatio,
      rx: size.width * LAYOUT.stage.radiusXRatio,
      ry: size.height * LAYOUT.stage.radiusYRatio
    };
  }
  function pantheonPositions(size) {
    const ringCx = size.width / 2;
    const ringCy = size.height * LAYOUT.pantheon.centerYRatio;
    const rx = size.width * LAYOUT.pantheon.ringRadiusXRatio;
    const ry = size.height * LAYOUT.pantheon.ringRadiusYRatio;
    const out = {};
    for (const driveId of Object.keys(PANTHEON_POSITIONS)) {
      const { nx, ny } = PANTHEON_POSITIONS[driveId];
      out[driveId] = {
        x: ringCx + (nx - 0.5) * rx * 2,
        y: ringCy + (ny - 0.5) * ry * 2
      };
    }
    return out;
  }
  function pantheonGlyphRadius(size) {
    return Math.min(size.width, size.height) * LAYOUT.pantheon.glyphRadiusRatio;
  }
  function atmosphereBand(size) {
    return {
      x: 0,
      y: size.height * LAYOUT.atmosphere.topYRatio,
      w: size.width,
      h: size.height * (LAYOUT.atmosphere.bottomYRatio - LAYOUT.atmosphere.topYRatio)
    };
  }
  function substrateBand(size) {
    return {
      x: 0,
      y: size.height * LAYOUT.substrate.topYRatio,
      w: size.width,
      h: size.height * (LAYOUT.substrate.bottomYRatio - LAYOUT.substrate.topYRatio)
    };
  }
  function audienceFocus(size) {
    return {
      center: { x: size.width / 2, y: size.height * LAYOUT.audience.centerYRatio },
      radiusX: size.width * LAYOUT.audience.glowRadiusXRatio,
      radiusY: size.height * LAYOUT.audience.glowRadiusYRatio
    };
  }

  // node_modules/culori/src/rgb/parseNumber.js
  var parseNumber = (color, len) => {
    if (typeof color !== "number") return;
    if (len === 3) {
      return {
        mode: "rgb",
        r: (color >> 8 & 15 | color >> 4 & 240) / 255,
        g: (color >> 4 & 15 | color & 240) / 255,
        b: (color & 15 | color << 4 & 240) / 255
      };
    }
    if (len === 4) {
      return {
        mode: "rgb",
        r: (color >> 12 & 15 | color >> 8 & 240) / 255,
        g: (color >> 8 & 15 | color >> 4 & 240) / 255,
        b: (color >> 4 & 15 | color & 240) / 255,
        alpha: (color & 15 | color << 4 & 240) / 255
      };
    }
    if (len === 6) {
      return {
        mode: "rgb",
        r: (color >> 16 & 255) / 255,
        g: (color >> 8 & 255) / 255,
        b: (color & 255) / 255
      };
    }
    if (len === 8) {
      return {
        mode: "rgb",
        r: (color >> 24 & 255) / 255,
        g: (color >> 16 & 255) / 255,
        b: (color >> 8 & 255) / 255,
        alpha: (color & 255) / 255
      };
    }
  };
  var parseNumber_default = parseNumber;

  // node_modules/culori/src/colors/named.js
  var named = {
    aliceblue: 15792383,
    antiquewhite: 16444375,
    aqua: 65535,
    aquamarine: 8388564,
    azure: 15794175,
    beige: 16119260,
    bisque: 16770244,
    black: 0,
    blanchedalmond: 16772045,
    blue: 255,
    blueviolet: 9055202,
    brown: 10824234,
    burlywood: 14596231,
    cadetblue: 6266528,
    chartreuse: 8388352,
    chocolate: 13789470,
    coral: 16744272,
    cornflowerblue: 6591981,
    cornsilk: 16775388,
    crimson: 14423100,
    cyan: 65535,
    darkblue: 139,
    darkcyan: 35723,
    darkgoldenrod: 12092939,
    darkgray: 11119017,
    darkgreen: 25600,
    darkgrey: 11119017,
    darkkhaki: 12433259,
    darkmagenta: 9109643,
    darkolivegreen: 5597999,
    darkorange: 16747520,
    darkorchid: 10040012,
    darkred: 9109504,
    darksalmon: 15308410,
    darkseagreen: 9419919,
    darkslateblue: 4734347,
    darkslategray: 3100495,
    darkslategrey: 3100495,
    darkturquoise: 52945,
    darkviolet: 9699539,
    deeppink: 16716947,
    deepskyblue: 49151,
    dimgray: 6908265,
    dimgrey: 6908265,
    dodgerblue: 2003199,
    firebrick: 11674146,
    floralwhite: 16775920,
    forestgreen: 2263842,
    fuchsia: 16711935,
    gainsboro: 14474460,
    ghostwhite: 16316671,
    gold: 16766720,
    goldenrod: 14329120,
    gray: 8421504,
    green: 32768,
    greenyellow: 11403055,
    grey: 8421504,
    honeydew: 15794160,
    hotpink: 16738740,
    indianred: 13458524,
    indigo: 4915330,
    ivory: 16777200,
    khaki: 15787660,
    lavender: 15132410,
    lavenderblush: 16773365,
    lawngreen: 8190976,
    lemonchiffon: 16775885,
    lightblue: 11393254,
    lightcoral: 15761536,
    lightcyan: 14745599,
    lightgoldenrodyellow: 16448210,
    lightgray: 13882323,
    lightgreen: 9498256,
    lightgrey: 13882323,
    lightpink: 16758465,
    lightsalmon: 16752762,
    lightseagreen: 2142890,
    lightskyblue: 8900346,
    lightslategray: 7833753,
    lightslategrey: 7833753,
    lightsteelblue: 11584734,
    lightyellow: 16777184,
    lime: 65280,
    limegreen: 3329330,
    linen: 16445670,
    magenta: 16711935,
    maroon: 8388608,
    mediumaquamarine: 6737322,
    mediumblue: 205,
    mediumorchid: 12211667,
    mediumpurple: 9662683,
    mediumseagreen: 3978097,
    mediumslateblue: 8087790,
    mediumspringgreen: 64154,
    mediumturquoise: 4772300,
    mediumvioletred: 13047173,
    midnightblue: 1644912,
    mintcream: 16121850,
    mistyrose: 16770273,
    moccasin: 16770229,
    navajowhite: 16768685,
    navy: 128,
    oldlace: 16643558,
    olive: 8421376,
    olivedrab: 7048739,
    orange: 16753920,
    orangered: 16729344,
    orchid: 14315734,
    palegoldenrod: 15657130,
    palegreen: 10025880,
    paleturquoise: 11529966,
    palevioletred: 14381203,
    papayawhip: 16773077,
    peachpuff: 16767673,
    peru: 13468991,
    pink: 16761035,
    plum: 14524637,
    powderblue: 11591910,
    purple: 8388736,
    // Added in CSS Colors Level 4:
    // https://drafts.csswg.org/css-color/#changes-from-3
    rebeccapurple: 6697881,
    red: 16711680,
    rosybrown: 12357519,
    royalblue: 4286945,
    saddlebrown: 9127187,
    salmon: 16416882,
    sandybrown: 16032864,
    seagreen: 3050327,
    seashell: 16774638,
    sienna: 10506797,
    silver: 12632256,
    skyblue: 8900331,
    slateblue: 6970061,
    slategray: 7372944,
    slategrey: 7372944,
    snow: 16775930,
    springgreen: 65407,
    steelblue: 4620980,
    tan: 13808780,
    teal: 32896,
    thistle: 14204888,
    tomato: 16737095,
    turquoise: 4251856,
    violet: 15631086,
    wheat: 16113331,
    white: 16777215,
    whitesmoke: 16119285,
    yellow: 16776960,
    yellowgreen: 10145074
  };
  var named_default = named;

  // node_modules/culori/src/rgb/parseNamed.js
  var parseNamed = (color) => {
    return parseNumber_default(named_default[color.toLowerCase()], 6);
  };
  var parseNamed_default = parseNamed;

  // node_modules/culori/src/rgb/parseHex.js
  var hex = /^#?([0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{4}|[0-9a-f]{3})$/i;
  var parseHex = (color) => {
    let match;
    return (match = color.match(hex)) ? parseNumber_default(parseInt(match[1], 16), match[1].length) : void 0;
  };
  var parseHex_default = parseHex;

  // node_modules/culori/src/util/regex.js
  var num = "([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)";
  var num_none = `(?:${num}|none)`;
  var per = `${num}%`;
  var per_none = `(?:${num}%|none)`;
  var num_per = `(?:${num}%|${num})`;
  var num_per_none = `(?:${num}%|${num}|none)`;
  var hue = `(?:${num}(deg|grad|rad|turn)|${num})`;
  var hue_none = `(?:${num}(deg|grad|rad|turn)|${num}|none)`;
  var c = `\\s*,\\s*`;
  var rx_num_per_none = new RegExp("^" + num_per_none + "$");

  // node_modules/culori/src/rgb/parseRgbLegacy.js
  var rgb_num_old = new RegExp(
    `^rgba?\\(\\s*${num}${c}${num}${c}${num}\\s*(?:,\\s*${num_per}\\s*)?\\)$`
  );
  var rgb_per_old = new RegExp(
    `^rgba?\\(\\s*${per}${c}${per}${c}${per}\\s*(?:,\\s*${num_per}\\s*)?\\)$`
  );
  var parseRgbLegacy = (color) => {
    let res = { mode: "rgb" };
    let match;
    if (match = color.match(rgb_num_old)) {
      if (match[1] !== void 0) {
        res.r = match[1] / 255;
      }
      if (match[2] !== void 0) {
        res.g = match[2] / 255;
      }
      if (match[3] !== void 0) {
        res.b = match[3] / 255;
      }
    } else if (match = color.match(rgb_per_old)) {
      if (match[1] !== void 0) {
        res.r = match[1] / 100;
      }
      if (match[2] !== void 0) {
        res.g = match[2] / 100;
      }
      if (match[3] !== void 0) {
        res.b = match[3] / 100;
      }
    } else {
      return void 0;
    }
    if (match[4] !== void 0) {
      res.alpha = Math.max(0, Math.min(1, match[4] / 100));
    } else if (match[5] !== void 0) {
      res.alpha = Math.max(0, Math.min(1, +match[5]));
    }
    return res;
  };
  var parseRgbLegacy_default = parseRgbLegacy;

  // node_modules/culori/src/_prepare.js
  var prepare = (color, mode) => color === void 0 ? void 0 : typeof color !== "object" ? parse_default(color) : color.mode !== void 0 ? color : mode ? { ...color, mode } : void 0;
  var prepare_default = prepare;

  // node_modules/culori/src/converter.js
  var converter = (target_mode = "rgb") => (color) => (color = prepare_default(color, target_mode)) !== void 0 ? (
    // if the color's mode corresponds to our target mode
    color.mode === target_mode ? (
      // then just return the color
      color
    ) : (
      // otherwise check to see if we have a dedicated
      // converter for the target mode
      converters[color.mode][target_mode] ? (
        // and return its result...
        converters[color.mode][target_mode](color)
      ) : (
        // ...otherwise pass through RGB as an intermediary step.
        // if the target mode is RGB...
        target_mode === "rgb" ? (
          // just return the RGB
          converters[color.mode].rgb(color)
        ) : (
          // otherwise convert color.mode -> RGB -> target_mode
          converters.rgb[target_mode](converters[color.mode].rgb(color))
        )
      )
    )
  ) : void 0;
  var converter_default = converter;

  // node_modules/culori/src/modes.js
  var converters = {};
  var modes = {};
  var parsers = [];
  var colorProfiles = {};
  var identity = (v) => v;
  var useMode = (definition29) => {
    converters[definition29.mode] = {
      ...converters[definition29.mode],
      ...definition29.toMode
    };
    Object.keys(definition29.fromMode || {}).forEach((k4) => {
      if (!converters[k4]) {
        converters[k4] = {};
      }
      converters[k4][definition29.mode] = definition29.fromMode[k4];
    });
    if (!definition29.ranges) {
      definition29.ranges = {};
    }
    if (!definition29.difference) {
      definition29.difference = {};
    }
    definition29.channels.forEach((channel) => {
      if (definition29.ranges[channel] === void 0) {
        definition29.ranges[channel] = [0, 1];
      }
      if (!definition29.interpolate[channel]) {
        throw new Error(`Missing interpolator for: ${channel}`);
      }
      if (typeof definition29.interpolate[channel] === "function") {
        definition29.interpolate[channel] = {
          use: definition29.interpolate[channel]
        };
      }
      if (!definition29.interpolate[channel].fixup) {
        definition29.interpolate[channel].fixup = identity;
      }
    });
    modes[definition29.mode] = definition29;
    (definition29.parse || []).forEach((parser) => {
      useParser(parser, definition29.mode);
    });
    return converter_default(definition29.mode);
  };
  var getMode = (mode) => modes[mode];
  var useParser = (parser, mode) => {
    if (typeof parser === "string") {
      if (!mode) {
        throw new Error(`'mode' required when 'parser' is a string`);
      }
      colorProfiles[parser] = mode;
    } else if (typeof parser === "function") {
      if (parsers.indexOf(parser) < 0) {
        parsers.push(parser);
      }
    }
  };

  // node_modules/culori/src/parse.js
  var IdentStartCodePoint = /[^\x00-\x7F]|[a-zA-Z_]/;
  var IdentCodePoint = /[^\x00-\x7F]|[-\w]/;
  var Tok = {
    Function: "function",
    Ident: "ident",
    Number: "number",
    Percentage: "percentage",
    ParenClose: ")",
    None: "none",
    Hue: "hue",
    Alpha: "alpha"
  };
  var _i = 0;
  function is_num(chars) {
    let ch = chars[_i];
    let ch1 = chars[_i + 1];
    if (ch === "-" || ch === "+") {
      return /\d/.test(ch1) || ch1 === "." && /\d/.test(chars[_i + 2]);
    }
    if (ch === ".") {
      return /\d/.test(ch1);
    }
    return /\d/.test(ch);
  }
  function is_ident(chars) {
    if (_i >= chars.length) {
      return false;
    }
    let ch = chars[_i];
    if (IdentStartCodePoint.test(ch)) {
      return true;
    }
    if (ch === "-") {
      if (chars.length - _i < 2) {
        return false;
      }
      let ch1 = chars[_i + 1];
      if (ch1 === "-" || IdentStartCodePoint.test(ch1)) {
        return true;
      }
      return false;
    }
    return false;
  }
  var huenits = {
    deg: 1,
    rad: 180 / Math.PI,
    grad: 9 / 10,
    turn: 360
  };
  function num2(chars) {
    let value = "";
    if (chars[_i] === "-" || chars[_i] === "+") {
      value += chars[_i++];
    }
    value += digits(chars);
    if (chars[_i] === "." && /\d/.test(chars[_i + 1])) {
      value += chars[_i++] + digits(chars);
    }
    if (chars[_i] === "e" || chars[_i] === "E") {
      if ((chars[_i + 1] === "-" || chars[_i + 1] === "+") && /\d/.test(chars[_i + 2])) {
        value += chars[_i++] + chars[_i++] + digits(chars);
      } else if (/\d/.test(chars[_i + 1])) {
        value += chars[_i++] + digits(chars);
      }
    }
    if (is_ident(chars)) {
      let id = ident(chars);
      if (id === "deg" || id === "rad" || id === "turn" || id === "grad") {
        return { type: Tok.Hue, value: value * huenits[id] };
      }
      return void 0;
    }
    if (chars[_i] === "%") {
      _i++;
      return { type: Tok.Percentage, value: +value };
    }
    return { type: Tok.Number, value: +value };
  }
  function digits(chars) {
    let v = "";
    while (/\d/.test(chars[_i])) {
      v += chars[_i++];
    }
    return v;
  }
  function ident(chars) {
    let v = "";
    while (_i < chars.length && IdentCodePoint.test(chars[_i])) {
      v += chars[_i++];
    }
    return v;
  }
  function identlike(chars) {
    let v = ident(chars);
    if (chars[_i] === "(") {
      _i++;
      return { type: Tok.Function, value: v };
    }
    if (v === "none") {
      return { type: Tok.None, value: void 0 };
    }
    return { type: Tok.Ident, value: v };
  }
  function tokenize(str = "") {
    let chars = str.trim();
    let tokens = [];
    let ch;
    _i = 0;
    while (_i < chars.length) {
      ch = chars[_i++];
      if (ch === "\n" || ch === "	" || ch === " ") {
        while (_i < chars.length && (chars[_i] === "\n" || chars[_i] === "	" || chars[_i] === " ")) {
          _i++;
        }
        continue;
      }
      if (ch === ",") {
        return void 0;
      }
      if (ch === ")") {
        tokens.push({ type: Tok.ParenClose });
        continue;
      }
      if (ch === "+") {
        _i--;
        if (is_num(chars)) {
          tokens.push(num2(chars));
          continue;
        }
        return void 0;
      }
      if (ch === "-") {
        _i--;
        if (is_num(chars)) {
          tokens.push(num2(chars));
          continue;
        }
        if (is_ident(chars)) {
          tokens.push({ type: Tok.Ident, value: ident(chars) });
          continue;
        }
        return void 0;
      }
      if (ch === ".") {
        _i--;
        if (is_num(chars)) {
          tokens.push(num2(chars));
          continue;
        }
        return void 0;
      }
      if (ch === "/") {
        while (_i < chars.length && (chars[_i] === "\n" || chars[_i] === "	" || chars[_i] === " ")) {
          _i++;
        }
        let alpha;
        if (is_num(chars)) {
          alpha = num2(chars);
          if (alpha.type !== Tok.Hue) {
            tokens.push({ type: Tok.Alpha, value: alpha });
            continue;
          }
        }
        if (is_ident(chars)) {
          if (ident(chars) === "none") {
            tokens.push({
              type: Tok.Alpha,
              value: { type: Tok.None, value: void 0 }
            });
            continue;
          }
        }
        return void 0;
      }
      if (/\d/.test(ch)) {
        _i--;
        tokens.push(num2(chars));
        continue;
      }
      if (IdentStartCodePoint.test(ch)) {
        _i--;
        tokens.push(identlike(chars));
        continue;
      }
      return void 0;
    }
    return tokens;
  }
  function parseColorSyntax(tokens) {
    tokens._i = 0;
    let token = tokens[tokens._i++];
    if (!token || token.type !== Tok.Function || token.value !== "color") {
      return void 0;
    }
    token = tokens[tokens._i++];
    if (token.type !== Tok.Ident) {
      return void 0;
    }
    const mode = colorProfiles[token.value];
    if (!mode) {
      return void 0;
    }
    const res = { mode };
    const coords = consumeCoords(tokens, false);
    if (!coords) {
      return void 0;
    }
    const channels = getMode(mode).channels;
    for (let ii = 0, c2, ch; ii < channels.length; ii++) {
      c2 = coords[ii];
      ch = channels[ii];
      if (c2.type !== Tok.None) {
        res[ch] = c2.type === Tok.Number ? c2.value : c2.value / 100;
        if (ch === "alpha") {
          res[ch] = Math.max(0, Math.min(1, res[ch]));
        }
      }
    }
    return res;
  }
  function consumeCoords(tokens, includeHue) {
    const coords = [];
    let token;
    while (tokens._i < tokens.length) {
      token = tokens[tokens._i++];
      if (token.type === Tok.None || token.type === Tok.Number || token.type === Tok.Alpha || token.type === Tok.Percentage || includeHue && token.type === Tok.Hue) {
        coords.push(token);
        continue;
      }
      if (token.type === Tok.ParenClose) {
        if (tokens._i < tokens.length) {
          return void 0;
        }
        continue;
      }
      return void 0;
    }
    if (coords.length < 3 || coords.length > 4) {
      return void 0;
    }
    if (coords.length === 4) {
      if (coords[3].type !== Tok.Alpha) {
        return void 0;
      }
      coords[3] = coords[3].value;
    }
    if (coords.length === 3) {
      coords.push({ type: Tok.None, value: void 0 });
    }
    return coords.every((c2) => c2.type !== Tok.Alpha) ? coords : void 0;
  }
  function parseModernSyntax(tokens, includeHue) {
    tokens._i = 0;
    let token = tokens[tokens._i++];
    if (!token || token.type !== Tok.Function) {
      return void 0;
    }
    let coords = consumeCoords(tokens, includeHue);
    if (!coords) {
      return void 0;
    }
    coords.unshift(token.value);
    return coords;
  }
  var parse = (color) => {
    if (typeof color !== "string") {
      return void 0;
    }
    const tokens = tokenize(color);
    const parsed = tokens ? parseModernSyntax(tokens, true) : void 0;
    let result = void 0;
    let i = 0;
    let len = parsers.length;
    while (i < len) {
      if ((result = parsers[i++](color, parsed)) !== void 0) {
        return result;
      }
    }
    return tokens ? parseColorSyntax(tokens) : void 0;
  };
  var parse_default = parse;

  // node_modules/culori/src/rgb/parseRgb.js
  function parseRgb(color, parsed) {
    if (!parsed || parsed[0] !== "rgb" && parsed[0] !== "rgba") {
      return void 0;
    }
    const res = { mode: "rgb" };
    const [, r, g, b, alpha] = parsed;
    if (r.type === Tok.Hue || g.type === Tok.Hue || b.type === Tok.Hue) {
      return void 0;
    }
    if (r.type !== Tok.None) {
      res.r = r.type === Tok.Number ? r.value / 255 : r.value / 100;
    }
    if (g.type !== Tok.None) {
      res.g = g.type === Tok.Number ? g.value / 255 : g.value / 100;
    }
    if (b.type !== Tok.None) {
      res.b = b.type === Tok.Number ? b.value / 255 : b.value / 100;
    }
    if (alpha.type !== Tok.None) {
      res.alpha = Math.min(
        1,
        Math.max(
          0,
          alpha.type === Tok.Number ? alpha.value : alpha.value / 100
        )
      );
    }
    return res;
  }
  var parseRgb_default = parseRgb;

  // node_modules/culori/src/rgb/parseTransparent.js
  var parseTransparent = (c2) => c2 === "transparent" ? { mode: "rgb", r: 0, g: 0, b: 0, alpha: 0 } : void 0;
  var parseTransparent_default = parseTransparent;

  // node_modules/culori/src/interpolate/lerp.js
  var lerp = (a, b, t) => a + t * (b - a);

  // node_modules/culori/src/interpolate/piecewise.js
  var get_classes = (arr) => {
    let classes = [];
    for (let i = 0; i < arr.length - 1; i++) {
      let a = arr[i];
      let b = arr[i + 1];
      if (a === void 0 && b === void 0) {
        classes.push(void 0);
      } else if (a !== void 0 && b !== void 0) {
        classes.push([a, b]);
      } else {
        classes.push(a !== void 0 ? [a, a] : [b, b]);
      }
    }
    return classes;
  };
  var interpolatorPiecewise = (interpolator) => (arr) => {
    let classes = get_classes(arr);
    return (t) => {
      let cls = t * classes.length;
      let idx = t >= 1 ? classes.length - 1 : Math.max(Math.floor(cls), 0);
      let pair = classes[idx];
      return pair === void 0 ? void 0 : interpolator(pair[0], pair[1], cls - idx);
    };
  };

  // node_modules/culori/src/interpolate/linear.js
  var interpolatorLinear = interpolatorPiecewise(lerp);

  // node_modules/culori/src/fixup/alpha.js
  var fixupAlpha = (arr) => {
    let some_defined = false;
    let res = arr.map((v) => {
      if (v !== void 0) {
        some_defined = true;
        return v;
      }
      return 1;
    });
    return some_defined ? res : arr;
  };

  // node_modules/culori/src/rgb/definition.js
  var definition = {
    mode: "rgb",
    channels: ["r", "g", "b", "alpha"],
    parse: [
      parseRgb_default,
      parseHex_default,
      parseRgbLegacy_default,
      parseNamed_default,
      parseTransparent_default,
      "srgb"
    ],
    serialize: "srgb",
    interpolate: {
      r: interpolatorLinear,
      g: interpolatorLinear,
      b: interpolatorLinear,
      alpha: { use: interpolatorLinear, fixup: fixupAlpha }
    },
    gamut: true,
    white: { r: 1, g: 1, b: 1 },
    black: { r: 0, g: 0, b: 0 }
  };
  var definition_default = definition;

  // node_modules/culori/src/a98/convertA98ToXyz65.js
  var linearize = (v = 0) => Math.pow(Math.abs(v), 563 / 256) * Math.sign(v);
  var convertA98ToXyz65 = (a982) => {
    let r = linearize(a982.r);
    let g = linearize(a982.g);
    let b = linearize(a982.b);
    let res = {
      mode: "xyz65",
      x: 0.5766690429101305 * r + 0.1855582379065463 * g + 0.1882286462349947 * b,
      y: 0.297344975250536 * r + 0.6273635662554661 * g + 0.0752914584939979 * b,
      z: 0.0270313613864123 * r + 0.0706888525358272 * g + 0.9913375368376386 * b
    };
    if (a982.alpha !== void 0) {
      res.alpha = a982.alpha;
    }
    return res;
  };
  var convertA98ToXyz65_default = convertA98ToXyz65;

  // node_modules/culori/src/a98/convertXyz65ToA98.js
  var gamma = (v) => Math.pow(Math.abs(v), 256 / 563) * Math.sign(v);
  var convertXyz65ToA98 = ({ x, y, z, alpha }) => {
    if (x === void 0) x = 0;
    if (y === void 0) y = 0;
    if (z === void 0) z = 0;
    let res = {
      mode: "a98",
      r: gamma(
        x * 2.0415879038107465 - y * 0.5650069742788597 - 0.3447313507783297 * z
      ),
      g: gamma(
        x * -0.9692436362808798 + y * 1.8759675015077206 + 0.0415550574071756 * z
      ),
      b: gamma(
        x * 0.0134442806320312 - y * 0.1183623922310184 + 1.0151749943912058 * z
      )
    };
    if (alpha !== void 0) {
      res.alpha = alpha;
    }
    return res;
  };
  var convertXyz65ToA98_default = convertXyz65ToA98;

  // node_modules/culori/src/lrgb/convertRgbToLrgb.js
  var fn = (c2 = 0) => {
    const abs2 = Math.abs(c2);
    if (abs2 <= 0.04045) {
      return c2 / 12.92;
    }
    return (Math.sign(c2) || 1) * Math.pow((abs2 + 0.055) / 1.055, 2.4);
  };
  var convertRgbToLrgb = ({ r, g, b, alpha }) => {
    let res = {
      mode: "lrgb",
      r: fn(r),
      g: fn(g),
      b: fn(b)
    };
    if (alpha !== void 0) res.alpha = alpha;
    return res;
  };
  var convertRgbToLrgb_default = convertRgbToLrgb;

  // node_modules/culori/src/xyz65/convertRgbToXyz65.js
  var convertRgbToXyz65 = (rgb2) => {
    let { r, g, b, alpha } = convertRgbToLrgb_default(rgb2);
    let res = {
      mode: "xyz65",
      x: 0.4123907992659593 * r + 0.357584339383878 * g + 0.1804807884018343 * b,
      y: 0.2126390058715102 * r + 0.715168678767756 * g + 0.0721923153607337 * b,
      z: 0.0193308187155918 * r + 0.119194779794626 * g + 0.9505321522496607 * b
    };
    if (alpha !== void 0) {
      res.alpha = alpha;
    }
    return res;
  };
  var convertRgbToXyz65_default = convertRgbToXyz65;

  // node_modules/culori/src/lrgb/convertLrgbToRgb.js
  var fn2 = (c2 = 0) => {
    const abs2 = Math.abs(c2);
    if (abs2 > 31308e-7) {
      return (Math.sign(c2) || 1) * (1.055 * Math.pow(abs2, 1 / 2.4) - 0.055);
    }
    return c2 * 12.92;
  };
  var convertLrgbToRgb = ({ r, g, b, alpha }, mode = "rgb") => {
    let res = {
      mode,
      r: fn2(r),
      g: fn2(g),
      b: fn2(b)
    };
    if (alpha !== void 0) res.alpha = alpha;
    return res;
  };
  var convertLrgbToRgb_default = convertLrgbToRgb;

  // node_modules/culori/src/xyz65/convertXyz65ToRgb.js
  var convertXyz65ToRgb = ({ x, y, z, alpha }) => {
    if (x === void 0) x = 0;
    if (y === void 0) y = 0;
    if (z === void 0) z = 0;
    let res = convertLrgbToRgb_default({
      r: x * 3.2409699419045226 - y * 1.537383177570094 - 0.4986107602930034 * z,
      g: x * -0.9692436362808796 + y * 1.8759675015077204 + 0.0415550574071756 * z,
      b: x * 0.0556300796969936 - y * 0.2039769588889765 + 1.0569715142428784 * z
    });
    if (alpha !== void 0) {
      res.alpha = alpha;
    }
    return res;
  };
  var convertXyz65ToRgb_default = convertXyz65ToRgb;

  // node_modules/culori/src/a98/definition.js
  var definition2 = {
    ...definition_default,
    mode: "a98",
    parse: ["a98-rgb"],
    serialize: "a98-rgb",
    fromMode: {
      rgb: (color) => convertXyz65ToA98_default(convertRgbToXyz65_default(color)),
      xyz65: convertXyz65ToA98_default
    },
    toMode: {
      rgb: (color) => convertXyz65ToRgb_default(convertA98ToXyz65_default(color)),
      xyz65: convertA98ToXyz65_default
    }
  };
  var definition_default2 = definition2;

  // node_modules/culori/src/util/normalizeHue.js
  var normalizeHue = (hue3) => (hue3 = hue3 % 360) < 0 ? hue3 + 360 : hue3;
  var normalizeHue_default = normalizeHue;

  // node_modules/culori/src/fixup/hue.js
  var hue2 = (hues, fn5) => {
    return hues.map((hue3, idx, arr) => {
      if (hue3 === void 0) {
        return hue3;
      }
      let normalized = normalizeHue_default(hue3);
      if (idx === 0 || hues[idx - 1] === void 0) {
        return normalized;
      }
      return fn5(normalized - normalizeHue_default(arr[idx - 1]));
    }).reduce((acc, curr) => {
      if (!acc.length || curr === void 0 || acc[acc.length - 1] === void 0) {
        acc.push(curr);
        return acc;
      }
      acc.push(curr + acc[acc.length - 1]);
      return acc;
    }, []);
  };
  var fixupHueShorter = (arr) => hue2(arr, (d) => Math.abs(d) <= 180 ? d : d - 360 * Math.sign(d));

  // node_modules/culori/src/cubehelix/constants.js
  var M = [-0.14861, 1.78277, -0.29227, -0.90649, 1.97294, 0];
  var degToRad = Math.PI / 180;
  var radToDeg = 180 / Math.PI;

  // node_modules/culori/src/cubehelix/convertRgbToCubehelix.js
  var DE = M[3] * M[4];
  var BE = M[1] * M[4];
  var BCAD = M[1] * M[2] - M[0] * M[3];
  var convertRgbToCubehelix = ({ r, g, b, alpha }) => {
    if (r === void 0) r = 0;
    if (g === void 0) g = 0;
    if (b === void 0) b = 0;
    let l = (BCAD * b + r * DE - g * BE) / (BCAD + DE - BE);
    let x = b - l;
    let y = (M[4] * (g - l) - M[2] * x) / M[3];
    let res = {
      mode: "cubehelix",
      l,
      s: l === 0 || l === 1 ? void 0 : Math.sqrt(x * x + y * y) / (M[4] * l * (1 - l))
    };
    if (res.s) res.h = Math.atan2(y, x) * radToDeg - 120;
    if (alpha !== void 0) res.alpha = alpha;
    return res;
  };
  var convertRgbToCubehelix_default = convertRgbToCubehelix;

  // node_modules/culori/src/cubehelix/convertCubehelixToRgb.js
  var convertCubehelixToRgb = ({ h, s, l, alpha }) => {
    let res = { mode: "rgb" };
    h = (h === void 0 ? 0 : h + 120) * degToRad;
    if (l === void 0) l = 0;
    let amp = s === void 0 ? 0 : s * l * (1 - l);
    let cosh = Math.cos(h);
    let sinh = Math.sin(h);
    res.r = l + amp * (M[0] * cosh + M[1] * sinh);
    res.g = l + amp * (M[2] * cosh + M[3] * sinh);
    res.b = l + amp * (M[4] * cosh + M[5] * sinh);
    if (alpha !== void 0) res.alpha = alpha;
    return res;
  };
  var convertCubehelixToRgb_default = convertCubehelixToRgb;

  // node_modules/culori/src/difference.js
  var differenceHueSaturation = (std, smp) => {
    if (std.h === void 0 || smp.h === void 0 || !std.s || !smp.s) {
      return 0;
    }
    let std_h = normalizeHue_default(std.h);
    let smp_h = normalizeHue_default(smp.h);
    let dH = Math.sin((smp_h - std_h + 360) / 2 * Math.PI / 180);
    return 2 * Math.sqrt(std.s * smp.s) * dH;
  };
  var differenceHueNaive = (std, smp) => {
    if (std.h === void 0 || smp.h === void 0) {
      return 0;
    }
    let std_h = normalizeHue_default(std.h);
    let smp_h = normalizeHue_default(smp.h);
    if (Math.abs(smp_h - std_h) > 180) {
      return std_h - (smp_h - 360 * Math.sign(smp_h - std_h));
    }
    return smp_h - std_h;
  };
  var differenceHueChroma = (std, smp) => {
    if (std.h === void 0 || smp.h === void 0 || !std.c || !smp.c) {
      return 0;
    }
    let std_h = normalizeHue_default(std.h);
    let smp_h = normalizeHue_default(smp.h);
    let dH = Math.sin((smp_h - std_h + 360) / 2 * Math.PI / 180);
    return 2 * Math.sqrt(std.c * smp.c) * dH;
  };

  // node_modules/culori/src/average.js
  var averageAngle = (val) => {
    let sum = val.reduce(
      (sum2, val2) => {
        if (val2 !== void 0) {
          let rad = val2 * Math.PI / 180;
          sum2.sin += Math.sin(rad);
          sum2.cos += Math.cos(rad);
        }
        return sum2;
      },
      { sin: 0, cos: 0 }
    );
    let angle = Math.atan2(sum.sin, sum.cos) * 180 / Math.PI;
    return angle < 0 ? 360 + angle : angle;
  };

  // node_modules/culori/src/cubehelix/definition.js
  var definition3 = {
    mode: "cubehelix",
    channels: ["h", "s", "l", "alpha"],
    parse: ["--cubehelix"],
    serialize: "--cubehelix",
    ranges: {
      h: [0, 360],
      s: [0, 4.614],
      l: [0, 1]
    },
    fromMode: {
      rgb: convertRgbToCubehelix_default
    },
    toMode: {
      rgb: convertCubehelixToRgb_default
    },
    interpolate: {
      h: {
        use: interpolatorLinear,
        fixup: fixupHueShorter
      },
      s: interpolatorLinear,
      l: interpolatorLinear,
      alpha: {
        use: interpolatorLinear,
        fixup: fixupAlpha
      }
    },
    difference: {
      h: differenceHueSaturation
    },
    average: {
      h: averageAngle
    }
  };
  var definition_default3 = definition3;

  // node_modules/culori/src/lch/convertLabToLch.js
  var convertLabToLch = ({ l, a, b, alpha }, mode = "lch") => {
    if (a === void 0) a = 0;
    if (b === void 0) b = 0;
    let c2 = Math.sqrt(a * a + b * b);
    let res = { mode, l, c: c2 };
    if (c2) res.h = normalizeHue_default(Math.atan2(b, a) * 180 / Math.PI);
    if (alpha !== void 0) res.alpha = alpha;
    return res;
  };
  var convertLabToLch_default = convertLabToLch;

  // node_modules/culori/src/lch/convertLchToLab.js
  var convertLchToLab = ({ l, c: c2, h, alpha }, mode = "lab") => {
    if (h === void 0) h = 0;
    let res = {
      mode,
      l,
      a: c2 ? c2 * Math.cos(h / 180 * Math.PI) : 0,
      b: c2 ? c2 * Math.sin(h / 180 * Math.PI) : 0
    };
    if (alpha !== void 0) res.alpha = alpha;
    return res;
  };
  var convertLchToLab_default = convertLchToLab;

  // node_modules/culori/src/xyz65/constants.js
  var k = Math.pow(29, 3) / Math.pow(3, 3);
  var e = Math.pow(6, 3) / Math.pow(29, 3);

  // node_modules/culori/src/constants.js
  var D50 = {
    X: 0.3457 / 0.3585,
    Y: 1,
    Z: (1 - 0.3457 - 0.3585) / 0.3585
  };
  var D65 = {
    X: 0.3127 / 0.329,
    Y: 1,
    Z: (1 - 0.3127 - 0.329) / 0.329
  };
  var k2 = Math.pow(29, 3) / Math.pow(3, 3);
  var e2 = Math.pow(6, 3) / Math.pow(29, 3);

  // node_modules/culori/src/lab65/convertLab65ToXyz65.js
  var fn3 = (v) => Math.pow(v, 3) > e ? Math.pow(v, 3) : (116 * v - 16) / k;
  var convertLab65ToXyz65 = ({ l, a, b, alpha }) => {
    if (l === void 0) l = 0;
    if (a === void 0) a = 0;
    if (b === void 0) b = 0;
    let fy = (l + 16) / 116;
    let fx = a / 500 + fy;
    let fz = fy - b / 200;
    let res = {
      mode: "xyz65",
      x: fn3(fx) * D65.X,
      y: fn3(fy) * D65.Y,
      z: fn3(fz) * D65.Z
    };
    if (alpha !== void 0) {
      res.alpha = alpha;
    }
    return res;
  };
  var convertLab65ToXyz65_default = convertLab65ToXyz65;

  // node_modules/culori/src/lab65/convertLab65ToRgb.js
  var convertLab65ToRgb = (lab2) => convertXyz65ToRgb_default(convertLab65ToXyz65_default(lab2));
  var convertLab65ToRgb_default = convertLab65ToRgb;

  // node_modules/culori/src/lab65/convertXyz65ToLab65.js
  var f = (value) => value > e ? Math.cbrt(value) : (k * value + 16) / 116;
  var convertXyz65ToLab65 = ({ x, y, z, alpha }) => {
    if (x === void 0) x = 0;
    if (y === void 0) y = 0;
    if (z === void 0) z = 0;
    let f0 = f(x / D65.X);
    let f1 = f(y / D65.Y);
    let f22 = f(z / D65.Z);
    let res = {
      mode: "lab65",
      l: 116 * f1 - 16,
      a: 500 * (f0 - f1),
      b: 200 * (f1 - f22)
    };
    if (alpha !== void 0) {
      res.alpha = alpha;
    }
    return res;
  };
  var convertXyz65ToLab65_default = convertXyz65ToLab65;

  // node_modules/culori/src/lab65/convertRgbToLab65.js
  var convertRgbToLab65 = (rgb2) => {
    let res = convertXyz65ToLab65_default(convertRgbToXyz65_default(rgb2));
    if (rgb2.r === rgb2.b && rgb2.b === rgb2.g) {
      res.a = res.b = 0;
    }
    return res;
  };
  var convertRgbToLab65_default = convertRgbToLab65;

  // node_modules/culori/src/dlch/constants.js
  var kE = 1;
  var kCH = 1;
  var \u03B8 = 26 / 180 * Math.PI;
  var cos\u03B8 = Math.cos(\u03B8);
  var sin\u03B8 = Math.sin(\u03B8);
  var factor = 100 / Math.log(139 / 100);

  // node_modules/culori/src/dlch/convertDlchToLab65.js
  var convertDlchToLab65 = ({ l, c: c2, h, alpha }) => {
    if (l === void 0) l = 0;
    if (c2 === void 0) c2 = 0;
    if (h === void 0) h = 0;
    let res = {
      mode: "lab65",
      l: (Math.exp(l * kE / factor) - 1) / 39e-4
    };
    let G = (Math.exp(0.0435 * c2 * kCH * kE) - 1) / 0.075;
    let e4 = G * Math.cos(h / 180 * Math.PI - \u03B8);
    let f3 = G * Math.sin(h / 180 * Math.PI - \u03B8);
    res.a = e4 * cos\u03B8 - f3 / 0.83 * sin\u03B8;
    res.b = e4 * sin\u03B8 + f3 / 0.83 * cos\u03B8;
    if (alpha !== void 0) res.alpha = alpha;
    return res;
  };
  var convertDlchToLab65_default = convertDlchToLab65;

  // node_modules/culori/src/dlch/convertLab65ToDlch.js
  var convertLab65ToDlch = ({ l, a, b, alpha }) => {
    if (l === void 0) l = 0;
    if (a === void 0) a = 0;
    if (b === void 0) b = 0;
    let e4 = a * cos\u03B8 + b * sin\u03B8;
    let f3 = 0.83 * (b * cos\u03B8 - a * sin\u03B8);
    let G = Math.sqrt(e4 * e4 + f3 * f3);
    let res = {
      mode: "dlch",
      l: factor / kE * Math.log(1 + 39e-4 * l),
      c: Math.log(1 + 0.075 * G) / (0.0435 * kCH * kE)
    };
    if (res.c) {
      res.h = normalizeHue_default((Math.atan2(f3, e4) + \u03B8) / Math.PI * 180);
    }
    if (alpha !== void 0) res.alpha = alpha;
    return res;
  };
  var convertLab65ToDlch_default = convertLab65ToDlch;

  // node_modules/culori/src/dlab/definition.js
  var convertDlabToLab65 = (c2) => convertDlchToLab65_default(convertLabToLch_default(c2, "dlch"));
  var convertLab65ToDlab = (c2) => convertLchToLab_default(convertLab65ToDlch_default(c2), "dlab");
  var definition4 = {
    mode: "dlab",
    parse: ["--din99o-lab"],
    serialize: "--din99o-lab",
    toMode: {
      lab65: convertDlabToLab65,
      rgb: (c2) => convertLab65ToRgb_default(convertDlabToLab65(c2))
    },
    fromMode: {
      lab65: convertLab65ToDlab,
      rgb: (c2) => convertLab65ToDlab(convertRgbToLab65_default(c2))
    },
    channels: ["l", "a", "b", "alpha"],
    ranges: {
      l: [0, 100],
      a: [-40.09, 45.501],
      b: [-40.469, 44.344]
    },
    interpolate: {
      l: interpolatorLinear,
      a: interpolatorLinear,
      b: interpolatorLinear,
      alpha: {
        use: interpolatorLinear,
        fixup: fixupAlpha
      }
    }
  };
  var definition_default4 = definition4;

  // node_modules/culori/src/dlch/definition.js
  var definition5 = {
    mode: "dlch",
    parse: ["--din99o-lch"],
    serialize: "--din99o-lch",
    toMode: {
      lab65: convertDlchToLab65_default,
      dlab: (c2) => convertLchToLab_default(c2, "dlab"),
      rgb: (c2) => convertLab65ToRgb_default(convertDlchToLab65_default(c2))
    },
    fromMode: {
      lab65: convertLab65ToDlch_default,
      dlab: (c2) => convertLabToLch_default(c2, "dlch"),
      rgb: (c2) => convertLab65ToDlch_default(convertRgbToLab65_default(c2))
    },
    channels: ["l", "c", "h", "alpha"],
    ranges: {
      l: [0, 100],
      c: [0, 51.484],
      h: [0, 360]
    },
    interpolate: {
      l: interpolatorLinear,
      c: interpolatorLinear,
      h: {
        use: interpolatorLinear,
        fixup: fixupHueShorter
      },
      alpha: {
        use: interpolatorLinear,
        fixup: fixupAlpha
      }
    },
    difference: {
      h: differenceHueChroma
    },
    average: {
      h: averageAngle
    }
  };
  var definition_default5 = definition5;

  // node_modules/culori/src/hsi/convertHsiToRgb.js
  function convertHsiToRgb({ h, s, i, alpha }) {
    h = normalizeHue_default(h !== void 0 ? h : 0);
    if (s === void 0) s = 0;
    if (i === void 0) i = 0;
    let f3 = Math.abs(h / 60 % 2 - 1);
    let res;
    switch (Math.floor(h / 60)) {
      case 0:
        res = {
          r: i * (1 + s * (3 / (2 - f3) - 1)),
          g: i * (1 + s * (3 * (1 - f3) / (2 - f3) - 1)),
          b: i * (1 - s)
        };
        break;
      case 1:
        res = {
          r: i * (1 + s * (3 * (1 - f3) / (2 - f3) - 1)),
          g: i * (1 + s * (3 / (2 - f3) - 1)),
          b: i * (1 - s)
        };
        break;
      case 2:
        res = {
          r: i * (1 - s),
          g: i * (1 + s * (3 / (2 - f3) - 1)),
          b: i * (1 + s * (3 * (1 - f3) / (2 - f3) - 1))
        };
        break;
      case 3:
        res = {
          r: i * (1 - s),
          g: i * (1 + s * (3 * (1 - f3) / (2 - f3) - 1)),
          b: i * (1 + s * (3 / (2 - f3) - 1))
        };
        break;
      case 4:
        res = {
          r: i * (1 + s * (3 * (1 - f3) / (2 - f3) - 1)),
          g: i * (1 - s),
          b: i * (1 + s * (3 / (2 - f3) - 1))
        };
        break;
      case 5:
        res = {
          r: i * (1 + s * (3 / (2 - f3) - 1)),
          g: i * (1 - s),
          b: i * (1 + s * (3 * (1 - f3) / (2 - f3) - 1))
        };
        break;
      default:
        res = { r: i * (1 - s), g: i * (1 - s), b: i * (1 - s) };
    }
    res.mode = "rgb";
    if (alpha !== void 0) res.alpha = alpha;
    return res;
  }

  // node_modules/culori/src/hsi/convertRgbToHsi.js
  function convertRgbToHsi({ r, g, b, alpha }) {
    if (r === void 0) r = 0;
    if (g === void 0) g = 0;
    if (b === void 0) b = 0;
    let M3 = Math.max(r, g, b), m = Math.min(r, g, b);
    let res = {
      mode: "hsi",
      s: r + g + b === 0 ? 0 : 1 - 3 * m / (r + g + b),
      i: (r + g + b) / 3
    };
    if (M3 - m !== 0)
      res.h = (M3 === r ? (g - b) / (M3 - m) + (g < b) * 6 : M3 === g ? (b - r) / (M3 - m) + 2 : (r - g) / (M3 - m) + 4) * 60;
    if (alpha !== void 0) res.alpha = alpha;
    return res;
  }

  // node_modules/culori/src/hsi/definition.js
  var definition6 = {
    mode: "hsi",
    toMode: {
      rgb: convertHsiToRgb
    },
    parse: ["--hsi"],
    serialize: "--hsi",
    fromMode: {
      rgb: convertRgbToHsi
    },
    channels: ["h", "s", "i", "alpha"],
    ranges: {
      h: [0, 360]
    },
    gamut: "rgb",
    interpolate: {
      h: { use: interpolatorLinear, fixup: fixupHueShorter },
      s: interpolatorLinear,
      i: interpolatorLinear,
      alpha: { use: interpolatorLinear, fixup: fixupAlpha }
    },
    difference: {
      h: differenceHueSaturation
    },
    average: {
      h: averageAngle
    }
  };
  var definition_default6 = definition6;

  // node_modules/culori/src/hsl/convertHslToRgb.js
  function convertHslToRgb({ h, s, l, alpha }) {
    h = normalizeHue_default(h !== void 0 ? h : 0);
    if (s === void 0) s = 0;
    if (l === void 0) l = 0;
    let m1 = l + s * (l < 0.5 ? l : 1 - l);
    let m2 = m1 - (m1 - l) * 2 * Math.abs(h / 60 % 2 - 1);
    let res;
    switch (Math.floor(h / 60)) {
      case 0:
        res = { r: m1, g: m2, b: 2 * l - m1 };
        break;
      case 1:
        res = { r: m2, g: m1, b: 2 * l - m1 };
        break;
      case 2:
        res = { r: 2 * l - m1, g: m1, b: m2 };
        break;
      case 3:
        res = { r: 2 * l - m1, g: m2, b: m1 };
        break;
      case 4:
        res = { r: m2, g: 2 * l - m1, b: m1 };
        break;
      case 5:
        res = { r: m1, g: 2 * l - m1, b: m2 };
        break;
      default:
        res = { r: 2 * l - m1, g: 2 * l - m1, b: 2 * l - m1 };
    }
    res.mode = "rgb";
    if (alpha !== void 0) res.alpha = alpha;
    return res;
  }

  // node_modules/culori/src/hsl/convertRgbToHsl.js
  function convertRgbToHsl({ r, g, b, alpha }) {
    if (r === void 0) r = 0;
    if (g === void 0) g = 0;
    if (b === void 0) b = 0;
    let M3 = Math.max(r, g, b), m = Math.min(r, g, b);
    let res = {
      mode: "hsl",
      s: M3 === m ? 0 : (M3 - m) / (1 - Math.abs(M3 + m - 1)),
      l: 0.5 * (M3 + m)
    };
    if (M3 - m !== 0)
      res.h = (M3 === r ? (g - b) / (M3 - m) + (g < b) * 6 : M3 === g ? (b - r) / (M3 - m) + 2 : (r - g) / (M3 - m) + 4) * 60;
    if (alpha !== void 0) res.alpha = alpha;
    return res;
  }

  // node_modules/culori/src/util/hue.js
  var hueToDeg = (val, unit) => {
    switch (unit) {
      case "deg":
        return +val;
      case "rad":
        return val / Math.PI * 180;
      case "grad":
        return val / 10 * 9;
      case "turn":
        return val * 360;
    }
  };
  var hue_default = hueToDeg;

  // node_modules/culori/src/hsl/parseHslLegacy.js
  var hsl_old = new RegExp(
    `^hsla?\\(\\s*${hue}${c}${per}${c}${per}\\s*(?:,\\s*${num_per}\\s*)?\\)$`
  );
  var parseHslLegacy = (color) => {
    let match = color.match(hsl_old);
    if (!match) return;
    let res = { mode: "hsl" };
    if (match[3] !== void 0) {
      res.h = +match[3];
    } else if (match[1] !== void 0 && match[2] !== void 0) {
      res.h = hue_default(match[1], match[2]);
    }
    if (match[4] !== void 0) {
      res.s = Math.min(Math.max(0, match[4] / 100), 1);
    }
    if (match[5] !== void 0) {
      res.l = Math.min(Math.max(0, match[5] / 100), 1);
    }
    if (match[6] !== void 0) {
      res.alpha = Math.max(0, Math.min(1, match[6] / 100));
    } else if (match[7] !== void 0) {
      res.alpha = Math.max(0, Math.min(1, +match[7]));
    }
    return res;
  };
  var parseHslLegacy_default = parseHslLegacy;

  // node_modules/culori/src/hsl/parseHsl.js
  function parseHsl(color, parsed) {
    if (!parsed || parsed[0] !== "hsl" && parsed[0] !== "hsla") {
      return void 0;
    }
    const res = { mode: "hsl" };
    const [, h, s, l, alpha] = parsed;
    if (h.type !== Tok.None) {
      if (h.type === Tok.Percentage) {
        return void 0;
      }
      res.h = h.value;
    }
    if (s.type !== Tok.None) {
      if (s.type === Tok.Hue) {
        return void 0;
      }
      res.s = s.value / 100;
    }
    if (l.type !== Tok.None) {
      if (l.type === Tok.Hue) {
        return void 0;
      }
      res.l = l.value / 100;
    }
    if (alpha.type !== Tok.None) {
      res.alpha = Math.min(
        1,
        Math.max(
          0,
          alpha.type === Tok.Number ? alpha.value : alpha.value / 100
        )
      );
    }
    return res;
  }
  var parseHsl_default = parseHsl;

  // node_modules/culori/src/hsl/definition.js
  var definition7 = {
    mode: "hsl",
    toMode: {
      rgb: convertHslToRgb
    },
    fromMode: {
      rgb: convertRgbToHsl
    },
    channels: ["h", "s", "l", "alpha"],
    ranges: {
      h: [0, 360]
    },
    gamut: "rgb",
    parse: [parseHsl_default, parseHslLegacy_default],
    serialize: (c2) => `hsl(${c2.h !== void 0 ? c2.h : "none"} ${c2.s !== void 0 ? c2.s * 100 + "%" : "none"} ${c2.l !== void 0 ? c2.l * 100 + "%" : "none"}${c2.alpha < 1 ? ` / ${c2.alpha}` : ""})`,
    interpolate: {
      h: { use: interpolatorLinear, fixup: fixupHueShorter },
      s: interpolatorLinear,
      l: interpolatorLinear,
      alpha: { use: interpolatorLinear, fixup: fixupAlpha }
    },
    difference: {
      h: differenceHueSaturation
    },
    average: {
      h: averageAngle
    }
  };
  var definition_default7 = definition7;

  // node_modules/culori/src/hsv/convertHsvToRgb.js
  function convertHsvToRgb({ h, s, v, alpha }) {
    h = normalizeHue_default(h !== void 0 ? h : 0);
    if (s === void 0) s = 0;
    if (v === void 0) v = 0;
    let f3 = Math.abs(h / 60 % 2 - 1);
    let res;
    switch (Math.floor(h / 60)) {
      case 0:
        res = { r: v, g: v * (1 - s * f3), b: v * (1 - s) };
        break;
      case 1:
        res = { r: v * (1 - s * f3), g: v, b: v * (1 - s) };
        break;
      case 2:
        res = { r: v * (1 - s), g: v, b: v * (1 - s * f3) };
        break;
      case 3:
        res = { r: v * (1 - s), g: v * (1 - s * f3), b: v };
        break;
      case 4:
        res = { r: v * (1 - s * f3), g: v * (1 - s), b: v };
        break;
      case 5:
        res = { r: v, g: v * (1 - s), b: v * (1 - s * f3) };
        break;
      default:
        res = { r: v * (1 - s), g: v * (1 - s), b: v * (1 - s) };
    }
    res.mode = "rgb";
    if (alpha !== void 0) res.alpha = alpha;
    return res;
  }

  // node_modules/culori/src/hsv/convertRgbToHsv.js
  function convertRgbToHsv({ r, g, b, alpha }) {
    if (r === void 0) r = 0;
    if (g === void 0) g = 0;
    if (b === void 0) b = 0;
    let M3 = Math.max(r, g, b), m = Math.min(r, g, b);
    let res = {
      mode: "hsv",
      s: M3 === 0 ? 0 : 1 - m / M3,
      v: M3
    };
    if (M3 - m !== 0)
      res.h = (M3 === r ? (g - b) / (M3 - m) + (g < b) * 6 : M3 === g ? (b - r) / (M3 - m) + 2 : (r - g) / (M3 - m) + 4) * 60;
    if (alpha !== void 0) res.alpha = alpha;
    return res;
  }

  // node_modules/culori/src/hsv/definition.js
  var definition8 = {
    mode: "hsv",
    toMode: {
      rgb: convertHsvToRgb
    },
    parse: ["--hsv"],
    serialize: "--hsv",
    fromMode: {
      rgb: convertRgbToHsv
    },
    channels: ["h", "s", "v", "alpha"],
    ranges: {
      h: [0, 360]
    },
    gamut: "rgb",
    interpolate: {
      h: { use: interpolatorLinear, fixup: fixupHueShorter },
      s: interpolatorLinear,
      v: interpolatorLinear,
      alpha: { use: interpolatorLinear, fixup: fixupAlpha }
    },
    difference: {
      h: differenceHueSaturation
    },
    average: {
      h: averageAngle
    }
  };
  var definition_default8 = definition8;

  // node_modules/culori/src/hwb/convertHwbToRgb.js
  function convertHwbToRgb({ h, w, b, alpha }) {
    if (w === void 0) w = 0;
    if (b === void 0) b = 0;
    if (w + b > 1) {
      let s = w + b;
      w /= s;
      b /= s;
    }
    return convertHsvToRgb({
      h,
      s: b === 1 ? 1 : 1 - w / (1 - b),
      v: 1 - b,
      alpha
    });
  }

  // node_modules/culori/src/hwb/convertRgbToHwb.js
  function convertRgbToHwb(rgba) {
    let hsv2 = convertRgbToHsv(rgba);
    if (hsv2 === void 0) return void 0;
    let s = hsv2.s !== void 0 ? hsv2.s : 0;
    let v = hsv2.v !== void 0 ? hsv2.v : 0;
    let res = {
      mode: "hwb",
      w: (1 - s) * v,
      b: 1 - v
    };
    if (hsv2.h !== void 0) res.h = hsv2.h;
    if (hsv2.alpha !== void 0) res.alpha = hsv2.alpha;
    return res;
  }

  // node_modules/culori/src/hwb/parseHwb.js
  function ParseHwb(color, parsed) {
    if (!parsed || parsed[0] !== "hwb") {
      return void 0;
    }
    const res = { mode: "hwb" };
    const [, h, w, b, alpha] = parsed;
    if (h.type !== Tok.None) {
      if (h.type === Tok.Percentage) {
        return void 0;
      }
      res.h = h.value;
    }
    if (w.type !== Tok.None) {
      if (w.type === Tok.Hue) {
        return void 0;
      }
      res.w = w.value / 100;
    }
    if (b.type !== Tok.None) {
      if (b.type === Tok.Hue) {
        return void 0;
      }
      res.b = b.value / 100;
    }
    if (alpha.type !== Tok.None) {
      res.alpha = Math.min(
        1,
        Math.max(
          0,
          alpha.type === Tok.Number ? alpha.value : alpha.value / 100
        )
      );
    }
    return res;
  }
  var parseHwb_default = ParseHwb;

  // node_modules/culori/src/hwb/definition.js
  var definition9 = {
    mode: "hwb",
    toMode: {
      rgb: convertHwbToRgb
    },
    fromMode: {
      rgb: convertRgbToHwb
    },
    channels: ["h", "w", "b", "alpha"],
    ranges: {
      h: [0, 360]
    },
    gamut: "rgb",
    parse: [parseHwb_default],
    serialize: (c2) => `hwb(${c2.h !== void 0 ? c2.h : "none"} ${c2.w !== void 0 ? c2.w * 100 + "%" : "none"} ${c2.b !== void 0 ? c2.b * 100 + "%" : "none"}${c2.alpha < 1 ? ` / ${c2.alpha}` : ""})`,
    interpolate: {
      h: { use: interpolatorLinear, fixup: fixupHueShorter },
      w: interpolatorLinear,
      b: interpolatorLinear,
      alpha: { use: interpolatorLinear, fixup: fixupAlpha }
    },
    difference: {
      h: differenceHueNaive
    },
    average: {
      h: averageAngle
    }
  };
  var definition_default9 = definition9;

  // node_modules/culori/src/hdr/constants.js
  var YW = 203;

  // node_modules/culori/src/hdr/transfer.js
  var M1 = 0.1593017578125;
  var M2 = 78.84375;
  var C1 = 0.8359375;
  var C2 = 18.8515625;
  var C3 = 18.6875;
  function transferPqDecode(v) {
    if (v < 0) return 0;
    const c2 = Math.pow(v, 1 / M2);
    return 1e4 * Math.pow(Math.max(0, c2 - C1) / (C2 - C3 * c2), 1 / M1);
  }
  function transferPqEncode(v) {
    if (v < 0) return 0;
    const c2 = Math.pow(v / 1e4, M1);
    return Math.pow((C1 + C2 * c2) / (1 + C3 * c2), M2);
  }

  // node_modules/culori/src/itp/convertItpToXyz65.js
  var toRel = (c2) => Math.max(c2 / YW, 0);
  var convertItpToXyz65 = ({ i, t, p: p4, alpha }) => {
    if (i === void 0) i = 0;
    if (t === void 0) t = 0;
    if (p4 === void 0) p4 = 0;
    const l = transferPqDecode(
      i + 0.008609037037932761 * t + 0.11102962500302593 * p4
    );
    const m = transferPqDecode(
      i - 0.00860903703793275 * t - 0.11102962500302599 * p4
    );
    const s = transferPqDecode(
      i + 0.5600313357106791 * t - 0.32062717498731885 * p4
    );
    const res = {
      mode: "xyz65",
      x: toRel(
        2.070152218389422 * l - 1.3263473389671556 * m + 0.2066510476294051 * s
      ),
      y: toRel(
        0.3647385209748074 * l + 0.680566024947227 * m - 0.0453045459220346 * s
      ),
      z: toRel(
        -0.049747207535812 * l - 0.0492609666966138 * m + 1.1880659249923042 * s
      )
    };
    if (alpha !== void 0) {
      res.alpha = alpha;
    }
    return res;
  };
  var convertItpToXyz65_default = convertItpToXyz65;

  // node_modules/culori/src/itp/convertXyz65ToItp.js
  var toAbs = (c2 = 0) => Math.max(c2 * YW, 0);
  var convertXyz65ToItp = ({ x, y, z, alpha }) => {
    const absX = toAbs(x);
    const absY = toAbs(y);
    const absZ = toAbs(z);
    const l = transferPqEncode(
      0.3592832590121217 * absX + 0.6976051147779502 * absY - 0.0358915932320289 * absZ
    );
    const m = transferPqEncode(
      -0.1920808463704995 * absX + 1.1004767970374323 * absY + 0.0753748658519118 * absZ
    );
    const s = transferPqEncode(
      0.0070797844607477 * absX + 0.0748396662186366 * absY + 0.8433265453898765 * absZ
    );
    const i = 0.5 * l + 0.5 * m;
    const t = 1.61376953125 * l - 3.323486328125 * m + 1.709716796875 * s;
    const p4 = 4.378173828125 * l - 4.24560546875 * m - 0.132568359375 * s;
    const res = { mode: "itp", i, t, p: p4 };
    if (alpha !== void 0) {
      res.alpha = alpha;
    }
    return res;
  };
  var convertXyz65ToItp_default = convertXyz65ToItp;

  // node_modules/culori/src/itp/definition.js
  var definition10 = {
    mode: "itp",
    channels: ["i", "t", "p", "alpha"],
    parse: ["--ictcp"],
    serialize: "--ictcp",
    toMode: {
      xyz65: convertItpToXyz65_default,
      rgb: (color) => convertXyz65ToRgb_default(convertItpToXyz65_default(color))
    },
    fromMode: {
      xyz65: convertXyz65ToItp_default,
      rgb: (color) => convertXyz65ToItp_default(convertRgbToXyz65_default(color))
    },
    ranges: {
      i: [0, 0.581],
      t: [-0.369, 0.272],
      p: [-0.164, 0.331]
    },
    interpolate: {
      i: interpolatorLinear,
      t: interpolatorLinear,
      p: interpolatorLinear,
      alpha: { use: interpolatorLinear, fixup: fixupAlpha }
    }
  };
  var definition_default10 = definition10;

  // node_modules/culori/src/jab/convertXyz65ToJab.js
  var p = 134.03437499999998;
  var d0 = 16295499532821565e-27;
  var jabPqEncode = (v) => {
    if (v < 0) return 0;
    let vn3 = Math.pow(v / 1e4, M1);
    return Math.pow((C1 + C2 * vn3) / (1 + C3 * vn3), p);
  };
  var abs = (v = 0) => Math.max(v * 203, 0);
  var convertXyz65ToJab = ({ x, y, z, alpha }) => {
    x = abs(x);
    y = abs(y);
    z = abs(z);
    let xp = 1.15 * x - 0.15 * z;
    let yp = 0.66 * y + 0.34 * x;
    let l = jabPqEncode(0.41478972 * xp + 0.579999 * yp + 0.014648 * z);
    let m = jabPqEncode(-0.20151 * xp + 1.120649 * yp + 0.0531008 * z);
    let s = jabPqEncode(-0.0166008 * xp + 0.2648 * yp + 0.6684799 * z);
    let i = (l + m) / 2;
    let res = {
      mode: "jab",
      j: 0.44 * i / (1 - 0.56 * i) - d0,
      a: 3.524 * l - 4.066708 * m + 0.542708 * s,
      b: 0.199076 * l + 1.096799 * m - 1.295875 * s
    };
    if (alpha !== void 0) {
      res.alpha = alpha;
    }
    return res;
  };
  var convertXyz65ToJab_default = convertXyz65ToJab;

  // node_modules/culori/src/jab/convertJabToXyz65.js
  var p2 = 134.03437499999998;
  var d02 = 16295499532821565e-27;
  var jabPqDecode = (v) => {
    if (v < 0) return 0;
    let vp = Math.pow(v, 1 / p2);
    return 1e4 * Math.pow((C1 - vp) / (C3 * vp - C2), 1 / M1);
  };
  var rel = (v) => v / 203;
  var convertJabToXyz65 = ({ j, a, b, alpha }) => {
    if (j === void 0) j = 0;
    if (a === void 0) a = 0;
    if (b === void 0) b = 0;
    let i = (j + d02) / (0.44 + 0.56 * (j + d02));
    let l = jabPqDecode(i + 0.13860504 * a + 0.058047316 * b);
    let m = jabPqDecode(i - 0.13860504 * a - 0.058047316 * b);
    let s = jabPqDecode(i - 0.096019242 * a - 0.8118919 * b);
    let res = {
      mode: "xyz65",
      x: rel(
        1.661373024652174 * l - 0.914523081304348 * m + 0.23136208173913045 * s
      ),
      y: rel(
        -0.3250758611844533 * l + 1.571847026732543 * m - 0.21825383453227928 * s
      ),
      z: rel(-0.090982811 * l - 0.31272829 * m + 1.5227666 * s)
    };
    if (alpha !== void 0) {
      res.alpha = alpha;
    }
    return res;
  };
  var convertJabToXyz65_default = convertJabToXyz65;

  // node_modules/culori/src/jab/convertRgbToJab.js
  var convertRgbToJab = (rgb2) => {
    let res = convertXyz65ToJab_default(convertRgbToXyz65_default(rgb2));
    if (rgb2.r === rgb2.b && rgb2.b === rgb2.g) {
      res.a = res.b = 0;
    }
    return res;
  };
  var convertRgbToJab_default = convertRgbToJab;

  // node_modules/culori/src/jab/convertJabToRgb.js
  var convertJabToRgb = (color) => convertXyz65ToRgb_default(convertJabToXyz65_default(color));
  var convertJabToRgb_default = convertJabToRgb;

  // node_modules/culori/src/jab/definition.js
  var definition11 = {
    mode: "jab",
    channels: ["j", "a", "b", "alpha"],
    parse: ["--jzazbz"],
    serialize: "--jzazbz",
    fromMode: {
      rgb: convertRgbToJab_default,
      xyz65: convertXyz65ToJab_default
    },
    toMode: {
      rgb: convertJabToRgb_default,
      xyz65: convertJabToXyz65_default
    },
    ranges: {
      j: [0, 0.222],
      a: [-0.109, 0.129],
      b: [-0.185, 0.134]
    },
    interpolate: {
      j: interpolatorLinear,
      a: interpolatorLinear,
      b: interpolatorLinear,
      alpha: { use: interpolatorLinear, fixup: fixupAlpha }
    }
  };
  var definition_default11 = definition11;

  // node_modules/culori/src/jch/convertJabToJch.js
  var convertJabToJch = ({ j, a, b, alpha }) => {
    if (a === void 0) a = 0;
    if (b === void 0) b = 0;
    let c2 = Math.sqrt(a * a + b * b);
    let res = {
      mode: "jch",
      j,
      c: c2
    };
    if (c2) {
      res.h = normalizeHue_default(Math.atan2(b, a) * 180 / Math.PI);
    }
    if (alpha !== void 0) {
      res.alpha = alpha;
    }
    return res;
  };
  var convertJabToJch_default = convertJabToJch;

  // node_modules/culori/src/jch/convertJchToJab.js
  var convertJchToJab = ({ j, c: c2, h, alpha }) => {
    if (h === void 0) h = 0;
    let res = {
      mode: "jab",
      j,
      a: c2 ? c2 * Math.cos(h / 180 * Math.PI) : 0,
      b: c2 ? c2 * Math.sin(h / 180 * Math.PI) : 0
    };
    if (alpha !== void 0) res.alpha = alpha;
    return res;
  };
  var convertJchToJab_default = convertJchToJab;

  // node_modules/culori/src/jch/definition.js
  var definition12 = {
    mode: "jch",
    parse: ["--jzczhz"],
    serialize: "--jzczhz",
    toMode: {
      jab: convertJchToJab_default,
      rgb: (c2) => convertJabToRgb_default(convertJchToJab_default(c2))
    },
    fromMode: {
      rgb: (c2) => convertJabToJch_default(convertRgbToJab_default(c2)),
      jab: convertJabToJch_default
    },
    channels: ["j", "c", "h", "alpha"],
    ranges: {
      j: [0, 0.221],
      c: [0, 0.19],
      h: [0, 360]
    },
    interpolate: {
      h: { use: interpolatorLinear, fixup: fixupHueShorter },
      c: interpolatorLinear,
      j: interpolatorLinear,
      alpha: { use: interpolatorLinear, fixup: fixupAlpha }
    },
    difference: {
      h: differenceHueChroma
    },
    average: {
      h: averageAngle
    }
  };
  var definition_default12 = definition12;

  // node_modules/culori/src/xyz50/constants.js
  var k3 = Math.pow(29, 3) / Math.pow(3, 3);
  var e3 = Math.pow(6, 3) / Math.pow(29, 3);

  // node_modules/culori/src/lab/convertLabToXyz50.js
  var fn4 = (v) => Math.pow(v, 3) > e3 ? Math.pow(v, 3) : (116 * v - 16) / k3;
  var convertLabToXyz50 = ({ l, a, b, alpha }) => {
    if (l === void 0) l = 0;
    if (a === void 0) a = 0;
    if (b === void 0) b = 0;
    let fy = (l + 16) / 116;
    let fx = a / 500 + fy;
    let fz = fy - b / 200;
    let res = {
      mode: "xyz50",
      x: fn4(fx) * D50.X,
      y: fn4(fy) * D50.Y,
      z: fn4(fz) * D50.Z
    };
    if (alpha !== void 0) {
      res.alpha = alpha;
    }
    return res;
  };
  var convertLabToXyz50_default = convertLabToXyz50;

  // node_modules/culori/src/xyz50/convertXyz50ToRgb.js
  var convertXyz50ToRgb = ({ x, y, z, alpha }) => {
    if (x === void 0) x = 0;
    if (y === void 0) y = 0;
    if (z === void 0) z = 0;
    let res = convertLrgbToRgb_default({
      r: x * 3.1341359569958707 - y * 1.6173863321612538 - 0.4906619460083532 * z,
      g: x * -0.978795502912089 + y * 1.916254567259524 + 0.03344273116131949 * z,
      b: x * 0.07195537988411677 - y * 0.2289768264158322 + 1.405386058324125 * z
    });
    if (alpha !== void 0) {
      res.alpha = alpha;
    }
    return res;
  };
  var convertXyz50ToRgb_default = convertXyz50ToRgb;

  // node_modules/culori/src/lab/convertLabToRgb.js
  var convertLabToRgb = (lab2) => convertXyz50ToRgb_default(convertLabToXyz50_default(lab2));
  var convertLabToRgb_default = convertLabToRgb;

  // node_modules/culori/src/xyz50/convertRgbToXyz50.js
  var convertRgbToXyz50 = (rgb2) => {
    let { r, g, b, alpha } = convertRgbToLrgb_default(rgb2);
    let res = {
      mode: "xyz50",
      x: 0.436065742824811 * r + 0.3851514688337912 * g + 0.14307845442264197 * b,
      y: 0.22249319175623702 * r + 0.7168870538238823 * g + 0.06061979053616537 * b,
      z: 0.013923904500943465 * r + 0.09708128566574634 * g + 0.7140993584005155 * b
    };
    if (alpha !== void 0) {
      res.alpha = alpha;
    }
    return res;
  };
  var convertRgbToXyz50_default = convertRgbToXyz50;

  // node_modules/culori/src/lab/convertXyz50ToLab.js
  var f2 = (value) => value > e3 ? Math.cbrt(value) : (k3 * value + 16) / 116;
  var convertXyz50ToLab = ({ x, y, z, alpha }) => {
    if (x === void 0) x = 0;
    if (y === void 0) y = 0;
    if (z === void 0) z = 0;
    let f0 = f2(x / D50.X);
    let f1 = f2(y / D50.Y);
    let f22 = f2(z / D50.Z);
    let res = {
      mode: "lab",
      l: 116 * f1 - 16,
      a: 500 * (f0 - f1),
      b: 200 * (f1 - f22)
    };
    if (alpha !== void 0) {
      res.alpha = alpha;
    }
    return res;
  };
  var convertXyz50ToLab_default = convertXyz50ToLab;

  // node_modules/culori/src/lab/convertRgbToLab.js
  var convertRgbToLab = (rgb2) => {
    let res = convertXyz50ToLab_default(convertRgbToXyz50_default(rgb2));
    if (rgb2.r === rgb2.b && rgb2.b === rgb2.g) {
      res.a = res.b = 0;
    }
    return res;
  };
  var convertRgbToLab_default = convertRgbToLab;

  // node_modules/culori/src/lab/parseLab.js
  function parseLab(color, parsed) {
    if (!parsed || parsed[0] !== "lab") {
      return void 0;
    }
    const res = { mode: "lab" };
    const [, l, a, b, alpha] = parsed;
    if (l.type === Tok.Hue || a.type === Tok.Hue || b.type === Tok.Hue) {
      return void 0;
    }
    if (l.type !== Tok.None) {
      res.l = Math.min(Math.max(0, l.value), 100);
    }
    if (a.type !== Tok.None) {
      res.a = a.type === Tok.Number ? a.value : a.value * 125 / 100;
    }
    if (b.type !== Tok.None) {
      res.b = b.type === Tok.Number ? b.value : b.value * 125 / 100;
    }
    if (alpha.type !== Tok.None) {
      res.alpha = Math.min(
        1,
        Math.max(
          0,
          alpha.type === Tok.Number ? alpha.value : alpha.value / 100
        )
      );
    }
    return res;
  }
  var parseLab_default = parseLab;

  // node_modules/culori/src/lab/definition.js
  var definition13 = {
    mode: "lab",
    toMode: {
      xyz50: convertLabToXyz50_default,
      rgb: convertLabToRgb_default
    },
    fromMode: {
      xyz50: convertXyz50ToLab_default,
      rgb: convertRgbToLab_default
    },
    channels: ["l", "a", "b", "alpha"],
    ranges: {
      l: [0, 100],
      a: [-125, 125],
      b: [-125, 125]
    },
    parse: [parseLab_default],
    serialize: (c2) => `lab(${c2.l !== void 0 ? c2.l : "none"} ${c2.a !== void 0 ? c2.a : "none"} ${c2.b !== void 0 ? c2.b : "none"}${c2.alpha < 1 ? ` / ${c2.alpha}` : ""})`,
    interpolate: {
      l: interpolatorLinear,
      a: interpolatorLinear,
      b: interpolatorLinear,
      alpha: { use: interpolatorLinear, fixup: fixupAlpha }
    }
  };
  var definition_default13 = definition13;

  // node_modules/culori/src/lab65/definition.js
  var definition14 = {
    ...definition_default13,
    mode: "lab65",
    parse: ["--lab-d65"],
    serialize: "--lab-d65",
    toMode: {
      xyz65: convertLab65ToXyz65_default,
      rgb: convertLab65ToRgb_default
    },
    fromMode: {
      xyz65: convertXyz65ToLab65_default,
      rgb: convertRgbToLab65_default
    },
    ranges: {
      l: [0, 100],
      a: [-125, 125],
      b: [-125, 125]
    }
  };
  var definition_default14 = definition14;

  // node_modules/culori/src/lch/parseLch.js
  function parseLch(color, parsed) {
    if (!parsed || parsed[0] !== "lch") {
      return void 0;
    }
    const res = { mode: "lch" };
    const [, l, c2, h, alpha] = parsed;
    if (l.type !== Tok.None) {
      if (l.type === Tok.Hue) {
        return void 0;
      }
      res.l = Math.min(Math.max(0, l.value), 100);
    }
    if (c2.type !== Tok.None) {
      res.c = Math.max(
        0,
        c2.type === Tok.Number ? c2.value : c2.value * 150 / 100
      );
    }
    if (h.type !== Tok.None) {
      if (h.type === Tok.Percentage) {
        return void 0;
      }
      res.h = h.value;
    }
    if (alpha.type !== Tok.None) {
      res.alpha = Math.min(
        1,
        Math.max(
          0,
          alpha.type === Tok.Number ? alpha.value : alpha.value / 100
        )
      );
    }
    return res;
  }
  var parseLch_default = parseLch;

  // node_modules/culori/src/lch/definition.js
  var definition15 = {
    mode: "lch",
    toMode: {
      lab: convertLchToLab_default,
      rgb: (c2) => convertLabToRgb_default(convertLchToLab_default(c2))
    },
    fromMode: {
      rgb: (c2) => convertLabToLch_default(convertRgbToLab_default(c2)),
      lab: convertLabToLch_default
    },
    channels: ["l", "c", "h", "alpha"],
    ranges: {
      l: [0, 100],
      c: [0, 150],
      h: [0, 360]
    },
    parse: [parseLch_default],
    serialize: (c2) => `lch(${c2.l !== void 0 ? c2.l : "none"} ${c2.c !== void 0 ? c2.c : "none"} ${c2.h !== void 0 ? c2.h : "none"}${c2.alpha < 1 ? ` / ${c2.alpha}` : ""})`,
    interpolate: {
      h: { use: interpolatorLinear, fixup: fixupHueShorter },
      c: interpolatorLinear,
      l: interpolatorLinear,
      alpha: { use: interpolatorLinear, fixup: fixupAlpha }
    },
    difference: {
      h: differenceHueChroma
    },
    average: {
      h: averageAngle
    }
  };
  var definition_default15 = definition15;

  // node_modules/culori/src/lch65/definition.js
  var definition16 = {
    ...definition_default15,
    mode: "lch65",
    parse: ["--lch-d65"],
    serialize: "--lch-d65",
    toMode: {
      lab65: (c2) => convertLchToLab_default(c2, "lab65"),
      rgb: (c2) => convertLab65ToRgb_default(convertLchToLab_default(c2, "lab65"))
    },
    fromMode: {
      rgb: (c2) => convertLabToLch_default(convertRgbToLab65_default(c2), "lch65"),
      lab65: (c2) => convertLabToLch_default(c2, "lch65")
    },
    ranges: {
      l: [0, 100],
      c: [0, 150],
      h: [0, 360]
    }
  };
  var definition_default16 = definition16;

  // node_modules/culori/src/lchuv/convertLuvToLchuv.js
  var convertLuvToLchuv = ({ l, u, v, alpha }) => {
    if (u === void 0) u = 0;
    if (v === void 0) v = 0;
    let c2 = Math.sqrt(u * u + v * v);
    let res = {
      mode: "lchuv",
      l,
      c: c2
    };
    if (c2) {
      res.h = normalizeHue_default(Math.atan2(v, u) * 180 / Math.PI);
    }
    if (alpha !== void 0) {
      res.alpha = alpha;
    }
    return res;
  };
  var convertLuvToLchuv_default = convertLuvToLchuv;

  // node_modules/culori/src/lchuv/convertLchuvToLuv.js
  var convertLchuvToLuv = ({ l, c: c2, h, alpha }) => {
    if (h === void 0) h = 0;
    let res = {
      mode: "luv",
      l,
      u: c2 ? c2 * Math.cos(h / 180 * Math.PI) : 0,
      v: c2 ? c2 * Math.sin(h / 180 * Math.PI) : 0
    };
    if (alpha !== void 0) {
      res.alpha = alpha;
    }
    return res;
  };
  var convertLchuvToLuv_default = convertLchuvToLuv;

  // node_modules/culori/src/luv/convertXyz50ToLuv.js
  var u_fn = (x, y, z) => 4 * x / (x + 15 * y + 3 * z);
  var v_fn = (x, y, z) => 9 * y / (x + 15 * y + 3 * z);
  var un = u_fn(D50.X, D50.Y, D50.Z);
  var vn = v_fn(D50.X, D50.Y, D50.Z);
  var l_fn = (value) => value <= e3 ? k3 * value : 116 * Math.cbrt(value) - 16;
  var convertXyz50ToLuv = ({ x, y, z, alpha }) => {
    if (x === void 0) x = 0;
    if (y === void 0) y = 0;
    if (z === void 0) z = 0;
    let l = l_fn(y / D50.Y);
    let u = u_fn(x, y, z);
    let v = v_fn(x, y, z);
    if (!isFinite(u) || !isFinite(v)) {
      l = u = v = 0;
    } else {
      u = 13 * l * (u - un);
      v = 13 * l * (v - vn);
    }
    let res = {
      mode: "luv",
      l,
      u,
      v
    };
    if (alpha !== void 0) {
      res.alpha = alpha;
    }
    return res;
  };
  var convertXyz50ToLuv_default = convertXyz50ToLuv;

  // node_modules/culori/src/luv/convertLuvToXyz50.js
  var u_fn2 = (x, y, z) => 4 * x / (x + 15 * y + 3 * z);
  var v_fn2 = (x, y, z) => 9 * y / (x + 15 * y + 3 * z);
  var un2 = u_fn2(D50.X, D50.Y, D50.Z);
  var vn2 = v_fn2(D50.X, D50.Y, D50.Z);
  var convertLuvToXyz50 = ({ l, u, v, alpha }) => {
    if (l === void 0) l = 0;
    if (l === 0) {
      return { mode: "xyz50", x: 0, y: 0, z: 0 };
    }
    if (u === void 0) u = 0;
    if (v === void 0) v = 0;
    let up = u / (13 * l) + un2;
    let vp = v / (13 * l) + vn2;
    let y = D50.Y * (l <= 8 ? l / k3 : Math.pow((l + 16) / 116, 3));
    let x = y * (9 * up) / (4 * vp);
    let z = y * (12 - 3 * up - 20 * vp) / (4 * vp);
    let res = { mode: "xyz50", x, y, z };
    if (alpha !== void 0) {
      res.alpha = alpha;
    }
    return res;
  };
  var convertLuvToXyz50_default = convertLuvToXyz50;

  // node_modules/culori/src/lchuv/definition.js
  var convertRgbToLchuv = (rgb2) => convertLuvToLchuv_default(convertXyz50ToLuv_default(convertRgbToXyz50_default(rgb2)));
  var convertLchuvToRgb = (lchuv2) => convertXyz50ToRgb_default(convertLuvToXyz50_default(convertLchuvToLuv_default(lchuv2)));
  var definition17 = {
    mode: "lchuv",
    toMode: {
      luv: convertLchuvToLuv_default,
      rgb: convertLchuvToRgb
    },
    fromMode: {
      rgb: convertRgbToLchuv,
      luv: convertLuvToLchuv_default
    },
    channels: ["l", "c", "h", "alpha"],
    parse: ["--lchuv"],
    serialize: "--lchuv",
    ranges: {
      l: [0, 100],
      c: [0, 176.956],
      h: [0, 360]
    },
    interpolate: {
      h: { use: interpolatorLinear, fixup: fixupHueShorter },
      c: interpolatorLinear,
      l: interpolatorLinear,
      alpha: { use: interpolatorLinear, fixup: fixupAlpha }
    },
    difference: {
      h: differenceHueChroma
    },
    average: {
      h: averageAngle
    }
  };
  var definition_default17 = definition17;

  // node_modules/culori/src/lrgb/definition.js
  var definition18 = {
    ...definition_default,
    mode: "lrgb",
    toMode: {
      rgb: convertLrgbToRgb_default
    },
    fromMode: {
      rgb: convertRgbToLrgb_default
    },
    parse: ["srgb-linear"],
    serialize: "srgb-linear"
  };
  var definition_default18 = definition18;

  // node_modules/culori/src/luv/definition.js
  var definition19 = {
    mode: "luv",
    toMode: {
      xyz50: convertLuvToXyz50_default,
      rgb: (luv2) => convertXyz50ToRgb_default(convertLuvToXyz50_default(luv2))
    },
    fromMode: {
      xyz50: convertXyz50ToLuv_default,
      rgb: (rgb2) => convertXyz50ToLuv_default(convertRgbToXyz50_default(rgb2))
    },
    channels: ["l", "u", "v", "alpha"],
    parse: ["--luv"],
    serialize: "--luv",
    ranges: {
      l: [0, 100],
      u: [-84.936, 175.042],
      v: [-125.882, 87.243]
    },
    interpolate: {
      l: interpolatorLinear,
      u: interpolatorLinear,
      v: interpolatorLinear,
      alpha: { use: interpolatorLinear, fixup: fixupAlpha }
    }
  };
  var definition_default19 = definition19;

  // node_modules/culori/src/oklab/convertLrgbToOklab.js
  var convertLrgbToOklab = ({ r, g, b, alpha }) => {
    if (r === void 0) r = 0;
    if (g === void 0) g = 0;
    if (b === void 0) b = 0;
    let L = Math.cbrt(
      0.412221469470763 * r + 0.5363325372617348 * g + 0.0514459932675022 * b
    );
    let M3 = Math.cbrt(
      0.2119034958178252 * r + 0.6806995506452344 * g + 0.1073969535369406 * b
    );
    let S = Math.cbrt(
      0.0883024591900564 * r + 0.2817188391361215 * g + 0.6299787016738222 * b
    );
    let res = {
      mode: "oklab",
      l: 0.210454268309314 * L + 0.7936177747023054 * M3 - 0.0040720430116193 * S,
      a: 1.9779985324311684 * L - 2.42859224204858 * M3 + 0.450593709617411 * S,
      b: 0.0259040424655478 * L + 0.7827717124575296 * M3 - 0.8086757549230774 * S
    };
    if (alpha !== void 0) {
      res.alpha = alpha;
    }
    return res;
  };
  var convertLrgbToOklab_default = convertLrgbToOklab;

  // node_modules/culori/src/oklab/convertRgbToOklab.js
  var convertRgbToOklab = (rgb2) => {
    let res = convertLrgbToOklab_default(convertRgbToLrgb_default(rgb2));
    if (rgb2.r === rgb2.b && rgb2.b === rgb2.g) {
      res.a = res.b = 0;
    }
    return res;
  };
  var convertRgbToOklab_default = convertRgbToOklab;

  // node_modules/culori/src/oklab/convertOklabToLrgb.js
  var convertOklabToLrgb = ({ l, a, b, alpha }) => {
    if (l === void 0) l = 0;
    if (a === void 0) a = 0;
    if (b === void 0) b = 0;
    let L = Math.pow(l + 0.3963377773761749 * a + 0.2158037573099136 * b, 3);
    let M3 = Math.pow(l - 0.1055613458156586 * a - 0.0638541728258133 * b, 3);
    let S = Math.pow(l - 0.0894841775298119 * a - 1.2914855480194092 * b, 3);
    let res = {
      mode: "lrgb",
      r: 4.076741636075957 * L - 3.3077115392580616 * M3 + 0.2309699031821044 * S,
      g: -1.2684379732850317 * L + 2.6097573492876887 * M3 - 0.3413193760026573 * S,
      b: -0.0041960761386756 * L - 0.7034186179359362 * M3 + 1.7076146940746117 * S
    };
    if (alpha !== void 0) {
      res.alpha = alpha;
    }
    return res;
  };
  var convertOklabToLrgb_default = convertOklabToLrgb;

  // node_modules/culori/src/oklab/convertOklabToRgb.js
  var convertOklabToRgb = (c2) => convertLrgbToRgb_default(convertOklabToLrgb_default(c2));
  var convertOklabToRgb_default = convertOklabToRgb;

  // node_modules/culori/src/okhsl/helpers.js
  function toe(x) {
    const k_1 = 0.206;
    const k_2 = 0.03;
    const k_3 = (1 + k_1) / (1 + k_2);
    return 0.5 * (k_3 * x - k_1 + Math.sqrt((k_3 * x - k_1) * (k_3 * x - k_1) + 4 * k_2 * k_3 * x));
  }
  function toe_inv(x) {
    const k_1 = 0.206;
    const k_2 = 0.03;
    const k_3 = (1 + k_1) / (1 + k_2);
    return (x * x + k_1 * x) / (k_3 * (x + k_2));
  }
  function compute_max_saturation(a, b) {
    let k0, k1, k22, k32, k4, wl, wm, ws;
    if (-1.88170328 * a - 0.80936493 * b > 1) {
      k0 = 1.19086277;
      k1 = 1.76576728;
      k22 = 0.59662641;
      k32 = 0.75515197;
      k4 = 0.56771245;
      wl = 4.0767416621;
      wm = -3.3077115913;
      ws = 0.2309699292;
    } else if (1.81444104 * a - 1.19445276 * b > 1) {
      k0 = 0.73956515;
      k1 = -0.45954404;
      k22 = 0.08285427;
      k32 = 0.1254107;
      k4 = 0.14503204;
      wl = -1.2684380046;
      wm = 2.6097574011;
      ws = -0.3413193965;
    } else {
      k0 = 1.35733652;
      k1 = -915799e-8;
      k22 = -1.1513021;
      k32 = -0.50559606;
      k4 = 692167e-8;
      wl = -0.0041960863;
      wm = -0.7034186147;
      ws = 1.707614701;
    }
    let S = k0 + k1 * a + k22 * b + k32 * a * a + k4 * a * b;
    let k_l = 0.3963377774 * a + 0.2158037573 * b;
    let k_m = -0.1055613458 * a - 0.0638541728 * b;
    let k_s = -0.0894841775 * a - 1.291485548 * b;
    {
      let l_ = 1 + S * k_l;
      let m_ = 1 + S * k_m;
      let s_ = 1 + S * k_s;
      let l = l_ * l_ * l_;
      let m = m_ * m_ * m_;
      let s = s_ * s_ * s_;
      let l_dS = 3 * k_l * l_ * l_;
      let m_dS = 3 * k_m * m_ * m_;
      let s_dS = 3 * k_s * s_ * s_;
      let l_dS2 = 6 * k_l * k_l * l_;
      let m_dS2 = 6 * k_m * k_m * m_;
      let s_dS2 = 6 * k_s * k_s * s_;
      let f3 = wl * l + wm * m + ws * s;
      let f1 = wl * l_dS + wm * m_dS + ws * s_dS;
      let f22 = wl * l_dS2 + wm * m_dS2 + ws * s_dS2;
      S = S - f3 * f1 / (f1 * f1 - 0.5 * f3 * f22);
    }
    return S;
  }
  function find_cusp(a, b) {
    let S_cusp = compute_max_saturation(a, b);
    let rgb2 = convertOklabToLrgb_default({ l: 1, a: S_cusp * a, b: S_cusp * b });
    let L_cusp = Math.cbrt(1 / Math.max(rgb2.r, rgb2.g, rgb2.b));
    let C_cusp = L_cusp * S_cusp;
    return [L_cusp, C_cusp];
  }
  function find_gamut_intersection(a, b, L1, C12, L0, cusp = null) {
    if (!cusp) {
      cusp = find_cusp(a, b);
    }
    let t;
    if ((L1 - L0) * cusp[1] - (cusp[0] - L0) * C12 <= 0) {
      t = cusp[1] * L0 / (C12 * cusp[0] + cusp[1] * (L0 - L1));
    } else {
      t = cusp[1] * (L0 - 1) / (C12 * (cusp[0] - 1) + cusp[1] * (L0 - L1));
      {
        let dL = L1 - L0;
        let dC = C12;
        let k_l = 0.3963377774 * a + 0.2158037573 * b;
        let k_m = -0.1055613458 * a - 0.0638541728 * b;
        let k_s = -0.0894841775 * a - 1.291485548 * b;
        let l_dt = dL + dC * k_l;
        let m_dt = dL + dC * k_m;
        let s_dt = dL + dC * k_s;
        {
          let L = L0 * (1 - t) + t * L1;
          let C = t * C12;
          let l_ = L + C * k_l;
          let m_ = L + C * k_m;
          let s_ = L + C * k_s;
          let l = l_ * l_ * l_;
          let m = m_ * m_ * m_;
          let s = s_ * s_ * s_;
          let ldt = 3 * l_dt * l_ * l_;
          let mdt = 3 * m_dt * m_ * m_;
          let sdt = 3 * s_dt * s_ * s_;
          let ldt2 = 6 * l_dt * l_dt * l_;
          let mdt2 = 6 * m_dt * m_dt * m_;
          let sdt2 = 6 * s_dt * s_dt * s_;
          let r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s - 1;
          let r1 = 4.0767416621 * ldt - 3.3077115913 * mdt + 0.2309699292 * sdt;
          let r2 = 4.0767416621 * ldt2 - 3.3077115913 * mdt2 + 0.2309699292 * sdt2;
          let u_r = r1 / (r1 * r1 - 0.5 * r * r2);
          let t_r = -r * u_r;
          let g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s - 1;
          let g1 = -1.2684380046 * ldt + 2.6097574011 * mdt - 0.3413193965 * sdt;
          let g2 = -1.2684380046 * ldt2 + 2.6097574011 * mdt2 - 0.3413193965 * sdt2;
          let u_g = g1 / (g1 * g1 - 0.5 * g * g2);
          let t_g = -g * u_g;
          let b2 = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s - 1;
          let b1 = -0.0041960863 * ldt - 0.7034186147 * mdt + 1.707614701 * sdt;
          let b22 = -0.0041960863 * ldt2 - 0.7034186147 * mdt2 + 1.707614701 * sdt2;
          let u_b = b1 / (b1 * b1 - 0.5 * b2 * b22);
          let t_b = -b2 * u_b;
          t_r = u_r >= 0 ? t_r : 1e6;
          t_g = u_g >= 0 ? t_g : 1e6;
          t_b = u_b >= 0 ? t_b : 1e6;
          t += Math.min(t_r, Math.min(t_g, t_b));
        }
      }
    }
    return t;
  }
  function get_ST_max(a_, b_, cusp = null) {
    if (!cusp) {
      cusp = find_cusp(a_, b_);
    }
    let L = cusp[0];
    let C = cusp[1];
    return [C / L, C / (1 - L)];
  }
  function get_Cs(L, a_, b_) {
    let cusp = find_cusp(a_, b_);
    let C_max = find_gamut_intersection(a_, b_, L, 1, L, cusp);
    let ST_max = get_ST_max(a_, b_, cusp);
    let S_mid = 0.11516993 + 1 / (7.4477897 + 4.1590124 * b_ + a_ * (-2.19557347 + 1.75198401 * b_ + a_ * (-2.13704948 - 10.02301043 * b_ + a_ * (-4.24894561 + 5.38770819 * b_ + 4.69891013 * a_))));
    let T_mid = 0.11239642 + 1 / (1.6132032 - 0.68124379 * b_ + a_ * (0.40370612 + 0.90148123 * b_ + a_ * (-0.27087943 + 0.6122399 * b_ + a_ * (299215e-8 - 0.45399568 * b_ - 0.14661872 * a_))));
    let k4 = C_max / Math.min(L * ST_max[0], (1 - L) * ST_max[1]);
    let C_a = L * S_mid;
    let C_b = (1 - L) * T_mid;
    let C_mid = 0.9 * k4 * Math.sqrt(
      Math.sqrt(
        1 / (1 / (C_a * C_a * C_a * C_a) + 1 / (C_b * C_b * C_b * C_b))
      )
    );
    C_a = L * 0.4;
    C_b = (1 - L) * 0.8;
    let C_0 = Math.sqrt(1 / (1 / (C_a * C_a) + 1 / (C_b * C_b)));
    return [C_0, C_mid, C_max];
  }

  // node_modules/culori/src/okhsl/convertOklabToOkhsl.js
  function convertOklabToOkhsl(lab2) {
    const l = lab2.l !== void 0 ? lab2.l : 0;
    const a = lab2.a !== void 0 ? lab2.a : 0;
    const b = lab2.b !== void 0 ? lab2.b : 0;
    const ret = { mode: "okhsl", l: toe(l) };
    if (lab2.alpha !== void 0) {
      ret.alpha = lab2.alpha;
    }
    let c2 = Math.sqrt(a * a + b * b);
    if (!c2) {
      ret.s = 0;
      return ret;
    }
    let [C_0, C_mid, C_max] = get_Cs(l, a / c2, b / c2);
    let s;
    if (c2 < C_mid) {
      let k_0 = 0;
      let k_1 = 0.8 * C_0;
      let k_2 = 1 - k_1 / C_mid;
      let t = (c2 - k_0) / (k_1 + k_2 * (c2 - k_0));
      s = t * 0.8;
    } else {
      let k_0 = C_mid;
      let k_1 = 0.2 * C_mid * C_mid * 1.25 * 1.25 / C_0;
      let k_2 = 1 - k_1 / (C_max - C_mid);
      let t = (c2 - k_0) / (k_1 + k_2 * (c2 - k_0));
      s = 0.8 + 0.2 * t;
    }
    if (s) {
      ret.s = s;
      ret.h = normalizeHue_default(Math.atan2(b, a) * 180 / Math.PI);
    }
    return ret;
  }

  // node_modules/culori/src/okhsl/convertOkhslToOklab.js
  function convertOkhslToOklab(hsl2) {
    let h = hsl2.h !== void 0 ? hsl2.h : 0;
    let s = hsl2.s !== void 0 ? hsl2.s : 0;
    let l = hsl2.l !== void 0 ? hsl2.l : 0;
    const ret = { mode: "oklab", l: toe_inv(l) };
    if (hsl2.alpha !== void 0) {
      ret.alpha = hsl2.alpha;
    }
    if (!s || l === 1) {
      ret.a = ret.b = 0;
      return ret;
    }
    let a_ = Math.cos(h / 180 * Math.PI);
    let b_ = Math.sin(h / 180 * Math.PI);
    let [C_0, C_mid, C_max] = get_Cs(ret.l, a_, b_);
    let t, k_0, k_1, k_2;
    if (s < 0.8) {
      t = 1.25 * s;
      k_0 = 0;
      k_1 = 0.8 * C_0;
      k_2 = 1 - k_1 / C_mid;
    } else {
      t = 5 * (s - 0.8);
      k_0 = C_mid;
      k_1 = 0.2 * C_mid * C_mid * 1.25 * 1.25 / C_0;
      k_2 = 1 - k_1 / (C_max - C_mid);
    }
    let C = k_0 + t * k_1 / (1 - k_2 * t);
    ret.a = C * a_;
    ret.b = C * b_;
    return ret;
  }

  // node_modules/culori/src/okhsl/modeOkhsl.js
  var modeOkhsl = {
    ...definition_default7,
    mode: "okhsl",
    channels: ["h", "s", "l", "alpha"],
    parse: ["--okhsl"],
    serialize: "--okhsl",
    fromMode: {
      oklab: convertOklabToOkhsl,
      rgb: (c2) => convertOklabToOkhsl(convertRgbToOklab_default(c2))
    },
    toMode: {
      oklab: convertOkhslToOklab,
      rgb: (c2) => convertOklabToRgb_default(convertOkhslToOklab(c2))
    }
  };
  var modeOkhsl_default = modeOkhsl;

  // node_modules/culori/src/okhsv/convertOklabToOkhsv.js
  function convertOklabToOkhsv(lab2) {
    let l = lab2.l !== void 0 ? lab2.l : 0;
    let a = lab2.a !== void 0 ? lab2.a : 0;
    let b = lab2.b !== void 0 ? lab2.b : 0;
    let c2 = Math.sqrt(a * a + b * b);
    let a_ = c2 ? a / c2 : 1;
    let b_ = c2 ? b / c2 : 1;
    let [S_max, T] = get_ST_max(a_, b_);
    let S_0 = 0.5;
    let k4 = 1 - S_0 / S_max;
    let t = T / (c2 + l * T);
    let L_v = t * l;
    let C_v = t * c2;
    let L_vt = toe_inv(L_v);
    let C_vt = C_v * L_vt / L_v;
    let rgb_scale = convertOklabToLrgb_default({ l: L_vt, a: a_ * C_vt, b: b_ * C_vt });
    let scale_L = Math.cbrt(
      1 / Math.max(rgb_scale.r, rgb_scale.g, rgb_scale.b, 0)
    );
    l = l / scale_L;
    c2 = c2 / scale_L * toe(l) / l;
    l = toe(l);
    const ret = {
      mode: "okhsv",
      s: c2 ? (S_0 + T) * C_v / (T * S_0 + T * k4 * C_v) : 0,
      v: l ? l / L_v : 0
    };
    if (ret.s) {
      ret.h = normalizeHue_default(Math.atan2(b, a) * 180 / Math.PI);
    }
    if (lab2.alpha !== void 0) {
      ret.alpha = lab2.alpha;
    }
    return ret;
  }

  // node_modules/culori/src/okhsv/convertOkhsvToOklab.js
  function convertOkhsvToOklab(hsv2) {
    const ret = { mode: "oklab" };
    if (hsv2.alpha !== void 0) {
      ret.alpha = hsv2.alpha;
    }
    const h = hsv2.h !== void 0 ? hsv2.h : 0;
    const s = hsv2.s !== void 0 ? hsv2.s : 0;
    const v = hsv2.v !== void 0 ? hsv2.v : 0;
    const a_ = Math.cos(h / 180 * Math.PI);
    const b_ = Math.sin(h / 180 * Math.PI);
    const [S_max, T] = get_ST_max(a_, b_);
    const S_0 = 0.5;
    const k4 = 1 - S_0 / S_max;
    const L_v = 1 - s * S_0 / (S_0 + T - T * k4 * s);
    const C_v = s * T * S_0 / (S_0 + T - T * k4 * s);
    const L_vt = toe_inv(L_v);
    const C_vt = C_v * L_vt / L_v;
    const rgb_scale = convertOklabToLrgb_default({
      l: L_vt,
      a: a_ * C_vt,
      b: b_ * C_vt
    });
    const scale_L = Math.cbrt(
      1 / Math.max(rgb_scale.r, rgb_scale.g, rgb_scale.b, 0)
    );
    const L_new = toe_inv(v * L_v);
    const C = C_v * L_new / L_v;
    ret.l = L_new * scale_L;
    ret.a = C * a_ * scale_L;
    ret.b = C * b_ * scale_L;
    return ret;
  }

  // node_modules/culori/src/okhsv/modeOkhsv.js
  var modeOkhsv = {
    ...definition_default8,
    mode: "okhsv",
    channels: ["h", "s", "v", "alpha"],
    parse: ["--okhsv"],
    serialize: "--okhsv",
    fromMode: {
      oklab: convertOklabToOkhsv,
      rgb: (c2) => convertOklabToOkhsv(convertRgbToOklab_default(c2))
    },
    toMode: {
      oklab: convertOkhsvToOklab,
      rgb: (c2) => convertOklabToRgb_default(convertOkhsvToOklab(c2))
    }
  };
  var modeOkhsv_default = modeOkhsv;

  // node_modules/culori/src/oklab/parseOklab.js
  function parseOklab(color, parsed) {
    if (!parsed || parsed[0] !== "oklab") {
      return void 0;
    }
    const res = { mode: "oklab" };
    const [, l, a, b, alpha] = parsed;
    if (l.type === Tok.Hue || a.type === Tok.Hue || b.type === Tok.Hue) {
      return void 0;
    }
    if (l.type !== Tok.None) {
      res.l = Math.min(
        Math.max(0, l.type === Tok.Number ? l.value : l.value / 100),
        1
      );
    }
    if (a.type !== Tok.None) {
      res.a = a.type === Tok.Number ? a.value : a.value * 0.4 / 100;
    }
    if (b.type !== Tok.None) {
      res.b = b.type === Tok.Number ? b.value : b.value * 0.4 / 100;
    }
    if (alpha.type !== Tok.None) {
      res.alpha = Math.min(
        1,
        Math.max(
          0,
          alpha.type === Tok.Number ? alpha.value : alpha.value / 100
        )
      );
    }
    return res;
  }
  var parseOklab_default = parseOklab;

  // node_modules/culori/src/oklab/definition.js
  var definition20 = {
    ...definition_default13,
    mode: "oklab",
    toMode: {
      lrgb: convertOklabToLrgb_default,
      rgb: convertOklabToRgb_default
    },
    fromMode: {
      lrgb: convertLrgbToOklab_default,
      rgb: convertRgbToOklab_default
    },
    ranges: {
      l: [0, 1],
      a: [-0.4, 0.4],
      b: [-0.4, 0.4]
    },
    parse: [parseOklab_default],
    serialize: (c2) => `oklab(${c2.l !== void 0 ? c2.l : "none"} ${c2.a !== void 0 ? c2.a : "none"} ${c2.b !== void 0 ? c2.b : "none"}${c2.alpha < 1 ? ` / ${c2.alpha}` : ""})`
  };
  var definition_default20 = definition20;

  // node_modules/culori/src/oklch/parseOklch.js
  function parseOklch(color, parsed) {
    if (!parsed || parsed[0] !== "oklch") {
      return void 0;
    }
    const res = { mode: "oklch" };
    const [, l, c2, h, alpha] = parsed;
    if (l.type !== Tok.None) {
      if (l.type === Tok.Hue) {
        return void 0;
      }
      res.l = Math.min(
        Math.max(0, l.type === Tok.Number ? l.value : l.value / 100),
        1
      );
    }
    if (c2.type !== Tok.None) {
      res.c = Math.max(
        0,
        c2.type === Tok.Number ? c2.value : c2.value * 0.4 / 100
      );
    }
    if (h.type !== Tok.None) {
      if (h.type === Tok.Percentage) {
        return void 0;
      }
      res.h = h.value;
    }
    if (alpha.type !== Tok.None) {
      res.alpha = Math.min(
        1,
        Math.max(
          0,
          alpha.type === Tok.Number ? alpha.value : alpha.value / 100
        )
      );
    }
    return res;
  }
  var parseOklch_default = parseOklch;

  // node_modules/culori/src/oklch/definition.js
  var definition21 = {
    ...definition_default15,
    mode: "oklch",
    toMode: {
      oklab: (c2) => convertLchToLab_default(c2, "oklab"),
      rgb: (c2) => convertOklabToRgb_default(convertLchToLab_default(c2, "oklab"))
    },
    fromMode: {
      rgb: (c2) => convertLabToLch_default(convertRgbToOklab_default(c2), "oklch"),
      oklab: (c2) => convertLabToLch_default(c2, "oklch")
    },
    parse: [parseOklch_default],
    serialize: (c2) => `oklch(${c2.l !== void 0 ? c2.l : "none"} ${c2.c !== void 0 ? c2.c : "none"} ${c2.h !== void 0 ? c2.h : "none"}${c2.alpha < 1 ? ` / ${c2.alpha}` : ""})`,
    ranges: {
      l: [0, 1],
      c: [0, 0.4],
      h: [0, 360]
    }
  };
  var definition_default21 = definition21;

  // node_modules/culori/src/p3/convertP3ToXyz65.js
  var convertP3ToXyz65 = (rgb2) => {
    let { r, g, b, alpha } = convertRgbToLrgb_default(rgb2);
    let res = {
      mode: "xyz65",
      x: 0.486570948648216 * r + 0.265667693169093 * g + 0.1982172852343625 * b,
      y: 0.2289745640697487 * r + 0.6917385218365062 * g + 0.079286914093745 * b,
      z: 0 * r + 0.0451133818589026 * g + 1.043944368900976 * b
    };
    if (alpha !== void 0) {
      res.alpha = alpha;
    }
    return res;
  };
  var convertP3ToXyz65_default = convertP3ToXyz65;

  // node_modules/culori/src/p3/convertXyz65ToP3.js
  var convertXyz65ToP3 = ({ x, y, z, alpha }) => {
    if (x === void 0) x = 0;
    if (y === void 0) y = 0;
    if (z === void 0) z = 0;
    let res = convertLrgbToRgb_default(
      {
        r: x * 2.4934969119414263 - y * 0.9313836179191242 - 0.402710784450717 * z,
        g: x * -0.8294889695615749 + y * 1.7626640603183465 + 0.0236246858419436 * z,
        b: x * 0.0358458302437845 - y * 0.0761723892680418 + 0.9568845240076871 * z
      },
      "p3"
    );
    if (alpha !== void 0) {
      res.alpha = alpha;
    }
    return res;
  };
  var convertXyz65ToP3_default = convertXyz65ToP3;

  // node_modules/culori/src/p3/definition.js
  var definition22 = {
    ...definition_default,
    mode: "p3",
    parse: ["display-p3"],
    serialize: "display-p3",
    fromMode: {
      rgb: (color) => convertXyz65ToP3_default(convertRgbToXyz65_default(color)),
      xyz65: convertXyz65ToP3_default
    },
    toMode: {
      rgb: (color) => convertXyz65ToRgb_default(convertP3ToXyz65_default(color)),
      xyz65: convertP3ToXyz65_default
    }
  };
  var definition_default22 = definition22;

  // node_modules/culori/src/prophoto/convertXyz50ToProphoto.js
  var gamma2 = (v) => {
    let abs2 = Math.abs(v);
    if (abs2 >= 1 / 512) {
      return Math.sign(v) * Math.pow(abs2, 1 / 1.8);
    }
    return 16 * v;
  };
  var convertXyz50ToProphoto = ({ x, y, z, alpha }) => {
    if (x === void 0) x = 0;
    if (y === void 0) y = 0;
    if (z === void 0) z = 0;
    let res = {
      mode: "prophoto",
      r: gamma2(
        x * 1.3457868816471585 - y * 0.2555720873797946 - 0.0511018649755453 * z
      ),
      g: gamma2(
        x * -0.5446307051249019 + y * 1.5082477428451466 + 0.0205274474364214 * z
      ),
      b: gamma2(x * 0 + y * 0 + 1.2119675456389452 * z)
    };
    if (alpha !== void 0) {
      res.alpha = alpha;
    }
    return res;
  };
  var convertXyz50ToProphoto_default = convertXyz50ToProphoto;

  // node_modules/culori/src/prophoto/convertProphotoToXyz50.js
  var linearize2 = (v = 0) => {
    let abs2 = Math.abs(v);
    if (abs2 >= 16 / 512) {
      return Math.sign(v) * Math.pow(abs2, 1.8);
    }
    return v / 16;
  };
  var convertProphotoToXyz50 = (prophoto2) => {
    let r = linearize2(prophoto2.r);
    let g = linearize2(prophoto2.g);
    let b = linearize2(prophoto2.b);
    let res = {
      mode: "xyz50",
      x: 0.7977666449006423 * r + 0.1351812974005331 * g + 0.0313477341283922 * b,
      y: 0.2880748288194013 * r + 0.7118352342418731 * g + 899369387256e-16 * b,
      z: 0 * r + 0 * g + 0.8251046025104602 * b
    };
    if (prophoto2.alpha !== void 0) {
      res.alpha = prophoto2.alpha;
    }
    return res;
  };
  var convertProphotoToXyz50_default = convertProphotoToXyz50;

  // node_modules/culori/src/prophoto/definition.js
  var definition23 = {
    ...definition_default,
    mode: "prophoto",
    parse: ["prophoto-rgb"],
    serialize: "prophoto-rgb",
    fromMode: {
      xyz50: convertXyz50ToProphoto_default,
      rgb: (color) => convertXyz50ToProphoto_default(convertRgbToXyz50_default(color))
    },
    toMode: {
      xyz50: convertProphotoToXyz50_default,
      rgb: (color) => convertXyz50ToRgb_default(convertProphotoToXyz50_default(color))
    }
  };
  var definition_default23 = definition23;

  // node_modules/culori/src/rec2020/convertXyz65ToRec2020.js
  var \u03B1 = 1.09929682680944;
  var \u03B2 = 0.018053968510807;
  var gamma3 = (v) => {
    const abs2 = Math.abs(v);
    if (abs2 > \u03B2) {
      return (Math.sign(v) || 1) * (\u03B1 * Math.pow(abs2, 0.45) - (\u03B1 - 1));
    }
    return 4.5 * v;
  };
  var convertXyz65ToRec2020 = ({ x, y, z, alpha }) => {
    if (x === void 0) x = 0;
    if (y === void 0) y = 0;
    if (z === void 0) z = 0;
    let res = {
      mode: "rec2020",
      r: gamma3(
        x * 1.7166511879712683 - y * 0.3556707837763925 - 0.2533662813736599 * z
      ),
      g: gamma3(
        x * -0.6666843518324893 + y * 1.6164812366349395 + 0.0157685458139111 * z
      ),
      b: gamma3(
        x * 0.0176398574453108 - y * 0.0427706132578085 + 0.9421031212354739 * z
      )
    };
    if (alpha !== void 0) {
      res.alpha = alpha;
    }
    return res;
  };
  var convertXyz65ToRec2020_default = convertXyz65ToRec2020;

  // node_modules/culori/src/rec2020/convertRec2020ToXyz65.js
  var \u03B12 = 1.09929682680944;
  var \u03B22 = 0.018053968510807;
  var linearize3 = (v = 0) => {
    let abs2 = Math.abs(v);
    if (abs2 < \u03B22 * 4.5) {
      return v / 4.5;
    }
    return (Math.sign(v) || 1) * Math.pow((abs2 + \u03B12 - 1) / \u03B12, 1 / 0.45);
  };
  var convertRec2020ToXyz65 = (rec20202) => {
    let r = linearize3(rec20202.r);
    let g = linearize3(rec20202.g);
    let b = linearize3(rec20202.b);
    let res = {
      mode: "xyz65",
      x: 0.6369580483012911 * r + 0.1446169035862083 * g + 0.1688809751641721 * b,
      y: 0.262700212011267 * r + 0.6779980715188708 * g + 0.059301716469862 * b,
      z: 0 * r + 0.0280726930490874 * g + 1.0609850577107909 * b
    };
    if (rec20202.alpha !== void 0) {
      res.alpha = rec20202.alpha;
    }
    return res;
  };
  var convertRec2020ToXyz65_default = convertRec2020ToXyz65;

  // node_modules/culori/src/rec2020/definition.js
  var definition24 = {
    ...definition_default,
    mode: "rec2020",
    fromMode: {
      xyz65: convertXyz65ToRec2020_default,
      rgb: (color) => convertXyz65ToRec2020_default(convertRgbToXyz65_default(color))
    },
    toMode: {
      xyz65: convertRec2020ToXyz65_default,
      rgb: (color) => convertXyz65ToRgb_default(convertRec2020ToXyz65_default(color))
    },
    parse: ["rec2020"],
    serialize: "rec2020"
  };
  var definition_default24 = definition24;

  // node_modules/culori/src/xyb/constants.js
  var bias = 0.0037930732552754493;
  var bias_cbrt = Math.cbrt(bias);

  // node_modules/culori/src/xyb/convertRgbToXyb.js
  var transfer = (v) => Math.cbrt(v) - bias_cbrt;
  var convertRgbToXyb = (color) => {
    const { r, g, b, alpha } = convertRgbToLrgb_default(color);
    const l = transfer(0.3 * r + 0.622 * g + 0.078 * b + bias);
    const m = transfer(0.23 * r + 0.692 * g + 0.078 * b + bias);
    const s = transfer(
      0.2434226892454782 * r + 0.2047674442449682 * g + 0.5518098665095535 * b + bias
    );
    const res = {
      mode: "xyb",
      x: (l - m) / 2,
      y: (l + m) / 2,
      /* Apply default chroma from luma (subtract Y from B) */
      b: s - (l + m) / 2
    };
    if (alpha !== void 0) res.alpha = alpha;
    return res;
  };
  var convertRgbToXyb_default = convertRgbToXyb;

  // node_modules/culori/src/xyb/convertXybToRgb.js
  var transfer2 = (v) => Math.pow(v + bias_cbrt, 3);
  var convertXybToRgb = ({ x, y, b, alpha }) => {
    if (x === void 0) x = 0;
    if (y === void 0) y = 0;
    if (b === void 0) b = 0;
    const l = transfer2(x + y) - bias;
    const m = transfer2(y - x) - bias;
    const s = transfer2(b + y) - bias;
    const res = convertLrgbToRgb_default({
      r: 11.031566904639861 * l - 9.866943908131562 * m - 0.16462299650829934 * s,
      g: -3.2541473810744237 * l + 4.418770377582723 * m - 0.16462299650829934 * s,
      b: -3.6588512867136815 * l + 2.7129230459360922 * m + 1.9459282407775895 * s
    });
    if (alpha !== void 0) res.alpha = alpha;
    return res;
  };
  var convertXybToRgb_default = convertXybToRgb;

  // node_modules/culori/src/xyb/definition.js
  var definition25 = {
    mode: "xyb",
    channels: ["x", "y", "b", "alpha"],
    parse: ["--xyb"],
    serialize: "--xyb",
    toMode: {
      rgb: convertXybToRgb_default
    },
    fromMode: {
      rgb: convertRgbToXyb_default
    },
    ranges: {
      x: [-0.0154, 0.0281],
      y: [0, 0.8453],
      b: [-0.2778, 0.388]
    },
    interpolate: {
      x: interpolatorLinear,
      y: interpolatorLinear,
      b: interpolatorLinear,
      alpha: { use: interpolatorLinear, fixup: fixupAlpha }
    }
  };
  var definition_default25 = definition25;

  // node_modules/culori/src/xyz50/definition.js
  var definition26 = {
    mode: "xyz50",
    parse: ["xyz-d50"],
    serialize: "xyz-d50",
    toMode: {
      rgb: convertXyz50ToRgb_default,
      lab: convertXyz50ToLab_default
    },
    fromMode: {
      rgb: convertRgbToXyz50_default,
      lab: convertLabToXyz50_default
    },
    channels: ["x", "y", "z", "alpha"],
    ranges: {
      x: [0, 0.964],
      y: [0, 0.999],
      z: [0, 0.825]
    },
    interpolate: {
      x: interpolatorLinear,
      y: interpolatorLinear,
      z: interpolatorLinear,
      alpha: { use: interpolatorLinear, fixup: fixupAlpha }
    }
  };
  var definition_default26 = definition26;

  // node_modules/culori/src/xyz65/convertXyz65ToXyz50.js
  var convertXyz65ToXyz50 = (xyz652) => {
    let { x, y, z, alpha } = xyz652;
    if (x === void 0) x = 0;
    if (y === void 0) y = 0;
    if (z === void 0) z = 0;
    let res = {
      mode: "xyz50",
      x: 1.0479298208405488 * x + 0.0229467933410191 * y - 0.0501922295431356 * z,
      y: 0.0296278156881593 * x + 0.990434484573249 * y - 0.0170738250293851 * z,
      z: -0.0092430581525912 * x + 0.0150551448965779 * y + 0.7518742899580008 * z
    };
    if (alpha !== void 0) {
      res.alpha = alpha;
    }
    return res;
  };
  var convertXyz65ToXyz50_default = convertXyz65ToXyz50;

  // node_modules/culori/src/xyz65/convertXyz50ToXyz65.js
  var convertXyz50ToXyz65 = (xyz502) => {
    let { x, y, z, alpha } = xyz502;
    if (x === void 0) x = 0;
    if (y === void 0) y = 0;
    if (z === void 0) z = 0;
    let res = {
      mode: "xyz65",
      x: 0.9554734527042182 * x - 0.0230985368742614 * y + 0.0632593086610217 * z,
      y: -0.0283697069632081 * x + 1.0099954580058226 * y + 0.021041398966943 * z,
      z: 0.0123140016883199 * x - 0.0205076964334779 * y + 1.3303659366080753 * z
    };
    if (alpha !== void 0) {
      res.alpha = alpha;
    }
    return res;
  };
  var convertXyz50ToXyz65_default = convertXyz50ToXyz65;

  // node_modules/culori/src/xyz65/definition.js
  var definition27 = {
    mode: "xyz65",
    toMode: {
      rgb: convertXyz65ToRgb_default,
      xyz50: convertXyz65ToXyz50_default
    },
    fromMode: {
      rgb: convertRgbToXyz65_default,
      xyz50: convertXyz50ToXyz65_default
    },
    ranges: {
      x: [0, 0.95],
      y: [0, 1],
      z: [0, 1.088]
    },
    channels: ["x", "y", "z", "alpha"],
    parse: ["xyz", "xyz-d65"],
    serialize: "xyz-d65",
    interpolate: {
      x: interpolatorLinear,
      y: interpolatorLinear,
      z: interpolatorLinear,
      alpha: { use: interpolatorLinear, fixup: fixupAlpha }
    }
  };
  var definition_default27 = definition27;

  // node_modules/culori/src/yiq/convertRgbToYiq.js
  var convertRgbToYiq = ({ r, g, b, alpha }) => {
    if (r === void 0) r = 0;
    if (g === void 0) g = 0;
    if (b === void 0) b = 0;
    const res = {
      mode: "yiq",
      y: 0.29889531 * r + 0.58662247 * g + 0.11448223 * b,
      i: 0.59597799 * r - 0.2741761 * g - 0.32180189 * b,
      q: 0.21147017 * r - 0.52261711 * g + 0.31114694 * b
    };
    if (alpha !== void 0) res.alpha = alpha;
    return res;
  };
  var convertRgbToYiq_default = convertRgbToYiq;

  // node_modules/culori/src/yiq/convertYiqToRgb.js
  var convertYiqToRgb = ({ y, i, q, alpha }) => {
    if (y === void 0) y = 0;
    if (i === void 0) i = 0;
    if (q === void 0) q = 0;
    const res = {
      mode: "rgb",
      r: y + 0.95608445 * i + 0.6208885 * q,
      g: y - 0.27137664 * i - 0.6486059 * q,
      b: y - 1.10561724 * i + 1.70250126 * q
    };
    if (alpha !== void 0) res.alpha = alpha;
    return res;
  };
  var convertYiqToRgb_default = convertYiqToRgb;

  // node_modules/culori/src/yiq/definition.js
  var definition28 = {
    mode: "yiq",
    toMode: {
      rgb: convertYiqToRgb_default
    },
    fromMode: {
      rgb: convertRgbToYiq_default
    },
    channels: ["y", "i", "q", "alpha"],
    parse: ["--yiq"],
    serialize: "--yiq",
    ranges: {
      i: [-0.595, 0.595],
      q: [-0.522, 0.522]
    },
    interpolate: {
      y: interpolatorLinear,
      i: interpolatorLinear,
      q: interpolatorLinear,
      alpha: { use: interpolatorLinear, fixup: fixupAlpha }
    }
  };
  var definition_default28 = definition28;

  // node_modules/culori/src/index.js
  var a98 = useMode(definition_default2);
  var cubehelix = useMode(definition_default3);
  var dlab = useMode(definition_default4);
  var dlch = useMode(definition_default5);
  var hsi = useMode(definition_default6);
  var hsl = useMode(definition_default7);
  var hsv = useMode(definition_default8);
  var hwb = useMode(definition_default9);
  var itp = useMode(definition_default10);
  var jab = useMode(definition_default11);
  var jch = useMode(definition_default12);
  var lab = useMode(definition_default13);
  var lab65 = useMode(definition_default14);
  var lch = useMode(definition_default15);
  var lch65 = useMode(definition_default16);
  var lchuv = useMode(definition_default17);
  var lrgb = useMode(definition_default18);
  var luv = useMode(definition_default19);
  var okhsl = useMode(modeOkhsl_default);
  var okhsv = useMode(modeOkhsv_default);
  var oklab = useMode(definition_default20);
  var oklch = useMode(definition_default21);
  var p3 = useMode(definition_default22);
  var prophoto = useMode(definition_default23);
  var rec2020 = useMode(definition_default24);
  var rgb = useMode(definition_default);
  var xyb = useMode(definition_default25);
  var xyz50 = useMode(definition_default26);
  var xyz65 = useMode(definition_default27);
  var yiq = useMode(definition_default28);

  // src/dashboard/canvas/color.ts
  var toRgb = converter_default("rgb");
  function oklchToRgb(color, alpha = 1) {
    const rgb2 = toRgb({ mode: "oklch", l: color.l, c: color.c, h: color.h });
    if (!rgb2) {
      return `rgba(0,0,0,${alpha})`;
    }
    const r = Math.round(Math.max(0, Math.min(1, rgb2.r)) * 255);
    const g = Math.round(Math.max(0, Math.min(1, rgb2.g)) * 255);
    const b = Math.round(Math.max(0, Math.min(1, rgb2.b)) * 255);
    if (alpha >= 1) return `rgb(${r}, ${g}, ${b})`;
    return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
  }
  function shiftLightness(color, delta) {
    return { l: Math.max(0, Math.min(1, color.l + delta)), c: color.c, h: color.h };
  }
  function createSpotlightGradient(ctx, cx, cy, radius, color) {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    g.addColorStop(0, oklchToRgb(color, 1));
    g.addColorStop(0.18, oklchToRgb(color, 0.75));
    g.addColorStop(0.4, oklchToRgb(color, 0.35));
    g.addColorStop(0.65, oklchToRgb(color, 0.12));
    g.addColorStop(0.85, oklchToRgb(color, 0.03));
    g.addColorStop(1, oklchToRgb(color, 0));
    return g;
  }
  function createSoftBloomGradient(ctx, cx, cy, radius, color, peakAlpha = 0.6) {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    g.addColorStop(0, oklchToRgb(color, peakAlpha));
    g.addColorStop(0.5, oklchToRgb(color, peakAlpha * 0.25));
    g.addColorStop(1, oklchToRgb(color, 0));
    return g;
  }

  // src/dashboard/canvas/elements/Atmosphere.ts
  function renderAtmosphere(ctx, size) {
    const band = atmosphereBand(size);
    const tint = COLOR.atmosphere.clear;
    const g = ctx.createLinearGradient(0, band.y, 0, band.y + band.h);
    g.addColorStop(0, oklchToRgb(tint, 0.55));
    g.addColorStop(1, oklchToRgb(tint, 0));
    ctx.fillStyle = g;
    ctx.fillRect(band.x, band.y, band.w, band.h);
  }

  // src/dashboard/canvas/elements/AudienceDirection.ts
  function renderAudienceDirection(ctx, size) {
    const { center, radiusX, radiusY } = audienceFocus(size);
    const tone = COLOR.audience.available;
    ctx.save();
    ctx.translate(center.x, center.y);
    ctx.scale(1, radiusY / radiusX);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, radiusX);
    g.addColorStop(0, oklchToRgb(tone, 0.45));
    g.addColorStop(0.55, oklchToRgb(tone, 0.1));
    g.addColorStop(1, oklchToRgb(tone, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, radiusX, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // src/dashboard/canvas/elements/Pantheon.ts
  function renderPantheon(ctx, size) {
    const positions = pantheonPositions(size);
    const glyphRadius = pantheonGlyphRadius(size);
    const bloomRadius = glyphRadius * 3;
    for (const driveId of DRIVE_IDS) {
      const pos = positions[driveId];
      const driveColor = COLOR.drive[driveId];
      ctx.save();
      ctx.fillStyle = createSoftBloomGradient(
        ctx,
        pos.x,
        pos.y,
        bloomRadius,
        driveColor,
        0.65
        // peak alpha — moderate, equal across all four drives in Phase 2
      );
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, bloomRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    void glyphRadius;
  }

  // src/dashboard/canvas/elements/Stage.ts
  function renderStage(ctx, size) {
    const stage = stageEllipse(size);
    const spotlightColor = COLOR.formBase;
    const spotlightRadius = stage.rx * 1.6;
    ctx.save();
    ctx.fillStyle = createSpotlightGradient(
      ctx,
      stage.x,
      stage.y,
      spotlightRadius,
      spotlightColor
    );
    ctx.beginPath();
    ctx.arc(stage.x, stage.y, spotlightRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(255, 255, 255, 0.06)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(stage.x, stage.y, stage.rx, stage.ry, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    void COLOR.formBase;
  }

  // src/dashboard/canvas/elements/Substrate.ts
  function renderSubstrate(ctx, size) {
    const band = substrateBand(size);
    const baseTop = COLOR.background;
    const baseBottom = shiftLightness(COLOR.background, 0.025);
    const g = ctx.createLinearGradient(0, band.y, 0, band.y + band.h);
    g.addColorStop(0, oklchToRgb(baseTop, 1));
    g.addColorStop(1, oklchToRgb(baseBottom, 1));
    ctx.fillStyle = g;
    ctx.fillRect(band.x, band.y, band.w, band.h);
  }

  // src/dashboard/canvas/renderer.ts
  function renderForum(ctx, size) {
    ctx.fillStyle = oklchToRgb(COLOR.background, 1);
    ctx.fillRect(0, 0, size.width, size.height);
    renderAtmosphere(ctx, size);
    renderSubstrate(ctx, size);
    renderAudienceDirection(ctx, size);
    renderPantheon(ctx, size);
    renderStage(ctx, size);
  }

  // src/dashboard/canvas/ForumCanvas.tsx
  function ForumCanvas({ className }) {
    const canvasRef = useRef(null);
    const wrapperRef = useRef(null);
    useEffect(() => {
      const canvas = canvasRef.current;
      const wrapper = wrapperRef.current;
      if (!canvas || !wrapper) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        console.error("forum: 2D context unavailable");
        return;
      }
      function draw() {
        if (!canvas || !ctx || !wrapper) return;
        const rect = wrapper.getBoundingClientRect();
        const size = {
          width: Math.max(1, rect.width),
          height: Math.max(1, rect.height),
          dpr: window.devicePixelRatio || 1
        };
        configureCanvasForDpr(canvas, ctx, size);
        renderForum(ctx, size);
      }
      draw();
      const ro = new ResizeObserver(() => draw());
      ro.observe(wrapper);
      const dprMq = window.matchMedia(
        `(resolution: ${window.devicePixelRatio}dppx)`
      );
      const onDprChange = () => draw();
      dprMq.addEventListener?.("change", onDprChange);
      return () => {
        ro.disconnect();
        dprMq.removeEventListener?.("change", onDprChange);
      };
    }, []);
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        ref: wrapperRef,
        className,
        style: { position: "relative", width: "100%", height: "100%" }
      },
      /* @__PURE__ */ React.createElement(
        "canvas",
        {
          ref: canvasRef,
          style: { display: "block", width: "100%", height: "100%" }
        }
      )
    );
  }

  // src/dashboard/Forum.tsx
  function StatusBadge({ status }) {
    const variant = status === "open" ? "default" : status === "connecting" ? "secondary" : status === "error" ? "destructive" : "outline";
    return /* @__PURE__ */ React.createElement(Badge, { variant }, status);
  }
  function formatAge(ts) {
    if (ts === null) return "\u2014";
    const ageSec = Math.floor((Date.now() - ts) / 1e3);
    if (ageSec < 60) return `${ageSec}s ago`;
    if (ageSec < 3600) return `${Math.floor(ageSec / 60)}m ago`;
    return `${Math.floor(ageSec / 3600)}h ago`;
  }
  function Forum() {
    const { state, status, lastUpdateAt } = useForumState();
    const [pluginHealth, setPluginHealth] = useState(null);
    const [, setTick] = useState(0);
    useEffect(() => {
      const i = window.setInterval(() => setTick((n) => n + 1), 1e3);
      return () => clearInterval(i);
    }, []);
    useEffect(() => {
      fetchJSON("/api/plugins/forum/health").then((d) => setPluginHealth(d)).catch(() => setPluginHealth({ error: "plugin backend unreachable" }));
    }, []);
    return /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-4 h-full" }, /* @__PURE__ */ React.createElement(
      "div",
      {
        style: {
          width: "100%",
          aspectRatio: "16 / 9",
          minHeight: "480px",
          maxHeight: "75vh",
          borderRadius: "8px",
          overflow: "hidden",
          background: "#0a0e1c"
        }
      },
      /* @__PURE__ */ React.createElement(ForumCanvas, null)
    ), /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement(CardHeader, null, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React.createElement(CardTitle, { className: "text-sm" }, "Diagnostic \u2014 Phase 2 (static composition)"), /* @__PURE__ */ React.createElement(Badge, { variant: "outline" }, "v0.2.0"))), /* @__PURE__ */ React.createElement(CardContent, { className: "flex flex-col gap-2 text-xs" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement("span", { className: "text-muted-foreground" }, "Athena WS:"), /* @__PURE__ */ React.createElement(StatusBadge, { status }), /* @__PURE__ */ React.createElement("span", { className: "text-muted-foreground ml-3" }, "last update:"), /* @__PURE__ */ React.createElement("span", { className: "font-mono" }, formatAge(lastUpdateAt)), /* @__PURE__ */ React.createElement("span", { className: "text-muted-foreground ml-3" }, "plugin backend:"), /* @__PURE__ */ React.createElement("code", { className: "font-mono" }, pluginHealth === null ? "loading\u2026" : JSON.stringify(pluginHealth))), state !== null && /* @__PURE__ */ React.createElement("details", { className: "mt-1" }, /* @__PURE__ */ React.createElement("summary", { className: "text-muted-foreground cursor-pointer hover:text-foreground" }, "Athena state (", Object.keys(state).length, " top-level keys, step ", state.step ?? "\u2014", ")"), /* @__PURE__ */ React.createElement("pre", { className: "mt-2 font-mono bg-background/40 p-3 rounded border border-border overflow-x-auto max-h-72" }, JSON.stringify(state, null, 2))))));
  }

  // src/dashboard/index.tsx
  if (HERMES_PLUGINS && typeof HERMES_PLUGINS.register === "function") {
    HERMES_PLUGINS.register("forum", Forum);
  } else {
    console.error("forum: window.__HERMES_PLUGINS__.register not available");
  }
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vc3JjL2Rhc2hib2FyZC9zZGsudHMiLCAiLi4vLi4vc3JjL2Rhc2hib2FyZC9kYXRhL3VzZUZvcnVtU3RhdGUudHMiLCAiLi4vLi4vc3JjL2Rhc2hib2FyZC9kZXNpZ24vdG9rZW5zLnRzIiwgIi4uLy4uL3NyYy9kYXNoYm9hcmQvY2FudmFzL2dlb21ldHJ5LnRzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL3JnYi9wYXJzZU51bWJlci5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9jb2xvcnMvbmFtZWQuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvcmdiL3BhcnNlTmFtZWQuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvcmdiL3BhcnNlSGV4LmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL3V0aWwvcmVnZXguanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvcmdiL3BhcnNlUmdiTGVnYWN5LmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL19wcmVwYXJlLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL2NvbnZlcnRlci5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9tb2Rlcy5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9wYXJzZS5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9yZ2IvcGFyc2VSZ2IuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvcmdiL3BhcnNlVHJhbnNwYXJlbnQuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvaW50ZXJwb2xhdGUvbGVycC5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9pbnRlcnBvbGF0ZS9waWVjZXdpc2UuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvaW50ZXJwb2xhdGUvbGluZWFyLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL2ZpeHVwL2FscGhhLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL3JnYi9kZWZpbml0aW9uLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL2E5OC9jb252ZXJ0QTk4VG9YeXo2NS5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9hOTgvY29udmVydFh5ejY1VG9BOTguanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvbHJnYi9jb252ZXJ0UmdiVG9McmdiLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL3h5ejY1L2NvbnZlcnRSZ2JUb1h5ejY1LmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL2xyZ2IvY29udmVydExyZ2JUb1JnYi5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy94eXo2NS9jb252ZXJ0WHl6NjVUb1JnYi5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9hOTgvZGVmaW5pdGlvbi5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy91dGlsL25vcm1hbGl6ZUh1ZS5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9maXh1cC9odWUuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvY3ViZWhlbGl4L2NvbnN0YW50cy5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9jdWJlaGVsaXgvY29udmVydFJnYlRvQ3ViZWhlbGl4LmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL2N1YmVoZWxpeC9jb252ZXJ0Q3ViZWhlbGl4VG9SZ2IuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvZGlmZmVyZW5jZS5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9hdmVyYWdlLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL2N1YmVoZWxpeC9kZWZpbml0aW9uLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL2xjaC9jb252ZXJ0TGFiVG9MY2guanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvbGNoL2NvbnZlcnRMY2hUb0xhYi5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy94eXo2NS9jb25zdGFudHMuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvY29uc3RhbnRzLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL2xhYjY1L2NvbnZlcnRMYWI2NVRvWHl6NjUuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvbGFiNjUvY29udmVydExhYjY1VG9SZ2IuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvbGFiNjUvY29udmVydFh5ejY1VG9MYWI2NS5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9sYWI2NS9jb252ZXJ0UmdiVG9MYWI2NS5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9kbGNoL2NvbnN0YW50cy5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9kbGNoL2NvbnZlcnREbGNoVG9MYWI2NS5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9kbGNoL2NvbnZlcnRMYWI2NVRvRGxjaC5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9kbGFiL2RlZmluaXRpb24uanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvZGxjaC9kZWZpbml0aW9uLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL2hzaS9jb252ZXJ0SHNpVG9SZ2IuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvaHNpL2NvbnZlcnRSZ2JUb0hzaS5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9oc2kvZGVmaW5pdGlvbi5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9oc2wvY29udmVydEhzbFRvUmdiLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL2hzbC9jb252ZXJ0UmdiVG9Ic2wuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvdXRpbC9odWUuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvaHNsL3BhcnNlSHNsTGVnYWN5LmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL2hzbC9wYXJzZUhzbC5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9oc2wvZGVmaW5pdGlvbi5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9oc3YvY29udmVydEhzdlRvUmdiLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL2hzdi9jb252ZXJ0UmdiVG9Ic3YuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvaHN2L2RlZmluaXRpb24uanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvaHdiL2NvbnZlcnRId2JUb1JnYi5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9od2IvY29udmVydFJnYlRvSHdiLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL2h3Yi9wYXJzZUh3Yi5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9od2IvZGVmaW5pdGlvbi5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9oZHIvY29uc3RhbnRzLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL2hkci90cmFuc2Zlci5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9pdHAvY29udmVydEl0cFRvWHl6NjUuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvaXRwL2NvbnZlcnRYeXo2NVRvSXRwLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL2l0cC9kZWZpbml0aW9uLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL2phYi9jb252ZXJ0WHl6NjVUb0phYi5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9qYWIvY29udmVydEphYlRvWHl6NjUuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvamFiL2NvbnZlcnRSZ2JUb0phYi5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9qYWIvY29udmVydEphYlRvUmdiLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL2phYi9kZWZpbml0aW9uLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL2pjaC9jb252ZXJ0SmFiVG9KY2guanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvamNoL2NvbnZlcnRKY2hUb0phYi5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9qY2gvZGVmaW5pdGlvbi5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy94eXo1MC9jb25zdGFudHMuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvbGFiL2NvbnZlcnRMYWJUb1h5ejUwLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL3h5ejUwL2NvbnZlcnRYeXo1MFRvUmdiLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL2xhYi9jb252ZXJ0TGFiVG9SZ2IuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMveHl6NTAvY29udmVydFJnYlRvWHl6NTAuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvbGFiL2NvbnZlcnRYeXo1MFRvTGFiLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL2xhYi9jb252ZXJ0UmdiVG9MYWIuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvbGFiL3BhcnNlTGFiLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL2xhYi9kZWZpbml0aW9uLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL2xhYjY1L2RlZmluaXRpb24uanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvbGNoL3BhcnNlTGNoLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL2xjaC9kZWZpbml0aW9uLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL2xjaDY1L2RlZmluaXRpb24uanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvbGNodXYvY29udmVydEx1dlRvTGNodXYuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvbGNodXYvY29udmVydExjaHV2VG9MdXYuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvbHV2L2NvbnZlcnRYeXo1MFRvTHV2LmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL2x1di9jb252ZXJ0THV2VG9YeXo1MC5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9sY2h1di9kZWZpbml0aW9uLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL2xyZ2IvZGVmaW5pdGlvbi5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9sdXYvZGVmaW5pdGlvbi5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9va2xhYi9jb252ZXJ0THJnYlRvT2tsYWIuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvb2tsYWIvY29udmVydFJnYlRvT2tsYWIuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvb2tsYWIvY29udmVydE9rbGFiVG9McmdiLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL29rbGFiL2NvbnZlcnRPa2xhYlRvUmdiLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL29raHNsL2hlbHBlcnMuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvb2toc2wvY29udmVydE9rbGFiVG9Pa2hzbC5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9va2hzbC9jb252ZXJ0T2toc2xUb09rbGFiLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL29raHNsL21vZGVPa2hzbC5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9va2hzdi9jb252ZXJ0T2tsYWJUb09raHN2LmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL29raHN2L2NvbnZlcnRPa2hzdlRvT2tsYWIuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvb2toc3YvbW9kZU9raHN2LmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL29rbGFiL3BhcnNlT2tsYWIuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvb2tsYWIvZGVmaW5pdGlvbi5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9va2xjaC9wYXJzZU9rbGNoLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL29rbGNoL2RlZmluaXRpb24uanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvcDMvY29udmVydFAzVG9YeXo2NS5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9wMy9jb252ZXJ0WHl6NjVUb1AzLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL3AzL2RlZmluaXRpb24uanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvcHJvcGhvdG8vY29udmVydFh5ejUwVG9Qcm9waG90by5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9wcm9waG90by9jb252ZXJ0UHJvcGhvdG9Ub1h5ejUwLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL3Byb3Bob3RvL2RlZmluaXRpb24uanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvcmVjMjAyMC9jb252ZXJ0WHl6NjVUb1JlYzIwMjAuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvcmVjMjAyMC9jb252ZXJ0UmVjMjAyMFRvWHl6NjUuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvcmVjMjAyMC9kZWZpbml0aW9uLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL3h5Yi9jb25zdGFudHMuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMveHliL2NvbnZlcnRSZ2JUb1h5Yi5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy94eWIvY29udmVydFh5YlRvUmdiLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL3h5Yi9kZWZpbml0aW9uLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL3h5ejUwL2RlZmluaXRpb24uanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMveHl6NjUvY29udmVydFh5ejY1VG9YeXo1MC5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy94eXo2NS9jb252ZXJ0WHl6NTBUb1h5ejY1LmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL3h5ejY1L2RlZmluaXRpb24uanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMveWlxL2NvbnZlcnRSZ2JUb1lpcS5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy95aXEvY29udmVydFlpcVRvUmdiLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL3lpcS9kZWZpbml0aW9uLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL2luZGV4LmpzIiwgIi4uLy4uL3NyYy9kYXNoYm9hcmQvY2FudmFzL2NvbG9yLnRzIiwgIi4uLy4uL3NyYy9kYXNoYm9hcmQvY2FudmFzL2VsZW1lbnRzL0F0bW9zcGhlcmUudHMiLCAiLi4vLi4vc3JjL2Rhc2hib2FyZC9jYW52YXMvZWxlbWVudHMvQXVkaWVuY2VEaXJlY3Rpb24udHMiLCAiLi4vLi4vc3JjL2Rhc2hib2FyZC9jYW52YXMvZWxlbWVudHMvUGFudGhlb24udHMiLCAiLi4vLi4vc3JjL2Rhc2hib2FyZC9jYW52YXMvZWxlbWVudHMvU3RhZ2UudHMiLCAiLi4vLi4vc3JjL2Rhc2hib2FyZC9jYW52YXMvZWxlbWVudHMvU3Vic3RyYXRlLnRzIiwgIi4uLy4uL3NyYy9kYXNoYm9hcmQvY2FudmFzL3JlbmRlcmVyLnRzIiwgIi4uLy4uL3NyYy9kYXNoYm9hcmQvY2FudmFzL0ZvcnVtQ2FudmFzLnRzeCIsICIuLi8uLi9zcmMvZGFzaGJvYXJkL0ZvcnVtLnRzeCIsICIuLi8uLi9zcmMvZGFzaGJvYXJkL2luZGV4LnRzeCJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLyoqXG4gKiBTREsgc2hpbSBcdTIwMTQgc2luZ2xlIHNvdXJjZSBvZiB0cnV0aCBmb3IgUmVhY3QsIGhvb2tzLCBhbmQgSGVybWVzIFVJXG4gKiBjb21wb25lbnRzIGluc2lkZSB0aGlzIHBsdWdpbi5cbiAqXG4gKiBIZXJtZXMgaW5qZWN0cyBgd2luZG93Ll9fSEVSTUVTX1BMVUdJTl9TREtfX2AgQkVGT1JFIHRoZSBwbHVnaW5cbiAqIGJ1bmRsZSBydW5zLiBXZSByZS1leHBvcnQgdGhlIHJ1bnRpbWUgYmluZGluZ3MgZnJvbSB0aGVyZSBzbyBubyBmaWxlXG4gKiBpbiB0aGUgcGx1Z2luIGltcG9ydHMgYHJlYWN0YCBkaXJlY3RseSBcdTIwMTQgdGhhdCB3b3VsZCB0cmlnZ2VyIGVzYnVpbGQnc1xuICogSUlGRSByZXF1aXJlKCkgc2hpbSwgd2hpY2ggZmFpbHMgaW4gYnJvd3NlciAoXCJEeW5hbWljIHJlcXVpcmUgb2ZcbiAqICdyZWFjdCcgaXMgbm90IHN1cHBvcnRlZFwiKS5cbiAqXG4gKiBUeXBlLW9ubHkgaW1wb3J0cyBmcm9tICdyZWFjdCcgYXJlIGZpbmUgXHUyMDE0IHRoZXkncmUgZXJhc2VkIGJ5IHRzYy5cbiAqL1xuXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuY29uc3QgU0RLID0gKHdpbmRvdyBhcyBhbnkpLl9fSEVSTUVTX1BMVUdJTl9TREtfXztcblxuaWYgKCFTREspIHtcbiAgLy8gU3VyZmFjZSBhIGNsZWFyIGNvbnNvbGUgZXJyb3IgYmVmb3JlIHRoZSByZXN0IG9mIHRoZSBidW5kbGUgY3Jhc2hlcy5cbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcbiAgY29uc29sZS5lcnJvcihcbiAgICAnZm9ydW06IHdpbmRvdy5fX0hFUk1FU19QTFVHSU5fU0RLX18gbm90IGZvdW5kIGF0IGltcG9ydCB0aW1lLiAnICtcbiAgICAnVGhlIHBsdWdpbiBjYW5ub3QgcnVuIG91dHNpZGUgSGVybWVzXFwncyBkYXNoYm9hcmQgc2hlbGwuJyxcbiAgKTtcbn1cblxuLy8gUmVhY3QgaXRzZWxmICsgdGhlIEpTWCBmYWN0b3J5IGVudHJ5IHBvaW50cyB0aGUgZXNidWlsZCBqc3hGYWN0b3J5XG4vLyBvcHRpb24gcmVzb2x2ZXMgYXQgcnVudGltZSAoYFJlYWN0LmNyZWF0ZUVsZW1lbnRgIC8gYFJlYWN0LkZyYWdtZW50YCkuXG5leHBvcnQgY29uc3QgUmVhY3QgPSBTREs/LlJlYWN0O1xuXG4vLyBIb29rcyBcdTIwMTQgZGVzdHJ1Y3R1cmVkIGZvciBlcmdvbm9taWMgaW1wb3J0c1xuZXhwb3J0IGNvbnN0IHVzZVN0YXRlID0gU0RLPy5ob29rcz8udXNlU3RhdGU7XG5leHBvcnQgY29uc3QgdXNlRWZmZWN0ID0gU0RLPy5ob29rcz8udXNlRWZmZWN0O1xuZXhwb3J0IGNvbnN0IHVzZVJlZiA9IFNESz8uaG9va3M/LnVzZVJlZjtcbmV4cG9ydCBjb25zdCB1c2VDYWxsYmFjayA9IFNESz8uaG9va3M/LnVzZUNhbGxiYWNrO1xuZXhwb3J0IGNvbnN0IHVzZU1lbW8gPSBTREs/Lmhvb2tzPy51c2VNZW1vO1xuXG4vLyBIZXJtZXMgc2hhcmVkIFVJIGNvbXBvbmVudHMgKHNoYWRjbi1zdHlsZSlcbmV4cG9ydCBjb25zdCBjb21wb25lbnRzID0gU0RLPy5jb21wb25lbnRzID8/IHt9O1xuZXhwb3J0IGNvbnN0IENhcmQgPSBjb21wb25lbnRzLkNhcmQ7XG5leHBvcnQgY29uc3QgQ2FyZEhlYWRlciA9IGNvbXBvbmVudHMuQ2FyZEhlYWRlcjtcbmV4cG9ydCBjb25zdCBDYXJkVGl0bGUgPSBjb21wb25lbnRzLkNhcmRUaXRsZTtcbmV4cG9ydCBjb25zdCBDYXJkQ29udGVudCA9IGNvbXBvbmVudHMuQ2FyZENvbnRlbnQ7XG5leHBvcnQgY29uc3QgQmFkZ2UgPSBjb21wb25lbnRzLkJhZGdlO1xuZXhwb3J0IGNvbnN0IEJ1dHRvbiA9IGNvbXBvbmVudHMuQnV0dG9uO1xuXG4vLyBVdGlsaXR5IFx1MjAxNCBzYW1lLW9yaWdpbiBmZXRjaCB3aXRoIGF1dG8tYXR0YWNoZWQgc2Vzc2lvbiB0b2tlblxuZXhwb3J0IGNvbnN0IGZldGNoSlNPTjogPFQgPSB1bmtub3duPih1cmw6IHN0cmluZywgaW5pdD86IFJlcXVlc3RJbml0KSA9PiBQcm9taXNlPFQ+ID1cbiAgU0RLPy5mZXRjaEpTT047XG5cbi8vIFJlZ2lzdHJhdGlvbiBlbnRyeSBwb2ludCAod2luZG93Ll9fSEVSTUVTX1BMVUdJTlNfXy5yZWdpc3Rlcilcbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG5leHBvcnQgY29uc3QgSEVSTUVTX1BMVUdJTlMgPSAod2luZG93IGFzIGFueSkuX19IRVJNRVNfUExVR0lOU19fO1xuIiwgIi8qKlxuICogdXNlRm9ydW1TdGF0ZSBcdTIwMTQgc3Vic2NyaWJlcyB0byBBdGhlbmEncyBXZWJTb2NrZXQgYW5kIGV4cG9zZXMgdGhlXG4gKiBsYXRlc3QgY29nbml0aXZlIHN0YXRlIHBsdXMgY29ubmVjdGlvbiBzdGF0dXMuXG4gKlxuICogUGhhc2UgMTogY29ubmVjdHMgZGlyZWN0bHkgdG8gd3M6Ly9sb2NhbGhvc3Q6ODc2NS93cyBhbmQgc3RvcmVzIHRoZVxuICogcmF3IHBheWxvYWQuIFBoYXNlIDMgd2lsbCBwaXBlIHBheWxvYWRzIHRocm91Z2ggYSB0cmFuc2Zvcm0gaW50byB0aGVcbiAqIEZvcnVtLXNoYXBlIEpTT04gY29uc3VtZWQgYnkgdGhlIGNhbnZhcyByZW5kZXJlci5cbiAqXG4gKiBBdGhlbmEgYnJvYWRjYXN0czpcbiAqICAgLSB7dHlwZTogXCJpbml0aWFsX3N0YXRlXCIsIC4uLmZ1bGwgc3RhdGV9IG9uIGNvbm5lY3RcbiAqICAgLSB7dHlwZTogXCJoZWFydGJlYXRcIiwgLi4uZnVsbCBzdGF0ZX0gZXZlcnkgfjUgc2Vjb25kc1xuICogICAtIHt0eXBlOiBcImNvZ25pdGl2ZV91cGRhdGVcIiwgLi4ufSBvbiBjaGF0LXRyaWdnZXJlZCB0aWNrc1xuICpcbiAqIFJlbmRlci1yYXRlICg2MGZwcykgaXMgZGVjb3VwbGVkIGZyb20gZGF0YS1yYXRlICg1cyk7IHN1YnNlcXVlbnRcbiAqIHBoYXNlcyB3aWxsIGludHJvZHVjZSBjbGllbnQtc2lkZSBpbnRlcnBvbGF0aW9uIGJldHdlZW4gc25hcHNob3RzLlxuICovXG5cbmltcG9ydCB7IHVzZVN0YXRlLCB1c2VFZmZlY3QsIHVzZVJlZiB9IGZyb20gJy4uL3Nkayc7XG5pbXBvcnQgdHlwZSB7IEF0aGVuYVN0YXRlLCBDb25uZWN0aW9uU3RhdHVzLCBXU01lc3NhZ2UgfSBmcm9tICcuL3R5cGVzJztcblxuY29uc3QgQVRIRU5BX1dTX1VSTCA9ICd3czovL2xvY2FsaG9zdDo4NzY1L3dzJztcbmNvbnN0IFJFQ09OTkVDVF9ERUxBWV9NUyA9IDIwMDA7XG5cbmV4cG9ydCBmdW5jdGlvbiB1c2VGb3J1bVN0YXRlKCk6IHtcbiAgc3RhdGU6IEF0aGVuYVN0YXRlIHwgbnVsbDtcbiAgc3RhdHVzOiBDb25uZWN0aW9uU3RhdHVzO1xuICBsYXN0VXBkYXRlQXQ6IG51bWJlciB8IG51bGw7XG59IHtcbiAgY29uc3QgW3N0YXRlLCBzZXRTdGF0ZV0gPSB1c2VTdGF0ZTxBdGhlbmFTdGF0ZSB8IG51bGw+KG51bGwpO1xuICBjb25zdCBbc3RhdHVzLCBzZXRTdGF0dXNdID0gdXNlU3RhdGU8Q29ubmVjdGlvblN0YXR1cz4oJ2lkbGUnKTtcbiAgY29uc3QgW2xhc3RVcGRhdGVBdCwgc2V0TGFzdFVwZGF0ZUF0XSA9IHVzZVN0YXRlPG51bWJlciB8IG51bGw+KG51bGwpO1xuICBjb25zdCB3c1JlZiA9IHVzZVJlZjxXZWJTb2NrZXQgfCBudWxsPihudWxsKTtcbiAgY29uc3QgcmVjb25uZWN0VGltZXJSZWYgPSB1c2VSZWY8bnVtYmVyIHwgbnVsbD4obnVsbCk7XG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBsZXQgbW91bnRlZCA9IHRydWU7XG5cbiAgICBmdW5jdGlvbiBjb25uZWN0KCkge1xuICAgICAgaWYgKCFtb3VudGVkKSByZXR1cm47XG4gICAgICBzZXRTdGF0dXMoJ2Nvbm5lY3RpbmcnKTtcbiAgICAgIGNvbnN0IHdzID0gbmV3IFdlYlNvY2tldChBVEhFTkFfV1NfVVJMKTtcbiAgICAgIHdzUmVmLmN1cnJlbnQgPSB3cztcblxuICAgICAgd3Mub25vcGVuID0gKCkgPT4ge1xuICAgICAgICBpZiAoIW1vdW50ZWQpIHJldHVybjtcbiAgICAgICAgc2V0U3RhdHVzKCdvcGVuJyk7XG4gICAgICB9O1xuXG4gICAgICB3cy5vbm1lc3NhZ2UgPSAoZXY6IE1lc3NhZ2VFdmVudCkgPT4ge1xuICAgICAgICBpZiAoIW1vdW50ZWQpIHJldHVybjtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCBtc2cgPSBKU09OLnBhcnNlKGV2LmRhdGEpIGFzIFdTTWVzc2FnZTtcbiAgICAgICAgICBpZiAobXNnLnR5cGUgPT09ICdpbml0aWFsX3N0YXRlJyB8fCBtc2cudHlwZSA9PT0gJ2hlYXJ0YmVhdCcpIHtcbiAgICAgICAgICAgIHNldFN0YXRlKG1zZyBhcyB1bmtub3duIGFzIEF0aGVuYVN0YXRlKTtcbiAgICAgICAgICAgIHNldExhc3RVcGRhdGVBdChEYXRlLm5vdygpKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gY29nbml0aXZlX3VwZGF0ZSBicm9hZGNhc3RzIGEgcGFydGlhbDsgaWdub3JlIGZvciBQaGFzZSAxXG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG4gICAgICAgICAgY29uc29sZS53YXJuKCdmb3J1bTogZmFpbGVkIHRvIHBhcnNlIFdTIG1lc3NhZ2UnLCBlcnIpO1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICB3cy5vbmVycm9yID0gKCkgPT4ge1xuICAgICAgICBpZiAoIW1vdW50ZWQpIHJldHVybjtcbiAgICAgICAgc2V0U3RhdHVzKCdlcnJvcicpO1xuICAgICAgfTtcblxuICAgICAgd3Mub25jbG9zZSA9ICgpID0+IHtcbiAgICAgICAgaWYgKCFtb3VudGVkKSByZXR1cm47XG4gICAgICAgIHNldFN0YXR1cygnY2xvc2VkJyk7XG4gICAgICAgIGlmIChyZWNvbm5lY3RUaW1lclJlZi5jdXJyZW50ICE9PSBudWxsKSB7XG4gICAgICAgICAgY2xlYXJUaW1lb3V0KHJlY29ubmVjdFRpbWVyUmVmLmN1cnJlbnQpO1xuICAgICAgICB9XG4gICAgICAgIHJlY29ubmVjdFRpbWVyUmVmLmN1cnJlbnQgPSB3aW5kb3cuc2V0VGltZW91dChjb25uZWN0LCBSRUNPTk5FQ1RfREVMQVlfTVMpO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICBjb25uZWN0KCk7XG5cbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgbW91bnRlZCA9IGZhbHNlO1xuICAgICAgaWYgKHJlY29ubmVjdFRpbWVyUmVmLmN1cnJlbnQgIT09IG51bGwpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHJlY29ubmVjdFRpbWVyUmVmLmN1cnJlbnQpO1xuICAgICAgICByZWNvbm5lY3RUaW1lclJlZi5jdXJyZW50ID0gbnVsbDtcbiAgICAgIH1cbiAgICAgIGlmICh3c1JlZi5jdXJyZW50KSB7XG4gICAgICAgIHdzUmVmLmN1cnJlbnQuY2xvc2UoKTtcbiAgICAgICAgd3NSZWYuY3VycmVudCA9IG51bGw7XG4gICAgICB9XG4gICAgfTtcbiAgfSwgW10pO1xuXG4gIHJldHVybiB7IHN0YXRlLCBzdGF0dXMsIGxhc3RVcGRhdGVBdCB9O1xufVxuIiwgIi8qKlxuICogRGVzaWduIHRva2VucyBcdTIwMTQgdGhlIHNpbmdsZSBzb3VyY2Ugb2YgdHJ1dGggZm9yIGNvbG9yLCBtb3Rpb24sIGxheW91dCxcbiAqIGFuZCB0aW1pbmcgdmFsdWVzIGFjcm9zcyB0aGUgRm9ydW0gcmVuZGVyZXIuXG4gKlxuICogQWxsIGNvbG9ycyBhcmUgc3BlY2lmaWVkIGluIE9LTENIIGZvciBwZXJjZXB0dWFsIHVuaWZvcm1pdHkuIERyaXZlc1xuICogc3RheSBhdCBzaW1pbGFyIEwgKDcyLTc1JSkgYW5kIEMgKDAuMDktMC4xMikgc28gdGhlIGZvdXIgaHVlcyByZWFkXG4gKiBhcyBhIGZhbWlseSB0aGF0IGRpZmZlcnMgb25seSBpbiB0ZW1wZXJhdHVyZSwgbmV2ZXIgaW4gbHVtaW5vc2l0eS5cbiAqXG4gKiBTb3VyY2VkIGZyb20gdGhlIGNvbmNlcHQgZG9jIGF0XG4gKiB+Ly5jbGF1ZGUvcGxhbnMvYXRoZW5hLXNlbnQtbWUtdGhpcy1qb2xseS1taW5za3kubWRcbiAqL1xuXG4vLyBcdTI1MDBcdTI1MDAgT0tMQ0ggY29sb3IgdG9rZW5zIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5leHBvcnQgdHlwZSBPa2xjaENvbG9yID0geyBsOiBudW1iZXI7IGM6IG51bWJlcjsgaDogbnVtYmVyIH07XG5cbmV4cG9ydCBjb25zdCBDT0xPUiA9IHtcbiAgLy8gRm91bmRhdGlvblxuICBiYWNrZ3JvdW5kOiB7IGw6IDAuMDgsIGM6IDAuMDI1LCBoOiAyNjAgfSwgICAgICAgICAgLy8gZGVlcCBkYXJrIGluZGlnb1xuICBmb3JtQmFzZTogeyBsOiAwLjk0LCBjOiAwLjAxNSwgaDogOTAgfSwgICAgICAgICAgICAgLy8gcGFsZSBsdW1pbm91cyBvZmYtd2hpdGVcbiAgdHlwb2dyYXBoeTogeyBsOiAwLjg1LCBjOiAwLjAxNSwgaDogOTAgfSwgICAgICAgICAgIC8vIHNsaWdodGx5IGRpbW1lciB3YXJtIG9mZi13aGl0ZVxuXG4gIC8vIEZvdXIgZHJpdmUgcGFsZXR0ZVxuICBkcml2ZToge1xuICAgIGN1cmlvc2l0eTogeyBsOiAwLjcyLCBjOiAwLjExLCBoOiAyNDAgfSwgICAgICAgICAgLy8gY29vbCB1bHRyYW1hcmluZVxuICAgIHByb2plY3RIZWFsdGg6IHsgbDogMC43NSwgYzogMC4xMiwgaDogNzAgfSwgICAgICAgLy8gd2FybSBhbWJlclxuICAgIGNvbm5lY3Rpb246IHsgbDogMC43NCwgYzogMC4wOSwgaDogMTU1IH0sICAgICAgICAgLy8gc29mdCBzYWdlXG4gICAgYW50aWNpcGF0aW9uOiB7IGw6IDAuNzEsIGM6IDAuMTEsIGg6IDMyMCB9LCAgICAgICAvLyBnZW50bGUgdmlvbGV0XG4gIH0sXG5cbiAgLy8gQXRtb3NwaGVyZSB3ZWF0aGVyIG1vZGUgdGludHMgKHN1YnRsZSB3YXNoZXMgb3ZlciBiYWNrZ3JvdW5kKVxuICBhdG1vc3BoZXJlOiB7XG4gICAgY2xlYXI6IHsgbDogMC4yMCwgYzogMC4wMjAsIGg6IDI2MCB9LFxuICAgIGNsb3VkZWQ6IHsgbDogMC4yNSwgYzogMC4wMzAsIGg6IDI1MCB9LFxuICAgIHN0b3JteTogeyBsOiAwLjIyLCBjOiAwLjA0MCwgaDogMjgwIH0sXG4gICAgdHdpbGlnaHQ6IHsgbDogMC4zMCwgYzogMC4wMzUsIGg6IDMwIH0sXG4gIH0sXG5cbiAgLy8gQXVkaWVuY2UgZGlyZWN0aW9uIChUT00gd2FybXRoIGdyYWRpZW50IFx1MjAxNCA1IHN0YXRlcylcbiAgYXVkaWVuY2U6IHtcbiAgICBhdmFpbGFibGU6IHsgbDogMC43NSwgYzogMC4wOCwgaDogNjAgfSwgICAgICAgICAgIC8vIHdhcm0gc3RlYWR5IGdsb3dcbiAgICBpbnRlcnJ1cHRpYmxlOiB7IGw6IDAuNjAsIGM6IDAuMDUsIGg6IDYwIH0sICAgICAgIC8vIGRpbW1lciB3YXJtXG4gICAgZm9jdXNlZDogeyBsOiAwLjQ1LCBjOiAwLjA0LCBoOiAyMjAgfSwgICAgICAgICAgICAvLyBkaW0gYmx1ZSAoXCJpbiBmbG93IGVsc2V3aGVyZVwiKVxuICAgIHVuYXZhaWxhYmxlOiB7IGw6IDAuMjAsIGM6IDAuMDIsIGg6IDI2MCB9LCAgICAgICAgLy8gdmVyeSBkaW1cbiAgICBxdWlldDogeyBsOiAwLjEyLCBjOiAwLjAyLCBoOiAyNjAgfSwgICAgICAgICAgICAgIC8vIG5lYXItYWJzZW50XG4gIH0sXG5cbiAgLy8gTkVFRFNfUkVWSUVXIG9yYnMgXHUyMDE0IHBhbGUgbmV1dHJhbCB3YXJtdGhcbiAgbmVlZHNSZXZpZXdPcmI6IHsgbDogMC43OCwgYzogMC4wNCwgaDogODAgfSxcbn0gYXMgY29uc3Q7XG5cbi8vIFx1MjUwMFx1MjUwMCBEcml2ZSBpZGVudGl0eSAodXNlZCBhcyBrZXlzIGFjcm9zcyB0aGUgcmVuZGVyZXIpIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuXG5leHBvcnQgdHlwZSBEcml2ZUlkID0gJ2N1cmlvc2l0eScgfCAncHJvamVjdEhlYWx0aCcgfCAnY29ubmVjdGlvbicgfCAnYW50aWNpcGF0aW9uJztcblxuZXhwb3J0IGNvbnN0IERSSVZFX0lEUzogcmVhZG9ubHkgRHJpdmVJZFtdID0gW1xuICAnY3VyaW9zaXR5JyxcbiAgJ3Byb2plY3RIZWFsdGgnLFxuICAnY29ubmVjdGlvbicsXG4gICdhbnRpY2lwYXRpb24nLFxuXSBhcyBjb25zdDtcblxuLy8gXHUyNTAwXHUyNTAwIENhcmRpbmFsIHBvc2l0aW9ucyBmb3IgdGhlIHBhbnRoZW9uIChjbG9ja3dpc2UgZnJvbSB0b3AtbGVmdCkgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG4vL1xuLy8gSW4gb3VyIHRocmVlLXF1YXJ0ZXIgcGVyc3BlY3RpdmU6XG4vLyAgIEN1cmlvc2l0eSBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDAgQW50aWNpcGF0aW9uXG4vLyAgICAgICAgICAgICAgICAgIFx1MjU3MiAgICAgXHUyNTcxXG4vLyAgICAgICAgICAgICAgICAgICBTVEFHRVxuLy8gICAgICAgICAgICAgICAgICBcdTI1NzEgICAgIFx1MjU3MlxuLy8gICBDb25uZWN0aW9uIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMCBQcm9qZWN0IEhlYWx0aFxuLy9cbi8vIFBvc2l0aW9uIGlzIG5vcm1hbGl6ZWQgdG8gWzAuLjFdIGNvb3JkcyBpbnNpZGUgdGhlIHBhbnRoZW9uJ3MgYm91bmRpbmdcbi8vIGJveCAod2hpY2ggaXRzZWxmIHNpdHMgaW4gdGhlIHVwcGVyIHBhcnQgb2YgdGhlIGNhbnZhcyBhYm92ZSB0aGUgc3RhZ2UpLlxuXG5leHBvcnQgY29uc3QgUEFOVEhFT05fUE9TSVRJT05TOiBSZWNvcmQ8RHJpdmVJZCwgeyBueDogbnVtYmVyOyBueTogbnVtYmVyIH0+ID0ge1xuICBjdXJpb3NpdHk6ICAgICB7IG54OiAwLjE4LCBueTogMC40NSB9LCAgIC8vIHVwcGVyLWxlZnRcbiAgYW50aWNpcGF0aW9uOiAgeyBueDogMC44Miwgbnk6IDAuNDUgfSwgICAvLyB1cHBlci1yaWdodFxuICBjb25uZWN0aW9uOiAgICB7IG54OiAwLjE4LCBueTogMC44NSB9LCAgIC8vIGxvd2VyLWxlZnRcbiAgcHJvamVjdEhlYWx0aDogeyBueDogMC44Miwgbnk6IDAuODUgfSwgICAvLyBsb3dlci1yaWdodFxufTtcblxuLy8gXHUyNTAwXHUyNTAwIExheW91dCByYXRpb3MgKHJlbGF0aXZlIHRvIGNhbnZhcyBzaXplKSBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbi8vXG4vLyBUaHJlZS1xdWFydGVyIHBlcnNwZWN0aXZlOiBpbWFnaW5lIGxvb2tpbmcgZG93biBhdCBhIHRhYmxlIGZyb20gYWJvdmVcbi8vIGFuZCBzbGlnaHRseSBmb3J3YXJkLiBBdG1vc3BoZXJlIGlzIHRoZSBkaXN0YW50IGJhY2tncm91bmQsIHN1YnN0cmF0ZVxuLy8gaXMgdGhlIGZsb29yIGluIHRoZSBmb3JlZ3JvdW5kLlxuXG4vLyBMYXlvdXQgdXNlcyBzZXBhcmF0ZSBYL1kgc2NhbGluZyBzbyB0aGUgY29tcG9zaXRpb24gZmlsbHMgdGhlIGNhbnZhc1xuLy8gYXQgYW55IGFzcGVjdCByYXRpby4gV2lkdGgtc2NhbGVkIHZhbHVlcyBnaXZlIGhvcml6b250YWwgcHJlc2VuY2U7XG4vLyBoZWlnaHQtc2NhbGVkIHZhbHVlcyBnaXZlIHRoZSBmb3Jlc2hvcnRlbmVkIHZlcnRpY2FsIGNoYXJhY3Rlci5cbi8vIFByZXZpb3VzIHZlcnNpb24gdXNlZCBtaW4odywgaCkgZm9yIGV2ZXJ5dGhpbmcgd2hpY2ggbWFkZSB0aGVcbi8vIGNvbXBvc2l0aW9uIGZlZWwgc21hbGwgb24gd2lkZSBhc3BlY3QgcmF0aW9zLlxuXG5leHBvcnQgY29uc3QgTEFZT1VUID0ge1xuICAvLyBTdGFnZSBvY2N1cGllcyB0aGUgY2VudHJhbCByZWdpb24uIFNsaWdodGx5IGJlbG93IGNlbnRlciB0byBsZWF2ZVxuICAvLyByb29tIGZvciB0aGUgYXRtb3NwaGVyZSBiYW5kIGFib3ZlICsgdGhlIGF1ZGllbmNlIHdhcm10aCBiZWxvdy5cbiAgc3RhZ2U6IHtcbiAgICBjZW50ZXJZUmF0aW86IDAuNTQsICAgICAgICAgICAgLy8gNTQlIGRvd24gXHUyMDE0IGNsb3NlIHRvIGNlbnRlciBidXQgYmlhc2VkIGRvd25cbiAgICByYWRpdXNYUmF0aW86IDAuMTAsICAgICAgICAgICAgLy8gMTAlIG9mIGNhbnZhcyBXSURUSCBmb3Igc3BvdGxpZ2h0IGV4dGVudFxuICAgIHJhZGl1c1lSYXRpbzogMC4xMCwgICAgICAgICAgICAvLyAxMCUgb2YgY2FudmFzIEhFSUdIVCAoZWxsaXBzZSBmb3Jlc2hvcnRlbmluZ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgIGVtZXJnZXMgbmF0dXJhbGx5IGZyb20gbm9uLXNxdWFyZSBjYW52YXMpXG4gIH0sXG5cbiAgLy8gUGFudGhlb24gcmluZyBzaXRzIE9VVFNJREUgdGhlIHN0YWdlLiBXaWR0aC1zY2FsZWQgWCByYWRpdXMgZ2l2ZXNcbiAgLy8gaG9yaXpvbnRhbCBzcHJlYWQ7IGhlaWdodC1zY2FsZWQgWSByYWRpdXMga2VlcHMgdGhlIGZvcmVzaG9ydGVuZWRcbiAgLy8gcGVyc3BlY3RpdmUgb2YgbG9va2luZyBkb3duIGF0IGEgZmxhdHRlbmVkIHJpbmcuXG4gIHBhbnRoZW9uOiB7XG4gICAgY2VudGVyWVJhdGlvOiAwLjU0LFxuICAgIHJpbmdSYWRpdXNYUmF0aW86IDAuMjgsICAgICAgICAvLyAyOCUgb2YgY2FudmFzIFdJRFRIXG4gICAgcmluZ1JhZGl1c1lSYXRpbzogMC4zMiwgICAgICAgIC8vIDMyJSBvZiBjYW52YXMgSEVJR0hUICh0YWxsZXIgdGhhbiB3aWRlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgcGVyIHVuaXQsIGJ1dCB3aWR0aCBpcyB0eXBpY2FsbHkgbGFyZ2VyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgc28gdGhlIHJpbmcgYXBwZWFycyB3aWRlciB0aGFuIHRhbGwpXG4gICAgZ2x5cGhSYWRpdXNSYXRpbzogMC4wMjUsICAgICAgIC8vIHNtYWxsZXIgcGVyLWdseXBoIGJhc2VsaW5lOyBibG9vbSBleHRlbmRzIH4zeFxuICB9LFxuXG4gIC8vIEF0bW9zcGhlcmUgZmlsbHMgdGhlIHRvcCBwb3J0aW9uIG9mIHRoZSBjYW52YXNcbiAgYXRtb3NwaGVyZToge1xuICAgIHRvcFlSYXRpbzogMC4wLFxuICAgIGJvdHRvbVlSYXRpbzogMC4zMixcbiAgfSxcblxuICAvLyBTdWJzdHJhdGUgZmlsbHMgdGhlIGJvdHRvbSBwb3J0aW9uXG4gIHN1YnN0cmF0ZToge1xuICAgIHRvcFlSYXRpbzogMC42OCxcbiAgICBib3R0b21ZUmF0aW86IDEuMCxcbiAgfSxcblxuICAvLyBBdWRpZW5jZSB3YXJtdGggXHUyMDE0IGJvdHRvbS1lZGdlIGdsb3cgcmVwcmVzZW50aW5nIFRPTSBwcmVzZW5jZVxuICBhdWRpZW5jZToge1xuICAgIGNlbnRlcllSYXRpbzogMC45NixcbiAgICBnbG93UmFkaXVzWFJhdGlvOiAwLjQ1LCAgICAgICAgLy8gd2lkZSB3YXJtdGggYWNyb3NzIHRoZSBib3R0b20tZnJvbnRcbiAgICBnbG93UmFkaXVzWVJhdGlvOiAwLjMwLCAgICAgICAgLy8gbGVzcyB0YWxsIChmb3Jlc2hvcnRlbmVkKVxuICB9LFxufSBhcyBjb25zdDtcblxuLy8gXHUyNTAwXHUyNTAwIE1vdGlvbiAoUGhhc2UgMiBpcyBzdGF0aWM7IHRoZXNlIGFyZSByZXNlcnZlZCBmb3IgUGhhc2UgNCkgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmV4cG9ydCBjb25zdCBNT1RJT04gPSB7XG4gIGJyZWF0aDogJ2N1YmljLWJlemllcigwLjQwLCAwLjAwLCAwLjYwLCAxLjAwKScsXG4gIGJyZWF0aFBlcmlvZFNlYzogOC4wLFxuICBzdGFuZGFyZDogJ2N1YmljLWJlemllcigwLjQwLCAwLjAwLCAwLjIwLCAxLjAwKScsXG4gIHN0YW5kYXJkRHVyYXRpb25TZWM6IDEuMixcbiAgZWxlZ2FudDogJ2N1YmljLWJlemllcigwLjI1LCAwLjEwLCAwLjI1LCAxLjAwKScsXG4gIGVsZWdhbnREdXJhdGlvblNlYzogMi41LFxufSBhcyBjb25zdDtcbiIsICIvKipcbiAqIEdlb21ldHJ5IFx1MjAxNCB0aHJlZS1xdWFydGVyIHBlcnNwZWN0aXZlIGxheW91dCBtYXRoLlxuICpcbiAqIFRoZSBGb3J1bSBpcyByZW5kZXJlZCBhcyBpZiB2aWV3ZWQgZnJvbSBhYm92ZS1hbmQtc2xpZ2h0bHktZm9yd2FyZDpcbiAqICAgLSBBdG1vc3BoZXJlIGlzIHRoZSBkaXN0YW50IGJhY2tncm91bmQgKHRvcCBvZiBjYW52YXMpXG4gKiAgIC0gUGFudGhlb24gZ2x5cGhzIHNpdCBhdCBjYXJkaW5hbCBwb3NpdGlvbnMgYXJvdW5kIHRoZSBzdGFnZSBvbiBhXG4gKiAgICAgZmxhdHRlbmVkIHJpbmcgKFktYXhpcyBmb3Jlc2hvcnRlbmVkIHRvIHN1Z2dlc3Qgdmlld2luZyBhbmdsZSlcbiAqICAgLSBTdGFnZSBpcyB0aGUgY2VudHJhbCBwbGF0Zm9ybSAoYW4gZWxsaXBzZSwgbm90IGEgY2lyY2xlKVxuICogICAtIFN1YnN0cmF0ZSBpcyB0aGUgZmxvb3IgaW4gdGhlIGZvcmVncm91bmQgKGJvdHRvbSBvZiBjYW52YXMpXG4gKiAgIC0gQXVkaWVuY2UgZGlyZWN0aW9uIGlzIHRoZSBmcm9udCBlZGdlIChib3R0b20pXG4gKlxuICogQWxsIHBvc2l0aW9ucyBhcmUgY29tcHV0ZWQgZnJvbSBhIHNpbmdsZSBDYW52YXNTaXplIHNvIHRoZVxuICogY29tcG9zaXRpb24gcmVmbG93cyBjbGVhbmx5IG9uIHJlc2l6ZS5cbiAqL1xuXG5pbXBvcnQgeyBMQVlPVVQsIFBBTlRIRU9OX1BPU0lUSU9OUywgdHlwZSBEcml2ZUlkIH0gZnJvbSAnLi4vZGVzaWduL3Rva2Vucyc7XG5cbmV4cG9ydCB0eXBlIENhbnZhc1NpemUgPSB7IHdpZHRoOiBudW1iZXI7IGhlaWdodDogbnVtYmVyOyBkcHI6IG51bWJlciB9O1xuXG5leHBvcnQgdHlwZSBQb2ludCA9IHsgeDogbnVtYmVyOyB5OiBudW1iZXIgfTtcbmV4cG9ydCB0eXBlIEVsbGlwc2UgPSBQb2ludCAmIHsgcng6IG51bWJlcjsgcnk6IG51bWJlciB9O1xuXG4vKipcbiAqIEFwcGx5IGRldmljZSBwaXhlbCByYXRpbyB0byBhIGxvZ2ljYWwgc2l6ZSBzbyB0aGUgY2FudmFzIGJhY2tpbmcgc3RvcmVcbiAqIG1hdGNoZXMgdGhlIHBoeXNpY2FsIGRpc3BsYXkuIFJldHVybnMgdGhlIG11bHRpcGxpZXIgdXNlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbmZpZ3VyZUNhbnZhc0ZvckRwcihcbiAgY2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudCxcbiAgY3R4OiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQsXG4gIHNpemU6IENhbnZhc1NpemUsXG4pOiB2b2lkIHtcbiAgY2FudmFzLndpZHRoID0gTWF0aC5mbG9vcihzaXplLndpZHRoICogc2l6ZS5kcHIpO1xuICBjYW52YXMuaGVpZ2h0ID0gTWF0aC5mbG9vcihzaXplLmhlaWdodCAqIHNpemUuZHByKTtcbiAgY2FudmFzLnN0eWxlLndpZHRoID0gYCR7c2l6ZS53aWR0aH1weGA7XG4gIGNhbnZhcy5zdHlsZS5oZWlnaHQgPSBgJHtzaXplLmhlaWdodH1weGA7XG4gIGN0eC5zZXRUcmFuc2Zvcm0oMSwgMCwgMCwgMSwgMCwgMCk7IC8vIHJlc2V0IGJlZm9yZSBhcHBseWluZyBEUFJcbiAgY3R4LnNjYWxlKHNpemUuZHByLCBzaXplLmRwcik7XG59XG5cbi8qKlxuICogU3RhZ2UgZ2VvbWV0cnkgXHUyMDE0IGNlbnRyYWwgZWxsaXB0aWNhbCBwbGF0Zm9ybS4gWCBhbmQgWSByYWRpaSBhcmVcbiAqIHNjYWxlZCBpbmRlcGVuZGVudGx5IHNvIHRoZSBwZXJzcGVjdGl2ZSBmb3Jlc2hvcnRlbmluZyBlbWVyZ2VzIGZyb21cbiAqIHRoZSBjYW52YXMncyBuYXR1cmFsIGFzcGVjdCByYXRpbyAod2lkZXIgY2FudmFzIFx1MjE5MiB3aWRlciBzdGFnZSkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdGFnZUVsbGlwc2Uoc2l6ZTogQ2FudmFzU2l6ZSk6IEVsbGlwc2Uge1xuICByZXR1cm4ge1xuICAgIHg6IHNpemUud2lkdGggLyAyLFxuICAgIHk6IHNpemUuaGVpZ2h0ICogTEFZT1VULnN0YWdlLmNlbnRlcllSYXRpbyxcbiAgICByeDogc2l6ZS53aWR0aCAqIExBWU9VVC5zdGFnZS5yYWRpdXNYUmF0aW8sXG4gICAgcnk6IHNpemUuaGVpZ2h0ICogTEFZT1VULnN0YWdlLnJhZGl1c1lSYXRpbyxcbiAgfTtcbn1cblxuLyoqXG4gKiBQYW50aGVvbiBnbHlwaCBwb3NpdGlvbnMgXHUyMDE0IGZvdXIgY2FyZGluYWwgcG9pbnRzIG9uIGEgZmxhdHRlbmVkIHJpbmdcbiAqIGFyb3VuZCAoYnV0IG91dHNpZGUpIHRoZSBzdGFnZS4gWCBzY2FsZWQgdG8gd2lkdGgsIFkgc2NhbGVkIHRvXG4gKiBoZWlnaHQgc28gdGhlIGNvbXBvc2l0aW9uIGFkYXB0cyB0byBhbnkgYXNwZWN0IHJhdGlvIHdpdGhvdXRcbiAqIHNocmlua2luZyB0byBhIHNtYWxsIGNsdXN0ZXIuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYW50aGVvblBvc2l0aW9ucyhzaXplOiBDYW52YXNTaXplKTogUmVjb3JkPERyaXZlSWQsIFBvaW50PiB7XG4gIGNvbnN0IHJpbmdDeCA9IHNpemUud2lkdGggLyAyO1xuICBjb25zdCByaW5nQ3kgPSBzaXplLmhlaWdodCAqIExBWU9VVC5wYW50aGVvbi5jZW50ZXJZUmF0aW87XG4gIGNvbnN0IHJ4ID0gc2l6ZS53aWR0aCAqIExBWU9VVC5wYW50aGVvbi5yaW5nUmFkaXVzWFJhdGlvO1xuICBjb25zdCByeSA9IHNpemUuaGVpZ2h0ICogTEFZT1VULnBhbnRoZW9uLnJpbmdSYWRpdXNZUmF0aW87XG5cbiAgY29uc3Qgb3V0OiBSZWNvcmQ8c3RyaW5nLCBQb2ludD4gPSB7fTtcbiAgZm9yIChjb25zdCBkcml2ZUlkIG9mIE9iamVjdC5rZXlzKFBBTlRIRU9OX1BPU0lUSU9OUykgYXMgRHJpdmVJZFtdKSB7XG4gICAgY29uc3QgeyBueCwgbnkgfSA9IFBBTlRIRU9OX1BPU0lUSU9OU1tkcml2ZUlkXTtcbiAgICAvLyBNYXAgbm9ybWFsaXplZCBbMC4uMV0gY29vcmRzIHRvIHRoZSByaW5nJ3MgYm91bmRpbmcgYm94LlxuICAgIC8vIChueCwgbnkpIGF0ICgwLjUsIDAuNSkgc2l0cyBhdCB0aGUgcmluZyBjZW50ZXI7ICgwLCAwKSBpcyB1cHBlci1sZWZ0LlxuICAgIG91dFtkcml2ZUlkXSA9IHtcbiAgICAgIHg6IHJpbmdDeCArIChueCAtIDAuNSkgKiByeCAqIDIsXG4gICAgICB5OiByaW5nQ3kgKyAobnkgLSAwLjUpICogcnkgKiAyLFxuICAgIH07XG4gIH1cbiAgcmV0dXJuIG91dCBhcyBSZWNvcmQ8RHJpdmVJZCwgUG9pbnQ+O1xufVxuXG4vKipcbiAqIFRoZSBnbHlwaCdzIGJvdW5kaW5nIHJhZGl1cyBpbiBwaXhlbHMuIFVzZXMgdGhlIHNtYWxsZXIgb2Ygd2lkdGggb3JcbiAqIGhlaWdodCBzbyBnbHlwaHMgZG9uJ3Qgc2NhbGUgdW5ib3VuZGVkbHkgb24gZXh0cmVtZSBhc3BlY3QgcmF0aW9zLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcGFudGhlb25HbHlwaFJhZGl1cyhzaXplOiBDYW52YXNTaXplKTogbnVtYmVyIHtcbiAgcmV0dXJuIE1hdGgubWluKHNpemUud2lkdGgsIHNpemUuaGVpZ2h0KSAqIExBWU9VVC5wYW50aGVvbi5nbHlwaFJhZGl1c1JhdGlvO1xufVxuXG4vKipcbiAqIEF0bW9zcGhlcmUgYmFuZCBcdTIwMTQgdmVydGljYWwgc3RyaXAgYWNyb3NzIHRoZSB0b3Agb2YgdGhlIGNhbnZhcy4gVXNlZFxuICogYXMgdGhlIGNsaXAgcmVnaW9uIGZvciBhdG1vc3BoZXJpYyB3ZWF0aGVyIHRpbnRzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXRtb3NwaGVyZUJhbmQoc2l6ZTogQ2FudmFzU2l6ZSk6IHsgeDogbnVtYmVyOyB5OiBudW1iZXI7IHc6IG51bWJlcjsgaDogbnVtYmVyIH0ge1xuICByZXR1cm4ge1xuICAgIHg6IDAsXG4gICAgeTogc2l6ZS5oZWlnaHQgKiBMQVlPVVQuYXRtb3NwaGVyZS50b3BZUmF0aW8sXG4gICAgdzogc2l6ZS53aWR0aCxcbiAgICBoOiBzaXplLmhlaWdodCAqIChMQVlPVVQuYXRtb3NwaGVyZS5ib3R0b21ZUmF0aW8gLSBMQVlPVVQuYXRtb3NwaGVyZS50b3BZUmF0aW8pLFxuICB9O1xufVxuXG4vKipcbiAqIFN1YnN0cmF0ZSBiYW5kIFx1MjAxNCB2ZXJ0aWNhbCBzdHJpcCBhY3Jvc3MgdGhlIGJvdHRvbSBvZiB0aGUgY2FudmFzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc3Vic3RyYXRlQmFuZChzaXplOiBDYW52YXNTaXplKTogeyB4OiBudW1iZXI7IHk6IG51bWJlcjsgdzogbnVtYmVyOyBoOiBudW1iZXIgfSB7XG4gIHJldHVybiB7XG4gICAgeDogMCxcbiAgICB5OiBzaXplLmhlaWdodCAqIExBWU9VVC5zdWJzdHJhdGUudG9wWVJhdGlvLFxuICAgIHc6IHNpemUud2lkdGgsXG4gICAgaDogc2l6ZS5oZWlnaHQgKiAoTEFZT1VULnN1YnN0cmF0ZS5ib3R0b21ZUmF0aW8gLSBMQVlPVVQuc3Vic3RyYXRlLnRvcFlSYXRpbyksXG4gIH07XG59XG5cbi8qKlxuICogQXVkaWVuY2UgZGlyZWN0aW9uIFx1MjAxNCBib3R0b20tZnJvbnQgd2FybXRoIHJlcHJlc2VudGluZyBUT00gcHJlc2VuY2UuXG4gKiBSZXR1cm5zIGFuIGVsbGlwdGljYWwgZ2xvdyByZWdpb24gKHdpZGVyIHRoYW4gdGFsbCkgYW5jaG9yZWQgYXQgdGhlXG4gKiBib3R0b20tY2VudGVyIG9mIHRoZSBjYW52YXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhdWRpZW5jZUZvY3VzKHNpemU6IENhbnZhc1NpemUpOiB7XG4gIGNlbnRlcjogUG9pbnQ7XG4gIHJhZGl1c1g6IG51bWJlcjtcbiAgcmFkaXVzWTogbnVtYmVyO1xufSB7XG4gIHJldHVybiB7XG4gICAgY2VudGVyOiB7IHg6IHNpemUud2lkdGggLyAyLCB5OiBzaXplLmhlaWdodCAqIExBWU9VVC5hdWRpZW5jZS5jZW50ZXJZUmF0aW8gfSxcbiAgICByYWRpdXNYOiBzaXplLndpZHRoICogTEFZT1VULmF1ZGllbmNlLmdsb3dSYWRpdXNYUmF0aW8sXG4gICAgcmFkaXVzWTogc2l6ZS5oZWlnaHQgKiBMQVlPVVQuYXVkaWVuY2UuZ2xvd1JhZGl1c1lSYXRpbyxcbiAgfTtcbn1cbiIsICJjb25zdCBwYXJzZU51bWJlciA9IChjb2xvciwgbGVuKSA9PiB7XG5cdGlmICh0eXBlb2YgY29sb3IgIT09ICdudW1iZXInKSByZXR1cm47XG5cblx0Ly8gaGV4MzogI2M5MyAtPiAjY2M5OTMzXG5cdGlmIChsZW4gPT09IDMpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0bW9kZTogJ3JnYicsXG5cdFx0XHRyOiAoKChjb2xvciA+PiA4KSAmIDB4ZikgfCAoKGNvbG9yID4+IDQpICYgMHhmMCkpIC8gMjU1LFxuXHRcdFx0ZzogKCgoY29sb3IgPj4gNCkgJiAweGYpIHwgKGNvbG9yICYgMHhmMCkpIC8gMjU1LFxuXHRcdFx0YjogKChjb2xvciAmIDB4ZikgfCAoKGNvbG9yIDw8IDQpICYgMHhmMCkpIC8gMjU1XG5cdFx0fTtcblx0fVxuXG5cdC8vIGhleDQ6ICNjOTMxIC0+ICNjYzk5MzMxMVxuXHRpZiAobGVuID09PSA0KSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdG1vZGU6ICdyZ2InLFxuXHRcdFx0cjogKCgoY29sb3IgPj4gMTIpICYgMHhmKSB8ICgoY29sb3IgPj4gOCkgJiAweGYwKSkgLyAyNTUsXG5cdFx0XHRnOiAoKChjb2xvciA+PiA4KSAmIDB4ZikgfCAoKGNvbG9yID4+IDQpICYgMHhmMCkpIC8gMjU1LFxuXHRcdFx0YjogKCgoY29sb3IgPj4gNCkgJiAweGYpIHwgKGNvbG9yICYgMHhmMCkpIC8gMjU1LFxuXHRcdFx0YWxwaGE6ICgoY29sb3IgJiAweGYpIHwgKChjb2xvciA8PCA0KSAmIDB4ZjApKSAvIDI1NVxuXHRcdH07XG5cdH1cblxuXHQvLyBoZXg2OiAjZjBmMWYyXG5cdGlmIChsZW4gPT09IDYpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0bW9kZTogJ3JnYicsXG5cdFx0XHRyOiAoKGNvbG9yID4+IDE2KSAmIDB4ZmYpIC8gMjU1LFxuXHRcdFx0ZzogKChjb2xvciA+PiA4KSAmIDB4ZmYpIC8gMjU1LFxuXHRcdFx0YjogKGNvbG9yICYgMHhmZikgLyAyNTVcblx0XHR9O1xuXHR9XG5cblx0Ly8gaGV4ODogI2YwZjFmMmZmXG5cdGlmIChsZW4gPT09IDgpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0bW9kZTogJ3JnYicsXG5cdFx0XHRyOiAoKGNvbG9yID4+IDI0KSAmIDB4ZmYpIC8gMjU1LFxuXHRcdFx0ZzogKChjb2xvciA+PiAxNikgJiAweGZmKSAvIDI1NSxcblx0XHRcdGI6ICgoY29sb3IgPj4gOCkgJiAweGZmKSAvIDI1NSxcblx0XHRcdGFscGhhOiAoY29sb3IgJiAweGZmKSAvIDI1NVxuXHRcdH07XG5cdH1cbn07XG5cbmV4cG9ydCBkZWZhdWx0IHBhcnNlTnVtYmVyO1xuIiwgImNvbnN0IG5hbWVkID0ge1xuXHRhbGljZWJsdWU6IDB4ZjBmOGZmLFxuXHRhbnRpcXVld2hpdGU6IDB4ZmFlYmQ3LFxuXHRhcXVhOiAweDAwZmZmZixcblx0YXF1YW1hcmluZTogMHg3ZmZmZDQsXG5cdGF6dXJlOiAweGYwZmZmZixcblx0YmVpZ2U6IDB4ZjVmNWRjLFxuXHRiaXNxdWU6IDB4ZmZlNGM0LFxuXHRibGFjazogMHgwMDAwMDAsXG5cdGJsYW5jaGVkYWxtb25kOiAweGZmZWJjZCxcblx0Ymx1ZTogMHgwMDAwZmYsXG5cdGJsdWV2aW9sZXQ6IDB4OGEyYmUyLFxuXHRicm93bjogMHhhNTJhMmEsXG5cdGJ1cmx5d29vZDogMHhkZWI4ODcsXG5cdGNhZGV0Ymx1ZTogMHg1ZjllYTAsXG5cdGNoYXJ0cmV1c2U6IDB4N2ZmZjAwLFxuXHRjaG9jb2xhdGU6IDB4ZDI2OTFlLFxuXHRjb3JhbDogMHhmZjdmNTAsXG5cdGNvcm5mbG93ZXJibHVlOiAweDY0OTVlZCxcblx0Y29ybnNpbGs6IDB4ZmZmOGRjLFxuXHRjcmltc29uOiAweGRjMTQzYyxcblx0Y3lhbjogMHgwMGZmZmYsXG5cdGRhcmtibHVlOiAweDAwMDA4Yixcblx0ZGFya2N5YW46IDB4MDA4YjhiLFxuXHRkYXJrZ29sZGVucm9kOiAweGI4ODYwYixcblx0ZGFya2dyYXk6IDB4YTlhOWE5LFxuXHRkYXJrZ3JlZW46IDB4MDA2NDAwLFxuXHRkYXJrZ3JleTogMHhhOWE5YTksXG5cdGRhcmtraGFraTogMHhiZGI3NmIsXG5cdGRhcmttYWdlbnRhOiAweDhiMDA4Yixcblx0ZGFya29saXZlZ3JlZW46IDB4NTU2YjJmLFxuXHRkYXJrb3JhbmdlOiAweGZmOGMwMCxcblx0ZGFya29yY2hpZDogMHg5OTMyY2MsXG5cdGRhcmtyZWQ6IDB4OGIwMDAwLFxuXHRkYXJrc2FsbW9uOiAweGU5OTY3YSxcblx0ZGFya3NlYWdyZWVuOiAweDhmYmM4Zixcblx0ZGFya3NsYXRlYmx1ZTogMHg0ODNkOGIsXG5cdGRhcmtzbGF0ZWdyYXk6IDB4MmY0ZjRmLFxuXHRkYXJrc2xhdGVncmV5OiAweDJmNGY0Zixcblx0ZGFya3R1cnF1b2lzZTogMHgwMGNlZDEsXG5cdGRhcmt2aW9sZXQ6IDB4OTQwMGQzLFxuXHRkZWVwcGluazogMHhmZjE0OTMsXG5cdGRlZXBza3libHVlOiAweDAwYmZmZixcblx0ZGltZ3JheTogMHg2OTY5NjksXG5cdGRpbWdyZXk6IDB4Njk2OTY5LFxuXHRkb2RnZXJibHVlOiAweDFlOTBmZixcblx0ZmlyZWJyaWNrOiAweGIyMjIyMixcblx0ZmxvcmFsd2hpdGU6IDB4ZmZmYWYwLFxuXHRmb3Jlc3RncmVlbjogMHgyMjhiMjIsXG5cdGZ1Y2hzaWE6IDB4ZmYwMGZmLFxuXHRnYWluc2Jvcm86IDB4ZGNkY2RjLFxuXHRnaG9zdHdoaXRlOiAweGY4ZjhmZixcblx0Z29sZDogMHhmZmQ3MDAsXG5cdGdvbGRlbnJvZDogMHhkYWE1MjAsXG5cdGdyYXk6IDB4ODA4MDgwLFxuXHRncmVlbjogMHgwMDgwMDAsXG5cdGdyZWVueWVsbG93OiAweGFkZmYyZixcblx0Z3JleTogMHg4MDgwODAsXG5cdGhvbmV5ZGV3OiAweGYwZmZmMCxcblx0aG90cGluazogMHhmZjY5YjQsXG5cdGluZGlhbnJlZDogMHhjZDVjNWMsXG5cdGluZGlnbzogMHg0YjAwODIsXG5cdGl2b3J5OiAweGZmZmZmMCxcblx0a2hha2k6IDB4ZjBlNjhjLFxuXHRsYXZlbmRlcjogMHhlNmU2ZmEsXG5cdGxhdmVuZGVyYmx1c2g6IDB4ZmZmMGY1LFxuXHRsYXduZ3JlZW46IDB4N2NmYzAwLFxuXHRsZW1vbmNoaWZmb246IDB4ZmZmYWNkLFxuXHRsaWdodGJsdWU6IDB4YWRkOGU2LFxuXHRsaWdodGNvcmFsOiAweGYwODA4MCxcblx0bGlnaHRjeWFuOiAweGUwZmZmZixcblx0bGlnaHRnb2xkZW5yb2R5ZWxsb3c6IDB4ZmFmYWQyLFxuXHRsaWdodGdyYXk6IDB4ZDNkM2QzLFxuXHRsaWdodGdyZWVuOiAweDkwZWU5MCxcblx0bGlnaHRncmV5OiAweGQzZDNkMyxcblx0bGlnaHRwaW5rOiAweGZmYjZjMSxcblx0bGlnaHRzYWxtb246IDB4ZmZhMDdhLFxuXHRsaWdodHNlYWdyZWVuOiAweDIwYjJhYSxcblx0bGlnaHRza3libHVlOiAweDg3Y2VmYSxcblx0bGlnaHRzbGF0ZWdyYXk6IDB4Nzc4ODk5LFxuXHRsaWdodHNsYXRlZ3JleTogMHg3Nzg4OTksXG5cdGxpZ2h0c3RlZWxibHVlOiAweGIwYzRkZSxcblx0bGlnaHR5ZWxsb3c6IDB4ZmZmZmUwLFxuXHRsaW1lOiAweDAwZmYwMCxcblx0bGltZWdyZWVuOiAweDMyY2QzMixcblx0bGluZW46IDB4ZmFmMGU2LFxuXHRtYWdlbnRhOiAweGZmMDBmZixcblx0bWFyb29uOiAweDgwMDAwMCxcblx0bWVkaXVtYXF1YW1hcmluZTogMHg2NmNkYWEsXG5cdG1lZGl1bWJsdWU6IDB4MDAwMGNkLFxuXHRtZWRpdW1vcmNoaWQ6IDB4YmE1NWQzLFxuXHRtZWRpdW1wdXJwbGU6IDB4OTM3MGRiLFxuXHRtZWRpdW1zZWFncmVlbjogMHgzY2IzNzEsXG5cdG1lZGl1bXNsYXRlYmx1ZTogMHg3YjY4ZWUsXG5cdG1lZGl1bXNwcmluZ2dyZWVuOiAweDAwZmE5YSxcblx0bWVkaXVtdHVycXVvaXNlOiAweDQ4ZDFjYyxcblx0bWVkaXVtdmlvbGV0cmVkOiAweGM3MTU4NSxcblx0bWlkbmlnaHRibHVlOiAweDE5MTk3MCxcblx0bWludGNyZWFtOiAweGY1ZmZmYSxcblx0bWlzdHlyb3NlOiAweGZmZTRlMSxcblx0bW9jY2FzaW46IDB4ZmZlNGI1LFxuXHRuYXZham93aGl0ZTogMHhmZmRlYWQsXG5cdG5hdnk6IDB4MDAwMDgwLFxuXHRvbGRsYWNlOiAweGZkZjVlNixcblx0b2xpdmU6IDB4ODA4MDAwLFxuXHRvbGl2ZWRyYWI6IDB4NmI4ZTIzLFxuXHRvcmFuZ2U6IDB4ZmZhNTAwLFxuXHRvcmFuZ2VyZWQ6IDB4ZmY0NTAwLFxuXHRvcmNoaWQ6IDB4ZGE3MGQ2LFxuXHRwYWxlZ29sZGVucm9kOiAweGVlZThhYSxcblx0cGFsZWdyZWVuOiAweDk4ZmI5OCxcblx0cGFsZXR1cnF1b2lzZTogMHhhZmVlZWUsXG5cdHBhbGV2aW9sZXRyZWQ6IDB4ZGI3MDkzLFxuXHRwYXBheWF3aGlwOiAweGZmZWZkNSxcblx0cGVhY2hwdWZmOiAweGZmZGFiOSxcblx0cGVydTogMHhjZDg1M2YsXG5cdHBpbms6IDB4ZmZjMGNiLFxuXHRwbHVtOiAweGRkYTBkZCxcblx0cG93ZGVyYmx1ZTogMHhiMGUwZTYsXG5cdHB1cnBsZTogMHg4MDAwODAsXG5cblx0Ly8gQWRkZWQgaW4gQ1NTIENvbG9ycyBMZXZlbCA0OlxuXHQvLyBodHRwczovL2RyYWZ0cy5jc3N3Zy5vcmcvY3NzLWNvbG9yLyNjaGFuZ2VzLWZyb20tM1xuXHRyZWJlY2NhcHVycGxlOiAweDY2MzM5OSxcblxuXHRyZWQ6IDB4ZmYwMDAwLFxuXHRyb3N5YnJvd246IDB4YmM4ZjhmLFxuXHRyb3lhbGJsdWU6IDB4NDE2OWUxLFxuXHRzYWRkbGVicm93bjogMHg4YjQ1MTMsXG5cdHNhbG1vbjogMHhmYTgwNzIsXG5cdHNhbmR5YnJvd246IDB4ZjRhNDYwLFxuXHRzZWFncmVlbjogMHgyZThiNTcsXG5cdHNlYXNoZWxsOiAweGZmZjVlZSxcblx0c2llbm5hOiAweGEwNTIyZCxcblx0c2lsdmVyOiAweGMwYzBjMCxcblx0c2t5Ymx1ZTogMHg4N2NlZWIsXG5cdHNsYXRlYmx1ZTogMHg2YTVhY2QsXG5cdHNsYXRlZ3JheTogMHg3MDgwOTAsXG5cdHNsYXRlZ3JleTogMHg3MDgwOTAsXG5cdHNub3c6IDB4ZmZmYWZhLFxuXHRzcHJpbmdncmVlbjogMHgwMGZmN2YsXG5cdHN0ZWVsYmx1ZTogMHg0NjgyYjQsXG5cdHRhbjogMHhkMmI0OGMsXG5cdHRlYWw6IDB4MDA4MDgwLFxuXHR0aGlzdGxlOiAweGQ4YmZkOCxcblx0dG9tYXRvOiAweGZmNjM0Nyxcblx0dHVycXVvaXNlOiAweDQwZTBkMCxcblx0dmlvbGV0OiAweGVlODJlZSxcblx0d2hlYXQ6IDB4ZjVkZWIzLFxuXHR3aGl0ZTogMHhmZmZmZmYsXG5cdHdoaXRlc21va2U6IDB4ZjVmNWY1LFxuXHR5ZWxsb3c6IDB4ZmZmZjAwLFxuXHR5ZWxsb3dncmVlbjogMHg5YWNkMzJcbn07XG5cbmV4cG9ydCBkZWZhdWx0IG5hbWVkO1xuIiwgImltcG9ydCBwYXJzZU51bWJlciBmcm9tICcuL3BhcnNlTnVtYmVyLmpzJztcbmltcG9ydCBuYW1lZCBmcm9tICcuLi9jb2xvcnMvbmFtZWQuanMnO1xuXG4vLyBBbHNvIHN1cHBvcnRzIHRoZSBgdHJhbnNwYXJlbnRgIGNvbG9yIGFzIGRlZmluZWQgaW46XG4vLyBodHRwczovL2RyYWZ0cy5jc3N3Zy5vcmcvY3NzLWNvbG9yLyN0cmFuc3BhcmVudC1ibGFja1xuY29uc3QgcGFyc2VOYW1lZCA9IGNvbG9yID0+IHtcblx0cmV0dXJuIHBhcnNlTnVtYmVyKG5hbWVkW2NvbG9yLnRvTG93ZXJDYXNlKCldLCA2KTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IHBhcnNlTmFtZWQ7XG4iLCAiaW1wb3J0IHBhcnNlTnVtYmVyIGZyb20gJy4vcGFyc2VOdW1iZXIuanMnO1xuXG5jb25zdCBoZXggPSAvXiM/KFswLTlhLWZdezh9fFswLTlhLWZdezZ9fFswLTlhLWZdezR9fFswLTlhLWZdezN9KSQvaTtcblxuY29uc3QgcGFyc2VIZXggPSBjb2xvciA9PiB7XG5cdGxldCBtYXRjaDtcblx0Ly8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbmQtYXNzaWduXG5cdHJldHVybiAobWF0Y2ggPSBjb2xvci5tYXRjaChoZXgpKVxuXHRcdD8gcGFyc2VOdW1iZXIocGFyc2VJbnQobWF0Y2hbMV0sIDE2KSwgbWF0Y2hbMV0ubGVuZ3RoKVxuXHRcdDogdW5kZWZpbmVkO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgcGFyc2VIZXg7XG4iLCAiLypcblx0QmFzaWMgYnVpbGRpbmcgYmxvY2tzIGZvciBjb2xvciByZWdleGVzXG5cdC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5cdFRoZXNlIHJlZ2V4ZXMgYXJlIGV4cHJlc3NlZCBhcyBzdHJpbmdzXG5cdHRvIGJlIGludGVycG9sYXRlZCBpbiB0aGUgY29sb3IgcmVnZXhlcy5cbiAqL1xuXG4vLyA8bnVtYmVyPlxuZXhwb3J0IGNvbnN0IG51bSA9ICcoWystXT9cXFxcZCpcXFxcLj9cXFxcZCsoPzpbZUVdWystXT9cXFxcZCspPyknO1xuXG4vLyA8bnVtYmVyPiBvciAnbm9uZSdcbmV4cG9ydCBjb25zdCBudW1fbm9uZSA9IGAoPzoke251bX18bm9uZSlgO1xuXG4vLyA8cGVyY2VudGFnZT5cbmV4cG9ydCBjb25zdCBwZXIgPSBgJHtudW19JWA7XG5cbi8vIDxwZXJjZW50PiBvciAnbm9uZSdcbmV4cG9ydCBjb25zdCBwZXJfbm9uZSA9IGAoPzoke251bX0lfG5vbmUpYDtcblxuLy8gPG51bWJlci1wZXJjZW50YWdlPiAoPGFscGhhLXZhbHVlPilcbmV4cG9ydCBjb25zdCBudW1fcGVyID0gYCg/OiR7bnVtfSV8JHtudW19KWA7XG5cbi8vIDxudW1iZXItcGVyY2VudGFnZT4gKDxhbHBoYS12YWx1ZT4pIG9yICdub25lJ1xuZXhwb3J0IGNvbnN0IG51bV9wZXJfbm9uZSA9IGAoPzoke251bX0lfCR7bnVtfXxub25lKWA7XG5cbi8vIDxodWU+XG5leHBvcnQgY29uc3QgaHVlID0gYCg/OiR7bnVtfShkZWd8Z3JhZHxyYWR8dHVybil8JHtudW19KWA7XG5cbi8vIDxodWU+IG9yICdub25lJ1xuZXhwb3J0IGNvbnN0IGh1ZV9ub25lID0gYCg/OiR7bnVtfShkZWd8Z3JhZHxyYWR8dHVybil8JHtudW19fG5vbmUpYDtcblxuZXhwb3J0IGNvbnN0IGMgPSBgXFxcXHMqLFxcXFxzKmA7IC8vIGNvbW1hXG5leHBvcnQgY29uc3Qgc28gPSAnXFxcXHMqJzsgLy8gc3BhY2UsIG9wdGlvbmFsXG5leHBvcnQgY29uc3QgcyA9IGBcXFxccytgOyAvLyBzcGFjZVxuXG5leHBvcnQgY29uc3QgcnhfbnVtX3Blcl9ub25lID0gbmV3IFJlZ0V4cCgnXicgKyBudW1fcGVyX25vbmUgKyAnJCcpO1xuIiwgImltcG9ydCB7IG51bSwgcGVyLCBudW1fcGVyLCBjIH0gZnJvbSAnLi4vdXRpbC9yZWdleC5qcyc7XG5cbi8qXG5cdHJnYigpIHJlZ3VsYXIgZXhwcmVzc2lvbnMgZm9yIGxlZ2FjeSBmb3JtYXRcblx0UmVmZXJlbmNlOiBodHRwczovL2RyYWZ0cy5jc3N3Zy5vcmcvY3NzLWNvbG9yLyNyZ2ItZnVuY3Rpb25zXG4gKi9cbmNvbnN0IHJnYl9udW1fb2xkID0gbmV3IFJlZ0V4cChcblx0YF5yZ2JhP1xcXFwoXFxcXHMqJHtudW19JHtjfSR7bnVtfSR7Y30ke251bX1cXFxccyooPzosXFxcXHMqJHtudW1fcGVyfVxcXFxzKik/XFxcXCkkYFxuKTtcblxuY29uc3QgcmdiX3Blcl9vbGQgPSBuZXcgUmVnRXhwKFxuXHRgXnJnYmE/XFxcXChcXFxccyoke3Blcn0ke2N9JHtwZXJ9JHtjfSR7cGVyfVxcXFxzKig/OixcXFxccyoke251bV9wZXJ9XFxcXHMqKT9cXFxcKSRgXG4pO1xuXG5jb25zdCBwYXJzZVJnYkxlZ2FjeSA9IGNvbG9yID0+IHtcblx0bGV0IHJlcyA9IHsgbW9kZTogJ3JnYicgfTtcblx0bGV0IG1hdGNoO1xuXHRpZiAoKG1hdGNoID0gY29sb3IubWF0Y2gocmdiX251bV9vbGQpKSkge1xuXHRcdGlmIChtYXRjaFsxXSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRyZXMuciA9IG1hdGNoWzFdIC8gMjU1O1xuXHRcdH1cblx0XHRpZiAobWF0Y2hbMl0gIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0cmVzLmcgPSBtYXRjaFsyXSAvIDI1NTtcblx0XHR9XG5cdFx0aWYgKG1hdGNoWzNdICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdHJlcy5iID0gbWF0Y2hbM10gLyAyNTU7XG5cdFx0fVxuXHR9IGVsc2UgaWYgKChtYXRjaCA9IGNvbG9yLm1hdGNoKHJnYl9wZXJfb2xkKSkpIHtcblx0XHRpZiAobWF0Y2hbMV0gIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0cmVzLnIgPSBtYXRjaFsxXSAvIDEwMDtcblx0XHR9XG5cdFx0aWYgKG1hdGNoWzJdICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdHJlcy5nID0gbWF0Y2hbMl0gLyAxMDA7XG5cdFx0fVxuXHRcdGlmIChtYXRjaFszXSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRyZXMuYiA9IG1hdGNoWzNdIC8gMTAwO1xuXHRcdH1cblx0fSBlbHNlIHtcblx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHR9XG5cblx0aWYgKG1hdGNoWzRdICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXMuYWxwaGEgPSBNYXRoLm1heCgwLCBNYXRoLm1pbigxLCBtYXRjaFs0XSAvIDEwMCkpO1xuXHR9IGVsc2UgaWYgKG1hdGNoWzVdICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXMuYWxwaGEgPSBNYXRoLm1heCgwLCBNYXRoLm1pbigxLCArbWF0Y2hbNV0pKTtcblx0fVxuXG5cdHJldHVybiByZXM7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBwYXJzZVJnYkxlZ2FjeTtcbiIsICJpbXBvcnQgcGFyc2UgZnJvbSAnLi9wYXJzZS5qcyc7XG5cbmNvbnN0IHByZXBhcmUgPSAoY29sb3IsIG1vZGUpID0+XG5cdGNvbG9yID09PSB1bmRlZmluZWRcblx0XHQ/IHVuZGVmaW5lZFxuXHRcdDogdHlwZW9mIGNvbG9yICE9PSAnb2JqZWN0J1xuXHRcdD8gcGFyc2UoY29sb3IpXG5cdFx0OiBjb2xvci5tb2RlICE9PSB1bmRlZmluZWRcblx0XHQ/IGNvbG9yXG5cdFx0OiBtb2RlXG5cdFx0PyB7IC4uLmNvbG9yLCBtb2RlIH1cblx0XHQ6IHVuZGVmaW5lZDtcblxuZXhwb3J0IGRlZmF1bHQgcHJlcGFyZTtcbiIsICJpbXBvcnQgeyBjb252ZXJ0ZXJzIH0gZnJvbSAnLi9tb2Rlcy5qcyc7XG5pbXBvcnQgcHJlcGFyZSBmcm9tICcuL19wcmVwYXJlLmpzJztcblxuY29uc3QgY29udmVydGVyID1cblx0KHRhcmdldF9tb2RlID0gJ3JnYicpID0+XG5cdGNvbG9yID0+XG5cdFx0KGNvbG9yID0gcHJlcGFyZShjb2xvciwgdGFyZ2V0X21vZGUpKSAhPT0gdW5kZWZpbmVkXG5cdFx0XHQ/IC8vIGlmIHRoZSBjb2xvcidzIG1vZGUgY29ycmVzcG9uZHMgdG8gb3VyIHRhcmdldCBtb2RlXG5cdFx0XHQgIGNvbG9yLm1vZGUgPT09IHRhcmdldF9tb2RlXG5cdFx0XHRcdD8gLy8gdGhlbiBqdXN0IHJldHVybiB0aGUgY29sb3Jcblx0XHRcdFx0ICBjb2xvclxuXHRcdFx0XHQ6IC8vIG90aGVyd2lzZSBjaGVjayB0byBzZWUgaWYgd2UgaGF2ZSBhIGRlZGljYXRlZFxuXHRcdFx0XHQvLyBjb252ZXJ0ZXIgZm9yIHRoZSB0YXJnZXQgbW9kZVxuXHRcdFx0XHRjb252ZXJ0ZXJzW2NvbG9yLm1vZGVdW3RhcmdldF9tb2RlXVxuXHRcdFx0XHQ/IC8vIGFuZCByZXR1cm4gaXRzIHJlc3VsdC4uLlxuXHRcdFx0XHQgIGNvbnZlcnRlcnNbY29sb3IubW9kZV1bdGFyZ2V0X21vZGVdKGNvbG9yKVxuXHRcdFx0XHQ6IC8vIC4uLm90aGVyd2lzZSBwYXNzIHRocm91Z2ggUkdCIGFzIGFuIGludGVybWVkaWFyeSBzdGVwLlxuXHRcdFx0XHQvLyBpZiB0aGUgdGFyZ2V0IG1vZGUgaXMgUkdCLi4uXG5cdFx0XHRcdHRhcmdldF9tb2RlID09PSAncmdiJ1xuXHRcdFx0XHQ/IC8vIGp1c3QgcmV0dXJuIHRoZSBSR0Jcblx0XHRcdFx0ICBjb252ZXJ0ZXJzW2NvbG9yLm1vZGVdLnJnYihjb2xvcilcblx0XHRcdFx0OiAvLyBvdGhlcndpc2UgY29udmVydCBjb2xvci5tb2RlIC0+IFJHQiAtPiB0YXJnZXRfbW9kZVxuXHRcdFx0XHQgIGNvbnZlcnRlcnMucmdiW3RhcmdldF9tb2RlXShjb252ZXJ0ZXJzW2NvbG9yLm1vZGVdLnJnYihjb2xvcikpXG5cdFx0XHQ6IHVuZGVmaW5lZDtcblxuZXhwb3J0IGRlZmF1bHQgY29udmVydGVyO1xuIiwgImltcG9ydCBjb252ZXJ0ZXIgZnJvbSAnLi9jb252ZXJ0ZXIuanMnO1xuXG5jb25zdCBjb252ZXJ0ZXJzID0ge307XG5jb25zdCBtb2RlcyA9IHt9O1xuXG5jb25zdCBwYXJzZXJzID0gW107XG5jb25zdCBjb2xvclByb2ZpbGVzID0ge307XG5cbmNvbnN0IGlkZW50aXR5ID0gdiA9PiB2O1xuXG5jb25zdCB1c2VNb2RlID0gZGVmaW5pdGlvbiA9PiB7XG5cdGNvbnZlcnRlcnNbZGVmaW5pdGlvbi5tb2RlXSA9IHtcblx0XHQuLi5jb252ZXJ0ZXJzW2RlZmluaXRpb24ubW9kZV0sXG5cdFx0Li4uZGVmaW5pdGlvbi50b01vZGVcblx0fTtcblxuXHRPYmplY3Qua2V5cyhkZWZpbml0aW9uLmZyb21Nb2RlIHx8IHt9KS5mb3JFYWNoKGsgPT4ge1xuXHRcdGlmICghY29udmVydGVyc1trXSkge1xuXHRcdFx0Y29udmVydGVyc1trXSA9IHt9O1xuXHRcdH1cblx0XHRjb252ZXJ0ZXJzW2tdW2RlZmluaXRpb24ubW9kZV0gPSBkZWZpbml0aW9uLmZyb21Nb2RlW2tdO1xuXHR9KTtcblxuXHQvLyBDb2xvciBzcGFjZSBjaGFubmVsIHJhbmdlc1xuXHRpZiAoIWRlZmluaXRpb24ucmFuZ2VzKSB7XG5cdFx0ZGVmaW5pdGlvbi5yYW5nZXMgPSB7fTtcblx0fVxuXG5cdGlmICghZGVmaW5pdGlvbi5kaWZmZXJlbmNlKSB7XG5cdFx0ZGVmaW5pdGlvbi5kaWZmZXJlbmNlID0ge307XG5cdH1cblxuXHRkZWZpbml0aW9uLmNoYW5uZWxzLmZvckVhY2goY2hhbm5lbCA9PiB7XG5cdFx0Ly8gdW5kZWZpbmVkIGNoYW5uZWwgcmFuZ2VzIGRlZmF1bHQgdG8gdGhlIFswLCAxXSBpbnRlcnZhbFxuXHRcdGlmIChkZWZpbml0aW9uLnJhbmdlc1tjaGFubmVsXSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRkZWZpbml0aW9uLnJhbmdlc1tjaGFubmVsXSA9IFswLCAxXTtcblx0XHR9XG5cblx0XHRpZiAoIWRlZmluaXRpb24uaW50ZXJwb2xhdGVbY2hhbm5lbF0pIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcihgTWlzc2luZyBpbnRlcnBvbGF0b3IgZm9yOiAke2NoYW5uZWx9YCk7XG5cdFx0fVxuXG5cdFx0aWYgKHR5cGVvZiBkZWZpbml0aW9uLmludGVycG9sYXRlW2NoYW5uZWxdID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0XHRkZWZpbml0aW9uLmludGVycG9sYXRlW2NoYW5uZWxdID0ge1xuXHRcdFx0XHR1c2U6IGRlZmluaXRpb24uaW50ZXJwb2xhdGVbY2hhbm5lbF1cblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0aWYgKCFkZWZpbml0aW9uLmludGVycG9sYXRlW2NoYW5uZWxdLmZpeHVwKSB7XG5cdFx0XHRkZWZpbml0aW9uLmludGVycG9sYXRlW2NoYW5uZWxdLmZpeHVwID0gaWRlbnRpdHk7XG5cdFx0fVxuXHR9KTtcblxuXHRtb2Rlc1tkZWZpbml0aW9uLm1vZGVdID0gZGVmaW5pdGlvbjtcblx0KGRlZmluaXRpb24ucGFyc2UgfHwgW10pLmZvckVhY2gocGFyc2VyID0+IHtcblx0XHR1c2VQYXJzZXIocGFyc2VyLCBkZWZpbml0aW9uLm1vZGUpO1xuXHR9KTtcblxuXHRyZXR1cm4gY29udmVydGVyKGRlZmluaXRpb24ubW9kZSk7XG59O1xuXG5jb25zdCBnZXRNb2RlID0gbW9kZSA9PiBtb2Rlc1ttb2RlXTtcblxuY29uc3QgdXNlUGFyc2VyID0gKHBhcnNlciwgbW9kZSkgPT4ge1xuXHRpZiAodHlwZW9mIHBhcnNlciA9PT0gJ3N0cmluZycpIHtcblx0XHRpZiAoIW1vZGUpIHtcblx0XHRcdHRocm93IG5ldyBFcnJvcihgJ21vZGUnIHJlcXVpcmVkIHdoZW4gJ3BhcnNlcicgaXMgYSBzdHJpbmdgKTtcblx0XHR9XG5cdFx0Y29sb3JQcm9maWxlc1twYXJzZXJdID0gbW9kZTtcblx0fSBlbHNlIGlmICh0eXBlb2YgcGFyc2VyID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0aWYgKHBhcnNlcnMuaW5kZXhPZihwYXJzZXIpIDwgMCkge1xuXHRcdFx0cGFyc2Vycy5wdXNoKHBhcnNlcik7XG5cdFx0fVxuXHR9XG59O1xuXG5jb25zdCByZW1vdmVQYXJzZXIgPSBwYXJzZXIgPT4ge1xuXHRpZiAodHlwZW9mIHBhcnNlciA9PT0gJ3N0cmluZycpIHtcblx0XHRkZWxldGUgY29sb3JQcm9maWxlc1twYXJzZXJdO1xuXHR9IGVsc2UgaWYgKHR5cGVvZiBwYXJzZXIgPT09ICdmdW5jdGlvbicpIHtcblx0XHRjb25zdCBpZHggPSBwYXJzZXJzLmluZGV4T2YocGFyc2VyKTtcblx0XHRpZiAoaWR4ID4gMCkge1xuXHRcdFx0cGFyc2Vycy5zcGxpY2UoaWR4LCAxKTtcblx0XHR9XG5cdH1cbn07XG5cbmV4cG9ydCB7XG5cdHVzZU1vZGUsXG5cdGdldE1vZGUsXG5cdHVzZVBhcnNlcixcblx0cmVtb3ZlUGFyc2VyLFxuXHRjb252ZXJ0ZXJzLFxuXHRwYXJzZXJzLFxuXHRjb2xvclByb2ZpbGVzXG59O1xuIiwgImltcG9ydCB7IHBhcnNlcnMsIGNvbG9yUHJvZmlsZXMsIGdldE1vZGUgfSBmcm9tICcuL21vZGVzLmpzJztcblxuLyogZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnRyb2wtcmVnZXggKi9cbmNvbnN0IElkZW50U3RhcnRDb2RlUG9pbnQgPSAvW15cXHgwMC1cXHg3Rl18W2EtekEtWl9dLztcblxuLyogZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnRyb2wtcmVnZXggKi9cbmNvbnN0IElkZW50Q29kZVBvaW50ID0gL1teXFx4MDAtXFx4N0ZdfFstXFx3XS87XG5cbmV4cG9ydCBjb25zdCBUb2sgPSB7XG5cdEZ1bmN0aW9uOiAnZnVuY3Rpb24nLFxuXHRJZGVudDogJ2lkZW50Jyxcblx0TnVtYmVyOiAnbnVtYmVyJyxcblx0UGVyY2VudGFnZTogJ3BlcmNlbnRhZ2UnLFxuXHRQYXJlbkNsb3NlOiAnKScsXG5cdE5vbmU6ICdub25lJyxcblx0SHVlOiAnaHVlJyxcblx0QWxwaGE6ICdhbHBoYSdcbn07XG5cbmxldCBfaSA9IDA7XG5cbi8qXG5cdDQuMy4xMC4gQ2hlY2sgaWYgdGhyZWUgY29kZSBwb2ludHMgd291bGQgc3RhcnQgYSBudW1iZXJcblx0aHR0cHM6Ly9kcmFmdHMuY3Nzd2cub3JnL2Nzcy1zeW50YXgvI3N0YXJ0cy13aXRoLWEtbnVtYmVyXG4gKi9cbmZ1bmN0aW9uIGlzX251bShjaGFycykge1xuXHRsZXQgY2ggPSBjaGFyc1tfaV07XG5cdGxldCBjaDEgPSBjaGFyc1tfaSArIDFdO1xuXHRpZiAoY2ggPT09ICctJyB8fCBjaCA9PT0gJysnKSB7XG5cdFx0cmV0dXJuIC9cXGQvLnRlc3QoY2gxKSB8fCAoY2gxID09PSAnLicgJiYgL1xcZC8udGVzdChjaGFyc1tfaSArIDJdKSk7XG5cdH1cblx0aWYgKGNoID09PSAnLicpIHtcblx0XHRyZXR1cm4gL1xcZC8udGVzdChjaDEpO1xuXHR9XG5cdHJldHVybiAvXFxkLy50ZXN0KGNoKTtcbn1cblxuLypcblx0Q2hlY2sgaWYgdGhlIHN0cmVhbSBzdGFydHMgd2l0aCBhbiBpZGVudGlmaWVyLlxuICovXG5cbmZ1bmN0aW9uIGlzX2lkZW50KGNoYXJzKSB7XG5cdGlmIChfaSA+PSBjaGFycy5sZW5ndGgpIHtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cblx0bGV0IGNoID0gY2hhcnNbX2ldO1xuXHRpZiAoSWRlbnRTdGFydENvZGVQb2ludC50ZXN0KGNoKSkge1xuXHRcdHJldHVybiB0cnVlO1xuXHR9XG5cdGlmIChjaCA9PT0gJy0nKSB7XG5cdFx0aWYgKGNoYXJzLmxlbmd0aCAtIF9pIDwgMikge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0XHRsZXQgY2gxID0gY2hhcnNbX2kgKyAxXTtcblx0XHRpZiAoY2gxID09PSAnLScgfHwgSWRlbnRTdGFydENvZGVQb2ludC50ZXN0KGNoMSkpIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cblx0cmV0dXJuIGZhbHNlO1xufVxuXG4vKlxuXHQ0LjMuMy4gQ29uc3VtZSBhIG51bWVyaWMgdG9rZW5cblx0aHR0cHM6Ly9kcmFmdHMuY3Nzd2cub3JnL2Nzcy1zeW50YXgvI2NvbnN1bWUtbnVtZXJpYy10b2tlblxuICovXG5cbmNvbnN0IGh1ZW5pdHMgPSB7XG5cdGRlZzogMSxcblx0cmFkOiAxODAgLyBNYXRoLlBJLFxuXHRncmFkOiA5IC8gMTAsXG5cdHR1cm46IDM2MFxufTtcblxuZnVuY3Rpb24gbnVtKGNoYXJzKSB7XG5cdGxldCB2YWx1ZSA9ICcnO1xuXHRpZiAoY2hhcnNbX2ldID09PSAnLScgfHwgY2hhcnNbX2ldID09PSAnKycpIHtcblx0XHR2YWx1ZSArPSBjaGFyc1tfaSsrXTtcblx0fVxuXHR2YWx1ZSArPSBkaWdpdHMoY2hhcnMpO1xuXHRpZiAoY2hhcnNbX2ldID09PSAnLicgJiYgL1xcZC8udGVzdChjaGFyc1tfaSArIDFdKSkge1xuXHRcdHZhbHVlICs9IGNoYXJzW19pKytdICsgZGlnaXRzKGNoYXJzKTtcblx0fVxuXHRpZiAoY2hhcnNbX2ldID09PSAnZScgfHwgY2hhcnNbX2ldID09PSAnRScpIHtcblx0XHRpZiAoXG5cdFx0XHQoY2hhcnNbX2kgKyAxXSA9PT0gJy0nIHx8IGNoYXJzW19pICsgMV0gPT09ICcrJykgJiZcblx0XHRcdC9cXGQvLnRlc3QoY2hhcnNbX2kgKyAyXSlcblx0XHQpIHtcblx0XHRcdHZhbHVlICs9IGNoYXJzW19pKytdICsgY2hhcnNbX2krK10gKyBkaWdpdHMoY2hhcnMpO1xuXHRcdH0gZWxzZSBpZiAoL1xcZC8udGVzdChjaGFyc1tfaSArIDFdKSkge1xuXHRcdFx0dmFsdWUgKz0gY2hhcnNbX2krK10gKyBkaWdpdHMoY2hhcnMpO1xuXHRcdH1cblx0fVxuXHRpZiAoaXNfaWRlbnQoY2hhcnMpKSB7XG5cdFx0bGV0IGlkID0gaWRlbnQoY2hhcnMpO1xuXHRcdGlmIChpZCA9PT0gJ2RlZycgfHwgaWQgPT09ICdyYWQnIHx8IGlkID09PSAndHVybicgfHwgaWQgPT09ICdncmFkJykge1xuXHRcdFx0cmV0dXJuIHsgdHlwZTogVG9rLkh1ZSwgdmFsdWU6IHZhbHVlICogaHVlbml0c1tpZF0gfTtcblx0XHR9XG5cdFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0fVxuXHRpZiAoY2hhcnNbX2ldID09PSAnJScpIHtcblx0XHRfaSsrO1xuXHRcdHJldHVybiB7IHR5cGU6IFRvay5QZXJjZW50YWdlLCB2YWx1ZTogK3ZhbHVlIH07XG5cdH1cblx0cmV0dXJuIHsgdHlwZTogVG9rLk51bWJlciwgdmFsdWU6ICt2YWx1ZSB9O1xufVxuXG4vKlxuXHRDb25zdW1lIGRpZ2l0cy5cbiAqL1xuZnVuY3Rpb24gZGlnaXRzKGNoYXJzKSB7XG5cdGxldCB2ID0gJyc7XG5cdHdoaWxlICgvXFxkLy50ZXN0KGNoYXJzW19pXSkpIHtcblx0XHR2ICs9IGNoYXJzW19pKytdO1xuXHR9XG5cdHJldHVybiB2O1xufVxuXG4vKlxuXHRDb25zdW1lIGFuIGlkZW50aWZpZXIuXG4gKi9cbmZ1bmN0aW9uIGlkZW50KGNoYXJzKSB7XG5cdGxldCB2ID0gJyc7XG5cdHdoaWxlIChfaSA8IGNoYXJzLmxlbmd0aCAmJiBJZGVudENvZGVQb2ludC50ZXN0KGNoYXJzW19pXSkpIHtcblx0XHR2ICs9IGNoYXJzW19pKytdO1xuXHR9XG5cdHJldHVybiB2O1xufVxuXG4vKlxuXHRDb25zdW1lIGFuIGlkZW50LWxpa2UgdG9rZW4uXG4gKi9cbmZ1bmN0aW9uIGlkZW50bGlrZShjaGFycykge1xuXHRsZXQgdiA9IGlkZW50KGNoYXJzKTtcblx0aWYgKGNoYXJzW19pXSA9PT0gJygnKSB7XG5cdFx0X2krKztcblx0XHRyZXR1cm4geyB0eXBlOiBUb2suRnVuY3Rpb24sIHZhbHVlOiB2IH07XG5cdH1cblx0aWYgKHYgPT09ICdub25lJykge1xuXHRcdHJldHVybiB7IHR5cGU6IFRvay5Ob25lLCB2YWx1ZTogdW5kZWZpbmVkIH07XG5cdH1cblx0cmV0dXJuIHsgdHlwZTogVG9rLklkZW50LCB2YWx1ZTogdiB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdG9rZW5pemUoc3RyID0gJycpIHtcblx0bGV0IGNoYXJzID0gc3RyLnRyaW0oKTtcblx0bGV0IHRva2VucyA9IFtdO1xuXHRsZXQgY2g7XG5cblx0LyogcmVzZXQgY291bnRlciAqL1xuXHRfaSA9IDA7XG5cblx0d2hpbGUgKF9pIDwgY2hhcnMubGVuZ3RoKSB7XG5cdFx0Y2ggPSBjaGFyc1tfaSsrXTtcblxuXHRcdC8qXG5cdFx0XHRDb25zdW1lIHdoaXRlc3BhY2Ugd2l0aG91dCBlbWl0dGluZyBpdFxuXHRcdCAqL1xuXHRcdGlmIChjaCA9PT0gJ1xcbicgfHwgY2ggPT09ICdcXHQnIHx8IGNoID09PSAnICcpIHtcblx0XHRcdHdoaWxlIChcblx0XHRcdFx0X2kgPCBjaGFycy5sZW5ndGggJiZcblx0XHRcdFx0KGNoYXJzW19pXSA9PT0gJ1xcbicgfHwgY2hhcnNbX2ldID09PSAnXFx0JyB8fCBjaGFyc1tfaV0gPT09ICcgJylcblx0XHRcdCkge1xuXHRcdFx0XHRfaSsrO1xuXHRcdFx0fVxuXHRcdFx0Y29udGludWU7XG5cdFx0fVxuXG5cdFx0aWYgKGNoID09PSAnLCcpIHtcblx0XHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdFx0fVxuXG5cdFx0aWYgKGNoID09PSAnKScpIHtcblx0XHRcdHRva2Vucy5wdXNoKHsgdHlwZTogVG9rLlBhcmVuQ2xvc2UgfSk7XG5cdFx0XHRjb250aW51ZTtcblx0XHR9XG5cblx0XHRpZiAoY2ggPT09ICcrJykge1xuXHRcdFx0X2ktLTtcblx0XHRcdGlmIChpc19udW0oY2hhcnMpKSB7XG5cdFx0XHRcdHRva2Vucy5wdXNoKG51bShjaGFycykpO1xuXHRcdFx0XHRjb250aW51ZTtcblx0XHRcdH1cblx0XHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdFx0fVxuXG5cdFx0aWYgKGNoID09PSAnLScpIHtcblx0XHRcdF9pLS07XG5cdFx0XHRpZiAoaXNfbnVtKGNoYXJzKSkge1xuXHRcdFx0XHR0b2tlbnMucHVzaChudW0oY2hhcnMpKTtcblx0XHRcdFx0Y29udGludWU7XG5cdFx0XHR9XG5cdFx0XHRpZiAoaXNfaWRlbnQoY2hhcnMpKSB7XG5cdFx0XHRcdHRva2Vucy5wdXNoKHsgdHlwZTogVG9rLklkZW50LCB2YWx1ZTogaWRlbnQoY2hhcnMpIH0pO1xuXHRcdFx0XHRjb250aW51ZTtcblx0XHRcdH1cblx0XHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdFx0fVxuXG5cdFx0aWYgKGNoID09PSAnLicpIHtcblx0XHRcdF9pLS07XG5cdFx0XHRpZiAoaXNfbnVtKGNoYXJzKSkge1xuXHRcdFx0XHR0b2tlbnMucHVzaChudW0oY2hhcnMpKTtcblx0XHRcdFx0Y29udGludWU7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHRcdH1cblxuXHRcdGlmIChjaCA9PT0gJy8nKSB7XG5cdFx0XHR3aGlsZSAoXG5cdFx0XHRcdF9pIDwgY2hhcnMubGVuZ3RoICYmXG5cdFx0XHRcdChjaGFyc1tfaV0gPT09ICdcXG4nIHx8IGNoYXJzW19pXSA9PT0gJ1xcdCcgfHwgY2hhcnNbX2ldID09PSAnICcpXG5cdFx0XHQpIHtcblx0XHRcdFx0X2krKztcblx0XHRcdH1cblx0XHRcdGxldCBhbHBoYTtcblx0XHRcdGlmIChpc19udW0oY2hhcnMpKSB7XG5cdFx0XHRcdGFscGhhID0gbnVtKGNoYXJzKTtcblx0XHRcdFx0aWYgKGFscGhhLnR5cGUgIT09IFRvay5IdWUpIHtcblx0XHRcdFx0XHR0b2tlbnMucHVzaCh7IHR5cGU6IFRvay5BbHBoYSwgdmFsdWU6IGFscGhhIH0pO1xuXHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRpZiAoaXNfaWRlbnQoY2hhcnMpKSB7XG5cdFx0XHRcdGlmIChpZGVudChjaGFycykgPT09ICdub25lJykge1xuXHRcdFx0XHRcdHRva2Vucy5wdXNoKHtcblx0XHRcdFx0XHRcdHR5cGU6IFRvay5BbHBoYSxcblx0XHRcdFx0XHRcdHZhbHVlOiB7IHR5cGU6IFRvay5Ob25lLCB2YWx1ZTogdW5kZWZpbmVkIH1cblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0XHR9XG5cblx0XHRpZiAoL1xcZC8udGVzdChjaCkpIHtcblx0XHRcdF9pLS07XG5cdFx0XHR0b2tlbnMucHVzaChudW0oY2hhcnMpKTtcblx0XHRcdGNvbnRpbnVlO1xuXHRcdH1cblxuXHRcdGlmIChJZGVudFN0YXJ0Q29kZVBvaW50LnRlc3QoY2gpKSB7XG5cdFx0XHRfaS0tO1xuXHRcdFx0dG9rZW5zLnB1c2goaWRlbnRsaWtlKGNoYXJzKSk7XG5cdFx0XHRjb250aW51ZTtcblx0XHR9XG5cblx0XHQvKlxuXHRcdFx0VHJlYXQgZXZlcnl0aGluZyBub3QgYWxyZWFkeSBoYW5kbGVkIGFzIGFuIGVycm9yLlxuXHRcdCAqL1xuXHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdH1cblxuXHRyZXR1cm4gdG9rZW5zO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VDb2xvclN5bnRheCh0b2tlbnMpIHtcblx0dG9rZW5zLl9pID0gMDtcblx0bGV0IHRva2VuID0gdG9rZW5zW3Rva2Vucy5faSsrXTtcblx0aWYgKCF0b2tlbiB8fCB0b2tlbi50eXBlICE9PSBUb2suRnVuY3Rpb24gfHwgdG9rZW4udmFsdWUgIT09ICdjb2xvcicpIHtcblx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHR9XG5cdHRva2VuID0gdG9rZW5zW3Rva2Vucy5faSsrXTtcblx0aWYgKHRva2VuLnR5cGUgIT09IFRvay5JZGVudCkge1xuXHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdH1cblx0Y29uc3QgbW9kZSA9IGNvbG9yUHJvZmlsZXNbdG9rZW4udmFsdWVdO1xuXHRpZiAoIW1vZGUpIHtcblx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHR9XG5cdGNvbnN0IHJlcyA9IHsgbW9kZSB9O1xuXHRjb25zdCBjb29yZHMgPSBjb25zdW1lQ29vcmRzKHRva2VucywgZmFsc2UpO1xuXHRpZiAoIWNvb3Jkcykge1xuXHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdH1cblx0Y29uc3QgY2hhbm5lbHMgPSBnZXRNb2RlKG1vZGUpLmNoYW5uZWxzO1xuXHRmb3IgKGxldCBpaSA9IDAsIGMsIGNoOyBpaSA8IGNoYW5uZWxzLmxlbmd0aDsgaWkrKykge1xuXHRcdGMgPSBjb29yZHNbaWldO1xuXHRcdGNoID0gY2hhbm5lbHNbaWldO1xuXHRcdGlmIChjLnR5cGUgIT09IFRvay5Ob25lKSB7XG5cdFx0XHRyZXNbY2hdID0gYy50eXBlID09PSBUb2suTnVtYmVyID8gYy52YWx1ZSA6IGMudmFsdWUgLyAxMDA7XG5cdFx0XHRpZiAoY2ggPT09ICdhbHBoYScpIHtcblx0XHRcdFx0cmVzW2NoXSA9IE1hdGgubWF4KDAsIE1hdGgubWluKDEsIHJlc1tjaF0pKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblx0cmV0dXJuIHJlcztcbn1cblxuZnVuY3Rpb24gY29uc3VtZUNvb3Jkcyh0b2tlbnMsIGluY2x1ZGVIdWUpIHtcblx0Y29uc3QgY29vcmRzID0gW107XG5cdGxldCB0b2tlbjtcblx0d2hpbGUgKHRva2Vucy5faSA8IHRva2Vucy5sZW5ndGgpIHtcblx0XHR0b2tlbiA9IHRva2Vuc1t0b2tlbnMuX2krK107XG5cdFx0aWYgKFxuXHRcdFx0dG9rZW4udHlwZSA9PT0gVG9rLk5vbmUgfHxcblx0XHRcdHRva2VuLnR5cGUgPT09IFRvay5OdW1iZXIgfHxcblx0XHRcdHRva2VuLnR5cGUgPT09IFRvay5BbHBoYSB8fFxuXHRcdFx0dG9rZW4udHlwZSA9PT0gVG9rLlBlcmNlbnRhZ2UgfHxcblx0XHRcdChpbmNsdWRlSHVlICYmIHRva2VuLnR5cGUgPT09IFRvay5IdWUpXG5cdFx0KSB7XG5cdFx0XHRjb29yZHMucHVzaCh0b2tlbik7XG5cdFx0XHRjb250aW51ZTtcblx0XHR9XG5cdFx0aWYgKHRva2VuLnR5cGUgPT09IFRvay5QYXJlbkNsb3NlKSB7XG5cdFx0XHRpZiAodG9rZW5zLl9pIDwgdG9rZW5zLmxlbmd0aCkge1xuXHRcdFx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHRcdFx0fVxuXHRcdFx0Y29udGludWU7XG5cdFx0fVxuXHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdH1cblxuXHRpZiAoY29vcmRzLmxlbmd0aCA8IDMgfHwgY29vcmRzLmxlbmd0aCA+IDQpIHtcblx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHR9XG5cblx0aWYgKGNvb3Jkcy5sZW5ndGggPT09IDQpIHtcblx0XHRpZiAoY29vcmRzWzNdLnR5cGUgIT09IFRvay5BbHBoYSkge1xuXHRcdFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0XHR9XG5cdFx0Y29vcmRzWzNdID0gY29vcmRzWzNdLnZhbHVlO1xuXHR9XG5cdGlmIChjb29yZHMubGVuZ3RoID09PSAzKSB7XG5cdFx0Y29vcmRzLnB1c2goeyB0eXBlOiBUb2suTm9uZSwgdmFsdWU6IHVuZGVmaW5lZCB9KTtcblx0fVxuXG5cdHJldHVybiBjb29yZHMuZXZlcnkoYyA9PiBjLnR5cGUgIT09IFRvay5BbHBoYSkgPyBjb29yZHMgOiB1bmRlZmluZWQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZU1vZGVyblN5bnRheCh0b2tlbnMsIGluY2x1ZGVIdWUpIHtcblx0dG9rZW5zLl9pID0gMDtcblx0bGV0IHRva2VuID0gdG9rZW5zW3Rva2Vucy5faSsrXTtcblx0aWYgKCF0b2tlbiB8fCB0b2tlbi50eXBlICE9PSBUb2suRnVuY3Rpb24pIHtcblx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHR9XG5cdGxldCBjb29yZHMgPSBjb25zdW1lQ29vcmRzKHRva2VucywgaW5jbHVkZUh1ZSk7XG5cdGlmICghY29vcmRzKSB7XG5cdFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0fVxuXHRjb29yZHMudW5zaGlmdCh0b2tlbi52YWx1ZSk7XG5cdHJldHVybiBjb29yZHM7XG59XG5cbmNvbnN0IHBhcnNlID0gY29sb3IgPT4ge1xuXHRpZiAodHlwZW9mIGNvbG9yICE9PSAnc3RyaW5nJykge1xuXHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdH1cblx0Y29uc3QgdG9rZW5zID0gdG9rZW5pemUoY29sb3IpO1xuXHRjb25zdCBwYXJzZWQgPSB0b2tlbnMgPyBwYXJzZU1vZGVyblN5bnRheCh0b2tlbnMsIHRydWUpIDogdW5kZWZpbmVkO1xuXHRsZXQgcmVzdWx0ID0gdW5kZWZpbmVkO1xuXHRsZXQgaSA9IDA7XG5cdGxldCBsZW4gPSBwYXJzZXJzLmxlbmd0aDtcblx0d2hpbGUgKGkgPCBsZW4pIHtcblx0XHRpZiAoKHJlc3VsdCA9IHBhcnNlcnNbaSsrXShjb2xvciwgcGFyc2VkKSkgIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0cmV0dXJuIHJlc3VsdDtcblx0XHR9XG5cdH1cblx0cmV0dXJuIHRva2VucyA/IHBhcnNlQ29sb3JTeW50YXgodG9rZW5zKSA6IHVuZGVmaW5lZDtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IHBhcnNlO1xuIiwgImltcG9ydCB7IFRvayB9IGZyb20gJy4uL3BhcnNlLmpzJztcblxuZnVuY3Rpb24gcGFyc2VSZ2IoY29sb3IsIHBhcnNlZCkge1xuXHRpZiAoIXBhcnNlZCB8fCAocGFyc2VkWzBdICE9PSAncmdiJyAmJiBwYXJzZWRbMF0gIT09ICdyZ2JhJykpIHtcblx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHR9XG5cdGNvbnN0IHJlcyA9IHsgbW9kZTogJ3JnYicgfTtcblx0Y29uc3QgWywgciwgZywgYiwgYWxwaGFdID0gcGFyc2VkO1xuXHRpZiAoci50eXBlID09PSBUb2suSHVlIHx8IGcudHlwZSA9PT0gVG9rLkh1ZSB8fCBiLnR5cGUgPT09IFRvay5IdWUpIHtcblx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHR9XG5cdGlmIChyLnR5cGUgIT09IFRvay5Ob25lKSB7XG5cdFx0cmVzLnIgPSByLnR5cGUgPT09IFRvay5OdW1iZXIgPyByLnZhbHVlIC8gMjU1IDogci52YWx1ZSAvIDEwMDtcblx0fVxuXHRpZiAoZy50eXBlICE9PSBUb2suTm9uZSkge1xuXHRcdHJlcy5nID0gZy50eXBlID09PSBUb2suTnVtYmVyID8gZy52YWx1ZSAvIDI1NSA6IGcudmFsdWUgLyAxMDA7XG5cdH1cblx0aWYgKGIudHlwZSAhPT0gVG9rLk5vbmUpIHtcblx0XHRyZXMuYiA9IGIudHlwZSA9PT0gVG9rLk51bWJlciA/IGIudmFsdWUgLyAyNTUgOiBiLnZhbHVlIC8gMTAwO1xuXHR9XG5cdGlmIChhbHBoYS50eXBlICE9PSBUb2suTm9uZSkge1xuXHRcdHJlcy5hbHBoYSA9IE1hdGgubWluKFxuXHRcdFx0MSxcblx0XHRcdE1hdGgubWF4KFxuXHRcdFx0XHQwLFxuXHRcdFx0XHRhbHBoYS50eXBlID09PSBUb2suTnVtYmVyID8gYWxwaGEudmFsdWUgOiBhbHBoYS52YWx1ZSAvIDEwMFxuXHRcdFx0KVxuXHRcdCk7XG5cdH1cblxuXHRyZXR1cm4gcmVzO1xufVxuXG5leHBvcnQgZGVmYXVsdCBwYXJzZVJnYjtcbiIsICJjb25zdCBwYXJzZVRyYW5zcGFyZW50ID0gYyA9PlxuXHRjID09PSAndHJhbnNwYXJlbnQnXG5cdFx0PyB7IG1vZGU6ICdyZ2InLCByOiAwLCBnOiAwLCBiOiAwLCBhbHBoYTogMCB9XG5cdFx0OiB1bmRlZmluZWQ7XG5cbmV4cG9ydCBkZWZhdWx0IHBhcnNlVHJhbnNwYXJlbnQ7XG4iLCAiY29uc3QgbGVycCA9IChhLCBiLCB0KSA9PiBhICsgdCAqIChiIC0gYSk7XG5jb25zdCB1bmxlcnAgPSAoYSwgYiwgdikgPT4gKHYgLSBhKSAvIChiIC0gYSk7XG5cbmNvbnN0IGJsZXJwID0gKGEwMCwgYTAxLCBhMTAsIGExMSwgdHgsIHR5KSA9PiB7XG5cdHJldHVybiBsZXJwKGxlcnAoYTAwLCBhMDEsIHR4KSwgbGVycChhMTAsIGExMSwgdHgpLCB0eSk7XG59O1xuXG5jb25zdCB0cmlsZXJwID0gKFxuXHRhMDAwLFxuXHRhMDEwLFxuXHRhMTAwLFxuXHRhMTEwLFxuXHRhMDAxLFxuXHRhMDExLFxuXHRhMTAxLFxuXHRhMTExLFxuXHR0eCxcblx0dHksXG5cdHR6XG4pID0+IHtcblx0cmV0dXJuIGxlcnAoXG5cdFx0YmxlcnAoYTAwMCwgYTAxMCwgYTEwMCwgYTExMCwgdHgsIHR5KSxcblx0XHRibGVycChhMDAxLCBhMDExLCBhMTAxLCBhMTExLCB0eCwgdHkpLFxuXHRcdHR6XG5cdCk7XG59O1xuXG5leHBvcnQgeyBsZXJwLCBibGVycCwgdHJpbGVycCwgdW5sZXJwIH07XG4iLCAiY29uc3QgZ2V0X2NsYXNzZXMgPSBhcnIgPT4ge1xuXHRsZXQgY2xhc3NlcyA9IFtdO1xuXHRmb3IgKGxldCBpID0gMDsgaSA8IGFyci5sZW5ndGggLSAxOyBpKyspIHtcblx0XHRsZXQgYSA9IGFycltpXTtcblx0XHRsZXQgYiA9IGFycltpICsgMV07XG5cdFx0aWYgKGEgPT09IHVuZGVmaW5lZCAmJiBiID09PSB1bmRlZmluZWQpIHtcblx0XHRcdGNsYXNzZXMucHVzaCh1bmRlZmluZWQpO1xuXHRcdH0gZWxzZSBpZiAoYSAhPT0gdW5kZWZpbmVkICYmIGIgIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0Y2xhc3Nlcy5wdXNoKFthLCBiXSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGNsYXNzZXMucHVzaChhICE9PSB1bmRlZmluZWQgPyBbYSwgYV0gOiBbYiwgYl0pO1xuXHRcdH1cblx0fVxuXHRyZXR1cm4gY2xhc3Nlcztcbn07XG5cbmNvbnN0IGludGVycG9sYXRvclBpZWNld2lzZSA9IGludGVycG9sYXRvciA9PiBhcnIgPT4ge1xuXHRsZXQgY2xhc3NlcyA9IGdldF9jbGFzc2VzKGFycik7XG5cdHJldHVybiB0ID0+IHtcblx0XHRsZXQgY2xzID0gdCAqIGNsYXNzZXMubGVuZ3RoO1xuXHRcdGxldCBpZHggPSB0ID49IDEgPyBjbGFzc2VzLmxlbmd0aCAtIDEgOiBNYXRoLm1heChNYXRoLmZsb29yKGNscyksIDApO1xuXHRcdGxldCBwYWlyID0gY2xhc3Nlc1tpZHhdO1xuXHRcdHJldHVybiBwYWlyID09PSB1bmRlZmluZWRcblx0XHRcdD8gdW5kZWZpbmVkXG5cdFx0XHQ6IGludGVycG9sYXRvcihwYWlyWzBdLCBwYWlyWzFdLCBjbHMgLSBpZHgpO1xuXHR9O1xufTtcblxuZXhwb3J0IHsgaW50ZXJwb2xhdG9yUGllY2V3aXNlIH07XG4iLCAiaW1wb3J0IHsgbGVycCB9IGZyb20gJy4vbGVycC5qcyc7XG5pbXBvcnQgeyBpbnRlcnBvbGF0b3JQaWVjZXdpc2UgfSBmcm9tICcuL3BpZWNld2lzZS5qcyc7XG5cbmV4cG9ydCBjb25zdCBpbnRlcnBvbGF0b3JMaW5lYXIgPSBpbnRlcnBvbGF0b3JQaWVjZXdpc2UobGVycCk7XG4iLCAiY29uc3QgZml4dXBBbHBoYSA9IGFyciA9PiB7XG5cdGxldCBzb21lX2RlZmluZWQgPSBmYWxzZTtcblx0bGV0IHJlcyA9IGFyci5tYXAodiA9PiB7XG5cdFx0aWYgKHYgIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0c29tZV9kZWZpbmVkID0gdHJ1ZTtcblx0XHRcdHJldHVybiB2O1xuXHRcdH1cblx0XHRyZXR1cm4gMTtcblx0fSk7XG5cdHJldHVybiBzb21lX2RlZmluZWQgPyByZXMgOiBhcnI7XG59O1xuXG5leHBvcnQgeyBmaXh1cEFscGhhIH07XG4iLCAiaW1wb3J0IHBhcnNlTmFtZWQgZnJvbSAnLi9wYXJzZU5hbWVkLmpzJztcbmltcG9ydCBwYXJzZUhleCBmcm9tICcuL3BhcnNlSGV4LmpzJztcbmltcG9ydCBwYXJzZVJnYkxlZ2FjeSBmcm9tICcuL3BhcnNlUmdiTGVnYWN5LmpzJztcbmltcG9ydCBwYXJzZVJnYiBmcm9tICcuL3BhcnNlUmdiLmpzJztcbmltcG9ydCBwYXJzZVRyYW5zcGFyZW50IGZyb20gJy4vcGFyc2VUcmFuc3BhcmVudC5qcyc7XG5pbXBvcnQgeyBpbnRlcnBvbGF0b3JMaW5lYXIgfSBmcm9tICcuLi9pbnRlcnBvbGF0ZS9saW5lYXIuanMnO1xuaW1wb3J0IHsgZml4dXBBbHBoYSB9IGZyb20gJy4uL2ZpeHVwL2FscGhhLmpzJztcblxuLypcblx0c1JHQiBjb2xvciBzcGFjZVxuICovXG5cbmNvbnN0IGRlZmluaXRpb24gPSB7XG5cdG1vZGU6ICdyZ2InLFxuXHRjaGFubmVsczogWydyJywgJ2cnLCAnYicsICdhbHBoYSddLFxuXHRwYXJzZTogW1xuXHRcdHBhcnNlUmdiLFxuXHRcdHBhcnNlSGV4LFxuXHRcdHBhcnNlUmdiTGVnYWN5LFxuXHRcdHBhcnNlTmFtZWQsXG5cdFx0cGFyc2VUcmFuc3BhcmVudCxcblx0XHQnc3JnYidcblx0XSxcblx0c2VyaWFsaXplOiAnc3JnYicsXG5cdGludGVycG9sYXRlOiB7XG5cdFx0cjogaW50ZXJwb2xhdG9yTGluZWFyLFxuXHRcdGc6IGludGVycG9sYXRvckxpbmVhcixcblx0XHRiOiBpbnRlcnBvbGF0b3JMaW5lYXIsXG5cdFx0YWxwaGE6IHsgdXNlOiBpbnRlcnBvbGF0b3JMaW5lYXIsIGZpeHVwOiBmaXh1cEFscGhhIH1cblx0fSxcblx0Z2FtdXQ6IHRydWUsXG5cdHdoaXRlOiB7IHI6IDEsIGc6IDEsIGI6IDEgfSxcblx0YmxhY2s6IHsgcjogMCwgZzogMCwgYjogMCB9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbml0aW9uO1xuIiwgIi8qXG5cdENvbnZlcnQgQTk4IFJHQiB2YWx1ZXMgdG8gQ0lFIFhZWiBENjVcblxuXHRSZWZlcmVuY2VzOlxuXHRcdCogaHR0cHM6Ly9kcmFmdHMuY3Nzd2cub3JnL2Nzcy1jb2xvci8jY29sb3ItY29udmVyc2lvbi1jb2RlXG5cdFx0KiBodHRwOi8vd3d3LmJydWNlbGluZGJsb29tLmNvbS9pbmRleC5odG1sP0Vxbl9SR0JfWFlaX01hdHJpeC5odG1sXG5cdFx0KiBodHRwczovL3d3dy5hZG9iZS5jb20vZGlnaXRhbGltYWcvcGRmcy9BZG9iZVJHQjE5OTgucGRmXG4qL1xuXG5jb25zdCBsaW5lYXJpemUgPSAodiA9IDApID0+IE1hdGgucG93KE1hdGguYWJzKHYpLCA1NjMgLyAyNTYpICogTWF0aC5zaWduKHYpO1xuXG5jb25zdCBjb252ZXJ0QTk4VG9YeXo2NSA9IGE5OCA9PiB7XG5cdGxldCByID0gbGluZWFyaXplKGE5OC5yKTtcblx0bGV0IGcgPSBsaW5lYXJpemUoYTk4LmcpO1xuXHRsZXQgYiA9IGxpbmVhcml6ZShhOTguYik7XG5cdGxldCByZXMgPSB7XG5cdFx0bW9kZTogJ3h5ejY1Jyxcblx0XHR4OlxuXHRcdFx0MC41NzY2NjkwNDI5MTAxMzA1ICogciArXG5cdFx0XHQwLjE4NTU1ODIzNzkwNjU0NjMgKiBnICtcblx0XHRcdDAuMTg4MjI4NjQ2MjM0OTk0NyAqIGIsXG5cdFx0eTpcblx0XHRcdDAuMjk3MzQ0OTc1MjUwNTM2ICogciArXG5cdFx0XHQwLjYyNzM2MzU2NjI1NTQ2NjEgKiBnICtcblx0XHRcdDAuMDc1MjkxNDU4NDkzOTk3OSAqIGIsXG5cdFx0ejpcblx0XHRcdDAuMDI3MDMxMzYxMzg2NDEyMyAqIHIgK1xuXHRcdFx0MC4wNzA2ODg4NTI1MzU4MjcyICogZyArXG5cdFx0XHQwLjk5MTMzNzUzNjgzNzYzODYgKiBiXG5cdH07XG5cdGlmIChhOTguYWxwaGEgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJlcy5hbHBoYSA9IGE5OC5hbHBoYTtcblx0fVxuXHRyZXR1cm4gcmVzO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgY29udmVydEE5OFRvWHl6NjU7XG4iLCAiLypcblx0Q29udmVydCBDSUUgWFlaIEQ2NSB2YWx1ZXMgdG8gQTk4IFJHQlxuXG5cdFJlZmVyZW5jZXM6XG5cdFx0KiBodHRwczovL2RyYWZ0cy5jc3N3Zy5vcmcvY3NzLWNvbG9yLyNjb2xvci1jb252ZXJzaW9uLWNvZGVcblx0XHQqIGh0dHA6Ly93d3cuYnJ1Y2VsaW5kYmxvb20uY29tL2luZGV4Lmh0bWw/RXFuX1JHQl9YWVpfTWF0cml4Lmh0bWxcbiovXG5cbmNvbnN0IGdhbW1hID0gdiA9PiBNYXRoLnBvdyhNYXRoLmFicyh2KSwgMjU2IC8gNTYzKSAqIE1hdGguc2lnbih2KTtcblxuY29uc3QgY29udmVydFh5ejY1VG9BOTggPSAoeyB4LCB5LCB6LCBhbHBoYSB9KSA9PiB7XG5cdGlmICh4ID09PSB1bmRlZmluZWQpIHggPSAwO1xuXHRpZiAoeSA9PT0gdW5kZWZpbmVkKSB5ID0gMDtcblx0aWYgKHogPT09IHVuZGVmaW5lZCkgeiA9IDA7XG5cdGxldCByZXMgPSB7XG5cdFx0bW9kZTogJ2E5OCcsXG5cdFx0cjogZ2FtbWEoXG5cdFx0XHR4ICogMi4wNDE1ODc5MDM4MTA3NDY1IC1cblx0XHRcdFx0eSAqIDAuNTY1MDA2OTc0Mjc4ODU5NyAtXG5cdFx0XHRcdDAuMzQ0NzMxMzUwNzc4MzI5NyAqIHpcblx0XHQpLFxuXHRcdGc6IGdhbW1hKFxuXHRcdFx0eCAqIC0wLjk2OTI0MzYzNjI4MDg3OTggK1xuXHRcdFx0XHR5ICogMS44NzU5Njc1MDE1MDc3MjA2ICtcblx0XHRcdFx0MC4wNDE1NTUwNTc0MDcxNzU2ICogelxuXHRcdCksXG5cdFx0YjogZ2FtbWEoXG5cdFx0XHR4ICogMC4wMTM0NDQyODA2MzIwMzEyIC1cblx0XHRcdFx0eSAqIDAuMTE4MzYyMzkyMjMxMDE4NCArXG5cdFx0XHRcdDEuMDE1MTc0OTk0MzkxMjA1OCAqIHpcblx0XHQpXG5cdH07XG5cdGlmIChhbHBoYSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmVzLmFscGhhID0gYWxwaGE7XG5cdH1cblx0cmV0dXJuIHJlcztcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNvbnZlcnRYeXo2NVRvQTk4O1xuIiwgImNvbnN0IGZuID0gKGMgPSAwKSA9PiB7XG5cdGNvbnN0IGFicyA9IE1hdGguYWJzKGMpO1xuXHRpZiAoYWJzIDw9IDAuMDQwNDUpIHtcblx0XHRyZXR1cm4gYyAvIDEyLjkyO1xuXHR9XG5cdHJldHVybiAoTWF0aC5zaWduKGMpIHx8IDEpICogTWF0aC5wb3coKGFicyArIDAuMDU1KSAvIDEuMDU1LCAyLjQpO1xufTtcblxuY29uc3QgY29udmVydFJnYlRvTHJnYiA9ICh7IHIsIGcsIGIsIGFscGhhIH0pID0+IHtcblx0bGV0IHJlcyA9IHtcblx0XHRtb2RlOiAnbHJnYicsXG5cdFx0cjogZm4ociksXG5cdFx0ZzogZm4oZyksXG5cdFx0YjogZm4oYilcblx0fTtcblx0aWYgKGFscGhhICE9PSB1bmRlZmluZWQpIHJlcy5hbHBoYSA9IGFscGhhO1xuXHRyZXR1cm4gcmVzO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgY29udmVydFJnYlRvTHJnYjtcbiIsICIvKlxuXHRDb252ZXJ0IHNSR0IgdmFsdWVzIHRvIENJRSBYWVogRDY1XG5cblx0UmVmZXJlbmNlczpcblx0XHQqIGh0dHBzOi8vZHJhZnRzLmNzc3dnLm9yZy9jc3MtY29sb3IvI2NvbG9yLWNvbnZlcnNpb24tY29kZVxuXHRcdCogaHR0cDovL3d3dy5icnVjZWxpbmRibG9vbS5jb20vaW5kZXguaHRtbD9FcW5fUkdCX1hZWl9NYXRyaXguaHRtbFxuXHRcdCogaHR0cHM6Ly9vYnNlcnZhYmxlaHEuY29tL0BkYW5idXJ6by9jb2xvci1tYXRyaXgtY2FsY3VsYXRvclxuKi9cblxuaW1wb3J0IGNvbnZlcnRSZ2JUb0xyZ2IgZnJvbSAnLi4vbHJnYi9jb252ZXJ0UmdiVG9McmdiLmpzJztcblxuY29uc3QgY29udmVydFJnYlRvWHl6NjUgPSByZ2IgPT4ge1xuXHRsZXQgeyByLCBnLCBiLCBhbHBoYSB9ID0gY29udmVydFJnYlRvTHJnYihyZ2IpO1xuXHRsZXQgcmVzID0ge1xuXHRcdG1vZGU6ICd4eXo2NScsXG5cdFx0eDpcblx0XHRcdDAuNDEyMzkwNzk5MjY1OTU5MyAqIHIgK1xuXHRcdFx0MC4zNTc1ODQzMzkzODM4NzggKiBnICtcblx0XHRcdDAuMTgwNDgwNzg4NDAxODM0MyAqIGIsXG5cdFx0eTpcblx0XHRcdDAuMjEyNjM5MDA1ODcxNTEwMiAqIHIgK1xuXHRcdFx0MC43MTUxNjg2Nzg3Njc3NTYgKiBnICtcblx0XHRcdDAuMDcyMTkyMzE1MzYwNzMzNyAqIGIsXG5cdFx0ejpcblx0XHRcdDAuMDE5MzMwODE4NzE1NTkxOCAqIHIgK1xuXHRcdFx0MC4xMTkxOTQ3Nzk3OTQ2MjYgKiBnICtcblx0XHRcdDAuOTUwNTMyMTUyMjQ5NjYwNyAqIGJcblx0fTtcblx0aWYgKGFscGhhICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXMuYWxwaGEgPSBhbHBoYTtcblx0fVxuXHRyZXR1cm4gcmVzO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgY29udmVydFJnYlRvWHl6NjU7XG4iLCAiY29uc3QgZm4gPSAoYyA9IDApID0+IHtcblx0Y29uc3QgYWJzID0gTWF0aC5hYnMoYyk7XG5cdGlmIChhYnMgPiAwLjAwMzEzMDgpIHtcblx0XHRyZXR1cm4gKE1hdGguc2lnbihjKSB8fCAxKSAqICgxLjA1NSAqIE1hdGgucG93KGFicywgMSAvIDIuNCkgLSAwLjA1NSk7XG5cdH1cblx0cmV0dXJuIGMgKiAxMi45Mjtcbn07XG5cbmNvbnN0IGNvbnZlcnRMcmdiVG9SZ2IgPSAoeyByLCBnLCBiLCBhbHBoYSB9LCBtb2RlID0gJ3JnYicpID0+IHtcblx0bGV0IHJlcyA9IHtcblx0XHRtb2RlLFxuXHRcdHI6IGZuKHIpLFxuXHRcdGc6IGZuKGcpLFxuXHRcdGI6IGZuKGIpXG5cdH07XG5cdGlmIChhbHBoYSAhPT0gdW5kZWZpbmVkKSByZXMuYWxwaGEgPSBhbHBoYTtcblx0cmV0dXJuIHJlcztcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNvbnZlcnRMcmdiVG9SZ2I7XG4iLCAiLypcblx0Q0lFIFhZWiBENjUgdmFsdWVzIHRvIHNSR0IuXG5cblx0UmVmZXJlbmNlczpcblx0XHQqIGh0dHBzOi8vZHJhZnRzLmNzc3dnLm9yZy9jc3MtY29sb3IvI2NvbG9yLWNvbnZlcnNpb24tY29kZVxuXHRcdCogaHR0cDovL3d3dy5icnVjZWxpbmRibG9vbS5jb20vaW5kZXguaHRtbD9FcW5fUkdCX1hZWl9NYXRyaXguaHRtbFxuXHRcdCogaHR0cHM6Ly9vYnNlcnZhYmxlaHEuY29tL0BkYW5idXJ6by9jb2xvci1tYXRyaXgtY2FsY3VsYXRvclxuKi9cblxuaW1wb3J0IGNvbnZlcnRMcmdiVG9SZ2IgZnJvbSAnLi4vbHJnYi9jb252ZXJ0THJnYlRvUmdiLmpzJztcblxuY29uc3QgY29udmVydFh5ejY1VG9SZ2IgPSAoeyB4LCB5LCB6LCBhbHBoYSB9KSA9PiB7XG5cdGlmICh4ID09PSB1bmRlZmluZWQpIHggPSAwO1xuXHRpZiAoeSA9PT0gdW5kZWZpbmVkKSB5ID0gMDtcblx0aWYgKHogPT09IHVuZGVmaW5lZCkgeiA9IDA7XG5cdGxldCByZXMgPSBjb252ZXJ0THJnYlRvUmdiKHtcblx0XHRyOlxuXHRcdFx0eCAqIDMuMjQwOTY5OTQxOTA0NTIyNiAtXG5cdFx0XHR5ICogMS41MzczODMxNzc1NzAwOTM5IC1cblx0XHRcdDAuNDk4NjEwNzYwMjkzMDAzNCAqIHosXG5cdFx0Zzpcblx0XHRcdHggKiAtMC45NjkyNDM2MzYyODA4Nzk2ICtcblx0XHRcdHkgKiAxLjg3NTk2NzUwMTUwNzcyMDQgK1xuXHRcdFx0MC4wNDE1NTUwNTc0MDcxNzU2ICogeixcblx0XHRiOlxuXHRcdFx0eCAqIDAuMDU1NjMwMDc5Njk2OTkzNiAtXG5cdFx0XHR5ICogMC4yMDM5NzY5NTg4ODg5NzY1ICtcblx0XHRcdDEuMDU2OTcxNTE0MjQyODc4NCAqIHpcblx0fSk7XG5cdGlmIChhbHBoYSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmVzLmFscGhhID0gYWxwaGE7XG5cdH1cblx0cmV0dXJuIHJlcztcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNvbnZlcnRYeXo2NVRvUmdiO1xuIiwgImltcG9ydCByZ2IgZnJvbSAnLi4vcmdiL2RlZmluaXRpb24uanMnO1xuXG5pbXBvcnQgY29udmVydEE5OFRvWHl6NjUgZnJvbSAnLi9jb252ZXJ0QTk4VG9YeXo2NS5qcyc7XG5pbXBvcnQgY29udmVydFh5ejY1VG9BOTggZnJvbSAnLi9jb252ZXJ0WHl6NjVUb0E5OC5qcyc7XG5pbXBvcnQgY29udmVydFJnYlRvWHl6NjUgZnJvbSAnLi4veHl6NjUvY29udmVydFJnYlRvWHl6NjUuanMnO1xuaW1wb3J0IGNvbnZlcnRYeXo2NVRvUmdiIGZyb20gJy4uL3h5ejY1L2NvbnZlcnRYeXo2NVRvUmdiLmpzJztcblxuY29uc3QgZGVmaW5pdGlvbiA9IHtcblx0Li4ucmdiLFxuXHRtb2RlOiAnYTk4Jyxcblx0cGFyc2U6IFsnYTk4LXJnYiddLFxuXHRzZXJpYWxpemU6ICdhOTgtcmdiJyxcblxuXHRmcm9tTW9kZToge1xuXHRcdHJnYjogY29sb3IgPT4gY29udmVydFh5ejY1VG9BOTgoY29udmVydFJnYlRvWHl6NjUoY29sb3IpKSxcblx0XHR4eXo2NTogY29udmVydFh5ejY1VG9BOThcblx0fSxcblxuXHR0b01vZGU6IHtcblx0XHRyZ2I6IGNvbG9yID0+IGNvbnZlcnRYeXo2NVRvUmdiKGNvbnZlcnRBOThUb1h5ejY1KGNvbG9yKSksXG5cdFx0eHl6NjU6IGNvbnZlcnRBOThUb1h5ejY1XG5cdH1cbn07XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluaXRpb247XG4iLCAiY29uc3Qgbm9ybWFsaXplSHVlID0gaHVlID0+ICgoaHVlID0gaHVlICUgMzYwKSA8IDAgPyBodWUgKyAzNjAgOiBodWUpO1xuXG5leHBvcnQgZGVmYXVsdCBub3JtYWxpemVIdWU7XG4iLCAiaW1wb3J0IG5vcm1hbGl6ZUh1ZSBmcm9tICcuLi91dGlsL25vcm1hbGl6ZUh1ZS5qcyc7XG5cbmNvbnN0IGh1ZSA9IChodWVzLCBmbikgPT4ge1xuXHRyZXR1cm4gaHVlc1xuXHRcdC5tYXAoKGh1ZSwgaWR4LCBhcnIpID0+IHtcblx0XHRcdGlmIChodWUgPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRyZXR1cm4gaHVlO1xuXHRcdFx0fVxuXHRcdFx0bGV0IG5vcm1hbGl6ZWQgPSBub3JtYWxpemVIdWUoaHVlKTtcblx0XHRcdGlmIChpZHggPT09IDAgfHwgaHVlc1tpZHggLSAxXSA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdHJldHVybiBub3JtYWxpemVkO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGZuKG5vcm1hbGl6ZWQgLSBub3JtYWxpemVIdWUoYXJyW2lkeCAtIDFdKSk7XG5cdFx0fSlcblx0XHQucmVkdWNlKChhY2MsIGN1cnIpID0+IHtcblx0XHRcdGlmIChcblx0XHRcdFx0IWFjYy5sZW5ndGggfHxcblx0XHRcdFx0Y3VyciA9PT0gdW5kZWZpbmVkIHx8XG5cdFx0XHRcdGFjY1thY2MubGVuZ3RoIC0gMV0gPT09IHVuZGVmaW5lZFxuXHRcdFx0KSB7XG5cdFx0XHRcdGFjYy5wdXNoKGN1cnIpO1xuXHRcdFx0XHRyZXR1cm4gYWNjO1xuXHRcdFx0fVxuXHRcdFx0YWNjLnB1c2goY3VyciArIGFjY1thY2MubGVuZ3RoIC0gMV0pO1xuXHRcdFx0cmV0dXJuIGFjYztcblx0XHR9LCBbXSk7XG59O1xuXG5jb25zdCBmaXh1cEh1ZVNob3J0ZXIgPSBhcnIgPT5cblx0aHVlKGFyciwgZCA9PiAoTWF0aC5hYnMoZCkgPD0gMTgwID8gZCA6IGQgLSAzNjAgKiBNYXRoLnNpZ24oZCkpKTtcbmNvbnN0IGZpeHVwSHVlTG9uZ2VyID0gYXJyID0+XG5cdGh1ZShhcnIsIGQgPT4gKE1hdGguYWJzKGQpID49IDE4MCB8fCBkID09PSAwID8gZCA6IGQgLSAzNjAgKiBNYXRoLnNpZ24oZCkpKTtcbmNvbnN0IGZpeHVwSHVlSW5jcmVhc2luZyA9IGFyciA9PiBodWUoYXJyLCBkID0+IChkID49IDAgPyBkIDogZCArIDM2MCkpO1xuY29uc3QgZml4dXBIdWVEZWNyZWFzaW5nID0gYXJyID0+IGh1ZShhcnIsIGQgPT4gKGQgPD0gMCA/IGQgOiBkIC0gMzYwKSk7XG5cbmV4cG9ydCB7XG5cdGZpeHVwSHVlU2hvcnRlcixcblx0Zml4dXBIdWVMb25nZXIsXG5cdGZpeHVwSHVlSW5jcmVhc2luZyxcblx0Zml4dXBIdWVEZWNyZWFzaW5nXG59O1xuIiwgImV4cG9ydCBjb25zdCBNID0gWy0wLjE0ODYxLCAxLjc4Mjc3LCAtMC4yOTIyNywgLTAuOTA2NDksIDEuOTcyOTQsIDBdO1xuXG5leHBvcnQgY29uc3QgZGVnVG9SYWQgPSBNYXRoLlBJIC8gMTgwO1xuZXhwb3J0IGNvbnN0IHJhZFRvRGVnID0gMTgwIC8gTWF0aC5QSTtcbiIsICIvKlxuXHRDb252ZXJ0IGEgUkdCIGNvbG9yIHRvIHRoZSBDdWJlaGVsaXggSFNMIGNvbG9yIHNwYWNlLlxuXG5cdFRoaXMgY29tcHV0YXRpb24gaXMgbm90IHByZXNlbnQgaW4gR3JlZW4ncyBwYXBlcjpcblx0aHR0cHM6Ly9hcnhpdi5vcmcvcGRmLzExMDguNTA4My5wZGZcblxuXHQuLi5idXQgY2FuIGJlIGRlcml2ZWQgZnJvbSB0aGUgaW52ZXJzZSwgSFNMIHRvIFJHQiBjb252ZXJzaW9uLlxuXG5cdEl0IG1hdGNoZXMgdGhlIG1hdGggaW4gTWlrZSBCb3N0b2NrJ3MgRDMgaW1wbGVtZW50YXRpb246XG5cblx0aHR0cHM6Ly9naXRodWIuY29tL2QzL2QzLWNvbG9yL2Jsb2IvbWFzdGVyL3NyYy9jdWJlaGVsaXguanNcbiAqL1xuXG5pbXBvcnQgeyByYWRUb0RlZywgTSB9IGZyb20gJy4vY29uc3RhbnRzLmpzJztcblxubGV0IERFID0gTVszXSAqIE1bNF07XG5sZXQgQkUgPSBNWzFdICogTVs0XTtcbmxldCBCQ0FEID0gTVsxXSAqIE1bMl0gLSBNWzBdICogTVszXTtcblxuY29uc3QgY29udmVydFJnYlRvQ3ViZWhlbGl4ID0gKHsgciwgZywgYiwgYWxwaGEgfSkgPT4ge1xuXHRpZiAociA9PT0gdW5kZWZpbmVkKSByID0gMDtcblx0aWYgKGcgPT09IHVuZGVmaW5lZCkgZyA9IDA7XG5cdGlmIChiID09PSB1bmRlZmluZWQpIGIgPSAwO1xuXHRsZXQgbCA9IChCQ0FEICogYiArIHIgKiBERSAtIGcgKiBCRSkgLyAoQkNBRCArIERFIC0gQkUpO1xuXHRsZXQgeCA9IGIgLSBsO1xuXHRsZXQgeSA9IChNWzRdICogKGcgLSBsKSAtIE1bMl0gKiB4KSAvIE1bM107XG5cblx0bGV0IHJlcyA9IHtcblx0XHRtb2RlOiAnY3ViZWhlbGl4Jyxcblx0XHRsOiBsLFxuXHRcdHM6XG5cdFx0XHRsID09PSAwIHx8IGwgPT09IDFcblx0XHRcdFx0PyB1bmRlZmluZWRcblx0XHRcdFx0OiBNYXRoLnNxcnQoeCAqIHggKyB5ICogeSkgLyAoTVs0XSAqIGwgKiAoMSAtIGwpKVxuXHR9O1xuXG5cdGlmIChyZXMucykgcmVzLmggPSBNYXRoLmF0YW4yKHksIHgpICogcmFkVG9EZWcgLSAxMjA7XG5cdGlmIChhbHBoYSAhPT0gdW5kZWZpbmVkKSByZXMuYWxwaGEgPSBhbHBoYTtcblxuXHRyZXR1cm4gcmVzO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgY29udmVydFJnYlRvQ3ViZWhlbGl4O1xuIiwgImltcG9ydCB7IGRlZ1RvUmFkLCBNIH0gZnJvbSAnLi9jb25zdGFudHMuanMnO1xuXG5jb25zdCBjb252ZXJ0Q3ViZWhlbGl4VG9SZ2IgPSAoeyBoLCBzLCBsLCBhbHBoYSB9KSA9PiB7XG5cdGxldCByZXMgPSB7IG1vZGU6ICdyZ2InIH07XG5cblx0aCA9IChoID09PSB1bmRlZmluZWQgPyAwIDogaCArIDEyMCkgKiBkZWdUb1JhZDtcblx0aWYgKGwgPT09IHVuZGVmaW5lZCkgbCA9IDA7XG5cblx0bGV0IGFtcCA9IHMgPT09IHVuZGVmaW5lZCA/IDAgOiBzICogbCAqICgxIC0gbCk7XG5cblx0bGV0IGNvc2ggPSBNYXRoLmNvcyhoKTtcblx0bGV0IHNpbmggPSBNYXRoLnNpbihoKTtcblxuXHRyZXMuciA9IGwgKyBhbXAgKiAoTVswXSAqIGNvc2ggKyBNWzFdICogc2luaCk7XG5cdHJlcy5nID0gbCArIGFtcCAqIChNWzJdICogY29zaCArIE1bM10gKiBzaW5oKTtcblx0cmVzLmIgPSBsICsgYW1wICogKE1bNF0gKiBjb3NoICsgTVs1XSAqIHNpbmgpO1xuXG5cdGlmIChhbHBoYSAhPT0gdW5kZWZpbmVkKSByZXMuYWxwaGEgPSBhbHBoYTtcblx0cmV0dXJuIHJlcztcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNvbnZlcnRDdWJlaGVsaXhUb1JnYjtcbiIsICJpbXBvcnQgeyBnZXRNb2RlIH0gZnJvbSAnLi9tb2Rlcy5qcyc7XG5pbXBvcnQgY29udmVydGVyIGZyb20gJy4vY29udmVydGVyLmpzJztcbmltcG9ydCBub3JtYWxpemVIdWUgZnJvbSAnLi91dGlsL25vcm1hbGl6ZUh1ZS5qcyc7XG5cbmNvbnN0IGRpZmZlcmVuY2VIdWVTYXR1cmF0aW9uID0gKHN0ZCwgc21wKSA9PiB7XG5cdGlmIChzdGQuaCA9PT0gdW5kZWZpbmVkIHx8IHNtcC5oID09PSB1bmRlZmluZWQgfHwgIXN0ZC5zIHx8ICFzbXAucykge1xuXHRcdHJldHVybiAwO1xuXHR9XG5cdGxldCBzdGRfaCA9IG5vcm1hbGl6ZUh1ZShzdGQuaCk7XG5cdGxldCBzbXBfaCA9IG5vcm1hbGl6ZUh1ZShzbXAuaCk7XG5cdGxldCBkSCA9IE1hdGguc2luKCgoKHNtcF9oIC0gc3RkX2ggKyAzNjApIC8gMikgKiBNYXRoLlBJKSAvIDE4MCk7XG5cdHJldHVybiAyICogTWF0aC5zcXJ0KHN0ZC5zICogc21wLnMpICogZEg7XG59O1xuXG5jb25zdCBkaWZmZXJlbmNlSHVlTmFpdmUgPSAoc3RkLCBzbXApID0+IHtcblx0aWYgKHN0ZC5oID09PSB1bmRlZmluZWQgfHwgc21wLmggPT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiAwO1xuXHR9XG5cdGxldCBzdGRfaCA9IG5vcm1hbGl6ZUh1ZShzdGQuaCk7XG5cdGxldCBzbXBfaCA9IG5vcm1hbGl6ZUh1ZShzbXAuaCk7XG5cdGlmIChNYXRoLmFicyhzbXBfaCAtIHN0ZF9oKSA+IDE4MCkge1xuXHRcdC8vIHRvZG8gc2hvdWxkIHRoaXMgYmUgbm9ybWFsaXplZCBvbmNlIGFnYWluP1xuXHRcdHJldHVybiBzdGRfaCAtIChzbXBfaCAtIDM2MCAqIE1hdGguc2lnbihzbXBfaCAtIHN0ZF9oKSk7XG5cdH1cblx0cmV0dXJuIHNtcF9oIC0gc3RkX2g7XG59O1xuXG5jb25zdCBkaWZmZXJlbmNlSHVlQ2hyb21hID0gKHN0ZCwgc21wKSA9PiB7XG5cdGlmIChzdGQuaCA9PT0gdW5kZWZpbmVkIHx8IHNtcC5oID09PSB1bmRlZmluZWQgfHwgIXN0ZC5jIHx8ICFzbXAuYykge1xuXHRcdHJldHVybiAwO1xuXHR9XG5cdGxldCBzdGRfaCA9IG5vcm1hbGl6ZUh1ZShzdGQuaCk7XG5cdGxldCBzbXBfaCA9IG5vcm1hbGl6ZUh1ZShzbXAuaCk7XG5cdGxldCBkSCA9IE1hdGguc2luKCgoKHNtcF9oIC0gc3RkX2ggKyAzNjApIC8gMikgKiBNYXRoLlBJKSAvIDE4MCk7XG5cdHJldHVybiAyICogTWF0aC5zcXJ0KHN0ZC5jICogc21wLmMpICogZEg7XG59O1xuXG5jb25zdCBkaWZmZXJlbmNlRXVjbGlkZWFuID0gKG1vZGUgPSAncmdiJywgd2VpZ2h0cyA9IFsxLCAxLCAxLCAwXSkgPT4ge1xuXHRsZXQgZGVmID0gZ2V0TW9kZShtb2RlKTtcblx0bGV0IGNoYW5uZWxzID0gZGVmLmNoYW5uZWxzO1xuXHRsZXQgZGlmZnMgPSBkZWYuZGlmZmVyZW5jZTtcblx0bGV0IGNvbnYgPSBjb252ZXJ0ZXIobW9kZSk7XG5cdHJldHVybiAoc3RkLCBzbXApID0+IHtcblx0XHRsZXQgQ29udlN0ZCA9IGNvbnYoc3RkKTtcblx0XHRsZXQgQ29udlNtcCA9IGNvbnYoc21wKTtcblx0XHRyZXR1cm4gTWF0aC5zcXJ0KFxuXHRcdFx0Y2hhbm5lbHMucmVkdWNlKChzdW0sIGssIGlkeCkgPT4ge1xuXHRcdFx0XHRsZXQgZGVsdGEgPSBkaWZmc1trXVxuXHRcdFx0XHRcdD8gZGlmZnNba10oQ29udlN0ZCwgQ29udlNtcClcblx0XHRcdFx0XHQ6IENvbnZTdGRba10gLSBDb252U21wW2tdO1xuXHRcdFx0XHRyZXR1cm4gKFxuXHRcdFx0XHRcdHN1bSArXG5cdFx0XHRcdFx0KHdlaWdodHNbaWR4XSB8fCAwKSAqIE1hdGgucG93KGlzTmFOKGRlbHRhKSA/IDAgOiBkZWx0YSwgMilcblx0XHRcdFx0KTtcblx0XHRcdH0sIDApXG5cdFx0KTtcblx0fTtcbn07XG5cbmNvbnN0IGRpZmZlcmVuY2VDaWU3NiA9ICgpID0+IGRpZmZlcmVuY2VFdWNsaWRlYW4oJ2xhYjY1Jyk7XG5cbmNvbnN0IGRpZmZlcmVuY2VDaWU5NCA9IChrTCA9IDEsIEsxID0gMC4wNDUsIEsyID0gMC4wMTUpID0+IHtcblx0bGV0IGxhYiA9IGNvbnZlcnRlcignbGFiNjUnKTtcblxuXHRyZXR1cm4gKHN0ZCwgc21wKSA9PiB7XG5cdFx0bGV0IExhYlN0ZCA9IGxhYihzdGQpO1xuXHRcdGxldCBMYWJTbXAgPSBsYWIoc21wKTtcblxuXHRcdC8vIEV4dHJhY3QgTGFiIHZhbHVlcywgYW5kIGNvbXB1dGUgQ2hyb21hXG5cdFx0bGV0IGxTdGQgPSBMYWJTdGQubDtcblx0XHRsZXQgYVN0ZCA9IExhYlN0ZC5hO1xuXHRcdGxldCBiU3RkID0gTGFiU3RkLmI7XG5cdFx0bGV0IGNTdGQgPSBNYXRoLnNxcnQoYVN0ZCAqIGFTdGQgKyBiU3RkICogYlN0ZCk7XG5cblx0XHRsZXQgbFNtcCA9IExhYlNtcC5sO1xuXHRcdGxldCBhU21wID0gTGFiU21wLmE7XG5cdFx0bGV0IGJTbXAgPSBMYWJTbXAuYjtcblx0XHRsZXQgY1NtcCA9IE1hdGguc3FydChhU21wICogYVNtcCArIGJTbXAgKiBiU21wKTtcblxuXHRcdGxldCBkTDIgPSBNYXRoLnBvdyhsU3RkIC0gbFNtcCwgMik7XG5cdFx0bGV0IGRDMiA9IE1hdGgucG93KGNTdGQgLSBjU21wLCAyKTtcblx0XHRsZXQgZEgyID0gTWF0aC5wb3coYVN0ZCAtIGFTbXAsIDIpICsgTWF0aC5wb3coYlN0ZCAtIGJTbXAsIDIpIC0gZEMyO1xuXG5cdFx0cmV0dXJuIE1hdGguc3FydChcblx0XHRcdGRMMiAvIE1hdGgucG93KGtMLCAyKSArXG5cdFx0XHRcdGRDMiAvIE1hdGgucG93KDEgKyBLMSAqIGNTdGQsIDIpICtcblx0XHRcdFx0ZEgyIC8gTWF0aC5wb3coMSArIEsyICogY1N0ZCwgMilcblx0XHQpO1xuXHR9O1xufTtcblxuLypcblx0Q0lFREUyMDAwIGNvbG9yIGRpZmZlcmVuY2UsIG9yaWdpbmFsIE1hdGxhYiBpbXBsZW1lbnRhdGlvbiBieSBHYXVyYXYgU2hhcm1hXG5cdEJhc2VkIG9uIFwiVGhlIENJRURFMjAwMCBDb2xvci1EaWZmZXJlbmNlIEZvcm11bGE6IEltcGxlbWVudGF0aW9uIE5vdGVzLCBTdXBwbGVtZW50YXJ5IFRlc3QgRGF0YSwgYW5kIE1hdGhlbWF0aWNhbCBPYnNlcnZhdGlvbnNcIiBcblx0YnkgR2F1cmF2IFNoYXJtYSwgV2VuY2hlbmcgV3UsIEVkdWwgTi4gRGFsYWwgaW4gQ29sb3IgUmVzZWFyY2ggYW5kIEFwcGxpY2F0aW9uLCB2b2wuIDMwLiBOby4gMSwgcHAuIDIxLTMwLCBGZWJydWFyeSAyMDA1LlxuXHRodHRwOi8vd3d3Mi5lY2Uucm9jaGVzdGVyLmVkdS9+Z3NoYXJtYS9jaWVkZTIwMDAvXG4gKi9cblxuY29uc3QgZGlmZmVyZW5jZUNpZWRlMjAwMCA9IChLbCA9IDEsIEtjID0gMSwgS2ggPSAxKSA9PiB7XG5cdGxldCBsYWIgPSBjb252ZXJ0ZXIoJ2xhYjY1Jyk7XG5cdHJldHVybiAoc3RkLCBzbXApID0+IHtcblx0XHRsZXQgTGFiU3RkID0gbGFiKHN0ZCk7XG5cdFx0bGV0IExhYlNtcCA9IGxhYihzbXApO1xuXG5cdFx0bGV0IGxTdGQgPSBMYWJTdGQubDtcblx0XHRsZXQgYVN0ZCA9IExhYlN0ZC5hO1xuXHRcdGxldCBiU3RkID0gTGFiU3RkLmI7XG5cdFx0bGV0IGNTdGQgPSBNYXRoLnNxcnQoYVN0ZCAqIGFTdGQgKyBiU3RkICogYlN0ZCk7XG5cblx0XHRsZXQgbFNtcCA9IExhYlNtcC5sO1xuXHRcdGxldCBhU21wID0gTGFiU21wLmE7XG5cdFx0bGV0IGJTbXAgPSBMYWJTbXAuYjtcblx0XHRsZXQgY1NtcCA9IE1hdGguc3FydChhU21wICogYVNtcCArIGJTbXAgKiBiU21wKTtcblxuXHRcdGxldCBjQXZnID0gKGNTdGQgKyBjU21wKSAvIDI7XG5cblx0XHRsZXQgRyA9XG5cdFx0XHQwLjUgKlxuXHRcdFx0KDEgLVxuXHRcdFx0XHRNYXRoLnNxcnQoXG5cdFx0XHRcdFx0TWF0aC5wb3coY0F2ZywgNykgLyAoTWF0aC5wb3coY0F2ZywgNykgKyBNYXRoLnBvdygyNSwgNykpXG5cdFx0XHRcdCkpO1xuXG5cdFx0bGV0IGFwU3RkID0gYVN0ZCAqICgxICsgRyk7XG5cdFx0bGV0IGFwU21wID0gYVNtcCAqICgxICsgRyk7XG5cblx0XHRsZXQgY3BTdGQgPSBNYXRoLnNxcnQoYXBTdGQgKiBhcFN0ZCArIGJTdGQgKiBiU3RkKTtcblx0XHRsZXQgY3BTbXAgPSBNYXRoLnNxcnQoYXBTbXAgKiBhcFNtcCArIGJTbXAgKiBiU21wKTtcblxuXHRcdGxldCBocFN0ZCA9XG5cdFx0XHRNYXRoLmFicyhhcFN0ZCkgKyBNYXRoLmFicyhiU3RkKSA9PT0gMFxuXHRcdFx0XHQ/IDBcblx0XHRcdFx0OiBNYXRoLmF0YW4yKGJTdGQsIGFwU3RkKTtcblx0XHRocFN0ZCArPSAoaHBTdGQgPCAwKSAqIDIgKiBNYXRoLlBJO1xuXG5cdFx0bGV0IGhwU21wID1cblx0XHRcdE1hdGguYWJzKGFwU21wKSArIE1hdGguYWJzKGJTbXApID09PSAwXG5cdFx0XHRcdD8gMFxuXHRcdFx0XHQ6IE1hdGguYXRhbjIoYlNtcCwgYXBTbXApO1xuXHRcdGhwU21wICs9IChocFNtcCA8IDApICogMiAqIE1hdGguUEk7XG5cblx0XHRsZXQgZEwgPSBsU21wIC0gbFN0ZDtcblx0XHRsZXQgZEMgPSBjcFNtcCAtIGNwU3RkO1xuXG5cdFx0bGV0IGRocCA9IGNwU3RkICogY3BTbXAgPT09IDAgPyAwIDogaHBTbXAgLSBocFN0ZDtcblx0XHRkaHAgLT0gKGRocCA+IE1hdGguUEkpICogMiAqIE1hdGguUEk7XG5cdFx0ZGhwICs9IChkaHAgPCAtTWF0aC5QSSkgKiAyICogTWF0aC5QSTtcblxuXHRcdGxldCBkSCA9IDIgKiBNYXRoLnNxcnQoY3BTdGQgKiBjcFNtcCkgKiBNYXRoLnNpbihkaHAgLyAyKTtcblxuXHRcdGxldCBMcCA9IChsU3RkICsgbFNtcCkgLyAyO1xuXHRcdGxldCBDcCA9IChjcFN0ZCArIGNwU21wKSAvIDI7XG5cblx0XHRsZXQgaHA7XG5cdFx0aWYgKGNwU3RkICogY3BTbXAgPT09IDApIHtcblx0XHRcdGhwID0gaHBTdGQgKyBocFNtcDtcblx0XHR9IGVsc2Uge1xuXHRcdFx0aHAgPSAoaHBTdGQgKyBocFNtcCkgLyAyO1xuXHRcdFx0aHAgLT0gKE1hdGguYWJzKGhwU3RkIC0gaHBTbXApID4gTWF0aC5QSSkgKiBNYXRoLlBJO1xuXHRcdFx0aHAgKz0gKGhwIDwgMCkgKiAyICogTWF0aC5QSTtcblx0XHR9XG5cblx0XHRsZXQgTHBtNTAgPSBNYXRoLnBvdyhMcCAtIDUwLCAyKTtcblx0XHRsZXQgVCA9XG5cdFx0XHQxIC1cblx0XHRcdDAuMTcgKiBNYXRoLmNvcyhocCAtIE1hdGguUEkgLyA2KSArXG5cdFx0XHQwLjI0ICogTWF0aC5jb3MoMiAqIGhwKSArXG5cdFx0XHQwLjMyICogTWF0aC5jb3MoMyAqIGhwICsgTWF0aC5QSSAvIDMwKSAtXG5cdFx0XHQwLjIgKiBNYXRoLmNvcyg0ICogaHAgLSAoNjMgKiBNYXRoLlBJKSAvIDE4MCk7XG5cblx0XHRsZXQgU2wgPSAxICsgKDAuMDE1ICogTHBtNTApIC8gTWF0aC5zcXJ0KDIwICsgTHBtNTApO1xuXHRcdGxldCBTYyA9IDEgKyAwLjA0NSAqIENwO1xuXHRcdGxldCBTaCA9IDEgKyAwLjAxNSAqIENwICogVDtcblxuXHRcdGxldCBkZWx0YVRoZXRhID1cblx0XHRcdCgoMzAgKiBNYXRoLlBJKSAvIDE4MCkgKlxuXHRcdFx0TWF0aC5leHAoLTEgKiBNYXRoLnBvdygoKDE4MCAvIE1hdGguUEkpICogaHAgLSAyNzUpIC8gMjUsIDIpKTtcblx0XHRsZXQgUmMgPVxuXHRcdFx0MiAqXG5cdFx0XHRNYXRoLnNxcnQoTWF0aC5wb3coQ3AsIDcpIC8gKE1hdGgucG93KENwLCA3KSArIE1hdGgucG93KDI1LCA3KSkpO1xuXG5cdFx0bGV0IFJ0ID0gLTEgKiBNYXRoLnNpbigyICogZGVsdGFUaGV0YSkgKiBSYztcblxuXHRcdHJldHVybiBNYXRoLnNxcnQoXG5cdFx0XHRNYXRoLnBvdyhkTCAvIChLbCAqIFNsKSwgMikgK1xuXHRcdFx0XHRNYXRoLnBvdyhkQyAvIChLYyAqIFNjKSwgMikgK1xuXHRcdFx0XHRNYXRoLnBvdyhkSCAvIChLaCAqIFNoKSwgMikgK1xuXHRcdFx0XHQoKChSdCAqIGRDKSAvIChLYyAqIFNjKSkgKiBkSCkgLyAoS2ggKiBTaClcblx0XHQpO1xuXHR9O1xufTtcblxuLypcblx0Q01DIChsOmMpIGRpZmZlcmVuY2UgZm9ybXVsYVxuXG5cdFJlZmVyZW5jZXM6XG5cdFx0aHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQ29sb3JfZGlmZmVyZW5jZSNDTUNfbDpjXygxOTg0KVxuXHRcdGh0dHA6Ly93d3cuYnJ1Y2VsaW5kYmxvb20uY29tL2luZGV4Lmh0bWw/RXFuX0RlbHRhRV9DTUMuaHRtbFxuICovXG5jb25zdCBkaWZmZXJlbmNlQ21jID0gKGwgPSAxLCBjID0gMSkgPT4ge1xuXHRsZXQgbGFiID0gY29udmVydGVyKCdsYWI2NScpO1xuXG5cdC8qXG5cdFx0Q29tcGFydGUgdHdvIGNvbG9yczpcblx0XHRzdGQgLSBzdGFuZGFyZCAoZmlyc3QpIGNvbG9yXG5cdFx0c21wIC0gc2FtcGxlIChzZWNvbmQpIGNvbG9yXG5cdCAqL1xuXHRyZXR1cm4gKHN0ZCwgc21wKSA9PiB7XG5cdFx0Ly8gY29udmVydCBzdGFuZGFyZCBjb2xvciB0byBMYWJcblx0XHRsZXQgTGFiU3RkID0gbGFiKHN0ZCk7XG5cdFx0bGV0IGxTdGQgPSBMYWJTdGQubDtcblx0XHRsZXQgYVN0ZCA9IExhYlN0ZC5hO1xuXHRcdGxldCBiU3RkID0gTGFiU3RkLmI7XG5cblx0XHQvLyBPYnRhaW4gaHVlL2Nocm9tYVxuXHRcdGxldCBjU3RkID0gTWF0aC5zcXJ0KGFTdGQgKiBhU3RkICsgYlN0ZCAqIGJTdGQpO1xuXHRcdGxldCBoU3RkID0gTWF0aC5hdGFuMihiU3RkLCBhU3RkKTtcblx0XHRoU3RkID0gaFN0ZCArIDIgKiBNYXRoLlBJICogKGhTdGQgPCAwKTtcblxuXHRcdC8vIGNvbnZlcnQgc2FtcGxlIGNvbG9yIHRvIExhYiwgb2J0YWluIExDaFxuXHRcdGxldCBMYWJTbXAgPSBsYWIoc21wKTtcblx0XHRsZXQgbFNtcCA9IExhYlNtcC5sO1xuXHRcdGxldCBhU21wID0gTGFiU21wLmE7XG5cdFx0bGV0IGJTbXAgPSBMYWJTbXAuYjtcblxuXHRcdC8vIE9idGFpbiBjaHJvbWFcblx0XHRsZXQgY1NtcCA9IE1hdGguc3FydChhU21wICogYVNtcCArIGJTbXAgKiBiU21wKTtcblxuXHRcdC8vIGxpZ2h0bmVzcyBkZWx0YSBzcXVhcmVkXG5cdFx0bGV0IGRMMiA9IE1hdGgucG93KGxTdGQgLSBsU21wLCAyKTtcblxuXHRcdC8vIGNocm9tYSBkZWx0YSBzcXVhcmVkXG5cdFx0bGV0IGRDMiA9IE1hdGgucG93KGNTdGQgLSBjU21wLCAyKTtcblxuXHRcdC8vIGh1ZSBkZWx0YSBzcXVhcmVkXG5cdFx0bGV0IGRIMiA9IE1hdGgucG93KGFTdGQgLSBhU21wLCAyKSArIE1hdGgucG93KGJTdGQgLSBiU21wLCAyKSAtIGRDMjtcblxuXHRcdGxldCBGID0gTWF0aC5zcXJ0KE1hdGgucG93KGNTdGQsIDQpIC8gKE1hdGgucG93KGNTdGQsIDQpICsgMTkwMCkpO1xuXHRcdGxldCBUID1cblx0XHRcdGhTdGQgPj0gKDE2NCAvIDE4MCkgKiBNYXRoLlBJICYmIGhTdGQgPD0gKDM0NSAvIDE4MCkgKiBNYXRoLlBJXG5cdFx0XHRcdD8gMC41NiArIE1hdGguYWJzKDAuMiAqIE1hdGguY29zKGhTdGQgKyAoMTY4IC8gMTgwKSAqIE1hdGguUEkpKVxuXHRcdFx0XHQ6IDAuMzYgKyBNYXRoLmFicygwLjQgKiBNYXRoLmNvcyhoU3RkICsgKDM1IC8gMTgwKSAqIE1hdGguUEkpKTtcblxuXHRcdGxldCBTbCA9IGxTdGQgPCAxNiA/IDAuNTExIDogKDAuMDQwOTc1ICogbFN0ZCkgLyAoMSArIDAuMDE3NjUgKiBsU3RkKTtcblx0XHRsZXQgU2MgPSAoMC4wNjM4ICogY1N0ZCkgLyAoMSArIDAuMDEzMSAqIGNTdGQpICsgMC42Mzg7XG5cdFx0bGV0IFNoID0gU2MgKiAoRiAqIFQgKyAxIC0gRik7XG5cblx0XHRyZXR1cm4gTWF0aC5zcXJ0KFxuXHRcdFx0ZEwyIC8gTWF0aC5wb3cobCAqIFNsLCAyKSArXG5cdFx0XHRcdGRDMiAvIE1hdGgucG93KGMgKiBTYywgMikgK1xuXHRcdFx0XHRkSDIgLyBNYXRoLnBvdyhTaCwgMilcblx0XHQpO1xuXHR9O1xufTtcblxuLypcblxuXHRIeUFCIGNvbG9yIGRpZmZlcmVuY2UgZm9ybXVsYSwgaW50cm9kdWNlZCBpbjpcblxuXHRcdEFiYXNpIFMsIEFtYW5pIFRlaHJhbiBNLCBGYWlyY2hpbGQgTUQuIFxuXHRcdFwiRGlzdGFuY2UgbWV0cmljcyBmb3IgdmVyeSBsYXJnZSBjb2xvciBkaWZmZXJlbmNlcy5cIlxuXHRcdENvbG9yIFJlcyBBcHBsLiAyMDE5OyAxXHUyMDEzMTYuIFxuXHRcdGh0dHBzOi8vZG9pLm9yZy8xMC4xMDAyL2NvbC4yMjQ1MVxuXG5cdFBERiBhdmFpbGFibGUgYXQ6XG5cdFxuXHRcdGh0dHA6Ly9tYXJrZmFpcmNoaWxkLm9yZy9QREZzL1BBUDQwLnBkZlxuICovXG5jb25zdCBkaWZmZXJlbmNlSHlhYiA9ICgpID0+IHtcblx0bGV0IGxhYiA9IGNvbnZlcnRlcignbGFiNjUnKTtcblx0cmV0dXJuIChzdGQsIHNtcCkgPT4ge1xuXHRcdGxldCBMYWJTdGQgPSBsYWIoc3RkKTtcblx0XHRsZXQgTGFiU21wID0gbGFiKHNtcCk7XG5cdFx0bGV0IGRMID0gTGFiU3RkLmwgLSBMYWJTbXAubDtcblx0XHRsZXQgZEEgPSBMYWJTdGQuYSAtIExhYlNtcC5hO1xuXHRcdGxldCBkQiA9IExhYlN0ZC5iIC0gTGFiU21wLmI7XG5cdFx0cmV0dXJuIE1hdGguYWJzKGRMKSArIE1hdGguc3FydChkQSAqIGRBICsgZEIgKiBkQik7XG5cdH07XG59O1xuXG4vKlxuXHRcIk1lYXN1cmluZyBwZXJjZWl2ZWQgY29sb3IgZGlmZmVyZW5jZSB1c2luZyBZSVEgTlRTQ1xuXHR0cmFuc21pc3Npb24gY29sb3Igc3BhY2UgaW4gbW9iaWxlIGFwcGxpY2F0aW9uc1wiXG5cdFx0XG5cdFx0YnkgWXVyaXkgS290c2FyZW5rbywgRmVybmFuZG8gUmFtb3MgaW46XG5cdFx0UHJvZ3JhbWFjaVx1MDBGM24gTWF0ZW1cdTAwRTF0aWNhIHkgU29mdHdhcmUgKDIwMTApIFxuXG5cdEF2YWlsYWJsZSBhdDpcblx0XHRcblx0XHRodHRwOi8vd3d3LnByb2dtYXQudWFlbS5teDo4MDgwL2FydFZvbDJOdW0yL0FydGljdWxvM1ZvbDJOdW0yLnBkZlxuICovXG5jb25zdCBkaWZmZXJlbmNlS290c2FyZW5rb1JhbW9zID0gKCkgPT5cblx0ZGlmZmVyZW5jZUV1Y2xpZGVhbigneWlxJywgWzAuNTA1MywgMC4yOTksIDAuMTk1N10pO1xuXG4vKlxuXHRcdTAzOTRFX0lUUCwgYXMgZGVmaW5lZCBpbiBSZWMuIElUVS1SIEJULjIxMjQ6XG5cblx0aHR0cHM6Ly93d3cuaXR1LmludC9yZWMvUi1SRUMtQlQuMjEyNC9lblxuKi9cbmNvbnN0IGRpZmZlcmVuY2VJdHAgPSAoKSA9PlxuXHRkaWZmZXJlbmNlRXVjbGlkZWFuKCdpdHAnLCBbNTE4NDAwLCAxMjk2MDAsIDUxODQwMF0pO1xuXG5leHBvcnQge1xuXHRkaWZmZXJlbmNlSHVlQ2hyb21hLFxuXHRkaWZmZXJlbmNlSHVlU2F0dXJhdGlvbixcblx0ZGlmZmVyZW5jZUh1ZU5haXZlLFxuXHRkaWZmZXJlbmNlRXVjbGlkZWFuLFxuXHRkaWZmZXJlbmNlQ2llNzYsXG5cdGRpZmZlcmVuY2VDaWU5NCxcblx0ZGlmZmVyZW5jZUNpZWRlMjAwMCxcblx0ZGlmZmVyZW5jZUNtYyxcblx0ZGlmZmVyZW5jZUh5YWIsXG5cdGRpZmZlcmVuY2VLb3RzYXJlbmtvUmFtb3MsXG5cdGRpZmZlcmVuY2VJdHBcbn07XG4iLCAiaW1wb3J0IGNvbnZlcnRlciBmcm9tICcuL2NvbnZlcnRlci5qcyc7XG5pbXBvcnQgeyBnZXRNb2RlIH0gZnJvbSAnLi9tb2Rlcy5qcyc7XG5cbmNvbnN0IGF2ZXJhZ2VBbmdsZSA9IHZhbCA9PiB7XG5cdC8vIFNlZTogaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvTWVhbl9vZl9jaXJjdWxhcl9xdWFudGl0aWVzXG5cdGxldCBzdW0gPSB2YWwucmVkdWNlKFxuXHRcdChzdW0sIHZhbCkgPT4ge1xuXHRcdFx0aWYgKHZhbCAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdGxldCByYWQgPSAodmFsICogTWF0aC5QSSkgLyAxODA7XG5cdFx0XHRcdHN1bS5zaW4gKz0gTWF0aC5zaW4ocmFkKTtcblx0XHRcdFx0c3VtLmNvcyArPSBNYXRoLmNvcyhyYWQpO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHN1bTtcblx0XHR9LFxuXHRcdHsgc2luOiAwLCBjb3M6IDAgfVxuXHQpO1xuXHRsZXQgYW5nbGUgPSAoTWF0aC5hdGFuMihzdW0uc2luLCBzdW0uY29zKSAqIDE4MCkgLyBNYXRoLlBJO1xuXHRyZXR1cm4gYW5nbGUgPCAwID8gMzYwICsgYW5nbGUgOiBhbmdsZTtcbn07XG5cbmNvbnN0IGF2ZXJhZ2VOdW1iZXIgPSB2YWwgPT4ge1xuXHRsZXQgYSA9IHZhbC5maWx0ZXIodiA9PiB2ICE9PSB1bmRlZmluZWQpO1xuXHRyZXR1cm4gYS5sZW5ndGggPyBhLnJlZHVjZSgoc3VtLCB2KSA9PiBzdW0gKyB2LCAwKSAvIGEubGVuZ3RoIDogdW5kZWZpbmVkO1xufTtcblxuY29uc3QgaXNmbiA9IG8gPT4gdHlwZW9mIG8gPT09ICdmdW5jdGlvbic7XG5cbmZ1bmN0aW9uIGF2ZXJhZ2UoY29sb3JzLCBtb2RlID0gJ3JnYicsIG92ZXJyaWRlcykge1xuXHRsZXQgZGVmID0gZ2V0TW9kZShtb2RlKTtcblx0bGV0IGNjID0gY29sb3JzLm1hcChjb252ZXJ0ZXIobW9kZSkpO1xuXHRyZXR1cm4gZGVmLmNoYW5uZWxzLnJlZHVjZShcblx0XHQocmVzLCBjaCkgPT4ge1xuXHRcdFx0bGV0IGFyciA9IGNjLm1hcChjID0+IGNbY2hdKS5maWx0ZXIodmFsID0+IHZhbCAhPT0gdW5kZWZpbmVkKTtcblx0XHRcdGlmIChhcnIubGVuZ3RoKSB7XG5cdFx0XHRcdGxldCBmbjtcblx0XHRcdFx0aWYgKGlzZm4ob3ZlcnJpZGVzKSkge1xuXHRcdFx0XHRcdGZuID0gb3ZlcnJpZGVzO1xuXHRcdFx0XHR9IGVsc2UgaWYgKG92ZXJyaWRlcyAmJiBpc2ZuKG92ZXJyaWRlc1tjaF0pKSB7XG5cdFx0XHRcdFx0Zm4gPSBvdmVycmlkZXNbY2hdO1xuXHRcdFx0XHR9IGVsc2UgaWYgKGRlZi5hdmVyYWdlICYmIGlzZm4oZGVmLmF2ZXJhZ2VbY2hdKSkge1xuXHRcdFx0XHRcdGZuID0gZGVmLmF2ZXJhZ2VbY2hdO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGZuID0gYXZlcmFnZU51bWJlcjtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXNbY2hdID0gZm4oYXJyLCBjaCk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gcmVzO1xuXHRcdH0sXG5cdFx0eyBtb2RlIH1cblx0KTtcbn1cblxuZXhwb3J0IHsgYXZlcmFnZSwgYXZlcmFnZUFuZ2xlLCBhdmVyYWdlTnVtYmVyIH07XG4iLCAiLyogXG5cdERhdmUgR3JlZW4ncyBDdWJlaGVsaXhcblx0LS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5cdEdyZWVuLCBELiBBLiwgMjAxMSwgXCJBIGNvbG91ciBzY2hlbWUgZm9yIHRoZSBkaXNwbGF5IG9mIGFzdHJvbm9taWNhbCBpbnRlbnNpdHkgaW1hZ2VzXCIsIFxuXHRCdWxsZXRpbiBvZiB0aGUgQXN0cm9ub21pY2FsIFNvY2lldHkgb2YgSW5kaWEsIDM5LCAyODkuICgyMDExQkFTSS4uLjM5Li4yODlHIGF0IEFEUy4pIFxuXG5cdGh0dHBzOi8vd3d3Lm1yYW8uY2FtLmFjLnVrLyU3RWRhZy9DVUJFSEVMSVgvXG5cdGh0dHBzOi8vYXJ4aXYub3JnL3BkZi8xMTA4LjUwODMucGRmXG5cblx0QWx0aG91Z2ggQ3ViZWhlbGl4IHdhcyBkZWZpbmVkIHRvIGJlIGEgbWV0aG9kIHRvIG9idGFpbiBhIGNvbG91ciBzY2hlbWUsXG5cdGl0IGFjdHVhbGx5IGNvbnRhaW5zIGEgZGVmaW5pdGlvbiBvZiBhIGNvbG91ciBzcGFjZSwgYXMgaWRlbnRpZmllZCBieSBcblx0TWlrZSBCb3N0b2NrIGFuZCBpbXBsZW1lbnRlZCBpbiBEMy5qcy5cblxuXHRHcmVlbidzIHBhcGVyIGludHJvZHVjZXMgdGhlIGZvbGxvd2luZyB0ZXJtaW5vbG9neTpcblxuXHQqIFx0YSBgbGlnaHRuZXNzYCBkaW1lbnNpb24gaW4gdGhlIGludGVydmFsIFswLCAxXSBcblx0XHRvbiB3aGljaCB3ZSBpbnRlcnBvbGF0ZSB0byBvYnRhaW4gdGhlIGNvbG91ciBzY2hlbWVcblx0Klx0YSBgc3RhcnRgIGNvbG91ciB0aGF0IGlzIGFuYWxvZ291cyB0byBhIEh1ZSBpbiBIU0wgc3BhY2Vcblx0Klx0YSBudW1iZXIgb2YgYHJvdGF0aW9uc2AgYXJvdW5kIHRoZSBIdWUgY3lsaW5kZXIuXG5cdCpcdGEgYGh1ZWAgcGFyYW1ldGVyIHdoaWNoIHNob3VsZCBtb3JlIGFwcHJvcHJpYXRlbHkgYmUgY2FsbGVkIGBzYXR1cmF0aW9uYFxuXHRcblx0QXMgc3VjaCwgdGhlIG9yaWdpbmFsIGRlZmluaXRpb24gb2YgdGhlIEN1YmVoZWxpeCBzY2hlbWUgaXMgYWN0dWFsbHkgYW5cblx0aW50ZXJwb2xhdGlvbiBiZXR3ZWVuIHR3byBjb2xvcnMgaW4gdGhlIEN1YmVoZWxpeCBzcGFjZTpcblxuXHRIOiBzdGFydCBcdFx0XHRcdEg6IHN0YXJ0ICsgMzYwICogcm90YXRpb25zXG5cdFM6IGh1ZSBcdFx0XHQtPlx0XHRTOiBodWVcblx0TDogMFx0XHRcdFx0XHRMOiAxXG5cblx0V2UgY2FuIHRoZXJlZm9yZSBleHRlbmQgdGhlIGludGVycG9sYXRpb24gdG8gYW55IHR3byBjb2xvcnMgaW4gdGhpcyBzcGFjZSxcblx0d2l0aCBhIHZhcmlhYmxlIFNhdHVyYXRpb24gYW5kIGEgTGlnaHRuZXNzIGludGVydmFsIG90aGVyIHRoYW4gdGhlIGZpeGVkIDAgLT4gMS5cbiovXG5cbmltcG9ydCB7IGZpeHVwSHVlU2hvcnRlciB9IGZyb20gJy4uL2ZpeHVwL2h1ZS5qcyc7XG5pbXBvcnQgeyBmaXh1cEFscGhhIH0gZnJvbSAnLi4vZml4dXAvYWxwaGEuanMnO1xuaW1wb3J0IHsgaW50ZXJwb2xhdG9yTGluZWFyIH0gZnJvbSAnLi4vaW50ZXJwb2xhdGUvbGluZWFyLmpzJztcbmltcG9ydCBjb252ZXJ0UmdiVG9DdWJlaGVsaXggZnJvbSAnLi9jb252ZXJ0UmdiVG9DdWJlaGVsaXguanMnO1xuaW1wb3J0IGNvbnZlcnRDdWJlaGVsaXhUb1JnYiBmcm9tICcuL2NvbnZlcnRDdWJlaGVsaXhUb1JnYi5qcyc7XG5pbXBvcnQgeyBkaWZmZXJlbmNlSHVlU2F0dXJhdGlvbiB9IGZyb20gJy4uL2RpZmZlcmVuY2UuanMnO1xuaW1wb3J0IHsgYXZlcmFnZUFuZ2xlIH0gZnJvbSAnLi4vYXZlcmFnZS5qcyc7XG5cbmNvbnN0IGRlZmluaXRpb24gPSB7XG5cdG1vZGU6ICdjdWJlaGVsaXgnLFxuXHRjaGFubmVsczogWydoJywgJ3MnLCAnbCcsICdhbHBoYSddLFxuXHRwYXJzZTogWyctLWN1YmVoZWxpeCddLFxuXHRzZXJpYWxpemU6ICctLWN1YmVoZWxpeCcsXG5cblx0cmFuZ2VzOiB7XG5cdFx0aDogWzAsIDM2MF0sXG5cdFx0czogWzAsIDQuNjE0XSxcblx0XHRsOiBbMCwgMV1cblx0fSxcblxuXHRmcm9tTW9kZToge1xuXHRcdHJnYjogY29udmVydFJnYlRvQ3ViZWhlbGl4XG5cdH0sXG5cblx0dG9Nb2RlOiB7XG5cdFx0cmdiOiBjb252ZXJ0Q3ViZWhlbGl4VG9SZ2Jcblx0fSxcblxuXHRpbnRlcnBvbGF0ZToge1xuXHRcdGg6IHtcblx0XHRcdHVzZTogaW50ZXJwb2xhdG9yTGluZWFyLFxuXHRcdFx0Zml4dXA6IGZpeHVwSHVlU2hvcnRlclxuXHRcdH0sXG5cdFx0czogaW50ZXJwb2xhdG9yTGluZWFyLFxuXHRcdGw6IGludGVycG9sYXRvckxpbmVhcixcblx0XHRhbHBoYToge1xuXHRcdFx0dXNlOiBpbnRlcnBvbGF0b3JMaW5lYXIsXG5cdFx0XHRmaXh1cDogZml4dXBBbHBoYVxuXHRcdH1cblx0fSxcblxuXHRkaWZmZXJlbmNlOiB7XG5cdFx0aDogZGlmZmVyZW5jZUh1ZVNhdHVyYXRpb25cblx0fSxcblxuXHRhdmVyYWdlOiB7XG5cdFx0aDogYXZlcmFnZUFuZ2xlXG5cdH1cbn07XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluaXRpb247XG4iLCAiaW1wb3J0IG5vcm1hbGl6ZUh1ZSBmcm9tICcuLi91dGlsL25vcm1hbGl6ZUh1ZS5qcyc7XG5cbi8qIFxuXHRSZWZlcmVuY2VzOiBcblx0XHQqIGh0dHBzOi8vZHJhZnRzLmNzc3dnLm9yZy9jc3MtY29sb3IvI2xhYi10by1sY2hcblx0XHQqIGh0dHBzOi8vZHJhZnRzLmNzc3dnLm9yZy9jc3MtY29sb3IvI2NvbG9yLWNvbnZlcnNpb24tY29kZVxuKi9cbmNvbnN0IGNvbnZlcnRMYWJUb0xjaCA9ICh7IGwsIGEsIGIsIGFscGhhIH0sIG1vZGUgPSAnbGNoJykgPT4ge1xuXHRpZiAoYSA9PT0gdW5kZWZpbmVkKSBhID0gMDtcblx0aWYgKGIgPT09IHVuZGVmaW5lZCkgYiA9IDA7XG5cdGxldCBjID0gTWF0aC5zcXJ0KGEgKiBhICsgYiAqIGIpO1xuXHRsZXQgcmVzID0geyBtb2RlLCBsLCBjIH07XG5cdGlmIChjKSByZXMuaCA9IG5vcm1hbGl6ZUh1ZSgoTWF0aC5hdGFuMihiLCBhKSAqIDE4MCkgLyBNYXRoLlBJKTtcblx0aWYgKGFscGhhICE9PSB1bmRlZmluZWQpIHJlcy5hbHBoYSA9IGFscGhhO1xuXHRyZXR1cm4gcmVzO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgY29udmVydExhYlRvTGNoO1xuIiwgIi8qIFxuXHRSZWZlcmVuY2VzOiBcblx0XHQqIGh0dHBzOi8vZHJhZnRzLmNzc3dnLm9yZy9jc3MtY29sb3IvI2xjaC10by1sYWJcblx0XHQqIGh0dHBzOi8vZHJhZnRzLmNzc3dnLm9yZy9jc3MtY29sb3IvI2NvbG9yLWNvbnZlcnNpb24tY29kZVxuKi9cbmNvbnN0IGNvbnZlcnRMY2hUb0xhYiA9ICh7IGwsIGMsIGgsIGFscGhhIH0sIG1vZGUgPSAnbGFiJykgPT4ge1xuXHRpZiAoaCA9PT0gdW5kZWZpbmVkKSBoID0gMDtcblx0bGV0IHJlcyA9IHtcblx0XHRtb2RlLFxuXHRcdGwsXG5cdFx0YTogYyA/IGMgKiBNYXRoLmNvcygoaCAvIDE4MCkgKiBNYXRoLlBJKSA6IDAsXG5cdFx0YjogYyA/IGMgKiBNYXRoLnNpbigoaCAvIDE4MCkgKiBNYXRoLlBJKSA6IDBcblx0fTtcblx0aWYgKGFscGhhICE9PSB1bmRlZmluZWQpIHJlcy5hbHBoYSA9IGFscGhhO1xuXHRyZXR1cm4gcmVzO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgY29udmVydExjaFRvTGFiO1xuIiwgImV4cG9ydCBjb25zdCBrID0gTWF0aC5wb3coMjksIDMpIC8gTWF0aC5wb3coMywgMyk7XG5leHBvcnQgY29uc3QgZSA9IE1hdGgucG93KDYsIDMpIC8gTWF0aC5wb3coMjksIDMpO1xuIiwgIi8qXG5cdFRoZSBYWVogdHJpc3RpbXVsdXMgdmFsdWVzICh3aGl0ZSBwb2ludClcblx0b2Ygc3RhbmRhcmQgaWxsdW1pbmFudHMgZm9yIHRoZSBDSUUgMTkzMSAyXHUwMEIwIFxuXHRzdGFuZGFyZCBvYnNlcnZlci5cblxuXHRTZWU6IGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL1N0YW5kYXJkX2lsbHVtaW5hbnRcbiAqL1xuXG5leHBvcnQgY29uc3QgRDUwID0ge1xuXHRYOiAwLjM0NTcgLyAwLjM1ODUsXG5cdFk6IDEsXG5cdFo6ICgxIC0gMC4zNDU3IC0gMC4zNTg1KSAvIDAuMzU4NVxufTtcblxuZXhwb3J0IGNvbnN0IEQ2NSA9IHtcblx0WDogMC4zMTI3IC8gMC4zMjksXG5cdFk6IDEsXG5cdFo6ICgxIC0gMC4zMTI3IC0gMC4zMjkpIC8gMC4zMjlcbn07XG5cbmV4cG9ydCBjb25zdCBrID0gTWF0aC5wb3coMjksIDMpIC8gTWF0aC5wb3coMywgMyk7XG5leHBvcnQgY29uc3QgZSA9IE1hdGgucG93KDYsIDMpIC8gTWF0aC5wb3coMjksIDMpO1xuIiwgImltcG9ydCB7IGssIGUgfSBmcm9tICcuLi94eXo2NS9jb25zdGFudHMuanMnO1xuaW1wb3J0IHsgRDY1IH0gZnJvbSAnLi4vY29uc3RhbnRzLmpzJztcblxubGV0IGZuID0gdiA9PiAoTWF0aC5wb3codiwgMykgPiBlID8gTWF0aC5wb3codiwgMykgOiAoMTE2ICogdiAtIDE2KSAvIGspO1xuXG5jb25zdCBjb252ZXJ0TGFiNjVUb1h5ejY1ID0gKHsgbCwgYSwgYiwgYWxwaGEgfSkgPT4ge1xuXHRpZiAobCA9PT0gdW5kZWZpbmVkKSBsID0gMDtcblx0aWYgKGEgPT09IHVuZGVmaW5lZCkgYSA9IDA7XG5cdGlmIChiID09PSB1bmRlZmluZWQpIGIgPSAwO1xuXG5cdGxldCBmeSA9IChsICsgMTYpIC8gMTE2O1xuXHRsZXQgZnggPSBhIC8gNTAwICsgZnk7XG5cdGxldCBmeiA9IGZ5IC0gYiAvIDIwMDtcblxuXHRsZXQgcmVzID0ge1xuXHRcdG1vZGU6ICd4eXo2NScsXG5cdFx0eDogZm4oZngpICogRDY1LlgsXG5cdFx0eTogZm4oZnkpICogRDY1LlksXG5cdFx0ejogZm4oZnopICogRDY1Llpcblx0fTtcblxuXHRpZiAoYWxwaGEgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJlcy5hbHBoYSA9IGFscGhhO1xuXHR9XG5cblx0cmV0dXJuIHJlcztcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNvbnZlcnRMYWI2NVRvWHl6NjU7XG4iLCAiaW1wb3J0IGNvbnZlcnRMYWI2NVRvWHl6NjUgZnJvbSAnLi9jb252ZXJ0TGFiNjVUb1h5ejY1LmpzJztcbmltcG9ydCBjb252ZXJ0WHl6NjVUb1JnYiBmcm9tICcuLi94eXo2NS9jb252ZXJ0WHl6NjVUb1JnYi5qcyc7XG5cbmNvbnN0IGNvbnZlcnRMYWI2NVRvUmdiID0gbGFiID0+IGNvbnZlcnRYeXo2NVRvUmdiKGNvbnZlcnRMYWI2NVRvWHl6NjUobGFiKSk7XG5cbmV4cG9ydCBkZWZhdWx0IGNvbnZlcnRMYWI2NVRvUmdiO1xuIiwgImltcG9ydCB7IGssIGUgfSBmcm9tICcuLi94eXo2NS9jb25zdGFudHMuanMnO1xuaW1wb3J0IHsgRDY1IH0gZnJvbSAnLi4vY29uc3RhbnRzLmpzJztcblxuY29uc3QgZiA9IHZhbHVlID0+ICh2YWx1ZSA+IGUgPyBNYXRoLmNicnQodmFsdWUpIDogKGsgKiB2YWx1ZSArIDE2KSAvIDExNik7XG5cbmNvbnN0IGNvbnZlcnRYeXo2NVRvTGFiNjUgPSAoeyB4LCB5LCB6LCBhbHBoYSB9KSA9PiB7XG5cdGlmICh4ID09PSB1bmRlZmluZWQpIHggPSAwO1xuXHRpZiAoeSA9PT0gdW5kZWZpbmVkKSB5ID0gMDtcblx0aWYgKHogPT09IHVuZGVmaW5lZCkgeiA9IDA7XG5cdGxldCBmMCA9IGYoeCAvIEQ2NS5YKTtcblx0bGV0IGYxID0gZih5IC8gRDY1LlkpO1xuXHRsZXQgZjIgPSBmKHogLyBENjUuWik7XG5cblx0bGV0IHJlcyA9IHtcblx0XHRtb2RlOiAnbGFiNjUnLFxuXHRcdGw6IDExNiAqIGYxIC0gMTYsXG5cdFx0YTogNTAwICogKGYwIC0gZjEpLFxuXHRcdGI6IDIwMCAqIChmMSAtIGYyKVxuXHR9O1xuXG5cdGlmIChhbHBoYSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmVzLmFscGhhID0gYWxwaGE7XG5cdH1cblxuXHRyZXR1cm4gcmVzO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgY29udmVydFh5ejY1VG9MYWI2NTtcbiIsICJpbXBvcnQgY29udmVydFJnYlRvWHl6NjUgZnJvbSAnLi4veHl6NjUvY29udmVydFJnYlRvWHl6NjUuanMnO1xuaW1wb3J0IGNvbnZlcnRYeXo2NVRvTGFiNjUgZnJvbSAnLi9jb252ZXJ0WHl6NjVUb0xhYjY1LmpzJztcblxuY29uc3QgY29udmVydFJnYlRvTGFiNjUgPSByZ2IgPT4ge1xuXHRsZXQgcmVzID0gY29udmVydFh5ejY1VG9MYWI2NShjb252ZXJ0UmdiVG9YeXo2NShyZ2IpKTtcblxuXHQvLyBGaXhlcyBhY2hyb21hdGljIFJHQiBjb2xvcnMgaGF2aW5nIGEgX3NsaWdodF8gY2hyb21hIGR1ZSB0byBmbG9hdGluZy1wb2ludCBlcnJvcnNcblx0Ly8gYW5kIGFwcHJveGltYXRlZCBjb21wdXRhdGlvbnMgaW4gc1JHQiA8LT4gQ0lFTGFiLlxuXHQvLyBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9kMy9kMy1jb2xvci9wdWxsLzQ2XG5cdGlmIChyZ2IuciA9PT0gcmdiLmIgJiYgcmdiLmIgPT09IHJnYi5nKSB7XG5cdFx0cmVzLmEgPSByZXMuYiA9IDA7XG5cdH1cblx0cmV0dXJuIHJlcztcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNvbnZlcnRSZ2JUb0xhYjY1O1xuIiwgImV4cG9ydCBjb25zdCBrRSA9IDE7XG5leHBvcnQgY29uc3Qga0NIID0gMTtcbmV4cG9ydCBjb25zdCBcdTAzQjggPSAoMjYgLyAxODApICogTWF0aC5QSTtcbmV4cG9ydCBjb25zdCBjb3NcdTAzQjggPSBNYXRoLmNvcyhcdTAzQjgpO1xuZXhwb3J0IGNvbnN0IHNpblx1MDNCOCA9IE1hdGguc2luKFx1MDNCOCk7XG5leHBvcnQgY29uc3QgZmFjdG9yID0gMTAwIC8gTWF0aC5sb2coMTM5IC8gMTAwKTsgLy8gfiAzMDMuNjdcbiIsICJpbXBvcnQgeyBrQ0gsIGtFLCBzaW5cdTAzQjgsIGNvc1x1MDNCOCwgXHUwM0I4LCBmYWN0b3IgfSBmcm9tICcuL2NvbnN0YW50cy5qcyc7XG5cbi8qXG5cdENvbnZlcnQgRElOOTlvIExDaCB0byBDSUVMYWIgRDY1XG5cdC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gKi9cblxuY29uc3QgY29udmVydERsY2hUb0xhYjY1ID0gKHsgbCwgYywgaCwgYWxwaGEgfSkgPT4ge1xuXHRpZiAobCA9PT0gdW5kZWZpbmVkKSBsID0gMDtcblx0aWYgKGMgPT09IHVuZGVmaW5lZCkgYyA9IDA7XG5cdGlmIChoID09PSB1bmRlZmluZWQpIGggPSAwO1xuXHRsZXQgcmVzID0ge1xuXHRcdG1vZGU6ICdsYWI2NScsXG5cdFx0bDogKE1hdGguZXhwKChsICoga0UpIC8gZmFjdG9yKSAtIDEpIC8gMC4wMDM5XG5cdH07XG5cblx0bGV0IEcgPSAoTWF0aC5leHAoMC4wNDM1ICogYyAqIGtDSCAqIGtFKSAtIDEpIC8gMC4wNzU7XG5cdGxldCBlID0gRyAqIE1hdGguY29zKChoIC8gMTgwKSAqIE1hdGguUEkgLSBcdTAzQjgpO1xuXHRsZXQgZiA9IEcgKiBNYXRoLnNpbigoaCAvIDE4MCkgKiBNYXRoLlBJIC0gXHUwM0I4KTtcblx0cmVzLmEgPSBlICogY29zXHUwM0I4IC0gKGYgLyAwLjgzKSAqIHNpblx1MDNCODtcblx0cmVzLmIgPSBlICogc2luXHUwM0I4ICsgKGYgLyAwLjgzKSAqIGNvc1x1MDNCODtcblxuXHRpZiAoYWxwaGEgIT09IHVuZGVmaW5lZCkgcmVzLmFscGhhID0gYWxwaGE7XG5cdHJldHVybiByZXM7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBjb252ZXJ0RGxjaFRvTGFiNjU7XG4iLCAiaW1wb3J0IHsga0NILCBrRSwgc2luXHUwM0I4LCBjb3NcdTAzQjgsIFx1MDNCOCwgZmFjdG9yIH0gZnJvbSAnLi9jb25zdGFudHMuanMnO1xuaW1wb3J0IG5vcm1hbGl6ZUh1ZSBmcm9tICcuLi91dGlsL25vcm1hbGl6ZUh1ZS5qcyc7XG5cbi8qXG5cdENvbnZlcnQgQ0lFTGFiIEQ2NSB0byBESU45OW8gTENoXG5cdD09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gKi9cblxuY29uc3QgY29udmVydExhYjY1VG9EbGNoID0gKHsgbCwgYSwgYiwgYWxwaGEgfSkgPT4ge1xuXHRpZiAobCA9PT0gdW5kZWZpbmVkKSBsID0gMDtcblx0aWYgKGEgPT09IHVuZGVmaW5lZCkgYSA9IDA7XG5cdGlmIChiID09PSB1bmRlZmluZWQpIGIgPSAwO1xuXHRsZXQgZSA9IGEgKiBjb3NcdTAzQjggKyBiICogc2luXHUwM0I4O1xuXHRsZXQgZiA9IDAuODMgKiAoYiAqIGNvc1x1MDNCOCAtIGEgKiBzaW5cdTAzQjgpO1xuXHRsZXQgRyA9IE1hdGguc3FydChlICogZSArIGYgKiBmKTtcblx0bGV0IHJlcyA9IHtcblx0XHRtb2RlOiAnZGxjaCcsXG5cdFx0bDogKGZhY3RvciAvIGtFKSAqIE1hdGgubG9nKDEgKyAwLjAwMzkgKiBsKSxcblx0XHRjOiBNYXRoLmxvZygxICsgMC4wNzUgKiBHKSAvICgwLjA0MzUgKiBrQ0ggKiBrRSlcblx0fTtcblxuXHRpZiAocmVzLmMpIHtcblx0XHRyZXMuaCA9IG5vcm1hbGl6ZUh1ZSgoKE1hdGguYXRhbjIoZiwgZSkgKyBcdTAzQjgpIC8gTWF0aC5QSSkgKiAxODApO1xuXHR9XG5cblx0aWYgKGFscGhhICE9PSB1bmRlZmluZWQpIHJlcy5hbHBoYSA9IGFscGhhO1xuXHRyZXR1cm4gcmVzO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgY29udmVydExhYjY1VG9EbGNoO1xuIiwgImltcG9ydCBjb252ZXJ0TGFiVG9MY2ggZnJvbSAnLi4vbGNoL2NvbnZlcnRMYWJUb0xjaC5qcyc7XG5pbXBvcnQgY29udmVydExjaFRvTGFiIGZyb20gJy4uL2xjaC9jb252ZXJ0TGNoVG9MYWIuanMnO1xuaW1wb3J0IGNvbnZlcnRMYWI2NVRvUmdiIGZyb20gJy4uL2xhYjY1L2NvbnZlcnRMYWI2NVRvUmdiLmpzJztcbmltcG9ydCBjb252ZXJ0UmdiVG9MYWI2NSBmcm9tICcuLi9sYWI2NS9jb252ZXJ0UmdiVG9MYWI2NS5qcyc7XG5pbXBvcnQgY29udmVydERsY2hUb0xhYjY1IGZyb20gJy4uL2RsY2gvY29udmVydERsY2hUb0xhYjY1LmpzJztcbmltcG9ydCBjb252ZXJ0TGFiNjVUb0RsY2ggZnJvbSAnLi4vZGxjaC9jb252ZXJ0TGFiNjVUb0RsY2guanMnO1xuaW1wb3J0IHsgaW50ZXJwb2xhdG9yTGluZWFyIH0gZnJvbSAnLi4vaW50ZXJwb2xhdGUvbGluZWFyLmpzJztcbmltcG9ydCB7IGZpeHVwQWxwaGEgfSBmcm9tICcuLi9maXh1cC9hbHBoYS5qcyc7XG5cbmNvbnN0IGNvbnZlcnREbGFiVG9MYWI2NSA9IGMgPT4gY29udmVydERsY2hUb0xhYjY1KGNvbnZlcnRMYWJUb0xjaChjLCAnZGxjaCcpKTtcbmNvbnN0IGNvbnZlcnRMYWI2NVRvRGxhYiA9IGMgPT4gY29udmVydExjaFRvTGFiKGNvbnZlcnRMYWI2NVRvRGxjaChjKSwgJ2RsYWInKTtcblxuY29uc3QgZGVmaW5pdGlvbiA9IHtcblx0bW9kZTogJ2RsYWInLFxuXG5cdHBhcnNlOiBbJy0tZGluOTlvLWxhYiddLFxuXHRzZXJpYWxpemU6ICctLWRpbjk5by1sYWInLFxuXG5cdHRvTW9kZToge1xuXHRcdGxhYjY1OiBjb252ZXJ0RGxhYlRvTGFiNjUsXG5cdFx0cmdiOiBjID0+IGNvbnZlcnRMYWI2NVRvUmdiKGNvbnZlcnREbGFiVG9MYWI2NShjKSlcblx0fSxcblxuXHRmcm9tTW9kZToge1xuXHRcdGxhYjY1OiBjb252ZXJ0TGFiNjVUb0RsYWIsXG5cdFx0cmdiOiBjID0+IGNvbnZlcnRMYWI2NVRvRGxhYihjb252ZXJ0UmdiVG9MYWI2NShjKSlcblx0fSxcblxuXHRjaGFubmVsczogWydsJywgJ2EnLCAnYicsICdhbHBoYSddLFxuXG5cdHJhbmdlczoge1xuXHRcdGw6IFswLCAxMDBdLFxuXHRcdGE6IFstNDAuMDksIDQ1LjUwMV0sXG5cdFx0YjogWy00MC40NjksIDQ0LjM0NF1cblx0fSxcblxuXHRpbnRlcnBvbGF0ZToge1xuXHRcdGw6IGludGVycG9sYXRvckxpbmVhcixcblx0XHRhOiBpbnRlcnBvbGF0b3JMaW5lYXIsXG5cdFx0YjogaW50ZXJwb2xhdG9yTGluZWFyLFxuXHRcdGFscGhhOiB7XG5cdFx0XHR1c2U6IGludGVycG9sYXRvckxpbmVhcixcblx0XHRcdGZpeHVwOiBmaXh1cEFscGhhXG5cdFx0fVxuXHR9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbml0aW9uO1xuIiwgImltcG9ydCBjb252ZXJ0TGFiVG9MY2ggZnJvbSAnLi4vbGNoL2NvbnZlcnRMYWJUb0xjaC5qcyc7XG5pbXBvcnQgY29udmVydExjaFRvTGFiIGZyb20gJy4uL2xjaC9jb252ZXJ0TGNoVG9MYWIuanMnO1xuaW1wb3J0IGNvbnZlcnREbGNoVG9MYWI2NSBmcm9tICcuL2NvbnZlcnREbGNoVG9MYWI2NS5qcyc7XG5pbXBvcnQgY29udmVydExhYjY1VG9EbGNoIGZyb20gJy4vY29udmVydExhYjY1VG9EbGNoLmpzJztcbmltcG9ydCBjb252ZXJ0TGFiNjVUb1JnYiBmcm9tICcuLi9sYWI2NS9jb252ZXJ0TGFiNjVUb1JnYi5qcyc7XG5pbXBvcnQgY29udmVydFJnYlRvTGFiNjUgZnJvbSAnLi4vbGFiNjUvY29udmVydFJnYlRvTGFiNjUuanMnO1xuXG5pbXBvcnQgeyBmaXh1cEh1ZVNob3J0ZXIgfSBmcm9tICcuLi9maXh1cC9odWUuanMnO1xuaW1wb3J0IHsgZml4dXBBbHBoYSB9IGZyb20gJy4uL2ZpeHVwL2FscGhhLmpzJztcbmltcG9ydCB7IGludGVycG9sYXRvckxpbmVhciB9IGZyb20gJy4uL2ludGVycG9sYXRlL2xpbmVhci5qcyc7XG5pbXBvcnQgeyBkaWZmZXJlbmNlSHVlQ2hyb21hIH0gZnJvbSAnLi4vZGlmZmVyZW5jZS5qcyc7XG5pbXBvcnQgeyBhdmVyYWdlQW5nbGUgfSBmcm9tICcuLi9hdmVyYWdlLmpzJztcblxuY29uc3QgZGVmaW5pdGlvbiA9IHtcblx0bW9kZTogJ2RsY2gnLFxuXG5cdHBhcnNlOiBbJy0tZGluOTlvLWxjaCddLFxuXHRzZXJpYWxpemU6ICctLWRpbjk5by1sY2gnLFxuXG5cdHRvTW9kZToge1xuXHRcdGxhYjY1OiBjb252ZXJ0RGxjaFRvTGFiNjUsXG5cdFx0ZGxhYjogYyA9PiBjb252ZXJ0TGNoVG9MYWIoYywgJ2RsYWInKSxcblx0XHRyZ2I6IGMgPT4gY29udmVydExhYjY1VG9SZ2IoY29udmVydERsY2hUb0xhYjY1KGMpKVxuXHR9LFxuXG5cdGZyb21Nb2RlOiB7XG5cdFx0bGFiNjU6IGNvbnZlcnRMYWI2NVRvRGxjaCxcblx0XHRkbGFiOiBjID0+IGNvbnZlcnRMYWJUb0xjaChjLCAnZGxjaCcpLFxuXHRcdHJnYjogYyA9PiBjb252ZXJ0TGFiNjVUb0RsY2goY29udmVydFJnYlRvTGFiNjUoYykpXG5cdH0sXG5cblx0Y2hhbm5lbHM6IFsnbCcsICdjJywgJ2gnLCAnYWxwaGEnXSxcblxuXHRyYW5nZXM6IHtcblx0XHRsOiBbMCwgMTAwXSxcblx0XHRjOiBbMCwgNTEuNDg0XSxcblx0XHRoOiBbMCwgMzYwXVxuXHR9LFxuXG5cdGludGVycG9sYXRlOiB7XG5cdFx0bDogaW50ZXJwb2xhdG9yTGluZWFyLFxuXHRcdGM6IGludGVycG9sYXRvckxpbmVhcixcblx0XHRoOiB7XG5cdFx0XHR1c2U6IGludGVycG9sYXRvckxpbmVhcixcblx0XHRcdGZpeHVwOiBmaXh1cEh1ZVNob3J0ZXJcblx0XHR9LFxuXHRcdGFscGhhOiB7XG5cdFx0XHR1c2U6IGludGVycG9sYXRvckxpbmVhcixcblx0XHRcdGZpeHVwOiBmaXh1cEFscGhhXG5cdFx0fVxuXHR9LFxuXG5cdGRpZmZlcmVuY2U6IHtcblx0XHRoOiBkaWZmZXJlbmNlSHVlQ2hyb21hXG5cdH0sXG5cblx0YXZlcmFnZToge1xuXHRcdGg6IGF2ZXJhZ2VBbmdsZVxuXHR9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbml0aW9uO1xuIiwgImltcG9ydCBub3JtYWxpemVIdWUgZnJvbSAnLi4vdXRpbC9ub3JtYWxpemVIdWUuanMnO1xuXG4vLyBCYXNlZCBvbjogaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvSFNMX2FuZF9IU1YjQ29udmVydGluZ190b19SR0JcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gY29udmVydEhzaVRvUmdiKHsgaCwgcywgaSwgYWxwaGEgfSkge1xuXHRoID0gbm9ybWFsaXplSHVlKGggIT09IHVuZGVmaW5lZCA/IGggOiAwKTtcblx0aWYgKHMgPT09IHVuZGVmaW5lZCkgcyA9IDA7XG5cdGlmIChpID09PSB1bmRlZmluZWQpIGkgPSAwO1xuXHRsZXQgZiA9IE1hdGguYWJzKCgoaCAvIDYwKSAlIDIpIC0gMSk7XG5cdGxldCByZXM7XG5cdHN3aXRjaCAoTWF0aC5mbG9vcihoIC8gNjApKSB7XG5cdFx0Y2FzZSAwOlxuXHRcdFx0cmVzID0ge1xuXHRcdFx0XHRyOiBpICogKDEgKyBzICogKDMgLyAoMiAtIGYpIC0gMSkpLFxuXHRcdFx0XHRnOiBpICogKDEgKyBzICogKCgzICogKDEgLSBmKSkgLyAoMiAtIGYpIC0gMSkpLFxuXHRcdFx0XHRiOiBpICogKDEgLSBzKVxuXHRcdFx0fTtcblx0XHRcdGJyZWFrO1xuXHRcdGNhc2UgMTpcblx0XHRcdHJlcyA9IHtcblx0XHRcdFx0cjogaSAqICgxICsgcyAqICgoMyAqICgxIC0gZikpIC8gKDIgLSBmKSAtIDEpKSxcblx0XHRcdFx0ZzogaSAqICgxICsgcyAqICgzIC8gKDIgLSBmKSAtIDEpKSxcblx0XHRcdFx0YjogaSAqICgxIC0gcylcblx0XHRcdH07XG5cdFx0XHRicmVhaztcblx0XHRjYXNlIDI6XG5cdFx0XHRyZXMgPSB7XG5cdFx0XHRcdHI6IGkgKiAoMSAtIHMpLFxuXHRcdFx0XHRnOiBpICogKDEgKyBzICogKDMgLyAoMiAtIGYpIC0gMSkpLFxuXHRcdFx0XHRiOiBpICogKDEgKyBzICogKCgzICogKDEgLSBmKSkgLyAoMiAtIGYpIC0gMSkpXG5cdFx0XHR9O1xuXHRcdFx0YnJlYWs7XG5cdFx0Y2FzZSAzOlxuXHRcdFx0cmVzID0ge1xuXHRcdFx0XHRyOiBpICogKDEgLSBzKSxcblx0XHRcdFx0ZzogaSAqICgxICsgcyAqICgoMyAqICgxIC0gZikpIC8gKDIgLSBmKSAtIDEpKSxcblx0XHRcdFx0YjogaSAqICgxICsgcyAqICgzIC8gKDIgLSBmKSAtIDEpKVxuXHRcdFx0fTtcblx0XHRcdGJyZWFrO1xuXHRcdGNhc2UgNDpcblx0XHRcdHJlcyA9IHtcblx0XHRcdFx0cjogaSAqICgxICsgcyAqICgoMyAqICgxIC0gZikpIC8gKDIgLSBmKSAtIDEpKSxcblx0XHRcdFx0ZzogaSAqICgxIC0gcyksXG5cdFx0XHRcdGI6IGkgKiAoMSArIHMgKiAoMyAvICgyIC0gZikgLSAxKSlcblx0XHRcdH07XG5cdFx0XHRicmVhaztcblx0XHRjYXNlIDU6XG5cdFx0XHRyZXMgPSB7XG5cdFx0XHRcdHI6IGkgKiAoMSArIHMgKiAoMyAvICgyIC0gZikgLSAxKSksXG5cdFx0XHRcdGc6IGkgKiAoMSAtIHMpLFxuXHRcdFx0XHRiOiBpICogKDEgKyBzICogKCgzICogKDEgLSBmKSkgLyAoMiAtIGYpIC0gMSkpXG5cdFx0XHR9O1xuXHRcdFx0YnJlYWs7XG5cdFx0ZGVmYXVsdDpcblx0XHRcdHJlcyA9IHsgcjogaSAqICgxIC0gcyksIGc6IGkgKiAoMSAtIHMpLCBiOiBpICogKDEgLSBzKSB9O1xuXHR9XG5cblx0cmVzLm1vZGUgPSAncmdiJztcblx0aWYgKGFscGhhICE9PSB1bmRlZmluZWQpIHJlcy5hbHBoYSA9IGFscGhhO1xuXHRyZXR1cm4gcmVzO1xufVxuIiwgIi8vIEJhc2VkIG9uOiBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9IU0xfYW5kX0hTViNGb3JtYWxfZGVyaXZhdGlvblxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBjb252ZXJ0UmdiVG9Ic2koeyByLCBnLCBiLCBhbHBoYSB9KSB7XG5cdGlmIChyID09PSB1bmRlZmluZWQpIHIgPSAwO1xuXHRpZiAoZyA9PT0gdW5kZWZpbmVkKSBnID0gMDtcblx0aWYgKGIgPT09IHVuZGVmaW5lZCkgYiA9IDA7XG5cdGxldCBNID0gTWF0aC5tYXgociwgZywgYiksXG5cdFx0bSA9IE1hdGgubWluKHIsIGcsIGIpO1xuXHRsZXQgcmVzID0ge1xuXHRcdG1vZGU6ICdoc2knLFxuXHRcdHM6IHIgKyBnICsgYiA9PT0gMCA/IDAgOiAxIC0gKDMgKiBtKSAvIChyICsgZyArIGIpLFxuXHRcdGk6IChyICsgZyArIGIpIC8gM1xuXHR9O1xuXHRpZiAoTSAtIG0gIT09IDApXG5cdFx0cmVzLmggPVxuXHRcdFx0KE0gPT09IHJcblx0XHRcdFx0PyAoZyAtIGIpIC8gKE0gLSBtKSArIChnIDwgYikgKiA2XG5cdFx0XHRcdDogTSA9PT0gZ1xuXHRcdFx0XHQ/IChiIC0gcikgLyAoTSAtIG0pICsgMlxuXHRcdFx0XHQ6IChyIC0gZykgLyAoTSAtIG0pICsgNCkgKiA2MDtcblx0aWYgKGFscGhhICE9PSB1bmRlZmluZWQpIHJlcy5hbHBoYSA9IGFscGhhO1xuXHRyZXR1cm4gcmVzO1xufVxuIiwgImltcG9ydCBjb252ZXJ0SHNpVG9SZ2IgZnJvbSAnLi9jb252ZXJ0SHNpVG9SZ2IuanMnO1xuaW1wb3J0IGNvbnZlcnRSZ2JUb0hzaSBmcm9tICcuL2NvbnZlcnRSZ2JUb0hzaS5qcyc7XG5pbXBvcnQgeyBmaXh1cEh1ZVNob3J0ZXIgfSBmcm9tICcuLi9maXh1cC9odWUuanMnO1xuaW1wb3J0IHsgZml4dXBBbHBoYSB9IGZyb20gJy4uL2ZpeHVwL2FscGhhLmpzJztcbmltcG9ydCB7IGludGVycG9sYXRvckxpbmVhciB9IGZyb20gJy4uL2ludGVycG9sYXRlL2xpbmVhci5qcyc7XG5pbXBvcnQgeyBkaWZmZXJlbmNlSHVlU2F0dXJhdGlvbiB9IGZyb20gJy4uL2RpZmZlcmVuY2UuanMnO1xuaW1wb3J0IHsgYXZlcmFnZUFuZ2xlIH0gZnJvbSAnLi4vYXZlcmFnZS5qcyc7XG5cbmNvbnN0IGRlZmluaXRpb24gPSB7XG5cdG1vZGU6ICdoc2knLFxuXG5cdHRvTW9kZToge1xuXHRcdHJnYjogY29udmVydEhzaVRvUmdiXG5cdH0sXG5cblx0cGFyc2U6IFsnLS1oc2knXSxcblx0c2VyaWFsaXplOiAnLS1oc2knLFxuXG5cdGZyb21Nb2RlOiB7XG5cdFx0cmdiOiBjb252ZXJ0UmdiVG9Ic2lcblx0fSxcblxuXHRjaGFubmVsczogWydoJywgJ3MnLCAnaScsICdhbHBoYSddLFxuXG5cdHJhbmdlczoge1xuXHRcdGg6IFswLCAzNjBdXG5cdH0sXG5cblx0Z2FtdXQ6ICdyZ2InLFxuXG5cdGludGVycG9sYXRlOiB7XG5cdFx0aDogeyB1c2U6IGludGVycG9sYXRvckxpbmVhciwgZml4dXA6IGZpeHVwSHVlU2hvcnRlciB9LFxuXHRcdHM6IGludGVycG9sYXRvckxpbmVhcixcblx0XHRpOiBpbnRlcnBvbGF0b3JMaW5lYXIsXG5cdFx0YWxwaGE6IHsgdXNlOiBpbnRlcnBvbGF0b3JMaW5lYXIsIGZpeHVwOiBmaXh1cEFscGhhIH1cblx0fSxcblxuXHRkaWZmZXJlbmNlOiB7XG5cdFx0aDogZGlmZmVyZW5jZUh1ZVNhdHVyYXRpb25cblx0fSxcblxuXHRhdmVyYWdlOiB7XG5cdFx0aDogYXZlcmFnZUFuZ2xlXG5cdH1cbn07XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluaXRpb247XG4iLCAiaW1wb3J0IG5vcm1hbGl6ZUh1ZSBmcm9tICcuLi91dGlsL25vcm1hbGl6ZUh1ZS5qcyc7XG4vLyBCYXNlZCBvbjogaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvSFNMX2FuZF9IU1YjQ29udmVydGluZ190b19SR0JcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gY29udmVydEhzbFRvUmdiKHsgaCwgcywgbCwgYWxwaGEgfSkge1xuXHRoID0gbm9ybWFsaXplSHVlKGggIT09IHVuZGVmaW5lZCA/IGggOiAwKTtcblx0aWYgKHMgPT09IHVuZGVmaW5lZCkgcyA9IDA7XG5cdGlmIChsID09PSB1bmRlZmluZWQpIGwgPSAwO1xuXHRsZXQgbTEgPSBsICsgcyAqIChsIDwgMC41ID8gbCA6IDEgLSBsKTtcblx0bGV0IG0yID0gbTEgLSAobTEgLSBsKSAqIDIgKiBNYXRoLmFicygoKGggLyA2MCkgJSAyKSAtIDEpO1xuXHRsZXQgcmVzO1xuXHRzd2l0Y2ggKE1hdGguZmxvb3IoaCAvIDYwKSkge1xuXHRcdGNhc2UgMDpcblx0XHRcdHJlcyA9IHsgcjogbTEsIGc6IG0yLCBiOiAyICogbCAtIG0xIH07XG5cdFx0XHRicmVhaztcblx0XHRjYXNlIDE6XG5cdFx0XHRyZXMgPSB7IHI6IG0yLCBnOiBtMSwgYjogMiAqIGwgLSBtMSB9O1xuXHRcdFx0YnJlYWs7XG5cdFx0Y2FzZSAyOlxuXHRcdFx0cmVzID0geyByOiAyICogbCAtIG0xLCBnOiBtMSwgYjogbTIgfTtcblx0XHRcdGJyZWFrO1xuXHRcdGNhc2UgMzpcblx0XHRcdHJlcyA9IHsgcjogMiAqIGwgLSBtMSwgZzogbTIsIGI6IG0xIH07XG5cdFx0XHRicmVhaztcblx0XHRjYXNlIDQ6XG5cdFx0XHRyZXMgPSB7IHI6IG0yLCBnOiAyICogbCAtIG0xLCBiOiBtMSB9O1xuXHRcdFx0YnJlYWs7XG5cdFx0Y2FzZSA1OlxuXHRcdFx0cmVzID0geyByOiBtMSwgZzogMiAqIGwgLSBtMSwgYjogbTIgfTtcblx0XHRcdGJyZWFrO1xuXHRcdGRlZmF1bHQ6XG5cdFx0XHRyZXMgPSB7IHI6IDIgKiBsIC0gbTEsIGc6IDIgKiBsIC0gbTEsIGI6IDIgKiBsIC0gbTEgfTtcblx0fVxuXHRyZXMubW9kZSA9ICdyZ2InO1xuXHRpZiAoYWxwaGEgIT09IHVuZGVmaW5lZCkgcmVzLmFscGhhID0gYWxwaGE7XG5cdHJldHVybiByZXM7XG59XG4iLCAiLy8gQmFzZWQgb246IGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0hTTF9hbmRfSFNWI0Zvcm1hbF9kZXJpdmF0aW9uXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGNvbnZlcnRSZ2JUb0hzbCh7IHIsIGcsIGIsIGFscGhhIH0pIHtcblx0aWYgKHIgPT09IHVuZGVmaW5lZCkgciA9IDA7XG5cdGlmIChnID09PSB1bmRlZmluZWQpIGcgPSAwO1xuXHRpZiAoYiA9PT0gdW5kZWZpbmVkKSBiID0gMDtcblx0bGV0IE0gPSBNYXRoLm1heChyLCBnLCBiKSxcblx0XHRtID0gTWF0aC5taW4ociwgZywgYik7XG5cdGxldCByZXMgPSB7XG5cdFx0bW9kZTogJ2hzbCcsXG5cdFx0czogTSA9PT0gbSA/IDAgOiAoTSAtIG0pIC8gKDEgLSBNYXRoLmFicyhNICsgbSAtIDEpKSxcblx0XHRsOiAwLjUgKiAoTSArIG0pXG5cdH07XG5cdGlmIChNIC0gbSAhPT0gMClcblx0XHRyZXMuaCA9XG5cdFx0XHQoTSA9PT0gclxuXHRcdFx0XHQ/IChnIC0gYikgLyAoTSAtIG0pICsgKGcgPCBiKSAqIDZcblx0XHRcdFx0OiBNID09PSBnXG5cdFx0XHRcdD8gKGIgLSByKSAvIChNIC0gbSkgKyAyXG5cdFx0XHRcdDogKHIgLSBnKSAvIChNIC0gbSkgKyA0KSAqIDYwO1xuXHRpZiAoYWxwaGEgIT09IHVuZGVmaW5lZCkgcmVzLmFscGhhID0gYWxwaGE7XG5cdHJldHVybiByZXM7XG59XG4iLCAiY29uc3QgaHVlVG9EZWcgPSAodmFsLCB1bml0KSA9PiB7XG5cdHN3aXRjaCAodW5pdCkge1xuXHRcdGNhc2UgJ2RlZyc6XG5cdFx0XHRyZXR1cm4gK3ZhbDtcblx0XHRjYXNlICdyYWQnOlxuXHRcdFx0cmV0dXJuICh2YWwgLyBNYXRoLlBJKSAqIDE4MDtcblx0XHRjYXNlICdncmFkJzpcblx0XHRcdHJldHVybiAodmFsIC8gMTApICogOTtcblx0XHRjYXNlICd0dXJuJzpcblx0XHRcdHJldHVybiB2YWwgKiAzNjA7XG5cdH1cbn07XG5cbmV4cG9ydCBkZWZhdWx0IGh1ZVRvRGVnO1xuIiwgImltcG9ydCBodWVUb0RlZyBmcm9tICcuLi91dGlsL2h1ZS5qcyc7XG5pbXBvcnQgeyBodWUsIHBlciwgbnVtX3BlciwgYyB9IGZyb20gJy4uL3V0aWwvcmVnZXguanMnO1xuXG4vKlxuXHRoc2woKSByZWd1bGFyIGV4cHJlc3Npb25zIGZvciBsZWdhY3kgZm9ybWF0XG5cdFJlZmVyZW5jZTogaHR0cHM6Ly9kcmFmdHMuY3Nzd2cub3JnL2Nzcy1jb2xvci8jdGhlLWhzbC1ub3RhdGlvblxuICovXG5jb25zdCBoc2xfb2xkID0gbmV3IFJlZ0V4cChcblx0YF5oc2xhP1xcXFwoXFxcXHMqJHtodWV9JHtjfSR7cGVyfSR7Y30ke3Blcn1cXFxccyooPzosXFxcXHMqJHtudW1fcGVyfVxcXFxzKik/XFxcXCkkYFxuKTtcblxuY29uc3QgcGFyc2VIc2xMZWdhY3kgPSBjb2xvciA9PiB7XG5cdGxldCBtYXRjaCA9IGNvbG9yLm1hdGNoKGhzbF9vbGQpO1xuXHRpZiAoIW1hdGNoKSByZXR1cm47XG5cdGxldCByZXMgPSB7IG1vZGU6ICdoc2wnIH07XG5cblx0aWYgKG1hdGNoWzNdICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXMuaCA9ICttYXRjaFszXTtcblx0fSBlbHNlIGlmIChtYXRjaFsxXSAhPT0gdW5kZWZpbmVkICYmIG1hdGNoWzJdICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXMuaCA9IGh1ZVRvRGVnKG1hdGNoWzFdLCBtYXRjaFsyXSk7XG5cdH1cblxuXHRpZiAobWF0Y2hbNF0gIT09IHVuZGVmaW5lZCkge1xuXHRcdHJlcy5zID0gTWF0aC5taW4oTWF0aC5tYXgoMCwgbWF0Y2hbNF0gLyAxMDApLCAxKTtcblx0fVxuXG5cdGlmIChtYXRjaFs1XSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmVzLmwgPSBNYXRoLm1pbihNYXRoLm1heCgwLCBtYXRjaFs1XSAvIDEwMCksIDEpO1xuXHR9XG5cblx0aWYgKG1hdGNoWzZdICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXMuYWxwaGEgPSBNYXRoLm1heCgwLCBNYXRoLm1pbigxLCBtYXRjaFs2XSAvIDEwMCkpO1xuXHR9IGVsc2UgaWYgKG1hdGNoWzddICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXMuYWxwaGEgPSBNYXRoLm1heCgwLCBNYXRoLm1pbigxLCArbWF0Y2hbN10pKTtcblx0fVxuXHRyZXR1cm4gcmVzO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgcGFyc2VIc2xMZWdhY3k7XG4iLCAiaW1wb3J0IHsgVG9rIH0gZnJvbSAnLi4vcGFyc2UuanMnO1xuXG5mdW5jdGlvbiBwYXJzZUhzbChjb2xvciwgcGFyc2VkKSB7XG5cdGlmICghcGFyc2VkIHx8IChwYXJzZWRbMF0gIT09ICdoc2wnICYmIHBhcnNlZFswXSAhPT0gJ2hzbGEnKSkge1xuXHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdH1cblx0Y29uc3QgcmVzID0geyBtb2RlOiAnaHNsJyB9O1xuXHRjb25zdCBbLCBoLCBzLCBsLCBhbHBoYV0gPSBwYXJzZWQ7XG5cblx0aWYgKGgudHlwZSAhPT0gVG9rLk5vbmUpIHtcblx0XHRpZiAoaC50eXBlID09PSBUb2suUGVyY2VudGFnZSkge1xuXHRcdFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0XHR9XG5cdFx0cmVzLmggPSBoLnZhbHVlO1xuXHR9XG5cblx0aWYgKHMudHlwZSAhPT0gVG9rLk5vbmUpIHtcblx0XHRpZiAocy50eXBlID09PSBUb2suSHVlKSB7XG5cdFx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHRcdH1cblx0XHRyZXMucyA9IHMudmFsdWUgLyAxMDA7XG5cdH1cblxuXHRpZiAobC50eXBlICE9PSBUb2suTm9uZSkge1xuXHRcdGlmIChsLnR5cGUgPT09IFRvay5IdWUpIHtcblx0XHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdFx0fVxuXHRcdHJlcy5sID0gbC52YWx1ZSAvIDEwMDtcblx0fVxuXG5cdGlmIChhbHBoYS50eXBlICE9PSBUb2suTm9uZSkge1xuXHRcdHJlcy5hbHBoYSA9IE1hdGgubWluKFxuXHRcdFx0MSxcblx0XHRcdE1hdGgubWF4KFxuXHRcdFx0XHQwLFxuXHRcdFx0XHRhbHBoYS50eXBlID09PSBUb2suTnVtYmVyID8gYWxwaGEudmFsdWUgOiBhbHBoYS52YWx1ZSAvIDEwMFxuXHRcdFx0KVxuXHRcdCk7XG5cdH1cblxuXHRyZXR1cm4gcmVzO1xufVxuXG5leHBvcnQgZGVmYXVsdCBwYXJzZUhzbDtcbiIsICJpbXBvcnQgY29udmVydEhzbFRvUmdiIGZyb20gJy4vY29udmVydEhzbFRvUmdiLmpzJztcbmltcG9ydCBjb252ZXJ0UmdiVG9Ic2wgZnJvbSAnLi9jb252ZXJ0UmdiVG9Ic2wuanMnO1xuaW1wb3J0IHBhcnNlSHNsTGVnYWN5IGZyb20gJy4vcGFyc2VIc2xMZWdhY3kuanMnO1xuaW1wb3J0IHBhcnNlSHNsIGZyb20gJy4vcGFyc2VIc2wuanMnO1xuaW1wb3J0IHsgZml4dXBIdWVTaG9ydGVyIH0gZnJvbSAnLi4vZml4dXAvaHVlLmpzJztcbmltcG9ydCB7IGZpeHVwQWxwaGEgfSBmcm9tICcuLi9maXh1cC9hbHBoYS5qcyc7XG5pbXBvcnQgeyBpbnRlcnBvbGF0b3JMaW5lYXIgfSBmcm9tICcuLi9pbnRlcnBvbGF0ZS9saW5lYXIuanMnO1xuaW1wb3J0IHsgZGlmZmVyZW5jZUh1ZVNhdHVyYXRpb24gfSBmcm9tICcuLi9kaWZmZXJlbmNlLmpzJztcbmltcG9ydCB7IGF2ZXJhZ2VBbmdsZSB9IGZyb20gJy4uL2F2ZXJhZ2UuanMnO1xuXG5jb25zdCBkZWZpbml0aW9uID0ge1xuXHRtb2RlOiAnaHNsJyxcblxuXHR0b01vZGU6IHtcblx0XHRyZ2I6IGNvbnZlcnRIc2xUb1JnYlxuXHR9LFxuXG5cdGZyb21Nb2RlOiB7XG5cdFx0cmdiOiBjb252ZXJ0UmdiVG9Ic2xcblx0fSxcblxuXHRjaGFubmVsczogWydoJywgJ3MnLCAnbCcsICdhbHBoYSddLFxuXG5cdHJhbmdlczoge1xuXHRcdGg6IFswLCAzNjBdXG5cdH0sXG5cblx0Z2FtdXQ6ICdyZ2InLFxuXG5cdHBhcnNlOiBbcGFyc2VIc2wsIHBhcnNlSHNsTGVnYWN5XSxcblx0c2VyaWFsaXplOiBjID0+XG5cdFx0YGhzbCgke2MuaCAhPT0gdW5kZWZpbmVkID8gYy5oIDogJ25vbmUnfSAke1xuXHRcdFx0Yy5zICE9PSB1bmRlZmluZWQgPyBjLnMgKiAxMDAgKyAnJScgOiAnbm9uZSdcblx0XHR9ICR7Yy5sICE9PSB1bmRlZmluZWQgPyBjLmwgKiAxMDAgKyAnJScgOiAnbm9uZSd9JHtcblx0XHRcdGMuYWxwaGEgPCAxID8gYCAvICR7Yy5hbHBoYX1gIDogJydcblx0XHR9KWAsXG5cblx0aW50ZXJwb2xhdGU6IHtcblx0XHRoOiB7IHVzZTogaW50ZXJwb2xhdG9yTGluZWFyLCBmaXh1cDogZml4dXBIdWVTaG9ydGVyIH0sXG5cdFx0czogaW50ZXJwb2xhdG9yTGluZWFyLFxuXHRcdGw6IGludGVycG9sYXRvckxpbmVhcixcblx0XHRhbHBoYTogeyB1c2U6IGludGVycG9sYXRvckxpbmVhciwgZml4dXA6IGZpeHVwQWxwaGEgfVxuXHR9LFxuXG5cdGRpZmZlcmVuY2U6IHtcblx0XHRoOiBkaWZmZXJlbmNlSHVlU2F0dXJhdGlvblxuXHR9LFxuXG5cdGF2ZXJhZ2U6IHtcblx0XHRoOiBhdmVyYWdlQW5nbGVcblx0fVxufTtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5pdGlvbjtcbiIsICJpbXBvcnQgbm9ybWFsaXplSHVlIGZyb20gJy4uL3V0aWwvbm9ybWFsaXplSHVlLmpzJztcblxuLy8gQmFzZWQgb246IGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0hTTF9hbmRfSFNWI0NvbnZlcnRpbmdfdG9fUkdCXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGNvbnZlcnRIc3ZUb1JnYih7IGgsIHMsIHYsIGFscGhhIH0pIHtcblx0aCA9IG5vcm1hbGl6ZUh1ZShoICE9PSB1bmRlZmluZWQgPyBoIDogMCk7XG5cdGlmIChzID09PSB1bmRlZmluZWQpIHMgPSAwO1xuXHRpZiAodiA9PT0gdW5kZWZpbmVkKSB2ID0gMDtcblx0bGV0IGYgPSBNYXRoLmFicygoKGggLyA2MCkgJSAyKSAtIDEpO1xuXHRsZXQgcmVzO1xuXHRzd2l0Y2ggKE1hdGguZmxvb3IoaCAvIDYwKSkge1xuXHRcdGNhc2UgMDpcblx0XHRcdHJlcyA9IHsgcjogdiwgZzogdiAqICgxIC0gcyAqIGYpLCBiOiB2ICogKDEgLSBzKSB9O1xuXHRcdFx0YnJlYWs7XG5cdFx0Y2FzZSAxOlxuXHRcdFx0cmVzID0geyByOiB2ICogKDEgLSBzICogZiksIGc6IHYsIGI6IHYgKiAoMSAtIHMpIH07XG5cdFx0XHRicmVhaztcblx0XHRjYXNlIDI6XG5cdFx0XHRyZXMgPSB7IHI6IHYgKiAoMSAtIHMpLCBnOiB2LCBiOiB2ICogKDEgLSBzICogZikgfTtcblx0XHRcdGJyZWFrO1xuXHRcdGNhc2UgMzpcblx0XHRcdHJlcyA9IHsgcjogdiAqICgxIC0gcyksIGc6IHYgKiAoMSAtIHMgKiBmKSwgYjogdiB9O1xuXHRcdFx0YnJlYWs7XG5cdFx0Y2FzZSA0OlxuXHRcdFx0cmVzID0geyByOiB2ICogKDEgLSBzICogZiksIGc6IHYgKiAoMSAtIHMpLCBiOiB2IH07XG5cdFx0XHRicmVhaztcblx0XHRjYXNlIDU6XG5cdFx0XHRyZXMgPSB7IHI6IHYsIGc6IHYgKiAoMSAtIHMpLCBiOiB2ICogKDEgLSBzICogZikgfTtcblx0XHRcdGJyZWFrO1xuXHRcdGRlZmF1bHQ6XG5cdFx0XHRyZXMgPSB7IHI6IHYgKiAoMSAtIHMpLCBnOiB2ICogKDEgLSBzKSwgYjogdiAqICgxIC0gcykgfTtcblx0fVxuXHRyZXMubW9kZSA9ICdyZ2InO1xuXHRpZiAoYWxwaGEgIT09IHVuZGVmaW5lZCkgcmVzLmFscGhhID0gYWxwaGE7XG5cdHJldHVybiByZXM7XG59XG4iLCAiLy8gQmFzZWQgb246IGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0hTTF9hbmRfSFNWI0Zvcm1hbF9kZXJpdmF0aW9uXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGNvbnZlcnRSZ2JUb0hzdih7IHIsIGcsIGIsIGFscGhhIH0pIHtcblx0aWYgKHIgPT09IHVuZGVmaW5lZCkgciA9IDA7XG5cdGlmIChnID09PSB1bmRlZmluZWQpIGcgPSAwO1xuXHRpZiAoYiA9PT0gdW5kZWZpbmVkKSBiID0gMDtcblx0bGV0IE0gPSBNYXRoLm1heChyLCBnLCBiKSxcblx0XHRtID0gTWF0aC5taW4ociwgZywgYik7XG5cdGxldCByZXMgPSB7XG5cdFx0bW9kZTogJ2hzdicsXG5cdFx0czogTSA9PT0gMCA/IDAgOiAxIC0gbSAvIE0sXG5cdFx0djogTVxuXHR9O1xuXHRpZiAoTSAtIG0gIT09IDApXG5cdFx0cmVzLmggPVxuXHRcdFx0KE0gPT09IHJcblx0XHRcdFx0PyAoZyAtIGIpIC8gKE0gLSBtKSArIChnIDwgYikgKiA2XG5cdFx0XHRcdDogTSA9PT0gZ1xuXHRcdFx0XHQ/IChiIC0gcikgLyAoTSAtIG0pICsgMlxuXHRcdFx0XHQ6IChyIC0gZykgLyAoTSAtIG0pICsgNCkgKiA2MDtcblx0aWYgKGFscGhhICE9PSB1bmRlZmluZWQpIHJlcy5hbHBoYSA9IGFscGhhO1xuXHRyZXR1cm4gcmVzO1xufVxuIiwgImltcG9ydCBjb252ZXJ0SHN2VG9SZ2IgZnJvbSAnLi9jb252ZXJ0SHN2VG9SZ2IuanMnO1xuaW1wb3J0IGNvbnZlcnRSZ2JUb0hzdiBmcm9tICcuL2NvbnZlcnRSZ2JUb0hzdi5qcyc7XG5pbXBvcnQgeyBmaXh1cEh1ZVNob3J0ZXIgfSBmcm9tICcuLi9maXh1cC9odWUuanMnO1xuaW1wb3J0IHsgZml4dXBBbHBoYSB9IGZyb20gJy4uL2ZpeHVwL2FscGhhLmpzJztcbmltcG9ydCB7IGludGVycG9sYXRvckxpbmVhciB9IGZyb20gJy4uL2ludGVycG9sYXRlL2xpbmVhci5qcyc7XG5pbXBvcnQgeyBkaWZmZXJlbmNlSHVlU2F0dXJhdGlvbiB9IGZyb20gJy4uL2RpZmZlcmVuY2UuanMnO1xuaW1wb3J0IHsgYXZlcmFnZUFuZ2xlIH0gZnJvbSAnLi4vYXZlcmFnZS5qcyc7XG5cbmNvbnN0IGRlZmluaXRpb24gPSB7XG5cdG1vZGU6ICdoc3YnLFxuXG5cdHRvTW9kZToge1xuXHRcdHJnYjogY29udmVydEhzdlRvUmdiXG5cdH0sXG5cblx0cGFyc2U6IFsnLS1oc3YnXSxcblx0c2VyaWFsaXplOiAnLS1oc3YnLFxuXG5cdGZyb21Nb2RlOiB7XG5cdFx0cmdiOiBjb252ZXJ0UmdiVG9Ic3Zcblx0fSxcblxuXHRjaGFubmVsczogWydoJywgJ3MnLCAndicsICdhbHBoYSddLFxuXG5cdHJhbmdlczoge1xuXHRcdGg6IFswLCAzNjBdXG5cdH0sXG5cblx0Z2FtdXQ6ICdyZ2InLFxuXG5cdGludGVycG9sYXRlOiB7XG5cdFx0aDogeyB1c2U6IGludGVycG9sYXRvckxpbmVhciwgZml4dXA6IGZpeHVwSHVlU2hvcnRlciB9LFxuXHRcdHM6IGludGVycG9sYXRvckxpbmVhcixcblx0XHR2OiBpbnRlcnBvbGF0b3JMaW5lYXIsXG5cdFx0YWxwaGE6IHsgdXNlOiBpbnRlcnBvbGF0b3JMaW5lYXIsIGZpeHVwOiBmaXh1cEFscGhhIH1cblx0fSxcblxuXHRkaWZmZXJlbmNlOiB7XG5cdFx0aDogZGlmZmVyZW5jZUh1ZVNhdHVyYXRpb25cblx0fSxcblxuXHRhdmVyYWdlOiB7XG5cdFx0aDogYXZlcmFnZUFuZ2xlXG5cdH1cbn07XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluaXRpb247XG4iLCAiLypcblx0SFdCIHRvIFJHQiBjb252ZXJ0ZXJcblx0LS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuXHRSZWZlcmVuY2VzOlxuXHRcdCogaHR0cHM6Ly9kcmFmdHMuY3Nzd2cub3JnL2Nzcy1jb2xvci8jaHdiLXRvLXJnYlxuXHRcdCogaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvSFdCX2NvbG9yX21vZGVsXG5cdFx0KiBodHRwOi8vYWx2eXJheS5jb20vUGFwZXJzL0NHL0hXQl9KR1R2MjA4LnBkZlxuICovXG5cbmltcG9ydCBjb252ZXJ0SHN2VG9SZ2IgZnJvbSAnLi4vaHN2L2NvbnZlcnRIc3ZUb1JnYi5qcyc7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGNvbnZlcnRId2JUb1JnYih7IGgsIHcsIGIsIGFscGhhIH0pIHtcblx0aWYgKHcgPT09IHVuZGVmaW5lZCkgdyA9IDA7XG5cdGlmIChiID09PSB1bmRlZmluZWQpIGIgPSAwO1xuXHQvLyBub3JtYWxpemUgdyArIGIgdG8gMVxuXHRpZiAodyArIGIgPiAxKSB7XG5cdFx0bGV0IHMgPSB3ICsgYjtcblx0XHR3IC89IHM7XG5cdFx0YiAvPSBzO1xuXHR9XG5cdHJldHVybiBjb252ZXJ0SHN2VG9SZ2Ioe1xuXHRcdGg6IGgsXG5cdFx0czogYiA9PT0gMSA/IDEgOiAxIC0gdyAvICgxIC0gYiksXG5cdFx0djogMSAtIGIsXG5cdFx0YWxwaGE6IGFscGhhXG5cdH0pO1xufVxuIiwgIi8qXG5cdFJHQiB0byBIV0IgY29udmVydGVyXG5cdC0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cblx0UmVmZXJlbmNlczpcblx0XHQqIGh0dHBzOi8vZHJhZnRzLmNzc3dnLm9yZy9jc3MtY29sb3IvI2h3Yi10by1yZ2Jcblx0XHQqIGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0hXQl9jb2xvcl9tb2RlbFxuXHRcdCogaHR0cDovL2FsdnlyYXkuY29tL1BhcGVycy9DRy9IV0JfSkdUdjIwOC5wZGZcbiAqL1xuXG5pbXBvcnQgY29udmVydFJnYlRvSHN2IGZyb20gJy4uL2hzdi9jb252ZXJ0UmdiVG9Ic3YuanMnO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBjb252ZXJ0UmdiVG9Id2IocmdiYSkge1xuXHRsZXQgaHN2ID0gY29udmVydFJnYlRvSHN2KHJnYmEpO1xuXHRpZiAoaHN2ID09PSB1bmRlZmluZWQpIHJldHVybiB1bmRlZmluZWQ7XG5cdGxldCBzID0gaHN2LnMgIT09IHVuZGVmaW5lZCA/IGhzdi5zIDogMDtcblx0bGV0IHYgPSBoc3YudiAhPT0gdW5kZWZpbmVkID8gaHN2LnYgOiAwO1xuXHRsZXQgcmVzID0ge1xuXHRcdG1vZGU6ICdod2InLFxuXHRcdHc6ICgxIC0gcykgKiB2LFxuXHRcdGI6IDEgLSB2XG5cdH07XG5cdGlmIChoc3YuaCAhPT0gdW5kZWZpbmVkKSByZXMuaCA9IGhzdi5oO1xuXHRpZiAoaHN2LmFscGhhICE9PSB1bmRlZmluZWQpIHJlcy5hbHBoYSA9IGhzdi5hbHBoYTtcblx0cmV0dXJuIHJlcztcbn1cbiIsICJpbXBvcnQgeyBUb2sgfSBmcm9tICcuLi9wYXJzZS5qcyc7XG5cbmZ1bmN0aW9uIFBhcnNlSHdiKGNvbG9yLCBwYXJzZWQpIHtcblx0aWYgKCFwYXJzZWQgfHwgcGFyc2VkWzBdICE9PSAnaHdiJykge1xuXHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdH1cblx0Y29uc3QgcmVzID0geyBtb2RlOiAnaHdiJyB9O1xuXHRjb25zdCBbLCBoLCB3LCBiLCBhbHBoYV0gPSBwYXJzZWQ7XG5cblx0aWYgKGgudHlwZSAhPT0gVG9rLk5vbmUpIHtcblx0XHRpZiAoaC50eXBlID09PSBUb2suUGVyY2VudGFnZSkge1xuXHRcdFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0XHR9XG5cdFx0cmVzLmggPSBoLnZhbHVlO1xuXHR9XG5cblx0aWYgKHcudHlwZSAhPT0gVG9rLk5vbmUpIHtcblx0XHRpZiAody50eXBlID09PSBUb2suSHVlKSB7XG5cdFx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHRcdH1cblx0XHRyZXMudyA9IHcudmFsdWUgLyAxMDA7XG5cdH1cblxuXHRpZiAoYi50eXBlICE9PSBUb2suTm9uZSkge1xuXHRcdGlmIChiLnR5cGUgPT09IFRvay5IdWUpIHtcblx0XHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdFx0fVxuXHRcdHJlcy5iID0gYi52YWx1ZSAvIDEwMDtcblx0fVxuXG5cdGlmIChhbHBoYS50eXBlICE9PSBUb2suTm9uZSkge1xuXHRcdHJlcy5hbHBoYSA9IE1hdGgubWluKFxuXHRcdFx0MSxcblx0XHRcdE1hdGgubWF4KFxuXHRcdFx0XHQwLFxuXHRcdFx0XHRhbHBoYS50eXBlID09PSBUb2suTnVtYmVyID8gYWxwaGEudmFsdWUgOiBhbHBoYS52YWx1ZSAvIDEwMFxuXHRcdFx0KVxuXHRcdCk7XG5cdH1cblxuXHRyZXR1cm4gcmVzO1xufVxuXG5leHBvcnQgZGVmYXVsdCBQYXJzZUh3YjtcbiIsICJpbXBvcnQgY29udmVydEh3YlRvUmdiIGZyb20gJy4vY29udmVydEh3YlRvUmdiLmpzJztcbmltcG9ydCBjb252ZXJ0UmdiVG9Id2IgZnJvbSAnLi9jb252ZXJ0UmdiVG9Id2IuanMnO1xuaW1wb3J0IHBhcnNlSHdiIGZyb20gJy4vcGFyc2VId2IuanMnO1xuaW1wb3J0IHsgZml4dXBIdWVTaG9ydGVyIH0gZnJvbSAnLi4vZml4dXAvaHVlLmpzJztcbmltcG9ydCB7IGZpeHVwQWxwaGEgfSBmcm9tICcuLi9maXh1cC9hbHBoYS5qcyc7XG5pbXBvcnQgeyBpbnRlcnBvbGF0b3JMaW5lYXIgfSBmcm9tICcuLi9pbnRlcnBvbGF0ZS9saW5lYXIuanMnO1xuaW1wb3J0IHsgZGlmZmVyZW5jZUh1ZU5haXZlIH0gZnJvbSAnLi4vZGlmZmVyZW5jZS5qcyc7XG5pbXBvcnQgeyBhdmVyYWdlQW5nbGUgfSBmcm9tICcuLi9hdmVyYWdlLmpzJztcblxuY29uc3QgZGVmaW5pdGlvbiA9IHtcblx0bW9kZTogJ2h3YicsXG5cblx0dG9Nb2RlOiB7XG5cdFx0cmdiOiBjb252ZXJ0SHdiVG9SZ2Jcblx0fSxcblxuXHRmcm9tTW9kZToge1xuXHRcdHJnYjogY29udmVydFJnYlRvSHdiXG5cdH0sXG5cblx0Y2hhbm5lbHM6IFsnaCcsICd3JywgJ2InLCAnYWxwaGEnXSxcblxuXHRyYW5nZXM6IHtcblx0XHRoOiBbMCwgMzYwXVxuXHR9LFxuXG5cdGdhbXV0OiAncmdiJyxcblxuXHRwYXJzZTogW3BhcnNlSHdiXSxcblx0c2VyaWFsaXplOiBjID0+XG5cdFx0YGh3Yigke2MuaCAhPT0gdW5kZWZpbmVkID8gYy5oIDogJ25vbmUnfSAke1xuXHRcdFx0Yy53ICE9PSB1bmRlZmluZWQgPyBjLncgKiAxMDAgKyAnJScgOiAnbm9uZSdcblx0XHR9ICR7Yy5iICE9PSB1bmRlZmluZWQgPyBjLmIgKiAxMDAgKyAnJScgOiAnbm9uZSd9JHtcblx0XHRcdGMuYWxwaGEgPCAxID8gYCAvICR7Yy5hbHBoYX1gIDogJydcblx0XHR9KWAsXG5cblx0aW50ZXJwb2xhdGU6IHtcblx0XHRoOiB7IHVzZTogaW50ZXJwb2xhdG9yTGluZWFyLCBmaXh1cDogZml4dXBIdWVTaG9ydGVyIH0sXG5cdFx0dzogaW50ZXJwb2xhdG9yTGluZWFyLFxuXHRcdGI6IGludGVycG9sYXRvckxpbmVhcixcblx0XHRhbHBoYTogeyB1c2U6IGludGVycG9sYXRvckxpbmVhciwgZml4dXA6IGZpeHVwQWxwaGEgfVxuXHR9LFxuXG5cdGRpZmZlcmVuY2U6IHtcblx0XHRoOiBkaWZmZXJlbmNlSHVlTmFpdmVcblx0fSxcblxuXHRhdmVyYWdlOiB7XG5cdFx0aDogYXZlcmFnZUFuZ2xlXG5cdH1cbn07XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluaXRpb247XG4iLCAiLypcblx0UmVsYXRpdmUgWFlaIGhhcyBZPTEgZm9yIG1lZGlhIHdoaXRlLFxuXHRCVC4yMDQ4IHNheXMgbWVkaWEgd2hpdGUgWT0yMDMgKGF0IFBRIDU4KS5cblx0U2VlOiBodHRwczovL3d3dy5pdHUuaW50L2Rtc19wdWIvaXR1LXIvb3BiL3JlcC9SLVJFUC1CVC4yNDA4LTMtMjAxOS1QREYtRS5wZGZcbiovXG5leHBvcnQgY29uc3QgWVcgPSAyMDM7XG4iLCAiLypcblx0aHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvVHJhbnNmZXJfZnVuY3Rpb25zX2luX2ltYWdpbmdcbiovXG5cbmV4cG9ydCBjb25zdCBNMSA9IDAuMTU5MzAxNzU3ODEyNTtcbmV4cG9ydCBjb25zdCBNMiA9IDc4Ljg0Mzc1O1xuZXhwb3J0IGNvbnN0IEMxID0gMC44MzU5Mzc1O1xuZXhwb3J0IGNvbnN0IEMyID0gMTguODUxNTYyNTtcbmV4cG9ydCBjb25zdCBDMyA9IDE4LjY4NzU7XG5cbi8qXG5cdFBlcmNlcHR1YWwgUXVhbnRpemVyLCBhcyBkZWZpbmVkIGluIFJlYy4gQlQgMjEwMC0yICgyMDE4KVxuXG5cdCogaHR0cHM6Ly93d3cuaXR1LmludC9yZWMvUi1SRUMtQlQuMjEwMC0yLTIwMTgwNy1JL2VuXG5cdCogaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvUGVyY2VwdHVhbF9xdWFudGl6ZXJcbiovXG5cbi8qIFBRIEVPVEYsIGRlZmluZWQgZm9yIGB2YCBpbiBbMCwxXS4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0cmFuc2ZlclBxRGVjb2RlKHYpIHtcblx0aWYgKHYgPCAwKSByZXR1cm4gMDtcblx0Y29uc3QgYyA9IE1hdGgucG93KHYsIDEgLyBNMik7XG5cdHJldHVybiAxZTQgKiBNYXRoLnBvdyhNYXRoLm1heCgwLCBjIC0gQzEpIC8gKEMyIC0gQzMgKiBjKSwgMSAvIE0xKTtcbn1cblxuLyogUFEgRU9URl4tMSwgZGVmaW5lZCBmb3IgYHZgIGluIFswLCAxZTRdLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRyYW5zZmVyUHFFbmNvZGUodikge1xuXHRpZiAodiA8IDApIHJldHVybiAwO1xuXHRjb25zdCBjID0gTWF0aC5wb3codiAvIDFlNCwgTTEpO1xuXHRyZXR1cm4gTWF0aC5wb3coKEMxICsgQzIgKiBjKSAvICgxICsgQzMgKiBjKSwgTTIpO1xufVxuIiwgImltcG9ydCB7IFlXIH0gZnJvbSAnLi4vaGRyL2NvbnN0YW50cy5qcyc7XG5pbXBvcnQgeyB0cmFuc2ZlclBxRGVjb2RlIH0gZnJvbSAnLi4vaGRyL3RyYW5zZmVyLmpzJztcblxuY29uc3QgdG9SZWwgPSBjID0+IE1hdGgubWF4KGMgLyBZVywgMCk7XG5cbmNvbnN0IGNvbnZlcnRJdHBUb1h5ejY1ID0gKHsgaSwgdCwgcCwgYWxwaGEgfSkgPT4ge1xuXHRpZiAoaSA9PT0gdW5kZWZpbmVkKSBpID0gMDtcblx0aWYgKHQgPT09IHVuZGVmaW5lZCkgdCA9IDA7XG5cdGlmIChwID09PSB1bmRlZmluZWQpIHAgPSAwO1xuXG5cdGNvbnN0IGwgPSB0cmFuc2ZlclBxRGVjb2RlKFxuXHRcdGkgKyAwLjAwODYwOTAzNzAzNzkzMjc2MSAqIHQgKyAwLjExMTAyOTYyNTAwMzAyNTkzICogcFxuXHQpO1xuXHRjb25zdCBtID0gdHJhbnNmZXJQcURlY29kZShcblx0XHRpIC0gMC4wMDg2MDkwMzcwMzc5MzI3NSAqIHQgLSAwLjExMTAyOTYyNTAwMzAyNTk5ICogcFxuXHQpO1xuXHRjb25zdCBzID0gdHJhbnNmZXJQcURlY29kZShcblx0XHRpICsgMC41NjAwMzEzMzU3MTA2NzkxICogdCAtIDAuMzIwNjI3MTc0OTg3MzE4ODUgKiBwXG5cdCk7XG5cblx0Y29uc3QgcmVzID0ge1xuXHRcdG1vZGU6ICd4eXo2NScsXG5cdFx0eDogdG9SZWwoXG5cdFx0XHQyLjA3MDE1MjIxODM4OTQyMTkgKiBsIC1cblx0XHRcdFx0MS4zMjYzNDczMzg5NjcxNTU2ICogbSArXG5cdFx0XHRcdDAuMjA2NjUxMDQ3NjI5NDA1MSAqIHNcblx0XHQpLFxuXHRcdHk6IHRvUmVsKFxuXHRcdFx0MC4zNjQ3Mzg1MjA5NzQ4MDc0ICogbCArXG5cdFx0XHRcdDAuNjgwNTY2MDI0OTQ3MjI3ICogbSAtXG5cdFx0XHRcdDAuMDQ1MzA0NTQ1OTIyMDM0NiAqIHNcblx0XHQpLFxuXHRcdHo6IHRvUmVsKFxuXHRcdFx0LTAuMDQ5NzQ3MjA3NTM1ODEyICogbCAtXG5cdFx0XHRcdDAuMDQ5MjYwOTY2Njk2NjEzOCAqIG0gK1xuXHRcdFx0XHQxLjE4ODA2NTkyNDk5MjMwNDIgKiBzXG5cdFx0KVxuXHR9O1xuXG5cdGlmIChhbHBoYSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmVzLmFscGhhID0gYWxwaGE7XG5cdH1cblxuXHRyZXR1cm4gcmVzO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgY29udmVydEl0cFRvWHl6NjU7XG4iLCAiaW1wb3J0IHsgWVcgfSBmcm9tICcuLi9oZHIvY29uc3RhbnRzLmpzJztcbmltcG9ydCB7IHRyYW5zZmVyUHFFbmNvZGUgfSBmcm9tICcuLi9oZHIvdHJhbnNmZXIuanMnO1xuXG5jb25zdCB0b0FicyA9IChjID0gMCkgPT4gTWF0aC5tYXgoYyAqIFlXLCAwKTtcblxuY29uc3QgY29udmVydFh5ejY1VG9JdHAgPSAoeyB4LCB5LCB6LCBhbHBoYSB9KSA9PiB7XG5cdGNvbnN0IGFic1ggPSB0b0Ficyh4KTtcblx0Y29uc3QgYWJzWSA9IHRvQWJzKHkpO1xuXHRjb25zdCBhYnNaID0gdG9BYnMoeik7XG5cdGNvbnN0IGwgPSB0cmFuc2ZlclBxRW5jb2RlKFxuXHRcdDAuMzU5MjgzMjU5MDEyMTIxNyAqIGFic1ggK1xuXHRcdFx0MC42OTc2MDUxMTQ3Nzc5NTAyICogYWJzWSAtXG5cdFx0XHQwLjAzNTg5MTU5MzIzMjAyODkgKiBhYnNaXG5cdCk7XG5cdGNvbnN0IG0gPSB0cmFuc2ZlclBxRW5jb2RlKFxuXHRcdC0wLjE5MjA4MDg0NjM3MDQ5OTUgKiBhYnNYICtcblx0XHRcdDEuMTAwNDc2Nzk3MDM3NDMyMyAqIGFic1kgK1xuXHRcdFx0MC4wNzUzNzQ4NjU4NTE5MTE4ICogYWJzWlxuXHQpO1xuXHRjb25zdCBzID0gdHJhbnNmZXJQcUVuY29kZShcblx0XHQwLjAwNzA3OTc4NDQ2MDc0NzcgKiBhYnNYICtcblx0XHRcdDAuMDc0ODM5NjY2MjE4NjM2NiAqIGFic1kgK1xuXHRcdFx0MC44NDMzMjY1NDUzODk4NzY1ICogYWJzWlxuXHQpO1xuXG5cdGNvbnN0IGkgPSAwLjUgKiBsICsgMC41ICogbTtcblx0Y29uc3QgdCA9IDEuNjEzNzY5NTMxMjUgKiBsIC0gMy4zMjM0ODYzMjgxMjUgKiBtICsgMS43MDk3MTY3OTY4NzUgKiBzO1xuXHRjb25zdCBwID0gNC4zNzgxNzM4MjgxMjUgKiBsIC0gNC4yNDU2MDU0Njg3NSAqIG0gLSAwLjEzMjU2ODM1OTM3NSAqIHM7XG5cblx0Y29uc3QgcmVzID0geyBtb2RlOiAnaXRwJywgaSwgdCwgcCB9O1xuXHRpZiAoYWxwaGEgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJlcy5hbHBoYSA9IGFscGhhO1xuXHR9XG5cblx0cmV0dXJuIHJlcztcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNvbnZlcnRYeXo2NVRvSXRwO1xuIiwgImltcG9ydCB7IGludGVycG9sYXRvckxpbmVhciB9IGZyb20gJy4uL2ludGVycG9sYXRlL2xpbmVhci5qcyc7XG5pbXBvcnQgeyBmaXh1cEFscGhhIH0gZnJvbSAnLi4vZml4dXAvYWxwaGEuanMnO1xuaW1wb3J0IGNvbnZlcnRJdHBUb1h5ejY1IGZyb20gJy4vY29udmVydEl0cFRvWHl6NjUuanMnO1xuaW1wb3J0IGNvbnZlcnRYeXo2NVRvSXRwIGZyb20gJy4vY29udmVydFh5ejY1VG9JdHAuanMnO1xuaW1wb3J0IGNvbnZlcnRSZ2JUb1h5ejY1IGZyb20gJy4uL3h5ejY1L2NvbnZlcnRSZ2JUb1h5ejY1LmpzJztcbmltcG9ydCBjb252ZXJ0WHl6NjVUb1JnYiBmcm9tICcuLi94eXo2NS9jb252ZXJ0WHl6NjVUb1JnYi5qcyc7XG5cbi8qXG4gIElDdENwIChvciBJVFApIGNvbG9yIHNwYWNlLCBhcyBkZWZpbmVkIGluIElUVS1SIFJlY29tbWVuZGF0aW9uIEJULjIxMDAuXG5cbiAgSUN0Q3AgaXMgZHJhZnRlZCB0byBiZSBzdXBwb3J0ZWQgaW4gQ1NTIHdpdGhpblxuICBbQ1NTIENvbG9yIEhEUiBNb2R1bGUgTGV2ZWwgMV0oaHR0cHM6Ly9kcmFmdHMuY3Nzd2cub3JnL2Nzcy1jb2xvci1oZHIvI0lDdENwKSBzcGVjLlxuKi9cblxuY29uc3QgZGVmaW5pdGlvbiA9IHtcblx0bW9kZTogJ2l0cCcsXG5cdGNoYW5uZWxzOiBbJ2knLCAndCcsICdwJywgJ2FscGhhJ10sXG5cdHBhcnNlOiBbJy0taWN0Y3AnXSxcblx0c2VyaWFsaXplOiAnLS1pY3RjcCcsXG5cblx0dG9Nb2RlOiB7XG5cdFx0eHl6NjU6IGNvbnZlcnRJdHBUb1h5ejY1LFxuXHRcdHJnYjogY29sb3IgPT4gY29udmVydFh5ejY1VG9SZ2IoY29udmVydEl0cFRvWHl6NjUoY29sb3IpKVxuXHR9LFxuXG5cdGZyb21Nb2RlOiB7XG5cdFx0eHl6NjU6IGNvbnZlcnRYeXo2NVRvSXRwLFxuXHRcdHJnYjogY29sb3IgPT4gY29udmVydFh5ejY1VG9JdHAoY29udmVydFJnYlRvWHl6NjUoY29sb3IpKVxuXHR9LFxuXG5cdHJhbmdlczoge1xuXHRcdGk6IFswLCAwLjU4MV0sXG5cdFx0dDogWy0wLjM2OSwgMC4yNzJdLFxuXHRcdHA6IFstMC4xNjQsIDAuMzMxXVxuXHR9LFxuXG5cdGludGVycG9sYXRlOiB7XG5cdFx0aTogaW50ZXJwb2xhdG9yTGluZWFyLFxuXHRcdHQ6IGludGVycG9sYXRvckxpbmVhcixcblx0XHRwOiBpbnRlcnBvbGF0b3JMaW5lYXIsXG5cdFx0YWxwaGE6IHsgdXNlOiBpbnRlcnBvbGF0b3JMaW5lYXIsIGZpeHVwOiBmaXh1cEFscGhhIH1cblx0fVxufTtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5pdGlvbjtcbiIsICJpbXBvcnQgeyBNMSBhcyBuLCBDMSwgQzIsIEMzIH0gZnJvbSAnLi4vaGRyL3RyYW5zZmVyLmpzJztcbmNvbnN0IHAgPSAxMzQuMDM0Mzc0OTk5OTk5OTg7IC8vID0gMS43ICogMjUyMyAvIE1hdGgucG93KDIsIDUpO1xuY29uc3QgZDAgPSAxLjYyOTU0OTk1MzI4MjE1NjZlLTExO1xuXG4vKiBcblx0VGhlIGVuY29kaW5nIGZ1bmN0aW9uIGlzIGRlcml2ZWQgZnJvbSBQZXJjZXB0dWFsIFF1YW50aXplci5cbiovXG5jb25zdCBqYWJQcUVuY29kZSA9IHYgPT4ge1xuXHRpZiAodiA8IDApIHJldHVybiAwO1xuXHRsZXQgdm4gPSBNYXRoLnBvdyh2IC8gMTAwMDAsIG4pO1xuXHRyZXR1cm4gTWF0aC5wb3coKEMxICsgQzIgKiB2bikgLyAoMSArIEMzICogdm4pLCBwKTtcbn07XG5cbi8vIENvbnZlcnQgdG8gQWJzb2x1dGUgWFlaXG5jb25zdCBhYnMgPSAodiA9IDApID0+IE1hdGgubWF4KHYgKiAyMDMsIDApO1xuXG5jb25zdCBjb252ZXJ0WHl6NjVUb0phYiA9ICh7IHgsIHksIHosIGFscGhhIH0pID0+IHtcblx0eCA9IGFicyh4KTtcblx0eSA9IGFicyh5KTtcblx0eiA9IGFicyh6KTtcblxuXHRsZXQgeHAgPSAxLjE1ICogeCAtIDAuMTUgKiB6O1xuXHRsZXQgeXAgPSAwLjY2ICogeSArIDAuMzQgKiB4O1xuXG5cdGxldCBsID0gamFiUHFFbmNvZGUoMC40MTQ3ODk3MiAqIHhwICsgMC41Nzk5OTkgKiB5cCArIDAuMDE0NjQ4ICogeik7XG5cdGxldCBtID0gamFiUHFFbmNvZGUoLTAuMjAxNTEgKiB4cCArIDEuMTIwNjQ5ICogeXAgKyAwLjA1MzEwMDggKiB6KTtcblx0bGV0IHMgPSBqYWJQcUVuY29kZSgtMC4wMTY2MDA4ICogeHAgKyAwLjI2NDggKiB5cCArIDAuNjY4NDc5OSAqIHopO1xuXG5cdGxldCBpID0gKGwgKyBtKSAvIDI7XG5cblx0bGV0IHJlcyA9IHtcblx0XHRtb2RlOiAnamFiJyxcblx0XHRqOiAoMC40NCAqIGkpIC8gKDEgLSAwLjU2ICogaSkgLSBkMCxcblx0XHRhOiAzLjUyNCAqIGwgLSA0LjA2NjcwOCAqIG0gKyAwLjU0MjcwOCAqIHMsXG5cdFx0YjogMC4xOTkwNzYgKiBsICsgMS4wOTY3OTkgKiBtIC0gMS4yOTU4NzUgKiBzXG5cdH07XG5cblx0aWYgKGFscGhhICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXMuYWxwaGEgPSBhbHBoYTtcblx0fVxuXG5cdHJldHVybiByZXM7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBjb252ZXJ0WHl6NjVUb0phYjtcbiIsICJpbXBvcnQgeyBNMSBhcyBuLCBDMSwgQzIsIEMzIH0gZnJvbSAnLi4vaGRyL3RyYW5zZmVyLmpzJztcbmNvbnN0IHAgPSAxMzQuMDM0Mzc0OTk5OTk5OTg7IC8vID0gMS43ICogMjUyMyAvIE1hdGgucG93KDIsIDUpO1xuY29uc3QgZDAgPSAxLjYyOTU0OTk1MzI4MjE1NjZlLTExO1xuXG4vKiBcblx0VGhlIGVuY29kaW5nIGZ1bmN0aW9uIGlzIGRlcml2ZWQgZnJvbSBQZXJjZXB0dWFsIFF1YW50aXplci5cbiovXG5jb25zdCBqYWJQcURlY29kZSA9IHYgPT4ge1xuXHRpZiAodiA8IDApIHJldHVybiAwO1xuXHRsZXQgdnAgPSBNYXRoLnBvdyh2LCAxIC8gcCk7XG5cdHJldHVybiAxMDAwMCAqIE1hdGgucG93KChDMSAtIHZwKSAvIChDMyAqIHZwIC0gQzIpLCAxIC8gbik7XG59O1xuXG5jb25zdCByZWwgPSB2ID0+IHYgLyAyMDM7XG5cbmNvbnN0IGNvbnZlcnRKYWJUb1h5ejY1ID0gKHsgaiwgYSwgYiwgYWxwaGEgfSkgPT4ge1xuXHRpZiAoaiA9PT0gdW5kZWZpbmVkKSBqID0gMDtcblx0aWYgKGEgPT09IHVuZGVmaW5lZCkgYSA9IDA7XG5cdGlmIChiID09PSB1bmRlZmluZWQpIGIgPSAwO1xuXHRsZXQgaSA9IChqICsgZDApIC8gKDAuNDQgKyAwLjU2ICogKGogKyBkMCkpO1xuXG5cdGxldCBsID0gamFiUHFEZWNvZGUoaSArIDAuMTM4NjA1MDQgKiBhICsgMC4wNTgwNDczMTYgKiBiKTtcblx0bGV0IG0gPSBqYWJQcURlY29kZShpIC0gMC4xMzg2MDUwNCAqIGEgLSAwLjA1ODA0NzMxNiAqIGIpO1xuXHRsZXQgcyA9IGphYlBxRGVjb2RlKGkgLSAwLjA5NjAxOTI0MiAqIGEgLSAwLjgxMTg5MTkgKiBiKTtcblxuXHRsZXQgcmVzID0ge1xuXHRcdG1vZGU6ICd4eXo2NScsXG5cdFx0eDogcmVsKFxuXHRcdFx0MS42NjEzNzMwMjQ2NTIxNzQgKiBsIC1cblx0XHRcdFx0MC45MTQ1MjMwODEzMDQzNDggKiBtICtcblx0XHRcdFx0MC4yMzEzNjIwODE3MzkxMzA0NSAqIHNcblx0XHQpLFxuXHRcdHk6IHJlbChcblx0XHRcdC0wLjMyNTA3NTg2MTE4NDQ1MzMgKiBsICtcblx0XHRcdFx0MS41NzE4NDcwMjY3MzI1NDMgKiBtIC1cblx0XHRcdFx0MC4yMTgyNTM4MzQ1MzIyNzkyOCAqIHNcblx0XHQpLFxuXHRcdHo6IHJlbCgtMC4wOTA5ODI4MTEgKiBsIC0gMC4zMTI3MjgyOSAqIG0gKyAxLjUyMjc2NjYgKiBzKVxuXHR9O1xuXG5cdGlmIChhbHBoYSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmVzLmFscGhhID0gYWxwaGE7XG5cdH1cblxuXHRyZXR1cm4gcmVzO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgY29udmVydEphYlRvWHl6NjU7XG4iLCAiLypcblx0Q29udmVydCBzUkdCIHRvIEp6QXpCei5cblxuXHRGb3IgYWNocm9tYXRpYyBzUkdCIGNvbG9ycywgYWRqdXN0IHRoZSBlcXVpdmFsZW50IEp6QXpCeiBjb2xvclxuXHR0byBiZSBhY2hyb21hdGljIGFzIHdlbGwsIGluc3RlYWRpbmcgb2YgaGF2aW5nIGEgdmVyeSBzbGlnaHQgY2hyb21hLlxuICovXG5cbmltcG9ydCBjb252ZXJ0WHl6NjVUb0phYiBmcm9tICcuL2NvbnZlcnRYeXo2NVRvSmFiLmpzJztcbmltcG9ydCBjb252ZXJ0UmdiVG9YeXo2NSBmcm9tICcuLi94eXo2NS9jb252ZXJ0UmdiVG9YeXo2NS5qcyc7XG5cbmNvbnN0IGNvbnZlcnRSZ2JUb0phYiA9IHJnYiA9PiB7XG5cdGxldCByZXMgPSBjb252ZXJ0WHl6NjVUb0phYihjb252ZXJ0UmdiVG9YeXo2NShyZ2IpKTtcblx0aWYgKHJnYi5yID09PSByZ2IuYiAmJiByZ2IuYiA9PT0gcmdiLmcpIHtcblx0XHRyZXMuYSA9IHJlcy5iID0gMDtcblx0fVxuXHRyZXR1cm4gcmVzO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgY29udmVydFJnYlRvSmFiO1xuIiwgImltcG9ydCBjb252ZXJ0WHl6NjVUb1JnYiBmcm9tICcuLi94eXo2NS9jb252ZXJ0WHl6NjVUb1JnYi5qcyc7XG5pbXBvcnQgY29udmVydEphYlRvWHl6NjUgZnJvbSAnLi9jb252ZXJ0SmFiVG9YeXo2NS5qcyc7XG5cbmNvbnN0IGNvbnZlcnRKYWJUb1JnYiA9IGNvbG9yID0+IGNvbnZlcnRYeXo2NVRvUmdiKGNvbnZlcnRKYWJUb1h5ejY1KGNvbG9yKSk7XG5cbmV4cG9ydCBkZWZhdWx0IGNvbnZlcnRKYWJUb1JnYjtcbiIsICIvKlxuXHRUaGUgSnpBekJ6IGNvbG9yIHNwYWNlLlxuXG5cdEJhc2VkIG9uOlxuXG5cdE11aGFtbWFkIFNhZmRhciwgR3VpaHVhIEN1aSwgWW91biBKaW4gS2ltLCBhbmQgTWluZyBSb25uaWVyIEx1bywgXG5cdFwiUGVyY2VwdHVhbGx5IHVuaWZvcm0gY29sb3Igc3BhY2UgZm9yIGltYWdlIHNpZ25hbHMgXG5cdGluY2x1ZGluZyBoaWdoIGR5bmFtaWMgcmFuZ2UgYW5kIHdpZGUgZ2FtdXQsXCIgXG5cdE9wdC4gRXhwcmVzcyAyNSwgMTUxMzEtMTUxNTEgKDIwMTcpIFxuXG5cdGh0dHBzOi8vZG9pLm9yZy8xMC4xMzY0L09FLjI1LjAxNTEzMVxuICovXG5cbmltcG9ydCBjb252ZXJ0WHl6NjVUb0phYiBmcm9tICcuL2NvbnZlcnRYeXo2NVRvSmFiLmpzJztcbmltcG9ydCBjb252ZXJ0SmFiVG9YeXo2NSBmcm9tICcuL2NvbnZlcnRKYWJUb1h5ejY1LmpzJztcbmltcG9ydCBjb252ZXJ0UmdiVG9KYWIgZnJvbSAnLi9jb252ZXJ0UmdiVG9KYWIuanMnO1xuaW1wb3J0IGNvbnZlcnRKYWJUb1JnYiBmcm9tICcuL2NvbnZlcnRKYWJUb1JnYi5qcyc7XG5cbmltcG9ydCB7IGludGVycG9sYXRvckxpbmVhciB9IGZyb20gJy4uL2ludGVycG9sYXRlL2xpbmVhci5qcyc7XG5pbXBvcnQgeyBmaXh1cEFscGhhIH0gZnJvbSAnLi4vZml4dXAvYWxwaGEuanMnO1xuXG5jb25zdCBkZWZpbml0aW9uID0ge1xuXHRtb2RlOiAnamFiJyxcblx0Y2hhbm5lbHM6IFsnaicsICdhJywgJ2InLCAnYWxwaGEnXSxcblxuXHRwYXJzZTogWyctLWp6YXpieiddLFxuXHRzZXJpYWxpemU6ICctLWp6YXpieicsXG5cblx0ZnJvbU1vZGU6IHtcblx0XHRyZ2I6IGNvbnZlcnRSZ2JUb0phYixcblx0XHR4eXo2NTogY29udmVydFh5ejY1VG9KYWJcblx0fSxcblxuXHR0b01vZGU6IHtcblx0XHRyZ2I6IGNvbnZlcnRKYWJUb1JnYixcblx0XHR4eXo2NTogY29udmVydEphYlRvWHl6NjVcblx0fSxcblxuXHRyYW5nZXM6IHtcblx0XHRqOiBbMCwgMC4yMjJdLFxuXHRcdGE6IFstMC4xMDksIDAuMTI5XSxcblx0XHRiOiBbLTAuMTg1LCAwLjEzNF1cblx0fSxcblxuXHRpbnRlcnBvbGF0ZToge1xuXHRcdGo6IGludGVycG9sYXRvckxpbmVhcixcblx0XHRhOiBpbnRlcnBvbGF0b3JMaW5lYXIsXG5cdFx0YjogaW50ZXJwb2xhdG9yTGluZWFyLFxuXHRcdGFscGhhOiB7IHVzZTogaW50ZXJwb2xhdG9yTGluZWFyLCBmaXh1cDogZml4dXBBbHBoYSB9XG5cdH1cbn07XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluaXRpb247XG4iLCAiaW1wb3J0IG5vcm1hbGl6ZUh1ZSBmcm9tICcuLi91dGlsL25vcm1hbGl6ZUh1ZS5qcyc7XG5cbmNvbnN0IGNvbnZlcnRKYWJUb0pjaCA9ICh7IGosIGEsIGIsIGFscGhhIH0pID0+IHtcblx0aWYgKGEgPT09IHVuZGVmaW5lZCkgYSA9IDA7XG5cdGlmIChiID09PSB1bmRlZmluZWQpIGIgPSAwO1xuXHRsZXQgYyA9IE1hdGguc3FydChhICogYSArIGIgKiBiKTtcblx0bGV0IHJlcyA9IHtcblx0XHRtb2RlOiAnamNoJyxcblx0XHRqLFxuXHRcdGNcblx0fTtcblx0aWYgKGMpIHtcblx0XHRyZXMuaCA9IG5vcm1hbGl6ZUh1ZSgoTWF0aC5hdGFuMihiLCBhKSAqIDE4MCkgLyBNYXRoLlBJKTtcblx0fVxuXHRpZiAoYWxwaGEgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJlcy5hbHBoYSA9IGFscGhhO1xuXHR9XG5cdHJldHVybiByZXM7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBjb252ZXJ0SmFiVG9KY2g7XG4iLCAiY29uc3QgY29udmVydEpjaFRvSmFiID0gKHsgaiwgYywgaCwgYWxwaGEgfSkgPT4ge1xuXHRpZiAoaCA9PT0gdW5kZWZpbmVkKSBoID0gMDtcblx0bGV0IHJlcyA9IHtcblx0XHRtb2RlOiAnamFiJyxcblx0XHRqLFxuXHRcdGE6IGMgPyBjICogTWF0aC5jb3MoKGggLyAxODApICogTWF0aC5QSSkgOiAwLFxuXHRcdGI6IGMgPyBjICogTWF0aC5zaW4oKGggLyAxODApICogTWF0aC5QSSkgOiAwXG5cdH07XG5cdGlmIChhbHBoYSAhPT0gdW5kZWZpbmVkKSByZXMuYWxwaGEgPSBhbHBoYTtcblx0cmV0dXJuIHJlcztcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNvbnZlcnRKY2hUb0phYjtcbiIsICJpbXBvcnQgY29udmVydEphYlRvSmNoIGZyb20gJy4vY29udmVydEphYlRvSmNoLmpzJztcbmltcG9ydCBjb252ZXJ0SmNoVG9KYWIgZnJvbSAnLi9jb252ZXJ0SmNoVG9KYWIuanMnO1xuaW1wb3J0IGNvbnZlcnRKYWJUb1JnYiBmcm9tICcuLi9qYWIvY29udmVydEphYlRvUmdiLmpzJztcbmltcG9ydCBjb252ZXJ0UmdiVG9KYWIgZnJvbSAnLi4vamFiL2NvbnZlcnRSZ2JUb0phYi5qcyc7XG5cbmltcG9ydCB7IGZpeHVwSHVlU2hvcnRlciB9IGZyb20gJy4uL2ZpeHVwL2h1ZS5qcyc7XG5pbXBvcnQgeyBmaXh1cEFscGhhIH0gZnJvbSAnLi4vZml4dXAvYWxwaGEuanMnO1xuaW1wb3J0IHsgaW50ZXJwb2xhdG9yTGluZWFyIH0gZnJvbSAnLi4vaW50ZXJwb2xhdGUvbGluZWFyLmpzJztcbmltcG9ydCB7IGRpZmZlcmVuY2VIdWVDaHJvbWEgfSBmcm9tICcuLi9kaWZmZXJlbmNlLmpzJztcbmltcG9ydCB7IGF2ZXJhZ2VBbmdsZSB9IGZyb20gJy4uL2F2ZXJhZ2UuanMnO1xuXG5jb25zdCBkZWZpbml0aW9uID0ge1xuXHRtb2RlOiAnamNoJyxcblxuXHRwYXJzZTogWyctLWp6Y3poeiddLFxuXHRzZXJpYWxpemU6ICctLWp6Y3poeicsXG5cblx0dG9Nb2RlOiB7XG5cdFx0amFiOiBjb252ZXJ0SmNoVG9KYWIsXG5cdFx0cmdiOiBjID0+IGNvbnZlcnRKYWJUb1JnYihjb252ZXJ0SmNoVG9KYWIoYykpXG5cdH0sXG5cblx0ZnJvbU1vZGU6IHtcblx0XHRyZ2I6IGMgPT4gY29udmVydEphYlRvSmNoKGNvbnZlcnRSZ2JUb0phYihjKSksXG5cdFx0amFiOiBjb252ZXJ0SmFiVG9KY2hcblx0fSxcblxuXHRjaGFubmVsczogWydqJywgJ2MnLCAnaCcsICdhbHBoYSddLFxuXG5cdHJhbmdlczoge1xuXHRcdGo6IFswLCAwLjIyMV0sXG5cdFx0YzogWzAsIDAuMTldLFxuXHRcdGg6IFswLCAzNjBdXG5cdH0sXG5cblx0aW50ZXJwb2xhdGU6IHtcblx0XHRoOiB7IHVzZTogaW50ZXJwb2xhdG9yTGluZWFyLCBmaXh1cDogZml4dXBIdWVTaG9ydGVyIH0sXG5cdFx0YzogaW50ZXJwb2xhdG9yTGluZWFyLFxuXHRcdGo6IGludGVycG9sYXRvckxpbmVhcixcblx0XHRhbHBoYTogeyB1c2U6IGludGVycG9sYXRvckxpbmVhciwgZml4dXA6IGZpeHVwQWxwaGEgfVxuXHR9LFxuXG5cdGRpZmZlcmVuY2U6IHtcblx0XHRoOiBkaWZmZXJlbmNlSHVlQ2hyb21hXG5cdH0sXG5cblx0YXZlcmFnZToge1xuXHRcdGg6IGF2ZXJhZ2VBbmdsZVxuXHR9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbml0aW9uO1xuIiwgImV4cG9ydCBjb25zdCBrID0gTWF0aC5wb3coMjksIDMpIC8gTWF0aC5wb3coMywgMyk7XG5leHBvcnQgY29uc3QgZSA9IE1hdGgucG93KDYsIDMpIC8gTWF0aC5wb3coMjksIDMpO1xuIiwgImltcG9ydCB7IGssIGUgfSBmcm9tICcuLi94eXo1MC9jb25zdGFudHMuanMnO1xuaW1wb3J0IHsgRDUwIH0gZnJvbSAnLi4vY29uc3RhbnRzLmpzJztcblxubGV0IGZuID0gdiA9PiAoTWF0aC5wb3codiwgMykgPiBlID8gTWF0aC5wb3codiwgMykgOiAoMTE2ICogdiAtIDE2KSAvIGspO1xuXG5jb25zdCBjb252ZXJ0TGFiVG9YeXo1MCA9ICh7IGwsIGEsIGIsIGFscGhhIH0pID0+IHtcblx0aWYgKGwgPT09IHVuZGVmaW5lZCkgbCA9IDA7XG5cdGlmIChhID09PSB1bmRlZmluZWQpIGEgPSAwO1xuXHRpZiAoYiA9PT0gdW5kZWZpbmVkKSBiID0gMDtcblx0bGV0IGZ5ID0gKGwgKyAxNikgLyAxMTY7XG5cdGxldCBmeCA9IGEgLyA1MDAgKyBmeTtcblx0bGV0IGZ6ID0gZnkgLSBiIC8gMjAwO1xuXG5cdGxldCByZXMgPSB7XG5cdFx0bW9kZTogJ3h5ejUwJyxcblx0XHR4OiBmbihmeCkgKiBENTAuWCxcblx0XHR5OiBmbihmeSkgKiBENTAuWSxcblx0XHR6OiBmbihmeikgKiBENTAuWlxuXHR9O1xuXG5cdGlmIChhbHBoYSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmVzLmFscGhhID0gYWxwaGE7XG5cdH1cblxuXHRyZXR1cm4gcmVzO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgY29udmVydExhYlRvWHl6NTA7XG4iLCAiLypcblx0Q0lFIFhZWiBENTAgdmFsdWVzIHRvIHNSR0IuXG5cblx0UmVmZXJlbmNlczpcblx0XHQqIGh0dHBzOi8vZHJhZnRzLmNzc3dnLm9yZy9jc3MtY29sb3IvI2NvbG9yLWNvbnZlcnNpb24tY29kZVxuXHRcdCogaHR0cDovL3d3dy5icnVjZWxpbmRibG9vbS5jb20vaW5kZXguaHRtbD9FcW5fUkdCX1hZWl9NYXRyaXguaHRtbFxuKi9cblxuaW1wb3J0IGNvbnZlcnRMcmdiVG9SZ2IgZnJvbSAnLi4vbHJnYi9jb252ZXJ0THJnYlRvUmdiLmpzJztcblxuY29uc3QgY29udmVydFh5ejUwVG9SZ2IgPSAoeyB4LCB5LCB6LCBhbHBoYSB9KSA9PiB7XG5cdGlmICh4ID09PSB1bmRlZmluZWQpIHggPSAwO1xuXHRpZiAoeSA9PT0gdW5kZWZpbmVkKSB5ID0gMDtcblx0aWYgKHogPT09IHVuZGVmaW5lZCkgeiA9IDA7XG5cdGxldCByZXMgPSBjb252ZXJ0THJnYlRvUmdiKHtcblx0XHRyOlxuXHRcdFx0eCAqIDMuMTM0MTM1OTU2OTk1ODcwNyAtXG5cdFx0XHR5ICogMS42MTczODYzMzIxNjEyNTM4IC1cblx0XHRcdDAuNDkwNjYxOTQ2MDA4MzUzMiAqIHosXG5cdFx0Zzpcblx0XHRcdHggKiAtMC45Nzg3OTU1MDI5MTIwODkgK1xuXHRcdFx0eSAqIDEuOTE2MjU0NTY3MjU5NTI0ICtcblx0XHRcdDAuMDMzNDQyNzMxMTYxMzE5NDkgKiB6LFxuXHRcdGI6XG5cdFx0XHR4ICogMC4wNzE5NTUzNzk4ODQxMTY3NyAtXG5cdFx0XHR5ICogMC4yMjg5NzY4MjY0MTU4MzIyICtcblx0XHRcdDEuNDA1Mzg2MDU4MzI0MTI1ICogelxuXHR9KTtcblx0aWYgKGFscGhhICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXMuYWxwaGEgPSBhbHBoYTtcblx0fVxuXHRyZXR1cm4gcmVzO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgY29udmVydFh5ejUwVG9SZ2I7XG4iLCAiaW1wb3J0IGNvbnZlcnRMYWJUb1h5ejUwIGZyb20gJy4vY29udmVydExhYlRvWHl6NTAuanMnO1xuaW1wb3J0IGNvbnZlcnRYeXo1MFRvUmdiIGZyb20gJy4uL3h5ejUwL2NvbnZlcnRYeXo1MFRvUmdiLmpzJztcblxuY29uc3QgY29udmVydExhYlRvUmdiID0gbGFiID0+IGNvbnZlcnRYeXo1MFRvUmdiKGNvbnZlcnRMYWJUb1h5ejUwKGxhYikpO1xuXG5leHBvcnQgZGVmYXVsdCBjb252ZXJ0TGFiVG9SZ2I7XG4iLCAiLypcblx0Q29udmVydCBzUkdCIHZhbHVlcyB0byBDSUUgWFlaIEQ1MFxuXG5cdFJlZmVyZW5jZXM6XG5cdFx0KiBodHRwczovL2RyYWZ0cy5jc3N3Zy5vcmcvY3NzLWNvbG9yLyNjb2xvci1jb252ZXJzaW9uLWNvZGVcblx0XHQqIGh0dHA6Ly93d3cuYnJ1Y2VsaW5kYmxvb20uY29tL2luZGV4Lmh0bWw/RXFuX1JHQl9YWVpfTWF0cml4Lmh0bWxcblx0XG4qL1xuXG5pbXBvcnQgY29udmVydFJnYlRvTHJnYiBmcm9tICcuLi9scmdiL2NvbnZlcnRSZ2JUb0xyZ2IuanMnO1xuXG5jb25zdCBjb252ZXJ0UmdiVG9YeXo1MCA9IHJnYiA9PiB7XG5cdGxldCB7IHIsIGcsIGIsIGFscGhhIH0gPSBjb252ZXJ0UmdiVG9McmdiKHJnYik7XG5cdGxldCByZXMgPSB7XG5cdFx0bW9kZTogJ3h5ejUwJyxcblx0XHR4OlxuXHRcdFx0MC40MzYwNjU3NDI4MjQ4MTEgKiByICtcblx0XHRcdDAuMzg1MTUxNDY4ODMzNzkxMiAqIGcgK1xuXHRcdFx0MC4xNDMwNzg0NTQ0MjI2NDE5NyAqIGIsXG5cdFx0eTpcblx0XHRcdDAuMjIyNDkzMTkxNzU2MjM3MDIgKiByICtcblx0XHRcdDAuNzE2ODg3MDUzODIzODgyMyAqIGcgK1xuXHRcdFx0MC4wNjA2MTk3OTA1MzYxNjUzNyAqIGIsXG5cdFx0ejpcblx0XHRcdDAuMDEzOTIzOTA0NTAwOTQzNDY1ICogciArXG5cdFx0XHQwLjA5NzA4MTI4NTY2NTc0NjM0ICogZyArXG5cdFx0XHQwLjcxNDA5OTM1ODQwMDUxNTUgKiBiXG5cdH07XG5cdGlmIChhbHBoYSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmVzLmFscGhhID0gYWxwaGE7XG5cdH1cblx0cmV0dXJuIHJlcztcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNvbnZlcnRSZ2JUb1h5ejUwO1xuIiwgImltcG9ydCB7IGssIGUgfSBmcm9tICcuLi94eXo1MC9jb25zdGFudHMuanMnO1xuaW1wb3J0IHsgRDUwIH0gZnJvbSAnLi4vY29uc3RhbnRzLmpzJztcblxuY29uc3QgZiA9IHZhbHVlID0+ICh2YWx1ZSA+IGUgPyBNYXRoLmNicnQodmFsdWUpIDogKGsgKiB2YWx1ZSArIDE2KSAvIDExNik7XG5cbmNvbnN0IGNvbnZlcnRYeXo1MFRvTGFiID0gKHsgeCwgeSwgeiwgYWxwaGEgfSkgPT4ge1xuXHRpZiAoeCA9PT0gdW5kZWZpbmVkKSB4ID0gMDtcblx0aWYgKHkgPT09IHVuZGVmaW5lZCkgeSA9IDA7XG5cdGlmICh6ID09PSB1bmRlZmluZWQpIHogPSAwO1xuXHRsZXQgZjAgPSBmKHggLyBENTAuWCk7XG5cdGxldCBmMSA9IGYoeSAvIEQ1MC5ZKTtcblx0bGV0IGYyID0gZih6IC8gRDUwLlopO1xuXG5cdGxldCByZXMgPSB7XG5cdFx0bW9kZTogJ2xhYicsXG5cdFx0bDogMTE2ICogZjEgLSAxNixcblx0XHRhOiA1MDAgKiAoZjAgLSBmMSksXG5cdFx0YjogMjAwICogKGYxIC0gZjIpXG5cdH07XG5cblx0aWYgKGFscGhhICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXMuYWxwaGEgPSBhbHBoYTtcblx0fVxuXG5cdHJldHVybiByZXM7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBjb252ZXJ0WHl6NTBUb0xhYjtcbiIsICJpbXBvcnQgY29udmVydFJnYlRvWHl6NTAgZnJvbSAnLi4veHl6NTAvY29udmVydFJnYlRvWHl6NTAuanMnO1xuaW1wb3J0IGNvbnZlcnRYeXo1MFRvTGFiIGZyb20gJy4vY29udmVydFh5ejUwVG9MYWIuanMnO1xuXG5jb25zdCBjb252ZXJ0UmdiVG9MYWIgPSByZ2IgPT4ge1xuXHRsZXQgcmVzID0gY29udmVydFh5ejUwVG9MYWIoY29udmVydFJnYlRvWHl6NTAocmdiKSk7XG5cblx0Ly8gRml4ZXMgYWNocm9tYXRpYyBSR0IgY29sb3JzIGhhdmluZyBhIF9zbGlnaHRfIGNocm9tYSBkdWUgdG8gZmxvYXRpbmctcG9pbnQgZXJyb3JzXG5cdC8vIGFuZCBhcHByb3hpbWF0ZWQgY29tcHV0YXRpb25zIGluIHNSR0IgPC0+IENJRUxhYi5cblx0Ly8gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vZDMvZDMtY29sb3IvcHVsbC80NlxuXHRpZiAocmdiLnIgPT09IHJnYi5iICYmIHJnYi5iID09PSByZ2IuZykge1xuXHRcdHJlcy5hID0gcmVzLmIgPSAwO1xuXHR9XG5cdHJldHVybiByZXM7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBjb252ZXJ0UmdiVG9MYWI7XG4iLCAiaW1wb3J0IHsgVG9rIH0gZnJvbSAnLi4vcGFyc2UuanMnO1xuXG5mdW5jdGlvbiBwYXJzZUxhYihjb2xvciwgcGFyc2VkKSB7XG5cdGlmICghcGFyc2VkIHx8IHBhcnNlZFswXSAhPT0gJ2xhYicpIHtcblx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHR9XG5cdGNvbnN0IHJlcyA9IHsgbW9kZTogJ2xhYicgfTtcblx0Y29uc3QgWywgbCwgYSwgYiwgYWxwaGFdID0gcGFyc2VkO1xuXHRpZiAobC50eXBlID09PSBUb2suSHVlIHx8IGEudHlwZSA9PT0gVG9rLkh1ZSB8fCBiLnR5cGUgPT09IFRvay5IdWUpIHtcblx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHR9XG5cdGlmIChsLnR5cGUgIT09IFRvay5Ob25lKSB7XG5cdFx0cmVzLmwgPSBNYXRoLm1pbihNYXRoLm1heCgwLCBsLnZhbHVlKSwgMTAwKTtcblx0fVxuXHRpZiAoYS50eXBlICE9PSBUb2suTm9uZSkge1xuXHRcdHJlcy5hID0gYS50eXBlID09PSBUb2suTnVtYmVyID8gYS52YWx1ZSA6IChhLnZhbHVlICogMTI1KSAvIDEwMDtcblx0fVxuXHRpZiAoYi50eXBlICE9PSBUb2suTm9uZSkge1xuXHRcdHJlcy5iID0gYi50eXBlID09PSBUb2suTnVtYmVyID8gYi52YWx1ZSA6IChiLnZhbHVlICogMTI1KSAvIDEwMDtcblx0fVxuXHRpZiAoYWxwaGEudHlwZSAhPT0gVG9rLk5vbmUpIHtcblx0XHRyZXMuYWxwaGEgPSBNYXRoLm1pbihcblx0XHRcdDEsXG5cdFx0XHRNYXRoLm1heChcblx0XHRcdFx0MCxcblx0XHRcdFx0YWxwaGEudHlwZSA9PT0gVG9rLk51bWJlciA/IGFscGhhLnZhbHVlIDogYWxwaGEudmFsdWUgLyAxMDBcblx0XHRcdClcblx0XHQpO1xuXHR9XG5cblx0cmV0dXJuIHJlcztcbn1cblxuZXhwb3J0IGRlZmF1bHQgcGFyc2VMYWI7XG4iLCAiaW1wb3J0IGNvbnZlcnRMYWJUb1JnYiBmcm9tICcuL2NvbnZlcnRMYWJUb1JnYi5qcyc7XG5pbXBvcnQgY29udmVydExhYlRvWHl6NTAgZnJvbSAnLi9jb252ZXJ0TGFiVG9YeXo1MC5qcyc7XG5pbXBvcnQgY29udmVydFJnYlRvTGFiIGZyb20gJy4vY29udmVydFJnYlRvTGFiLmpzJztcbmltcG9ydCBjb252ZXJ0WHl6NTBUb0xhYiBmcm9tICcuL2NvbnZlcnRYeXo1MFRvTGFiLmpzJztcbmltcG9ydCBwYXJzZUxhYiBmcm9tICcuL3BhcnNlTGFiLmpzJztcbmltcG9ydCB7IGludGVycG9sYXRvckxpbmVhciB9IGZyb20gJy4uL2ludGVycG9sYXRlL2xpbmVhci5qcyc7XG5pbXBvcnQgeyBmaXh1cEFscGhhIH0gZnJvbSAnLi4vZml4dXAvYWxwaGEuanMnO1xuXG5jb25zdCBkZWZpbml0aW9uID0ge1xuXHRtb2RlOiAnbGFiJyxcblxuXHR0b01vZGU6IHtcblx0XHR4eXo1MDogY29udmVydExhYlRvWHl6NTAsXG5cdFx0cmdiOiBjb252ZXJ0TGFiVG9SZ2Jcblx0fSxcblxuXHRmcm9tTW9kZToge1xuXHRcdHh5ejUwOiBjb252ZXJ0WHl6NTBUb0xhYixcblx0XHRyZ2I6IGNvbnZlcnRSZ2JUb0xhYlxuXHR9LFxuXG5cdGNoYW5uZWxzOiBbJ2wnLCAnYScsICdiJywgJ2FscGhhJ10sXG5cblx0cmFuZ2VzOiB7XG5cdFx0bDogWzAsIDEwMF0sXG5cdFx0YTogWy0xMjUsIDEyNV0sXG5cdFx0YjogWy0xMjUsIDEyNV1cblx0fSxcblxuXHRwYXJzZTogW3BhcnNlTGFiXSxcblx0c2VyaWFsaXplOiBjID0+XG5cdFx0YGxhYigke2MubCAhPT0gdW5kZWZpbmVkID8gYy5sIDogJ25vbmUnfSAke1xuXHRcdFx0Yy5hICE9PSB1bmRlZmluZWQgPyBjLmEgOiAnbm9uZSdcblx0XHR9ICR7Yy5iICE9PSB1bmRlZmluZWQgPyBjLmIgOiAnbm9uZSd9JHtcblx0XHRcdGMuYWxwaGEgPCAxID8gYCAvICR7Yy5hbHBoYX1gIDogJydcblx0XHR9KWAsXG5cblx0aW50ZXJwb2xhdGU6IHtcblx0XHRsOiBpbnRlcnBvbGF0b3JMaW5lYXIsXG5cdFx0YTogaW50ZXJwb2xhdG9yTGluZWFyLFxuXHRcdGI6IGludGVycG9sYXRvckxpbmVhcixcblx0XHRhbHBoYTogeyB1c2U6IGludGVycG9sYXRvckxpbmVhciwgZml4dXA6IGZpeHVwQWxwaGEgfVxuXHR9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbml0aW9uO1xuIiwgImltcG9ydCBjb252ZXJ0TGFiNjVUb1JnYiBmcm9tICcuL2NvbnZlcnRMYWI2NVRvUmdiLmpzJztcbmltcG9ydCBjb252ZXJ0TGFiNjVUb1h5ejY1IGZyb20gJy4vY29udmVydExhYjY1VG9YeXo2NS5qcyc7XG5pbXBvcnQgY29udmVydFJnYlRvTGFiNjUgZnJvbSAnLi9jb252ZXJ0UmdiVG9MYWI2NS5qcyc7XG5pbXBvcnQgY29udmVydFh5ejY1VG9MYWI2NSBmcm9tICcuL2NvbnZlcnRYeXo2NVRvTGFiNjUuanMnO1xuaW1wb3J0IGxhYiBmcm9tICcuLi9sYWIvZGVmaW5pdGlvbi5qcyc7XG5cbmNvbnN0IGRlZmluaXRpb24gPSB7XG5cdC4uLmxhYixcblx0bW9kZTogJ2xhYjY1JyxcblxuXHRwYXJzZTogWyctLWxhYi1kNjUnXSxcblx0c2VyaWFsaXplOiAnLS1sYWItZDY1JyxcblxuXHR0b01vZGU6IHtcblx0XHR4eXo2NTogY29udmVydExhYjY1VG9YeXo2NSxcblx0XHRyZ2I6IGNvbnZlcnRMYWI2NVRvUmdiXG5cdH0sXG5cblx0ZnJvbU1vZGU6IHtcblx0XHR4eXo2NTogY29udmVydFh5ejY1VG9MYWI2NSxcblx0XHRyZ2I6IGNvbnZlcnRSZ2JUb0xhYjY1XG5cdH0sXG5cblx0cmFuZ2VzOiB7XG5cdFx0bDogWzAsIDEwMF0sXG5cdFx0YTogWy0xMjUsIDEyNV0sXG5cdFx0YjogWy0xMjUsIDEyNV1cblx0fVxufTtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5pdGlvbjtcbiIsICJpbXBvcnQgeyBUb2sgfSBmcm9tICcuLi9wYXJzZS5qcyc7XG5cbmZ1bmN0aW9uIHBhcnNlTGNoKGNvbG9yLCBwYXJzZWQpIHtcblx0aWYgKCFwYXJzZWQgfHwgcGFyc2VkWzBdICE9PSAnbGNoJykge1xuXHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdH1cblx0Y29uc3QgcmVzID0geyBtb2RlOiAnbGNoJyB9O1xuXHRjb25zdCBbLCBsLCBjLCBoLCBhbHBoYV0gPSBwYXJzZWQ7XG5cdGlmIChsLnR5cGUgIT09IFRvay5Ob25lKSB7XG5cdFx0aWYgKGwudHlwZSA9PT0gVG9rLkh1ZSkge1xuXHRcdFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0XHR9XG5cdFx0cmVzLmwgPSBNYXRoLm1pbihNYXRoLm1heCgwLCBsLnZhbHVlKSwgMTAwKTtcblx0fVxuXHRpZiAoYy50eXBlICE9PSBUb2suTm9uZSkge1xuXHRcdHJlcy5jID0gTWF0aC5tYXgoXG5cdFx0XHQwLFxuXHRcdFx0Yy50eXBlID09PSBUb2suTnVtYmVyID8gYy52YWx1ZSA6IChjLnZhbHVlICogMTUwKSAvIDEwMFxuXHRcdCk7XG5cdH1cblx0aWYgKGgudHlwZSAhPT0gVG9rLk5vbmUpIHtcblx0XHRpZiAoaC50eXBlID09PSBUb2suUGVyY2VudGFnZSkge1xuXHRcdFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0XHR9XG5cdFx0cmVzLmggPSBoLnZhbHVlO1xuXHR9XG5cdGlmIChhbHBoYS50eXBlICE9PSBUb2suTm9uZSkge1xuXHRcdHJlcy5hbHBoYSA9IE1hdGgubWluKFxuXHRcdFx0MSxcblx0XHRcdE1hdGgubWF4KFxuXHRcdFx0XHQwLFxuXHRcdFx0XHRhbHBoYS50eXBlID09PSBUb2suTnVtYmVyID8gYWxwaGEudmFsdWUgOiBhbHBoYS52YWx1ZSAvIDEwMFxuXHRcdFx0KVxuXHRcdCk7XG5cdH1cblxuXHRyZXR1cm4gcmVzO1xufVxuXG5leHBvcnQgZGVmYXVsdCBwYXJzZUxjaDtcbiIsICJpbXBvcnQgY29udmVydExhYlRvTGNoIGZyb20gJy4vY29udmVydExhYlRvTGNoLmpzJztcbmltcG9ydCBjb252ZXJ0TGNoVG9MYWIgZnJvbSAnLi9jb252ZXJ0TGNoVG9MYWIuanMnO1xuaW1wb3J0IGNvbnZlcnRMYWJUb1JnYiBmcm9tICcuLi9sYWIvY29udmVydExhYlRvUmdiLmpzJztcbmltcG9ydCBjb252ZXJ0UmdiVG9MYWIgZnJvbSAnLi4vbGFiL2NvbnZlcnRSZ2JUb0xhYi5qcyc7XG5pbXBvcnQgcGFyc2VMY2ggZnJvbSAnLi9wYXJzZUxjaC5qcyc7XG5pbXBvcnQgeyBmaXh1cEh1ZVNob3J0ZXIgfSBmcm9tICcuLi9maXh1cC9odWUuanMnO1xuaW1wb3J0IHsgZml4dXBBbHBoYSB9IGZyb20gJy4uL2ZpeHVwL2FscGhhLmpzJztcbmltcG9ydCB7IGludGVycG9sYXRvckxpbmVhciB9IGZyb20gJy4uL2ludGVycG9sYXRlL2xpbmVhci5qcyc7XG5pbXBvcnQgeyBkaWZmZXJlbmNlSHVlQ2hyb21hIH0gZnJvbSAnLi4vZGlmZmVyZW5jZS5qcyc7XG5pbXBvcnQgeyBhdmVyYWdlQW5nbGUgfSBmcm9tICcuLi9hdmVyYWdlLmpzJztcblxuY29uc3QgZGVmaW5pdGlvbiA9IHtcblx0bW9kZTogJ2xjaCcsXG5cblx0dG9Nb2RlOiB7XG5cdFx0bGFiOiBjb252ZXJ0TGNoVG9MYWIsXG5cdFx0cmdiOiBjID0+IGNvbnZlcnRMYWJUb1JnYihjb252ZXJ0TGNoVG9MYWIoYykpXG5cdH0sXG5cblx0ZnJvbU1vZGU6IHtcblx0XHRyZ2I6IGMgPT4gY29udmVydExhYlRvTGNoKGNvbnZlcnRSZ2JUb0xhYihjKSksXG5cdFx0bGFiOiBjb252ZXJ0TGFiVG9MY2hcblx0fSxcblxuXHRjaGFubmVsczogWydsJywgJ2MnLCAnaCcsICdhbHBoYSddLFxuXG5cdHJhbmdlczoge1xuXHRcdGw6IFswLCAxMDBdLFxuXHRcdGM6IFswLCAxNTBdLFxuXHRcdGg6IFswLCAzNjBdXG5cdH0sXG5cblx0cGFyc2U6IFtwYXJzZUxjaF0sXG5cdHNlcmlhbGl6ZTogYyA9PlxuXHRcdGBsY2goJHtjLmwgIT09IHVuZGVmaW5lZCA/IGMubCA6ICdub25lJ30gJHtcblx0XHRcdGMuYyAhPT0gdW5kZWZpbmVkID8gYy5jIDogJ25vbmUnXG5cdFx0fSAke2MuaCAhPT0gdW5kZWZpbmVkID8gYy5oIDogJ25vbmUnfSR7XG5cdFx0XHRjLmFscGhhIDwgMSA/IGAgLyAke2MuYWxwaGF9YCA6ICcnXG5cdFx0fSlgLFxuXG5cdGludGVycG9sYXRlOiB7XG5cdFx0aDogeyB1c2U6IGludGVycG9sYXRvckxpbmVhciwgZml4dXA6IGZpeHVwSHVlU2hvcnRlciB9LFxuXHRcdGM6IGludGVycG9sYXRvckxpbmVhcixcblx0XHRsOiBpbnRlcnBvbGF0b3JMaW5lYXIsXG5cdFx0YWxwaGE6IHsgdXNlOiBpbnRlcnBvbGF0b3JMaW5lYXIsIGZpeHVwOiBmaXh1cEFscGhhIH1cblx0fSxcblxuXHRkaWZmZXJlbmNlOiB7XG5cdFx0aDogZGlmZmVyZW5jZUh1ZUNocm9tYVxuXHR9LFxuXG5cdGF2ZXJhZ2U6IHtcblx0XHRoOiBhdmVyYWdlQW5nbGVcblx0fVxufTtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5pdGlvbjtcbiIsICJpbXBvcnQgY29udmVydExhYlRvTGNoIGZyb20gJy4uL2xjaC9jb252ZXJ0TGFiVG9MY2guanMnO1xuaW1wb3J0IGNvbnZlcnRMY2hUb0xhYiBmcm9tICcuLi9sY2gvY29udmVydExjaFRvTGFiLmpzJztcbmltcG9ydCBjb252ZXJ0TGFiNjVUb1JnYiBmcm9tICcuLi9sYWI2NS9jb252ZXJ0TGFiNjVUb1JnYi5qcyc7XG5pbXBvcnQgY29udmVydFJnYlRvTGFiNjUgZnJvbSAnLi4vbGFiNjUvY29udmVydFJnYlRvTGFiNjUuanMnO1xuaW1wb3J0IGxjaCBmcm9tICcuLi9sY2gvZGVmaW5pdGlvbi5qcyc7XG5cbmNvbnN0IGRlZmluaXRpb24gPSB7XG5cdC4uLmxjaCxcblx0bW9kZTogJ2xjaDY1JyxcblxuXHRwYXJzZTogWyctLWxjaC1kNjUnXSxcblx0c2VyaWFsaXplOiAnLS1sY2gtZDY1JyxcblxuXHR0b01vZGU6IHtcblx0XHRsYWI2NTogYyA9PiBjb252ZXJ0TGNoVG9MYWIoYywgJ2xhYjY1JyksXG5cdFx0cmdiOiBjID0+IGNvbnZlcnRMYWI2NVRvUmdiKGNvbnZlcnRMY2hUb0xhYihjLCAnbGFiNjUnKSlcblx0fSxcblxuXHRmcm9tTW9kZToge1xuXHRcdHJnYjogYyA9PiBjb252ZXJ0TGFiVG9MY2goY29udmVydFJnYlRvTGFiNjUoYyksICdsY2g2NScpLFxuXHRcdGxhYjY1OiBjID0+IGNvbnZlcnRMYWJUb0xjaChjLCAnbGNoNjUnKVxuXHR9LFxuXG5cdHJhbmdlczoge1xuXHRcdGw6IFswLCAxMDBdLFxuXHRcdGM6IFswLCAxNTBdLFxuXHRcdGg6IFswLCAzNjBdXG5cdH1cbn07XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluaXRpb247XG4iLCAiaW1wb3J0IG5vcm1hbGl6ZUh1ZSBmcm9tICcuLi91dGlsL25vcm1hbGl6ZUh1ZS5qcyc7XG5cbmNvbnN0IGNvbnZlcnRMdXZUb0xjaHV2ID0gKHsgbCwgdSwgdiwgYWxwaGEgfSkgPT4ge1xuXHRpZiAodSA9PT0gdW5kZWZpbmVkKSB1ID0gMDtcblx0aWYgKHYgPT09IHVuZGVmaW5lZCkgdiA9IDA7XG5cdGxldCBjID0gTWF0aC5zcXJ0KHUgKiB1ICsgdiAqIHYpO1xuXHRsZXQgcmVzID0ge1xuXHRcdG1vZGU6ICdsY2h1dicsXG5cdFx0bDogbCxcblx0XHRjOiBjXG5cdH07XG5cdGlmIChjKSB7XG5cdFx0cmVzLmggPSBub3JtYWxpemVIdWUoKE1hdGguYXRhbjIodiwgdSkgKiAxODApIC8gTWF0aC5QSSk7XG5cdH1cblx0aWYgKGFscGhhICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXMuYWxwaGEgPSBhbHBoYTtcblx0fVxuXHRyZXR1cm4gcmVzO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgY29udmVydEx1dlRvTGNodXY7XG4iLCAiY29uc3QgY29udmVydExjaHV2VG9MdXYgPSAoeyBsLCBjLCBoLCBhbHBoYSB9KSA9PiB7XG5cdGlmIChoID09PSB1bmRlZmluZWQpIGggPSAwO1xuXHRsZXQgcmVzID0ge1xuXHRcdG1vZGU6ICdsdXYnLFxuXHRcdGw6IGwsXG5cdFx0dTogYyA/IGMgKiBNYXRoLmNvcygoaCAvIDE4MCkgKiBNYXRoLlBJKSA6IDAsXG5cdFx0djogYyA/IGMgKiBNYXRoLnNpbigoaCAvIDE4MCkgKiBNYXRoLlBJKSA6IDBcblx0fTtcblx0aWYgKGFscGhhICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXMuYWxwaGEgPSBhbHBoYTtcblx0fVxuXHRyZXR1cm4gcmVzO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgY29udmVydExjaHV2VG9MdXY7XG4iLCAiaW1wb3J0IHsgaywgZSB9IGZyb20gJy4uL3h5ejUwL2NvbnN0YW50cy5qcyc7XG5pbXBvcnQgeyBENTAgfSBmcm9tICcuLi9jb25zdGFudHMuanMnO1xuXG5leHBvcnQgY29uc3QgdV9mbiA9ICh4LCB5LCB6KSA9PiAoNCAqIHgpIC8gKHggKyAxNSAqIHkgKyAzICogeik7XG5leHBvcnQgY29uc3Qgdl9mbiA9ICh4LCB5LCB6KSA9PiAoOSAqIHkpIC8gKHggKyAxNSAqIHkgKyAzICogeik7XG5cbmV4cG9ydCBjb25zdCB1biA9IHVfZm4oRDUwLlgsIEQ1MC5ZLCBENTAuWik7XG5leHBvcnQgY29uc3Qgdm4gPSB2X2ZuKEQ1MC5YLCBENTAuWSwgRDUwLlopO1xuXG5jb25zdCBsX2ZuID0gdmFsdWUgPT4gKHZhbHVlIDw9IGUgPyBrICogdmFsdWUgOiAxMTYgKiBNYXRoLmNicnQodmFsdWUpIC0gMTYpO1xuXG5jb25zdCBjb252ZXJ0WHl6NTBUb0x1diA9ICh7IHgsIHksIHosIGFscGhhIH0pID0+IHtcblx0aWYgKHggPT09IHVuZGVmaW5lZCkgeCA9IDA7XG5cdGlmICh5ID09PSB1bmRlZmluZWQpIHkgPSAwO1xuXHRpZiAoeiA9PT0gdW5kZWZpbmVkKSB6ID0gMDtcblx0bGV0IGwgPSBsX2ZuKHkgLyBENTAuWSk7XG5cdGxldCB1ID0gdV9mbih4LCB5LCB6KTtcblx0bGV0IHYgPSB2X2ZuKHgsIHksIHopO1xuXG5cdC8vIGd1YXJkIGFnYWluc3QgTmFOcyBwcm9kdWNlZCBieSBgeHl6KDAgMCAwKWAgYmxhY2tcblx0aWYgKCFpc0Zpbml0ZSh1KSB8fCAhaXNGaW5pdGUodikpIHtcblx0XHRsID0gdSA9IHYgPSAwO1xuXHR9IGVsc2Uge1xuXHRcdHUgPSAxMyAqIGwgKiAodSAtIHVuKTtcblx0XHR2ID0gMTMgKiBsICogKHYgLSB2bik7XG5cdH1cblxuXHRsZXQgcmVzID0ge1xuXHRcdG1vZGU6ICdsdXYnLFxuXHRcdGwsXG5cdFx0dSxcblx0XHR2XG5cdH07XG5cblx0aWYgKGFscGhhICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXMuYWxwaGEgPSBhbHBoYTtcblx0fVxuXG5cdHJldHVybiByZXM7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBjb252ZXJ0WHl6NTBUb0x1djtcbiIsICJpbXBvcnQgeyBrIH0gZnJvbSAnLi4veHl6NTAvY29uc3RhbnRzLmpzJztcbmltcG9ydCB7IEQ1MCB9IGZyb20gJy4uL2NvbnN0YW50cy5qcyc7XG5cbmV4cG9ydCBjb25zdCB1X2ZuID0gKHgsIHksIHopID0+ICg0ICogeCkgLyAoeCArIDE1ICogeSArIDMgKiB6KTtcbmV4cG9ydCBjb25zdCB2X2ZuID0gKHgsIHksIHopID0+ICg5ICogeSkgLyAoeCArIDE1ICogeSArIDMgKiB6KTtcblxuZXhwb3J0IGNvbnN0IHVuID0gdV9mbihENTAuWCwgRDUwLlksIEQ1MC5aKTtcbmV4cG9ydCBjb25zdCB2biA9IHZfZm4oRDUwLlgsIEQ1MC5ZLCBENTAuWik7XG5cbmNvbnN0IGNvbnZlcnRMdXZUb1h5ejUwID0gKHsgbCwgdSwgdiwgYWxwaGEgfSkgPT4ge1xuXHRpZiAobCA9PT0gdW5kZWZpbmVkKSBsID0gMDtcblx0aWYgKGwgPT09IDApIHtcblx0XHRyZXR1cm4geyBtb2RlOiAneHl6NTAnLCB4OiAwLCB5OiAwLCB6OiAwIH07XG5cdH1cblxuXHRpZiAodSA9PT0gdW5kZWZpbmVkKSB1ID0gMDtcblx0aWYgKHYgPT09IHVuZGVmaW5lZCkgdiA9IDA7XG5cblx0bGV0IHVwID0gdSAvICgxMyAqIGwpICsgdW47XG5cdGxldCB2cCA9IHYgLyAoMTMgKiBsKSArIHZuO1xuXHRsZXQgeSA9IEQ1MC5ZICogKGwgPD0gOCA/IGwgLyBrIDogTWF0aC5wb3coKGwgKyAxNikgLyAxMTYsIDMpKTtcblx0bGV0IHggPSAoeSAqICg5ICogdXApKSAvICg0ICogdnApO1xuXHRsZXQgeiA9ICh5ICogKDEyIC0gMyAqIHVwIC0gMjAgKiB2cCkpIC8gKDQgKiB2cCk7XG5cblx0bGV0IHJlcyA9IHsgbW9kZTogJ3h5ejUwJywgeCwgeSwgeiB9O1xuXHRpZiAoYWxwaGEgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJlcy5hbHBoYSA9IGFscGhhO1xuXHR9XG5cblx0cmV0dXJuIHJlcztcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNvbnZlcnRMdXZUb1h5ejUwO1xuIiwgIi8qXG5cdENJRUxDaHV2IGNvbG9yIHNwYWNlXG5cdC0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cblx0UmVmZXJlbmNlOiBcblxuXHRcdGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0NJRUxVVlxuICovXG5cbmltcG9ydCBjb252ZXJ0THV2VG9MY2h1diBmcm9tICcuL2NvbnZlcnRMdXZUb0xjaHV2LmpzJztcbmltcG9ydCBjb252ZXJ0TGNodXZUb0x1diBmcm9tICcuL2NvbnZlcnRMY2h1dlRvTHV2LmpzJztcbmltcG9ydCBjb252ZXJ0WHl6NTBUb0x1diBmcm9tICcuLi9sdXYvY29udmVydFh5ejUwVG9MdXYuanMnO1xuaW1wb3J0IGNvbnZlcnRMdXZUb1h5ejUwIGZyb20gJy4uL2x1di9jb252ZXJ0THV2VG9YeXo1MC5qcyc7XG5pbXBvcnQgY29udmVydFh5ejUwVG9SZ2IgZnJvbSAnLi4veHl6NTAvY29udmVydFh5ejUwVG9SZ2IuanMnO1xuaW1wb3J0IGNvbnZlcnRSZ2JUb1h5ejUwIGZyb20gJy4uL3h5ejUwL2NvbnZlcnRSZ2JUb1h5ejUwLmpzJztcblxuaW1wb3J0IHsgZml4dXBIdWVTaG9ydGVyIH0gZnJvbSAnLi4vZml4dXAvaHVlLmpzJztcbmltcG9ydCB7IGZpeHVwQWxwaGEgfSBmcm9tICcuLi9maXh1cC9hbHBoYS5qcyc7XG5pbXBvcnQgeyBpbnRlcnBvbGF0b3JMaW5lYXIgfSBmcm9tICcuLi9pbnRlcnBvbGF0ZS9saW5lYXIuanMnO1xuaW1wb3J0IHsgZGlmZmVyZW5jZUh1ZUNocm9tYSB9IGZyb20gJy4uL2RpZmZlcmVuY2UuanMnO1xuaW1wb3J0IHsgYXZlcmFnZUFuZ2xlIH0gZnJvbSAnLi4vYXZlcmFnZS5qcyc7XG5cbmNvbnN0IGNvbnZlcnRSZ2JUb0xjaHV2ID0gcmdiID0+XG5cdGNvbnZlcnRMdXZUb0xjaHV2KGNvbnZlcnRYeXo1MFRvTHV2KGNvbnZlcnRSZ2JUb1h5ejUwKHJnYikpKTtcbmNvbnN0IGNvbnZlcnRMY2h1dlRvUmdiID0gbGNodXYgPT5cblx0Y29udmVydFh5ejUwVG9SZ2IoY29udmVydEx1dlRvWHl6NTAoY29udmVydExjaHV2VG9MdXYobGNodXYpKSk7XG5cbmNvbnN0IGRlZmluaXRpb24gPSB7XG5cdG1vZGU6ICdsY2h1dicsXG5cblx0dG9Nb2RlOiB7XG5cdFx0bHV2OiBjb252ZXJ0TGNodXZUb0x1dixcblx0XHRyZ2I6IGNvbnZlcnRMY2h1dlRvUmdiXG5cdH0sXG5cblx0ZnJvbU1vZGU6IHtcblx0XHRyZ2I6IGNvbnZlcnRSZ2JUb0xjaHV2LFxuXHRcdGx1djogY29udmVydEx1dlRvTGNodXZcblx0fSxcblxuXHRjaGFubmVsczogWydsJywgJ2MnLCAnaCcsICdhbHBoYSddLFxuXG5cdHBhcnNlOiBbJy0tbGNodXYnXSxcblx0c2VyaWFsaXplOiAnLS1sY2h1dicsXG5cblx0cmFuZ2VzOiB7XG5cdFx0bDogWzAsIDEwMF0sXG5cdFx0YzogWzAsIDE3Ni45NTZdLFxuXHRcdGg6IFswLCAzNjBdXG5cdH0sXG5cblx0aW50ZXJwb2xhdGU6IHtcblx0XHRoOiB7IHVzZTogaW50ZXJwb2xhdG9yTGluZWFyLCBmaXh1cDogZml4dXBIdWVTaG9ydGVyIH0sXG5cdFx0YzogaW50ZXJwb2xhdG9yTGluZWFyLFxuXHRcdGw6IGludGVycG9sYXRvckxpbmVhcixcblx0XHRhbHBoYTogeyB1c2U6IGludGVycG9sYXRvckxpbmVhciwgZml4dXA6IGZpeHVwQWxwaGEgfVxuXHR9LFxuXG5cdGRpZmZlcmVuY2U6IHtcblx0XHRoOiBkaWZmZXJlbmNlSHVlQ2hyb21hXG5cdH0sXG5cblx0YXZlcmFnZToge1xuXHRcdGg6IGF2ZXJhZ2VBbmdsZVxuXHR9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbml0aW9uO1xuIiwgImltcG9ydCByZ2IgZnJvbSAnLi4vcmdiL2RlZmluaXRpb24uanMnO1xuaW1wb3J0IGNvbnZlcnRSZ2JUb0xyZ2IgZnJvbSAnLi9jb252ZXJ0UmdiVG9McmdiLmpzJztcbmltcG9ydCBjb252ZXJ0THJnYlRvUmdiIGZyb20gJy4vY29udmVydExyZ2JUb1JnYi5qcyc7XG5cbmNvbnN0IGRlZmluaXRpb24gPSB7XG5cdC4uLnJnYixcblx0bW9kZTogJ2xyZ2InLFxuXG5cdHRvTW9kZToge1xuXHRcdHJnYjogY29udmVydExyZ2JUb1JnYlxuXHR9LFxuXG5cdGZyb21Nb2RlOiB7XG5cdFx0cmdiOiBjb252ZXJ0UmdiVG9McmdiXG5cdH0sXG5cblx0cGFyc2U6IFsnc3JnYi1saW5lYXInXSxcblx0c2VyaWFsaXplOiAnc3JnYi1saW5lYXInXG59O1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbml0aW9uO1xuIiwgIi8qXG5cdENJRUxVViBjb2xvciBzcGFjZVxuXHQtLS0tLS0tLS0tLS0tLS0tLS1cblxuXHRSZWZlcmVuY2U6IFxuXG5cdFx0aHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQ0lFTFVWXG4gKi9cblxuaW1wb3J0IGNvbnZlcnRYeXo1MFRvTHV2IGZyb20gJy4vY29udmVydFh5ejUwVG9MdXYuanMnO1xuaW1wb3J0IGNvbnZlcnRMdXZUb1h5ejUwIGZyb20gJy4vY29udmVydEx1dlRvWHl6NTAuanMnO1xuaW1wb3J0IGNvbnZlcnRYeXo1MFRvUmdiIGZyb20gJy4uL3h5ejUwL2NvbnZlcnRYeXo1MFRvUmdiLmpzJztcbmltcG9ydCBjb252ZXJ0UmdiVG9YeXo1MCBmcm9tICcuLi94eXo1MC9jb252ZXJ0UmdiVG9YeXo1MC5qcyc7XG5cbmltcG9ydCB7IGludGVycG9sYXRvckxpbmVhciB9IGZyb20gJy4uL2ludGVycG9sYXRlL2xpbmVhci5qcyc7XG5pbXBvcnQgeyBmaXh1cEFscGhhIH0gZnJvbSAnLi4vZml4dXAvYWxwaGEuanMnO1xuXG5jb25zdCBkZWZpbml0aW9uID0ge1xuXHRtb2RlOiAnbHV2JyxcblxuXHR0b01vZGU6IHtcblx0XHR4eXo1MDogY29udmVydEx1dlRvWHl6NTAsXG5cdFx0cmdiOiBsdXYgPT4gY29udmVydFh5ejUwVG9SZ2IoY29udmVydEx1dlRvWHl6NTAobHV2KSlcblx0fSxcblxuXHRmcm9tTW9kZToge1xuXHRcdHh5ejUwOiBjb252ZXJ0WHl6NTBUb0x1dixcblx0XHRyZ2I6IHJnYiA9PiBjb252ZXJ0WHl6NTBUb0x1dihjb252ZXJ0UmdiVG9YeXo1MChyZ2IpKVxuXHR9LFxuXG5cdGNoYW5uZWxzOiBbJ2wnLCAndScsICd2JywgJ2FscGhhJ10sXG5cblx0cGFyc2U6IFsnLS1sdXYnXSxcblx0c2VyaWFsaXplOiAnLS1sdXYnLFxuXG5cdHJhbmdlczoge1xuXHRcdGw6IFswLCAxMDBdLFxuXHRcdHU6IFstODQuOTM2LCAxNzUuMDQyXSxcblx0XHR2OiBbLTEyNS44ODIsIDg3LjI0M11cblx0fSxcblxuXHRpbnRlcnBvbGF0ZToge1xuXHRcdGw6IGludGVycG9sYXRvckxpbmVhcixcblx0XHR1OiBpbnRlcnBvbGF0b3JMaW5lYXIsXG5cdFx0djogaW50ZXJwb2xhdG9yTGluZWFyLFxuXHRcdGFscGhhOiB7IHVzZTogaW50ZXJwb2xhdG9yTGluZWFyLCBmaXh1cDogZml4dXBBbHBoYSB9XG5cdH1cbn07XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluaXRpb247XG4iLCAiY29uc3QgY29udmVydExyZ2JUb09rbGFiID0gKHsgciwgZywgYiwgYWxwaGEgfSkgPT4ge1xuXHRpZiAociA9PT0gdW5kZWZpbmVkKSByID0gMDtcblx0aWYgKGcgPT09IHVuZGVmaW5lZCkgZyA9IDA7XG5cdGlmIChiID09PSB1bmRlZmluZWQpIGIgPSAwO1xuXG5cdGxldCBMID0gTWF0aC5jYnJ0KFxuXHRcdDAuNDEyMjIxNDY5NDcwNzYzICogciArIDAuNTM2MzMyNTM3MjYxNzM0OCAqIGcgKyAwLjA1MTQ0NTk5MzI2NzUwMjIgKiBiXG5cdCk7XG5cdGxldCBNID0gTWF0aC5jYnJ0KFxuXHRcdDAuMjExOTAzNDk1ODE3ODI1MiAqIHIgKyAwLjY4MDY5OTU1MDY0NTIzNDQgKiBnICsgMC4xMDczOTY5NTM1MzY5NDA2ICogYlxuXHQpO1xuXHRsZXQgUyA9IE1hdGguY2JydChcblx0XHQwLjA4ODMwMjQ1OTE5MDA1NjQgKiByICsgMC4yODE3MTg4MzkxMzYxMjE1ICogZyArIDAuNjI5OTc4NzAxNjczODIyMiAqIGJcblx0KTtcblxuXHRsZXQgcmVzID0ge1xuXHRcdG1vZGU6ICdva2xhYicsXG5cdFx0bDpcblx0XHRcdDAuMjEwNDU0MjY4MzA5MzE0ICogTCArXG5cdFx0XHQwLjc5MzYxNzc3NDcwMjMwNTQgKiBNIC1cblx0XHRcdDAuMDA0MDcyMDQzMDExNjE5MyAqIFMsXG5cdFx0YTpcblx0XHRcdDEuOTc3OTk4NTMyNDMxMTY4NCAqIEwgLVxuXHRcdFx0Mi40Mjg1OTIyNDIwNDg1Nzk5ICogTSArXG5cdFx0XHQwLjQ1MDU5MzcwOTYxNzQxMSAqIFMsXG5cdFx0Yjpcblx0XHRcdDAuMDI1OTA0MDQyNDY1NTQ3OCAqIEwgK1xuXHRcdFx0MC43ODI3NzE3MTI0NTc1Mjk2ICogTSAtXG5cdFx0XHQwLjgwODY3NTc1NDkyMzA3NzQgKiBTXG5cdH07XG5cblx0aWYgKGFscGhhICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXMuYWxwaGEgPSBhbHBoYTtcblx0fVxuXG5cdHJldHVybiByZXM7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBjb252ZXJ0THJnYlRvT2tsYWI7XG4iLCAiaW1wb3J0IGNvbnZlcnRSZ2JUb0xyZ2IgZnJvbSAnLi4vbHJnYi9jb252ZXJ0UmdiVG9McmdiLmpzJztcbmltcG9ydCBjb252ZXJ0THJnYlRvT2tsYWIgZnJvbSAnLi9jb252ZXJ0THJnYlRvT2tsYWIuanMnO1xuXG5jb25zdCBjb252ZXJ0UmdiVG9Pa2xhYiA9IHJnYiA9PiB7XG5cdGxldCByZXMgPSBjb252ZXJ0THJnYlRvT2tsYWIoY29udmVydFJnYlRvTHJnYihyZ2IpKTtcblx0aWYgKHJnYi5yID09PSByZ2IuYiAmJiByZ2IuYiA9PT0gcmdiLmcpIHtcblx0XHRyZXMuYSA9IHJlcy5iID0gMDtcblx0fVxuXHRyZXR1cm4gcmVzO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgY29udmVydFJnYlRvT2tsYWI7XG4iLCAiY29uc3QgY29udmVydE9rbGFiVG9McmdiID0gKHsgbCwgYSwgYiwgYWxwaGEgfSkgPT4ge1xuXHRpZiAobCA9PT0gdW5kZWZpbmVkKSBsID0gMDtcblx0aWYgKGEgPT09IHVuZGVmaW5lZCkgYSA9IDA7XG5cdGlmIChiID09PSB1bmRlZmluZWQpIGIgPSAwO1xuXG5cdGxldCBMID0gTWF0aC5wb3cobCArIDAuMzk2MzM3Nzc3Mzc2MTc0OSAqIGEgKyAwLjIxNTgwMzc1NzMwOTkxMzYgKiBiLCAzKTtcblx0bGV0IE0gPSBNYXRoLnBvdyhsIC0gMC4xMDU1NjEzNDU4MTU2NTg2ICogYSAtIDAuMDYzODU0MTcyODI1ODEzMyAqIGIsIDMpO1xuXHRsZXQgUyA9IE1hdGgucG93KGwgLSAwLjA4OTQ4NDE3NzUyOTgxMTkgKiBhIC0gMS4yOTE0ODU1NDgwMTk0MDkyICogYiwgMyk7XG5cblx0bGV0IHJlcyA9IHtcblx0XHRtb2RlOiAnbHJnYicsXG5cdFx0cjpcblx0XHRcdDQuMDc2NzQxNjM2MDc1OTU3NCAqIEwgLVxuXHRcdFx0My4zMDc3MTE1MzkyNTgwNjE2ICogTSArXG5cdFx0XHQwLjIzMDk2OTkwMzE4MjEwNDQgKiBTLFxuXHRcdGc6XG5cdFx0XHQtMS4yNjg0Mzc5NzMyODUwMzE3ICogTCArXG5cdFx0XHQyLjYwOTc1NzM0OTI4NzY4ODcgKiBNIC1cblx0XHRcdDAuMzQxMzE5Mzc2MDAyNjU3MyAqIFMsXG5cdFx0Yjpcblx0XHRcdC0wLjAwNDE5NjA3NjEzODY3NTYgKiBMIC1cblx0XHRcdDAuNzAzNDE4NjE3OTM1OTM2MiAqIE0gK1xuXHRcdFx0MS43MDc2MTQ2OTQwNzQ2MTE3ICogU1xuXHR9O1xuXG5cdGlmIChhbHBoYSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmVzLmFscGhhID0gYWxwaGE7XG5cdH1cblxuXHRyZXR1cm4gcmVzO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgY29udmVydE9rbGFiVG9McmdiO1xuIiwgImltcG9ydCBjb252ZXJ0THJnYlRvUmdiIGZyb20gJy4uL2xyZ2IvY29udmVydExyZ2JUb1JnYi5qcyc7XG5pbXBvcnQgY29udmVydE9rbGFiVG9McmdiIGZyb20gJy4vY29udmVydE9rbGFiVG9McmdiLmpzJztcblxuY29uc3QgY29udmVydE9rbGFiVG9SZ2IgPSBjID0+IGNvbnZlcnRMcmdiVG9SZ2IoY29udmVydE9rbGFiVG9McmdiKGMpKTtcblxuZXhwb3J0IGRlZmF1bHQgY29udmVydE9rbGFiVG9SZ2I7XG4iLCAiLypcblx0QWRhcHRlZCBmcm9tIGNvZGUgYnkgQmpcdTAwRjZybiBPdHRvc3Nvbixcblx0cmVsZWFzZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlOlxuXG5cdENvcHlyaWdodCAoYykgMjAyMSBCalx1MDBGNnJuIE90dG9zc29uXG5cblx0UGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weSBvZlxuXHR0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluXG5cdHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG9cblx0dXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXNcblx0b2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvXG5cdHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcblxuXHRUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpbiBhbGxcblx0Y29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cblxuXHRUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG5cdElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuXHRGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcblx0QVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuXHRMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuXHRPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRVxuXHRTT0ZUV0FSRS5cbiAqL1xuXG5pbXBvcnQgY29udmVydE9rbGFiVG9McmdiIGZyb20gJy4uL29rbGFiL2NvbnZlcnRPa2xhYlRvTHJnYi5qcyc7XG5cbmV4cG9ydCBmdW5jdGlvbiB0b2UoeCkge1xuXHRjb25zdCBrXzEgPSAwLjIwNjtcblx0Y29uc3Qga18yID0gMC4wMztcblx0Y29uc3Qga18zID0gKDEgKyBrXzEpIC8gKDEgKyBrXzIpO1xuXHRyZXR1cm4gKFxuXHRcdDAuNSAqXG5cdFx0KGtfMyAqIHggLVxuXHRcdFx0a18xICtcblx0XHRcdE1hdGguc3FydCgoa18zICogeCAtIGtfMSkgKiAoa18zICogeCAtIGtfMSkgKyA0ICoga18yICoga18zICogeCkpXG5cdCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0b2VfaW52KHgpIHtcblx0Y29uc3Qga18xID0gMC4yMDY7XG5cdGNvbnN0IGtfMiA9IDAuMDM7XG5cdGNvbnN0IGtfMyA9ICgxICsga18xKSAvICgxICsga18yKTtcblx0cmV0dXJuICh4ICogeCArIGtfMSAqIHgpIC8gKGtfMyAqICh4ICsga18yKSk7XG59XG5cbi8vIEZpbmRzIHRoZSBtYXhpbXVtIHNhdHVyYXRpb24gcG9zc2libGUgZm9yIGEgZ2l2ZW4gaHVlIHRoYXQgZml0cyBpbiBzUkdCXG4vLyBTYXR1cmF0aW9uIGhlcmUgaXMgZGVmaW5lZCBhcyBTID0gQy9MXG4vLyBhIGFuZCBiIG11c3QgYmUgbm9ybWFsaXplZCBzbyBhXjIgKyBiXjIgPT0gMVxuZnVuY3Rpb24gY29tcHV0ZV9tYXhfc2F0dXJhdGlvbihhLCBiKSB7XG5cdC8vIE1heCBzYXR1cmF0aW9uIHdpbGwgYmUgd2hlbiBvbmUgb2YgciwgZyBvciBiIGdvZXMgYmVsb3cgemVyby5cblxuXHQvLyBTZWxlY3QgZGlmZmVyZW50IGNvZWZmaWNpZW50cyBkZXBlbmRpbmcgb24gd2hpY2ggY29tcG9uZW50IGdvZXMgYmVsb3cgemVybyBmaXJzdFxuXHRsZXQgazAsIGsxLCBrMiwgazMsIGs0LCB3bCwgd20sIHdzO1xuXG5cdGlmICgtMS44ODE3MDMyOCAqIGEgLSAwLjgwOTM2NDkzICogYiA+IDEpIHtcblx0XHQvLyBSZWQgY29tcG9uZW50XG5cdFx0azAgPSArMS4xOTA4NjI3Nztcblx0XHRrMSA9ICsxLjc2NTc2NzI4O1xuXHRcdGsyID0gKzAuNTk2NjI2NDE7XG5cdFx0azMgPSArMC43NTUxNTE5Nztcblx0XHRrNCA9ICswLjU2NzcxMjQ1O1xuXHRcdHdsID0gKzQuMDc2NzQxNjYyMTtcblx0XHR3bSA9IC0zLjMwNzcxMTU5MTM7XG5cdFx0d3MgPSArMC4yMzA5Njk5MjkyO1xuXHR9IGVsc2UgaWYgKDEuODE0NDQxMDQgKiBhIC0gMS4xOTQ0NTI3NiAqIGIgPiAxKSB7XG5cdFx0Ly8gR3JlZW4gY29tcG9uZW50XG5cdFx0azAgPSArMC43Mzk1NjUxNTtcblx0XHRrMSA9IC0wLjQ1OTU0NDA0O1xuXHRcdGsyID0gKzAuMDgyODU0Mjc7XG5cdFx0azMgPSArMC4xMjU0MTA3O1xuXHRcdGs0ID0gKzAuMTQ1MDMyMDQ7XG5cdFx0d2wgPSAtMS4yNjg0MzgwMDQ2O1xuXHRcdHdtID0gKzIuNjA5NzU3NDAxMTtcblx0XHR3cyA9IC0wLjM0MTMxOTM5NjU7XG5cdH0gZWxzZSB7XG5cdFx0Ly8gQmx1ZSBjb21wb25lbnRcblx0XHRrMCA9ICsxLjM1NzMzNjUyO1xuXHRcdGsxID0gLTAuMDA5MTU3OTk7XG5cdFx0azIgPSAtMS4xNTEzMDIxO1xuXHRcdGszID0gLTAuNTA1NTk2MDY7XG5cdFx0azQgPSArMC4wMDY5MjE2Nztcblx0XHR3bCA9IC0wLjAwNDE5NjA4NjM7XG5cdFx0d20gPSAtMC43MDM0MTg2MTQ3O1xuXHRcdHdzID0gKzEuNzA3NjE0NzAxO1xuXHR9XG5cblx0Ly8gQXBwcm94aW1hdGUgbWF4IHNhdHVyYXRpb24gdXNpbmcgYSBwb2x5bm9taWFsOlxuXHRsZXQgUyA9IGswICsgazEgKiBhICsgazIgKiBiICsgazMgKiBhICogYSArIGs0ICogYSAqIGI7XG5cblx0Ly8gRG8gb25lIHN0ZXAgSGFsbGV5J3MgbWV0aG9kIHRvIGdldCBjbG9zZXJcblx0Ly8gdGhpcyBnaXZlcyBhbiBlcnJvciBsZXNzIHRoYW4gMTBlNiwgZXhjZXB0IGZvciBzb21lIGJsdWUgaHVlcyB3aGVyZSB0aGUgZFMvZGggaXMgY2xvc2UgdG8gaW5maW5pdGVcblx0Ly8gdGhpcyBzaG91bGQgYmUgc3VmZmljaWVudCBmb3IgbW9zdCBhcHBsaWNhdGlvbnMsIG90aGVyd2lzZSBkbyB0d28vdGhyZWUgc3RlcHNcblxuXHRsZXQga19sID0gKzAuMzk2MzM3Nzc3NCAqIGEgKyAwLjIxNTgwMzc1NzMgKiBiO1xuXHRsZXQga19tID0gLTAuMTA1NTYxMzQ1OCAqIGEgLSAwLjA2Mzg1NDE3MjggKiBiO1xuXHRsZXQga19zID0gLTAuMDg5NDg0MTc3NSAqIGEgLSAxLjI5MTQ4NTU0OCAqIGI7XG5cblx0e1xuXHRcdGxldCBsXyA9IDEgKyBTICoga19sO1xuXHRcdGxldCBtXyA9IDEgKyBTICoga19tO1xuXHRcdGxldCBzXyA9IDEgKyBTICoga19zO1xuXG5cdFx0bGV0IGwgPSBsXyAqIGxfICogbF87XG5cdFx0bGV0IG0gPSBtXyAqIG1fICogbV87XG5cdFx0bGV0IHMgPSBzXyAqIHNfICogc187XG5cblx0XHRsZXQgbF9kUyA9IDMgKiBrX2wgKiBsXyAqIGxfO1xuXHRcdGxldCBtX2RTID0gMyAqIGtfbSAqIG1fICogbV87XG5cdFx0bGV0IHNfZFMgPSAzICoga19zICogc18gKiBzXztcblxuXHRcdGxldCBsX2RTMiA9IDYgKiBrX2wgKiBrX2wgKiBsXztcblx0XHRsZXQgbV9kUzIgPSA2ICoga19tICoga19tICogbV87XG5cdFx0bGV0IHNfZFMyID0gNiAqIGtfcyAqIGtfcyAqIHNfO1xuXG5cdFx0bGV0IGYgPSB3bCAqIGwgKyB3bSAqIG0gKyB3cyAqIHM7XG5cdFx0bGV0IGYxID0gd2wgKiBsX2RTICsgd20gKiBtX2RTICsgd3MgKiBzX2RTO1xuXHRcdGxldCBmMiA9IHdsICogbF9kUzIgKyB3bSAqIG1fZFMyICsgd3MgKiBzX2RTMjtcblxuXHRcdFMgPSBTIC0gKGYgKiBmMSkgLyAoZjEgKiBmMSAtIDAuNSAqIGYgKiBmMik7XG5cdH1cblxuXHRyZXR1cm4gUztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZpbmRfY3VzcChhLCBiKSB7XG5cdC8vIEZpcnN0LCBmaW5kIHRoZSBtYXhpbXVtIHNhdHVyYXRpb24gKHNhdHVyYXRpb24gUyA9IEMvTClcblx0bGV0IFNfY3VzcCA9IGNvbXB1dGVfbWF4X3NhdHVyYXRpb24oYSwgYik7XG5cblx0Ly8gQ29udmVydCB0byBsaW5lYXIgc1JHQiB0byBmaW5kIHRoZSBmaXJzdCBwb2ludCB3aGVyZSBhdCBsZWFzdCBvbmUgb2YgcixnIG9yIGIgPj0gMTpcblx0bGV0IHJnYiA9IGNvbnZlcnRPa2xhYlRvTHJnYih7IGw6IDEsIGE6IFNfY3VzcCAqIGEsIGI6IFNfY3VzcCAqIGIgfSk7XG5cdGxldCBMX2N1c3AgPSBNYXRoLmNicnQoMSAvIE1hdGgubWF4KHJnYi5yLCByZ2IuZywgcmdiLmIpKTtcblx0bGV0IENfY3VzcCA9IExfY3VzcCAqIFNfY3VzcDtcblxuXHRyZXR1cm4gW0xfY3VzcCwgQ19jdXNwXTtcbn1cblxuLy8gRmluZHMgaW50ZXJzZWN0aW9uIG9mIHRoZSBsaW5lIGRlZmluZWQgYnlcbi8vIEwgPSBMMCAqICgxIC0gdCkgKyB0ICogTDE7XG4vLyBDID0gdCAqIEMxO1xuLy8gYSBhbmQgYiBtdXN0IGJlIG5vcm1hbGl6ZWQgc28gYV4yICsgYl4yID09IDFcbmZ1bmN0aW9uIGZpbmRfZ2FtdXRfaW50ZXJzZWN0aW9uKGEsIGIsIEwxLCBDMSwgTDAsIGN1c3AgPSBudWxsKSB7XG5cdGlmICghY3VzcCkge1xuXHRcdC8vIEZpbmQgdGhlIGN1c3Agb2YgdGhlIGdhbXV0IHRyaWFuZ2xlXG5cdFx0Y3VzcCA9IGZpbmRfY3VzcChhLCBiKTtcblx0fVxuXG5cdC8vIEZpbmQgdGhlIGludGVyc2VjdGlvbiBmb3IgdXBwZXIgYW5kIGxvd2VyIGhhbGYgc2VwcmF0ZWx5XG5cdGxldCB0O1xuXHRpZiAoKEwxIC0gTDApICogY3VzcFsxXSAtIChjdXNwWzBdIC0gTDApICogQzEgPD0gMCkge1xuXHRcdC8vIExvd2VyIGhhbGZcblxuXHRcdHQgPSAoY3VzcFsxXSAqIEwwKSAvIChDMSAqIGN1c3BbMF0gKyBjdXNwWzFdICogKEwwIC0gTDEpKTtcblx0fSBlbHNlIHtcblx0XHQvLyBVcHBlciBoYWxmXG5cblx0XHQvLyBGaXJzdCBpbnRlcnNlY3Qgd2l0aCB0cmlhbmdsZVxuXHRcdHQgPSAoY3VzcFsxXSAqIChMMCAtIDEpKSAvIChDMSAqIChjdXNwWzBdIC0gMSkgKyBjdXNwWzFdICogKEwwIC0gTDEpKTtcblxuXHRcdC8vIFRoZW4gb25lIHN0ZXAgSGFsbGV5J3MgbWV0aG9kXG5cdFx0e1xuXHRcdFx0bGV0IGRMID0gTDEgLSBMMDtcblx0XHRcdGxldCBkQyA9IEMxO1xuXG5cdFx0XHRsZXQga19sID0gKzAuMzk2MzM3Nzc3NCAqIGEgKyAwLjIxNTgwMzc1NzMgKiBiO1xuXHRcdFx0bGV0IGtfbSA9IC0wLjEwNTU2MTM0NTggKiBhIC0gMC4wNjM4NTQxNzI4ICogYjtcblx0XHRcdGxldCBrX3MgPSAtMC4wODk0ODQxNzc1ICogYSAtIDEuMjkxNDg1NTQ4ICogYjtcblxuXHRcdFx0bGV0IGxfZHQgPSBkTCArIGRDICoga19sO1xuXHRcdFx0bGV0IG1fZHQgPSBkTCArIGRDICoga19tO1xuXHRcdFx0bGV0IHNfZHQgPSBkTCArIGRDICoga19zO1xuXG5cdFx0XHQvLyBJZiBoaWdoZXIgYWNjdXJhY3kgaXMgcmVxdWlyZWQsIDIgb3IgMyBpdGVyYXRpb25zIG9mIHRoZSBmb2xsb3dpbmcgYmxvY2sgY2FuIGJlIHVzZWQ6XG5cdFx0XHR7XG5cdFx0XHRcdGxldCBMID0gTDAgKiAoMSAtIHQpICsgdCAqIEwxO1xuXHRcdFx0XHRsZXQgQyA9IHQgKiBDMTtcblxuXHRcdFx0XHRsZXQgbF8gPSBMICsgQyAqIGtfbDtcblx0XHRcdFx0bGV0IG1fID0gTCArIEMgKiBrX207XG5cdFx0XHRcdGxldCBzXyA9IEwgKyBDICoga19zO1xuXG5cdFx0XHRcdGxldCBsID0gbF8gKiBsXyAqIGxfO1xuXHRcdFx0XHRsZXQgbSA9IG1fICogbV8gKiBtXztcblx0XHRcdFx0bGV0IHMgPSBzXyAqIHNfICogc187XG5cblx0XHRcdFx0bGV0IGxkdCA9IDMgKiBsX2R0ICogbF8gKiBsXztcblx0XHRcdFx0bGV0IG1kdCA9IDMgKiBtX2R0ICogbV8gKiBtXztcblx0XHRcdFx0bGV0IHNkdCA9IDMgKiBzX2R0ICogc18gKiBzXztcblxuXHRcdFx0XHRsZXQgbGR0MiA9IDYgKiBsX2R0ICogbF9kdCAqIGxfO1xuXHRcdFx0XHRsZXQgbWR0MiA9IDYgKiBtX2R0ICogbV9kdCAqIG1fO1xuXHRcdFx0XHRsZXQgc2R0MiA9IDYgKiBzX2R0ICogc19kdCAqIHNfO1xuXG5cdFx0XHRcdGxldCByID1cblx0XHRcdFx0XHQ0LjA3Njc0MTY2MjEgKiBsIC0gMy4zMDc3MTE1OTEzICogbSArIDAuMjMwOTY5OTI5MiAqIHMgLSAxO1xuXHRcdFx0XHRsZXQgcjEgPVxuXHRcdFx0XHRcdDQuMDc2NzQxNjYyMSAqIGxkdCAtXG5cdFx0XHRcdFx0My4zMDc3MTE1OTEzICogbWR0ICtcblx0XHRcdFx0XHQwLjIzMDk2OTkyOTIgKiBzZHQ7XG5cdFx0XHRcdGxldCByMiA9XG5cdFx0XHRcdFx0NC4wNzY3NDE2NjIxICogbGR0MiAtXG5cdFx0XHRcdFx0My4zMDc3MTE1OTEzICogbWR0MiArXG5cdFx0XHRcdFx0MC4yMzA5Njk5MjkyICogc2R0MjtcblxuXHRcdFx0XHRsZXQgdV9yID0gcjEgLyAocjEgKiByMSAtIDAuNSAqIHIgKiByMik7XG5cdFx0XHRcdGxldCB0X3IgPSAtciAqIHVfcjtcblxuXHRcdFx0XHRsZXQgZyA9XG5cdFx0XHRcdFx0LTEuMjY4NDM4MDA0NiAqIGwgKyAyLjYwOTc1NzQwMTEgKiBtIC0gMC4zNDEzMTkzOTY1ICogcyAtIDE7XG5cdFx0XHRcdGxldCBnMSA9XG5cdFx0XHRcdFx0LTEuMjY4NDM4MDA0NiAqIGxkdCArXG5cdFx0XHRcdFx0Mi42MDk3NTc0MDExICogbWR0IC1cblx0XHRcdFx0XHQwLjM0MTMxOTM5NjUgKiBzZHQ7XG5cdFx0XHRcdGxldCBnMiA9XG5cdFx0XHRcdFx0LTEuMjY4NDM4MDA0NiAqIGxkdDIgK1xuXHRcdFx0XHRcdDIuNjA5NzU3NDAxMSAqIG1kdDIgLVxuXHRcdFx0XHRcdDAuMzQxMzE5Mzk2NSAqIHNkdDI7XG5cblx0XHRcdFx0bGV0IHVfZyA9IGcxIC8gKGcxICogZzEgLSAwLjUgKiBnICogZzIpO1xuXHRcdFx0XHRsZXQgdF9nID0gLWcgKiB1X2c7XG5cblx0XHRcdFx0bGV0IGIgPVxuXHRcdFx0XHRcdC0wLjAwNDE5NjA4NjMgKiBsIC0gMC43MDM0MTg2MTQ3ICogbSArIDEuNzA3NjE0NzAxICogcyAtIDE7XG5cdFx0XHRcdGxldCBiMSA9XG5cdFx0XHRcdFx0LTAuMDA0MTk2MDg2MyAqIGxkdCAtXG5cdFx0XHRcdFx0MC43MDM0MTg2MTQ3ICogbWR0ICtcblx0XHRcdFx0XHQxLjcwNzYxNDcwMSAqIHNkdDtcblx0XHRcdFx0bGV0IGIyID1cblx0XHRcdFx0XHQtMC4wMDQxOTYwODYzICogbGR0MiAtXG5cdFx0XHRcdFx0MC43MDM0MTg2MTQ3ICogbWR0MiArXG5cdFx0XHRcdFx0MS43MDc2MTQ3MDEgKiBzZHQyO1xuXG5cdFx0XHRcdGxldCB1X2IgPSBiMSAvIChiMSAqIGIxIC0gMC41ICogYiAqIGIyKTtcblx0XHRcdFx0bGV0IHRfYiA9IC1iICogdV9iO1xuXG5cdFx0XHRcdHRfciA9IHVfciA+PSAwID8gdF9yIDogMTBlNTtcblx0XHRcdFx0dF9nID0gdV9nID49IDAgPyB0X2cgOiAxMGU1O1xuXHRcdFx0XHR0X2IgPSB1X2IgPj0gMCA/IHRfYiA6IDEwZTU7XG5cblx0XHRcdFx0dCArPSBNYXRoLm1pbih0X3IsIE1hdGgubWluKHRfZywgdF9iKSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIHQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRfU1RfbWF4KGFfLCBiXywgY3VzcCA9IG51bGwpIHtcblx0aWYgKCFjdXNwKSB7XG5cdFx0Y3VzcCA9IGZpbmRfY3VzcChhXywgYl8pO1xuXHR9XG5cdGxldCBMID0gY3VzcFswXTtcblx0bGV0IEMgPSBjdXNwWzFdO1xuXHRyZXR1cm4gW0MgLyBMLCBDIC8gKDEgLSBMKV07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRfU1RfbWlkKGFfLCBiXykge1xuXHRsZXQgUyA9XG5cdFx0MC4xMTUxNjk5MyArXG5cdFx0MSAvXG5cdFx0XHQoKzcuNDQ3Nzg5NyArXG5cdFx0XHRcdDQuMTU5MDEyNCAqIGJfICtcblx0XHRcdFx0YV8gKlxuXHRcdFx0XHRcdCgtMi4xOTU1NzM0NyArXG5cdFx0XHRcdFx0XHQxLjc1MTk4NDAxICogYl8gK1xuXHRcdFx0XHRcdFx0YV8gKlxuXHRcdFx0XHRcdFx0XHQoLTIuMTM3MDQ5NDggLVxuXHRcdFx0XHRcdFx0XHRcdDEwLjAyMzAxMDQzICogYl8gK1xuXHRcdFx0XHRcdFx0XHRcdGFfICpcblx0XHRcdFx0XHRcdFx0XHRcdCgtNC4yNDg5NDU2MSArXG5cdFx0XHRcdFx0XHRcdFx0XHRcdDUuMzg3NzA4MTkgKiBiXyArXG5cdFx0XHRcdFx0XHRcdFx0XHRcdDQuNjk4OTEwMTMgKiBhXykpKSk7XG5cblx0bGV0IFQgPVxuXHRcdDAuMTEyMzk2NDIgK1xuXHRcdDEgL1xuXHRcdFx0KCsxLjYxMzIwMzIgLVxuXHRcdFx0XHQwLjY4MTI0Mzc5ICogYl8gK1xuXHRcdFx0XHRhXyAqXG5cdFx0XHRcdFx0KCswLjQwMzcwNjEyICtcblx0XHRcdFx0XHRcdDAuOTAxNDgxMjMgKiBiXyArXG5cdFx0XHRcdFx0XHRhXyAqXG5cdFx0XHRcdFx0XHRcdCgtMC4yNzA4Nzk0MyArXG5cdFx0XHRcdFx0XHRcdFx0MC42MTIyMzk5ICogYl8gK1xuXHRcdFx0XHRcdFx0XHRcdGFfICpcblx0XHRcdFx0XHRcdFx0XHRcdCgrMC4wMDI5OTIxNSAtXG5cdFx0XHRcdFx0XHRcdFx0XHRcdDAuNDUzOTk1NjggKiBiXyAtXG5cdFx0XHRcdFx0XHRcdFx0XHRcdDAuMTQ2NjE4NzIgKiBhXykpKSk7XG5cblx0cmV0dXJuIFtTLCBUXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldF9DcyhMLCBhXywgYl8pIHtcblx0bGV0IGN1c3AgPSBmaW5kX2N1c3AoYV8sIGJfKTtcblxuXHRsZXQgQ19tYXggPSBmaW5kX2dhbXV0X2ludGVyc2VjdGlvbihhXywgYl8sIEwsIDEsIEwsIGN1c3ApO1xuXHRsZXQgU1RfbWF4ID0gZ2V0X1NUX21heChhXywgYl8sIGN1c3ApO1xuXG5cdGxldCBTX21pZCA9XG5cdFx0MC4xMTUxNjk5MyArXG5cdFx0MSAvXG5cdFx0XHQoKzcuNDQ3Nzg5NyArXG5cdFx0XHRcdDQuMTU5MDEyNCAqIGJfICtcblx0XHRcdFx0YV8gKlxuXHRcdFx0XHRcdCgtMi4xOTU1NzM0NyArXG5cdFx0XHRcdFx0XHQxLjc1MTk4NDAxICogYl8gK1xuXHRcdFx0XHRcdFx0YV8gKlxuXHRcdFx0XHRcdFx0XHQoLTIuMTM3MDQ5NDggLVxuXHRcdFx0XHRcdFx0XHRcdDEwLjAyMzAxMDQzICogYl8gK1xuXHRcdFx0XHRcdFx0XHRcdGFfICpcblx0XHRcdFx0XHRcdFx0XHRcdCgtNC4yNDg5NDU2MSArXG5cdFx0XHRcdFx0XHRcdFx0XHRcdDUuMzg3NzA4MTkgKiBiXyArXG5cdFx0XHRcdFx0XHRcdFx0XHRcdDQuNjk4OTEwMTMgKiBhXykpKSk7XG5cblx0bGV0IFRfbWlkID1cblx0XHQwLjExMjM5NjQyICtcblx0XHQxIC9cblx0XHRcdCgrMS42MTMyMDMyIC1cblx0XHRcdFx0MC42ODEyNDM3OSAqIGJfICtcblx0XHRcdFx0YV8gKlxuXHRcdFx0XHRcdCgrMC40MDM3MDYxMiArXG5cdFx0XHRcdFx0XHQwLjkwMTQ4MTIzICogYl8gK1xuXHRcdFx0XHRcdFx0YV8gKlxuXHRcdFx0XHRcdFx0XHQoLTAuMjcwODc5NDMgK1xuXHRcdFx0XHRcdFx0XHRcdDAuNjEyMjM5OSAqIGJfICtcblx0XHRcdFx0XHRcdFx0XHRhXyAqXG5cdFx0XHRcdFx0XHRcdFx0XHQoKzAuMDAyOTkyMTUgLVxuXHRcdFx0XHRcdFx0XHRcdFx0XHQwLjQ1Mzk5NTY4ICogYl8gLVxuXHRcdFx0XHRcdFx0XHRcdFx0XHQwLjE0NjYxODcyICogYV8pKSkpO1xuXG5cdGxldCBrID0gQ19tYXggLyBNYXRoLm1pbihMICogU1RfbWF4WzBdLCAoMSAtIEwpICogU1RfbWF4WzFdKTtcblxuXHRsZXQgQ19hID0gTCAqIFNfbWlkO1xuXHRsZXQgQ19iID0gKDEgLSBMKSAqIFRfbWlkO1xuXHRsZXQgQ19taWQgPVxuXHRcdDAuOSAqXG5cdFx0ayAqXG5cdFx0TWF0aC5zcXJ0KFxuXHRcdFx0TWF0aC5zcXJ0KFxuXHRcdFx0XHQxIC8gKDEgLyAoQ19hICogQ19hICogQ19hICogQ19hKSArIDEgLyAoQ19iICogQ19iICogQ19iICogQ19iKSlcblx0XHRcdClcblx0XHQpO1xuXG5cdENfYSA9IEwgKiAwLjQ7XG5cdENfYiA9ICgxIC0gTCkgKiAwLjg7XG5cdGxldCBDXzAgPSBNYXRoLnNxcnQoMSAvICgxIC8gKENfYSAqIENfYSkgKyAxIC8gKENfYiAqIENfYikpKTtcblx0cmV0dXJuIFtDXzAsIENfbWlkLCBDX21heF07XG59XG4iLCAiLypcblx0QWRhcHRlZCBmcm9tIGNvZGUgYnkgQmpcdTAwRjZybiBPdHRvc3Nvbixcblx0cmVsZWFzZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlOlxuXG5cdENvcHlyaWdodCAoYykgMjAyMSBCalx1MDBGNnJuIE90dG9zc29uXG5cblx0UGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weSBvZlxuXHR0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluXG5cdHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG9cblx0dXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXNcblx0b2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvXG5cdHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcblxuXHRUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpbiBhbGxcblx0Y29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cblxuXHRUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG5cdElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuXHRGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcblx0QVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuXHRMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuXHRPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRVxuXHRTT0ZUV0FSRS5cbiAqL1xuXG5pbXBvcnQgbm9ybWFsaXplSHVlIGZyb20gJy4uL3V0aWwvbm9ybWFsaXplSHVlLmpzJztcbmltcG9ydCB7IGdldF9DcywgdG9lIH0gZnJvbSAnLi9oZWxwZXJzLmpzJztcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gY29udmVydE9rbGFiVG9Pa2hzbChsYWIpIHtcblx0Y29uc3QgbCA9IGxhYi5sICE9PSB1bmRlZmluZWQgPyBsYWIubCA6IDA7XG5cdGNvbnN0IGEgPSBsYWIuYSAhPT0gdW5kZWZpbmVkID8gbGFiLmEgOiAwO1xuXHRjb25zdCBiID0gbGFiLmIgIT09IHVuZGVmaW5lZCA/IGxhYi5iIDogMDtcblxuXHRjb25zdCByZXQgPSB7IG1vZGU6ICdva2hzbCcsIGw6IHRvZShsKSB9O1xuXG5cdGlmIChsYWIuYWxwaGEgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldC5hbHBoYSA9IGxhYi5hbHBoYTtcblx0fVxuXHRsZXQgYyA9IE1hdGguc3FydChhICogYSArIGIgKiBiKTtcblx0aWYgKCFjKSB7XG5cdFx0cmV0LnMgPSAwO1xuXHRcdHJldHVybiByZXQ7XG5cdH1cblx0bGV0IFtDXzAsIENfbWlkLCBDX21heF0gPSBnZXRfQ3MobCwgYSAvIGMsIGIgLyBjKTtcblx0bGV0IHM7XG5cdGlmIChjIDwgQ19taWQpIHtcblx0XHRsZXQga18wID0gMDtcblx0XHRsZXQga18xID0gMC44ICogQ18wO1xuXHRcdGxldCBrXzIgPSAxIC0ga18xIC8gQ19taWQ7XG5cdFx0bGV0IHQgPSAoYyAtIGtfMCkgLyAoa18xICsga18yICogKGMgLSBrXzApKTtcblx0XHRzID0gdCAqIDAuODtcblx0fSBlbHNlIHtcblx0XHRsZXQga18wID0gQ19taWQ7XG5cdFx0bGV0IGtfMSA9ICgwLjIgKiBDX21pZCAqIENfbWlkICogMS4yNSAqIDEuMjUpIC8gQ18wO1xuXHRcdGxldCBrXzIgPSAxIC0ga18xIC8gKENfbWF4IC0gQ19taWQpO1xuXHRcdGxldCB0ID0gKGMgLSBrXzApIC8gKGtfMSArIGtfMiAqIChjIC0ga18wKSk7XG5cdFx0cyA9IDAuOCArIDAuMiAqIHQ7XG5cdH1cblx0aWYgKHMpIHtcblx0XHRyZXQucyA9IHM7XG5cdFx0cmV0LmggPSBub3JtYWxpemVIdWUoKE1hdGguYXRhbjIoYiwgYSkgKiAxODApIC8gTWF0aC5QSSk7XG5cdH1cblx0cmV0dXJuIHJldDtcbn1cbiIsICIvKlxuXHRBZGFwdGVkIGZyb20gY29kZSBieSBCalx1MDBGNnJuIE90dG9zc29uLFxuXHRyZWxlYXNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2U6XG5cblx0Q29weXJpZ2h0IChjKSAyMDIxIEJqXHUwMEY2cm4gT3R0b3Nzb25cblxuXHRQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5IG9mXG5cdHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW5cblx0dGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0b1xuXHR1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllc1xuXHRvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG9cblx0c28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuXG5cdFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluIGFsbFxuXHRjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuXG5cdFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1Jcblx0SU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG5cdEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuXHRBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG5cdExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG5cdE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFXG5cdFNPRlRXQVJFLlxuICovXG5cbmltcG9ydCB7IHRvZV9pbnYsIGdldF9DcyB9IGZyb20gJy4vaGVscGVycy5qcyc7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGNvbnZlcnRPa2hzbFRvT2tsYWIoaHNsKSB7XG5cdGxldCBoID0gaHNsLmggIT09IHVuZGVmaW5lZCA/IGhzbC5oIDogMDtcblx0bGV0IHMgPSBoc2wucyAhPT0gdW5kZWZpbmVkID8gaHNsLnMgOiAwO1xuXHRsZXQgbCA9IGhzbC5sICE9PSB1bmRlZmluZWQgPyBoc2wubCA6IDA7XG5cblx0Y29uc3QgcmV0ID0geyBtb2RlOiAnb2tsYWInLCBsOiB0b2VfaW52KGwpIH07XG5cblx0aWYgKGhzbC5hbHBoYSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0LmFscGhhID0gaHNsLmFscGhhO1xuXHR9XG5cblx0aWYgKCFzIHx8IGwgPT09IDEpIHtcblx0XHRyZXQuYSA9IHJldC5iID0gMDtcblx0XHRyZXR1cm4gcmV0O1xuXHR9XG5cblx0bGV0IGFfID0gTWF0aC5jb3MoKGggLyAxODApICogTWF0aC5QSSk7XG5cdGxldCBiXyA9IE1hdGguc2luKChoIC8gMTgwKSAqIE1hdGguUEkpO1xuXHRsZXQgW0NfMCwgQ19taWQsIENfbWF4XSA9IGdldF9DcyhyZXQubCwgYV8sIGJfKTtcblx0bGV0IHQsIGtfMCwga18xLCBrXzI7XG5cdGlmIChzIDwgMC44KSB7XG5cdFx0dCA9IDEuMjUgKiBzO1xuXHRcdGtfMCA9IDA7XG5cdFx0a18xID0gMC44ICogQ18wO1xuXHRcdGtfMiA9IDEgLSBrXzEgLyBDX21pZDtcblx0fSBlbHNlIHtcblx0XHR0ID0gNSAqIChzIC0gMC44KTtcblx0XHRrXzAgPSBDX21pZDtcblx0XHRrXzEgPSAoMC4yICogQ19taWQgKiBDX21pZCAqIDEuMjUgKiAxLjI1KSAvIENfMDtcblx0XHRrXzIgPSAxIC0ga18xIC8gKENfbWF4IC0gQ19taWQpO1xuXHR9XG5cdGxldCBDID0ga18wICsgKHQgKiBrXzEpIC8gKDEgLSBrXzIgKiB0KTtcblx0cmV0LmEgPSBDICogYV87XG5cdHJldC5iID0gQyAqIGJfO1xuXG5cdHJldHVybiByZXQ7XG59XG4iLCAiaW1wb3J0IGNvbnZlcnRSZ2JUb09rbGFiIGZyb20gJy4uL29rbGFiL2NvbnZlcnRSZ2JUb09rbGFiLmpzJztcbmltcG9ydCBjb252ZXJ0T2tsYWJUb1JnYiBmcm9tICcuLi9va2xhYi9jb252ZXJ0T2tsYWJUb1JnYi5qcyc7XG5pbXBvcnQgY29udmVydE9rbGFiVG9Pa2hzbCBmcm9tICcuL2NvbnZlcnRPa2xhYlRvT2toc2wuanMnO1xuaW1wb3J0IGNvbnZlcnRPa2hzbFRvT2tsYWIgZnJvbSAnLi9jb252ZXJ0T2toc2xUb09rbGFiLmpzJztcblxuaW1wb3J0IG1vZGVIc2wgZnJvbSAnLi4vaHNsL2RlZmluaXRpb24uanMnO1xuXG5jb25zdCBtb2RlT2toc2wgPSB7XG5cdC4uLm1vZGVIc2wsXG5cdG1vZGU6ICdva2hzbCcsXG5cdGNoYW5uZWxzOiBbJ2gnLCAncycsICdsJywgJ2FscGhhJ10sXG5cdHBhcnNlOiBbJy0tb2toc2wnXSxcblx0c2VyaWFsaXplOiAnLS1va2hzbCcsXG5cdGZyb21Nb2RlOiB7XG5cdFx0b2tsYWI6IGNvbnZlcnRPa2xhYlRvT2toc2wsXG5cdFx0cmdiOiBjID0+IGNvbnZlcnRPa2xhYlRvT2toc2woY29udmVydFJnYlRvT2tsYWIoYykpXG5cdH0sXG5cdHRvTW9kZToge1xuXHRcdG9rbGFiOiBjb252ZXJ0T2toc2xUb09rbGFiLFxuXHRcdHJnYjogYyA9PiBjb252ZXJ0T2tsYWJUb1JnYihjb252ZXJ0T2toc2xUb09rbGFiKGMpKVxuXHR9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBtb2RlT2toc2w7XG4iLCAiLypcblx0QWRhcHRlZCBmcm9tIGNvZGUgYnkgQmpcdTAwRjZybiBPdHRvc3Nvbixcblx0cmVsZWFzZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlOlxuXG5cdENvcHlyaWdodCAoYykgMjAyMSBCalx1MDBGNnJuIE90dG9zc29uXG5cblx0UGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weSBvZlxuXHR0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluXG5cdHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG9cblx0dXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXNcblx0b2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvXG5cdHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcblxuXHRUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpbiBhbGxcblx0Y29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cblxuXHRUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG5cdElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuXHRGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcblx0QVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuXHRMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuXHRPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRVxuXHRTT0ZUV0FSRS5cbiAqL1xuXG5pbXBvcnQgbm9ybWFsaXplSHVlIGZyb20gJy4uL3V0aWwvbm9ybWFsaXplSHVlLmpzJztcbmltcG9ydCBjb252ZXJ0T2tsYWJUb0xyZ2IgZnJvbSAnLi4vb2tsYWIvY29udmVydE9rbGFiVG9McmdiLmpzJztcbmltcG9ydCB7IGdldF9TVF9tYXgsIHRvZV9pbnYsIHRvZSB9IGZyb20gJy4uL29raHNsL2hlbHBlcnMuanMnO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBjb252ZXJ0T2tsYWJUb09raHN2KGxhYikge1xuXHRsZXQgbCA9IGxhYi5sICE9PSB1bmRlZmluZWQgPyBsYWIubCA6IDA7XG5cdGxldCBhID0gbGFiLmEgIT09IHVuZGVmaW5lZCA/IGxhYi5hIDogMDtcblx0bGV0IGIgPSBsYWIuYiAhPT0gdW5kZWZpbmVkID8gbGFiLmIgOiAwO1xuXG5cdGxldCBjID0gTWF0aC5zcXJ0KGEgKiBhICsgYiAqIGIpO1xuXG5cdC8vIFRPRE86IGMgPSAwXG5cdGxldCBhXyA9IGMgPyBhIC8gYyA6IDE7XG5cdGxldCBiXyA9IGMgPyBiIC8gYyA6IDE7XG5cblx0bGV0IFtTX21heCwgVF0gPSBnZXRfU1RfbWF4KGFfLCBiXyk7XG5cdGxldCBTXzAgPSAwLjU7XG5cdGxldCBrID0gMSAtIFNfMCAvIFNfbWF4O1xuXG5cdGxldCB0ID0gVCAvIChjICsgbCAqIFQpO1xuXHRsZXQgTF92ID0gdCAqIGw7XG5cdGxldCBDX3YgPSB0ICogYztcblxuXHRsZXQgTF92dCA9IHRvZV9pbnYoTF92KTtcblx0bGV0IENfdnQgPSAoQ192ICogTF92dCkgLyBMX3Y7XG5cblx0bGV0IHJnYl9zY2FsZSA9IGNvbnZlcnRPa2xhYlRvTHJnYih7IGw6IExfdnQsIGE6IGFfICogQ192dCwgYjogYl8gKiBDX3Z0IH0pO1xuXHRsZXQgc2NhbGVfTCA9IE1hdGguY2JydChcblx0XHQxIC8gTWF0aC5tYXgocmdiX3NjYWxlLnIsIHJnYl9zY2FsZS5nLCByZ2Jfc2NhbGUuYiwgMClcblx0KTtcblxuXHRsID0gbCAvIHNjYWxlX0w7XG5cdGMgPSAoKGMgLyBzY2FsZV9MKSAqIHRvZShsKSkgLyBsO1xuXHRsID0gdG9lKGwpO1xuXG5cdGNvbnN0IHJldCA9IHtcblx0XHRtb2RlOiAnb2toc3YnLFxuXHRcdHM6IGMgPyAoKFNfMCArIFQpICogQ192KSAvIChUICogU18wICsgVCAqIGsgKiBDX3YpIDogMCxcblx0XHR2OiBsID8gbCAvIExfdiA6IDBcblx0fTtcblx0aWYgKHJldC5zKSB7XG5cdFx0cmV0LmggPSBub3JtYWxpemVIdWUoKE1hdGguYXRhbjIoYiwgYSkgKiAxODApIC8gTWF0aC5QSSk7XG5cdH1cblx0aWYgKGxhYi5hbHBoYSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0LmFscGhhID0gbGFiLmFscGhhO1xuXHR9XG5cdHJldHVybiByZXQ7XG59XG4iLCAiLypcblx0Q29weXJpZ2h0IChjKSAyMDIxIEJqXHUwMEY2cm4gT3R0b3Nzb25cblxuXHRQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5IG9mXG5cdHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW5cblx0dGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0b1xuXHR1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllc1xuXHRvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG9cblx0c28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuXG5cdFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluIGFsbFxuXHRjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuXG5cdFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1Jcblx0SU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG5cdEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuXHRBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG5cdExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG5cdE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFXG5cdFNPRlRXQVJFLlxuICovXG5cbmltcG9ydCBjb252ZXJ0T2tsYWJUb0xyZ2IgZnJvbSAnLi4vb2tsYWIvY29udmVydE9rbGFiVG9McmdiLmpzJztcbmltcG9ydCB7IGdldF9TVF9tYXgsIHRvZV9pbnYgfSBmcm9tICcuLi9va2hzbC9oZWxwZXJzLmpzJztcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gY29udmVydE9raHN2VG9Pa2xhYihoc3YpIHtcblx0Y29uc3QgcmV0ID0geyBtb2RlOiAnb2tsYWInIH07XG5cdGlmIChoc3YuYWxwaGEgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldC5hbHBoYSA9IGhzdi5hbHBoYTtcblx0fVxuXG5cdGNvbnN0IGggPSBoc3YuaCAhPT0gdW5kZWZpbmVkID8gaHN2LmggOiAwO1xuXHRjb25zdCBzID0gaHN2LnMgIT09IHVuZGVmaW5lZCA/IGhzdi5zIDogMDtcblx0Y29uc3QgdiA9IGhzdi52ICE9PSB1bmRlZmluZWQgPyBoc3YudiA6IDA7XG5cblx0Y29uc3QgYV8gPSBNYXRoLmNvcygoaCAvIDE4MCkgKiBNYXRoLlBJKTtcblx0Y29uc3QgYl8gPSBNYXRoLnNpbigoaCAvIDE4MCkgKiBNYXRoLlBJKTtcblxuXHRjb25zdCBbU19tYXgsIFRdID0gZ2V0X1NUX21heChhXywgYl8pO1xuXHRjb25zdCBTXzAgPSAwLjU7XG5cdGNvbnN0IGsgPSAxIC0gU18wIC8gU19tYXg7XG5cdGNvbnN0IExfdiA9IDEgLSAocyAqIFNfMCkgLyAoU18wICsgVCAtIFQgKiBrICogcyk7XG5cdGNvbnN0IENfdiA9IChzICogVCAqIFNfMCkgLyAoU18wICsgVCAtIFQgKiBrICogcyk7XG5cblx0Y29uc3QgTF92dCA9IHRvZV9pbnYoTF92KTtcblx0Y29uc3QgQ192dCA9IChDX3YgKiBMX3Z0KSAvIExfdjtcblx0Y29uc3QgcmdiX3NjYWxlID0gY29udmVydE9rbGFiVG9McmdiKHtcblx0XHRsOiBMX3Z0LFxuXHRcdGE6IGFfICogQ192dCxcblx0XHRiOiBiXyAqIENfdnRcblx0fSk7XG5cdGNvbnN0IHNjYWxlX0wgPSBNYXRoLmNicnQoXG5cdFx0MSAvIE1hdGgubWF4KHJnYl9zY2FsZS5yLCByZ2Jfc2NhbGUuZywgcmdiX3NjYWxlLmIsIDApXG5cdCk7XG5cblx0Y29uc3QgTF9uZXcgPSB0b2VfaW52KHYgKiBMX3YpO1xuXHRjb25zdCBDID0gKENfdiAqIExfbmV3KSAvIExfdjtcblxuXHRyZXQubCA9IExfbmV3ICogc2NhbGVfTDtcblx0cmV0LmEgPSBDICogYV8gKiBzY2FsZV9MO1xuXHRyZXQuYiA9IEMgKiBiXyAqIHNjYWxlX0w7XG5cblx0cmV0dXJuIHJldDtcbn1cbiIsICJpbXBvcnQgY29udmVydFJnYlRvT2tsYWIgZnJvbSAnLi4vb2tsYWIvY29udmVydFJnYlRvT2tsYWIuanMnO1xuaW1wb3J0IGNvbnZlcnRPa2xhYlRvUmdiIGZyb20gJy4uL29rbGFiL2NvbnZlcnRPa2xhYlRvUmdiLmpzJztcbmltcG9ydCBjb252ZXJ0T2tsYWJUb09raHN2IGZyb20gJy4vY29udmVydE9rbGFiVG9Pa2hzdi5qcyc7XG5pbXBvcnQgY29udmVydE9raHN2VG9Pa2xhYiBmcm9tICcuL2NvbnZlcnRPa2hzdlRvT2tsYWIuanMnO1xuXG5pbXBvcnQgbW9kZUhzdiBmcm9tICcuLi9oc3YvZGVmaW5pdGlvbi5qcyc7XG5cbmNvbnN0IG1vZGVPa2hzdiA9IHtcblx0Li4ubW9kZUhzdixcblx0bW9kZTogJ29raHN2Jyxcblx0Y2hhbm5lbHM6IFsnaCcsICdzJywgJ3YnLCAnYWxwaGEnXSxcblx0cGFyc2U6IFsnLS1va2hzdiddLFxuXHRzZXJpYWxpemU6ICctLW9raHN2Jyxcblx0ZnJvbU1vZGU6IHtcblx0XHRva2xhYjogY29udmVydE9rbGFiVG9Pa2hzdixcblx0XHRyZ2I6IGMgPT4gY29udmVydE9rbGFiVG9Pa2hzdihjb252ZXJ0UmdiVG9Pa2xhYihjKSlcblx0fSxcblx0dG9Nb2RlOiB7XG5cdFx0b2tsYWI6IGNvbnZlcnRPa2hzdlRvT2tsYWIsXG5cdFx0cmdiOiBjID0+IGNvbnZlcnRPa2xhYlRvUmdiKGNvbnZlcnRPa2hzdlRvT2tsYWIoYykpXG5cdH1cbn07XG5cbmV4cG9ydCBkZWZhdWx0IG1vZGVPa2hzdjtcbiIsICJpbXBvcnQgeyBUb2sgfSBmcm9tICcuLi9wYXJzZS5qcyc7XG5cbmZ1bmN0aW9uIHBhcnNlT2tsYWIoY29sb3IsIHBhcnNlZCkge1xuXHRpZiAoIXBhcnNlZCB8fCBwYXJzZWRbMF0gIT09ICdva2xhYicpIHtcblx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHR9XG5cdGNvbnN0IHJlcyA9IHsgbW9kZTogJ29rbGFiJyB9O1xuXHRjb25zdCBbLCBsLCBhLCBiLCBhbHBoYV0gPSBwYXJzZWQ7XG5cdGlmIChsLnR5cGUgPT09IFRvay5IdWUgfHwgYS50eXBlID09PSBUb2suSHVlIHx8IGIudHlwZSA9PT0gVG9rLkh1ZSkge1xuXHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdH1cblx0aWYgKGwudHlwZSAhPT0gVG9rLk5vbmUpIHtcblx0XHRyZXMubCA9IE1hdGgubWluKFxuXHRcdFx0TWF0aC5tYXgoMCwgbC50eXBlID09PSBUb2suTnVtYmVyID8gbC52YWx1ZSA6IGwudmFsdWUgLyAxMDApLFxuXHRcdFx0MVxuXHRcdCk7XG5cdH1cblx0aWYgKGEudHlwZSAhPT0gVG9rLk5vbmUpIHtcblx0XHRyZXMuYSA9IGEudHlwZSA9PT0gVG9rLk51bWJlciA/IGEudmFsdWUgOiAoYS52YWx1ZSAqIDAuNCkgLyAxMDA7XG5cdH1cblx0aWYgKGIudHlwZSAhPT0gVG9rLk5vbmUpIHtcblx0XHRyZXMuYiA9IGIudHlwZSA9PT0gVG9rLk51bWJlciA/IGIudmFsdWUgOiAoYi52YWx1ZSAqIDAuNCkgLyAxMDA7XG5cdH1cblx0aWYgKGFscGhhLnR5cGUgIT09IFRvay5Ob25lKSB7XG5cdFx0cmVzLmFscGhhID0gTWF0aC5taW4oXG5cdFx0XHQxLFxuXHRcdFx0TWF0aC5tYXgoXG5cdFx0XHRcdDAsXG5cdFx0XHRcdGFscGhhLnR5cGUgPT09IFRvay5OdW1iZXIgPyBhbHBoYS52YWx1ZSA6IGFscGhhLnZhbHVlIC8gMTAwXG5cdFx0XHQpXG5cdFx0KTtcblx0fVxuXG5cdHJldHVybiByZXM7XG59XG5cbmV4cG9ydCBkZWZhdWx0IHBhcnNlT2tsYWI7XG4iLCAiaW1wb3J0IGNvbnZlcnRPa2xhYlRvTHJnYiBmcm9tICcuL2NvbnZlcnRPa2xhYlRvTHJnYi5qcyc7XG5pbXBvcnQgY29udmVydExyZ2JUb09rbGFiIGZyb20gJy4vY29udmVydExyZ2JUb09rbGFiLmpzJztcbmltcG9ydCBjb252ZXJ0UmdiVG9Pa2xhYiBmcm9tICcuL2NvbnZlcnRSZ2JUb09rbGFiLmpzJztcbmltcG9ydCBjb252ZXJ0T2tsYWJUb1JnYiBmcm9tICcuL2NvbnZlcnRPa2xhYlRvUmdiLmpzJztcbmltcG9ydCBwYXJzZU9rbGFiIGZyb20gJy4vcGFyc2VPa2xhYi5qcyc7XG5cbmltcG9ydCBsYWIgZnJvbSAnLi4vbGFiL2RlZmluaXRpb24uanMnO1xuXG4vKlxuXHRPa2xhYiwgYSBwZXJjZXB0dWFsIGNvbG9yIHNwYWNlIGZvciBpbWFnZSBwcm9jZXNzaW5nIGJ5IEJqXHUwMEY2cm4gT3R0b3Nzb25cblx0UmVmZXJlbmNlOiBodHRwczovL2JvdHRvc3Nvbi5naXRodWIuaW8vcG9zdHMvb2tsYWIvXG4gKi9cblxuY29uc3QgZGVmaW5pdGlvbiA9IHtcblx0Li4ubGFiLFxuXHRtb2RlOiAnb2tsYWInLFxuXG5cdHRvTW9kZToge1xuXHRcdGxyZ2I6IGNvbnZlcnRPa2xhYlRvTHJnYixcblx0XHRyZ2I6IGNvbnZlcnRPa2xhYlRvUmdiXG5cdH0sXG5cblx0ZnJvbU1vZGU6IHtcblx0XHRscmdiOiBjb252ZXJ0THJnYlRvT2tsYWIsXG5cdFx0cmdiOiBjb252ZXJ0UmdiVG9Pa2xhYlxuXHR9LFxuXG5cdHJhbmdlczoge1xuXHRcdGw6IFswLCAxXSxcblx0XHRhOiBbLTAuNCwgMC40XSxcblx0XHRiOiBbLTAuNCwgMC40XVxuXHR9LFxuXG5cdHBhcnNlOiBbcGFyc2VPa2xhYl0sXG5cdHNlcmlhbGl6ZTogYyA9PlxuXHRcdGBva2xhYigke2MubCAhPT0gdW5kZWZpbmVkID8gYy5sIDogJ25vbmUnfSAke1xuXHRcdFx0Yy5hICE9PSB1bmRlZmluZWQgPyBjLmEgOiAnbm9uZSdcblx0XHR9ICR7Yy5iICE9PSB1bmRlZmluZWQgPyBjLmIgOiAnbm9uZSd9JHtcblx0XHRcdGMuYWxwaGEgPCAxID8gYCAvICR7Yy5hbHBoYX1gIDogJydcblx0XHR9KWBcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluaXRpb247XG4iLCAiaW1wb3J0IHsgVG9rIH0gZnJvbSAnLi4vcGFyc2UuanMnO1xuXG5mdW5jdGlvbiBwYXJzZU9rbGNoKGNvbG9yLCBwYXJzZWQpIHtcblx0aWYgKCFwYXJzZWQgfHwgcGFyc2VkWzBdICE9PSAnb2tsY2gnKSB7XG5cdFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0fVxuXHRjb25zdCByZXMgPSB7IG1vZGU6ICdva2xjaCcgfTtcblx0Y29uc3QgWywgbCwgYywgaCwgYWxwaGFdID0gcGFyc2VkO1xuXHRpZiAobC50eXBlICE9PSBUb2suTm9uZSkge1xuXHRcdGlmIChsLnR5cGUgPT09IFRvay5IdWUpIHtcblx0XHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdFx0fVxuXHRcdHJlcy5sID0gTWF0aC5taW4oXG5cdFx0XHRNYXRoLm1heCgwLCBsLnR5cGUgPT09IFRvay5OdW1iZXIgPyBsLnZhbHVlIDogbC52YWx1ZSAvIDEwMCksXG5cdFx0XHQxXG5cdFx0KTtcblx0fVxuXHRpZiAoYy50eXBlICE9PSBUb2suTm9uZSkge1xuXHRcdHJlcy5jID0gTWF0aC5tYXgoXG5cdFx0XHQwLFxuXHRcdFx0Yy50eXBlID09PSBUb2suTnVtYmVyID8gYy52YWx1ZSA6IChjLnZhbHVlICogMC40KSAvIDEwMFxuXHRcdCk7XG5cdH1cblx0aWYgKGgudHlwZSAhPT0gVG9rLk5vbmUpIHtcblx0XHRpZiAoaC50eXBlID09PSBUb2suUGVyY2VudGFnZSkge1xuXHRcdFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0XHR9XG5cdFx0cmVzLmggPSBoLnZhbHVlO1xuXHR9XG5cdGlmIChhbHBoYS50eXBlICE9PSBUb2suTm9uZSkge1xuXHRcdHJlcy5hbHBoYSA9IE1hdGgubWluKFxuXHRcdFx0MSxcblx0XHRcdE1hdGgubWF4KFxuXHRcdFx0XHQwLFxuXHRcdFx0XHRhbHBoYS50eXBlID09PSBUb2suTnVtYmVyID8gYWxwaGEudmFsdWUgOiBhbHBoYS52YWx1ZSAvIDEwMFxuXHRcdFx0KVxuXHRcdCk7XG5cdH1cblxuXHRyZXR1cm4gcmVzO1xufVxuXG5leHBvcnQgZGVmYXVsdCBwYXJzZU9rbGNoO1xuIiwgImltcG9ydCBsY2ggZnJvbSAnLi4vbGNoL2RlZmluaXRpb24uanMnO1xuaW1wb3J0IGNvbnZlcnRMYWJUb0xjaCBmcm9tICcuLi9sY2gvY29udmVydExhYlRvTGNoLmpzJztcbmltcG9ydCBjb252ZXJ0TGNoVG9MYWIgZnJvbSAnLi4vbGNoL2NvbnZlcnRMY2hUb0xhYi5qcyc7XG5pbXBvcnQgY29udmVydE9rbGFiVG9SZ2IgZnJvbSAnLi4vb2tsYWIvY29udmVydE9rbGFiVG9SZ2IuanMnO1xuaW1wb3J0IGNvbnZlcnRSZ2JUb09rbGFiIGZyb20gJy4uL29rbGFiL2NvbnZlcnRSZ2JUb09rbGFiLmpzJztcbmltcG9ydCBwYXJzZU9rbGNoIGZyb20gJy4vcGFyc2VPa2xjaC5qcyc7XG5cbmNvbnN0IGRlZmluaXRpb24gPSB7XG5cdC4uLmxjaCxcblx0bW9kZTogJ29rbGNoJyxcblxuXHR0b01vZGU6IHtcblx0XHRva2xhYjogYyA9PiBjb252ZXJ0TGNoVG9MYWIoYywgJ29rbGFiJyksXG5cdFx0cmdiOiBjID0+IGNvbnZlcnRPa2xhYlRvUmdiKGNvbnZlcnRMY2hUb0xhYihjLCAnb2tsYWInKSlcblx0fSxcblxuXHRmcm9tTW9kZToge1xuXHRcdHJnYjogYyA9PiBjb252ZXJ0TGFiVG9MY2goY29udmVydFJnYlRvT2tsYWIoYyksICdva2xjaCcpLFxuXHRcdG9rbGFiOiBjID0+IGNvbnZlcnRMYWJUb0xjaChjLCAnb2tsY2gnKVxuXHR9LFxuXG5cdHBhcnNlOiBbcGFyc2VPa2xjaF0sXG5cdHNlcmlhbGl6ZTogYyA9PlxuXHRcdGBva2xjaCgke2MubCAhPT0gdW5kZWZpbmVkID8gYy5sIDogJ25vbmUnfSAke1xuXHRcdFx0Yy5jICE9PSB1bmRlZmluZWQgPyBjLmMgOiAnbm9uZSdcblx0XHR9ICR7Yy5oICE9PSB1bmRlZmluZWQgPyBjLmggOiAnbm9uZSd9JHtcblx0XHRcdGMuYWxwaGEgPCAxID8gYCAvICR7Yy5hbHBoYX1gIDogJydcblx0XHR9KWAsXG5cblx0cmFuZ2VzOiB7XG5cdFx0bDogWzAsIDFdLFxuXHRcdGM6IFswLCAwLjRdLFxuXHRcdGg6IFswLCAzNjBdXG5cdH1cbn07XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluaXRpb247XG4iLCAiLypcblx0Q29udmVydCBEaXNwbGF5IFAzIHZhbHVlcyB0byBDSUUgWFlaIEQ2NVxuXG5cdFJlZmVyZW5jZXM6XG5cdFx0KiBodHRwczovL2RyYWZ0cy5jc3N3Zy5vcmcvY3NzLWNvbG9yLyNjb2xvci1jb252ZXJzaW9uLWNvZGVcblx0XHQqIGh0dHA6Ly93d3cuYnJ1Y2VsaW5kYmxvb20uY29tL2luZGV4Lmh0bWw/RXFuX1JHQl9YWVpfTWF0cml4Lmh0bWxcbiovXG5cbmltcG9ydCBjb252ZXJ0UmdiVG9McmdiIGZyb20gJy4uL2xyZ2IvY29udmVydFJnYlRvTHJnYi5qcyc7XG5cbmNvbnN0IGNvbnZlcnRQM1RvWHl6NjUgPSByZ2IgPT4ge1xuXHRsZXQgeyByLCBnLCBiLCBhbHBoYSB9ID0gY29udmVydFJnYlRvTHJnYihyZ2IpO1xuXHRsZXQgcmVzID0ge1xuXHRcdG1vZGU6ICd4eXo2NScsXG5cdFx0eDpcblx0XHRcdDAuNDg2NTcwOTQ4NjQ4MjE2ICogciArXG5cdFx0XHQwLjI2NTY2NzY5MzE2OTA5MyAqIGcgK1xuXHRcdFx0MC4xOTgyMTcyODUyMzQzNjI1ICogYixcblx0XHR5OlxuXHRcdFx0MC4yMjg5NzQ1NjQwNjk3NDg3ICogciArXG5cdFx0XHQwLjY5MTczODUyMTgzNjUwNjIgKiBnICtcblx0XHRcdDAuMDc5Mjg2OTE0MDkzNzQ1ICogYixcblx0XHR6OiAwLjAgKiByICsgMC4wNDUxMTMzODE4NTg5MDI2ICogZyArIDEuMDQzOTQ0MzY4OTAwOTc2ICogYlxuXHR9O1xuXHRpZiAoYWxwaGEgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJlcy5hbHBoYSA9IGFscGhhO1xuXHR9XG5cdHJldHVybiByZXM7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBjb252ZXJ0UDNUb1h5ejY1O1xuIiwgIi8qXG5cdENJRSBYWVogRDY1IHZhbHVlcyB0byBEaXNwbGF5IFAzLlxuXG5cdFJlZmVyZW5jZXM6XG5cdFx0KiBodHRwczovL2RyYWZ0cy5jc3N3Zy5vcmcvY3NzLWNvbG9yLyNjb2xvci1jb252ZXJzaW9uLWNvZGVcblx0XHQqIGh0dHA6Ly93d3cuYnJ1Y2VsaW5kYmxvb20uY29tL2luZGV4Lmh0bWw/RXFuX1JHQl9YWVpfTWF0cml4Lmh0bWxcbiovXG5cbmltcG9ydCBjb252ZXJ0THJnYlRvUmdiIGZyb20gJy4uL2xyZ2IvY29udmVydExyZ2JUb1JnYi5qcyc7XG5cbmNvbnN0IGNvbnZlcnRYeXo2NVRvUDMgPSAoeyB4LCB5LCB6LCBhbHBoYSB9KSA9PiB7XG5cdGlmICh4ID09PSB1bmRlZmluZWQpIHggPSAwO1xuXHRpZiAoeSA9PT0gdW5kZWZpbmVkKSB5ID0gMDtcblx0aWYgKHogPT09IHVuZGVmaW5lZCkgeiA9IDA7XG5cdGxldCByZXMgPSBjb252ZXJ0THJnYlRvUmdiKFxuXHRcdHtcblx0XHRcdHI6XG5cdFx0XHRcdHggKiAyLjQ5MzQ5NjkxMTk0MTQyNjMgLVxuXHRcdFx0XHR5ICogMC45MzEzODM2MTc5MTkxMjQyIC1cblx0XHRcdFx0MC40MDI3MTA3ODQ0NTA3MTcgKiB6LFxuXHRcdFx0Zzpcblx0XHRcdFx0eCAqIC0wLjgyOTQ4ODk2OTU2MTU3NDkgK1xuXHRcdFx0XHR5ICogMS43NjI2NjQwNjAzMTgzNDY1ICtcblx0XHRcdFx0MC4wMjM2MjQ2ODU4NDE5NDM2ICogeixcblx0XHRcdGI6XG5cdFx0XHRcdHggKiAwLjAzNTg0NTgzMDI0Mzc4NDUgLVxuXHRcdFx0XHR5ICogMC4wNzYxNzIzODkyNjgwNDE4ICtcblx0XHRcdFx0MC45NTY4ODQ1MjQwMDc2ODcxICogelxuXHRcdH0sXG5cdFx0J3AzJ1xuXHQpO1xuXHRpZiAoYWxwaGEgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJlcy5hbHBoYSA9IGFscGhhO1xuXHR9XG5cdHJldHVybiByZXM7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBjb252ZXJ0WHl6NjVUb1AzO1xuIiwgImltcG9ydCByZ2IgZnJvbSAnLi4vcmdiL2RlZmluaXRpb24uanMnO1xuaW1wb3J0IGNvbnZlcnRQM1RvWHl6NjUgZnJvbSAnLi9jb252ZXJ0UDNUb1h5ejY1LmpzJztcbmltcG9ydCBjb252ZXJ0WHl6NjVUb1AzIGZyb20gJy4vY29udmVydFh5ejY1VG9QMy5qcyc7XG5pbXBvcnQgY29udmVydFJnYlRvWHl6NjUgZnJvbSAnLi4veHl6NjUvY29udmVydFJnYlRvWHl6NjUuanMnO1xuaW1wb3J0IGNvbnZlcnRYeXo2NVRvUmdiIGZyb20gJy4uL3h5ejY1L2NvbnZlcnRYeXo2NVRvUmdiLmpzJztcblxuY29uc3QgZGVmaW5pdGlvbiA9IHtcblx0Li4ucmdiLFxuXHRtb2RlOiAncDMnLFxuXHRwYXJzZTogWydkaXNwbGF5LXAzJ10sXG5cdHNlcmlhbGl6ZTogJ2Rpc3BsYXktcDMnLFxuXG5cdGZyb21Nb2RlOiB7XG5cdFx0cmdiOiBjb2xvciA9PiBjb252ZXJ0WHl6NjVUb1AzKGNvbnZlcnRSZ2JUb1h5ejY1KGNvbG9yKSksXG5cdFx0eHl6NjU6IGNvbnZlcnRYeXo2NVRvUDNcblx0fSxcblxuXHR0b01vZGU6IHtcblx0XHRyZ2I6IGNvbG9yID0+IGNvbnZlcnRYeXo2NVRvUmdiKGNvbnZlcnRQM1RvWHl6NjUoY29sb3IpKSxcblx0XHR4eXo2NTogY29udmVydFAzVG9YeXo2NVxuXHR9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbml0aW9uO1xuIiwgIi8qXG5cdENvbnZlcnQgQ0lFIFhZWiBENTAgdmFsdWVzIHRvIFByb1Bob3RvIFJHQlxuXG5cdFJlZmVyZW5jZXM6XG5cdFx0KiBodHRwczovL2RyYWZ0cy5jc3N3Zy5vcmcvY3NzLWNvbG9yLyNjb2xvci1jb252ZXJzaW9uLWNvZGVcblx0XHQqIGh0dHA6Ly93d3cuYnJ1Y2VsaW5kYmxvb20uY29tL2luZGV4Lmh0bWw/RXFuX1JHQl9YWVpfTWF0cml4Lmh0bWxcbiovXG5cbmNvbnN0IGdhbW1hID0gdiA9PiB7XG5cdGxldCBhYnMgPSBNYXRoLmFicyh2KTtcblx0aWYgKGFicyA+PSAxIC8gNTEyKSB7XG5cdFx0cmV0dXJuIE1hdGguc2lnbih2KSAqIE1hdGgucG93KGFicywgMSAvIDEuOCk7XG5cdH1cblx0cmV0dXJuIDE2ICogdjtcbn07XG5cbmNvbnN0IGNvbnZlcnRYeXo1MFRvUHJvcGhvdG8gPSAoeyB4LCB5LCB6LCBhbHBoYSB9KSA9PiB7XG5cdGlmICh4ID09PSB1bmRlZmluZWQpIHggPSAwO1xuXHRpZiAoeSA9PT0gdW5kZWZpbmVkKSB5ID0gMDtcblx0aWYgKHogPT09IHVuZGVmaW5lZCkgeiA9IDA7XG5cdGxldCByZXMgPSB7XG5cdFx0bW9kZTogJ3Byb3Bob3RvJyxcblx0XHRyOiBnYW1tYShcblx0XHRcdHggKiAxLjM0NTc4Njg4MTY0NzE1ODUgLVxuXHRcdFx0XHR5ICogMC4yNTU1NzIwODczNzk3OTQ2IC1cblx0XHRcdFx0MC4wNTExMDE4NjQ5NzU1NDUzICogelxuXHRcdCksXG5cdFx0ZzogZ2FtbWEoXG5cdFx0XHR4ICogLTAuNTQ0NjMwNzA1MTI0OTAxOSArXG5cdFx0XHRcdHkgKiAxLjUwODI0Nzc0Mjg0NTE0NjYgK1xuXHRcdFx0XHQwLjAyMDUyNzQ0NzQzNjQyMTQgKiB6XG5cdFx0KSxcblx0XHRiOiBnYW1tYSh4ICogMC4wICsgeSAqIDAuMCArIDEuMjExOTY3NTQ1NjM4OTQ1MiAqIHopXG5cdH07XG5cdGlmIChhbHBoYSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmVzLmFscGhhID0gYWxwaGE7XG5cdH1cblx0cmV0dXJuIHJlcztcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNvbnZlcnRYeXo1MFRvUHJvcGhvdG87XG4iLCAiLypcblx0Q29udmVydCBQcm9QaG90byBSR0IgdmFsdWVzIHRvIENJRSBYWVogRDUwXG5cblx0UmVmZXJlbmNlczpcblx0XHQqIGh0dHBzOi8vZHJhZnRzLmNzc3dnLm9yZy9jc3MtY29sb3IvI2NvbG9yLWNvbnZlcnNpb24tY29kZVxuXHRcdCogaHR0cDovL3d3dy5icnVjZWxpbmRibG9vbS5jb20vaW5kZXguaHRtbD9FcW5fUkdCX1hZWl9NYXRyaXguaHRtbFxuKi9cblxuY29uc3QgbGluZWFyaXplID0gKHYgPSAwKSA9PiB7XG5cdGxldCBhYnMgPSBNYXRoLmFicyh2KTtcblx0aWYgKGFicyA+PSAxNiAvIDUxMikge1xuXHRcdHJldHVybiBNYXRoLnNpZ24odikgKiBNYXRoLnBvdyhhYnMsIDEuOCk7XG5cdH1cblx0cmV0dXJuIHYgLyAxNjtcbn07XG5cbmNvbnN0IGNvbnZlcnRQcm9waG90b1RvWHl6NTAgPSBwcm9waG90byA9PiB7XG5cdGxldCByID0gbGluZWFyaXplKHByb3Bob3RvLnIpO1xuXHRsZXQgZyA9IGxpbmVhcml6ZShwcm9waG90by5nKTtcblx0bGV0IGIgPSBsaW5lYXJpemUocHJvcGhvdG8uYik7XG5cdGxldCByZXMgPSB7XG5cdFx0bW9kZTogJ3h5ejUwJyxcblx0XHR4OlxuXHRcdFx0MC43OTc3NjY2NDQ5MDA2NDIzICogciArXG5cdFx0XHQwLjEzNTE4MTI5NzQwMDUzMzEgKiBnICtcblx0XHRcdDAuMDMxMzQ3NzM0MTI4MzkyMiAqIGIsXG5cdFx0eTpcblx0XHRcdDAuMjg4MDc0ODI4ODE5NDAxMyAqIHIgK1xuXHRcdFx0MC43MTE4MzUyMzQyNDE4NzMxICogZyArXG5cdFx0XHQwLjAwMDA4OTkzNjkzODcyNTYgKiBiLFxuXHRcdHo6IDAgKiByICsgMCAqIGcgKyAwLjgyNTEwNDYwMjUxMDQ2MDIgKiBiXG5cdH07XG5cdGlmIChwcm9waG90by5hbHBoYSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmVzLmFscGhhID0gcHJvcGhvdG8uYWxwaGE7XG5cdH1cblx0cmV0dXJuIHJlcztcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNvbnZlcnRQcm9waG90b1RvWHl6NTA7XG4iLCAiaW1wb3J0IHJnYiBmcm9tICcuLi9yZ2IvZGVmaW5pdGlvbi5qcyc7XG5cbmltcG9ydCBjb252ZXJ0WHl6NTBUb1Byb3Bob3RvIGZyb20gJy4vY29udmVydFh5ejUwVG9Qcm9waG90by5qcyc7XG5pbXBvcnQgY29udmVydFByb3Bob3RvVG9YeXo1MCBmcm9tICcuL2NvbnZlcnRQcm9waG90b1RvWHl6NTAuanMnO1xuXG5pbXBvcnQgY29udmVydFh5ejUwVG9SZ2IgZnJvbSAnLi4veHl6NTAvY29udmVydFh5ejUwVG9SZ2IuanMnO1xuaW1wb3J0IGNvbnZlcnRSZ2JUb1h5ejUwIGZyb20gJy4uL3h5ejUwL2NvbnZlcnRSZ2JUb1h5ejUwLmpzJztcblxuLypcblx0UHJvUGhvdG8gUkdCIENvbG9yIHNwYWNlXG5cblx0UmVmZXJlbmNlczpcblx0XHQqIGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL1Byb1Bob3RvX1JHQl9jb2xvcl9zcGFjZVxuICovXG5cbmNvbnN0IGRlZmluaXRpb24gPSB7XG5cdC4uLnJnYixcblx0bW9kZTogJ3Byb3Bob3RvJyxcblx0cGFyc2U6IFsncHJvcGhvdG8tcmdiJ10sXG5cdHNlcmlhbGl6ZTogJ3Byb3Bob3RvLXJnYicsXG5cblx0ZnJvbU1vZGU6IHtcblx0XHR4eXo1MDogY29udmVydFh5ejUwVG9Qcm9waG90byxcblx0XHRyZ2I6IGNvbG9yID0+IGNvbnZlcnRYeXo1MFRvUHJvcGhvdG8oY29udmVydFJnYlRvWHl6NTAoY29sb3IpKVxuXHR9LFxuXG5cdHRvTW9kZToge1xuXHRcdHh5ejUwOiBjb252ZXJ0UHJvcGhvdG9Ub1h5ejUwLFxuXHRcdHJnYjogY29sb3IgPT4gY29udmVydFh5ejUwVG9SZ2IoY29udmVydFByb3Bob3RvVG9YeXo1MChjb2xvcikpXG5cdH1cbn07XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluaXRpb247XG4iLCAiLypcblx0Q29udmVydCBDSUUgWFlaIEQ2NSB2YWx1ZXMgdG8gUmVjLiAyMDIwXG5cblx0UmVmZXJlbmNlczpcblx0XHQqIGh0dHBzOi8vZHJhZnRzLmNzc3dnLm9yZy9jc3MtY29sb3IvI2NvbG9yLWNvbnZlcnNpb24tY29kZVxuXHRcdCogaHR0cDovL3d3dy5icnVjZWxpbmRibG9vbS5jb20vaW5kZXguaHRtbD9FcW5fUkdCX1hZWl9NYXRyaXguaHRtbFxuXHRcdCogaHR0cHM6Ly93d3cuaXR1LmludC9yZWMvUi1SRUMtQlQuMjAyMC9lblxuKi9cblxuY29uc3QgXHUwM0IxID0gMS4wOTkyOTY4MjY4MDk0NDtcbmNvbnN0IFx1MDNCMiA9IDAuMDE4MDUzOTY4NTEwODA3O1xuY29uc3QgZ2FtbWEgPSB2ID0+IHtcblx0Y29uc3QgYWJzID0gTWF0aC5hYnModik7XG5cdGlmIChhYnMgPiBcdTAzQjIpIHtcblx0XHRyZXR1cm4gKE1hdGguc2lnbih2KSB8fCAxKSAqIChcdTAzQjEgKiBNYXRoLnBvdyhhYnMsIDAuNDUpIC0gKFx1MDNCMSAtIDEpKTtcblx0fVxuXHRyZXR1cm4gNC41ICogdjtcbn07XG5cbmNvbnN0IGNvbnZlcnRYeXo2NVRvUmVjMjAyMCA9ICh7IHgsIHksIHosIGFscGhhIH0pID0+IHtcblx0aWYgKHggPT09IHVuZGVmaW5lZCkgeCA9IDA7XG5cdGlmICh5ID09PSB1bmRlZmluZWQpIHkgPSAwO1xuXHRpZiAoeiA9PT0gdW5kZWZpbmVkKSB6ID0gMDtcblx0bGV0IHJlcyA9IHtcblx0XHRtb2RlOiAncmVjMjAyMCcsXG5cdFx0cjogZ2FtbWEoXG5cdFx0XHR4ICogMS43MTY2NTExODc5NzEyNjgzIC1cblx0XHRcdFx0eSAqIDAuMzU1NjcwNzgzNzc2MzkyNSAtXG5cdFx0XHRcdDAuMjUzMzY2MjgxMzczNjU5OSAqIHpcblx0XHQpLFxuXHRcdGc6IGdhbW1hKFxuXHRcdFx0eCAqIC0wLjY2NjY4NDM1MTgzMjQ4OTMgK1xuXHRcdFx0XHR5ICogMS42MTY0ODEyMzY2MzQ5Mzk1ICtcblx0XHRcdFx0MC4wMTU3Njg1NDU4MTM5MTExICogelxuXHRcdCksXG5cdFx0YjogZ2FtbWEoXG5cdFx0XHR4ICogMC4wMTc2Mzk4NTc0NDUzMTA4IC1cblx0XHRcdFx0eSAqIDAuMDQyNzcwNjEzMjU3ODA4NSArXG5cdFx0XHRcdDAuOTQyMTAzMTIxMjM1NDczOSAqIHpcblx0XHQpXG5cdH07XG5cdGlmIChhbHBoYSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmVzLmFscGhhID0gYWxwaGE7XG5cdH1cblx0cmV0dXJuIHJlcztcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNvbnZlcnRYeXo2NVRvUmVjMjAyMDtcbiIsICIvKlxuXHRDb252ZXJ0IFJlYy4gMjAyMCB2YWx1ZXMgdG8gQ0lFIFhZWiBENjVcblxuXHRSZWZlcmVuY2VzOlxuXHRcdCogaHR0cHM6Ly9kcmFmdHMuY3Nzd2cub3JnL2Nzcy1jb2xvci8jY29sb3ItY29udmVyc2lvbi1jb2RlXG5cdFx0KiBodHRwOi8vd3d3LmJydWNlbGluZGJsb29tLmNvbS9pbmRleC5odG1sP0Vxbl9SR0JfWFlaX01hdHJpeC5odG1sXG5cdFx0KiBodHRwczovL3d3dy5pdHUuaW50L3JlYy9SLVJFQy1CVC4yMDIwL2VuXG4qL1xuXG5jb25zdCBcdTAzQjEgPSAxLjA5OTI5NjgyNjgwOTQ0O1xuY29uc3QgXHUwM0IyID0gMC4wMTgwNTM5Njg1MTA4MDc7XG5cbmNvbnN0IGxpbmVhcml6ZSA9ICh2ID0gMCkgPT4ge1xuXHRsZXQgYWJzID0gTWF0aC5hYnModik7XG5cdGlmIChhYnMgPCBcdTAzQjIgKiA0LjUpIHtcblx0XHRyZXR1cm4gdiAvIDQuNTtcblx0fVxuXHRyZXR1cm4gKE1hdGguc2lnbih2KSB8fCAxKSAqIE1hdGgucG93KChhYnMgKyBcdTAzQjEgLSAxKSAvIFx1MDNCMSwgMSAvIDAuNDUpO1xufTtcblxuY29uc3QgY29udmVydFJlYzIwMjBUb1h5ejY1ID0gcmVjMjAyMCA9PiB7XG5cdGxldCByID0gbGluZWFyaXplKHJlYzIwMjAucik7XG5cdGxldCBnID0gbGluZWFyaXplKHJlYzIwMjAuZyk7XG5cdGxldCBiID0gbGluZWFyaXplKHJlYzIwMjAuYik7XG5cdGxldCByZXMgPSB7XG5cdFx0bW9kZTogJ3h5ejY1Jyxcblx0XHR4OlxuXHRcdFx0MC42MzY5NTgwNDgzMDEyOTExICogciArXG5cdFx0XHQwLjE0NDYxNjkwMzU4NjIwODMgKiBnICtcblx0XHRcdDAuMTY4ODgwOTc1MTY0MTcyMSAqIGIsXG5cdFx0eTpcblx0XHRcdDAuMjYyNzAwMjEyMDExMjY3ICogciArXG5cdFx0XHQwLjY3Nzk5ODA3MTUxODg3MDggKiBnICtcblx0XHRcdDAuMDU5MzAxNzE2NDY5ODYyICogYixcblx0XHR6OiAwICogciArIDAuMDI4MDcyNjkzMDQ5MDg3NCAqIGcgKyAxLjA2MDk4NTA1NzcxMDc5MDkgKiBiXG5cdH07XG5cdGlmIChyZWMyMDIwLmFscGhhICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXMuYWxwaGEgPSByZWMyMDIwLmFscGhhO1xuXHR9XG5cdHJldHVybiByZXM7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBjb252ZXJ0UmVjMjAyMFRvWHl6NjU7XG4iLCAiaW1wb3J0IHJnYiBmcm9tICcuLi9yZ2IvZGVmaW5pdGlvbi5qcyc7XG5cbmltcG9ydCBjb252ZXJ0WHl6NjVUb1JlYzIwMjAgZnJvbSAnLi9jb252ZXJ0WHl6NjVUb1JlYzIwMjAuanMnO1xuaW1wb3J0IGNvbnZlcnRSZWMyMDIwVG9YeXo2NSBmcm9tICcuL2NvbnZlcnRSZWMyMDIwVG9YeXo2NS5qcyc7XG5cbmltcG9ydCBjb252ZXJ0UmdiVG9YeXo2NSBmcm9tICcuLi94eXo2NS9jb252ZXJ0UmdiVG9YeXo2NS5qcyc7XG5pbXBvcnQgY29udmVydFh5ejY1VG9SZ2IgZnJvbSAnLi4veHl6NjUvY29udmVydFh5ejY1VG9SZ2IuanMnO1xuXG5jb25zdCBkZWZpbml0aW9uID0ge1xuXHQuLi5yZ2IsXG5cdG1vZGU6ICdyZWMyMDIwJyxcblxuXHRmcm9tTW9kZToge1xuXHRcdHh5ejY1OiBjb252ZXJ0WHl6NjVUb1JlYzIwMjAsXG5cdFx0cmdiOiBjb2xvciA9PiBjb252ZXJ0WHl6NjVUb1JlYzIwMjAoY29udmVydFJnYlRvWHl6NjUoY29sb3IpKVxuXHR9LFxuXG5cdHRvTW9kZToge1xuXHRcdHh5ejY1OiBjb252ZXJ0UmVjMjAyMFRvWHl6NjUsXG5cdFx0cmdiOiBjb2xvciA9PiBjb252ZXJ0WHl6NjVUb1JnYihjb252ZXJ0UmVjMjAyMFRvWHl6NjUoY29sb3IpKVxuXHR9LFxuXG5cdHBhcnNlOiBbJ3JlYzIwMjAnXSxcblx0c2VyaWFsaXplOiAncmVjMjAyMCdcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluaXRpb247XG4iLCAiZXhwb3J0IGNvbnN0IGJpYXMgPSAwLjAwMzc5MzA3MzI1NTI3NTQ0OTMzO1xuZXhwb3J0IGNvbnN0IGJpYXNfY2JydCA9IE1hdGguY2JydChiaWFzKTtcbiIsICJpbXBvcnQgY29udmVydFJnYlRvTHJnYiBmcm9tICcuLi9scmdiL2NvbnZlcnRSZ2JUb0xyZ2IuanMnO1xuaW1wb3J0IHsgYmlhcywgYmlhc19jYnJ0IH0gZnJvbSAnLi9jb25zdGFudHMuanMnO1xuXG5jb25zdCB0cmFuc2ZlciA9IHYgPT4gTWF0aC5jYnJ0KHYpIC0gYmlhc19jYnJ0O1xuXG5jb25zdCBjb252ZXJ0UmdiVG9YeWIgPSBjb2xvciA9PiB7XG5cdGNvbnN0IHsgciwgZywgYiwgYWxwaGEgfSA9IGNvbnZlcnRSZ2JUb0xyZ2IoY29sb3IpO1xuXHRjb25zdCBsID0gdHJhbnNmZXIoMC4zICogciArIDAuNjIyICogZyArIDAuMDc4ICogYiArIGJpYXMpO1xuXHRjb25zdCBtID0gdHJhbnNmZXIoMC4yMyAqIHIgKyAwLjY5MiAqIGcgKyAwLjA3OCAqIGIgKyBiaWFzKTtcblx0Y29uc3QgcyA9IHRyYW5zZmVyKFxuXHRcdDAuMjQzNDIyNjg5MjQ1NDc4MTkgKiByICtcblx0XHRcdDAuMjA0NzY3NDQ0MjQ0OTY4MjEgKiBnICtcblx0XHRcdDAuNTUxODA5ODY2NTA5NTUzNiAqIGIgK1xuXHRcdFx0Ymlhc1xuXHQpO1xuXHRjb25zdCByZXMgPSB7XG5cdFx0bW9kZTogJ3h5YicsXG5cdFx0eDogKGwgLSBtKSAvIDIsXG5cdFx0eTogKGwgKyBtKSAvIDIsXG5cdFx0LyogQXBwbHkgZGVmYXVsdCBjaHJvbWEgZnJvbSBsdW1hIChzdWJ0cmFjdCBZIGZyb20gQikgKi9cblx0XHRiOiBzIC0gKGwgKyBtKSAvIDJcblx0fTtcblx0aWYgKGFscGhhICE9PSB1bmRlZmluZWQpIHJlcy5hbHBoYSA9IGFscGhhO1xuXHRyZXR1cm4gcmVzO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgY29udmVydFJnYlRvWHliO1xuIiwgImltcG9ydCBjb252ZXJ0THJnYlRvUmdiIGZyb20gJy4uL2xyZ2IvY29udmVydExyZ2JUb1JnYi5qcyc7XG5pbXBvcnQgeyBiaWFzLCBiaWFzX2NicnQgfSBmcm9tICcuL2NvbnN0YW50cy5qcyc7XG5cbmNvbnN0IHRyYW5zZmVyID0gdiA9PiBNYXRoLnBvdyh2ICsgYmlhc19jYnJ0LCAzKTtcblxuY29uc3QgY29udmVydFh5YlRvUmdiID0gKHsgeCwgeSwgYiwgYWxwaGEgfSkgPT4ge1xuXHRpZiAoeCA9PT0gdW5kZWZpbmVkKSB4ID0gMDtcblx0aWYgKHkgPT09IHVuZGVmaW5lZCkgeSA9IDA7XG5cdGlmIChiID09PSB1bmRlZmluZWQpIGIgPSAwO1xuXHRjb25zdCBsID0gdHJhbnNmZXIoeCArIHkpIC0gYmlhcztcblx0Y29uc3QgbSA9IHRyYW5zZmVyKHkgLSB4KSAtIGJpYXM7XG5cdC8qIEFjY291bnQgZm9yIGNocm9tYSBmcm9tIGx1bWE6IGFkZCBZIGJhY2sgdG8gQiAqL1xuXHRjb25zdCBzID0gdHJhbnNmZXIoYiArIHkpIC0gYmlhcztcblxuXHRjb25zdCByZXMgPSBjb252ZXJ0THJnYlRvUmdiKHtcblx0XHRyOlxuXHRcdFx0MTEuMDMxNTY2OTA0NjM5ODYxICogbCAtXG5cdFx0XHQ5Ljg2Njk0MzkwODEzMTU2MiAqIG0gLVxuXHRcdFx0MC4xNjQ2MjI5OTY1MDgyOTkzNCAqIHMsXG5cdFx0Zzpcblx0XHRcdC0zLjI1NDE0NzM4MTA3NDQyMzcgKiBsICtcblx0XHRcdDQuNDE4NzcwMzc3NTgyNzIzICogbSAtXG5cdFx0XHQwLjE2NDYyMjk5NjUwODI5OTM0ICogcyxcblx0XHRiOlxuXHRcdFx0LTMuNjU4ODUxMjg2NzEzNjgxNSAqIGwgK1xuXHRcdFx0Mi43MTI5MjMwNDU5MzYwOTIyICogbSArXG5cdFx0XHQxLjk0NTkyODI0MDc3NzU4OTUgKiBzXG5cdH0pO1xuXHRpZiAoYWxwaGEgIT09IHVuZGVmaW5lZCkgcmVzLmFscGhhID0gYWxwaGE7XG5cdHJldHVybiByZXM7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBjb252ZXJ0WHliVG9SZ2I7XG4iLCAiaW1wb3J0IHsgaW50ZXJwb2xhdG9yTGluZWFyIH0gZnJvbSAnLi4vaW50ZXJwb2xhdGUvbGluZWFyLmpzJztcbmltcG9ydCB7IGZpeHVwQWxwaGEgfSBmcm9tICcuLi9maXh1cC9hbHBoYS5qcyc7XG5pbXBvcnQgY29udmVydFJnYlRvWHliIGZyb20gJy4vY29udmVydFJnYlRvWHliLmpzJztcbmltcG9ydCBjb252ZXJ0WHliVG9SZ2IgZnJvbSAnLi9jb252ZXJ0WHliVG9SZ2IuanMnO1xuXG4vKlxuXHRUaGUgWFlCIGNvbG9yIHNwYWNlLCB1c2VkIGluIEpQRUcgWEwuXG5cdFJlZmVyZW5jZTogaHR0cHM6Ly9kcy5qcGVnLm9yZy93aGl0ZXBhcGVycy9qcGVnLXhsLXdoaXRlcGFwZXIucGRmXG4qL1xuXG5jb25zdCBkZWZpbml0aW9uID0ge1xuXHRtb2RlOiAneHliJyxcblx0Y2hhbm5lbHM6IFsneCcsICd5JywgJ2InLCAnYWxwaGEnXSxcblx0cGFyc2U6IFsnLS14eWInXSxcblx0c2VyaWFsaXplOiAnLS14eWInLFxuXG5cdHRvTW9kZToge1xuXHRcdHJnYjogY29udmVydFh5YlRvUmdiXG5cdH0sXG5cblx0ZnJvbU1vZGU6IHtcblx0XHRyZ2I6IGNvbnZlcnRSZ2JUb1h5YlxuXHR9LFxuXG5cdHJhbmdlczoge1xuXHRcdHg6IFstMC4wMTU0LCAwLjAyODFdLFxuXHRcdHk6IFswLCAwLjg0NTNdLFxuXHRcdGI6IFstMC4yNzc4LCAwLjM4OF1cblx0fSxcblxuXHRpbnRlcnBvbGF0ZToge1xuXHRcdHg6IGludGVycG9sYXRvckxpbmVhcixcblx0XHR5OiBpbnRlcnBvbGF0b3JMaW5lYXIsXG5cdFx0YjogaW50ZXJwb2xhdG9yTGluZWFyLFxuXHRcdGFscGhhOiB7IHVzZTogaW50ZXJwb2xhdG9yTGluZWFyLCBmaXh1cDogZml4dXBBbHBoYSB9XG5cdH1cbn07XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluaXRpb247XG4iLCAiLypcblx0VGhlIFhZWiBENTAgY29sb3Igc3BhY2Vcblx0LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAqL1xuXG5pbXBvcnQgY29udmVydFh5ejUwVG9SZ2IgZnJvbSAnLi9jb252ZXJ0WHl6NTBUb1JnYi5qcyc7XG5pbXBvcnQgY29udmVydFh5ejUwVG9MYWIgZnJvbSAnLi4vbGFiL2NvbnZlcnRYeXo1MFRvTGFiLmpzJztcbmltcG9ydCBjb252ZXJ0UmdiVG9YeXo1MCBmcm9tICcuL2NvbnZlcnRSZ2JUb1h5ejUwLmpzJztcbmltcG9ydCBjb252ZXJ0TGFiVG9YeXo1MCBmcm9tICcuLi9sYWIvY29udmVydExhYlRvWHl6NTAuanMnO1xuaW1wb3J0IHsgaW50ZXJwb2xhdG9yTGluZWFyIH0gZnJvbSAnLi4vaW50ZXJwb2xhdGUvbGluZWFyLmpzJztcbmltcG9ydCB7IGZpeHVwQWxwaGEgfSBmcm9tICcuLi9maXh1cC9hbHBoYS5qcyc7XG5cbmNvbnN0IGRlZmluaXRpb24gPSB7XG5cdG1vZGU6ICd4eXo1MCcsXG5cdHBhcnNlOiBbJ3h5ei1kNTAnXSxcblx0c2VyaWFsaXplOiAneHl6LWQ1MCcsXG5cblx0dG9Nb2RlOiB7XG5cdFx0cmdiOiBjb252ZXJ0WHl6NTBUb1JnYixcblx0XHRsYWI6IGNvbnZlcnRYeXo1MFRvTGFiXG5cdH0sXG5cblx0ZnJvbU1vZGU6IHtcblx0XHRyZ2I6IGNvbnZlcnRSZ2JUb1h5ejUwLFxuXHRcdGxhYjogY29udmVydExhYlRvWHl6NTBcblx0fSxcblxuXHRjaGFubmVsczogWyd4JywgJ3knLCAneicsICdhbHBoYSddLFxuXG5cdHJhbmdlczoge1xuXHRcdHg6IFswLCAwLjk2NF0sXG5cdFx0eTogWzAsIDAuOTk5XSxcblx0XHR6OiBbMCwgMC44MjVdXG5cdH0sXG5cblx0aW50ZXJwb2xhdGU6IHtcblx0XHR4OiBpbnRlcnBvbGF0b3JMaW5lYXIsXG5cdFx0eTogaW50ZXJwb2xhdG9yTGluZWFyLFxuXHRcdHo6IGludGVycG9sYXRvckxpbmVhcixcblx0XHRhbHBoYTogeyB1c2U6IGludGVycG9sYXRvckxpbmVhciwgZml4dXA6IGZpeHVwQWxwaGEgfVxuXHR9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbml0aW9uO1xuIiwgIi8qXG5cdENocm9tYXRpYyBhZGFwdGF0aW9uIG9mIENJRSBYWVogZnJvbSBENjUgdG8gRDUwIHdoaXRlIHBvaW50XG5cdHVzaW5nIHRoZSBCcmFkZm9yZCBtZXRob2QuXG5cblx0UmVmZXJlbmNlczpcblx0XHQqIGh0dHBzOi8vZHJhZnRzLmNzc3dnLm9yZy9jc3MtY29sb3IvI2NvbG9yLWNvbnZlcnNpb24tY29kZVxuXHRcdCogaHR0cDovL3d3dy5icnVjZWxpbmRibG9vbS5jb20vaW5kZXguaHRtbD9FcW5fQ2hyb21BZGFwdC5odG1sXHRcbiovXG5cbmNvbnN0IGNvbnZlcnRYeXo2NVRvWHl6NTAgPSB4eXo2NSA9PiB7XG5cdGxldCB7IHgsIHksIHosIGFscGhhIH0gPSB4eXo2NTtcblx0aWYgKHggPT09IHVuZGVmaW5lZCkgeCA9IDA7XG5cdGlmICh5ID09PSB1bmRlZmluZWQpIHkgPSAwO1xuXHRpZiAoeiA9PT0gdW5kZWZpbmVkKSB6ID0gMDtcblx0bGV0IHJlcyA9IHtcblx0XHRtb2RlOiAneHl6NTAnLFxuXHRcdHg6XG5cdFx0XHQxLjA0NzkyOTgyMDg0MDU0ODggKiB4ICtcblx0XHRcdDAuMDIyOTQ2NzkzMzQxMDE5MSAqIHkgLVxuXHRcdFx0MC4wNTAxOTIyMjk1NDMxMzU2ICogeixcblx0XHR5OlxuXHRcdFx0MC4wMjk2Mjc4MTU2ODgxNTkzICogeCArXG5cdFx0XHQwLjk5MDQzNDQ4NDU3MzI0OSAqIHkgLVxuXHRcdFx0MC4wMTcwNzM4MjUwMjkzODUxICogeixcblx0XHR6OlxuXHRcdFx0LTAuMDA5MjQzMDU4MTUyNTkxMiAqIHggK1xuXHRcdFx0MC4wMTUwNTUxNDQ4OTY1Nzc5ICogeSArXG5cdFx0XHQwLjc1MTg3NDI4OTk1ODAwMDggKiB6XG5cdH07XG5cdGlmIChhbHBoYSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmVzLmFscGhhID0gYWxwaGE7XG5cdH1cblx0cmV0dXJuIHJlcztcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNvbnZlcnRYeXo2NVRvWHl6NTA7XG4iLCAiLypcblx0Q2hyb21hdGljIGFkYXB0YXRpb24gb2YgQ0lFIFhZWiBmcm9tIEQ1MCB0byBENjUgd2hpdGUgcG9pbnRcblx0dXNpbmcgdGhlIEJyYWRmb3JkIG1ldGhvZC5cblxuXHRSZWZlcmVuY2VzOlxuXHRcdCogaHR0cHM6Ly9kcmFmdHMuY3Nzd2cub3JnL2Nzcy1jb2xvci8jY29sb3ItY29udmVyc2lvbi1jb2RlXG5cdFx0KiBodHRwOi8vd3d3LmJydWNlbGluZGJsb29tLmNvbS9pbmRleC5odG1sP0Vxbl9DaHJvbUFkYXB0Lmh0bWxcdFxuKi9cblxuY29uc3QgY29udmVydFh5ejUwVG9YeXo2NSA9IHh5ejUwID0+IHtcblx0bGV0IHsgeCwgeSwgeiwgYWxwaGEgfSA9IHh5ejUwO1xuXHRpZiAoeCA9PT0gdW5kZWZpbmVkKSB4ID0gMDtcblx0aWYgKHkgPT09IHVuZGVmaW5lZCkgeSA9IDA7XG5cdGlmICh6ID09PSB1bmRlZmluZWQpIHogPSAwO1xuXHRsZXQgcmVzID0ge1xuXHRcdG1vZGU6ICd4eXo2NScsXG5cdFx0eDpcblx0XHRcdDAuOTU1NDczNDUyNzA0MjE4MiAqIHggLVxuXHRcdFx0MC4wMjMwOTg1MzY4NzQyNjE0ICogeSArXG5cdFx0XHQwLjA2MzI1OTMwODY2MTAyMTcgKiB6LFxuXHRcdHk6XG5cdFx0XHQtMC4wMjgzNjk3MDY5NjMyMDgxICogeCArXG5cdFx0XHQxLjAwOTk5NTQ1ODAwNTgyMjYgKiB5ICtcblx0XHRcdDAuMDIxMDQxMzk4OTY2OTQzICogeixcblx0XHR6OlxuXHRcdFx0MC4wMTIzMTQwMDE2ODgzMTk5ICogeCAtXG5cdFx0XHQwLjAyMDUwNzY5NjQzMzQ3NzkgKiB5ICtcblx0XHRcdDEuMzMwMzY1OTM2NjA4MDc1MyAqIHpcblx0fTtcblx0aWYgKGFscGhhICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXMuYWxwaGEgPSBhbHBoYTtcblx0fVxuXHRyZXR1cm4gcmVzO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgY29udmVydFh5ejUwVG9YeXo2NTtcbiIsICIvKlxuXHRUaGUgWFlaIEQ2NSBjb2xvciBzcGFjZVxuXHQtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICovXG5cbmltcG9ydCBjb252ZXJ0WHl6NjVUb1JnYiBmcm9tICcuL2NvbnZlcnRYeXo2NVRvUmdiLmpzJztcbmltcG9ydCBjb252ZXJ0UmdiVG9YeXo2NSBmcm9tICcuL2NvbnZlcnRSZ2JUb1h5ejY1LmpzJztcblxuaW1wb3J0IGNvbnZlcnRYeXo2NVRvWHl6NTAgZnJvbSAnLi9jb252ZXJ0WHl6NjVUb1h5ejUwLmpzJztcbmltcG9ydCBjb252ZXJ0WHl6NTBUb1h5ejY1IGZyb20gJy4vY29udmVydFh5ejUwVG9YeXo2NS5qcyc7XG5cbmltcG9ydCB7IGludGVycG9sYXRvckxpbmVhciB9IGZyb20gJy4uL2ludGVycG9sYXRlL2xpbmVhci5qcyc7XG5pbXBvcnQgeyBmaXh1cEFscGhhIH0gZnJvbSAnLi4vZml4dXAvYWxwaGEuanMnO1xuXG5jb25zdCBkZWZpbml0aW9uID0ge1xuXHRtb2RlOiAneHl6NjUnLFxuXG5cdHRvTW9kZToge1xuXHRcdHJnYjogY29udmVydFh5ejY1VG9SZ2IsXG5cdFx0eHl6NTA6IGNvbnZlcnRYeXo2NVRvWHl6NTBcblx0fSxcblxuXHRmcm9tTW9kZToge1xuXHRcdHJnYjogY29udmVydFJnYlRvWHl6NjUsXG5cdFx0eHl6NTA6IGNvbnZlcnRYeXo1MFRvWHl6NjVcblx0fSxcblxuXHRyYW5nZXM6IHtcblx0XHR4OiBbMCwgMC45NV0sXG5cdFx0eTogWzAsIDFdLFxuXHRcdHo6IFswLCAxLjA4OF1cblx0fSxcblxuXHRjaGFubmVsczogWyd4JywgJ3knLCAneicsICdhbHBoYSddLFxuXG5cdHBhcnNlOiBbJ3h5eicsICd4eXotZDY1J10sXG5cdHNlcmlhbGl6ZTogJ3h5ei1kNjUnLFxuXG5cdGludGVycG9sYXRlOiB7XG5cdFx0eDogaW50ZXJwb2xhdG9yTGluZWFyLFxuXHRcdHk6IGludGVycG9sYXRvckxpbmVhcixcblx0XHR6OiBpbnRlcnBvbGF0b3JMaW5lYXIsXG5cdFx0YWxwaGE6IHsgdXNlOiBpbnRlcnBvbGF0b3JMaW5lYXIsIGZpeHVwOiBmaXh1cEFscGhhIH1cblx0fVxufTtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5pdGlvbjtcbiIsICJjb25zdCBjb252ZXJ0UmdiVG9ZaXEgPSAoeyByLCBnLCBiLCBhbHBoYSB9KSA9PiB7XG5cdGlmIChyID09PSB1bmRlZmluZWQpIHIgPSAwO1xuXHRpZiAoZyA9PT0gdW5kZWZpbmVkKSBnID0gMDtcblx0aWYgKGIgPT09IHVuZGVmaW5lZCkgYiA9IDA7XG5cdGNvbnN0IHJlcyA9IHtcblx0XHRtb2RlOiAneWlxJyxcblx0XHR5OiAwLjI5ODg5NTMxICogciArIDAuNTg2NjIyNDcgKiBnICsgMC4xMTQ0ODIyMyAqIGIsXG5cdFx0aTogMC41OTU5Nzc5OSAqIHIgLSAwLjI3NDE3NjEgKiBnIC0gMC4zMjE4MDE4OSAqIGIsXG5cdFx0cTogMC4yMTE0NzAxNyAqIHIgLSAwLjUyMjYxNzExICogZyArIDAuMzExMTQ2OTQgKiBiXG5cdH07XG5cdGlmIChhbHBoYSAhPT0gdW5kZWZpbmVkKSByZXMuYWxwaGEgPSBhbHBoYTtcblx0cmV0dXJuIHJlcztcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNvbnZlcnRSZ2JUb1lpcTtcbiIsICJjb25zdCBjb252ZXJ0WWlxVG9SZ2IgPSAoeyB5LCBpLCBxLCBhbHBoYSB9KSA9PiB7XG5cdGlmICh5ID09PSB1bmRlZmluZWQpIHkgPSAwO1xuXHRpZiAoaSA9PT0gdW5kZWZpbmVkKSBpID0gMDtcblx0aWYgKHEgPT09IHVuZGVmaW5lZCkgcSA9IDA7XG5cdGNvbnN0IHJlcyA9IHtcblx0XHRtb2RlOiAncmdiJyxcblx0XHRyOiB5ICsgMC45NTYwODQ0NSAqIGkgKyAwLjYyMDg4ODUgKiBxLFxuXHRcdGc6IHkgLSAwLjI3MTM3NjY0ICogaSAtIDAuNjQ4NjA1OSAqIHEsXG5cdFx0YjogeSAtIDEuMTA1NjE3MjQgKiBpICsgMS43MDI1MDEyNiAqIHFcblx0fTtcblx0aWYgKGFscGhhICE9PSB1bmRlZmluZWQpIHJlcy5hbHBoYSA9IGFscGhhO1xuXHRyZXR1cm4gcmVzO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgY29udmVydFlpcVRvUmdiO1xuIiwgImltcG9ydCBjb252ZXJ0UmdiVG9ZaXEgZnJvbSAnLi9jb252ZXJ0UmdiVG9ZaXEuanMnO1xuaW1wb3J0IGNvbnZlcnRZaXFUb1JnYiBmcm9tICcuL2NvbnZlcnRZaXFUb1JnYi5qcyc7XG5pbXBvcnQgeyBpbnRlcnBvbGF0b3JMaW5lYXIgfSBmcm9tICcuLi9pbnRlcnBvbGF0ZS9saW5lYXIuanMnO1xuaW1wb3J0IHsgZml4dXBBbHBoYSB9IGZyb20gJy4uL2ZpeHVwL2FscGhhLmpzJztcblxuLypcblx0WUlRIENvbG9yIFNwYWNlXG5cblx0UmVmZXJlbmNlc1xuXHQtLS0tLS0tLS0tXG5cblx0V2lraXBlZGlhOlxuXHRcdGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL1lJUVxuXG5cdFwiTWVhc3VyaW5nIHBlcmNlaXZlZCBjb2xvciBkaWZmZXJlbmNlIHVzaW5nIFlJUSBOVFNDXG5cdHRyYW5zbWlzc2lvbiBjb2xvciBzcGFjZSBpbiBtb2JpbGUgYXBwbGljYXRpb25zXCJcblx0XHRcblx0XHRieSBZdXJpeSBLb3RzYXJlbmtvLCBGZXJuYW5kbyBSYW1vcyBpbjpcblx0XHRQcm9ncmFtYWNpXHUwMEYzbiBNYXRlbVx1MDBFMXRpY2EgeSBTb2Z0d2FyZSAoMjAxMCkgXG5cblx0QXZhaWxhYmxlIGF0OlxuXHRcdFxuXHRcdGh0dHA6Ly93d3cucHJvZ21hdC51YWVtLm14OjgwODAvYXJ0Vm9sMk51bTIvQXJ0aWN1bG8zVm9sMk51bTIucGRmXG4gKi9cblxuY29uc3QgZGVmaW5pdGlvbiA9IHtcblx0bW9kZTogJ3lpcScsXG5cblx0dG9Nb2RlOiB7XG5cdFx0cmdiOiBjb252ZXJ0WWlxVG9SZ2Jcblx0fSxcblxuXHRmcm9tTW9kZToge1xuXHRcdHJnYjogY29udmVydFJnYlRvWWlxXG5cdH0sXG5cblx0Y2hhbm5lbHM6IFsneScsICdpJywgJ3EnLCAnYWxwaGEnXSxcblxuXHRwYXJzZTogWyctLXlpcSddLFxuXHRzZXJpYWxpemU6ICctLXlpcScsXG5cblx0cmFuZ2VzOiB7XG5cdFx0aTogWy0wLjU5NSwgMC41OTVdLFxuXHRcdHE6IFstMC41MjIsIDAuNTIyXVxuXHR9LFxuXG5cdGludGVycG9sYXRlOiB7XG5cdFx0eTogaW50ZXJwb2xhdG9yTGluZWFyLFxuXHRcdGk6IGludGVycG9sYXRvckxpbmVhcixcblx0XHRxOiBpbnRlcnBvbGF0b3JMaW5lYXIsXG5cdFx0YWxwaGE6IHsgdXNlOiBpbnRlcnBvbGF0b3JMaW5lYXIsIGZpeHVwOiBmaXh1cEFscGhhIH1cblx0fVxufTtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5pdGlvbjtcbiIsICIvLyBDb2xvciBzcGFjZSBkZWZpbml0aW9uc1xuaW1wb3J0IG1vZGVBOTggZnJvbSAnLi9hOTgvZGVmaW5pdGlvbi5qcyc7XG5pbXBvcnQgbW9kZUN1YmVoZWxpeCBmcm9tICcuL2N1YmVoZWxpeC9kZWZpbml0aW9uLmpzJztcbmltcG9ydCBtb2RlRGxhYiBmcm9tICcuL2RsYWIvZGVmaW5pdGlvbi5qcyc7XG5pbXBvcnQgbW9kZURsY2ggZnJvbSAnLi9kbGNoL2RlZmluaXRpb24uanMnO1xuaW1wb3J0IG1vZGVIc2kgZnJvbSAnLi9oc2kvZGVmaW5pdGlvbi5qcyc7XG5pbXBvcnQgbW9kZUhzbCBmcm9tICcuL2hzbC9kZWZpbml0aW9uLmpzJztcbmltcG9ydCBtb2RlSHN2IGZyb20gJy4vaHN2L2RlZmluaXRpb24uanMnO1xuaW1wb3J0IG1vZGVId2IgZnJvbSAnLi9od2IvZGVmaW5pdGlvbi5qcyc7XG5pbXBvcnQgbW9kZUl0cCBmcm9tICcuL2l0cC9kZWZpbml0aW9uLmpzJztcbmltcG9ydCBtb2RlSmFiIGZyb20gJy4vamFiL2RlZmluaXRpb24uanMnO1xuaW1wb3J0IG1vZGVKY2ggZnJvbSAnLi9qY2gvZGVmaW5pdGlvbi5qcyc7XG5pbXBvcnQgbW9kZUxhYiBmcm9tICcuL2xhYi9kZWZpbml0aW9uLmpzJztcbmltcG9ydCBtb2RlTGFiNjUgZnJvbSAnLi9sYWI2NS9kZWZpbml0aW9uLmpzJztcbmltcG9ydCBtb2RlTGNoIGZyb20gJy4vbGNoL2RlZmluaXRpb24uanMnO1xuaW1wb3J0IG1vZGVMY2g2NSBmcm9tICcuL2xjaDY1L2RlZmluaXRpb24uanMnO1xuaW1wb3J0IG1vZGVMY2h1diBmcm9tICcuL2xjaHV2L2RlZmluaXRpb24uanMnO1xuaW1wb3J0IG1vZGVMcmdiIGZyb20gJy4vbHJnYi9kZWZpbml0aW9uLmpzJztcbmltcG9ydCBtb2RlTHV2IGZyb20gJy4vbHV2L2RlZmluaXRpb24uanMnO1xuaW1wb3J0IG1vZGVPa2hzbCBmcm9tICcuL29raHNsL21vZGVPa2hzbC5qcyc7XG5pbXBvcnQgbW9kZU9raHN2IGZyb20gJy4vb2toc3YvbW9kZU9raHN2LmpzJztcbmltcG9ydCBtb2RlT2tsYWIgZnJvbSAnLi9va2xhYi9kZWZpbml0aW9uLmpzJztcbmltcG9ydCBtb2RlT2tsY2ggZnJvbSAnLi9va2xjaC9kZWZpbml0aW9uLmpzJztcbmltcG9ydCBtb2RlUDMgZnJvbSAnLi9wMy9kZWZpbml0aW9uLmpzJztcbmltcG9ydCBtb2RlUHJvcGhvdG8gZnJvbSAnLi9wcm9waG90by9kZWZpbml0aW9uLmpzJztcbmltcG9ydCBtb2RlUmVjMjAyMCBmcm9tICcuL3JlYzIwMjAvZGVmaW5pdGlvbi5qcyc7XG5pbXBvcnQgbW9kZVJnYiBmcm9tICcuL3JnYi9kZWZpbml0aW9uLmpzJztcbmltcG9ydCBtb2RlWHliIGZyb20gJy4veHliL2RlZmluaXRpb24uanMnO1xuaW1wb3J0IG1vZGVYeXo1MCBmcm9tICcuL3h5ejUwL2RlZmluaXRpb24uanMnO1xuaW1wb3J0IG1vZGVYeXo2NSBmcm9tICcuL3h5ejY1L2RlZmluaXRpb24uanMnO1xuaW1wb3J0IG1vZGVZaXEgZnJvbSAnLi95aXEvZGVmaW5pdGlvbi5qcyc7XG5pbXBvcnQgeyB1c2VNb2RlIH0gZnJvbSAnLi9tb2Rlcy5qcyc7XG5cbmV4cG9ydCB7IGRlZmF1bHQgYXMgY29udmVydGVyIH0gZnJvbSAnLi9jb252ZXJ0ZXIuanMnO1xuXG5leHBvcnQge1xuXHRzZXJpYWxpemVIZXgsXG5cdHNlcmlhbGl6ZUhleDgsXG5cdHNlcmlhbGl6ZVJnYixcblx0c2VyaWFsaXplSHNsLFxuXHRmb3JtYXRIZXgsXG5cdGZvcm1hdEhleDgsXG5cdGZvcm1hdFJnYixcblx0Zm9ybWF0SHNsLFxuXHRmb3JtYXRDc3Ncbn0gZnJvbSAnLi9mb3JtYXR0ZXIuanMnO1xuXG5leHBvcnQgeyBkZWZhdWx0IGFzIGNvbG9yc05hbWVkIH0gZnJvbSAnLi9jb2xvcnMvbmFtZWQuanMnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBibGVuZCB9IGZyb20gJy4vYmxlbmQuanMnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyByYW5kb20gfSBmcm9tICcuL3JhbmRvbS5qcyc7XG5cbmV4cG9ydCB7XG5cdGZpeHVwSHVlU2hvcnRlcixcblx0Zml4dXBIdWVMb25nZXIsXG5cdGZpeHVwSHVlSW5jcmVhc2luZyxcblx0Zml4dXBIdWVEZWNyZWFzaW5nXG59IGZyb20gJy4vZml4dXAvaHVlLmpzJztcblxuZXhwb3J0IHsgZml4dXBBbHBoYSB9IGZyb20gJy4vZml4dXAvYWxwaGEuanMnO1xuXG5leHBvcnQge1xuXHRtYXBwZXIsXG5cdG1hcEFscGhhTXVsdGlwbHksXG5cdG1hcEFscGhhRGl2aWRlLFxuXHRtYXBUcmFuc2ZlckxpbmVhcixcblx0bWFwVHJhbnNmZXJHYW1tYVxufSBmcm9tICcuL21hcC5qcyc7XG5cbmV4cG9ydCB7IGF2ZXJhZ2UsIGF2ZXJhZ2VBbmdsZSwgYXZlcmFnZU51bWJlciB9IGZyb20gJy4vYXZlcmFnZS5qcyc7XG5cbmV4cG9ydCB7IGRlZmF1bHQgYXMgcm91bmQgfSBmcm9tICcuL3JvdW5kLmpzJztcbmV4cG9ydCB7XG5cdGludGVycG9sYXRlLFxuXHRpbnRlcnBvbGF0ZVdpdGgsXG5cdGludGVycG9sYXRlV2l0aFByZW11bHRpcGxpZWRBbHBoYVxufSBmcm9tICcuL2ludGVycG9sYXRlL2ludGVycG9sYXRlLmpzJztcblxuZXhwb3J0IHsgaW50ZXJwb2xhdG9yTGluZWFyIH0gZnJvbSAnLi9pbnRlcnBvbGF0ZS9saW5lYXIuanMnO1xuXG5leHBvcnQgeyBpbnRlcnBvbGF0b3JQaWVjZXdpc2UgfSBmcm9tICcuL2ludGVycG9sYXRlL3BpZWNld2lzZS5qcyc7XG5cbmV4cG9ydCB7XG5cdGludGVycG9sYXRvclNwbGluZUJhc2lzLFxuXHRpbnRlcnBvbGF0b3JTcGxpbmVCYXNpc0Nsb3NlZFxufSBmcm9tICcuL2ludGVycG9sYXRlL3NwbGluZUJhc2lzLmpzJztcblxuZXhwb3J0IHtcblx0aW50ZXJwb2xhdG9yU3BsaW5lTmF0dXJhbCxcblx0aW50ZXJwb2xhdG9yU3BsaW5lTmF0dXJhbENsb3NlZFxufSBmcm9tICcuL2ludGVycG9sYXRlL3NwbGluZU5hdHVyYWwuanMnO1xuXG5leHBvcnQge1xuXHRpbnRlcnBvbGF0b3JTcGxpbmVNb25vdG9uZSxcblx0aW50ZXJwb2xhdG9yU3BsaW5lTW9ub3RvbmUyLFxuXHRpbnRlcnBvbGF0b3JTcGxpbmVNb25vdG9uZUNsb3NlZFxufSBmcm9tICcuL2ludGVycG9sYXRlL3NwbGluZU1vbm90b25lLmpzJztcblxuZXhwb3J0IHsgbGVycCwgdW5sZXJwLCBibGVycCwgdHJpbGVycCB9IGZyb20gJy4vaW50ZXJwb2xhdGUvbGVycC5qcyc7XG5leHBvcnQgeyBkZWZhdWx0IGFzIHNhbXBsZXMgfSBmcm9tICcuL3NhbXBsZXMuanMnO1xuZXhwb3J0IHtcblx0ZGlzcGxheWFibGUsXG5cdGluR2FtdXQsXG5cdGNsYW1wUmdiLFxuXHRjbGFtcENocm9tYSxcblx0Y2xhbXBHYW11dCxcblx0dG9HYW11dFxufSBmcm9tICcuL2NsYW1wLmpzJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgbmVhcmVzdCB9IGZyb20gJy4vbmVhcmVzdC5qcyc7XG5leHBvcnQgeyB1c2VNb2RlLCBnZXRNb2RlLCB1c2VQYXJzZXIsIHJlbW92ZVBhcnNlciB9IGZyb20gJy4vbW9kZXMuanMnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBwYXJzZSB9IGZyb20gJy4vcGFyc2UuanMnO1xuXG5leHBvcnQge1xuXHRkaWZmZXJlbmNlRXVjbGlkZWFuLFxuXHRkaWZmZXJlbmNlQ2llNzYsXG5cdGRpZmZlcmVuY2VDaWU5NCxcblx0ZGlmZmVyZW5jZUNpZWRlMjAwMCxcblx0ZGlmZmVyZW5jZUNtYyxcblx0ZGlmZmVyZW5jZUh5YWIsXG5cdGRpZmZlcmVuY2VIdWVTYXR1cmF0aW9uLFxuXHRkaWZmZXJlbmNlSHVlQ2hyb21hLFxuXHRkaWZmZXJlbmNlSHVlTmFpdmUsXG5cdGRpZmZlcmVuY2VLb3RzYXJlbmtvUmFtb3MsXG5cdGRpZmZlcmVuY2VJdHBcbn0gZnJvbSAnLi9kaWZmZXJlbmNlLmpzJztcblxuZXhwb3J0IHtcblx0ZmlsdGVyQnJpZ2h0bmVzcyxcblx0ZmlsdGVyQ29udHJhc3QsXG5cdGZpbHRlclNlcGlhLFxuXHRmaWx0ZXJJbnZlcnQsXG5cdGZpbHRlclNhdHVyYXRlLFxuXHRmaWx0ZXJHcmF5c2NhbGUsXG5cdGZpbHRlckh1ZVJvdGF0ZVxufSBmcm9tICcuL2ZpbHRlci5qcyc7XG5cbmV4cG9ydCB7XG5cdGZpbHRlckRlZmljaWVuY3lQcm90LFxuXHRmaWx0ZXJEZWZpY2llbmN5RGV1dGVyLFxuXHRmaWx0ZXJEZWZpY2llbmN5VHJpdFxufSBmcm9tICcuL2RlZmljaWVuY3kuanMnO1xuXG4vLyBFYXNpbmdzXG5leHBvcnQgeyBkZWZhdWx0IGFzIGVhc2luZ01pZHBvaW50IH0gZnJvbSAnLi9lYXNpbmcvbWlkcG9pbnQuanMnO1xuZXhwb3J0IHtcblx0ZWFzaW5nU21vb3Roc3RlcCxcblx0ZWFzaW5nU21vb3Roc3RlcEludmVyc2Vcbn0gZnJvbSAnLi9lYXNpbmcvc21vb3Roc3RlcC5qcyc7XG5leHBvcnQgeyBkZWZhdWx0IGFzIGVhc2luZ1Ntb290aGVyc3RlcCB9IGZyb20gJy4vZWFzaW5nL3Ntb290aGVyc3RlcC5qcyc7XG5leHBvcnQgeyBkZWZhdWx0IGFzIGVhc2luZ0luT3V0U2luZSB9IGZyb20gJy4vZWFzaW5nL2luT3V0U2luZS5qcyc7XG5leHBvcnQgeyBkZWZhdWx0IGFzIGVhc2luZ0dhbW1hIH0gZnJvbSAnLi9lYXNpbmcvZ2FtbWEuanMnO1xuXG5leHBvcnQge1xuXHRsdW1pbmFuY2UgYXMgd2NhZ0x1bWluYW5jZSxcblx0Y29udHJhc3QgYXMgd2NhZ0NvbnRyYXN0XG59IGZyb20gJy4vd2NhZy5qcyc7XG5cbmV4cG9ydCB7IGRlZmF1bHQgYXMgcGFyc2VIc2wgfSBmcm9tICcuL2hzbC9wYXJzZUhzbC5qcyc7XG5leHBvcnQgeyBkZWZhdWx0IGFzIHBhcnNlSHdiIH0gZnJvbSAnLi9od2IvcGFyc2VId2IuanMnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBwYXJzZUxhYiB9IGZyb20gJy4vbGFiL3BhcnNlTGFiLmpzJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgcGFyc2VMY2ggfSBmcm9tICcuL2xjaC9wYXJzZUxjaC5qcyc7XG5leHBvcnQgeyBkZWZhdWx0IGFzIHBhcnNlTmFtZWQgfSBmcm9tICcuL3JnYi9wYXJzZU5hbWVkLmpzJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgcGFyc2VUcmFuc3BhcmVudCB9IGZyb20gJy4vcmdiL3BhcnNlVHJhbnNwYXJlbnQuanMnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBwYXJzZUhleCB9IGZyb20gJy4vcmdiL3BhcnNlSGV4LmpzJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgcGFyc2VSZ2IgfSBmcm9tICcuL3JnYi9wYXJzZVJnYi5qcyc7XG5leHBvcnQgeyBkZWZhdWx0IGFzIHBhcnNlSHNsTGVnYWN5IH0gZnJvbSAnLi9oc2wvcGFyc2VIc2xMZWdhY3kuanMnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBwYXJzZVJnYkxlZ2FjeSB9IGZyb20gJy4vcmdiL3BhcnNlUmdiTGVnYWN5LmpzJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgcGFyc2VPa2xhYiB9IGZyb20gJy4vb2tsYWIvcGFyc2VPa2xhYi5qcyc7XG5leHBvcnQgeyBkZWZhdWx0IGFzIHBhcnNlT2tsY2ggfSBmcm9tICcuL29rbGNoL3BhcnNlT2tsY2guanMnO1xuXG5leHBvcnQgeyBkZWZhdWx0IGFzIGNvbnZlcnRBOThUb1h5ejY1IH0gZnJvbSAnLi9hOTgvY29udmVydEE5OFRvWHl6NjUuanMnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBjb252ZXJ0Q3ViZWhlbGl4VG9SZ2IgfSBmcm9tICcuL2N1YmVoZWxpeC9jb252ZXJ0Q3ViZWhlbGl4VG9SZ2IuanMnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBjb252ZXJ0RGxjaFRvTGFiNjUgfSBmcm9tICcuL2RsY2gvY29udmVydERsY2hUb0xhYjY1LmpzJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgY29udmVydEhzaVRvUmdiIH0gZnJvbSAnLi9oc2kvY29udmVydEhzaVRvUmdiLmpzJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgY29udmVydEhzbFRvUmdiIH0gZnJvbSAnLi9oc2wvY29udmVydEhzbFRvUmdiLmpzJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgY29udmVydEhzdlRvUmdiIH0gZnJvbSAnLi9oc3YvY29udmVydEhzdlRvUmdiLmpzJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgY29udmVydEh3YlRvUmdiIH0gZnJvbSAnLi9od2IvY29udmVydEh3YlRvUmdiLmpzJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgY29udmVydEl0cFRvWHl6NjUgfSBmcm9tICcuL2l0cC9jb252ZXJ0SXRwVG9YeXo2NS5qcyc7XG5leHBvcnQgeyBkZWZhdWx0IGFzIGNvbnZlcnRKYWJUb0pjaCB9IGZyb20gJy4vamNoL2NvbnZlcnRKYWJUb0pjaC5qcyc7XG5leHBvcnQgeyBkZWZhdWx0IGFzIGNvbnZlcnRKYWJUb1JnYiB9IGZyb20gJy4vamFiL2NvbnZlcnRKYWJUb1JnYi5qcyc7XG5leHBvcnQgeyBkZWZhdWx0IGFzIGNvbnZlcnRKYWJUb1h5ejY1IH0gZnJvbSAnLi9qYWIvY29udmVydEphYlRvWHl6NjUuanMnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBjb252ZXJ0SmNoVG9KYWIgfSBmcm9tICcuL2pjaC9jb252ZXJ0SmNoVG9KYWIuanMnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBjb252ZXJ0TGFiNjVUb0RsY2ggfSBmcm9tICcuL2RsY2gvY29udmVydExhYjY1VG9EbGNoLmpzJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgY29udmVydExhYjY1VG9SZ2IgfSBmcm9tICcuL2xhYjY1L2NvbnZlcnRMYWI2NVRvUmdiLmpzJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgY29udmVydExhYjY1VG9YeXo2NSB9IGZyb20gJy4vbGFiNjUvY29udmVydExhYjY1VG9YeXo2NS5qcyc7XG5leHBvcnQgeyBkZWZhdWx0IGFzIGNvbnZlcnRMYWJUb0xjaCB9IGZyb20gJy4vbGNoL2NvbnZlcnRMYWJUb0xjaC5qcyc7XG5leHBvcnQgeyBkZWZhdWx0IGFzIGNvbnZlcnRMYWJUb1JnYiB9IGZyb20gJy4vbGFiL2NvbnZlcnRMYWJUb1JnYi5qcyc7XG5leHBvcnQgeyBkZWZhdWx0IGFzIGNvbnZlcnRMYWJUb1h5ejUwIH0gZnJvbSAnLi9sYWIvY29udmVydExhYlRvWHl6NTAuanMnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBjb252ZXJ0TGNoVG9MYWIgfSBmcm9tICcuL2xjaC9jb252ZXJ0TGNoVG9MYWIuanMnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBjb252ZXJ0TGNodXZUb0x1diB9IGZyb20gJy4vbGNodXYvY29udmVydExjaHV2VG9MdXYuanMnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBjb252ZXJ0THJnYlRvT2tsYWIgfSBmcm9tICcuL29rbGFiL2NvbnZlcnRMcmdiVG9Pa2xhYi5qcyc7XG5leHBvcnQgeyBkZWZhdWx0IGFzIGNvbnZlcnRMcmdiVG9SZ2IgfSBmcm9tICcuL2xyZ2IvY29udmVydExyZ2JUb1JnYi5qcyc7XG5leHBvcnQgeyBkZWZhdWx0IGFzIGNvbnZlcnRMdXZUb0xjaHV2IH0gZnJvbSAnLi9sY2h1di9jb252ZXJ0THV2VG9MY2h1di5qcyc7XG5leHBvcnQgeyBkZWZhdWx0IGFzIGNvbnZlcnRMdXZUb1h5ejUwIH0gZnJvbSAnLi9sdXYvY29udmVydEx1dlRvWHl6NTAuanMnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBjb252ZXJ0T2toc2xUb09rbGFiIH0gZnJvbSAnLi9va2hzbC9jb252ZXJ0T2toc2xUb09rbGFiLmpzJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgY29udmVydE9raHN2VG9Pa2xhYiB9IGZyb20gJy4vb2toc3YvY29udmVydE9raHN2VG9Pa2xhYi5qcyc7XG5leHBvcnQgeyBkZWZhdWx0IGFzIGNvbnZlcnRPa2xhYlRvTHJnYiB9IGZyb20gJy4vb2tsYWIvY29udmVydE9rbGFiVG9McmdiLmpzJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgY29udmVydE9rbGFiVG9Pa2hzbCB9IGZyb20gJy4vb2toc2wvY29udmVydE9rbGFiVG9Pa2hzbC5qcyc7XG5leHBvcnQgeyBkZWZhdWx0IGFzIGNvbnZlcnRPa2xhYlRvT2toc3YgfSBmcm9tICcuL29raHN2L2NvbnZlcnRPa2xhYlRvT2toc3YuanMnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBjb252ZXJ0T2tsYWJUb1JnYiB9IGZyb20gJy4vb2tsYWIvY29udmVydE9rbGFiVG9SZ2IuanMnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBjb252ZXJ0UDNUb1h5ejY1IH0gZnJvbSAnLi9wMy9jb252ZXJ0UDNUb1h5ejY1LmpzJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgY29udmVydFByb3Bob3RvVG9YeXo1MCB9IGZyb20gJy4vcHJvcGhvdG8vY29udmVydFByb3Bob3RvVG9YeXo1MC5qcyc7XG5leHBvcnQgeyBkZWZhdWx0IGFzIGNvbnZlcnRSZWMyMDIwVG9YeXo2NSB9IGZyb20gJy4vcmVjMjAyMC9jb252ZXJ0UmVjMjAyMFRvWHl6NjUuanMnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBjb252ZXJ0UmdiVG9DdWJlaGVsaXggfSBmcm9tICcuL2N1YmVoZWxpeC9jb252ZXJ0UmdiVG9DdWJlaGVsaXguanMnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBjb252ZXJ0UmdiVG9Ic2kgfSBmcm9tICcuL2hzaS9jb252ZXJ0UmdiVG9Ic2kuanMnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBjb252ZXJ0UmdiVG9Ic2wgfSBmcm9tICcuL2hzbC9jb252ZXJ0UmdiVG9Ic2wuanMnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBjb252ZXJ0UmdiVG9Ic3YgfSBmcm9tICcuL2hzdi9jb252ZXJ0UmdiVG9Ic3YuanMnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBjb252ZXJ0UmdiVG9Id2IgfSBmcm9tICcuL2h3Yi9jb252ZXJ0UmdiVG9Id2IuanMnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBjb252ZXJ0UmdiVG9KYWIgfSBmcm9tICcuL2phYi9jb252ZXJ0UmdiVG9KYWIuanMnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBjb252ZXJ0UmdiVG9MYWIgfSBmcm9tICcuL2xhYi9jb252ZXJ0UmdiVG9MYWIuanMnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBjb252ZXJ0UmdiVG9MYWI2NSB9IGZyb20gJy4vbGFiNjUvY29udmVydFJnYlRvTGFiNjUuanMnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBjb252ZXJ0UmdiVG9McmdiIH0gZnJvbSAnLi9scmdiL2NvbnZlcnRSZ2JUb0xyZ2IuanMnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBjb252ZXJ0UmdiVG9Pa2xhYiB9IGZyb20gJy4vb2tsYWIvY29udmVydFJnYlRvT2tsYWIuanMnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBjb252ZXJ0UmdiVG9YeWIgfSBmcm9tICcuL3h5Yi9jb252ZXJ0UmdiVG9YeWIuanMnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBjb252ZXJ0UmdiVG9YeXo1MCB9IGZyb20gJy4veHl6NTAvY29udmVydFJnYlRvWHl6NTAuanMnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBjb252ZXJ0UmdiVG9YeXo2NSB9IGZyb20gJy4veHl6NjUvY29udmVydFJnYlRvWHl6NjUuanMnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBjb252ZXJ0UmdiVG9ZaXEgfSBmcm9tICcuL3lpcS9jb252ZXJ0UmdiVG9ZaXEuanMnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBjb252ZXJ0WHliVG9SZ2IgfSBmcm9tICcuL3h5Yi9jb252ZXJ0WHliVG9SZ2IuanMnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBjb252ZXJ0WHl6NTBUb0xhYiB9IGZyb20gJy4vbGFiL2NvbnZlcnRYeXo1MFRvTGFiLmpzJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgY29udmVydFh5ejUwVG9MdXYgfSBmcm9tICcuL2x1di9jb252ZXJ0WHl6NTBUb0x1di5qcyc7XG5leHBvcnQgeyBkZWZhdWx0IGFzIGNvbnZlcnRYeXo1MFRvUHJvcGhvdG8gfSBmcm9tICcuL3Byb3Bob3RvL2NvbnZlcnRYeXo1MFRvUHJvcGhvdG8uanMnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBjb252ZXJ0WHl6NTBUb1JnYiB9IGZyb20gJy4veHl6NTAvY29udmVydFh5ejUwVG9SZ2IuanMnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBjb252ZXJ0WHl6NTBUb1h5ejY1IH0gZnJvbSAnLi94eXo2NS9jb252ZXJ0WHl6NTBUb1h5ejY1LmpzJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgY29udmVydFh5ejY1VG9BOTggfSBmcm9tICcuL2E5OC9jb252ZXJ0WHl6NjVUb0E5OC5qcyc7XG5leHBvcnQgeyBkZWZhdWx0IGFzIGNvbnZlcnRYeXo2NVRvSXRwIH0gZnJvbSAnLi9pdHAvY29udmVydFh5ejY1VG9JdHAuanMnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBjb252ZXJ0WHl6NjVUb0phYiB9IGZyb20gJy4vamFiL2NvbnZlcnRYeXo2NVRvSmFiLmpzJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgY29udmVydFh5ejY1VG9MYWI2NSB9IGZyb20gJy4vbGFiNjUvY29udmVydFh5ejY1VG9MYWI2NS5qcyc7XG5leHBvcnQgeyBkZWZhdWx0IGFzIGNvbnZlcnRYeXo2NVRvUDMgfSBmcm9tICcuL3AzL2NvbnZlcnRYeXo2NVRvUDMuanMnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBjb252ZXJ0WHl6NjVUb1JlYzIwMjAgfSBmcm9tICcuL3JlYzIwMjAvY29udmVydFh5ejY1VG9SZWMyMDIwLmpzJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgY29udmVydFh5ejY1VG9SZ2IgfSBmcm9tICcuL3h5ejY1L2NvbnZlcnRYeXo2NVRvUmdiLmpzJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgY29udmVydFh5ejY1VG9YeXo1MCB9IGZyb20gJy4veHl6NjUvY29udmVydFh5ejY1VG9YeXo1MC5qcyc7XG5leHBvcnQgeyBkZWZhdWx0IGFzIGNvbnZlcnRZaXFUb1JnYiB9IGZyb20gJy4veWlxL2NvbnZlcnRZaXFUb1JnYi5qcyc7XG5cbmV4cG9ydCB7XG5cdG1vZGVBOTgsXG5cdG1vZGVDdWJlaGVsaXgsXG5cdG1vZGVEbGFiLFxuXHRtb2RlRGxjaCxcblx0bW9kZUhzaSxcblx0bW9kZUhzbCxcblx0bW9kZUhzdixcblx0bW9kZUh3Yixcblx0bW9kZUl0cCxcblx0bW9kZUphYixcblx0bW9kZUpjaCxcblx0bW9kZUxhYixcblx0bW9kZUxhYjY1LFxuXHRtb2RlTGNoLFxuXHRtb2RlTGNoNjUsXG5cdG1vZGVMY2h1dixcblx0bW9kZUxyZ2IsXG5cdG1vZGVMdXYsXG5cdG1vZGVPa2hzbCxcblx0bW9kZU9raHN2LFxuXHRtb2RlT2tsYWIsXG5cdG1vZGVPa2xjaCxcblx0bW9kZVAzLFxuXHRtb2RlUHJvcGhvdG8sXG5cdG1vZGVSZWMyMDIwLFxuXHRtb2RlUmdiLFxuXHRtb2RlWHliLFxuXHRtb2RlWHl6NTAsXG5cdG1vZGVYeXo2NSxcblx0bW9kZVlpcVxufTtcblxuZXhwb3J0IGNvbnN0IGE5OCA9IHVzZU1vZGUobW9kZUE5OCk7XG5leHBvcnQgY29uc3QgY3ViZWhlbGl4ID0gdXNlTW9kZShtb2RlQ3ViZWhlbGl4KTtcbmV4cG9ydCBjb25zdCBkbGFiID0gdXNlTW9kZShtb2RlRGxhYik7XG5leHBvcnQgY29uc3QgZGxjaCA9IHVzZU1vZGUobW9kZURsY2gpO1xuZXhwb3J0IGNvbnN0IGhzaSA9IHVzZU1vZGUobW9kZUhzaSk7XG5leHBvcnQgY29uc3QgaHNsID0gdXNlTW9kZShtb2RlSHNsKTtcbmV4cG9ydCBjb25zdCBoc3YgPSB1c2VNb2RlKG1vZGVIc3YpO1xuZXhwb3J0IGNvbnN0IGh3YiA9IHVzZU1vZGUobW9kZUh3Yik7XG5leHBvcnQgY29uc3QgaXRwID0gdXNlTW9kZShtb2RlSXRwKTtcbmV4cG9ydCBjb25zdCBqYWIgPSB1c2VNb2RlKG1vZGVKYWIpO1xuZXhwb3J0IGNvbnN0IGpjaCA9IHVzZU1vZGUobW9kZUpjaCk7XG5leHBvcnQgY29uc3QgbGFiID0gdXNlTW9kZShtb2RlTGFiKTtcbmV4cG9ydCBjb25zdCBsYWI2NSA9IHVzZU1vZGUobW9kZUxhYjY1KTtcbmV4cG9ydCBjb25zdCBsY2ggPSB1c2VNb2RlKG1vZGVMY2gpO1xuZXhwb3J0IGNvbnN0IGxjaDY1ID0gdXNlTW9kZShtb2RlTGNoNjUpO1xuZXhwb3J0IGNvbnN0IGxjaHV2ID0gdXNlTW9kZShtb2RlTGNodXYpO1xuZXhwb3J0IGNvbnN0IGxyZ2IgPSB1c2VNb2RlKG1vZGVMcmdiKTtcbmV4cG9ydCBjb25zdCBsdXYgPSB1c2VNb2RlKG1vZGVMdXYpO1xuZXhwb3J0IGNvbnN0IG9raHNsID0gdXNlTW9kZShtb2RlT2toc2wpO1xuZXhwb3J0IGNvbnN0IG9raHN2ID0gdXNlTW9kZShtb2RlT2toc3YpO1xuZXhwb3J0IGNvbnN0IG9rbGFiID0gdXNlTW9kZShtb2RlT2tsYWIpO1xuZXhwb3J0IGNvbnN0IG9rbGNoID0gdXNlTW9kZShtb2RlT2tsY2gpO1xuZXhwb3J0IGNvbnN0IHAzID0gdXNlTW9kZShtb2RlUDMpO1xuZXhwb3J0IGNvbnN0IHByb3Bob3RvID0gdXNlTW9kZShtb2RlUHJvcGhvdG8pO1xuZXhwb3J0IGNvbnN0IHJlYzIwMjAgPSB1c2VNb2RlKG1vZGVSZWMyMDIwKTtcbmV4cG9ydCBjb25zdCByZ2IgPSB1c2VNb2RlKG1vZGVSZ2IpO1xuZXhwb3J0IGNvbnN0IHh5YiA9IHVzZU1vZGUobW9kZVh5Yik7XG5leHBvcnQgY29uc3QgeHl6NTAgPSB1c2VNb2RlKG1vZGVYeXo1MCk7XG5leHBvcnQgY29uc3QgeHl6NjUgPSB1c2VNb2RlKG1vZGVYeXo2NSk7XG5leHBvcnQgY29uc3QgeWlxID0gdXNlTW9kZShtb2RlWWlxKTtcbiIsICIvKipcbiAqIENvbG9yIHV0aWxpdGllcyBcdTIwMTQgY29udmVydCB0aGUgT0tMQ0ggdG9rZW5zIGZyb20gZGVzaWduL3Rva2Vucy50cyBpbnRvXG4gKiBSR0Igc3RyaW5ncyBDYW52YXMgMkQgY2FuIHJlbmRlci5cbiAqXG4gKiBjdWxvcmkgaGFuZGxlcyBPS0xDSCBcdTIxOTQgc1JHQiBjb252ZXJzaW9uIHdpdGggZ2FtdXQgbWFwcGluZy4gVGhlXG4gKiByZXN1bHRpbmcgc3RyaW5ncyBhcmUgdmFsaWQgQ2FudmFzIGZpbGxTdHlsZSAvIHN0cm9rZVN0eWxlIHZhbHVlcy5cbiAqXG4gKiBXaHkgT0tMQ0g6IHdoZW4gdHdvIGRyaXZlIGNvbG9ycyBtaXggKGFyYml0cmF0aW9uIGNvbnN1bHRhdGlvbixcbiAqIHNwb3RsaWdodCBvc2NpbGxhdGlvbiksIG5haXZlIFJHQiBpbnRlcnBvbGF0aW9uIHByb2R1Y2VzIG11ZGR5XG4gKiBtaWQtdG9uZXMuIE9LTENIIGludGVycG9sYXRpb24gc3RheXMgcGVyY2VwdHVhbGx5IGNsZWFuLlxuICovXG5cbmltcG9ydCB7IGNvbnZlcnRlciwgZm9ybWF0UmdiLCBmb3JtYXRIZXggfSBmcm9tICdjdWxvcmknO1xuaW1wb3J0IHR5cGUgeyBPa2xjaENvbG9yIH0gZnJvbSAnLi4vZGVzaWduL3Rva2Vucyc7XG5cbmNvbnN0IHRvUmdiID0gY29udmVydGVyKCdyZ2InKTtcblxuLyoqXG4gKiBDb252ZXJ0IGFuIE9LTENIIHRyaXBsZSB0byBhIENTUyByZ2IoKSBzdHJpbmcgd2l0aCBvcHRpb25hbCBhbHBoYS5cbiAqIFJldHVybnMgYSBzdHJpbmcgQ2FudmFzIDJEIGNhbiB1c2UgZGlyZWN0bHkgYXMgZmlsbFN0eWxlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gb2tsY2hUb1JnYihjb2xvcjogT2tsY2hDb2xvciwgYWxwaGEgPSAxKTogc3RyaW5nIHtcbiAgY29uc3QgcmdiID0gdG9SZ2IoeyBtb2RlOiAnb2tsY2gnLCBsOiBjb2xvci5sLCBjOiBjb2xvci5jLCBoOiBjb2xvci5oIH0pO1xuICBpZiAoIXJnYikge1xuICAgIC8vIFNob3VsZCBub3QgaGFwcGVuIGZvciBpbi1nYW11dCBjb2xvcnM7IGRlZmVuc2l2ZSBkZWZhdWx0LlxuICAgIHJldHVybiBgcmdiYSgwLDAsMCwke2FscGhhfSlgO1xuICB9XG4gIGNvbnN0IHIgPSBNYXRoLnJvdW5kKE1hdGgubWF4KDAsIE1hdGgubWluKDEsIHJnYi5yKSkgKiAyNTUpO1xuICBjb25zdCBnID0gTWF0aC5yb3VuZChNYXRoLm1heCgwLCBNYXRoLm1pbigxLCByZ2IuZykpICogMjU1KTtcbiAgY29uc3QgYiA9IE1hdGgucm91bmQoTWF0aC5tYXgoMCwgTWF0aC5taW4oMSwgcmdiLmIpKSAqIDI1NSk7XG4gIGlmIChhbHBoYSA+PSAxKSByZXR1cm4gYHJnYigke3J9LCAke2d9LCAke2J9KWA7XG4gIHJldHVybiBgcmdiYSgke3J9LCAke2d9LCAke2J9LCAke2FscGhhLnRvRml4ZWQoMyl9KWA7XG59XG5cbi8qKlxuICogTGlnaHRlbiBvciBkYXJrZW4gYW4gT0tMQ0ggY29sb3IgYnkgYW4gYW1vdW50IGluIFstMSwgMV0uIFVzZWZ1bCBmb3JcbiAqIGRlcml2aW5nIGdsb3cgaGFsb3Mgb3IgcHJlc3NlZCBzdGF0ZXMgd2l0aG91dCByZS1zcGVjaWZ5aW5nIGV2ZXJ5XG4gKiBncmFkaWVudCBzdG9wIGluIGRlc2lnbiB0b2tlbnMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzaGlmdExpZ2h0bmVzcyhjb2xvcjogT2tsY2hDb2xvciwgZGVsdGE6IG51bWJlcik6IE9rbGNoQ29sb3Ige1xuICByZXR1cm4geyBsOiBNYXRoLm1heCgwLCBNYXRoLm1pbigxLCBjb2xvci5sICsgZGVsdGEpKSwgYzogY29sb3IuYywgaDogY29sb3IuaCB9O1xufVxuXG4vKipcbiAqIEFkanVzdCBjaHJvbWEgKHNhdHVyYXRpb24gaW4gT0tMQ0ggdGVybXMpLiBOZWdhdGl2ZSBkZWx0YXMgbXV0ZSB0aGVcbiAqIGNvbG9yIHRvd2FyZCBncmF5OyBwb3NpdGl2ZSBkZWx0YXMgc2F0dXJhdGUgaXQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzaGlmdENocm9tYShjb2xvcjogT2tsY2hDb2xvciwgZGVsdGE6IG51bWJlcik6IE9rbGNoQ29sb3Ige1xuICByZXR1cm4geyBsOiBjb2xvci5sLCBjOiBNYXRoLm1heCgwLCBjb2xvci5jICsgZGVsdGEpLCBoOiBjb2xvci5oIH07XG59XG5cbi8qKlxuICogSGV4IGZvcm0gb2YgYW4gT0tMQ0ggY29sb3IgXHUyMDE0IHVzZWZ1bCBmb3IgQ1NTIGNvbnRleHQgKGJhY2tncm91bmQtY29sb3IsXG4gKiBib3JkZXItY29sb3IgaW4gc3R5bGVzaGVldHMpIHdoZXJlIHJnYigpIHdvcmtzIHRvbyBidXQgaGV4IGlzIHNob3J0ZXIuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBva2xjaFRvSGV4KGNvbG9yOiBPa2xjaENvbG9yKTogc3RyaW5nIHtcbiAgY29uc3QgaGV4ID0gZm9ybWF0SGV4KHsgbW9kZTogJ29rbGNoJywgbDogY29sb3IubCwgYzogY29sb3IuYywgaDogY29sb3IuaCB9KTtcbiAgcmV0dXJuIGhleCA/PyAnIzAwMDAwMCc7XG59XG5cbi8qKlxuICogQnVpbGQgYSBDYW52YXMgMkQgcmFkaWFsIGdyYWRpZW50IHdpdGggZXhwb25lbnRpYWwgYWxwaGEgZmFsbG9mZixcbiAqIG1hdGNoaW5nIHRoZSBzcG90bGlnaHQgYWxnb3JpdGhtIHNwZWNpZmllZCBpbiB0aGUgY29uY2VwdCBkb2MuXG4gKlxuICogU3RvcHMgbWlycm9yIHRoZSBzcGVjOlxuICogICAwJSBcdTIxOTIgXHUwM0IxIDEuMDBcbiAqICAgMTglIFx1MjE5MiBcdTAzQjEgMC43NVxuICogICA0MCUgXHUyMTkyIFx1MDNCMSAwLjM1XG4gKiAgIDY1JSBcdTIxOTIgXHUwM0IxIDAuMTJcbiAqICAgODUlIFx1MjE5MiBcdTAzQjEgMC4wM1xuICogICAxMDAlIFx1MjE5MiBcdTAzQjEgMC4wMFxuICpcbiAqIFRoZSBjb2xvdXIgYXQgZXZlcnkgc3RvcCBpcyB0aGUgc2FtZSBPS0xDSCBiYXNlIFx1MjAxNCBvbmx5IGFscGhhIGNoYW5nZXNcbiAqIHNvIHRoZSBodWUgc3RheXMgY29uc2lzdGVudCBmcm9tIGNvcmUgdG8gZWRnZSAobm8gd2hpdGUtY29sbGFwc2UpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlU3BvdGxpZ2h0R3JhZGllbnQoXG4gIGN0eDogQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJELFxuICBjeDogbnVtYmVyLFxuICBjeTogbnVtYmVyLFxuICByYWRpdXM6IG51bWJlcixcbiAgY29sb3I6IE9rbGNoQ29sb3IsXG4pOiBDYW52YXNHcmFkaWVudCB7XG4gIGNvbnN0IGcgPSBjdHguY3JlYXRlUmFkaWFsR3JhZGllbnQoY3gsIGN5LCAwLCBjeCwgY3ksIHJhZGl1cyk7XG4gIGcuYWRkQ29sb3JTdG9wKDAuMDAsIG9rbGNoVG9SZ2IoY29sb3IsIDEuMDApKTtcbiAgZy5hZGRDb2xvclN0b3AoMC4xOCwgb2tsY2hUb1JnYihjb2xvciwgMC43NSkpO1xuICBnLmFkZENvbG9yU3RvcCgwLjQwLCBva2xjaFRvUmdiKGNvbG9yLCAwLjM1KSk7XG4gIGcuYWRkQ29sb3JTdG9wKDAuNjUsIG9rbGNoVG9SZ2IoY29sb3IsIDAuMTIpKTtcbiAgZy5hZGRDb2xvclN0b3AoMC44NSwgb2tsY2hUb1JnYihjb2xvciwgMC4wMykpO1xuICBnLmFkZENvbG9yU3RvcCgxLjAwLCBva2xjaFRvUmdiKGNvbG9yLCAwLjAwKSk7XG4gIHJldHVybiBnO1xufVxuXG4vKipcbiAqIEJ1aWxkIGEgc29mdCByYWRpYWwgYmxvb20gZm9yIHN1YnN0cmF0ZSBlcGlzb2RlIHB1bHNlcyBhbmQgYXVkaWVuY2VcbiAqIHdhcm10aC4gU29mdGVyIHRoYW4gdGhlIHNwb3RsaWdodCAobW9yZSByYXBpZCBmYWxsb2ZmKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVNvZnRCbG9vbUdyYWRpZW50KFxuICBjdHg6IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRCxcbiAgY3g6IG51bWJlcixcbiAgY3k6IG51bWJlcixcbiAgcmFkaXVzOiBudW1iZXIsXG4gIGNvbG9yOiBPa2xjaENvbG9yLFxuICBwZWFrQWxwaGEgPSAwLjYsXG4pOiBDYW52YXNHcmFkaWVudCB7XG4gIGNvbnN0IGcgPSBjdHguY3JlYXRlUmFkaWFsR3JhZGllbnQoY3gsIGN5LCAwLCBjeCwgY3ksIHJhZGl1cyk7XG4gIGcuYWRkQ29sb3JTdG9wKDAuMCwgb2tsY2hUb1JnYihjb2xvciwgcGVha0FscGhhKSk7XG4gIGcuYWRkQ29sb3JTdG9wKDAuNSwgb2tsY2hUb1JnYihjb2xvciwgcGVha0FscGhhICogMC4yNSkpO1xuICBnLmFkZENvbG9yU3RvcCgxLjAsIG9rbGNoVG9SZ2IoY29sb3IsIDApKTtcbiAgcmV0dXJuIGc7XG59XG4iLCAiLyoqXG4gKiBBdG1vc3BoZXJlIFx1MjAxNCB0aGUgbWV0YWNvZ25pdGl2ZSB3ZWF0aGVyIGxheWVyLlxuICpcbiAqIFBoYXNlIDI6IHJlbmRlcnMgdGhlIGRlZmF1bHQgXCJjbGVhclwiIHdlYXRoZXIgbW9kZSBhcyBhIHN1YnRsZSB2ZXJ0aWNhbFxuICogZ3JhZGllbnQgYXQgdGhlIHRvcCBvZiB0aGUgY2FudmFzLiBMYXRlciBwaGFzZXMgd2lsbCBzd2l0Y2ggYW1vbmdcbiAqIGNsZWFyL2Nsb3VkZWQvc3Rvcm15L3R3aWxpZ2h0IGJhc2VkIG9uIE1ldGFTaWduYWwgY2x1c3RlcnMuXG4gKi9cblxuaW1wb3J0IHsgQ09MT1IgfSBmcm9tICcuLi8uLi9kZXNpZ24vdG9rZW5zJztcbmltcG9ydCB7IG9rbGNoVG9SZ2IgfSBmcm9tICcuLi9jb2xvcic7XG5pbXBvcnQgeyBhdG1vc3BoZXJlQmFuZCwgdHlwZSBDYW52YXNTaXplIH0gZnJvbSAnLi4vZ2VvbWV0cnknO1xuXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyQXRtb3NwaGVyZShcbiAgY3R4OiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQsXG4gIHNpemU6IENhbnZhc1NpemUsXG4pOiB2b2lkIHtcbiAgY29uc3QgYmFuZCA9IGF0bW9zcGhlcmVCYW5kKHNpemUpO1xuICBjb25zdCB0aW50ID0gQ09MT1IuYXRtb3NwaGVyZS5jbGVhcjtcblxuICAvLyBWZXJ0aWNhbCBncmFkaWVudDogdGludCBhdCB0aGUgdmVyeSB0b3AsIGZhZGluZyB0byBmdWxseVxuICAvLyB0cmFuc3BhcmVudCBhdCB0aGUgYm90dG9tIG9mIHRoZSBiYW5kIHNvIGl0IGJsZW5kcyB3aXRoIHRoZVxuICAvLyBiYWNrZ3JvdW5kIGluZGlnbyBiZWhpbmQgaXQuXG4gIGNvbnN0IGcgPSBjdHguY3JlYXRlTGluZWFyR3JhZGllbnQoMCwgYmFuZC55LCAwLCBiYW5kLnkgKyBiYW5kLmgpO1xuICBnLmFkZENvbG9yU3RvcCgwLCBva2xjaFRvUmdiKHRpbnQsIDAuNTUpKTtcbiAgZy5hZGRDb2xvclN0b3AoMSwgb2tsY2hUb1JnYih0aW50LCAwKSk7XG4gIGN0eC5maWxsU3R5bGUgPSBnO1xuICBjdHguZmlsbFJlY3QoYmFuZC54LCBiYW5kLnksIGJhbmQudywgYmFuZC5oKTtcbn1cbiIsICIvKipcbiAqIEF1ZGllbmNlRGlyZWN0aW9uIFx1MjAxNCBmcm9udC1vZi1zdGFnZSB3YXJtdGggcmVwcmVzZW50aW5nIFRPTSBwcmVzZW5jZS5cbiAqXG4gKiBQaGFzZSAyOiByZW5kZXJzIHRoZSBkZWZhdWx0IFwiYXZhaWxhYmxlXCIgd2FybXRoIGFzIGEgc29mdCBhbWJlciBibG9vbVxuICogYXQgdGhlIGJvdHRvbS1jZW50ZXIgb2YgdGhlIGNhbnZhcy4gTGF0ZXIgcGhhc2VzIHdpbGwgbW9kdWxhdGUgdGhlXG4gKiBjb2xvciArIGludGVuc2l0eSBiYXNlZCBvbiBUT00gc3RhdGUgKGF2YWlsYWJsZSAvIGludGVycnVwdGlibGUgL1xuICogZm9jdXNlZCAvIHVuYXZhaWxhYmxlIC8gcXVpZXQgaG91cnMpIGFuZCBhZGQgdGhlIEdyZWctYmVsaWVmIGF1cmEuXG4gKi9cblxuaW1wb3J0IHsgQ09MT1IgfSBmcm9tICcuLi8uLi9kZXNpZ24vdG9rZW5zJztcbmltcG9ydCB7IG9rbGNoVG9SZ2IgfSBmcm9tICcuLi9jb2xvcic7XG5pbXBvcnQgeyBhdWRpZW5jZUZvY3VzLCB0eXBlIENhbnZhc1NpemUgfSBmcm9tICcuLi9nZW9tZXRyeSc7XG5cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJBdWRpZW5jZURpcmVjdGlvbihcbiAgY3R4OiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQsXG4gIHNpemU6IENhbnZhc1NpemUsXG4pOiB2b2lkIHtcbiAgY29uc3QgeyBjZW50ZXIsIHJhZGl1c1gsIHJhZGl1c1kgfSA9IGF1ZGllbmNlRm9jdXMoc2l6ZSk7XG4gIGNvbnN0IHRvbmUgPSBDT0xPUi5hdWRpZW5jZS5hdmFpbGFibGU7XG5cbiAgY3R4LnNhdmUoKTtcblxuICAvLyBVc2UgdGhlIGNhbnZhcyB0cmFuc2Zvcm0gdG8gcmVuZGVyIGFuIGVsbGlwdGljYWwgYmxvb20gKENhbnZhcyAyRFxuICAvLyBkb2Vzbid0IGhhdmUgbmF0aXZlIGVsbGlwdGljYWwgcmFkaWFsIGdyYWRpZW50cykuIFNjYWxlIHRvIHJ5L3J4XG4gIC8vIGFyb3VuZCB0aGUgY2VudGVyLCBkcmF3IGEgY2lyY3VsYXIgZ3JhZGllbnQgYXQgcmFkaXVzIHJ4LCByZXN0b3JlLlxuICBjdHgudHJhbnNsYXRlKGNlbnRlci54LCBjZW50ZXIueSk7XG4gIGN0eC5zY2FsZSgxLCByYWRpdXNZIC8gcmFkaXVzWCk7XG5cbiAgY29uc3QgZyA9IGN0eC5jcmVhdGVSYWRpYWxHcmFkaWVudCgwLCAwLCAwLCAwLCAwLCByYWRpdXNYKTtcbiAgZy5hZGRDb2xvclN0b3AoMC4wLCBva2xjaFRvUmdiKHRvbmUsIDAuNDUpKTtcbiAgZy5hZGRDb2xvclN0b3AoMC41NSwgb2tsY2hUb1JnYih0b25lLCAwLjEwKSk7XG4gIGcuYWRkQ29sb3JTdG9wKDEuMCwgb2tsY2hUb1JnYih0b25lLCAwKSk7XG4gIGN0eC5maWxsU3R5bGUgPSBnO1xuICBjdHguYmVnaW5QYXRoKCk7XG4gIGN0eC5hcmMoMCwgMCwgcmFkaXVzWCwgMCwgTWF0aC5QSSAqIDIpO1xuICBjdHguZmlsbCgpO1xuXG4gIGN0eC5yZXN0b3JlKCk7XG59XG4iLCAiLyoqXG4gKiBQYW50aGVvbiBcdTIwMTQgdGhlIGZvdXIgZHJpdmUgZ2x5cGhzIGF0IGNhcmRpbmFsIHBvc2l0aW9ucy5cbiAqXG4gKiBQaGFzZSAyOiBlYWNoIGRyaXZlIHJlbmRlcnMgYXMgYSBzb2Z0IGdsb3dpbmcgb3JiIGluIGl0cyBPS0xDSFxuICogY29sb3IsIHBvc2l0aW9uZWQgb24gdGhlIGZvcmVzaG9ydGVuZWQgcmluZyBhcm91bmQgdGhlIHN0YWdlLiBBbGxcbiAqIGZvdXIgZ2xvdyBhdCBlcXVhbCBtb2RlcmF0ZSBicmlnaHRuZXNzIChubyBsaXZlIGRyaXZlLXdlaWdodFxuICogZW5jb2RpbmcgeWV0KS5cbiAqXG4gKiBQaGFzZSAzIHdpbGwgY291cGxlIGJyaWdodG5lc3MgdG8gZHJpdmVfc3RhdGVzLm5lZWQuIFBoYXNlIDUgd2lsbFxuICogc3dhcCBvcmJzIGZvciBoYW5kLWF1dGhvcmVkIGJpb21vcnBoaWMgU1ZHIHBhdGhzLlxuICovXG5cbmltcG9ydCB7IENPTE9SLCBEUklWRV9JRFMsIHR5cGUgRHJpdmVJZCB9IGZyb20gJy4uLy4uL2Rlc2lnbi90b2tlbnMnO1xuaW1wb3J0IHsgY3JlYXRlU29mdEJsb29tR3JhZGllbnQgfSBmcm9tICcuLi9jb2xvcic7XG5pbXBvcnQge1xuICBwYW50aGVvbkdseXBoUmFkaXVzLFxuICBwYW50aGVvblBvc2l0aW9ucyxcbiAgdHlwZSBDYW52YXNTaXplLFxufSBmcm9tICcuLi9nZW9tZXRyeSc7XG5cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJQYW50aGVvbihcbiAgY3R4OiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQsXG4gIHNpemU6IENhbnZhc1NpemUsXG4pOiB2b2lkIHtcbiAgY29uc3QgcG9zaXRpb25zID0gcGFudGhlb25Qb3NpdGlvbnMoc2l6ZSk7XG4gIGNvbnN0IGdseXBoUmFkaXVzID0gcGFudGhlb25HbHlwaFJhZGl1cyhzaXplKTtcbiAgLy8gQmxvb20gZXh0ZW5kcyB+M1x1MDBENyB0aGUgbm9taW5hbCBnbHlwaCByYWRpdXMgZm9yIHRoZSBzb2Z0IGhhbG8uXG4gIGNvbnN0IGJsb29tUmFkaXVzID0gZ2x5cGhSYWRpdXMgKiAzLjA7XG5cbiAgZm9yIChjb25zdCBkcml2ZUlkIG9mIERSSVZFX0lEUykge1xuICAgIGNvbnN0IHBvcyA9IHBvc2l0aW9uc1tkcml2ZUlkXTtcbiAgICBjb25zdCBkcml2ZUNvbG9yID0gQ09MT1IuZHJpdmVbZHJpdmVJZF07XG5cbiAgICBjdHguc2F2ZSgpO1xuICAgIGN0eC5maWxsU3R5bGUgPSBjcmVhdGVTb2Z0Qmxvb21HcmFkaWVudChcbiAgICAgIGN0eCxcbiAgICAgIHBvcy54LFxuICAgICAgcG9zLnksXG4gICAgICBibG9vbVJhZGl1cyxcbiAgICAgIGRyaXZlQ29sb3IsXG4gICAgICAwLjY1LCAvLyBwZWFrIGFscGhhIFx1MjAxNCBtb2RlcmF0ZSwgZXF1YWwgYWNyb3NzIGFsbCBmb3VyIGRyaXZlcyBpbiBQaGFzZSAyXG4gICAgKTtcbiAgICBjdHguYmVnaW5QYXRoKCk7XG4gICAgY3R4LmFyYyhwb3MueCwgcG9zLnksIGJsb29tUmFkaXVzLCAwLCBNYXRoLlBJICogMik7XG4gICAgY3R4LmZpbGwoKTtcbiAgICBjdHgucmVzdG9yZSgpO1xuICB9XG5cbiAgdm9pZCBnbHlwaFJhZGl1czsgLy8gZ2x5cGggU1ZHIHBhdGhzIHdpbGwgdXNlIHRoaXMgaW4gUGhhc2UgNVxufVxuXG5leHBvcnQgdHlwZSB7IERyaXZlSWQgfTtcbiIsICIvKipcbiAqIFN0YWdlIFx1MjAxNCB0aGUgY2VudHJhbCB3b3Jrc3BhY2Ugd2hlcmUgdGhlIHNwb3RsaXQgZ29hbCBzaXRzLlxuICpcbiAqIFBoYXNlIDI6IHJlbmRlcnMgdGhlIHN0YWdlIGFzIGFuIGVsbGlwdGljYWwgcGxhdGZvcm0gKGZvcmVzaG9ydGVuZWRcbiAqIGJ5IHRoZSB0aHJlZS1xdWFydGVyIHBlcnNwZWN0aXZlKSB3aXRoIGEgc29mdCBzcG90bGlnaHQgYXQgaXRzXG4gKiBjZW50ZXIgdGludGVkIGJ5IHRoZSBkb21pbmFudCBkcml2ZSBjb2xvci4gTm8gYWN0b3Igb3IgY2hvcnVzIHlldCBcdTIwMTRcbiAqIHRob3NlIGNvbWUgaW4gUGhhc2UgMyB3aGVuIHdlIHN0YXJ0IGVuY29kaW5nIGxpdmUgc3RhdGUuXG4gKi9cblxuaW1wb3J0IHsgQ09MT1IgfSBmcm9tICcuLi8uLi9kZXNpZ24vdG9rZW5zJztcbmltcG9ydCB7IGNyZWF0ZVNwb3RsaWdodEdyYWRpZW50IH0gZnJvbSAnLi4vY29sb3InO1xuaW1wb3J0IHsgc3RhZ2VFbGxpcHNlLCB0eXBlIENhbnZhc1NpemUgfSBmcm9tICcuLi9nZW9tZXRyeSc7XG5cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJTdGFnZShcbiAgY3R4OiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQsXG4gIHNpemU6IENhbnZhc1NpemUsXG4pOiB2b2lkIHtcbiAgY29uc3Qgc3RhZ2UgPSBzdGFnZUVsbGlwc2Uoc2l6ZSk7XG5cbiAgLy8gUGhhc2UgMjogc3BvdGxpZ2h0IHVzZXMgYSBuZXV0cmFsIHBhbGUgbHVtaW5vdXMgY29sb3Igc28gaXQgZG9lc24ndFxuICAvLyB2aXN1YWxseSBtZXJnZSB3aXRoIHdoaWNoZXZlciBwYW50aGVvbiBnbHlwaCBoYXBwZW5zIHRvIHNoYXJlIGl0c1xuICAvLyBodWUuIFBoYXNlIDMgc3dhcHMgaW4gdGhlIGRvbWluYW50IGRyaXZlJ3MgdGludCwgYXQgd2hpY2ggcG9pbnQgdGhlXG4gIC8vIHZpc3VhbCBcIm1lcmdpbmdcIiB3aXRoIHRoYXQgZHJpdmUncyBnbHlwaCBiZWNvbWVzIG1lYW5pbmdmdWwgKGl0XG4gIC8vIHNob3dzIHRoZSBkcml2ZSdzIGluZmx1ZW5jZSBmbG93aW5nIGludG8gdGhlIHdvcmtzcGFjZSkuXG4gIGNvbnN0IHNwb3RsaWdodENvbG9yID0gQ09MT1IuZm9ybUJhc2U7XG5cbiAgLy8gU3BvdGxpZ2h0IHJhZGl1cyBleHRlbmRzIDYwJSBiZXlvbmQgdGhlIHN0YWdlJ3MgWCByYWRpdXMgc28gdGhlXG4gIC8vIGdsb3cgYmxlbmRzIGdlbmVyb3VzbHkgd2l0aCB0aGUgc3Vycm91bmRpbmcgaW5kaWdvLlxuICBjb25zdCBzcG90bGlnaHRSYWRpdXMgPSBzdGFnZS5yeCAqIDEuNjtcblxuICAvLyBTYXZlIGNvbnRleHQgc3RhdGUgc28gdGhlIHJhZGlhbCBncmFkaWVudCBkcmF3IGRvZXNuJ3QgbGVhay5cbiAgY3R4LnNhdmUoKTtcblxuICAvLyBCdWlsZCBhbmQgZHJhdyB0aGUgcmFkaWFsIGdyYWRpZW50IGFzIGEgc29mdCBjaXJjdWxhciBibG9vbS5cbiAgLy8gKFdlIGRvbid0IGNsaXAgdG8gdGhlIGVsbGlwdGljYWwgc3RhZ2Ugc2hhcGUgaW4gUGhhc2UgMiBcdTIwMTQgdGhlXG4gIC8vIHNwb3RsaWdodCBleHRlbmRzIG5hdHVyYWxseSBiZXlvbmQgdGhlIHN0YWdlJ3MgZm9vdHByaW50LilcbiAgY3R4LmZpbGxTdHlsZSA9IGNyZWF0ZVNwb3RsaWdodEdyYWRpZW50KFxuICAgIGN0eCxcbiAgICBzdGFnZS54LFxuICAgIHN0YWdlLnksXG4gICAgc3BvdGxpZ2h0UmFkaXVzLFxuICAgIHNwb3RsaWdodENvbG9yLFxuICApO1xuICBjdHguYmVnaW5QYXRoKCk7XG4gIGN0eC5hcmMoc3RhZ2UueCwgc3RhZ2UueSwgc3BvdGxpZ2h0UmFkaXVzLCAwLCBNYXRoLlBJICogMik7XG4gIGN0eC5maWxsKCk7XG5cbiAgLy8gU3VidGxlIHN0YWdlIFwicGxhdGZvcm1cIiByaW5nIFx1MjAxNCBhIHRoaW4gZWxsaXB0aWNhbCBvdXRsaW5lIGF0IHRoZVxuICAvLyBzdGFnZSdzIG5vbWluYWwgcmFkaXVzLCB2ZXJ5IGZhaW50LCBzbyB0aGUgc3BhdGlhbCBhbmNob3IgaXNcbiAgLy8gcGVyY2VwdGlibGUgd2l0aG91dCBiZWNvbWluZyBhIGhhcmQgZWRnZS5cbiAgY3R4LnN0cm9rZVN0eWxlID0gYHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wNilgO1xuICBjdHgubGluZVdpZHRoID0gMTtcbiAgY3R4LmJlZ2luUGF0aCgpO1xuICBjdHguZWxsaXBzZShzdGFnZS54LCBzdGFnZS55LCBzdGFnZS5yeCwgc3RhZ2UucnksIDAsIDAsIE1hdGguUEkgKiAyKTtcbiAgY3R4LnN0cm9rZSgpO1xuXG4gIGN0eC5yZXN0b3JlKCk7XG4gIHZvaWQgQ09MT1IuZm9ybUJhc2U7IC8vIHJlc2VydmVkIGZvciBhY3RvciByZW5kZXJpbmcgaW4gUGhhc2UgM1xufVxuIiwgIi8qKlxuICogU3Vic3RyYXRlIFx1MjAxNCB0aGUgbWVtb3J5IGZsb29yLlxuICpcbiAqIFBoYXNlIDI6IHJlbmRlcnMgdGhlIHN1YnN0cmF0ZSBhcyBhIG5lYXItdW5pZm9ybSBkYXJrIGluZGlnbyBiYW5kXG4gKiB3aXRoIGEgdmVyeSBzdWJ0bGUgdmVydGljYWwgZ3JhZGllbnQgZnJvbSBiYWNrZ3JvdW5kLWNvbG9yIGF0IHRvcCB0b1xuICogc2xpZ2h0bHktd2FybWVyIGluZGlnbyBhdCB0aGUgYm90dG9tIChzdWdnZXN0aW5nIHRoZSBmbG9vciBjYXRjaGVzXG4gKiBmYWludCBsaWdodCBmcm9tIHRoZSBhdWRpZW5jZSBkaXJlY3Rpb24gYmVsb3cpLlxuICpcbiAqIFBoYXNlIDUgd2lsbCBhZGQgdGhlIGNvbnRpbnVvdXMgc2hpbW1lciAoVm9yb25vaS1saWtlIGx1bWluYW5jZVxuICogbW90dGxpbmcpLCBkaXNjcmV0ZSB3YXJtIGVwaXNvZGUtcHVsc2UgYmxvb21zLCBhbmQgdGhlIHByb2NlZHVyYWxcbiAqIGdyYWluIHRleHR1cmUgdGhhdCBhY2N1bXVsYXRlcyBvdmVyIHRpbWUuXG4gKi9cblxuaW1wb3J0IHsgQ09MT1IgfSBmcm9tICcuLi8uLi9kZXNpZ24vdG9rZW5zJztcbmltcG9ydCB7IG9rbGNoVG9SZ2IsIHNoaWZ0TGlnaHRuZXNzIH0gZnJvbSAnLi4vY29sb3InO1xuaW1wb3J0IHsgc3Vic3RyYXRlQmFuZCwgdHlwZSBDYW52YXNTaXplIH0gZnJvbSAnLi4vZ2VvbWV0cnknO1xuXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyU3Vic3RyYXRlKFxuICBjdHg6IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRCxcbiAgc2l6ZTogQ2FudmFzU2l6ZSxcbik6IHZvaWQge1xuICBjb25zdCBiYW5kID0gc3Vic3RyYXRlQmFuZChzaXplKTtcblxuICAvLyBUd28tc3RvcCB2ZXJ0aWNhbCBncmFkaWVudDogcHVyZSBiYWNrZ3JvdW5kIGF0IHRvcCBvZiBiYW5kLCB2ZXJ5XG4gIC8vIHNsaWdodGx5IGxpZ2h0ZXIgYXQgdGhlIGJvdHRvbS4gVGhlIHJlc3VsdCBpcyBhIHN1YnRsZSBoaW50IG9mXG4gIC8vIGRlcHRoIHdpdGhvdXQgYW55IHZpc2libGUgZmVhdHVyZXMuXG4gIGNvbnN0IGJhc2VUb3AgPSBDT0xPUi5iYWNrZ3JvdW5kO1xuICBjb25zdCBiYXNlQm90dG9tID0gc2hpZnRMaWdodG5lc3MoQ09MT1IuYmFja2dyb3VuZCwgKzAuMDI1KTtcblxuICBjb25zdCBnID0gY3R4LmNyZWF0ZUxpbmVhckdyYWRpZW50KDAsIGJhbmQueSwgMCwgYmFuZC55ICsgYmFuZC5oKTtcbiAgZy5hZGRDb2xvclN0b3AoMCwgb2tsY2hUb1JnYihiYXNlVG9wLCAxKSk7XG4gIGcuYWRkQ29sb3JTdG9wKDEsIG9rbGNoVG9SZ2IoYmFzZUJvdHRvbSwgMSkpO1xuICBjdHguZmlsbFN0eWxlID0gZztcbiAgY3R4LmZpbGxSZWN0KGJhbmQueCwgYmFuZC55LCBiYW5kLncsIGJhbmQuaCk7XG59XG4iLCAiLyoqXG4gKiBSZW5kZXJlciBcdTIwMTQgb3JjaGVzdHJhdGVzIHRoZSBmaXZlIGVsZW1lbnQgZHJhd3MgaW4gY29ycmVjdCB6LW9yZGVyLlxuICpcbiAqIENvbXBvc2l0aW9uIG9yZGVyIChiYWNrIHRvIGZyb250KTpcbiAqICAgMS4gQ2xlYXIgd2l0aCBiYWNrZ3JvdW5kIGluZGlnb1xuICogICAyLiBBdG1vc3BoZXJlICh0b3AgZmFkZSlcbiAqICAgMy4gU3Vic3RyYXRlIChib3R0b20gZmFkZSlcbiAqICAgNC4gQXVkaWVuY2Ugd2FybXRoIChib3R0b20gYmxvb20sIGJlaGluZCBzdGFnZSlcbiAqICAgNS4gUGFudGhlb24gKGNhcmRpbmFsIGdseXBocyBhcm91bmQgdGhlIHN0YWdlKVxuICogICA2LiBTdGFnZSAoc3BvdGxpdCBjZW50ZXIpXG4gKlxuICogUGhhc2UgMiBpcyBhIHNpbmdsZSBzdGF0aWMgZHJhdyBcdTIwMTQgbm8gYW5pbWF0aW9uIGxvb3AuIFBoYXNlIDQgd2lsbFxuICogd3JhcCB0aGlzIGluIGEgcmVxdWVzdEFuaW1hdGlvbkZyYW1lIGxvb3Agd2l0aCBicmVhdGgvcHVsc2UgdGltaW5nLlxuICovXG5cbmltcG9ydCB7IENPTE9SIH0gZnJvbSAnLi4vZGVzaWduL3Rva2Vucyc7XG5pbXBvcnQgeyBva2xjaFRvUmdiIH0gZnJvbSAnLi9jb2xvcic7XG5pbXBvcnQgeyByZW5kZXJBdG1vc3BoZXJlIH0gZnJvbSAnLi9lbGVtZW50cy9BdG1vc3BoZXJlJztcbmltcG9ydCB7IHJlbmRlckF1ZGllbmNlRGlyZWN0aW9uIH0gZnJvbSAnLi9lbGVtZW50cy9BdWRpZW5jZURpcmVjdGlvbic7XG5pbXBvcnQgeyByZW5kZXJQYW50aGVvbiB9IGZyb20gJy4vZWxlbWVudHMvUGFudGhlb24nO1xuaW1wb3J0IHsgcmVuZGVyU3RhZ2UgfSBmcm9tICcuL2VsZW1lbnRzL1N0YWdlJztcbmltcG9ydCB7IHJlbmRlclN1YnN0cmF0ZSB9IGZyb20gJy4vZWxlbWVudHMvU3Vic3RyYXRlJztcbmltcG9ydCB0eXBlIHsgQ2FudmFzU2l6ZSB9IGZyb20gJy4vZ2VvbWV0cnknO1xuXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyRm9ydW0oXG4gIGN0eDogQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJELFxuICBzaXplOiBDYW52YXNTaXplLFxuKTogdm9pZCB7XG4gIC8vIDEuIENsZWFyIHdpdGggZGVlcCBpbmRpZ28gYmFja2dyb3VuZFxuICBjdHguZmlsbFN0eWxlID0gb2tsY2hUb1JnYihDT0xPUi5iYWNrZ3JvdW5kLCAxKTtcbiAgY3R4LmZpbGxSZWN0KDAsIDAsIHNpemUud2lkdGgsIHNpemUuaGVpZ2h0KTtcblxuICAvLyAyLiBBdG1vc3BoZXJlIFx1MjAxNCB0b3AgdmVydGljYWwgZ3JhZGllbnRcbiAgcmVuZGVyQXRtb3NwaGVyZShjdHgsIHNpemUpO1xuXG4gIC8vIDMuIFN1YnN0cmF0ZSBcdTIwMTQgYm90dG9tIHZlcnRpY2FsIGdyYWRpZW50IChtZW1vcnkgZmxvb3IpXG4gIHJlbmRlclN1YnN0cmF0ZShjdHgsIHNpemUpO1xuXG4gIC8vIDQuIEF1ZGllbmNlIHdhcm10aCBcdTIwMTQgZnJvbnQtZWRnZSBibG9vbSAoVE9NIHByZXNlbmNlKVxuICByZW5kZXJBdWRpZW5jZURpcmVjdGlvbihjdHgsIHNpemUpO1xuXG4gIC8vIDUuIFBhbnRoZW9uIGdseXBocyBcdTIwMTQgYXJvdW5kIHRoZSBzdGFnZVxuICByZW5kZXJQYW50aGVvbihjdHgsIHNpemUpO1xuXG4gIC8vIDYuIFN0YWdlIHNwb3RsaWdodCBcdTIwMTQgY2VudHJhbCBmb2N1c1xuICByZW5kZXJTdGFnZShjdHgsIHNpemUpO1xufVxuIiwgIi8qKlxuICogRm9ydW1DYW52YXMgXHUyMDE0IFJlYWN0IHdyYXBwZXIgYXJvdW5kIHRoZSBDYW52YXMgMkQgcmVuZGVyZXIuXG4gKlxuICogT3ducyB0aGUgY2FudmFzIERPTSBub2RlICsgYSBSZXNpemVPYnNlcnZlci4gT24gYW55IHNpemUgY2hhbmdlLFxuICogcmUtY29uZmlndXJlcyB0aGUgYmFja2luZyBzdG9yZSBmb3IgdGhlIGN1cnJlbnQgZGV2aWNlUGl4ZWxSYXRpb1xuICogYW5kIHJlLXJlbmRlcnMuIFBoYXNlIDIgcmVuZGVycyBPTkNFIHBlciBzaXplIGNoYW5nZSAoc3RhdGljKS4gUGhhc2VcbiAqIDQgd2lsbCBpbnRyb2R1Y2UgdGhlIFJBRiBsb29wIGRyaXZlbiBieSBtb3Rpb24gdG9rZW5zLlxuICovXG5cbmltcG9ydCB7IFJlYWN0LCB1c2VFZmZlY3QsIHVzZVJlZiB9IGZyb20gJy4uL3Nkayc7XG5pbXBvcnQgeyBjb25maWd1cmVDYW52YXNGb3JEcHIsIHR5cGUgQ2FudmFzU2l6ZSB9IGZyb20gJy4vZ2VvbWV0cnknO1xuaW1wb3J0IHsgcmVuZGVyRm9ydW0gfSBmcm9tICcuL3JlbmRlcmVyJztcblxuZXhwb3J0IHR5cGUgRm9ydW1DYW52YXNQcm9wcyA9IHtcbiAgY2xhc3NOYW1lPzogc3RyaW5nO1xufTtcblxuZXhwb3J0IGZ1bmN0aW9uIEZvcnVtQ2FudmFzKHsgY2xhc3NOYW1lIH06IEZvcnVtQ2FudmFzUHJvcHMpIHtcbiAgY29uc3QgY2FudmFzUmVmID0gdXNlUmVmPEhUTUxDYW52YXNFbGVtZW50IHwgbnVsbD4obnVsbCk7XG4gIGNvbnN0IHdyYXBwZXJSZWYgPSB1c2VSZWY8SFRNTERpdkVsZW1lbnQgfCBudWxsPihudWxsKTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGNvbnN0IGNhbnZhcyA9IGNhbnZhc1JlZi5jdXJyZW50O1xuICAgIGNvbnN0IHdyYXBwZXIgPSB3cmFwcGVyUmVmLmN1cnJlbnQ7XG4gICAgaWYgKCFjYW52YXMgfHwgIXdyYXBwZXIpIHJldHVybjtcblxuICAgIGNvbnN0IGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgIGlmICghY3R4KSB7XG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuICAgICAgY29uc29sZS5lcnJvcignZm9ydW06IDJEIGNvbnRleHQgdW5hdmFpbGFibGUnKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkcmF3KCkge1xuICAgICAgaWYgKCFjYW52YXMgfHwgIWN0eCB8fCAhd3JhcHBlcikgcmV0dXJuO1xuICAgICAgY29uc3QgcmVjdCA9IHdyYXBwZXIuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICBjb25zdCBzaXplOiBDYW52YXNTaXplID0ge1xuICAgICAgICB3aWR0aDogTWF0aC5tYXgoMSwgcmVjdC53aWR0aCksXG4gICAgICAgIGhlaWdodDogTWF0aC5tYXgoMSwgcmVjdC5oZWlnaHQpLFxuICAgICAgICBkcHI6IHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvIHx8IDEsXG4gICAgICB9O1xuICAgICAgY29uZmlndXJlQ2FudmFzRm9yRHByKGNhbnZhcywgY3R4LCBzaXplKTtcbiAgICAgIHJlbmRlckZvcnVtKGN0eCwgc2l6ZSk7XG4gICAgfVxuXG4gICAgLy8gSW5pdGlhbCBkcmF3XG4gICAgZHJhdygpO1xuXG4gICAgLy8gUmVkcmF3IG9uIGNvbnRhaW5lciByZXNpemVcbiAgICBjb25zdCBybyA9IG5ldyBSZXNpemVPYnNlcnZlcigoKSA9PiBkcmF3KCkpO1xuICAgIHJvLm9ic2VydmUod3JhcHBlcik7XG5cbiAgICAvLyBSZWRyYXcgb24gZGV2aWNlUGl4ZWxSYXRpbyBjaGFuZ2UgKG1vbml0b3Igc3dhcCwgem9vbSlcbiAgICBjb25zdCBkcHJNcSA9IHdpbmRvdy5tYXRjaE1lZGlhKFxuICAgICAgYChyZXNvbHV0aW9uOiAke3dpbmRvdy5kZXZpY2VQaXhlbFJhdGlvfWRwcHgpYCxcbiAgICApO1xuICAgIGNvbnN0IG9uRHByQ2hhbmdlID0gKCkgPT4gZHJhdygpO1xuICAgIGRwck1xLmFkZEV2ZW50TGlzdGVuZXI/LignY2hhbmdlJywgb25EcHJDaGFuZ2UpO1xuXG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIHJvLmRpc2Nvbm5lY3QoKTtcbiAgICAgIGRwck1xLnJlbW92ZUV2ZW50TGlzdGVuZXI/LignY2hhbmdlJywgb25EcHJDaGFuZ2UpO1xuICAgIH07XG4gIH0sIFtdKTtcblxuICByZXR1cm4gKFxuICAgIDxkaXZcbiAgICAgIHJlZj17d3JhcHBlclJlZn1cbiAgICAgIGNsYXNzTmFtZT17Y2xhc3NOYW1lfVxuICAgICAgc3R5bGU9e3sgcG9zaXRpb246ICdyZWxhdGl2ZScsIHdpZHRoOiAnMTAwJScsIGhlaWdodDogJzEwMCUnIH19XG4gICAgPlxuICAgICAgPGNhbnZhc1xuICAgICAgICByZWY9e2NhbnZhc1JlZn1cbiAgICAgICAgc3R5bGU9e3sgZGlzcGxheTogJ2Jsb2NrJywgd2lkdGg6ICcxMDAlJywgaGVpZ2h0OiAnMTAwJScgfX1cbiAgICAgIC8+XG4gICAgPC9kaXY+XG4gICk7XG59XG5cbnZvaWQgUmVhY3Q7IC8vIGVuc3VyZSBKU1ggcnVudGltZSBpcyByZWFjaGFibGVcbiIsICIvKipcbiAqIEZvcnVtIFx1MjAxNCByb290IGNvbXBvbmVudCBmb3IgdGhlIGRhc2hib2FyZCB0YWIuXG4gKlxuICogUGhhc2UgMiAoc3RhdGljIGNvbXBvc2l0aW9uKTogcmVuZGVycyB0aGUgQ2FudmFzIDJEIHNjZW5lIHdpdGggYWxsXG4gKiBmaXZlIGVsZW1lbnRzIHZpc2libGUgYXMgc3RhdGljIHBsYWNlaG9sZGVycy4gVGhlIFBoYXNlIDEgZGlhZ25vc3RpY1xuICogY2FyZHMgKGNvbm5lY3Rpb24gc3RhdHVzLCByYXcgc3RhdGUpIGFyZSBrZXB0IGJlbG93IHRoZSBjYW52YXMgYXMgYVxuICogY29sbGFwc2VkIGRldGFpbHMgYmxvY2sgc28gdGhlIGNvbnRlbXBsYXRpdmUgY29tcG9zaXRpb24gaXMgdGhlXG4gKiBwcmltYXJ5IGV4cGVyaWVuY2UuXG4gKlxuICogUGhhc2VzIDMrIGFkZCBsaXZlIGRhdGEgZW5jb2RpbmcsIG1vdGlvbiwgaW50ZXJhY3Rpb25zLCBhbmQgZGVwdGguXG4gKi9cblxuaW1wb3J0IHtcbiAgUmVhY3QsXG4gIHVzZUVmZmVjdCxcbiAgdXNlU3RhdGUsXG4gIENhcmQsXG4gIENhcmRIZWFkZXIsXG4gIENhcmRUaXRsZSxcbiAgQ2FyZENvbnRlbnQsXG4gIEJhZGdlLFxuICBmZXRjaEpTT04sXG59IGZyb20gJy4vc2RrJztcbmltcG9ydCB7IHVzZUZvcnVtU3RhdGUgfSBmcm9tICcuL2RhdGEvdXNlRm9ydW1TdGF0ZSc7XG5pbXBvcnQgeyBGb3J1bUNhbnZhcyB9IGZyb20gJy4vY2FudmFzL0ZvcnVtQ2FudmFzJztcblxuZnVuY3Rpb24gU3RhdHVzQmFkZ2UoeyBzdGF0dXMgfTogeyBzdGF0dXM6IHN0cmluZyB9KSB7XG4gIGNvbnN0IHZhcmlhbnQ6IHN0cmluZyA9XG4gICAgc3RhdHVzID09PSAnb3BlbicgPyAnZGVmYXVsdCcgOlxuICAgIHN0YXR1cyA9PT0gJ2Nvbm5lY3RpbmcnID8gJ3NlY29uZGFyeScgOlxuICAgIHN0YXR1cyA9PT0gJ2Vycm9yJyA/ICdkZXN0cnVjdGl2ZScgOlxuICAgICdvdXRsaW5lJztcbiAgcmV0dXJuIDxCYWRnZSB2YXJpYW50PXt2YXJpYW50fT57c3RhdHVzfTwvQmFkZ2U+O1xufVxuXG5mdW5jdGlvbiBmb3JtYXRBZ2UodHM6IG51bWJlciB8IG51bGwpOiBzdHJpbmcge1xuICBpZiAodHMgPT09IG51bGwpIHJldHVybiAnXHUyMDE0JztcbiAgY29uc3QgYWdlU2VjID0gTWF0aC5mbG9vcigoRGF0ZS5ub3coKSAtIHRzKSAvIDEwMDApO1xuICBpZiAoYWdlU2VjIDwgNjApIHJldHVybiBgJHthZ2VTZWN9cyBhZ29gO1xuICBpZiAoYWdlU2VjIDwgMzYwMCkgcmV0dXJuIGAke01hdGguZmxvb3IoYWdlU2VjIC8gNjApfW0gYWdvYDtcbiAgcmV0dXJuIGAke01hdGguZmxvb3IoYWdlU2VjIC8gMzYwMCl9aCBhZ29gO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gRm9ydW0oKSB7XG4gIGNvbnN0IHsgc3RhdGUsIHN0YXR1cywgbGFzdFVwZGF0ZUF0IH0gPSB1c2VGb3J1bVN0YXRlKCk7XG4gIGNvbnN0IFtwbHVnaW5IZWFsdGgsIHNldFBsdWdpbkhlYWx0aF0gPSB1c2VTdGF0ZTx1bmtub3duPihudWxsKTtcbiAgY29uc3QgWywgc2V0VGlja10gPSB1c2VTdGF0ZSgwKTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGNvbnN0IGkgPSB3aW5kb3cuc2V0SW50ZXJ2YWwoKCkgPT4gc2V0VGljaygobjogbnVtYmVyKSA9PiBuICsgMSksIDEwMDApO1xuICAgIHJldHVybiAoKSA9PiBjbGVhckludGVydmFsKGkpO1xuICB9LCBbXSk7XG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBmZXRjaEpTT04oJy9hcGkvcGx1Z2lucy9mb3J1bS9oZWFsdGgnKVxuICAgICAgLnRoZW4oKGQ6IHVua25vd24pID0+IHNldFBsdWdpbkhlYWx0aChkKSlcbiAgICAgIC5jYXRjaCgoKSA9PiBzZXRQbHVnaW5IZWFsdGgoeyBlcnJvcjogJ3BsdWdpbiBiYWNrZW5kIHVucmVhY2hhYmxlJyB9KSk7XG4gIH0sIFtdKTtcblxuICByZXR1cm4gKFxuICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBmbGV4LWNvbCBnYXAtNCBoLWZ1bGxcIj5cbiAgICAgIHsvKlxuICAgICAgICBUaGUgY29udGVtcGxhdGl2ZSBjYW52YXMgdGFrZXMgdGhlIGJ1bGsgb2YgdGhlIHBhZ2UuIE1pbi1oZWlnaHRcbiAgICAgICAgZW5zdXJlcyBpdCdzIHN1YnN0YW50aWFsIGV2ZW4gb24gc2hvcnQgdmlld3BvcnRzOyBhc3BlY3QgcmF0aW9cbiAgICAgICAgZ2l2ZXMgaXQgYSBob3Jpem9udGFsIGNvbXBvc2l0aW9uICgzOjEgaXMgd2lkZXIgdGhhbiB0aGUgbGl2ZVxuICAgICAgICBGb3J1bSB3aWxsIGJlIGluIGZ1bGxzY3JlZW4sIGJ1dCB3b3JrcyBmb3IgYW4gZW1iZWRkZWQgdGFiKS5cbiAgICAgICovfVxuICAgICAgPGRpdlxuICAgICAgICBzdHlsZT17e1xuICAgICAgICAgIHdpZHRoOiAnMTAwJScsXG4gICAgICAgICAgYXNwZWN0UmF0aW86ICcxNiAvIDknLFxuICAgICAgICAgIG1pbkhlaWdodDogJzQ4MHB4JyxcbiAgICAgICAgICBtYXhIZWlnaHQ6ICc3NXZoJyxcbiAgICAgICAgICBib3JkZXJSYWRpdXM6ICc4cHgnLFxuICAgICAgICAgIG92ZXJmbG93OiAnaGlkZGVuJyxcbiAgICAgICAgICBiYWNrZ3JvdW5kOiAnIzBhMGUxYycsXG4gICAgICAgIH19XG4gICAgICA+XG4gICAgICAgIDxGb3J1bUNhbnZhcyAvPlxuICAgICAgPC9kaXY+XG5cbiAgICAgIHsvKiBEaWFnbm9zdGljIHN0cmlwIFx1MjAxNCBzbWFsbCwgYmVsb3cgdGhlIGNhbnZhcyAqL31cbiAgICAgIDxDYXJkPlxuICAgICAgICA8Q2FyZEhlYWRlcj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlblwiPlxuICAgICAgICAgICAgPENhcmRUaXRsZSBjbGFzc05hbWU9XCJ0ZXh0LXNtXCI+RGlhZ25vc3RpYyBcdTIwMTQgUGhhc2UgMiAoc3RhdGljIGNvbXBvc2l0aW9uKTwvQ2FyZFRpdGxlPlxuICAgICAgICAgICAgPEJhZGdlIHZhcmlhbnQ9XCJvdXRsaW5lXCI+djAuMi4wPC9CYWRnZT5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9DYXJkSGVhZGVyPlxuICAgICAgICA8Q2FyZENvbnRlbnQgY2xhc3NOYW1lPVwiZmxleCBmbGV4LWNvbCBnYXAtMiB0ZXh0LXhzXCI+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtM1wiPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCI+QXRoZW5hIFdTOjwvc3Bhbj5cbiAgICAgICAgICAgIDxTdGF0dXNCYWRnZSBzdGF0dXM9e3N0YXR1c30gLz5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtbXV0ZWQtZm9yZWdyb3VuZCBtbC0zXCI+bGFzdCB1cGRhdGU6PC9zcGFuPlxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZm9udC1tb25vXCI+e2Zvcm1hdEFnZShsYXN0VXBkYXRlQXQpfTwvc3Bhbj5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtbXV0ZWQtZm9yZWdyb3VuZCBtbC0zXCI+cGx1Z2luIGJhY2tlbmQ6PC9zcGFuPlxuICAgICAgICAgICAgPGNvZGUgY2xhc3NOYW1lPVwiZm9udC1tb25vXCI+XG4gICAgICAgICAgICAgIHtwbHVnaW5IZWFsdGggPT09IG51bGwgPyAnbG9hZGluZ1x1MjAyNicgOiBKU09OLnN0cmluZ2lmeShwbHVnaW5IZWFsdGgpfVxuICAgICAgICAgICAgPC9jb2RlPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIHtzdGF0ZSAhPT0gbnVsbCAmJiAoXG4gICAgICAgICAgICA8ZGV0YWlscyBjbGFzc05hbWU9XCJtdC0xXCI+XG4gICAgICAgICAgICAgIDxzdW1tYXJ5IGNsYXNzTmFtZT1cInRleHQtbXV0ZWQtZm9yZWdyb3VuZCBjdXJzb3ItcG9pbnRlciBob3Zlcjp0ZXh0LWZvcmVncm91bmRcIj5cbiAgICAgICAgICAgICAgICBBdGhlbmEgc3RhdGUgKHtPYmplY3Qua2V5cyhzdGF0ZSkubGVuZ3RofSB0b3AtbGV2ZWwga2V5cywgc3RlcCB7c3RhdGUuc3RlcCA/PyAnXHUyMDE0J30pXG4gICAgICAgICAgICAgIDwvc3VtbWFyeT5cbiAgICAgICAgICAgICAgPHByZSBjbGFzc05hbWU9XCJtdC0yIGZvbnQtbW9ubyBiZy1iYWNrZ3JvdW5kLzQwIHAtMyByb3VuZGVkIGJvcmRlciBib3JkZXItYm9yZGVyIG92ZXJmbG93LXgtYXV0byBtYXgtaC03MlwiPlxuICAgICAgICAgICAgICAgIHtKU09OLnN0cmluZ2lmeShzdGF0ZSwgbnVsbCwgMil9XG4gICAgICAgICAgICAgIDwvcHJlPlxuICAgICAgICAgICAgPC9kZXRhaWxzPlxuICAgICAgICAgICl9XG4gICAgICAgIDwvQ2FyZENvbnRlbnQ+XG4gICAgICA8L0NhcmQ+XG4gICAgPC9kaXY+XG4gICk7XG59XG5cbnZvaWQgUmVhY3Q7XG4iLCAiLyoqXG4gKiBUaGUgRm9ydW0gcGx1Z2luIFx1MjAxNCBlbnRyeSBwb2ludC5cbiAqXG4gKiBCdW5kbGVkIGFzIGFuIElJRkUgYnkgZXNidWlsZC4gQ2FsbHNcbiAqIHdpbmRvdy5fX0hFUk1FU19QTFVHSU5TX18ucmVnaXN0ZXIoXCJmb3J1bVwiLCBGb3J1bSkgc28gSGVybWVzIGNhblxuICogbW91bnQgdGhlIGNvbXBvbmVudCB3aGVuIHRoZSB1c2VyIG5hdmlnYXRlcyB0byAvZm9ydW0uXG4gKlxuICogQWxsIFJlYWN0L2hvb2tzL2NvbXBvbmVudHMgYXJlIGFjY2Vzc2VkIHZpYSB0aGUgc2RrIG1vZHVsZSB3aGljaFxuICogcHVsbHMgdGhlbSBmcm9tIHdpbmRvdy5fX0hFUk1FU19QTFVHSU5fU0RLX18gYXQgc3RhcnR1cC4gVGhlIGJ1bmRsZVxuICogZG9lcyBOT1QgaW1wb3J0IFwicmVhY3RcIiBcdTIwMTQgdGhhdCB3b3VsZCBnZW5lcmF0ZSBhbiBlc2J1aWxkIHJlcXVpcmUoKVxuICogc2hpbSB0aGF0IGZhaWxzIGF0IHJ1bnRpbWUgaW4gYnJvd3Nlci5cbiAqL1xuXG5pbXBvcnQgeyBIRVJNRVNfUExVR0lOUyB9IGZyb20gJy4vc2RrJztcbmltcG9ydCB7IEZvcnVtIH0gZnJvbSAnLi9Gb3J1bSc7XG5cbmlmIChIRVJNRVNfUExVR0lOUyAmJiB0eXBlb2YgSEVSTUVTX1BMVUdJTlMucmVnaXN0ZXIgPT09ICdmdW5jdGlvbicpIHtcbiAgSEVSTUVTX1BMVUdJTlMucmVnaXN0ZXIoJ2ZvcnVtJywgRm9ydW0pO1xufSBlbHNlIHtcbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcbiAgY29uc29sZS5lcnJvcignZm9ydW06IHdpbmRvdy5fX0hFUk1FU19QTFVHSU5TX18ucmVnaXN0ZXIgbm90IGF2YWlsYWJsZScpO1xufVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7O0FBY0EsTUFBTSxNQUFPLE9BQWU7QUFFNUIsTUFBSSxDQUFDLEtBQUs7QUFHUixZQUFRO0FBQUEsTUFDTjtBQUFBLElBRUY7QUFBQSxF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SyxXQUFVLGVBQ2IsaUJBQWlCLE9BQU8sa0JBQWEsS0FBSyxVQUFVLFlBQVksQ0FDbkUsQ0FDRixHQUNDLFVBQVUsUUFDVCxvQ0FBQyxhQUFRLFdBQVUsVUFDakIsb0NBQUMsYUFBUSxXQUFVLGdFQUE2RCxrQkFDL0QsT0FBTyxLQUFLLEtBQUssRUFBRSxRQUFPLDBCQUF1QixNQUFNLFFBQVEsVUFBSSxHQUNwRixHQUNBLG9DQUFDLFNBQUksV0FBVSwrRkFDWixLQUFLLFVBQVUsT0FBTyxNQUFNLENBQUMsQ0FDaEMsQ0FDRixDQUVKLENBQ0YsQ0FDRjtBQUFBLEVBRUo7OztBQ2xHQSxNQUFJLGtCQUFrQixPQUFPLGVBQWUsYUFBYSxZQUFZO0FBQ25FLG1CQUFlLFNBQVMsU0FBUyxLQUFLO0FBQUEsRUFDeEMsT0FBTztBQUVMLFlBQVEsTUFBTSx5REFBeUQ7QUFBQSxFQUN6RTsiLAogICJuYW1lcyI6IFsiZGVmaW5pdGlvbiIsICJrIiwgIm51bSIsICJjIiwgImMiLCAiYTk4IiwgImMiLCAiYWJzIiwgInJnYiIsICJmbiIsICJjIiwgImFicyIsICJkZWZpbml0aW9uIiwgImRlZmluaXRpb25fZGVmYXVsdCIsICJodWUiLCAiaHVlIiwgImZuIiwgInN1bSIsICJ2YWwiLCAiZGVmaW5pdGlvbiIsICJkZWZpbml0aW9uX2RlZmF1bHQiLCAiYyIsICJjIiwgImsiLCAiZSIsICJmbiIsICJsYWIiLCAiZjIiLCAicmdiIiwgImMiLCAiZSIsICJmIiwgImUiLCAiZiIsICJjIiwgImRlZmluaXRpb24iLCAiZGVmaW5pdGlvbl9kZWZhdWx0IiwgImRlZmluaXRpb24iLCAiYyIsICJkZWZpbml0aW9uX2RlZmF1bHQiLCAiZiIsICJNIiwgImRlZmluaXRpb24iLCAiZGVmaW5pdGlvbl9kZWZhdWx0IiwgIk0iLCAiZGVmaW5pdGlvbiIsICJjIiwgImRlZmluaXRpb25fZGVmYXVsdCIsICJmIiwgIk0iLCAiZGVmaW5pdGlvbiIsICJkZWZpbml0aW9uX2RlZmF1bHQiLCAiaHN2IiwgImRlZmluaXRpb24iLCAiYyIsICJkZWZpbml0aW9uX2RlZmF1bHQiLCAiYyIsICJjIiwgInAiLCAiYyIsICJwIiwgImRlZmluaXRpb24iLCAiZGVmaW5pdGlvbl9kZWZhdWx0IiwgInZuIiwgInAiLCAiZDAiLCAicmdiIiwgImRlZmluaXRpb24iLCAiZGVmaW5pdGlvbl9kZWZhdWx0IiwgImMiLCAiYyIsICJkZWZpbml0aW9uIiwgImMiLCAiZGVmaW5pdGlvbl9kZWZhdWx0IiwgImsiLCAiZSIsICJmbiIsICJlIiwgImsiLCAibGFiIiwgInJnYiIsICJmIiwgImUiLCAiayIsICJmMiIsICJyZ2IiLCAiZGVmaW5pdGlvbiIsICJjIiwgImRlZmluaXRpb25fZGVmYXVsdCIsICJkZWZpbml0aW9uIiwgImRlZmluaXRpb25fZGVmYXVsdCIsICJjIiwgImRlZmluaXRpb24iLCAiYyIsICJkZWZpbml0aW9uX2RlZmF1bHQiLCAiZGVmaW5pdGlvbiIsICJkZWZpbml0aW9uX2RlZmF1bHQiLCAiYyIsICJjIiwgImMiLCAiZSIsICJrIiwgInVfZm4iLCAidl9mbiIsICJ1biIsICJ2biIsICJrIiwgInJnYiIsICJsY2h1diIsICJkZWZpbml0aW9uIiwgImRlZmluaXRpb25fZGVmYXVsdCIsICJkZWZpbml0aW9uIiwgImRlZmluaXRpb25fZGVmYXVsdCIsICJkZWZpbml0aW9uIiwgImx1diIsICJyZ2IiLCAiZGVmaW5pdGlvbl9kZWZhdWx0IiwgIk0iLCAicmdiIiwgIk0iLCAiYyIsICJrMiIsICJrMyIsICJmIiwgImYyIiwgInJnYiIsICJDMSIsICJiIiwgImIyIiwgImsiLCAibGFiIiwgImMiLCAiaHNsIiwgImRlZmluaXRpb25fZGVmYXVsdCIsICJjIiwgImxhYiIsICJjIiwgImsiLCAiaHN2IiwgImsiLCAiZGVmaW5pdGlvbl9kZWZhdWx0IiwgImMiLCAiZGVmaW5pdGlvbiIsICJkZWZpbml0aW9uX2RlZmF1bHQiLCAiYyIsICJjIiwgImRlZmluaXRpb24iLCAiZGVmaW5pdGlvbl9kZWZhdWx0IiwgImMiLCAicmdiIiwgImRlZmluaXRpb24iLCAiZGVmaW5pdGlvbl9kZWZhdWx0IiwgImdhbW1hIiwgImFicyIsICJsaW5lYXJpemUiLCAiYWJzIiwgInByb3Bob3RvIiwgImRlZmluaXRpb24iLCAiZGVmaW5pdGlvbl9kZWZhdWx0IiwgImdhbW1hIiwgImFicyIsICJcdTAzQjEiLCAiXHUwM0IyIiwgImxpbmVhcml6ZSIsICJhYnMiLCAicmVjMjAyMCIsICJkZWZpbml0aW9uIiwgImRlZmluaXRpb25fZGVmYXVsdCIsICJ0cmFuc2ZlciIsICJkZWZpbml0aW9uIiwgImRlZmluaXRpb25fZGVmYXVsdCIsICJkZWZpbml0aW9uIiwgImRlZmluaXRpb25fZGVmYXVsdCIsICJ4eXo2NSIsICJ4eXo1MCIsICJkZWZpbml0aW9uIiwgImRlZmluaXRpb25fZGVmYXVsdCIsICJkZWZpbml0aW9uIiwgImRlZmluaXRpb25fZGVmYXVsdCIsICJkZWZpbml0aW9uX2RlZmF1bHQiLCAicmdiIl0KfQo=
