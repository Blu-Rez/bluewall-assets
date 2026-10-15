RP1C_R3 · ۱۰۰٪ · انجام‌شده: نشانه‌ی بالای سر + نور هم‌رنگ (بدون تاج، حلقه‌ی کوچک خالی)، ۱۰ رمپ قابل‌راه‌رفتن، نشانه‌های «برو بالا»، برخورد ۰/۰/۰ روی ۷۴۳۷ اجرا، سایه/دوربین ۳ حالت (پیش‌فرض B)، پرش (جدول+نوار)، راه/دویدن، شنا، مقیاس +۱۲٪، F9 · بعدی: —  · گیر: ندارم

# RP1C_R3 progress (final)
- Done: marker (no crown; small empty ring; faceted triangle gem over the head bone with a gap; same-colour halo), 10 ramps (6 outer + 4 town; grade <= 0.33; camera never clips: 0 frames on all 10), «Go up» markers (icon + light column <= 30 m, HUD arrow, prompt; hidden while already on a ramp), collision a/b/c = 0/0/0/0 on 7437 runs (before: 128 009 frames inside a solid, 6 958 pass-throughs), doors on the real facade, shadow 3 looks (default B), camera 3 looks (default B), jump table (apex 0.576 m, air 0.70 s, absorb 100 ms), walk/run slide numbers, swim rule + frames, hero +12 %, F9 (+2 -> +1 programs at the first frames), groundH not adopted (numbers in the report).
- Gate: GATE_W: ALL OK, noRoute 647 (baseline 647). Tests: `bash dev/rp1c3_test.sh page` -> RP1C_R3 OK.
- Not proven: the feel on a phone; F9 on a real phone (PF1's +24 did not reproduce); the swim clip from all angles; sprint / jump clips (needs-clip list in the report).
- Hero lag: not solved by this round; next lever = merge static castle + town meshes (TR2 F4). Details in the report §7.
