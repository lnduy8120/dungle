/**
 * CrystalBall.js
 * Creates a real-time environment-mapped refraction sphere (crystal ball).
 *
 * Interaction hooks (used by Interactions.js):
 *   getCrystalBallMesh()  – returns the sphere for raycasting
 *   setCrystalBallHovered(bool) – toggle glow halo
 *   triggerCrystalBallClick(scene) – spawn an expanding ripple ring
 */

import * as THREE from 'three';

let _refractSphere;
let _refractSphereCamera;
let _haloMesh;
let _haloTargetOpacity = 0;
let _isHovered = false;

// Ripple pool – independent animations run via requestAnimationFrame
const _ripples = [];

// ─────────────────────────────────────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────────────────────────────────────
export function createCrystalBall(scene) {
    const sphereGeom = new THREE.SphereGeometry(450, 64, 32);

    // CubeCamera for real-time environment refraction
    const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(512);
    cubeRenderTarget.texture.mapping = THREE.CubeRefractionMapping;

    _refractSphereCamera = new THREE.CubeCamera(0.1, 5000, cubeRenderTarget);
    scene.add(_refractSphereCamera);

    const refractMaterial = new THREE.MeshBasicMaterial({
        envMap: cubeRenderTarget.texture,
        refractionRatio: 0.985,
        reflectivity: 0.9
    });

    _refractSphere = new THREE.Mesh(sphereGeom, refractMaterial);
    _refractSphere.position.set(0, 0, 0);
    _refractSphereCamera.position.copy(_refractSphere.position);
    scene.add(_refractSphere);

    // ── Glow halo (slightly larger sphere, invisible by default) ──────────
    const haloGeom = new THREE.SphereGeometry(465, 32, 16);
    const haloMat = new THREE.MeshBasicMaterial({
        color: 0x88d4ff,
        transparent: true,
        opacity: 0,
        side: THREE.FrontSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });
    _haloMesh = new THREE.Mesh(haloGeom, haloMat);
    _haloMesh.position.copy(_refractSphere.position);
    scene.add(_haloMesh);
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERACTION API
// ─────────────────────────────────────────────────────────────────────────────
export function getCrystalBallMesh() {
    return _refractSphere;
}

export function setCrystalBallHovered(hovered) {
    _isHovered = hovered;
    _haloTargetOpacity = hovered ? 0.35 : 0;
}

/** Called on each detected beat — briefly scales the ball outward. */
let _beatScale = 1;
export function triggerBeatPulse() {
    _beatScale = 1.12; // snappy outward pop
}

/**
 * Spawns a flat ring that expands outward and fades — triggered on click.
 */
export function triggerCrystalBallClick(scene) {
    const geo = new THREE.RingGeometry(10, 30, 72);
    const mat = new THREE.MeshBasicMaterial({
        color: 0x88d4ff,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });

    const ring = new THREE.Mesh(geo, mat);
    ring.position.set(0, 0, 0);
    ring.lookAt(0, 0, 1); // face the camera (z-axis)
    scene.add(ring);

    const ripple = { ring, mat, scene, t: 0 };
    _ripples.push(ripple);
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE  (call every frame)
// ─────────────────────────────────────────────────────────────────────────────
export function updateCrystalBall() {
    _refractSphere.rotation.y += _isHovered ? 0.025 : 0.01;

    // Beat pulse: snap to _beatScale, ease back to 1
    _beatScale += (1 - _beatScale) * 0.18;
    _refractSphere.scale.setScalar(_beatScale);

    // Smooth halo fade in/out
    const haloMat = _haloMesh.material;
    haloMat.opacity += (_haloTargetOpacity - haloMat.opacity) * 0.08;

    // Pulse halo size when hovered
    if (_isHovered) {
        const pulse = 1 + 0.015 * Math.sin(Date.now() * 0.004);
        _haloMesh.scale.setScalar(pulse);
    }

    // Animate ripples
    for (let i = _ripples.length - 1; i >= 0; i--) {
        const r = _ripples[i];
        r.t += 0.018;
        if (r.t >= 1) {
            r.scene.remove(r.ring);
            r.ring.geometry.dispose();
            r.mat.dispose();
            _ripples.splice(i, 1);
            continue;
        }
        r.ring.scale.setScalar(1 + r.t * 55); // expand from 1× to 56×
        r.mat.opacity = (1 - r.t) * 0.85;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// RENDER  (call inside the render function)
// ─────────────────────────────────────────────────────────────────────────────
export function renderCrystalBall(renderer, scene) {
    _refractSphere.visible = false;
    _haloMesh.visible = false;
    _refractSphereCamera.update(renderer, scene);
    _refractSphere.visible = true;
    _haloMesh.visible = true;
    // renderer.render(scene, camera) is called by main.js after this returns
}
