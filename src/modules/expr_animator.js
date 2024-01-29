import MathJaxAnimationStrategy from './animation_strategy/MathJaxAnimationStrategy.js';


const privateConstructor = Symbol('privateConstructor');


export default class ExprAnimator {
    #renderingStrategy;

    constructor(symbol) {
        if (symbol !== privateConstructor) {
            throw new Error("Use ExprAnimator.create() instead");
        }
    }

    static async create(containerId) {
        const obj = new ExprAnimator(privateConstructor);

        obj.#renderingStrategy = new MathJaxAnimationStrategy(containerId);
        await obj.#renderingStrategy.init();

        return obj;
    }

    async run(source) {
        if (this.#renderingStrategy.isRendering) {
            throw new Error('Already rendering. Please wait until the current rendering is finished.');
        }

        this.#renderingStrategy.isRendering = true;

        try {
            let exprs = source;
            if (typeof source === 'string') {
                exprs = await this.#fetchExpr(source);
            }
            await this.#renderingStrategy.render(exprs);
        } finally {
            this.#renderingStrategy.isRendering = false;
        }
    }

    async #fetchExpr(resourceUrl) {
        const response = await fetch(resourceUrl);
        const yamlText = await response.text();
        const data = jsyaml.load(yamlText);
        return data.steps;
    }
}
