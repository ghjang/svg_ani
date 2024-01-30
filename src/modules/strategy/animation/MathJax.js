import AbstractAnimationStrategy from './Abstract.js';
import createMathJaxSvgExpressions from '../../iterator/math_expression/MathJax.js';
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
        if (colIndex == null || colIndex < 0 || colIndex >= gElements.length) {
            return new Promise(resolve => resolve());
        }

        const delay = (colIndex === 0) ? this.elementAnimationDuration * 0.1 : this.elementAnimationDuration * 0.9;

        const element = gElements[colIndex];
        transition.setTargetTransition(element, this.elementAnimationDuration);

        return new Promise(resolve => {
            trigger((action) => {
                transition.setEndState(element, action.direction);
                resolve(action);
            }, delay, colIndex);
        });
    }

    async #finalizeTransition(gElements) {
        return new Promise(resolve => {
            gElements[gElements.length - 1].addEventListener('transitionend', resolve, { once: true });
        });
    }

    async animate(exprs, trigger = Triggers.default, transition = new OpacityTransition()) {
        const container = document.getElementById(this.containerId);

        const mathJaxExprs = createMathJaxSvgExpressions(exprs);
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
                const { value, done } = await iterator.next(transition.nextDirection);

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
                
                const action = await this.#applyTransition(gElements, value.colIndex, trigger, transition);
                if (action && typeof action.do === 'function') {
                    action.do(gElements, value.rowIndex, value.colIndex);
                }
            }
        }
    }
}
