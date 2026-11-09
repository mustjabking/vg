/*! mt-loader.js — M.TAQI-STUDIO — OWNER MUHAMMAD TAQI */
(function (W, D) {
  var MT = W.MT = { version: '1.0.0' };
  var cs = D.currentScript;
  
  MT.BIN = cs && cs.src ? cs.src.replace(/[^\/]+$/, '') + 'mt.bin' : 'mt.bin';

  function xorshift32(s){ s^=s<<13; s>>>=0; s^=s>>>17; s^=s<<5; s>>>=0; return s>>>0; }
  function makeKeystream(name, salt, seed, len) {
    var s = (salt ^ 0x9E3779B9) >>> 0;
    for (var i=0;i<name.length;i++){ s=(s^name.charCodeAt(i))>>>0; s=Math.imul(s,16777619)>>>0; }
    s = (s ^ (seed * 2654435761)) >>> 0;
    var ks = new Uint8Array(len), a = s;
    for (var j=0;j<len;j++){ a = xorshift32(a); ks[j] = a & 0xff; }
    return ks;
  }

  var _bin = null, _meta = null;
  function loadBin() {
    return fetch(MT.BIN).then(r => r.arrayBuffer()).then(ab => {
      _bin = new Uint8Array(ab);
      if (String.fromCharCode(_bin[0],_bin[1],_bin[2],_bin[3]) !== 'MTB1') throw new Error('Bad magic');
      var dv = new DataView(ab), cnt = dv.getUint16(8,true), salt = dv.getUint32(10,true), p = 14, idx = {};
      for (var i=0;i<cnt;i++) {
        var nl = _bin[p++], nm = new TextDecoder().decode(_bin.subarray(p, p+nl)); p+=nl;
        idx[nm] = { j: dv.getUint16(p,true), n: dv.getUint32(p+2,true), o: dv.getUint32(p+6,true), s: _bin[p+10] }; p+=11;
      }
      _meta = { salt: salt, index: idx };
    });
  }

  MT.load = function (name) {
    return (!_meta ? loadBin() : Promise.resolve()).then(function () {
      var e = _meta.index[name];
      if (!e) throw new Error('Unknown script: ' + name);
      var raw = _bin.subarray(e.o, e.o + e.n), ks = makeKeystream(name, _meta.salt, e.s, raw.length), out = new Uint8Array(raw.length);
      for (var i=0;i<raw.length;i++) {
        var b = (raw[i] - ((i*7 + e.s) & 0xff)) & 0xff;
        out[i] = (((b>>>3)|(b<<5)) & 0xff) ^ ks[i];
      }
      W.mt = name;
      (0, eval)(new TextDecoder().decode(out.subarray(e.j)));
    });
  };

  var auto = cs && cs.getAttribute('data-mt');
  if (auto) MT.ready = MT.load(auto).catch(console.error);
})(window, document);
