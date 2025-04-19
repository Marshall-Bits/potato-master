// Clean code refactor of the main game loop and state management
import { Player, drawPlayer, updatePlayerDirection } from './player.js';
import { Enemy, MiniBoss, enemies, miniBoss, spawnEnemies, addEnemy, spawnMiniBoss, setMiniBoss, updateEnemies, checkEnemyCollisions } from './enemy.js';
import * as rockModule from './rock.js';
import { drawHearts, drawRockCounter, handleHitEffect, hearts, isHit, hitTimer, drawPointsCounter } from './ui.js';
import { GameStats } from './stats.js';

import('./enemy.js').then(({ drawEntities }) => {
    // Game constants
    const INITIAL_ROCKS = 10;
    const INITIAL_ENEMIES = 5;
    const ROCKS_AROUND_PLAYER = 15;
    const ENEMIES_AROUND_PLAYER = 8;
    const MINIBOSS_SPAWN_DIST = 600;

    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    let player = new Player(canvas.width / 2, canvas.height / 2);
    let gameState = 'menu'; // 'menu', 'playing', 'paused', 'gameover'
    const stats = new GameStats();
    rockModule.setOnKill((type) => {
        if (type === 'regular') {
            stats.addRegularKill();
            if (stats.shouldSpawnMiniBoss() && !miniBoss) {
                const angle = Math.random() * Math.PI * 2;
                const x = player.x + Math.cos(angle) * MINIBOSS_SPAWN_DIST;
                const y = player.y + Math.sin(angle) * MINIBOSS_SPAWN_DIST;
                spawnMiniBoss(x, y);
            }
        } else if (type === 'miniboss') {
            stats.addMiniBossKill();
            setMiniBoss(null);
        }
    });

    document.getElementById('fullscreenBtn').addEventListener('click', () => {
        if (canvas.requestFullscreen) {
            canvas.requestFullscreen();
        } else if (canvas.webkitRequestFullscreen) { // Safari
            canvas.webkitRequestFullscreen();
        }
    });

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        rockModule.spawnRocks(INITIAL_ROCKS, canvas);
        spawnEnemies(INITIAL_ENEMIES, canvas);
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    function resetGame() {
        player = new Player(canvas.width / 2, canvas.height / 2);
        hearts.value = 3;
        rockModule.rockCount.value = 0;
        rockModule.rocks.length = 0;
        rockModule.groundRocks.length = 0;
        enemies.length = 0;
        rockModule.projectiles.length = 0;
        stats.reset();
        spawnEnemies(INITIAL_ENEMIES, canvas);
        rockModule.spawnRocks(INITIAL_ROCKS, canvas);
        setMiniBoss(null);
    }

    function drawMenu(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(34,34,34,0.95)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('WASD Infinite Arena', canvas.width / 2, canvas.height / 2 - 60);
        ctx.font = '28px Arial';
        ctx.fillText('Move: WASD | Shoot: Mouse/Space', canvas.width / 2, canvas.height / 2);
        ctx.font = '32px Arial';
        ctx.fillText('Click to Start', canvas.width / 2, canvas.height / 2 + 80);
        ctx.restore();
    }

    function drawGameOver(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(34,34,34,0.85)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ff1744';
        ctx.font = 'bold 56px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 40);
        ctx.font = '32px Arial';
        ctx.fillStyle = '#fff';
        ctx.fillText('Points: ' + stats.points, canvas.width / 2, canvas.height / 2 + 10);
        ctx.fillText('Click to Restart', canvas.width / 2, canvas.height / 2 + 60);
        ctx.restore();
    }

    const keys = {};
    document.addEventListener('keydown', (e) => {
        if (gameState === 'playing' && e.code === 'Space') {
            gameState = 'paused';
            return;
        } else if (gameState === 'paused' && e.code === 'Space') {
            gameState = 'playing';
            return;
        }
        if (gameState !== 'playing') return;
        keys[e.key.toLowerCase()] = true;
    });
    document.addEventListener('keyup', (e) => {
        if (gameState !== 'playing') return;
        keys[e.key.toLowerCase()] = false;
    });
    canvas.addEventListener('mousedown', (e) => {
        if (gameState === 'menu') {
            gameState = 'playing';
            resetGame();
        } else if (gameState === 'gameover') {
            gameState = 'playing';
            resetGame();
        } else if (gameState === 'playing' && e.button === 0) {
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            rockModule.shootRock(player, mouseX, mouseY);
        }
    });

    function getCameraOffset(player, canvas) {
        return {
            x: player.x - canvas.width / 2,
            y: player.y - canvas.height / 2
        };
    }

    function spawnEntitiesAroundPlayer(player, entities, spawnFn, maxCount, canvas) {
        const SPAWN_RADIUS = Math.max(window.innerWidth, window.innerHeight) * 0.7 + 200;
        const SAFE_RADIUS = Math.max(window.innerWidth, window.innerHeight) * 0.5 + 100;
        while (entities.length < maxCount) {
            let angle = Math.random() * Math.PI * 2;
            let dist = SAFE_RADIUS + Math.random() * (SPAWN_RADIUS - SAFE_RADIUS);
            let x = player.x + Math.cos(angle) * dist;
            let y = player.y + Math.sin(angle) * dist;
            spawnFn(x, y);
        }
    }

    function updateInfiniteSpawns(player, canvas) {
        spawnEntitiesAroundPlayer(player, rockModule.rocks, rockModule.addRock, ROCKS_AROUND_PLAYER, canvas);
        spawnEntitiesAroundPlayer(player, enemies, addEnemy, ENEMIES_AROUND_PLAYER, canvas);
    }

    function update() {
        if (gameState !== 'playing') return;
        updatePlayerDirection(player, keys);
        rockModule.checkRockCollection(player);
        rockModule.updateProjectiles(canvas, player, miniBoss);
        updateEnemies(player);
        checkEnemyCollisions(player);
        updateInfiniteSpawns(player, canvas);
        if (hearts.value <= 0) {
            gameState = 'gameover';
        }
    }

    function gameLoop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (gameState === 'menu') {
            drawMenu(ctx);
        } else if (gameState === 'gameover') {
            drawGameOver(ctx);
        } else if (gameState === 'paused') {
            // Draw paused overlay
            const camera = getCameraOffset(player, canvas);
            rockModule.drawRocks(ctx, camera);
            rockModule.drawProjectiles(ctx, camera);
            drawPlayer(ctx, player, canvas);
            drawEntities(ctx, camera, miniBoss);
            drawHearts(ctx);
            drawRockCounter(ctx);
            drawPointsCounter(ctx, stats.points);
            handleHitEffect(ctx);
            ctx.save();
            ctx.fillStyle = 'rgba(34,34,34,0.5)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 64px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Paused', canvas.width / 2, canvas.height / 2);
            ctx.restore();
        } else if (gameState === 'playing') {
            const camera = getCameraOffset(player, canvas);
            rockModule.drawRocks(ctx, camera);
            rockModule.drawProjectiles(ctx, camera);
            drawPlayer(ctx, player, canvas);
            drawEntities(ctx, camera, miniBoss);
            drawHearts(ctx);
            drawRockCounter(ctx);
            drawPointsCounter(ctx, stats.points);
            handleHitEffect(ctx);
            update();
        }
        requestAnimationFrame(gameLoop);
    }
    gameLoop();
});