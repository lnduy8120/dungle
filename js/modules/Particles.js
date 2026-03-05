/**
 * Particles.js
 * Creates a "magic" glowing particle cloud arranged in a spherical shell.
 *
 * SpriteMaterial changes from r58 → r170:
 *  - 'useScreenCoordinates' property removed.
 *  - blending is now set per-material as before.
 */

import * as THREE from 'three';
import { textureLoader } from './Loaders.js';

const TOTAL_PARTICLES = 200;
const RADIUS_RANGE = 900;

let _particleGroup = null;
let _startPositions = [];
let _randomness = [];

export function createParticles(scene) {
    const particleTexture = textureLoader.load('images/spark.png');
    _particleGroup = new THREE.Object3D();
    _startPositions = [];
    _randomness = [];

    for (let i = 0; i < TOTAL_PARTICLES; i++) {
        const spriteMat = new THREE.SpriteMaterial({
            map: particleTexture,
            color: 0xffffff,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(32, 32, 1.0);

        // Place on a spherical shell
        sprite.position.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
        sprite.position.setLength(RADIUS_RANGE * (Math.random() * 0.1 + 0.9));

        // Random hue per particle
        sprite.material.color.setHSL(Math.random(), 0.9, 0.7);

        _particleGroup.add(sprite);
        _startPositions.push(sprite.position.clone());
        _randomness.push(Math.random());
    }

    _particleGroup.position.y = 0;
    scene.add(_particleGroup);
}

/**
 * Animate particles: pulsate toward/away from center and rotate the whole group.
 * @param {number} time - Elapsed time value from the animation clock.
 */
export function updateParticles(time) {
    for (let c = 0; c < _particleGroup.children.length; c++) {
        const sprite = _particleGroup.children[c];
        const a = _randomness[c] + 1;
        const pulseFactor = Math.sin(a * time) * 0.002 + 0.9;

        sprite.position.x = _startPositions[c].x * pulseFactor;
        sprite.position.y = _startPositions[c].y * pulseFactor;
        sprite.position.z = _startPositions[c].z * pulseFactor;
    }

    _particleGroup.rotation.y = time * 0.04;
}
