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


function splitPathData(strPathData, charPathCmdCntArr) {
    const COMMANDS = 'MLQZ';
    const charPathDataFromStrPathData = [];

    /*
        패쓰 데이터 문자열에서 각 '명령어와 인자'를 단위로 분리한다.
        명령어는 1개의 문자이고, 인자는 0개 이상인 것을 가정한다.
        또, 명령어 앞의 인자에 인자가 있을 경우 그 명령어 인자 사이에 공백이 없다고 가정한다.
        
        예) 'M 0 0L 10 0L 10 10L 0 10Z' -> ['M 0 0', 'L 10 0', 'L 10 10', 'L 0 10', 'Z']
    */
    const regex = new RegExp(`(?=[${COMMANDS}])`);
    const commandsAndArgs = strPathData.split(regex);

    let index = 0;
    charPathCmdCntArr.forEach(cmdCnt => {
        // 각 문자에 대한 패쓰 데이터를 저장
        charPathDataFromStrPathData.push(commandsAndArgs.slice(index, index + cmdCnt).join(''));
        index += cmdCnt;
    });

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

    const charPathCmdCntArr = charPathDataArr.map(data => {
        const matches = data.match(/[MLQZ]/g);
        return matches ? matches.length : 0;
    });

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
