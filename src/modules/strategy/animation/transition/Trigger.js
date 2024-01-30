class AutoTimerTrigger {
    wait(callback, delay) {
        setTimeout(callback, delay);
    }

    stop() { }
}


class ForwardOnlyTrigger {
    #onKeydown;
    #callback;

    wait(callback, _delay, _colIndex) {
        if (this.#onKeydown == null) {
            this.#onKeydown = (event) => {
                if (event.code === 'ArrowRight') {
                    // NOTE: 여기서 '이벤트 핸들러'를 '애로우 함수'로 정의했기 때문에
                    //       'this'는 'ForwardOnlyTrigger' 객체를 가리킨다.
                    if (this.#callback != null && typeof this.#callback === 'function') {
                        this.#callback();
                        this.#callback = null;
                    }
                }
            };

            window.addEventListener('keydown', this.#onKeydown);
        }

        this.#callback = callback;
    }
    
    stop() {
        window.removeEventListener('keydown', this.#onKeydown);
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
