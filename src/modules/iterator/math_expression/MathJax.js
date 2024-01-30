class MathJaxSvgExpressions {
    constructor(latexExpressions) {
        this.latexExpressions = latexExpressions;
    }

    get length() {
        return this.latexExpressions.length;
    }

    async *[Symbol.asyncIterator]() {
        yield { startOfExpressions: true };

        let verticalIncrementVal = 1;
        for (let i = 0; i < this.latexExpressions.length; i += verticalIncrementVal) {
            const curRowExpr = this.latexExpressions[i];
            const svgElement = await MathJax.tex2svgPromise(curRowExpr);

            const gElements = svgElement.querySelectorAll('use, rect');

            if (gElements.length === 0) {
                // THINK: '빈 줄'이 의미가 있을수도 있다?
                continue;
            }

            yield {
                svgElement,
                gElements,
                rowIndex: i,
                startOfRow: true
            };

            let prevHorizontalDirection = "right";
            let curHorizontalDirection = prevHorizontalDirection;
            let horizontalIncrementVal = 1;
            let j = 0;
            for ( ; j >= 0 && j < gElements.length; j += horizontalIncrementVal) {
                curHorizontalDirection = yield { rowIndex: i, colIndex: j };

                if (curHorizontalDirection === "exit") {
                    return;
                }

                if (prevHorizontalDirection !== curHorizontalDirection) {
                    horizontalIncrementVal = -horizontalIncrementVal;
                    prevHorizontalDirection = curHorizontalDirection;
                }
            }

            if (i === 0 && j < 0) {
                yield { startOfExpressions: true };
            } else if (horizontalIncrementVal === 1) {
                yield { rowIndex: i, endOfRow: true };
            }
        }

        yield { endOfExpressions: true };
    }
}


export default function createMathJaxSvgExpressions(latexExpressions) {
    return new MathJaxSvgExpressions(latexExpressions);
}
