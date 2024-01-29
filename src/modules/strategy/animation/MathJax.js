import AbstractAnimationStrategy from './Abstract.js';


export default class MathJaxAnimationStrategy extends AbstractAnimationStrategy {
    constructor(containerId) {
        super(containerId);
        this.elementAnimationDuration = 500;
    }

    async init() {
        await MathJax.startup.promise;
    }

    /**
     * NOTE: 'transitionend' 이벤트를 사용하지 않은 것은 먼저 애니메이션을 적용한 요소의 애미메이션이 완전히 종료한 후에
     *       다음 요소의 애미메이션을 적용하면 자연스럽지 않은 애미메이션으로 보였기 때문이다. 약간 겹치는 타이밍에 애니메이션을
     *       적용하면 자연스러운 애니메이션으로 보이게 된다.
     * 
     * @param {*} svg 
     * @param {*} trigger
     * @returns {AsyncGenerator} 
     */
    async *#applyAnimation(svg, trigger) {
        const gElements = svg.querySelectorAll('use, rect');

        if (gElements.length === 0) {
            return;
        }

        for (let i = 0; i < gElements.length; ++i) {
            const element = gElements[i];
            element.style.opacity = 0;
        }

        const firstElement = gElements[0];
        const firstElementDelay = this.elementAnimationDuration * 0.1;
        firstElement.style.transition = `opacity ${this.elementAnimationDuration}ms`;
        yield new Promise(resolve => {
            trigger(() => {
                firstElement.style.opacity = 1;
                resolve();
            }, firstElementDelay, 0);
        });

        const otherElementsDelay = this.elementAnimationDuration * 0.9;
        for (let i = 1; i < gElements.length; ++i) {
            const element = gElements[i];
            element.style.transition = `opacity ${this.elementAnimationDuration}ms`;
            yield new Promise(resolve => {
                gElements[i - 1].addEventListener('transitionstart', () => {
                    trigger(() => {
                        element.style.opacity = 1;
                        resolve();
                    }, otherElementsDelay, i);
                }, { once: true });
            });
        }

        yield new Promise(resolve => {
            gElements[gElements.length - 1].addEventListener('transitionend', resolve, { once: true });
        });
    }

    async render(exprs) {
        const container = document.getElementById(this.containerId);
    
        // eslint-disable-next-line no-unused-vars
        const autoTimerTrigger = (callback, delay) => {
            // 스페이스바를 누르면 일시정지, 다시 누르면 다시 재개하도록 코드 수정 가능??
            setTimeout(callback, delay);
        };
    
        // eslint-disable-next-line no-unused-vars
        const forwardTrigger = (callback, _delay, _elemIndex) => {
            window.addEventListener('keydown', function onKeydown(event) {
                if (event.code === 'Space') {
                    window.removeEventListener('keydown', onKeydown);
                    setTimeout(callback, 0);
                }
            });
        };

        //const backwardTrigger = (callback, _delay, _elemIndex) => { }
        //const bidirectionalTrigger = (callback, delay, elemIndex) => { }

        // 원하는 트리거를 선택하세요:
        const trigger = autoTimerTrigger;  // 자동 트리거
        //const trigger = forwardTrigger;  // 스페이스바 트리거
    
        for (let i = 0; i < exprs.length; i++) {
            const expr = exprs[i];
            const svg = await MathJax.tex2svgPromise(expr);
            const animation = this.#applyAnimation(svg, trigger);
    
            container.appendChild(svg);
    
            // eslint-disable-next-line no-unused-vars
            for await (const _ of animation) {
                // 각 요소에 순차적으로 애니메이션을 적용
            }
    
            if (i < exprs.length - 1) {
                container.removeChild(svg);
            }
        }
    }
}
