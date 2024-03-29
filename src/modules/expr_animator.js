import MathJaxAnimationStrategy from './animation/strategy/MathJax.js';
import { Triggers } from './animation/trigger/Triggers.js';
import OpacityToggleTransition from './animation/transition/OpacityToggle.js';


const privateConstructor = Symbol('privateConstructor');


export default class ExprAnimator {
    #animationStrategy;
    #trigger;
    #transition;

    constructor(symbol) {
        if (symbol !== privateConstructor) {
            throw new Error("Use ExprAnimator.create() instead");
        }
        this.debug = false;
    }

    static async create(containerId, trigger = Triggers.default, transition = new OpacityToggleTransition()) {
        const obj = new ExprAnimator(privateConstructor);

        obj.#animationStrategy = new MathJaxAnimationStrategy(containerId);
        await obj.#animationStrategy.init();

        obj.#trigger = trigger;
        obj.#transition = transition;

        return obj;
    }

    async run(source) {
        if (this.#animationStrategy.isAnimating) {
            throw new Error('Already animating. Please wait until the current animation is finished.');
        }

        this.#animationStrategy.isAnimating = true;
        this.#animationStrategy.debug = this.debug;

        try {
            let exprs = source;
            if (typeof source === 'string') {
                exprs = await this.#fetchExpr(source);
            }
            await this.#animationStrategy.animate(exprs, this.#trigger, this.#transition);
        } finally {
            this.#animationStrategy.isAnimating = false;
        }
    }

    async #fetchExpr(resourceUrl) {
        const response = await fetch(resourceUrl);
        const yamlText = await response.text();
        const data = jsyaml.load(yamlText);
        return data.steps;
    }
}
