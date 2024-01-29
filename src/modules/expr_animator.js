import MathJaxAnimationStrategy from './strategy/animation/MathJax.js';
import { Triggers } from './strategy/animation/transition/Trigger.js';


const privateConstructor = Symbol('privateConstructor');


export default class ExprAnimator {
    #animationStrategy;
    #trigger;

    constructor(symbol) {
        if (symbol !== privateConstructor) {
            throw new Error("Use ExprAnimator.create() instead");
        }
    }

    static async create(containerId, trigger = Triggers.default) {
        const obj = new ExprAnimator(privateConstructor);

        obj.#animationStrategy = new MathJaxAnimationStrategy(containerId);
        await obj.#animationStrategy.init();

        obj.#trigger = trigger;

        return obj;
    }

    async run(source) {
        if (this.#animationStrategy.isAnimating) {
            throw new Error('Already animating. Please wait until the current animation is finished.');
        }

        this.#animationStrategy.isAnimating = true;

        try {
            let exprs = source;
            if (typeof source === 'string') {
                exprs = await this.#fetchExpr(source);
            }
            await this.#animationStrategy.animate(exprs, this.#trigger);
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
