/**
 * Keyboard.js
 * Tracks which keys are currently held down.
 * Replaces the old THREEx.KeyboardState library.
 */

const keysPressed = {};

document.addEventListener('keydown', e => {
    keysPressed[e.key.toLowerCase()] = true;
});
document.addEventListener('keyup', e => {
    keysPressed[e.key.toLowerCase()] = false;
});

export { keysPressed };
