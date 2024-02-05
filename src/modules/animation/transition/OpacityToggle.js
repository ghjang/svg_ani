export default class OpacityToggleTransition {
    setStartState(element) {
        element.style.opacity = 0;
    }

    setTargetTransition(element, duration) {
        element.style.transition = `opacity ${duration}ms`;
    }

    setEndState(element) {
        element.style.opacity = (element.style.opacity == 1) ? 0 : 1;
    }
}
