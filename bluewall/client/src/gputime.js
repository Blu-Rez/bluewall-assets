// GPU time per frame through EXT_disjoint_timer_query_webgl2 - only used while the performance overlay is on (queries are never issued otherwise).
// Many phone browsers do not offer the extension: then `ok` is false and the overlay says "gpu n/a" (which is itself useful to know).
export function createGpuTimer(gl) {
  let ext = null;
  try { ext = gl && gl.getExtension ? gl.getExtension('EXT_disjoint_timer_query_webgl2') : null; } catch (e) { ext = null; }
  const api = { ok: !!ext, avg: { s: 0, p: 0 }, n: { s: 0, p: 0 }, begin() {}, end() {}, poll() {}, summary: () => 'gpu n/a' };
  if (!ext) return api;
  const pend = []; let q = null, kind = 'p';
  api.begin = (k) => { if (q || pend.length > 6) return; q = gl.createQuery(); gl.beginQuery(ext.TIME_ELAPSED_EXT, q); kind = k; };
  api.end = () => { if (!q) return; gl.endQuery(ext.TIME_ELAPSED_EXT); pend.push({ q, k: kind }); q = null; };
  api.poll = () => {
    let dis = false; try { dis = !!gl.getParameter(ext.GPU_DISJOINT_EXT); } catch (e) { /* ignore */ }
    while (pend.length && gl.getQueryParameter(pend[0].q, gl.QUERY_RESULT_AVAILABLE)) {
      const o = pend.shift(); const ms = gl.getQueryParameter(o.q, gl.QUERY_RESULT) / 1e6; gl.deleteQuery(o.q);
      if (dis || !(ms >= 0 && ms < 500)) continue;
      api.avg[o.k] = api.n[o.k] ? api.avg[o.k] * 0.9 + ms * 0.1 : ms; api.n[o.k]++;
    }
  };
  api.summary = () => {
    const s = api.avg.s, p = api.avg.p, ns = api.n.s, np = api.n.p; if (!ns && !np) return 'gpu …';
    return `gpu ${(np ? p : s).toFixed(1)} ms` + (ns && np ? ` (shadow frames ${s.toFixed(1)})` : '');
  };
  return api;
}
