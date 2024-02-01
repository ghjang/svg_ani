import createMathJaxSvgExpressions from "./math_expression/MathJax.js";


export const Direction = {
    RIGHT: 'right',
    LEFT: 'left',
    UP: 'up',
    DOWN: 'down'
  };


export class DataPointer {
    constructor(exprs, debug = false) {
        this.exprs = exprs;
        this.debug = debug;

        this.mathJaxExprs = createMathJaxSvgExpressions(exprs, this.debug);
        this.iterator = this.mathJaxExprs[Symbol.asyncIterator]();
    }

    get totalRowCount() {
        return this.mathJaxExprs.length;
    }

    moveTo(nextDirection) {
        return this.iterator.next(nextDirection);
    }        
}
