import json
t = json.load(open('title_paths.json'))
head = open('lab_head.html').read()
shared = open('shared.js').read()
var = open('variants.js').read().replace('__TITLE_PATHS__', json.dumps(t))
open('lab.html', 'w').write(head + shared + '\n' + var + '\n})();\n</script></body></html>\n')
print('lab.html', len(open('lab.html').read()) // 1024, 'KB')
