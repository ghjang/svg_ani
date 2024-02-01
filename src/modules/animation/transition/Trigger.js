class AutoTimerTrigger {
    #resolveWait = null;
    #rejectWait = null;
    #timerId = null;

    wait(delay = 0) {
        return new Promise((resolve, reject) => {
            this.#resolveWait = resolve;
            this.#rejectWait = reject;
            this.#timerId = setTimeout(() => {
                this.#resolveWait();
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
                    window.removeEventListener('keydown', this.#onKeydown);
                    this.#resolveWait();
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


const bidirectionalTrigger = (callback, _delay, _colIndex) => {
    window.addEventListener('keydown', function onKeydown(event) {
        if (event.code === 'ArrowRight') {
            console.log('ArrowRight');

            window.removeEventListener('keydown', onKeydown);

            const action = {
                direction: "right",
                do: (graphicElements, _curRowIndex, curColIndex) => {
                    if (curColIndex + 1 >= graphicElements.length) {
                    }
                }
            };

            callback(action);
        } else if (event.code === 'ArrowLeft') {
            window.removeEventListener('keydown', onKeydown);

            const action = {
                direction: "left",
                do: (graphicElements, _curRowIndex, curColIndex) => {
                    if (curColIndex - 1 >= 0) {
                        graphicElements[curColIndex - 1].style.opacity = 0;
                    }
                }
            };

            callback(action);
        }
    });
};


const defaultTrigger = new AutoTimerTrigger();


export const Triggers = {
    autoTimer: defaultTrigger,
    forwardOnly: new ForwardOnlyTrigger(),
    bidirectional: bidirectionalTrigger,
    default: defaultTrigger
};
