import AbstractAnimationStrategy from './Abstract.js';
import MathJaxSvgExpressions from '../../iterator/math_expression/MathJax.js';
import { Triggers } from './transition/Trigger.js';
import OpacityTransition from './transition/Opacity.js';


export default class MathJaxAnimationStrategy extends AbstractAnimationStrategy {
    constructor(containerId) {
        super(containerId);
        this.elementAnimationDuration = 500;
    }

    async init() {
        await MathJax.startup.promise;
    }

    #initTransition(gElements, transition) {
        for (let i = 0; i < gElements.length; ++i) {
            const element = gElements[i];
            transition.setStartState(element);
        }
    }

    async #applyTransition(gElements, colIndex, trigger, transition) {
        if (colIndex === 0) {
            const firstElement = gElements[0];
            const firstElementDelay = this.elementAnimationDuration * 0.1;
            transition.setTargetTransition(firstElement, this.elementAnimationDuration);
            return new Promise(resolve => {
                trigger(() => {
                    transition.setEndState(firstElement);
                    firstElement.style.opacity = 1;
                    resolve();
                }, firstElementDelay, 0);
            });
        }

        const otherElementsDelay = this.elementAnimationDuration * 0.9;
        const element = gElements[colIndex];
        transition.setTargetTransition(element, this.elementAnimationDuration);
        return new Promise(resolve => {
            gElements[colIndex - 1].addEventListener('transitionstart', () => {
                trigger(() => {
                    transition.setEndState(element);
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

    async animate(exprs, trigger = Triggers.default, transition = new OpacityTransition()) {
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
                this.#initTransition(gElements, transition);
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

                await this.#applyTransition(gElements, value.colIndex, trigger, transition);
            }
        }
    }
}
