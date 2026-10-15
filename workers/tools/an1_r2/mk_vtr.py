import json
V=json.load(open('out/vill_tracks.json'))['result']; M=json.load(open('out/m1b_before2.json'))
base=M['result']
for variant in ('before','after'):
    out={k:v for k,v in base.items() if not v.get('people')}
    for name,key in V['keyOf'].items():
        t=V['tracks'][key]; F=t['F']; fr=t['variants'][variant]['frames']   # fr[f][foot][xyz]
        walk={'dur':t['dur'],'F':F,'dt':t['dur']/F,'fx':[[fr[f][i][0] for f in range(F)] for i in range(2)],'fy':[[fr[f][i][1] for f in range(F)] for i in range(2)],'fz':[[fr[f][i][2] for f in range(F)] for i in range(2)]}
        idl=t['variants'][variant]['idle']
        n=15; idle={'dur':1,'F':n,'dt':1/n,'fx':[[idl[i][0]]*n for i in range(2)],'fy':[[idl[i][1]]*n for i in range(2)],'fz':[[idl[i][2]]*n for i in range(2)]}
        out[name]={'people':True,'H':3.0,'clips':{'Idle_Loop':idle,'Walk_Loop':walk},'refClip':'Idle_Loop'}
    json.dump({'result':out},open('out/tr_%s.json'%variant,'w'))
    print(variant,sorted(out))
# planted-foot speed per villager (after): stance frames = foot y in lowest 15% + 4.5cm; speed = -dz/dt median
import statistics as st
for key,t in V['tracks'].items():
    F=t['F']; dt=t['dur']/F
    for variant in ('before','after'):
        fr=t['variants'][variant]['frames']; vs=[]
        for i in range(2):
            y=[fr[f][i][1] for f in range(F)]; g=sorted(y)[int(0.15*(F-1))]
            for f in range(F):
                f1=(f+1)%F
                if y[f]<=g+0.045 and y[f1]<=g+0.045:
                    dz=fr[f1][i][2]-fr[f][i][2]
                    if abs(dz)<1.2: vs.append(-dz/dt)
        print(key,variant,'planted-foot back speed med %.2f m/s  p10 %.2f p90 %.2f (n=%d)'%(st.median(vs),sorted(vs)[len(vs)//10],sorted(vs)[9*len(vs)//10],len(vs)))
