# apply_rep.py: exact-string replacements; each must match exactly once
import sys, json
def rep(path, pairs):
    s = open(path).read()
    for old, new in pairs:
        n = s.count(old)
        if n != 1: print(f"FAIL {path}: {n} matches for: {old[:90]!r}"); sys.exit(1)
        s = s.replace(old, new)
    open(path, 'w').write(s); print("ok", path, len(pairs))
