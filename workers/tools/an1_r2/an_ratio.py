import json, math, sys, collections, statistics as st
from an_sim import masks
def vnat_table(TR):
    out={}
    for kn,K in TR.items():
        for cn,c in K['clips'].items():
            m=masks(c,K['H']); F=c['F']; vs=[]
            for f in range(len(c['fz'])):
                for i in range(F):
                    if m[f][i]:
                        i1=(i+1)%F; dz=c['fz'][f][i1]-c['fz'][f][i]
                        if abs(dz)<0.4*K['H']: vs.append(-dz/c['dt'])
            if len(vs)>=4: out[(kn,cn)]=st.median(vs)
    return out
def run(variant, vref_variant='after'):
    TR=json.load(open('out/tr_%s.json'%vref_variant))['result']; VN=vnat_table(TR)
    G=collections.defaultdict(list)
    for s in 'ABCDEF':
        S=json.load(open('out/sim_%s_%s.json'%(variant,s)))['result']; dt=S['dt']; clips=S['clips']
        for sp in S['out']:
            for it in sp['items']:
                kind=it['kind']; R=it['rows']; sc=it['scale']; n=len(R)
                for j in range(1,n-1):
                    b=R[j]; info=(clips.get(kind) or {}).get(str(int(b[4])))
                    if not info: continue
                    cn=info['name']; vn=VN.get((kind,cn))
                    if vn is None or vn<=0: continue
                    v=math.hypot(R[j+1][0]-R[j-1][0],R[j+1][2]-R[j-1][2])/(2*dt)
                    if v<0.3: continue
                    rf=b[5]/(info['count']/info['dur'])
                    G[(it['label'],kind,cn)].append(v/(rf*vn*sc))
    return G
def show(G,title):
    print('==',title); print('%-14s %-8s %-10s %6s %8s %8s %8s'%('label','kind','clip','n','median','|e|<15%','|e|<30%'))
    for k,a in sorted(G.items()):
        if len(a)<20: continue
        print('%-14s %-8s %-10s %6d %8.2f %7.0f%% %7.0f%%'%(k[0],k[1],k[2],len(a),st.median(a),100*sum(abs(x-1)<0.15 for x in a)/len(a),100*sum(abs(x-1)<0.30 for x in a)/len(a)))
if __name__=='__main__':
    show(run('before'),'before (game speed / (clip rate x natural planted-foot speed); 1.00 = the feet exactly match the ground)')
    show(run('after'),'after')
