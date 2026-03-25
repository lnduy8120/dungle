/**
 * Raycaster.js
 * Generic mouse-interaction engine for Three.js objects.
 *
 * Usage:
 *   1. Call initRaycaster(camera, renderer.domElement) once.
 *   2. Call addInteractable(mesh, { onEnter, onLeave, onClick }) for each object.
 *   3. Call updateRaycasting() every frame inside your animate loop.
 *
 * Supports:
 *   - Hover enter / leave callbacks
 *   - Click callback
 *   - Cursor pointer style when hovering
 *   - Recursive child intersection (for Groups / loaded models)
 */

import * as THREE from 'three';

const _raycaster = new THREE.Raycaster();
_raycaster.layers.enable(1); // also test layer 1 (album cubes)
const _pointer = new THREE.Vector2(-9999, -9999); // start off-screen
const _registry = []; // Array<{ object, onEnter, onLeave, onClick, _hovered }>

let _camera = null;
let _clickPending = false;

// ─────────────────────────────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────────────────────────────
export function initRaycaster(camera, domElement) {
    _camera = camera;

    // ── Desktop: track mouse position ────────────────────────────────────────
    domElement.addEventListener('pointermove', e => {
        const rect = domElement.getBoundingClientRect();
        _pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        _pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    });

    // Flag a click for the next updateRaycasting() call
    domElement.addEventListener('click', () => { _clickPending = true; });

    // Reset pointer when mouse leaves the canvas
    domElement.addEventListener('pointerleave', () => {
        _pointer.set(-9999, -9999);
    });

    // ── Mobile / Touch: update pointer on tap ─────────────────────────────────
    let _touchStartX = 0;
    let _touchStartY = 0;

    domElement.addEventListener('touchstart', e => {
        const touch = e.touches[0];
        const rect = domElement.getBoundingClientRect();
        _touchStartX = touch.clientX;
        _touchStartY = touch.clientY;
        // Update raycaster pointer immediately on touch down
        _pointer.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
        _pointer.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
    }, { passive: true });

    domElement.addEventListener('touchend', e => {
        const touch = e.changedTouches[0];
        const dx = touch.clientX - _touchStartX;
        const dy = touch.clientY - _touchStartY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        // Only treat as a tap (not a drag/pan) if finger moved < 12px
        if (dist < 12) {
            _clickPending = true;
        }
    }, { passive: true });
}


// ─────────────────────────────────────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @param {THREE.Object3D} object3D  - The object to watch (can be a Group).
 * @param {{ onEnter, onLeave, onClick }} callbacks
 */
export function addInteractable(object3D, { onEnter, onLeave, onClick } = {}) {
    _registry.push({
        object: object3D,
        onEnter,
        onLeave,
        onClick,
        _hovered: false
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE  (call every frame)
// ─────────────────────────────────────────────────────────────────────────────
export function updateRaycasting() {
    if (!_camera || _registry.length === 0) return;

    _raycaster.setFromCamera(_pointer, _camera);

    // Collect all registered root objects
    const rootObjects = _registry.map(r => r.object);

    // intersectObjects with recursive=true handles Groups and children
    const hits = _raycaster.intersectObjects(rootObjects, true);

    // Map each hit back to the registered root object
    const hoveredRoots = new Set();
    hits.forEach(hit => {
        // Walk up the parent chain until we find a registered root
        let obj = hit.object;
        while (obj) {
            if (rootObjects.includes(obj)) { hoveredRoots.add(obj); break; }
            obj = obj.parent;
        }
    });

    let anythingHovered = false;

    _registry.forEach(item => {
        const isHit = hoveredRoots.has(item.object);
        if (isHit) anythingHovered = true;

        // Hover enter
        if (isHit && !item._hovered) {
            item._hovered = true;
            item.onEnter?.(item.object);
        }
        // Hover leave
        if (!isHit && item._hovered) {
            item._hovered = false;
            item.onLeave?.(item.object);
        }
        // Click (only fires once per click, on the first hit in registry order)
        if (isHit && _clickPending) {
            item.onClick?.(item.object);
        }
    });

    // Change cursor
    document.body.style.cursor = anythingHovered ? 'pointer' : '';

    // Consume click flag
    _clickPending = false;
}
