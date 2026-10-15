// AU1: prints the music / one-shot tables of the REAL audio.js as JSON (for au1_assets_test.py and au1_spectrum_test.py --max-vol)
import './au1_mocks.js';
import { TRACKS, ONESHOT_MAX, MUSIC, ANIMAL_DAY } from '../bot/bluebot_v2/bluewall/client/src/audio.js';
console.log(JSON.stringify({ TRACKS, ONESHOT_MAX, MUSIC, ANIMAL_DAY }));
