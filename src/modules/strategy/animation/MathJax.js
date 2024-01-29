import AbstractAnimationStrategy from './Abstract.js';
import MathJaxSvgExpressions from '../../iterator/math_expression/MathJax.js';
import { Triggers } from './transition/Trigger.js';


export default class MathJaxAnimationStrategy extends AbstractAnimationStrategy {
    constructor(containerId) {
        super(containerId);
        this.elementAnimationDuration = 500;
    }

    async init() {
        await MathJax.startup.promise;
    }

    #initTransition(gElements) {
        for (let i = 0; i < gElements.length; ++i) {
            const element = gElements[i];
            element.style.opacity = 0;
        }
    }

    async #applyTransition(gElements, colIndex, trigger) {
        if (colIndex === 0) {
            const firstElement = gElements[0];
            const firstElementDelay = this.elementAnimationDuration * 0.1;
            firstElement.style.transition = `opacity ${this.elementAnimationDuration}ms`;
            return new Promise(resolve => {
                trigger(() => {
                    firstElement.style.opacity = 1;
                    resolve();
                }, firstElementDelay, 0);
            });
        }

        const otherElementsDelay = this.elementAnimationDuration * 0.9;
        const element = gElements[colIndex];
        element.style.transition = `opacity ${this.elementAnimationDuration}ms`;
        return new Promise(resolve => {
            gElements[colIndex - 1].addEventListener('transitionstart', () => {
                trigger(() => {
                    element.style.opacity = 1;
                    resolve();
                }, otherElementsDelay, colIndex);
            }, { once: true });
        });
    }

    async #finalizeTransition(gElements) {
        return new Promise(resolve => {
            gElements[gElements.length - 1].addEventListener('transitionend', resolve, { once: true });
        });
    }

    async animate(exprs, trigger = Triggers.default) {
        const container = document.getElementById(this.containerId);

        const mathJaxExprs = new MathJaxSvgExpressions(exprs);
        const iterator = mathJaxExprs[Symbol.asyncIterator]();

        while (true) {
            const { value, done } = await iterator.next();

            if (done) {
                break;
            }

            const svg = value.svgElement;
            const gElements = value.gElements;

            if (value.startOfRow) {
                this.#initTransition(gElements);
            }

            container.appendChild(svg);

            while (true) {
                const { value, done } = await iterator.next();

                if (done) {
                    break;
                }

                if (value.endOfRow) {
                    await this.#finalizeTransition(gElements);
                    if (value.rowIndex < mathJaxExprs.length - 1) {
                        container.removeChild(svg);
                    }
                    break;
                }

                await this.#applyTransition(gElements, value.colIndex, trigger);
            }
        }
    }
}
