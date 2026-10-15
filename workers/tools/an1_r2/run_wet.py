import json, sys, random, subprocess
random.seed(2)
tag=sys.argv[1]; files=sys.argv[2:]; pts=[]
for fn in files:
    R=json.load(open(fn))['result']
    for sp in R['out']:
        for it in sp['items']:
            if it['label'].startswith('pas.') : continue
            rows=it['rows']
            for j in range(0,len(rows),10): pts.append([rows[j][0],rows[j][2],rows[j][1],it['label']])
random.shuffle(pts); pts=pts[:12000]
src='const P='+json.dumps({'pts':pts})+';\n'+open('m4_wet.js').read(); open('/tmp/wet_job.js','w').write(src)
out=subprocess.run(['./ev.sh','/tmp/wet_job.js',__import__('os').environ.get('PORT','8790')],capture_output=True,text=True,env={'EVT':'900','PATH':'/usr/bin:/bin'}).stdout
print(tag,out[:600])
