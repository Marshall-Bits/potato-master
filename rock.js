export let rocks = [];
export let projectiles = [];
export let rockCount = { value: 0 };

// Add a new array for rocks that are on the ground after being thrown
export let groundRocks = [];

// Max distance a thrown rock can travel
const ROCK_MAX_DISTANCE = 100;

export function spawnRocks(num, canvas) {
    rocks = [];
    for (let i = 0; i < num; i++) {
        rocks.push({
            x: Math.random() * (canvas.width - 60) + 30,
            y: Math.random() * (canvas.height - 60) + 30,
            size: 20
        });
    }
}

export function addRock(x, y) {
    rocks.push({ x, y, size: 20 });
}

export function drawRocks(ctx, camera) {
    rocks.forEach(rock => {
        ctx.save();
        ctx.fillStyle = '#bdbdbd';
        ctx.beginPath();
        ctx.arc(rock.x - camera.x, rock.y - camera.y, rock.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });

    groundRocks.forEach(rock => {
        ctx.save();
        ctx.fillStyle = '#bdbdbd';
        ctx.beginPath();
        ctx.arc(rock.x - camera.x, rock.y - camera.y, rock.size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}

export function checkRockCollection(player) {
    for (let i = rocks.length - 1; i >= 0; i--) {
        const rock = rocks[i];
        const dx = player.x - rock.x;
        const dy = player.y - rock.y;
        const dist = Math.hypot(dx, dy);
        if (dist < (player.size + rock.size) / 2) {
            rockCount.value++;
            rocks.splice(i, 1);
        }
    }

    // Collect ground rocks
    for (let i = groundRocks.length - 1; i >= 0; i--) {
        const rock = groundRocks[i];
        const dx = player.x - rock.x;
        const dy = player.y - rock.y;
        const dist = Math.hypot(dx, dy);
        if (dist < (player.size + rock.size) / 2) {
            rockCount.value++;
            groundRocks.splice(i, 1);
        }
    }
}

export function shootRock(player, mouseX, mouseY) {
    if (rockCount.value > 0) {
        const canvas = document.getElementById('gameCanvas');
        const camera = {
            x: player.x - canvas.width / 2,
            y: player.y - canvas.height / 2
        };
        const worldMouseX = mouseX + camera.x;
        const worldMouseY = mouseY + camera.y;
        const dx = worldMouseX - player.x;
        const dy = worldMouseY - player.y;
        const dist = Math.hypot(dx, dy);
        let dir;
        if (dist > 0) {
            dir = { x: dx / dist, y: dy / dist };
        } else {
            dir = { ...player.lastDirection };
        }
        // Thrown rocks are smaller
        projectiles.push({
            x: player.x,
            y: player.y,
            vx: dir.x * 10,
            vy: dir.y * 10,
            size: 20, 
            origin: { x: player.x, y: player.y },
            traveled: 0,
            canBounce: true
        });
        rockCount.value--;
    }
}

import { enemies } from './enemy.js';
import { GameStats } from './stats.js';
let stats = null;
export function setStatsObject(s) { stats = s; }

// Add this import to update kills in game.js
let onKill = null;
export function setOnKill(cb) {
    onKill = cb;
}

export function updateProjectiles(canvas, player, miniBoss) {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        // Move
        p.x += p.vx;
        p.y += p.vy;
        p.traveled += Math.hypot(p.vx, p.vy);
        // Check max distance
        if (p.traveled >= ROCK_MAX_DISTANCE) {
            groundRocks.push({ x: p.x, y: p.y, size: 20 });
            projectiles.splice(i, 1);
            continue;
        }
        // Check collision with mini boss
        if (miniBoss) {
            const dx = p.x - miniBoss.x;
            const dy = p.y - miniBoss.y;
            const dist = Math.hypot(dx, dy);
            if (dist < (p.size + miniBoss.size) / 2) {
                // Bounce the rock
                if (p.canBounce !== false) {
                    const norm = { x: dx / dist, y: dy / dist };
                    const dot = p.vx * norm.x + p.vy * norm.y;
                    const bounceMultiplier = 0.6;
                    p.vx = (p.vx - 2 * dot * norm.x) * bounceMultiplier;
                    p.vy = (p.vy - 2 * dot * norm.y) * bounceMultiplier;
                    p.canBounce = false;
                }
                miniBoss.hp--;
                if (miniBoss.hp <= 0 && typeof onKill === 'function') {
                    onKill('miniboss');
                }
                projectiles.splice(i, 1);
                continue;
            }
        }
        // Check collision with enemies
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            const dx = p.x - enemy.x;
            const dy = p.y - enemy.y;
            const dist = Math.hypot(dx, dy);
            if (dist < (p.size + enemy.size) / 2) {
                if (p.canBounce) {
                    // Bounce: reverse direction, only bounce once, and decrease speed for a weaker bounce
                    const norm = { x: dx / dist, y: dy / dist };
                    const dot = p.vx * norm.x + p.vy * norm.y;
                    // Lower bounce speed multiplier (less than 1)
                    const bounceMultiplier = 0.6;
                    p.vx = (p.vx - 2 * dot * norm.x) * bounceMultiplier;
                    p.vy = (p.vy - 2 * dot * norm.y) * bounceMultiplier;
                    p.canBounce = false;
                }
                enemies.splice(j, 1);
                if (typeof onKill === 'function') onKill('regular');
                break;
            }
        }
        // Remove if too far from player (infinite world)
        if (Math.abs(p.x - player.x) > 3000 || Math.abs(p.y - player.y) > 3000) {
            projectiles.splice(i, 1);
            continue;
        }
    }
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
