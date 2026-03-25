import * as THREE from 'three';
import { textureLoader } from './Loaders.js';

// Pool ảnh cho mặt TRƯỚC (face index 4, +Z) của mỗi cube
const FRONT_IMAGE_POOL = [
    'images/dung/dl1.jpg',
    'images/dung/dl3.jpg',
    'images/dung/dl4.jpg',
    'images/dung/dl5.jpg',
    'images/dung/dl6.jpg'
];

// Pool ảnh cho mặt SAU (face index 5, -Z) của mỗi cube
const BACK_IMAGE_POOL = [
    'images/dung/dl2.jpg'
];

// Cache loaded textures so the same image is never decoded twice
const _texCache = {};
function _getTex(path) {
    if (!_texCache[path]) {
        const tex = textureLoader.load(path, (loadedTex) => {
            // Giữ tỉ lệ gốc của ảnh theo kiểu "cover" (crop giữa)
            // Mặt cube là hình vuông (80x80) => tỉ lệ mục tiêu = 1:1
            const imgW = loadedTex.image.width;
            const imgH = loadedTex.image.height;
            const imgAspect = imgW / imgH;
            const targetAspect = 1; // 80/80

            let repeatX = 1, repeatY = 1, offsetX = 0, offsetY = 0;
            if (imgAspect > targetAspect) {
                // Ảnh rộng hơn mặt cube → crop hai bên trái/phải
                repeatX = targetAspect / imgAspect;
                offsetX = (1 - repeatX) / 2;
            } else {
                // Ảnh cao hơn mặt cube → crop trên/dưới
                repeatY = imgAspect / targetAspect;
                offsetY = (1 - repeatY) / 2;
            }

            loadedTex.repeat.set(repeatX, repeatY);
            loadedTex.offset.set(offsetX, offsetY);
            loadedTex.needsUpdate = true;
        });
        _texCache[path] = tex;
    }
    return _texCache[path];
}

/**
 * Build 6 materials for one cube.
 * Face indices (THREE.BoxGeometry): 0=+X, 1=-X, 2=+Y, 3=-Y, 4=+Z (front), 5=-Z (back)
 * - Face 4 → FRONT_IMAGE_POOL
 * - Face 5 → BACK_IMAGE_POOL
 * - Face 0-3 → FRONT_IMAGE_POOL (các mặt bên)
 */
function _makeCubeMaterials(offset) {
    return Array.from({ length: 6 }, (_, face) => {
        let path;
        if (face === 4) {
            // Mặt trước (+Z)
            path = FRONT_IMAGE_POOL[(offset) % FRONT_IMAGE_POOL.length];
        } else if (face === 5) {
            // Mặt sau (-Z)
            path = BACK_IMAGE_POOL[(offset) % BACK_IMAGE_POOL.length];
        } else {
            // Mặt bên (0-3)
            path = FRONT_IMAGE_POOL[(offset + face) % FRONT_IMAGE_POOL.length];
        }
        return new THREE.MeshBasicMaterial({ map: _getTex(path) });
    });
}

let _cubes = [];
let _glowCubes = [];
let _isHovered = false;
let _hoveredCube = null;
let _activeCube = null;

// Orbit pivot for revolving around the center (where CrystalBall is)
let _orbitPivot = null;

// ─────────────────────────────────────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────────────────────────────────────
export function createAlbumCube(scene) {
    const geometry = new THREE.BoxGeometry(80, 80, 4);
    const glowGeom = new THREE.BoxGeometry(88, 88, 8);

    _orbitPivot = new THREE.Object3D();
    _orbitPivot.position.set(0, 0, 0);

    const radius = 320; // inside CrystalBall (r=450); worst-case corner ≈ 394
    const levels = [-140, 0, 140]; // 3 tầng
    const cubesPerLevel = 6;
    let cubeIndex = 0; // global counter so each cube gets a unique image offset

    for (let j = 0; j < levels.length; j++) {
        const heightY = levels[j];

        for (let i = 0; i < cubesPerLevel; i++) {
            // Each cube gets its own set of 6 face materials, offset by cubeIndex
            const cubeMats = _makeCubeMaterials(cubeIndex);
            const cube = new THREE.Mesh(geometry, cubeMats);
            cubeIndex++;

            // Xoay lệch góc giữa các tầng để xếp xen kẽ (so le)
            const angleOffset = (j % 2 === 0) ? 0 : (Math.PI / cubesPerLevel);
            const angle = (i / cubesPerLevel) * Math.PI * 2 + angleOffset;

            cube.position.x = Math.sin(angle) * radius;
            cube.position.y = heightY;
            cube.position.z = Math.cos(angle) * radius;
            cube.rotation.y = angle; // Làm bề mặt mặt phẳng hướng ra ngoài

            cube.userData = {
                originalX: cube.position.x,
                originalY: cube.position.y,
                originalZ: cube.position.z,
                originalRy: cube.rotation.y
            };

            // Glow outline – slightly bigger, back-side, additive blending
            const glowMat = new THREE.MeshBasicMaterial({
                color: 0x88d4ff,
                side: THREE.BackSide,
                transparent: true,
                opacity: 0,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            });

            const glowCube = new THREE.Mesh(glowGeom, glowMat);
            glowCube.position.copy(cube.position);
            glowCube.rotation.y = cube.rotation.y;

            // Layer 1: visible to main camera but NOT to CubeCamera (layer 0 only).
            // This prevents the refraction envmap from capturing the cubes,
            // so they are invisible through the crystal ball from outside.
            cube.layers.set(1);

            _orbitPivot.add(cube);

            glowCube.layers.set(1);
            _orbitPivot.add(glowCube);

            _cubes.push(cube);
            _glowCubes.push(glowCube);
        }
    }

    scene.add(_orbitPivot);
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERACTION API
// ─────────────────────────────────────────────────────────────────────────────
export function getAlbumCubes() {
    return _cubes; // Trả về các cube để raycaster bắt hit 
}

export function setAlbumCubeHovered(cube, hovered) {
    if (hovered) {
        _hoveredCube = cube;
        _isHovered = true;
    } else {
        if (_hoveredCube === cube) _hoveredCube = null;
        _isHovered = false;
    }
}

export function triggerCubeClick(cube, camera) {
    if (_activeCube === cube) {
        _activeCube = null; // Toggle off
    } else {
        _activeCube = cube;

        if (camera && _orbitPivot) {
            const distance = 300; // Distance in front of the camera

            // Calculate direction camera is looking
            const cameraDirection = new THREE.Vector3();
            camera.getWorldDirection(cameraDirection);

            // Calculate target world position (distance units in front of camera)
            const targetWorldPos = new THREE.Vector3();
            targetWorldPos.copy(camera.position).add(cameraDirection.multiplyScalar(distance));

            // Convert to local space of _orbitPivot
            const targetLocalPos = _orbitPivot.worldToLocal(targetWorldPos);

            // Calculate world rotation Y to face the camera
            const toCamera = new THREE.Vector3().subVectors(camera.position, _orbitPivot.localToWorld(targetLocalPos.clone()));
            const worldRy = Math.atan2(toCamera.x, toCamera.z);

            // Store local coordinates
            cube.userData.targetX = targetLocalPos.x;
            cube.userData.targetY = targetLocalPos.y;
            cube.userData.targetZ = targetLocalPos.z;
            cube.userData.targetRy = worldRy - _orbitPivot.rotation.y;
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE  (call every frame)
// ─────────────────────────────────────────────────────────────────────────────
export function updateAlbumCube() {
    if (!_orbitPivot || _cubes.length === 0) return;

    // Gentle idle orbit revolution (dừng khi hover hoặc có khối active)
    if (!_isHovered && !_activeCube) {
        _orbitPivot.rotation.y += 0.002;
    }

    const Z_target = 500;
    const Y_target = 0;
    const activeScale = 3.0; // zoom level
    const hoverScale = 1.15;
    const normalScale = 1.0;

    const pY = _orbitPivot.rotation.y;

    for (let i = 0; i < _cubes.length; i++) {
        const cube = _cubes[i];
        const glowCube = _glowCubes[i];

        const isActive = (_activeCube === cube);
        const isHover = (_hoveredCube === cube);

        let tX = cube.userData.originalX;
        let tY = cube.userData.originalY;
        let tZ = cube.userData.originalZ;
        let tRy = cube.userData.originalRy;

        let tScale = isActive ? activeScale : (isHover ? hoverScale : normalScale);
        let tGlow = isHover ? 0.4 : (isActive ? 0.6 : 0);

        if (isActive) {
            if (cube.userData.targetX !== undefined) {
                tX = cube.userData.targetX;
                tY = cube.userData.targetY;
                tZ = cube.userData.targetZ;
                tRy = cube.userData.targetRy;
            } else {
                tX = -Math.sin(pY) * Z_target;
                tZ = Math.cos(pY) * Z_target;
                tY = Y_target;
                tRy = -pY;
            }
        }

        // Smooth pos lerp
        cube.position.x += (tX - cube.position.x) * 0.1;
        cube.position.y += (tY - cube.position.y) * 0.1;
        cube.position.z += (tZ - cube.position.z) * 0.1;

        // Rotations shortest path
        let diff = (tRy - cube.rotation.y) % (Math.PI * 2);
        if (diff > Math.PI) diff -= Math.PI * 2;
        if (diff < -Math.PI) diff += Math.PI * 2;
        cube.rotation.y += diff * 0.1;

        // Smooth scale lerp
        cube.scale.x += (tScale - cube.scale.x) * 0.12;
        cube.scale.y += (tScale - cube.scale.y) * 0.12;
        cube.scale.z += (tScale - cube.scale.z) * 0.12;

        glowCube.position.copy(cube.position);
        glowCube.rotation.y = cube.rotation.y;
        glowCube.scale.copy(cube.scale);

        // Glow opacity fade
        const glowMat = glowCube.material;
        // glowMat.opacity += (tGlow - glowMat.opacity) * 0.1;
    }
}
