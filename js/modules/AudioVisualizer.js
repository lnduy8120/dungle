/**
 * AudioVisualizer.js
 * Analyses the audio of the VideoScreen's <video> element in real-time
 * and maps frequency data onto a ring of 3D bar meshes.
 *
 * ── Toggle design ────────────────────────────────────────────────────────────
 *  ON : AudioContext created (once), createMediaElementSource called (once),
 *       analyser reconnected to destination, video unmuted.
 *  OFF: analyser disconnected from destination, video muted.
 *       AudioContext + source node are kept alive — never destroyed.
 * ────────────────────────────────────────────────────────────────────────────
 *
 * Public API
 * ──────────
 *   initAudioVisualizer(scene)        – build bar ring (call once)
 *   connectAudio(videoElement)        – enable audio (needs user gesture)
 *   disconnectAudio(videoElement)     – mute/pause without destroying graph
 *   updateAudioVisualizer(time)       – call every frame
 *   isAudioConnected()                – true while audio is routed
 *   isBeat()                          – true on bass beat transients
 */

import * as THREE from 'three';

// ── Geometry constants ────────────────────────────────────────────────────────
const BAR_COUNT = 96;
const ORBIT_RADIUS = 560;
const MAX_HEIGHT = 380;
const BAR_W = 9;
const BAR_D = 9;
const BASE_Y = -160;

// ── Module state ──────────────────────────────────────────────────────────────
/** @type {THREE.Mesh[]} */
const _bars = [];

let _audioCtx = null;  // AudioContext — created once, never closed
let _source = null;  // MediaElementAudioSourceNode — created once
let _analyser = null;  // AnalyserNode
let _dataArray = null;  // Uint8Array FFT buffer
let _isReady = false; // true = analyser is connected to speakers
let _gainNode = null; // GainNode for volume control
let _targetVolume = 0.5; // Store volume state

const HISTORY_LEN = 24;
const _bassHistory = new Float32Array(HISTORY_LEN);
let _bassPtr = 0;

// ─────────────────────────────────────────────────────────────────────────────
// INIT  (only builds 3D bars — no audio setup yet)
// ─────────────────────────────────────────────────────────────────────────────
export function initAudioVisualizer(scene) {
    _buildBars(scene);
}

function _buildBars(scene) {
    for (let i = 0; i < BAR_COUNT; i++) {
        const angle = (i / BAR_COUNT) * Math.PI * 2;
        const geo = new THREE.BoxGeometry(BAR_W, 1, BAR_D);
        const mat = new THREE.MeshBasicMaterial({
            color: new THREE.Color().setHSL(i / BAR_COUNT, 1.0, 0.6),
            transparent: false,
            opacity: 1,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const bar = new THREE.Mesh(geo, mat);
        bar.position.set(
            Math.cos(angle) * ORBIT_RADIUS,
            BASE_Y,
            Math.sin(angle) * ORBIT_RADIUS
        );
        bar.rotation.y = -angle + Math.PI * 0.5;
        bar.userData.angle = angle;
        scene.add(bar);
        _bars.push(bar);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// CONNECT  (must be called from a user-gesture handler)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @param {HTMLVideoElement} videoElement – the video from VideoScreen.js
 */
export function connectAudio(videoElement) {
    if (!videoElement) {
        console.warn('[AudioVisualizer] No video element provided');
        return;
    }

    try {
        if (!_audioCtx) {
            // ── First call: build the Web Audio graph ─────────────────────
            // AudioContext creation is allowed without a gesture in most browsers,
            // but resume() might need one — we call it from inside a click handler.
            _audioCtx = new (window.AudioContext || window.webkitAudioContext)();

            // createMediaElementSource ONCE — calling it a second time throws
            _source = _audioCtx.createMediaElementSource(videoElement);
            _analyser = _audioCtx.createAnalyser();
            _analyser.fftSize = 256;  // 128 frequency bins
            _analyser.smoothingTimeConstant = 0.78;

            _gainNode = _audioCtx.createGain();
            _gainNode.gain.value = _targetVolume;

            _source.connect(_analyser);
            _analyser.connect(_gainNode);
            _dataArray = new Uint8Array(_analyser.frequencyBinCount);
        }

        // Ensure context is running (Chrome suspends it when tab is hidden)
        if (_audioCtx.state === 'suspended') _audioCtx.resume();

        // (Re-)attach gainNode → destination; safe to call multiple times
        _gainNode.connect(_audioCtx.destination);

        // Unmute the video so audio data flows into the Web Audio graph
        videoElement.muted = false;
        videoElement.volume = 1.0;
        videoElement.play().catch(err => {
            console.warn('[AudioVisualizer] video.play() failed:', err);
        });

        _bassHistory.fill(0);
        _bassPtr = 0;
        _isReady = true;

    } catch (err) {
        console.error('[AudioVisualizer] connectAudio error:', err);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// DISCONNECT  (mutes output; graph stays alive for instant re-use)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * @param {HTMLVideoElement} videoElement
 */
export function disconnectAudio(videoElement) {
    if (_gainNode && _audioCtx) {
        try {
            // Remove only the speaker connection; source → analyser graph intact
            _gainNode.disconnect(_audioCtx.destination);
        } catch (_) { /* already disconnected — ignore */ }
    }

    // Re-mute so the video goes back to silent autoplay behaviour
    if (videoElement) {
        videoElement.muted = true;
    }

    _isReady = false;
}

export function isAudioConnected() { return _isReady; }

export function setVolume(v) {
    _targetVolume = Math.max(0, Math.min(1, v));
    if (_gainNode) {
        // Use setTargetAtTime to avoid clicks/pops
        _gainNode.gain.setTargetAtTime(_targetVolume, _audioCtx.currentTime, 0.05);
    }
}

export function getVolume() { return _targetVolume; }

// ─────────────────────────────────────────────────────────────────────────────
// FREQUENCY HELPERS
// ─────────────────────────────────────────────────────────────────────────────
/** Returns 0–1 normalised average bass energy (bins 0–3 ≈ 0–340 Hz). */
export function getBassEnergy() {
    if (!_isReady || !_dataArray) return 0;
    let sum = 0;
    for (let i = 0; i < 4; i++) sum += _dataArray[i];
    return sum / (4 * 255);
}

/**
 * Simple onset beat detector.
 * Returns true for one frame when bass exceeds 1.42× its rolling average.
 */
export function isBeat() {
    const bass = getBassEnergy();
    _bassHistory[_bassPtr % HISTORY_LEN] = bass;
    _bassPtr++;

    let avg = 0;
    for (let i = 0; i < HISTORY_LEN; i++) avg += _bassHistory[i];
    avg /= HISTORY_LEN;

    return bass > avg * 1.42 && bass > 0.28;
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE  (call every frame)
// ─────────────────────────────────────────────────────────────────────────────
export function updateAudioVisualizer(time) {
    if (_isReady && _analyser) {
        _analyser.getByteFrequencyData(_dataArray);
    }

    const binCount = _analyser ? _analyser.frequencyBinCount : 0;

    _bars.forEach((bar, i) => {
        let height, opacity;

        if (_isReady && _analyser) {
            // ── Active: spectral-heat bars ────────────────────────────────────
            const binIdx = Math.floor((i / BAR_COUNT) * binCount * 0.85);
            const value = _dataArray[binIdx] / 255;

            height = value * MAX_HEIGHT + 4;

            // Base hue: full-spectrum rainbow around the ring, slowly rotating
            const baseHue = (i / BAR_COUNT + time * 0.03) % 1;

            // Amplitude shifts the hue: quiet bars stay true to their base,
            // loud bars get pushed toward warm (yellow/orange/red) tones.
            const heatShift = value * 0.18;
            const hue = (baseHue + heatShift) % 1;

            // Saturation spikes on loud hits; always vivid
            const sat = 0.85 + value * 0.15;

            // Deep when silent, blazing-bright on peaks
            const light = 0.22 + value * 0.65;

            opacity = 0.25 + value * 0.75;
            bar.material.color.setHSL(hue, sat, light);

        } else {
            // ── Idle: twin-wave shimmer with two competing hues ───────────────
            const TWO_PI = Math.PI * 2;
            const angle = i * (TWO_PI / BAR_COUNT);

            // Wave A — primary, slower
            const wA = Math.abs(Math.sin(time * 1.0 + angle));
            // Wave B — slightly faster, offset in phase & angular frequency
            const wB = Math.abs(Math.sin(time * 1.5 + angle * 1.4 + 1.8));

            const wave = wA * 0.6 + wB * 0.4;
            height = wave * 32 + 5;

            // Two hue streams rotating in opposite directions
            const hueA = (i / BAR_COUNT + time * 0.04) % 1;
            const hueB = (i / BAR_COUNT - time * 0.028 + 0.5) % 1;
            // Blend them by which wave dominates
            const blendT = wA / (wA + wB + 0.001);
            const hue = (hueA * blendT + hueB * (1 - blendT) + 1) % 1;

            opacity = 0.2 + wave * 0.22;
            bar.material.color.setHSL(hue, 0.95, 0.42 + wave * 0.22);
        }

        bar.scale.y = height;
        bar.position.y = BASE_Y + height * 0.5;
        bar.material.opacity = opacity;
    });
}
