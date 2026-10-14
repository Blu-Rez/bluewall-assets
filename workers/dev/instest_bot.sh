#!/bin/bash
# instest.sh <pkg dir name> <scenario: ok|rerun|damaged|nostart|oldproc|badpy>   — installer v2 sandbox (shim systemctl; own test server on 8599)
PKGN=$1; SC=${2:-ok}; SB=/tmp/sbx; P=/home/claude/pkg/$PKGN
rm -rf $SB; mkdir -p $SB/app $SB/bin $SB/pkg
cp -r /tmp/ckorig/bluebot_v2/. $SB/app/; cp -r /home/claude/pkg/bluebot_bluewall_p21/files/. $SB/app/; [ -n "$FRESH" ] && cp -r $FRESH/. $SB/app/; rm -rf $SB/app/bluewall; cp -r /home/claude/bot/bluebot_v2/bluewall $SB/app/bluewall; rm -rf $SB/app/bluewall/__pycache__
echo oldbuild > $SB/app/bluewall/BUILD; echo "# old marker" >> $SB/app/bluewall/state.py
cp -r $P $SB/pkg/; Q=$SB/pkg/$PKGN
sed -i "s#/root/bluebot_v2#$SB/app#g; s#8590#8599#g" $Q/install.sh $Q/rollback.sh
cat > $SB/bin/systemctl <<EOT
#!/bin/bash
[ "\$1" = restart ] || exit 0
[ -f $SB/srv.pid ] && kill \$(cat $SB/srv.pid) 2>/dev/null; sleep 0.5
[ "$SC" = nostart ] && [ -f $SB/armed ] && [ ! -f $SB/rolled ] && { touch $SB/rolled; exit 0; }
cd $SB/app; PYTHONPATH=/home/claude/dev/stubcfg:$SB/app BLUEWALL_STATE=memory BLUEWALL_PORT=8599 nohup python3 -P -m bluewall > $SB/srv.log 2>&1 &
echo \$! > $SB/srv.pid
EOT
printf '#!/bin/bash\necho journal-shim\n' > $SB/bin/journalctl; chmod +x $SB/bin/*
export PATH=$SB/bin:$PATH
# start "old" server first
systemctl restart x; sleep 3; touch $SB/armed
before=$(cd $SB/app && find . -type f -not -path '*/__pycache__/*' -not -path './_backups/*' | sort | xargs sha256sum | sha256sum)
case $SC in
  damaged) echo "# tamper" >> $Q/files/bluewall/state.py;;
  oldproc) sed -i 's#^systemctl restart.*#echo skipped-restart#' $Q/install.sh;;
  badpy) echo "def (:" > $Q/files/bluewall/bad_syntax.py; ( cd $Q && find files -type f | sort | xargs sha256sum > SHA256SUMS );;
esac
echo "--- install ($SC)"; bash $Q/install.sh; echo "exit=$?"
if [ "$SC" = rerun ]; then echo "--- install again"; bash $Q/install.sh; echo "exit=$?"; fi
after=$(cd $SB/app && find . -type f -not -path '*/__pycache__/*' -not -path './_backups/*' | sort | xargs sha256sum | sha256sum)
echo "tree same as before: $([ "$before" = "$after" ] && echo YES || echo no)   build now: $(cat $SB/app/bluewall/BUILD)"
if [ "$SC" = ok ] || [ "$SC" = rerun ]; then echo "--- rollback"; bash $Q/rollback.sh; sleep 1; after2=$(cd $SB/app && find . -type f -not -path '*/__pycache__/*' -not -path './_backups/*' | sort | xargs sha256sum | sha256sum); echo "after rollback identical to before: $([ "$before" = "$after2" ] && echo YES || echo NO)"; fi
[ -f $SB/srv.pid ] && kill $(cat $SB/srv.pid) 2>/dev/null
