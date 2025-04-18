export class GameStats {
    constructor() {
        this.points = 0;
        this.regularKills = 0;
        this.miniBossKills = 0;
    }
    reset() {
        this.points = 0;
        this.regularKills = 0;
        this.miniBossKills = 0;
    }
    addRegularKill() {
        this.points++;
        this.regularKills++;
    }
    addMiniBossKill() {
        this.points += 10;
        this.miniBossKills++;
    }
    shouldSpawnMiniBoss() {
        return this.regularKills > 0 && this.regularKills % 10 === 0;
    }
}
