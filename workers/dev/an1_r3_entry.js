// AN1_R3 dev entry (NOT shipped): the debug bundle plus handles on the road data, the layout and a GLB reader, for the cart / ford audit and the scale audit.
import '/home/claude/bot/bluebot_v2/bluewall/client/src/main.js';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { ROADS, buildRoads, roadDist } from '/home/claude/bot/bluebot_v2/bluewall/client/src/roads.js';
import * as L from '/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js';
import { bridgesFromLayout, makeGroundY } from '/home/claude/bot/bluebot_v2/bluewall/client/src/nav.js';
const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
window.__R3 = { bridgesFromLayout, makeGroundY, ROADS, buildRoads, roadDist, L, THREE, SkeletonUtils, load: (url) => loader.loadAsync(url) };
