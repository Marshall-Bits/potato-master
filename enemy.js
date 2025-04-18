export class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 30;
        this.color = '#fbc02d';
        this.speed = 2 + Math.random() * 1.5;
        this.type = 'regular';
    }
}

export class MiniBoss {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 30 * 6; // Decreased size
        this.color = '#8e24aa';
        this.speed = 1.2;
        this.type = 'miniboss';
        this.hp = 10;
        this.maxHp = 10;
    }
}

export let enemies = [];
export let miniBoss = null;

export function spawnEnemies(num, canvas) {
    enemies = [];
    for (let i = 0; i < num; i++) {
        const pos = getRandomEdgePosition(canvas);
        enemies.push(new Enemy(pos.x, pos.y));
    }
}

export function addEnemy(x, y) {
    enemies.push(new Enemy(x, y));
}

export function spawnMiniBoss(x, y) {
    miniBoss = new MiniBoss(x, y);
}

export function setMiniBoss(val) {
    miniBoss = val;
}

function getRandomEdgePosition(canvas) {
    const edge = Math.floor(Math.random() * 4);
    if (edge === 0) return { x: 0, y: Math.random() * canvas.height };
    if (edge === 1) return { x: canvas.width, y: Math.random() * canvas.height };
    if (edge === 2) return { x: Math.random() * canvas.width, y: 0 };
    return { x: Math.random() * canvas.width, y: canvas.height };
}

export function updateEnemies(player) {
    enemies.forEach(enemy => {
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 0) {
            enemy.x += (dx / dist) * enemy.speed;
            enemy.y += (dy / dist) * enemy.speed;
        }
    });
    if (miniBoss) {
        const dx = player.x - miniBoss.x;
        const dy = player.y - miniBoss.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 0) {
            miniBoss.x += (dx / dist) * miniBoss.speed;
            miniBoss.y += (dy / dist) * miniBoss.speed;
        }
        // Enemy-miniboss collision resolution
        enemies.forEach(enemy => {
            const dx = enemy.x - miniBoss.x;
            const dy = enemy.y - miniBoss.y;
            const dist = Math.hypot(dx, dy);
            const minDist = (enemy.size + miniBoss.size) / 2;
            if (dist < minDist && dist > 0) {
                const overlap = minDist - dist;
                const ox = (dx / dist) * (overlap / 2);
                const oy = (dy / dist) * (overlap / 2);
                enemy.x += ox;
                enemy.y += oy;
                miniBoss.x -= ox;
                miniBoss.y -= oy;
            }
        });
    }
    // Enemy-enemy collision resolution
    for (let i = 0; i < enemies.length; i++) {
        for (let j = i + 1; j < enemies.length; j++) {
            const a = enemies[i];
            const b = enemies[j];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.hypot(dx, dy);
            const minDist = (a.size + b.size) / 2;
            if (dist < minDist && dist > 0) {
                const overlap = minDist - dist;
                const ox = (dx / dist) * (overlap / 2);
                const oy = (dy / dist) * (overlap / 2);
                a.x -= ox;
                a.y -= oy;
                b.x += ox;
                b.y += oy;
            }
        }
    }
}

export function drawEnemies(ctx, camera) {
    enemies.forEach(enemy => {
        ctx.save();
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.arc(enemy.x - camera.x, enemy.y - camera.y, enemy.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}

export function drawMiniBoss(ctx, camera, miniBoss) {
    if (!miniBoss) return;
    ctx.save();
    ctx.fillStyle = miniBoss.color;
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

import { hearts, isHit, hitTimer } from './ui.js';
export function checkEnemyCollisions(player) {
    enemies.forEach(enemy => {
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.hypot(dx, dy);
        if (dist < (player.size + enemy.size) / 2 && !isHit.value) {
            hearts.value = Math.max(0, hearts.value - 1);
            isHit.value = true;
            hitTimer.value = 0;
        }
    });
    if (miniBoss) {
        const dx = player.x - miniBoss.x;
        const dy = player.y - miniBoss.y;
        const dist = Math.hypot(dx, dy);
        if (dist < (player.size + miniBoss.size) / 2 && !isHit.value) {
            hearts.value = Math.max(0, hearts.value - 1);
            isHit.value = true;
            hitTimer.value = 0;
        }
    }
}
