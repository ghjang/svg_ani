import BaseTrigger from './BaseTrigger.js';
import Direction from '../../data/Direction.js';


export default class AutoTimerTrigger extends BaseTrigger {
    #timerId = null;

    performAction(initDelay = 0) {
        this.#timerId = setTimeout(() => {
            this.resolveWait({
                nextDirection: Direction.RIGHT
            });
            this.#timerId = null;
        }, initDelay);
    }

    stop() {
        if (this.#timerId) {
            clearTimeout(this.#timerId);
            this.#timerId = null;
        }
        
        super.stop();
    }
}
