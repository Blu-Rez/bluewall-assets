CW1 · 70% · server clanwar.py + 504-check proof (CW1 OK) + UI fixtures made · client warui.js being built (not in this push) · nothing blocked
INTERIM push (03:05): the SERVER is finished and tested; the client is not in this archive yet. A final push (same branch inbox/CW1) will replace this one.
Run the proof:  tar xzf patch_CW1_interim.tar.gz; copy server_patch/NEW/* to bluewall/, apply server_patch/*.diff (cd bluewall; patch -p1 < x.py.diff), then  bash dev/cw1_test.sh  ->  CW1 OK (504 checks)
