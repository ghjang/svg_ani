import Direction from "../../data/Direction.js";


class AutoTimerTrigger {
    #resolveWait = null;
    #rejectWait = null;
    #timerId = null;

    wait(delay = 0) {
        return new Promise((resolve, reject) => {
            this.#resolveWait = resolve;
            this.#rejectWait = reject;
            this.#timerId = setTimeout(() => {
                this.#resolveWait({
                    nextDirection: Direction.RIGHT
                });
                this.#timerId = null;
                this.#resolveWait = null;
                this.#rejectWait = null;
            }, delay);
        });
    }

    stop() {
        if (this.#timerId) {
            clearTimeout(this.#timerId);
            this.#timerId = null;
        }
        if (this.#rejectWait) {
            this.#rejectWait(new Error('Stopped by user'));
            this.#rejectWait = null;
        }
        if (this.#resolveWait) {
            this.#resolveWait = null;
        }
    }
}


class ForwardOnlyTrigger {
    #resolveWait = null;
    #rejectWait = null;
    #onKeydown = null;

    wait(_delay) {
        return new Promise((resolve, reject) => {
            this.#resolveWait = resolve;
            this.#rejectWait = reject;
            this.#onKeydown = (event) => {
                if (event.code === 'ArrowRight') {
                    console.log('ArrowRight');
                    window.removeEventListener('keydown', this.#onKeydown);
                    this.#resolveWait({
                        nextDirection: Direction.RIGHT
                    });
                }
            };
            window.addEventListener('keydown', this.#onKeydown);
        });
    }
    
    stop() {
        if (this.#onKeydown) {
            window.removeEventListener('keydown', this.#onKeydown);
            this.#onKeydown = null;
        }
        if (this.#rejectWait) {
            this.#rejectWait(new Error('Stopped by user'));
            this.#rejectWait = null;
        }
        if (this.#resolveWait) {
            this.#resolveWait = null;
        }
    }
}


class BidirectionalTrigger {
    #resolveWait = null;
    #rejectWait = null;
    #onKeydown = null;

    wait(_delay) {
        return new Promise((resolve, reject) => {
            this.#resolveWait = resolve;
            this.#rejectWait = reject;
            this.#onKeydown = (event) => {
                let selectedDirection = null;
                if (event.code === 'ArrowRight' || event.code === 'ArrowLeft') {
                    selectedDirection = (event.code === 'ArrowRight') ? Direction.RIGHT : Direction.LEFT;
                } else if (event.code === 'Home') {
                    selectedDirection = Direction.HOME;
                } else if (event.code === 'End') {
                    selectedDirection = Direction.END;
                }

                if (selectedDirection !== null) {
                    window.removeEventListener('keydown', this.#onKeydown);
                    this.#resolveWait({
                        nextDirection: selectedDirection
                    });
                }
            };
            window.addEventListener('keydown', this.#onKeydown);
        });
    }
    
    stop() {
        if (this.#onKeydown) {
            window.removeEventListener('keydown', this.#onKeydown);
            this.#onKeydown = null;
        }
        if (this.#rejectWait) {
            this.#rejectWait(new Error('Stopped by user'));
            this.#rejectWait = null;
        }
        if (this.#resolveWait) {
            this.#resolveWait = null;
        }
    }
}


const defaultTrigger = new AutoTimerTrigger();


export const Triggers = {
    autoTimer: defaultTrigger,
    forwardOnly: new ForwardOnlyTrigger(),
    bidirectional: new BidirectionalTrigger(),
    default: defaultTrigger
};
