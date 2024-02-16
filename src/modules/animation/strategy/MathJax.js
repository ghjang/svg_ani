import AbstractAnimationStrategy from './Abstract.js';
import Direction from '../../data/Direction.js';
import DataPointer from '../../data/DataPointer.js';
import { Triggers } from '../trigger/Triggers.js';
import OpacityToggleTransition from '../transition/OpacityToggle.js';


export default class MathJaxAnimationStrategy extends AbstractAnimationStrategy {
    constructor(containerId) {
        super(containerId);
        this.elementAnimationDuration = 500;
    }

    async init() {
        await MathJax.startup.promise;
    }

    #initTransition(_context, transition, gElements, toIndex = gElements.length - 1) {
        if (toIndex < 0 || toIndex >= gElements.length) {
            throw new Error(`Invalid index: toIndex=${toIndex}, gElements.length=${gElements.length}`);
        }

        for (let i = 0; i <= toIndex; ++i) {
            const element = gElements[i];
            transition.setStartState(element);
        }
    }

    #finalizeTransition(_context, transition, gElements, toIndex = gElements.length - 1) {
        if (toIndex < 0 || toIndex >= gElements.length) {
            throw new Error(`Invalid index: toIndex=${toIndex}, gElements.length=${gElements.length}`);
        }

        for (let i = 0; i <= toIndex; ++i) {
            const element = gElements[i];
            transition.setFinalState(element);
        }
    }

    async #applyTransition(transition, element) {
        transition.setTargetTransition(element, this.elementAnimationDuration);
        transition.setEndState(element);
    }

    async #updateElement(context, transition, gElements, curDataPos) {
        if (this.debug) {
            console.log(
                `curDataPos.value.colIndex=${curDataPos.value.colIndex}`
                + `, context.direction=${context.direction}`
                + `, context.isDirectionChanged=${context.isDirectionChanged}`
            );
        }

        const element = gElements[curDataPos.value.colIndex];
        await this.#applyTransition(transition, element);
    }

    async #loopDataPointer(context, trigger, transition) {
        let curPosData = await context.dataPointer.moveTo(context.direction);

        do {
            if (curPosData.value.startOfExpressions) {
                context.direction = Direction.RIGHT;
                curPosData = await context.dataPointer.moveTo(context.direction);
            } else if (curPosData.value.endOfExpressions) {
                const userDirection = context.userDirection;

                context.direction = Direction.LEFT;
                curPosData = await context.dataPointer.moveTo(context.direction);

                context.userDirection = userDirection;
                if (context.userDirection === Direction.CTRL_END) {
                    console.log('context.userDirection === Direction.CTRL_END');
                    context.userDirection = Direction.END;
                }
            }

            if (curPosData.value.startOfRow) {
                if (context.userDirection === Direction.HOME) {
                    this.#initTransition(context, transition, curPosData.value.gElements);
                } else if (context.direction === Direction.RIGHT) {
                    this.#initTransition(context, transition, curPosData.value.gElements);
                } else if (context.direction === Direction.LEFT) {
                    // NOTE: '왼쪽 진행' 방향이었다면, 미리 앞선 'endOfRow'로 이동시켜
                    //       '왼쪽 화살표 키'를 한번 더 누르지 않아도 되도록 함.
                    curPosData = await context.dataPointer.moveTo(context.direction);
                    continue;
                }
            } else if (curPosData.value.endOfRow) {
                if (context.userDirection === Direction.END || context.userDirection === Direction.DOWN) {
                    this.#finalizeTransition(context, transition, curPosData.value.gElements);
                } else if (context.direction === Direction.RIGHT) {
                    // NOTE: '오른쪽 진행' 방향이었다면, 미리 다음 'startOfRow'로 이동시켜
                    //       '오른쪽 화살표 키'를 한번 더 누르지 않아도 되도록 함.
                    curPosData = await context.dataPointer.moveTo(context.direction);
                    continue;
                }
            }

            if (curPosData.value.svgElement) {
                if (context.rowExpressionSvg) {
                    context.container.removeChild(context.rowExpressionSvg);
                }

                context.rowExpressionSvg = curPosData.value.svgElement;
                
                if (context.userDirection === Direction.UP || context.userDirection === Direction.DOWN) {
                    this.#initTransition(context, transition, curPosData.value.gElements);
                    const toIndex = curPosData.value.colIndex ? curPosData.value.colIndex : curPosData.value.gElements.length - 1;
                    this.#finalizeTransition(context, transition, curPosData.value.gElements, toIndex);
                }

                context.container.appendChild(curPosData.value.svgElement);
            }

            try {
                curPosData = await this.#handleTriggerEvent(context, curPosData.value.gElements, trigger, transition);
            } catch (error) {
                if (error.message !== 'trigger-stopped') {
                    throw error;
                }
                curPosData = context.dataPointer.curPosData;
            }
        } while (!curPosData.done);
    }

    async #handleTriggerEvent(context, gElements, trigger, transition) {
        let curPosData = context.dataPointer.curPosData;

        do {
            const delay = this.elementAnimationDuration * 0.9;
            const { nextDirection } = await trigger.wait(delay);
            context.direction = nextDirection

            if (!context.isDirectionChanged
                || nextDirection === Direction.HOME
                || nextDirection === Direction.END
                || nextDirection === Direction.CTRL_HOME
                || nextDirection === Direction.CTRL_END
                || nextDirection === Direction.UP
                || nextDirection === Direction.DOWN) {
                curPosData = await context.dataPointer.moveTo(nextDirection);
            }

            if (curPosData.value.startOfExpressions
                || curPosData.value.endOfExpressions
                || curPosData.value.startOfRow
                || curPosData.value.endOfRow
                || context.userDirection === Direction.UP
                || context.userDirection === Direction.DOWN) {
                break;
            } else if (curPosData.value.colIndex != null) {
                await this.#updateElement(context, transition, gElements, curPosData);
            } else {
                throw new Error(`Invalid data: data.value=${JSON.stringify(curPosData.value)} data.done=${curPosData.done}`);
            }
        } while (!curPosData.done);

        return curPosData;
    }

    async animate(exprs, trigger = Triggers.default, transition = new OpacityToggleTransition()) {
        const container = document.getElementById(this.containerId);

        const dataPointer = new DataPointer(exprs, this.debug);

        let _direction = Direction.RIGHT;
        let _prevDirection = null;
        let _userDirection = null;
        const context = {
            container,
            dataPointer,
            rowExpressionSvg: null,

            get userDirection() {
                return _userDirection;
            },

            set userDirection(value) {
                _userDirection = value;
            },

            get direction() {
                return _direction;
            },

            set direction(value) {
                _userDirection = value;

                if (value === Direction.HOME) {
                    value = Direction.LEFT;
                } else if (value === Direction.END) {
                    value = Direction.RIGHT;
                } else if (value === Direction.CTRL_HOME) {
                    value = Direction.LEFT;
                } else if (value === Direction.CTRL_END) {
                    value = Direction.RIGHT;
                } else if (value === Direction.UP) {
                    value = Direction.LEFT;
                } else if (value === Direction.DOWN) {
                    value = Direction.RIGHT;
                }

                _prevDirection = _direction;
                _direction = value;
            },

            get isDirectionChanged() {
                return (_prevDirection !== null)
                    && (_prevDirection !== _direction);
            }
        };

        await this.#loopDataPointer(context, trigger, transition);
    }
}
