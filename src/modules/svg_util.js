function createSvgElement(textWidth, textHeight, padding) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', `${textWidth + padding}`);
    svg.setAttribute('height', `${textHeight + padding}`);
    svg.setAttribute('viewBox', `0 ${-(textHeight + padding)} ${textWidth} ${textHeight}`);
    return svg;
}

function createSvgPathElement(pathData) {
    const svgPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    svgPath.setAttribute('d', pathData);
    svgPath.setAttribute('fill', 'none');
    svgPath.setAttribute('class', 'outline');
    svgPath.style.transform = "scaleY(-1)";  // y 좌표를 반전시킵니다.
    return svgPath;
}

function applyOutlineAnimation(svgPath, length, animationDuration, nthElem) {
    svgPath.style.strokeDasharray = length + ' ' + length;
    svgPath.style.strokeDashoffset = length;
    svgPath.style.animation = `line-anim ${animationDuration}s ${animationDuration * 0.45 * nthElem}s ease forwards`;
}

function applyFillAnimation(svgPathFill, length, animationDuration, nthElem) {
    svgPathFill.setAttribute('stroke', 'none');
    svgPathFill.style.strokeDasharray = length + ' ' + length;
    svgPathFill.style.strokeDashoffset = length;
    svgPathFill.style.animation = `fill-anim ${animationDuration}s ${animationDuration * 0.45 * nthElem}s forwards`;
}


class FontLoader {
    static fontCache = new Map();

    static async load(url) {
        if (FontLoader.fontCache.has(url)) {
            return FontLoader.fontCache.get(url);
        }

        const font = await new Promise((resolve, reject) => {
            opentype.load(url, (err, font) => {
                if (err) reject(err);
                else resolve(font);
            });
        });

        FontLoader.fontCache.set(url, font);
        return font;
    }
}


const g_targetPathCmds = 'MLQZ';


/**
 * '전체 문자열' 패쓰 데이터에서 '각 문자' 패쓰 데이터를 구한다.
 * 
 * @param {*} strPathData '전체 문자열' 패쓰 데이터 문자열
 * @param {*} charPathCmdCntArr '각 문자' 패쓰 데이터의 명령어 개수 배열
 * @returns '각 문자' 패쓰 데이터 문자열 배열
 */
function splitPathData(strPathData, charPathCmdCntArr) {
    const charPathDataFromStrPathData = [];

    let start = 0;  // '각 문자' 패쓰 데이터의 시작 인덱스
    let end;        // '각 문자' 패쓰 데이터의 끝 인덱스 + 1

    for (let i = 0; i < charPathCmdCntArr.length; ++i) {
        end = start;
        
        let cmdCnt = charPathCmdCntArr[i];
        while (cmdCnt > 0 && end < strPathData.length) {
            // 'SVG 패쓰 명령어' 파트 스킵
            if (g_targetPathCmds.indexOf(strPathData[end]) !== -1) {
                --cmdCnt;
                ++end; // '명령어'는 '1개 문자'
            }

            // 'SVG 패쓰 명령어 인자' 파트 스킵
            while (end < strPathData.length
                    && g_targetPathCmds.indexOf(strPathData[end]) === -1) {
                ++end;
            }
        }

        const charPathData = strPathData.slice(start, end);
        charPathDataFromStrPathData.push(charPathData);

        start = end;
    }

    console.log(charPathDataFromStrPathData);

    return charPathDataFromStrPathData;
}


export function appendAnimationFromPathData(svg, pathData, animationDuration, nthElem) {
    const svgPathStroke = createSvgPathElement(pathData);
    const length = svgPathStroke.getTotalLength();
    applyOutlineAnimation(svgPathStroke, length, animationDuration, nthElem);
    svg.appendChild(svgPathStroke);

    const svgPathFill = createSvgPathElement(pathData);
    applyFillAnimation(svgPathFill, length, animationDuration, nthElem);
    svg.appendChild(svgPathFill);
}


export async function makeSvgElementWithTextDrawingAnimation(
    text,
    animationDuration = 0.65,
    fontSize = 72,
    webFontUrl = 'https://fonts.gstatic.com/s/roboto/v20/KFOmCnqEu92Fr1Mu4mxP.ttf'
) {
    let font;

    try {
        font = await FontLoader.load(webFontUrl);
    } catch (error) {
        throw `Font could not be loaded: ${error} (url: ${webFontUrl})`
    }

    const textHeight = fontSize * (font.ascender - font.descender) / font.unitsPerEm;
    const padding = fontSize * 0.25;
    const baseline = fontSize * 1.2;
    const textWidth = font.getAdvanceWidth(text, fontSize);
    const glyphPath = font.getPath(text, 0, baseline, fontSize);
    const strPathData = glyphPath.toPathData();
    const charPathDataArr = text.split('').map(c => font.getPath(`${c}`, 0, baseline, fontSize).toPathData());

    // 전체 문자열에 대한 패스 데이터에서 명령어의 개수를 카운팅
    let strPathCmdCount = 0;
    for (let i = 0; i < strPathData.length; ++i) {
        if (g_targetPathCmds.indexOf(strPathData[i]) !== -1) {
            ++strPathCmdCount;
        }
    }

    // 각 문자에 대한 패스 데이터에서 명령어의 개수를 카운팅
    const charPathCmdCntArr = charPathDataArr.map(data => {
        let count = 0;
        for (let i = 0; i < data.length; ++i) {
            if (g_targetPathCmds.indexOf(data[i]) !== -1) {
                ++count;
            }
        }
        return count;
    });

    // 전체 문자열에 대한 패스 데이터의 명령어 개수와 각 문자에 대한 패스 데이터의 명령어 개수 합이 같은지 확인
    const totalCharPathCmdCount = charPathCmdCntArr.reduce((a, b) => a + b, 0);
    if (strPathCmdCount !== totalCharPathCmdCount) {
        throw new Error(
            'The command count of the whole string path data ' +
            'does not match the total command count of each character path data.'
        );
    }

    /*
        NOTE: '전체 문자열'에 대해서 'getPath'를 호출해서 구한 패쓰 데이터와 '각 문자'에 대해서 'getPath'를
              호출해서 구한 패쓰 데이터가 전체 문자열에서 구한 패쓰 데이터의 대응 문자 부분과 다르다. 예를 들어,
              'Hello, World!' 문자열에 대해서 구한 패쓰 데이터는 모든 문자가 최종적으로 화면에 렌더링될때
              정상적인 베이스라인에 맞춰서 렌더링되지만, 각 문자에 대해서 구한 패쓰 데이터는 그렇지 못하다.
              그러니까, 'e, o, r' 같은 문자가 각각의 패쓰 데이터를 구해서 곧바로 그리면 잘못된 수직 위치에
              문자가 렌더링된다. 해서 현재의 구현에서 아래와 같은 방식으로 일단 워크어라운드를 적용했다.
              폰트와 관련한 '변환'으로 문제를 해결할 수 있을 것 같은데, 그 방법을 찾지 못했다.
    */
    const charPathDataFromStrPathData = splitPathData(strPathData, charPathCmdCntArr);

    const svg = createSvgElement(textWidth, textHeight, padding);
    charPathDataFromStrPathData.forEach((pathData, n) => {
        appendAnimationFromPathData(svg, pathData, animationDuration, n);
    });

    return svg;
}
