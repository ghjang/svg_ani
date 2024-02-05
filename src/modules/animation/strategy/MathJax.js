import AbstractAnimationStrategy from './Abstract.js';
import Direction from '../../data/Direction.js';
import DataPointer from '../../data/DataPointer.js';
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
            let data = await context.dataPointer.moveTo(context.nextDirection);

            if (data.done) {
                break;
            }

            const delay = (data.value.colIndex === 0) ? this.elementAnimationDuration * 0.1 : this.elementAnimationDuration * 0.9;
            const { nextDirection } = await trigger.wait(delay);
            context.nextDirection = nextDirection

            if (context.isNextDirectionChanged) {
                data = await context.dataPointer.moveTo(context.nextDirection);
            }

            if (data.value.startOfRow) {
                console.log('startOfRow');
                if (context.nextDirection === Direction.LEFT) {
                    if (data.value.rowIndex > 0) {
                        context.container.removeChild(context.rowExpressionSvg);
                    } else {
                        data = await context.dataPointer.moveTo(context.nextDirection);
                    }
                    break;
                }
            } else if (data.value.endOfRow) {
                if (data.value.rowIndex < context.dataPointer.totalRowCount - 1) {
                    context.container.removeChild(context.rowExpressionSvg);
                }
                break;
            } else if (data.value.colIndex != null) {
                const element = gElements[data.value.colIndex];
                await this.#applyTransition(element, transition);
            } else {
                break;
            }
        }
    }

    async animate(exprs, trigger = Triggers.default, transition = new OpacityToggleTransition()) {
        const container = document.getElementById(this.containerId);

        const dataPointer = new DataPointer(exprs, this.debug);

        let _nextDirection = Direction.RIGHT;
        let _prevDirection = null;
        const context = {
            container,
            dataPointer,
            rowExpressionSvg: null,

            get nextDirection() {
                return _nextDirection;
            },

            set nextDirection(value) {
                _prevDirection = _nextDirection;
                _nextDirection = value;
            },

            get isNextDirectionChanged() {
                return _prevDirection !== null && _prevDirection !== _nextDirection;
            }
        };

        while (true) {
            let data = await dataPointer.moveTo(context.nextDirection);

            if (data.done) {
                break;
            }

            if (data.value.startOfExpressions) {
                console.log('startOfExpressions');
                context.nextDirection = Direction.RIGHT;
                data = await dataPointer.moveTo(context.nextDirection);
            } else if (data.value.endOfExpressions) {
                console.log('endOfExpressions');
                context.nextDirection = Direction.LEFT;
                data = await dataPointer.moveTo(context.nextDirection);
            }

            if (data.value.startOfRow) {
                this.#initTransition(context, data.value.gElements, transition);
            }

            if (data.value.svgElement) {
                context.rowExpressionSvg = data.value.svgElement;
                container.appendChild(data.value.svgElement);
            }

            await this.#handleRowExpression(context, data.value.gElements, trigger, transition);
        }
    }
}
