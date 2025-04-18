export let hearts = { value: 10 };
export let isHit = { value: false };
export let hitTimer = { value: 0 };

import { rockCount } from './rock.js';

export function drawHearts(ctx) {
    for (let i = 0; i < hearts.value; i++) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(40 + i * 35, 40, 15, 0, Math.PI * 2);
        ctx.fillStyle = '#e53935';
        ctx.fill();
        ctx.restore();
    }
}

export function drawRockCounter(ctx) {
    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.fillText('Rocks: ' + rockCount.value, 40, 80);
    ctx.restore();
}

export function drawKillsCounter(ctx, kills) {
    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.fillText('Kills: ' + kills, 40, 110);
    ctx.restore();
}

export function drawPointsCounter(ctx, points) {
    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.fillText('Points: ' + points, 40, 110);
    ctx.restore();
}

export function drawMiniBoss(ctx, camera, miniBoss) {
    if (!miniBoss) return;
    // Draw mini boss (20x size of regular enemy)
    ctx.save();
    ctx.fillStyle = '#8e24aa';
    ctx.beginPath();
    ctx.arc(miniBoss.x - camera.x, miniBoss.y - camera.y, miniBoss.size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Draw health bar
    const barWidth = 120;
    const barHeight = 12;
    const barX = miniBoss.x - camera.x - barWidth / 2;
    const barY = miniBoss.y - camera.y + miniBoss.size / 2 + 10;
    ctx.save();
    ctx.fillStyle = '#222';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    ctx.fillStyle = '#43a047';
    ctx.fillRect(barX, barY, barWidth * (miniBoss.hp / miniBoss.maxHp), barHeight);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(barX, barY, barWidth, barHeight);
    ctx.restore();
}

export function handleHitEffect(ctx) {
    if (isHit.value) {
        hitTimer.value++;
        if (hitTimer.value < 15) {
            // Red flash overlay
            ctx.save();
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = '#ff1744';
            ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
            ctx.restore();
        }
        if (hitTimer.value >= 15) {
            isHit.value = false;
        }
    }
}
