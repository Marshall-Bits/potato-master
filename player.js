// Constants
const PLAYER_SIZE = 30;
const PLAYER_COLOR = '#4caf50';
const PLAYER_SPEED = 4;

export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = PLAYER_SIZE;
        this.color = PLAYER_COLOR;
        this.speed = PLAYER_SPEED;
        this.lastDirection = { x: 1, y: 0 };
        this.knockback = { x: 0, y: 0 }; // Add knockback vector
    }
}

export function drawPlayer(ctx, player, canvas) {
    ctx.save();
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, player.size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

export function updatePlayerDirection(player, keys) {
    // Apply knockback if present
    if (player.knockback && (Math.abs(player.knockback.x) > 0.1 || Math.abs(player.knockback.y) > 0.1)) {
        player.x += player.knockback.x;
        player.y += player.knockback.y;
        // Dampen knockback
        player.knockback.x *= 0.85;
        player.knockback.y *= 0.85;
    }
    // Only allow movement if not being strongly knocked back
    if (Math.abs(player.knockback.x) < 2 && Math.abs(player.knockback.y) < 2) {
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
}
