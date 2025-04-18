export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 30;
        this.color = '#4caf50';
        this.speed = 4;
        this.lastDirection = { x: 1, y: 0 };
    }
}

export function drawPlayer(ctx, player, canvas) {
    // Always draw player at center of canvas
    ctx.save();
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, player.size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

export function handlePlayerInput(e, player, keys, shootRock, canvas) {
    if (e.code === 'Space') {
        // Shoot in last direction
        shootRock(player, player.x + player.lastDirection.x * 100, player.y + player.lastDirection.y * 100);
    }
}

export function updatePlayerDirection(player, keys) {
    if (keys.w) {
        player.y -= player.speed;
        player.lastDirection = { x: 0, y: -1 };
    }
    if (keys.s) {
        player.y += player.speed;
        player.lastDirection = { x: 0, y: 1 };
    }
    if (keys.a) {
        player.x -= player.speed;
        player.lastDirection = { x: -1, y: 0 };
    }
    if (keys.d) {
        player.x += player.speed;
        player.lastDirection = { x: 1, y: 0 };
    }
}
