import AbstractAnimationStrategy from './Abstract.js';
import { DataPointer, Direction } from '../../data/DataPointer.js';
import { Triggers } from '../transition/Trigger.js';
import OpacityToggleTransition from '../transition/OpacityToggle.js';


export default class MathJaxAnimationStrategy extends AbstractAnimationStrategy {
    constructor(containerId) {
        super(containerId);
        this.elementAnimationDuration = 500;
    }

    async init() {
        await MathJax.startup.promise;
    }

    #initTransition(_context, gElements, transition) {
        for (let i = 0; i < gElements.length; ++i) {
            const element = gElements[i];
            transition.setStartState(element);
        }
    }

    async #applyTransition(element, transition) {
        transition.setTargetTransition(element, this.elementAnimationDuration);
        transition.setEndState(element);
    }
    
    async #handleRowExpression(context, gElements, trigger, transition) {
        while (true) {
            const { value, done } = await context.dataPointer.moveTo(context.nextDirection);
            
            if (done) {
                break;
            }

            const delay = (value.colIndex === 0) ? this.elementAnimationDuration * 0.1 : this.elementAnimationDuration * 0.9;
            await trigger.wait(delay);

            if (value.endOfRow) {
                if (value.rowIndex < context.dataPointer.totalRowCount - 1) {
                    context.container.removeChild(context.rowExpressionSvg);
                }
                break;
            }

            const element = gElements[value.colIndex];
            await this.#applyTransition(element, transition);
        }
    }

    async animate(exprs, trigger = Triggers.default, transition = new OpacityToggleTransition()) {
        const container = document.getElementById(this.containerId);

        const dataPointer = new DataPointer(exprs, this.debug);

        const context = {
            container,
            dataPointer,
            rowExpressionSvg: null,
            nextDirection: Direction.RIGHT
        };

        while (true) {
            const { value, done } = await dataPointer.moveTo(context.nextDirection);

            if (done) {
                break;
            }

            if (value.startOfExpressions) {
                continue;
            }

            if (value.endOfExpressions) {
                break;
            }

            if (value.startOfRow) {
                this.#initTransition(context, value.gElements, transition);
            }

            context.rowExpressionSvg = value.svgElement;
            container.appendChild(value.svgElement);

            await this.#handleRowExpression(context, value.gElements, trigger, transition);
        }
    }
}
