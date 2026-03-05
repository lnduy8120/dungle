/**
 * Loaders.js
 * Single shared THREE.LoadingManager, TextureLoader and FontLoader.
 *
 * Every module should import loaders from here so that loading progress
 * can be tracked globally and the loading screen knows when everything
 * is ready.
 *
 * Usage:
 *   import { textureLoader, fontLoader } from './Loaders.js';
 */

import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';

// ── Shared manager ────────────────────────────────────────────────────────────
export const manager = new THREE.LoadingManager();

// ── Shared loaders ────────────────────────────────────────────────────────────
export const textureLoader = new THREE.TextureLoader(manager);
export const fontLoader = new FontLoader(manager);

// ── Progress / completion callbacks ──────────────────────────────────────────
let _onProgress = null;
let _onComplete = null;

/** Register a callback invoked on each asset load event. */
export function onLoadingProgress(cb) { _onProgress = cb; }

/** Register a callback invoked once ALL assets have finished loading. */
export function onLoadingComplete(cb) { _onComplete = cb; }

manager.onProgress = (url, loaded, total) => {
    const pct = total > 0 ? Math.round((loaded / total) * 100) : 0;
    const filename = url.split('/').pop();
    _onProgress?.(pct, filename);
};

manager.onLoad = () => {
    _onComplete?.();
};

manager.onError = (url) => {
    console.warn('[Loaders] Failed to load:', url);
    // Do not block completion on individual asset errors
};
