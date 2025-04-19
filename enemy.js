// Constants for enemy sizes and speeds
const ENEMY_SIZE = 30;
const ENEMY_COLOR = '#fbc02d';
const ENEMY_MIN_SPEED = 2;
const ENEMY_MAX_SPEED = 3.5;
const MINIBOSS_SIZE = ENEMY_SIZE * 6;
const MINIBOSS_COLOR = '#8e24aa';
const MINIBOSS_SPEED = 1.2;
const MINIBOSS_HP = 10;
const MINIBOSS_PUSH_DISTANCE = 400; // Distance threshold for pushing
const ENEMY_PUSH_OFFSET = 60; // How far from the miniboss enemies go to push

export class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = ENEMY_SIZE;
        this.color = ENEMY_COLOR;
        this.speed = ENEMY_MIN_SPEED + Math.random() * (ENEMY_MAX_SPEED - ENEMY_MIN_SPEED);
        this.type = 'regular';
        this.strength = 1; // Regular enemy strength
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
        this.strength = 2; // MiniBoss strength
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
    let pushing = false;
    let maxPusherSpeed = 0;
    if (miniBoss) {
        const distToPlayer = Math.hypot(player.x - miniBoss.x, player.y - miniBoss.y);
        pushing = distToPlayer > MINIBOSS_PUSH_DISTANCE;
    }
    if (miniBoss && pushing) {
        maxPusherSpeed = Math.max(...enemies.map(e => e.speed));
    }
    // Calculate direction from miniboss to player
    let bossToPlayerDir = { x: 0, y: 0 };
    if (miniBoss && pushing) {
        const dx = player.x - miniBoss.x;
        const dy = player.y - miniBoss.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 0) {
            bossToPlayerDir = { x: dx / dist, y: dy / dist };
        }
    }
    // Move regular enemies
    enemies.forEach(enemy => {
        if (miniBoss && pushing) {
            // Calculate vector from miniboss to enemy
            const ex = enemy.x - miniBoss.x;
            const ey = enemy.y - miniBoss.y;
            const enemyDist = Math.hypot(ex, ey);
            // Calculate dot product to check if enemy is behind the miniboss (relative to player)
            const dot = ex * -bossToPlayerDir.x + ey * -bossToPlayerDir.y;
            // If enemy is behind the miniboss (dot > 0), move toward miniboss to push
            if (dot > 0) {
                // Move toward the miniboss at max speed
                moveToward(enemy, miniBoss, maxPusherSpeed);
            } else {
                // Otherwise, move to a position behind the miniboss
                const pushX = miniBoss.x - bossToPlayerDir.x * (miniBoss.size / 2 + ENEMY_PUSH_OFFSET);
                const pushY = miniBoss.y - bossToPlayerDir.y * (miniBoss.size / 2 + ENEMY_PUSH_OFFSET);
                moveToward(enemy, { x: pushX, y: pushY }, maxPusherSpeed);
            }
        } else {
            moveToward(enemy, player, enemy.speed);
        }
    });
    // All enemies colliding from behind push the miniboss
    if (miniBoss && pushing) {
        let pushers = 0;
        let pushSpeedSum = 0;
        enemies.forEach(enemy => {
            const ex = enemy.x - miniBoss.x;
            const ey = enemy.y - miniBoss.y;
            const enemyDist = Math.hypot(ex, ey);
            const minDist = (enemy.size + miniBoss.size) / 2;
            const dot = ex * -bossToPlayerDir.x + ey * -bossToPlayerDir.y;
            if (enemyDist <= minDist + 1e-2 && dot > 0) {
                pushers++;
                pushSpeedSum += enemy.speed;
            }
        });
        if (pushers > 0) {
            const avgPushSpeed = (pushSpeedSum / pushers) * 1.15;
            miniBoss.x += bossToPlayerDir.x * avgPushSpeed;
            miniBoss.y += bossToPlayerDir.y * avgPushSpeed;
        }
    } else if (miniBoss && !pushing) {
        moveToward(miniBoss, player, miniBoss.speed);
    }
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
            const damage = entity.strength || 1;
            hearts.value = Math.max(0, hearts.value - damage);
            isHit.value = true;
            hitTimer.value = 0;
            // Apply knockback to player
            if (player.knockback) {
                const knockbackStrength = 16;
                const nx = dx / (dist || 1);
                const ny = dy / (dist || 1);
                player.knockback.x = nx * knockbackStrength;
                player.knockback.y = ny * knockbackStrength;
            }
        }
    });
}
