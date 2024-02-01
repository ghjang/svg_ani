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

    async #fetchNextCol(nextDirection) {
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
                    await this.#fetchNextCol(nextDirection);
                }
                break;

            case Direction.UP:
            case Direction.DOWN:
                break;

            default:
                throw new Error(`Invalid direction: ${nextDirection}`);
        }

        return this.data[this.pointerX];
    }
}
