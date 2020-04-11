class Game {
    constructor(initialState) {

    }

    main() {
        this._update();
        this._render();

        requestAnimationFrame(this.main);
    }
    start() {
        input.init();
    }

    _update() {

    }

    _render() {

    }

    initListeners() {
        input.register("pause", () => {
            if (this.paused) { this.playHandler = setInterval(() => this.main(), 1000/this.fps); }
            else { clearInterval(this.playHandler); }
            this.paused = !this.paused;
        });
        input.register("rambo", () => {
            if (!this.ball.ramboMode && this.ramboScore >= this.maxRamboScore) { messenger.send("enterRambo"); }
        });
        messenger.onMessage("ballHitBottom", () => {
            this.playerLife--;
            this.ramboScore = 0;
        });
        messenger.onMessage("playerScore", () => {
            this.playerScore++;
            if(!this.ball.ramboMode) { this.ramboScore = Math.min(this.ramboScore+1, this.maxRamboScore); }
        });
        messenger.onMessage("enterRambo", () => {
            console.log("enter rambo");
            this.ball.ramboMode = true;
            this.ramboScore = 0;
        });
        messenger.onMessage("exitRambo", () => {
            this.ball.ramboMode = false;
        });
        messenger.onMessage("gameEnded", () => { this.ended = true; });
    }
}
