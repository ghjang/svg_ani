const privateConstructor = Symbol('privateConstructor');


class AbstractAnimationStrategy {
    constructor(containerId) {
        if (new.target === AbstractAnimationStrategy) {
            throw new TypeError("Cannot construct Abstract instances directly");
        }
        this.containerId = containerId;
        this.isRendering = false;
    }

    async init() {
        throw new Error("Must override method");
    }

    async render(_exprs) {
        throw new Error("Must override method");
    }
}


class MathJaxAnimationStrategy extends AbstractAnimationStrategy {
    constructor(containerId) {
        super(containerId);
        this.animationSpeed = 1000;
        this.delayMultiplier = 400;
        this.extraDelay = 1300;
    }

    async init() {
        await MathJax.startup.promise;
    }

    #applyAnimation(svg) {
        const gElements = svg.querySelectorAll('use, rect');
        gElements.forEach((element, index) => {
            element.style.transition = `opacity ${this.animationSpeed}ms`;
            element.style.opacity = 0;
            setTimeout(
                () => element.style.opacity = 1,
                index * this.delayMultiplier
            );
        });
    }

    async render(exprs) {
        const container = document.getElementById(this.containerId);
        for (let i = 0; i < exprs.length; i++) {
            const eq = exprs[i];
            const svg = await MathJax.tex2svgPromise(eq);
            this.#applyAnimation(svg);
            container.appendChild(svg);

            const renderTargetElemCnt = svg.querySelectorAll('use, rect').length;
            const timeout = (renderTargetElemCnt * this.delayMultiplier) + this.extraDelay;
            await new Promise(resolve => setTimeout(resolve, timeout));

            if (i < exprs.length - 1) {
                container.removeChild(svg);
            }
        }
    }
}


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
