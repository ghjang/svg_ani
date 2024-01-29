export default class OpacityTransition {
    constructor() {
        this.nextDirection = "right";
    }

    setStartState(element) {
        element.style.opacity = 0;
    }

    setTargetTransition(element, duration) {
        element.style.transition = `opacity ${duration}ms`;
    }

    setEndState(element, direction) {
        if (direction === "right") {
            element.style.opacity = 1;
        } else if (direction === "left") {
            element.style.opacity = 0;
        }

        this.nextDirection = direction;
    }
}
