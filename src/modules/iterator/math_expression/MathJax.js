export default class MathJaxSvgExpressions {
    constructor(latexExpressions) {
        this.latexExpressions = latexExpressions;
    }

    get length() {
        return this.latexExpressions.length;
    }

    async *[Symbol.asyncIterator]() {
        for (let i = 0; i < this.latexExpressions.length; ++i) {
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

            for (let j = 0; j < gElements.length; ++j) {
                yield {
                    rowIndex: i,
                    colIndex: j
                };
            }

            yield {
                rowIndex: i,
                endOfRow: true
            };
        }
    }
}
