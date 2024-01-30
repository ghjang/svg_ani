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
                trigger.wait(() => resolve(), delay, colIndex);
            });
        }

        const element = gElements[colIndex];
        transition.setTargetTransition(element, this.elementAnimationDuration);

        return new Promise(resolve => {
            trigger.wait(() => {
                transition.setEndState(element);
                resolve();
            }, delay, colIndex);
        });
    }

    async animate(exprs, trigger = Triggers.default, transition = new OpacityToggleTransition()) {
        const container = document.getElementById(this.containerId);

        const mathJaxExprs = createMathJaxSvgExpressions(exprs);
        const iterator = mathJaxExprs[Symbol.asyncIterator]();

        let nextDirection = "right";

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

            let svg = value.svgElement;
            let gElements = value.gElements;

            if (value.startOfRow) {
                console.log('startOfRow');
                svg = value.svgElement;
                gElements = value.gElements;    
                this.#initTransition(gElements, transition);
            }

            container.appendChild(svg);

            while (true) {
                const { value, done } = await iterator.next(nextDirection);

                if (done) {
                    break;
                }

                if (value.endOfRow) {
                    console.log('endOfRow');
                    await this.#applyTransition(gElements, value.colIndex, trigger, transition);
                    if (value.rowIndex < mathJaxExprs.length - 1) {
                        container.removeChild(svg);
                    }
                    break;
                }
                
                await this.#applyTransition(gElements, value.colIndex, trigger, transition);
            }
        }

        trigger.stop();
    }
}
