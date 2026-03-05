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
const _pointer = new THREE.Vector2(-9999, -9999); // start off-screen
const _registry = []; // Array<{ object, onEnter, onLeave, onClick, _hovered }>

let _camera = null;
let _clickPending = false;

// ─────────────────────────────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────────────────────────────
export function initRaycaster(camera, domElement) {
    _camera = camera;

    // Track normalised device coordinates
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
