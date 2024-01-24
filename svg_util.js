function combineOverlappingPaths(matches) {
    const paths = [];
    const bboxes = [];

    for (let i = 0; i < matches.length; i++) {
        const individualPathData = matches[i];

        const commandPattern = /([MLQZ])((\s*-?\d+\.?\d*)*)/g;
        let match;
        const points = [];

        while ((match = commandPattern.exec(individualPathData)) !== null) {
            const command = match[1];
            const args = match[2].trim().split(/\s+/).map(Number);

            console.debug(command, args);

            if (command === 'Q') {
                if (args.length !== 4) {
                    throw new Error(`'${command}' command must have 4 arguments: ${args}`);
                }
                points.push({ x: args[0], y: args[1] });
                points.push({ x: args[2], y: args[3] });
            } else if (command === 'M' || command === 'L') {
                if (args.length !== 2) {
                    throw new Error(`'${command}' command must have 2 arguments: ${args}`);
                }
                points.push({ x: args[0], y: args[1] });
            }
        }

        // 바운딩 박스를 계산합니다.
        const minX = Math.min(...points.map(point => point.x));
        const maxX = Math.max(...points.map(point => point.x));
        const minY = Math.min(...points.map(point => point.y));
        const maxY = Math.max(...points.map(point => point.y));

        const bbox = {
            x: minX,
            y: maxY,
            width: maxX - minX,
            height: maxY - minY
        };

        // 겹치는 바운딩 박스가 있는지 확인합니다.
        const overlapIndex = bboxes.findIndex(b =>
            !(bbox.x > b.x + b.width ||
                bbox.x + bbox.width < b.x ||
                bbox.y > b.y + b.height ||
                bbox.y + bbox.height < b.y)
        );

        if (overlapIndex !== -1) {
            // 겹치는 바운딩 박스가 있으면 패쓰 데이터를 합칩니다.
            paths[overlapIndex] += ' ' + individualPathData;
        } else {
            // 겹치는 바운딩 박스가 없으면 새로운 패쓰 데이터를 추가합니다.
            paths.push(individualPathData);
            bboxes.push(bbox);
        }
    }

    return paths;
}


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

function applyOutlineAnimation(svgPath, length, animationDuration, i) {
    svgPath.style.strokeDasharray = length + ' ' + length;
    svgPath.style.strokeDashoffset = length;
    svgPath.style.animation = `line-anim ${animationDuration}s ${animationDuration * 0.45 * i}s ease forwards`;
}

function applyFillAnimation(svgPathFill, length, animationDuration, i) {
    svgPathFill.setAttribute('stroke', 'none');
    svgPathFill.style.strokeDasharray = length + ' ' + length;
    svgPathFill.style.strokeDashoffset = length;
    svgPathFill.style.animation = `fill-anim ${animationDuration}s ${animationDuration * 0.45 * i}s forwards`;
}


function loadFont(url) {
    return new Promise((resolve, reject) => {
        opentype.load(url, (err, font) => {
            if (err) reject(err);
            else resolve(font);
        });
    });
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
    const commandsAndArgs = strPathData.split(/(?=[MLQZ])/);

    let index = 0;
    charPathCmdCntArr.forEach(cmdCnt => {
        // 각 문자에 대한 패쓰 데이터를 저장
        charPathDataFromStrPathData.push(commandsAndArgs.slice(index, index + cmdCnt).join(''));
        index += cmdCnt;
    });

    return charPathDataFromStrPathData;
}

export async function makeSvgElementWithTextDrawingAnimation(
    text = 'Hello, World!',
    animationDuration = 0.65,
    fontSize = 72,
    webFontUrl = 'https://fonts.gstatic.com/s/roboto/v20/KFOmCnqEu92Fr1Mu4mxP.ttf'
) {
    if (opentype === undefined) {
        throw new Error('opentype.js is not loaded.');
    }

    let font;

    try {
        font = await loadFont(webFontUrl);
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

    const charPathDataFromStrPathData = splitPathData(strPathData, charPathCmdCntArr);
    console.log(charPathDataFromStrPathData);

    const svg = createSvgElement(textWidth, textHeight, padding);
    charPathDataFromStrPathData.forEach((pathData, i) => {
        const svgPathStroke = createSvgPathElement(pathData);
        const length = svgPathStroke.getTotalLength();
        applyOutlineAnimation(svgPathStroke, length, animationDuration, i);
        svg.appendChild(svgPathStroke);

        const svgPathFill = createSvgPathElement(pathData);
        applyFillAnimation(svgPathFill, length, animationDuration, i);
        svg.appendChild(svgPathFill);
    });

    return svg;
}
