export default class MathJaxSvgExpressions {
    constructor(latexExpressions) {
        this.latexExpressions = latexExpressions;
    }

    get length() {
        return this.latexExpressions.length;
    }

    async *[Symbol.asyncIterator]() {
        let verticalIncrementVal = 1;
        for (let i = 0; i < this.latexExpressions.length; i += verticalIncrementVal) {
            const expr = this.latexExpressions[i];
            const svgElement = await MathJax.tex2svgPromise(expr);

            const gElements = svgElement.querySelectorAll('use, rect');

            if (gElements.length === 0) {
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
            for (let j = -1; j >= -2 && j < gElements.length; j += horizontalIncrementVal) {
                if (prevHorizontalDirection !== curHorizontalDirection) {
                    horizontalIncrementVal = -horizontalIncrementVal;
                    j += horizontalIncrementVal;
                    prevHorizontalDirection = curHorizontalDirection;
                    continue;
                }

                const elemInfo = { rowIndex: i, colIndex: j + 1};
                console.log(`i: ${i}, j: ${j}`);
                curHorizontalDirection = yield elemInfo;
            }

            console.log(`i: ${i}`);

            if (horizontalIncrementVal === 1) {
                yield {
                    rowIndex: i,
                    endOfRow: true
                };
            } else if (horizontalIncrementVal === -1) {
                yield {
                    rowIndex: i,
                    startOfRow: true
                };
            }
        }
    }
}
