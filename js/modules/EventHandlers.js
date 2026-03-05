/**
 * EventHandlers.js
 * Sets up browser event listeners that were previously handled by
 * THREEx.WindowResize, THREEx.FullScreen, and raw DOM events.
 */

/**
 * Tracks mouse position relative to the screen centre.
 * Returns getter functions to avoid exposing mutable variables directly.
 */
export function setupMouseTracking() {
    let mouseX = 0;
    let mouseY = 0;
    let windowHalfX = window.innerWidth / 2;
    let windowHalfY = window.innerHeight / 2;

    document.addEventListener('mousemove', e => {
        mouseX = (e.clientX - windowHalfX) * 0.25;
        mouseY = (e.clientY - windowHalfY) * 0.15;
    });

    // Keep halves in sync when the window resizes
    window.addEventListener('resize', () => {
        windowHalfX = window.innerWidth / 2;
        windowHalfY = window.innerHeight / 2;
    });

    return {
        getMouseX: () => mouseX,
        getMouseY: () => mouseY
    };
}

/**
 * Toggle fullscreen when the user presses Z.
 * Replaces THREEx.FullScreen.bindKey({ charCode: 'z'.charCodeAt(0) }).
 */
export function setupFullscreen() {
    document.addEventListener('keydown', e => {
        if (e.key.toLowerCase() === 'z') {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
        }
    });
}

/**
 * Keep camera aspect ratio and renderer size in sync with the browser window.
 * Replaces THREEx.WindowResize(renderer, camera).
 */
export function setupResize(camera, renderer) {
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}
