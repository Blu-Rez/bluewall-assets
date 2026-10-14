import json,re
items=json.load(open('/home/claude/tr1/items.json'))
cats={}
for it in items:
    if not it['parts']: continue
    sub=f"{it['tris']:,} tris · "+(f"{it['kb']} KB" if it['kb'] else f"in {it['kit'][0]}")
    if it['key']=='house_generic': sub=f"pack {it['tris']:,} tris · 44 modules"
    overlay=bool(re.match(r'house_(cottage|craftsman|merchant|noble)_\d',it['key']))
    parts=[]
    for f,n in it['parts']:
        if n and len(n)>1 and not overlay: parts+= [{'url':'/assets/'+f,'nodes':[x]} for x in n]
        else: parts.append({'url':'/assets/'+f,'nodes':n or []})
    cats.setdefault(it['cat'],[]).append({'n':it['n'],'label':it['key'],'sub':sub,'parts':parts})
for c,l in cats.items(): json.dump(l,open(f'/home/claude/dev/tr1_lists/{c}.json','w'))
print({c:len(l) for c,l in cats.items()})
