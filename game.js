// Clean code refactor of the main game loop and state management
import { Player, drawPlayer, updatePlayerDirection } from './player.js';
import { Enemy, MiniBoss, enemies, miniBoss, spawnEnemies, addEnemy, spawnMiniBoss, setMiniBoss, updateEnemies, checkEnemyCollisions } from './enemy.js';
import * as rockModule from './rock.js';
import { drawHearts, drawRockCounter, handleHitEffect, hearts, isHit, hitTimer, drawPointsCounter } from './ui.js';
import { GameStats } from './stats.js';

// Remove any old pads from previous versions (if present)
function removeOldPads() {
    const oldLeft = document.querySelector('body > #leftPad');
    const oldRight = document.querySelector('body > #rightPad');
    if (oldLeft) oldLeft.remove();
    if (oldRight) oldRight.remove();
}
removeOldPads();

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

    const fullscreenBtn = document.getElementById('fullscreenBtn');
    function updateFullscreenButton() {
        if (document.fullscreenElement) {
            fullscreenBtn.textContent = 'Exit Fullscreen';
        } else {
            fullscreenBtn.textContent = 'Fullscreen';
        }
    }
    fullscreenBtn.addEventListener('click', () => {
        const container = document.getElementById('gameContainer');
        if (!document.fullscreenElement) {
            if (container.requestFullscreen) {
                container.requestFullscreen();
            } else if (container.webkitRequestFullscreen) { // Safari
                container.webkitRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) { // Safari
                document.webkitExitFullscreen();
            }
        }
    });
    document.addEventListener('fullscreenchange', updateFullscreenButton);

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

    // --- Mobile controls logic ---
    function isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    function ensureMobilePads() {
        if (!isMobile()) return;
        const container = document.getElementById('gameContainer');
        if (!document.getElementById('leftPad')) {
            const leftPad = document.createElement('div');
            leftPad.id = 'leftPad';
            leftPad.style.position = 'absolute';
            leftPad.style.left = '5%';
            leftPad.style.bottom = '5%';
            leftPad.style.width = '24vw';
            leftPad.style.height = '24vw';
            leftPad.style.maxWidth = '140px';
            leftPad.style.maxHeight = '140px';
            leftPad.style.background = 'rgba(255,255,255,0.08)';
            leftPad.style.borderRadius = '50%';
            leftPad.style.touchAction = 'none';
            leftPad.style.zIndex = 20;
            container.appendChild(leftPad);
        }
        if (!document.getElementById('rightPad')) {
            const rightPad = document.createElement('div');
            rightPad.id = 'rightPad';
            rightPad.style.position = 'absolute';
            rightPad.style.right = '5%';
            rightPad.style.bottom = '7%';
            rightPad.style.width = '20vw';
            rightPad.style.height = '20vw';
            rightPad.style.maxWidth = '110px';
            rightPad.style.maxHeight = '110px';
            rightPad.style.background = 'rgba(255,255,255,0.08)';
            rightPad.style.borderRadius = '50%';
            rightPad.style.touchAction = 'none';
            rightPad.style.zIndex = 20;
            container.appendChild(rightPad);

            const rightPadCanvas = document.createElement('canvas');
            rightPadCanvas.id = 'rightPadCanvas';
            rightPadCanvas.width = 110;
            rightPadCanvas.height = 110;
            rightPad.appendChild(rightPadCanvas);
        }
    }

    // Re-append pads on fullscreen change
    if (typeof document !== 'undefined') {
        document.addEventListener('fullscreenchange', ensureMobilePads);
    }

    if (isMobile()) {
        ensureMobilePads();
        const leftPad = () => document.getElementById('leftPad');
        let leftPadActive = false;
        let leftPadStart = { x: 0, y: 0 };
        let leftPadDir = { x: 0, y: 0 };

        const handleLeftPadTouchStart = (e) => {
            leftPadActive = true;
            const touch = e.touches[0];
            leftPadStart = { x: touch.clientX, y: touch.clientY };
        };
        const handleLeftPadTouchMove = (e) => {
            if (!leftPadActive) return;
            const touch = e.touches[0];
            const dx = touch.clientX - leftPadStart.x;
            const dy = touch.clientY - leftPadStart.y;
            // Allow diagonal movement
            leftPadDir = { x: 0, y: 0 };
            if (dx > 20) leftPadDir.x = 1;
            else if (dx < -20) leftPadDir.x = -1;
            if (dy > 20) leftPadDir.y = 1;
            else if (dy < -20) leftPadDir.y = -1;
            keys.w = leftPadDir.y === -1;
            keys.s = leftPadDir.y === 1;
            keys.a = leftPadDir.x === -1;
            keys.d = leftPadDir.x === 1;
        };
        const handleLeftPadTouchEnd = () => {
            leftPadActive = false;
            leftPadDir = { x: 0, y: 0 };
            keys.w = keys.a = keys.s = keys.d = false;
        };
        // Remove previous listeners if any
        const pad = leftPad();
        if (pad) {
            pad.ontouchstart = handleLeftPadTouchStart;
            pad.ontouchmove = handleLeftPadTouchMove;
            pad.ontouchend = handleLeftPadTouchEnd;
        }

        // Shooting pad logic
        const rightPad = () => document.getElementById('rightPad');
        // Remove legacy rightPad touchend handler to prevent double shooting and tap-to-shoot on mobile
        rightPad.ontouchstart = null;
        rightPad.ontouchmove = null;
        rightPad.ontouchend = null;
        rightPad.ontouchcancel = null;
    }

    // --- Mobile analog pad logic ---
    const leftPad = document.getElementById('leftPad');
    const rightPad = document.getElementById('rightPad');
    const rightPadCanvas = document.getElementById('rightPadCanvas');

    if (isMobile()) {
        // --- Left Pad: Movement ---
        let moveTouchId = null;
        let moveCenter = { x: 0, y: 0 };
        leftPad.addEventListener('touchstart', (e) => {
            // Only track the first touch for left pad
            if (moveTouchId !== null) return;
            const touch = e.changedTouches[0];
            moveTouchId = touch.identifier;
            const rect = leftPad.getBoundingClientRect();
            moveCenter = {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            };
            leftPad.classList.add('active');
        });
        leftPad.addEventListener('touchmove', (e) => {
            for (let touch of e.changedTouches) {
                if (touch.identifier === moveTouchId) {
                    const dx = touch.clientX - moveCenter.x;
                    const dy = touch.clientY - moveCenter.y;
                    const dist = Math.hypot(dx, dy);
                    const deadzone = 18;
                    let x = 0, y = 0;
                    if (dist > deadzone) {
                        x = dx / dist;
                        y = dy / dist;
                    }
                    keys.w = y < -0.5;
                    keys.s = y > 0.5;
                    keys.a = x < -0.5;
                    keys.d = x > 0.5;
                }
            }
        });
        leftPad.addEventListener('touchend', (e) => {
            for (let touch of e.changedTouches) {
                if (touch.identifier === moveTouchId) {
                    keys.w = keys.a = keys.s = keys.d = false;
                    moveTouchId = null;
                    leftPad.classList.remove('active');
                }
            }
        });
        leftPad.addEventListener('touchcancel', (e) => {
            for (let touch of e.changedTouches) {
                if (touch.identifier === moveTouchId) {
                    keys.w = keys.a = keys.s = keys.d = false;
                    moveTouchId = null;
                    leftPad.classList.remove('active');
                }
            }
        });

        // --- Right Pad: Shooting ---
        let shootTouchId = null;
        let shootActive = false;
        let shootPos = null;
        let shootAngle = null;
        const ctx = rightPadCanvas.getContext('2d');
        const PAD_SIZE = rightPadCanvas.width;
        const CENTER = PAD_SIZE / 2;
        const OUTER_RADIUS = PAD_SIZE / 2 - 4;
        const INNER_RADIUS = PAD_SIZE / 5;

        function drawPad(angle = null, active = false) {
            ctx.clearRect(0, 0, PAD_SIZE, PAD_SIZE);
            ctx.beginPath();
            ctx.arc(CENTER, CENTER, OUTER_RADIUS, 0, Math.PI * 2);
            ctx.strokeStyle = active ? '#fff' : '#bbb';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(CENTER, CENTER, INNER_RADIUS, 0, Math.PI * 2);
            ctx.strokeStyle = '#888';
            ctx.lineWidth = 2;
            ctx.stroke();
            if (angle !== null && active) {
                ctx.beginPath();
                ctx.moveTo(CENTER, CENTER);
                ctx.lineTo(
                    CENTER + Math.cos(angle) * (OUTER_RADIUS - 10),
                    CENTER + Math.sin(angle) * (OUTER_RADIUS - 10)
                );
                ctx.strokeStyle = '#ff0';
                ctx.lineWidth = 4;
                ctx.stroke();
            }
        }
        drawPad();

        rightPadCanvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            // Only track the first touch for right pad
            if (shootTouchId !== null) return;
            const touch = e.changedTouches[0];
            shootTouchId = touch.identifier;
            shootActive = true;
            const rect = rightPadCanvas.getBoundingClientRect();
            shootPos = { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
            const dx = shootPos.x - CENTER;
            const dy = shootPos.y - CENTER;
            const dist = Math.hypot(dx, dy);
            shootAngle = (dist > INNER_RADIUS) ? Math.atan2(dy, dx) : null;
            drawPad(shootAngle, true);
        }, { passive: false });
        rightPadCanvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!shootActive || shootTouchId === null) return;
            for (let touch of e.changedTouches) {
                if (touch.identifier === shootTouchId) {
                    const rect = rightPadCanvas.getBoundingClientRect();
                    shootPos = { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
                    const dx = shootPos.x - CENTER;
                    const dy = shootPos.y - CENTER;
                    const dist = Math.hypot(dx, dy);
                    shootAngle = (dist > INNER_RADIUS) ? Math.atan2(dy, dx) : null;
                    drawPad(shootAngle, true);
                }
            }
        }, { passive: false });
        rightPadCanvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (!shootActive || shootTouchId === null) return;
            for (let touch of e.changedTouches) {
                if (touch.identifier === shootTouchId) {
                    const rect = rightPadCanvas.getBoundingClientRect();
                    shootPos = { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
                    const dx = shootPos.x - CENTER;
                    const dy = shootPos.y - CENTER;
                    const dist = Math.hypot(dx, dy);
                    shootAngle = (dist > INNER_RADIUS) ? Math.atan2(dy, dx) : null;
                    if (shootAngle !== null && gameState === 'playing') {
                        const shootDistance = 1000;
                        const shootX = player.x + Math.cos(shootAngle) * shootDistance;
                        const shootY = player.y + Math.sin(shootAngle) * shootDistance;
                        rockModule.shootRock(player, shootX, shootY);
                    }
                    shootActive = false;
                    shootTouchId = null;
                    shootAngle = null;
                    drawPad();
                }
            }
        }, { passive: false });
        rightPadCanvas.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            if (!shootActive || shootTouchId === null) return;
            for (let touch of e.changedTouches) {
                if (touch.identifier === shootTouchId) {
                    shootActive = false;
                    shootTouchId = null;
                    shootAngle = null;
                    drawPad();
                }
            }
        }, { passive: false });

        // Remove all mouse events from rightPadCanvas and rightPad on mobile
        rightPadCanvas.onmousedown = null;
        rightPadCanvas.onmouseup = null;
        rightPadCanvas.onclick = null;
        rightPad.onmousedown = null;
        rightPad.onmouseup = null;
        rightPad.onclick = null;
    }

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

    let lastFrameTime = performance.now();
    let accumulator = 0;
    const FIXED_TIMESTEP = 1000 / 60; // 60 updates per second

    function gameLoop(now = performance.now()) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        accumulator += now - lastFrameTime;
        lastFrameTime = now;

        // Update logic at fixed timestep
        while (accumulator >= FIXED_TIMESTEP) {
            if (gameState === 'playing') {
                update();
            }
            accumulator -= FIXED_TIMESTEP;
        }

        if (gameState === 'menu') {
            drawMenu(ctx);
        } else if (gameState === 'gameover') {
            drawGameOver(ctx);
        } else if (gameState === 'paused') {
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
        }
        requestAnimationFrame(gameLoop);
    }
    gameLoop();
});