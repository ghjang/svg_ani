import BaseTrigger from "./BaseTrigger.js";
import Direction from "../../data/Direction.js";


class DirectionStrategy {
    getDirection(_event) {
        // To be implemented by subclasses
    }
}

class VerticalStrategy extends DirectionStrategy {
    getDirection(event) {
        let selectedDirection = null;
        if (event.code === 'ArrowUp') {
            selectedDirection = Direction.UP;
        } else if (event.code === 'ArrowDown') {
            selectedDirection = Direction.DOWN;
        }
        return selectedDirection;
    }
}

class ForwardOnlyStrategy extends DirectionStrategy {
    getDirection(event) {
        return (event.code === 'ArrowRight') ? Direction.RIGHT : null;
    }
}

class BidirectionalStrategy extends DirectionStrategy {
    getDirection(event) {
        let selectedDirection = null;
        if (event.code === 'ArrowRight' || event.code === 'ArrowLeft') {
            selectedDirection = (event.code === 'ArrowRight') ? Direction.RIGHT : Direction.LEFT;
        } else if (event.key === 'Home') {
            selectedDirection = event.ctrlKey ? Direction.CTRL_HOME : Direction.HOME;
        } else if (event.key === 'End') {
            selectedDirection = event.ctrlKey ? Direction.CTRL_END : Direction.END;
        }
        return selectedDirection;
    }
}


export class KeyboardTrigger extends BaseTrigger {
    #onKeydown = null;
    #strategy = null;

    constructor(strategy) {
        super();
        this.#strategy = strategy;
    }

    #removeKeydownHandler() {
        if (this.#onKeydown) {
            window.removeEventListener('keydown', this.#onKeydown);
            this.#onKeydown = null;
        }
    }

    performAction(_initDelay) {
        this.#onKeydown = (event) => {
            const selectedDirection = this.#strategy.getDirection(event);
            if (selectedDirection !== null) {
                this.#removeKeydownHandler();
                this.resolveWait({ nextDirection: selectedDirection });
            }
        };

        window.addEventListener('keydown', this.#onKeydown);
    }

    stop() {
        this.#removeKeydownHandler();
        super.stop();
    }
}


export class VerticalTrigger extends KeyboardTrigger {
    constructor() {
        super(new VerticalStrategy());
    }
}

export class ForwardOnlyTrigger extends KeyboardTrigger {
    constructor() {
        super(new ForwardOnlyStrategy());
    }
}

export class BidirectionalTrigger extends KeyboardTrigger {
    constructor() {
        super(new BidirectionalStrategy());
    }
}
