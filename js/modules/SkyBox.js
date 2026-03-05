/**
 * SkyBox.js
 * Builds a cube skybox from 6 directional textures and adds exponential fog.
 */

import * as THREE from 'three';
import { textureLoader } from './Loaders.js';

const DIRECTIONS = ['xpos', 'xneg', 'ypos', 'yneg', 'zpos', 'zneg'];

export function createSkyBox(scene) {
    const skyGeometry = new THREE.BoxGeometry(5000, 5000, 5000);

    const skyMaterials = DIRECTIONS.map(dir =>
        new THREE.MeshBasicMaterial({
            map: textureLoader.load(`images/${dir}.png`),
            side: THREE.BackSide
        })
    );

    const skyBox = new THREE.Mesh(skyGeometry, skyMaterials);
    scene.add(skyBox);

    // Subtle white fog for depth
    scene.fog = new THREE.FogExp2(0xffffff, 0.00004);
}
