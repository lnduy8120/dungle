/**
 * Interactions.js
 * Wires up all scene objects to the Raycaster engine.
 * Defines the specific visual response for each interactable.
 *
 * Objects and their behaviours:
 *
 *  Crystal Ball
 *    hover  → glow halo fades in, sphere spins faster
 *    click  → expanding ring ripple effect
 *
 *  Album Cube
 *    hover  → scale up + blue glow outline
 *    click  → full 360° spin
 *
 *  Text meshes
 *    hover  → super-charge the shimmer (handled inside Text3D.js via flag)
 */

import { addInteractable } from './Raycaster.js';
import {
    getCrystalBallMesh,
    setCrystalBallHovered,
    triggerCrystalBallClick
} from './CrystalBall.js';
import {
    getAlbumCubes,
    setAlbumCubeHovered,
    triggerCubeClick
} from './AlbumCube.js';
import {
    getTextMeshes,
    setTextHovered
} from './Text3D.js';

/**
 * Call once, after all scene objects have been created.
 * @param {THREE.Scene} scene - needed for the ripple effect
 */
export function setupInteractions(scene, camera) {

    // ── Crystal Ball ─────────────────────────────────────────────────────────
    const ball = getCrystalBallMesh();
    if (ball) {
        addInteractable(ball, {
            onEnter: () => setCrystalBallHovered(true),
            onLeave: () => setCrystalBallHovered(false),
            onClick: () => triggerCrystalBallClick(scene)
        });
    }

    // ── Album Cube ───────────────────────────────────────────────────────────
    const cubes = getAlbumCubes();
    cubes.forEach((cube) => {
        addInteractable(cube, {
            onEnter: () => setAlbumCubeHovered(cube, true),
            onLeave: () => setAlbumCubeHovered(cube, false),
            onClick: () => triggerCubeClick(cube, camera)
        });
    });

    // ── 3D Text meshes ────────────────────────────────────────────────────────
    // Text is loaded asynchronously – getTextMeshes() may return [] initially.
    // We poll until the fonts are loaded (max 10 s) then register them.
    const maxWait = 10000;
    const start = Date.now();

    function tryRegisterText() {
        const meshes = getTextMeshes();
        if (meshes.length > 0) {
            meshes.forEach((mesh, i) => {
                addInteractable(mesh, {
                    onEnter: () => setTextHovered(i, true),
                    onLeave: () => setTextHovered(i, false)
                    // no click action for text
                });
            });
        } else if (Date.now() - start < maxWait) {
            setTimeout(tryRegisterText, 300);
        }
    }
    tryRegisterText();
}
