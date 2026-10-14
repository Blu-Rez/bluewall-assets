const sc=__bw.scene||__bw.battle.session.scene; const out=[];
sc.traverse(o=>{ if(o.isLight) out.push([o.type,o.intensity,o.color.getHexString(),o.castShadow]); });
const r=__bw.renderer;
return {lights:out, exp:r&&r.toneMappingExposure, fog:sc.fog&&[sc.fog.color.getHexString(),sc.fog.density], envI:sc.environmentIntensity, bg:sc.background&&sc.background.isColor?sc.background.getHexString():String(sc.background), keys:Object.keys(__bw)};
