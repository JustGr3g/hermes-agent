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

  // src/dashboard/design/theme.ts
  var toRgb = converter_default("rgb");
  function css(c2, alpha = 1) {
    const rgb2 = toRgb({ mode: "oklch", l: c2.l, c: c2.c, h: c2.h });
    if (!rgb2) return alpha >= 1 ? "#000" : "rgba(0,0,0,0)";
    const R = Math.round(Math.max(0, Math.min(1, rgb2.r)) * 255);
    const G = Math.round(Math.max(0, Math.min(1, rgb2.g)) * 255);
    const B = Math.round(Math.max(0, Math.min(1, rgb2.b)) * 255);
    return alpha >= 1 ? `rgb(${R}, ${G}, ${B})` : `rgba(${R}, ${G}, ${B}, ${alpha})`;
  }
  var theme = {
    // Surfaces
    bg: css(COLOR.background),
    bgRaised: css({ l: 0.13, c: 0.022, h: 260 }),
    bgInset: css({ l: 0.06, c: 0.02, h: 260 }),
    border: css({ l: 0.26, c: 0.02, h: 260 }, 0.6),
    borderFaint: css({ l: 0.26, c: 0.02, h: 260 }, 0.28),
    // Text
    text: css(COLOR.typography),
    textDim: css(COLOR.typography, 0.55),
    textFaint: css(COLOR.typography, 0.32),
    // The luminous accent (cardiogram trace, alive pulse)
    pulse: css(COLOR.formBase),
    pulseGlow: css(COLOR.formBase, 0.4),
    // Event-kind hues — each event type reads as a color at a glance
    kind: {
      tool: css(COLOR.drive.projectHealth),
      // warm amber
      episode: css(COLOR.drive.curiosity),
      // cool blue
      goal: css(COLOR.drive.connection),
      // sage
      signal: css(COLOR.drive.anticipation),
      // violet
      maintenance: css(COLOR.typography, 0.4)
      // dim — background upkeep
    },
    // Status tones
    ok: css({ l: 0.74, c: 0.1, h: 150 }),
    // success green
    warn: css({ l: 0.7, c: 0.13, h: 60 }),
    // caution amber
    fail: css({ l: 0.62, c: 0.16, h: 25 }),
    // failure red-orange
    // Drive hues (for any drive-specific UI later)
    drive: {
      curiosity: css(COLOR.drive.curiosity),
      projectHealth: css(COLOR.drive.projectHealth),
      connection: css(COLOR.drive.connection),
      anticipation: css(COLOR.drive.anticipation)
    }
  };

  // src/dashboard/data/useForumFeed.ts
  var EVENTS_URL = "/api/plugins/forum/events";
  var POLL_INTERVAL_MS = 1500;
  var EVENT_RETENTION_SEC = 180;
  var STALE_AFTER_MS = 6e3;
  function useForumFeed() {
    const [events, setEvents] = useState([]);
    const [vitals, setVitals] = useState(null);
    const [focus, setFocus] = useState(null);
    const [status, setStatus] = useState("idle");
    const [serverTime, setServerTime] = useState(null);
    const [athenaReachable, setAthenaReachable] = useState(false);
    const sinceRef = useRef(null);
    const lastOkRef = useRef(0);
    useEffect(() => {
      let mounted = true;
      let timer = null;
      const SDK2 = window.__HERMES_PLUGIN_SDK__;
      async function poll() {
        if (!mounted) return;
        if (timer !== null) {
          clearTimeout(timer);
          timer = null;
        }
        if (document.hidden) {
          timer = window.setTimeout(poll, POLL_INTERVAL_MS);
          return;
        }
        const since = sinceRef.current;
        const url = since !== null ? `${EVENTS_URL}?since=${since}` : EVENTS_URL;
        try {
          const data = await SDK2.fetchJSON(url);
          if (!mounted) return;
          sinceRef.current = data.server_time;
          lastOkRef.current = Date.now();
          setServerTime(data.server_time);
          if (data.vitals) setVitals(data.vitals);
          if (data.focus) setFocus(data.focus);
          setAthenaReachable(data.athena_reachable);
          setStatus("live");
          if (data.events.length > 0) {
            setEvents((prev) => {
              const merged = [...prev, ...data.events];
              const cutoff = data.server_time - EVENT_RETENTION_SEC;
              return merged.filter((e4) => e4.ts >= cutoff);
            });
          } else {
            setEvents((prev) => {
              const cutoff = data.server_time - EVENT_RETENTION_SEC;
              return prev.filter((e4) => e4.ts >= cutoff);
            });
          }
        } catch {
          if (!mounted) return;
          const sinceLastOk = Date.now() - lastOkRef.current;
          setStatus(sinceLastOk > STALE_AFTER_MS ? "error" : "stale");
        } finally {
          if (mounted) {
            timer = window.setTimeout(poll, POLL_INTERVAL_MS);
          }
        }
      }
      function onVisible() {
        if (!document.hidden && mounted) poll();
      }
      document.addEventListener("visibilitychange", onVisible);
      poll();
      return () => {
        mounted = false;
        if (timer !== null) clearTimeout(timer);
        document.removeEventListener("visibilitychange", onVisible);
      };
    }, []);
    return { events, vitals, focus, status, serverTime, athenaReachable };
  }

  // src/dashboard/data/useInterpretation.ts
  var INTERPRET_URL = "/api/plugins/forum/interpret";
  var POLL_INTERVAL_MS2 = 6e4;
  function useInterpretation() {
    const [interpretation, setInterpretation] = useState(null);
    const [loading, setLoading] = useState(true);
    const firstRef = useRef(true);
    useEffect(() => {
      let mounted = true;
      let timer = null;
      const SDK2 = window.__HERMES_PLUGIN_SDK__;
      async function poll() {
        if (!mounted) return;
        if (timer !== null) {
          clearTimeout(timer);
          timer = null;
        }
        if (document.hidden) {
          timer = window.setTimeout(poll, POLL_INTERVAL_MS2);
          return;
        }
        try {
          const data = await SDK2.fetchJSON(INTERPRET_URL);
          if (!mounted) return;
          setInterpretation(data);
        } catch {
        } finally {
          if (mounted) {
            setLoading(false);
            firstRef.current = false;
            timer = window.setTimeout(poll, POLL_INTERVAL_MS2);
          }
        }
      }
      function onVisible() {
        if (!document.hidden && mounted) poll();
      }
      document.addEventListener("visibilitychange", onVisible);
      poll();
      return () => {
        mounted = false;
        if (timer !== null) clearTimeout(timer);
        document.removeEventListener("visibilitychange", onVisible);
      };
    }, []);
    return { interpretation, loading };
  }

  // src/dashboard/instrument/Masthead.tsx
  function Masthead({ status, eventsPerMin, athenaReachable }) {
    const live = status === "live" && athenaReachable;
    const dotColor = !athenaReachable ? theme.fail : status === "live" ? theme.ok : status === "stale" ? theme.warn : theme.fail;
    const stateWord = !athenaReachable ? "athena offline" : status === "live" ? "alive" : status === "stale" ? "reconnecting" : "disconnected";
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "2px 2px 14px"
        }
      },
      /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "baseline", gap: 14 } }, /* @__PURE__ */ React.createElement(
        "span",
        {
          style: {
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: 22,
            letterSpacing: "0.14em",
            color: theme.text
          }
        },
        "ATHENA"
      ), /* @__PURE__ */ React.createElement(
        "span",
        {
          style: {
            fontSize: 11,
            letterSpacing: "0.10em",
            textTransform: "uppercase",
            color: theme.textFaint
          }
        },
        "the forum"
      )),
      /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 16 } }, /* @__PURE__ */ React.createElement(
        "span",
        {
          style: {
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: 12,
            color: theme.textDim
          },
          title: "cognitive events in the last minute"
        },
        eventsPerMin,
        "/min"
      ), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 7 } }, /* @__PURE__ */ React.createElement(
        "span",
        {
          className: live ? "forum-alive-dot" : void 0,
          style: {
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: dotColor,
            boxShadow: `0 0 8px ${dotColor}`
          }
        }
      ), /* @__PURE__ */ React.createElement(
        "span",
        {
          style: {
            fontSize: 11,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: theme.textDim
          }
        },
        stateWord
      )))
    );
  }

  // src/dashboard/instrument/Cardiogram.tsx
  var WINDOW_SEC = 38;
  var SPIKE_HEIGHTS = {
    goal: 1,
    signal: 0.72,
    tool: 0.55,
    episode: 0.42,
    maintenance: 0.26
  };
  function Cardiogram({ events, serverTime }) {
    const canvasRef = useRef(null);
    const wrapRef = useRef(null);
    const eventsRef = useRef(events);
    eventsRef.current = events;
    const serverTimeRef = useRef(serverTime);
    const serverRecvRef = useRef(performance.now());
    if (serverTimeRef.current !== serverTime) {
      serverTimeRef.current = serverTime;
      serverRecvRef.current = performance.now();
    }
    useEffect(() => {
      const canvas = canvasRef.current;
      const wrap = wrapRef.current;
      if (!canvas || !wrap) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      let raf = 0;
      let cssW = 0;
      let cssH = 0;
      function resize() {
        if (!wrap || !canvas || !ctx) return;
        const rect = wrap.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        cssW = Math.max(1, rect.width);
        cssH = Math.max(1, rect.height);
        canvas.width = Math.floor(cssW * dpr);
        canvas.height = Math.floor(cssH * dpr);
        canvas.style.width = `${cssW}px`;
        canvas.style.height = `${cssH}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(wrap);
      function estimatedNow() {
        const st = serverTimeRef.current;
        if (st === null) return performance.now() / 1e3;
        return st + (performance.now() - serverRecvRef.current) / 1e3;
      }
      function baseline(t) {
        return 0.055 * Math.sin(t * 0.7) + 0.035 * Math.sin(t * 1.73 + 1) + 0.025 * Math.sin(t * 0.31 + 2);
      }
      function eventContribution(t) {
        let amp = 0;
        const evs = eventsRef.current;
        for (let i = 0; i < evs.length; i++) {
          const e4 = evs[i];
          const dt = t - e4.ts;
          if (dt < -0.5 || dt > 2.4) continue;
          const h = SPIKE_HEIGHTS[e4.kind];
          const peak = Math.exp(-Math.pow((dt - 0.14) / 0.2, 2));
          const tail = dt > 0.34 ? 0.32 * Math.exp(-(dt - 0.34) * 2.6) : 0;
          amp += h * (peak + tail);
        }
        return amp;
      }
      function frame() {
        if (!ctx) return;
        ctx.clearRect(0, 0, cssW, cssH);
        const now = estimatedNow();
        const pxPerSec = cssW / WINDOW_SEC;
        const midY = cssH * 0.62;
        const ampScale = cssH * 0.4;
        const pts = [];
        for (let x = 0; x <= cssW; x += 2) {
          const t = now - (cssW - x) / pxPerSec;
          const a = baseline(t) + eventContribution(t);
          const y = midY - Math.min(a, 2.4) * ampScale;
          pts.push([x, y]);
        }
        ctx.beginPath();
        pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
        ctx.strokeStyle = theme.pulseGlow;
        ctx.lineWidth = 4.5;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.stroke();
        ctx.beginPath();
        pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
        ctx.strokeStyle = theme.pulse;
        ctx.lineWidth = 1.25;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.stroke();
        const last = pts[pts.length - 1];
        if (last) {
          ctx.beginPath();
          ctx.arc(last[0], last[1], 3.4, 0, Math.PI * 2);
          ctx.fillStyle = theme.pulse;
          ctx.fill();
          ctx.beginPath();
          ctx.arc(last[0], last[1], 8, 0, Math.PI * 2);
          ctx.fillStyle = theme.pulseGlow;
          ctx.fill();
        }
        raf = requestAnimationFrame(frame);
      }
      raf = requestAnimationFrame(frame);
      return () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
      };
    }, []);
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        ref: wrapRef,
        style: { position: "relative", width: "100%", height: "100%" }
      },
      /* @__PURE__ */ React.createElement("canvas", { ref: canvasRef, style: { display: "block", width: "100%", height: "100%" } })
    );
  }

  // src/dashboard/instrument/Reading.tsx
  function ago(ts, now) {
    const s = Math.max(0, Math.floor(now - ts));
    if (s < 5) return "just now";
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    return `${Math.floor(s / 3600)}h ago`;
  }
  function ColumnLabel({ children, color }) {
    return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 7, marginBottom: 8 } }, /* @__PURE__ */ React.createElement("span", { style: { width: 3, height: 11, background: color, borderRadius: 2 } }), /* @__PURE__ */ React.createElement(
      "span",
      {
        style: {
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: 10,
          letterSpacing: "0.13em",
          textTransform: "uppercase",
          color: theme.textDim
        }
      },
      children
    ));
  }
  function Reading({ interpretation, loading, now }) {
    const instrument = interpretation?.instrument;
    const athena = interpretation?.athena;
    const placeholder = (text) => /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, color: theme.textFaint, fontStyle: "italic" } }, text);
    return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(ColumnLabel, { color: theme.pulse }, "instrument read"), instrument ? /* @__PURE__ */ React.createElement(
      "p",
      {
        style: {
          margin: 0,
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: 14.5,
          lineHeight: 1.55,
          color: theme.text,
          textTransform: "none"
        }
      },
      instrument
    ) : placeholder(loading ? "reading the telemetry\u2026" : "interpretation unavailable")), /* @__PURE__ */ React.createElement("div", { style: { borderLeft: `1px solid ${theme.borderFaint}`, paddingLeft: 28 } }, /* @__PURE__ */ React.createElement(ColumnLabel, { color: theme.kind.signal }, "athena's voice"), athena ? /* @__PURE__ */ React.createElement(
      "p",
      {
        style: {
          margin: 0,
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontStyle: "italic",
          fontSize: 14.5,
          lineHeight: 1.55,
          color: theme.textDim,
          textTransform: "none"
        }
      },
      athena
    ) : placeholder(loading ? "asking Athena\u2026" : "self-report unavailable"))), interpretation && /* @__PURE__ */ React.createElement(
      "div",
      {
        style: {
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: 10,
          color: theme.textFaint
        }
      },
      "interpreted ",
      ago(interpretation.generated_at, now),
      " \xB7 ",
      interpretation.model
    ));
  }

  // src/dashboard/instrument/CurrentFocus.tsx
  function ago2(ts, now) {
    const s = Math.max(0, Math.floor(now - ts));
    if (s < 2) return "just now";
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    return `${Math.floor(s / 3600)}h ago`;
  }
  function Label({ children }) {
    return /* @__PURE__ */ React.createElement(
      "span",
      {
        style: {
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: 10,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: theme.textFaint
        }
      },
      children
    );
  }
  function CurrentFocus({ focus, now }) {
    const goal = focus?.goal ?? null;
    const tool = focus?.last_tool ?? null;
    return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10 } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 6 } }, /* @__PURE__ */ React.createElement(Label, null, "pursuing"), goal ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
      "div",
      {
        style: {
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: 16,
          lineHeight: 1.45,
          color: theme.text,
          textTransform: "none"
        }
      },
      goal.content || "(untitled goal)"
    ), /* @__PURE__ */ React.createElement(
      "span",
      {
        style: {
          fontSize: 10,
          letterSpacing: "0.09em",
          textTransform: "uppercase",
          color: theme.textDim
        }
      },
      goal.status
    )) : /* @__PURE__ */ React.createElement(
      "span",
      {
        style: {
          fontSize: 14,
          color: theme.textDim,
          fontStyle: "italic",
          textTransform: "none"
        }
      },
      "no active goal \u2014 associative drift"
    )), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 4 } }, /* @__PURE__ */ React.createElement(Label, null, "last tool"), tool ? /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "baseline", gap: 8 } }, /* @__PURE__ */ React.createElement(
      "span",
      {
        style: {
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: 13,
          color: theme.text
        }
      },
      tool.tool
    ), /* @__PURE__ */ React.createElement("span", { style: { color: tool.success ? theme.ok : theme.fail, fontSize: 13 } }, tool.success ? "\u2713" : "\u2717"), tool.latency_ms != null && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 12, color: theme.textDim } }, (tool.latency_ms / 1e3).toFixed(1), "s"), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: theme.textFaint } }, ago2(tool.ts, now))) : /* @__PURE__ */ React.createElement("span", { style: { fontSize: 13, color: theme.textDim, fontStyle: "italic" } }, "no tool calls yet")));
  }

  // src/dashboard/instrument/Vitals.tsx
  function compact(n) {
    if (n == null) return "\u2014";
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(1)}k`;
    return String(n);
  }
  function Stat({
    label,
    value,
    bar,
    barColor
  }) {
    return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 5, minWidth: 92 } }, /* @__PURE__ */ React.createElement(
      "span",
      {
        style: {
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: 9.5,
          letterSpacing: "0.11em",
          textTransform: "uppercase",
          color: theme.textFaint
        }
      },
      label
    ), /* @__PURE__ */ React.createElement(
      "span",
      {
        style: {
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: 15,
          color: theme.text
        }
      },
      value
    ), bar != null && /* @__PURE__ */ React.createElement(
      "span",
      {
        style: {
          position: "relative",
          width: 64,
          height: 2,
          background: theme.borderFaint,
          borderRadius: 1,
          overflow: "hidden"
        }
      },
      /* @__PURE__ */ React.createElement(
        "span",
        {
          style: {
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: `${Math.max(0, Math.min(1, bar)) * 100}%`,
            background: barColor ?? theme.pulse
          }
        }
      )
    ));
  }
  function Vitals({ vitals }) {
    const wm = vitals?.wm_load ?? null;
    const conf = vitals?.confidence ?? null;
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        style: {
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "20px 16px"
        }
      },
      /* @__PURE__ */ React.createElement(
        Stat,
        {
          label: "wm load",
          value: wm != null ? wm.toFixed(2) : "\u2014",
          bar: wm,
          barColor: theme.kind.signal
        }
      ),
      /* @__PURE__ */ React.createElement(
        Stat,
        {
          label: "confidence",
          value: conf != null ? conf.toFixed(2) : "\u2014",
          bar: conf,
          barColor: theme.ok
        }
      ),
      /* @__PURE__ */ React.createElement(Stat, { label: "goals", value: compact(vitals?.goal_count) }),
      /* @__PURE__ */ React.createElement(Stat, { label: "memory", value: compact(vitals?.assoc_nodes) }),
      /* @__PURE__ */ React.createElement(Stat, { label: "links", value: compact(vitals?.assoc_edges) })
    );
  }

  // src/dashboard/instrument/EventStream.tsx
  var MAX_ROWS = 44;
  function ageLabel(ts, now) {
    const s = Math.max(0, Math.floor(now - ts));
    if (s < 2) return "now";
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    return `${Math.floor(s / 3600)}h`;
  }
  var GOAL_STATUS_TONE = {
    completed: theme.ok,
    active: theme.text,
    suspended: theme.textDim,
    abandoned: theme.fail,
    needs_review: theme.warn
  };
  function eventKey(e4) {
    const ts = e4.ts.toFixed(3);
    switch (e4.kind) {
      case "tool":
        return `t:${ts}:${e4.tool}`;
      case "episode":
        return `e:${ts}:${e4.text.slice(0, 28)}`;
      case "goal":
        return `g:${ts}:${e4.goal_id ?? e4.text.slice(0, 20)}`;
      case "signal":
        return `s:${ts}:${e4.signal}`;
      case "maintenance":
        return `m:${ts}:${e4.handler}`;
    }
  }
  function describe(e4) {
    switch (e4.kind) {
      case "tool": {
        const lat = e4.latency_ms != null ? `${(e4.latency_ms / 1e3).toFixed(1)}s` : "";
        const tone = e4.success ? theme.ok : theme.fail;
        return {
          label: "tool",
          accent: tone,
          segments: [
            { text: e4.tool, mono: true },
            { text: e4.success ? "\u2713" : "\u2717", color: tone },
            ...lat ? [{ text: lat, color: theme.textDim, mono: true }] : []
          ]
        };
      }
      case "episode":
        return {
          label: "memory",
          accent: theme.kind.episode,
          segments: [{ text: e4.text || "(episode formed)" }]
        };
      case "goal": {
        const tone = GOAL_STATUS_TONE[e4.status] ?? theme.text;
        return {
          label: "goal",
          accent: theme.kind.goal,
          segments: [
            { text: e4.status, color: tone, mono: true },
            { text: e4.text || "(goal)", color: theme.textDim }
          ]
        };
      }
      case "signal":
        return {
          label: "signal",
          accent: theme.kind.signal,
          segments: [
            { text: e4.signal || "(signal)", mono: true },
            ...e4.context ? [{ text: e4.context, color: theme.textDim }] : []
          ]
        };
      case "maintenance":
        return {
          label: "upkeep",
          accent: theme.kind.maintenance,
          dim: true,
          segments: [{ text: e4.handler, color: theme.textDim, mono: true }]
        };
    }
  }
  function EventStream({ events, now }) {
    const rows = events.slice(-MAX_ROWS).reverse();
    if (rows.length === 0) {
      return /* @__PURE__ */ React.createElement("div", { style: { padding: "24px 4px", color: theme.textFaint, fontSize: 13 } }, "Waiting for activity\u2026");
    }
    return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column" } }, rows.map((e4) => {
      const d = describe(e4);
      const fullText = d.segments.map((s) => s.text).join(" ");
      return /* @__PURE__ */ React.createElement(
        "div",
        {
          key: eventKey(e4),
          className: "forum-row forum-row-in",
          title: `${d.label} \xB7 ${fullText}`,
          style: {
            display: "flex",
            alignItems: "baseline",
            gap: 10,
            padding: "6px 6px 6px 0",
            borderBottom: `1px solid ${theme.borderFaint}`,
            opacity: d.dim ? 0.6 : 1
          }
        },
        /* @__PURE__ */ React.createElement(
          "span",
          {
            style: {
              flex: "0 0 auto",
              width: 3,
              alignSelf: "stretch",
              background: d.accent,
              borderRadius: 2
            }
          }
        ),
        /* @__PURE__ */ React.createElement(
          "span",
          {
            style: {
              flex: "0 0 56px",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: 10,
              letterSpacing: "0.09em",
              textTransform: "uppercase",
              color: theme.textDim
            }
          },
          d.label
        ),
        /* @__PURE__ */ React.createElement(
          "span",
          {
            style: {
              flex: "1 1 auto",
              minWidth: 0,
              fontSize: 13,
              color: theme.text,
              textTransform: "none",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis"
            }
          },
          d.segments.map((s, si) => /* @__PURE__ */ React.createElement(
            "span",
            {
              key: si,
              style: {
                color: s.color ?? theme.text,
                fontFamily: s.mono ? "ui-monospace, SFMono-Regular, Menlo, monospace" : "inherit",
                marginRight: 7
              }
            },
            s.text
          ))
        ),
        /* @__PURE__ */ React.createElement(
          "span",
          {
            style: {
              flex: "0 0 auto",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: 11,
              color: theme.textFaint
            }
          },
          ageLabel(e4.ts, now)
        )
      );
    }));
  }

  // src/dashboard/Forum.tsx
  var STYLE = `
@keyframes forum-row-in {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
}
.forum-row-in { animation: forum-row-in 360ms cubic-bezier(0,0,0.2,1); }
.forum-row { transition: background-color 120ms ease; }
.forum-row:hover { background-color: ${theme.bgRaised}; }
@keyframes forum-alive {
  0%, 100% { opacity: 1;   transform: scale(1); }
  50%      { opacity: 0.45; transform: scale(0.82); }
}
.forum-alive-dot { animation: forum-alive 2.6s ease-in-out infinite; }
.forum-scroll::-webkit-scrollbar { width: 7px; }
.forum-scroll::-webkit-scrollbar-thumb {
  background: ${theme.border}; border-radius: 4px;
}
.forum-scroll::-webkit-scrollbar-track { background: transparent; }
`;
  function ZoneLabel({ children }) {
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        style: {
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: 10,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: theme.textFaint,
          marginBottom: 12
        }
      },
      children
    );
  }
  function Forum() {
    const feed = useForumFeed();
    const { interpretation, loading: interpLoading } = useInterpretation();
    const [, setTick] = useState(0);
    const serverRef = useRef(null);
    if (feed.serverTime != null && serverRef.current?.t !== feed.serverTime) {
      serverRef.current = { t: feed.serverTime, recv: Date.now() };
    }
    useEffect(() => {
      const i = window.setInterval(() => setTick((n) => n + 1), 1e3);
      return () => clearInterval(i);
    }, []);
    const displayNow = serverRef.current ? serverRef.current.t + (Date.now() - serverRef.current.recv) / 1e3 : Date.now() / 1e3;
    const eventsPerMin = feed.events.filter((e4) => e4.ts > displayNow - 60).length;
    return /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", height: "100%" } }, /* @__PURE__ */ React.createElement("style", null, STYLE), /* @__PURE__ */ React.createElement(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          background: theme.bg,
          border: `1px solid ${theme.border}`,
          borderRadius: 10,
          padding: "20px 22px",
          minHeight: 600,
          gap: 4,
          // Neutralize the host theme (e.g. "cyberpunk") forcing
          // uppercase on everything — long sentences in all-caps are
          // exhausting. Labels re-apply uppercase explicitly.
          textTransform: "none"
        }
      },
      /* @__PURE__ */ React.createElement(
        Masthead,
        {
          status: feed.status,
          eventsPerMin,
          athenaReachable: feed.athenaReachable
        }
      ),
      /* @__PURE__ */ React.createElement(
        "div",
        {
          style: {
            height: 116,
            background: theme.bgInset,
            border: `1px solid ${theme.borderFaint}`,
            borderRadius: 8,
            overflow: "hidden",
            marginBottom: 18
          }
        },
        /* @__PURE__ */ React.createElement(Cardiogram, { events: feed.events, serverTime: feed.serverTime })
      ),
      /* @__PURE__ */ React.createElement("div", { style: { marginBottom: 20 } }, /* @__PURE__ */ React.createElement(ZoneLabel, null, "reading"), /* @__PURE__ */ React.createElement(
        Reading,
        {
          interpretation,
          loading: interpLoading,
          now: displayNow
        }
      )),
      /* @__PURE__ */ React.createElement(
        "div",
        {
          style: {
            display: "grid",
            gridTemplateColumns: "minmax(260px, 40%) 1fr",
            gap: 28,
            flex: 1,
            minHeight: 360
          }
        },
        /* @__PURE__ */ React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 26 } }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(ZoneLabel, null, "now"), /* @__PURE__ */ React.createElement(CurrentFocus, { focus: feed.focus, now: displayNow })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(ZoneLabel, null, "vitals"), /* @__PURE__ */ React.createElement(Vitals, { vitals: feed.vitals }))),
        /* @__PURE__ */ React.createElement(
          "div",
          {
            style: {
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              borderLeft: `1px solid ${theme.borderFaint}`,
              paddingLeft: 26
            }
          },
          /* @__PURE__ */ React.createElement(ZoneLabel, null, "stream \xB7 ", feed.events.length, " events"),
          /* @__PURE__ */ React.createElement(
            "div",
            {
              className: "forum-scroll",
              style: { overflowY: "auto", maxHeight: 440, paddingRight: 8 }
            },
            /* @__PURE__ */ React.createElement(EventStream, { events: feed.events, now: displayNow })
          )
        )
      )
    ));
  }

  // src/dashboard/index.tsx
  if (HERMES_PLUGINS && typeof HERMES_PLUGINS.register === "function") {
    HERMES_PLUGINS.register("forum", Forum);
  } else {
    console.error("forum: window.__HERMES_PLUGINS__.register not available");
  }
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vc3JjL2Rhc2hib2FyZC9zZGsudHMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvcmdiL3BhcnNlTnVtYmVyLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL2NvbG9ycy9uYW1lZC5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9yZ2IvcGFyc2VOYW1lZC5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9yZ2IvcGFyc2VIZXguanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvdXRpbC9yZWdleC5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9yZ2IvcGFyc2VSZ2JMZWdhY3kuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvX3ByZXBhcmUuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvY29udmVydGVyLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL21vZGVzLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL3BhcnNlLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL3JnYi9wYXJzZVJnYi5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9yZ2IvcGFyc2VUcmFuc3BhcmVudC5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9pbnRlcnBvbGF0ZS9sZXJwLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL2ludGVycG9sYXRlL3BpZWNld2lzZS5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9pbnRlcnBvbGF0ZS9saW5lYXIuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvZml4dXAvYWxwaGEuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvcmdiL2RlZmluaXRpb24uanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvYTk4L2NvbnZlcnRBOThUb1h5ejY1LmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL2E5OC9jb252ZXJ0WHl6NjVUb0E5OC5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9scmdiL2NvbnZlcnRSZ2JUb0xyZ2IuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMveHl6NjUvY29udmVydFJnYlRvWHl6NjUuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvbHJnYi9jb252ZXJ0THJnYlRvUmdiLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL3h5ejY1L2NvbnZlcnRYeXo2NVRvUmdiLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL2E5OC9kZWZpbml0aW9uLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL3V0aWwvbm9ybWFsaXplSHVlLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL2ZpeHVwL2h1ZS5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9jdWJlaGVsaXgvY29uc3RhbnRzLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL2N1YmVoZWxpeC9jb252ZXJ0UmdiVG9DdWJlaGVsaXguanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvY3ViZWhlbGl4L2NvbnZlcnRDdWJlaGVsaXhUb1JnYi5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9kaWZmZXJlbmNlLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL2F2ZXJhZ2UuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvY3ViZWhlbGl4L2RlZmluaXRpb24uanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvbGNoL2NvbnZlcnRMYWJUb0xjaC5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9sY2gvY29udmVydExjaFRvTGFiLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL3h5ejY1L2NvbnN0YW50cy5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9jb25zdGFudHMuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvbGFiNjUvY29udmVydExhYjY1VG9YeXo2NS5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9sYWI2NS9jb252ZXJ0TGFiNjVUb1JnYi5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9sYWI2NS9jb252ZXJ0WHl6NjVUb0xhYjY1LmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL2xhYjY1L2NvbnZlcnRSZ2JUb0xhYjY1LmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL2RsY2gvY29uc3RhbnRzLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL2RsY2gvY29udmVydERsY2hUb0xhYjY1LmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL2RsY2gvY29udmVydExhYjY1VG9EbGNoLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL2RsYWIvZGVmaW5pdGlvbi5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9kbGNoL2RlZmluaXRpb24uanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvaHNpL2NvbnZlcnRIc2lUb1JnYi5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9oc2kvY29udmVydFJnYlRvSHNpLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL2hzaS9kZWZpbml0aW9uLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL2hzbC9jb252ZXJ0SHNsVG9SZ2IuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvaHNsL2NvbnZlcnRSZ2JUb0hzbC5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy91dGlsL2h1ZS5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9oc2wvcGFyc2VIc2xMZWdhY3kuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvaHNsL3BhcnNlSHNsLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL2hzbC9kZWZpbml0aW9uLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL2hzdi9jb252ZXJ0SHN2VG9SZ2IuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvaHN2L2NvbnZlcnRSZ2JUb0hzdi5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9oc3YvZGVmaW5pdGlvbi5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9od2IvY29udmVydEh3YlRvUmdiLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL2h3Yi9jb252ZXJ0UmdiVG9Id2IuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvaHdiL3BhcnNlSHdiLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL2h3Yi9kZWZpbml0aW9uLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL2hkci9jb25zdGFudHMuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvaGRyL3RyYW5zZmVyLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL2l0cC9jb252ZXJ0SXRwVG9YeXo2NS5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9pdHAvY29udmVydFh5ejY1VG9JdHAuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvaXRwL2RlZmluaXRpb24uanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvamFiL2NvbnZlcnRYeXo2NVRvSmFiLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL2phYi9jb252ZXJ0SmFiVG9YeXo2NS5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9qYWIvY29udmVydFJnYlRvSmFiLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL2phYi9jb252ZXJ0SmFiVG9SZ2IuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvamFiL2RlZmluaXRpb24uanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvamNoL2NvbnZlcnRKYWJUb0pjaC5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9qY2gvY29udmVydEpjaFRvSmFiLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL2pjaC9kZWZpbml0aW9uLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL3h5ejUwL2NvbnN0YW50cy5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9sYWIvY29udmVydExhYlRvWHl6NTAuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMveHl6NTAvY29udmVydFh5ejUwVG9SZ2IuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvbGFiL2NvbnZlcnRMYWJUb1JnYi5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy94eXo1MC9jb252ZXJ0UmdiVG9YeXo1MC5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9sYWIvY29udmVydFh5ejUwVG9MYWIuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvbGFiL2NvbnZlcnRSZ2JUb0xhYi5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9sYWIvcGFyc2VMYWIuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvbGFiL2RlZmluaXRpb24uanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvbGFiNjUvZGVmaW5pdGlvbi5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9sY2gvcGFyc2VMY2guanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvbGNoL2RlZmluaXRpb24uanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvbGNoNjUvZGVmaW5pdGlvbi5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9sY2h1di9jb252ZXJ0THV2VG9MY2h1di5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9sY2h1di9jb252ZXJ0TGNodXZUb0x1di5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9sdXYvY29udmVydFh5ejUwVG9MdXYuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvbHV2L2NvbnZlcnRMdXZUb1h5ejUwLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL2xjaHV2L2RlZmluaXRpb24uanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvbHJnYi9kZWZpbml0aW9uLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL2x1di9kZWZpbml0aW9uLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL29rbGFiL2NvbnZlcnRMcmdiVG9Pa2xhYi5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9va2xhYi9jb252ZXJ0UmdiVG9Pa2xhYi5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9va2xhYi9jb252ZXJ0T2tsYWJUb0xyZ2IuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvb2tsYWIvY29udmVydE9rbGFiVG9SZ2IuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvb2toc2wvaGVscGVycy5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9va2hzbC9jb252ZXJ0T2tsYWJUb09raHNsLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL29raHNsL2NvbnZlcnRPa2hzbFRvT2tsYWIuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvb2toc2wvbW9kZU9raHNsLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL29raHN2L2NvbnZlcnRPa2xhYlRvT2toc3YuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvb2toc3YvY29udmVydE9raHN2VG9Pa2xhYi5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9va2hzdi9tb2RlT2toc3YuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvb2tsYWIvcGFyc2VPa2xhYi5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9va2xhYi9kZWZpbml0aW9uLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL29rbGNoL3BhcnNlT2tsY2guanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvb2tsY2gvZGVmaW5pdGlvbi5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9wMy9jb252ZXJ0UDNUb1h5ejY1LmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL3AzL2NvbnZlcnRYeXo2NVRvUDMuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvcDMvZGVmaW5pdGlvbi5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9wcm9waG90by9jb252ZXJ0WHl6NTBUb1Byb3Bob3RvLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL3Byb3Bob3RvL2NvbnZlcnRQcm9waG90b1RvWHl6NTAuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvcHJvcGhvdG8vZGVmaW5pdGlvbi5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9yZWMyMDIwL2NvbnZlcnRYeXo2NVRvUmVjMjAyMC5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9yZWMyMDIwL2NvbnZlcnRSZWMyMDIwVG9YeXo2NS5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy9yZWMyMDIwL2RlZmluaXRpb24uanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMveHliL2NvbnN0YW50cy5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy94eWIvY29udmVydFJnYlRvWHliLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL3h5Yi9jb252ZXJ0WHliVG9SZ2IuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMveHliL2RlZmluaXRpb24uanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMveHl6NTAvZGVmaW5pdGlvbi5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy94eXo2NS9jb252ZXJ0WHl6NjVUb1h5ejUwLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL3h5ejY1L2NvbnZlcnRYeXo1MFRvWHl6NjUuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMveHl6NjUvZGVmaW5pdGlvbi5qcyIsICIuLi8uLi9ub2RlX21vZHVsZXMvY3Vsb3JpL3NyYy95aXEvY29udmVydFJnYlRvWWlxLmpzIiwgIi4uLy4uL25vZGVfbW9kdWxlcy9jdWxvcmkvc3JjL3lpcS9jb252ZXJ0WWlxVG9SZ2IuanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMveWlxL2RlZmluaXRpb24uanMiLCAiLi4vLi4vbm9kZV9tb2R1bGVzL2N1bG9yaS9zcmMvaW5kZXguanMiLCAiLi4vLi4vc3JjL2Rhc2hib2FyZC9kZXNpZ24vdG9rZW5zLnRzIiwgIi4uLy4uL3NyYy9kYXNoYm9hcmQvZGVzaWduL3RoZW1lLnRzIiwgIi4uLy4uL3NyYy9kYXNoYm9hcmQvZGF0YS91c2VGb3J1bUZlZWQudHMiLCAiLi4vLi4vc3JjL2Rhc2hib2FyZC9kYXRhL3VzZUludGVycHJldGF0aW9uLnRzIiwgIi4uLy4uL3NyYy9kYXNoYm9hcmQvaW5zdHJ1bWVudC9NYXN0aGVhZC50c3giLCAiLi4vLi4vc3JjL2Rhc2hib2FyZC9pbnN0cnVtZW50L0NhcmRpb2dyYW0udHN4IiwgIi4uLy4uL3NyYy9kYXNoYm9hcmQvaW5zdHJ1bWVudC9SZWFkaW5nLnRzeCIsICIuLi8uLi9zcmMvZGFzaGJvYXJkL2luc3RydW1lbnQvQ3VycmVudEZvY3VzLnRzeCIsICIuLi8uLi9zcmMvZGFzaGJvYXJkL2luc3RydW1lbnQvVml0YWxzLnRzeCIsICIuLi8uLi9zcmMvZGFzaGJvYXJkL2luc3RydW1lbnQvRXZlbnRTdHJlYW0udHN4IiwgIi4uLy4uL3NyYy9kYXNoYm9hcmQvRm9ydW0udHN4IiwgIi4uLy4uL3NyYy9kYXNoYm9hcmQvaW5kZXgudHN4Il0sCiAgInNvdXJjZXNDb250ZW50IjogWyIvKipcbiAqIFNESyBzaGltIFx1MjAxNCBzaW5nbGUgc291cmNlIG9mIHRydXRoIGZvciBSZWFjdCwgaG9va3MsIGFuZCBIZXJtZXMgVUlcbiAqIGNvbXBvbmVudHMgaW5zaWRlIHRoaXMgcGx1Z2luLlxuICpcbiAqIEhlcm1lcyBpbmplY3RzIGB3aW5kb3cuX19IRVJNRVNfUExVR0lOX1NES19fYCBCRUZPUkUgdGhlIHBsdWdpblxuICogYnVuZGxlIHJ1bnMuIFdlIHJlLWV4cG9ydCB0aGUgcnVudGltZSBiaW5kaW5ncyBmcm9tIHRoZXJlIHNvIG5vIGZpbGVcbiAqIGluIHRoZSBwbHVnaW4gaW1wb3J0cyBgcmVhY3RgIGRpcmVjdGx5IFx1MjAxNCB0aGF0IHdvdWxkIHRyaWdnZXIgZXNidWlsZCdzXG4gKiBJSUZFIHJlcXVpcmUoKSBzaGltLCB3aGljaCBmYWlscyBpbiBicm93c2VyIChcIkR5bmFtaWMgcmVxdWlyZSBvZlxuICogJ3JlYWN0JyBpcyBub3Qgc3VwcG9ydGVkXCIpLlxuICpcbiAqIFR5cGUtb25seSBpbXBvcnRzIGZyb20gJ3JlYWN0JyBhcmUgZmluZSBcdTIwMTQgdGhleSdyZSBlcmFzZWQgYnkgdHNjLlxuICovXG5cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG5jb25zdCBTREsgPSAod2luZG93IGFzIGFueSkuX19IRVJNRVNfUExVR0lOX1NES19fO1xuXG5pZiAoIVNESykge1xuICAvLyBTdXJmYWNlIGEgY2xlYXIgY29uc29sZSBlcnJvciBiZWZvcmUgdGhlIHJlc3Qgb2YgdGhlIGJ1bmRsZSBjcmFzaGVzLlxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuICBjb25zb2xlLmVycm9yKFxuICAgICdmb3J1bTogd2luZG93Ll9fSEVSTUVTX1BMVUdJTl9TREtfXyBub3QgZm91bmQgYXQgaW1wb3J0IHRpbWUuICcgK1xuICAgICdUaGUgcGx1Z2luIGNhbm5vdCBydW4gb3V0c2lkZSBIZXJtZXNcXCdzIGRhc2hib2FyZCBzaGVsbC4nLFxuICApO1xufVxuXG4vLyBSZWFjdCBpdHNlbGYgKyB0aGUgSlNYIGZhY3RvcnkgZW50cnkgcG9pbnRzIHRoZSBlc2J1aWxkIGpzeEZhY3Rvcnlcbi8vIG9wdGlvbiByZXNvbHZlcyBhdCBydW50aW1lIChgUmVhY3QuY3JlYXRlRWxlbWVudGAgLyBgUmVhY3QuRnJhZ21lbnRgKS5cbmV4cG9ydCBjb25zdCBSZWFjdCA9IFNESz8uUmVhY3Q7XG5cbi8vIEhvb2tzIFx1MjAxNCBkZXN0cnVjdHVyZWQgZm9yIGVyZ29ub21pYyBpbXBvcnRzXG5leHBvcnQgY29uc3QgdXNlU3RhdGUgPSBTREs/Lmhvb2tzPy51c2VTdGF0ZTtcbmV4cG9ydCBjb25zdCB1c2VFZmZlY3QgPSBTREs/Lmhvb2tzPy51c2VFZmZlY3Q7XG5leHBvcnQgY29uc3QgdXNlUmVmID0gU0RLPy5ob29rcz8udXNlUmVmO1xuZXhwb3J0IGNvbnN0IHVzZUNhbGxiYWNrID0gU0RLPy5ob29rcz8udXNlQ2FsbGJhY2s7XG5leHBvcnQgY29uc3QgdXNlTWVtbyA9IFNESz8uaG9va3M/LnVzZU1lbW87XG5cbi8vIEhlcm1lcyBzaGFyZWQgVUkgY29tcG9uZW50cyAoc2hhZGNuLXN0eWxlKVxuZXhwb3J0IGNvbnN0IGNvbXBvbmVudHMgPSBTREs/LmNvbXBvbmVudHMgPz8ge307XG5leHBvcnQgY29uc3QgQ2FyZCA9IGNvbXBvbmVudHMuQ2FyZDtcbmV4cG9ydCBjb25zdCBDYXJkSGVhZGVyID0gY29tcG9uZW50cy5DYXJkSGVhZGVyO1xuZXhwb3J0IGNvbnN0IENhcmRUaXRsZSA9IGNvbXBvbmVudHMuQ2FyZFRpdGxlO1xuZXhwb3J0IGNvbnN0IENhcmRDb250ZW50ID0gY29tcG9uZW50cy5DYXJkQ29udGVudDtcbmV4cG9ydCBjb25zdCBCYWRnZSA9IGNvbXBvbmVudHMuQmFkZ2U7XG5leHBvcnQgY29uc3QgQnV0dG9uID0gY29tcG9uZW50cy5CdXR0b247XG5cbi8vIFV0aWxpdHkgXHUyMDE0IHNhbWUtb3JpZ2luIGZldGNoIHdpdGggYXV0by1hdHRhY2hlZCBzZXNzaW9uIHRva2VuXG5leHBvcnQgY29uc3QgZmV0Y2hKU09OOiA8VCA9IHVua25vd24+KHVybDogc3RyaW5nLCBpbml0PzogUmVxdWVzdEluaXQpID0+IFByb21pc2U8VD4gPVxuICBTREs/LmZldGNoSlNPTjtcblxuLy8gUmVnaXN0cmF0aW9uIGVudHJ5IHBvaW50ICh3aW5kb3cuX19IRVJNRVNfUExVR0lOU19fLnJlZ2lzdGVyKVxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbmV4cG9ydCBjb25zdCBIRVJNRVNfUExVR0lOUyA9ICh3aW5kb3cgYXMgYW55KS5fX0hFUk1FU19QTFVHSU5TX187XG4iLCAiY29uc3QgcGFyc2VOdW1iZXIgPSAoY29sb3IsIGxlbikgPT4ge1xuXHRpZiAodHlwZW9mIGNvbG9yICE9PSAnbnVtYmVyJykgcmV0dXJuO1xuXG5cdC8vIGhleDM6ICNjOTMgLT4gI2NjOTkzM1xuXHRpZiAobGVuID09PSAzKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdG1vZGU6ICdyZ2InLFxuXHRcdFx0cjogKCgoY29sb3IgPj4gOCkgJiAweGYpIHwgKChjb2xvciA+PiA0KSAmIDB4ZjApKSAvIDI1NSxcblx0XHRcdGc6ICgoKGNvbG9yID4+IDQpICYgMHhmKSB8IChjb2xvciAmIDB4ZjApKSAvIDI1NSxcblx0XHRcdGI6ICgoY29sb3IgJiAweGYpIHwgKChjb2xvciA8PCA0KSAmIDB4ZjApKSAvIDI1NVxuXHRcdH07XG5cdH1cblxuXHQvLyBoZXg0OiAjYzkzMSAtPiAjY2M5OTMzMTFcblx0aWYgKGxlbiA9PT0gNCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRtb2RlOiAncmdiJyxcblx0XHRcdHI6ICgoKGNvbG9yID4+IDEyKSAmIDB4ZikgfCAoKGNvbG9yID4+IDgpICYgMHhmMCkpIC8gMjU1LFxuXHRcdFx0ZzogKCgoY29sb3IgPj4gOCkgJiAweGYpIHwgKChjb2xvciA+PiA0KSAmIDB4ZjApKSAvIDI1NSxcblx0XHRcdGI6ICgoKGNvbG9yID4+IDQpICYgMHhmKSB8IChjb2xvciAmIDB4ZjApKSAvIDI1NSxcblx0XHRcdGFscGhhOiAoKGNvbG9yICYgMHhmKSB8ICgoY29sb3IgPDwgNCkgJiAweGYwKSkgLyAyNTVcblx0XHR9O1xuXHR9XG5cblx0Ly8gaGV4NjogI2YwZjFmMlxuXHRpZiAobGVuID09PSA2KSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdG1vZGU6ICdyZ2InLFxuXHRcdFx0cjogKChjb2xvciA+PiAxNikgJiAweGZmKSAvIDI1NSxcblx0XHRcdGc6ICgoY29sb3IgPj4gOCkgJiAweGZmKSAvIDI1NSxcblx0XHRcdGI6IChjb2xvciAmIDB4ZmYpIC8gMjU1XG5cdFx0fTtcblx0fVxuXG5cdC8vIGhleDg6ICNmMGYxZjJmZlxuXHRpZiAobGVuID09PSA4KSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdG1vZGU6ICdyZ2InLFxuXHRcdFx0cjogKChjb2xvciA+PiAyNCkgJiAweGZmKSAvIDI1NSxcblx0XHRcdGc6ICgoY29sb3IgPj4gMTYpICYgMHhmZikgLyAyNTUsXG5cdFx0XHRiOiAoKGNvbG9yID4+IDgpICYgMHhmZikgLyAyNTUsXG5cdFx0XHRhbHBoYTogKGNvbG9yICYgMHhmZikgLyAyNTVcblx0XHR9O1xuXHR9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBwYXJzZU51bWJlcjtcbiIsICJjb25zdCBuYW1lZCA9IHtcblx0YWxpY2VibHVlOiAweGYwZjhmZixcblx0YW50aXF1ZXdoaXRlOiAweGZhZWJkNyxcblx0YXF1YTogMHgwMGZmZmYsXG5cdGFxdWFtYXJpbmU6IDB4N2ZmZmQ0LFxuXHRhenVyZTogMHhmMGZmZmYsXG5cdGJlaWdlOiAweGY1ZjVkYyxcblx0YmlzcXVlOiAweGZmZTRjNCxcblx0YmxhY2s6IDB4MDAwMDAwLFxuXHRibGFuY2hlZGFsbW9uZDogMHhmZmViY2QsXG5cdGJsdWU6IDB4MDAwMGZmLFxuXHRibHVldmlvbGV0OiAweDhhMmJlMixcblx0YnJvd246IDB4YTUyYTJhLFxuXHRidXJseXdvb2Q6IDB4ZGViODg3LFxuXHRjYWRldGJsdWU6IDB4NWY5ZWEwLFxuXHRjaGFydHJldXNlOiAweDdmZmYwMCxcblx0Y2hvY29sYXRlOiAweGQyNjkxZSxcblx0Y29yYWw6IDB4ZmY3ZjUwLFxuXHRjb3JuZmxvd2VyYmx1ZTogMHg2NDk1ZWQsXG5cdGNvcm5zaWxrOiAweGZmZjhkYyxcblx0Y3JpbXNvbjogMHhkYzE0M2MsXG5cdGN5YW46IDB4MDBmZmZmLFxuXHRkYXJrYmx1ZTogMHgwMDAwOGIsXG5cdGRhcmtjeWFuOiAweDAwOGI4Yixcblx0ZGFya2dvbGRlbnJvZDogMHhiODg2MGIsXG5cdGRhcmtncmF5OiAweGE5YTlhOSxcblx0ZGFya2dyZWVuOiAweDAwNjQwMCxcblx0ZGFya2dyZXk6IDB4YTlhOWE5LFxuXHRkYXJra2hha2k6IDB4YmRiNzZiLFxuXHRkYXJrbWFnZW50YTogMHg4YjAwOGIsXG5cdGRhcmtvbGl2ZWdyZWVuOiAweDU1NmIyZixcblx0ZGFya29yYW5nZTogMHhmZjhjMDAsXG5cdGRhcmtvcmNoaWQ6IDB4OTkzMmNjLFxuXHRkYXJrcmVkOiAweDhiMDAwMCxcblx0ZGFya3NhbG1vbjogMHhlOTk2N2EsXG5cdGRhcmtzZWFncmVlbjogMHg4ZmJjOGYsXG5cdGRhcmtzbGF0ZWJsdWU6IDB4NDgzZDhiLFxuXHRkYXJrc2xhdGVncmF5OiAweDJmNGY0Zixcblx0ZGFya3NsYXRlZ3JleTogMHgyZjRmNGYsXG5cdGRhcmt0dXJxdW9pc2U6IDB4MDBjZWQxLFxuXHRkYXJrdmlvbGV0OiAweDk0MDBkMyxcblx0ZGVlcHBpbms6IDB4ZmYxNDkzLFxuXHRkZWVwc2t5Ymx1ZTogMHgwMGJmZmYsXG5cdGRpbWdyYXk6IDB4Njk2OTY5LFxuXHRkaW1ncmV5OiAweDY5Njk2OSxcblx0ZG9kZ2VyYmx1ZTogMHgxZTkwZmYsXG5cdGZpcmVicmljazogMHhiMjIyMjIsXG5cdGZsb3JhbHdoaXRlOiAweGZmZmFmMCxcblx0Zm9yZXN0Z3JlZW46IDB4MjI4YjIyLFxuXHRmdWNoc2lhOiAweGZmMDBmZixcblx0Z2FpbnNib3JvOiAweGRjZGNkYyxcblx0Z2hvc3R3aGl0ZTogMHhmOGY4ZmYsXG5cdGdvbGQ6IDB4ZmZkNzAwLFxuXHRnb2xkZW5yb2Q6IDB4ZGFhNTIwLFxuXHRncmF5OiAweDgwODA4MCxcblx0Z3JlZW46IDB4MDA4MDAwLFxuXHRncmVlbnllbGxvdzogMHhhZGZmMmYsXG5cdGdyZXk6IDB4ODA4MDgwLFxuXHRob25leWRldzogMHhmMGZmZjAsXG5cdGhvdHBpbms6IDB4ZmY2OWI0LFxuXHRpbmRpYW5yZWQ6IDB4Y2Q1YzVjLFxuXHRpbmRpZ286IDB4NGIwMDgyLFxuXHRpdm9yeTogMHhmZmZmZjAsXG5cdGtoYWtpOiAweGYwZTY4Yyxcblx0bGF2ZW5kZXI6IDB4ZTZlNmZhLFxuXHRsYXZlbmRlcmJsdXNoOiAweGZmZjBmNSxcblx0bGF3bmdyZWVuOiAweDdjZmMwMCxcblx0bGVtb25jaGlmZm9uOiAweGZmZmFjZCxcblx0bGlnaHRibHVlOiAweGFkZDhlNixcblx0bGlnaHRjb3JhbDogMHhmMDgwODAsXG5cdGxpZ2h0Y3lhbjogMHhlMGZmZmYsXG5cdGxpZ2h0Z29sZGVucm9keWVsbG93OiAweGZhZmFkMixcblx0bGlnaHRncmF5OiAweGQzZDNkMyxcblx0bGlnaHRncmVlbjogMHg5MGVlOTAsXG5cdGxpZ2h0Z3JleTogMHhkM2QzZDMsXG5cdGxpZ2h0cGluazogMHhmZmI2YzEsXG5cdGxpZ2h0c2FsbW9uOiAweGZmYTA3YSxcblx0bGlnaHRzZWFncmVlbjogMHgyMGIyYWEsXG5cdGxpZ2h0c2t5Ymx1ZTogMHg4N2NlZmEsXG5cdGxpZ2h0c2xhdGVncmF5OiAweDc3ODg5OSxcblx0bGlnaHRzbGF0ZWdyZXk6IDB4Nzc4ODk5LFxuXHRsaWdodHN0ZWVsYmx1ZTogMHhiMGM0ZGUsXG5cdGxpZ2h0eWVsbG93OiAweGZmZmZlMCxcblx0bGltZTogMHgwMGZmMDAsXG5cdGxpbWVncmVlbjogMHgzMmNkMzIsXG5cdGxpbmVuOiAweGZhZjBlNixcblx0bWFnZW50YTogMHhmZjAwZmYsXG5cdG1hcm9vbjogMHg4MDAwMDAsXG5cdG1lZGl1bWFxdWFtYXJpbmU6IDB4NjZjZGFhLFxuXHRtZWRpdW1ibHVlOiAweDAwMDBjZCxcblx0bWVkaXVtb3JjaGlkOiAweGJhNTVkMyxcblx0bWVkaXVtcHVycGxlOiAweDkzNzBkYixcblx0bWVkaXVtc2VhZ3JlZW46IDB4M2NiMzcxLFxuXHRtZWRpdW1zbGF0ZWJsdWU6IDB4N2I2OGVlLFxuXHRtZWRpdW1zcHJpbmdncmVlbjogMHgwMGZhOWEsXG5cdG1lZGl1bXR1cnF1b2lzZTogMHg0OGQxY2MsXG5cdG1lZGl1bXZpb2xldHJlZDogMHhjNzE1ODUsXG5cdG1pZG5pZ2h0Ymx1ZTogMHgxOTE5NzAsXG5cdG1pbnRjcmVhbTogMHhmNWZmZmEsXG5cdG1pc3R5cm9zZTogMHhmZmU0ZTEsXG5cdG1vY2Nhc2luOiAweGZmZTRiNSxcblx0bmF2YWpvd2hpdGU6IDB4ZmZkZWFkLFxuXHRuYXZ5OiAweDAwMDA4MCxcblx0b2xkbGFjZTogMHhmZGY1ZTYsXG5cdG9saXZlOiAweDgwODAwMCxcblx0b2xpdmVkcmFiOiAweDZiOGUyMyxcblx0b3JhbmdlOiAweGZmYTUwMCxcblx0b3JhbmdlcmVkOiAweGZmNDUwMCxcblx0b3JjaGlkOiAweGRhNzBkNixcblx0cGFsZWdvbGRlbnJvZDogMHhlZWU4YWEsXG5cdHBhbGVncmVlbjogMHg5OGZiOTgsXG5cdHBhbGV0dXJxdW9pc2U6IDB4YWZlZWVlLFxuXHRwYWxldmlvbGV0cmVkOiAweGRiNzA5Myxcblx0cGFwYXlhd2hpcDogMHhmZmVmZDUsXG5cdHBlYWNocHVmZjogMHhmZmRhYjksXG5cdHBlcnU6IDB4Y2Q4NTNmLFxuXHRwaW5rOiAweGZmYzBjYixcblx0cGx1bTogMHhkZGEwZGQsXG5cdHBvd2RlcmJsdWU6IDB4YjBlMGU2LFxuXHRwdXJwbGU6IDB4ODAwMDgwLFxuXG5cdC8vIEFkZGVkIGluIENTUyBDb2xvcnMgTGV2ZWwgNDpcblx0Ly8gaHR0cHM6Ly9kcmFmdHMuY3Nzd2cub3JnL2Nzcy1jb2xvci8jY2hhbmdlcy1mcm9tLTNcblx0cmViZWNjYXB1cnBsZTogMHg2NjMzOTksXG5cblx0cmVkOiAweGZmMDAwMCxcblx0cm9zeWJyb3duOiAweGJjOGY4Zixcblx0cm95YWxibHVlOiAweDQxNjllMSxcblx0c2FkZGxlYnJvd246IDB4OGI0NTEzLFxuXHRzYWxtb246IDB4ZmE4MDcyLFxuXHRzYW5keWJyb3duOiAweGY0YTQ2MCxcblx0c2VhZ3JlZW46IDB4MmU4YjU3LFxuXHRzZWFzaGVsbDogMHhmZmY1ZWUsXG5cdHNpZW5uYTogMHhhMDUyMmQsXG5cdHNpbHZlcjogMHhjMGMwYzAsXG5cdHNreWJsdWU6IDB4ODdjZWViLFxuXHRzbGF0ZWJsdWU6IDB4NmE1YWNkLFxuXHRzbGF0ZWdyYXk6IDB4NzA4MDkwLFxuXHRzbGF0ZWdyZXk6IDB4NzA4MDkwLFxuXHRzbm93OiAweGZmZmFmYSxcblx0c3ByaW5nZ3JlZW46IDB4MDBmZjdmLFxuXHRzdGVlbGJsdWU6IDB4NDY4MmI0LFxuXHR0YW46IDB4ZDJiNDhjLFxuXHR0ZWFsOiAweDAwODA4MCxcblx0dGhpc3RsZTogMHhkOGJmZDgsXG5cdHRvbWF0bzogMHhmZjYzNDcsXG5cdHR1cnF1b2lzZTogMHg0MGUwZDAsXG5cdHZpb2xldDogMHhlZTgyZWUsXG5cdHdoZWF0OiAweGY1ZGViMyxcblx0d2hpdGU6IDB4ZmZmZmZmLFxuXHR3aGl0ZXNtb2tlOiAweGY1ZjVmNSxcblx0eWVsbG93OiAweGZmZmYwMCxcblx0eWVsbG93Z3JlZW46IDB4OWFjZDMyXG59O1xuXG5leHBvcnQgZGVmYXVsdCBuYW1lZDtcbiIsICJpbXBvcnQgcGFyc2VOdW1iZXIgZnJvbSAnLi9wYXJzZU51bWJlci5qcyc7XG5pbXBvcnQgbmFtZWQgZnJvbSAnLi4vY29sb3JzL25hbWVkLmpzJztcblxuLy8gQWxzbyBzdXBwb3J0cyB0aGUgYHRyYW5zcGFyZW50YCBjb2xvciBhcyBkZWZpbmVkIGluOlxuLy8gaHR0cHM6Ly9kcmFmdHMuY3Nzd2cub3JnL2Nzcy1jb2xvci8jdHJhbnNwYXJlbnQtYmxhY2tcbmNvbnN0IHBhcnNlTmFtZWQgPSBjb2xvciA9PiB7XG5cdHJldHVybiBwYXJzZU51bWJlcihuYW1lZFtjb2xvci50b0xvd2VyQ2FzZSgpXSwgNik7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBwYXJzZU5hbWVkO1xuIiwgImltcG9ydCBwYXJzZU51bWJlciBmcm9tICcuL3BhcnNlTnVtYmVyLmpzJztcblxuY29uc3QgaGV4ID0gL14jPyhbMC05YS1mXXs4fXxbMC05YS1mXXs2fXxbMC05YS1mXXs0fXxbMC05YS1mXXszfSkkL2k7XG5cbmNvbnN0IHBhcnNlSGV4ID0gY29sb3IgPT4ge1xuXHRsZXQgbWF0Y2g7XG5cdC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25kLWFzc2lnblxuXHRyZXR1cm4gKG1hdGNoID0gY29sb3IubWF0Y2goaGV4KSlcblx0XHQ/IHBhcnNlTnVtYmVyKHBhcnNlSW50KG1hdGNoWzFdLCAxNiksIG1hdGNoWzFdLmxlbmd0aClcblx0XHQ6IHVuZGVmaW5lZDtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IHBhcnNlSGV4O1xuIiwgIi8qXG5cdEJhc2ljIGJ1aWxkaW5nIGJsb2NrcyBmb3IgY29sb3IgcmVnZXhlc1xuXHQtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuXHRUaGVzZSByZWdleGVzIGFyZSBleHByZXNzZWQgYXMgc3RyaW5nc1xuXHR0byBiZSBpbnRlcnBvbGF0ZWQgaW4gdGhlIGNvbG9yIHJlZ2V4ZXMuXG4gKi9cblxuLy8gPG51bWJlcj5cbmV4cG9ydCBjb25zdCBudW0gPSAnKFsrLV0/XFxcXGQqXFxcXC4/XFxcXGQrKD86W2VFXVsrLV0/XFxcXGQrKT8pJztcblxuLy8gPG51bWJlcj4gb3IgJ25vbmUnXG5leHBvcnQgY29uc3QgbnVtX25vbmUgPSBgKD86JHtudW19fG5vbmUpYDtcblxuLy8gPHBlcmNlbnRhZ2U+XG5leHBvcnQgY29uc3QgcGVyID0gYCR7bnVtfSVgO1xuXG4vLyA8cGVyY2VudD4gb3IgJ25vbmUnXG5leHBvcnQgY29uc3QgcGVyX25vbmUgPSBgKD86JHtudW19JXxub25lKWA7XG5cbi8vIDxudW1iZXItcGVyY2VudGFnZT4gKDxhbHBoYS12YWx1ZT4pXG5leHBvcnQgY29uc3QgbnVtX3BlciA9IGAoPzoke251bX0lfCR7bnVtfSlgO1xuXG4vLyA8bnVtYmVyLXBlcmNlbnRhZ2U+ICg8YWxwaGEtdmFsdWU+KSBvciAnbm9uZSdcbmV4cG9ydCBjb25zdCBudW1fcGVyX25vbmUgPSBgKD86JHtudW19JXwke251bX18bm9uZSlgO1xuXG4vLyA8aHVlPlxuZXhwb3J0IGNvbnN0IGh1ZSA9IGAoPzoke251bX0oZGVnfGdyYWR8cmFkfHR1cm4pfCR7bnVtfSlgO1xuXG4vLyA8aHVlPiBvciAnbm9uZSdcbmV4cG9ydCBjb25zdCBodWVfbm9uZSA9IGAoPzoke251bX0oZGVnfGdyYWR8cmFkfHR1cm4pfCR7bnVtfXxub25lKWA7XG5cbmV4cG9ydCBjb25zdCBjID0gYFxcXFxzKixcXFxccypgOyAvLyBjb21tYVxuZXhwb3J0IGNvbnN0IHNvID0gJ1xcXFxzKic7IC8vIHNwYWNlLCBvcHRpb25hbFxuZXhwb3J0IGNvbnN0IHMgPSBgXFxcXHMrYDsgLy8gc3BhY2VcblxuZXhwb3J0IGNvbnN0IHJ4X251bV9wZXJfbm9uZSA9IG5ldyBSZWdFeHAoJ14nICsgbnVtX3Blcl9ub25lICsgJyQnKTtcbiIsICJpbXBvcnQgeyBudW0sIHBlciwgbnVtX3BlciwgYyB9IGZyb20gJy4uL3V0aWwvcmVnZXguanMnO1xuXG4vKlxuXHRyZ2IoKSByZWd1bGFyIGV4cHJlc3Npb25zIGZvciBsZWdhY3kgZm9ybWF0XG5cdFJlZmVyZW5jZTogaHR0cHM6Ly9kcmFmdHMuY3Nzd2cub3JnL2Nzcy1jb2xvci8jcmdiLWZ1bmN0aW9uc1xuICovXG5jb25zdCByZ2JfbnVtX29sZCA9IG5ldyBSZWdFeHAoXG5cdGBecmdiYT9cXFxcKFxcXFxzKiR7bnVtfSR7Y30ke251bX0ke2N9JHtudW19XFxcXHMqKD86LFxcXFxzKiR7bnVtX3Blcn1cXFxccyopP1xcXFwpJGBcbik7XG5cbmNvbnN0IHJnYl9wZXJfb2xkID0gbmV3IFJlZ0V4cChcblx0YF5yZ2JhP1xcXFwoXFxcXHMqJHtwZXJ9JHtjfSR7cGVyfSR7Y30ke3Blcn1cXFxccyooPzosXFxcXHMqJHtudW1fcGVyfVxcXFxzKik/XFxcXCkkYFxuKTtcblxuY29uc3QgcGFyc2VSZ2JMZWdhY3kgPSBjb2xvciA9PiB7XG5cdGxldCByZXMgPSB7IG1vZGU6ICdyZ2InIH07XG5cdGxldCBtYXRjaDtcblx0aWYgKChtYXRjaCA9IGNvbG9yLm1hdGNoKHJnYl9udW1fb2xkKSkpIHtcblx0XHRpZiAobWF0Y2hbMV0gIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0cmVzLnIgPSBtYXRjaFsxXSAvIDI1NTtcblx0XHR9XG5cdFx0aWYgKG1hdGNoWzJdICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdHJlcy5nID0gbWF0Y2hbMl0gLyAyNTU7XG5cdFx0fVxuXHRcdGlmIChtYXRjaFszXSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRyZXMuYiA9IG1hdGNoWzNdIC8gMjU1O1xuXHRcdH1cblx0fSBlbHNlIGlmICgobWF0Y2ggPSBjb2xvci5tYXRjaChyZ2JfcGVyX29sZCkpKSB7XG5cdFx0aWYgKG1hdGNoWzFdICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdHJlcy5yID0gbWF0Y2hbMV0gLyAxMDA7XG5cdFx0fVxuXHRcdGlmIChtYXRjaFsyXSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRyZXMuZyA9IG1hdGNoWzJdIC8gMTAwO1xuXHRcdH1cblx0XHRpZiAobWF0Y2hbM10gIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0cmVzLmIgPSBtYXRjaFszXSAvIDEwMDtcblx0XHR9XG5cdH0gZWxzZSB7XG5cdFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0fVxuXG5cdGlmIChtYXRjaFs0XSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmVzLmFscGhhID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oMSwgbWF0Y2hbNF0gLyAxMDApKTtcblx0fSBlbHNlIGlmIChtYXRjaFs1XSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmVzLmFscGhhID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oMSwgK21hdGNoWzVdKSk7XG5cdH1cblxuXHRyZXR1cm4gcmVzO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgcGFyc2VSZ2JMZWdhY3k7XG4iLCAiaW1wb3J0IHBhcnNlIGZyb20gJy4vcGFyc2UuanMnO1xuXG5jb25zdCBwcmVwYXJlID0gKGNvbG9yLCBtb2RlKSA9PlxuXHRjb2xvciA9PT0gdW5kZWZpbmVkXG5cdFx0PyB1bmRlZmluZWRcblx0XHQ6IHR5cGVvZiBjb2xvciAhPT0gJ29iamVjdCdcblx0XHQ/IHBhcnNlKGNvbG9yKVxuXHRcdDogY29sb3IubW9kZSAhPT0gdW5kZWZpbmVkXG5cdFx0PyBjb2xvclxuXHRcdDogbW9kZVxuXHRcdD8geyAuLi5jb2xvciwgbW9kZSB9XG5cdFx0OiB1bmRlZmluZWQ7XG5cbmV4cG9ydCBkZWZhdWx0IHByZXBhcmU7XG4iLCAiaW1wb3J0IHsgY29udmVydGVycyB9IGZyb20gJy4vbW9kZXMuanMnO1xuaW1wb3J0IHByZXBhcmUgZnJvbSAnLi9fcHJlcGFyZS5qcyc7XG5cbmNvbnN0IGNvbnZlcnRlciA9XG5cdCh0YXJnZXRfbW9kZSA9ICdyZ2InKSA9PlxuXHRjb2xvciA9PlxuXHRcdChjb2xvciA9IHByZXBhcmUoY29sb3IsIHRhcmdldF9tb2RlKSkgIT09IHVuZGVmaW5lZFxuXHRcdFx0PyAvLyBpZiB0aGUgY29sb3IncyBtb2RlIGNvcnJlc3BvbmRzIHRvIG91ciB0YXJnZXQgbW9kZVxuXHRcdFx0ICBjb2xvci5tb2RlID09PSB0YXJnZXRfbW9kZVxuXHRcdFx0XHQ/IC8vIHRoZW4ganVzdCByZXR1cm4gdGhlIGNvbG9yXG5cdFx0XHRcdCAgY29sb3Jcblx0XHRcdFx0OiAvLyBvdGhlcndpc2UgY2hlY2sgdG8gc2VlIGlmIHdlIGhhdmUgYSBkZWRpY2F0ZWRcblx0XHRcdFx0Ly8gY29udmVydGVyIGZvciB0aGUgdGFyZ2V0IG1vZGVcblx0XHRcdFx0Y29udmVydGVyc1tjb2xvci5tb2RlXVt0YXJnZXRfbW9kZV1cblx0XHRcdFx0PyAvLyBhbmQgcmV0dXJuIGl0cyByZXN1bHQuLi5cblx0XHRcdFx0ICBjb252ZXJ0ZXJzW2NvbG9yLm1vZGVdW3RhcmdldF9tb2RlXShjb2xvcilcblx0XHRcdFx0OiAvLyAuLi5vdGhlcndpc2UgcGFzcyB0aHJvdWdoIFJHQiBhcyBhbiBpbnRlcm1lZGlhcnkgc3RlcC5cblx0XHRcdFx0Ly8gaWYgdGhlIHRhcmdldCBtb2RlIGlzIFJHQi4uLlxuXHRcdFx0XHR0YXJnZXRfbW9kZSA9PT0gJ3JnYidcblx0XHRcdFx0PyAvLyBqdXN0IHJldHVybiB0aGUgUkdCXG5cdFx0XHRcdCAgY29udmVydGVyc1tjb2xvci5tb2RlXS5yZ2IoY29sb3IpXG5cdFx0XHRcdDogLy8gb3RoZXJ3aXNlIGNvbnZlcnQgY29sb3IubW9kZSAtPiBSR0IgLT4gdGFyZ2V0X21vZGVcblx0XHRcdFx0ICBjb252ZXJ0ZXJzLnJnYlt0YXJnZXRfbW9kZV0oY29udmVydGVyc1tjb2xvci5tb2RlXS5yZ2IoY29sb3IpKVxuXHRcdFx0OiB1bmRlZmluZWQ7XG5cbmV4cG9ydCBkZWZhdWx0IGNvbnZlcnRlcjtcbiIsICJpbXBvcnQgY29udmVydGVyIGZyb20gJy4vY29udmVydGVyLmpzJztcblxuY29uc3QgY29udmVydGVycyA9IHt9O1xuY29uc3QgbW9kZXMgPSB7fTtcblxuY29uc3QgcGFyc2VycyA9IFtdO1xuY29uc3QgY29sb3JQcm9maWxlcyA9IHt9O1xuXG5jb25zdCBpZGVudGl0eSA9IHYgPT4gdjtcblxuY29uc3QgdXNlTW9kZSA9IGRlZmluaXRpb24gPT4ge1xuXHRjb252ZXJ0ZXJzW2RlZmluaXRpb24ubW9kZV0gPSB7XG5cdFx0Li4uY29udmVydGVyc1tkZWZpbml0aW9uLm1vZGVdLFxuXHRcdC4uLmRlZmluaXRpb24udG9Nb2RlXG5cdH07XG5cblx0T2JqZWN0LmtleXMoZGVmaW5pdGlvbi5mcm9tTW9kZSB8fCB7fSkuZm9yRWFjaChrID0+IHtcblx0XHRpZiAoIWNvbnZlcnRlcnNba10pIHtcblx0XHRcdGNvbnZlcnRlcnNba10gPSB7fTtcblx0XHR9XG5cdFx0Y29udmVydGVyc1trXVtkZWZpbml0aW9uLm1vZGVdID0gZGVmaW5pdGlvbi5mcm9tTW9kZVtrXTtcblx0fSk7XG5cblx0Ly8gQ29sb3Igc3BhY2UgY2hhbm5lbCByYW5nZXNcblx0aWYgKCFkZWZpbml0aW9uLnJhbmdlcykge1xuXHRcdGRlZmluaXRpb24ucmFuZ2VzID0ge307XG5cdH1cblxuXHRpZiAoIWRlZmluaXRpb24uZGlmZmVyZW5jZSkge1xuXHRcdGRlZmluaXRpb24uZGlmZmVyZW5jZSA9IHt9O1xuXHR9XG5cblx0ZGVmaW5pdGlvbi5jaGFubmVscy5mb3JFYWNoKGNoYW5uZWwgPT4ge1xuXHRcdC8vIHVuZGVmaW5lZCBjaGFubmVsIHJhbmdlcyBkZWZhdWx0IHRvIHRoZSBbMCwgMV0gaW50ZXJ2YWxcblx0XHRpZiAoZGVmaW5pdGlvbi5yYW5nZXNbY2hhbm5lbF0gPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0ZGVmaW5pdGlvbi5yYW5nZXNbY2hhbm5lbF0gPSBbMCwgMV07XG5cdFx0fVxuXG5cdFx0aWYgKCFkZWZpbml0aW9uLmludGVycG9sYXRlW2NoYW5uZWxdKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoYE1pc3NpbmcgaW50ZXJwb2xhdG9yIGZvcjogJHtjaGFubmVsfWApO1xuXHRcdH1cblxuXHRcdGlmICh0eXBlb2YgZGVmaW5pdGlvbi5pbnRlcnBvbGF0ZVtjaGFubmVsXSA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdFx0ZGVmaW5pdGlvbi5pbnRlcnBvbGF0ZVtjaGFubmVsXSA9IHtcblx0XHRcdFx0dXNlOiBkZWZpbml0aW9uLmludGVycG9sYXRlW2NoYW5uZWxdXG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdGlmICghZGVmaW5pdGlvbi5pbnRlcnBvbGF0ZVtjaGFubmVsXS5maXh1cCkge1xuXHRcdFx0ZGVmaW5pdGlvbi5pbnRlcnBvbGF0ZVtjaGFubmVsXS5maXh1cCA9IGlkZW50aXR5O1xuXHRcdH1cblx0fSk7XG5cblx0bW9kZXNbZGVmaW5pdGlvbi5tb2RlXSA9IGRlZmluaXRpb247XG5cdChkZWZpbml0aW9uLnBhcnNlIHx8IFtdKS5mb3JFYWNoKHBhcnNlciA9PiB7XG5cdFx0dXNlUGFyc2VyKHBhcnNlciwgZGVmaW5pdGlvbi5tb2RlKTtcblx0fSk7XG5cblx0cmV0dXJuIGNvbnZlcnRlcihkZWZpbml0aW9uLm1vZGUpO1xufTtcblxuY29uc3QgZ2V0TW9kZSA9IG1vZGUgPT4gbW9kZXNbbW9kZV07XG5cbmNvbnN0IHVzZVBhcnNlciA9IChwYXJzZXIsIG1vZGUpID0+IHtcblx0aWYgKHR5cGVvZiBwYXJzZXIgPT09ICdzdHJpbmcnKSB7XG5cdFx0aWYgKCFtb2RlKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoYCdtb2RlJyByZXF1aXJlZCB3aGVuICdwYXJzZXInIGlzIGEgc3RyaW5nYCk7XG5cdFx0fVxuXHRcdGNvbG9yUHJvZmlsZXNbcGFyc2VyXSA9IG1vZGU7XG5cdH0gZWxzZSBpZiAodHlwZW9mIHBhcnNlciA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdGlmIChwYXJzZXJzLmluZGV4T2YocGFyc2VyKSA8IDApIHtcblx0XHRcdHBhcnNlcnMucHVzaChwYXJzZXIpO1xuXHRcdH1cblx0fVxufTtcblxuY29uc3QgcmVtb3ZlUGFyc2VyID0gcGFyc2VyID0+IHtcblx0aWYgKHR5cGVvZiBwYXJzZXIgPT09ICdzdHJpbmcnKSB7XG5cdFx0ZGVsZXRlIGNvbG9yUHJvZmlsZXNbcGFyc2VyXTtcblx0fSBlbHNlIGlmICh0eXBlb2YgcGFyc2VyID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0Y29uc3QgaWR4ID0gcGFyc2Vycy5pbmRleE9mKHBhcnNlcik7XG5cdFx0aWYgKGlkeCA+IDApIHtcblx0XHRcdHBhcnNlcnMuc3BsaWNlKGlkeCwgMSk7XG5cdFx0fVxuXHR9XG59O1xuXG5leHBvcnQge1xuXHR1c2VNb2RlLFxuXHRnZXRNb2RlLFxuXHR1c2VQYXJzZXIsXG5cdHJlbW92ZVBhcnNlcixcblx0Y29udmVydGVycyxcblx0cGFyc2Vycyxcblx0Y29sb3JQcm9maWxlc1xufTtcbiIsICJpbXBvcnQgeyBwYXJzZXJzLCBjb2xvclByb2ZpbGVzLCBnZXRNb2RlIH0gZnJvbSAnLi9tb2Rlcy5qcyc7XG5cbi8qIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb250cm9sLXJlZ2V4ICovXG5jb25zdCBJZGVudFN0YXJ0Q29kZVBvaW50ID0gL1teXFx4MDAtXFx4N0ZdfFthLXpBLVpfXS87XG5cbi8qIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb250cm9sLXJlZ2V4ICovXG5jb25zdCBJZGVudENvZGVQb2ludCA9IC9bXlxceDAwLVxceDdGXXxbLVxcd10vO1xuXG5leHBvcnQgY29uc3QgVG9rID0ge1xuXHRGdW5jdGlvbjogJ2Z1bmN0aW9uJyxcblx0SWRlbnQ6ICdpZGVudCcsXG5cdE51bWJlcjogJ251bWJlcicsXG5cdFBlcmNlbnRhZ2U6ICdwZXJjZW50YWdlJyxcblx0UGFyZW5DbG9zZTogJyknLFxuXHROb25lOiAnbm9uZScsXG5cdEh1ZTogJ2h1ZScsXG5cdEFscGhhOiAnYWxwaGEnXG59O1xuXG5sZXQgX2kgPSAwO1xuXG4vKlxuXHQ0LjMuMTAuIENoZWNrIGlmIHRocmVlIGNvZGUgcG9pbnRzIHdvdWxkIHN0YXJ0IGEgbnVtYmVyXG5cdGh0dHBzOi8vZHJhZnRzLmNzc3dnLm9yZy9jc3Mtc3ludGF4LyNzdGFydHMtd2l0aC1hLW51bWJlclxuICovXG5mdW5jdGlvbiBpc19udW0oY2hhcnMpIHtcblx0bGV0IGNoID0gY2hhcnNbX2ldO1xuXHRsZXQgY2gxID0gY2hhcnNbX2kgKyAxXTtcblx0aWYgKGNoID09PSAnLScgfHwgY2ggPT09ICcrJykge1xuXHRcdHJldHVybiAvXFxkLy50ZXN0KGNoMSkgfHwgKGNoMSA9PT0gJy4nICYmIC9cXGQvLnRlc3QoY2hhcnNbX2kgKyAyXSkpO1xuXHR9XG5cdGlmIChjaCA9PT0gJy4nKSB7XG5cdFx0cmV0dXJuIC9cXGQvLnRlc3QoY2gxKTtcblx0fVxuXHRyZXR1cm4gL1xcZC8udGVzdChjaCk7XG59XG5cbi8qXG5cdENoZWNrIGlmIHRoZSBzdHJlYW0gc3RhcnRzIHdpdGggYW4gaWRlbnRpZmllci5cbiAqL1xuXG5mdW5jdGlvbiBpc19pZGVudChjaGFycykge1xuXHRpZiAoX2kgPj0gY2hhcnMubGVuZ3RoKSB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cdGxldCBjaCA9IGNoYXJzW19pXTtcblx0aWYgKElkZW50U3RhcnRDb2RlUG9pbnQudGVzdChjaCkpIHtcblx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxuXHRpZiAoY2ggPT09ICctJykge1xuXHRcdGlmIChjaGFycy5sZW5ndGggLSBfaSA8IDIpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdFx0bGV0IGNoMSA9IGNoYXJzW19pICsgMV07XG5cdFx0aWYgKGNoMSA9PT0gJy0nIHx8IElkZW50U3RhcnRDb2RlUG9pbnQudGVzdChjaDEpKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cdHJldHVybiBmYWxzZTtcbn1cblxuLypcblx0NC4zLjMuIENvbnN1bWUgYSBudW1lcmljIHRva2VuXG5cdGh0dHBzOi8vZHJhZnRzLmNzc3dnLm9yZy9jc3Mtc3ludGF4LyNjb25zdW1lLW51bWVyaWMtdG9rZW5cbiAqL1xuXG5jb25zdCBodWVuaXRzID0ge1xuXHRkZWc6IDEsXG5cdHJhZDogMTgwIC8gTWF0aC5QSSxcblx0Z3JhZDogOSAvIDEwLFxuXHR0dXJuOiAzNjBcbn07XG5cbmZ1bmN0aW9uIG51bShjaGFycykge1xuXHRsZXQgdmFsdWUgPSAnJztcblx0aWYgKGNoYXJzW19pXSA9PT0gJy0nIHx8IGNoYXJzW19pXSA9PT0gJysnKSB7XG5cdFx0dmFsdWUgKz0gY2hhcnNbX2krK107XG5cdH1cblx0dmFsdWUgKz0gZGlnaXRzKGNoYXJzKTtcblx0aWYgKGNoYXJzW19pXSA9PT0gJy4nICYmIC9cXGQvLnRlc3QoY2hhcnNbX2kgKyAxXSkpIHtcblx0XHR2YWx1ZSArPSBjaGFyc1tfaSsrXSArIGRpZ2l0cyhjaGFycyk7XG5cdH1cblx0aWYgKGNoYXJzW19pXSA9PT0gJ2UnIHx8IGNoYXJzW19pXSA9PT0gJ0UnKSB7XG5cdFx0aWYgKFxuXHRcdFx0KGNoYXJzW19pICsgMV0gPT09ICctJyB8fCBjaGFyc1tfaSArIDFdID09PSAnKycpICYmXG5cdFx0XHQvXFxkLy50ZXN0KGNoYXJzW19pICsgMl0pXG5cdFx0KSB7XG5cdFx0XHR2YWx1ZSArPSBjaGFyc1tfaSsrXSArIGNoYXJzW19pKytdICsgZGlnaXRzKGNoYXJzKTtcblx0XHR9IGVsc2UgaWYgKC9cXGQvLnRlc3QoY2hhcnNbX2kgKyAxXSkpIHtcblx0XHRcdHZhbHVlICs9IGNoYXJzW19pKytdICsgZGlnaXRzKGNoYXJzKTtcblx0XHR9XG5cdH1cblx0aWYgKGlzX2lkZW50KGNoYXJzKSkge1xuXHRcdGxldCBpZCA9IGlkZW50KGNoYXJzKTtcblx0XHRpZiAoaWQgPT09ICdkZWcnIHx8IGlkID09PSAncmFkJyB8fCBpZCA9PT0gJ3R1cm4nIHx8IGlkID09PSAnZ3JhZCcpIHtcblx0XHRcdHJldHVybiB7IHR5cGU6IFRvay5IdWUsIHZhbHVlOiB2YWx1ZSAqIGh1ZW5pdHNbaWRdIH07XG5cdFx0fVxuXHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdH1cblx0aWYgKGNoYXJzW19pXSA9PT0gJyUnKSB7XG5cdFx0X2krKztcblx0XHRyZXR1cm4geyB0eXBlOiBUb2suUGVyY2VudGFnZSwgdmFsdWU6ICt2YWx1ZSB9O1xuXHR9XG5cdHJldHVybiB7IHR5cGU6IFRvay5OdW1iZXIsIHZhbHVlOiArdmFsdWUgfTtcbn1cblxuLypcblx0Q29uc3VtZSBkaWdpdHMuXG4gKi9cbmZ1bmN0aW9uIGRpZ2l0cyhjaGFycykge1xuXHRsZXQgdiA9ICcnO1xuXHR3aGlsZSAoL1xcZC8udGVzdChjaGFyc1tfaV0pKSB7XG5cdFx0diArPSBjaGFyc1tfaSsrXTtcblx0fVxuXHRyZXR1cm4gdjtcbn1cblxuLypcblx0Q29uc3VtZSBhbiBpZGVudGlmaWVyLlxuICovXG5mdW5jdGlvbiBpZGVudChjaGFycykge1xuXHRsZXQgdiA9ICcnO1xuXHR3aGlsZSAoX2kgPCBjaGFycy5sZW5ndGggJiYgSWRlbnRDb2RlUG9pbnQudGVzdChjaGFyc1tfaV0pKSB7XG5cdFx0diArPSBjaGFyc1tfaSsrXTtcblx0fVxuXHRyZXR1cm4gdjtcbn1cblxuLypcblx0Q29uc3VtZSBhbiBpZGVudC1saWtlIHRva2VuLlxuICovXG5mdW5jdGlvbiBpZGVudGxpa2UoY2hhcnMpIHtcblx0bGV0IHYgPSBpZGVudChjaGFycyk7XG5cdGlmIChjaGFyc1tfaV0gPT09ICcoJykge1xuXHRcdF9pKys7XG5cdFx0cmV0dXJuIHsgdHlwZTogVG9rLkZ1bmN0aW9uLCB2YWx1ZTogdiB9O1xuXHR9XG5cdGlmICh2ID09PSAnbm9uZScpIHtcblx0XHRyZXR1cm4geyB0eXBlOiBUb2suTm9uZSwgdmFsdWU6IHVuZGVmaW5lZCB9O1xuXHR9XG5cdHJldHVybiB7IHR5cGU6IFRvay5JZGVudCwgdmFsdWU6IHYgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRva2VuaXplKHN0ciA9ICcnKSB7XG5cdGxldCBjaGFycyA9IHN0ci50cmltKCk7XG5cdGxldCB0b2tlbnMgPSBbXTtcblx0bGV0IGNoO1xuXG5cdC8qIHJlc2V0IGNvdW50ZXIgKi9cblx0X2kgPSAwO1xuXG5cdHdoaWxlIChfaSA8IGNoYXJzLmxlbmd0aCkge1xuXHRcdGNoID0gY2hhcnNbX2krK107XG5cblx0XHQvKlxuXHRcdFx0Q29uc3VtZSB3aGl0ZXNwYWNlIHdpdGhvdXQgZW1pdHRpbmcgaXRcblx0XHQgKi9cblx0XHRpZiAoY2ggPT09ICdcXG4nIHx8IGNoID09PSAnXFx0JyB8fCBjaCA9PT0gJyAnKSB7XG5cdFx0XHR3aGlsZSAoXG5cdFx0XHRcdF9pIDwgY2hhcnMubGVuZ3RoICYmXG5cdFx0XHRcdChjaGFyc1tfaV0gPT09ICdcXG4nIHx8IGNoYXJzW19pXSA9PT0gJ1xcdCcgfHwgY2hhcnNbX2ldID09PSAnICcpXG5cdFx0XHQpIHtcblx0XHRcdFx0X2krKztcblx0XHRcdH1cblx0XHRcdGNvbnRpbnVlO1xuXHRcdH1cblxuXHRcdGlmIChjaCA9PT0gJywnKSB7XG5cdFx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHRcdH1cblxuXHRcdGlmIChjaCA9PT0gJyknKSB7XG5cdFx0XHR0b2tlbnMucHVzaCh7IHR5cGU6IFRvay5QYXJlbkNsb3NlIH0pO1xuXHRcdFx0Y29udGludWU7XG5cdFx0fVxuXG5cdFx0aWYgKGNoID09PSAnKycpIHtcblx0XHRcdF9pLS07XG5cdFx0XHRpZiAoaXNfbnVtKGNoYXJzKSkge1xuXHRcdFx0XHR0b2tlbnMucHVzaChudW0oY2hhcnMpKTtcblx0XHRcdFx0Y29udGludWU7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHRcdH1cblxuXHRcdGlmIChjaCA9PT0gJy0nKSB7XG5cdFx0XHRfaS0tO1xuXHRcdFx0aWYgKGlzX251bShjaGFycykpIHtcblx0XHRcdFx0dG9rZW5zLnB1c2gobnVtKGNoYXJzKSk7XG5cdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0fVxuXHRcdFx0aWYgKGlzX2lkZW50KGNoYXJzKSkge1xuXHRcdFx0XHR0b2tlbnMucHVzaCh7IHR5cGU6IFRvay5JZGVudCwgdmFsdWU6IGlkZW50KGNoYXJzKSB9KTtcblx0XHRcdFx0Y29udGludWU7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHRcdH1cblxuXHRcdGlmIChjaCA9PT0gJy4nKSB7XG5cdFx0XHRfaS0tO1xuXHRcdFx0aWYgKGlzX251bShjaGFycykpIHtcblx0XHRcdFx0dG9rZW5zLnB1c2gobnVtKGNoYXJzKSk7XG5cdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0XHR9XG5cblx0XHRpZiAoY2ggPT09ICcvJykge1xuXHRcdFx0d2hpbGUgKFxuXHRcdFx0XHRfaSA8IGNoYXJzLmxlbmd0aCAmJlxuXHRcdFx0XHQoY2hhcnNbX2ldID09PSAnXFxuJyB8fCBjaGFyc1tfaV0gPT09ICdcXHQnIHx8IGNoYXJzW19pXSA9PT0gJyAnKVxuXHRcdFx0KSB7XG5cdFx0XHRcdF9pKys7XG5cdFx0XHR9XG5cdFx0XHRsZXQgYWxwaGE7XG5cdFx0XHRpZiAoaXNfbnVtKGNoYXJzKSkge1xuXHRcdFx0XHRhbHBoYSA9IG51bShjaGFycyk7XG5cdFx0XHRcdGlmIChhbHBoYS50eXBlICE9PSBUb2suSHVlKSB7XG5cdFx0XHRcdFx0dG9rZW5zLnB1c2goeyB0eXBlOiBUb2suQWxwaGEsIHZhbHVlOiBhbHBoYSB9KTtcblx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0aWYgKGlzX2lkZW50KGNoYXJzKSkge1xuXHRcdFx0XHRpZiAoaWRlbnQoY2hhcnMpID09PSAnbm9uZScpIHtcblx0XHRcdFx0XHR0b2tlbnMucHVzaCh7XG5cdFx0XHRcdFx0XHR0eXBlOiBUb2suQWxwaGEsXG5cdFx0XHRcdFx0XHR2YWx1ZTogeyB0eXBlOiBUb2suTm9uZSwgdmFsdWU6IHVuZGVmaW5lZCB9XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdFx0fVxuXG5cdFx0aWYgKC9cXGQvLnRlc3QoY2gpKSB7XG5cdFx0XHRfaS0tO1xuXHRcdFx0dG9rZW5zLnB1c2gobnVtKGNoYXJzKSk7XG5cdFx0XHRjb250aW51ZTtcblx0XHR9XG5cblx0XHRpZiAoSWRlbnRTdGFydENvZGVQb2ludC50ZXN0KGNoKSkge1xuXHRcdFx0X2ktLTtcblx0XHRcdHRva2Vucy5wdXNoKGlkZW50bGlrZShjaGFycykpO1xuXHRcdFx0Y29udGludWU7XG5cdFx0fVxuXG5cdFx0Lypcblx0XHRcdFRyZWF0IGV2ZXJ5dGhpbmcgbm90IGFscmVhZHkgaGFuZGxlZCBhcyBhbiBlcnJvci5cblx0XHQgKi9cblx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHR9XG5cblx0cmV0dXJuIHRva2Vucztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlQ29sb3JTeW50YXgodG9rZW5zKSB7XG5cdHRva2Vucy5faSA9IDA7XG5cdGxldCB0b2tlbiA9IHRva2Vuc1t0b2tlbnMuX2krK107XG5cdGlmICghdG9rZW4gfHwgdG9rZW4udHlwZSAhPT0gVG9rLkZ1bmN0aW9uIHx8IHRva2VuLnZhbHVlICE9PSAnY29sb3InKSB7XG5cdFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0fVxuXHR0b2tlbiA9IHRva2Vuc1t0b2tlbnMuX2krK107XG5cdGlmICh0b2tlbi50eXBlICE9PSBUb2suSWRlbnQpIHtcblx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHR9XG5cdGNvbnN0IG1vZGUgPSBjb2xvclByb2ZpbGVzW3Rva2VuLnZhbHVlXTtcblx0aWYgKCFtb2RlKSB7XG5cdFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0fVxuXHRjb25zdCByZXMgPSB7IG1vZGUgfTtcblx0Y29uc3QgY29vcmRzID0gY29uc3VtZUNvb3Jkcyh0b2tlbnMsIGZhbHNlKTtcblx0aWYgKCFjb29yZHMpIHtcblx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHR9XG5cdGNvbnN0IGNoYW5uZWxzID0gZ2V0TW9kZShtb2RlKS5jaGFubmVscztcblx0Zm9yIChsZXQgaWkgPSAwLCBjLCBjaDsgaWkgPCBjaGFubmVscy5sZW5ndGg7IGlpKyspIHtcblx0XHRjID0gY29vcmRzW2lpXTtcblx0XHRjaCA9IGNoYW5uZWxzW2lpXTtcblx0XHRpZiAoYy50eXBlICE9PSBUb2suTm9uZSkge1xuXHRcdFx0cmVzW2NoXSA9IGMudHlwZSA9PT0gVG9rLk51bWJlciA/IGMudmFsdWUgOiBjLnZhbHVlIC8gMTAwO1xuXHRcdFx0aWYgKGNoID09PSAnYWxwaGEnKSB7XG5cdFx0XHRcdHJlc1tjaF0gPSBNYXRoLm1heCgwLCBNYXRoLm1pbigxLCByZXNbY2hdKSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cdHJldHVybiByZXM7XG59XG5cbmZ1bmN0aW9uIGNvbnN1bWVDb29yZHModG9rZW5zLCBpbmNsdWRlSHVlKSB7XG5cdGNvbnN0IGNvb3JkcyA9IFtdO1xuXHRsZXQgdG9rZW47XG5cdHdoaWxlICh0b2tlbnMuX2kgPCB0b2tlbnMubGVuZ3RoKSB7XG5cdFx0dG9rZW4gPSB0b2tlbnNbdG9rZW5zLl9pKytdO1xuXHRcdGlmIChcblx0XHRcdHRva2VuLnR5cGUgPT09IFRvay5Ob25lIHx8XG5cdFx0XHR0b2tlbi50eXBlID09PSBUb2suTnVtYmVyIHx8XG5cdFx0XHR0b2tlbi50eXBlID09PSBUb2suQWxwaGEgfHxcblx0XHRcdHRva2VuLnR5cGUgPT09IFRvay5QZXJjZW50YWdlIHx8XG5cdFx0XHQoaW5jbHVkZUh1ZSAmJiB0b2tlbi50eXBlID09PSBUb2suSHVlKVxuXHRcdCkge1xuXHRcdFx0Y29vcmRzLnB1c2godG9rZW4pO1xuXHRcdFx0Y29udGludWU7XG5cdFx0fVxuXHRcdGlmICh0b2tlbi50eXBlID09PSBUb2suUGFyZW5DbG9zZSkge1xuXHRcdFx0aWYgKHRva2Vucy5faSA8IHRva2Vucy5sZW5ndGgpIHtcblx0XHRcdFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0XHRcdH1cblx0XHRcdGNvbnRpbnVlO1xuXHRcdH1cblx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHR9XG5cblx0aWYgKGNvb3Jkcy5sZW5ndGggPCAzIHx8IGNvb3Jkcy5sZW5ndGggPiA0KSB7XG5cdFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0fVxuXG5cdGlmIChjb29yZHMubGVuZ3RoID09PSA0KSB7XG5cdFx0aWYgKGNvb3Jkc1szXS50eXBlICE9PSBUb2suQWxwaGEpIHtcblx0XHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdFx0fVxuXHRcdGNvb3Jkc1szXSA9IGNvb3Jkc1szXS52YWx1ZTtcblx0fVxuXHRpZiAoY29vcmRzLmxlbmd0aCA9PT0gMykge1xuXHRcdGNvb3Jkcy5wdXNoKHsgdHlwZTogVG9rLk5vbmUsIHZhbHVlOiB1bmRlZmluZWQgfSk7XG5cdH1cblxuXHRyZXR1cm4gY29vcmRzLmV2ZXJ5KGMgPT4gYy50eXBlICE9PSBUb2suQWxwaGEpID8gY29vcmRzIDogdW5kZWZpbmVkO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VNb2Rlcm5TeW50YXgodG9rZW5zLCBpbmNsdWRlSHVlKSB7XG5cdHRva2Vucy5faSA9IDA7XG5cdGxldCB0b2tlbiA9IHRva2Vuc1t0b2tlbnMuX2krK107XG5cdGlmICghdG9rZW4gfHwgdG9rZW4udHlwZSAhPT0gVG9rLkZ1bmN0aW9uKSB7XG5cdFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0fVxuXHRsZXQgY29vcmRzID0gY29uc3VtZUNvb3Jkcyh0b2tlbnMsIGluY2x1ZGVIdWUpO1xuXHRpZiAoIWNvb3Jkcykge1xuXHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdH1cblx0Y29vcmRzLnVuc2hpZnQodG9rZW4udmFsdWUpO1xuXHRyZXR1cm4gY29vcmRzO1xufVxuXG5jb25zdCBwYXJzZSA9IGNvbG9yID0+IHtcblx0aWYgKHR5cGVvZiBjb2xvciAhPT0gJ3N0cmluZycpIHtcblx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHR9XG5cdGNvbnN0IHRva2VucyA9IHRva2VuaXplKGNvbG9yKTtcblx0Y29uc3QgcGFyc2VkID0gdG9rZW5zID8gcGFyc2VNb2Rlcm5TeW50YXgodG9rZW5zLCB0cnVlKSA6IHVuZGVmaW5lZDtcblx0bGV0IHJlc3VsdCA9IHVuZGVmaW5lZDtcblx0bGV0IGkgPSAwO1xuXHRsZXQgbGVuID0gcGFyc2Vycy5sZW5ndGg7XG5cdHdoaWxlIChpIDwgbGVuKSB7XG5cdFx0aWYgKChyZXN1bHQgPSBwYXJzZXJzW2krK10oY29sb3IsIHBhcnNlZCkpICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdHJldHVybiByZXN1bHQ7XG5cdFx0fVxuXHR9XG5cdHJldHVybiB0b2tlbnMgPyBwYXJzZUNvbG9yU3ludGF4KHRva2VucykgOiB1bmRlZmluZWQ7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBwYXJzZTtcbiIsICJpbXBvcnQgeyBUb2sgfSBmcm9tICcuLi9wYXJzZS5qcyc7XG5cbmZ1bmN0aW9uIHBhcnNlUmdiKGNvbG9yLCBwYXJzZWQpIHtcblx0aWYgKCFwYXJzZWQgfHwgKHBhcnNlZFswXSAhPT0gJ3JnYicgJiYgcGFyc2VkWzBdICE9PSAncmdiYScpKSB7XG5cdFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0fVxuXHRjb25zdCByZXMgPSB7IG1vZGU6ICdyZ2InIH07XG5cdGNvbnN0IFssIHIsIGcsIGIsIGFscGhhXSA9IHBhcnNlZDtcblx0aWYgKHIudHlwZSA9PT0gVG9rLkh1ZSB8fCBnLnR5cGUgPT09IFRvay5IdWUgfHwgYi50eXBlID09PSBUb2suSHVlKSB7XG5cdFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0fVxuXHRpZiAoci50eXBlICE9PSBUb2suTm9uZSkge1xuXHRcdHJlcy5yID0gci50eXBlID09PSBUb2suTnVtYmVyID8gci52YWx1ZSAvIDI1NSA6IHIudmFsdWUgLyAxMDA7XG5cdH1cblx0aWYgKGcudHlwZSAhPT0gVG9rLk5vbmUpIHtcblx0XHRyZXMuZyA9IGcudHlwZSA9PT0gVG9rLk51bWJlciA/IGcudmFsdWUgLyAyNTUgOiBnLnZhbHVlIC8gMTAwO1xuXHR9XG5cdGlmIChiLnR5cGUgIT09IFRvay5Ob25lKSB7XG5cdFx0cmVzLmIgPSBiLnR5cGUgPT09IFRvay5OdW1iZXIgPyBiLnZhbHVlIC8gMjU1IDogYi52YWx1ZSAvIDEwMDtcblx0fVxuXHRpZiAoYWxwaGEudHlwZSAhPT0gVG9rLk5vbmUpIHtcblx0XHRyZXMuYWxwaGEgPSBNYXRoLm1pbihcblx0XHRcdDEsXG5cdFx0XHRNYXRoLm1heChcblx0XHRcdFx0MCxcblx0XHRcdFx0YWxwaGEudHlwZSA9PT0gVG9rLk51bWJlciA/IGFscGhhLnZhbHVlIDogYWxwaGEudmFsdWUgLyAxMDBcblx0XHRcdClcblx0XHQpO1xuXHR9XG5cblx0cmV0dXJuIHJlcztcbn1cblxuZXhwb3J0IGRlZmF1bHQgcGFyc2VSZ2I7XG4iLCAiY29uc3QgcGFyc2VUcmFuc3BhcmVudCA9IGMgPT5cblx0YyA9PT0gJ3RyYW5zcGFyZW50J1xuXHRcdD8geyBtb2RlOiAncmdiJywgcjogMCwgZzogMCwgYjogMCwgYWxwaGE6IDAgfVxuXHRcdDogdW5kZWZpbmVkO1xuXG5leHBvcnQgZGVmYXVsdCBwYXJzZVRyYW5zcGFyZW50O1xuIiwgImNvbnN0IGxlcnAgPSAoYSwgYiwgdCkgPT4gYSArIHQgKiAoYiAtIGEpO1xuY29uc3QgdW5sZXJwID0gKGEsIGIsIHYpID0+ICh2IC0gYSkgLyAoYiAtIGEpO1xuXG5jb25zdCBibGVycCA9IChhMDAsIGEwMSwgYTEwLCBhMTEsIHR4LCB0eSkgPT4ge1xuXHRyZXR1cm4gbGVycChsZXJwKGEwMCwgYTAxLCB0eCksIGxlcnAoYTEwLCBhMTEsIHR4KSwgdHkpO1xufTtcblxuY29uc3QgdHJpbGVycCA9IChcblx0YTAwMCxcblx0YTAxMCxcblx0YTEwMCxcblx0YTExMCxcblx0YTAwMSxcblx0YTAxMSxcblx0YTEwMSxcblx0YTExMSxcblx0dHgsXG5cdHR5LFxuXHR0elxuKSA9PiB7XG5cdHJldHVybiBsZXJwKFxuXHRcdGJsZXJwKGEwMDAsIGEwMTAsIGExMDAsIGExMTAsIHR4LCB0eSksXG5cdFx0YmxlcnAoYTAwMSwgYTAxMSwgYTEwMSwgYTExMSwgdHgsIHR5KSxcblx0XHR0elxuXHQpO1xufTtcblxuZXhwb3J0IHsgbGVycCwgYmxlcnAsIHRyaWxlcnAsIHVubGVycCB9O1xuIiwgImNvbnN0IGdldF9jbGFzc2VzID0gYXJyID0+IHtcblx0bGV0IGNsYXNzZXMgPSBbXTtcblx0Zm9yIChsZXQgaSA9IDA7IGkgPCBhcnIubGVuZ3RoIC0gMTsgaSsrKSB7XG5cdFx0bGV0IGEgPSBhcnJbaV07XG5cdFx0bGV0IGIgPSBhcnJbaSArIDFdO1xuXHRcdGlmIChhID09PSB1bmRlZmluZWQgJiYgYiA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRjbGFzc2VzLnB1c2godW5kZWZpbmVkKTtcblx0XHR9IGVsc2UgaWYgKGEgIT09IHVuZGVmaW5lZCAmJiBiICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdGNsYXNzZXMucHVzaChbYSwgYl0pO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRjbGFzc2VzLnB1c2goYSAhPT0gdW5kZWZpbmVkID8gW2EsIGFdIDogW2IsIGJdKTtcblx0XHR9XG5cdH1cblx0cmV0dXJuIGNsYXNzZXM7XG59O1xuXG5jb25zdCBpbnRlcnBvbGF0b3JQaWVjZXdpc2UgPSBpbnRlcnBvbGF0b3IgPT4gYXJyID0+IHtcblx0bGV0IGNsYXNzZXMgPSBnZXRfY2xhc3NlcyhhcnIpO1xuXHRyZXR1cm4gdCA9PiB7XG5cdFx0bGV0IGNscyA9IHQgKiBjbGFzc2VzLmxlbmd0aDtcblx0XHRsZXQgaWR4ID0gdCA+PSAxID8gY2xhc3Nlcy5sZW5ndGggLSAxIDogTWF0aC5tYXgoTWF0aC5mbG9vcihjbHMpLCAwKTtcblx0XHRsZXQgcGFpciA9IGNsYXNzZXNbaWR4XTtcblx0XHRyZXR1cm4gcGFpciA9PT0gdW5kZWZpbmVkXG5cdFx0XHQ/IHVuZGVmaW5lZFxuXHRcdFx0OiBpbnRlcnBvbGF0b3IocGFpclswXSwgcGFpclsxXSwgY2xzIC0gaWR4KTtcblx0fTtcbn07XG5cbmV4cG9ydCB7IGludGVycG9sYXRvclBpZWNld2lzZSB9O1xuIiwgImltcG9ydCB7IGxlcnAgfSBmcm9tICcuL2xlcnAuanMnO1xuaW1wb3J0IHsgaW50ZXJwb2xhdG9yUGllY2V3aXNlIH0gZnJvbSAnLi9waWVjZXdpc2UuanMnO1xuXG5leHBvcnQgY29uc3QgaW50ZXJwb2xhdG9yTGluZWFyID0gaW50ZXJwb2xhdG9yUGllY2V3aXNlKGxlcnApO1xuIiwgImNvbnN0IGZpeHVwQWxwaGEgPSBhcnIgPT4ge1xuXHRsZXQgc29tZV9kZWZpbmVkID0gZmFsc2U7XG5cdGxldCByZXMgPSBhcnIubWFwKHYgPT4ge1xuXHRcdGlmICh2ICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdHNvbWVfZGVmaW5lZCA9IHRydWU7XG5cdFx0XHRyZXR1cm4gdjtcblx0XHR9XG5cdFx0cmV0dXJuIDE7XG5cdH0pO1xuXHRyZXR1cm4gc29tZV9kZWZpbmVkID8gcmVzIDogYXJyO1xufTtcblxuZXhwb3J0IHsgZml4dXBBbHBoYSB9O1xuIiwgImltcG9ydCBwYXJzZU5hbWVkIGZyb20gJy4vcGFyc2VOYW1lZC5qcyc7XG5pbXBvcnQgcGFyc2VIZXggZnJvbSAnLi9wYXJzZUhleC5qcyc7XG5pbXBvcnQgcGFyc2VSZ2JMZWdhY3kgZnJvbSAnLi9wYXJzZVJnYkxlZ2FjeS5qcyc7XG5pbXBvcnQgcGFyc2VSZ2IgZnJvbSAnLi9wYXJzZVJnYi5qcyc7XG5pbXBvcnQgcGFyc2VUcmFuc3BhcmVudCBmcm9tICcuL3BhcnNlVHJhbnNwYXJlbnQuanMnO1xuaW1wb3J0IHsgaW50ZXJwb2xhdG9yTGluZWFyIH0gZnJvbSAnLi4vaW50ZXJwb2xhdGUvbGluZWFyLmpzJztcbmltcG9ydCB7IGZpeHVwQWxwaGEgfSBmcm9tICcuLi9maXh1cC9hbHBoYS5qcyc7XG5cbi8qXG5cdHNSR0IgY29sb3Igc3BhY2VcbiAqL1xuXG5jb25zdCBkZWZpbml0aW9uID0ge1xuXHRtb2RlOiAncmdiJyxcblx0Y2hhbm5lbHM6IFsncicsICdnJywgJ2InLCAnYWxwaGEnXSxcblx0cGFyc2U6IFtcblx0XHRwYXJzZVJnYixcblx0XHRwYXJzZUhleCxcblx0XHRwYXJzZVJnYkxlZ2FjeSxcblx0XHRwYXJzZU5hbWVkLFxuXHRcdHBhcnNlVHJhbnNwYXJlbnQsXG5cdFx0J3NyZ2InXG5cdF0sXG5cdHNlcmlhbGl6ZTogJ3NyZ2InLFxuXHRpbnRlcnBvbGF0ZToge1xuXHRcdHI6IGludGVycG9sYXRvckxpbmVhcixcblx0XHRnOiBpbnRlcnBvbGF0b3JMaW5lYXIsXG5cdFx0YjogaW50ZXJwb2xhdG9yTGluZWFyLFxuXHRcdGFscGhhOiB7IHVzZTogaW50ZXJwb2xhdG9yTGluZWFyLCBmaXh1cDogZml4dXBBbHBoYSB9XG5cdH0sXG5cdGdhbXV0OiB0cnVlLFxuXHR3aGl0ZTogeyByOiAxLCBnOiAxLCBiOiAxIH0sXG5cdGJsYWNrOiB7IHI6IDAsIGc6IDAsIGI6IDAgfVxufTtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5pdGlvbjtcbiIsICIvKlxuXHRDb252ZXJ0IEE5OCBSR0IgdmFsdWVzIHRvIENJRSBYWVogRDY1XG5cblx0UmVmZXJlbmNlczpcblx0XHQqIGh0dHBzOi8vZHJhZnRzLmNzc3dnLm9yZy9jc3MtY29sb3IvI2NvbG9yLWNvbnZlcnNpb24tY29kZVxuXHRcdCogaHR0cDovL3d3dy5icnVjZWxpbmRibG9vbS5jb20vaW5kZXguaHRtbD9FcW5fUkdCX1hZWl9NYXRyaXguaHRtbFxuXHRcdCogaHR0cHM6Ly93d3cuYWRvYmUuY29tL2RpZ2l0YWxpbWFnL3BkZnMvQWRvYmVSR0IxOTk4LnBkZlxuKi9cblxuY29uc3QgbGluZWFyaXplID0gKHYgPSAwKSA9PiBNYXRoLnBvdyhNYXRoLmFicyh2KSwgNTYzIC8gMjU2KSAqIE1hdGguc2lnbih2KTtcblxuY29uc3QgY29udmVydEE5OFRvWHl6NjUgPSBhOTggPT4ge1xuXHRsZXQgciA9IGxpbmVhcml6ZShhOTgucik7XG5cdGxldCBnID0gbGluZWFyaXplKGE5OC5nKTtcblx0bGV0IGIgPSBsaW5lYXJpemUoYTk4LmIpO1xuXHRsZXQgcmVzID0ge1xuXHRcdG1vZGU6ICd4eXo2NScsXG5cdFx0eDpcblx0XHRcdDAuNTc2NjY5MDQyOTEwMTMwNSAqIHIgK1xuXHRcdFx0MC4xODU1NTgyMzc5MDY1NDYzICogZyArXG5cdFx0XHQwLjE4ODIyODY0NjIzNDk5NDcgKiBiLFxuXHRcdHk6XG5cdFx0XHQwLjI5NzM0NDk3NTI1MDUzNiAqIHIgK1xuXHRcdFx0MC42MjczNjM1NjYyNTU0NjYxICogZyArXG5cdFx0XHQwLjA3NTI5MTQ1ODQ5Mzk5NzkgKiBiLFxuXHRcdHo6XG5cdFx0XHQwLjAyNzAzMTM2MTM4NjQxMjMgKiByICtcblx0XHRcdDAuMDcwNjg4ODUyNTM1ODI3MiAqIGcgK1xuXHRcdFx0MC45OTEzMzc1MzY4Mzc2Mzg2ICogYlxuXHR9O1xuXHRpZiAoYTk4LmFscGhhICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXMuYWxwaGEgPSBhOTguYWxwaGE7XG5cdH1cblx0cmV0dXJuIHJlcztcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNvbnZlcnRBOThUb1h5ejY1O1xuIiwgIi8qXG5cdENvbnZlcnQgQ0lFIFhZWiBENjUgdmFsdWVzIHRvIEE5OCBSR0JcblxuXHRSZWZlcmVuY2VzOlxuXHRcdCogaHR0cHM6Ly9kcmFmdHMuY3Nzd2cub3JnL2Nzcy1jb2xvci8jY29sb3ItY29udmVyc2lvbi1jb2RlXG5cdFx0KiBodHRwOi8vd3d3LmJydWNlbGluZGJsb29tLmNvbS9pbmRleC5odG1sP0Vxbl9SR0JfWFlaX01hdHJpeC5odG1sXG4qL1xuXG5jb25zdCBnYW1tYSA9IHYgPT4gTWF0aC5wb3coTWF0aC5hYnModiksIDI1NiAvIDU2MykgKiBNYXRoLnNpZ24odik7XG5cbmNvbnN0IGNvbnZlcnRYeXo2NVRvQTk4ID0gKHsgeCwgeSwgeiwgYWxwaGEgfSkgPT4ge1xuXHRpZiAoeCA9PT0gdW5kZWZpbmVkKSB4ID0gMDtcblx0aWYgKHkgPT09IHVuZGVmaW5lZCkgeSA9IDA7XG5cdGlmICh6ID09PSB1bmRlZmluZWQpIHogPSAwO1xuXHRsZXQgcmVzID0ge1xuXHRcdG1vZGU6ICdhOTgnLFxuXHRcdHI6IGdhbW1hKFxuXHRcdFx0eCAqIDIuMDQxNTg3OTAzODEwNzQ2NSAtXG5cdFx0XHRcdHkgKiAwLjU2NTAwNjk3NDI3ODg1OTcgLVxuXHRcdFx0XHQwLjM0NDczMTM1MDc3ODMyOTcgKiB6XG5cdFx0KSxcblx0XHRnOiBnYW1tYShcblx0XHRcdHggKiAtMC45NjkyNDM2MzYyODA4Nzk4ICtcblx0XHRcdFx0eSAqIDEuODc1OTY3NTAxNTA3NzIwNiArXG5cdFx0XHRcdDAuMDQxNTU1MDU3NDA3MTc1NiAqIHpcblx0XHQpLFxuXHRcdGI6IGdhbW1hKFxuXHRcdFx0eCAqIDAuMDEzNDQ0MjgwNjMyMDMxMiAtXG5cdFx0XHRcdHkgKiAwLjExODM2MjM5MjIzMTAxODQgK1xuXHRcdFx0XHQxLjAxNTE3NDk5NDM5MTIwNTggKiB6XG5cdFx0KVxuXHR9O1xuXHRpZiAoYWxwaGEgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJlcy5hbHBoYSA9IGFscGhhO1xuXHR9XG5cdHJldHVybiByZXM7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBjb252ZXJ0WHl6NjVUb0E5ODtcbiIsICJjb25zdCBmbiA9IChjID0gMCkgPT4ge1xuXHRjb25zdCBhYnMgPSBNYXRoLmFicyhjKTtcblx0aWYgKGFicyA8PSAwLjA0MDQ1KSB7XG5cdFx0cmV0dXJuIGMgLyAxMi45Mjtcblx0fVxuXHRyZXR1cm4gKE1hdGguc2lnbihjKSB8fCAxKSAqIE1hdGgucG93KChhYnMgKyAwLjA1NSkgLyAxLjA1NSwgMi40KTtcbn07XG5cbmNvbnN0IGNvbnZlcnRSZ2JUb0xyZ2IgPSAoeyByLCBnLCBiLCBhbHBoYSB9KSA9PiB7XG5cdGxldCByZXMgPSB7XG5cdFx0bW9kZTogJ2xyZ2InLFxuXHRcdHI6IGZuKHIpLFxuXHRcdGc6IGZuKGcpLFxuXHRcdGI6IGZuKGIpXG5cdH07XG5cdGlmIChhbHBoYSAhPT0gdW5kZWZpbmVkKSByZXMuYWxwaGEgPSBhbHBoYTtcblx0cmV0dXJuIHJlcztcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNvbnZlcnRSZ2JUb0xyZ2I7XG4iLCAiLypcblx0Q29udmVydCBzUkdCIHZhbHVlcyB0byBDSUUgWFlaIEQ2NVxuXG5cdFJlZmVyZW5jZXM6XG5cdFx0KiBodHRwczovL2RyYWZ0cy5jc3N3Zy5vcmcvY3NzLWNvbG9yLyNjb2xvci1jb252ZXJzaW9uLWNvZGVcblx0XHQqIGh0dHA6Ly93d3cuYnJ1Y2VsaW5kYmxvb20uY29tL2luZGV4Lmh0bWw/RXFuX1JHQl9YWVpfTWF0cml4Lmh0bWxcblx0XHQqIGh0dHBzOi8vb2JzZXJ2YWJsZWhxLmNvbS9AZGFuYnVyem8vY29sb3ItbWF0cml4LWNhbGN1bGF0b3JcbiovXG5cbmltcG9ydCBjb252ZXJ0UmdiVG9McmdiIGZyb20gJy4uL2xyZ2IvY29udmVydFJnYlRvTHJnYi5qcyc7XG5cbmNvbnN0IGNvbnZlcnRSZ2JUb1h5ejY1ID0gcmdiID0+IHtcblx0bGV0IHsgciwgZywgYiwgYWxwaGEgfSA9IGNvbnZlcnRSZ2JUb0xyZ2IocmdiKTtcblx0bGV0IHJlcyA9IHtcblx0XHRtb2RlOiAneHl6NjUnLFxuXHRcdHg6XG5cdFx0XHQwLjQxMjM5MDc5OTI2NTk1OTMgKiByICtcblx0XHRcdDAuMzU3NTg0MzM5MzgzODc4ICogZyArXG5cdFx0XHQwLjE4MDQ4MDc4ODQwMTgzNDMgKiBiLFxuXHRcdHk6XG5cdFx0XHQwLjIxMjYzOTAwNTg3MTUxMDIgKiByICtcblx0XHRcdDAuNzE1MTY4Njc4NzY3NzU2ICogZyArXG5cdFx0XHQwLjA3MjE5MjMxNTM2MDczMzcgKiBiLFxuXHRcdHo6XG5cdFx0XHQwLjAxOTMzMDgxODcxNTU5MTggKiByICtcblx0XHRcdDAuMTE5MTk0Nzc5Nzk0NjI2ICogZyArXG5cdFx0XHQwLjk1MDUzMjE1MjI0OTY2MDcgKiBiXG5cdH07XG5cdGlmIChhbHBoYSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmVzLmFscGhhID0gYWxwaGE7XG5cdH1cblx0cmV0dXJuIHJlcztcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNvbnZlcnRSZ2JUb1h5ejY1O1xuIiwgImNvbnN0IGZuID0gKGMgPSAwKSA9PiB7XG5cdGNvbnN0IGFicyA9IE1hdGguYWJzKGMpO1xuXHRpZiAoYWJzID4gMC4wMDMxMzA4KSB7XG5cdFx0cmV0dXJuIChNYXRoLnNpZ24oYykgfHwgMSkgKiAoMS4wNTUgKiBNYXRoLnBvdyhhYnMsIDEgLyAyLjQpIC0gMC4wNTUpO1xuXHR9XG5cdHJldHVybiBjICogMTIuOTI7XG59O1xuXG5jb25zdCBjb252ZXJ0THJnYlRvUmdiID0gKHsgciwgZywgYiwgYWxwaGEgfSwgbW9kZSA9ICdyZ2InKSA9PiB7XG5cdGxldCByZXMgPSB7XG5cdFx0bW9kZSxcblx0XHRyOiBmbihyKSxcblx0XHRnOiBmbihnKSxcblx0XHRiOiBmbihiKVxuXHR9O1xuXHRpZiAoYWxwaGEgIT09IHVuZGVmaW5lZCkgcmVzLmFscGhhID0gYWxwaGE7XG5cdHJldHVybiByZXM7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBjb252ZXJ0THJnYlRvUmdiO1xuIiwgIi8qXG5cdENJRSBYWVogRDY1IHZhbHVlcyB0byBzUkdCLlxuXG5cdFJlZmVyZW5jZXM6XG5cdFx0KiBodHRwczovL2RyYWZ0cy5jc3N3Zy5vcmcvY3NzLWNvbG9yLyNjb2xvci1jb252ZXJzaW9uLWNvZGVcblx0XHQqIGh0dHA6Ly93d3cuYnJ1Y2VsaW5kYmxvb20uY29tL2luZGV4Lmh0bWw/RXFuX1JHQl9YWVpfTWF0cml4Lmh0bWxcblx0XHQqIGh0dHBzOi8vb2JzZXJ2YWJsZWhxLmNvbS9AZGFuYnVyem8vY29sb3ItbWF0cml4LWNhbGN1bGF0b3JcbiovXG5cbmltcG9ydCBjb252ZXJ0THJnYlRvUmdiIGZyb20gJy4uL2xyZ2IvY29udmVydExyZ2JUb1JnYi5qcyc7XG5cbmNvbnN0IGNvbnZlcnRYeXo2NVRvUmdiID0gKHsgeCwgeSwgeiwgYWxwaGEgfSkgPT4ge1xuXHRpZiAoeCA9PT0gdW5kZWZpbmVkKSB4ID0gMDtcblx0aWYgKHkgPT09IHVuZGVmaW5lZCkgeSA9IDA7XG5cdGlmICh6ID09PSB1bmRlZmluZWQpIHogPSAwO1xuXHRsZXQgcmVzID0gY29udmVydExyZ2JUb1JnYih7XG5cdFx0cjpcblx0XHRcdHggKiAzLjI0MDk2OTk0MTkwNDUyMjYgLVxuXHRcdFx0eSAqIDEuNTM3MzgzMTc3NTcwMDkzOSAtXG5cdFx0XHQwLjQ5ODYxMDc2MDI5MzAwMzQgKiB6LFxuXHRcdGc6XG5cdFx0XHR4ICogLTAuOTY5MjQzNjM2MjgwODc5NiArXG5cdFx0XHR5ICogMS44NzU5Njc1MDE1MDc3MjA0ICtcblx0XHRcdDAuMDQxNTU1MDU3NDA3MTc1NiAqIHosXG5cdFx0Yjpcblx0XHRcdHggKiAwLjA1NTYzMDA3OTY5Njk5MzYgLVxuXHRcdFx0eSAqIDAuMjAzOTc2OTU4ODg4OTc2NSArXG5cdFx0XHQxLjA1Njk3MTUxNDI0Mjg3ODQgKiB6XG5cdH0pO1xuXHRpZiAoYWxwaGEgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJlcy5hbHBoYSA9IGFscGhhO1xuXHR9XG5cdHJldHVybiByZXM7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBjb252ZXJ0WHl6NjVUb1JnYjtcbiIsICJpbXBvcnQgcmdiIGZyb20gJy4uL3JnYi9kZWZpbml0aW9uLmpzJztcblxuaW1wb3J0IGNvbnZlcnRBOThUb1h5ejY1IGZyb20gJy4vY29udmVydEE5OFRvWHl6NjUuanMnO1xuaW1wb3J0IGNvbnZlcnRYeXo2NVRvQTk4IGZyb20gJy4vY29udmVydFh5ejY1VG9BOTguanMnO1xuaW1wb3J0IGNvbnZlcnRSZ2JUb1h5ejY1IGZyb20gJy4uL3h5ejY1L2NvbnZlcnRSZ2JUb1h5ejY1LmpzJztcbmltcG9ydCBjb252ZXJ0WHl6NjVUb1JnYiBmcm9tICcuLi94eXo2NS9jb252ZXJ0WHl6NjVUb1JnYi5qcyc7XG5cbmNvbnN0IGRlZmluaXRpb24gPSB7XG5cdC4uLnJnYixcblx0bW9kZTogJ2E5OCcsXG5cdHBhcnNlOiBbJ2E5OC1yZ2InXSxcblx0c2VyaWFsaXplOiAnYTk4LXJnYicsXG5cblx0ZnJvbU1vZGU6IHtcblx0XHRyZ2I6IGNvbG9yID0+IGNvbnZlcnRYeXo2NVRvQTk4KGNvbnZlcnRSZ2JUb1h5ejY1KGNvbG9yKSksXG5cdFx0eHl6NjU6IGNvbnZlcnRYeXo2NVRvQTk4XG5cdH0sXG5cblx0dG9Nb2RlOiB7XG5cdFx0cmdiOiBjb2xvciA9PiBjb252ZXJ0WHl6NjVUb1JnYihjb252ZXJ0QTk4VG9YeXo2NShjb2xvcikpLFxuXHRcdHh5ejY1OiBjb252ZXJ0QTk4VG9YeXo2NVxuXHR9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbml0aW9uO1xuIiwgImNvbnN0IG5vcm1hbGl6ZUh1ZSA9IGh1ZSA9PiAoKGh1ZSA9IGh1ZSAlIDM2MCkgPCAwID8gaHVlICsgMzYwIDogaHVlKTtcblxuZXhwb3J0IGRlZmF1bHQgbm9ybWFsaXplSHVlO1xuIiwgImltcG9ydCBub3JtYWxpemVIdWUgZnJvbSAnLi4vdXRpbC9ub3JtYWxpemVIdWUuanMnO1xuXG5jb25zdCBodWUgPSAoaHVlcywgZm4pID0+IHtcblx0cmV0dXJuIGh1ZXNcblx0XHQubWFwKChodWUsIGlkeCwgYXJyKSA9PiB7XG5cdFx0XHRpZiAoaHVlID09PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0cmV0dXJuIGh1ZTtcblx0XHRcdH1cblx0XHRcdGxldCBub3JtYWxpemVkID0gbm9ybWFsaXplSHVlKGh1ZSk7XG5cdFx0XHRpZiAoaWR4ID09PSAwIHx8IGh1ZXNbaWR4IC0gMV0gPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRyZXR1cm4gbm9ybWFsaXplZDtcblx0XHRcdH1cblx0XHRcdHJldHVybiBmbihub3JtYWxpemVkIC0gbm9ybWFsaXplSHVlKGFycltpZHggLSAxXSkpO1xuXHRcdH0pXG5cdFx0LnJlZHVjZSgoYWNjLCBjdXJyKSA9PiB7XG5cdFx0XHRpZiAoXG5cdFx0XHRcdCFhY2MubGVuZ3RoIHx8XG5cdFx0XHRcdGN1cnIgPT09IHVuZGVmaW5lZCB8fFxuXHRcdFx0XHRhY2NbYWNjLmxlbmd0aCAtIDFdID09PSB1bmRlZmluZWRcblx0XHRcdCkge1xuXHRcdFx0XHRhY2MucHVzaChjdXJyKTtcblx0XHRcdFx0cmV0dXJuIGFjYztcblx0XHRcdH1cblx0XHRcdGFjYy5wdXNoKGN1cnIgKyBhY2NbYWNjLmxlbmd0aCAtIDFdKTtcblx0XHRcdHJldHVybiBhY2M7XG5cdFx0fSwgW10pO1xufTtcblxuY29uc3QgZml4dXBIdWVTaG9ydGVyID0gYXJyID0+XG5cdGh1ZShhcnIsIGQgPT4gKE1hdGguYWJzKGQpIDw9IDE4MCA/IGQgOiBkIC0gMzYwICogTWF0aC5zaWduKGQpKSk7XG5jb25zdCBmaXh1cEh1ZUxvbmdlciA9IGFyciA9PlxuXHRodWUoYXJyLCBkID0+IChNYXRoLmFicyhkKSA+PSAxODAgfHwgZCA9PT0gMCA/IGQgOiBkIC0gMzYwICogTWF0aC5zaWduKGQpKSk7XG5jb25zdCBmaXh1cEh1ZUluY3JlYXNpbmcgPSBhcnIgPT4gaHVlKGFyciwgZCA9PiAoZCA+PSAwID8gZCA6IGQgKyAzNjApKTtcbmNvbnN0IGZpeHVwSHVlRGVjcmVhc2luZyA9IGFyciA9PiBodWUoYXJyLCBkID0+IChkIDw9IDAgPyBkIDogZCAtIDM2MCkpO1xuXG5leHBvcnQge1xuXHRmaXh1cEh1ZVNob3J0ZXIsXG5cdGZpeHVwSHVlTG9uZ2VyLFxuXHRmaXh1cEh1ZUluY3JlYXNpbmcsXG5cdGZpeHVwSHVlRGVjcmVhc2luZ1xufTtcbiIsICJleHBvcnQgY29uc3QgTSA9IFstMC4xNDg2MSwgMS43ODI3NywgLTAuMjkyMjcsIC0wLjkwNjQ5LCAxLjk3Mjk0LCAwXTtcblxuZXhwb3J0IGNvbnN0IGRlZ1RvUmFkID0gTWF0aC5QSSAvIDE4MDtcbmV4cG9ydCBjb25zdCByYWRUb0RlZyA9IDE4MCAvIE1hdGguUEk7XG4iLCAiLypcblx0Q29udmVydCBhIFJHQiBjb2xvciB0byB0aGUgQ3ViZWhlbGl4IEhTTCBjb2xvciBzcGFjZS5cblxuXHRUaGlzIGNvbXB1dGF0aW9uIGlzIG5vdCBwcmVzZW50IGluIEdyZWVuJ3MgcGFwZXI6XG5cdGh0dHBzOi8vYXJ4aXYub3JnL3BkZi8xMTA4LjUwODMucGRmXG5cblx0Li4uYnV0IGNhbiBiZSBkZXJpdmVkIGZyb20gdGhlIGludmVyc2UsIEhTTCB0byBSR0IgY29udmVyc2lvbi5cblxuXHRJdCBtYXRjaGVzIHRoZSBtYXRoIGluIE1pa2UgQm9zdG9jaydzIEQzIGltcGxlbWVudGF0aW9uOlxuXG5cdGh0dHBzOi8vZ2l0aHViLmNvbS9kMy9kMy1jb2xvci9ibG9iL21hc3Rlci9zcmMvY3ViZWhlbGl4LmpzXG4gKi9cblxuaW1wb3J0IHsgcmFkVG9EZWcsIE0gfSBmcm9tICcuL2NvbnN0YW50cy5qcyc7XG5cbmxldCBERSA9IE1bM10gKiBNWzRdO1xubGV0IEJFID0gTVsxXSAqIE1bNF07XG5sZXQgQkNBRCA9IE1bMV0gKiBNWzJdIC0gTVswXSAqIE1bM107XG5cbmNvbnN0IGNvbnZlcnRSZ2JUb0N1YmVoZWxpeCA9ICh7IHIsIGcsIGIsIGFscGhhIH0pID0+IHtcblx0aWYgKHIgPT09IHVuZGVmaW5lZCkgciA9IDA7XG5cdGlmIChnID09PSB1bmRlZmluZWQpIGcgPSAwO1xuXHRpZiAoYiA9PT0gdW5kZWZpbmVkKSBiID0gMDtcblx0bGV0IGwgPSAoQkNBRCAqIGIgKyByICogREUgLSBnICogQkUpIC8gKEJDQUQgKyBERSAtIEJFKTtcblx0bGV0IHggPSBiIC0gbDtcblx0bGV0IHkgPSAoTVs0XSAqIChnIC0gbCkgLSBNWzJdICogeCkgLyBNWzNdO1xuXG5cdGxldCByZXMgPSB7XG5cdFx0bW9kZTogJ2N1YmVoZWxpeCcsXG5cdFx0bDogbCxcblx0XHRzOlxuXHRcdFx0bCA9PT0gMCB8fCBsID09PSAxXG5cdFx0XHRcdD8gdW5kZWZpbmVkXG5cdFx0XHRcdDogTWF0aC5zcXJ0KHggKiB4ICsgeSAqIHkpIC8gKE1bNF0gKiBsICogKDEgLSBsKSlcblx0fTtcblxuXHRpZiAocmVzLnMpIHJlcy5oID0gTWF0aC5hdGFuMih5LCB4KSAqIHJhZFRvRGVnIC0gMTIwO1xuXHRpZiAoYWxwaGEgIT09IHVuZGVmaW5lZCkgcmVzLmFscGhhID0gYWxwaGE7XG5cblx0cmV0dXJuIHJlcztcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNvbnZlcnRSZ2JUb0N1YmVoZWxpeDtcbiIsICJpbXBvcnQgeyBkZWdUb1JhZCwgTSB9IGZyb20gJy4vY29uc3RhbnRzLmpzJztcblxuY29uc3QgY29udmVydEN1YmVoZWxpeFRvUmdiID0gKHsgaCwgcywgbCwgYWxwaGEgfSkgPT4ge1xuXHRsZXQgcmVzID0geyBtb2RlOiAncmdiJyB9O1xuXG5cdGggPSAoaCA9PT0gdW5kZWZpbmVkID8gMCA6IGggKyAxMjApICogZGVnVG9SYWQ7XG5cdGlmIChsID09PSB1bmRlZmluZWQpIGwgPSAwO1xuXG5cdGxldCBhbXAgPSBzID09PSB1bmRlZmluZWQgPyAwIDogcyAqIGwgKiAoMSAtIGwpO1xuXG5cdGxldCBjb3NoID0gTWF0aC5jb3MoaCk7XG5cdGxldCBzaW5oID0gTWF0aC5zaW4oaCk7XG5cblx0cmVzLnIgPSBsICsgYW1wICogKE1bMF0gKiBjb3NoICsgTVsxXSAqIHNpbmgpO1xuXHRyZXMuZyA9IGwgKyBhbXAgKiAoTVsyXSAqIGNvc2ggKyBNWzNdICogc2luaCk7XG5cdHJlcy5iID0gbCArIGFtcCAqIChNWzRdICogY29zaCArIE1bNV0gKiBzaW5oKTtcblxuXHRpZiAoYWxwaGEgIT09IHVuZGVmaW5lZCkgcmVzLmFscGhhID0gYWxwaGE7XG5cdHJldHVybiByZXM7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBjb252ZXJ0Q3ViZWhlbGl4VG9SZ2I7XG4iLCAiaW1wb3J0IHsgZ2V0TW9kZSB9IGZyb20gJy4vbW9kZXMuanMnO1xuaW1wb3J0IGNvbnZlcnRlciBmcm9tICcuL2NvbnZlcnRlci5qcyc7XG5pbXBvcnQgbm9ybWFsaXplSHVlIGZyb20gJy4vdXRpbC9ub3JtYWxpemVIdWUuanMnO1xuXG5jb25zdCBkaWZmZXJlbmNlSHVlU2F0dXJhdGlvbiA9IChzdGQsIHNtcCkgPT4ge1xuXHRpZiAoc3RkLmggPT09IHVuZGVmaW5lZCB8fCBzbXAuaCA9PT0gdW5kZWZpbmVkIHx8ICFzdGQucyB8fCAhc21wLnMpIHtcblx0XHRyZXR1cm4gMDtcblx0fVxuXHRsZXQgc3RkX2ggPSBub3JtYWxpemVIdWUoc3RkLmgpO1xuXHRsZXQgc21wX2ggPSBub3JtYWxpemVIdWUoc21wLmgpO1xuXHRsZXQgZEggPSBNYXRoLnNpbigoKChzbXBfaCAtIHN0ZF9oICsgMzYwKSAvIDIpICogTWF0aC5QSSkgLyAxODApO1xuXHRyZXR1cm4gMiAqIE1hdGguc3FydChzdGQucyAqIHNtcC5zKSAqIGRIO1xufTtcblxuY29uc3QgZGlmZmVyZW5jZUh1ZU5haXZlID0gKHN0ZCwgc21wKSA9PiB7XG5cdGlmIChzdGQuaCA9PT0gdW5kZWZpbmVkIHx8IHNtcC5oID09PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gMDtcblx0fVxuXHRsZXQgc3RkX2ggPSBub3JtYWxpemVIdWUoc3RkLmgpO1xuXHRsZXQgc21wX2ggPSBub3JtYWxpemVIdWUoc21wLmgpO1xuXHRpZiAoTWF0aC5hYnMoc21wX2ggLSBzdGRfaCkgPiAxODApIHtcblx0XHQvLyB0b2RvIHNob3VsZCB0aGlzIGJlIG5vcm1hbGl6ZWQgb25jZSBhZ2Fpbj9cblx0XHRyZXR1cm4gc3RkX2ggLSAoc21wX2ggLSAzNjAgKiBNYXRoLnNpZ24oc21wX2ggLSBzdGRfaCkpO1xuXHR9XG5cdHJldHVybiBzbXBfaCAtIHN0ZF9oO1xufTtcblxuY29uc3QgZGlmZmVyZW5jZUh1ZUNocm9tYSA9IChzdGQsIHNtcCkgPT4ge1xuXHRpZiAoc3RkLmggPT09IHVuZGVmaW5lZCB8fCBzbXAuaCA9PT0gdW5kZWZpbmVkIHx8ICFzdGQuYyB8fCAhc21wLmMpIHtcblx0XHRyZXR1cm4gMDtcblx0fVxuXHRsZXQgc3RkX2ggPSBub3JtYWxpemVIdWUoc3RkLmgpO1xuXHRsZXQgc21wX2ggPSBub3JtYWxpemVIdWUoc21wLmgpO1xuXHRsZXQgZEggPSBNYXRoLnNpbigoKChzbXBfaCAtIHN0ZF9oICsgMzYwKSAvIDIpICogTWF0aC5QSSkgLyAxODApO1xuXHRyZXR1cm4gMiAqIE1hdGguc3FydChzdGQuYyAqIHNtcC5jKSAqIGRIO1xufTtcblxuY29uc3QgZGlmZmVyZW5jZUV1Y2xpZGVhbiA9IChtb2RlID0gJ3JnYicsIHdlaWdodHMgPSBbMSwgMSwgMSwgMF0pID0+IHtcblx0bGV0IGRlZiA9IGdldE1vZGUobW9kZSk7XG5cdGxldCBjaGFubmVscyA9IGRlZi5jaGFubmVscztcblx0bGV0IGRpZmZzID0gZGVmLmRpZmZlcmVuY2U7XG5cdGxldCBjb252ID0gY29udmVydGVyKG1vZGUpO1xuXHRyZXR1cm4gKHN0ZCwgc21wKSA9PiB7XG5cdFx0bGV0IENvbnZTdGQgPSBjb252KHN0ZCk7XG5cdFx0bGV0IENvbnZTbXAgPSBjb252KHNtcCk7XG5cdFx0cmV0dXJuIE1hdGguc3FydChcblx0XHRcdGNoYW5uZWxzLnJlZHVjZSgoc3VtLCBrLCBpZHgpID0+IHtcblx0XHRcdFx0bGV0IGRlbHRhID0gZGlmZnNba11cblx0XHRcdFx0XHQ/IGRpZmZzW2tdKENvbnZTdGQsIENvbnZTbXApXG5cdFx0XHRcdFx0OiBDb252U3RkW2tdIC0gQ29udlNtcFtrXTtcblx0XHRcdFx0cmV0dXJuIChcblx0XHRcdFx0XHRzdW0gK1xuXHRcdFx0XHRcdCh3ZWlnaHRzW2lkeF0gfHwgMCkgKiBNYXRoLnBvdyhpc05hTihkZWx0YSkgPyAwIDogZGVsdGEsIDIpXG5cdFx0XHRcdCk7XG5cdFx0XHR9LCAwKVxuXHRcdCk7XG5cdH07XG59O1xuXG5jb25zdCBkaWZmZXJlbmNlQ2llNzYgPSAoKSA9PiBkaWZmZXJlbmNlRXVjbGlkZWFuKCdsYWI2NScpO1xuXG5jb25zdCBkaWZmZXJlbmNlQ2llOTQgPSAoa0wgPSAxLCBLMSA9IDAuMDQ1LCBLMiA9IDAuMDE1KSA9PiB7XG5cdGxldCBsYWIgPSBjb252ZXJ0ZXIoJ2xhYjY1Jyk7XG5cblx0cmV0dXJuIChzdGQsIHNtcCkgPT4ge1xuXHRcdGxldCBMYWJTdGQgPSBsYWIoc3RkKTtcblx0XHRsZXQgTGFiU21wID0gbGFiKHNtcCk7XG5cblx0XHQvLyBFeHRyYWN0IExhYiB2YWx1ZXMsIGFuZCBjb21wdXRlIENocm9tYVxuXHRcdGxldCBsU3RkID0gTGFiU3RkLmw7XG5cdFx0bGV0IGFTdGQgPSBMYWJTdGQuYTtcblx0XHRsZXQgYlN0ZCA9IExhYlN0ZC5iO1xuXHRcdGxldCBjU3RkID0gTWF0aC5zcXJ0KGFTdGQgKiBhU3RkICsgYlN0ZCAqIGJTdGQpO1xuXG5cdFx0bGV0IGxTbXAgPSBMYWJTbXAubDtcblx0XHRsZXQgYVNtcCA9IExhYlNtcC5hO1xuXHRcdGxldCBiU21wID0gTGFiU21wLmI7XG5cdFx0bGV0IGNTbXAgPSBNYXRoLnNxcnQoYVNtcCAqIGFTbXAgKyBiU21wICogYlNtcCk7XG5cblx0XHRsZXQgZEwyID0gTWF0aC5wb3cobFN0ZCAtIGxTbXAsIDIpO1xuXHRcdGxldCBkQzIgPSBNYXRoLnBvdyhjU3RkIC0gY1NtcCwgMik7XG5cdFx0bGV0IGRIMiA9IE1hdGgucG93KGFTdGQgLSBhU21wLCAyKSArIE1hdGgucG93KGJTdGQgLSBiU21wLCAyKSAtIGRDMjtcblxuXHRcdHJldHVybiBNYXRoLnNxcnQoXG5cdFx0XHRkTDIgLyBNYXRoLnBvdyhrTCwgMikgK1xuXHRcdFx0XHRkQzIgLyBNYXRoLnBvdygxICsgSzEgKiBjU3RkLCAyKSArXG5cdFx0XHRcdGRIMiAvIE1hdGgucG93KDEgKyBLMiAqIGNTdGQsIDIpXG5cdFx0KTtcblx0fTtcbn07XG5cbi8qXG5cdENJRURFMjAwMCBjb2xvciBkaWZmZXJlbmNlLCBvcmlnaW5hbCBNYXRsYWIgaW1wbGVtZW50YXRpb24gYnkgR2F1cmF2IFNoYXJtYVxuXHRCYXNlZCBvbiBcIlRoZSBDSUVERTIwMDAgQ29sb3ItRGlmZmVyZW5jZSBGb3JtdWxhOiBJbXBsZW1lbnRhdGlvbiBOb3RlcywgU3VwcGxlbWVudGFyeSBUZXN0IERhdGEsIGFuZCBNYXRoZW1hdGljYWwgT2JzZXJ2YXRpb25zXCIgXG5cdGJ5IEdhdXJhdiBTaGFybWEsIFdlbmNoZW5nIFd1LCBFZHVsIE4uIERhbGFsIGluIENvbG9yIFJlc2VhcmNoIGFuZCBBcHBsaWNhdGlvbiwgdm9sLiAzMC4gTm8uIDEsIHBwLiAyMS0zMCwgRmVicnVhcnkgMjAwNS5cblx0aHR0cDovL3d3dzIuZWNlLnJvY2hlc3Rlci5lZHUvfmdzaGFybWEvY2llZGUyMDAwL1xuICovXG5cbmNvbnN0IGRpZmZlcmVuY2VDaWVkZTIwMDAgPSAoS2wgPSAxLCBLYyA9IDEsIEtoID0gMSkgPT4ge1xuXHRsZXQgbGFiID0gY29udmVydGVyKCdsYWI2NScpO1xuXHRyZXR1cm4gKHN0ZCwgc21wKSA9PiB7XG5cdFx0bGV0IExhYlN0ZCA9IGxhYihzdGQpO1xuXHRcdGxldCBMYWJTbXAgPSBsYWIoc21wKTtcblxuXHRcdGxldCBsU3RkID0gTGFiU3RkLmw7XG5cdFx0bGV0IGFTdGQgPSBMYWJTdGQuYTtcblx0XHRsZXQgYlN0ZCA9IExhYlN0ZC5iO1xuXHRcdGxldCBjU3RkID0gTWF0aC5zcXJ0KGFTdGQgKiBhU3RkICsgYlN0ZCAqIGJTdGQpO1xuXG5cdFx0bGV0IGxTbXAgPSBMYWJTbXAubDtcblx0XHRsZXQgYVNtcCA9IExhYlNtcC5hO1xuXHRcdGxldCBiU21wID0gTGFiU21wLmI7XG5cdFx0bGV0IGNTbXAgPSBNYXRoLnNxcnQoYVNtcCAqIGFTbXAgKyBiU21wICogYlNtcCk7XG5cblx0XHRsZXQgY0F2ZyA9IChjU3RkICsgY1NtcCkgLyAyO1xuXG5cdFx0bGV0IEcgPVxuXHRcdFx0MC41ICpcblx0XHRcdCgxIC1cblx0XHRcdFx0TWF0aC5zcXJ0KFxuXHRcdFx0XHRcdE1hdGgucG93KGNBdmcsIDcpIC8gKE1hdGgucG93KGNBdmcsIDcpICsgTWF0aC5wb3coMjUsIDcpKVxuXHRcdFx0XHQpKTtcblxuXHRcdGxldCBhcFN0ZCA9IGFTdGQgKiAoMSArIEcpO1xuXHRcdGxldCBhcFNtcCA9IGFTbXAgKiAoMSArIEcpO1xuXG5cdFx0bGV0IGNwU3RkID0gTWF0aC5zcXJ0KGFwU3RkICogYXBTdGQgKyBiU3RkICogYlN0ZCk7XG5cdFx0bGV0IGNwU21wID0gTWF0aC5zcXJ0KGFwU21wICogYXBTbXAgKyBiU21wICogYlNtcCk7XG5cblx0XHRsZXQgaHBTdGQgPVxuXHRcdFx0TWF0aC5hYnMoYXBTdGQpICsgTWF0aC5hYnMoYlN0ZCkgPT09IDBcblx0XHRcdFx0PyAwXG5cdFx0XHRcdDogTWF0aC5hdGFuMihiU3RkLCBhcFN0ZCk7XG5cdFx0aHBTdGQgKz0gKGhwU3RkIDwgMCkgKiAyICogTWF0aC5QSTtcblxuXHRcdGxldCBocFNtcCA9XG5cdFx0XHRNYXRoLmFicyhhcFNtcCkgKyBNYXRoLmFicyhiU21wKSA9PT0gMFxuXHRcdFx0XHQ/IDBcblx0XHRcdFx0OiBNYXRoLmF0YW4yKGJTbXAsIGFwU21wKTtcblx0XHRocFNtcCArPSAoaHBTbXAgPCAwKSAqIDIgKiBNYXRoLlBJO1xuXG5cdFx0bGV0IGRMID0gbFNtcCAtIGxTdGQ7XG5cdFx0bGV0IGRDID0gY3BTbXAgLSBjcFN0ZDtcblxuXHRcdGxldCBkaHAgPSBjcFN0ZCAqIGNwU21wID09PSAwID8gMCA6IGhwU21wIC0gaHBTdGQ7XG5cdFx0ZGhwIC09IChkaHAgPiBNYXRoLlBJKSAqIDIgKiBNYXRoLlBJO1xuXHRcdGRocCArPSAoZGhwIDwgLU1hdGguUEkpICogMiAqIE1hdGguUEk7XG5cblx0XHRsZXQgZEggPSAyICogTWF0aC5zcXJ0KGNwU3RkICogY3BTbXApICogTWF0aC5zaW4oZGhwIC8gMik7XG5cblx0XHRsZXQgTHAgPSAobFN0ZCArIGxTbXApIC8gMjtcblx0XHRsZXQgQ3AgPSAoY3BTdGQgKyBjcFNtcCkgLyAyO1xuXG5cdFx0bGV0IGhwO1xuXHRcdGlmIChjcFN0ZCAqIGNwU21wID09PSAwKSB7XG5cdFx0XHRocCA9IGhwU3RkICsgaHBTbXA7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGhwID0gKGhwU3RkICsgaHBTbXApIC8gMjtcblx0XHRcdGhwIC09IChNYXRoLmFicyhocFN0ZCAtIGhwU21wKSA+IE1hdGguUEkpICogTWF0aC5QSTtcblx0XHRcdGhwICs9IChocCA8IDApICogMiAqIE1hdGguUEk7XG5cdFx0fVxuXG5cdFx0bGV0IExwbTUwID0gTWF0aC5wb3coTHAgLSA1MCwgMik7XG5cdFx0bGV0IFQgPVxuXHRcdFx0MSAtXG5cdFx0XHQwLjE3ICogTWF0aC5jb3MoaHAgLSBNYXRoLlBJIC8gNikgK1xuXHRcdFx0MC4yNCAqIE1hdGguY29zKDIgKiBocCkgK1xuXHRcdFx0MC4zMiAqIE1hdGguY29zKDMgKiBocCArIE1hdGguUEkgLyAzMCkgLVxuXHRcdFx0MC4yICogTWF0aC5jb3MoNCAqIGhwIC0gKDYzICogTWF0aC5QSSkgLyAxODApO1xuXG5cdFx0bGV0IFNsID0gMSArICgwLjAxNSAqIExwbTUwKSAvIE1hdGguc3FydCgyMCArIExwbTUwKTtcblx0XHRsZXQgU2MgPSAxICsgMC4wNDUgKiBDcDtcblx0XHRsZXQgU2ggPSAxICsgMC4wMTUgKiBDcCAqIFQ7XG5cblx0XHRsZXQgZGVsdGFUaGV0YSA9XG5cdFx0XHQoKDMwICogTWF0aC5QSSkgLyAxODApICpcblx0XHRcdE1hdGguZXhwKC0xICogTWF0aC5wb3coKCgxODAgLyBNYXRoLlBJKSAqIGhwIC0gMjc1KSAvIDI1LCAyKSk7XG5cdFx0bGV0IFJjID1cblx0XHRcdDIgKlxuXHRcdFx0TWF0aC5zcXJ0KE1hdGgucG93KENwLCA3KSAvIChNYXRoLnBvdyhDcCwgNykgKyBNYXRoLnBvdygyNSwgNykpKTtcblxuXHRcdGxldCBSdCA9IC0xICogTWF0aC5zaW4oMiAqIGRlbHRhVGhldGEpICogUmM7XG5cblx0XHRyZXR1cm4gTWF0aC5zcXJ0KFxuXHRcdFx0TWF0aC5wb3coZEwgLyAoS2wgKiBTbCksIDIpICtcblx0XHRcdFx0TWF0aC5wb3coZEMgLyAoS2MgKiBTYyksIDIpICtcblx0XHRcdFx0TWF0aC5wb3coZEggLyAoS2ggKiBTaCksIDIpICtcblx0XHRcdFx0KCgoUnQgKiBkQykgLyAoS2MgKiBTYykpICogZEgpIC8gKEtoICogU2gpXG5cdFx0KTtcblx0fTtcbn07XG5cbi8qXG5cdENNQyAobDpjKSBkaWZmZXJlbmNlIGZvcm11bGFcblxuXHRSZWZlcmVuY2VzOlxuXHRcdGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0NvbG9yX2RpZmZlcmVuY2UjQ01DX2w6Y18oMTk4NClcblx0XHRodHRwOi8vd3d3LmJydWNlbGluZGJsb29tLmNvbS9pbmRleC5odG1sP0Vxbl9EZWx0YUVfQ01DLmh0bWxcbiAqL1xuY29uc3QgZGlmZmVyZW5jZUNtYyA9IChsID0gMSwgYyA9IDEpID0+IHtcblx0bGV0IGxhYiA9IGNvbnZlcnRlcignbGFiNjUnKTtcblxuXHQvKlxuXHRcdENvbXBhcnRlIHR3byBjb2xvcnM6XG5cdFx0c3RkIC0gc3RhbmRhcmQgKGZpcnN0KSBjb2xvclxuXHRcdHNtcCAtIHNhbXBsZSAoc2Vjb25kKSBjb2xvclxuXHQgKi9cblx0cmV0dXJuIChzdGQsIHNtcCkgPT4ge1xuXHRcdC8vIGNvbnZlcnQgc3RhbmRhcmQgY29sb3IgdG8gTGFiXG5cdFx0bGV0IExhYlN0ZCA9IGxhYihzdGQpO1xuXHRcdGxldCBsU3RkID0gTGFiU3RkLmw7XG5cdFx0bGV0IGFTdGQgPSBMYWJTdGQuYTtcblx0XHRsZXQgYlN0ZCA9IExhYlN0ZC5iO1xuXG5cdFx0Ly8gT2J0YWluIGh1ZS9jaHJvbWFcblx0XHRsZXQgY1N0ZCA9IE1hdGguc3FydChhU3RkICogYVN0ZCArIGJTdGQgKiBiU3RkKTtcblx0XHRsZXQgaFN0ZCA9IE1hdGguYXRhbjIoYlN0ZCwgYVN0ZCk7XG5cdFx0aFN0ZCA9IGhTdGQgKyAyICogTWF0aC5QSSAqIChoU3RkIDwgMCk7XG5cblx0XHQvLyBjb252ZXJ0IHNhbXBsZSBjb2xvciB0byBMYWIsIG9idGFpbiBMQ2hcblx0XHRsZXQgTGFiU21wID0gbGFiKHNtcCk7XG5cdFx0bGV0IGxTbXAgPSBMYWJTbXAubDtcblx0XHRsZXQgYVNtcCA9IExhYlNtcC5hO1xuXHRcdGxldCBiU21wID0gTGFiU21wLmI7XG5cblx0XHQvLyBPYnRhaW4gY2hyb21hXG5cdFx0bGV0IGNTbXAgPSBNYXRoLnNxcnQoYVNtcCAqIGFTbXAgKyBiU21wICogYlNtcCk7XG5cblx0XHQvLyBsaWdodG5lc3MgZGVsdGEgc3F1YXJlZFxuXHRcdGxldCBkTDIgPSBNYXRoLnBvdyhsU3RkIC0gbFNtcCwgMik7XG5cblx0XHQvLyBjaHJvbWEgZGVsdGEgc3F1YXJlZFxuXHRcdGxldCBkQzIgPSBNYXRoLnBvdyhjU3RkIC0gY1NtcCwgMik7XG5cblx0XHQvLyBodWUgZGVsdGEgc3F1YXJlZFxuXHRcdGxldCBkSDIgPSBNYXRoLnBvdyhhU3RkIC0gYVNtcCwgMikgKyBNYXRoLnBvdyhiU3RkIC0gYlNtcCwgMikgLSBkQzI7XG5cblx0XHRsZXQgRiA9IE1hdGguc3FydChNYXRoLnBvdyhjU3RkLCA0KSAvIChNYXRoLnBvdyhjU3RkLCA0KSArIDE5MDApKTtcblx0XHRsZXQgVCA9XG5cdFx0XHRoU3RkID49ICgxNjQgLyAxODApICogTWF0aC5QSSAmJiBoU3RkIDw9ICgzNDUgLyAxODApICogTWF0aC5QSVxuXHRcdFx0XHQ/IDAuNTYgKyBNYXRoLmFicygwLjIgKiBNYXRoLmNvcyhoU3RkICsgKDE2OCAvIDE4MCkgKiBNYXRoLlBJKSlcblx0XHRcdFx0OiAwLjM2ICsgTWF0aC5hYnMoMC40ICogTWF0aC5jb3MoaFN0ZCArICgzNSAvIDE4MCkgKiBNYXRoLlBJKSk7XG5cblx0XHRsZXQgU2wgPSBsU3RkIDwgMTYgPyAwLjUxMSA6ICgwLjA0MDk3NSAqIGxTdGQpIC8gKDEgKyAwLjAxNzY1ICogbFN0ZCk7XG5cdFx0bGV0IFNjID0gKDAuMDYzOCAqIGNTdGQpIC8gKDEgKyAwLjAxMzEgKiBjU3RkKSArIDAuNjM4O1xuXHRcdGxldCBTaCA9IFNjICogKEYgKiBUICsgMSAtIEYpO1xuXG5cdFx0cmV0dXJuIE1hdGguc3FydChcblx0XHRcdGRMMiAvIE1hdGgucG93KGwgKiBTbCwgMikgK1xuXHRcdFx0XHRkQzIgLyBNYXRoLnBvdyhjICogU2MsIDIpICtcblx0XHRcdFx0ZEgyIC8gTWF0aC5wb3coU2gsIDIpXG5cdFx0KTtcblx0fTtcbn07XG5cbi8qXG5cblx0SHlBQiBjb2xvciBkaWZmZXJlbmNlIGZvcm11bGEsIGludHJvZHVjZWQgaW46XG5cblx0XHRBYmFzaSBTLCBBbWFuaSBUZWhyYW4gTSwgRmFpcmNoaWxkIE1ELiBcblx0XHRcIkRpc3RhbmNlIG1ldHJpY3MgZm9yIHZlcnkgbGFyZ2UgY29sb3IgZGlmZmVyZW5jZXMuXCJcblx0XHRDb2xvciBSZXMgQXBwbC4gMjAxOTsgMVx1MjAxMzE2LiBcblx0XHRodHRwczovL2RvaS5vcmcvMTAuMTAwMi9jb2wuMjI0NTFcblxuXHRQREYgYXZhaWxhYmxlIGF0OlxuXHRcblx0XHRodHRwOi8vbWFya2ZhaXJjaGlsZC5vcmcvUERGcy9QQVA0MC5wZGZcbiAqL1xuY29uc3QgZGlmZmVyZW5jZUh5YWIgPSAoKSA9PiB7XG5cdGxldCBsYWIgPSBjb252ZXJ0ZXIoJ2xhYjY1Jyk7XG5cdHJldHVybiAoc3RkLCBzbXApID0+IHtcblx0XHRsZXQgTGFiU3RkID0gbGFiKHN0ZCk7XG5cdFx0bGV0IExhYlNtcCA9IGxhYihzbXApO1xuXHRcdGxldCBkTCA9IExhYlN0ZC5sIC0gTGFiU21wLmw7XG5cdFx0bGV0IGRBID0gTGFiU3RkLmEgLSBMYWJTbXAuYTtcblx0XHRsZXQgZEIgPSBMYWJTdGQuYiAtIExhYlNtcC5iO1xuXHRcdHJldHVybiBNYXRoLmFicyhkTCkgKyBNYXRoLnNxcnQoZEEgKiBkQSArIGRCICogZEIpO1xuXHR9O1xufTtcblxuLypcblx0XCJNZWFzdXJpbmcgcGVyY2VpdmVkIGNvbG9yIGRpZmZlcmVuY2UgdXNpbmcgWUlRIE5UU0Ncblx0dHJhbnNtaXNzaW9uIGNvbG9yIHNwYWNlIGluIG1vYmlsZSBhcHBsaWNhdGlvbnNcIlxuXHRcdFxuXHRcdGJ5IFl1cml5IEtvdHNhcmVua28sIEZlcm5hbmRvIFJhbW9zIGluOlxuXHRcdFByb2dyYW1hY2lcdTAwRjNuIE1hdGVtXHUwMEUxdGljYSB5IFNvZnR3YXJlICgyMDEwKSBcblxuXHRBdmFpbGFibGUgYXQ6XG5cdFx0XG5cdFx0aHR0cDovL3d3dy5wcm9nbWF0LnVhZW0ubXg6ODA4MC9hcnRWb2wyTnVtMi9BcnRpY3VsbzNWb2wyTnVtMi5wZGZcbiAqL1xuY29uc3QgZGlmZmVyZW5jZUtvdHNhcmVua29SYW1vcyA9ICgpID0+XG5cdGRpZmZlcmVuY2VFdWNsaWRlYW4oJ3lpcScsIFswLjUwNTMsIDAuMjk5LCAwLjE5NTddKTtcblxuLypcblx0XHUwMzk0RV9JVFAsIGFzIGRlZmluZWQgaW4gUmVjLiBJVFUtUiBCVC4yMTI0OlxuXG5cdGh0dHBzOi8vd3d3Lml0dS5pbnQvcmVjL1ItUkVDLUJULjIxMjQvZW5cbiovXG5jb25zdCBkaWZmZXJlbmNlSXRwID0gKCkgPT5cblx0ZGlmZmVyZW5jZUV1Y2xpZGVhbignaXRwJywgWzUxODQwMCwgMTI5NjAwLCA1MTg0MDBdKTtcblxuZXhwb3J0IHtcblx0ZGlmZmVyZW5jZUh1ZUNocm9tYSxcblx0ZGlmZmVyZW5jZUh1ZVNhdHVyYXRpb24sXG5cdGRpZmZlcmVuY2VIdWVOYWl2ZSxcblx0ZGlmZmVyZW5jZUV1Y2xpZGVhbixcblx0ZGlmZmVyZW5jZUNpZTc2LFxuXHRkaWZmZXJlbmNlQ2llOTQsXG5cdGRpZmZlcmVuY2VDaWVkZTIwMDAsXG5cdGRpZmZlcmVuY2VDbWMsXG5cdGRpZmZlcmVuY2VIeWFiLFxuXHRkaWZmZXJlbmNlS290c2FyZW5rb1JhbW9zLFxuXHRkaWZmZXJlbmNlSXRwXG59O1xuIiwgImltcG9ydCBjb252ZXJ0ZXIgZnJvbSAnLi9jb252ZXJ0ZXIuanMnO1xuaW1wb3J0IHsgZ2V0TW9kZSB9IGZyb20gJy4vbW9kZXMuanMnO1xuXG5jb25zdCBhdmVyYWdlQW5nbGUgPSB2YWwgPT4ge1xuXHQvLyBTZWU6IGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL01lYW5fb2ZfY2lyY3VsYXJfcXVhbnRpdGllc1xuXHRsZXQgc3VtID0gdmFsLnJlZHVjZShcblx0XHQoc3VtLCB2YWwpID0+IHtcblx0XHRcdGlmICh2YWwgIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRsZXQgcmFkID0gKHZhbCAqIE1hdGguUEkpIC8gMTgwO1xuXHRcdFx0XHRzdW0uc2luICs9IE1hdGguc2luKHJhZCk7XG5cdFx0XHRcdHN1bS5jb3MgKz0gTWF0aC5jb3MocmFkKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBzdW07XG5cdFx0fSxcblx0XHR7IHNpbjogMCwgY29zOiAwIH1cblx0KTtcblx0bGV0IGFuZ2xlID0gKE1hdGguYXRhbjIoc3VtLnNpbiwgc3VtLmNvcykgKiAxODApIC8gTWF0aC5QSTtcblx0cmV0dXJuIGFuZ2xlIDwgMCA/IDM2MCArIGFuZ2xlIDogYW5nbGU7XG59O1xuXG5jb25zdCBhdmVyYWdlTnVtYmVyID0gdmFsID0+IHtcblx0bGV0IGEgPSB2YWwuZmlsdGVyKHYgPT4gdiAhPT0gdW5kZWZpbmVkKTtcblx0cmV0dXJuIGEubGVuZ3RoID8gYS5yZWR1Y2UoKHN1bSwgdikgPT4gc3VtICsgdiwgMCkgLyBhLmxlbmd0aCA6IHVuZGVmaW5lZDtcbn07XG5cbmNvbnN0IGlzZm4gPSBvID0+IHR5cGVvZiBvID09PSAnZnVuY3Rpb24nO1xuXG5mdW5jdGlvbiBhdmVyYWdlKGNvbG9ycywgbW9kZSA9ICdyZ2InLCBvdmVycmlkZXMpIHtcblx0bGV0IGRlZiA9IGdldE1vZGUobW9kZSk7XG5cdGxldCBjYyA9IGNvbG9ycy5tYXAoY29udmVydGVyKG1vZGUpKTtcblx0cmV0dXJuIGRlZi5jaGFubmVscy5yZWR1Y2UoXG5cdFx0KHJlcywgY2gpID0+IHtcblx0XHRcdGxldCBhcnIgPSBjYy5tYXAoYyA9PiBjW2NoXSkuZmlsdGVyKHZhbCA9PiB2YWwgIT09IHVuZGVmaW5lZCk7XG5cdFx0XHRpZiAoYXJyLmxlbmd0aCkge1xuXHRcdFx0XHRsZXQgZm47XG5cdFx0XHRcdGlmIChpc2ZuKG92ZXJyaWRlcykpIHtcblx0XHRcdFx0XHRmbiA9IG92ZXJyaWRlcztcblx0XHRcdFx0fSBlbHNlIGlmIChvdmVycmlkZXMgJiYgaXNmbihvdmVycmlkZXNbY2hdKSkge1xuXHRcdFx0XHRcdGZuID0gb3ZlcnJpZGVzW2NoXTtcblx0XHRcdFx0fSBlbHNlIGlmIChkZWYuYXZlcmFnZSAmJiBpc2ZuKGRlZi5hdmVyYWdlW2NoXSkpIHtcblx0XHRcdFx0XHRmbiA9IGRlZi5hdmVyYWdlW2NoXTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRmbiA9IGF2ZXJhZ2VOdW1iZXI7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmVzW2NoXSA9IGZuKGFyciwgY2gpO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHJlcztcblx0XHR9LFxuXHRcdHsgbW9kZSB9XG5cdCk7XG59XG5cbmV4cG9ydCB7IGF2ZXJhZ2UsIGF2ZXJhZ2VBbmdsZSwgYXZlcmFnZU51bWJlciB9O1xuIiwgIi8qIFxuXHREYXZlIEdyZWVuJ3MgQ3ViZWhlbGl4XG5cdC0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuXHRHcmVlbiwgRC4gQS4sIDIwMTEsIFwiQSBjb2xvdXIgc2NoZW1lIGZvciB0aGUgZGlzcGxheSBvZiBhc3Ryb25vbWljYWwgaW50ZW5zaXR5IGltYWdlc1wiLCBcblx0QnVsbGV0aW4gb2YgdGhlIEFzdHJvbm9taWNhbCBTb2NpZXR5IG9mIEluZGlhLCAzOSwgMjg5LiAoMjAxMUJBU0kuLi4zOS4uMjg5RyBhdCBBRFMuKSBcblxuXHRodHRwczovL3d3dy5tcmFvLmNhbS5hYy51ay8lN0VkYWcvQ1VCRUhFTElYL1xuXHRodHRwczovL2FyeGl2Lm9yZy9wZGYvMTEwOC41MDgzLnBkZlxuXG5cdEFsdGhvdWdoIEN1YmVoZWxpeCB3YXMgZGVmaW5lZCB0byBiZSBhIG1ldGhvZCB0byBvYnRhaW4gYSBjb2xvdXIgc2NoZW1lLFxuXHRpdCBhY3R1YWxseSBjb250YWlucyBhIGRlZmluaXRpb24gb2YgYSBjb2xvdXIgc3BhY2UsIGFzIGlkZW50aWZpZWQgYnkgXG5cdE1pa2UgQm9zdG9jayBhbmQgaW1wbGVtZW50ZWQgaW4gRDMuanMuXG5cblx0R3JlZW4ncyBwYXBlciBpbnRyb2R1Y2VzIHRoZSBmb2xsb3dpbmcgdGVybWlub2xvZ3k6XG5cblx0KiBcdGEgYGxpZ2h0bmVzc2AgZGltZW5zaW9uIGluIHRoZSBpbnRlcnZhbCBbMCwgMV0gXG5cdFx0b24gd2hpY2ggd2UgaW50ZXJwb2xhdGUgdG8gb2J0YWluIHRoZSBjb2xvdXIgc2NoZW1lXG5cdCpcdGEgYHN0YXJ0YCBjb2xvdXIgdGhhdCBpcyBhbmFsb2dvdXMgdG8gYSBIdWUgaW4gSFNMIHNwYWNlXG5cdCpcdGEgbnVtYmVyIG9mIGByb3RhdGlvbnNgIGFyb3VuZCB0aGUgSHVlIGN5bGluZGVyLlxuXHQqXHRhIGBodWVgIHBhcmFtZXRlciB3aGljaCBzaG91bGQgbW9yZSBhcHByb3ByaWF0ZWx5IGJlIGNhbGxlZCBgc2F0dXJhdGlvbmBcblx0XG5cdEFzIHN1Y2gsIHRoZSBvcmlnaW5hbCBkZWZpbml0aW9uIG9mIHRoZSBDdWJlaGVsaXggc2NoZW1lIGlzIGFjdHVhbGx5IGFuXG5cdGludGVycG9sYXRpb24gYmV0d2VlbiB0d28gY29sb3JzIGluIHRoZSBDdWJlaGVsaXggc3BhY2U6XG5cblx0SDogc3RhcnQgXHRcdFx0XHRIOiBzdGFydCArIDM2MCAqIHJvdGF0aW9uc1xuXHRTOiBodWUgXHRcdFx0LT5cdFx0UzogaHVlXG5cdEw6IDBcdFx0XHRcdFx0TDogMVxuXG5cdFdlIGNhbiB0aGVyZWZvcmUgZXh0ZW5kIHRoZSBpbnRlcnBvbGF0aW9uIHRvIGFueSB0d28gY29sb3JzIGluIHRoaXMgc3BhY2UsXG5cdHdpdGggYSB2YXJpYWJsZSBTYXR1cmF0aW9uIGFuZCBhIExpZ2h0bmVzcyBpbnRlcnZhbCBvdGhlciB0aGFuIHRoZSBmaXhlZCAwIC0+IDEuXG4qL1xuXG5pbXBvcnQgeyBmaXh1cEh1ZVNob3J0ZXIgfSBmcm9tICcuLi9maXh1cC9odWUuanMnO1xuaW1wb3J0IHsgZml4dXBBbHBoYSB9IGZyb20gJy4uL2ZpeHVwL2FscGhhLmpzJztcbmltcG9ydCB7IGludGVycG9sYXRvckxpbmVhciB9IGZyb20gJy4uL2ludGVycG9sYXRlL2xpbmVhci5qcyc7XG5pbXBvcnQgY29udmVydFJnYlRvQ3ViZWhlbGl4IGZyb20gJy4vY29udmVydFJnYlRvQ3ViZWhlbGl4LmpzJztcbmltcG9ydCBjb252ZXJ0Q3ViZWhlbGl4VG9SZ2IgZnJvbSAnLi9jb252ZXJ0Q3ViZWhlbGl4VG9SZ2IuanMnO1xuaW1wb3J0IHsgZGlmZmVyZW5jZUh1ZVNhdHVyYXRpb24gfSBmcm9tICcuLi9kaWZmZXJlbmNlLmpzJztcbmltcG9ydCB7IGF2ZXJhZ2VBbmdsZSB9IGZyb20gJy4uL2F2ZXJhZ2UuanMnO1xuXG5jb25zdCBkZWZpbml0aW9uID0ge1xuXHRtb2RlOiAnY3ViZWhlbGl4Jyxcblx0Y2hhbm5lbHM6IFsnaCcsICdzJywgJ2wnLCAnYWxwaGEnXSxcblx0cGFyc2U6IFsnLS1jdWJlaGVsaXgnXSxcblx0c2VyaWFsaXplOiAnLS1jdWJlaGVsaXgnLFxuXG5cdHJhbmdlczoge1xuXHRcdGg6IFswLCAzNjBdLFxuXHRcdHM6IFswLCA0LjYxNF0sXG5cdFx0bDogWzAsIDFdXG5cdH0sXG5cblx0ZnJvbU1vZGU6IHtcblx0XHRyZ2I6IGNvbnZlcnRSZ2JUb0N1YmVoZWxpeFxuXHR9LFxuXG5cdHRvTW9kZToge1xuXHRcdHJnYjogY29udmVydEN1YmVoZWxpeFRvUmdiXG5cdH0sXG5cblx0aW50ZXJwb2xhdGU6IHtcblx0XHRoOiB7XG5cdFx0XHR1c2U6IGludGVycG9sYXRvckxpbmVhcixcblx0XHRcdGZpeHVwOiBmaXh1cEh1ZVNob3J0ZXJcblx0XHR9LFxuXHRcdHM6IGludGVycG9sYXRvckxpbmVhcixcblx0XHRsOiBpbnRlcnBvbGF0b3JMaW5lYXIsXG5cdFx0YWxwaGE6IHtcblx0XHRcdHVzZTogaW50ZXJwb2xhdG9yTGluZWFyLFxuXHRcdFx0Zml4dXA6IGZpeHVwQWxwaGFcblx0XHR9XG5cdH0sXG5cblx0ZGlmZmVyZW5jZToge1xuXHRcdGg6IGRpZmZlcmVuY2VIdWVTYXR1cmF0aW9uXG5cdH0sXG5cblx0YXZlcmFnZToge1xuXHRcdGg6IGF2ZXJhZ2VBbmdsZVxuXHR9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbml0aW9uO1xuIiwgImltcG9ydCBub3JtYWxpemVIdWUgZnJvbSAnLi4vdXRpbC9ub3JtYWxpemVIdWUuanMnO1xuXG4vKiBcblx0UmVmZXJlbmNlczogXG5cdFx0KiBodHRwczovL2RyYWZ0cy5jc3N3Zy5vcmcvY3NzLWNvbG9yLyNsYWItdG8tbGNoXG5cdFx0KiBodHRwczovL2RyYWZ0cy5jc3N3Zy5vcmcvY3NzLWNvbG9yLyNjb2xvci1jb252ZXJzaW9uLWNvZGVcbiovXG5jb25zdCBjb252ZXJ0TGFiVG9MY2ggPSAoeyBsLCBhLCBiLCBhbHBoYSB9LCBtb2RlID0gJ2xjaCcpID0+IHtcblx0aWYgKGEgPT09IHVuZGVmaW5lZCkgYSA9IDA7XG5cdGlmIChiID09PSB1bmRlZmluZWQpIGIgPSAwO1xuXHRsZXQgYyA9IE1hdGguc3FydChhICogYSArIGIgKiBiKTtcblx0bGV0IHJlcyA9IHsgbW9kZSwgbCwgYyB9O1xuXHRpZiAoYykgcmVzLmggPSBub3JtYWxpemVIdWUoKE1hdGguYXRhbjIoYiwgYSkgKiAxODApIC8gTWF0aC5QSSk7XG5cdGlmIChhbHBoYSAhPT0gdW5kZWZpbmVkKSByZXMuYWxwaGEgPSBhbHBoYTtcblx0cmV0dXJuIHJlcztcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNvbnZlcnRMYWJUb0xjaDtcbiIsICIvKiBcblx0UmVmZXJlbmNlczogXG5cdFx0KiBodHRwczovL2RyYWZ0cy5jc3N3Zy5vcmcvY3NzLWNvbG9yLyNsY2gtdG8tbGFiXG5cdFx0KiBodHRwczovL2RyYWZ0cy5jc3N3Zy5vcmcvY3NzLWNvbG9yLyNjb2xvci1jb252ZXJzaW9uLWNvZGVcbiovXG5jb25zdCBjb252ZXJ0TGNoVG9MYWIgPSAoeyBsLCBjLCBoLCBhbHBoYSB9LCBtb2RlID0gJ2xhYicpID0+IHtcblx0aWYgKGggPT09IHVuZGVmaW5lZCkgaCA9IDA7XG5cdGxldCByZXMgPSB7XG5cdFx0bW9kZSxcblx0XHRsLFxuXHRcdGE6IGMgPyBjICogTWF0aC5jb3MoKGggLyAxODApICogTWF0aC5QSSkgOiAwLFxuXHRcdGI6IGMgPyBjICogTWF0aC5zaW4oKGggLyAxODApICogTWF0aC5QSSkgOiAwXG5cdH07XG5cdGlmIChhbHBoYSAhPT0gdW5kZWZpbmVkKSByZXMuYWxwaGEgPSBhbHBoYTtcblx0cmV0dXJuIHJlcztcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNvbnZlcnRMY2hUb0xhYjtcbiIsICJleHBvcnQgY29uc3QgayA9IE1hdGgucG93KDI5LCAzKSAvIE1hdGgucG93KDMsIDMpO1xuZXhwb3J0IGNvbnN0IGUgPSBNYXRoLnBvdyg2LCAzKSAvIE1hdGgucG93KDI5LCAzKTtcbiIsICIvKlxuXHRUaGUgWFlaIHRyaXN0aW11bHVzIHZhbHVlcyAod2hpdGUgcG9pbnQpXG5cdG9mIHN0YW5kYXJkIGlsbHVtaW5hbnRzIGZvciB0aGUgQ0lFIDE5MzEgMlx1MDBCMCBcblx0c3RhbmRhcmQgb2JzZXJ2ZXIuXG5cblx0U2VlOiBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9TdGFuZGFyZF9pbGx1bWluYW50XG4gKi9cblxuZXhwb3J0IGNvbnN0IEQ1MCA9IHtcblx0WDogMC4zNDU3IC8gMC4zNTg1LFxuXHRZOiAxLFxuXHRaOiAoMSAtIDAuMzQ1NyAtIDAuMzU4NSkgLyAwLjM1ODVcbn07XG5cbmV4cG9ydCBjb25zdCBENjUgPSB7XG5cdFg6IDAuMzEyNyAvIDAuMzI5LFxuXHRZOiAxLFxuXHRaOiAoMSAtIDAuMzEyNyAtIDAuMzI5KSAvIDAuMzI5XG59O1xuXG5leHBvcnQgY29uc3QgayA9IE1hdGgucG93KDI5LCAzKSAvIE1hdGgucG93KDMsIDMpO1xuZXhwb3J0IGNvbnN0IGUgPSBNYXRoLnBvdyg2LCAzKSAvIE1hdGgucG93KDI5LCAzKTtcbiIsICJpbXBvcnQgeyBrLCBlIH0gZnJvbSAnLi4veHl6NjUvY29uc3RhbnRzLmpzJztcbmltcG9ydCB7IEQ2NSB9IGZyb20gJy4uL2NvbnN0YW50cy5qcyc7XG5cbmxldCBmbiA9IHYgPT4gKE1hdGgucG93KHYsIDMpID4gZSA/IE1hdGgucG93KHYsIDMpIDogKDExNiAqIHYgLSAxNikgLyBrKTtcblxuY29uc3QgY29udmVydExhYjY1VG9YeXo2NSA9ICh7IGwsIGEsIGIsIGFscGhhIH0pID0+IHtcblx0aWYgKGwgPT09IHVuZGVmaW5lZCkgbCA9IDA7XG5cdGlmIChhID09PSB1bmRlZmluZWQpIGEgPSAwO1xuXHRpZiAoYiA9PT0gdW5kZWZpbmVkKSBiID0gMDtcblxuXHRsZXQgZnkgPSAobCArIDE2KSAvIDExNjtcblx0bGV0IGZ4ID0gYSAvIDUwMCArIGZ5O1xuXHRsZXQgZnogPSBmeSAtIGIgLyAyMDA7XG5cblx0bGV0IHJlcyA9IHtcblx0XHRtb2RlOiAneHl6NjUnLFxuXHRcdHg6IGZuKGZ4KSAqIEQ2NS5YLFxuXHRcdHk6IGZuKGZ5KSAqIEQ2NS5ZLFxuXHRcdHo6IGZuKGZ6KSAqIEQ2NS5aXG5cdH07XG5cblx0aWYgKGFscGhhICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXMuYWxwaGEgPSBhbHBoYTtcblx0fVxuXG5cdHJldHVybiByZXM7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBjb252ZXJ0TGFiNjVUb1h5ejY1O1xuIiwgImltcG9ydCBjb252ZXJ0TGFiNjVUb1h5ejY1IGZyb20gJy4vY29udmVydExhYjY1VG9YeXo2NS5qcyc7XG5pbXBvcnQgY29udmVydFh5ejY1VG9SZ2IgZnJvbSAnLi4veHl6NjUvY29udmVydFh5ejY1VG9SZ2IuanMnO1xuXG5jb25zdCBjb252ZXJ0TGFiNjVUb1JnYiA9IGxhYiA9PiBjb252ZXJ0WHl6NjVUb1JnYihjb252ZXJ0TGFiNjVUb1h5ejY1KGxhYikpO1xuXG5leHBvcnQgZGVmYXVsdCBjb252ZXJ0TGFiNjVUb1JnYjtcbiIsICJpbXBvcnQgeyBrLCBlIH0gZnJvbSAnLi4veHl6NjUvY29uc3RhbnRzLmpzJztcbmltcG9ydCB7IEQ2NSB9IGZyb20gJy4uL2NvbnN0YW50cy5qcyc7XG5cbmNvbnN0IGYgPSB2YWx1ZSA9PiAodmFsdWUgPiBlID8gTWF0aC5jYnJ0KHZhbHVlKSA6IChrICogdmFsdWUgKyAxNikgLyAxMTYpO1xuXG5jb25zdCBjb252ZXJ0WHl6NjVUb0xhYjY1ID0gKHsgeCwgeSwgeiwgYWxwaGEgfSkgPT4ge1xuXHRpZiAoeCA9PT0gdW5kZWZpbmVkKSB4ID0gMDtcblx0aWYgKHkgPT09IHVuZGVmaW5lZCkgeSA9IDA7XG5cdGlmICh6ID09PSB1bmRlZmluZWQpIHogPSAwO1xuXHRsZXQgZjAgPSBmKHggLyBENjUuWCk7XG5cdGxldCBmMSA9IGYoeSAvIEQ2NS5ZKTtcblx0bGV0IGYyID0gZih6IC8gRDY1LlopO1xuXG5cdGxldCByZXMgPSB7XG5cdFx0bW9kZTogJ2xhYjY1Jyxcblx0XHRsOiAxMTYgKiBmMSAtIDE2LFxuXHRcdGE6IDUwMCAqIChmMCAtIGYxKSxcblx0XHRiOiAyMDAgKiAoZjEgLSBmMilcblx0fTtcblxuXHRpZiAoYWxwaGEgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJlcy5hbHBoYSA9IGFscGhhO1xuXHR9XG5cblx0cmV0dXJuIHJlcztcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNvbnZlcnRYeXo2NVRvTGFiNjU7XG4iLCAiaW1wb3J0IGNvbnZlcnRSZ2JUb1h5ejY1IGZyb20gJy4uL3h5ejY1L2NvbnZlcnRSZ2JUb1h5ejY1LmpzJztcbmltcG9ydCBjb252ZXJ0WHl6NjVUb0xhYjY1IGZyb20gJy4vY29udmVydFh5ejY1VG9MYWI2NS5qcyc7XG5cbmNvbnN0IGNvbnZlcnRSZ2JUb0xhYjY1ID0gcmdiID0+IHtcblx0bGV0IHJlcyA9IGNvbnZlcnRYeXo2NVRvTGFiNjUoY29udmVydFJnYlRvWHl6NjUocmdiKSk7XG5cblx0Ly8gRml4ZXMgYWNocm9tYXRpYyBSR0IgY29sb3JzIGhhdmluZyBhIF9zbGlnaHRfIGNocm9tYSBkdWUgdG8gZmxvYXRpbmctcG9pbnQgZXJyb3JzXG5cdC8vIGFuZCBhcHByb3hpbWF0ZWQgY29tcHV0YXRpb25zIGluIHNSR0IgPC0+IENJRUxhYi5cblx0Ly8gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vZDMvZDMtY29sb3IvcHVsbC80NlxuXHRpZiAocmdiLnIgPT09IHJnYi5iICYmIHJnYi5iID09PSByZ2IuZykge1xuXHRcdHJlcy5hID0gcmVzLmIgPSAwO1xuXHR9XG5cdHJldHVybiByZXM7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBjb252ZXJ0UmdiVG9MYWI2NTtcbiIsICJleHBvcnQgY29uc3Qga0UgPSAxO1xuZXhwb3J0IGNvbnN0IGtDSCA9IDE7XG5leHBvcnQgY29uc3QgXHUwM0I4ID0gKDI2IC8gMTgwKSAqIE1hdGguUEk7XG5leHBvcnQgY29uc3QgY29zXHUwM0I4ID0gTWF0aC5jb3MoXHUwM0I4KTtcbmV4cG9ydCBjb25zdCBzaW5cdTAzQjggPSBNYXRoLnNpbihcdTAzQjgpO1xuZXhwb3J0IGNvbnN0IGZhY3RvciA9IDEwMCAvIE1hdGgubG9nKDEzOSAvIDEwMCk7IC8vIH4gMzAzLjY3XG4iLCAiaW1wb3J0IHsga0NILCBrRSwgc2luXHUwM0I4LCBjb3NcdTAzQjgsIFx1MDNCOCwgZmFjdG9yIH0gZnJvbSAnLi9jb25zdGFudHMuanMnO1xuXG4vKlxuXHRDb252ZXJ0IERJTjk5byBMQ2ggdG8gQ0lFTGFiIEQ2NVxuXHQtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICovXG5cbmNvbnN0IGNvbnZlcnREbGNoVG9MYWI2NSA9ICh7IGwsIGMsIGgsIGFscGhhIH0pID0+IHtcblx0aWYgKGwgPT09IHVuZGVmaW5lZCkgbCA9IDA7XG5cdGlmIChjID09PSB1bmRlZmluZWQpIGMgPSAwO1xuXHRpZiAoaCA9PT0gdW5kZWZpbmVkKSBoID0gMDtcblx0bGV0IHJlcyA9IHtcblx0XHRtb2RlOiAnbGFiNjUnLFxuXHRcdGw6IChNYXRoLmV4cCgobCAqIGtFKSAvIGZhY3RvcikgLSAxKSAvIDAuMDAzOVxuXHR9O1xuXG5cdGxldCBHID0gKE1hdGguZXhwKDAuMDQzNSAqIGMgKiBrQ0ggKiBrRSkgLSAxKSAvIDAuMDc1O1xuXHRsZXQgZSA9IEcgKiBNYXRoLmNvcygoaCAvIDE4MCkgKiBNYXRoLlBJIC0gXHUwM0I4KTtcblx0bGV0IGYgPSBHICogTWF0aC5zaW4oKGggLyAxODApICogTWF0aC5QSSAtIFx1MDNCOCk7XG5cdHJlcy5hID0gZSAqIGNvc1x1MDNCOCAtIChmIC8gMC44MykgKiBzaW5cdTAzQjg7XG5cdHJlcy5iID0gZSAqIHNpblx1MDNCOCArIChmIC8gMC44MykgKiBjb3NcdTAzQjg7XG5cblx0aWYgKGFscGhhICE9PSB1bmRlZmluZWQpIHJlcy5hbHBoYSA9IGFscGhhO1xuXHRyZXR1cm4gcmVzO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgY29udmVydERsY2hUb0xhYjY1O1xuIiwgImltcG9ydCB7IGtDSCwga0UsIHNpblx1MDNCOCwgY29zXHUwM0I4LCBcdTAzQjgsIGZhY3RvciB9IGZyb20gJy4vY29uc3RhbnRzLmpzJztcbmltcG9ydCBub3JtYWxpemVIdWUgZnJvbSAnLi4vdXRpbC9ub3JtYWxpemVIdWUuanMnO1xuXG4vKlxuXHRDb252ZXJ0IENJRUxhYiBENjUgdG8gRElOOTlvIExDaFxuXHQ9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICovXG5cbmNvbnN0IGNvbnZlcnRMYWI2NVRvRGxjaCA9ICh7IGwsIGEsIGIsIGFscGhhIH0pID0+IHtcblx0aWYgKGwgPT09IHVuZGVmaW5lZCkgbCA9IDA7XG5cdGlmIChhID09PSB1bmRlZmluZWQpIGEgPSAwO1xuXHRpZiAoYiA9PT0gdW5kZWZpbmVkKSBiID0gMDtcblx0bGV0IGUgPSBhICogY29zXHUwM0I4ICsgYiAqIHNpblx1MDNCODtcblx0bGV0IGYgPSAwLjgzICogKGIgKiBjb3NcdTAzQjggLSBhICogc2luXHUwM0I4KTtcblx0bGV0IEcgPSBNYXRoLnNxcnQoZSAqIGUgKyBmICogZik7XG5cdGxldCByZXMgPSB7XG5cdFx0bW9kZTogJ2RsY2gnLFxuXHRcdGw6IChmYWN0b3IgLyBrRSkgKiBNYXRoLmxvZygxICsgMC4wMDM5ICogbCksXG5cdFx0YzogTWF0aC5sb2coMSArIDAuMDc1ICogRykgLyAoMC4wNDM1ICoga0NIICoga0UpXG5cdH07XG5cblx0aWYgKHJlcy5jKSB7XG5cdFx0cmVzLmggPSBub3JtYWxpemVIdWUoKChNYXRoLmF0YW4yKGYsIGUpICsgXHUwM0I4KSAvIE1hdGguUEkpICogMTgwKTtcblx0fVxuXG5cdGlmIChhbHBoYSAhPT0gdW5kZWZpbmVkKSByZXMuYWxwaGEgPSBhbHBoYTtcblx0cmV0dXJuIHJlcztcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNvbnZlcnRMYWI2NVRvRGxjaDtcbiIsICJpbXBvcnQgY29udmVydExhYlRvTGNoIGZyb20gJy4uL2xjaC9jb252ZXJ0TGFiVG9MY2guanMnO1xuaW1wb3J0IGNvbnZlcnRMY2hUb0xhYiBmcm9tICcuLi9sY2gvY29udmVydExjaFRvTGFiLmpzJztcbmltcG9ydCBjb252ZXJ0TGFiNjVUb1JnYiBmcm9tICcuLi9sYWI2NS9jb252ZXJ0TGFiNjVUb1JnYi5qcyc7XG5pbXBvcnQgY29udmVydFJnYlRvTGFiNjUgZnJvbSAnLi4vbGFiNjUvY29udmVydFJnYlRvTGFiNjUuanMnO1xuaW1wb3J0IGNvbnZlcnREbGNoVG9MYWI2NSBmcm9tICcuLi9kbGNoL2NvbnZlcnREbGNoVG9MYWI2NS5qcyc7XG5pbXBvcnQgY29udmVydExhYjY1VG9EbGNoIGZyb20gJy4uL2RsY2gvY29udmVydExhYjY1VG9EbGNoLmpzJztcbmltcG9ydCB7IGludGVycG9sYXRvckxpbmVhciB9IGZyb20gJy4uL2ludGVycG9sYXRlL2xpbmVhci5qcyc7XG5pbXBvcnQgeyBmaXh1cEFscGhhIH0gZnJvbSAnLi4vZml4dXAvYWxwaGEuanMnO1xuXG5jb25zdCBjb252ZXJ0RGxhYlRvTGFiNjUgPSBjID0+IGNvbnZlcnREbGNoVG9MYWI2NShjb252ZXJ0TGFiVG9MY2goYywgJ2RsY2gnKSk7XG5jb25zdCBjb252ZXJ0TGFiNjVUb0RsYWIgPSBjID0+IGNvbnZlcnRMY2hUb0xhYihjb252ZXJ0TGFiNjVUb0RsY2goYyksICdkbGFiJyk7XG5cbmNvbnN0IGRlZmluaXRpb24gPSB7XG5cdG1vZGU6ICdkbGFiJyxcblxuXHRwYXJzZTogWyctLWRpbjk5by1sYWInXSxcblx0c2VyaWFsaXplOiAnLS1kaW45OW8tbGFiJyxcblxuXHR0b01vZGU6IHtcblx0XHRsYWI2NTogY29udmVydERsYWJUb0xhYjY1LFxuXHRcdHJnYjogYyA9PiBjb252ZXJ0TGFiNjVUb1JnYihjb252ZXJ0RGxhYlRvTGFiNjUoYykpXG5cdH0sXG5cblx0ZnJvbU1vZGU6IHtcblx0XHRsYWI2NTogY29udmVydExhYjY1VG9EbGFiLFxuXHRcdHJnYjogYyA9PiBjb252ZXJ0TGFiNjVUb0RsYWIoY29udmVydFJnYlRvTGFiNjUoYykpXG5cdH0sXG5cblx0Y2hhbm5lbHM6IFsnbCcsICdhJywgJ2InLCAnYWxwaGEnXSxcblxuXHRyYW5nZXM6IHtcblx0XHRsOiBbMCwgMTAwXSxcblx0XHRhOiBbLTQwLjA5LCA0NS41MDFdLFxuXHRcdGI6IFstNDAuNDY5LCA0NC4zNDRdXG5cdH0sXG5cblx0aW50ZXJwb2xhdGU6IHtcblx0XHRsOiBpbnRlcnBvbGF0b3JMaW5lYXIsXG5cdFx0YTogaW50ZXJwb2xhdG9yTGluZWFyLFxuXHRcdGI6IGludGVycG9sYXRvckxpbmVhcixcblx0XHRhbHBoYToge1xuXHRcdFx0dXNlOiBpbnRlcnBvbGF0b3JMaW5lYXIsXG5cdFx0XHRmaXh1cDogZml4dXBBbHBoYVxuXHRcdH1cblx0fVxufTtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5pdGlvbjtcbiIsICJpbXBvcnQgY29udmVydExhYlRvTGNoIGZyb20gJy4uL2xjaC9jb252ZXJ0TGFiVG9MY2guanMnO1xuaW1wb3J0IGNvbnZlcnRMY2hUb0xhYiBmcm9tICcuLi9sY2gvY29udmVydExjaFRvTGFiLmpzJztcbmltcG9ydCBjb252ZXJ0RGxjaFRvTGFiNjUgZnJvbSAnLi9jb252ZXJ0RGxjaFRvTGFiNjUuanMnO1xuaW1wb3J0IGNvbnZlcnRMYWI2NVRvRGxjaCBmcm9tICcuL2NvbnZlcnRMYWI2NVRvRGxjaC5qcyc7XG5pbXBvcnQgY29udmVydExhYjY1VG9SZ2IgZnJvbSAnLi4vbGFiNjUvY29udmVydExhYjY1VG9SZ2IuanMnO1xuaW1wb3J0IGNvbnZlcnRSZ2JUb0xhYjY1IGZyb20gJy4uL2xhYjY1L2NvbnZlcnRSZ2JUb0xhYjY1LmpzJztcblxuaW1wb3J0IHsgZml4dXBIdWVTaG9ydGVyIH0gZnJvbSAnLi4vZml4dXAvaHVlLmpzJztcbmltcG9ydCB7IGZpeHVwQWxwaGEgfSBmcm9tICcuLi9maXh1cC9hbHBoYS5qcyc7XG5pbXBvcnQgeyBpbnRlcnBvbGF0b3JMaW5lYXIgfSBmcm9tICcuLi9pbnRlcnBvbGF0ZS9saW5lYXIuanMnO1xuaW1wb3J0IHsgZGlmZmVyZW5jZUh1ZUNocm9tYSB9IGZyb20gJy4uL2RpZmZlcmVuY2UuanMnO1xuaW1wb3J0IHsgYXZlcmFnZUFuZ2xlIH0gZnJvbSAnLi4vYXZlcmFnZS5qcyc7XG5cbmNvbnN0IGRlZmluaXRpb24gPSB7XG5cdG1vZGU6ICdkbGNoJyxcblxuXHRwYXJzZTogWyctLWRpbjk5by1sY2gnXSxcblx0c2VyaWFsaXplOiAnLS1kaW45OW8tbGNoJyxcblxuXHR0b01vZGU6IHtcblx0XHRsYWI2NTogY29udmVydERsY2hUb0xhYjY1LFxuXHRcdGRsYWI6IGMgPT4gY29udmVydExjaFRvTGFiKGMsICdkbGFiJyksXG5cdFx0cmdiOiBjID0+IGNvbnZlcnRMYWI2NVRvUmdiKGNvbnZlcnREbGNoVG9MYWI2NShjKSlcblx0fSxcblxuXHRmcm9tTW9kZToge1xuXHRcdGxhYjY1OiBjb252ZXJ0TGFiNjVUb0RsY2gsXG5cdFx0ZGxhYjogYyA9PiBjb252ZXJ0TGFiVG9MY2goYywgJ2RsY2gnKSxcblx0XHRyZ2I6IGMgPT4gY29udmVydExhYjY1VG9EbGNoKGNvbnZlcnRSZ2JUb0xhYjY1KGMpKVxuXHR9LFxuXG5cdGNoYW5uZWxzOiBbJ2wnLCAnYycsICdoJywgJ2FscGhhJ10sXG5cblx0cmFuZ2VzOiB7XG5cdFx0bDogWzAsIDEwMF0sXG5cdFx0YzogWzAsIDUxLjQ4NF0sXG5cdFx0aDogWzAsIDM2MF1cblx0fSxcblxuXHRpbnRlcnBvbGF0ZToge1xuXHRcdGw6IGludGVycG9sYXRvckxpbmVhcixcblx0XHRjOiBpbnRlcnBvbGF0b3JMaW5lYXIsXG5cdFx0aDoge1xuXHRcdFx0dXNlOiBpbnRlcnBvbGF0b3JMaW5lYXIsXG5cdFx0XHRmaXh1cDogZml4dXBIdWVTaG9ydGVyXG5cdFx0fSxcblx0XHRhbHBoYToge1xuXHRcdFx0dXNlOiBpbnRlcnBvbGF0b3JMaW5lYXIsXG5cdFx0XHRmaXh1cDogZml4dXBBbHBoYVxuXHRcdH1cblx0fSxcblxuXHRkaWZmZXJlbmNlOiB7XG5cdFx0aDogZGlmZmVyZW5jZUh1ZUNocm9tYVxuXHR9LFxuXG5cdGF2ZXJhZ2U6IHtcblx0XHRoOiBhdmVyYWdlQW5nbGVcblx0fVxufTtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5pdGlvbjtcbiIsICJpbXBvcnQgbm9ybWFsaXplSHVlIGZyb20gJy4uL3V0aWwvbm9ybWFsaXplSHVlLmpzJztcblxuLy8gQmFzZWQgb246IGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0hTTF9hbmRfSFNWI0NvbnZlcnRpbmdfdG9fUkdCXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGNvbnZlcnRIc2lUb1JnYih7IGgsIHMsIGksIGFscGhhIH0pIHtcblx0aCA9IG5vcm1hbGl6ZUh1ZShoICE9PSB1bmRlZmluZWQgPyBoIDogMCk7XG5cdGlmIChzID09PSB1bmRlZmluZWQpIHMgPSAwO1xuXHRpZiAoaSA9PT0gdW5kZWZpbmVkKSBpID0gMDtcblx0bGV0IGYgPSBNYXRoLmFicygoKGggLyA2MCkgJSAyKSAtIDEpO1xuXHRsZXQgcmVzO1xuXHRzd2l0Y2ggKE1hdGguZmxvb3IoaCAvIDYwKSkge1xuXHRcdGNhc2UgMDpcblx0XHRcdHJlcyA9IHtcblx0XHRcdFx0cjogaSAqICgxICsgcyAqICgzIC8gKDIgLSBmKSAtIDEpKSxcblx0XHRcdFx0ZzogaSAqICgxICsgcyAqICgoMyAqICgxIC0gZikpIC8gKDIgLSBmKSAtIDEpKSxcblx0XHRcdFx0YjogaSAqICgxIC0gcylcblx0XHRcdH07XG5cdFx0XHRicmVhaztcblx0XHRjYXNlIDE6XG5cdFx0XHRyZXMgPSB7XG5cdFx0XHRcdHI6IGkgKiAoMSArIHMgKiAoKDMgKiAoMSAtIGYpKSAvICgyIC0gZikgLSAxKSksXG5cdFx0XHRcdGc6IGkgKiAoMSArIHMgKiAoMyAvICgyIC0gZikgLSAxKSksXG5cdFx0XHRcdGI6IGkgKiAoMSAtIHMpXG5cdFx0XHR9O1xuXHRcdFx0YnJlYWs7XG5cdFx0Y2FzZSAyOlxuXHRcdFx0cmVzID0ge1xuXHRcdFx0XHRyOiBpICogKDEgLSBzKSxcblx0XHRcdFx0ZzogaSAqICgxICsgcyAqICgzIC8gKDIgLSBmKSAtIDEpKSxcblx0XHRcdFx0YjogaSAqICgxICsgcyAqICgoMyAqICgxIC0gZikpIC8gKDIgLSBmKSAtIDEpKVxuXHRcdFx0fTtcblx0XHRcdGJyZWFrO1xuXHRcdGNhc2UgMzpcblx0XHRcdHJlcyA9IHtcblx0XHRcdFx0cjogaSAqICgxIC0gcyksXG5cdFx0XHRcdGc6IGkgKiAoMSArIHMgKiAoKDMgKiAoMSAtIGYpKSAvICgyIC0gZikgLSAxKSksXG5cdFx0XHRcdGI6IGkgKiAoMSArIHMgKiAoMyAvICgyIC0gZikgLSAxKSlcblx0XHRcdH07XG5cdFx0XHRicmVhaztcblx0XHRjYXNlIDQ6XG5cdFx0XHRyZXMgPSB7XG5cdFx0XHRcdHI6IGkgKiAoMSArIHMgKiAoKDMgKiAoMSAtIGYpKSAvICgyIC0gZikgLSAxKSksXG5cdFx0XHRcdGc6IGkgKiAoMSAtIHMpLFxuXHRcdFx0XHRiOiBpICogKDEgKyBzICogKDMgLyAoMiAtIGYpIC0gMSkpXG5cdFx0XHR9O1xuXHRcdFx0YnJlYWs7XG5cdFx0Y2FzZSA1OlxuXHRcdFx0cmVzID0ge1xuXHRcdFx0XHRyOiBpICogKDEgKyBzICogKDMgLyAoMiAtIGYpIC0gMSkpLFxuXHRcdFx0XHRnOiBpICogKDEgLSBzKSxcblx0XHRcdFx0YjogaSAqICgxICsgcyAqICgoMyAqICgxIC0gZikpIC8gKDIgLSBmKSAtIDEpKVxuXHRcdFx0fTtcblx0XHRcdGJyZWFrO1xuXHRcdGRlZmF1bHQ6XG5cdFx0XHRyZXMgPSB7IHI6IGkgKiAoMSAtIHMpLCBnOiBpICogKDEgLSBzKSwgYjogaSAqICgxIC0gcykgfTtcblx0fVxuXG5cdHJlcy5tb2RlID0gJ3JnYic7XG5cdGlmIChhbHBoYSAhPT0gdW5kZWZpbmVkKSByZXMuYWxwaGEgPSBhbHBoYTtcblx0cmV0dXJuIHJlcztcbn1cbiIsICIvLyBCYXNlZCBvbjogaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvSFNMX2FuZF9IU1YjRm9ybWFsX2Rlcml2YXRpb25cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gY29udmVydFJnYlRvSHNpKHsgciwgZywgYiwgYWxwaGEgfSkge1xuXHRpZiAociA9PT0gdW5kZWZpbmVkKSByID0gMDtcblx0aWYgKGcgPT09IHVuZGVmaW5lZCkgZyA9IDA7XG5cdGlmIChiID09PSB1bmRlZmluZWQpIGIgPSAwO1xuXHRsZXQgTSA9IE1hdGgubWF4KHIsIGcsIGIpLFxuXHRcdG0gPSBNYXRoLm1pbihyLCBnLCBiKTtcblx0bGV0IHJlcyA9IHtcblx0XHRtb2RlOiAnaHNpJyxcblx0XHRzOiByICsgZyArIGIgPT09IDAgPyAwIDogMSAtICgzICogbSkgLyAociArIGcgKyBiKSxcblx0XHRpOiAociArIGcgKyBiKSAvIDNcblx0fTtcblx0aWYgKE0gLSBtICE9PSAwKVxuXHRcdHJlcy5oID1cblx0XHRcdChNID09PSByXG5cdFx0XHRcdD8gKGcgLSBiKSAvIChNIC0gbSkgKyAoZyA8IGIpICogNlxuXHRcdFx0XHQ6IE0gPT09IGdcblx0XHRcdFx0PyAoYiAtIHIpIC8gKE0gLSBtKSArIDJcblx0XHRcdFx0OiAociAtIGcpIC8gKE0gLSBtKSArIDQpICogNjA7XG5cdGlmIChhbHBoYSAhPT0gdW5kZWZpbmVkKSByZXMuYWxwaGEgPSBhbHBoYTtcblx0cmV0dXJuIHJlcztcbn1cbiIsICJpbXBvcnQgY29udmVydEhzaVRvUmdiIGZyb20gJy4vY29udmVydEhzaVRvUmdiLmpzJztcbmltcG9ydCBjb252ZXJ0UmdiVG9Ic2kgZnJvbSAnLi9jb252ZXJ0UmdiVG9Ic2kuanMnO1xuaW1wb3J0IHsgZml4dXBIdWVTaG9ydGVyIH0gZnJvbSAnLi4vZml4dXAvaHVlLmpzJztcbmltcG9ydCB7IGZpeHVwQWxwaGEgfSBmcm9tICcuLi9maXh1cC9hbHBoYS5qcyc7XG5pbXBvcnQgeyBpbnRlcnBvbGF0b3JMaW5lYXIgfSBmcm9tICcuLi9pbnRlcnBvbGF0ZS9saW5lYXIuanMnO1xuaW1wb3J0IHsgZGlmZmVyZW5jZUh1ZVNhdHVyYXRpb24gfSBmcm9tICcuLi9kaWZmZXJlbmNlLmpzJztcbmltcG9ydCB7IGF2ZXJhZ2VBbmdsZSB9IGZyb20gJy4uL2F2ZXJhZ2UuanMnO1xuXG5jb25zdCBkZWZpbml0aW9uID0ge1xuXHRtb2RlOiAnaHNpJyxcblxuXHR0b01vZGU6IHtcblx0XHRyZ2I6IGNvbnZlcnRIc2lUb1JnYlxuXHR9LFxuXG5cdHBhcnNlOiBbJy0taHNpJ10sXG5cdHNlcmlhbGl6ZTogJy0taHNpJyxcblxuXHRmcm9tTW9kZToge1xuXHRcdHJnYjogY29udmVydFJnYlRvSHNpXG5cdH0sXG5cblx0Y2hhbm5lbHM6IFsnaCcsICdzJywgJ2knLCAnYWxwaGEnXSxcblxuXHRyYW5nZXM6IHtcblx0XHRoOiBbMCwgMzYwXVxuXHR9LFxuXG5cdGdhbXV0OiAncmdiJyxcblxuXHRpbnRlcnBvbGF0ZToge1xuXHRcdGg6IHsgdXNlOiBpbnRlcnBvbGF0b3JMaW5lYXIsIGZpeHVwOiBmaXh1cEh1ZVNob3J0ZXIgfSxcblx0XHRzOiBpbnRlcnBvbGF0b3JMaW5lYXIsXG5cdFx0aTogaW50ZXJwb2xhdG9yTGluZWFyLFxuXHRcdGFscGhhOiB7IHVzZTogaW50ZXJwb2xhdG9yTGluZWFyLCBmaXh1cDogZml4dXBBbHBoYSB9XG5cdH0sXG5cblx0ZGlmZmVyZW5jZToge1xuXHRcdGg6IGRpZmZlcmVuY2VIdWVTYXR1cmF0aW9uXG5cdH0sXG5cblx0YXZlcmFnZToge1xuXHRcdGg6IGF2ZXJhZ2VBbmdsZVxuXHR9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbml0aW9uO1xuIiwgImltcG9ydCBub3JtYWxpemVIdWUgZnJvbSAnLi4vdXRpbC9ub3JtYWxpemVIdWUuanMnO1xuLy8gQmFzZWQgb246IGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0hTTF9hbmRfSFNWI0NvbnZlcnRpbmdfdG9fUkdCXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGNvbnZlcnRIc2xUb1JnYih7IGgsIHMsIGwsIGFscGhhIH0pIHtcblx0aCA9IG5vcm1hbGl6ZUh1ZShoICE9PSB1bmRlZmluZWQgPyBoIDogMCk7XG5cdGlmIChzID09PSB1bmRlZmluZWQpIHMgPSAwO1xuXHRpZiAobCA9PT0gdW5kZWZpbmVkKSBsID0gMDtcblx0bGV0IG0xID0gbCArIHMgKiAobCA8IDAuNSA/IGwgOiAxIC0gbCk7XG5cdGxldCBtMiA9IG0xIC0gKG0xIC0gbCkgKiAyICogTWF0aC5hYnMoKChoIC8gNjApICUgMikgLSAxKTtcblx0bGV0IHJlcztcblx0c3dpdGNoIChNYXRoLmZsb29yKGggLyA2MCkpIHtcblx0XHRjYXNlIDA6XG5cdFx0XHRyZXMgPSB7IHI6IG0xLCBnOiBtMiwgYjogMiAqIGwgLSBtMSB9O1xuXHRcdFx0YnJlYWs7XG5cdFx0Y2FzZSAxOlxuXHRcdFx0cmVzID0geyByOiBtMiwgZzogbTEsIGI6IDIgKiBsIC0gbTEgfTtcblx0XHRcdGJyZWFrO1xuXHRcdGNhc2UgMjpcblx0XHRcdHJlcyA9IHsgcjogMiAqIGwgLSBtMSwgZzogbTEsIGI6IG0yIH07XG5cdFx0XHRicmVhaztcblx0XHRjYXNlIDM6XG5cdFx0XHRyZXMgPSB7IHI6IDIgKiBsIC0gbTEsIGc6IG0yLCBiOiBtMSB9O1xuXHRcdFx0YnJlYWs7XG5cdFx0Y2FzZSA0OlxuXHRcdFx0cmVzID0geyByOiBtMiwgZzogMiAqIGwgLSBtMSwgYjogbTEgfTtcblx0XHRcdGJyZWFrO1xuXHRcdGNhc2UgNTpcblx0XHRcdHJlcyA9IHsgcjogbTEsIGc6IDIgKiBsIC0gbTEsIGI6IG0yIH07XG5cdFx0XHRicmVhaztcblx0XHRkZWZhdWx0OlxuXHRcdFx0cmVzID0geyByOiAyICogbCAtIG0xLCBnOiAyICogbCAtIG0xLCBiOiAyICogbCAtIG0xIH07XG5cdH1cblx0cmVzLm1vZGUgPSAncmdiJztcblx0aWYgKGFscGhhICE9PSB1bmRlZmluZWQpIHJlcy5hbHBoYSA9IGFscGhhO1xuXHRyZXR1cm4gcmVzO1xufVxuIiwgIi8vIEJhc2VkIG9uOiBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9IU0xfYW5kX0hTViNGb3JtYWxfZGVyaXZhdGlvblxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBjb252ZXJ0UmdiVG9Ic2woeyByLCBnLCBiLCBhbHBoYSB9KSB7XG5cdGlmIChyID09PSB1bmRlZmluZWQpIHIgPSAwO1xuXHRpZiAoZyA9PT0gdW5kZWZpbmVkKSBnID0gMDtcblx0aWYgKGIgPT09IHVuZGVmaW5lZCkgYiA9IDA7XG5cdGxldCBNID0gTWF0aC5tYXgociwgZywgYiksXG5cdFx0bSA9IE1hdGgubWluKHIsIGcsIGIpO1xuXHRsZXQgcmVzID0ge1xuXHRcdG1vZGU6ICdoc2wnLFxuXHRcdHM6IE0gPT09IG0gPyAwIDogKE0gLSBtKSAvICgxIC0gTWF0aC5hYnMoTSArIG0gLSAxKSksXG5cdFx0bDogMC41ICogKE0gKyBtKVxuXHR9O1xuXHRpZiAoTSAtIG0gIT09IDApXG5cdFx0cmVzLmggPVxuXHRcdFx0KE0gPT09IHJcblx0XHRcdFx0PyAoZyAtIGIpIC8gKE0gLSBtKSArIChnIDwgYikgKiA2XG5cdFx0XHRcdDogTSA9PT0gZ1xuXHRcdFx0XHQ/IChiIC0gcikgLyAoTSAtIG0pICsgMlxuXHRcdFx0XHQ6IChyIC0gZykgLyAoTSAtIG0pICsgNCkgKiA2MDtcblx0aWYgKGFscGhhICE9PSB1bmRlZmluZWQpIHJlcy5hbHBoYSA9IGFscGhhO1xuXHRyZXR1cm4gcmVzO1xufVxuIiwgImNvbnN0IGh1ZVRvRGVnID0gKHZhbCwgdW5pdCkgPT4ge1xuXHRzd2l0Y2ggKHVuaXQpIHtcblx0XHRjYXNlICdkZWcnOlxuXHRcdFx0cmV0dXJuICt2YWw7XG5cdFx0Y2FzZSAncmFkJzpcblx0XHRcdHJldHVybiAodmFsIC8gTWF0aC5QSSkgKiAxODA7XG5cdFx0Y2FzZSAnZ3JhZCc6XG5cdFx0XHRyZXR1cm4gKHZhbCAvIDEwKSAqIDk7XG5cdFx0Y2FzZSAndHVybic6XG5cdFx0XHRyZXR1cm4gdmFsICogMzYwO1xuXHR9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBodWVUb0RlZztcbiIsICJpbXBvcnQgaHVlVG9EZWcgZnJvbSAnLi4vdXRpbC9odWUuanMnO1xuaW1wb3J0IHsgaHVlLCBwZXIsIG51bV9wZXIsIGMgfSBmcm9tICcuLi91dGlsL3JlZ2V4LmpzJztcblxuLypcblx0aHNsKCkgcmVndWxhciBleHByZXNzaW9ucyBmb3IgbGVnYWN5IGZvcm1hdFxuXHRSZWZlcmVuY2U6IGh0dHBzOi8vZHJhZnRzLmNzc3dnLm9yZy9jc3MtY29sb3IvI3RoZS1oc2wtbm90YXRpb25cbiAqL1xuY29uc3QgaHNsX29sZCA9IG5ldyBSZWdFeHAoXG5cdGBeaHNsYT9cXFxcKFxcXFxzKiR7aHVlfSR7Y30ke3Blcn0ke2N9JHtwZXJ9XFxcXHMqKD86LFxcXFxzKiR7bnVtX3Blcn1cXFxccyopP1xcXFwpJGBcbik7XG5cbmNvbnN0IHBhcnNlSHNsTGVnYWN5ID0gY29sb3IgPT4ge1xuXHRsZXQgbWF0Y2ggPSBjb2xvci5tYXRjaChoc2xfb2xkKTtcblx0aWYgKCFtYXRjaCkgcmV0dXJuO1xuXHRsZXQgcmVzID0geyBtb2RlOiAnaHNsJyB9O1xuXG5cdGlmIChtYXRjaFszXSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmVzLmggPSArbWF0Y2hbM107XG5cdH0gZWxzZSBpZiAobWF0Y2hbMV0gIT09IHVuZGVmaW5lZCAmJiBtYXRjaFsyXSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmVzLmggPSBodWVUb0RlZyhtYXRjaFsxXSwgbWF0Y2hbMl0pO1xuXHR9XG5cblx0aWYgKG1hdGNoWzRdICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXMucyA9IE1hdGgubWluKE1hdGgubWF4KDAsIG1hdGNoWzRdIC8gMTAwKSwgMSk7XG5cdH1cblxuXHRpZiAobWF0Y2hbNV0gIT09IHVuZGVmaW5lZCkge1xuXHRcdHJlcy5sID0gTWF0aC5taW4oTWF0aC5tYXgoMCwgbWF0Y2hbNV0gLyAxMDApLCAxKTtcblx0fVxuXG5cdGlmIChtYXRjaFs2XSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmVzLmFscGhhID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oMSwgbWF0Y2hbNl0gLyAxMDApKTtcblx0fSBlbHNlIGlmIChtYXRjaFs3XSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmVzLmFscGhhID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oMSwgK21hdGNoWzddKSk7XG5cdH1cblx0cmV0dXJuIHJlcztcbn07XG5cbmV4cG9ydCBkZWZhdWx0IHBhcnNlSHNsTGVnYWN5O1xuIiwgImltcG9ydCB7IFRvayB9IGZyb20gJy4uL3BhcnNlLmpzJztcblxuZnVuY3Rpb24gcGFyc2VIc2woY29sb3IsIHBhcnNlZCkge1xuXHRpZiAoIXBhcnNlZCB8fCAocGFyc2VkWzBdICE9PSAnaHNsJyAmJiBwYXJzZWRbMF0gIT09ICdoc2xhJykpIHtcblx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHR9XG5cdGNvbnN0IHJlcyA9IHsgbW9kZTogJ2hzbCcgfTtcblx0Y29uc3QgWywgaCwgcywgbCwgYWxwaGFdID0gcGFyc2VkO1xuXG5cdGlmIChoLnR5cGUgIT09IFRvay5Ob25lKSB7XG5cdFx0aWYgKGgudHlwZSA9PT0gVG9rLlBlcmNlbnRhZ2UpIHtcblx0XHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdFx0fVxuXHRcdHJlcy5oID0gaC52YWx1ZTtcblx0fVxuXG5cdGlmIChzLnR5cGUgIT09IFRvay5Ob25lKSB7XG5cdFx0aWYgKHMudHlwZSA9PT0gVG9rLkh1ZSkge1xuXHRcdFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0XHR9XG5cdFx0cmVzLnMgPSBzLnZhbHVlIC8gMTAwO1xuXHR9XG5cblx0aWYgKGwudHlwZSAhPT0gVG9rLk5vbmUpIHtcblx0XHRpZiAobC50eXBlID09PSBUb2suSHVlKSB7XG5cdFx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHRcdH1cblx0XHRyZXMubCA9IGwudmFsdWUgLyAxMDA7XG5cdH1cblxuXHRpZiAoYWxwaGEudHlwZSAhPT0gVG9rLk5vbmUpIHtcblx0XHRyZXMuYWxwaGEgPSBNYXRoLm1pbihcblx0XHRcdDEsXG5cdFx0XHRNYXRoLm1heChcblx0XHRcdFx0MCxcblx0XHRcdFx0YWxwaGEudHlwZSA9PT0gVG9rLk51bWJlciA/IGFscGhhLnZhbHVlIDogYWxwaGEudmFsdWUgLyAxMDBcblx0XHRcdClcblx0XHQpO1xuXHR9XG5cblx0cmV0dXJuIHJlcztcbn1cblxuZXhwb3J0IGRlZmF1bHQgcGFyc2VIc2w7XG4iLCAiaW1wb3J0IGNvbnZlcnRIc2xUb1JnYiBmcm9tICcuL2NvbnZlcnRIc2xUb1JnYi5qcyc7XG5pbXBvcnQgY29udmVydFJnYlRvSHNsIGZyb20gJy4vY29udmVydFJnYlRvSHNsLmpzJztcbmltcG9ydCBwYXJzZUhzbExlZ2FjeSBmcm9tICcuL3BhcnNlSHNsTGVnYWN5LmpzJztcbmltcG9ydCBwYXJzZUhzbCBmcm9tICcuL3BhcnNlSHNsLmpzJztcbmltcG9ydCB7IGZpeHVwSHVlU2hvcnRlciB9IGZyb20gJy4uL2ZpeHVwL2h1ZS5qcyc7XG5pbXBvcnQgeyBmaXh1cEFscGhhIH0gZnJvbSAnLi4vZml4dXAvYWxwaGEuanMnO1xuaW1wb3J0IHsgaW50ZXJwb2xhdG9yTGluZWFyIH0gZnJvbSAnLi4vaW50ZXJwb2xhdGUvbGluZWFyLmpzJztcbmltcG9ydCB7IGRpZmZlcmVuY2VIdWVTYXR1cmF0aW9uIH0gZnJvbSAnLi4vZGlmZmVyZW5jZS5qcyc7XG5pbXBvcnQgeyBhdmVyYWdlQW5nbGUgfSBmcm9tICcuLi9hdmVyYWdlLmpzJztcblxuY29uc3QgZGVmaW5pdGlvbiA9IHtcblx0bW9kZTogJ2hzbCcsXG5cblx0dG9Nb2RlOiB7XG5cdFx0cmdiOiBjb252ZXJ0SHNsVG9SZ2Jcblx0fSxcblxuXHRmcm9tTW9kZToge1xuXHRcdHJnYjogY29udmVydFJnYlRvSHNsXG5cdH0sXG5cblx0Y2hhbm5lbHM6IFsnaCcsICdzJywgJ2wnLCAnYWxwaGEnXSxcblxuXHRyYW5nZXM6IHtcblx0XHRoOiBbMCwgMzYwXVxuXHR9LFxuXG5cdGdhbXV0OiAncmdiJyxcblxuXHRwYXJzZTogW3BhcnNlSHNsLCBwYXJzZUhzbExlZ2FjeV0sXG5cdHNlcmlhbGl6ZTogYyA9PlxuXHRcdGBoc2woJHtjLmggIT09IHVuZGVmaW5lZCA/IGMuaCA6ICdub25lJ30gJHtcblx0XHRcdGMucyAhPT0gdW5kZWZpbmVkID8gYy5zICogMTAwICsgJyUnIDogJ25vbmUnXG5cdFx0fSAke2MubCAhPT0gdW5kZWZpbmVkID8gYy5sICogMTAwICsgJyUnIDogJ25vbmUnfSR7XG5cdFx0XHRjLmFscGhhIDwgMSA/IGAgLyAke2MuYWxwaGF9YCA6ICcnXG5cdFx0fSlgLFxuXG5cdGludGVycG9sYXRlOiB7XG5cdFx0aDogeyB1c2U6IGludGVycG9sYXRvckxpbmVhciwgZml4dXA6IGZpeHVwSHVlU2hvcnRlciB9LFxuXHRcdHM6IGludGVycG9sYXRvckxpbmVhcixcblx0XHRsOiBpbnRlcnBvbGF0b3JMaW5lYXIsXG5cdFx0YWxwaGE6IHsgdXNlOiBpbnRlcnBvbGF0b3JMaW5lYXIsIGZpeHVwOiBmaXh1cEFscGhhIH1cblx0fSxcblxuXHRkaWZmZXJlbmNlOiB7XG5cdFx0aDogZGlmZmVyZW5jZUh1ZVNhdHVyYXRpb25cblx0fSxcblxuXHRhdmVyYWdlOiB7XG5cdFx0aDogYXZlcmFnZUFuZ2xlXG5cdH1cbn07XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluaXRpb247XG4iLCAiaW1wb3J0IG5vcm1hbGl6ZUh1ZSBmcm9tICcuLi91dGlsL25vcm1hbGl6ZUh1ZS5qcyc7XG5cbi8vIEJhc2VkIG9uOiBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9IU0xfYW5kX0hTViNDb252ZXJ0aW5nX3RvX1JHQlxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBjb252ZXJ0SHN2VG9SZ2IoeyBoLCBzLCB2LCBhbHBoYSB9KSB7XG5cdGggPSBub3JtYWxpemVIdWUoaCAhPT0gdW5kZWZpbmVkID8gaCA6IDApO1xuXHRpZiAocyA9PT0gdW5kZWZpbmVkKSBzID0gMDtcblx0aWYgKHYgPT09IHVuZGVmaW5lZCkgdiA9IDA7XG5cdGxldCBmID0gTWF0aC5hYnMoKChoIC8gNjApICUgMikgLSAxKTtcblx0bGV0IHJlcztcblx0c3dpdGNoIChNYXRoLmZsb29yKGggLyA2MCkpIHtcblx0XHRjYXNlIDA6XG5cdFx0XHRyZXMgPSB7IHI6IHYsIGc6IHYgKiAoMSAtIHMgKiBmKSwgYjogdiAqICgxIC0gcykgfTtcblx0XHRcdGJyZWFrO1xuXHRcdGNhc2UgMTpcblx0XHRcdHJlcyA9IHsgcjogdiAqICgxIC0gcyAqIGYpLCBnOiB2LCBiOiB2ICogKDEgLSBzKSB9O1xuXHRcdFx0YnJlYWs7XG5cdFx0Y2FzZSAyOlxuXHRcdFx0cmVzID0geyByOiB2ICogKDEgLSBzKSwgZzogdiwgYjogdiAqICgxIC0gcyAqIGYpIH07XG5cdFx0XHRicmVhaztcblx0XHRjYXNlIDM6XG5cdFx0XHRyZXMgPSB7IHI6IHYgKiAoMSAtIHMpLCBnOiB2ICogKDEgLSBzICogZiksIGI6IHYgfTtcblx0XHRcdGJyZWFrO1xuXHRcdGNhc2UgNDpcblx0XHRcdHJlcyA9IHsgcjogdiAqICgxIC0gcyAqIGYpLCBnOiB2ICogKDEgLSBzKSwgYjogdiB9O1xuXHRcdFx0YnJlYWs7XG5cdFx0Y2FzZSA1OlxuXHRcdFx0cmVzID0geyByOiB2LCBnOiB2ICogKDEgLSBzKSwgYjogdiAqICgxIC0gcyAqIGYpIH07XG5cdFx0XHRicmVhaztcblx0XHRkZWZhdWx0OlxuXHRcdFx0cmVzID0geyByOiB2ICogKDEgLSBzKSwgZzogdiAqICgxIC0gcyksIGI6IHYgKiAoMSAtIHMpIH07XG5cdH1cblx0cmVzLm1vZGUgPSAncmdiJztcblx0aWYgKGFscGhhICE9PSB1bmRlZmluZWQpIHJlcy5hbHBoYSA9IGFscGhhO1xuXHRyZXR1cm4gcmVzO1xufVxuIiwgIi8vIEJhc2VkIG9uOiBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9IU0xfYW5kX0hTViNGb3JtYWxfZGVyaXZhdGlvblxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBjb252ZXJ0UmdiVG9Ic3YoeyByLCBnLCBiLCBhbHBoYSB9KSB7XG5cdGlmIChyID09PSB1bmRlZmluZWQpIHIgPSAwO1xuXHRpZiAoZyA9PT0gdW5kZWZpbmVkKSBnID0gMDtcblx0aWYgKGIgPT09IHVuZGVmaW5lZCkgYiA9IDA7XG5cdGxldCBNID0gTWF0aC5tYXgociwgZywgYiksXG5cdFx0bSA9IE1hdGgubWluKHIsIGcsIGIpO1xuXHRsZXQgcmVzID0ge1xuXHRcdG1vZGU6ICdoc3YnLFxuXHRcdHM6IE0gPT09IDAgPyAwIDogMSAtIG0gLyBNLFxuXHRcdHY6IE1cblx0fTtcblx0aWYgKE0gLSBtICE9PSAwKVxuXHRcdHJlcy5oID1cblx0XHRcdChNID09PSByXG5cdFx0XHRcdD8gKGcgLSBiKSAvIChNIC0gbSkgKyAoZyA8IGIpICogNlxuXHRcdFx0XHQ6IE0gPT09IGdcblx0XHRcdFx0PyAoYiAtIHIpIC8gKE0gLSBtKSArIDJcblx0XHRcdFx0OiAociAtIGcpIC8gKE0gLSBtKSArIDQpICogNjA7XG5cdGlmIChhbHBoYSAhPT0gdW5kZWZpbmVkKSByZXMuYWxwaGEgPSBhbHBoYTtcblx0cmV0dXJuIHJlcztcbn1cbiIsICJpbXBvcnQgY29udmVydEhzdlRvUmdiIGZyb20gJy4vY29udmVydEhzdlRvUmdiLmpzJztcbmltcG9ydCBjb252ZXJ0UmdiVG9Ic3YgZnJvbSAnLi9jb252ZXJ0UmdiVG9Ic3YuanMnO1xuaW1wb3J0IHsgZml4dXBIdWVTaG9ydGVyIH0gZnJvbSAnLi4vZml4dXAvaHVlLmpzJztcbmltcG9ydCB7IGZpeHVwQWxwaGEgfSBmcm9tICcuLi9maXh1cC9hbHBoYS5qcyc7XG5pbXBvcnQgeyBpbnRlcnBvbGF0b3JMaW5lYXIgfSBmcm9tICcuLi9pbnRlcnBvbGF0ZS9saW5lYXIuanMnO1xuaW1wb3J0IHsgZGlmZmVyZW5jZUh1ZVNhdHVyYXRpb24gfSBmcm9tICcuLi9kaWZmZXJlbmNlLmpzJztcbmltcG9ydCB7IGF2ZXJhZ2VBbmdsZSB9IGZyb20gJy4uL2F2ZXJhZ2UuanMnO1xuXG5jb25zdCBkZWZpbml0aW9uID0ge1xuXHRtb2RlOiAnaHN2JyxcblxuXHR0b01vZGU6IHtcblx0XHRyZ2I6IGNvbnZlcnRIc3ZUb1JnYlxuXHR9LFxuXG5cdHBhcnNlOiBbJy0taHN2J10sXG5cdHNlcmlhbGl6ZTogJy0taHN2JyxcblxuXHRmcm9tTW9kZToge1xuXHRcdHJnYjogY29udmVydFJnYlRvSHN2XG5cdH0sXG5cblx0Y2hhbm5lbHM6IFsnaCcsICdzJywgJ3YnLCAnYWxwaGEnXSxcblxuXHRyYW5nZXM6IHtcblx0XHRoOiBbMCwgMzYwXVxuXHR9LFxuXG5cdGdhbXV0OiAncmdiJyxcblxuXHRpbnRlcnBvbGF0ZToge1xuXHRcdGg6IHsgdXNlOiBpbnRlcnBvbGF0b3JMaW5lYXIsIGZpeHVwOiBmaXh1cEh1ZVNob3J0ZXIgfSxcblx0XHRzOiBpbnRlcnBvbGF0b3JMaW5lYXIsXG5cdFx0djogaW50ZXJwb2xhdG9yTGluZWFyLFxuXHRcdGFscGhhOiB7IHVzZTogaW50ZXJwb2xhdG9yTGluZWFyLCBmaXh1cDogZml4dXBBbHBoYSB9XG5cdH0sXG5cblx0ZGlmZmVyZW5jZToge1xuXHRcdGg6IGRpZmZlcmVuY2VIdWVTYXR1cmF0aW9uXG5cdH0sXG5cblx0YXZlcmFnZToge1xuXHRcdGg6IGF2ZXJhZ2VBbmdsZVxuXHR9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbml0aW9uO1xuIiwgIi8qXG5cdEhXQiB0byBSR0IgY29udmVydGVyXG5cdC0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cblx0UmVmZXJlbmNlczpcblx0XHQqIGh0dHBzOi8vZHJhZnRzLmNzc3dnLm9yZy9jc3MtY29sb3IvI2h3Yi10by1yZ2Jcblx0XHQqIGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0hXQl9jb2xvcl9tb2RlbFxuXHRcdCogaHR0cDovL2FsdnlyYXkuY29tL1BhcGVycy9DRy9IV0JfSkdUdjIwOC5wZGZcbiAqL1xuXG5pbXBvcnQgY29udmVydEhzdlRvUmdiIGZyb20gJy4uL2hzdi9jb252ZXJ0SHN2VG9SZ2IuanMnO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBjb252ZXJ0SHdiVG9SZ2IoeyBoLCB3LCBiLCBhbHBoYSB9KSB7XG5cdGlmICh3ID09PSB1bmRlZmluZWQpIHcgPSAwO1xuXHRpZiAoYiA9PT0gdW5kZWZpbmVkKSBiID0gMDtcblx0Ly8gbm9ybWFsaXplIHcgKyBiIHRvIDFcblx0aWYgKHcgKyBiID4gMSkge1xuXHRcdGxldCBzID0gdyArIGI7XG5cdFx0dyAvPSBzO1xuXHRcdGIgLz0gcztcblx0fVxuXHRyZXR1cm4gY29udmVydEhzdlRvUmdiKHtcblx0XHRoOiBoLFxuXHRcdHM6IGIgPT09IDEgPyAxIDogMSAtIHcgLyAoMSAtIGIpLFxuXHRcdHY6IDEgLSBiLFxuXHRcdGFscGhhOiBhbHBoYVxuXHR9KTtcbn1cbiIsICIvKlxuXHRSR0IgdG8gSFdCIGNvbnZlcnRlclxuXHQtLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5cdFJlZmVyZW5jZXM6XG5cdFx0KiBodHRwczovL2RyYWZ0cy5jc3N3Zy5vcmcvY3NzLWNvbG9yLyNod2ItdG8tcmdiXG5cdFx0KiBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9IV0JfY29sb3JfbW9kZWxcblx0XHQqIGh0dHA6Ly9hbHZ5cmF5LmNvbS9QYXBlcnMvQ0cvSFdCX0pHVHYyMDgucGRmXG4gKi9cblxuaW1wb3J0IGNvbnZlcnRSZ2JUb0hzdiBmcm9tICcuLi9oc3YvY29udmVydFJnYlRvSHN2LmpzJztcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gY29udmVydFJnYlRvSHdiKHJnYmEpIHtcblx0bGV0IGhzdiA9IGNvbnZlcnRSZ2JUb0hzdihyZ2JhKTtcblx0aWYgKGhzdiA9PT0gdW5kZWZpbmVkKSByZXR1cm4gdW5kZWZpbmVkO1xuXHRsZXQgcyA9IGhzdi5zICE9PSB1bmRlZmluZWQgPyBoc3YucyA6IDA7XG5cdGxldCB2ID0gaHN2LnYgIT09IHVuZGVmaW5lZCA/IGhzdi52IDogMDtcblx0bGV0IHJlcyA9IHtcblx0XHRtb2RlOiAnaHdiJyxcblx0XHR3OiAoMSAtIHMpICogdixcblx0XHRiOiAxIC0gdlxuXHR9O1xuXHRpZiAoaHN2LmggIT09IHVuZGVmaW5lZCkgcmVzLmggPSBoc3YuaDtcblx0aWYgKGhzdi5hbHBoYSAhPT0gdW5kZWZpbmVkKSByZXMuYWxwaGEgPSBoc3YuYWxwaGE7XG5cdHJldHVybiByZXM7XG59XG4iLCAiaW1wb3J0IHsgVG9rIH0gZnJvbSAnLi4vcGFyc2UuanMnO1xuXG5mdW5jdGlvbiBQYXJzZUh3Yihjb2xvciwgcGFyc2VkKSB7XG5cdGlmICghcGFyc2VkIHx8IHBhcnNlZFswXSAhPT0gJ2h3YicpIHtcblx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHR9XG5cdGNvbnN0IHJlcyA9IHsgbW9kZTogJ2h3YicgfTtcblx0Y29uc3QgWywgaCwgdywgYiwgYWxwaGFdID0gcGFyc2VkO1xuXG5cdGlmIChoLnR5cGUgIT09IFRvay5Ob25lKSB7XG5cdFx0aWYgKGgudHlwZSA9PT0gVG9rLlBlcmNlbnRhZ2UpIHtcblx0XHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdFx0fVxuXHRcdHJlcy5oID0gaC52YWx1ZTtcblx0fVxuXG5cdGlmICh3LnR5cGUgIT09IFRvay5Ob25lKSB7XG5cdFx0aWYgKHcudHlwZSA9PT0gVG9rLkh1ZSkge1xuXHRcdFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0XHR9XG5cdFx0cmVzLncgPSB3LnZhbHVlIC8gMTAwO1xuXHR9XG5cblx0aWYgKGIudHlwZSAhPT0gVG9rLk5vbmUpIHtcblx0XHRpZiAoYi50eXBlID09PSBUb2suSHVlKSB7XG5cdFx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHRcdH1cblx0XHRyZXMuYiA9IGIudmFsdWUgLyAxMDA7XG5cdH1cblxuXHRpZiAoYWxwaGEudHlwZSAhPT0gVG9rLk5vbmUpIHtcblx0XHRyZXMuYWxwaGEgPSBNYXRoLm1pbihcblx0XHRcdDEsXG5cdFx0XHRNYXRoLm1heChcblx0XHRcdFx0MCxcblx0XHRcdFx0YWxwaGEudHlwZSA9PT0gVG9rLk51bWJlciA/IGFscGhhLnZhbHVlIDogYWxwaGEudmFsdWUgLyAxMDBcblx0XHRcdClcblx0XHQpO1xuXHR9XG5cblx0cmV0dXJuIHJlcztcbn1cblxuZXhwb3J0IGRlZmF1bHQgUGFyc2VId2I7XG4iLCAiaW1wb3J0IGNvbnZlcnRId2JUb1JnYiBmcm9tICcuL2NvbnZlcnRId2JUb1JnYi5qcyc7XG5pbXBvcnQgY29udmVydFJnYlRvSHdiIGZyb20gJy4vY29udmVydFJnYlRvSHdiLmpzJztcbmltcG9ydCBwYXJzZUh3YiBmcm9tICcuL3BhcnNlSHdiLmpzJztcbmltcG9ydCB7IGZpeHVwSHVlU2hvcnRlciB9IGZyb20gJy4uL2ZpeHVwL2h1ZS5qcyc7XG5pbXBvcnQgeyBmaXh1cEFscGhhIH0gZnJvbSAnLi4vZml4dXAvYWxwaGEuanMnO1xuaW1wb3J0IHsgaW50ZXJwb2xhdG9yTGluZWFyIH0gZnJvbSAnLi4vaW50ZXJwb2xhdGUvbGluZWFyLmpzJztcbmltcG9ydCB7IGRpZmZlcmVuY2VIdWVOYWl2ZSB9IGZyb20gJy4uL2RpZmZlcmVuY2UuanMnO1xuaW1wb3J0IHsgYXZlcmFnZUFuZ2xlIH0gZnJvbSAnLi4vYXZlcmFnZS5qcyc7XG5cbmNvbnN0IGRlZmluaXRpb24gPSB7XG5cdG1vZGU6ICdod2InLFxuXG5cdHRvTW9kZToge1xuXHRcdHJnYjogY29udmVydEh3YlRvUmdiXG5cdH0sXG5cblx0ZnJvbU1vZGU6IHtcblx0XHRyZ2I6IGNvbnZlcnRSZ2JUb0h3YlxuXHR9LFxuXG5cdGNoYW5uZWxzOiBbJ2gnLCAndycsICdiJywgJ2FscGhhJ10sXG5cblx0cmFuZ2VzOiB7XG5cdFx0aDogWzAsIDM2MF1cblx0fSxcblxuXHRnYW11dDogJ3JnYicsXG5cblx0cGFyc2U6IFtwYXJzZUh3Yl0sXG5cdHNlcmlhbGl6ZTogYyA9PlxuXHRcdGBod2IoJHtjLmggIT09IHVuZGVmaW5lZCA/IGMuaCA6ICdub25lJ30gJHtcblx0XHRcdGMudyAhPT0gdW5kZWZpbmVkID8gYy53ICogMTAwICsgJyUnIDogJ25vbmUnXG5cdFx0fSAke2MuYiAhPT0gdW5kZWZpbmVkID8gYy5iICogMTAwICsgJyUnIDogJ25vbmUnfSR7XG5cdFx0XHRjLmFscGhhIDwgMSA/IGAgLyAke2MuYWxwaGF9YCA6ICcnXG5cdFx0fSlgLFxuXG5cdGludGVycG9sYXRlOiB7XG5cdFx0aDogeyB1c2U6IGludGVycG9sYXRvckxpbmVhciwgZml4dXA6IGZpeHVwSHVlU2hvcnRlciB9LFxuXHRcdHc6IGludGVycG9sYXRvckxpbmVhcixcblx0XHRiOiBpbnRlcnBvbGF0b3JMaW5lYXIsXG5cdFx0YWxwaGE6IHsgdXNlOiBpbnRlcnBvbGF0b3JMaW5lYXIsIGZpeHVwOiBmaXh1cEFscGhhIH1cblx0fSxcblxuXHRkaWZmZXJlbmNlOiB7XG5cdFx0aDogZGlmZmVyZW5jZUh1ZU5haXZlXG5cdH0sXG5cblx0YXZlcmFnZToge1xuXHRcdGg6IGF2ZXJhZ2VBbmdsZVxuXHR9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbml0aW9uO1xuIiwgIi8qXG5cdFJlbGF0aXZlIFhZWiBoYXMgWT0xIGZvciBtZWRpYSB3aGl0ZSxcblx0QlQuMjA0OCBzYXlzIG1lZGlhIHdoaXRlIFk9MjAzIChhdCBQUSA1OCkuXG5cdFNlZTogaHR0cHM6Ly93d3cuaXR1LmludC9kbXNfcHViL2l0dS1yL29wYi9yZXAvUi1SRVAtQlQuMjQwOC0zLTIwMTktUERGLUUucGRmXG4qL1xuZXhwb3J0IGNvbnN0IFlXID0gMjAzO1xuIiwgIi8qXG5cdGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL1RyYW5zZmVyX2Z1bmN0aW9uc19pbl9pbWFnaW5nXG4qL1xuXG5leHBvcnQgY29uc3QgTTEgPSAwLjE1OTMwMTc1NzgxMjU7XG5leHBvcnQgY29uc3QgTTIgPSA3OC44NDM3NTtcbmV4cG9ydCBjb25zdCBDMSA9IDAuODM1OTM3NTtcbmV4cG9ydCBjb25zdCBDMiA9IDE4Ljg1MTU2MjU7XG5leHBvcnQgY29uc3QgQzMgPSAxOC42ODc1O1xuXG4vKlxuXHRQZXJjZXB0dWFsIFF1YW50aXplciwgYXMgZGVmaW5lZCBpbiBSZWMuIEJUIDIxMDAtMiAoMjAxOClcblxuXHQqIGh0dHBzOi8vd3d3Lml0dS5pbnQvcmVjL1ItUkVDLUJULjIxMDAtMi0yMDE4MDctSS9lblxuXHQqIGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL1BlcmNlcHR1YWxfcXVhbnRpemVyXG4qL1xuXG4vKiBQUSBFT1RGLCBkZWZpbmVkIGZvciBgdmAgaW4gWzAsMV0uICovXG5leHBvcnQgZnVuY3Rpb24gdHJhbnNmZXJQcURlY29kZSh2KSB7XG5cdGlmICh2IDwgMCkgcmV0dXJuIDA7XG5cdGNvbnN0IGMgPSBNYXRoLnBvdyh2LCAxIC8gTTIpO1xuXHRyZXR1cm4gMWU0ICogTWF0aC5wb3coTWF0aC5tYXgoMCwgYyAtIEMxKSAvIChDMiAtIEMzICogYyksIDEgLyBNMSk7XG59XG5cbi8qIFBRIEVPVEZeLTEsIGRlZmluZWQgZm9yIGB2YCBpbiBbMCwgMWU0XS4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0cmFuc2ZlclBxRW5jb2RlKHYpIHtcblx0aWYgKHYgPCAwKSByZXR1cm4gMDtcblx0Y29uc3QgYyA9IE1hdGgucG93KHYgLyAxZTQsIE0xKTtcblx0cmV0dXJuIE1hdGgucG93KChDMSArIEMyICogYykgLyAoMSArIEMzICogYyksIE0yKTtcbn1cbiIsICJpbXBvcnQgeyBZVyB9IGZyb20gJy4uL2hkci9jb25zdGFudHMuanMnO1xuaW1wb3J0IHsgdHJhbnNmZXJQcURlY29kZSB9IGZyb20gJy4uL2hkci90cmFuc2Zlci5qcyc7XG5cbmNvbnN0IHRvUmVsID0gYyA9PiBNYXRoLm1heChjIC8gWVcsIDApO1xuXG5jb25zdCBjb252ZXJ0SXRwVG9YeXo2NSA9ICh7IGksIHQsIHAsIGFscGhhIH0pID0+IHtcblx0aWYgKGkgPT09IHVuZGVmaW5lZCkgaSA9IDA7XG5cdGlmICh0ID09PSB1bmRlZmluZWQpIHQgPSAwO1xuXHRpZiAocCA9PT0gdW5kZWZpbmVkKSBwID0gMDtcblxuXHRjb25zdCBsID0gdHJhbnNmZXJQcURlY29kZShcblx0XHRpICsgMC4wMDg2MDkwMzcwMzc5MzI3NjEgKiB0ICsgMC4xMTEwMjk2MjUwMDMwMjU5MyAqIHBcblx0KTtcblx0Y29uc3QgbSA9IHRyYW5zZmVyUHFEZWNvZGUoXG5cdFx0aSAtIDAuMDA4NjA5MDM3MDM3OTMyNzUgKiB0IC0gMC4xMTEwMjk2MjUwMDMwMjU5OSAqIHBcblx0KTtcblx0Y29uc3QgcyA9IHRyYW5zZmVyUHFEZWNvZGUoXG5cdFx0aSArIDAuNTYwMDMxMzM1NzEwNjc5MSAqIHQgLSAwLjMyMDYyNzE3NDk4NzMxODg1ICogcFxuXHQpO1xuXG5cdGNvbnN0IHJlcyA9IHtcblx0XHRtb2RlOiAneHl6NjUnLFxuXHRcdHg6IHRvUmVsKFxuXHRcdFx0Mi4wNzAxNTIyMTgzODk0MjE5ICogbCAtXG5cdFx0XHRcdDEuMzI2MzQ3MzM4OTY3MTU1NiAqIG0gK1xuXHRcdFx0XHQwLjIwNjY1MTA0NzYyOTQwNTEgKiBzXG5cdFx0KSxcblx0XHR5OiB0b1JlbChcblx0XHRcdDAuMzY0NzM4NTIwOTc0ODA3NCAqIGwgK1xuXHRcdFx0XHQwLjY4MDU2NjAyNDk0NzIyNyAqIG0gLVxuXHRcdFx0XHQwLjA0NTMwNDU0NTkyMjAzNDYgKiBzXG5cdFx0KSxcblx0XHR6OiB0b1JlbChcblx0XHRcdC0wLjA0OTc0NzIwNzUzNTgxMiAqIGwgLVxuXHRcdFx0XHQwLjA0OTI2MDk2NjY5NjYxMzggKiBtICtcblx0XHRcdFx0MS4xODgwNjU5MjQ5OTIzMDQyICogc1xuXHRcdClcblx0fTtcblxuXHRpZiAoYWxwaGEgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJlcy5hbHBoYSA9IGFscGhhO1xuXHR9XG5cblx0cmV0dXJuIHJlcztcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNvbnZlcnRJdHBUb1h5ejY1O1xuIiwgImltcG9ydCB7IFlXIH0gZnJvbSAnLi4vaGRyL2NvbnN0YW50cy5qcyc7XG5pbXBvcnQgeyB0cmFuc2ZlclBxRW5jb2RlIH0gZnJvbSAnLi4vaGRyL3RyYW5zZmVyLmpzJztcblxuY29uc3QgdG9BYnMgPSAoYyA9IDApID0+IE1hdGgubWF4KGMgKiBZVywgMCk7XG5cbmNvbnN0IGNvbnZlcnRYeXo2NVRvSXRwID0gKHsgeCwgeSwgeiwgYWxwaGEgfSkgPT4ge1xuXHRjb25zdCBhYnNYID0gdG9BYnMoeCk7XG5cdGNvbnN0IGFic1kgPSB0b0Ficyh5KTtcblx0Y29uc3QgYWJzWiA9IHRvQWJzKHopO1xuXHRjb25zdCBsID0gdHJhbnNmZXJQcUVuY29kZShcblx0XHQwLjM1OTI4MzI1OTAxMjEyMTcgKiBhYnNYICtcblx0XHRcdDAuNjk3NjA1MTE0Nzc3OTUwMiAqIGFic1kgLVxuXHRcdFx0MC4wMzU4OTE1OTMyMzIwMjg5ICogYWJzWlxuXHQpO1xuXHRjb25zdCBtID0gdHJhbnNmZXJQcUVuY29kZShcblx0XHQtMC4xOTIwODA4NDYzNzA0OTk1ICogYWJzWCArXG5cdFx0XHQxLjEwMDQ3Njc5NzAzNzQzMjMgKiBhYnNZICtcblx0XHRcdDAuMDc1Mzc0ODY1ODUxOTExOCAqIGFic1pcblx0KTtcblx0Y29uc3QgcyA9IHRyYW5zZmVyUHFFbmNvZGUoXG5cdFx0MC4wMDcwNzk3ODQ0NjA3NDc3ICogYWJzWCArXG5cdFx0XHQwLjA3NDgzOTY2NjIxODYzNjYgKiBhYnNZICtcblx0XHRcdDAuODQzMzI2NTQ1Mzg5ODc2NSAqIGFic1pcblx0KTtcblxuXHRjb25zdCBpID0gMC41ICogbCArIDAuNSAqIG07XG5cdGNvbnN0IHQgPSAxLjYxMzc2OTUzMTI1ICogbCAtIDMuMzIzNDg2MzI4MTI1ICogbSArIDEuNzA5NzE2Nzk2ODc1ICogcztcblx0Y29uc3QgcCA9IDQuMzc4MTczODI4MTI1ICogbCAtIDQuMjQ1NjA1NDY4NzUgKiBtIC0gMC4xMzI1NjgzNTkzNzUgKiBzO1xuXG5cdGNvbnN0IHJlcyA9IHsgbW9kZTogJ2l0cCcsIGksIHQsIHAgfTtcblx0aWYgKGFscGhhICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXMuYWxwaGEgPSBhbHBoYTtcblx0fVxuXG5cdHJldHVybiByZXM7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBjb252ZXJ0WHl6NjVUb0l0cDtcbiIsICJpbXBvcnQgeyBpbnRlcnBvbGF0b3JMaW5lYXIgfSBmcm9tICcuLi9pbnRlcnBvbGF0ZS9saW5lYXIuanMnO1xuaW1wb3J0IHsgZml4dXBBbHBoYSB9IGZyb20gJy4uL2ZpeHVwL2FscGhhLmpzJztcbmltcG9ydCBjb252ZXJ0SXRwVG9YeXo2NSBmcm9tICcuL2NvbnZlcnRJdHBUb1h5ejY1LmpzJztcbmltcG9ydCBjb252ZXJ0WHl6NjVUb0l0cCBmcm9tICcuL2NvbnZlcnRYeXo2NVRvSXRwLmpzJztcbmltcG9ydCBjb252ZXJ0UmdiVG9YeXo2NSBmcm9tICcuLi94eXo2NS9jb252ZXJ0UmdiVG9YeXo2NS5qcyc7XG5pbXBvcnQgY29udmVydFh5ejY1VG9SZ2IgZnJvbSAnLi4veHl6NjUvY29udmVydFh5ejY1VG9SZ2IuanMnO1xuXG4vKlxuICBJQ3RDcCAob3IgSVRQKSBjb2xvciBzcGFjZSwgYXMgZGVmaW5lZCBpbiBJVFUtUiBSZWNvbW1lbmRhdGlvbiBCVC4yMTAwLlxuXG4gIElDdENwIGlzIGRyYWZ0ZWQgdG8gYmUgc3VwcG9ydGVkIGluIENTUyB3aXRoaW5cbiAgW0NTUyBDb2xvciBIRFIgTW9kdWxlIExldmVsIDFdKGh0dHBzOi8vZHJhZnRzLmNzc3dnLm9yZy9jc3MtY29sb3ItaGRyLyNJQ3RDcCkgc3BlYy5cbiovXG5cbmNvbnN0IGRlZmluaXRpb24gPSB7XG5cdG1vZGU6ICdpdHAnLFxuXHRjaGFubmVsczogWydpJywgJ3QnLCAncCcsICdhbHBoYSddLFxuXHRwYXJzZTogWyctLWljdGNwJ10sXG5cdHNlcmlhbGl6ZTogJy0taWN0Y3AnLFxuXG5cdHRvTW9kZToge1xuXHRcdHh5ejY1OiBjb252ZXJ0SXRwVG9YeXo2NSxcblx0XHRyZ2I6IGNvbG9yID0+IGNvbnZlcnRYeXo2NVRvUmdiKGNvbnZlcnRJdHBUb1h5ejY1KGNvbG9yKSlcblx0fSxcblxuXHRmcm9tTW9kZToge1xuXHRcdHh5ejY1OiBjb252ZXJ0WHl6NjVUb0l0cCxcblx0XHRyZ2I6IGNvbG9yID0+IGNvbnZlcnRYeXo2NVRvSXRwKGNvbnZlcnRSZ2JUb1h5ejY1KGNvbG9yKSlcblx0fSxcblxuXHRyYW5nZXM6IHtcblx0XHRpOiBbMCwgMC41ODFdLFxuXHRcdHQ6IFstMC4zNjksIDAuMjcyXSxcblx0XHRwOiBbLTAuMTY0LCAwLjMzMV1cblx0fSxcblxuXHRpbnRlcnBvbGF0ZToge1xuXHRcdGk6IGludGVycG9sYXRvckxpbmVhcixcblx0XHR0OiBpbnRlcnBvbGF0b3JMaW5lYXIsXG5cdFx0cDogaW50ZXJwb2xhdG9yTGluZWFyLFxuXHRcdGFscGhhOiB7IHVzZTogaW50ZXJwb2xhdG9yTGluZWFyLCBmaXh1cDogZml4dXBBbHBoYSB9XG5cdH1cbn07XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluaXRpb247XG4iLCAiaW1wb3J0IHsgTTEgYXMgbiwgQzEsIEMyLCBDMyB9IGZyb20gJy4uL2hkci90cmFuc2Zlci5qcyc7XG5jb25zdCBwID0gMTM0LjAzNDM3NDk5OTk5OTk4OyAvLyA9IDEuNyAqIDI1MjMgLyBNYXRoLnBvdygyLCA1KTtcbmNvbnN0IGQwID0gMS42Mjk1NDk5NTMyODIxNTY2ZS0xMTtcblxuLyogXG5cdFRoZSBlbmNvZGluZyBmdW5jdGlvbiBpcyBkZXJpdmVkIGZyb20gUGVyY2VwdHVhbCBRdWFudGl6ZXIuXG4qL1xuY29uc3QgamFiUHFFbmNvZGUgPSB2ID0+IHtcblx0aWYgKHYgPCAwKSByZXR1cm4gMDtcblx0bGV0IHZuID0gTWF0aC5wb3codiAvIDEwMDAwLCBuKTtcblx0cmV0dXJuIE1hdGgucG93KChDMSArIEMyICogdm4pIC8gKDEgKyBDMyAqIHZuKSwgcCk7XG59O1xuXG4vLyBDb252ZXJ0IHRvIEFic29sdXRlIFhZWlxuY29uc3QgYWJzID0gKHYgPSAwKSA9PiBNYXRoLm1heCh2ICogMjAzLCAwKTtcblxuY29uc3QgY29udmVydFh5ejY1VG9KYWIgPSAoeyB4LCB5LCB6LCBhbHBoYSB9KSA9PiB7XG5cdHggPSBhYnMoeCk7XG5cdHkgPSBhYnMoeSk7XG5cdHogPSBhYnMoeik7XG5cblx0bGV0IHhwID0gMS4xNSAqIHggLSAwLjE1ICogejtcblx0bGV0IHlwID0gMC42NiAqIHkgKyAwLjM0ICogeDtcblxuXHRsZXQgbCA9IGphYlBxRW5jb2RlKDAuNDE0Nzg5NzIgKiB4cCArIDAuNTc5OTk5ICogeXAgKyAwLjAxNDY0OCAqIHopO1xuXHRsZXQgbSA9IGphYlBxRW5jb2RlKC0wLjIwMTUxICogeHAgKyAxLjEyMDY0OSAqIHlwICsgMC4wNTMxMDA4ICogeik7XG5cdGxldCBzID0gamFiUHFFbmNvZGUoLTAuMDE2NjAwOCAqIHhwICsgMC4yNjQ4ICogeXAgKyAwLjY2ODQ3OTkgKiB6KTtcblxuXHRsZXQgaSA9IChsICsgbSkgLyAyO1xuXG5cdGxldCByZXMgPSB7XG5cdFx0bW9kZTogJ2phYicsXG5cdFx0ajogKDAuNDQgKiBpKSAvICgxIC0gMC41NiAqIGkpIC0gZDAsXG5cdFx0YTogMy41MjQgKiBsIC0gNC4wNjY3MDggKiBtICsgMC41NDI3MDggKiBzLFxuXHRcdGI6IDAuMTk5MDc2ICogbCArIDEuMDk2Nzk5ICogbSAtIDEuMjk1ODc1ICogc1xuXHR9O1xuXG5cdGlmIChhbHBoYSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmVzLmFscGhhID0gYWxwaGE7XG5cdH1cblxuXHRyZXR1cm4gcmVzO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgY29udmVydFh5ejY1VG9KYWI7XG4iLCAiaW1wb3J0IHsgTTEgYXMgbiwgQzEsIEMyLCBDMyB9IGZyb20gJy4uL2hkci90cmFuc2Zlci5qcyc7XG5jb25zdCBwID0gMTM0LjAzNDM3NDk5OTk5OTk4OyAvLyA9IDEuNyAqIDI1MjMgLyBNYXRoLnBvdygyLCA1KTtcbmNvbnN0IGQwID0gMS42Mjk1NDk5NTMyODIxNTY2ZS0xMTtcblxuLyogXG5cdFRoZSBlbmNvZGluZyBmdW5jdGlvbiBpcyBkZXJpdmVkIGZyb20gUGVyY2VwdHVhbCBRdWFudGl6ZXIuXG4qL1xuY29uc3QgamFiUHFEZWNvZGUgPSB2ID0+IHtcblx0aWYgKHYgPCAwKSByZXR1cm4gMDtcblx0bGV0IHZwID0gTWF0aC5wb3codiwgMSAvIHApO1xuXHRyZXR1cm4gMTAwMDAgKiBNYXRoLnBvdygoQzEgLSB2cCkgLyAoQzMgKiB2cCAtIEMyKSwgMSAvIG4pO1xufTtcblxuY29uc3QgcmVsID0gdiA9PiB2IC8gMjAzO1xuXG5jb25zdCBjb252ZXJ0SmFiVG9YeXo2NSA9ICh7IGosIGEsIGIsIGFscGhhIH0pID0+IHtcblx0aWYgKGogPT09IHVuZGVmaW5lZCkgaiA9IDA7XG5cdGlmIChhID09PSB1bmRlZmluZWQpIGEgPSAwO1xuXHRpZiAoYiA9PT0gdW5kZWZpbmVkKSBiID0gMDtcblx0bGV0IGkgPSAoaiArIGQwKSAvICgwLjQ0ICsgMC41NiAqIChqICsgZDApKTtcblxuXHRsZXQgbCA9IGphYlBxRGVjb2RlKGkgKyAwLjEzODYwNTA0ICogYSArIDAuMDU4MDQ3MzE2ICogYik7XG5cdGxldCBtID0gamFiUHFEZWNvZGUoaSAtIDAuMTM4NjA1MDQgKiBhIC0gMC4wNTgwNDczMTYgKiBiKTtcblx0bGV0IHMgPSBqYWJQcURlY29kZShpIC0gMC4wOTYwMTkyNDIgKiBhIC0gMC44MTE4OTE5ICogYik7XG5cblx0bGV0IHJlcyA9IHtcblx0XHRtb2RlOiAneHl6NjUnLFxuXHRcdHg6IHJlbChcblx0XHRcdDEuNjYxMzczMDI0NjUyMTc0ICogbCAtXG5cdFx0XHRcdDAuOTE0NTIzMDgxMzA0MzQ4ICogbSArXG5cdFx0XHRcdDAuMjMxMzYyMDgxNzM5MTMwNDUgKiBzXG5cdFx0KSxcblx0XHR5OiByZWwoXG5cdFx0XHQtMC4zMjUwNzU4NjExODQ0NTMzICogbCArXG5cdFx0XHRcdDEuNTcxODQ3MDI2NzMyNTQzICogbSAtXG5cdFx0XHRcdDAuMjE4MjUzODM0NTMyMjc5MjggKiBzXG5cdFx0KSxcblx0XHR6OiByZWwoLTAuMDkwOTgyODExICogbCAtIDAuMzEyNzI4MjkgKiBtICsgMS41MjI3NjY2ICogcylcblx0fTtcblxuXHRpZiAoYWxwaGEgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJlcy5hbHBoYSA9IGFscGhhO1xuXHR9XG5cblx0cmV0dXJuIHJlcztcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNvbnZlcnRKYWJUb1h5ejY1O1xuIiwgIi8qXG5cdENvbnZlcnQgc1JHQiB0byBKekF6QnouXG5cblx0Rm9yIGFjaHJvbWF0aWMgc1JHQiBjb2xvcnMsIGFkanVzdCB0aGUgZXF1aXZhbGVudCBKekF6QnogY29sb3Jcblx0dG8gYmUgYWNocm9tYXRpYyBhcyB3ZWxsLCBpbnN0ZWFkaW5nIG9mIGhhdmluZyBhIHZlcnkgc2xpZ2h0IGNocm9tYS5cbiAqL1xuXG5pbXBvcnQgY29udmVydFh5ejY1VG9KYWIgZnJvbSAnLi9jb252ZXJ0WHl6NjVUb0phYi5qcyc7XG5pbXBvcnQgY29udmVydFJnYlRvWHl6NjUgZnJvbSAnLi4veHl6NjUvY29udmVydFJnYlRvWHl6NjUuanMnO1xuXG5jb25zdCBjb252ZXJ0UmdiVG9KYWIgPSByZ2IgPT4ge1xuXHRsZXQgcmVzID0gY29udmVydFh5ejY1VG9KYWIoY29udmVydFJnYlRvWHl6NjUocmdiKSk7XG5cdGlmIChyZ2IuciA9PT0gcmdiLmIgJiYgcmdiLmIgPT09IHJnYi5nKSB7XG5cdFx0cmVzLmEgPSByZXMuYiA9IDA7XG5cdH1cblx0cmV0dXJuIHJlcztcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNvbnZlcnRSZ2JUb0phYjtcbiIsICJpbXBvcnQgY29udmVydFh5ejY1VG9SZ2IgZnJvbSAnLi4veHl6NjUvY29udmVydFh5ejY1VG9SZ2IuanMnO1xuaW1wb3J0IGNvbnZlcnRKYWJUb1h5ejY1IGZyb20gJy4vY29udmVydEphYlRvWHl6NjUuanMnO1xuXG5jb25zdCBjb252ZXJ0SmFiVG9SZ2IgPSBjb2xvciA9PiBjb252ZXJ0WHl6NjVUb1JnYihjb252ZXJ0SmFiVG9YeXo2NShjb2xvcikpO1xuXG5leHBvcnQgZGVmYXVsdCBjb252ZXJ0SmFiVG9SZ2I7XG4iLCAiLypcblx0VGhlIEp6QXpCeiBjb2xvciBzcGFjZS5cblxuXHRCYXNlZCBvbjpcblxuXHRNdWhhbW1hZCBTYWZkYXIsIEd1aWh1YSBDdWksIFlvdW4gSmluIEtpbSwgYW5kIE1pbmcgUm9ubmllciBMdW8sIFxuXHRcIlBlcmNlcHR1YWxseSB1bmlmb3JtIGNvbG9yIHNwYWNlIGZvciBpbWFnZSBzaWduYWxzIFxuXHRpbmNsdWRpbmcgaGlnaCBkeW5hbWljIHJhbmdlIGFuZCB3aWRlIGdhbXV0LFwiIFxuXHRPcHQuIEV4cHJlc3MgMjUsIDE1MTMxLTE1MTUxICgyMDE3KSBcblxuXHRodHRwczovL2RvaS5vcmcvMTAuMTM2NC9PRS4yNS4wMTUxMzFcbiAqL1xuXG5pbXBvcnQgY29udmVydFh5ejY1VG9KYWIgZnJvbSAnLi9jb252ZXJ0WHl6NjVUb0phYi5qcyc7XG5pbXBvcnQgY29udmVydEphYlRvWHl6NjUgZnJvbSAnLi9jb252ZXJ0SmFiVG9YeXo2NS5qcyc7XG5pbXBvcnQgY29udmVydFJnYlRvSmFiIGZyb20gJy4vY29udmVydFJnYlRvSmFiLmpzJztcbmltcG9ydCBjb252ZXJ0SmFiVG9SZ2IgZnJvbSAnLi9jb252ZXJ0SmFiVG9SZ2IuanMnO1xuXG5pbXBvcnQgeyBpbnRlcnBvbGF0b3JMaW5lYXIgfSBmcm9tICcuLi9pbnRlcnBvbGF0ZS9saW5lYXIuanMnO1xuaW1wb3J0IHsgZml4dXBBbHBoYSB9IGZyb20gJy4uL2ZpeHVwL2FscGhhLmpzJztcblxuY29uc3QgZGVmaW5pdGlvbiA9IHtcblx0bW9kZTogJ2phYicsXG5cdGNoYW5uZWxzOiBbJ2onLCAnYScsICdiJywgJ2FscGhhJ10sXG5cblx0cGFyc2U6IFsnLS1qemF6YnonXSxcblx0c2VyaWFsaXplOiAnLS1qemF6YnonLFxuXG5cdGZyb21Nb2RlOiB7XG5cdFx0cmdiOiBjb252ZXJ0UmdiVG9KYWIsXG5cdFx0eHl6NjU6IGNvbnZlcnRYeXo2NVRvSmFiXG5cdH0sXG5cblx0dG9Nb2RlOiB7XG5cdFx0cmdiOiBjb252ZXJ0SmFiVG9SZ2IsXG5cdFx0eHl6NjU6IGNvbnZlcnRKYWJUb1h5ejY1XG5cdH0sXG5cblx0cmFuZ2VzOiB7XG5cdFx0ajogWzAsIDAuMjIyXSxcblx0XHRhOiBbLTAuMTA5LCAwLjEyOV0sXG5cdFx0YjogWy0wLjE4NSwgMC4xMzRdXG5cdH0sXG5cblx0aW50ZXJwb2xhdGU6IHtcblx0XHRqOiBpbnRlcnBvbGF0b3JMaW5lYXIsXG5cdFx0YTogaW50ZXJwb2xhdG9yTGluZWFyLFxuXHRcdGI6IGludGVycG9sYXRvckxpbmVhcixcblx0XHRhbHBoYTogeyB1c2U6IGludGVycG9sYXRvckxpbmVhciwgZml4dXA6IGZpeHVwQWxwaGEgfVxuXHR9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbml0aW9uO1xuIiwgImltcG9ydCBub3JtYWxpemVIdWUgZnJvbSAnLi4vdXRpbC9ub3JtYWxpemVIdWUuanMnO1xuXG5jb25zdCBjb252ZXJ0SmFiVG9KY2ggPSAoeyBqLCBhLCBiLCBhbHBoYSB9KSA9PiB7XG5cdGlmIChhID09PSB1bmRlZmluZWQpIGEgPSAwO1xuXHRpZiAoYiA9PT0gdW5kZWZpbmVkKSBiID0gMDtcblx0bGV0IGMgPSBNYXRoLnNxcnQoYSAqIGEgKyBiICogYik7XG5cdGxldCByZXMgPSB7XG5cdFx0bW9kZTogJ2pjaCcsXG5cdFx0aixcblx0XHRjXG5cdH07XG5cdGlmIChjKSB7XG5cdFx0cmVzLmggPSBub3JtYWxpemVIdWUoKE1hdGguYXRhbjIoYiwgYSkgKiAxODApIC8gTWF0aC5QSSk7XG5cdH1cblx0aWYgKGFscGhhICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXMuYWxwaGEgPSBhbHBoYTtcblx0fVxuXHRyZXR1cm4gcmVzO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgY29udmVydEphYlRvSmNoO1xuIiwgImNvbnN0IGNvbnZlcnRKY2hUb0phYiA9ICh7IGosIGMsIGgsIGFscGhhIH0pID0+IHtcblx0aWYgKGggPT09IHVuZGVmaW5lZCkgaCA9IDA7XG5cdGxldCByZXMgPSB7XG5cdFx0bW9kZTogJ2phYicsXG5cdFx0aixcblx0XHRhOiBjID8gYyAqIE1hdGguY29zKChoIC8gMTgwKSAqIE1hdGguUEkpIDogMCxcblx0XHRiOiBjID8gYyAqIE1hdGguc2luKChoIC8gMTgwKSAqIE1hdGguUEkpIDogMFxuXHR9O1xuXHRpZiAoYWxwaGEgIT09IHVuZGVmaW5lZCkgcmVzLmFscGhhID0gYWxwaGE7XG5cdHJldHVybiByZXM7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBjb252ZXJ0SmNoVG9KYWI7XG4iLCAiaW1wb3J0IGNvbnZlcnRKYWJUb0pjaCBmcm9tICcuL2NvbnZlcnRKYWJUb0pjaC5qcyc7XG5pbXBvcnQgY29udmVydEpjaFRvSmFiIGZyb20gJy4vY29udmVydEpjaFRvSmFiLmpzJztcbmltcG9ydCBjb252ZXJ0SmFiVG9SZ2IgZnJvbSAnLi4vamFiL2NvbnZlcnRKYWJUb1JnYi5qcyc7XG5pbXBvcnQgY29udmVydFJnYlRvSmFiIGZyb20gJy4uL2phYi9jb252ZXJ0UmdiVG9KYWIuanMnO1xuXG5pbXBvcnQgeyBmaXh1cEh1ZVNob3J0ZXIgfSBmcm9tICcuLi9maXh1cC9odWUuanMnO1xuaW1wb3J0IHsgZml4dXBBbHBoYSB9IGZyb20gJy4uL2ZpeHVwL2FscGhhLmpzJztcbmltcG9ydCB7IGludGVycG9sYXRvckxpbmVhciB9IGZyb20gJy4uL2ludGVycG9sYXRlL2xpbmVhci5qcyc7XG5pbXBvcnQgeyBkaWZmZXJlbmNlSHVlQ2hyb21hIH0gZnJvbSAnLi4vZGlmZmVyZW5jZS5qcyc7XG5pbXBvcnQgeyBhdmVyYWdlQW5nbGUgfSBmcm9tICcuLi9hdmVyYWdlLmpzJztcblxuY29uc3QgZGVmaW5pdGlvbiA9IHtcblx0bW9kZTogJ2pjaCcsXG5cblx0cGFyc2U6IFsnLS1qemN6aHonXSxcblx0c2VyaWFsaXplOiAnLS1qemN6aHonLFxuXG5cdHRvTW9kZToge1xuXHRcdGphYjogY29udmVydEpjaFRvSmFiLFxuXHRcdHJnYjogYyA9PiBjb252ZXJ0SmFiVG9SZ2IoY29udmVydEpjaFRvSmFiKGMpKVxuXHR9LFxuXG5cdGZyb21Nb2RlOiB7XG5cdFx0cmdiOiBjID0+IGNvbnZlcnRKYWJUb0pjaChjb252ZXJ0UmdiVG9KYWIoYykpLFxuXHRcdGphYjogY29udmVydEphYlRvSmNoXG5cdH0sXG5cblx0Y2hhbm5lbHM6IFsnaicsICdjJywgJ2gnLCAnYWxwaGEnXSxcblxuXHRyYW5nZXM6IHtcblx0XHRqOiBbMCwgMC4yMjFdLFxuXHRcdGM6IFswLCAwLjE5XSxcblx0XHRoOiBbMCwgMzYwXVxuXHR9LFxuXG5cdGludGVycG9sYXRlOiB7XG5cdFx0aDogeyB1c2U6IGludGVycG9sYXRvckxpbmVhciwgZml4dXA6IGZpeHVwSHVlU2hvcnRlciB9LFxuXHRcdGM6IGludGVycG9sYXRvckxpbmVhcixcblx0XHRqOiBpbnRlcnBvbGF0b3JMaW5lYXIsXG5cdFx0YWxwaGE6IHsgdXNlOiBpbnRlcnBvbGF0b3JMaW5lYXIsIGZpeHVwOiBmaXh1cEFscGhhIH1cblx0fSxcblxuXHRkaWZmZXJlbmNlOiB7XG5cdFx0aDogZGlmZmVyZW5jZUh1ZUNocm9tYVxuXHR9LFxuXG5cdGF2ZXJhZ2U6IHtcblx0XHRoOiBhdmVyYWdlQW5nbGVcblx0fVxufTtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5pdGlvbjtcbiIsICJleHBvcnQgY29uc3QgayA9IE1hdGgucG93KDI5LCAzKSAvIE1hdGgucG93KDMsIDMpO1xuZXhwb3J0IGNvbnN0IGUgPSBNYXRoLnBvdyg2LCAzKSAvIE1hdGgucG93KDI5LCAzKTtcbiIsICJpbXBvcnQgeyBrLCBlIH0gZnJvbSAnLi4veHl6NTAvY29uc3RhbnRzLmpzJztcbmltcG9ydCB7IEQ1MCB9IGZyb20gJy4uL2NvbnN0YW50cy5qcyc7XG5cbmxldCBmbiA9IHYgPT4gKE1hdGgucG93KHYsIDMpID4gZSA/IE1hdGgucG93KHYsIDMpIDogKDExNiAqIHYgLSAxNikgLyBrKTtcblxuY29uc3QgY29udmVydExhYlRvWHl6NTAgPSAoeyBsLCBhLCBiLCBhbHBoYSB9KSA9PiB7XG5cdGlmIChsID09PSB1bmRlZmluZWQpIGwgPSAwO1xuXHRpZiAoYSA9PT0gdW5kZWZpbmVkKSBhID0gMDtcblx0aWYgKGIgPT09IHVuZGVmaW5lZCkgYiA9IDA7XG5cdGxldCBmeSA9IChsICsgMTYpIC8gMTE2O1xuXHRsZXQgZnggPSBhIC8gNTAwICsgZnk7XG5cdGxldCBmeiA9IGZ5IC0gYiAvIDIwMDtcblxuXHRsZXQgcmVzID0ge1xuXHRcdG1vZGU6ICd4eXo1MCcsXG5cdFx0eDogZm4oZngpICogRDUwLlgsXG5cdFx0eTogZm4oZnkpICogRDUwLlksXG5cdFx0ejogZm4oZnopICogRDUwLlpcblx0fTtcblxuXHRpZiAoYWxwaGEgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJlcy5hbHBoYSA9IGFscGhhO1xuXHR9XG5cblx0cmV0dXJuIHJlcztcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNvbnZlcnRMYWJUb1h5ejUwO1xuIiwgIi8qXG5cdENJRSBYWVogRDUwIHZhbHVlcyB0byBzUkdCLlxuXG5cdFJlZmVyZW5jZXM6XG5cdFx0KiBodHRwczovL2RyYWZ0cy5jc3N3Zy5vcmcvY3NzLWNvbG9yLyNjb2xvci1jb252ZXJzaW9uLWNvZGVcblx0XHQqIGh0dHA6Ly93d3cuYnJ1Y2VsaW5kYmxvb20uY29tL2luZGV4Lmh0bWw/RXFuX1JHQl9YWVpfTWF0cml4Lmh0bWxcbiovXG5cbmltcG9ydCBjb252ZXJ0THJnYlRvUmdiIGZyb20gJy4uL2xyZ2IvY29udmVydExyZ2JUb1JnYi5qcyc7XG5cbmNvbnN0IGNvbnZlcnRYeXo1MFRvUmdiID0gKHsgeCwgeSwgeiwgYWxwaGEgfSkgPT4ge1xuXHRpZiAoeCA9PT0gdW5kZWZpbmVkKSB4ID0gMDtcblx0aWYgKHkgPT09IHVuZGVmaW5lZCkgeSA9IDA7XG5cdGlmICh6ID09PSB1bmRlZmluZWQpIHogPSAwO1xuXHRsZXQgcmVzID0gY29udmVydExyZ2JUb1JnYih7XG5cdFx0cjpcblx0XHRcdHggKiAzLjEzNDEzNTk1Njk5NTg3MDcgLVxuXHRcdFx0eSAqIDEuNjE3Mzg2MzMyMTYxMjUzOCAtXG5cdFx0XHQwLjQ5MDY2MTk0NjAwODM1MzIgKiB6LFxuXHRcdGc6XG5cdFx0XHR4ICogLTAuOTc4Nzk1NTAyOTEyMDg5ICtcblx0XHRcdHkgKiAxLjkxNjI1NDU2NzI1OTUyNCArXG5cdFx0XHQwLjAzMzQ0MjczMTE2MTMxOTQ5ICogeixcblx0XHRiOlxuXHRcdFx0eCAqIDAuMDcxOTU1Mzc5ODg0MTE2NzcgLVxuXHRcdFx0eSAqIDAuMjI4OTc2ODI2NDE1ODMyMiArXG5cdFx0XHQxLjQwNTM4NjA1ODMyNDEyNSAqIHpcblx0fSk7XG5cdGlmIChhbHBoYSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmVzLmFscGhhID0gYWxwaGE7XG5cdH1cblx0cmV0dXJuIHJlcztcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNvbnZlcnRYeXo1MFRvUmdiO1xuIiwgImltcG9ydCBjb252ZXJ0TGFiVG9YeXo1MCBmcm9tICcuL2NvbnZlcnRMYWJUb1h5ejUwLmpzJztcbmltcG9ydCBjb252ZXJ0WHl6NTBUb1JnYiBmcm9tICcuLi94eXo1MC9jb252ZXJ0WHl6NTBUb1JnYi5qcyc7XG5cbmNvbnN0IGNvbnZlcnRMYWJUb1JnYiA9IGxhYiA9PiBjb252ZXJ0WHl6NTBUb1JnYihjb252ZXJ0TGFiVG9YeXo1MChsYWIpKTtcblxuZXhwb3J0IGRlZmF1bHQgY29udmVydExhYlRvUmdiO1xuIiwgIi8qXG5cdENvbnZlcnQgc1JHQiB2YWx1ZXMgdG8gQ0lFIFhZWiBENTBcblxuXHRSZWZlcmVuY2VzOlxuXHRcdCogaHR0cHM6Ly9kcmFmdHMuY3Nzd2cub3JnL2Nzcy1jb2xvci8jY29sb3ItY29udmVyc2lvbi1jb2RlXG5cdFx0KiBodHRwOi8vd3d3LmJydWNlbGluZGJsb29tLmNvbS9pbmRleC5odG1sP0Vxbl9SR0JfWFlaX01hdHJpeC5odG1sXG5cdFxuKi9cblxuaW1wb3J0IGNvbnZlcnRSZ2JUb0xyZ2IgZnJvbSAnLi4vbHJnYi9jb252ZXJ0UmdiVG9McmdiLmpzJztcblxuY29uc3QgY29udmVydFJnYlRvWHl6NTAgPSByZ2IgPT4ge1xuXHRsZXQgeyByLCBnLCBiLCBhbHBoYSB9ID0gY29udmVydFJnYlRvTHJnYihyZ2IpO1xuXHRsZXQgcmVzID0ge1xuXHRcdG1vZGU6ICd4eXo1MCcsXG5cdFx0eDpcblx0XHRcdDAuNDM2MDY1NzQyODI0ODExICogciArXG5cdFx0XHQwLjM4NTE1MTQ2ODgzMzc5MTIgKiBnICtcblx0XHRcdDAuMTQzMDc4NDU0NDIyNjQxOTcgKiBiLFxuXHRcdHk6XG5cdFx0XHQwLjIyMjQ5MzE5MTc1NjIzNzAyICogciArXG5cdFx0XHQwLjcxNjg4NzA1MzgyMzg4MjMgKiBnICtcblx0XHRcdDAuMDYwNjE5NzkwNTM2MTY1MzcgKiBiLFxuXHRcdHo6XG5cdFx0XHQwLjAxMzkyMzkwNDUwMDk0MzQ2NSAqIHIgK1xuXHRcdFx0MC4wOTcwODEyODU2NjU3NDYzNCAqIGcgK1xuXHRcdFx0MC43MTQwOTkzNTg0MDA1MTU1ICogYlxuXHR9O1xuXHRpZiAoYWxwaGEgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJlcy5hbHBoYSA9IGFscGhhO1xuXHR9XG5cdHJldHVybiByZXM7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBjb252ZXJ0UmdiVG9YeXo1MDtcbiIsICJpbXBvcnQgeyBrLCBlIH0gZnJvbSAnLi4veHl6NTAvY29uc3RhbnRzLmpzJztcbmltcG9ydCB7IEQ1MCB9IGZyb20gJy4uL2NvbnN0YW50cy5qcyc7XG5cbmNvbnN0IGYgPSB2YWx1ZSA9PiAodmFsdWUgPiBlID8gTWF0aC5jYnJ0KHZhbHVlKSA6IChrICogdmFsdWUgKyAxNikgLyAxMTYpO1xuXG5jb25zdCBjb252ZXJ0WHl6NTBUb0xhYiA9ICh7IHgsIHksIHosIGFscGhhIH0pID0+IHtcblx0aWYgKHggPT09IHVuZGVmaW5lZCkgeCA9IDA7XG5cdGlmICh5ID09PSB1bmRlZmluZWQpIHkgPSAwO1xuXHRpZiAoeiA9PT0gdW5kZWZpbmVkKSB6ID0gMDtcblx0bGV0IGYwID0gZih4IC8gRDUwLlgpO1xuXHRsZXQgZjEgPSBmKHkgLyBENTAuWSk7XG5cdGxldCBmMiA9IGYoeiAvIEQ1MC5aKTtcblxuXHRsZXQgcmVzID0ge1xuXHRcdG1vZGU6ICdsYWInLFxuXHRcdGw6IDExNiAqIGYxIC0gMTYsXG5cdFx0YTogNTAwICogKGYwIC0gZjEpLFxuXHRcdGI6IDIwMCAqIChmMSAtIGYyKVxuXHR9O1xuXG5cdGlmIChhbHBoYSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmVzLmFscGhhID0gYWxwaGE7XG5cdH1cblxuXHRyZXR1cm4gcmVzO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgY29udmVydFh5ejUwVG9MYWI7XG4iLCAiaW1wb3J0IGNvbnZlcnRSZ2JUb1h5ejUwIGZyb20gJy4uL3h5ejUwL2NvbnZlcnRSZ2JUb1h5ejUwLmpzJztcbmltcG9ydCBjb252ZXJ0WHl6NTBUb0xhYiBmcm9tICcuL2NvbnZlcnRYeXo1MFRvTGFiLmpzJztcblxuY29uc3QgY29udmVydFJnYlRvTGFiID0gcmdiID0+IHtcblx0bGV0IHJlcyA9IGNvbnZlcnRYeXo1MFRvTGFiKGNvbnZlcnRSZ2JUb1h5ejUwKHJnYikpO1xuXG5cdC8vIEZpeGVzIGFjaHJvbWF0aWMgUkdCIGNvbG9ycyBoYXZpbmcgYSBfc2xpZ2h0XyBjaHJvbWEgZHVlIHRvIGZsb2F0aW5nLXBvaW50IGVycm9yc1xuXHQvLyBhbmQgYXBwcm94aW1hdGVkIGNvbXB1dGF0aW9ucyBpbiBzUkdCIDwtPiBDSUVMYWIuXG5cdC8vIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL2QzL2QzLWNvbG9yL3B1bGwvNDZcblx0aWYgKHJnYi5yID09PSByZ2IuYiAmJiByZ2IuYiA9PT0gcmdiLmcpIHtcblx0XHRyZXMuYSA9IHJlcy5iID0gMDtcblx0fVxuXHRyZXR1cm4gcmVzO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgY29udmVydFJnYlRvTGFiO1xuIiwgImltcG9ydCB7IFRvayB9IGZyb20gJy4uL3BhcnNlLmpzJztcblxuZnVuY3Rpb24gcGFyc2VMYWIoY29sb3IsIHBhcnNlZCkge1xuXHRpZiAoIXBhcnNlZCB8fCBwYXJzZWRbMF0gIT09ICdsYWInKSB7XG5cdFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0fVxuXHRjb25zdCByZXMgPSB7IG1vZGU6ICdsYWInIH07XG5cdGNvbnN0IFssIGwsIGEsIGIsIGFscGhhXSA9IHBhcnNlZDtcblx0aWYgKGwudHlwZSA9PT0gVG9rLkh1ZSB8fCBhLnR5cGUgPT09IFRvay5IdWUgfHwgYi50eXBlID09PSBUb2suSHVlKSB7XG5cdFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0fVxuXHRpZiAobC50eXBlICE9PSBUb2suTm9uZSkge1xuXHRcdHJlcy5sID0gTWF0aC5taW4oTWF0aC5tYXgoMCwgbC52YWx1ZSksIDEwMCk7XG5cdH1cblx0aWYgKGEudHlwZSAhPT0gVG9rLk5vbmUpIHtcblx0XHRyZXMuYSA9IGEudHlwZSA9PT0gVG9rLk51bWJlciA/IGEudmFsdWUgOiAoYS52YWx1ZSAqIDEyNSkgLyAxMDA7XG5cdH1cblx0aWYgKGIudHlwZSAhPT0gVG9rLk5vbmUpIHtcblx0XHRyZXMuYiA9IGIudHlwZSA9PT0gVG9rLk51bWJlciA/IGIudmFsdWUgOiAoYi52YWx1ZSAqIDEyNSkgLyAxMDA7XG5cdH1cblx0aWYgKGFscGhhLnR5cGUgIT09IFRvay5Ob25lKSB7XG5cdFx0cmVzLmFscGhhID0gTWF0aC5taW4oXG5cdFx0XHQxLFxuXHRcdFx0TWF0aC5tYXgoXG5cdFx0XHRcdDAsXG5cdFx0XHRcdGFscGhhLnR5cGUgPT09IFRvay5OdW1iZXIgPyBhbHBoYS52YWx1ZSA6IGFscGhhLnZhbHVlIC8gMTAwXG5cdFx0XHQpXG5cdFx0KTtcblx0fVxuXG5cdHJldHVybiByZXM7XG59XG5cbmV4cG9ydCBkZWZhdWx0IHBhcnNlTGFiO1xuIiwgImltcG9ydCBjb252ZXJ0TGFiVG9SZ2IgZnJvbSAnLi9jb252ZXJ0TGFiVG9SZ2IuanMnO1xuaW1wb3J0IGNvbnZlcnRMYWJUb1h5ejUwIGZyb20gJy4vY29udmVydExhYlRvWHl6NTAuanMnO1xuaW1wb3J0IGNvbnZlcnRSZ2JUb0xhYiBmcm9tICcuL2NvbnZlcnRSZ2JUb0xhYi5qcyc7XG5pbXBvcnQgY29udmVydFh5ejUwVG9MYWIgZnJvbSAnLi9jb252ZXJ0WHl6NTBUb0xhYi5qcyc7XG5pbXBvcnQgcGFyc2VMYWIgZnJvbSAnLi9wYXJzZUxhYi5qcyc7XG5pbXBvcnQgeyBpbnRlcnBvbGF0b3JMaW5lYXIgfSBmcm9tICcuLi9pbnRlcnBvbGF0ZS9saW5lYXIuanMnO1xuaW1wb3J0IHsgZml4dXBBbHBoYSB9IGZyb20gJy4uL2ZpeHVwL2FscGhhLmpzJztcblxuY29uc3QgZGVmaW5pdGlvbiA9IHtcblx0bW9kZTogJ2xhYicsXG5cblx0dG9Nb2RlOiB7XG5cdFx0eHl6NTA6IGNvbnZlcnRMYWJUb1h5ejUwLFxuXHRcdHJnYjogY29udmVydExhYlRvUmdiXG5cdH0sXG5cblx0ZnJvbU1vZGU6IHtcblx0XHR4eXo1MDogY29udmVydFh5ejUwVG9MYWIsXG5cdFx0cmdiOiBjb252ZXJ0UmdiVG9MYWJcblx0fSxcblxuXHRjaGFubmVsczogWydsJywgJ2EnLCAnYicsICdhbHBoYSddLFxuXG5cdHJhbmdlczoge1xuXHRcdGw6IFswLCAxMDBdLFxuXHRcdGE6IFstMTI1LCAxMjVdLFxuXHRcdGI6IFstMTI1LCAxMjVdXG5cdH0sXG5cblx0cGFyc2U6IFtwYXJzZUxhYl0sXG5cdHNlcmlhbGl6ZTogYyA9PlxuXHRcdGBsYWIoJHtjLmwgIT09IHVuZGVmaW5lZCA/IGMubCA6ICdub25lJ30gJHtcblx0XHRcdGMuYSAhPT0gdW5kZWZpbmVkID8gYy5hIDogJ25vbmUnXG5cdFx0fSAke2MuYiAhPT0gdW5kZWZpbmVkID8gYy5iIDogJ25vbmUnfSR7XG5cdFx0XHRjLmFscGhhIDwgMSA/IGAgLyAke2MuYWxwaGF9YCA6ICcnXG5cdFx0fSlgLFxuXG5cdGludGVycG9sYXRlOiB7XG5cdFx0bDogaW50ZXJwb2xhdG9yTGluZWFyLFxuXHRcdGE6IGludGVycG9sYXRvckxpbmVhcixcblx0XHRiOiBpbnRlcnBvbGF0b3JMaW5lYXIsXG5cdFx0YWxwaGE6IHsgdXNlOiBpbnRlcnBvbGF0b3JMaW5lYXIsIGZpeHVwOiBmaXh1cEFscGhhIH1cblx0fVxufTtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5pdGlvbjtcbiIsICJpbXBvcnQgY29udmVydExhYjY1VG9SZ2IgZnJvbSAnLi9jb252ZXJ0TGFiNjVUb1JnYi5qcyc7XG5pbXBvcnQgY29udmVydExhYjY1VG9YeXo2NSBmcm9tICcuL2NvbnZlcnRMYWI2NVRvWHl6NjUuanMnO1xuaW1wb3J0IGNvbnZlcnRSZ2JUb0xhYjY1IGZyb20gJy4vY29udmVydFJnYlRvTGFiNjUuanMnO1xuaW1wb3J0IGNvbnZlcnRYeXo2NVRvTGFiNjUgZnJvbSAnLi9jb252ZXJ0WHl6NjVUb0xhYjY1LmpzJztcbmltcG9ydCBsYWIgZnJvbSAnLi4vbGFiL2RlZmluaXRpb24uanMnO1xuXG5jb25zdCBkZWZpbml0aW9uID0ge1xuXHQuLi5sYWIsXG5cdG1vZGU6ICdsYWI2NScsXG5cblx0cGFyc2U6IFsnLS1sYWItZDY1J10sXG5cdHNlcmlhbGl6ZTogJy0tbGFiLWQ2NScsXG5cblx0dG9Nb2RlOiB7XG5cdFx0eHl6NjU6IGNvbnZlcnRMYWI2NVRvWHl6NjUsXG5cdFx0cmdiOiBjb252ZXJ0TGFiNjVUb1JnYlxuXHR9LFxuXG5cdGZyb21Nb2RlOiB7XG5cdFx0eHl6NjU6IGNvbnZlcnRYeXo2NVRvTGFiNjUsXG5cdFx0cmdiOiBjb252ZXJ0UmdiVG9MYWI2NVxuXHR9LFxuXG5cdHJhbmdlczoge1xuXHRcdGw6IFswLCAxMDBdLFxuXHRcdGE6IFstMTI1LCAxMjVdLFxuXHRcdGI6IFstMTI1LCAxMjVdXG5cdH1cbn07XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluaXRpb247XG4iLCAiaW1wb3J0IHsgVG9rIH0gZnJvbSAnLi4vcGFyc2UuanMnO1xuXG5mdW5jdGlvbiBwYXJzZUxjaChjb2xvciwgcGFyc2VkKSB7XG5cdGlmICghcGFyc2VkIHx8IHBhcnNlZFswXSAhPT0gJ2xjaCcpIHtcblx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHR9XG5cdGNvbnN0IHJlcyA9IHsgbW9kZTogJ2xjaCcgfTtcblx0Y29uc3QgWywgbCwgYywgaCwgYWxwaGFdID0gcGFyc2VkO1xuXHRpZiAobC50eXBlICE9PSBUb2suTm9uZSkge1xuXHRcdGlmIChsLnR5cGUgPT09IFRvay5IdWUpIHtcblx0XHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdFx0fVxuXHRcdHJlcy5sID0gTWF0aC5taW4oTWF0aC5tYXgoMCwgbC52YWx1ZSksIDEwMCk7XG5cdH1cblx0aWYgKGMudHlwZSAhPT0gVG9rLk5vbmUpIHtcblx0XHRyZXMuYyA9IE1hdGgubWF4KFxuXHRcdFx0MCxcblx0XHRcdGMudHlwZSA9PT0gVG9rLk51bWJlciA/IGMudmFsdWUgOiAoYy52YWx1ZSAqIDE1MCkgLyAxMDBcblx0XHQpO1xuXHR9XG5cdGlmIChoLnR5cGUgIT09IFRvay5Ob25lKSB7XG5cdFx0aWYgKGgudHlwZSA9PT0gVG9rLlBlcmNlbnRhZ2UpIHtcblx0XHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdFx0fVxuXHRcdHJlcy5oID0gaC52YWx1ZTtcblx0fVxuXHRpZiAoYWxwaGEudHlwZSAhPT0gVG9rLk5vbmUpIHtcblx0XHRyZXMuYWxwaGEgPSBNYXRoLm1pbihcblx0XHRcdDEsXG5cdFx0XHRNYXRoLm1heChcblx0XHRcdFx0MCxcblx0XHRcdFx0YWxwaGEudHlwZSA9PT0gVG9rLk51bWJlciA/IGFscGhhLnZhbHVlIDogYWxwaGEudmFsdWUgLyAxMDBcblx0XHRcdClcblx0XHQpO1xuXHR9XG5cblx0cmV0dXJuIHJlcztcbn1cblxuZXhwb3J0IGRlZmF1bHQgcGFyc2VMY2g7XG4iLCAiaW1wb3J0IGNvbnZlcnRMYWJUb0xjaCBmcm9tICcuL2NvbnZlcnRMYWJUb0xjaC5qcyc7XG5pbXBvcnQgY29udmVydExjaFRvTGFiIGZyb20gJy4vY29udmVydExjaFRvTGFiLmpzJztcbmltcG9ydCBjb252ZXJ0TGFiVG9SZ2IgZnJvbSAnLi4vbGFiL2NvbnZlcnRMYWJUb1JnYi5qcyc7XG5pbXBvcnQgY29udmVydFJnYlRvTGFiIGZyb20gJy4uL2xhYi9jb252ZXJ0UmdiVG9MYWIuanMnO1xuaW1wb3J0IHBhcnNlTGNoIGZyb20gJy4vcGFyc2VMY2guanMnO1xuaW1wb3J0IHsgZml4dXBIdWVTaG9ydGVyIH0gZnJvbSAnLi4vZml4dXAvaHVlLmpzJztcbmltcG9ydCB7IGZpeHVwQWxwaGEgfSBmcm9tICcuLi9maXh1cC9hbHBoYS5qcyc7XG5pbXBvcnQgeyBpbnRlcnBvbGF0b3JMaW5lYXIgfSBmcm9tICcuLi9pbnRlcnBvbGF0ZS9saW5lYXIuanMnO1xuaW1wb3J0IHsgZGlmZmVyZW5jZUh1ZUNocm9tYSB9IGZyb20gJy4uL2RpZmZlcmVuY2UuanMnO1xuaW1wb3J0IHsgYXZlcmFnZUFuZ2xlIH0gZnJvbSAnLi4vYXZlcmFnZS5qcyc7XG5cbmNvbnN0IGRlZmluaXRpb24gPSB7XG5cdG1vZGU6ICdsY2gnLFxuXG5cdHRvTW9kZToge1xuXHRcdGxhYjogY29udmVydExjaFRvTGFiLFxuXHRcdHJnYjogYyA9PiBjb252ZXJ0TGFiVG9SZ2IoY29udmVydExjaFRvTGFiKGMpKVxuXHR9LFxuXG5cdGZyb21Nb2RlOiB7XG5cdFx0cmdiOiBjID0+IGNvbnZlcnRMYWJUb0xjaChjb252ZXJ0UmdiVG9MYWIoYykpLFxuXHRcdGxhYjogY29udmVydExhYlRvTGNoXG5cdH0sXG5cblx0Y2hhbm5lbHM6IFsnbCcsICdjJywgJ2gnLCAnYWxwaGEnXSxcblxuXHRyYW5nZXM6IHtcblx0XHRsOiBbMCwgMTAwXSxcblx0XHRjOiBbMCwgMTUwXSxcblx0XHRoOiBbMCwgMzYwXVxuXHR9LFxuXG5cdHBhcnNlOiBbcGFyc2VMY2hdLFxuXHRzZXJpYWxpemU6IGMgPT5cblx0XHRgbGNoKCR7Yy5sICE9PSB1bmRlZmluZWQgPyBjLmwgOiAnbm9uZSd9ICR7XG5cdFx0XHRjLmMgIT09IHVuZGVmaW5lZCA/IGMuYyA6ICdub25lJ1xuXHRcdH0gJHtjLmggIT09IHVuZGVmaW5lZCA/IGMuaCA6ICdub25lJ30ke1xuXHRcdFx0Yy5hbHBoYSA8IDEgPyBgIC8gJHtjLmFscGhhfWAgOiAnJ1xuXHRcdH0pYCxcblxuXHRpbnRlcnBvbGF0ZToge1xuXHRcdGg6IHsgdXNlOiBpbnRlcnBvbGF0b3JMaW5lYXIsIGZpeHVwOiBmaXh1cEh1ZVNob3J0ZXIgfSxcblx0XHRjOiBpbnRlcnBvbGF0b3JMaW5lYXIsXG5cdFx0bDogaW50ZXJwb2xhdG9yTGluZWFyLFxuXHRcdGFscGhhOiB7IHVzZTogaW50ZXJwb2xhdG9yTGluZWFyLCBmaXh1cDogZml4dXBBbHBoYSB9XG5cdH0sXG5cblx0ZGlmZmVyZW5jZToge1xuXHRcdGg6IGRpZmZlcmVuY2VIdWVDaHJvbWFcblx0fSxcblxuXHRhdmVyYWdlOiB7XG5cdFx0aDogYXZlcmFnZUFuZ2xlXG5cdH1cbn07XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluaXRpb247XG4iLCAiaW1wb3J0IGNvbnZlcnRMYWJUb0xjaCBmcm9tICcuLi9sY2gvY29udmVydExhYlRvTGNoLmpzJztcbmltcG9ydCBjb252ZXJ0TGNoVG9MYWIgZnJvbSAnLi4vbGNoL2NvbnZlcnRMY2hUb0xhYi5qcyc7XG5pbXBvcnQgY29udmVydExhYjY1VG9SZ2IgZnJvbSAnLi4vbGFiNjUvY29udmVydExhYjY1VG9SZ2IuanMnO1xuaW1wb3J0IGNvbnZlcnRSZ2JUb0xhYjY1IGZyb20gJy4uL2xhYjY1L2NvbnZlcnRSZ2JUb0xhYjY1LmpzJztcbmltcG9ydCBsY2ggZnJvbSAnLi4vbGNoL2RlZmluaXRpb24uanMnO1xuXG5jb25zdCBkZWZpbml0aW9uID0ge1xuXHQuLi5sY2gsXG5cdG1vZGU6ICdsY2g2NScsXG5cblx0cGFyc2U6IFsnLS1sY2gtZDY1J10sXG5cdHNlcmlhbGl6ZTogJy0tbGNoLWQ2NScsXG5cblx0dG9Nb2RlOiB7XG5cdFx0bGFiNjU6IGMgPT4gY29udmVydExjaFRvTGFiKGMsICdsYWI2NScpLFxuXHRcdHJnYjogYyA9PiBjb252ZXJ0TGFiNjVUb1JnYihjb252ZXJ0TGNoVG9MYWIoYywgJ2xhYjY1JykpXG5cdH0sXG5cblx0ZnJvbU1vZGU6IHtcblx0XHRyZ2I6IGMgPT4gY29udmVydExhYlRvTGNoKGNvbnZlcnRSZ2JUb0xhYjY1KGMpLCAnbGNoNjUnKSxcblx0XHRsYWI2NTogYyA9PiBjb252ZXJ0TGFiVG9MY2goYywgJ2xjaDY1Jylcblx0fSxcblxuXHRyYW5nZXM6IHtcblx0XHRsOiBbMCwgMTAwXSxcblx0XHRjOiBbMCwgMTUwXSxcblx0XHRoOiBbMCwgMzYwXVxuXHR9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbml0aW9uO1xuIiwgImltcG9ydCBub3JtYWxpemVIdWUgZnJvbSAnLi4vdXRpbC9ub3JtYWxpemVIdWUuanMnO1xuXG5jb25zdCBjb252ZXJ0THV2VG9MY2h1diA9ICh7IGwsIHUsIHYsIGFscGhhIH0pID0+IHtcblx0aWYgKHUgPT09IHVuZGVmaW5lZCkgdSA9IDA7XG5cdGlmICh2ID09PSB1bmRlZmluZWQpIHYgPSAwO1xuXHRsZXQgYyA9IE1hdGguc3FydCh1ICogdSArIHYgKiB2KTtcblx0bGV0IHJlcyA9IHtcblx0XHRtb2RlOiAnbGNodXYnLFxuXHRcdGw6IGwsXG5cdFx0YzogY1xuXHR9O1xuXHRpZiAoYykge1xuXHRcdHJlcy5oID0gbm9ybWFsaXplSHVlKChNYXRoLmF0YW4yKHYsIHUpICogMTgwKSAvIE1hdGguUEkpO1xuXHR9XG5cdGlmIChhbHBoYSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmVzLmFscGhhID0gYWxwaGE7XG5cdH1cblx0cmV0dXJuIHJlcztcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNvbnZlcnRMdXZUb0xjaHV2O1xuIiwgImNvbnN0IGNvbnZlcnRMY2h1dlRvTHV2ID0gKHsgbCwgYywgaCwgYWxwaGEgfSkgPT4ge1xuXHRpZiAoaCA9PT0gdW5kZWZpbmVkKSBoID0gMDtcblx0bGV0IHJlcyA9IHtcblx0XHRtb2RlOiAnbHV2Jyxcblx0XHRsOiBsLFxuXHRcdHU6IGMgPyBjICogTWF0aC5jb3MoKGggLyAxODApICogTWF0aC5QSSkgOiAwLFxuXHRcdHY6IGMgPyBjICogTWF0aC5zaW4oKGggLyAxODApICogTWF0aC5QSSkgOiAwXG5cdH07XG5cdGlmIChhbHBoYSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmVzLmFscGhhID0gYWxwaGE7XG5cdH1cblx0cmV0dXJuIHJlcztcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNvbnZlcnRMY2h1dlRvTHV2O1xuIiwgImltcG9ydCB7IGssIGUgfSBmcm9tICcuLi94eXo1MC9jb25zdGFudHMuanMnO1xuaW1wb3J0IHsgRDUwIH0gZnJvbSAnLi4vY29uc3RhbnRzLmpzJztcblxuZXhwb3J0IGNvbnN0IHVfZm4gPSAoeCwgeSwgeikgPT4gKDQgKiB4KSAvICh4ICsgMTUgKiB5ICsgMyAqIHopO1xuZXhwb3J0IGNvbnN0IHZfZm4gPSAoeCwgeSwgeikgPT4gKDkgKiB5KSAvICh4ICsgMTUgKiB5ICsgMyAqIHopO1xuXG5leHBvcnQgY29uc3QgdW4gPSB1X2ZuKEQ1MC5YLCBENTAuWSwgRDUwLlopO1xuZXhwb3J0IGNvbnN0IHZuID0gdl9mbihENTAuWCwgRDUwLlksIEQ1MC5aKTtcblxuY29uc3QgbF9mbiA9IHZhbHVlID0+ICh2YWx1ZSA8PSBlID8gayAqIHZhbHVlIDogMTE2ICogTWF0aC5jYnJ0KHZhbHVlKSAtIDE2KTtcblxuY29uc3QgY29udmVydFh5ejUwVG9MdXYgPSAoeyB4LCB5LCB6LCBhbHBoYSB9KSA9PiB7XG5cdGlmICh4ID09PSB1bmRlZmluZWQpIHggPSAwO1xuXHRpZiAoeSA9PT0gdW5kZWZpbmVkKSB5ID0gMDtcblx0aWYgKHogPT09IHVuZGVmaW5lZCkgeiA9IDA7XG5cdGxldCBsID0gbF9mbih5IC8gRDUwLlkpO1xuXHRsZXQgdSA9IHVfZm4oeCwgeSwgeik7XG5cdGxldCB2ID0gdl9mbih4LCB5LCB6KTtcblxuXHQvLyBndWFyZCBhZ2FpbnN0IE5hTnMgcHJvZHVjZWQgYnkgYHh5eigwIDAgMClgIGJsYWNrXG5cdGlmICghaXNGaW5pdGUodSkgfHwgIWlzRmluaXRlKHYpKSB7XG5cdFx0bCA9IHUgPSB2ID0gMDtcblx0fSBlbHNlIHtcblx0XHR1ID0gMTMgKiBsICogKHUgLSB1bik7XG5cdFx0diA9IDEzICogbCAqICh2IC0gdm4pO1xuXHR9XG5cblx0bGV0IHJlcyA9IHtcblx0XHRtb2RlOiAnbHV2Jyxcblx0XHRsLFxuXHRcdHUsXG5cdFx0dlxuXHR9O1xuXG5cdGlmIChhbHBoYSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmVzLmFscGhhID0gYWxwaGE7XG5cdH1cblxuXHRyZXR1cm4gcmVzO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgY29udmVydFh5ejUwVG9MdXY7XG4iLCAiaW1wb3J0IHsgayB9IGZyb20gJy4uL3h5ejUwL2NvbnN0YW50cy5qcyc7XG5pbXBvcnQgeyBENTAgfSBmcm9tICcuLi9jb25zdGFudHMuanMnO1xuXG5leHBvcnQgY29uc3QgdV9mbiA9ICh4LCB5LCB6KSA9PiAoNCAqIHgpIC8gKHggKyAxNSAqIHkgKyAzICogeik7XG5leHBvcnQgY29uc3Qgdl9mbiA9ICh4LCB5LCB6KSA9PiAoOSAqIHkpIC8gKHggKyAxNSAqIHkgKyAzICogeik7XG5cbmV4cG9ydCBjb25zdCB1biA9IHVfZm4oRDUwLlgsIEQ1MC5ZLCBENTAuWik7XG5leHBvcnQgY29uc3Qgdm4gPSB2X2ZuKEQ1MC5YLCBENTAuWSwgRDUwLlopO1xuXG5jb25zdCBjb252ZXJ0THV2VG9YeXo1MCA9ICh7IGwsIHUsIHYsIGFscGhhIH0pID0+IHtcblx0aWYgKGwgPT09IHVuZGVmaW5lZCkgbCA9IDA7XG5cdGlmIChsID09PSAwKSB7XG5cdFx0cmV0dXJuIHsgbW9kZTogJ3h5ejUwJywgeDogMCwgeTogMCwgejogMCB9O1xuXHR9XG5cblx0aWYgKHUgPT09IHVuZGVmaW5lZCkgdSA9IDA7XG5cdGlmICh2ID09PSB1bmRlZmluZWQpIHYgPSAwO1xuXG5cdGxldCB1cCA9IHUgLyAoMTMgKiBsKSArIHVuO1xuXHRsZXQgdnAgPSB2IC8gKDEzICogbCkgKyB2bjtcblx0bGV0IHkgPSBENTAuWSAqIChsIDw9IDggPyBsIC8gayA6IE1hdGgucG93KChsICsgMTYpIC8gMTE2LCAzKSk7XG5cdGxldCB4ID0gKHkgKiAoOSAqIHVwKSkgLyAoNCAqIHZwKTtcblx0bGV0IHogPSAoeSAqICgxMiAtIDMgKiB1cCAtIDIwICogdnApKSAvICg0ICogdnApO1xuXG5cdGxldCByZXMgPSB7IG1vZGU6ICd4eXo1MCcsIHgsIHksIHogfTtcblx0aWYgKGFscGhhICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXMuYWxwaGEgPSBhbHBoYTtcblx0fVxuXG5cdHJldHVybiByZXM7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBjb252ZXJ0THV2VG9YeXo1MDtcbiIsICIvKlxuXHRDSUVMQ2h1diBjb2xvciBzcGFjZVxuXHQtLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5cdFJlZmVyZW5jZTogXG5cblx0XHRodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9DSUVMVVZcbiAqL1xuXG5pbXBvcnQgY29udmVydEx1dlRvTGNodXYgZnJvbSAnLi9jb252ZXJ0THV2VG9MY2h1di5qcyc7XG5pbXBvcnQgY29udmVydExjaHV2VG9MdXYgZnJvbSAnLi9jb252ZXJ0TGNodXZUb0x1di5qcyc7XG5pbXBvcnQgY29udmVydFh5ejUwVG9MdXYgZnJvbSAnLi4vbHV2L2NvbnZlcnRYeXo1MFRvTHV2LmpzJztcbmltcG9ydCBjb252ZXJ0THV2VG9YeXo1MCBmcm9tICcuLi9sdXYvY29udmVydEx1dlRvWHl6NTAuanMnO1xuaW1wb3J0IGNvbnZlcnRYeXo1MFRvUmdiIGZyb20gJy4uL3h5ejUwL2NvbnZlcnRYeXo1MFRvUmdiLmpzJztcbmltcG9ydCBjb252ZXJ0UmdiVG9YeXo1MCBmcm9tICcuLi94eXo1MC9jb252ZXJ0UmdiVG9YeXo1MC5qcyc7XG5cbmltcG9ydCB7IGZpeHVwSHVlU2hvcnRlciB9IGZyb20gJy4uL2ZpeHVwL2h1ZS5qcyc7XG5pbXBvcnQgeyBmaXh1cEFscGhhIH0gZnJvbSAnLi4vZml4dXAvYWxwaGEuanMnO1xuaW1wb3J0IHsgaW50ZXJwb2xhdG9yTGluZWFyIH0gZnJvbSAnLi4vaW50ZXJwb2xhdGUvbGluZWFyLmpzJztcbmltcG9ydCB7IGRpZmZlcmVuY2VIdWVDaHJvbWEgfSBmcm9tICcuLi9kaWZmZXJlbmNlLmpzJztcbmltcG9ydCB7IGF2ZXJhZ2VBbmdsZSB9IGZyb20gJy4uL2F2ZXJhZ2UuanMnO1xuXG5jb25zdCBjb252ZXJ0UmdiVG9MY2h1diA9IHJnYiA9PlxuXHRjb252ZXJ0THV2VG9MY2h1dihjb252ZXJ0WHl6NTBUb0x1dihjb252ZXJ0UmdiVG9YeXo1MChyZ2IpKSk7XG5jb25zdCBjb252ZXJ0TGNodXZUb1JnYiA9IGxjaHV2ID0+XG5cdGNvbnZlcnRYeXo1MFRvUmdiKGNvbnZlcnRMdXZUb1h5ejUwKGNvbnZlcnRMY2h1dlRvTHV2KGxjaHV2KSkpO1xuXG5jb25zdCBkZWZpbml0aW9uID0ge1xuXHRtb2RlOiAnbGNodXYnLFxuXG5cdHRvTW9kZToge1xuXHRcdGx1djogY29udmVydExjaHV2VG9MdXYsXG5cdFx0cmdiOiBjb252ZXJ0TGNodXZUb1JnYlxuXHR9LFxuXG5cdGZyb21Nb2RlOiB7XG5cdFx0cmdiOiBjb252ZXJ0UmdiVG9MY2h1dixcblx0XHRsdXY6IGNvbnZlcnRMdXZUb0xjaHV2XG5cdH0sXG5cblx0Y2hhbm5lbHM6IFsnbCcsICdjJywgJ2gnLCAnYWxwaGEnXSxcblxuXHRwYXJzZTogWyctLWxjaHV2J10sXG5cdHNlcmlhbGl6ZTogJy0tbGNodXYnLFxuXG5cdHJhbmdlczoge1xuXHRcdGw6IFswLCAxMDBdLFxuXHRcdGM6IFswLCAxNzYuOTU2XSxcblx0XHRoOiBbMCwgMzYwXVxuXHR9LFxuXG5cdGludGVycG9sYXRlOiB7XG5cdFx0aDogeyB1c2U6IGludGVycG9sYXRvckxpbmVhciwgZml4dXA6IGZpeHVwSHVlU2hvcnRlciB9LFxuXHRcdGM6IGludGVycG9sYXRvckxpbmVhcixcblx0XHRsOiBpbnRlcnBvbGF0b3JMaW5lYXIsXG5cdFx0YWxwaGE6IHsgdXNlOiBpbnRlcnBvbGF0b3JMaW5lYXIsIGZpeHVwOiBmaXh1cEFscGhhIH1cblx0fSxcblxuXHRkaWZmZXJlbmNlOiB7XG5cdFx0aDogZGlmZmVyZW5jZUh1ZUNocm9tYVxuXHR9LFxuXG5cdGF2ZXJhZ2U6IHtcblx0XHRoOiBhdmVyYWdlQW5nbGVcblx0fVxufTtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5pdGlvbjtcbiIsICJpbXBvcnQgcmdiIGZyb20gJy4uL3JnYi9kZWZpbml0aW9uLmpzJztcbmltcG9ydCBjb252ZXJ0UmdiVG9McmdiIGZyb20gJy4vY29udmVydFJnYlRvTHJnYi5qcyc7XG5pbXBvcnQgY29udmVydExyZ2JUb1JnYiBmcm9tICcuL2NvbnZlcnRMcmdiVG9SZ2IuanMnO1xuXG5jb25zdCBkZWZpbml0aW9uID0ge1xuXHQuLi5yZ2IsXG5cdG1vZGU6ICdscmdiJyxcblxuXHR0b01vZGU6IHtcblx0XHRyZ2I6IGNvbnZlcnRMcmdiVG9SZ2Jcblx0fSxcblxuXHRmcm9tTW9kZToge1xuXHRcdHJnYjogY29udmVydFJnYlRvTHJnYlxuXHR9LFxuXG5cdHBhcnNlOiBbJ3NyZ2ItbGluZWFyJ10sXG5cdHNlcmlhbGl6ZTogJ3NyZ2ItbGluZWFyJ1xufTtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5pdGlvbjtcbiIsICIvKlxuXHRDSUVMVVYgY29sb3Igc3BhY2Vcblx0LS0tLS0tLS0tLS0tLS0tLS0tXG5cblx0UmVmZXJlbmNlOiBcblxuXHRcdGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0NJRUxVVlxuICovXG5cbmltcG9ydCBjb252ZXJ0WHl6NTBUb0x1diBmcm9tICcuL2NvbnZlcnRYeXo1MFRvTHV2LmpzJztcbmltcG9ydCBjb252ZXJ0THV2VG9YeXo1MCBmcm9tICcuL2NvbnZlcnRMdXZUb1h5ejUwLmpzJztcbmltcG9ydCBjb252ZXJ0WHl6NTBUb1JnYiBmcm9tICcuLi94eXo1MC9jb252ZXJ0WHl6NTBUb1JnYi5qcyc7XG5pbXBvcnQgY29udmVydFJnYlRvWHl6NTAgZnJvbSAnLi4veHl6NTAvY29udmVydFJnYlRvWHl6NTAuanMnO1xuXG5pbXBvcnQgeyBpbnRlcnBvbGF0b3JMaW5lYXIgfSBmcm9tICcuLi9pbnRlcnBvbGF0ZS9saW5lYXIuanMnO1xuaW1wb3J0IHsgZml4dXBBbHBoYSB9IGZyb20gJy4uL2ZpeHVwL2FscGhhLmpzJztcblxuY29uc3QgZGVmaW5pdGlvbiA9IHtcblx0bW9kZTogJ2x1dicsXG5cblx0dG9Nb2RlOiB7XG5cdFx0eHl6NTA6IGNvbnZlcnRMdXZUb1h5ejUwLFxuXHRcdHJnYjogbHV2ID0+IGNvbnZlcnRYeXo1MFRvUmdiKGNvbnZlcnRMdXZUb1h5ejUwKGx1dikpXG5cdH0sXG5cblx0ZnJvbU1vZGU6IHtcblx0XHR4eXo1MDogY29udmVydFh5ejUwVG9MdXYsXG5cdFx0cmdiOiByZ2IgPT4gY29udmVydFh5ejUwVG9MdXYoY29udmVydFJnYlRvWHl6NTAocmdiKSlcblx0fSxcblxuXHRjaGFubmVsczogWydsJywgJ3UnLCAndicsICdhbHBoYSddLFxuXG5cdHBhcnNlOiBbJy0tbHV2J10sXG5cdHNlcmlhbGl6ZTogJy0tbHV2JyxcblxuXHRyYW5nZXM6IHtcblx0XHRsOiBbMCwgMTAwXSxcblx0XHR1OiBbLTg0LjkzNiwgMTc1LjA0Ml0sXG5cdFx0djogWy0xMjUuODgyLCA4Ny4yNDNdXG5cdH0sXG5cblx0aW50ZXJwb2xhdGU6IHtcblx0XHRsOiBpbnRlcnBvbGF0b3JMaW5lYXIsXG5cdFx0dTogaW50ZXJwb2xhdG9yTGluZWFyLFxuXHRcdHY6IGludGVycG9sYXRvckxpbmVhcixcblx0XHRhbHBoYTogeyB1c2U6IGludGVycG9sYXRvckxpbmVhciwgZml4dXA6IGZpeHVwQWxwaGEgfVxuXHR9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbml0aW9uO1xuIiwgImNvbnN0IGNvbnZlcnRMcmdiVG9Pa2xhYiA9ICh7IHIsIGcsIGIsIGFscGhhIH0pID0+IHtcblx0aWYgKHIgPT09IHVuZGVmaW5lZCkgciA9IDA7XG5cdGlmIChnID09PSB1bmRlZmluZWQpIGcgPSAwO1xuXHRpZiAoYiA9PT0gdW5kZWZpbmVkKSBiID0gMDtcblxuXHRsZXQgTCA9IE1hdGguY2JydChcblx0XHQwLjQxMjIyMTQ2OTQ3MDc2MyAqIHIgKyAwLjUzNjMzMjUzNzI2MTczNDggKiBnICsgMC4wNTE0NDU5OTMyNjc1MDIyICogYlxuXHQpO1xuXHRsZXQgTSA9IE1hdGguY2JydChcblx0XHQwLjIxMTkwMzQ5NTgxNzgyNTIgKiByICsgMC42ODA2OTk1NTA2NDUyMzQ0ICogZyArIDAuMTA3Mzk2OTUzNTM2OTQwNiAqIGJcblx0KTtcblx0bGV0IFMgPSBNYXRoLmNicnQoXG5cdFx0MC4wODgzMDI0NTkxOTAwNTY0ICogciArIDAuMjgxNzE4ODM5MTM2MTIxNSAqIGcgKyAwLjYyOTk3ODcwMTY3MzgyMjIgKiBiXG5cdCk7XG5cblx0bGV0IHJlcyA9IHtcblx0XHRtb2RlOiAnb2tsYWInLFxuXHRcdGw6XG5cdFx0XHQwLjIxMDQ1NDI2ODMwOTMxNCAqIEwgK1xuXHRcdFx0MC43OTM2MTc3NzQ3MDIzMDU0ICogTSAtXG5cdFx0XHQwLjAwNDA3MjA0MzAxMTYxOTMgKiBTLFxuXHRcdGE6XG5cdFx0XHQxLjk3Nzk5ODUzMjQzMTE2ODQgKiBMIC1cblx0XHRcdDIuNDI4NTkyMjQyMDQ4NTc5OSAqIE0gK1xuXHRcdFx0MC40NTA1OTM3MDk2MTc0MTEgKiBTLFxuXHRcdGI6XG5cdFx0XHQwLjAyNTkwNDA0MjQ2NTU0NzggKiBMICtcblx0XHRcdDAuNzgyNzcxNzEyNDU3NTI5NiAqIE0gLVxuXHRcdFx0MC44MDg2NzU3NTQ5MjMwNzc0ICogU1xuXHR9O1xuXG5cdGlmIChhbHBoYSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmVzLmFscGhhID0gYWxwaGE7XG5cdH1cblxuXHRyZXR1cm4gcmVzO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgY29udmVydExyZ2JUb09rbGFiO1xuIiwgImltcG9ydCBjb252ZXJ0UmdiVG9McmdiIGZyb20gJy4uL2xyZ2IvY29udmVydFJnYlRvTHJnYi5qcyc7XG5pbXBvcnQgY29udmVydExyZ2JUb09rbGFiIGZyb20gJy4vY29udmVydExyZ2JUb09rbGFiLmpzJztcblxuY29uc3QgY29udmVydFJnYlRvT2tsYWIgPSByZ2IgPT4ge1xuXHRsZXQgcmVzID0gY29udmVydExyZ2JUb09rbGFiKGNvbnZlcnRSZ2JUb0xyZ2IocmdiKSk7XG5cdGlmIChyZ2IuciA9PT0gcmdiLmIgJiYgcmdiLmIgPT09IHJnYi5nKSB7XG5cdFx0cmVzLmEgPSByZXMuYiA9IDA7XG5cdH1cblx0cmV0dXJuIHJlcztcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNvbnZlcnRSZ2JUb09rbGFiO1xuIiwgImNvbnN0IGNvbnZlcnRPa2xhYlRvTHJnYiA9ICh7IGwsIGEsIGIsIGFscGhhIH0pID0+IHtcblx0aWYgKGwgPT09IHVuZGVmaW5lZCkgbCA9IDA7XG5cdGlmIChhID09PSB1bmRlZmluZWQpIGEgPSAwO1xuXHRpZiAoYiA9PT0gdW5kZWZpbmVkKSBiID0gMDtcblxuXHRsZXQgTCA9IE1hdGgucG93KGwgKyAwLjM5NjMzNzc3NzM3NjE3NDkgKiBhICsgMC4yMTU4MDM3NTczMDk5MTM2ICogYiwgMyk7XG5cdGxldCBNID0gTWF0aC5wb3cobCAtIDAuMTA1NTYxMzQ1ODE1NjU4NiAqIGEgLSAwLjA2Mzg1NDE3MjgyNTgxMzMgKiBiLCAzKTtcblx0bGV0IFMgPSBNYXRoLnBvdyhsIC0gMC4wODk0ODQxNzc1Mjk4MTE5ICogYSAtIDEuMjkxNDg1NTQ4MDE5NDA5MiAqIGIsIDMpO1xuXG5cdGxldCByZXMgPSB7XG5cdFx0bW9kZTogJ2xyZ2InLFxuXHRcdHI6XG5cdFx0XHQ0LjA3Njc0MTYzNjA3NTk1NzQgKiBMIC1cblx0XHRcdDMuMzA3NzExNTM5MjU4MDYxNiAqIE0gK1xuXHRcdFx0MC4yMzA5Njk5MDMxODIxMDQ0ICogUyxcblx0XHRnOlxuXHRcdFx0LTEuMjY4NDM3OTczMjg1MDMxNyAqIEwgK1xuXHRcdFx0Mi42MDk3NTczNDkyODc2ODg3ICogTSAtXG5cdFx0XHQwLjM0MTMxOTM3NjAwMjY1NzMgKiBTLFxuXHRcdGI6XG5cdFx0XHQtMC4wMDQxOTYwNzYxMzg2NzU2ICogTCAtXG5cdFx0XHQwLjcwMzQxODYxNzkzNTkzNjIgKiBNICtcblx0XHRcdDEuNzA3NjE0Njk0MDc0NjExNyAqIFNcblx0fTtcblxuXHRpZiAoYWxwaGEgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJlcy5hbHBoYSA9IGFscGhhO1xuXHR9XG5cblx0cmV0dXJuIHJlcztcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNvbnZlcnRPa2xhYlRvTHJnYjtcbiIsICJpbXBvcnQgY29udmVydExyZ2JUb1JnYiBmcm9tICcuLi9scmdiL2NvbnZlcnRMcmdiVG9SZ2IuanMnO1xuaW1wb3J0IGNvbnZlcnRPa2xhYlRvTHJnYiBmcm9tICcuL2NvbnZlcnRPa2xhYlRvTHJnYi5qcyc7XG5cbmNvbnN0IGNvbnZlcnRPa2xhYlRvUmdiID0gYyA9PiBjb252ZXJ0THJnYlRvUmdiKGNvbnZlcnRPa2xhYlRvTHJnYihjKSk7XG5cbmV4cG9ydCBkZWZhdWx0IGNvbnZlcnRPa2xhYlRvUmdiO1xuIiwgIi8qXG5cdEFkYXB0ZWQgZnJvbSBjb2RlIGJ5IEJqXHUwMEY2cm4gT3R0b3Nzb24sXG5cdHJlbGVhc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZTpcblxuXHRDb3B5cmlnaHQgKGMpIDIwMjEgQmpcdTAwRjZybiBPdHRvc3NvblxuXG5cdFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHkgb2Zcblx0dGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpblxuXHR0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvXG5cdHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzXG5cdG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkb1xuXHRzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG5cblx0VGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW4gYWxsXG5cdGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG5cblx0VEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuXHRJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcblx0RklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG5cdEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcblx0TElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcblx0T1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEVcblx0U09GVFdBUkUuXG4gKi9cblxuaW1wb3J0IGNvbnZlcnRPa2xhYlRvTHJnYiBmcm9tICcuLi9va2xhYi9jb252ZXJ0T2tsYWJUb0xyZ2IuanMnO1xuXG5leHBvcnQgZnVuY3Rpb24gdG9lKHgpIHtcblx0Y29uc3Qga18xID0gMC4yMDY7XG5cdGNvbnN0IGtfMiA9IDAuMDM7XG5cdGNvbnN0IGtfMyA9ICgxICsga18xKSAvICgxICsga18yKTtcblx0cmV0dXJuIChcblx0XHQwLjUgKlxuXHRcdChrXzMgKiB4IC1cblx0XHRcdGtfMSArXG5cdFx0XHRNYXRoLnNxcnQoKGtfMyAqIHggLSBrXzEpICogKGtfMyAqIHggLSBrXzEpICsgNCAqIGtfMiAqIGtfMyAqIHgpKVxuXHQpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdG9lX2ludih4KSB7XG5cdGNvbnN0IGtfMSA9IDAuMjA2O1xuXHRjb25zdCBrXzIgPSAwLjAzO1xuXHRjb25zdCBrXzMgPSAoMSArIGtfMSkgLyAoMSArIGtfMik7XG5cdHJldHVybiAoeCAqIHggKyBrXzEgKiB4KSAvIChrXzMgKiAoeCArIGtfMikpO1xufVxuXG4vLyBGaW5kcyB0aGUgbWF4aW11bSBzYXR1cmF0aW9uIHBvc3NpYmxlIGZvciBhIGdpdmVuIGh1ZSB0aGF0IGZpdHMgaW4gc1JHQlxuLy8gU2F0dXJhdGlvbiBoZXJlIGlzIGRlZmluZWQgYXMgUyA9IEMvTFxuLy8gYSBhbmQgYiBtdXN0IGJlIG5vcm1hbGl6ZWQgc28gYV4yICsgYl4yID09IDFcbmZ1bmN0aW9uIGNvbXB1dGVfbWF4X3NhdHVyYXRpb24oYSwgYikge1xuXHQvLyBNYXggc2F0dXJhdGlvbiB3aWxsIGJlIHdoZW4gb25lIG9mIHIsIGcgb3IgYiBnb2VzIGJlbG93IHplcm8uXG5cblx0Ly8gU2VsZWN0IGRpZmZlcmVudCBjb2VmZmljaWVudHMgZGVwZW5kaW5nIG9uIHdoaWNoIGNvbXBvbmVudCBnb2VzIGJlbG93IHplcm8gZmlyc3Rcblx0bGV0IGswLCBrMSwgazIsIGszLCBrNCwgd2wsIHdtLCB3cztcblxuXHRpZiAoLTEuODgxNzAzMjggKiBhIC0gMC44MDkzNjQ5MyAqIGIgPiAxKSB7XG5cdFx0Ly8gUmVkIGNvbXBvbmVudFxuXHRcdGswID0gKzEuMTkwODYyNzc7XG5cdFx0azEgPSArMS43NjU3NjcyODtcblx0XHRrMiA9ICswLjU5NjYyNjQxO1xuXHRcdGszID0gKzAuNzU1MTUxOTc7XG5cdFx0azQgPSArMC41Njc3MTI0NTtcblx0XHR3bCA9ICs0LjA3Njc0MTY2MjE7XG5cdFx0d20gPSAtMy4zMDc3MTE1OTEzO1xuXHRcdHdzID0gKzAuMjMwOTY5OTI5Mjtcblx0fSBlbHNlIGlmICgxLjgxNDQ0MTA0ICogYSAtIDEuMTk0NDUyNzYgKiBiID4gMSkge1xuXHRcdC8vIEdyZWVuIGNvbXBvbmVudFxuXHRcdGswID0gKzAuNzM5NTY1MTU7XG5cdFx0azEgPSAtMC40NTk1NDQwNDtcblx0XHRrMiA9ICswLjA4Mjg1NDI3O1xuXHRcdGszID0gKzAuMTI1NDEwNztcblx0XHRrNCA9ICswLjE0NTAzMjA0O1xuXHRcdHdsID0gLTEuMjY4NDM4MDA0Njtcblx0XHR3bSA9ICsyLjYwOTc1NzQwMTE7XG5cdFx0d3MgPSAtMC4zNDEzMTkzOTY1O1xuXHR9IGVsc2Uge1xuXHRcdC8vIEJsdWUgY29tcG9uZW50XG5cdFx0azAgPSArMS4zNTczMzY1Mjtcblx0XHRrMSA9IC0wLjAwOTE1Nzk5O1xuXHRcdGsyID0gLTEuMTUxMzAyMTtcblx0XHRrMyA9IC0wLjUwNTU5NjA2O1xuXHRcdGs0ID0gKzAuMDA2OTIxNjc7XG5cdFx0d2wgPSAtMC4wMDQxOTYwODYzO1xuXHRcdHdtID0gLTAuNzAzNDE4NjE0Nztcblx0XHR3cyA9ICsxLjcwNzYxNDcwMTtcblx0fVxuXG5cdC8vIEFwcHJveGltYXRlIG1heCBzYXR1cmF0aW9uIHVzaW5nIGEgcG9seW5vbWlhbDpcblx0bGV0IFMgPSBrMCArIGsxICogYSArIGsyICogYiArIGszICogYSAqIGEgKyBrNCAqIGEgKiBiO1xuXG5cdC8vIERvIG9uZSBzdGVwIEhhbGxleSdzIG1ldGhvZCB0byBnZXQgY2xvc2VyXG5cdC8vIHRoaXMgZ2l2ZXMgYW4gZXJyb3IgbGVzcyB0aGFuIDEwZTYsIGV4Y2VwdCBmb3Igc29tZSBibHVlIGh1ZXMgd2hlcmUgdGhlIGRTL2RoIGlzIGNsb3NlIHRvIGluZmluaXRlXG5cdC8vIHRoaXMgc2hvdWxkIGJlIHN1ZmZpY2llbnQgZm9yIG1vc3QgYXBwbGljYXRpb25zLCBvdGhlcndpc2UgZG8gdHdvL3RocmVlIHN0ZXBzXG5cblx0bGV0IGtfbCA9ICswLjM5NjMzNzc3NzQgKiBhICsgMC4yMTU4MDM3NTczICogYjtcblx0bGV0IGtfbSA9IC0wLjEwNTU2MTM0NTggKiBhIC0gMC4wNjM4NTQxNzI4ICogYjtcblx0bGV0IGtfcyA9IC0wLjA4OTQ4NDE3NzUgKiBhIC0gMS4yOTE0ODU1NDggKiBiO1xuXG5cdHtcblx0XHRsZXQgbF8gPSAxICsgUyAqIGtfbDtcblx0XHRsZXQgbV8gPSAxICsgUyAqIGtfbTtcblx0XHRsZXQgc18gPSAxICsgUyAqIGtfcztcblxuXHRcdGxldCBsID0gbF8gKiBsXyAqIGxfO1xuXHRcdGxldCBtID0gbV8gKiBtXyAqIG1fO1xuXHRcdGxldCBzID0gc18gKiBzXyAqIHNfO1xuXG5cdFx0bGV0IGxfZFMgPSAzICoga19sICogbF8gKiBsXztcblx0XHRsZXQgbV9kUyA9IDMgKiBrX20gKiBtXyAqIG1fO1xuXHRcdGxldCBzX2RTID0gMyAqIGtfcyAqIHNfICogc187XG5cblx0XHRsZXQgbF9kUzIgPSA2ICoga19sICoga19sICogbF87XG5cdFx0bGV0IG1fZFMyID0gNiAqIGtfbSAqIGtfbSAqIG1fO1xuXHRcdGxldCBzX2RTMiA9IDYgKiBrX3MgKiBrX3MgKiBzXztcblxuXHRcdGxldCBmID0gd2wgKiBsICsgd20gKiBtICsgd3MgKiBzO1xuXHRcdGxldCBmMSA9IHdsICogbF9kUyArIHdtICogbV9kUyArIHdzICogc19kUztcblx0XHRsZXQgZjIgPSB3bCAqIGxfZFMyICsgd20gKiBtX2RTMiArIHdzICogc19kUzI7XG5cblx0XHRTID0gUyAtIChmICogZjEpIC8gKGYxICogZjEgLSAwLjUgKiBmICogZjIpO1xuXHR9XG5cblx0cmV0dXJuIFM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmaW5kX2N1c3AoYSwgYikge1xuXHQvLyBGaXJzdCwgZmluZCB0aGUgbWF4aW11bSBzYXR1cmF0aW9uIChzYXR1cmF0aW9uIFMgPSBDL0wpXG5cdGxldCBTX2N1c3AgPSBjb21wdXRlX21heF9zYXR1cmF0aW9uKGEsIGIpO1xuXG5cdC8vIENvbnZlcnQgdG8gbGluZWFyIHNSR0IgdG8gZmluZCB0aGUgZmlyc3QgcG9pbnQgd2hlcmUgYXQgbGVhc3Qgb25lIG9mIHIsZyBvciBiID49IDE6XG5cdGxldCByZ2IgPSBjb252ZXJ0T2tsYWJUb0xyZ2IoeyBsOiAxLCBhOiBTX2N1c3AgKiBhLCBiOiBTX2N1c3AgKiBiIH0pO1xuXHRsZXQgTF9jdXNwID0gTWF0aC5jYnJ0KDEgLyBNYXRoLm1heChyZ2IuciwgcmdiLmcsIHJnYi5iKSk7XG5cdGxldCBDX2N1c3AgPSBMX2N1c3AgKiBTX2N1c3A7XG5cblx0cmV0dXJuIFtMX2N1c3AsIENfY3VzcF07XG59XG5cbi8vIEZpbmRzIGludGVyc2VjdGlvbiBvZiB0aGUgbGluZSBkZWZpbmVkIGJ5XG4vLyBMID0gTDAgKiAoMSAtIHQpICsgdCAqIEwxO1xuLy8gQyA9IHQgKiBDMTtcbi8vIGEgYW5kIGIgbXVzdCBiZSBub3JtYWxpemVkIHNvIGFeMiArIGJeMiA9PSAxXG5mdW5jdGlvbiBmaW5kX2dhbXV0X2ludGVyc2VjdGlvbihhLCBiLCBMMSwgQzEsIEwwLCBjdXNwID0gbnVsbCkge1xuXHRpZiAoIWN1c3ApIHtcblx0XHQvLyBGaW5kIHRoZSBjdXNwIG9mIHRoZSBnYW11dCB0cmlhbmdsZVxuXHRcdGN1c3AgPSBmaW5kX2N1c3AoYSwgYik7XG5cdH1cblxuXHQvLyBGaW5kIHRoZSBpbnRlcnNlY3Rpb24gZm9yIHVwcGVyIGFuZCBsb3dlciBoYWxmIHNlcHJhdGVseVxuXHRsZXQgdDtcblx0aWYgKChMMSAtIEwwKSAqIGN1c3BbMV0gLSAoY3VzcFswXSAtIEwwKSAqIEMxIDw9IDApIHtcblx0XHQvLyBMb3dlciBoYWxmXG5cblx0XHR0ID0gKGN1c3BbMV0gKiBMMCkgLyAoQzEgKiBjdXNwWzBdICsgY3VzcFsxXSAqIChMMCAtIEwxKSk7XG5cdH0gZWxzZSB7XG5cdFx0Ly8gVXBwZXIgaGFsZlxuXG5cdFx0Ly8gRmlyc3QgaW50ZXJzZWN0IHdpdGggdHJpYW5nbGVcblx0XHR0ID0gKGN1c3BbMV0gKiAoTDAgLSAxKSkgLyAoQzEgKiAoY3VzcFswXSAtIDEpICsgY3VzcFsxXSAqIChMMCAtIEwxKSk7XG5cblx0XHQvLyBUaGVuIG9uZSBzdGVwIEhhbGxleSdzIG1ldGhvZFxuXHRcdHtcblx0XHRcdGxldCBkTCA9IEwxIC0gTDA7XG5cdFx0XHRsZXQgZEMgPSBDMTtcblxuXHRcdFx0bGV0IGtfbCA9ICswLjM5NjMzNzc3NzQgKiBhICsgMC4yMTU4MDM3NTczICogYjtcblx0XHRcdGxldCBrX20gPSAtMC4xMDU1NjEzNDU4ICogYSAtIDAuMDYzODU0MTcyOCAqIGI7XG5cdFx0XHRsZXQga19zID0gLTAuMDg5NDg0MTc3NSAqIGEgLSAxLjI5MTQ4NTU0OCAqIGI7XG5cblx0XHRcdGxldCBsX2R0ID0gZEwgKyBkQyAqIGtfbDtcblx0XHRcdGxldCBtX2R0ID0gZEwgKyBkQyAqIGtfbTtcblx0XHRcdGxldCBzX2R0ID0gZEwgKyBkQyAqIGtfcztcblxuXHRcdFx0Ly8gSWYgaGlnaGVyIGFjY3VyYWN5IGlzIHJlcXVpcmVkLCAyIG9yIDMgaXRlcmF0aW9ucyBvZiB0aGUgZm9sbG93aW5nIGJsb2NrIGNhbiBiZSB1c2VkOlxuXHRcdFx0e1xuXHRcdFx0XHRsZXQgTCA9IEwwICogKDEgLSB0KSArIHQgKiBMMTtcblx0XHRcdFx0bGV0IEMgPSB0ICogQzE7XG5cblx0XHRcdFx0bGV0IGxfID0gTCArIEMgKiBrX2w7XG5cdFx0XHRcdGxldCBtXyA9IEwgKyBDICoga19tO1xuXHRcdFx0XHRsZXQgc18gPSBMICsgQyAqIGtfcztcblxuXHRcdFx0XHRsZXQgbCA9IGxfICogbF8gKiBsXztcblx0XHRcdFx0bGV0IG0gPSBtXyAqIG1fICogbV87XG5cdFx0XHRcdGxldCBzID0gc18gKiBzXyAqIHNfO1xuXG5cdFx0XHRcdGxldCBsZHQgPSAzICogbF9kdCAqIGxfICogbF87XG5cdFx0XHRcdGxldCBtZHQgPSAzICogbV9kdCAqIG1fICogbV87XG5cdFx0XHRcdGxldCBzZHQgPSAzICogc19kdCAqIHNfICogc187XG5cblx0XHRcdFx0bGV0IGxkdDIgPSA2ICogbF9kdCAqIGxfZHQgKiBsXztcblx0XHRcdFx0bGV0IG1kdDIgPSA2ICogbV9kdCAqIG1fZHQgKiBtXztcblx0XHRcdFx0bGV0IHNkdDIgPSA2ICogc19kdCAqIHNfZHQgKiBzXztcblxuXHRcdFx0XHRsZXQgciA9XG5cdFx0XHRcdFx0NC4wNzY3NDE2NjIxICogbCAtIDMuMzA3NzExNTkxMyAqIG0gKyAwLjIzMDk2OTkyOTIgKiBzIC0gMTtcblx0XHRcdFx0bGV0IHIxID1cblx0XHRcdFx0XHQ0LjA3Njc0MTY2MjEgKiBsZHQgLVxuXHRcdFx0XHRcdDMuMzA3NzExNTkxMyAqIG1kdCArXG5cdFx0XHRcdFx0MC4yMzA5Njk5MjkyICogc2R0O1xuXHRcdFx0XHRsZXQgcjIgPVxuXHRcdFx0XHRcdDQuMDc2NzQxNjYyMSAqIGxkdDIgLVxuXHRcdFx0XHRcdDMuMzA3NzExNTkxMyAqIG1kdDIgK1xuXHRcdFx0XHRcdDAuMjMwOTY5OTI5MiAqIHNkdDI7XG5cblx0XHRcdFx0bGV0IHVfciA9IHIxIC8gKHIxICogcjEgLSAwLjUgKiByICogcjIpO1xuXHRcdFx0XHRsZXQgdF9yID0gLXIgKiB1X3I7XG5cblx0XHRcdFx0bGV0IGcgPVxuXHRcdFx0XHRcdC0xLjI2ODQzODAwNDYgKiBsICsgMi42MDk3NTc0MDExICogbSAtIDAuMzQxMzE5Mzk2NSAqIHMgLSAxO1xuXHRcdFx0XHRsZXQgZzEgPVxuXHRcdFx0XHRcdC0xLjI2ODQzODAwNDYgKiBsZHQgK1xuXHRcdFx0XHRcdDIuNjA5NzU3NDAxMSAqIG1kdCAtXG5cdFx0XHRcdFx0MC4zNDEzMTkzOTY1ICogc2R0O1xuXHRcdFx0XHRsZXQgZzIgPVxuXHRcdFx0XHRcdC0xLjI2ODQzODAwNDYgKiBsZHQyICtcblx0XHRcdFx0XHQyLjYwOTc1NzQwMTEgKiBtZHQyIC1cblx0XHRcdFx0XHQwLjM0MTMxOTM5NjUgKiBzZHQyO1xuXG5cdFx0XHRcdGxldCB1X2cgPSBnMSAvIChnMSAqIGcxIC0gMC41ICogZyAqIGcyKTtcblx0XHRcdFx0bGV0IHRfZyA9IC1nICogdV9nO1xuXG5cdFx0XHRcdGxldCBiID1cblx0XHRcdFx0XHQtMC4wMDQxOTYwODYzICogbCAtIDAuNzAzNDE4NjE0NyAqIG0gKyAxLjcwNzYxNDcwMSAqIHMgLSAxO1xuXHRcdFx0XHRsZXQgYjEgPVxuXHRcdFx0XHRcdC0wLjAwNDE5NjA4NjMgKiBsZHQgLVxuXHRcdFx0XHRcdDAuNzAzNDE4NjE0NyAqIG1kdCArXG5cdFx0XHRcdFx0MS43MDc2MTQ3MDEgKiBzZHQ7XG5cdFx0XHRcdGxldCBiMiA9XG5cdFx0XHRcdFx0LTAuMDA0MTk2MDg2MyAqIGxkdDIgLVxuXHRcdFx0XHRcdDAuNzAzNDE4NjE0NyAqIG1kdDIgK1xuXHRcdFx0XHRcdDEuNzA3NjE0NzAxICogc2R0MjtcblxuXHRcdFx0XHRsZXQgdV9iID0gYjEgLyAoYjEgKiBiMSAtIDAuNSAqIGIgKiBiMik7XG5cdFx0XHRcdGxldCB0X2IgPSAtYiAqIHVfYjtcblxuXHRcdFx0XHR0X3IgPSB1X3IgPj0gMCA/IHRfciA6IDEwZTU7XG5cdFx0XHRcdHRfZyA9IHVfZyA+PSAwID8gdF9nIDogMTBlNTtcblx0XHRcdFx0dF9iID0gdV9iID49IDAgPyB0X2IgOiAxMGU1O1xuXG5cdFx0XHRcdHQgKz0gTWF0aC5taW4odF9yLCBNYXRoLm1pbih0X2csIHRfYikpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHJldHVybiB0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0X1NUX21heChhXywgYl8sIGN1c3AgPSBudWxsKSB7XG5cdGlmICghY3VzcCkge1xuXHRcdGN1c3AgPSBmaW5kX2N1c3AoYV8sIGJfKTtcblx0fVxuXHRsZXQgTCA9IGN1c3BbMF07XG5cdGxldCBDID0gY3VzcFsxXTtcblx0cmV0dXJuIFtDIC8gTCwgQyAvICgxIC0gTCldO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0X1NUX21pZChhXywgYl8pIHtcblx0bGV0IFMgPVxuXHRcdDAuMTE1MTY5OTMgK1xuXHRcdDEgL1xuXHRcdFx0KCs3LjQ0Nzc4OTcgK1xuXHRcdFx0XHQ0LjE1OTAxMjQgKiBiXyArXG5cdFx0XHRcdGFfICpcblx0XHRcdFx0XHQoLTIuMTk1NTczNDcgK1xuXHRcdFx0XHRcdFx0MS43NTE5ODQwMSAqIGJfICtcblx0XHRcdFx0XHRcdGFfICpcblx0XHRcdFx0XHRcdFx0KC0yLjEzNzA0OTQ4IC1cblx0XHRcdFx0XHRcdFx0XHQxMC4wMjMwMTA0MyAqIGJfICtcblx0XHRcdFx0XHRcdFx0XHRhXyAqXG5cdFx0XHRcdFx0XHRcdFx0XHQoLTQuMjQ4OTQ1NjEgK1xuXHRcdFx0XHRcdFx0XHRcdFx0XHQ1LjM4NzcwODE5ICogYl8gK1xuXHRcdFx0XHRcdFx0XHRcdFx0XHQ0LjY5ODkxMDEzICogYV8pKSkpO1xuXG5cdGxldCBUID1cblx0XHQwLjExMjM5NjQyICtcblx0XHQxIC9cblx0XHRcdCgrMS42MTMyMDMyIC1cblx0XHRcdFx0MC42ODEyNDM3OSAqIGJfICtcblx0XHRcdFx0YV8gKlxuXHRcdFx0XHRcdCgrMC40MDM3MDYxMiArXG5cdFx0XHRcdFx0XHQwLjkwMTQ4MTIzICogYl8gK1xuXHRcdFx0XHRcdFx0YV8gKlxuXHRcdFx0XHRcdFx0XHQoLTAuMjcwODc5NDMgK1xuXHRcdFx0XHRcdFx0XHRcdDAuNjEyMjM5OSAqIGJfICtcblx0XHRcdFx0XHRcdFx0XHRhXyAqXG5cdFx0XHRcdFx0XHRcdFx0XHQoKzAuMDAyOTkyMTUgLVxuXHRcdFx0XHRcdFx0XHRcdFx0XHQwLjQ1Mzk5NTY4ICogYl8gLVxuXHRcdFx0XHRcdFx0XHRcdFx0XHQwLjE0NjYxODcyICogYV8pKSkpO1xuXG5cdHJldHVybiBbUywgVF07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRfQ3MoTCwgYV8sIGJfKSB7XG5cdGxldCBjdXNwID0gZmluZF9jdXNwKGFfLCBiXyk7XG5cblx0bGV0IENfbWF4ID0gZmluZF9nYW11dF9pbnRlcnNlY3Rpb24oYV8sIGJfLCBMLCAxLCBMLCBjdXNwKTtcblx0bGV0IFNUX21heCA9IGdldF9TVF9tYXgoYV8sIGJfLCBjdXNwKTtcblxuXHRsZXQgU19taWQgPVxuXHRcdDAuMTE1MTY5OTMgK1xuXHRcdDEgL1xuXHRcdFx0KCs3LjQ0Nzc4OTcgK1xuXHRcdFx0XHQ0LjE1OTAxMjQgKiBiXyArXG5cdFx0XHRcdGFfICpcblx0XHRcdFx0XHQoLTIuMTk1NTczNDcgK1xuXHRcdFx0XHRcdFx0MS43NTE5ODQwMSAqIGJfICtcblx0XHRcdFx0XHRcdGFfICpcblx0XHRcdFx0XHRcdFx0KC0yLjEzNzA0OTQ4IC1cblx0XHRcdFx0XHRcdFx0XHQxMC4wMjMwMTA0MyAqIGJfICtcblx0XHRcdFx0XHRcdFx0XHRhXyAqXG5cdFx0XHRcdFx0XHRcdFx0XHQoLTQuMjQ4OTQ1NjEgK1xuXHRcdFx0XHRcdFx0XHRcdFx0XHQ1LjM4NzcwODE5ICogYl8gK1xuXHRcdFx0XHRcdFx0XHRcdFx0XHQ0LjY5ODkxMDEzICogYV8pKSkpO1xuXG5cdGxldCBUX21pZCA9XG5cdFx0MC4xMTIzOTY0MiArXG5cdFx0MSAvXG5cdFx0XHQoKzEuNjEzMjAzMiAtXG5cdFx0XHRcdDAuNjgxMjQzNzkgKiBiXyArXG5cdFx0XHRcdGFfICpcblx0XHRcdFx0XHQoKzAuNDAzNzA2MTIgK1xuXHRcdFx0XHRcdFx0MC45MDE0ODEyMyAqIGJfICtcblx0XHRcdFx0XHRcdGFfICpcblx0XHRcdFx0XHRcdFx0KC0wLjI3MDg3OTQzICtcblx0XHRcdFx0XHRcdFx0XHQwLjYxMjIzOTkgKiBiXyArXG5cdFx0XHRcdFx0XHRcdFx0YV8gKlxuXHRcdFx0XHRcdFx0XHRcdFx0KCswLjAwMjk5MjE1IC1cblx0XHRcdFx0XHRcdFx0XHRcdFx0MC40NTM5OTU2OCAqIGJfIC1cblx0XHRcdFx0XHRcdFx0XHRcdFx0MC4xNDY2MTg3MiAqIGFfKSkpKTtcblxuXHRsZXQgayA9IENfbWF4IC8gTWF0aC5taW4oTCAqIFNUX21heFswXSwgKDEgLSBMKSAqIFNUX21heFsxXSk7XG5cblx0bGV0IENfYSA9IEwgKiBTX21pZDtcblx0bGV0IENfYiA9ICgxIC0gTCkgKiBUX21pZDtcblx0bGV0IENfbWlkID1cblx0XHQwLjkgKlxuXHRcdGsgKlxuXHRcdE1hdGguc3FydChcblx0XHRcdE1hdGguc3FydChcblx0XHRcdFx0MSAvICgxIC8gKENfYSAqIENfYSAqIENfYSAqIENfYSkgKyAxIC8gKENfYiAqIENfYiAqIENfYiAqIENfYikpXG5cdFx0XHQpXG5cdFx0KTtcblxuXHRDX2EgPSBMICogMC40O1xuXHRDX2IgPSAoMSAtIEwpICogMC44O1xuXHRsZXQgQ18wID0gTWF0aC5zcXJ0KDEgLyAoMSAvIChDX2EgKiBDX2EpICsgMSAvIChDX2IgKiBDX2IpKSk7XG5cdHJldHVybiBbQ18wLCBDX21pZCwgQ19tYXhdO1xufVxuIiwgIi8qXG5cdEFkYXB0ZWQgZnJvbSBjb2RlIGJ5IEJqXHUwMEY2cm4gT3R0b3Nzb24sXG5cdHJlbGVhc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZTpcblxuXHRDb3B5cmlnaHQgKGMpIDIwMjEgQmpcdTAwRjZybiBPdHRvc3NvblxuXG5cdFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHkgb2Zcblx0dGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpblxuXHR0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvXG5cdHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzXG5cdG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkb1xuXHRzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG5cblx0VGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW4gYWxsXG5cdGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG5cblx0VEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuXHRJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcblx0RklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG5cdEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcblx0TElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcblx0T1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEVcblx0U09GVFdBUkUuXG4gKi9cblxuaW1wb3J0IG5vcm1hbGl6ZUh1ZSBmcm9tICcuLi91dGlsL25vcm1hbGl6ZUh1ZS5qcyc7XG5pbXBvcnQgeyBnZXRfQ3MsIHRvZSB9IGZyb20gJy4vaGVscGVycy5qcyc7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGNvbnZlcnRPa2xhYlRvT2toc2wobGFiKSB7XG5cdGNvbnN0IGwgPSBsYWIubCAhPT0gdW5kZWZpbmVkID8gbGFiLmwgOiAwO1xuXHRjb25zdCBhID0gbGFiLmEgIT09IHVuZGVmaW5lZCA/IGxhYi5hIDogMDtcblx0Y29uc3QgYiA9IGxhYi5iICE9PSB1bmRlZmluZWQgPyBsYWIuYiA6IDA7XG5cblx0Y29uc3QgcmV0ID0geyBtb2RlOiAnb2toc2wnLCBsOiB0b2UobCkgfTtcblxuXHRpZiAobGFiLmFscGhhICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXQuYWxwaGEgPSBsYWIuYWxwaGE7XG5cdH1cblx0bGV0IGMgPSBNYXRoLnNxcnQoYSAqIGEgKyBiICogYik7XG5cdGlmICghYykge1xuXHRcdHJldC5zID0gMDtcblx0XHRyZXR1cm4gcmV0O1xuXHR9XG5cdGxldCBbQ18wLCBDX21pZCwgQ19tYXhdID0gZ2V0X0NzKGwsIGEgLyBjLCBiIC8gYyk7XG5cdGxldCBzO1xuXHRpZiAoYyA8IENfbWlkKSB7XG5cdFx0bGV0IGtfMCA9IDA7XG5cdFx0bGV0IGtfMSA9IDAuOCAqIENfMDtcblx0XHRsZXQga18yID0gMSAtIGtfMSAvIENfbWlkO1xuXHRcdGxldCB0ID0gKGMgLSBrXzApIC8gKGtfMSArIGtfMiAqIChjIC0ga18wKSk7XG5cdFx0cyA9IHQgKiAwLjg7XG5cdH0gZWxzZSB7XG5cdFx0bGV0IGtfMCA9IENfbWlkO1xuXHRcdGxldCBrXzEgPSAoMC4yICogQ19taWQgKiBDX21pZCAqIDEuMjUgKiAxLjI1KSAvIENfMDtcblx0XHRsZXQga18yID0gMSAtIGtfMSAvIChDX21heCAtIENfbWlkKTtcblx0XHRsZXQgdCA9IChjIC0ga18wKSAvIChrXzEgKyBrXzIgKiAoYyAtIGtfMCkpO1xuXHRcdHMgPSAwLjggKyAwLjIgKiB0O1xuXHR9XG5cdGlmIChzKSB7XG5cdFx0cmV0LnMgPSBzO1xuXHRcdHJldC5oID0gbm9ybWFsaXplSHVlKChNYXRoLmF0YW4yKGIsIGEpICogMTgwKSAvIE1hdGguUEkpO1xuXHR9XG5cdHJldHVybiByZXQ7XG59XG4iLCAiLypcblx0QWRhcHRlZCBmcm9tIGNvZGUgYnkgQmpcdTAwRjZybiBPdHRvc3Nvbixcblx0cmVsZWFzZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlOlxuXG5cdENvcHlyaWdodCAoYykgMjAyMSBCalx1MDBGNnJuIE90dG9zc29uXG5cblx0UGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weSBvZlxuXHR0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluXG5cdHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG9cblx0dXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXNcblx0b2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvXG5cdHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcblxuXHRUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpbiBhbGxcblx0Y29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cblxuXHRUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG5cdElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuXHRGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcblx0QVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuXHRMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuXHRPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRVxuXHRTT0ZUV0FSRS5cbiAqL1xuXG5pbXBvcnQgeyB0b2VfaW52LCBnZXRfQ3MgfSBmcm9tICcuL2hlbHBlcnMuanMnO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBjb252ZXJ0T2toc2xUb09rbGFiKGhzbCkge1xuXHRsZXQgaCA9IGhzbC5oICE9PSB1bmRlZmluZWQgPyBoc2wuaCA6IDA7XG5cdGxldCBzID0gaHNsLnMgIT09IHVuZGVmaW5lZCA/IGhzbC5zIDogMDtcblx0bGV0IGwgPSBoc2wubCAhPT0gdW5kZWZpbmVkID8gaHNsLmwgOiAwO1xuXG5cdGNvbnN0IHJldCA9IHsgbW9kZTogJ29rbGFiJywgbDogdG9lX2ludihsKSB9O1xuXG5cdGlmIChoc2wuYWxwaGEgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldC5hbHBoYSA9IGhzbC5hbHBoYTtcblx0fVxuXG5cdGlmICghcyB8fCBsID09PSAxKSB7XG5cdFx0cmV0LmEgPSByZXQuYiA9IDA7XG5cdFx0cmV0dXJuIHJldDtcblx0fVxuXG5cdGxldCBhXyA9IE1hdGguY29zKChoIC8gMTgwKSAqIE1hdGguUEkpO1xuXHRsZXQgYl8gPSBNYXRoLnNpbigoaCAvIDE4MCkgKiBNYXRoLlBJKTtcblx0bGV0IFtDXzAsIENfbWlkLCBDX21heF0gPSBnZXRfQ3MocmV0LmwsIGFfLCBiXyk7XG5cdGxldCB0LCBrXzAsIGtfMSwga18yO1xuXHRpZiAocyA8IDAuOCkge1xuXHRcdHQgPSAxLjI1ICogcztcblx0XHRrXzAgPSAwO1xuXHRcdGtfMSA9IDAuOCAqIENfMDtcblx0XHRrXzIgPSAxIC0ga18xIC8gQ19taWQ7XG5cdH0gZWxzZSB7XG5cdFx0dCA9IDUgKiAocyAtIDAuOCk7XG5cdFx0a18wID0gQ19taWQ7XG5cdFx0a18xID0gKDAuMiAqIENfbWlkICogQ19taWQgKiAxLjI1ICogMS4yNSkgLyBDXzA7XG5cdFx0a18yID0gMSAtIGtfMSAvIChDX21heCAtIENfbWlkKTtcblx0fVxuXHRsZXQgQyA9IGtfMCArICh0ICoga18xKSAvICgxIC0ga18yICogdCk7XG5cdHJldC5hID0gQyAqIGFfO1xuXHRyZXQuYiA9IEMgKiBiXztcblxuXHRyZXR1cm4gcmV0O1xufVxuIiwgImltcG9ydCBjb252ZXJ0UmdiVG9Pa2xhYiBmcm9tICcuLi9va2xhYi9jb252ZXJ0UmdiVG9Pa2xhYi5qcyc7XG5pbXBvcnQgY29udmVydE9rbGFiVG9SZ2IgZnJvbSAnLi4vb2tsYWIvY29udmVydE9rbGFiVG9SZ2IuanMnO1xuaW1wb3J0IGNvbnZlcnRPa2xhYlRvT2toc2wgZnJvbSAnLi9jb252ZXJ0T2tsYWJUb09raHNsLmpzJztcbmltcG9ydCBjb252ZXJ0T2toc2xUb09rbGFiIGZyb20gJy4vY29udmVydE9raHNsVG9Pa2xhYi5qcyc7XG5cbmltcG9ydCBtb2RlSHNsIGZyb20gJy4uL2hzbC9kZWZpbml0aW9uLmpzJztcblxuY29uc3QgbW9kZU9raHNsID0ge1xuXHQuLi5tb2RlSHNsLFxuXHRtb2RlOiAnb2toc2wnLFxuXHRjaGFubmVsczogWydoJywgJ3MnLCAnbCcsICdhbHBoYSddLFxuXHRwYXJzZTogWyctLW9raHNsJ10sXG5cdHNlcmlhbGl6ZTogJy0tb2toc2wnLFxuXHRmcm9tTW9kZToge1xuXHRcdG9rbGFiOiBjb252ZXJ0T2tsYWJUb09raHNsLFxuXHRcdHJnYjogYyA9PiBjb252ZXJ0T2tsYWJUb09raHNsKGNvbnZlcnRSZ2JUb09rbGFiKGMpKVxuXHR9LFxuXHR0b01vZGU6IHtcblx0XHRva2xhYjogY29udmVydE9raHNsVG9Pa2xhYixcblx0XHRyZ2I6IGMgPT4gY29udmVydE9rbGFiVG9SZ2IoY29udmVydE9raHNsVG9Pa2xhYihjKSlcblx0fVxufTtcblxuZXhwb3J0IGRlZmF1bHQgbW9kZU9raHNsO1xuIiwgIi8qXG5cdEFkYXB0ZWQgZnJvbSBjb2RlIGJ5IEJqXHUwMEY2cm4gT3R0b3Nzb24sXG5cdHJlbGVhc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZTpcblxuXHRDb3B5cmlnaHQgKGMpIDIwMjEgQmpcdTAwRjZybiBPdHRvc3NvblxuXG5cdFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHkgb2Zcblx0dGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpblxuXHR0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvXG5cdHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzXG5cdG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkb1xuXHRzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG5cblx0VGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW4gYWxsXG5cdGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG5cblx0VEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuXHRJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcblx0RklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG5cdEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcblx0TElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcblx0T1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEVcblx0U09GVFdBUkUuXG4gKi9cblxuaW1wb3J0IG5vcm1hbGl6ZUh1ZSBmcm9tICcuLi91dGlsL25vcm1hbGl6ZUh1ZS5qcyc7XG5pbXBvcnQgY29udmVydE9rbGFiVG9McmdiIGZyb20gJy4uL29rbGFiL2NvbnZlcnRPa2xhYlRvTHJnYi5qcyc7XG5pbXBvcnQgeyBnZXRfU1RfbWF4LCB0b2VfaW52LCB0b2UgfSBmcm9tICcuLi9va2hzbC9oZWxwZXJzLmpzJztcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gY29udmVydE9rbGFiVG9Pa2hzdihsYWIpIHtcblx0bGV0IGwgPSBsYWIubCAhPT0gdW5kZWZpbmVkID8gbGFiLmwgOiAwO1xuXHRsZXQgYSA9IGxhYi5hICE9PSB1bmRlZmluZWQgPyBsYWIuYSA6IDA7XG5cdGxldCBiID0gbGFiLmIgIT09IHVuZGVmaW5lZCA/IGxhYi5iIDogMDtcblxuXHRsZXQgYyA9IE1hdGguc3FydChhICogYSArIGIgKiBiKTtcblxuXHQvLyBUT0RPOiBjID0gMFxuXHRsZXQgYV8gPSBjID8gYSAvIGMgOiAxO1xuXHRsZXQgYl8gPSBjID8gYiAvIGMgOiAxO1xuXG5cdGxldCBbU19tYXgsIFRdID0gZ2V0X1NUX21heChhXywgYl8pO1xuXHRsZXQgU18wID0gMC41O1xuXHRsZXQgayA9IDEgLSBTXzAgLyBTX21heDtcblxuXHRsZXQgdCA9IFQgLyAoYyArIGwgKiBUKTtcblx0bGV0IExfdiA9IHQgKiBsO1xuXHRsZXQgQ192ID0gdCAqIGM7XG5cblx0bGV0IExfdnQgPSB0b2VfaW52KExfdik7XG5cdGxldCBDX3Z0ID0gKENfdiAqIExfdnQpIC8gTF92O1xuXG5cdGxldCByZ2Jfc2NhbGUgPSBjb252ZXJ0T2tsYWJUb0xyZ2IoeyBsOiBMX3Z0LCBhOiBhXyAqIENfdnQsIGI6IGJfICogQ192dCB9KTtcblx0bGV0IHNjYWxlX0wgPSBNYXRoLmNicnQoXG5cdFx0MSAvIE1hdGgubWF4KHJnYl9zY2FsZS5yLCByZ2Jfc2NhbGUuZywgcmdiX3NjYWxlLmIsIDApXG5cdCk7XG5cblx0bCA9IGwgLyBzY2FsZV9MO1xuXHRjID0gKChjIC8gc2NhbGVfTCkgKiB0b2UobCkpIC8gbDtcblx0bCA9IHRvZShsKTtcblxuXHRjb25zdCByZXQgPSB7XG5cdFx0bW9kZTogJ29raHN2Jyxcblx0XHRzOiBjID8gKChTXzAgKyBUKSAqIENfdikgLyAoVCAqIFNfMCArIFQgKiBrICogQ192KSA6IDAsXG5cdFx0djogbCA/IGwgLyBMX3YgOiAwXG5cdH07XG5cdGlmIChyZXQucykge1xuXHRcdHJldC5oID0gbm9ybWFsaXplSHVlKChNYXRoLmF0YW4yKGIsIGEpICogMTgwKSAvIE1hdGguUEkpO1xuXHR9XG5cdGlmIChsYWIuYWxwaGEgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldC5hbHBoYSA9IGxhYi5hbHBoYTtcblx0fVxuXHRyZXR1cm4gcmV0O1xufVxuIiwgIi8qXG5cdENvcHlyaWdodCAoYykgMjAyMSBCalx1MDBGNnJuIE90dG9zc29uXG5cblx0UGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weSBvZlxuXHR0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluXG5cdHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG9cblx0dXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXNcblx0b2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvXG5cdHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcblxuXHRUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpbiBhbGxcblx0Y29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cblxuXHRUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG5cdElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuXHRGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcblx0QVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuXHRMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuXHRPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRVxuXHRTT0ZUV0FSRS5cbiAqL1xuXG5pbXBvcnQgY29udmVydE9rbGFiVG9McmdiIGZyb20gJy4uL29rbGFiL2NvbnZlcnRPa2xhYlRvTHJnYi5qcyc7XG5pbXBvcnQgeyBnZXRfU1RfbWF4LCB0b2VfaW52IH0gZnJvbSAnLi4vb2toc2wvaGVscGVycy5qcyc7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGNvbnZlcnRPa2hzdlRvT2tsYWIoaHN2KSB7XG5cdGNvbnN0IHJldCA9IHsgbW9kZTogJ29rbGFiJyB9O1xuXHRpZiAoaHN2LmFscGhhICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXQuYWxwaGEgPSBoc3YuYWxwaGE7XG5cdH1cblxuXHRjb25zdCBoID0gaHN2LmggIT09IHVuZGVmaW5lZCA/IGhzdi5oIDogMDtcblx0Y29uc3QgcyA9IGhzdi5zICE9PSB1bmRlZmluZWQgPyBoc3YucyA6IDA7XG5cdGNvbnN0IHYgPSBoc3YudiAhPT0gdW5kZWZpbmVkID8gaHN2LnYgOiAwO1xuXG5cdGNvbnN0IGFfID0gTWF0aC5jb3MoKGggLyAxODApICogTWF0aC5QSSk7XG5cdGNvbnN0IGJfID0gTWF0aC5zaW4oKGggLyAxODApICogTWF0aC5QSSk7XG5cblx0Y29uc3QgW1NfbWF4LCBUXSA9IGdldF9TVF9tYXgoYV8sIGJfKTtcblx0Y29uc3QgU18wID0gMC41O1xuXHRjb25zdCBrID0gMSAtIFNfMCAvIFNfbWF4O1xuXHRjb25zdCBMX3YgPSAxIC0gKHMgKiBTXzApIC8gKFNfMCArIFQgLSBUICogayAqIHMpO1xuXHRjb25zdCBDX3YgPSAocyAqIFQgKiBTXzApIC8gKFNfMCArIFQgLSBUICogayAqIHMpO1xuXG5cdGNvbnN0IExfdnQgPSB0b2VfaW52KExfdik7XG5cdGNvbnN0IENfdnQgPSAoQ192ICogTF92dCkgLyBMX3Y7XG5cdGNvbnN0IHJnYl9zY2FsZSA9IGNvbnZlcnRPa2xhYlRvTHJnYih7XG5cdFx0bDogTF92dCxcblx0XHRhOiBhXyAqIENfdnQsXG5cdFx0YjogYl8gKiBDX3Z0XG5cdH0pO1xuXHRjb25zdCBzY2FsZV9MID0gTWF0aC5jYnJ0KFxuXHRcdDEgLyBNYXRoLm1heChyZ2Jfc2NhbGUuciwgcmdiX3NjYWxlLmcsIHJnYl9zY2FsZS5iLCAwKVxuXHQpO1xuXG5cdGNvbnN0IExfbmV3ID0gdG9lX2ludih2ICogTF92KTtcblx0Y29uc3QgQyA9IChDX3YgKiBMX25ldykgLyBMX3Y7XG5cblx0cmV0LmwgPSBMX25ldyAqIHNjYWxlX0w7XG5cdHJldC5hID0gQyAqIGFfICogc2NhbGVfTDtcblx0cmV0LmIgPSBDICogYl8gKiBzY2FsZV9MO1xuXG5cdHJldHVybiByZXQ7XG59XG4iLCAiaW1wb3J0IGNvbnZlcnRSZ2JUb09rbGFiIGZyb20gJy4uL29rbGFiL2NvbnZlcnRSZ2JUb09rbGFiLmpzJztcbmltcG9ydCBjb252ZXJ0T2tsYWJUb1JnYiBmcm9tICcuLi9va2xhYi9jb252ZXJ0T2tsYWJUb1JnYi5qcyc7XG5pbXBvcnQgY29udmVydE9rbGFiVG9Pa2hzdiBmcm9tICcuL2NvbnZlcnRPa2xhYlRvT2toc3YuanMnO1xuaW1wb3J0IGNvbnZlcnRPa2hzdlRvT2tsYWIgZnJvbSAnLi9jb252ZXJ0T2toc3ZUb09rbGFiLmpzJztcblxuaW1wb3J0IG1vZGVIc3YgZnJvbSAnLi4vaHN2L2RlZmluaXRpb24uanMnO1xuXG5jb25zdCBtb2RlT2toc3YgPSB7XG5cdC4uLm1vZGVIc3YsXG5cdG1vZGU6ICdva2hzdicsXG5cdGNoYW5uZWxzOiBbJ2gnLCAncycsICd2JywgJ2FscGhhJ10sXG5cdHBhcnNlOiBbJy0tb2toc3YnXSxcblx0c2VyaWFsaXplOiAnLS1va2hzdicsXG5cdGZyb21Nb2RlOiB7XG5cdFx0b2tsYWI6IGNvbnZlcnRPa2xhYlRvT2toc3YsXG5cdFx0cmdiOiBjID0+IGNvbnZlcnRPa2xhYlRvT2toc3YoY29udmVydFJnYlRvT2tsYWIoYykpXG5cdH0sXG5cdHRvTW9kZToge1xuXHRcdG9rbGFiOiBjb252ZXJ0T2toc3ZUb09rbGFiLFxuXHRcdHJnYjogYyA9PiBjb252ZXJ0T2tsYWJUb1JnYihjb252ZXJ0T2toc3ZUb09rbGFiKGMpKVxuXHR9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBtb2RlT2toc3Y7XG4iLCAiaW1wb3J0IHsgVG9rIH0gZnJvbSAnLi4vcGFyc2UuanMnO1xuXG5mdW5jdGlvbiBwYXJzZU9rbGFiKGNvbG9yLCBwYXJzZWQpIHtcblx0aWYgKCFwYXJzZWQgfHwgcGFyc2VkWzBdICE9PSAnb2tsYWInKSB7XG5cdFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0fVxuXHRjb25zdCByZXMgPSB7IG1vZGU6ICdva2xhYicgfTtcblx0Y29uc3QgWywgbCwgYSwgYiwgYWxwaGFdID0gcGFyc2VkO1xuXHRpZiAobC50eXBlID09PSBUb2suSHVlIHx8IGEudHlwZSA9PT0gVG9rLkh1ZSB8fCBiLnR5cGUgPT09IFRvay5IdWUpIHtcblx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHR9XG5cdGlmIChsLnR5cGUgIT09IFRvay5Ob25lKSB7XG5cdFx0cmVzLmwgPSBNYXRoLm1pbihcblx0XHRcdE1hdGgubWF4KDAsIGwudHlwZSA9PT0gVG9rLk51bWJlciA/IGwudmFsdWUgOiBsLnZhbHVlIC8gMTAwKSxcblx0XHRcdDFcblx0XHQpO1xuXHR9XG5cdGlmIChhLnR5cGUgIT09IFRvay5Ob25lKSB7XG5cdFx0cmVzLmEgPSBhLnR5cGUgPT09IFRvay5OdW1iZXIgPyBhLnZhbHVlIDogKGEudmFsdWUgKiAwLjQpIC8gMTAwO1xuXHR9XG5cdGlmIChiLnR5cGUgIT09IFRvay5Ob25lKSB7XG5cdFx0cmVzLmIgPSBiLnR5cGUgPT09IFRvay5OdW1iZXIgPyBiLnZhbHVlIDogKGIudmFsdWUgKiAwLjQpIC8gMTAwO1xuXHR9XG5cdGlmIChhbHBoYS50eXBlICE9PSBUb2suTm9uZSkge1xuXHRcdHJlcy5hbHBoYSA9IE1hdGgubWluKFxuXHRcdFx0MSxcblx0XHRcdE1hdGgubWF4KFxuXHRcdFx0XHQwLFxuXHRcdFx0XHRhbHBoYS50eXBlID09PSBUb2suTnVtYmVyID8gYWxwaGEudmFsdWUgOiBhbHBoYS52YWx1ZSAvIDEwMFxuXHRcdFx0KVxuXHRcdCk7XG5cdH1cblxuXHRyZXR1cm4gcmVzO1xufVxuXG5leHBvcnQgZGVmYXVsdCBwYXJzZU9rbGFiO1xuIiwgImltcG9ydCBjb252ZXJ0T2tsYWJUb0xyZ2IgZnJvbSAnLi9jb252ZXJ0T2tsYWJUb0xyZ2IuanMnO1xuaW1wb3J0IGNvbnZlcnRMcmdiVG9Pa2xhYiBmcm9tICcuL2NvbnZlcnRMcmdiVG9Pa2xhYi5qcyc7XG5pbXBvcnQgY29udmVydFJnYlRvT2tsYWIgZnJvbSAnLi9jb252ZXJ0UmdiVG9Pa2xhYi5qcyc7XG5pbXBvcnQgY29udmVydE9rbGFiVG9SZ2IgZnJvbSAnLi9jb252ZXJ0T2tsYWJUb1JnYi5qcyc7XG5pbXBvcnQgcGFyc2VPa2xhYiBmcm9tICcuL3BhcnNlT2tsYWIuanMnO1xuXG5pbXBvcnQgbGFiIGZyb20gJy4uL2xhYi9kZWZpbml0aW9uLmpzJztcblxuLypcblx0T2tsYWIsIGEgcGVyY2VwdHVhbCBjb2xvciBzcGFjZSBmb3IgaW1hZ2UgcHJvY2Vzc2luZyBieSBCalx1MDBGNnJuIE90dG9zc29uXG5cdFJlZmVyZW5jZTogaHR0cHM6Ly9ib3R0b3Nzb24uZ2l0aHViLmlvL3Bvc3RzL29rbGFiL1xuICovXG5cbmNvbnN0IGRlZmluaXRpb24gPSB7XG5cdC4uLmxhYixcblx0bW9kZTogJ29rbGFiJyxcblxuXHR0b01vZGU6IHtcblx0XHRscmdiOiBjb252ZXJ0T2tsYWJUb0xyZ2IsXG5cdFx0cmdiOiBjb252ZXJ0T2tsYWJUb1JnYlxuXHR9LFxuXG5cdGZyb21Nb2RlOiB7XG5cdFx0bHJnYjogY29udmVydExyZ2JUb09rbGFiLFxuXHRcdHJnYjogY29udmVydFJnYlRvT2tsYWJcblx0fSxcblxuXHRyYW5nZXM6IHtcblx0XHRsOiBbMCwgMV0sXG5cdFx0YTogWy0wLjQsIDAuNF0sXG5cdFx0YjogWy0wLjQsIDAuNF1cblx0fSxcblxuXHRwYXJzZTogW3BhcnNlT2tsYWJdLFxuXHRzZXJpYWxpemU6IGMgPT5cblx0XHRgb2tsYWIoJHtjLmwgIT09IHVuZGVmaW5lZCA/IGMubCA6ICdub25lJ30gJHtcblx0XHRcdGMuYSAhPT0gdW5kZWZpbmVkID8gYy5hIDogJ25vbmUnXG5cdFx0fSAke2MuYiAhPT0gdW5kZWZpbmVkID8gYy5iIDogJ25vbmUnfSR7XG5cdFx0XHRjLmFscGhhIDwgMSA/IGAgLyAke2MuYWxwaGF9YCA6ICcnXG5cdFx0fSlgXG59O1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbml0aW9uO1xuIiwgImltcG9ydCB7IFRvayB9IGZyb20gJy4uL3BhcnNlLmpzJztcblxuZnVuY3Rpb24gcGFyc2VPa2xjaChjb2xvciwgcGFyc2VkKSB7XG5cdGlmICghcGFyc2VkIHx8IHBhcnNlZFswXSAhPT0gJ29rbGNoJykge1xuXHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdH1cblx0Y29uc3QgcmVzID0geyBtb2RlOiAnb2tsY2gnIH07XG5cdGNvbnN0IFssIGwsIGMsIGgsIGFscGhhXSA9IHBhcnNlZDtcblx0aWYgKGwudHlwZSAhPT0gVG9rLk5vbmUpIHtcblx0XHRpZiAobC50eXBlID09PSBUb2suSHVlKSB7XG5cdFx0XHRyZXR1cm4gdW5kZWZpbmVkO1xuXHRcdH1cblx0XHRyZXMubCA9IE1hdGgubWluKFxuXHRcdFx0TWF0aC5tYXgoMCwgbC50eXBlID09PSBUb2suTnVtYmVyID8gbC52YWx1ZSA6IGwudmFsdWUgLyAxMDApLFxuXHRcdFx0MVxuXHRcdCk7XG5cdH1cblx0aWYgKGMudHlwZSAhPT0gVG9rLk5vbmUpIHtcblx0XHRyZXMuYyA9IE1hdGgubWF4KFxuXHRcdFx0MCxcblx0XHRcdGMudHlwZSA9PT0gVG9rLk51bWJlciA/IGMudmFsdWUgOiAoYy52YWx1ZSAqIDAuNCkgLyAxMDBcblx0XHQpO1xuXHR9XG5cdGlmIChoLnR5cGUgIT09IFRvay5Ob25lKSB7XG5cdFx0aWYgKGgudHlwZSA9PT0gVG9rLlBlcmNlbnRhZ2UpIHtcblx0XHRcdHJldHVybiB1bmRlZmluZWQ7XG5cdFx0fVxuXHRcdHJlcy5oID0gaC52YWx1ZTtcblx0fVxuXHRpZiAoYWxwaGEudHlwZSAhPT0gVG9rLk5vbmUpIHtcblx0XHRyZXMuYWxwaGEgPSBNYXRoLm1pbihcblx0XHRcdDEsXG5cdFx0XHRNYXRoLm1heChcblx0XHRcdFx0MCxcblx0XHRcdFx0YWxwaGEudHlwZSA9PT0gVG9rLk51bWJlciA/IGFscGhhLnZhbHVlIDogYWxwaGEudmFsdWUgLyAxMDBcblx0XHRcdClcblx0XHQpO1xuXHR9XG5cblx0cmV0dXJuIHJlcztcbn1cblxuZXhwb3J0IGRlZmF1bHQgcGFyc2VPa2xjaDtcbiIsICJpbXBvcnQgbGNoIGZyb20gJy4uL2xjaC9kZWZpbml0aW9uLmpzJztcbmltcG9ydCBjb252ZXJ0TGFiVG9MY2ggZnJvbSAnLi4vbGNoL2NvbnZlcnRMYWJUb0xjaC5qcyc7XG5pbXBvcnQgY29udmVydExjaFRvTGFiIGZyb20gJy4uL2xjaC9jb252ZXJ0TGNoVG9MYWIuanMnO1xuaW1wb3J0IGNvbnZlcnRPa2xhYlRvUmdiIGZyb20gJy4uL29rbGFiL2NvbnZlcnRPa2xhYlRvUmdiLmpzJztcbmltcG9ydCBjb252ZXJ0UmdiVG9Pa2xhYiBmcm9tICcuLi9va2xhYi9jb252ZXJ0UmdiVG9Pa2xhYi5qcyc7XG5pbXBvcnQgcGFyc2VPa2xjaCBmcm9tICcuL3BhcnNlT2tsY2guanMnO1xuXG5jb25zdCBkZWZpbml0aW9uID0ge1xuXHQuLi5sY2gsXG5cdG1vZGU6ICdva2xjaCcsXG5cblx0dG9Nb2RlOiB7XG5cdFx0b2tsYWI6IGMgPT4gY29udmVydExjaFRvTGFiKGMsICdva2xhYicpLFxuXHRcdHJnYjogYyA9PiBjb252ZXJ0T2tsYWJUb1JnYihjb252ZXJ0TGNoVG9MYWIoYywgJ29rbGFiJykpXG5cdH0sXG5cblx0ZnJvbU1vZGU6IHtcblx0XHRyZ2I6IGMgPT4gY29udmVydExhYlRvTGNoKGNvbnZlcnRSZ2JUb09rbGFiKGMpLCAnb2tsY2gnKSxcblx0XHRva2xhYjogYyA9PiBjb252ZXJ0TGFiVG9MY2goYywgJ29rbGNoJylcblx0fSxcblxuXHRwYXJzZTogW3BhcnNlT2tsY2hdLFxuXHRzZXJpYWxpemU6IGMgPT5cblx0XHRgb2tsY2goJHtjLmwgIT09IHVuZGVmaW5lZCA/IGMubCA6ICdub25lJ30gJHtcblx0XHRcdGMuYyAhPT0gdW5kZWZpbmVkID8gYy5jIDogJ25vbmUnXG5cdFx0fSAke2MuaCAhPT0gdW5kZWZpbmVkID8gYy5oIDogJ25vbmUnfSR7XG5cdFx0XHRjLmFscGhhIDwgMSA/IGAgLyAke2MuYWxwaGF9YCA6ICcnXG5cdFx0fSlgLFxuXG5cdHJhbmdlczoge1xuXHRcdGw6IFswLCAxXSxcblx0XHRjOiBbMCwgMC40XSxcblx0XHRoOiBbMCwgMzYwXVxuXHR9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbml0aW9uO1xuIiwgIi8qXG5cdENvbnZlcnQgRGlzcGxheSBQMyB2YWx1ZXMgdG8gQ0lFIFhZWiBENjVcblxuXHRSZWZlcmVuY2VzOlxuXHRcdCogaHR0cHM6Ly9kcmFmdHMuY3Nzd2cub3JnL2Nzcy1jb2xvci8jY29sb3ItY29udmVyc2lvbi1jb2RlXG5cdFx0KiBodHRwOi8vd3d3LmJydWNlbGluZGJsb29tLmNvbS9pbmRleC5odG1sP0Vxbl9SR0JfWFlaX01hdHJpeC5odG1sXG4qL1xuXG5pbXBvcnQgY29udmVydFJnYlRvTHJnYiBmcm9tICcuLi9scmdiL2NvbnZlcnRSZ2JUb0xyZ2IuanMnO1xuXG5jb25zdCBjb252ZXJ0UDNUb1h5ejY1ID0gcmdiID0+IHtcblx0bGV0IHsgciwgZywgYiwgYWxwaGEgfSA9IGNvbnZlcnRSZ2JUb0xyZ2IocmdiKTtcblx0bGV0IHJlcyA9IHtcblx0XHRtb2RlOiAneHl6NjUnLFxuXHRcdHg6XG5cdFx0XHQwLjQ4NjU3MDk0ODY0ODIxNiAqIHIgK1xuXHRcdFx0MC4yNjU2Njc2OTMxNjkwOTMgKiBnICtcblx0XHRcdDAuMTk4MjE3Mjg1MjM0MzYyNSAqIGIsXG5cdFx0eTpcblx0XHRcdDAuMjI4OTc0NTY0MDY5NzQ4NyAqIHIgK1xuXHRcdFx0MC42OTE3Mzg1MjE4MzY1MDYyICogZyArXG5cdFx0XHQwLjA3OTI4NjkxNDA5Mzc0NSAqIGIsXG5cdFx0ejogMC4wICogciArIDAuMDQ1MTEzMzgxODU4OTAyNiAqIGcgKyAxLjA0Mzk0NDM2ODkwMDk3NiAqIGJcblx0fTtcblx0aWYgKGFscGhhICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXMuYWxwaGEgPSBhbHBoYTtcblx0fVxuXHRyZXR1cm4gcmVzO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgY29udmVydFAzVG9YeXo2NTtcbiIsICIvKlxuXHRDSUUgWFlaIEQ2NSB2YWx1ZXMgdG8gRGlzcGxheSBQMy5cblxuXHRSZWZlcmVuY2VzOlxuXHRcdCogaHR0cHM6Ly9kcmFmdHMuY3Nzd2cub3JnL2Nzcy1jb2xvci8jY29sb3ItY29udmVyc2lvbi1jb2RlXG5cdFx0KiBodHRwOi8vd3d3LmJydWNlbGluZGJsb29tLmNvbS9pbmRleC5odG1sP0Vxbl9SR0JfWFlaX01hdHJpeC5odG1sXG4qL1xuXG5pbXBvcnQgY29udmVydExyZ2JUb1JnYiBmcm9tICcuLi9scmdiL2NvbnZlcnRMcmdiVG9SZ2IuanMnO1xuXG5jb25zdCBjb252ZXJ0WHl6NjVUb1AzID0gKHsgeCwgeSwgeiwgYWxwaGEgfSkgPT4ge1xuXHRpZiAoeCA9PT0gdW5kZWZpbmVkKSB4ID0gMDtcblx0aWYgKHkgPT09IHVuZGVmaW5lZCkgeSA9IDA7XG5cdGlmICh6ID09PSB1bmRlZmluZWQpIHogPSAwO1xuXHRsZXQgcmVzID0gY29udmVydExyZ2JUb1JnYihcblx0XHR7XG5cdFx0XHRyOlxuXHRcdFx0XHR4ICogMi40OTM0OTY5MTE5NDE0MjYzIC1cblx0XHRcdFx0eSAqIDAuOTMxMzgzNjE3OTE5MTI0MiAtXG5cdFx0XHRcdDAuNDAyNzEwNzg0NDUwNzE3ICogeixcblx0XHRcdGc6XG5cdFx0XHRcdHggKiAtMC44Mjk0ODg5Njk1NjE1NzQ5ICtcblx0XHRcdFx0eSAqIDEuNzYyNjY0MDYwMzE4MzQ2NSArXG5cdFx0XHRcdDAuMDIzNjI0Njg1ODQxOTQzNiAqIHosXG5cdFx0XHRiOlxuXHRcdFx0XHR4ICogMC4wMzU4NDU4MzAyNDM3ODQ1IC1cblx0XHRcdFx0eSAqIDAuMDc2MTcyMzg5MjY4MDQxOCArXG5cdFx0XHRcdDAuOTU2ODg0NTI0MDA3Njg3MSAqIHpcblx0XHR9LFxuXHRcdCdwMydcblx0KTtcblx0aWYgKGFscGhhICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXMuYWxwaGEgPSBhbHBoYTtcblx0fVxuXHRyZXR1cm4gcmVzO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgY29udmVydFh5ejY1VG9QMztcbiIsICJpbXBvcnQgcmdiIGZyb20gJy4uL3JnYi9kZWZpbml0aW9uLmpzJztcbmltcG9ydCBjb252ZXJ0UDNUb1h5ejY1IGZyb20gJy4vY29udmVydFAzVG9YeXo2NS5qcyc7XG5pbXBvcnQgY29udmVydFh5ejY1VG9QMyBmcm9tICcuL2NvbnZlcnRYeXo2NVRvUDMuanMnO1xuaW1wb3J0IGNvbnZlcnRSZ2JUb1h5ejY1IGZyb20gJy4uL3h5ejY1L2NvbnZlcnRSZ2JUb1h5ejY1LmpzJztcbmltcG9ydCBjb252ZXJ0WHl6NjVUb1JnYiBmcm9tICcuLi94eXo2NS9jb252ZXJ0WHl6NjVUb1JnYi5qcyc7XG5cbmNvbnN0IGRlZmluaXRpb24gPSB7XG5cdC4uLnJnYixcblx0bW9kZTogJ3AzJyxcblx0cGFyc2U6IFsnZGlzcGxheS1wMyddLFxuXHRzZXJpYWxpemU6ICdkaXNwbGF5LXAzJyxcblxuXHRmcm9tTW9kZToge1xuXHRcdHJnYjogY29sb3IgPT4gY29udmVydFh5ejY1VG9QMyhjb252ZXJ0UmdiVG9YeXo2NShjb2xvcikpLFxuXHRcdHh5ejY1OiBjb252ZXJ0WHl6NjVUb1AzXG5cdH0sXG5cblx0dG9Nb2RlOiB7XG5cdFx0cmdiOiBjb2xvciA9PiBjb252ZXJ0WHl6NjVUb1JnYihjb252ZXJ0UDNUb1h5ejY1KGNvbG9yKSksXG5cdFx0eHl6NjU6IGNvbnZlcnRQM1RvWHl6NjVcblx0fVxufTtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5pdGlvbjtcbiIsICIvKlxuXHRDb252ZXJ0IENJRSBYWVogRDUwIHZhbHVlcyB0byBQcm9QaG90byBSR0JcblxuXHRSZWZlcmVuY2VzOlxuXHRcdCogaHR0cHM6Ly9kcmFmdHMuY3Nzd2cub3JnL2Nzcy1jb2xvci8jY29sb3ItY29udmVyc2lvbi1jb2RlXG5cdFx0KiBodHRwOi8vd3d3LmJydWNlbGluZGJsb29tLmNvbS9pbmRleC5odG1sP0Vxbl9SR0JfWFlaX01hdHJpeC5odG1sXG4qL1xuXG5jb25zdCBnYW1tYSA9IHYgPT4ge1xuXHRsZXQgYWJzID0gTWF0aC5hYnModik7XG5cdGlmIChhYnMgPj0gMSAvIDUxMikge1xuXHRcdHJldHVybiBNYXRoLnNpZ24odikgKiBNYXRoLnBvdyhhYnMsIDEgLyAxLjgpO1xuXHR9XG5cdHJldHVybiAxNiAqIHY7XG59O1xuXG5jb25zdCBjb252ZXJ0WHl6NTBUb1Byb3Bob3RvID0gKHsgeCwgeSwgeiwgYWxwaGEgfSkgPT4ge1xuXHRpZiAoeCA9PT0gdW5kZWZpbmVkKSB4ID0gMDtcblx0aWYgKHkgPT09IHVuZGVmaW5lZCkgeSA9IDA7XG5cdGlmICh6ID09PSB1bmRlZmluZWQpIHogPSAwO1xuXHRsZXQgcmVzID0ge1xuXHRcdG1vZGU6ICdwcm9waG90bycsXG5cdFx0cjogZ2FtbWEoXG5cdFx0XHR4ICogMS4zNDU3ODY4ODE2NDcxNTg1IC1cblx0XHRcdFx0eSAqIDAuMjU1NTcyMDg3Mzc5Nzk0NiAtXG5cdFx0XHRcdDAuMDUxMTAxODY0OTc1NTQ1MyAqIHpcblx0XHQpLFxuXHRcdGc6IGdhbW1hKFxuXHRcdFx0eCAqIC0wLjU0NDYzMDcwNTEyNDkwMTkgK1xuXHRcdFx0XHR5ICogMS41MDgyNDc3NDI4NDUxNDY2ICtcblx0XHRcdFx0MC4wMjA1Mjc0NDc0MzY0MjE0ICogelxuXHRcdCksXG5cdFx0YjogZ2FtbWEoeCAqIDAuMCArIHkgKiAwLjAgKyAxLjIxMTk2NzU0NTYzODk0NTIgKiB6KVxuXHR9O1xuXHRpZiAoYWxwaGEgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJlcy5hbHBoYSA9IGFscGhhO1xuXHR9XG5cdHJldHVybiByZXM7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBjb252ZXJ0WHl6NTBUb1Byb3Bob3RvO1xuIiwgIi8qXG5cdENvbnZlcnQgUHJvUGhvdG8gUkdCIHZhbHVlcyB0byBDSUUgWFlaIEQ1MFxuXG5cdFJlZmVyZW5jZXM6XG5cdFx0KiBodHRwczovL2RyYWZ0cy5jc3N3Zy5vcmcvY3NzLWNvbG9yLyNjb2xvci1jb252ZXJzaW9uLWNvZGVcblx0XHQqIGh0dHA6Ly93d3cuYnJ1Y2VsaW5kYmxvb20uY29tL2luZGV4Lmh0bWw/RXFuX1JHQl9YWVpfTWF0cml4Lmh0bWxcbiovXG5cbmNvbnN0IGxpbmVhcml6ZSA9ICh2ID0gMCkgPT4ge1xuXHRsZXQgYWJzID0gTWF0aC5hYnModik7XG5cdGlmIChhYnMgPj0gMTYgLyA1MTIpIHtcblx0XHRyZXR1cm4gTWF0aC5zaWduKHYpICogTWF0aC5wb3coYWJzLCAxLjgpO1xuXHR9XG5cdHJldHVybiB2IC8gMTY7XG59O1xuXG5jb25zdCBjb252ZXJ0UHJvcGhvdG9Ub1h5ejUwID0gcHJvcGhvdG8gPT4ge1xuXHRsZXQgciA9IGxpbmVhcml6ZShwcm9waG90by5yKTtcblx0bGV0IGcgPSBsaW5lYXJpemUocHJvcGhvdG8uZyk7XG5cdGxldCBiID0gbGluZWFyaXplKHByb3Bob3RvLmIpO1xuXHRsZXQgcmVzID0ge1xuXHRcdG1vZGU6ICd4eXo1MCcsXG5cdFx0eDpcblx0XHRcdDAuNzk3NzY2NjQ0OTAwNjQyMyAqIHIgK1xuXHRcdFx0MC4xMzUxODEyOTc0MDA1MzMxICogZyArXG5cdFx0XHQwLjAzMTM0NzczNDEyODM5MjIgKiBiLFxuXHRcdHk6XG5cdFx0XHQwLjI4ODA3NDgyODgxOTQwMTMgKiByICtcblx0XHRcdDAuNzExODM1MjM0MjQxODczMSAqIGcgK1xuXHRcdFx0MC4wMDAwODk5MzY5Mzg3MjU2ICogYixcblx0XHR6OiAwICogciArIDAgKiBnICsgMC44MjUxMDQ2MDI1MTA0NjAyICogYlxuXHR9O1xuXHRpZiAocHJvcGhvdG8uYWxwaGEgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJlcy5hbHBoYSA9IHByb3Bob3RvLmFscGhhO1xuXHR9XG5cdHJldHVybiByZXM7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBjb252ZXJ0UHJvcGhvdG9Ub1h5ejUwO1xuIiwgImltcG9ydCByZ2IgZnJvbSAnLi4vcmdiL2RlZmluaXRpb24uanMnO1xuXG5pbXBvcnQgY29udmVydFh5ejUwVG9Qcm9waG90byBmcm9tICcuL2NvbnZlcnRYeXo1MFRvUHJvcGhvdG8uanMnO1xuaW1wb3J0IGNvbnZlcnRQcm9waG90b1RvWHl6NTAgZnJvbSAnLi9jb252ZXJ0UHJvcGhvdG9Ub1h5ejUwLmpzJztcblxuaW1wb3J0IGNvbnZlcnRYeXo1MFRvUmdiIGZyb20gJy4uL3h5ejUwL2NvbnZlcnRYeXo1MFRvUmdiLmpzJztcbmltcG9ydCBjb252ZXJ0UmdiVG9YeXo1MCBmcm9tICcuLi94eXo1MC9jb252ZXJ0UmdiVG9YeXo1MC5qcyc7XG5cbi8qXG5cdFByb1Bob3RvIFJHQiBDb2xvciBzcGFjZVxuXG5cdFJlZmVyZW5jZXM6XG5cdFx0KiBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9Qcm9QaG90b19SR0JfY29sb3Jfc3BhY2VcbiAqL1xuXG5jb25zdCBkZWZpbml0aW9uID0ge1xuXHQuLi5yZ2IsXG5cdG1vZGU6ICdwcm9waG90bycsXG5cdHBhcnNlOiBbJ3Byb3Bob3RvLXJnYiddLFxuXHRzZXJpYWxpemU6ICdwcm9waG90by1yZ2InLFxuXG5cdGZyb21Nb2RlOiB7XG5cdFx0eHl6NTA6IGNvbnZlcnRYeXo1MFRvUHJvcGhvdG8sXG5cdFx0cmdiOiBjb2xvciA9PiBjb252ZXJ0WHl6NTBUb1Byb3Bob3RvKGNvbnZlcnRSZ2JUb1h5ejUwKGNvbG9yKSlcblx0fSxcblxuXHR0b01vZGU6IHtcblx0XHR4eXo1MDogY29udmVydFByb3Bob3RvVG9YeXo1MCxcblx0XHRyZ2I6IGNvbG9yID0+IGNvbnZlcnRYeXo1MFRvUmdiKGNvbnZlcnRQcm9waG90b1RvWHl6NTAoY29sb3IpKVxuXHR9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbml0aW9uO1xuIiwgIi8qXG5cdENvbnZlcnQgQ0lFIFhZWiBENjUgdmFsdWVzIHRvIFJlYy4gMjAyMFxuXG5cdFJlZmVyZW5jZXM6XG5cdFx0KiBodHRwczovL2RyYWZ0cy5jc3N3Zy5vcmcvY3NzLWNvbG9yLyNjb2xvci1jb252ZXJzaW9uLWNvZGVcblx0XHQqIGh0dHA6Ly93d3cuYnJ1Y2VsaW5kYmxvb20uY29tL2luZGV4Lmh0bWw/RXFuX1JHQl9YWVpfTWF0cml4Lmh0bWxcblx0XHQqIGh0dHBzOi8vd3d3Lml0dS5pbnQvcmVjL1ItUkVDLUJULjIwMjAvZW5cbiovXG5cbmNvbnN0IFx1MDNCMSA9IDEuMDk5Mjk2ODI2ODA5NDQ7XG5jb25zdCBcdTAzQjIgPSAwLjAxODA1Mzk2ODUxMDgwNztcbmNvbnN0IGdhbW1hID0gdiA9PiB7XG5cdGNvbnN0IGFicyA9IE1hdGguYWJzKHYpO1xuXHRpZiAoYWJzID4gXHUwM0IyKSB7XG5cdFx0cmV0dXJuIChNYXRoLnNpZ24odikgfHwgMSkgKiAoXHUwM0IxICogTWF0aC5wb3coYWJzLCAwLjQ1KSAtIChcdTAzQjEgLSAxKSk7XG5cdH1cblx0cmV0dXJuIDQuNSAqIHY7XG59O1xuXG5jb25zdCBjb252ZXJ0WHl6NjVUb1JlYzIwMjAgPSAoeyB4LCB5LCB6LCBhbHBoYSB9KSA9PiB7XG5cdGlmICh4ID09PSB1bmRlZmluZWQpIHggPSAwO1xuXHRpZiAoeSA9PT0gdW5kZWZpbmVkKSB5ID0gMDtcblx0aWYgKHogPT09IHVuZGVmaW5lZCkgeiA9IDA7XG5cdGxldCByZXMgPSB7XG5cdFx0bW9kZTogJ3JlYzIwMjAnLFxuXHRcdHI6IGdhbW1hKFxuXHRcdFx0eCAqIDEuNzE2NjUxMTg3OTcxMjY4MyAtXG5cdFx0XHRcdHkgKiAwLjM1NTY3MDc4Mzc3NjM5MjUgLVxuXHRcdFx0XHQwLjI1MzM2NjI4MTM3MzY1OTkgKiB6XG5cdFx0KSxcblx0XHRnOiBnYW1tYShcblx0XHRcdHggKiAtMC42NjY2ODQzNTE4MzI0ODkzICtcblx0XHRcdFx0eSAqIDEuNjE2NDgxMjM2NjM0OTM5NSArXG5cdFx0XHRcdDAuMDE1NzY4NTQ1ODEzOTExMSAqIHpcblx0XHQpLFxuXHRcdGI6IGdhbW1hKFxuXHRcdFx0eCAqIDAuMDE3NjM5ODU3NDQ1MzEwOCAtXG5cdFx0XHRcdHkgKiAwLjA0Mjc3MDYxMzI1NzgwODUgK1xuXHRcdFx0XHQwLjk0MjEwMzEyMTIzNTQ3MzkgKiB6XG5cdFx0KVxuXHR9O1xuXHRpZiAoYWxwaGEgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJlcy5hbHBoYSA9IGFscGhhO1xuXHR9XG5cdHJldHVybiByZXM7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBjb252ZXJ0WHl6NjVUb1JlYzIwMjA7XG4iLCAiLypcblx0Q29udmVydCBSZWMuIDIwMjAgdmFsdWVzIHRvIENJRSBYWVogRDY1XG5cblx0UmVmZXJlbmNlczpcblx0XHQqIGh0dHBzOi8vZHJhZnRzLmNzc3dnLm9yZy9jc3MtY29sb3IvI2NvbG9yLWNvbnZlcnNpb24tY29kZVxuXHRcdCogaHR0cDovL3d3dy5icnVjZWxpbmRibG9vbS5jb20vaW5kZXguaHRtbD9FcW5fUkdCX1hZWl9NYXRyaXguaHRtbFxuXHRcdCogaHR0cHM6Ly93d3cuaXR1LmludC9yZWMvUi1SRUMtQlQuMjAyMC9lblxuKi9cblxuY29uc3QgXHUwM0IxID0gMS4wOTkyOTY4MjY4MDk0NDtcbmNvbnN0IFx1MDNCMiA9IDAuMDE4MDUzOTY4NTEwODA3O1xuXG5jb25zdCBsaW5lYXJpemUgPSAodiA9IDApID0+IHtcblx0bGV0IGFicyA9IE1hdGguYWJzKHYpO1xuXHRpZiAoYWJzIDwgXHUwM0IyICogNC41KSB7XG5cdFx0cmV0dXJuIHYgLyA0LjU7XG5cdH1cblx0cmV0dXJuIChNYXRoLnNpZ24odikgfHwgMSkgKiBNYXRoLnBvdygoYWJzICsgXHUwM0IxIC0gMSkgLyBcdTAzQjEsIDEgLyAwLjQ1KTtcbn07XG5cbmNvbnN0IGNvbnZlcnRSZWMyMDIwVG9YeXo2NSA9IHJlYzIwMjAgPT4ge1xuXHRsZXQgciA9IGxpbmVhcml6ZShyZWMyMDIwLnIpO1xuXHRsZXQgZyA9IGxpbmVhcml6ZShyZWMyMDIwLmcpO1xuXHRsZXQgYiA9IGxpbmVhcml6ZShyZWMyMDIwLmIpO1xuXHRsZXQgcmVzID0ge1xuXHRcdG1vZGU6ICd4eXo2NScsXG5cdFx0eDpcblx0XHRcdDAuNjM2OTU4MDQ4MzAxMjkxMSAqIHIgK1xuXHRcdFx0MC4xNDQ2MTY5MDM1ODYyMDgzICogZyArXG5cdFx0XHQwLjE2ODg4MDk3NTE2NDE3MjEgKiBiLFxuXHRcdHk6XG5cdFx0XHQwLjI2MjcwMDIxMjAxMTI2NyAqIHIgK1xuXHRcdFx0MC42Nzc5OTgwNzE1MTg4NzA4ICogZyArXG5cdFx0XHQwLjA1OTMwMTcxNjQ2OTg2MiAqIGIsXG5cdFx0ejogMCAqIHIgKyAwLjAyODA3MjY5MzA0OTA4NzQgKiBnICsgMS4wNjA5ODUwNTc3MTA3OTA5ICogYlxuXHR9O1xuXHRpZiAocmVjMjAyMC5hbHBoYSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmVzLmFscGhhID0gcmVjMjAyMC5hbHBoYTtcblx0fVxuXHRyZXR1cm4gcmVzO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgY29udmVydFJlYzIwMjBUb1h5ejY1O1xuIiwgImltcG9ydCByZ2IgZnJvbSAnLi4vcmdiL2RlZmluaXRpb24uanMnO1xuXG5pbXBvcnQgY29udmVydFh5ejY1VG9SZWMyMDIwIGZyb20gJy4vY29udmVydFh5ejY1VG9SZWMyMDIwLmpzJztcbmltcG9ydCBjb252ZXJ0UmVjMjAyMFRvWHl6NjUgZnJvbSAnLi9jb252ZXJ0UmVjMjAyMFRvWHl6NjUuanMnO1xuXG5pbXBvcnQgY29udmVydFJnYlRvWHl6NjUgZnJvbSAnLi4veHl6NjUvY29udmVydFJnYlRvWHl6NjUuanMnO1xuaW1wb3J0IGNvbnZlcnRYeXo2NVRvUmdiIGZyb20gJy4uL3h5ejY1L2NvbnZlcnRYeXo2NVRvUmdiLmpzJztcblxuY29uc3QgZGVmaW5pdGlvbiA9IHtcblx0Li4ucmdiLFxuXHRtb2RlOiAncmVjMjAyMCcsXG5cblx0ZnJvbU1vZGU6IHtcblx0XHR4eXo2NTogY29udmVydFh5ejY1VG9SZWMyMDIwLFxuXHRcdHJnYjogY29sb3IgPT4gY29udmVydFh5ejY1VG9SZWMyMDIwKGNvbnZlcnRSZ2JUb1h5ejY1KGNvbG9yKSlcblx0fSxcblxuXHR0b01vZGU6IHtcblx0XHR4eXo2NTogY29udmVydFJlYzIwMjBUb1h5ejY1LFxuXHRcdHJnYjogY29sb3IgPT4gY29udmVydFh5ejY1VG9SZ2IoY29udmVydFJlYzIwMjBUb1h5ejY1KGNvbG9yKSlcblx0fSxcblxuXHRwYXJzZTogWydyZWMyMDIwJ10sXG5cdHNlcmlhbGl6ZTogJ3JlYzIwMjAnXG59O1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbml0aW9uO1xuIiwgImV4cG9ydCBjb25zdCBiaWFzID0gMC4wMDM3OTMwNzMyNTUyNzU0NDkzMztcbmV4cG9ydCBjb25zdCBiaWFzX2NicnQgPSBNYXRoLmNicnQoYmlhcyk7XG4iLCAiaW1wb3J0IGNvbnZlcnRSZ2JUb0xyZ2IgZnJvbSAnLi4vbHJnYi9jb252ZXJ0UmdiVG9McmdiLmpzJztcbmltcG9ydCB7IGJpYXMsIGJpYXNfY2JydCB9IGZyb20gJy4vY29uc3RhbnRzLmpzJztcblxuY29uc3QgdHJhbnNmZXIgPSB2ID0+IE1hdGguY2JydCh2KSAtIGJpYXNfY2JydDtcblxuY29uc3QgY29udmVydFJnYlRvWHliID0gY29sb3IgPT4ge1xuXHRjb25zdCB7IHIsIGcsIGIsIGFscGhhIH0gPSBjb252ZXJ0UmdiVG9McmdiKGNvbG9yKTtcblx0Y29uc3QgbCA9IHRyYW5zZmVyKDAuMyAqIHIgKyAwLjYyMiAqIGcgKyAwLjA3OCAqIGIgKyBiaWFzKTtcblx0Y29uc3QgbSA9IHRyYW5zZmVyKDAuMjMgKiByICsgMC42OTIgKiBnICsgMC4wNzggKiBiICsgYmlhcyk7XG5cdGNvbnN0IHMgPSB0cmFuc2Zlcihcblx0XHQwLjI0MzQyMjY4OTI0NTQ3ODE5ICogciArXG5cdFx0XHQwLjIwNDc2NzQ0NDI0NDk2ODIxICogZyArXG5cdFx0XHQwLjU1MTgwOTg2NjUwOTU1MzYgKiBiICtcblx0XHRcdGJpYXNcblx0KTtcblx0Y29uc3QgcmVzID0ge1xuXHRcdG1vZGU6ICd4eWInLFxuXHRcdHg6IChsIC0gbSkgLyAyLFxuXHRcdHk6IChsICsgbSkgLyAyLFxuXHRcdC8qIEFwcGx5IGRlZmF1bHQgY2hyb21hIGZyb20gbHVtYSAoc3VidHJhY3QgWSBmcm9tIEIpICovXG5cdFx0YjogcyAtIChsICsgbSkgLyAyXG5cdH07XG5cdGlmIChhbHBoYSAhPT0gdW5kZWZpbmVkKSByZXMuYWxwaGEgPSBhbHBoYTtcblx0cmV0dXJuIHJlcztcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNvbnZlcnRSZ2JUb1h5YjtcbiIsICJpbXBvcnQgY29udmVydExyZ2JUb1JnYiBmcm9tICcuLi9scmdiL2NvbnZlcnRMcmdiVG9SZ2IuanMnO1xuaW1wb3J0IHsgYmlhcywgYmlhc19jYnJ0IH0gZnJvbSAnLi9jb25zdGFudHMuanMnO1xuXG5jb25zdCB0cmFuc2ZlciA9IHYgPT4gTWF0aC5wb3codiArIGJpYXNfY2JydCwgMyk7XG5cbmNvbnN0IGNvbnZlcnRYeWJUb1JnYiA9ICh7IHgsIHksIGIsIGFscGhhIH0pID0+IHtcblx0aWYgKHggPT09IHVuZGVmaW5lZCkgeCA9IDA7XG5cdGlmICh5ID09PSB1bmRlZmluZWQpIHkgPSAwO1xuXHRpZiAoYiA9PT0gdW5kZWZpbmVkKSBiID0gMDtcblx0Y29uc3QgbCA9IHRyYW5zZmVyKHggKyB5KSAtIGJpYXM7XG5cdGNvbnN0IG0gPSB0cmFuc2Zlcih5IC0geCkgLSBiaWFzO1xuXHQvKiBBY2NvdW50IGZvciBjaHJvbWEgZnJvbSBsdW1hOiBhZGQgWSBiYWNrIHRvIEIgKi9cblx0Y29uc3QgcyA9IHRyYW5zZmVyKGIgKyB5KSAtIGJpYXM7XG5cblx0Y29uc3QgcmVzID0gY29udmVydExyZ2JUb1JnYih7XG5cdFx0cjpcblx0XHRcdDExLjAzMTU2NjkwNDYzOTg2MSAqIGwgLVxuXHRcdFx0OS44NjY5NDM5MDgxMzE1NjIgKiBtIC1cblx0XHRcdDAuMTY0NjIyOTk2NTA4Mjk5MzQgKiBzLFxuXHRcdGc6XG5cdFx0XHQtMy4yNTQxNDczODEwNzQ0MjM3ICogbCArXG5cdFx0XHQ0LjQxODc3MDM3NzU4MjcyMyAqIG0gLVxuXHRcdFx0MC4xNjQ2MjI5OTY1MDgyOTkzNCAqIHMsXG5cdFx0Yjpcblx0XHRcdC0zLjY1ODg1MTI4NjcxMzY4MTUgKiBsICtcblx0XHRcdDIuNzEyOTIzMDQ1OTM2MDkyMiAqIG0gK1xuXHRcdFx0MS45NDU5MjgyNDA3Nzc1ODk1ICogc1xuXHR9KTtcblx0aWYgKGFscGhhICE9PSB1bmRlZmluZWQpIHJlcy5hbHBoYSA9IGFscGhhO1xuXHRyZXR1cm4gcmVzO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgY29udmVydFh5YlRvUmdiO1xuIiwgImltcG9ydCB7IGludGVycG9sYXRvckxpbmVhciB9IGZyb20gJy4uL2ludGVycG9sYXRlL2xpbmVhci5qcyc7XG5pbXBvcnQgeyBmaXh1cEFscGhhIH0gZnJvbSAnLi4vZml4dXAvYWxwaGEuanMnO1xuaW1wb3J0IGNvbnZlcnRSZ2JUb1h5YiBmcm9tICcuL2NvbnZlcnRSZ2JUb1h5Yi5qcyc7XG5pbXBvcnQgY29udmVydFh5YlRvUmdiIGZyb20gJy4vY29udmVydFh5YlRvUmdiLmpzJztcblxuLypcblx0VGhlIFhZQiBjb2xvciBzcGFjZSwgdXNlZCBpbiBKUEVHIFhMLlxuXHRSZWZlcmVuY2U6IGh0dHBzOi8vZHMuanBlZy5vcmcvd2hpdGVwYXBlcnMvanBlZy14bC13aGl0ZXBhcGVyLnBkZlxuKi9cblxuY29uc3QgZGVmaW5pdGlvbiA9IHtcblx0bW9kZTogJ3h5YicsXG5cdGNoYW5uZWxzOiBbJ3gnLCAneScsICdiJywgJ2FscGhhJ10sXG5cdHBhcnNlOiBbJy0teHliJ10sXG5cdHNlcmlhbGl6ZTogJy0teHliJyxcblxuXHR0b01vZGU6IHtcblx0XHRyZ2I6IGNvbnZlcnRYeWJUb1JnYlxuXHR9LFxuXG5cdGZyb21Nb2RlOiB7XG5cdFx0cmdiOiBjb252ZXJ0UmdiVG9YeWJcblx0fSxcblxuXHRyYW5nZXM6IHtcblx0XHR4OiBbLTAuMDE1NCwgMC4wMjgxXSxcblx0XHR5OiBbMCwgMC44NDUzXSxcblx0XHRiOiBbLTAuMjc3OCwgMC4zODhdXG5cdH0sXG5cblx0aW50ZXJwb2xhdGU6IHtcblx0XHR4OiBpbnRlcnBvbGF0b3JMaW5lYXIsXG5cdFx0eTogaW50ZXJwb2xhdG9yTGluZWFyLFxuXHRcdGI6IGludGVycG9sYXRvckxpbmVhcixcblx0XHRhbHBoYTogeyB1c2U6IGludGVycG9sYXRvckxpbmVhciwgZml4dXA6IGZpeHVwQWxwaGEgfVxuXHR9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbml0aW9uO1xuIiwgIi8qXG5cdFRoZSBYWVogRDUwIGNvbG9yIHNwYWNlXG5cdC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gKi9cblxuaW1wb3J0IGNvbnZlcnRYeXo1MFRvUmdiIGZyb20gJy4vY29udmVydFh5ejUwVG9SZ2IuanMnO1xuaW1wb3J0IGNvbnZlcnRYeXo1MFRvTGFiIGZyb20gJy4uL2xhYi9jb252ZXJ0WHl6NTBUb0xhYi5qcyc7XG5pbXBvcnQgY29udmVydFJnYlRvWHl6NTAgZnJvbSAnLi9jb252ZXJ0UmdiVG9YeXo1MC5qcyc7XG5pbXBvcnQgY29udmVydExhYlRvWHl6NTAgZnJvbSAnLi4vbGFiL2NvbnZlcnRMYWJUb1h5ejUwLmpzJztcbmltcG9ydCB7IGludGVycG9sYXRvckxpbmVhciB9IGZyb20gJy4uL2ludGVycG9sYXRlL2xpbmVhci5qcyc7XG5pbXBvcnQgeyBmaXh1cEFscGhhIH0gZnJvbSAnLi4vZml4dXAvYWxwaGEuanMnO1xuXG5jb25zdCBkZWZpbml0aW9uID0ge1xuXHRtb2RlOiAneHl6NTAnLFxuXHRwYXJzZTogWyd4eXotZDUwJ10sXG5cdHNlcmlhbGl6ZTogJ3h5ei1kNTAnLFxuXG5cdHRvTW9kZToge1xuXHRcdHJnYjogY29udmVydFh5ejUwVG9SZ2IsXG5cdFx0bGFiOiBjb252ZXJ0WHl6NTBUb0xhYlxuXHR9LFxuXG5cdGZyb21Nb2RlOiB7XG5cdFx0cmdiOiBjb252ZXJ0UmdiVG9YeXo1MCxcblx0XHRsYWI6IGNvbnZlcnRMYWJUb1h5ejUwXG5cdH0sXG5cblx0Y2hhbm5lbHM6IFsneCcsICd5JywgJ3onLCAnYWxwaGEnXSxcblxuXHRyYW5nZXM6IHtcblx0XHR4OiBbMCwgMC45NjRdLFxuXHRcdHk6IFswLCAwLjk5OV0sXG5cdFx0ejogWzAsIDAuODI1XVxuXHR9LFxuXG5cdGludGVycG9sYXRlOiB7XG5cdFx0eDogaW50ZXJwb2xhdG9yTGluZWFyLFxuXHRcdHk6IGludGVycG9sYXRvckxpbmVhcixcblx0XHR6OiBpbnRlcnBvbGF0b3JMaW5lYXIsXG5cdFx0YWxwaGE6IHsgdXNlOiBpbnRlcnBvbGF0b3JMaW5lYXIsIGZpeHVwOiBmaXh1cEFscGhhIH1cblx0fVxufTtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5pdGlvbjtcbiIsICIvKlxuXHRDaHJvbWF0aWMgYWRhcHRhdGlvbiBvZiBDSUUgWFlaIGZyb20gRDY1IHRvIEQ1MCB3aGl0ZSBwb2ludFxuXHR1c2luZyB0aGUgQnJhZGZvcmQgbWV0aG9kLlxuXG5cdFJlZmVyZW5jZXM6XG5cdFx0KiBodHRwczovL2RyYWZ0cy5jc3N3Zy5vcmcvY3NzLWNvbG9yLyNjb2xvci1jb252ZXJzaW9uLWNvZGVcblx0XHQqIGh0dHA6Ly93d3cuYnJ1Y2VsaW5kYmxvb20uY29tL2luZGV4Lmh0bWw/RXFuX0Nocm9tQWRhcHQuaHRtbFx0XG4qL1xuXG5jb25zdCBjb252ZXJ0WHl6NjVUb1h5ejUwID0geHl6NjUgPT4ge1xuXHRsZXQgeyB4LCB5LCB6LCBhbHBoYSB9ID0geHl6NjU7XG5cdGlmICh4ID09PSB1bmRlZmluZWQpIHggPSAwO1xuXHRpZiAoeSA9PT0gdW5kZWZpbmVkKSB5ID0gMDtcblx0aWYgKHogPT09IHVuZGVmaW5lZCkgeiA9IDA7XG5cdGxldCByZXMgPSB7XG5cdFx0bW9kZTogJ3h5ejUwJyxcblx0XHR4OlxuXHRcdFx0MS4wNDc5Mjk4MjA4NDA1NDg4ICogeCArXG5cdFx0XHQwLjAyMjk0Njc5MzM0MTAxOTEgKiB5IC1cblx0XHRcdDAuMDUwMTkyMjI5NTQzMTM1NiAqIHosXG5cdFx0eTpcblx0XHRcdDAuMDI5NjI3ODE1Njg4MTU5MyAqIHggK1xuXHRcdFx0MC45OTA0MzQ0ODQ1NzMyNDkgKiB5IC1cblx0XHRcdDAuMDE3MDczODI1MDI5Mzg1MSAqIHosXG5cdFx0ejpcblx0XHRcdC0wLjAwOTI0MzA1ODE1MjU5MTIgKiB4ICtcblx0XHRcdDAuMDE1MDU1MTQ0ODk2NTc3OSAqIHkgK1xuXHRcdFx0MC43NTE4NzQyODk5NTgwMDA4ICogelxuXHR9O1xuXHRpZiAoYWxwaGEgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJlcy5hbHBoYSA9IGFscGhhO1xuXHR9XG5cdHJldHVybiByZXM7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBjb252ZXJ0WHl6NjVUb1h5ejUwO1xuIiwgIi8qXG5cdENocm9tYXRpYyBhZGFwdGF0aW9uIG9mIENJRSBYWVogZnJvbSBENTAgdG8gRDY1IHdoaXRlIHBvaW50XG5cdHVzaW5nIHRoZSBCcmFkZm9yZCBtZXRob2QuXG5cblx0UmVmZXJlbmNlczpcblx0XHQqIGh0dHBzOi8vZHJhZnRzLmNzc3dnLm9yZy9jc3MtY29sb3IvI2NvbG9yLWNvbnZlcnNpb24tY29kZVxuXHRcdCogaHR0cDovL3d3dy5icnVjZWxpbmRibG9vbS5jb20vaW5kZXguaHRtbD9FcW5fQ2hyb21BZGFwdC5odG1sXHRcbiovXG5cbmNvbnN0IGNvbnZlcnRYeXo1MFRvWHl6NjUgPSB4eXo1MCA9PiB7XG5cdGxldCB7IHgsIHksIHosIGFscGhhIH0gPSB4eXo1MDtcblx0aWYgKHggPT09IHVuZGVmaW5lZCkgeCA9IDA7XG5cdGlmICh5ID09PSB1bmRlZmluZWQpIHkgPSAwO1xuXHRpZiAoeiA9PT0gdW5kZWZpbmVkKSB6ID0gMDtcblx0bGV0IHJlcyA9IHtcblx0XHRtb2RlOiAneHl6NjUnLFxuXHRcdHg6XG5cdFx0XHQwLjk1NTQ3MzQ1MjcwNDIxODIgKiB4IC1cblx0XHRcdDAuMDIzMDk4NTM2ODc0MjYxNCAqIHkgK1xuXHRcdFx0MC4wNjMyNTkzMDg2NjEwMjE3ICogeixcblx0XHR5OlxuXHRcdFx0LTAuMDI4MzY5NzA2OTYzMjA4MSAqIHggK1xuXHRcdFx0MS4wMDk5OTU0NTgwMDU4MjI2ICogeSArXG5cdFx0XHQwLjAyMTA0MTM5ODk2Njk0MyAqIHosXG5cdFx0ejpcblx0XHRcdDAuMDEyMzE0MDAxNjg4MzE5OSAqIHggLVxuXHRcdFx0MC4wMjA1MDc2OTY0MzM0Nzc5ICogeSArXG5cdFx0XHQxLjMzMDM2NTkzNjYwODA3NTMgKiB6XG5cdH07XG5cdGlmIChhbHBoYSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmVzLmFscGhhID0gYWxwaGE7XG5cdH1cblx0cmV0dXJuIHJlcztcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNvbnZlcnRYeXo1MFRvWHl6NjU7XG4iLCAiLypcblx0VGhlIFhZWiBENjUgY29sb3Igc3BhY2Vcblx0LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAqL1xuXG5pbXBvcnQgY29udmVydFh5ejY1VG9SZ2IgZnJvbSAnLi9jb252ZXJ0WHl6NjVUb1JnYi5qcyc7XG5pbXBvcnQgY29udmVydFJnYlRvWHl6NjUgZnJvbSAnLi9jb252ZXJ0UmdiVG9YeXo2NS5qcyc7XG5cbmltcG9ydCBjb252ZXJ0WHl6NjVUb1h5ejUwIGZyb20gJy4vY29udmVydFh5ejY1VG9YeXo1MC5qcyc7XG5pbXBvcnQgY29udmVydFh5ejUwVG9YeXo2NSBmcm9tICcuL2NvbnZlcnRYeXo1MFRvWHl6NjUuanMnO1xuXG5pbXBvcnQgeyBpbnRlcnBvbGF0b3JMaW5lYXIgfSBmcm9tICcuLi9pbnRlcnBvbGF0ZS9saW5lYXIuanMnO1xuaW1wb3J0IHsgZml4dXBBbHBoYSB9IGZyb20gJy4uL2ZpeHVwL2FscGhhLmpzJztcblxuY29uc3QgZGVmaW5pdGlvbiA9IHtcblx0bW9kZTogJ3h5ejY1JyxcblxuXHR0b01vZGU6IHtcblx0XHRyZ2I6IGNvbnZlcnRYeXo2NVRvUmdiLFxuXHRcdHh5ejUwOiBjb252ZXJ0WHl6NjVUb1h5ejUwXG5cdH0sXG5cblx0ZnJvbU1vZGU6IHtcblx0XHRyZ2I6IGNvbnZlcnRSZ2JUb1h5ejY1LFxuXHRcdHh5ejUwOiBjb252ZXJ0WHl6NTBUb1h5ejY1XG5cdH0sXG5cblx0cmFuZ2VzOiB7XG5cdFx0eDogWzAsIDAuOTVdLFxuXHRcdHk6IFswLCAxXSxcblx0XHR6OiBbMCwgMS4wODhdXG5cdH0sXG5cblx0Y2hhbm5lbHM6IFsneCcsICd5JywgJ3onLCAnYWxwaGEnXSxcblxuXHRwYXJzZTogWyd4eXonLCAneHl6LWQ2NSddLFxuXHRzZXJpYWxpemU6ICd4eXotZDY1JyxcblxuXHRpbnRlcnBvbGF0ZToge1xuXHRcdHg6IGludGVycG9sYXRvckxpbmVhcixcblx0XHR5OiBpbnRlcnBvbGF0b3JMaW5lYXIsXG5cdFx0ejogaW50ZXJwb2xhdG9yTGluZWFyLFxuXHRcdGFscGhhOiB7IHVzZTogaW50ZXJwb2xhdG9yTGluZWFyLCBmaXh1cDogZml4dXBBbHBoYSB9XG5cdH1cbn07XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluaXRpb247XG4iLCAiY29uc3QgY29udmVydFJnYlRvWWlxID0gKHsgciwgZywgYiwgYWxwaGEgfSkgPT4ge1xuXHRpZiAociA9PT0gdW5kZWZpbmVkKSByID0gMDtcblx0aWYgKGcgPT09IHVuZGVmaW5lZCkgZyA9IDA7XG5cdGlmIChiID09PSB1bmRlZmluZWQpIGIgPSAwO1xuXHRjb25zdCByZXMgPSB7XG5cdFx0bW9kZTogJ3lpcScsXG5cdFx0eTogMC4yOTg4OTUzMSAqIHIgKyAwLjU4NjYyMjQ3ICogZyArIDAuMTE0NDgyMjMgKiBiLFxuXHRcdGk6IDAuNTk1OTc3OTkgKiByIC0gMC4yNzQxNzYxICogZyAtIDAuMzIxODAxODkgKiBiLFxuXHRcdHE6IDAuMjExNDcwMTcgKiByIC0gMC41MjI2MTcxMSAqIGcgKyAwLjMxMTE0Njk0ICogYlxuXHR9O1xuXHRpZiAoYWxwaGEgIT09IHVuZGVmaW5lZCkgcmVzLmFscGhhID0gYWxwaGE7XG5cdHJldHVybiByZXM7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBjb252ZXJ0UmdiVG9ZaXE7XG4iLCAiY29uc3QgY29udmVydFlpcVRvUmdiID0gKHsgeSwgaSwgcSwgYWxwaGEgfSkgPT4ge1xuXHRpZiAoeSA9PT0gdW5kZWZpbmVkKSB5ID0gMDtcblx0aWYgKGkgPT09IHVuZGVmaW5lZCkgaSA9IDA7XG5cdGlmIChxID09PSB1bmRlZmluZWQpIHEgPSAwO1xuXHRjb25zdCByZXMgPSB7XG5cdFx0bW9kZTogJ3JnYicsXG5cdFx0cjogeSArIDAuOTU2MDg0NDUgKiBpICsgMC42MjA4ODg1ICogcSxcblx0XHRnOiB5IC0gMC4yNzEzNzY2NCAqIGkgLSAwLjY0ODYwNTkgKiBxLFxuXHRcdGI6IHkgLSAxLjEwNTYxNzI0ICogaSArIDEuNzAyNTAxMjYgKiBxXG5cdH07XG5cdGlmIChhbHBoYSAhPT0gdW5kZWZpbmVkKSByZXMuYWxwaGEgPSBhbHBoYTtcblx0cmV0dXJuIHJlcztcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNvbnZlcnRZaXFUb1JnYjtcbiIsICJpbXBvcnQgY29udmVydFJnYlRvWWlxIGZyb20gJy4vY29udmVydFJnYlRvWWlxLmpzJztcbmltcG9ydCBjb252ZXJ0WWlxVG9SZ2IgZnJvbSAnLi9jb252ZXJ0WWlxVG9SZ2IuanMnO1xuaW1wb3J0IHsgaW50ZXJwb2xhdG9yTGluZWFyIH0gZnJvbSAnLi4vaW50ZXJwb2xhdGUvbGluZWFyLmpzJztcbmltcG9ydCB7IGZpeHVwQWxwaGEgfSBmcm9tICcuLi9maXh1cC9hbHBoYS5qcyc7XG5cbi8qXG5cdFlJUSBDb2xvciBTcGFjZVxuXG5cdFJlZmVyZW5jZXNcblx0LS0tLS0tLS0tLVxuXG5cdFdpa2lwZWRpYTpcblx0XHRodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9ZSVFcblxuXHRcIk1lYXN1cmluZyBwZXJjZWl2ZWQgY29sb3IgZGlmZmVyZW5jZSB1c2luZyBZSVEgTlRTQ1xuXHR0cmFuc21pc3Npb24gY29sb3Igc3BhY2UgaW4gbW9iaWxlIGFwcGxpY2F0aW9uc1wiXG5cdFx0XG5cdFx0YnkgWXVyaXkgS290c2FyZW5rbywgRmVybmFuZG8gUmFtb3MgaW46XG5cdFx0UHJvZ3JhbWFjaVx1MDBGM24gTWF0ZW1cdTAwRTF0aWNhIHkgU29mdHdhcmUgKDIwMTApIFxuXG5cdEF2YWlsYWJsZSBhdDpcblx0XHRcblx0XHRodHRwOi8vd3d3LnByb2dtYXQudWFlbS5teDo4MDgwL2FydFZvbDJOdW0yL0FydGljdWxvM1ZvbDJOdW0yLnBkZlxuICovXG5cbmNvbnN0IGRlZmluaXRpb24gPSB7XG5cdG1vZGU6ICd5aXEnLFxuXG5cdHRvTW9kZToge1xuXHRcdHJnYjogY29udmVydFlpcVRvUmdiXG5cdH0sXG5cblx0ZnJvbU1vZGU6IHtcblx0XHRyZ2I6IGNvbnZlcnRSZ2JUb1lpcVxuXHR9LFxuXG5cdGNoYW5uZWxzOiBbJ3knLCAnaScsICdxJywgJ2FscGhhJ10sXG5cblx0cGFyc2U6IFsnLS15aXEnXSxcblx0c2VyaWFsaXplOiAnLS15aXEnLFxuXG5cdHJhbmdlczoge1xuXHRcdGk6IFstMC41OTUsIDAuNTk1XSxcblx0XHRxOiBbLTAuNTIyLCAwLjUyMl1cblx0fSxcblxuXHRpbnRlcnBvbGF0ZToge1xuXHRcdHk6IGludGVycG9sYXRvckxpbmVhcixcblx0XHRpOiBpbnRlcnBvbGF0b3JMaW5lYXIsXG5cdFx0cTogaW50ZXJwb2xhdG9yTGluZWFyLFxuXHRcdGFscGhhOiB7IHVzZTogaW50ZXJwb2xhdG9yTGluZWFyLCBmaXh1cDogZml4dXBBbHBoYSB9XG5cdH1cbn07XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluaXRpb247XG4iLCAiLy8gQ29sb3Igc3BhY2UgZGVmaW5pdGlvbnNcbmltcG9ydCBtb2RlQTk4IGZyb20gJy4vYTk4L2RlZmluaXRpb24uanMnO1xuaW1wb3J0IG1vZGVDdWJlaGVsaXggZnJvbSAnLi9jdWJlaGVsaXgvZGVmaW5pdGlvbi5qcyc7XG5pbXBvcnQgbW9kZURsYWIgZnJvbSAnLi9kbGFiL2RlZmluaXRpb24uanMnO1xuaW1wb3J0IG1vZGVEbGNoIGZyb20gJy4vZGxjaC9kZWZpbml0aW9uLmpzJztcbmltcG9ydCBtb2RlSHNpIGZyb20gJy4vaHNpL2RlZmluaXRpb24uanMnO1xuaW1wb3J0IG1vZGVIc2wgZnJvbSAnLi9oc2wvZGVmaW5pdGlvbi5qcyc7XG5pbXBvcnQgbW9kZUhzdiBmcm9tICcuL2hzdi9kZWZpbml0aW9uLmpzJztcbmltcG9ydCBtb2RlSHdiIGZyb20gJy4vaHdiL2RlZmluaXRpb24uanMnO1xuaW1wb3J0IG1vZGVJdHAgZnJvbSAnLi9pdHAvZGVmaW5pdGlvbi5qcyc7XG5pbXBvcnQgbW9kZUphYiBmcm9tICcuL2phYi9kZWZpbml0aW9uLmpzJztcbmltcG9ydCBtb2RlSmNoIGZyb20gJy4vamNoL2RlZmluaXRpb24uanMnO1xuaW1wb3J0IG1vZGVMYWIgZnJvbSAnLi9sYWIvZGVmaW5pdGlvbi5qcyc7XG5pbXBvcnQgbW9kZUxhYjY1IGZyb20gJy4vbGFiNjUvZGVmaW5pdGlvbi5qcyc7XG5pbXBvcnQgbW9kZUxjaCBmcm9tICcuL2xjaC9kZWZpbml0aW9uLmpzJztcbmltcG9ydCBtb2RlTGNoNjUgZnJvbSAnLi9sY2g2NS9kZWZpbml0aW9uLmpzJztcbmltcG9ydCBtb2RlTGNodXYgZnJvbSAnLi9sY2h1di9kZWZpbml0aW9uLmpzJztcbmltcG9ydCBtb2RlTHJnYiBmcm9tICcuL2xyZ2IvZGVmaW5pdGlvbi5qcyc7XG5pbXBvcnQgbW9kZUx1diBmcm9tICcuL2x1di9kZWZpbml0aW9uLmpzJztcbmltcG9ydCBtb2RlT2toc2wgZnJvbSAnLi9va2hzbC9tb2RlT2toc2wuanMnO1xuaW1wb3J0IG1vZGVPa2hzdiBmcm9tICcuL29raHN2L21vZGVPa2hzdi5qcyc7XG5pbXBvcnQgbW9kZU9rbGFiIGZyb20gJy4vb2tsYWIvZGVmaW5pdGlvbi5qcyc7XG5pbXBvcnQgbW9kZU9rbGNoIGZyb20gJy4vb2tsY2gvZGVmaW5pdGlvbi5qcyc7XG5pbXBvcnQgbW9kZVAzIGZyb20gJy4vcDMvZGVmaW5pdGlvbi5qcyc7XG5pbXBvcnQgbW9kZVByb3Bob3RvIGZyb20gJy4vcHJvcGhvdG8vZGVmaW5pdGlvbi5qcyc7XG5pbXBvcnQgbW9kZVJlYzIwMjAgZnJvbSAnLi9yZWMyMDIwL2RlZmluaXRpb24uanMnO1xuaW1wb3J0IG1vZGVSZ2IgZnJvbSAnLi9yZ2IvZGVmaW5pdGlvbi5qcyc7XG5pbXBvcnQgbW9kZVh5YiBmcm9tICcuL3h5Yi9kZWZpbml0aW9uLmpzJztcbmltcG9ydCBtb2RlWHl6NTAgZnJvbSAnLi94eXo1MC9kZWZpbml0aW9uLmpzJztcbmltcG9ydCBtb2RlWHl6NjUgZnJvbSAnLi94eXo2NS9kZWZpbml0aW9uLmpzJztcbmltcG9ydCBtb2RlWWlxIGZyb20gJy4veWlxL2RlZmluaXRpb24uanMnO1xuaW1wb3J0IHsgdXNlTW9kZSB9IGZyb20gJy4vbW9kZXMuanMnO1xuXG5leHBvcnQgeyBkZWZhdWx0IGFzIGNvbnZlcnRlciB9IGZyb20gJy4vY29udmVydGVyLmpzJztcblxuZXhwb3J0IHtcblx0c2VyaWFsaXplSGV4LFxuXHRzZXJpYWxpemVIZXg4LFxuXHRzZXJpYWxpemVSZ2IsXG5cdHNlcmlhbGl6ZUhzbCxcblx0Zm9ybWF0SGV4LFxuXHRmb3JtYXRIZXg4LFxuXHRmb3JtYXRSZ2IsXG5cdGZvcm1hdEhzbCxcblx0Zm9ybWF0Q3NzXG59IGZyb20gJy4vZm9ybWF0dGVyLmpzJztcblxuZXhwb3J0IHsgZGVmYXVsdCBhcyBjb2xvcnNOYW1lZCB9IGZyb20gJy4vY29sb3JzL25hbWVkLmpzJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgYmxlbmQgfSBmcm9tICcuL2JsZW5kLmpzJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgcmFuZG9tIH0gZnJvbSAnLi9yYW5kb20uanMnO1xuXG5leHBvcnQge1xuXHRmaXh1cEh1ZVNob3J0ZXIsXG5cdGZpeHVwSHVlTG9uZ2VyLFxuXHRmaXh1cEh1ZUluY3JlYXNpbmcsXG5cdGZpeHVwSHVlRGVjcmVhc2luZ1xufSBmcm9tICcuL2ZpeHVwL2h1ZS5qcyc7XG5cbmV4cG9ydCB7IGZpeHVwQWxwaGEgfSBmcm9tICcuL2ZpeHVwL2FscGhhLmpzJztcblxuZXhwb3J0IHtcblx0bWFwcGVyLFxuXHRtYXBBbHBoYU11bHRpcGx5LFxuXHRtYXBBbHBoYURpdmlkZSxcblx0bWFwVHJhbnNmZXJMaW5lYXIsXG5cdG1hcFRyYW5zZmVyR2FtbWFcbn0gZnJvbSAnLi9tYXAuanMnO1xuXG5leHBvcnQgeyBhdmVyYWdlLCBhdmVyYWdlQW5nbGUsIGF2ZXJhZ2VOdW1iZXIgfSBmcm9tICcuL2F2ZXJhZ2UuanMnO1xuXG5leHBvcnQgeyBkZWZhdWx0IGFzIHJvdW5kIH0gZnJvbSAnLi9yb3VuZC5qcyc7XG5leHBvcnQge1xuXHRpbnRlcnBvbGF0ZSxcblx0aW50ZXJwb2xhdGVXaXRoLFxuXHRpbnRlcnBvbGF0ZVdpdGhQcmVtdWx0aXBsaWVkQWxwaGFcbn0gZnJvbSAnLi9pbnRlcnBvbGF0ZS9pbnRlcnBvbGF0ZS5qcyc7XG5cbmV4cG9ydCB7IGludGVycG9sYXRvckxpbmVhciB9IGZyb20gJy4vaW50ZXJwb2xhdGUvbGluZWFyLmpzJztcblxuZXhwb3J0IHsgaW50ZXJwb2xhdG9yUGllY2V3aXNlIH0gZnJvbSAnLi9pbnRlcnBvbGF0ZS9waWVjZXdpc2UuanMnO1xuXG5leHBvcnQge1xuXHRpbnRlcnBvbGF0b3JTcGxpbmVCYXNpcyxcblx0aW50ZXJwb2xhdG9yU3BsaW5lQmFzaXNDbG9zZWRcbn0gZnJvbSAnLi9pbnRlcnBvbGF0ZS9zcGxpbmVCYXNpcy5qcyc7XG5cbmV4cG9ydCB7XG5cdGludGVycG9sYXRvclNwbGluZU5hdHVyYWwsXG5cdGludGVycG9sYXRvclNwbGluZU5hdHVyYWxDbG9zZWRcbn0gZnJvbSAnLi9pbnRlcnBvbGF0ZS9zcGxpbmVOYXR1cmFsLmpzJztcblxuZXhwb3J0IHtcblx0aW50ZXJwb2xhdG9yU3BsaW5lTW9ub3RvbmUsXG5cdGludGVycG9sYXRvclNwbGluZU1vbm90b25lMixcblx0aW50ZXJwb2xhdG9yU3BsaW5lTW9ub3RvbmVDbG9zZWRcbn0gZnJvbSAnLi9pbnRlcnBvbGF0ZS9zcGxpbmVNb25vdG9uZS5qcyc7XG5cbmV4cG9ydCB7IGxlcnAsIHVubGVycCwgYmxlcnAsIHRyaWxlcnAgfSBmcm9tICcuL2ludGVycG9sYXRlL2xlcnAuanMnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBzYW1wbGVzIH0gZnJvbSAnLi9zYW1wbGVzLmpzJztcbmV4cG9ydCB7XG5cdGRpc3BsYXlhYmxlLFxuXHRpbkdhbXV0LFxuXHRjbGFtcFJnYixcblx0Y2xhbXBDaHJvbWEsXG5cdGNsYW1wR2FtdXQsXG5cdHRvR2FtdXRcbn0gZnJvbSAnLi9jbGFtcC5qcyc7XG5leHBvcnQgeyBkZWZhdWx0IGFzIG5lYXJlc3QgfSBmcm9tICcuL25lYXJlc3QuanMnO1xuZXhwb3J0IHsgdXNlTW9kZSwgZ2V0TW9kZSwgdXNlUGFyc2VyLCByZW1vdmVQYXJzZXIgfSBmcm9tICcuL21vZGVzLmpzJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgcGFyc2UgfSBmcm9tICcuL3BhcnNlLmpzJztcblxuZXhwb3J0IHtcblx0ZGlmZmVyZW5jZUV1Y2xpZGVhbixcblx0ZGlmZmVyZW5jZUNpZTc2LFxuXHRkaWZmZXJlbmNlQ2llOTQsXG5cdGRpZmZlcmVuY2VDaWVkZTIwMDAsXG5cdGRpZmZlcmVuY2VDbWMsXG5cdGRpZmZlcmVuY2VIeWFiLFxuXHRkaWZmZXJlbmNlSHVlU2F0dXJhdGlvbixcblx0ZGlmZmVyZW5jZUh1ZUNocm9tYSxcblx0ZGlmZmVyZW5jZUh1ZU5haXZlLFxuXHRkaWZmZXJlbmNlS290c2FyZW5rb1JhbW9zLFxuXHRkaWZmZXJlbmNlSXRwXG59IGZyb20gJy4vZGlmZmVyZW5jZS5qcyc7XG5cbmV4cG9ydCB7XG5cdGZpbHRlckJyaWdodG5lc3MsXG5cdGZpbHRlckNvbnRyYXN0LFxuXHRmaWx0ZXJTZXBpYSxcblx0ZmlsdGVySW52ZXJ0LFxuXHRmaWx0ZXJTYXR1cmF0ZSxcblx0ZmlsdGVyR3JheXNjYWxlLFxuXHRmaWx0ZXJIdWVSb3RhdGVcbn0gZnJvbSAnLi9maWx0ZXIuanMnO1xuXG5leHBvcnQge1xuXHRmaWx0ZXJEZWZpY2llbmN5UHJvdCxcblx0ZmlsdGVyRGVmaWNpZW5jeURldXRlcixcblx0ZmlsdGVyRGVmaWNpZW5jeVRyaXRcbn0gZnJvbSAnLi9kZWZpY2llbmN5LmpzJztcblxuLy8gRWFzaW5nc1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBlYXNpbmdNaWRwb2ludCB9IGZyb20gJy4vZWFzaW5nL21pZHBvaW50LmpzJztcbmV4cG9ydCB7XG5cdGVhc2luZ1Ntb290aHN0ZXAsXG5cdGVhc2luZ1Ntb290aHN0ZXBJbnZlcnNlXG59IGZyb20gJy4vZWFzaW5nL3Ntb290aHN0ZXAuanMnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBlYXNpbmdTbW9vdGhlcnN0ZXAgfSBmcm9tICcuL2Vhc2luZy9zbW9vdGhlcnN0ZXAuanMnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBlYXNpbmdJbk91dFNpbmUgfSBmcm9tICcuL2Vhc2luZy9pbk91dFNpbmUuanMnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBlYXNpbmdHYW1tYSB9IGZyb20gJy4vZWFzaW5nL2dhbW1hLmpzJztcblxuZXhwb3J0IHtcblx0bHVtaW5hbmNlIGFzIHdjYWdMdW1pbmFuY2UsXG5cdGNvbnRyYXN0IGFzIHdjYWdDb250cmFzdFxufSBmcm9tICcuL3djYWcuanMnO1xuXG5leHBvcnQgeyBkZWZhdWx0IGFzIHBhcnNlSHNsIH0gZnJvbSAnLi9oc2wvcGFyc2VIc2wuanMnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBwYXJzZUh3YiB9IGZyb20gJy4vaHdiL3BhcnNlSHdiLmpzJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgcGFyc2VMYWIgfSBmcm9tICcuL2xhYi9wYXJzZUxhYi5qcyc7XG5leHBvcnQgeyBkZWZhdWx0IGFzIHBhcnNlTGNoIH0gZnJvbSAnLi9sY2gvcGFyc2VMY2guanMnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBwYXJzZU5hbWVkIH0gZnJvbSAnLi9yZ2IvcGFyc2VOYW1lZC5qcyc7XG5leHBvcnQgeyBkZWZhdWx0IGFzIHBhcnNlVHJhbnNwYXJlbnQgfSBmcm9tICcuL3JnYi9wYXJzZVRyYW5zcGFyZW50LmpzJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgcGFyc2VIZXggfSBmcm9tICcuL3JnYi9wYXJzZUhleC5qcyc7XG5leHBvcnQgeyBkZWZhdWx0IGFzIHBhcnNlUmdiIH0gZnJvbSAnLi9yZ2IvcGFyc2VSZ2IuanMnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBwYXJzZUhzbExlZ2FjeSB9IGZyb20gJy4vaHNsL3BhcnNlSHNsTGVnYWN5LmpzJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgcGFyc2VSZ2JMZWdhY3kgfSBmcm9tICcuL3JnYi9wYXJzZVJnYkxlZ2FjeS5qcyc7XG5leHBvcnQgeyBkZWZhdWx0IGFzIHBhcnNlT2tsYWIgfSBmcm9tICcuL29rbGFiL3BhcnNlT2tsYWIuanMnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBwYXJzZU9rbGNoIH0gZnJvbSAnLi9va2xjaC9wYXJzZU9rbGNoLmpzJztcblxuZXhwb3J0IHsgZGVmYXVsdCBhcyBjb252ZXJ0QTk4VG9YeXo2NSB9IGZyb20gJy4vYTk4L2NvbnZlcnRBOThUb1h5ejY1LmpzJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgY29udmVydEN1YmVoZWxpeFRvUmdiIH0gZnJvbSAnLi9jdWJlaGVsaXgvY29udmVydEN1YmVoZWxpeFRvUmdiLmpzJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgY29udmVydERsY2hUb0xhYjY1IH0gZnJvbSAnLi9kbGNoL2NvbnZlcnREbGNoVG9MYWI2NS5qcyc7XG5leHBvcnQgeyBkZWZhdWx0IGFzIGNvbnZlcnRIc2lUb1JnYiB9IGZyb20gJy4vaHNpL2NvbnZlcnRIc2lUb1JnYi5qcyc7XG5leHBvcnQgeyBkZWZhdWx0IGFzIGNvbnZlcnRIc2xUb1JnYiB9IGZyb20gJy4vaHNsL2NvbnZlcnRIc2xUb1JnYi5qcyc7XG5leHBvcnQgeyBkZWZhdWx0IGFzIGNvbnZlcnRIc3ZUb1JnYiB9IGZyb20gJy4vaHN2L2NvbnZlcnRIc3ZUb1JnYi5qcyc7XG5leHBvcnQgeyBkZWZhdWx0IGFzIGNvbnZlcnRId2JUb1JnYiB9IGZyb20gJy4vaHdiL2NvbnZlcnRId2JUb1JnYi5qcyc7XG5leHBvcnQgeyBkZWZhdWx0IGFzIGNvbnZlcnRJdHBUb1h5ejY1IH0gZnJvbSAnLi9pdHAvY29udmVydEl0cFRvWHl6NjUuanMnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBjb252ZXJ0SmFiVG9KY2ggfSBmcm9tICcuL2pjaC9jb252ZXJ0SmFiVG9KY2guanMnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBjb252ZXJ0SmFiVG9SZ2IgfSBmcm9tICcuL2phYi9jb252ZXJ0SmFiVG9SZ2IuanMnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBjb252ZXJ0SmFiVG9YeXo2NSB9IGZyb20gJy4vamFiL2NvbnZlcnRKYWJUb1h5ejY1LmpzJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgY29udmVydEpjaFRvSmFiIH0gZnJvbSAnLi9qY2gvY29udmVydEpjaFRvSmFiLmpzJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgY29udmVydExhYjY1VG9EbGNoIH0gZnJvbSAnLi9kbGNoL2NvbnZlcnRMYWI2NVRvRGxjaC5qcyc7XG5leHBvcnQgeyBkZWZhdWx0IGFzIGNvbnZlcnRMYWI2NVRvUmdiIH0gZnJvbSAnLi9sYWI2NS9jb252ZXJ0TGFiNjVUb1JnYi5qcyc7XG5leHBvcnQgeyBkZWZhdWx0IGFzIGNvbnZlcnRMYWI2NVRvWHl6NjUgfSBmcm9tICcuL2xhYjY1L2NvbnZlcnRMYWI2NVRvWHl6NjUuanMnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBjb252ZXJ0TGFiVG9MY2ggfSBmcm9tICcuL2xjaC9jb252ZXJ0TGFiVG9MY2guanMnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBjb252ZXJ0TGFiVG9SZ2IgfSBmcm9tICcuL2xhYi9jb252ZXJ0TGFiVG9SZ2IuanMnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBjb252ZXJ0TGFiVG9YeXo1MCB9IGZyb20gJy4vbGFiL2NvbnZlcnRMYWJUb1h5ejUwLmpzJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgY29udmVydExjaFRvTGFiIH0gZnJvbSAnLi9sY2gvY29udmVydExjaFRvTGFiLmpzJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgY29udmVydExjaHV2VG9MdXYgfSBmcm9tICcuL2xjaHV2L2NvbnZlcnRMY2h1dlRvTHV2LmpzJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgY29udmVydExyZ2JUb09rbGFiIH0gZnJvbSAnLi9va2xhYi9jb252ZXJ0THJnYlRvT2tsYWIuanMnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBjb252ZXJ0THJnYlRvUmdiIH0gZnJvbSAnLi9scmdiL2NvbnZlcnRMcmdiVG9SZ2IuanMnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBjb252ZXJ0THV2VG9MY2h1diB9IGZyb20gJy4vbGNodXYvY29udmVydEx1dlRvTGNodXYuanMnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBjb252ZXJ0THV2VG9YeXo1MCB9IGZyb20gJy4vbHV2L2NvbnZlcnRMdXZUb1h5ejUwLmpzJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgY29udmVydE9raHNsVG9Pa2xhYiB9IGZyb20gJy4vb2toc2wvY29udmVydE9raHNsVG9Pa2xhYi5qcyc7XG5leHBvcnQgeyBkZWZhdWx0IGFzIGNvbnZlcnRPa2hzdlRvT2tsYWIgfSBmcm9tICcuL29raHN2L2NvbnZlcnRPa2hzdlRvT2tsYWIuanMnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBjb252ZXJ0T2tsYWJUb0xyZ2IgfSBmcm9tICcuL29rbGFiL2NvbnZlcnRPa2xhYlRvTHJnYi5qcyc7XG5leHBvcnQgeyBkZWZhdWx0IGFzIGNvbnZlcnRPa2xhYlRvT2toc2wgfSBmcm9tICcuL29raHNsL2NvbnZlcnRPa2xhYlRvT2toc2wuanMnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBjb252ZXJ0T2tsYWJUb09raHN2IH0gZnJvbSAnLi9va2hzdi9jb252ZXJ0T2tsYWJUb09raHN2LmpzJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgY29udmVydE9rbGFiVG9SZ2IgfSBmcm9tICcuL29rbGFiL2NvbnZlcnRPa2xhYlRvUmdiLmpzJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgY29udmVydFAzVG9YeXo2NSB9IGZyb20gJy4vcDMvY29udmVydFAzVG9YeXo2NS5qcyc7XG5leHBvcnQgeyBkZWZhdWx0IGFzIGNvbnZlcnRQcm9waG90b1RvWHl6NTAgfSBmcm9tICcuL3Byb3Bob3RvL2NvbnZlcnRQcm9waG90b1RvWHl6NTAuanMnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBjb252ZXJ0UmVjMjAyMFRvWHl6NjUgfSBmcm9tICcuL3JlYzIwMjAvY29udmVydFJlYzIwMjBUb1h5ejY1LmpzJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgY29udmVydFJnYlRvQ3ViZWhlbGl4IH0gZnJvbSAnLi9jdWJlaGVsaXgvY29udmVydFJnYlRvQ3ViZWhlbGl4LmpzJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgY29udmVydFJnYlRvSHNpIH0gZnJvbSAnLi9oc2kvY29udmVydFJnYlRvSHNpLmpzJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgY29udmVydFJnYlRvSHNsIH0gZnJvbSAnLi9oc2wvY29udmVydFJnYlRvSHNsLmpzJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgY29udmVydFJnYlRvSHN2IH0gZnJvbSAnLi9oc3YvY29udmVydFJnYlRvSHN2LmpzJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgY29udmVydFJnYlRvSHdiIH0gZnJvbSAnLi9od2IvY29udmVydFJnYlRvSHdiLmpzJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgY29udmVydFJnYlRvSmFiIH0gZnJvbSAnLi9qYWIvY29udmVydFJnYlRvSmFiLmpzJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgY29udmVydFJnYlRvTGFiIH0gZnJvbSAnLi9sYWIvY29udmVydFJnYlRvTGFiLmpzJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgY29udmVydFJnYlRvTGFiNjUgfSBmcm9tICcuL2xhYjY1L2NvbnZlcnRSZ2JUb0xhYjY1LmpzJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgY29udmVydFJnYlRvTHJnYiB9IGZyb20gJy4vbHJnYi9jb252ZXJ0UmdiVG9McmdiLmpzJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgY29udmVydFJnYlRvT2tsYWIgfSBmcm9tICcuL29rbGFiL2NvbnZlcnRSZ2JUb09rbGFiLmpzJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgY29udmVydFJnYlRvWHliIH0gZnJvbSAnLi94eWIvY29udmVydFJnYlRvWHliLmpzJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgY29udmVydFJnYlRvWHl6NTAgfSBmcm9tICcuL3h5ejUwL2NvbnZlcnRSZ2JUb1h5ejUwLmpzJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgY29udmVydFJnYlRvWHl6NjUgfSBmcm9tICcuL3h5ejY1L2NvbnZlcnRSZ2JUb1h5ejY1LmpzJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgY29udmVydFJnYlRvWWlxIH0gZnJvbSAnLi95aXEvY29udmVydFJnYlRvWWlxLmpzJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgY29udmVydFh5YlRvUmdiIH0gZnJvbSAnLi94eWIvY29udmVydFh5YlRvUmdiLmpzJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgY29udmVydFh5ejUwVG9MYWIgfSBmcm9tICcuL2xhYi9jb252ZXJ0WHl6NTBUb0xhYi5qcyc7XG5leHBvcnQgeyBkZWZhdWx0IGFzIGNvbnZlcnRYeXo1MFRvTHV2IH0gZnJvbSAnLi9sdXYvY29udmVydFh5ejUwVG9MdXYuanMnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBjb252ZXJ0WHl6NTBUb1Byb3Bob3RvIH0gZnJvbSAnLi9wcm9waG90by9jb252ZXJ0WHl6NTBUb1Byb3Bob3RvLmpzJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgY29udmVydFh5ejUwVG9SZ2IgfSBmcm9tICcuL3h5ejUwL2NvbnZlcnRYeXo1MFRvUmdiLmpzJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgY29udmVydFh5ejUwVG9YeXo2NSB9IGZyb20gJy4veHl6NjUvY29udmVydFh5ejUwVG9YeXo2NS5qcyc7XG5leHBvcnQgeyBkZWZhdWx0IGFzIGNvbnZlcnRYeXo2NVRvQTk4IH0gZnJvbSAnLi9hOTgvY29udmVydFh5ejY1VG9BOTguanMnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBjb252ZXJ0WHl6NjVUb0l0cCB9IGZyb20gJy4vaXRwL2NvbnZlcnRYeXo2NVRvSXRwLmpzJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgY29udmVydFh5ejY1VG9KYWIgfSBmcm9tICcuL2phYi9jb252ZXJ0WHl6NjVUb0phYi5qcyc7XG5leHBvcnQgeyBkZWZhdWx0IGFzIGNvbnZlcnRYeXo2NVRvTGFiNjUgfSBmcm9tICcuL2xhYjY1L2NvbnZlcnRYeXo2NVRvTGFiNjUuanMnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBjb252ZXJ0WHl6NjVUb1AzIH0gZnJvbSAnLi9wMy9jb252ZXJ0WHl6NjVUb1AzLmpzJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgY29udmVydFh5ejY1VG9SZWMyMDIwIH0gZnJvbSAnLi9yZWMyMDIwL2NvbnZlcnRYeXo2NVRvUmVjMjAyMC5qcyc7XG5leHBvcnQgeyBkZWZhdWx0IGFzIGNvbnZlcnRYeXo2NVRvUmdiIH0gZnJvbSAnLi94eXo2NS9jb252ZXJ0WHl6NjVUb1JnYi5qcyc7XG5leHBvcnQgeyBkZWZhdWx0IGFzIGNvbnZlcnRYeXo2NVRvWHl6NTAgfSBmcm9tICcuL3h5ejY1L2NvbnZlcnRYeXo2NVRvWHl6NTAuanMnO1xuZXhwb3J0IHsgZGVmYXVsdCBhcyBjb252ZXJ0WWlxVG9SZ2IgfSBmcm9tICcuL3lpcS9jb252ZXJ0WWlxVG9SZ2IuanMnO1xuXG5leHBvcnQge1xuXHRtb2RlQTk4LFxuXHRtb2RlQ3ViZWhlbGl4LFxuXHRtb2RlRGxhYixcblx0bW9kZURsY2gsXG5cdG1vZGVIc2ksXG5cdG1vZGVIc2wsXG5cdG1vZGVIc3YsXG5cdG1vZGVId2IsXG5cdG1vZGVJdHAsXG5cdG1vZGVKYWIsXG5cdG1vZGVKY2gsXG5cdG1vZGVMYWIsXG5cdG1vZGVMYWI2NSxcblx0bW9kZUxjaCxcblx0bW9kZUxjaDY1LFxuXHRtb2RlTGNodXYsXG5cdG1vZGVMcmdiLFxuXHRtb2RlTHV2LFxuXHRtb2RlT2toc2wsXG5cdG1vZGVPa2hzdixcblx0bW9kZU9rbGFiLFxuXHRtb2RlT2tsY2gsXG5cdG1vZGVQMyxcblx0bW9kZVByb3Bob3RvLFxuXHRtb2RlUmVjMjAyMCxcblx0bW9kZVJnYixcblx0bW9kZVh5Yixcblx0bW9kZVh5ejUwLFxuXHRtb2RlWHl6NjUsXG5cdG1vZGVZaXFcbn07XG5cbmV4cG9ydCBjb25zdCBhOTggPSB1c2VNb2RlKG1vZGVBOTgpO1xuZXhwb3J0IGNvbnN0IGN1YmVoZWxpeCA9IHVzZU1vZGUobW9kZUN1YmVoZWxpeCk7XG5leHBvcnQgY29uc3QgZGxhYiA9IHVzZU1vZGUobW9kZURsYWIpO1xuZXhwb3J0IGNvbnN0IGRsY2ggPSB1c2VNb2RlKG1vZGVEbGNoKTtcbmV4cG9ydCBjb25zdCBoc2kgPSB1c2VNb2RlKG1vZGVIc2kpO1xuZXhwb3J0IGNvbnN0IGhzbCA9IHVzZU1vZGUobW9kZUhzbCk7XG5leHBvcnQgY29uc3QgaHN2ID0gdXNlTW9kZShtb2RlSHN2KTtcbmV4cG9ydCBjb25zdCBod2IgPSB1c2VNb2RlKG1vZGVId2IpO1xuZXhwb3J0IGNvbnN0IGl0cCA9IHVzZU1vZGUobW9kZUl0cCk7XG5leHBvcnQgY29uc3QgamFiID0gdXNlTW9kZShtb2RlSmFiKTtcbmV4cG9ydCBjb25zdCBqY2ggPSB1c2VNb2RlKG1vZGVKY2gpO1xuZXhwb3J0IGNvbnN0IGxhYiA9IHVzZU1vZGUobW9kZUxhYik7XG5leHBvcnQgY29uc3QgbGFiNjUgPSB1c2VNb2RlKG1vZGVMYWI2NSk7XG5leHBvcnQgY29uc3QgbGNoID0gdXNlTW9kZShtb2RlTGNoKTtcbmV4cG9ydCBjb25zdCBsY2g2NSA9IHVzZU1vZGUobW9kZUxjaDY1KTtcbmV4cG9ydCBjb25zdCBsY2h1diA9IHVzZU1vZGUobW9kZUxjaHV2KTtcbmV4cG9ydCBjb25zdCBscmdiID0gdXNlTW9kZShtb2RlTHJnYik7XG5leHBvcnQgY29uc3QgbHV2ID0gdXNlTW9kZShtb2RlTHV2KTtcbmV4cG9ydCBjb25zdCBva2hzbCA9IHVzZU1vZGUobW9kZU9raHNsKTtcbmV4cG9ydCBjb25zdCBva2hzdiA9IHVzZU1vZGUobW9kZU9raHN2KTtcbmV4cG9ydCBjb25zdCBva2xhYiA9IHVzZU1vZGUobW9kZU9rbGFiKTtcbmV4cG9ydCBjb25zdCBva2xjaCA9IHVzZU1vZGUobW9kZU9rbGNoKTtcbmV4cG9ydCBjb25zdCBwMyA9IHVzZU1vZGUobW9kZVAzKTtcbmV4cG9ydCBjb25zdCBwcm9waG90byA9IHVzZU1vZGUobW9kZVByb3Bob3RvKTtcbmV4cG9ydCBjb25zdCByZWMyMDIwID0gdXNlTW9kZShtb2RlUmVjMjAyMCk7XG5leHBvcnQgY29uc3QgcmdiID0gdXNlTW9kZShtb2RlUmdiKTtcbmV4cG9ydCBjb25zdCB4eWIgPSB1c2VNb2RlKG1vZGVYeWIpO1xuZXhwb3J0IGNvbnN0IHh5ejUwID0gdXNlTW9kZShtb2RlWHl6NTApO1xuZXhwb3J0IGNvbnN0IHh5ejY1ID0gdXNlTW9kZShtb2RlWHl6NjUpO1xuZXhwb3J0IGNvbnN0IHlpcSA9IHVzZU1vZGUobW9kZVlpcSk7XG4iLCAiLyoqXG4gKiBEZXNpZ24gdG9rZW5zIFx1MjAxNCB0aGUgc2luZ2xlIHNvdXJjZSBvZiB0cnV0aCBmb3IgY29sb3IsIG1vdGlvbiwgbGF5b3V0LFxuICogYW5kIHRpbWluZyB2YWx1ZXMgYWNyb3NzIHRoZSBGb3J1bSByZW5kZXJlci5cbiAqXG4gKiBBbGwgY29sb3JzIGFyZSBzcGVjaWZpZWQgaW4gT0tMQ0ggZm9yIHBlcmNlcHR1YWwgdW5pZm9ybWl0eS4gRHJpdmVzXG4gKiBzdGF5IGF0IHNpbWlsYXIgTCAoNzItNzUlKSBhbmQgQyAoMC4wOS0wLjEyKSBzbyB0aGUgZm91ciBodWVzIHJlYWRcbiAqIGFzIGEgZmFtaWx5IHRoYXQgZGlmZmVycyBvbmx5IGluIHRlbXBlcmF0dXJlLCBuZXZlciBpbiBsdW1pbm9zaXR5LlxuICpcbiAqIFNvdXJjZWQgZnJvbSB0aGUgY29uY2VwdCBkb2MgYXRcbiAqIH4vLmNsYXVkZS9wbGFucy9hdGhlbmEtc2VudC1tZS10aGlzLWpvbGx5LW1pbnNreS5tZFxuICovXG5cbi8vIFx1MjUwMFx1MjUwMCBPS0xDSCBjb2xvciB0b2tlbnMgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmV4cG9ydCB0eXBlIE9rbGNoQ29sb3IgPSB7IGw6IG51bWJlcjsgYzogbnVtYmVyOyBoOiBudW1iZXIgfTtcblxuZXhwb3J0IGNvbnN0IENPTE9SID0ge1xuICAvLyBGb3VuZGF0aW9uXG4gIGJhY2tncm91bmQ6IHsgbDogMC4wOCwgYzogMC4wMjUsIGg6IDI2MCB9LCAgICAgICAgICAvLyBkZWVwIGRhcmsgaW5kaWdvXG4gIGZvcm1CYXNlOiB7IGw6IDAuOTQsIGM6IDAuMDE1LCBoOiA5MCB9LCAgICAgICAgICAgICAvLyBwYWxlIGx1bWlub3VzIG9mZi13aGl0ZVxuICB0eXBvZ3JhcGh5OiB7IGw6IDAuODUsIGM6IDAuMDE1LCBoOiA5MCB9LCAgICAgICAgICAgLy8gc2xpZ2h0bHkgZGltbWVyIHdhcm0gb2ZmLXdoaXRlXG5cbiAgLy8gRm91ciBkcml2ZSBwYWxldHRlXG4gIGRyaXZlOiB7XG4gICAgY3VyaW9zaXR5OiB7IGw6IDAuNzIsIGM6IDAuMTEsIGg6IDI0MCB9LCAgICAgICAgICAvLyBjb29sIHVsdHJhbWFyaW5lXG4gICAgcHJvamVjdEhlYWx0aDogeyBsOiAwLjc1LCBjOiAwLjEyLCBoOiA3MCB9LCAgICAgICAvLyB3YXJtIGFtYmVyXG4gICAgY29ubmVjdGlvbjogeyBsOiAwLjc0LCBjOiAwLjA5LCBoOiAxNTUgfSwgICAgICAgICAvLyBzb2Z0IHNhZ2VcbiAgICBhbnRpY2lwYXRpb246IHsgbDogMC43MSwgYzogMC4xMSwgaDogMzIwIH0sICAgICAgIC8vIGdlbnRsZSB2aW9sZXRcbiAgfSxcblxuICAvLyBBdG1vc3BoZXJlIHdlYXRoZXIgbW9kZSB0aW50cyAoc3VidGxlIHdhc2hlcyBvdmVyIGJhY2tncm91bmQpXG4gIGF0bW9zcGhlcmU6IHtcbiAgICBjbGVhcjogeyBsOiAwLjIwLCBjOiAwLjAyMCwgaDogMjYwIH0sXG4gICAgY2xvdWRlZDogeyBsOiAwLjI1LCBjOiAwLjAzMCwgaDogMjUwIH0sXG4gICAgc3Rvcm15OiB7IGw6IDAuMjIsIGM6IDAuMDQwLCBoOiAyODAgfSxcbiAgICB0d2lsaWdodDogeyBsOiAwLjMwLCBjOiAwLjAzNSwgaDogMzAgfSxcbiAgfSxcblxuICAvLyBBdWRpZW5jZSBkaXJlY3Rpb24gKFRPTSB3YXJtdGggZ3JhZGllbnQgXHUyMDE0IDUgc3RhdGVzKVxuICBhdWRpZW5jZToge1xuICAgIGF2YWlsYWJsZTogeyBsOiAwLjc1LCBjOiAwLjA4LCBoOiA2MCB9LCAgICAgICAgICAgLy8gd2FybSBzdGVhZHkgZ2xvd1xuICAgIGludGVycnVwdGlibGU6IHsgbDogMC42MCwgYzogMC4wNSwgaDogNjAgfSwgICAgICAgLy8gZGltbWVyIHdhcm1cbiAgICBmb2N1c2VkOiB7IGw6IDAuNDUsIGM6IDAuMDQsIGg6IDIyMCB9LCAgICAgICAgICAgIC8vIGRpbSBibHVlIChcImluIGZsb3cgZWxzZXdoZXJlXCIpXG4gICAgdW5hdmFpbGFibGU6IHsgbDogMC4yMCwgYzogMC4wMiwgaDogMjYwIH0sICAgICAgICAvLyB2ZXJ5IGRpbVxuICAgIHF1aWV0OiB7IGw6IDAuMTIsIGM6IDAuMDIsIGg6IDI2MCB9LCAgICAgICAgICAgICAgLy8gbmVhci1hYnNlbnRcbiAgfSxcblxuICAvLyBORUVEU19SRVZJRVcgb3JicyBcdTIwMTQgcGFsZSBuZXV0cmFsIHdhcm10aFxuICBuZWVkc1Jldmlld09yYjogeyBsOiAwLjc4LCBjOiAwLjA0LCBoOiA4MCB9LFxufSBhcyBjb25zdDtcblxuLy8gXHUyNTAwXHUyNTAwIERyaXZlIGlkZW50aXR5ICh1c2VkIGFzIGtleXMgYWNyb3NzIHRoZSByZW5kZXJlcikgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXG5cbmV4cG9ydCB0eXBlIERyaXZlSWQgPSAnY3VyaW9zaXR5JyB8ICdwcm9qZWN0SGVhbHRoJyB8ICdjb25uZWN0aW9uJyB8ICdhbnRpY2lwYXRpb24nO1xuXG5leHBvcnQgY29uc3QgRFJJVkVfSURTOiByZWFkb25seSBEcml2ZUlkW10gPSBbXG4gICdjdXJpb3NpdHknLFxuICAncHJvamVjdEhlYWx0aCcsXG4gICdjb25uZWN0aW9uJyxcbiAgJ2FudGljaXBhdGlvbicsXG5dIGFzIGNvbnN0O1xuXG4vLyBcdTI1MDBcdTI1MDAgQ2FyZGluYWwgcG9zaXRpb25zIGZvciB0aGUgcGFudGhlb24gKGNsb2Nrd2lzZSBmcm9tIHRvcC1sZWZ0KSBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcbi8vXG4vLyBJbiBvdXIgdGhyZWUtcXVhcnRlciBwZXJzcGVjdGl2ZTpcbi8vICAgQ3VyaW9zaXR5IFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMCBBbnRpY2lwYXRpb25cbi8vICAgICAgICAgICAgICAgICAgXHUyNTcyICAgICBcdTI1NzFcbi8vICAgICAgICAgICAgICAgICAgIFNUQUdFXG4vLyAgICAgICAgICAgICAgICAgIFx1MjU3MSAgICAgXHUyNTcyXG4vLyAgIENvbm5lY3Rpb24gXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwIFByb2plY3QgSGVhbHRoXG4vL1xuLy8gUG9zaXRpb24gaXMgbm9ybWFsaXplZCB0byBbMC4uMV0gY29vcmRzIGluc2lkZSB0aGUgcGFudGhlb24ncyBib3VuZGluZ1xuLy8gYm94ICh3aGljaCBpdHNlbGYgc2l0cyBpbiB0aGUgdXBwZXIgcGFydCBvZiB0aGUgY2FudmFzIGFib3ZlIHRoZSBzdGFnZSkuXG5cbmV4cG9ydCBjb25zdCBQQU5USEVPTl9QT1NJVElPTlM6IFJlY29yZDxEcml2ZUlkLCB7IG54OiBudW1iZXI7IG55OiBudW1iZXIgfT4gPSB7XG4gIGN1cmlvc2l0eTogICAgIHsgbng6IDAuMTgsIG55OiAwLjQ1IH0sICAgLy8gdXBwZXItbGVmdFxuICBhbnRpY2lwYXRpb246ICB7IG54OiAwLjgyLCBueTogMC40NSB9LCAgIC8vIHVwcGVyLXJpZ2h0XG4gIGNvbm5lY3Rpb246ICAgIHsgbng6IDAuMTgsIG55OiAwLjg1IH0sICAgLy8gbG93ZXItbGVmdFxuICBwcm9qZWN0SGVhbHRoOiB7IG54OiAwLjgyLCBueTogMC44NSB9LCAgIC8vIGxvd2VyLXJpZ2h0XG59O1xuXG4vLyBcdTI1MDBcdTI1MDAgTGF5b3V0IHJhdGlvcyAocmVsYXRpdmUgdG8gY2FudmFzIHNpemUpIFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFx1MjUwMFxuLy9cbi8vIFRocmVlLXF1YXJ0ZXIgcGVyc3BlY3RpdmU6IGltYWdpbmUgbG9va2luZyBkb3duIGF0IGEgdGFibGUgZnJvbSBhYm92ZVxuLy8gYW5kIHNsaWdodGx5IGZvcndhcmQuIEF0bW9zcGhlcmUgaXMgdGhlIGRpc3RhbnQgYmFja2dyb3VuZCwgc3Vic3RyYXRlXG4vLyBpcyB0aGUgZmxvb3IgaW4gdGhlIGZvcmVncm91bmQuXG5cbi8vIExheW91dCB1c2VzIHNlcGFyYXRlIFgvWSBzY2FsaW5nIHNvIHRoZSBjb21wb3NpdGlvbiBmaWxscyB0aGUgY2FudmFzXG4vLyBhdCBhbnkgYXNwZWN0IHJhdGlvLiBXaWR0aC1zY2FsZWQgdmFsdWVzIGdpdmUgaG9yaXpvbnRhbCBwcmVzZW5jZTtcbi8vIGhlaWdodC1zY2FsZWQgdmFsdWVzIGdpdmUgdGhlIGZvcmVzaG9ydGVuZWQgdmVydGljYWwgY2hhcmFjdGVyLlxuLy8gUHJldmlvdXMgdmVyc2lvbiB1c2VkIG1pbih3LCBoKSBmb3IgZXZlcnl0aGluZyB3aGljaCBtYWRlIHRoZVxuLy8gY29tcG9zaXRpb24gZmVlbCBzbWFsbCBvbiB3aWRlIGFzcGVjdCByYXRpb3MuXG5cbmV4cG9ydCBjb25zdCBMQVlPVVQgPSB7XG4gIC8vIFN0YWdlIG9jY3VwaWVzIHRoZSBjZW50cmFsIHJlZ2lvbi4gU2xpZ2h0bHkgYmVsb3cgY2VudGVyIHRvIGxlYXZlXG4gIC8vIHJvb20gZm9yIHRoZSBhdG1vc3BoZXJlIGJhbmQgYWJvdmUgKyB0aGUgYXVkaWVuY2Ugd2FybXRoIGJlbG93LlxuICBzdGFnZToge1xuICAgIGNlbnRlcllSYXRpbzogMC41NCwgICAgICAgICAgICAvLyA1NCUgZG93biBcdTIwMTQgY2xvc2UgdG8gY2VudGVyIGJ1dCBiaWFzZWQgZG93blxuICAgIHJhZGl1c1hSYXRpbzogMC4xMCwgICAgICAgICAgICAvLyAxMCUgb2YgY2FudmFzIFdJRFRIIGZvciBzcG90bGlnaHQgZXh0ZW50XG4gICAgcmFkaXVzWVJhdGlvOiAwLjEwLCAgICAgICAgICAgIC8vIDEwJSBvZiBjYW52YXMgSEVJR0hUIChlbGxpcHNlIGZvcmVzaG9ydGVuaW5nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgZW1lcmdlcyBuYXR1cmFsbHkgZnJvbSBub24tc3F1YXJlIGNhbnZhcylcbiAgfSxcblxuICAvLyBQYW50aGVvbiByaW5nIHNpdHMgT1VUU0lERSB0aGUgc3RhZ2UuIFdpZHRoLXNjYWxlZCBYIHJhZGl1cyBnaXZlc1xuICAvLyBob3Jpem9udGFsIHNwcmVhZDsgaGVpZ2h0LXNjYWxlZCBZIHJhZGl1cyBrZWVwcyB0aGUgZm9yZXNob3J0ZW5lZFxuICAvLyBwZXJzcGVjdGl2ZSBvZiBsb29raW5nIGRvd24gYXQgYSBmbGF0dGVuZWQgcmluZy5cbiAgcGFudGhlb246IHtcbiAgICBjZW50ZXJZUmF0aW86IDAuNTQsXG4gICAgcmluZ1JhZGl1c1hSYXRpbzogMC4yOCwgICAgICAgIC8vIDI4JSBvZiBjYW52YXMgV0lEVEhcbiAgICByaW5nUmFkaXVzWVJhdGlvOiAwLjMyLCAgICAgICAgLy8gMzIlIG9mIGNhbnZhcyBIRUlHSFQgKHRhbGxlciB0aGFuIHdpZGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICBwZXIgdW5pdCwgYnV0IHdpZHRoIGlzIHR5cGljYWxseSBsYXJnZXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICBzbyB0aGUgcmluZyBhcHBlYXJzIHdpZGVyIHRoYW4gdGFsbClcbiAgICBnbHlwaFJhZGl1c1JhdGlvOiAwLjAyNSwgICAgICAgLy8gc21hbGxlciBwZXItZ2x5cGggYmFzZWxpbmU7IGJsb29tIGV4dGVuZHMgfjN4XG4gIH0sXG5cbiAgLy8gQXRtb3NwaGVyZSBmaWxscyB0aGUgdG9wIHBvcnRpb24gb2YgdGhlIGNhbnZhc1xuICBhdG1vc3BoZXJlOiB7XG4gICAgdG9wWVJhdGlvOiAwLjAsXG4gICAgYm90dG9tWVJhdGlvOiAwLjMyLFxuICB9LFxuXG4gIC8vIFN1YnN0cmF0ZSBmaWxscyB0aGUgYm90dG9tIHBvcnRpb25cbiAgc3Vic3RyYXRlOiB7XG4gICAgdG9wWVJhdGlvOiAwLjY4LFxuICAgIGJvdHRvbVlSYXRpbzogMS4wLFxuICB9LFxuXG4gIC8vIEF1ZGllbmNlIHdhcm10aCBcdTIwMTQgYm90dG9tLWVkZ2UgZ2xvdyByZXByZXNlbnRpbmcgVE9NIHByZXNlbmNlXG4gIGF1ZGllbmNlOiB7XG4gICAgY2VudGVyWVJhdGlvOiAwLjk2LFxuICAgIGdsb3dSYWRpdXNYUmF0aW86IDAuNDUsICAgICAgICAvLyB3aWRlIHdhcm10aCBhY3Jvc3MgdGhlIGJvdHRvbS1mcm9udFxuICAgIGdsb3dSYWRpdXNZUmF0aW86IDAuMzAsICAgICAgICAvLyBsZXNzIHRhbGwgKGZvcmVzaG9ydGVuZWQpXG4gIH0sXG59IGFzIGNvbnN0O1xuXG4vLyBcdTI1MDBcdTI1MDAgTW90aW9uIChQaGFzZSAyIGlzIHN0YXRpYzsgdGhlc2UgYXJlIHJlc2VydmVkIGZvciBQaGFzZSA0KSBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcblxuZXhwb3J0IGNvbnN0IE1PVElPTiA9IHtcbiAgYnJlYXRoOiAnY3ViaWMtYmV6aWVyKDAuNDAsIDAuMDAsIDAuNjAsIDEuMDApJyxcbiAgYnJlYXRoUGVyaW9kU2VjOiA4LjAsXG4gIHN0YW5kYXJkOiAnY3ViaWMtYmV6aWVyKDAuNDAsIDAuMDAsIDAuMjAsIDEuMDApJyxcbiAgc3RhbmRhcmREdXJhdGlvblNlYzogMS4yLFxuICBlbGVnYW50OiAnY3ViaWMtYmV6aWVyKDAuMjUsIDAuMTAsIDAuMjUsIDEuMDApJyxcbiAgZWxlZ2FudER1cmF0aW9uU2VjOiAyLjUsXG59IGFzIGNvbnN0O1xuIiwgIi8qKlxuICogdGhlbWUgXHUyMDE0IHJlYWR5LXRvLXVzZSBDU1MgY29sb3Igc3RyaW5ncyBmb3IgdGhlIGluc3RydW1lbnQncyBET00gYW5kXG4gKiBDYW52YXMsIGRlcml2ZWQgZnJvbSB0aGUgT0tMQ0ggdG9rZW5zIHZpYSBjdWxvcmkuXG4gKlxuICogVGhlIGluc3RydW1lbnQgaXMgYSBsZWdpYmxlLCBkYXJrLCByZWZpbmVkIHN1cmZhY2UuIENvbG9ycyBhcmUgdXNlZFxuICogdG8gVFlQRSBldmVudHMgKGVhY2ggZXZlbnQga2luZCBoYXMgYSBodWUpIGFuZCB0byBrZWVwIHRoZSB3aG9sZVxuICogdGhpbmcgY2FsbSBhbmQgcmVhZGFibGUuXG4gKi9cblxuaW1wb3J0IHsgY29udmVydGVyIH0gZnJvbSAnY3Vsb3JpJztcbmltcG9ydCB7IENPTE9SLCB0eXBlIE9rbGNoQ29sb3IgfSBmcm9tICcuL3Rva2Vucyc7XG5cbmNvbnN0IHRvUmdiID0gY29udmVydGVyKCdyZ2InKTtcblxuZnVuY3Rpb24gY3NzKGM6IE9rbGNoQ29sb3IsIGFscGhhID0gMSk6IHN0cmluZyB7XG4gIGNvbnN0IHJnYiA9IHRvUmdiKHsgbW9kZTogJ29rbGNoJywgbDogYy5sLCBjOiBjLmMsIGg6IGMuaCB9KTtcbiAgaWYgKCFyZ2IpIHJldHVybiBhbHBoYSA+PSAxID8gJyMwMDAnIDogJ3JnYmEoMCwwLDAsMCknO1xuICBjb25zdCBSID0gTWF0aC5yb3VuZChNYXRoLm1heCgwLCBNYXRoLm1pbigxLCByZ2IucikpICogMjU1KTtcbiAgY29uc3QgRyA9IE1hdGgucm91bmQoTWF0aC5tYXgoMCwgTWF0aC5taW4oMSwgcmdiLmcpKSAqIDI1NSk7XG4gIGNvbnN0IEIgPSBNYXRoLnJvdW5kKE1hdGgubWF4KDAsIE1hdGgubWluKDEsIHJnYi5iKSkgKiAyNTUpO1xuICByZXR1cm4gYWxwaGEgPj0gMSA/IGByZ2IoJHtSfSwgJHtHfSwgJHtCfSlgIDogYHJnYmEoJHtSfSwgJHtHfSwgJHtCfSwgJHthbHBoYX0pYDtcbn1cblxuZXhwb3J0IGNvbnN0IHRoZW1lID0ge1xuICAvLyBTdXJmYWNlc1xuICBiZzogY3NzKENPTE9SLmJhY2tncm91bmQpLFxuICBiZ1JhaXNlZDogY3NzKHsgbDogMC4xMywgYzogMC4wMjIsIGg6IDI2MCB9KSxcbiAgYmdJbnNldDogY3NzKHsgbDogMC4wNiwgYzogMC4wMiwgaDogMjYwIH0pLFxuICBib3JkZXI6IGNzcyh7IGw6IDAuMjYsIGM6IDAuMDIsIGg6IDI2MCB9LCAwLjYpLFxuICBib3JkZXJGYWludDogY3NzKHsgbDogMC4yNiwgYzogMC4wMiwgaDogMjYwIH0sIDAuMjgpLFxuXG4gIC8vIFRleHRcbiAgdGV4dDogY3NzKENPTE9SLnR5cG9ncmFwaHkpLFxuICB0ZXh0RGltOiBjc3MoQ09MT1IudHlwb2dyYXBoeSwgMC41NSksXG4gIHRleHRGYWludDogY3NzKENPTE9SLnR5cG9ncmFwaHksIDAuMzIpLFxuXG4gIC8vIFRoZSBsdW1pbm91cyBhY2NlbnQgKGNhcmRpb2dyYW0gdHJhY2UsIGFsaXZlIHB1bHNlKVxuICBwdWxzZTogY3NzKENPTE9SLmZvcm1CYXNlKSxcbiAgcHVsc2VHbG93OiBjc3MoQ09MT1IuZm9ybUJhc2UsIDAuNCksXG5cbiAgLy8gRXZlbnQta2luZCBodWVzIFx1MjAxNCBlYWNoIGV2ZW50IHR5cGUgcmVhZHMgYXMgYSBjb2xvciBhdCBhIGdsYW5jZVxuICBraW5kOiB7XG4gICAgdG9vbDogY3NzKENPTE9SLmRyaXZlLnByb2plY3RIZWFsdGgpLCAgICAgICAvLyB3YXJtIGFtYmVyXG4gICAgZXBpc29kZTogY3NzKENPTE9SLmRyaXZlLmN1cmlvc2l0eSksICAgICAgICAvLyBjb29sIGJsdWVcbiAgICBnb2FsOiBjc3MoQ09MT1IuZHJpdmUuY29ubmVjdGlvbiksICAgICAgICAgIC8vIHNhZ2VcbiAgICBzaWduYWw6IGNzcyhDT0xPUi5kcml2ZS5hbnRpY2lwYXRpb24pLCAgICAgIC8vIHZpb2xldFxuICAgIG1haW50ZW5hbmNlOiBjc3MoQ09MT1IudHlwb2dyYXBoeSwgMC40KSwgICAgLy8gZGltIFx1MjAxNCBiYWNrZ3JvdW5kIHVwa2VlcFxuICB9LFxuXG4gIC8vIFN0YXR1cyB0b25lc1xuICBvazogY3NzKHsgbDogMC43NCwgYzogMC4xMCwgaDogMTUwIH0pLCAgICAgICAgIC8vIHN1Y2Nlc3MgZ3JlZW5cbiAgd2FybjogY3NzKHsgbDogMC43MCwgYzogMC4xMywgaDogNjAgfSksICAgICAgICAvLyBjYXV0aW9uIGFtYmVyXG4gIGZhaWw6IGNzcyh7IGw6IDAuNjIsIGM6IDAuMTYsIGg6IDI1IH0pLCAgICAgICAgLy8gZmFpbHVyZSByZWQtb3JhbmdlXG5cbiAgLy8gRHJpdmUgaHVlcyAoZm9yIGFueSBkcml2ZS1zcGVjaWZpYyBVSSBsYXRlcilcbiAgZHJpdmU6IHtcbiAgICBjdXJpb3NpdHk6IGNzcyhDT0xPUi5kcml2ZS5jdXJpb3NpdHkpLFxuICAgIHByb2plY3RIZWFsdGg6IGNzcyhDT0xPUi5kcml2ZS5wcm9qZWN0SGVhbHRoKSxcbiAgICBjb25uZWN0aW9uOiBjc3MoQ09MT1IuZHJpdmUuY29ubmVjdGlvbiksXG4gICAgYW50aWNpcGF0aW9uOiBjc3MoQ09MT1IuZHJpdmUuYW50aWNpcGF0aW9uKSxcbiAgfSxcbn0gYXMgY29uc3Q7XG5cbmV4cG9ydCB0eXBlIEV2ZW50S2luZCA9IGtleW9mIHR5cGVvZiB0aGVtZS5raW5kO1xuIiwgIi8qKlxuICogdXNlRm9ydW1GZWVkIFx1MjAxNCBwb2xscyB0aGUgRm9ydW0gZXZlbnRzIGVuZHBvaW50IGFuZCBtYWludGFpbnMgYVxuICogcm9sbGluZyBidWZmZXIgb2YgcmVjZW50IGV2ZW50cyBwbHVzIHRoZSBsYXRlc3Qgdml0YWxzIGFuZCBmb2N1cy5cbiAqXG4gKiBQb2xscyBldmVyeSBQT0xMX0lOVEVSVkFMX01TLiBFYWNoIHBvbGwgYXNrcyBmb3IgZXZlbnRzIHNpbmNlIHRoZVxuICogbGFzdCBzZXJ2ZXJfdGltZSwgc28gdGhlIGJ1ZmZlciBncm93cyBpbmNyZW1lbnRhbGx5LiBFdmVudHMgb2xkZXJcbiAqIHRoYW4gRVZFTlRfUkVURU5USU9OX1NFQyBhcmUgcHJ1bmVkIHNvIHRoZSBidWZmZXIgc3RheXMgYm91bmRlZC5cbiAqL1xuXG5pbXBvcnQgeyB1c2VFZmZlY3QsIHVzZVJlZiwgdXNlU3RhdGUgfSBmcm9tICcuLi9zZGsnO1xuaW1wb3J0IHR5cGUge1xuICBDb25uZWN0aW9uU3RhdHVzLFxuICBGZWVkUmVzcG9uc2UsXG4gIEZvcnVtRXZlbnQsXG4gIEZvY3VzLFxuICBWaXRhbHMsXG59IGZyb20gJy4vdHlwZXMnO1xuXG5jb25zdCBFVkVOVFNfVVJMID0gJy9hcGkvcGx1Z2lucy9mb3J1bS9ldmVudHMnO1xuY29uc3QgUE9MTF9JTlRFUlZBTF9NUyA9IDE1MDA7XG5jb25zdCBFVkVOVF9SRVRFTlRJT05fU0VDID0gMTgwOyAgICAgICAgLy8ga2VlcCB+MyBtaW4gb2YgZXZlbnRzIGluIHRoZSBidWZmZXJcbmNvbnN0IFNUQUxFX0FGVEVSX01TID0gNjAwMDsgICAgICAgICAgICAvLyBubyBzdWNjZXNzZnVsIHBvbGwgXHUyMTkyIFwic3RhbGVcIlxuXG50eXBlIEZlZWRTdGF0ZSA9IHtcbiAgZXZlbnRzOiBGb3J1bUV2ZW50W107ICAgICAgLy8gYXNjZW5kaW5nIGJ5IHRzXG4gIHZpdGFsczogVml0YWxzIHwgbnVsbDtcbiAgZm9jdXM6IEZvY3VzIHwgbnVsbDtcbiAgc3RhdHVzOiBDb25uZWN0aW9uU3RhdHVzO1xuICBzZXJ2ZXJUaW1lOiBudW1iZXIgfCBudWxsO1xuICBhdGhlbmFSZWFjaGFibGU6IGJvb2xlYW47XG59O1xuXG5leHBvcnQgZnVuY3Rpb24gdXNlRm9ydW1GZWVkKCk6IEZlZWRTdGF0ZSB7XG4gIGNvbnN0IFtldmVudHMsIHNldEV2ZW50c10gPSB1c2VTdGF0ZTxGb3J1bUV2ZW50W10+KFtdKTtcbiAgY29uc3QgW3ZpdGFscywgc2V0Vml0YWxzXSA9IHVzZVN0YXRlPFZpdGFscyB8IG51bGw+KG51bGwpO1xuICBjb25zdCBbZm9jdXMsIHNldEZvY3VzXSA9IHVzZVN0YXRlPEZvY3VzIHwgbnVsbD4obnVsbCk7XG4gIGNvbnN0IFtzdGF0dXMsIHNldFN0YXR1c10gPSB1c2VTdGF0ZTxDb25uZWN0aW9uU3RhdHVzPignaWRsZScpO1xuICBjb25zdCBbc2VydmVyVGltZSwgc2V0U2VydmVyVGltZV0gPSB1c2VTdGF0ZTxudW1iZXIgfCBudWxsPihudWxsKTtcbiAgY29uc3QgW2F0aGVuYVJlYWNoYWJsZSwgc2V0QXRoZW5hUmVhY2hhYmxlXSA9IHVzZVN0YXRlPGJvb2xlYW4+KGZhbHNlKTtcblxuICBjb25zdCBzaW5jZVJlZiA9IHVzZVJlZjxudW1iZXIgfCBudWxsPihudWxsKTtcbiAgY29uc3QgbGFzdE9rUmVmID0gdXNlUmVmPG51bWJlcj4oMCk7XG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICBsZXQgbW91bnRlZCA9IHRydWU7XG4gICAgbGV0IHRpbWVyOiBudW1iZXIgfCBudWxsID0gbnVsbDtcblxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gICAgY29uc3QgU0RLID0gKHdpbmRvdyBhcyBhbnkpLl9fSEVSTUVTX1BMVUdJTl9TREtfXztcblxuICAgIGFzeW5jIGZ1bmN0aW9uIHBvbGwoKSB7XG4gICAgICBpZiAoIW1vdW50ZWQpIHJldHVybjtcbiAgICAgIGlmICh0aW1lciAhPT0gbnVsbCkge1xuICAgICAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgICAgICB0aW1lciA9IG51bGw7XG4gICAgICB9XG4gICAgICAvLyBTa2lwIHRoZSBmZXRjaCB3aGlsZSB0aGUgZGFzaGJvYXJkIHRhYiBpcyBoaWRkZW4gXHUyMDE0IG5vIHBvaW50XG4gICAgICAvLyBwb2xsaW5nIEF0aGVuYSB3aGVuIG5vYm9keSBpcyBsb29raW5nLiBSZXNjaGVkdWxlIHNvIGl0XG4gICAgICAvLyByZXN1bWVzIHdoZW4gdGhlIHRhYiBiZWNvbWVzIHZpc2libGUgYWdhaW4uXG4gICAgICBpZiAoZG9jdW1lbnQuaGlkZGVuKSB7XG4gICAgICAgIHRpbWVyID0gd2luZG93LnNldFRpbWVvdXQocG9sbCwgUE9MTF9JTlRFUlZBTF9NUyk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHNpbmNlID0gc2luY2VSZWYuY3VycmVudDtcbiAgICAgIGNvbnN0IHVybCA9IHNpbmNlICE9PSBudWxsID8gYCR7RVZFTlRTX1VSTH0/c2luY2U9JHtzaW5jZX1gIDogRVZFTlRTX1VSTDtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGRhdGE6IEZlZWRSZXNwb25zZSA9IGF3YWl0IFNESy5mZXRjaEpTT04odXJsKTtcbiAgICAgICAgaWYgKCFtb3VudGVkKSByZXR1cm47XG5cbiAgICAgICAgc2luY2VSZWYuY3VycmVudCA9IGRhdGEuc2VydmVyX3RpbWU7XG4gICAgICAgIGxhc3RPa1JlZi5jdXJyZW50ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgc2V0U2VydmVyVGltZShkYXRhLnNlcnZlcl90aW1lKTtcbiAgICAgICAgLy8gUmV0YWluIGxhc3Qta25vd24gdml0YWxzL2ZvY3VzIHdoZW4gYSBwb2xsIHJldHVybnMgbnVsbFxuICAgICAgICAvLyAoYSB0cmFuc2llbnQgL2hlYWx0aC9kZXRhaWxlZCB0aW1lb3V0KS4gU3RhbGUgZGF0YSBiZWF0c1xuICAgICAgICAvLyBibGFua2luZyB0aGUgcmVhZG91dHMgdG8gXCJcdTIwMTRcIi5cbiAgICAgICAgaWYgKGRhdGEudml0YWxzKSBzZXRWaXRhbHMoZGF0YS52aXRhbHMpO1xuICAgICAgICBpZiAoZGF0YS5mb2N1cykgc2V0Rm9jdXMoZGF0YS5mb2N1cyk7XG4gICAgICAgIHNldEF0aGVuYVJlYWNoYWJsZShkYXRhLmF0aGVuYV9yZWFjaGFibGUpO1xuICAgICAgICBzZXRTdGF0dXMoJ2xpdmUnKTtcblxuICAgICAgICBpZiAoZGF0YS5ldmVudHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgIHNldEV2ZW50cygocHJldikgPT4ge1xuICAgICAgICAgICAgY29uc3QgbWVyZ2VkID0gWy4uLnByZXYsIC4uLmRhdGEuZXZlbnRzXTtcbiAgICAgICAgICAgIGNvbnN0IGN1dG9mZiA9IGRhdGEuc2VydmVyX3RpbWUgLSBFVkVOVF9SRVRFTlRJT05fU0VDO1xuICAgICAgICAgICAgLy8gUHJ1bmUgb2xkLCBrZWVwIGFzY2VuZGluZyBvcmRlci5cbiAgICAgICAgICAgIHJldHVybiBtZXJnZWQuZmlsdGVyKChlKSA9PiBlLnRzID49IGN1dG9mZik7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gU3RpbGwgcHJ1bmUgb24gZW1wdHkgcG9sbHMgc28gdGhlIGJ1ZmZlciBhZ2VzIG91dC5cbiAgICAgICAgICBzZXRFdmVudHMoKHByZXYpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGN1dG9mZiA9IGRhdGEuc2VydmVyX3RpbWUgLSBFVkVOVF9SRVRFTlRJT05fU0VDO1xuICAgICAgICAgICAgcmV0dXJuIHByZXYuZmlsdGVyKChlKSA9PiBlLnRzID49IGN1dG9mZik7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICBpZiAoIW1vdW50ZWQpIHJldHVybjtcbiAgICAgICAgY29uc3Qgc2luY2VMYXN0T2sgPSBEYXRlLm5vdygpIC0gbGFzdE9rUmVmLmN1cnJlbnQ7XG4gICAgICAgIHNldFN0YXR1cyhzaW5jZUxhc3RPayA+IFNUQUxFX0FGVEVSX01TID8gJ2Vycm9yJyA6ICdzdGFsZScpO1xuICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgaWYgKG1vdW50ZWQpIHtcbiAgICAgICAgICB0aW1lciA9IHdpbmRvdy5zZXRUaW1lb3V0KHBvbGwsIFBPTExfSU5URVJWQUxfTVMpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gUmUtcG9sbCBpbW1lZGlhdGVseSB3aGVuIHRoZSB0YWIgYmVjb21lcyB2aXNpYmxlIGFnYWluLlxuICAgIGZ1bmN0aW9uIG9uVmlzaWJsZSgpIHtcbiAgICAgIGlmICghZG9jdW1lbnQuaGlkZGVuICYmIG1vdW50ZWQpIHBvbGwoKTtcbiAgICB9XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndmlzaWJpbGl0eWNoYW5nZScsIG9uVmlzaWJsZSk7XG5cbiAgICBwb2xsKCk7XG5cbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgbW91bnRlZCA9IGZhbHNlO1xuICAgICAgaWYgKHRpbWVyICE9PSBudWxsKSBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigndmlzaWJpbGl0eWNoYW5nZScsIG9uVmlzaWJsZSk7XG4gICAgfTtcbiAgfSwgW10pO1xuXG4gIHJldHVybiB7IGV2ZW50cywgdml0YWxzLCBmb2N1cywgc3RhdHVzLCBzZXJ2ZXJUaW1lLCBhdGhlbmFSZWFjaGFibGUgfTtcbn1cbiIsICIvKipcbiAqIHVzZUludGVycHJldGF0aW9uIFx1MjAxNCBwb2xscyB0aGUgZHVhbCBodW1hbi1yZWFkYWJsZSByZWFkaW5nLlxuICpcbiAqIFRoZSAvaW50ZXJwcmV0IGVuZHBvaW50IGlzIHNsb3cgKExMTSBjYWxscykgYW5kIHNlcnZlci1zaWRlIGNhY2hlZFxuICogfjU1cywgc28gYSA2MHMgcG9sbCBpcyB0aGUgcmlnaHQgY2FkZW5jZS4gRGVjb3VwbGVkIGVudGlyZWx5IGZyb21cbiAqIHRoZSBmYXN0IDEuNXMgZXZlbnQgZmVlZC5cbiAqL1xuXG5pbXBvcnQgeyB1c2VFZmZlY3QsIHVzZVJlZiwgdXNlU3RhdGUgfSBmcm9tICcuLi9zZGsnO1xuaW1wb3J0IHR5cGUgeyBJbnRlcnByZXRhdGlvbiB9IGZyb20gJy4vdHlwZXMnO1xuXG5jb25zdCBJTlRFUlBSRVRfVVJMID0gJy9hcGkvcGx1Z2lucy9mb3J1bS9pbnRlcnByZXQnO1xuY29uc3QgUE9MTF9JTlRFUlZBTF9NUyA9IDYwMDAwO1xuXG5leHBvcnQgZnVuY3Rpb24gdXNlSW50ZXJwcmV0YXRpb24oKToge1xuICBpbnRlcnByZXRhdGlvbjogSW50ZXJwcmV0YXRpb24gfCBudWxsO1xuICBsb2FkaW5nOiBib29sZWFuO1xufSB7XG4gIGNvbnN0IFtpbnRlcnByZXRhdGlvbiwgc2V0SW50ZXJwcmV0YXRpb25dID0gdXNlU3RhdGU8SW50ZXJwcmV0YXRpb24gfCBudWxsPihudWxsKTtcbiAgY29uc3QgW2xvYWRpbmcsIHNldExvYWRpbmddID0gdXNlU3RhdGUodHJ1ZSk7XG4gIGNvbnN0IGZpcnN0UmVmID0gdXNlUmVmKHRydWUpO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgbGV0IG1vdW50ZWQgPSB0cnVlO1xuICAgIGxldCB0aW1lcjogbnVtYmVyIHwgbnVsbCA9IG51bGw7XG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgICBjb25zdCBTREsgPSAod2luZG93IGFzIGFueSkuX19IRVJNRVNfUExVR0lOX1NES19fO1xuXG4gICAgYXN5bmMgZnVuY3Rpb24gcG9sbCgpIHtcbiAgICAgIGlmICghbW91bnRlZCkgcmV0dXJuO1xuICAgICAgaWYgKHRpbWVyICE9PSBudWxsKSB7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aW1lcik7XG4gICAgICAgIHRpbWVyID0gbnVsbDtcbiAgICAgIH1cbiAgICAgIC8vIERvbid0IGJ1cm4gTExNIGNhbGxzIGdlbmVyYXRpbmcgaW50ZXJwcmV0YXRpb25zIG5vYm9keSBpc1xuICAgICAgLy8gbG9va2luZyBhdC4gUmVzY2hlZHVsZSBzbyBpdCByZXN1bWVzIHdoZW4gdGhlIHRhYiBpcyB2aXNpYmxlLlxuICAgICAgaWYgKGRvY3VtZW50LmhpZGRlbikge1xuICAgICAgICB0aW1lciA9IHdpbmRvdy5zZXRUaW1lb3V0KHBvbGwsIFBPTExfSU5URVJWQUxfTVMpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBkYXRhOiBJbnRlcnByZXRhdGlvbiA9IGF3YWl0IFNESy5mZXRjaEpTT04oSU5URVJQUkVUX1VSTCk7XG4gICAgICAgIGlmICghbW91bnRlZCkgcmV0dXJuO1xuICAgICAgICBzZXRJbnRlcnByZXRhdGlvbihkYXRhKTtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICAvLyBrZWVwIGxhc3Qta25vd24gaW50ZXJwcmV0YXRpb24gb24gZmFpbHVyZVxuICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgaWYgKG1vdW50ZWQpIHtcbiAgICAgICAgICBzZXRMb2FkaW5nKGZhbHNlKTtcbiAgICAgICAgICBmaXJzdFJlZi5jdXJyZW50ID0gZmFsc2U7XG4gICAgICAgICAgdGltZXIgPSB3aW5kb3cuc2V0VGltZW91dChwb2xsLCBQT0xMX0lOVEVSVkFMX01TKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG9uVmlzaWJsZSgpIHtcbiAgICAgIGlmICghZG9jdW1lbnQuaGlkZGVuICYmIG1vdW50ZWQpIHBvbGwoKTtcbiAgICB9XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndmlzaWJpbGl0eWNoYW5nZScsIG9uVmlzaWJsZSk7XG5cbiAgICBwb2xsKCk7XG5cbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgbW91bnRlZCA9IGZhbHNlO1xuICAgICAgaWYgKHRpbWVyICE9PSBudWxsKSBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigndmlzaWJpbGl0eWNoYW5nZScsIG9uVmlzaWJsZSk7XG4gICAgfTtcbiAgfSwgW10pO1xuXG4gIHJldHVybiB7IGludGVycHJldGF0aW9uLCBsb2FkaW5nIH07XG59XG4iLCAiLyoqXG4gKiBNYXN0aGVhZCBcdTIwMTQgdGl0bGUgcm93IHdpdGggdGhlIGFsaXZlIGluZGljYXRvciBhbmQgY29nbml0aXZlIHN0ZXAuXG4gKlxuICogVGhlIGFsaXZlIGRvdDogZ3JlZW4gKyBnZW50bHkgcHVsc2luZyB3aGVuIHRoZSBmZWVkIGlzIGxpdmUsIGFtYmVyXG4gKiB3aGVuIHN0YWxlLCByZWQgd2hlbiB0aGUgY29ubmVjdGlvbiBpcyBsb3N0LiBUaGUgc3RlcCBjb3VudGVyIGlzXG4gKiBBdGhlbmEncyBjb2duaXRpdmUgY3ljbGUgY291bnQgXHUyMDE0IGl0IGNsaW1icyBhcyBzaGUgdGhpbmtzLlxuICovXG5cbmltcG9ydCB7IFJlYWN0IH0gZnJvbSAnLi4vc2RrJztcbmltcG9ydCB7IHRoZW1lIH0gZnJvbSAnLi4vZGVzaWduL3RoZW1lJztcbmltcG9ydCB0eXBlIHsgQ29ubmVjdGlvblN0YXR1cyB9IGZyb20gJy4uL2RhdGEvdHlwZXMnO1xuXG5leHBvcnQgdHlwZSBNYXN0aGVhZFByb3BzID0ge1xuICBzdGF0dXM6IENvbm5lY3Rpb25TdGF0dXM7XG4gIGV2ZW50c1Blck1pbjogbnVtYmVyO1xuICBhdGhlbmFSZWFjaGFibGU6IGJvb2xlYW47XG59O1xuXG5leHBvcnQgZnVuY3Rpb24gTWFzdGhlYWQoeyBzdGF0dXMsIGV2ZW50c1Blck1pbiwgYXRoZW5hUmVhY2hhYmxlIH06IE1hc3RoZWFkUHJvcHMpIHtcbiAgY29uc3QgbGl2ZSA9IHN0YXR1cyA9PT0gJ2xpdmUnICYmIGF0aGVuYVJlYWNoYWJsZTtcbiAgY29uc3QgZG90Q29sb3IgPVxuICAgICFhdGhlbmFSZWFjaGFibGUgPyB0aGVtZS5mYWlsIDpcbiAgICBzdGF0dXMgPT09ICdsaXZlJyA/IHRoZW1lLm9rIDpcbiAgICBzdGF0dXMgPT09ICdzdGFsZScgPyB0aGVtZS53YXJuIDpcbiAgICB0aGVtZS5mYWlsO1xuICBjb25zdCBzdGF0ZVdvcmQgPVxuICAgICFhdGhlbmFSZWFjaGFibGUgPyAnYXRoZW5hIG9mZmxpbmUnIDpcbiAgICBzdGF0dXMgPT09ICdsaXZlJyA/ICdhbGl2ZScgOlxuICAgIHN0YXR1cyA9PT0gJ3N0YWxlJyA/ICdyZWNvbm5lY3RpbmcnIDpcbiAgICAnZGlzY29ubmVjdGVkJztcblxuICByZXR1cm4gKFxuICAgIDxkaXZcbiAgICAgIHN0eWxlPXt7XG4gICAgICAgIGRpc3BsYXk6ICdmbGV4JyxcbiAgICAgICAgYWxpZ25JdGVtczogJ2NlbnRlcicsXG4gICAgICAgIGp1c3RpZnlDb250ZW50OiAnc3BhY2UtYmV0d2VlbicsXG4gICAgICAgIHBhZGRpbmc6ICcycHggMnB4IDE0cHgnLFxuICAgICAgfX1cbiAgICA+XG4gICAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4JywgYWxpZ25JdGVtczogJ2Jhc2VsaW5lJywgZ2FwOiAxNCB9fT5cbiAgICAgICAgPHNwYW5cbiAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgZm9udEZhbWlseTogJ0dlb3JnaWEsIFwiVGltZXMgTmV3IFJvbWFuXCIsIHNlcmlmJyxcbiAgICAgICAgICAgIGZvbnRTaXplOiAyMixcbiAgICAgICAgICAgIGxldHRlclNwYWNpbmc6ICcwLjE0ZW0nLFxuICAgICAgICAgICAgY29sb3I6IHRoZW1lLnRleHQsXG4gICAgICAgICAgfX1cbiAgICAgICAgPlxuICAgICAgICAgIEFUSEVOQVxuICAgICAgICA8L3NwYW4+XG4gICAgICAgIDxzcGFuXG4gICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgIGZvbnRTaXplOiAxMSxcbiAgICAgICAgICAgIGxldHRlclNwYWNpbmc6ICcwLjEwZW0nLFxuICAgICAgICAgICAgdGV4dFRyYW5zZm9ybTogJ3VwcGVyY2FzZScsXG4gICAgICAgICAgICBjb2xvcjogdGhlbWUudGV4dEZhaW50LFxuICAgICAgICAgIH19XG4gICAgICAgID5cbiAgICAgICAgICB0aGUgZm9ydW1cbiAgICAgICAgPC9zcGFuPlxuICAgICAgPC9kaXY+XG5cbiAgICAgIDxkaXYgc3R5bGU9e3sgZGlzcGxheTogJ2ZsZXgnLCBhbGlnbkl0ZW1zOiAnY2VudGVyJywgZ2FwOiAxNiB9fT5cbiAgICAgICAgPHNwYW5cbiAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgZm9udEZhbWlseTogJ3VpLW1vbm9zcGFjZSwgU0ZNb25vLVJlZ3VsYXIsIE1lbmxvLCBtb25vc3BhY2UnLFxuICAgICAgICAgICAgZm9udFNpemU6IDEyLFxuICAgICAgICAgICAgY29sb3I6IHRoZW1lLnRleHREaW0sXG4gICAgICAgICAgfX1cbiAgICAgICAgICB0aXRsZT1cImNvZ25pdGl2ZSBldmVudHMgaW4gdGhlIGxhc3QgbWludXRlXCJcbiAgICAgICAgPlxuICAgICAgICAgIHtldmVudHNQZXJNaW59L21pblxuICAgICAgICA8L3NwYW4+XG4gICAgICAgIDxkaXYgc3R5bGU9e3sgZGlzcGxheTogJ2ZsZXgnLCBhbGlnbkl0ZW1zOiAnY2VudGVyJywgZ2FwOiA3IH19PlxuICAgICAgICAgIDxzcGFuXG4gICAgICAgICAgICBjbGFzc05hbWU9e2xpdmUgPyAnZm9ydW0tYWxpdmUtZG90JyA6IHVuZGVmaW5lZH1cbiAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgIHdpZHRoOiA4LFxuICAgICAgICAgICAgICBoZWlnaHQ6IDgsXG4gICAgICAgICAgICAgIGJvcmRlclJhZGl1czogJzUwJScsXG4gICAgICAgICAgICAgIGJhY2tncm91bmQ6IGRvdENvbG9yLFxuICAgICAgICAgICAgICBib3hTaGFkb3c6IGAwIDAgOHB4ICR7ZG90Q29sb3J9YCxcbiAgICAgICAgICAgIH19XG4gICAgICAgICAgLz5cbiAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgZm9udFNpemU6IDExLFxuICAgICAgICAgICAgICBsZXR0ZXJTcGFjaW5nOiAnMC4wOGVtJyxcbiAgICAgICAgICAgICAgdGV4dFRyYW5zZm9ybTogJ3VwcGVyY2FzZScsXG4gICAgICAgICAgICAgIGNvbG9yOiB0aGVtZS50ZXh0RGltLFxuICAgICAgICAgICAgfX1cbiAgICAgICAgICA+XG4gICAgICAgICAgICB7c3RhdGVXb3JkfVxuICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgKTtcbn1cblxudm9pZCBSZWFjdDtcbiIsICIvKipcbiAqIENhcmRpb2dyYW0gXHUyMDE0IHRoZSBoZWFydGJlYXQgdHJhY2UuIFRoZSBoZXJvIGVsZW1lbnQuXG4gKlxuICogQSBob3Jpem9udGFsIGxpbmUsIHNjcm9sbGluZyByaWdodC10by1sZWZ0LCBDYW52YXMtZHJhd24gYXQgZGlzcGxheVxuICogcmVmcmVzaCByYXRlLiBBIGdlbnRsZSBiYXNlbGluZSB3YW5kZXIgbWVhbnMgdGhlIGxpbmUgaXMgYWxpdmUgZXZlblxuICogYXQgcmVzdDsgZWFjaCBBdGhlbmEgZXZlbnQgcHJvZHVjZXMgYSBzcGlrZSAoaGVpZ2h0IGJ5IGV2ZW50IGtpbmQpLlxuICpcbiAqIE9uZSBnbGFuY2UgYW5zd2VycyBcImlzIHNoZSBhbGl2ZSwgYW5kIGhvdyBhY3RpdmVcIjogY2FsbSBmbGF0LWlzaFxuICogbGluZSA9IHJlc3Rpbmc7IGZyZXF1ZW50IHRhbGwgc3Bpa2VzID0gd29ya2luZyBoYXJkLlxuICovXG5cbmltcG9ydCB7IFJlYWN0LCB1c2VFZmZlY3QsIHVzZVJlZiB9IGZyb20gJy4uL3Nkayc7XG5pbXBvcnQgeyB0aGVtZSB9IGZyb20gJy4uL2Rlc2lnbi90aGVtZSc7XG5pbXBvcnQgdHlwZSB7IEZvcnVtRXZlbnQgfSBmcm9tICcuLi9kYXRhL3R5cGVzJztcblxuY29uc3QgV0lORE9XX1NFQyA9IDM4OyAgICAgICAgICAgIC8vIGhvdyBtdWNoIHRpbWUgdGhlIHRyYWNlIHNwYW5zXG5jb25zdCBTUElLRV9IRUlHSFRTOiBSZWNvcmQ8Rm9ydW1FdmVudFsna2luZCddLCBudW1iZXI+ID0ge1xuICBnb2FsOiAxLjAsXG4gIHNpZ25hbDogMC43MixcbiAgdG9vbDogMC41NSxcbiAgZXBpc29kZTogMC40MixcbiAgbWFpbnRlbmFuY2U6IDAuMjYsXG59O1xuXG5leHBvcnQgdHlwZSBDYXJkaW9ncmFtUHJvcHMgPSB7XG4gIGV2ZW50czogRm9ydW1FdmVudFtdO1xuICBzZXJ2ZXJUaW1lOiBudW1iZXIgfCBudWxsO1xufTtcblxuZXhwb3J0IGZ1bmN0aW9uIENhcmRpb2dyYW0oeyBldmVudHMsIHNlcnZlclRpbWUgfTogQ2FyZGlvZ3JhbVByb3BzKSB7XG4gIGNvbnN0IGNhbnZhc1JlZiA9IHVzZVJlZjxIVE1MQ2FudmFzRWxlbWVudCB8IG51bGw+KG51bGwpO1xuICBjb25zdCB3cmFwUmVmID0gdXNlUmVmPEhUTUxEaXZFbGVtZW50IHwgbnVsbD4obnVsbCk7XG5cbiAgLy8gTGF0ZXN0IHByb3BzLCByZWFkYWJsZSBpbnNpZGUgdGhlIFJBRiBsb29wLlxuICBjb25zdCBldmVudHNSZWYgPSB1c2VSZWY8Rm9ydW1FdmVudFtdPihldmVudHMpO1xuICBldmVudHNSZWYuY3VycmVudCA9IGV2ZW50cztcbiAgY29uc3Qgc2VydmVyVGltZVJlZiA9IHVzZVJlZjxudW1iZXIgfCBudWxsPihzZXJ2ZXJUaW1lKTtcbiAgLy8gVHJhY2sgd2hlbiB0aGUgbGF0ZXN0IHNlcnZlclRpbWUgd2FzIHJlY2VpdmVkIHNvIHdlIGNhbiBhZHZhbmNlIGFcbiAgLy8gc21vb3RoIGxvY2FsIGNsb2NrIGJldHdlZW4gMS41cyBwb2xscy5cbiAgY29uc3Qgc2VydmVyUmVjdlJlZiA9IHVzZVJlZjxudW1iZXI+KHBlcmZvcm1hbmNlLm5vdygpKTtcbiAgaWYgKHNlcnZlclRpbWVSZWYuY3VycmVudCAhPT0gc2VydmVyVGltZSkge1xuICAgIHNlcnZlclRpbWVSZWYuY3VycmVudCA9IHNlcnZlclRpbWU7XG4gICAgc2VydmVyUmVjdlJlZi5jdXJyZW50ID0gcGVyZm9ybWFuY2Uubm93KCk7XG4gIH1cblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGNvbnN0IGNhbnZhcyA9IGNhbnZhc1JlZi5jdXJyZW50O1xuICAgIGNvbnN0IHdyYXAgPSB3cmFwUmVmLmN1cnJlbnQ7XG4gICAgaWYgKCFjYW52YXMgfHwgIXdyYXApIHJldHVybjtcbiAgICBjb25zdCBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICBpZiAoIWN0eCkgcmV0dXJuO1xuXG4gICAgbGV0IHJhZiA9IDA7XG4gICAgbGV0IGNzc1cgPSAwO1xuICAgIGxldCBjc3NIID0gMDtcblxuICAgIGZ1bmN0aW9uIHJlc2l6ZSgpIHtcbiAgICAgIGlmICghd3JhcCB8fCAhY2FudmFzIHx8ICFjdHgpIHJldHVybjtcbiAgICAgIGNvbnN0IHJlY3QgPSB3cmFwLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgY29uc3QgZHByID0gd2luZG93LmRldmljZVBpeGVsUmF0aW8gfHwgMTtcbiAgICAgIGNzc1cgPSBNYXRoLm1heCgxLCByZWN0LndpZHRoKTtcbiAgICAgIGNzc0ggPSBNYXRoLm1heCgxLCByZWN0LmhlaWdodCk7XG4gICAgICBjYW52YXMud2lkdGggPSBNYXRoLmZsb29yKGNzc1cgKiBkcHIpO1xuICAgICAgY2FudmFzLmhlaWdodCA9IE1hdGguZmxvb3IoY3NzSCAqIGRwcik7XG4gICAgICBjYW52YXMuc3R5bGUud2lkdGggPSBgJHtjc3NXfXB4YDtcbiAgICAgIGNhbnZhcy5zdHlsZS5oZWlnaHQgPSBgJHtjc3NIfXB4YDtcbiAgICAgIGN0eC5zZXRUcmFuc2Zvcm0oZHByLCAwLCAwLCBkcHIsIDAsIDApO1xuICAgIH1cbiAgICByZXNpemUoKTtcbiAgICBjb25zdCBybyA9IG5ldyBSZXNpemVPYnNlcnZlcihyZXNpemUpO1xuICAgIHJvLm9ic2VydmUod3JhcCk7XG5cbiAgICAvLyBFc3RpbWF0ZWQgXCJub3dcIiBpbiBBdGhlbmEtc2VydmVyIHRpbWUsIGFkdmFuY2luZyBzbW9vdGhseS5cbiAgICBmdW5jdGlvbiBlc3RpbWF0ZWROb3coKTogbnVtYmVyIHtcbiAgICAgIGNvbnN0IHN0ID0gc2VydmVyVGltZVJlZi5jdXJyZW50O1xuICAgICAgaWYgKHN0ID09PSBudWxsKSByZXR1cm4gcGVyZm9ybWFuY2Uubm93KCkgLyAxMDAwO1xuICAgICAgcmV0dXJuIHN0ICsgKHBlcmZvcm1hbmNlLm5vdygpIC0gc2VydmVyUmVjdlJlZi5jdXJyZW50KSAvIDEwMDA7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYmFzZWxpbmUodDogbnVtYmVyKTogbnVtYmVyIHtcbiAgICAgIC8vIEdlbnRsZSBtdWx0aS1mcmVxdWVuY3kgd2FuZGVyIFx1MjAxNCB0aGUgbGluZSBicmVhdGhlcyBhdCByZXN0LlxuICAgICAgcmV0dXJuIChcbiAgICAgICAgMC4wNTUgKiBNYXRoLnNpbih0ICogMC43MCkgK1xuICAgICAgICAwLjAzNSAqIE1hdGguc2luKHQgKiAxLjczICsgMS4wKSArXG4gICAgICAgIDAuMDI1ICogTWF0aC5zaW4odCAqIDAuMzEgKyAyLjApXG4gICAgICApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGV2ZW50Q29udHJpYnV0aW9uKHQ6IG51bWJlcik6IG51bWJlciB7XG4gICAgICAvLyBTdW0gc3Bpa2UgY29udHJpYnV0aW9ucyBmcm9tIGV2ZXJ5IGV2ZW50IG5lYXIgdGltZSB0LlxuICAgICAgbGV0IGFtcCA9IDA7XG4gICAgICBjb25zdCBldnMgPSBldmVudHNSZWYuY3VycmVudDtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZXZzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGUgPSBldnNbaV07XG4gICAgICAgIGNvbnN0IGR0ID0gdCAtIGUudHM7XG4gICAgICAgIC8vIFNwaWtlIGxpdmVzIHJvdWdobHkgZHQgXHUyMjA4IFstMC40LCAyLjBdOyBza2lwIGZhciBldmVudHMuXG4gICAgICAgIGlmIChkdCA8IC0wLjUgfHwgZHQgPiAyLjQpIGNvbnRpbnVlO1xuICAgICAgICBjb25zdCBoID0gU1BJS0VfSEVJR0hUU1tlLmtpbmRdO1xuICAgICAgICAvLyBBc3ltbWV0cmljOiBhIG5hcnJvdyBwZWFrIGp1c3QgYWZ0ZXIgdGhlIGV2ZW50LCBzaG9ydCB0YWlsLlxuICAgICAgICBjb25zdCBwZWFrID0gTWF0aC5leHAoLU1hdGgucG93KChkdCAtIDAuMTQpIC8gMC4yMCwgMikpO1xuICAgICAgICBjb25zdCB0YWlsID0gZHQgPiAwLjM0ID8gMC4zMiAqIE1hdGguZXhwKC0oZHQgLSAwLjM0KSAqIDIuNikgOiAwO1xuICAgICAgICBhbXAgKz0gaCAqIChwZWFrICsgdGFpbCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gYW1wO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGZyYW1lKCkge1xuICAgICAgaWYgKCFjdHgpIHJldHVybjtcbiAgICAgIGN0eC5jbGVhclJlY3QoMCwgMCwgY3NzVywgY3NzSCk7XG5cbiAgICAgIGNvbnN0IG5vdyA9IGVzdGltYXRlZE5vdygpO1xuICAgICAgY29uc3QgcHhQZXJTZWMgPSBjc3NXIC8gV0lORE9XX1NFQztcbiAgICAgIGNvbnN0IG1pZFkgPSBjc3NIICogMC42MjsgICAgICAgICAgICAvLyBiYXNlbGluZSBzaXRzIGEgYml0IGxvd1xuICAgICAgY29uc3QgYW1wU2NhbGUgPSBjc3NIICogMC40MDsgICAgICAgIC8vIHZlcnRpY2FsIHNjYWxlIGZvciBzcGlrZXNcblxuICAgICAgLy8gQnVpbGQgdGhlIHRyYWNlIHBvbHlsaW5lLlxuICAgICAgY29uc3QgcHRzOiBbbnVtYmVyLCBudW1iZXJdW10gPSBbXTtcbiAgICAgIGZvciAobGV0IHggPSAwOyB4IDw9IGNzc1c7IHggKz0gMikge1xuICAgICAgICBjb25zdCB0ID0gbm93IC0gKGNzc1cgLSB4KSAvIHB4UGVyU2VjO1xuICAgICAgICBjb25zdCBhID0gYmFzZWxpbmUodCkgKyBldmVudENvbnRyaWJ1dGlvbih0KTtcbiAgICAgICAgLy8gU3Bpa2VzIGdvIFVQIChuZWdhdGl2ZSB5KS4gQ2xhbXAgc28gYnVyc3RzIGRvbid0IGZseSBvZmYuXG4gICAgICAgIGNvbnN0IHkgPSBtaWRZIC0gTWF0aC5taW4oYSwgMi40KSAqIGFtcFNjYWxlO1xuICAgICAgICBwdHMucHVzaChbeCwgeV0pO1xuICAgICAgfVxuXG4gICAgICAvLyBHbG93IHBhc3MgXHUyMDE0IHNvZnQsIGxvdyBhbHBoYS4gS2VwdCBtb2Rlc3Qgc28gdGhlIGxpbmUgcmVhZHNcbiAgICAgIC8vIGNyaXNwIHJhdGhlciB0aGFuIGZ1enp5LlxuICAgICAgY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgcHRzLmZvckVhY2goKFt4LCB5XSwgaSkgPT4gKGkgPyBjdHgubGluZVRvKHgsIHkpIDogY3R4Lm1vdmVUbyh4LCB5KSkpO1xuICAgICAgY3R4LnN0cm9rZVN0eWxlID0gdGhlbWUucHVsc2VHbG93O1xuICAgICAgY3R4LmxpbmVXaWR0aCA9IDQuNTtcbiAgICAgIGN0eC5saW5lSm9pbiA9ICdyb3VuZCc7XG4gICAgICBjdHgubGluZUNhcCA9ICdyb3VuZCc7XG4gICAgICBjdHguc3Ryb2tlKCk7XG5cbiAgICAgIC8vIFNoYXJwIHBhc3MgXHUyMDE0IHRoaW4sIGJyaWdodCwgY3Jpc3AuXG4gICAgICBjdHguYmVnaW5QYXRoKCk7XG4gICAgICBwdHMuZm9yRWFjaCgoW3gsIHldLCBpKSA9PiAoaSA/IGN0eC5saW5lVG8oeCwgeSkgOiBjdHgubW92ZVRvKHgsIHkpKSk7XG4gICAgICBjdHguc3Ryb2tlU3R5bGUgPSB0aGVtZS5wdWxzZTtcbiAgICAgIGN0eC5saW5lV2lkdGggPSAxLjI1O1xuICAgICAgY3R4LmxpbmVKb2luID0gJ3JvdW5kJztcbiAgICAgIGN0eC5saW5lQ2FwID0gJ3JvdW5kJztcbiAgICAgIGN0eC5zdHJva2UoKTtcblxuICAgICAgLy8gXCJOb3dcIiBkb3QgYXQgdGhlIHJpZ2h0IGVkZ2UuXG4gICAgICBjb25zdCBsYXN0ID0gcHRzW3B0cy5sZW5ndGggLSAxXTtcbiAgICAgIGlmIChsYXN0KSB7XG4gICAgICAgIGN0eC5iZWdpblBhdGgoKTtcbiAgICAgICAgY3R4LmFyYyhsYXN0WzBdLCBsYXN0WzFdLCAzLjQsIDAsIE1hdGguUEkgKiAyKTtcbiAgICAgICAgY3R4LmZpbGxTdHlsZSA9IHRoZW1lLnB1bHNlO1xuICAgICAgICBjdHguZmlsbCgpO1xuICAgICAgICBjdHguYmVnaW5QYXRoKCk7XG4gICAgICAgIGN0eC5hcmMobGFzdFswXSwgbGFzdFsxXSwgOCwgMCwgTWF0aC5QSSAqIDIpO1xuICAgICAgICBjdHguZmlsbFN0eWxlID0gdGhlbWUucHVsc2VHbG93O1xuICAgICAgICBjdHguZmlsbCgpO1xuICAgICAgfVxuXG4gICAgICByYWYgPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZnJhbWUpO1xuICAgIH1cbiAgICByYWYgPSByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZnJhbWUpO1xuXG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIGNhbmNlbEFuaW1hdGlvbkZyYW1lKHJhZik7XG4gICAgICByby5kaXNjb25uZWN0KCk7XG4gICAgfTtcbiAgfSwgW10pO1xuXG4gIHJldHVybiAoXG4gICAgPGRpdlxuICAgICAgcmVmPXt3cmFwUmVmfVxuICAgICAgc3R5bGU9e3sgcG9zaXRpb246ICdyZWxhdGl2ZScsIHdpZHRoOiAnMTAwJScsIGhlaWdodDogJzEwMCUnIH19XG4gICAgPlxuICAgICAgPGNhbnZhcyByZWY9e2NhbnZhc1JlZn0gc3R5bGU9e3sgZGlzcGxheTogJ2Jsb2NrJywgd2lkdGg6ICcxMDAlJywgaGVpZ2h0OiAnMTAwJScgfX0gLz5cbiAgICA8L2Rpdj5cbiAgKTtcbn1cblxudm9pZCBSZWFjdDtcbiIsICIvKipcbiAqIFJlYWRpbmcgXHUyMDE0IHRoZSBkdWFsIGh1bWFuLXJlYWRhYmxlIGludGVycHJldGF0aW9uLlxuICpcbiAqIFR3byB2YW50YWdlIHBvaW50cyBvbiB0aGUgc2FtZSBtb21lbnQsIHNpZGUgYnkgc2lkZTpcbiAqICAgLSBJbnN0cnVtZW50IHJlYWQgOiBhbiBvYmplY3RpdmUgZGlhZ25vc3RpYyBpbnRlcnByZXRhdGlvbiBvZiB0aGVcbiAqICAgICAgICAgICAgICAgICAgICAgICB0ZWxlbWV0cnkgKGdyb3VuZGVkIGluIHRoZSBldmVudCByb3dzKVxuICogICAtIEF0aGVuYSdzIHZvaWNlICA6IGhlciBvd24gc2VsZi1yZXBvcnQsIGNvbmRlbnNlZFxuICpcbiAqIFJlYWRpbmcgYm90aCwgZGl2ZXJnZW5jZSBiZXR3ZWVuIHRoZW0gaXMgaXRzZWxmIGEgc2lnbmFsIFx1MjAxNCB3aGVuIHRoZVxuICogaW5zdHJ1bWVudCBzYXlzIFwic3R1Y2tcIiBhbmQgQXRoZW5hIHNheXMgXCJtYWtpbmcgcHJvZ3Jlc3MsXCIgdGhhdCBnYXBcbiAqIGlzIHdvcnRoIG5vdGljaW5nLlxuICovXG5cbmltcG9ydCB7IFJlYWN0IH0gZnJvbSAnLi4vc2RrJztcbmltcG9ydCB7IHRoZW1lIH0gZnJvbSAnLi4vZGVzaWduL3RoZW1lJztcbmltcG9ydCB0eXBlIHsgSW50ZXJwcmV0YXRpb24gfSBmcm9tICcuLi9kYXRhL3R5cGVzJztcblxuZnVuY3Rpb24gYWdvKHRzOiBudW1iZXIsIG5vdzogbnVtYmVyKTogc3RyaW5nIHtcbiAgY29uc3QgcyA9IE1hdGgubWF4KDAsIE1hdGguZmxvb3Iobm93IC0gdHMpKTtcbiAgaWYgKHMgPCA1KSByZXR1cm4gJ2p1c3Qgbm93JztcbiAgaWYgKHMgPCA2MCkgcmV0dXJuIGAke3N9cyBhZ29gO1xuICBpZiAocyA8IDM2MDApIHJldHVybiBgJHtNYXRoLmZsb29yKHMgLyA2MCl9bSBhZ29gO1xuICByZXR1cm4gYCR7TWF0aC5mbG9vcihzIC8gMzYwMCl9aCBhZ29gO1xufVxuXG5mdW5jdGlvbiBDb2x1bW5MYWJlbCh7IGNoaWxkcmVuLCBjb2xvciB9OiB7IGNoaWxkcmVuOiBSZWFjdC5SZWFjdE5vZGU7IGNvbG9yOiBzdHJpbmcgfSkge1xuICByZXR1cm4gKFxuICAgIDxkaXYgc3R5bGU9e3sgZGlzcGxheTogJ2ZsZXgnLCBhbGlnbkl0ZW1zOiAnY2VudGVyJywgZ2FwOiA3LCBtYXJnaW5Cb3R0b206IDggfX0+XG4gICAgICA8c3BhbiBzdHlsZT17eyB3aWR0aDogMywgaGVpZ2h0OiAxMSwgYmFja2dyb3VuZDogY29sb3IsIGJvcmRlclJhZGl1czogMiB9fSAvPlxuICAgICAgPHNwYW5cbiAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICBmb250RmFtaWx5OiAndWktbW9ub3NwYWNlLCBTRk1vbm8tUmVndWxhciwgTWVubG8sIG1vbm9zcGFjZScsXG4gICAgICAgICAgZm9udFNpemU6IDEwLFxuICAgICAgICAgIGxldHRlclNwYWNpbmc6ICcwLjEzZW0nLFxuICAgICAgICAgIHRleHRUcmFuc2Zvcm06ICd1cHBlcmNhc2UnLFxuICAgICAgICAgIGNvbG9yOiB0aGVtZS50ZXh0RGltLFxuICAgICAgICB9fVxuICAgICAgPlxuICAgICAgICB7Y2hpbGRyZW59XG4gICAgICA8L3NwYW4+XG4gICAgPC9kaXY+XG4gICk7XG59XG5cbmV4cG9ydCB0eXBlIFJlYWRpbmdQcm9wcyA9IHtcbiAgaW50ZXJwcmV0YXRpb246IEludGVycHJldGF0aW9uIHwgbnVsbDtcbiAgbG9hZGluZzogYm9vbGVhbjtcbiAgbm93OiBudW1iZXI7XG59O1xuXG5leHBvcnQgZnVuY3Rpb24gUmVhZGluZyh7IGludGVycHJldGF0aW9uLCBsb2FkaW5nLCBub3cgfTogUmVhZGluZ1Byb3BzKSB7XG4gIGNvbnN0IGluc3RydW1lbnQgPSBpbnRlcnByZXRhdGlvbj8uaW5zdHJ1bWVudDtcbiAgY29uc3QgYXRoZW5hID0gaW50ZXJwcmV0YXRpb24/LmF0aGVuYTtcblxuICBjb25zdCBwbGFjZWhvbGRlciA9ICh0ZXh0OiBzdHJpbmcpID0+IChcbiAgICA8c3BhbiBzdHlsZT17eyBmb250U2l6ZTogMTMsIGNvbG9yOiB0aGVtZS50ZXh0RmFpbnQsIGZvbnRTdHlsZTogJ2l0YWxpYycgfX0+XG4gICAgICB7dGV4dH1cbiAgICA8L3NwYW4+XG4gICk7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4JywgZmxleERpcmVjdGlvbjogJ2NvbHVtbicsIGdhcDogOCB9fT5cbiAgICAgIDxkaXYgc3R5bGU9e3sgZGlzcGxheTogJ2dyaWQnLCBncmlkVGVtcGxhdGVDb2x1bW5zOiAnMWZyIDFmcicsIGdhcDogMjggfX0+XG4gICAgICAgIHsvKiBJbnN0cnVtZW50IHJlYWQgXHUyMDE0IG9iamVjdGl2ZSAqL31cbiAgICAgICAgPGRpdj5cbiAgICAgICAgICA8Q29sdW1uTGFiZWwgY29sb3I9e3RoZW1lLnB1bHNlfT5pbnN0cnVtZW50IHJlYWQ8L0NvbHVtbkxhYmVsPlxuICAgICAgICAgIHtpbnN0cnVtZW50ID8gKFxuICAgICAgICAgICAgPHBcbiAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICBtYXJnaW46IDAsXG4gICAgICAgICAgICAgICAgZm9udEZhbWlseTogJ0dlb3JnaWEsIFwiVGltZXMgTmV3IFJvbWFuXCIsIHNlcmlmJyxcbiAgICAgICAgICAgICAgICBmb250U2l6ZTogMTQuNSxcbiAgICAgICAgICAgICAgICBsaW5lSGVpZ2h0OiAxLjU1LFxuICAgICAgICAgICAgICAgIGNvbG9yOiB0aGVtZS50ZXh0LFxuICAgICAgICAgICAgICAgIHRleHRUcmFuc2Zvcm06ICdub25lJyxcbiAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAge2luc3RydW1lbnR9XG4gICAgICAgICAgICA8L3A+XG4gICAgICAgICAgKSA6IChcbiAgICAgICAgICAgIHBsYWNlaG9sZGVyKGxvYWRpbmcgPyAncmVhZGluZyB0aGUgdGVsZW1ldHJ5XHUyMDI2JyA6ICdpbnRlcnByZXRhdGlvbiB1bmF2YWlsYWJsZScpXG4gICAgICAgICAgKX1cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgey8qIEF0aGVuYSdzIHZvaWNlIFx1MjAxNCBzZWxmLXJlcG9ydCAqL31cbiAgICAgICAgPGRpdiBzdHlsZT17eyBib3JkZXJMZWZ0OiBgMXB4IHNvbGlkICR7dGhlbWUuYm9yZGVyRmFpbnR9YCwgcGFkZGluZ0xlZnQ6IDI4IH19PlxuICAgICAgICAgIDxDb2x1bW5MYWJlbCBjb2xvcj17dGhlbWUua2luZC5zaWduYWx9PmF0aGVuYSdzIHZvaWNlPC9Db2x1bW5MYWJlbD5cbiAgICAgICAgICB7YXRoZW5hID8gKFxuICAgICAgICAgICAgPHBcbiAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICBtYXJnaW46IDAsXG4gICAgICAgICAgICAgICAgZm9udEZhbWlseTogJ0dlb3JnaWEsIFwiVGltZXMgTmV3IFJvbWFuXCIsIHNlcmlmJyxcbiAgICAgICAgICAgICAgICBmb250U3R5bGU6ICdpdGFsaWMnLFxuICAgICAgICAgICAgICAgIGZvbnRTaXplOiAxNC41LFxuICAgICAgICAgICAgICAgIGxpbmVIZWlnaHQ6IDEuNTUsXG4gICAgICAgICAgICAgICAgY29sb3I6IHRoZW1lLnRleHREaW0sXG4gICAgICAgICAgICAgICAgdGV4dFRyYW5zZm9ybTogJ25vbmUnLFxuICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICB7YXRoZW5hfVxuICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICkgOiAoXG4gICAgICAgICAgICBwbGFjZWhvbGRlcihsb2FkaW5nID8gJ2Fza2luZyBBdGhlbmFcdTIwMjYnIDogJ3NlbGYtcmVwb3J0IHVuYXZhaWxhYmxlJylcbiAgICAgICAgICApfVxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuXG4gICAgICB7aW50ZXJwcmV0YXRpb24gJiYgKFxuICAgICAgICA8ZGl2XG4gICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgIGZvbnRGYW1pbHk6ICd1aS1tb25vc3BhY2UsIFNGTW9uby1SZWd1bGFyLCBNZW5sbywgbW9ub3NwYWNlJyxcbiAgICAgICAgICAgIGZvbnRTaXplOiAxMCxcbiAgICAgICAgICAgIGNvbG9yOiB0aGVtZS50ZXh0RmFpbnQsXG4gICAgICAgICAgfX1cbiAgICAgICAgPlxuICAgICAgICAgIGludGVycHJldGVkIHthZ28oaW50ZXJwcmV0YXRpb24uZ2VuZXJhdGVkX2F0LCBub3cpfSBcdTAwQjcge2ludGVycHJldGF0aW9uLm1vZGVsfVxuICAgICAgICA8L2Rpdj5cbiAgICAgICl9XG4gICAgPC9kaXY+XG4gICk7XG59XG5cbnZvaWQgUmVhY3Q7XG4iLCAiLyoqXG4gKiBDdXJyZW50Rm9jdXMgXHUyMDE0IHRoZSBcIk5PV1wiIHpvbmUuIFdoYXQgZ29hbCBBdGhlbmEgaXMgcHVyc3VpbmcgYW5kIHdoYXRcbiAqIHRvb2wgc2hlIGxhc3QgcmVhY2hlZCBmb3IuIFRoZSBtb3N0IGRpcmVjdCBhbnN3ZXIgdG8gXCJ3aGF0IGlzIHNoZVxuICogZG9pbmcgcmlnaHQgbm93LlwiXG4gKi9cblxuaW1wb3J0IHsgUmVhY3QgfSBmcm9tICcuLi9zZGsnO1xuaW1wb3J0IHsgdGhlbWUgfSBmcm9tICcuLi9kZXNpZ24vdGhlbWUnO1xuaW1wb3J0IHR5cGUgeyBGb2N1cyB9IGZyb20gJy4uL2RhdGEvdHlwZXMnO1xuXG5leHBvcnQgdHlwZSBDdXJyZW50Rm9jdXNQcm9wcyA9IHtcbiAgZm9jdXM6IEZvY3VzIHwgbnVsbDtcbiAgbm93OiBudW1iZXI7XG59O1xuXG5mdW5jdGlvbiBhZ28odHM6IG51bWJlciwgbm93OiBudW1iZXIpOiBzdHJpbmcge1xuICBjb25zdCBzID0gTWF0aC5tYXgoMCwgTWF0aC5mbG9vcihub3cgLSB0cykpO1xuICBpZiAocyA8IDIpIHJldHVybiAnanVzdCBub3cnO1xuICBpZiAocyA8IDYwKSByZXR1cm4gYCR7c31zIGFnb2A7XG4gIGlmIChzIDwgMzYwMCkgcmV0dXJuIGAke01hdGguZmxvb3IocyAvIDYwKX1tIGFnb2A7XG4gIHJldHVybiBgJHtNYXRoLmZsb29yKHMgLyAzNjAwKX1oIGFnb2A7XG59XG5cbmZ1bmN0aW9uIExhYmVsKHsgY2hpbGRyZW4gfTogeyBjaGlsZHJlbjogUmVhY3QuUmVhY3ROb2RlIH0pIHtcbiAgcmV0dXJuIChcbiAgICA8c3BhblxuICAgICAgc3R5bGU9e3tcbiAgICAgICAgZm9udEZhbWlseTogJ3VpLW1vbm9zcGFjZSwgU0ZNb25vLVJlZ3VsYXIsIE1lbmxvLCBtb25vc3BhY2UnLFxuICAgICAgICBmb250U2l6ZTogMTAsXG4gICAgICAgIGxldHRlclNwYWNpbmc6ICcwLjEyZW0nLFxuICAgICAgICB0ZXh0VHJhbnNmb3JtOiAndXBwZXJjYXNlJyxcbiAgICAgICAgY29sb3I6IHRoZW1lLnRleHRGYWludCxcbiAgICAgIH19XG4gICAgPlxuICAgICAge2NoaWxkcmVufVxuICAgIDwvc3Bhbj5cbiAgKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIEN1cnJlbnRGb2N1cyh7IGZvY3VzLCBub3cgfTogQ3VycmVudEZvY3VzUHJvcHMpIHtcbiAgY29uc3QgZ29hbCA9IGZvY3VzPy5nb2FsID8/IG51bGw7XG4gIGNvbnN0IHRvb2wgPSBmb2N1cz8ubGFzdF90b29sID8/IG51bGw7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4JywgZmxleERpcmVjdGlvbjogJ2NvbHVtbicsIGdhcDogMTAgfX0+XG4gICAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4JywgZmxleERpcmVjdGlvbjogJ2NvbHVtbicsIGdhcDogNiB9fT5cbiAgICAgICAgPExhYmVsPnB1cnN1aW5nPC9MYWJlbD5cbiAgICAgICAge2dvYWwgPyAoXG4gICAgICAgICAgPD5cbiAgICAgICAgICAgIHsvKiBGcmVlLWZsb3dpbmcgYmxvY2sgXHUyMDE0IHdyYXBzIHRvIGFzIG1hbnkgbGluZXMgYXMgbmVlZGVkLiAqL31cbiAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICBmb250RmFtaWx5OiAnR2VvcmdpYSwgXCJUaW1lcyBOZXcgUm9tYW5cIiwgc2VyaWYnLFxuICAgICAgICAgICAgICAgIGZvbnRTaXplOiAxNixcbiAgICAgICAgICAgICAgICBsaW5lSGVpZ2h0OiAxLjQ1LFxuICAgICAgICAgICAgICAgIGNvbG9yOiB0aGVtZS50ZXh0LFxuICAgICAgICAgICAgICAgIHRleHRUcmFuc2Zvcm06ICdub25lJyxcbiAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAge2dvYWwuY29udGVudCB8fCAnKHVudGl0bGVkIGdvYWwpJ31cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICBmb250U2l6ZTogMTAsXG4gICAgICAgICAgICAgICAgbGV0dGVyU3BhY2luZzogJzAuMDllbScsXG4gICAgICAgICAgICAgICAgdGV4dFRyYW5zZm9ybTogJ3VwcGVyY2FzZScsXG4gICAgICAgICAgICAgICAgY29sb3I6IHRoZW1lLnRleHREaW0sXG4gICAgICAgICAgICAgIH19XG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgIHtnb2FsLnN0YXR1c31cbiAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICA8Lz5cbiAgICAgICAgKSA6IChcbiAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgZm9udFNpemU6IDE0LFxuICAgICAgICAgICAgICBjb2xvcjogdGhlbWUudGV4dERpbSxcbiAgICAgICAgICAgICAgZm9udFN0eWxlOiAnaXRhbGljJyxcbiAgICAgICAgICAgICAgdGV4dFRyYW5zZm9ybTogJ25vbmUnLFxuICAgICAgICAgICAgfX1cbiAgICAgICAgICA+XG4gICAgICAgICAgICBubyBhY3RpdmUgZ29hbCBcdTIwMTQgYXNzb2NpYXRpdmUgZHJpZnRcbiAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICl9XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGRpdiBzdHlsZT17eyBkaXNwbGF5OiAnZmxleCcsIGZsZXhEaXJlY3Rpb246ICdjb2x1bW4nLCBnYXA6IDQgfX0+XG4gICAgICAgIDxMYWJlbD5sYXN0IHRvb2w8L0xhYmVsPlxuICAgICAgICB7dG9vbCA/IChcbiAgICAgICAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4JywgYWxpZ25JdGVtczogJ2Jhc2VsaW5lJywgZ2FwOiA4IH19PlxuICAgICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICBmb250RmFtaWx5OiAndWktbW9ub3NwYWNlLCBTRk1vbm8tUmVndWxhciwgTWVubG8sIG1vbm9zcGFjZScsXG4gICAgICAgICAgICAgICAgZm9udFNpemU6IDEzLFxuICAgICAgICAgICAgICAgIGNvbG9yOiB0aGVtZS50ZXh0LFxuICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICB7dG9vbC50b29sfVxuICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgPHNwYW4gc3R5bGU9e3sgY29sb3I6IHRvb2wuc3VjY2VzcyA/IHRoZW1lLm9rIDogdGhlbWUuZmFpbCwgZm9udFNpemU6IDEzIH19PlxuICAgICAgICAgICAgICB7dG9vbC5zdWNjZXNzID8gJ1x1MjcxMycgOiAnXHUyNzE3J31cbiAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgIHt0b29sLmxhdGVuY3lfbXMgIT0gbnVsbCAmJiAoXG4gICAgICAgICAgICAgIDxzcGFuIHN0eWxlPXt7IGZvbnRTaXplOiAxMiwgY29sb3I6IHRoZW1lLnRleHREaW0gfX0+XG4gICAgICAgICAgICAgICAgeyh0b29sLmxhdGVuY3lfbXMgLyAxMDAwKS50b0ZpeGVkKDEpfXNcbiAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgKX1cbiAgICAgICAgICAgIDxzcGFuIHN0eWxlPXt7IGZvbnRTaXplOiAxMSwgY29sb3I6IHRoZW1lLnRleHRGYWludCB9fT5cbiAgICAgICAgICAgICAge2Fnbyh0b29sLnRzLCBub3cpfVxuICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApIDogKFxuICAgICAgICAgIDxzcGFuIHN0eWxlPXt7IGZvbnRTaXplOiAxMywgY29sb3I6IHRoZW1lLnRleHREaW0sIGZvbnRTdHlsZTogJ2l0YWxpYycgfX0+XG4gICAgICAgICAgICBubyB0b29sIGNhbGxzIHlldFxuICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgKX1cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuICApO1xufVxuXG52b2lkIFJlYWN0O1xuIiwgIi8qKlxuICogVml0YWxzIFx1MjAxNCBhIGNvbXBhY3Qgcm93IG9mIGxpdmUgcmVhZG91dHM6IHdvcmtpbmctbWVtb3J5IGxvYWQsXG4gKiBjb25maWRlbmNlLCBhY3RpdmUgZ29hbHMsIGFzc29jaWF0aXZlIG1lbW9yeSBzaXplLlxuICpcbiAqIFdNIGxvYWQgYW5kIGNvbmZpZGVuY2UgZ2V0IGEgdGhpbiBiYXIgc28gdGhlaXIgbGV2ZWwgcmVhZHMgYXQgYVxuICogZ2xhbmNlOyBjb3VudHMgYXJlIHBsYWluIG51bWJlcnMuXG4gKi9cblxuaW1wb3J0IHsgUmVhY3QgfSBmcm9tICcuLi9zZGsnO1xuaW1wb3J0IHsgdGhlbWUgfSBmcm9tICcuLi9kZXNpZ24vdGhlbWUnO1xuaW1wb3J0IHR5cGUgeyBWaXRhbHMgYXMgVml0YWxzRGF0YSB9IGZyb20gJy4uL2RhdGEvdHlwZXMnO1xuXG5mdW5jdGlvbiBjb21wYWN0KG46IG51bWJlciB8IG51bGwgfCB1bmRlZmluZWQpOiBzdHJpbmcge1xuICBpZiAobiA9PSBudWxsKSByZXR1cm4gJ1x1MjAxNCc7XG4gIGlmIChuID49IDFfMDAwXzAwMCkgcmV0dXJuIGAkeyhuIC8gMV8wMDBfMDAwKS50b0ZpeGVkKDEpfU1gO1xuICBpZiAobiA+PSAxXzAwMCkgcmV0dXJuIGAkeyhuIC8gMV8wMDApLnRvRml4ZWQoMSl9a2A7XG4gIHJldHVybiBTdHJpbmcobik7XG59XG5cbmZ1bmN0aW9uIFN0YXQoe1xuICBsYWJlbCxcbiAgdmFsdWUsXG4gIGJhcixcbiAgYmFyQ29sb3IsXG59OiB7XG4gIGxhYmVsOiBzdHJpbmc7XG4gIHZhbHVlOiBzdHJpbmc7XG4gIGJhcj86IG51bWJlciB8IG51bGw7XG4gIGJhckNvbG9yPzogc3RyaW5nO1xufSkge1xuICByZXR1cm4gKFxuICAgIDxkaXYgc3R5bGU9e3sgZGlzcGxheTogJ2ZsZXgnLCBmbGV4RGlyZWN0aW9uOiAnY29sdW1uJywgZ2FwOiA1LCBtaW5XaWR0aDogOTIgfX0+XG4gICAgICA8c3BhblxuICAgICAgICBzdHlsZT17e1xuICAgICAgICAgIGZvbnRGYW1pbHk6ICd1aS1tb25vc3BhY2UsIFNGTW9uby1SZWd1bGFyLCBNZW5sbywgbW9ub3NwYWNlJyxcbiAgICAgICAgICBmb250U2l6ZTogOS41LFxuICAgICAgICAgIGxldHRlclNwYWNpbmc6ICcwLjExZW0nLFxuICAgICAgICAgIHRleHRUcmFuc2Zvcm06ICd1cHBlcmNhc2UnLFxuICAgICAgICAgIGNvbG9yOiB0aGVtZS50ZXh0RmFpbnQsXG4gICAgICAgIH19XG4gICAgICA+XG4gICAgICAgIHtsYWJlbH1cbiAgICAgIDwvc3Bhbj5cbiAgICAgIDxzcGFuXG4gICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgZm9udEZhbWlseTogJ3VpLW1vbm9zcGFjZSwgU0ZNb25vLVJlZ3VsYXIsIE1lbmxvLCBtb25vc3BhY2UnLFxuICAgICAgICAgIGZvbnRTaXplOiAxNSxcbiAgICAgICAgICBjb2xvcjogdGhlbWUudGV4dCxcbiAgICAgICAgfX1cbiAgICAgID5cbiAgICAgICAge3ZhbHVlfVxuICAgICAgPC9zcGFuPlxuICAgICAge2JhciAhPSBudWxsICYmIChcbiAgICAgICAgPHNwYW5cbiAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgcG9zaXRpb246ICdyZWxhdGl2ZScsXG4gICAgICAgICAgICB3aWR0aDogNjQsXG4gICAgICAgICAgICBoZWlnaHQ6IDIsXG4gICAgICAgICAgICBiYWNrZ3JvdW5kOiB0aGVtZS5ib3JkZXJGYWludCxcbiAgICAgICAgICAgIGJvcmRlclJhZGl1czogMSxcbiAgICAgICAgICAgIG92ZXJmbG93OiAnaGlkZGVuJyxcbiAgICAgICAgICB9fVxuICAgICAgICA+XG4gICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxuICAgICAgICAgICAgICBsZWZ0OiAwLFxuICAgICAgICAgICAgICB0b3A6IDAsXG4gICAgICAgICAgICAgIGJvdHRvbTogMCxcbiAgICAgICAgICAgICAgd2lkdGg6IGAke01hdGgubWF4KDAsIE1hdGgubWluKDEsIGJhcikpICogMTAwfSVgLFxuICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiBiYXJDb2xvciA/PyB0aGVtZS5wdWxzZSxcbiAgICAgICAgICAgIH19XG4gICAgICAgICAgLz5cbiAgICAgICAgPC9zcGFuPlxuICAgICAgKX1cbiAgICA8L2Rpdj5cbiAgKTtcbn1cblxuZXhwb3J0IHR5cGUgVml0YWxzUHJvcHMgPSB7XG4gIHZpdGFsczogVml0YWxzRGF0YSB8IG51bGw7XG59O1xuXG5leHBvcnQgZnVuY3Rpb24gVml0YWxzKHsgdml0YWxzIH06IFZpdGFsc1Byb3BzKSB7XG4gIGNvbnN0IHdtID0gdml0YWxzPy53bV9sb2FkID8/IG51bGw7XG4gIGNvbnN0IGNvbmYgPSB2aXRhbHM/LmNvbmZpZGVuY2UgPz8gbnVsbDtcblxuICByZXR1cm4gKFxuICAgIDxkaXZcbiAgICAgIHN0eWxlPXt7XG4gICAgICAgIGRpc3BsYXk6ICdncmlkJyxcbiAgICAgICAgZ3JpZFRlbXBsYXRlQ29sdW1uczogJ3JlcGVhdCgzLCAxZnIpJyxcbiAgICAgICAgZ2FwOiAnMjBweCAxNnB4JyxcbiAgICAgIH19XG4gICAgPlxuICAgICAgPFN0YXRcbiAgICAgICAgbGFiZWw9XCJ3bSBsb2FkXCJcbiAgICAgICAgdmFsdWU9e3dtICE9IG51bGwgPyB3bS50b0ZpeGVkKDIpIDogJ1x1MjAxNCd9XG4gICAgICAgIGJhcj17d219XG4gICAgICAgIGJhckNvbG9yPXt0aGVtZS5raW5kLnNpZ25hbH1cbiAgICAgIC8+XG4gICAgICA8U3RhdFxuICAgICAgICBsYWJlbD1cImNvbmZpZGVuY2VcIlxuICAgICAgICB2YWx1ZT17Y29uZiAhPSBudWxsID8gY29uZi50b0ZpeGVkKDIpIDogJ1x1MjAxNCd9XG4gICAgICAgIGJhcj17Y29uZn1cbiAgICAgICAgYmFyQ29sb3I9e3RoZW1lLm9rfVxuICAgICAgLz5cbiAgICAgIDxTdGF0IGxhYmVsPVwiZ29hbHNcIiB2YWx1ZT17Y29tcGFjdCh2aXRhbHM/LmdvYWxfY291bnQpfSAvPlxuICAgICAgPFN0YXQgbGFiZWw9XCJtZW1vcnlcIiB2YWx1ZT17Y29tcGFjdCh2aXRhbHM/LmFzc29jX25vZGVzKX0gLz5cbiAgICAgIDxTdGF0IGxhYmVsPVwibGlua3NcIiB2YWx1ZT17Y29tcGFjdCh2aXRhbHM/LmFzc29jX2VkZ2VzKX0gLz5cbiAgICA8L2Rpdj5cbiAgKTtcbn1cblxudm9pZCBSZWFjdDtcbiIsICIvKipcbiAqIEV2ZW50U3RyZWFtIFx1MjAxNCB0aGUgbGVnaWJsZSBmZWVkIG9mIEF0aGVuYSdzIGFjdGl2aXR5LlxuICpcbiAqIE5ld2VzdCBldmVudCBvbiB0b3AuIEVhY2ggcm93IGlzIHR5cGVkIChhIGNvbG9yZWQgYWNjZW50IGJhciBieVxuICoga2luZCksIGxhYmVsZWQsIGFuZCB0aW1lc3RhbXBlZC4gRGV0YWlsIHRleHQgaXMgYnVpbHQgZnJvbSBjb2xvcmVkXG4gKiBzZWdtZW50cyBzbyB0b29sIHN1Y2Nlc3MvZmFpbHVyZSBhbmQgZ29hbCBsaWZlY3ljbGUgcmVhZCBpbnN0YW50bHkuXG4gKi9cblxuaW1wb3J0IHsgUmVhY3QgfSBmcm9tICcuLi9zZGsnO1xuaW1wb3J0IHsgdGhlbWUgfSBmcm9tICcuLi9kZXNpZ24vdGhlbWUnO1xuaW1wb3J0IHR5cGUgeyBGb3J1bUV2ZW50IH0gZnJvbSAnLi4vZGF0YS90eXBlcyc7XG5cbmNvbnN0IE1BWF9ST1dTID0gNDQ7XG5cbmZ1bmN0aW9uIGFnZUxhYmVsKHRzOiBudW1iZXIsIG5vdzogbnVtYmVyKTogc3RyaW5nIHtcbiAgY29uc3QgcyA9IE1hdGgubWF4KDAsIE1hdGguZmxvb3Iobm93IC0gdHMpKTtcbiAgaWYgKHMgPCAyKSByZXR1cm4gJ25vdyc7XG4gIGlmIChzIDwgNjApIHJldHVybiBgJHtzfXNgO1xuICBpZiAocyA8IDM2MDApIHJldHVybiBgJHtNYXRoLmZsb29yKHMgLyA2MCl9bWA7XG4gIHJldHVybiBgJHtNYXRoLmZsb29yKHMgLyAzNjAwKX1oYDtcbn1cblxudHlwZSBTZWdtZW50ID0geyB0ZXh0OiBzdHJpbmc7IGNvbG9yPzogc3RyaW5nOyBtb25vPzogYm9vbGVhbiB9O1xudHlwZSBEZXNjcmliZWQgPSB7IGxhYmVsOiBzdHJpbmc7IGFjY2VudDogc3RyaW5nOyBzZWdtZW50czogU2VnbWVudFtdOyBkaW0/OiBib29sZWFuIH07XG5cbmNvbnN0IEdPQUxfU1RBVFVTX1RPTkU6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7XG4gIGNvbXBsZXRlZDogdGhlbWUub2ssXG4gIGFjdGl2ZTogdGhlbWUudGV4dCxcbiAgc3VzcGVuZGVkOiB0aGVtZS50ZXh0RGltLFxuICBhYmFuZG9uZWQ6IHRoZW1lLmZhaWwsXG4gIG5lZWRzX3JldmlldzogdGhlbWUud2Fybixcbn07XG5cbi8qKlxuICogU3RhYmxlIHBlci1ldmVudCBrZXkuIEluZGV4LWJhc2VkIGtleXMgbWFkZSBldmVyeSByb3cgcmVtb3VudCAoYW5kXG4gKiByZS1hbmltYXRlKSB3aGVuZXZlciBhIG5ldyBldmVudCBwcmVwZW5kZWQ7IGEgY29udGVudC1kZXJpdmVkIGtleVxuICogbWVhbnMgb25seSBnZW51aW5lbHktbmV3IHJvd3MgbW91bnQgYW5kIHBsYXkgdGhlIGVudHJ5IGFuaW1hdGlvbi5cbiAqL1xuZnVuY3Rpb24gZXZlbnRLZXkoZTogRm9ydW1FdmVudCk6IHN0cmluZyB7XG4gIGNvbnN0IHRzID0gZS50cy50b0ZpeGVkKDMpO1xuICBzd2l0Y2ggKGUua2luZCkge1xuICAgIGNhc2UgJ3Rvb2wnOiByZXR1cm4gYHQ6JHt0c306JHtlLnRvb2x9YDtcbiAgICBjYXNlICdlcGlzb2RlJzogcmV0dXJuIGBlOiR7dHN9OiR7ZS50ZXh0LnNsaWNlKDAsIDI4KX1gO1xuICAgIGNhc2UgJ2dvYWwnOiByZXR1cm4gYGc6JHt0c306JHtlLmdvYWxfaWQgPz8gZS50ZXh0LnNsaWNlKDAsIDIwKX1gO1xuICAgIGNhc2UgJ3NpZ25hbCc6IHJldHVybiBgczoke3RzfToke2Uuc2lnbmFsfWA7XG4gICAgY2FzZSAnbWFpbnRlbmFuY2UnOiByZXR1cm4gYG06JHt0c306JHtlLmhhbmRsZXJ9YDtcbiAgfVxufVxuXG5mdW5jdGlvbiBkZXNjcmliZShlOiBGb3J1bUV2ZW50KTogRGVzY3JpYmVkIHtcbiAgc3dpdGNoIChlLmtpbmQpIHtcbiAgICBjYXNlICd0b29sJzoge1xuICAgICAgY29uc3QgbGF0ID0gZS5sYXRlbmN5X21zICE9IG51bGwgPyBgJHsoZS5sYXRlbmN5X21zIC8gMTAwMCkudG9GaXhlZCgxKX1zYCA6ICcnO1xuICAgICAgY29uc3QgdG9uZSA9IGUuc3VjY2VzcyA/IHRoZW1lLm9rIDogdGhlbWUuZmFpbDtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGxhYmVsOiAndG9vbCcsXG4gICAgICAgIGFjY2VudDogdG9uZSxcbiAgICAgICAgc2VnbWVudHM6IFtcbiAgICAgICAgICB7IHRleHQ6IGUudG9vbCwgbW9ubzogdHJ1ZSB9LFxuICAgICAgICAgIHsgdGV4dDogZS5zdWNjZXNzID8gJ1x1MjcxMycgOiAnXHUyNzE3JywgY29sb3I6IHRvbmUgfSxcbiAgICAgICAgICAuLi4obGF0ID8gW3sgdGV4dDogbGF0LCBjb2xvcjogdGhlbWUudGV4dERpbSwgbW9ubzogdHJ1ZSB9XSA6IFtdKSxcbiAgICAgICAgXSxcbiAgICAgIH07XG4gICAgfVxuICAgIGNhc2UgJ2VwaXNvZGUnOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGFiZWw6ICdtZW1vcnknLFxuICAgICAgICBhY2NlbnQ6IHRoZW1lLmtpbmQuZXBpc29kZSxcbiAgICAgICAgc2VnbWVudHM6IFt7IHRleHQ6IGUudGV4dCB8fCAnKGVwaXNvZGUgZm9ybWVkKScgfV0sXG4gICAgICB9O1xuICAgIGNhc2UgJ2dvYWwnOiB7XG4gICAgICBjb25zdCB0b25lID0gR09BTF9TVEFUVVNfVE9ORVtlLnN0YXR1c10gPz8gdGhlbWUudGV4dDtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGxhYmVsOiAnZ29hbCcsXG4gICAgICAgIGFjY2VudDogdGhlbWUua2luZC5nb2FsLFxuICAgICAgICBzZWdtZW50czogW1xuICAgICAgICAgIHsgdGV4dDogZS5zdGF0dXMsIGNvbG9yOiB0b25lLCBtb25vOiB0cnVlIH0sXG4gICAgICAgICAgeyB0ZXh0OiBlLnRleHQgfHwgJyhnb2FsKScsIGNvbG9yOiB0aGVtZS50ZXh0RGltIH0sXG4gICAgICAgIF0sXG4gICAgICB9O1xuICAgIH1cbiAgICBjYXNlICdzaWduYWwnOlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGFiZWw6ICdzaWduYWwnLFxuICAgICAgICBhY2NlbnQ6IHRoZW1lLmtpbmQuc2lnbmFsLFxuICAgICAgICBzZWdtZW50czogW1xuICAgICAgICAgIHsgdGV4dDogZS5zaWduYWwgfHwgJyhzaWduYWwpJywgbW9ubzogdHJ1ZSB9LFxuICAgICAgICAgIC4uLihlLmNvbnRleHQgPyBbeyB0ZXh0OiBlLmNvbnRleHQsIGNvbG9yOiB0aGVtZS50ZXh0RGltIH1dIDogW10pLFxuICAgICAgICBdLFxuICAgICAgfTtcbiAgICBjYXNlICdtYWludGVuYW5jZSc6XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsYWJlbDogJ3Vwa2VlcCcsXG4gICAgICAgIGFjY2VudDogdGhlbWUua2luZC5tYWludGVuYW5jZSxcbiAgICAgICAgZGltOiB0cnVlLFxuICAgICAgICBzZWdtZW50czogW3sgdGV4dDogZS5oYW5kbGVyLCBjb2xvcjogdGhlbWUudGV4dERpbSwgbW9ubzogdHJ1ZSB9XSxcbiAgICAgIH07XG4gIH1cbn1cblxuZXhwb3J0IHR5cGUgRXZlbnRTdHJlYW1Qcm9wcyA9IHtcbiAgZXZlbnRzOiBGb3J1bUV2ZW50W107XG4gIG5vdzogbnVtYmVyO1xufTtcblxuZXhwb3J0IGZ1bmN0aW9uIEV2ZW50U3RyZWFtKHsgZXZlbnRzLCBub3cgfTogRXZlbnRTdHJlYW1Qcm9wcykge1xuICBjb25zdCByb3dzID0gZXZlbnRzLnNsaWNlKC1NQVhfUk9XUykucmV2ZXJzZSgpO1xuXG4gIGlmIChyb3dzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IHN0eWxlPXt7IHBhZGRpbmc6ICcyNHB4IDRweCcsIGNvbG9yOiB0aGVtZS50ZXh0RmFpbnQsIGZvbnRTaXplOiAxMyB9fT5cbiAgICAgICAgV2FpdGluZyBmb3IgYWN0aXZpdHlcdTIwMjZcbiAgICAgIDwvZGl2PlxuICAgICk7XG4gIH1cblxuICByZXR1cm4gKFxuICAgIDxkaXYgc3R5bGU9e3sgZGlzcGxheTogJ2ZsZXgnLCBmbGV4RGlyZWN0aW9uOiAnY29sdW1uJyB9fT5cbiAgICAgIHtyb3dzLm1hcCgoZSkgPT4ge1xuICAgICAgICBjb25zdCBkID0gZGVzY3JpYmUoZSk7XG4gICAgICAgIGNvbnN0IGZ1bGxUZXh0ID0gZC5zZWdtZW50cy5tYXAoKHMpID0+IHMudGV4dCkuam9pbignICcpO1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgIGtleT17ZXZlbnRLZXkoZSl9XG4gICAgICAgICAgICBjbGFzc05hbWU9XCJmb3J1bS1yb3cgZm9ydW0tcm93LWluXCJcbiAgICAgICAgICAgIHRpdGxlPXtgJHtkLmxhYmVsfSBcdTAwQjcgJHtmdWxsVGV4dH1gfVxuICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgZGlzcGxheTogJ2ZsZXgnLFxuICAgICAgICAgICAgICBhbGlnbkl0ZW1zOiAnYmFzZWxpbmUnLFxuICAgICAgICAgICAgICBnYXA6IDEwLFxuICAgICAgICAgICAgICBwYWRkaW5nOiAnNnB4IDZweCA2cHggMCcsXG4gICAgICAgICAgICAgIGJvcmRlckJvdHRvbTogYDFweCBzb2xpZCAke3RoZW1lLmJvcmRlckZhaW50fWAsXG4gICAgICAgICAgICAgIG9wYWNpdHk6IGQuZGltID8gMC42IDogMSxcbiAgICAgICAgICAgIH19XG4gICAgICAgICAgPlxuICAgICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICBmbGV4OiAnMCAwIGF1dG8nLFxuICAgICAgICAgICAgICAgIHdpZHRoOiAzLFxuICAgICAgICAgICAgICAgIGFsaWduU2VsZjogJ3N0cmV0Y2gnLFxuICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6IGQuYWNjZW50LFxuICAgICAgICAgICAgICAgIGJvcmRlclJhZGl1czogMixcbiAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgIC8+XG4gICAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgIGZsZXg6ICcwIDAgNTZweCcsXG4gICAgICAgICAgICAgICAgZm9udEZhbWlseTogJ3VpLW1vbm9zcGFjZSwgU0ZNb25vLVJlZ3VsYXIsIE1lbmxvLCBtb25vc3BhY2UnLFxuICAgICAgICAgICAgICAgIGZvbnRTaXplOiAxMCxcbiAgICAgICAgICAgICAgICBsZXR0ZXJTcGFjaW5nOiAnMC4wOWVtJyxcbiAgICAgICAgICAgICAgICB0ZXh0VHJhbnNmb3JtOiAndXBwZXJjYXNlJyxcbiAgICAgICAgICAgICAgICBjb2xvcjogdGhlbWUudGV4dERpbSxcbiAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAge2QubGFiZWx9XG4gICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICA8c3BhblxuICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgIGZsZXg6ICcxIDEgYXV0bycsXG4gICAgICAgICAgICAgICAgbWluV2lkdGg6IDAsXG4gICAgICAgICAgICAgICAgZm9udFNpemU6IDEzLFxuICAgICAgICAgICAgICAgIGNvbG9yOiB0aGVtZS50ZXh0LFxuICAgICAgICAgICAgICAgIHRleHRUcmFuc2Zvcm06ICdub25lJyxcbiAgICAgICAgICAgICAgICB3aGl0ZVNwYWNlOiAnbm93cmFwJyxcbiAgICAgICAgICAgICAgICBvdmVyZmxvdzogJ2hpZGRlbicsXG4gICAgICAgICAgICAgICAgdGV4dE92ZXJmbG93OiAnZWxsaXBzaXMnLFxuICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICB7ZC5zZWdtZW50cy5tYXAoKHMsIHNpKSA9PiAoXG4gICAgICAgICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgICAgICAgIGtleT17c2l9XG4gICAgICAgICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICAgICAgICBjb2xvcjogcy5jb2xvciA/PyB0aGVtZS50ZXh0LFxuICAgICAgICAgICAgICAgICAgICBmb250RmFtaWx5OiBzLm1vbm9cbiAgICAgICAgICAgICAgICAgICAgICA/ICd1aS1tb25vc3BhY2UsIFNGTW9uby1SZWd1bGFyLCBNZW5sbywgbW9ub3NwYWNlJ1xuICAgICAgICAgICAgICAgICAgICAgIDogJ2luaGVyaXQnLFxuICAgICAgICAgICAgICAgICAgICBtYXJnaW5SaWdodDogNyxcbiAgICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAge3MudGV4dH1cbiAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgPHNwYW5cbiAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICBmbGV4OiAnMCAwIGF1dG8nLFxuICAgICAgICAgICAgICAgIGZvbnRGYW1pbHk6ICd1aS1tb25vc3BhY2UsIFNGTW9uby1SZWd1bGFyLCBNZW5sbywgbW9ub3NwYWNlJyxcbiAgICAgICAgICAgICAgICBmb250U2l6ZTogMTEsXG4gICAgICAgICAgICAgICAgY29sb3I6IHRoZW1lLnRleHRGYWludCxcbiAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAge2FnZUxhYmVsKGUudHMsIG5vdyl9XG4gICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICk7XG4gICAgICB9KX1cbiAgICA8L2Rpdj5cbiAgKTtcbn1cblxudm9pZCBSZWFjdDtcbiIsICIvKipcbiAqIEZvcnVtIFx1MjAxNCB0aGUgbGl2aW5nIGluc3RydW1lbnQuXG4gKlxuICogQSBsZWdpYmxlIHJlYWwtdGltZSB2aWV3IG9mIEF0aGVuYSdzIGNvZ25pdGlvbi4gRm91ciB6b25lczpcbiAqICAgLSBNYXN0aGVhZCAgICAgXHUyMDE0IHRpdGxlLCBhbGl2ZSBpbmRpY2F0b3IsIGNvZ25pdGl2ZSBzdGVwXG4gKiAgIC0gQ2FyZGlvZ3JhbSAgIFx1MjAxNCB0aGUgaGVhcnRiZWF0IHRyYWNlIChoZXJvIGVsZW1lbnQpXG4gKiAgIC0gTk9XICAgICAgICAgIFx1MjAxNCBjdXJyZW50IGdvYWwgKyBsYXN0IHRvb2wgKyB2aXRhbHNcbiAqICAgLSBTVFJFQU0gICAgICAgXHUyMDE0IHRoZSBzY3JvbGxpbmcgZmVlZCBvZiB0eXBlZCBhY3Rpdml0eSBldmVudHNcbiAqXG4gKiBEYXRhOiBhIDEuNXMgcG9sbCBvZiAvYXBpL3BsdWdpbnMvZm9ydW0vZXZlbnRzLCB3aGljaCB0YWlscyBBdGhlbmEnc1xuICogcmVhbCBldmVudCB0YWJsZXMuIE5vIGFic3RyYWN0IGVuY29kaW5nIFx1MjAxNCBldmVyeXRoaW5nIGlzIHNob3duLlxuICovXG5cbmltcG9ydCB7IFJlYWN0LCB1c2VFZmZlY3QsIHVzZVJlZiwgdXNlU3RhdGUgfSBmcm9tICcuL3Nkayc7XG5pbXBvcnQgeyB0aGVtZSB9IGZyb20gJy4vZGVzaWduL3RoZW1lJztcbmltcG9ydCB7IHVzZUZvcnVtRmVlZCB9IGZyb20gJy4vZGF0YS91c2VGb3J1bUZlZWQnO1xuaW1wb3J0IHsgdXNlSW50ZXJwcmV0YXRpb24gfSBmcm9tICcuL2RhdGEvdXNlSW50ZXJwcmV0YXRpb24nO1xuaW1wb3J0IHsgTWFzdGhlYWQgfSBmcm9tICcuL2luc3RydW1lbnQvTWFzdGhlYWQnO1xuaW1wb3J0IHsgQ2FyZGlvZ3JhbSB9IGZyb20gJy4vaW5zdHJ1bWVudC9DYXJkaW9ncmFtJztcbmltcG9ydCB7IFJlYWRpbmcgfSBmcm9tICcuL2luc3RydW1lbnQvUmVhZGluZyc7XG5pbXBvcnQgeyBDdXJyZW50Rm9jdXMgfSBmcm9tICcuL2luc3RydW1lbnQvQ3VycmVudEZvY3VzJztcbmltcG9ydCB7IFZpdGFscyB9IGZyb20gJy4vaW5zdHJ1bWVudC9WaXRhbHMnO1xuaW1wb3J0IHsgRXZlbnRTdHJlYW0gfSBmcm9tICcuL2luc3RydW1lbnQvRXZlbnRTdHJlYW0nO1xuXG5jb25zdCBTVFlMRSA9IGBcbkBrZXlmcmFtZXMgZm9ydW0tcm93LWluIHtcbiAgZnJvbSB7IG9wYWNpdHk6IDA7IHRyYW5zZm9ybTogdHJhbnNsYXRlWSgtNnB4KTsgfVxuICB0byAgIHsgb3BhY2l0eTogMTsgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKDApOyB9XG59XG4uZm9ydW0tcm93LWluIHsgYW5pbWF0aW9uOiBmb3J1bS1yb3ctaW4gMzYwbXMgY3ViaWMtYmV6aWVyKDAsMCwwLjIsMSk7IH1cbi5mb3J1bS1yb3cgeyB0cmFuc2l0aW9uOiBiYWNrZ3JvdW5kLWNvbG9yIDEyMG1zIGVhc2U7IH1cbi5mb3J1bS1yb3c6aG92ZXIgeyBiYWNrZ3JvdW5kLWNvbG9yOiAke3RoZW1lLmJnUmFpc2VkfTsgfVxuQGtleWZyYW1lcyBmb3J1bS1hbGl2ZSB7XG4gIDAlLCAxMDAlIHsgb3BhY2l0eTogMTsgICB0cmFuc2Zvcm06IHNjYWxlKDEpOyB9XG4gIDUwJSAgICAgIHsgb3BhY2l0eTogMC40NTsgdHJhbnNmb3JtOiBzY2FsZSgwLjgyKTsgfVxufVxuLmZvcnVtLWFsaXZlLWRvdCB7IGFuaW1hdGlvbjogZm9ydW0tYWxpdmUgMi42cyBlYXNlLWluLW91dCBpbmZpbml0ZTsgfVxuLmZvcnVtLXNjcm9sbDo6LXdlYmtpdC1zY3JvbGxiYXIgeyB3aWR0aDogN3B4OyB9XG4uZm9ydW0tc2Nyb2xsOjotd2Via2l0LXNjcm9sbGJhci10aHVtYiB7XG4gIGJhY2tncm91bmQ6ICR7dGhlbWUuYm9yZGVyfTsgYm9yZGVyLXJhZGl1czogNHB4O1xufVxuLmZvcnVtLXNjcm9sbDo6LXdlYmtpdC1zY3JvbGxiYXItdHJhY2sgeyBiYWNrZ3JvdW5kOiB0cmFuc3BhcmVudDsgfVxuYDtcblxuZnVuY3Rpb24gWm9uZUxhYmVsKHsgY2hpbGRyZW4gfTogeyBjaGlsZHJlbjogUmVhY3QuUmVhY3ROb2RlIH0pIHtcbiAgcmV0dXJuIChcbiAgICA8ZGl2XG4gICAgICBzdHlsZT17e1xuICAgICAgICBmb250RmFtaWx5OiAndWktbW9ub3NwYWNlLCBTRk1vbm8tUmVndWxhciwgTWVubG8sIG1vbm9zcGFjZScsXG4gICAgICAgIGZvbnRTaXplOiAxMCxcbiAgICAgICAgbGV0dGVyU3BhY2luZzogJzAuMTZlbScsXG4gICAgICAgIHRleHRUcmFuc2Zvcm06ICd1cHBlcmNhc2UnLFxuICAgICAgICBjb2xvcjogdGhlbWUudGV4dEZhaW50LFxuICAgICAgICBtYXJnaW5Cb3R0b206IDEyLFxuICAgICAgfX1cbiAgICA+XG4gICAgICB7Y2hpbGRyZW59XG4gICAgPC9kaXY+XG4gICk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBGb3J1bSgpIHtcbiAgY29uc3QgZmVlZCA9IHVzZUZvcnVtRmVlZCgpO1xuICBjb25zdCB7IGludGVycHJldGF0aW9uLCBsb2FkaW5nOiBpbnRlcnBMb2FkaW5nIH0gPSB1c2VJbnRlcnByZXRhdGlvbigpO1xuICBjb25zdCBbLCBzZXRUaWNrXSA9IHVzZVN0YXRlKDApO1xuXG4gIC8vIFRyYWNrIHdoZW4gdGhlIGxhdGVzdCBzZXJ2ZXJUaW1lIGFycml2ZWQgc28gYWdlIGxhYmVscyBjYW4gYWR2YW5jZVxuICAvLyBzbW9vdGhseSBiZXR3ZWVuIDEuNXMgcG9sbHMuXG4gIGNvbnN0IHNlcnZlclJlZiA9IHVzZVJlZjx7IHQ6IG51bWJlcjsgcmVjdjogbnVtYmVyIH0gfCBudWxsPihudWxsKTtcbiAgaWYgKGZlZWQuc2VydmVyVGltZSAhPSBudWxsICYmIHNlcnZlclJlZi5jdXJyZW50Py50ICE9PSBmZWVkLnNlcnZlclRpbWUpIHtcbiAgICBzZXJ2ZXJSZWYuY3VycmVudCA9IHsgdDogZmVlZC5zZXJ2ZXJUaW1lLCByZWN2OiBEYXRlLm5vdygpIH07XG4gIH1cblxuICAvLyAxcyB0aWNrZXIgc28gXCIxMnMgYWdvXCIgbGFiZWxzIGNvdW50IHVwLlxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGNvbnN0IGkgPSB3aW5kb3cuc2V0SW50ZXJ2YWwoKCkgPT4gc2V0VGljaygobjogbnVtYmVyKSA9PiBuICsgMSksIDEwMDApO1xuICAgIHJldHVybiAoKSA9PiBjbGVhckludGVydmFsKGkpO1xuICB9LCBbXSk7XG5cbiAgY29uc3QgZGlzcGxheU5vdyA9IHNlcnZlclJlZi5jdXJyZW50XG4gICAgPyBzZXJ2ZXJSZWYuY3VycmVudC50ICsgKERhdGUubm93KCkgLSBzZXJ2ZXJSZWYuY3VycmVudC5yZWN2KSAvIDEwMDBcbiAgICA6IERhdGUubm93KCkgLyAxMDAwO1xuXG4gIC8vIFJvbGxpbmcgZXZlbnRzLXBlci1taW51dGUgXHUyMDE0IGEgbWVhbmluZ2Z1bCwgcmVzdGFydC1zdGFibGUgbGl2ZW5lc3NcbiAgLy8gbnVtYmVyIChyZXBsYWNlcyB0aGUgY29nbml0aXZlIGBzdGVwYCBjb3VudGVyLCB3aGljaCByZXNldCB0byAwXG4gIC8vIGV2ZXJ5IHNlcnZlciByZXN0YXJ0KS5cbiAgY29uc3QgZXZlbnRzUGVyTWluID0gZmVlZC5ldmVudHMuZmlsdGVyKChlKSA9PiBlLnRzID4gZGlzcGxheU5vdyAtIDYwKS5sZW5ndGg7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4JywgZmxleERpcmVjdGlvbjogJ2NvbHVtbicsIGhlaWdodDogJzEwMCUnIH19PlxuICAgICAgPHN0eWxlPntTVFlMRX08L3N0eWxlPlxuXG4gICAgICA8ZGl2XG4gICAgICAgIHN0eWxlPXt7XG4gICAgICAgICAgZGlzcGxheTogJ2ZsZXgnLFxuICAgICAgICAgIGZsZXhEaXJlY3Rpb246ICdjb2x1bW4nLFxuICAgICAgICAgIGJhY2tncm91bmQ6IHRoZW1lLmJnLFxuICAgICAgICAgIGJvcmRlcjogYDFweCBzb2xpZCAke3RoZW1lLmJvcmRlcn1gLFxuICAgICAgICAgIGJvcmRlclJhZGl1czogMTAsXG4gICAgICAgICAgcGFkZGluZzogJzIwcHggMjJweCcsXG4gICAgICAgICAgbWluSGVpZ2h0OiA2MDAsXG4gICAgICAgICAgZ2FwOiA0LFxuICAgICAgICAgIC8vIE5ldXRyYWxpemUgdGhlIGhvc3QgdGhlbWUgKGUuZy4gXCJjeWJlcnB1bmtcIikgZm9yY2luZ1xuICAgICAgICAgIC8vIHVwcGVyY2FzZSBvbiBldmVyeXRoaW5nIFx1MjAxNCBsb25nIHNlbnRlbmNlcyBpbiBhbGwtY2FwcyBhcmVcbiAgICAgICAgICAvLyBleGhhdXN0aW5nLiBMYWJlbHMgcmUtYXBwbHkgdXBwZXJjYXNlIGV4cGxpY2l0bHkuXG4gICAgICAgICAgdGV4dFRyYW5zZm9ybTogJ25vbmUnLFxuICAgICAgICB9fVxuICAgICAgPlxuICAgICAgICA8TWFzdGhlYWRcbiAgICAgICAgICBzdGF0dXM9e2ZlZWQuc3RhdHVzfVxuICAgICAgICAgIGV2ZW50c1Blck1pbj17ZXZlbnRzUGVyTWlufVxuICAgICAgICAgIGF0aGVuYVJlYWNoYWJsZT17ZmVlZC5hdGhlbmFSZWFjaGFibGV9XG4gICAgICAgIC8+XG5cbiAgICAgICAgey8qIENhcmRpb2dyYW0gXHUyMDE0IHRoZSBoZWFydGJlYXQgdHJhY2UgKi99XG4gICAgICAgIDxkaXZcbiAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgaGVpZ2h0OiAxMTYsXG4gICAgICAgICAgICBiYWNrZ3JvdW5kOiB0aGVtZS5iZ0luc2V0LFxuICAgICAgICAgICAgYm9yZGVyOiBgMXB4IHNvbGlkICR7dGhlbWUuYm9yZGVyRmFpbnR9YCxcbiAgICAgICAgICAgIGJvcmRlclJhZGl1czogOCxcbiAgICAgICAgICAgIG92ZXJmbG93OiAnaGlkZGVuJyxcbiAgICAgICAgICAgIG1hcmdpbkJvdHRvbTogMTgsXG4gICAgICAgICAgfX1cbiAgICAgICAgPlxuICAgICAgICAgIDxDYXJkaW9ncmFtIGV2ZW50cz17ZmVlZC5ldmVudHN9IHNlcnZlclRpbWU9e2ZlZWQuc2VydmVyVGltZX0gLz5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgey8qIFJlYWRpbmcgXHUyMDE0IGR1YWwgaHVtYW4tcmVhZGFibGUgaW50ZXJwcmV0YXRpb24gKi99XG4gICAgICAgIDxkaXYgc3R5bGU9e3sgbWFyZ2luQm90dG9tOiAyMCB9fT5cbiAgICAgICAgICA8Wm9uZUxhYmVsPnJlYWRpbmc8L1pvbmVMYWJlbD5cbiAgICAgICAgICA8UmVhZGluZ1xuICAgICAgICAgICAgaW50ZXJwcmV0YXRpb249e2ludGVycHJldGF0aW9ufVxuICAgICAgICAgICAgbG9hZGluZz17aW50ZXJwTG9hZGluZ31cbiAgICAgICAgICAgIG5vdz17ZGlzcGxheU5vd31cbiAgICAgICAgICAvPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICB7LyogQm9keTogTk9XIChsZWZ0KSArIFNUUkVBTSAocmlnaHQpICovfVxuICAgICAgICA8ZGl2XG4gICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgIGRpc3BsYXk6ICdncmlkJyxcbiAgICAgICAgICAgIGdyaWRUZW1wbGF0ZUNvbHVtbnM6ICdtaW5tYXgoMjYwcHgsIDQwJSkgMWZyJyxcbiAgICAgICAgICAgIGdhcDogMjgsXG4gICAgICAgICAgICBmbGV4OiAxLFxuICAgICAgICAgICAgbWluSGVpZ2h0OiAzNjAsXG4gICAgICAgICAgfX1cbiAgICAgICAgPlxuICAgICAgICAgIHsvKiBOT1cgY29sdW1uICovfVxuICAgICAgICAgIDxkaXYgc3R5bGU9e3sgZGlzcGxheTogJ2ZsZXgnLCBmbGV4RGlyZWN0aW9uOiAnY29sdW1uJywgZ2FwOiAyNiB9fT5cbiAgICAgICAgICAgIDxkaXY+XG4gICAgICAgICAgICAgIDxab25lTGFiZWw+bm93PC9ab25lTGFiZWw+XG4gICAgICAgICAgICAgIDxDdXJyZW50Rm9jdXMgZm9jdXM9e2ZlZWQuZm9jdXN9IG5vdz17ZGlzcGxheU5vd30gLz5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPGRpdj5cbiAgICAgICAgICAgICAgPFpvbmVMYWJlbD52aXRhbHM8L1pvbmVMYWJlbD5cbiAgICAgICAgICAgICAgPFZpdGFscyB2aXRhbHM9e2ZlZWQudml0YWxzfSAvPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICB7LyogU1RSRUFNIGNvbHVtbiAqL31cbiAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICBzdHlsZT17e1xuICAgICAgICAgICAgICBkaXNwbGF5OiAnZmxleCcsXG4gICAgICAgICAgICAgIGZsZXhEaXJlY3Rpb246ICdjb2x1bW4nLFxuICAgICAgICAgICAgICBtaW5IZWlnaHQ6IDAsXG4gICAgICAgICAgICAgIGJvcmRlckxlZnQ6IGAxcHggc29saWQgJHt0aGVtZS5ib3JkZXJGYWludH1gLFxuICAgICAgICAgICAgICBwYWRkaW5nTGVmdDogMjYsXG4gICAgICAgICAgICB9fVxuICAgICAgICAgID5cbiAgICAgICAgICAgIDxab25lTGFiZWw+c3RyZWFtIFx1MDBCNyB7ZmVlZC5ldmVudHMubGVuZ3RofSBldmVudHM8L1pvbmVMYWJlbD5cbiAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiZm9ydW0tc2Nyb2xsXCJcbiAgICAgICAgICAgICAgc3R5bGU9e3sgb3ZlcmZsb3dZOiAnYXV0bycsIG1heEhlaWdodDogNDQwLCBwYWRkaW5nUmlnaHQ6IDggfX1cbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgPEV2ZW50U3RyZWFtIGV2ZW50cz17ZmVlZC5ldmVudHN9IG5vdz17ZGlzcGxheU5vd30gLz5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuICApO1xufVxuXG52b2lkIFJlYWN0O1xuIiwgIi8qKlxuICogVGhlIEZvcnVtIHBsdWdpbiBcdTIwMTQgZW50cnkgcG9pbnQuXG4gKlxuICogQnVuZGxlZCBhcyBhbiBJSUZFIGJ5IGVzYnVpbGQuIENhbGxzXG4gKiB3aW5kb3cuX19IRVJNRVNfUExVR0lOU19fLnJlZ2lzdGVyKFwiZm9ydW1cIiwgRm9ydW0pIHNvIEhlcm1lcyBjYW5cbiAqIG1vdW50IHRoZSBjb21wb25lbnQgd2hlbiB0aGUgdXNlciBuYXZpZ2F0ZXMgdG8gL2ZvcnVtLlxuICpcbiAqIEFsbCBSZWFjdC9ob29rcy9jb21wb25lbnRzIGFyZSBhY2Nlc3NlZCB2aWEgdGhlIHNkayBtb2R1bGUgd2hpY2hcbiAqIHB1bGxzIHRoZW0gZnJvbSB3aW5kb3cuX19IRVJNRVNfUExVR0lOX1NES19fIGF0IHN0YXJ0dXAuIFRoZSBidW5kbGVcbiAqIGRvZXMgTk9UIGltcG9ydCBcInJlYWN0XCIgXHUyMDE0IHRoYXQgd291bGQgZ2VuZXJhdGUgYW4gZXNidWlsZCByZXF1aXJlKClcbiAqIHNoaW0gdGhhdCBmYWlscyBhdCBydW50aW1lIGluIGJyb3dzZXIuXG4gKi9cblxuaW1wb3J0IHsgSEVSTUVTX1BMVUdJTlMgfSBmcm9tICcuL3Nkayc7XG5pbXBvcnQgeyBGb3J1bSB9IGZyb20gJy4vRm9ydW0nO1xuXG5pZiAoSEVSTUVTX1BMVUdJTlMgJiYgdHlwZW9mIEhFUk1FU19QTFVHSU5TLnJlZ2lzdGVyID09PSAnZnVuY3Rpb24nKSB7XG4gIEhFUk1FU19QTFVHSU5TLnJlZ2lzdGVyKCdmb3J1bScsIEZvcnVtKTtcbn0gZWxzZSB7XG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG4gIGNvbnNvbGUuZXJyb3IoJ2ZvcnVtOiB3aW5kb3cuX19IRVJNRVNfUExVR0lOU19fLnJlZ2lzdGVyIG5vdCBhdmFpbGFibGUnKTtcbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7OztBQWNBLE1BQU0sTUFBTyxPQUFlO0FBRTVCLE1BQUksQ0FBQyxLQUFLO0FBR1IsWUFBUTtBQUFBLE1BQ047QUFBQSxJQUVGO0FBQUEsRUFDRjtBQUlPLE1BQU0sUUFBUSxLQUFLO0FBR25CLE1BQU0sV0FBVyxLQUFLLE9BQU87QUFDN0IsTUFBTSxZQUFZLEtBQUssT0FBTztBQUM5QixNQUFNLFNBQVMsS0FBSyxPQUFPO0FBQzNCLE1BQU0sY0FBYyxLQUFLLE9BQU87QUFDaEMsTUFBTSxVQUFVLEtBQUssT0FBTztBQUc1QixNQUFNLGFBQWEsS0FBSyxjQUFjLENBQUM7QUFDdkMsTUFBTSxPQUFPLFdBQVc7QUFDeEIsTUFBTSxhQUFhLFdBQVc7QUFDOUIsTUFBTSxZQUFZLFdBQVc7QUFDN0IsTUFBTSxjQUFjLFdBQVc7QUFDL0IsTUFBTSxRQUFRLFdBQVc7QUFDekIsTUFBTSxTQUFTLFdBQVc7QUFHMUIsTUFBTSxZQUNYLEtBQUs7QUFJQSxNQUFNLGlCQUFrQixPQUFlOzs7QUNuRDlDLE1BQU0sY0FBYyxDQUFDLE9BQU8sUUFBUTtBQUNuQyxRQUFJLE9BQU8sVUFBVSxTQUFVO0FBRy9CLFFBQUksUUFBUSxHQUFHO0FBQ2QsYUFBTztBQUFBLFFBQ04sTUFBTTtBQUFBLFFBQ04sSUFBTSxTQUFTLElBQUssS0FBUyxTQUFTLElBQUssT0FBUztBQUFBLFFBQ3BELElBQU0sU0FBUyxJQUFLLEtBQVEsUUFBUSxPQUFTO0FBQUEsUUFDN0MsSUFBSyxRQUFRLEtBQVMsU0FBUyxJQUFLLE9BQVM7QUFBQSxNQUM5QztBQUFBLElBQ0Q7QUFHQSxRQUFJLFFBQVEsR0FBRztBQUNkLGFBQU87QUFBQSxRQUNOLE1BQU07QUFBQSxRQUNOLElBQU0sU0FBUyxLQUFNLEtBQVMsU0FBUyxJQUFLLE9BQVM7QUFBQSxRQUNyRCxJQUFNLFNBQVMsSUFBSyxLQUFTLFNBQVMsSUFBSyxPQUFTO0FBQUEsUUFDcEQsSUFBTSxTQUFTLElBQUssS0FBUSxRQUFRLE9BQVM7QUFBQSxRQUM3QyxRQUFTLFFBQVEsS0FBUyxTQUFTLElBQUssT0FBUztBQUFBLE1BQ2xEO0FBQUEsSUFDRDtBQUdBLFFBQUksUUFBUSxHQUFHO0FBQ2QsYUFBTztBQUFBLFFBQ04sTUFBTTtBQUFBLFFBQ04sSUFBSyxTQUFTLEtBQU0sT0FBUTtBQUFBLFFBQzVCLElBQUssU0FBUyxJQUFLLE9BQVE7QUFBQSxRQUMzQixJQUFJLFFBQVEsT0FBUTtBQUFBLE1BQ3JCO0FBQUEsSUFDRDtBQUdBLFFBQUksUUFBUSxHQUFHO0FBQ2QsYUFBTztBQUFBLFFBQ04sTUFBTTtBQUFBLFFBQ04sSUFBSyxTQUFTLEtBQU0sT0FBUTtBQUFBLFFBQzVCLElBQUssU0FBUyxLQUFNLE9BQVE7QUFBQSxRQUM1QixJQUFLLFNBQVMsSUFBSyxPQUFRO0FBQUEsUUFDM0IsUUFBUSxRQUFRLE9BQVE7QUFBQSxNQUN6QjtBQUFBLElBQ0Q7QUFBQSxFQUNEO0FBRUEsTUFBTyxzQkFBUTs7O0FDOUNmLE1BQU0sUUFBUTtBQUFBLElBQ2IsV0FBVztBQUFBLElBQ1gsY0FBYztBQUFBLElBQ2QsTUFBTTtBQUFBLElBQ04sWUFBWTtBQUFBLElBQ1osT0FBTztBQUFBLElBQ1AsT0FBTztBQUFBLElBQ1AsUUFBUTtBQUFBLElBQ1IsT0FBTztBQUFBLElBQ1AsZ0JBQWdCO0FBQUEsSUFDaEIsTUFBTTtBQUFBLElBQ04sWUFBWTtBQUFBLElBQ1osT0FBTztBQUFBLElBQ1AsV0FBVztBQUFBLElBQ1gsV0FBVztBQUFBLElBQ1gsWUFBWTtBQUFBLElBQ1osV0FBVztBQUFBLElBQ1gsT0FBTztBQUFBLElBQ1AsZ0JBQWdCO0FBQUEsSUFDaEIsVUFBVTtBQUFBLElBQ1YsU0FBUztBQUFBLElBQ1QsTUFBTTtBQUFBLElBQ04sVUFBVTtBQUFBLElBQ1YsVUFBVTtBQUFBLElBQ1YsZUFBZTtBQUFBLElBQ2YsVUFBVTtBQUFBLElBQ1YsV0FBVztBQUFBLElBQ1gsVUFBVTtBQUFBLElBQ1YsV0FBVztBQUFBLElBQ1gsYUFBYTtBQUFBLElBQ2IsZ0JBQWdCO0FBQUEsSUFDaEIsWUFBWTtBQUFBLElBQ1osWUFBWTtBQUFBLElBQ1osU0FBUztBQUFBLElBQ1QsWUFBWTtBQUFBLElBQ1osY0FBYztBQUFBLElBQ2QsZUFBZTtBQUFBLElBQ2YsZUFBZTtBQUFBLElBQ2YsZUFBZTtBQUFBLElBQ2YsZUFBZTtBQUFBLElBQ2YsWUFBWTtBQUFBLElBQ1osVUFBVTtBQUFBLElBQ1YsYUFBYTtBQUFBLElBQ2IsU0FBUztBQUFBLElBQ1QsU0FBUztBQUFBLElBQ1QsWUFBWTtBQUFBLElBQ1osV0FBVztBQUFBLElBQ1gsYUFBYTtBQUFBLElBQ2IsYUFBYTtBQUFBLElBQ2IsU0FBUztBQUFBLElBQ1QsV0FBVztBQUFBLElBQ1gsWUFBWTtBQUFBLElBQ1osTUFBTTtBQUFBLElBQ04sV0FBVztBQUFBLElBQ1gsTUFBTTtBQUFBLElBQ04sT0FBTztBQUFBLElBQ1AsYUFBYTtBQUFBLElBQ2IsTUFBTTtBQUFBLElBQ04sVUFBVTtBQUFBLElBQ1YsU0FBUztBQUFBLElBQ1QsV0FBVztBQUFBLElBQ1gsUUFBUTtBQUFBLElBQ1IsT0FBTztBQUFBLElBQ1AsT0FBTztBQUFBLElBQ1AsVUFBVTtBQUFBLElBQ1YsZUFBZTtBQUFBLElBQ2YsV0FBVztBQUFBLElBQ1gsY0FBYztBQUFBLElBQ2QsV0FBVztBQUFBLElBQ1gsWUFBWTtBQUFBLElBQ1osV0FBVztBQUFBLElBQ1gsc0JBQXNCO0FBQUEsSUFDdEIsV0FBVztBQUFBLElBQ1gsWUFBWTtBQUFBLElBQ1osV0FBVztBQUFBLElBQ1gsV0FBVztBQUFBLElBQ1gsYUFBYTtBQUFBLElBQ2IsZUFBZTtBQUFBLElBQ2YsY0FBYztBQUFBLElBQ2QsZ0JBQWdCO0FBQUEsSUFDaEIsZ0JBQWdCO0FBQUEsSUFDaEIsZ0JBQWdCO0FBQUEsSUFDaEIsYUFBYTtBQUFBLElBQ2IsTUFBTTtBQUFBLElBQ04sV0FBVztBQUFBLElBQ1gsT0FBTztBQUFBLElBQ1AsU0FBUztBQUFBLElBQ1QsUUFBUTtBQUFBLElBQ1Isa0JBQWtCO0FBQUEsSUFDbEIsWUFBWTtBQUFBLElBQ1osY0FBYztBQUFBLElBQ2QsY0FBYztBQUFBLElBQ2QsZ0JBQWdCO0FBQUEsSUFDaEIsaUJBQWlCO0FBQUEsSUFDakIsbUJBQW1CO0FBQUEsSUFDbkIsaUJBQWlCO0FBQUEsSUFDakIsaUJBQWlCO0FBQUEsSUFDakIsY0FBYztBQUFBLElBQ2QsV0FBVztBQUFBLElBQ1gsV0FBVztBQUFBLElBQ1gsVUFBVTtBQUFBLElBQ1YsYUFBYTtBQUFBLElBQ2IsTUFBTTtBQUFBLElBQ04sU0FBUztBQUFBLElBQ1QsT0FBTztBQUFBLElBQ1AsV0FBVztBQUFBLElBQ1gsUUFBUTtBQUFBLElBQ1IsV0FBVztBQUFBLElBQ1gsUUFBUTtBQUFBLElBQ1IsZUFBZTtBQUFBLElBQ2YsV0FBVztBQUFBLElBQ1gsZUFBZTtBQUFBLElBQ2YsZUFBZTtBQUFBLElBQ2YsWUFBWTtBQUFBLElBQ1osV0FBVztBQUFBLElBQ1gsTUFB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S0FBSyxPQUFPLFFBQU8sU0FBTztBQUFBLFVBQy9DO0FBQUEsWUFBQztBQUFBO0FBQUEsY0FDQyxXQUFVO0FBQUEsY0FDVixPQUFPLEVBQUUsV0FBVyxRQUFRLFdBQVcsS0FBSyxjQUFjLEVBQUU7QUFBQTtBQUFBLFlBRTVELG9DQUFDLGVBQVksUUFBUSxLQUFLLFFBQVEsS0FBSyxZQUFZO0FBQUEsVUFDckQ7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLElBQ0YsQ0FDRjtBQUFBLEVBRUo7OztBQ3RLQSxNQUFJLGtCQUFrQixPQUFPLGVBQWUsYUFBYSxZQUFZO0FBQ25FLG1CQUFlLFNBQVMsU0FBUyxLQUFLO0FBQUEsRUFDeEMsT0FBTztBQUVMLFlBQVEsTUFBTSx5REFBeUQ7QUFBQSxFQUN6RTsiLAogICJuYW1lcyI6IFsiZGVmaW5pdGlvbiIsICJrIiwgIm51bSIsICJjIiwgImMiLCAiYTk4IiwgImMiLCAiYWJzIiwgInJnYiIsICJmbiIsICJjIiwgImFicyIsICJkZWZpbml0aW9uIiwgImRlZmluaXRpb25fZGVmYXVsdCIsICJodWUiLCAiaHVlIiwgImZuIiwgInN1bSIsICJ2YWwiLCAiZGVmaW5pdGlvbiIsICJkZWZpbml0aW9uX2RlZmF1bHQiLCAiYyIsICJjIiwgImsiLCAiZSIsICJmbiIsICJsYWIiLCAiZjIiLCAicmdiIiwgImMiLCAiZSIsICJmIiwgImUiLCAiZiIsICJjIiwgImRlZmluaXRpb24iLCAiZGVmaW5pdGlvbl9kZWZhdWx0IiwgImRlZmluaXRpb24iLCAiYyIsICJkZWZpbml0aW9uX2RlZmF1bHQiLCAiZiIsICJNIiwgImRlZmluaXRpb24iLCAiZGVmaW5pdGlvbl9kZWZhdWx0IiwgIk0iLCAiZGVmaW5pdGlvbiIsICJjIiwgImRlZmluaXRpb25fZGVmYXVsdCIsICJmIiwgIk0iLCAiZGVmaW5pdGlvbiIsICJkZWZpbml0aW9uX2RlZmF1bHQiLCAiaHN2IiwgImRlZmluaXRpb24iLCAiYyIsICJkZWZpbml0aW9uX2RlZmF1bHQiLCAiYyIsICJjIiwgInAiLCAiYyIsICJwIiwgImRlZmluaXRpb24iLCAiZGVmaW5pdGlvbl9kZWZhdWx0IiwgInZuIiwgInAiLCAiZDAiLCAicmdiIiwgImRlZmluaXRpb24iLCAiZGVmaW5pdGlvbl9kZWZhdWx0IiwgImMiLCAiYyIsICJkZWZpbml0aW9uIiwgImMiLCAiZGVmaW5pdGlvbl9kZWZhdWx0IiwgImsiLCAiZSIsICJmbiIsICJlIiwgImsiLCAibGFiIiwgInJnYiIsICJmIiwgImUiLCAiayIsICJmMiIsICJyZ2IiLCAiZGVmaW5pdGlvbiIsICJjIiwgImRlZmluaXRpb25fZGVmYXVsdCIsICJkZWZpbml0aW9uIiwgImRlZmluaXRpb25fZGVmYXVsdCIsICJjIiwgImRlZmluaXRpb24iLCAiYyIsICJkZWZpbml0aW9uX2RlZmF1bHQiLCAiZGVmaW5pdGlvbiIsICJkZWZpbml0aW9uX2RlZmF1bHQiLCAiYyIsICJjIiwgImMiLCAiZSIsICJrIiwgInVfZm4iLCAidl9mbiIsICJ1biIsICJ2biIsICJrIiwgInJnYiIsICJsY2h1diIsICJkZWZpbml0aW9uIiwgImRlZmluaXRpb25fZGVmYXVsdCIsICJkZWZpbml0aW9uIiwgImRlZmluaXRpb25fZGVmYXVsdCIsICJkZWZpbml0aW9uIiwgImx1diIsICJyZ2IiLCAiZGVmaW5pdGlvbl9kZWZhdWx0IiwgIk0iLCAicmdiIiwgIk0iLCAiYyIsICJrMiIsICJrMyIsICJmIiwgImYyIiwgInJnYiIsICJDMSIsICJiIiwgImIyIiwgImsiLCAibGFiIiwgImMiLCAiaHNsIiwgImRlZmluaXRpb25fZGVmYXVsdCIsICJjIiwgImxhYiIsICJjIiwgImsiLCAiaHN2IiwgImsiLCAiZGVmaW5pdGlvbl9kZWZhdWx0IiwgImMiLCAiZGVmaW5pdGlvbiIsICJkZWZpbml0aW9uX2RlZmF1bHQiLCAiYyIsICJjIiwgImRlZmluaXRpb24iLCAiZGVmaW5pdGlvbl9kZWZhdWx0IiwgImMiLCAicmdiIiwgImRlZmluaXRpb24iLCAiZGVmaW5pdGlvbl9kZWZhdWx0IiwgImdhbW1hIiwgImFicyIsICJsaW5lYXJpemUiLCAiYWJzIiwgInByb3Bob3RvIiwgImRlZmluaXRpb24iLCAiZGVmaW5pdGlvbl9kZWZhdWx0IiwgImdhbW1hIiwgImFicyIsICJcdTAzQjEiLCAiXHUwM0IyIiwgImxpbmVhcml6ZSIsICJhYnMiLCAicmVjMjAyMCIsICJkZWZpbml0aW9uIiwgImRlZmluaXRpb25fZGVmYXVsdCIsICJ0cmFuc2ZlciIsICJkZWZpbml0aW9uIiwgImRlZmluaXRpb25fZGVmYXVsdCIsICJkZWZpbml0aW9uIiwgImRlZmluaXRpb25fZGVmYXVsdCIsICJ4eXo2NSIsICJ4eXo1MCIsICJkZWZpbml0aW9uIiwgImRlZmluaXRpb25fZGVmYXVsdCIsICJkZWZpbml0aW9uIiwgImRlZmluaXRpb25fZGVmYXVsdCIsICJkZWZpbml0aW9uX2RlZmF1bHQiLCAiYyIsICJyZ2IiLCAiU0RLIiwgImUiLCAiUE9MTF9JTlRFUlZBTF9NUyIsICJTREsiLCAiZSIsICJhZ28iLCAiZSIsICJlIl0KfQo=
