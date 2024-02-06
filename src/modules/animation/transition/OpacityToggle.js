export default class OpacityToggleTransition {
    setStartState(element) {
        element.style.opacity = 0;
    }

    setTargetTransition(element, duration) {
        element.style.transition = `opacity ${duration}ms`;
    }

    setEndState(element) {
        if (element.style.opacity == null || element.style.opacity == '') {
            element.style.opacity = 1;
        }
        
        element.style.opacity = (element.style.opacity == 1) ? 0 : 1;
    }

    setFinalState(element) {
        element.style.opacity = 1;
    }
}
