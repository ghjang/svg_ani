const autoTimerTrigger = (callback, delay) => {
    // 스페이스바를 누르면 일시정지, 다시 누르면 다시 재개하도록 코드 수정 가능??
    setTimeout(callback, delay);
};


const forwardOnlyTrigger = (callback, _delay, _elemIndex) => {
    window.addEventListener('keydown', function onKeydown(event) {
        if (event.code === 'ArrowRight') {
            window.removeEventListener('keydown', onKeydown);
            setTimeout(callback, 0);
        }
    });
};


//const backwardTrigger = (callback, _delay, _elemIndex) => { }
//const bidirectionalTrigger = (callback, delay, elemIndex) => { }

const defaultTrigger = autoTimerTrigger;


export const Triggers = {
    autoTimer: autoTimerTrigger,
    forwardOnly: forwardOnlyTrigger,
    default: defaultTrigger
};
