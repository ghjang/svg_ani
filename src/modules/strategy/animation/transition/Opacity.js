export default class OpacityTransition {
    setStartState(element) {
        element.style.opacity = 0;
    }

    setTargetTransition(element, duration) {
        element.style.transition = `opacity ${duration}ms`;
    }

    setEndState(element) {
        element.style.opacity = 1;
    }
}
