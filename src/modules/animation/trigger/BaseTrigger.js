export default class BaseTrigger {
    #resolveWait = null;
    #rejectWait = null;

    wait(initDelay = 0) {
        return new Promise((resolve, reject) => {
            this.#resolveWait = resolve;
            this.#rejectWait = reject;
            this.performAction(initDelay);
        });
    }

    stop() {
        if (this.#rejectWait) {
            this.#rejectWait(new Error('trigger-stopped'));
            this.#rejectWait = null;
        }
        if (this.#resolveWait) {
            this.#resolveWait = null;
        }
    }

    performAction() {
        // To be overridden by subclasses
    }

    get resolveWait() {
        if (this.#resolveWait == null) {
            return null;
        }

        return (...args) => {
            this.#resolveWait(...args);
            this.#resolveWait = null;
            this.#rejectWait = null;
        };
    }

    get rejectWait() {
        if (this.#rejectWait == null) {
            return null;
        }

        return (...args) => {
            this.#rejectWait(...args);
            this.#rejectWait = null;
            this.#resolveWait = null;
        };
    }
}
