/**
 * Text3D.js
 * Creates centered, animated 3D text with shimmering colors.
 *
 * Centering: computeBoundingBox() + translate() to shift geometry so its
 * midpoint aligns with the mesh's local origin.
 *
 * Shimmer: MeshPhongMaterial with animated HSL color + pulsing emissive.
 * Call updateText3D(time) every frame from the main animate loop.
 */

import * as THREE from 'three';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { fontLoader } from './Loaders.js';

const FONT_URL =
    'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/fonts/helvetiker_bold.typeface.json';

// ── Text definitions ──────────────────────────────────────────────────────────
// position.x is set to 0 — centering is handled via geometry translation below.
const TEXT_CONFIGS = [
    {
        text: 'Hello',
        size: 100,
        depth: 20,
        curveSegments: 6,
        position: [0, 480, 100],
        rotation: null,
        hueStart: 0.12,   // gold
        phase: 0
    },
    {
        text: 'Hold F to fly',
        size: 50,
        depth: 4,
        curveSegments: 6,
        position: [0, -580, 100],
        rotation: null,
        hueStart: 0.75,   // purple
        phase: Math.PI * 0.66
    },
    {
        text: 'Alo Alo !!!',
        size: 30,
        depth: 4,
        curveSegments: 6,
        position: [0, -490, 120],
        rotation: [-Math.PI / 4, 0, 0],
        hueStart: 0.58,   // cyan-blue
        phase: Math.PI * 1.33
    }
];

// Mesh references – populated once the font loads
const _textMeshes = [];
const _hoverStates = []; // parallel array: true = this mesh is hovered

// ─────────────────────────────────────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────────────────────────────────────
export function createText3D(scene) {

    fontLoader.load(FONT_URL, font => {
        TEXT_CONFIGS.forEach(cfg => {
            // ── Geometry ────────────────────────────────────────────────────
            const geom = new TextGeometry(cfg.text, {
                font,
                size: cfg.size,
                depth: cfg.depth,
                curveSegments: cfg.curveSegments,
                bevelEnabled: true,
                bevelThickness: cfg.size * 0.012,
                bevelSize: cfg.size * 0.008,
                bevelSegments: 4
            });

            // Center the geometry on its own local origin
            geom.computeBoundingBox();
            const bb = geom.boundingBox;
            geom.translate(
                -(bb.max.x - bb.min.x) / 2,
                -(bb.max.y - bb.min.y) / 2,
                0
            );

            // ── Material (animated later in updateText3D) ────────────────
            const mat = new THREE.MeshPhongMaterial({
                color: new THREE.Color().setHSL(cfg.hueStart, 0.95, 0.60),
                emissive: new THREE.Color().setHSL(cfg.hueStart, 1.0, 0.25),
                emissiveIntensity: 0.5,
                specular: new THREE.Color(0xffffff),
                shininess: 160,
                reflectivity: 1
            });

            // ── Mesh ────────────────────────────────────────────────────
            const mesh = new THREE.Mesh(geom, mat);
            mesh.position.set(...cfg.position);
            if (cfg.rotation) mesh.rotation.set(...cfg.rotation);

            // Store per-mesh animation data
            mesh.userData.phase = cfg.phase;
            mesh.userData.hueStart = cfg.hueStart;

            scene.add(mesh);
            _textMeshes.push(mesh);
            _hoverStates.push(false);
        });
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERACTION API  (used by Interactions.js)
// ─────────────────────────────────────────────────────────────────────────────
/** Returns the array of text meshes (may be empty before font loads). */
export function getTextMeshes() {
    return _textMeshes;
}

/** Tell Text3D that mesh at index i is hovered so shimmer is boosted. */
export function setTextHovered(index, hovered) {
    _hoverStates[index] = hovered;
}

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATE  (call every frame)
// ─────────────────────────────────────────────────────────────────────────────
export function updateText3D(time) {
    _textMeshes.forEach((mesh, i) => {
        const mat = mesh.material;
        const phase = mesh.userData.phase;
        const base = mesh.userData.hueStart;
        const hovered = _hoverStates[i] || false;

        // Hue shift — faster when hovered
        const speed = hovered ? 0.22 : 0.08;
        const hue = (base + time * speed + phase * 0.05) % 1;
        const hue2 = (hue + 0.35) % 1;

        mat.color.setHSL(hue, 0.95, hovered ? 0.76 : 0.62);

        // Emissive pulse — stronger glow when hovered
        const glowAmp = hovered ? 0.85 : 0.55;
        const glow = 0.25 + glowAmp * Math.abs(Math.sin(time * 2.5 + phase));
        mat.emissive.setHSL(hue2, 1.0, 0.4);
        mat.emissiveIntensity = glow;

        // Scale pulse — more pronounced when hovered
        const scaleTarget = hovered
            ? 1 + 0.04 * Math.sin(time * 4.0 + phase)
            : 1 + 0.012 * Math.sin(time * 3.0 + phase);
        mesh.scale.setScalar(scaleTarget);
    });
}
