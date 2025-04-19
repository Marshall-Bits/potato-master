// UI constants
const HEART_COLOR = '#e53935';
const ROCK_COLOR = '#bdbdbd';
const POINTS_COLOR = '#fff';
const HIT_FLASH_COLOR = '#ff1744';

export let hearts = { value: 3 };
export let isHit = { value: false };
export let hitTimer = { value: 0 };

import { rockCount } from './rock.js';

export function drawHearts(ctx) {
    for (let i = 0; i < hearts.value; i++) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(40 + i * 35, 40, 15, 0, Math.PI * 2);
        ctx.fillStyle = HEART_COLOR;
        ctx.fill();
        ctx.restore();
    }
}

export function drawRockCounter(ctx) {
    ctx.save();
    ctx.fillStyle = ROCK_COLOR;
    ctx.font = '24px Arial';
    ctx.fillText('Rocks: ' + rockCount.value, 40, 80);
    ctx.restore();
}

export function drawPointsCounter(ctx, points) {
    ctx.save();
    ctx.fillStyle = POINTS_COLOR;
    ctx.font = '24px Arial';
    ctx.fillText('Points: ' + points, 40, 110);
    ctx.restore();
}

export function handleHitEffect(ctx) {
    if (!isHit.value) return;
    hitTimer.value++;
    if (hitTimer.value < 15) {
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = HIT_FLASH_COLOR;
        ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
        ctx.restore();
    }
    if (hitTimer.value >= 15) {
        isHit.value = false;
    }
}
