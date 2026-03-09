/**
 * SceneSetup.js
 * Creates and returns the core Three.js objects:
 * Scene, PerspectiveCamera, and WebGLRenderer.
 */

import * as THREE from 'three';

export function createScene() {
    return new THREE.Scene();
}

export function createCamera() {
    const camera = new THREE.PerspectiveCamera(
        80,
        window.innerWidth / window.innerHeight,
        0.1,
        20000
    );
    camera.position.set(0, 0, 1000);
    return camera;
}

export function createRenderer() {
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    return renderer;
}
