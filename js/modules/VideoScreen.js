/**
 * VideoScreen.js
 * Creates an in-world video screen by painting an HTML <video> element
 * onto a canvas each frame, then using that canvas as a Three.js texture.
 */

import * as THREE from 'three';

let _video = null;
let _videoCtx = null;
let _videoTexture = null;
let _videoCtx2 = null;
let _videoTexture2 = null;

export function createVideoScreen(scene) {
    // ── <video> element (shared by both screens) ─────────────────────────────
    const video = document.createElement('video');
    video.src = 'videos/video.mp4';
    video.loop = true;
    video.muted = true;        // required for autoplay in modern browsers
    video.playsInline = true;
    video.load();
    // Video stays paused until the user clicks "Enter World" — startVideo() will be called then.

    // ── Canvas texture – Screen 1 ─────────────────────────────────────────────
    const videoCanvas = document.createElement('canvas');
    videoCanvas.width = 1920;
    videoCanvas.height = 1080;

    const videoCtx = videoCanvas.getContext('2d');
    videoCtx.fillStyle = '#FFFFFF';
    videoCtx.fillRect(0, 0, videoCanvas.width, videoCanvas.height);

    const videoTexture = new THREE.CanvasTexture(videoCanvas);
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;

    // ── Plane mesh – Screen 1 ────────────────────────────────────────────────
    const movieMaterial = new THREE.MeshBasicMaterial({
        map: videoTexture,
        side: THREE.DoubleSide
    });
    const movieGeometry = new THREE.PlaneGeometry(1080, 720, 5, 5);
    const movieScreen = new THREE.Mesh(movieGeometry, movieMaterial);
    movieScreen.position.set(900, 60, 250);
    movieScreen.rotation.y = Math.PI / 1.7;
    scene.add(movieScreen);

    // ── Canvas texture – Screen 2 (đối xứng) ─────────────────────────────────
    const videoCanvas2 = document.createElement('canvas');
    videoCanvas2.width = 1920;
    videoCanvas2.height = 1080;

    const videoCtx2 = videoCanvas2.getContext('2d');
    videoCtx2.fillStyle = '#FFFFFF';
    videoCtx2.fillRect(0, 0, videoCanvas2.width, videoCanvas2.height);

    const videoTexture2 = new THREE.CanvasTexture(videoCanvas2);
    videoTexture2.minFilter = THREE.LinearFilter;
    videoTexture2.magFilter = THREE.LinearFilter;

    // ── Plane mesh – Screen 2 (đối xứng qua gốc) ────────────────────────────
    const movieMaterial2 = new THREE.MeshBasicMaterial({
        map: videoTexture2,
        side: THREE.DoubleSide
    });
    const movieGeometry2 = new THREE.PlaneGeometry(1080, 720, 5, 5);
    const movieScreen2 = new THREE.Mesh(movieGeometry2, movieMaterial2);
    movieScreen2.position.set(-900, 60, -250);
    movieScreen2.rotation.y = Math.PI / -1.5;
    scene.add(movieScreen2);

    // Cache for updateVideoTexture()
    _video = video;
    _videoCtx = videoCtx;
    _videoTexture = videoTexture;
    _videoCtx2 = videoCtx2;
    _videoTexture2 = videoTexture2;
}

/** Copy the current video frame onto both canvas textures each render tick. */
export function updateVideoTexture() {
    if (_video && _video.readyState === _video.HAVE_ENOUGH_DATA) {
        _videoCtx.drawImage(_video, 0, 0);
        _videoTexture.needsUpdate = true;
        _videoCtx2.drawImage(_video, 0, 0);
        _videoTexture2.needsUpdate = true;
    }
}

/** Expose the raw <video> element so keyboard controls can play/pause it. */
export function getVideoElement() {
    return _video;
}

/** Called once when the user clicks "Enter World" to begin playback. */
export function startVideo() {
    if (_video) {
        _video.play().catch(err => console.warn('[VideoScreen] play() failed:', err));
    }
}
