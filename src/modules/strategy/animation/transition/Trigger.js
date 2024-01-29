const autoTimerTrigger = (callback, delay) => {
    // 스페이스바를 누르면 일시정지, 다시 누르면 다시 재개하도록 코드 수정 가능??
    setTimeout(callback, delay);
};


const forwardOnlyTrigger = (callback, _delay, _colIndex) => {
    window.addEventListener('keydown', function onKeydown(event) {
        if (event.code === 'ArrowRight') {
            window.removeEventListener('keydown', onKeydown);
            callback();
        }
    });
};


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


const defaultTrigger = autoTimerTrigger;


export const Triggers = {
    autoTimer: autoTimerTrigger,
    forwardOnly: forwardOnlyTrigger,
    bidirectional: bidirectionalTrigger,
    default: defaultTrigger
};
