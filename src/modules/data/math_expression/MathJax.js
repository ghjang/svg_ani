import Direction from "../Direction.js";


class MathJaxSvgExpressions {
    constructor(latexExpressions, debug = false) {
        this.latexExpressions = latexExpressions;
        this.debug = debug;
    }

    get length() {
        return this.latexExpressions.length;
    }

    #valueCheck(value) {
        if (this.debug) {
            const logValue = this.#getLogValue(value);
            console.log('Yielding', logValue);
        }
        return value;
    }
    
    #getLogValue(value) {
        const logValue = { ...value };
        const propertiesToCheck = ['svgElement', 'gElements'];
        propertiesToCheck.forEach(prop => {
            if (value[prop]) {
                logValue[prop] = '...';
            }
        });
        return logValue;
    }

    async *[Symbol.asyncIterator]() {
        yield this.#valueCheck({ startOfExpressions: true });

        for (let i = 0; i < this.latexExpressions.length; ++i) {
            const curRowExpr = this.latexExpressions[i];
            const svgElement = await MathJax.tex2svgPromise(curRowExpr);

            const gElements = svgElement.querySelectorAll('use, rect');

            if (gElements.length === 0) {
                continue;
            }

            yield this.#valueCheck({
                startOfRow: true,
                rowIndex: i,
                svgElement,
                gElements,
            });

            let curHorizontalDirection = Direction.RIGHT;
            for (let j = 0; j < gElements.length; ++j) {
                curHorizontalDirection = yield this.#valueCheck({ rowIndex: i, colIndex: j });

                if (curHorizontalDirection === Direction.EXIT) {
                    if (this.debug) {
                        console.log('Exiting');
                    }
                    return;
                }
            }

            yield this.#valueCheck({ rowIndex: i, endOfRow: true });
        }

        yield this.#valueCheck({ endOfExpressions: true });
    }
}


export default function createMathJaxSvgExpressions(latexExpressions, debug = false) {
    return new MathJaxSvgExpressions(latexExpressions, debug);
}
