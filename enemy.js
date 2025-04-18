// Constants for enemy sizes and speeds
const ENEMY_SIZE = 30;
const ENEMY_COLOR = '#fbc02d';
const ENEMY_MIN_SPEED = 2;
const ENEMY_MAX_SPEED = 3.5;
const MINIBOSS_SIZE = ENEMY_SIZE * 6;
const MINIBOSS_COLOR = '#8e24aa';
const MINIBOSS_SPEED = 1.2;
const MINIBOSS_HP = 10;

export class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = ENEMY_SIZE;
        this.color = ENEMY_COLOR;
        this.speed = ENEMY_MIN_SPEED + Math.random() * (ENEMY_MAX_SPEED - ENEMY_MIN_SPEED);
        this.type = 'regular';
    }
}

export class MiniBoss {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = MINIBOSS_SIZE;
        this.color = MINIBOSS_COLOR;
        this.speed = MINIBOSS_SPEED;
        this.type = 'miniboss';
        this.hp = MINIBOSS_HP;
        this.maxHp = MINIBOSS_HP;
    }
}

export let enemies = [];
export let miniBoss = null;

export function spawnEnemies(count, canvas) {
    enemies = [];
    for (let i = 0; i < count; i++) {
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
    // Move regular enemies toward player
    enemies.forEach(enemy => moveToward(enemy, player, enemy.speed));
    // Move miniboss toward player
    if (miniBoss) moveToward(miniBoss, player, miniBoss.speed);
    // Prevent overlap between enemies
    resolveCollisions(enemies);
    // Prevent overlap between enemies and miniboss
    if (miniBoss) resolveEnemyMiniBossCollisions(enemies, miniBoss);
}

function moveToward(entity, target, speed) {
    const dx = target.x - entity.x;
    const dy = target.y - entity.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 0) {
        entity.x += (dx / dist) * speed;
        entity.y += (dy / dist) * speed;
    }
}

function resolveCollisions(entityList) {
    for (let i = 0; i < entityList.length; i++) {
        for (let j = i + 1; j < entityList.length; j++) {
            const a = entityList[i];
            const b = entityList[j];
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

function resolveEnemyMiniBossCollisions(enemies, miniBoss) {
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

export function drawEnemies(ctx, camera) {
    enemies.forEach(enemy => drawCircle(ctx, enemy, camera));
}

export function drawMiniBoss(ctx, camera, miniBoss) {
    if (!miniBoss) return;
    drawCircle(ctx, miniBoss, camera);
    drawMiniBossHealthBar(ctx, camera, miniBoss);
}

function drawCircle(ctx, entity, camera) {
    ctx.save();
    ctx.fillStyle = entity.color;
    ctx.beginPath();
    ctx.arc(entity.x - camera.x, entity.y - camera.y, entity.size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function drawMiniBossHealthBar(ctx, camera, miniBoss) {
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
    // Damage player if colliding with any enemy or miniboss
    [...enemies, miniBoss].forEach(entity => {
        if (!entity) return;
        const dx = player.x - entity.x;
        const dy = player.y - entity.y;
        const dist = Math.hypot(dx, dy);
        if (dist < (player.size + entity.size) / 2 && !isHit.value) {
            hearts.value = Math.max(0, hearts.value - 1);
            isHit.value = true;
            hitTimer.value = 0;
        }
    });
}
