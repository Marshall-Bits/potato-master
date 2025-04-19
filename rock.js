// Constants
const ROCK_SIZE = 20;
const PROJECTILE_SIZE = 20;
const PROJECTILE_SPEED = 10;
const PROJECTILE_BOUNCE_MULTIPLIER = 0.6;
const PROJECTILE_MAX_DISTANCE = 100;
const PROJECTILE_MAX_RANGE = 3000;

export let rocks = [];
export let groundRocks = [];
export let projectiles = [];
export let rockCount = { value: 0 };

let onKill = null;

export function setOnKill(cb) { onKill = cb; }

export function spawnRocks(count, canvas) {
    rocks = [];
    for (let i = 0; i < count; i++) {
        rocks.push({
            x: Math.random() * (canvas.width - 60) + 30,
            y: Math.random() * (canvas.height - 60) + 30,
            size: ROCK_SIZE
        });
    }
}

export function addRock(x, y) {
    rocks.push({ x, y, size: ROCK_SIZE });
}

export function drawRocks(ctx, camera) {
    [...rocks, ...groundRocks].forEach(rock => {
        ctx.save();
        ctx.fillStyle = '#bdbdbd';
        ctx.beginPath();
        ctx.arc(rock.x - camera.x, rock.y - camera.y, rock.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}

export function checkRockCollection(player) {
    [rocks, groundRocks].forEach(rockArray => {
        for (let i = rockArray.length - 1; i >= 0; i--) {
            const rock = rockArray[i];
            if (Math.hypot(player.x - rock.x, player.y - rock.y) < (player.size + rock.size) / 2) {
                rockCount.value++;
                rockArray.splice(i, 1);
            }
        }
    });
}

export function shootRock(player, mouseX, mouseY) {
    if (rockCount.value <= 0) return;
    const canvas = document.getElementById('gameCanvas');
    const camera = { x: player.x - canvas.width / 2, y: player.y - canvas.height / 2 };
    const worldMouseX = mouseX + camera.x;
    const worldMouseY = mouseY + camera.y;
    const dx = worldMouseX - player.x;
    const dy = worldMouseY - player.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 10) return; // Do not shoot if direction is too close to center
    const dir = { x: dx / dist, y: dy / dist };
    projectiles.push({
        x: player.x,
        y: player.y,
        vx: dir.x * PROJECTILE_SPEED,
        vy: dir.y * PROJECTILE_SPEED,
        size: PROJECTILE_SIZE,
        origin: { x: player.x, y: player.y },
        traveled: 0,
        canBounce: true
    });
    rockCount.value--;
}

import { enemies } from './enemy.js';

export function updateProjectiles(canvas, player, miniBoss) {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        // Move
        p.x += p.vx;
        p.y += p.vy;
        p.traveled += Math.hypot(p.vx, p.vy);
        // Remove if max distance reached
        if (p.traveled >= PROJECTILE_MAX_DISTANCE) {
            groundRocks.push({ x: p.x, y: p.y, size: ROCK_SIZE });
            projectiles.splice(i, 1);
            continue;
        }
        // Bounce and damage miniboss
        if (miniBoss && handleProjectileMiniBossCollision(p, miniBoss)) {
            continue;
        }
        // Bounce and destroy regular enemies
        if (handleProjectileEnemyCollision(p, enemies)) {
            continue;
        }
        // Remove if out of range
        if (Math.abs(p.x - player.x) > PROJECTILE_MAX_RANGE || Math.abs(p.y - player.y) > PROJECTILE_MAX_RANGE) {
            projectiles.splice(i, 1);
        }
    }
}

function handleProjectileMiniBossCollision(p, miniBoss) {
    const dist = Math.hypot(p.x - miniBoss.x, p.y - miniBoss.y);
    if (dist < (p.size + miniBoss.size) / 2) {
        if (p.canBounce) bounceProjectile(p, dist, p, miniBoss);
        miniBoss.hp--;
        if (miniBoss.hp <= 0 && typeof onKill === 'function') onKill('miniboss');
        // Do NOT remove the projectile, just bounce it
        return false;
    }
    return false;
}

function handleProjectileEnemyCollision(p, enemies) {
    for (let j = enemies.length - 1; j >= 0; j--) {
        const enemy = enemies[j];
        const dist = Math.hypot(p.x - enemy.x, p.y - enemy.y);
        if (dist < (p.size + enemy.size) / 2) {
            if (p.canBounce) bounceProjectile(p, dist, p, enemy);
            enemies.splice(j, 1);
            if (typeof onKill === 'function') onKill('regular');
            // Do NOT remove the projectile, just bounce it
            return false;
        }
    }
    return false;
}

function bounceProjectile(p, dist, from, to) {
    const dx = from.x - to.x;
    const dy = from.y - to.y;
    const norm = { x: dx / dist, y: dy / dist };
    const dot = p.vx * norm.x + p.vy * norm.y;
    p.vx = (p.vx - 2 * dot * norm.x) * PROJECTILE_BOUNCE_MULTIPLIER;
    p.vy = (p.vy - 2 * dot * norm.y) * PROJECTILE_BOUNCE_MULTIPLIER;
    p.canBounce = false;
}

export function drawProjectiles(ctx, camera) {
    projectiles.forEach(p => {
        ctx.save();
        ctx.fillStyle = '#bdbdbd';
        ctx.beginPath();
        ctx.arc(p.x - camera.x, p.y - camera.y, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}
