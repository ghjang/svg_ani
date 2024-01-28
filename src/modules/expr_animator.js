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
        this.elementAnimationDuration = 500;
    }

    async init() {
        await MathJax.startup.promise;
    }

    /**
     * NOTE: 'transitionend' 이벤트를 사용하지 않은 것은 먼저 애니메이션을 적용한 요소의 애미메이션이 완전히 종료한 후에
     *       다음 요소의 애미메이션을 적용하면 자연스럽지 않은 애미메이션으로 보였기 때문이다. 약간 겹치는 타이밍에 애니메이션을
     *       적용하면 자연스러운 애니메이션으로 보이게 된다.
     * @param {*} svg 
     * @returns {AsyncGenerator} 
     */
    async *#applyAnimation(svg) {
        const gElements = svg.querySelectorAll('use, rect');
    
        if (gElements.length === 0) {
            return;
        }
    
        for (let i = 0; i < gElements.length; ++i) {
            const element = gElements[i];
            element.style.opacity = 0;
        }
    
        const firstElement = gElements[0];
        const firstElementDelay = this.elementAnimationDuration * 0.1;
        firstElement.style.transition = `opacity ${this.elementAnimationDuration}ms`;
        yield new Promise(resolve => {
            setTimeout(() => {
                firstElement.style.opacity = 1;
                resolve();
            }, firstElementDelay);
        });
    
        const otherElementsDelay = this.elementAnimationDuration * 0.9;
        for (let i = 1; i < gElements.length; ++i) {
            const element = gElements[i];
            element.style.transition = `opacity ${this.elementAnimationDuration}ms`;
            yield new Promise(resolve => {
                gElements[i - 1].addEventListener('transitionstart', () => {
                    setTimeout(() => {
                        element.style.opacity = 1;
                        resolve();
                    }, otherElementsDelay);
                }, { once: true });
            });
        }
    }

    async render(exprs) {
        const container = document.getElementById(this.containerId);
        for (let i = 0; i < exprs.length; i++) {
            const expr = exprs[i];
            const svg = await MathJax.tex2svgPromise(expr);
            const animation = this.#applyAnimation(svg);

            container.appendChild(svg);

            // eslint-disable-next-line no-unused-vars
            for await (const _ of animation) {
                // 각 요소에 순차적으로 애니메이션을 적용
            }

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
