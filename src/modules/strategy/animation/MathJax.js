import AbstractAnimationStrategy from './Abstract.js';
import createMathJaxSvgExpressions from '../../iterator/math_expression/MathJax.js';
import { Triggers } from './transition/Trigger.js';
import OpacityToggleTransition from './transition/OpacityToggle.js';


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
        const delay = (colIndex === 0) ? this.elementAnimationDuration * 0.1 : this.elementAnimationDuration * 0.9;

        if (colIndex == null || colIndex < 0 || colIndex >= gElements.length) {
            return new Promise(resolve => {
                trigger.wait((e) => resolve(e), delay, colIndex);
            });
        }

        const element = gElements[colIndex];
        transition.setTargetTransition(element, this.elementAnimationDuration);

        return new Promise(resolve => {
            trigger.wait((e) => {
                transition.setEndState(element);
                resolve(e);
            }, delay, colIndex);
        });
    }

    #handleEvent(context, event) {
        if (event && event.direction) {
            context.nextDirection = event.direction;
        }
    }

    async #handleRowExpression(context, gElements, transition, trigger) {
        while (true) {
            const { value, done } = await context.iterator.next(context.nextDirection);

            if (done) {
                break;
            }

            if (value.endOfRow) {
                console.log('endOfRow');
                const event = await this.#applyTransition(gElements, value.colIndex, trigger, transition);
                this.#handleEvent(context, event);
                if (value.rowIndex < context.mathJaxExprs.length - 1) {
                    context.container.removeChild(context.rowExpressionSvg);
                }
                break;
            }

            const event = await this.#applyTransition(gElements, value.colIndex, trigger, transition);
            this.#handleEvent(context, event);
        }
    }

    async animate(exprs, trigger = Triggers.default, transition = new OpacityToggleTransition()) {
        const container = document.getElementById(this.containerId);

        const mathJaxExprs = createMathJaxSvgExpressions(exprs);
        const iterator = mathJaxExprs[Symbol.asyncIterator]();

        const animationContext = {
            container,
            mathJaxExprs,
            iterator,
            rowExpressionSvg: null,
            nextDirection: "right"
        };

        while (true) {
            const { value, done } = await iterator.next();

            if (done) {
                break;
            }

            if (value.startOfExpressions) {
                console.log('startOfExpressions');
                continue;
            }

            if (value.endOfExpressions) {
                console.log('endOfExpressions');
                break;
            }

            if (value.startOfRow) {
                console.log('startOfRow');
                this.#initTransition(value.gElements, transition);
            }

            animationContext.rowExpressionSvg = value.svgElement;
            container.appendChild(value.svgElement);

            await this.#handleRowExpression(animationContext, value.gElements, transition, trigger);
        }

        trigger.stop();
    }
}
