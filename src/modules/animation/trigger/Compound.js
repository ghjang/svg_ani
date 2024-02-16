import BaseTrigger from "./BaseTrigger.js";
import AutoTimerTrigger from "./AutoTimer.js";
import { createKeyboardTrigger } from "./KeyboardEvent.js";


export default class CompoundTrigger extends BaseTrigger {
    #autoTimerTrigger = null;
    #keyboardTrigger = null;

    constructor() {
        super();

        this.#autoTimerTrigger = new AutoTimerTrigger();
        this.#keyboardTrigger = createKeyboardTrigger('composite');

        window.addEventListener('unhandledKey', this.#handleUnhandledKey);
    }

    #handleUnhandledKey = (event) => {
        console.log('Unhandled key event', event.detail);
    };

    performAction(initDelay) {
        this.#keyboardTrigger
            .wait(initDelay)
            .then(this.resolveWait)
            .catch(this.rejectWait);
    }

    stop() {
        window.removeEventListener('unhandledKey', this.#handleUnhandledKey);

        super.stop();
    }
}
