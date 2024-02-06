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

    async #updateElement(context, curDataPos, gElements, transition) {
        if (this.debug) {
            console.log(
                `curDataPos.value.colIndex=${curDataPos.value.colIndex}`
                + `, context.nextDirection=${context.nextDirection}`
                + `, context.isNextDirectionChanged=${context.isNextDirectionChanged}`
            );
        }

        const element = gElements[curDataPos.value.colIndex];
        await this.#applyTransition(element, transition);
    }

    async #loopDataPointer(context, trigger, transition) {
        let curDataPos = await context.dataPointer.moveTo(context.nextDirection);

        do {
            if (curDataPos.value.startOfExpressions) {
                context.nextDirection = Direction.RIGHT;
                curDataPos = await context.dataPointer.moveTo(context.nextDirection);
            } else if (curDataPos.value.endOfExpressions) {
                context.nextDirection = Direction.LEFT;
                curDataPos = await context.dataPointer.moveTo(context.nextDirection);
            }

            if (curDataPos.value.startOfRow) {
                if (context.nextDirection === Direction.RIGHT) {
                    this.#initTransition(context, curDataPos.value.gElements, transition);
                } else if (context.nextDirection === Direction.LEFT) {
                    // NOTE: '왼쪽 진행' 방향이었다면, 미리 앞선 'endOfRow'로 이동시켜
                    //       '왼쪽 화살표 키'를 한번 더 누르지 않아도 되도록 함.
                    curDataPos = await context.dataPointer.moveTo(context.nextDirection);
                    continue;
                }
            } else if (curDataPos.value.endOfRow) {
                if (context.nextDirection === Direction.RIGHT) {
                    // NOTE: '오른쪽 진행' 방향이었다면, 미리 다음 'startOfRow'로 이동시켜
                    //       '오른쪽 화살표 키'를 한번 더 누르지 않아도 되도록 함.
                    curDataPos = await context.dataPointer.moveTo(context.nextDirection);
                    continue;
                }
            }

            if (curDataPos.value.svgElement) {
                if (context.rowExpressionSvg) {
                    context.container.removeChild(context.rowExpressionSvg);
                }
                context.rowExpressionSvg = curDataPos.value.svgElement;
                context.container.appendChild(curDataPos.value.svgElement);
            }

            curDataPos = await this.#handleTriggerEvent(context, curDataPos.value.gElements, trigger, transition);
        } while (!curDataPos.done);
    }

    async #handleTriggerEvent(context, gElements, trigger, transition) {
        let curDataPos = null;

        do {
            const delay = this.elementAnimationDuration * 0.9;
            const { nextDirection } = await trigger.wait(delay);
            context.nextDirection = nextDirection

            if (curDataPos === null || !context.isNextDirectionChanged) {
                curDataPos = await context.dataPointer.moveTo(context.nextDirection);
            }

            if (curDataPos.value.startOfExpressions || curDataPos.value.endOfExpressions
                || curDataPos.value.startOfRow || curDataPos.value.endOfRow) {
                break;
            } else if (curDataPos.value.colIndex != null) {
                await this.#updateElement(context, curDataPos, gElements, transition);
            } else {
                throw new Error(`Invalid data: data.value=${JSON.stringify(curDataPos.value)} data.done=${curDataPos.done}`);
            }
        } while (!curDataPos.done);

        return curDataPos;
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
                return (_prevDirection !== null) && (_prevDirection !== _nextDirection);
            }
        };

        await this.#loopDataPointer(context, trigger, transition);
    }
}
