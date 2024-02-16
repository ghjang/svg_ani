import BaseTrigger from "./BaseTrigger.js";
import Direction from "../../data/Direction.js";


class DirectionStrategy {
    getDirection(_event) {
        // To be implemented by subclasses
    }
}

class CompositeDirectionStrategy extends DirectionStrategy {
    constructor() {
        super();
        this.strategies = [];
    }

    add(strategy) {
        this.strategies.push(strategy);
        return this;
    }

    getDirection(event) {
        for (const strategy of this.strategies) {
            const direction = strategy.getDirection(event);
            if (direction !== null) {
                return direction;
            }
        }
        return null;
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
            if (selectedDirection) {
                this.#removeKeydownHandler();
                this.resolveWait({ nextDirection: selectedDirection });
            } else {
                const customEvent = new CustomEvent(
                    'unhandledKey', { detail: { event, trigger: this } }
                );
                window.dispatchEvent(customEvent);
            }
        };

        window.addEventListener('keydown', this.#onKeydown);
    }

    stop() {
        this.#removeKeydownHandler();
        super.stop();
    }
}


export function createKeyboardTrigger(strategyType) {
    let strategy;

    switch (strategyType) {
        case 'vertical':
            strategy = new VerticalStrategy();
            break;
        case 'forwardOnly':
            strategy = new ForwardOnlyStrategy();
            break;
        case 'bidirectional':
            strategy = new BidirectionalStrategy();
            break;
        case 'composite':
            strategy
                = new CompositeDirectionStrategy()
                    .add(new VerticalStrategy())
                    .add(new BidirectionalStrategy());
            break;
        default:
            throw new Error(`Unknown strategy type: ${strategyType}`);
    }

    return new KeyboardTrigger(strategy);
}
