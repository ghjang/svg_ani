import Direction from "./Direction.js";
import createMathJaxSvgExpressions from "./math_expression/MathJax.js";


export default class DataPointer {
    constructor(exprs, debug = false) {
        this.exprs = exprs;
        this.debug = debug;

        this.data = [];
        this.pointerX = -1;

        this.mathJaxExprs = createMathJaxSvgExpressions(exprs, this.debug);
        this.iterator = this.mathJaxExprs[Symbol.asyncIterator]();
    }

    get totalRowCount() {
        return this.mathJaxExprs.length;
    }

    async #fetchNextElementData(nextDirection) {
        if (this.iterator === null) {
            throw new Error('Iterator is null');
        }

        const { value, done } = await this.iterator.next(nextDirection);

        if (done) {
            this.iterator = null;
        } else {
            ++this.pointerX;
            this.data.push({ value, done });
        }

        return this.data[this.pointerX];
    }

    #moveToLeft() {
        if (this.pointerX > 0) {
            --this.pointerX;
        }
    }

    async #moveToRight() {
        if (this.pointerX < this.data.length - 1) {
            ++this.pointerX;
        } else if (this.iterator) {
            await this.#fetchNextElementData(Direction.RIGHT);
        }
    }

    #moveToUp() {
        this.#moveToHome();
        this.#moveToLeft();
    }

    async #moveToDown() {
        if (this.data[this.pointerX].value.endOfRow == null) {
            await this.#moveToEnd();
            return;
        }

        await this.#moveToRight();

        if (this.data[this.pointerX].value.startOfRow) {
            await this.#moveToEnd();
        }
    }

    async #moveToEnd() {
        while (this.pointerX >= 0 && this.data[this.pointerX].value.endOfRow == null) {
            if (this.pointerX < this.data.length - 1) {
                ++this.pointerX;
            } else if (this.iterator) {
                await this.#fetchNextElementData(Direction.END);
            } else if (this.pointerX >= this.data.length - 1) {
                break;
            }
        }
    }

    #moveToHome() {
        while (this.pointerX > 0 && this.data[this.pointerX].value.startOfRow == null) {
            --this.pointerX;
        }
    }
    
    async #moveToCtrlEnd() {
        while (this.pointerX >= 0 && this.data[this.pointerX].value.endOfExpressions == null) {
            if (this.pointerX < this.data.length - 1) {
                ++this.pointerX;
            } else if (this.iterator) {
                await this.#fetchNextElementData(Direction.CTRL_END);
            } else if (this.pointerX >= this.data.length - 1) {
                break;
            }
        }
    }

    async #moveToCtrlHome() {
        if (this.pointerX < 0) {
            await this.#fetchNextElementData(Direction.CTRL_HOME);
        }
        this.pointerX = 0;
    }

    async moveTo(...nextDirections) {
        for (const nextDirection of nextDirections) {
            switch (nextDirection) {
                case Direction.LEFT: this.#moveToLeft(); break;
                case Direction.RIGHT: await this.#moveToRight(); break;
    
                case Direction.UP: this.#moveToUp(); break;
                case Direction.DOWN: await this.#moveToDown(); break;
    
                case Direction.HOME: this.#moveToHome(); break;
                case Direction.END: await this.#moveToEnd(); break;
    
                case Direction.CTRL_HOME: await this.#moveToCtrlHome(); break;
                case Direction.CTRL_END: await this.#moveToCtrlEnd(); break;
    
                default:
                    throw new Error(`Invalid direction: ${nextDirection}`);
            }
        }
    
        return (this.pointerX >= 0 && this.pointerX < this.data.length) ? this.data[this.pointerX] : null;
    }
}
