
(() => {
  const P = WebGL2RenderingContext.prototype, st = window.__gls = { link: 0, linkN: 0, stat: 0, statN: 0, comp: 0, compN: 0, long: [], big: [] };
  const wrap = (name, key, nkey) => { const o = P[name]; P[name] = function (...a) { const t = performance.now(); const r = o.apply(this, a); const d = performance.now() - t; st[key] += d; st[nkey]++; if (d > 40) st.big.push([name, +d.toFixed(0), Math.round(t)]); return r; }; };
  wrap('linkProgram', 'link', 'linkN'); wrap('compileShader', 'comp', 'compN');
  const gp = P.getProgramParameter; P.getProgramParameter = function (p, k) { const t = performance.now(); const r = gp.call(this, p, k); const d = performance.now() - t; st.stat += d; st.statN++; if (d > 40) st.big.push(['getProgramParameter', +d.toFixed(0), Math.round(t)]); return r; };
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) st.long.push([Math.round(e.startTime), Math.round(e.duration)]); }).observe({ entryTypes: ['longtask'] }); } catch (e) {}
  st.loaf = [];
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.duration > 1500) st.loaf.push({ t: Math.round(e.startTime), d: Math.round(e.duration), blk: Math.round(e.blockingDuration || 0), sc: (e.scripts || []).slice().sort((a, b) => b.duration - a.duration).slice(0, 2).map((x) => [String(x.sourceFunctionName || x.invoker || '').slice(0, 50), Math.round(x.duration), (x.sourceURL || '').split('/').pop().slice(0, 20) + ':' + (x.sourceCharPosition || 0)]) }); }).observe({ type: 'long-animation-frame', buffered: true }); } catch (e) { st.loafErr = String(e); }
})();
