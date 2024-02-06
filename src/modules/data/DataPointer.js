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

    async moveTo(nextDirection) {
        switch (nextDirection) {
            case Direction.LEFT:
                if (this.pointerX > 0) {
                    --this.pointerX;
                }
                break;

            case Direction.RIGHT:
                if (this.pointerX < this.data.length - 1) {
                    ++this.pointerX;
                } else if (this.iterator) {
                    await this.#fetchNextElementData(nextDirection);
                }
                break;

            case Direction.UP:
            case Direction.DOWN:
                break;

            case Direction.HOME:
                while (this.pointerX > 0 && this.data[this.pointerX].value.startOfRow == null) {
                    --this.pointerX;
                }
                break;

            case Direction.END:
                while (this.pointerX >= 0 && this.data[this.pointerX].value.endOfRow == null) {
                    if (this.pointerX < this.data.length - 1) {
                        ++this.pointerX;
                    } else if (this.iterator) {
                        await this.#fetchNextElementData(nextDirection);
                    } else if (this.pointerX >= this.data.length - 1) {
                        break;
                    }
                }
                break;

            case Direction.CTRL_HOME:
                if (this.pointerX < 0) {
                    await this.#fetchNextElementData(nextDirection);
                }
                this.pointerX = 0;
                break;

            case Direction.CTRL_END:
                while (this.pointerX >= 0 && this.data[this.pointerX].value.endOfExpressions == null) {
                    if (this.pointerX < this.data.length - 1) {
                        ++this.pointerX;
                    } else if (this.iterator) {
                        await this.#fetchNextElementData(nextDirection);
                    } else if (this.pointerX >= this.data.length - 1) {
                        break;
                    }
                }
                break;

            default:
                throw new Error(`Invalid direction: ${nextDirection}`);
        }

        return (this.pointerX >= 0 && this.pointerX < this.data.length) ? this.data[this.pointerX] : null;
    }
}
