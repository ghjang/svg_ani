import BaseTrigger from "./BaseTrigger.js";
import AutoTimerTrigger from "./AutoTimer.js";
import { createKeyboardTrigger } from "./KeyboardEvent.js";


export default class CompoundTrigger extends BaseTrigger {
    #autoTimerTrigger = null;
    #keyboardTrigger = null;

    #isTimerMode = false;

    constructor() {
        super();

        this.#autoTimerTrigger = new AutoTimerTrigger();
        this.#keyboardTrigger = createKeyboardTrigger('composite');

        this.#isTimerMode = false;

        window.addEventListener('unhandledKey', this.#handleUnhandledKey);
    }

    #handleUnhandledKey = (event) => {
        const keyEvent = event.detail.event;
        if (keyEvent.code === 'Space') {
            const targetTrigger = this.#isTimerMode ? this.#autoTimerTrigger : this.#keyboardTrigger;
            const stopOpts = this.#isTimerMode ? null : { removeKeydownHandler: false };
            this.#isTimerMode = !this.#isTimerMode;
            targetTrigger.stop(stopOpts);
        } else {
            console.log('Unhandled key:', keyEvent.code);
        }
    };

    performAction(initDelay) {
        const targetTrigger = this.#isTimerMode ? this.#autoTimerTrigger : this.#keyboardTrigger;
        targetTrigger
            .wait(initDelay)
            .then(this.resolveWait)
            .catch(this.rejectWait);
    }

    stop(_opts) {
        window.removeEventListener('unhandledKey', this.#handleUnhandledKey);

        this.#autoTimerTrigger.stop();
        this.#keyboardTrigger.stop();

        this.#isTimerMode = false;

        super.stop();
    }
}
