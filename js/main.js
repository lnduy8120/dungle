/**
 * main.js
 * Entry point for the DUY NE 3D world.
 *
 * Imports all scene modules and orchestrates the init → animate loop.
 * Each module is responsible for its own Three.js objects; main.js
 * only wires them together and runs the shared clock/loop.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ── Scene modules ──────────────────────────────────────────────────────────
import { keysPressed } from './modules/Keyboard.js';
import { createScene, createCamera, createRenderer } from './modules/SceneSetup.js';
import { createSkyBox } from './modules/SkyBox.js';
import {
    createCrystalBall, updateCrystalBall,
    renderCrystalBall, triggerBeatPulse
} from './modules/CrystalBall.js';
import {
    createVideoScreen, updateVideoTexture,
    getVideoElement
} from './modules/VideoScreen.js';
import { createText3D, updateText3D } from './modules/Text3D.js';
import { createAlbumCube, updateAlbumCube } from './modules/AlbumCube.js';
import { createParticles, updateParticles } from './modules/Particles.js';
import {
    setupMouseTracking, setupFullscreen,
    setupResize
} from './modules/EventHandlers.js';
import { initRaycaster, updateRaycasting } from './modules/Raycaster.js';
import { setupInteractions } from './modules/Interactions.js';
import {
    initAudioVisualizer, updateAudioVisualizer,
    connectAudio, disconnectAudio, isBeat, isAudioConnected
} from './modules/AudioVisualizer.js';
import { onLoadingProgress, onLoadingComplete } from './modules/Loaders.js';

// ── Shared state ───────────────────────────────────────────────────────────
const clock = new THREE.Clock();
const START_TIME = Date.now();

let scene, camera, renderer, controls;
let mouseState;

// ─────────────────────────────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────────────────────────────
function init() {
    // Core Three.js objects
    scene = createScene();
    camera = createCamera();
    renderer = createRenderer();
    scene.add(camera);

    // Mount canvas into the DOM
    document.getElementById('ThreeJS').appendChild(renderer.domElement);

    // Orbit controls (mouse drag + pinch-to-zoom)
    controls = new OrbitControls(camera, renderer.domElement);
    controls.minDistance = 0;
    controls.maxDistance = 2000;
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;

    // Scene light
    const light = new THREE.PointLight(0xffffff, 1);
    light.position.set(0, 250, 0);
    scene.add(light);

    // ── Build scene objects ────────────────────────────────────────────────
    createSkyBox(scene);
    createCrystalBall(scene);
    createVideoScreen(scene);
    createText3D(scene);
    createAlbumCube(scene);
    createParticles(scene);

    // ── Browser event listeners ────────────────────────────────────────────
    mouseState = setupMouseTracking();
    setupFullscreen();
    setupResize(camera, renderer);

    // ── Raycasting & interactions ─────────────────────────────────────────
    initRaycaster(camera, renderer.domElement);
    // setupInteractions runs after scene objects exist
    // Text meshes load async, so Interactions.js polls internally
    setupInteractions(scene, camera);

    // ── Audio visualizer ───────────────────────────────────────────────────
    // Uses the VideoScreen's <video> element as the audio source.
    // AudioContext is created lazily on first user click to comply with
    // browser autoplay policy.
    initAudioVisualizer(scene);

    // ── Loading screen callbacks ───────────────────────────────────────────
    onLoadingProgress((pct, filename) => {
        document.dispatchEvent(new CustomEvent('loading-progress', {
            detail: { pct, filename }
        }));
    });
    onLoadingComplete(() => {
        document.dispatchEvent(new CustomEvent('loading-complete'));
    });

    // Listen for toggle event dispatched by the UI button in index.html
    document.addEventListener('toggle-audio', () => {
        const video = getVideoElement();
        if (!video) return;

        if (isAudioConnected()) {
            disconnectAudio(video);
            document.dispatchEvent(new CustomEvent('audio-state', { detail: false }));
        } else {
            connectAudio(video);
            document.dispatchEvent(new CustomEvent('audio-state', { detail: true }));
        }
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE  (game logic, called every frame before render)
// ─────────────────────────────────────────────────────────────────────────────
function update() {
    const time = 4 * clock.getElapsedTime();
    const mouseX = mouseState.getMouseX();
    const mouseY = mouseState.getMouseY();

    // Particles + crystal ball + text shimmer + album cube + audio
    updateParticles(time);
    updateText3D(time);
    updateCrystalBall();
    updateAlbumCube();
    updateAudioVisualizer(time);
    updateRaycasting();

    // Beat detection → crystal ball pulse
    if (isBeat()) triggerBeatPulse();

    // F key → fly-through camera move
    if (keysPressed['f']) {
        const pos = ((Date.now() - START_TIME) * 0.03) % 900;
        camera.position.x += (mouseX - camera.position.x) * 0.01;
        camera.position.y += (-mouseY - camera.position.y) * 0.07;
        camera.position.z = -pos + 900;
    }

    // Video keyboard controls
    const video = getVideoElement();
    if (video) {
        if (keysPressed['p']) video.play();
        if (keysPressed[' ']) video.pause();
        if (keysPressed['s']) { video.pause(); video.currentTime = 0; }
        if (keysPressed['r']) video.currentTime = 0;
    }

    controls.update(); // required when enableDamping = true

    // When transitioning into CrystalBall (radius 450), lock view to exact center
    const dist = camera.position.length();
    if (dist > 1 && dist < 450) {
        if (window._prevCamDist === undefined) window._prevCamDist = dist;

        if (dist < window._prevCamDist) {
            // Zooming in: snap to center
            camera.position.copy(camera.position.normalize().multiplyScalar(0.1));
            controls.target.set(0, 0, 0);
        } else if (dist > window._prevCamDist) {
            // Zooming out: pop out
            camera.position.copy(camera.position.normalize().multiplyScalar(451));
        }
    }
    window._prevCamDist = camera.position.length();
}

// ─────────────────────────────────────────────────────────────────────────────
// RENDER
// ─────────────────────────────────────────────────────────────────────────────
function render() {
    updateVideoTexture();           // push latest video frame to GPU
    renderCrystalBall(renderer, scene); // refresh env-map cube camera
    renderer.render(scene, camera);
}

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATE LOOP
// ─────────────────────────────────────────────────────────────────────────────
function animate() {
    requestAnimationFrame(animate);
    update();
    render();
}

// ── Start ─────────────────────────────────────────────────────────────────
init();
animate();
