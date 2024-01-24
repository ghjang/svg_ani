function combineOverlappingPaths(matches) {
    let paths = [];
    let bboxes = [];

    for (let i = 0; i < matches.length; i++) {
        let individualPathData = matches[i];

        // 패쓰 데이터에서 점들을 추출합니다.
        let points = individualPathData.match(/(?:M|L|Q)\s*(-?\d+\.?\d*)\s*(-?\d+\.?\d*)/g).map(point => {
            let [x, y] = point.slice(1).split(' ').map(Number);
            return { x, y };
        });

        // 바운딩 박스를 계산합니다.
        let minX = Math.min(...points.map(point => point.x));
        let maxX = Math.max(...points.map(point => point.x));
        let minY = Math.min(...points.map(point => point.y));
        let maxY = Math.max(...points.map(point => point.y));

        let bbox = {
            x: minX,
            y: maxY,
            width: maxX - minX,
            height: maxY - minY
        };

        // 겹치는 바운딩 박스가 있는지 확인합니다.
        let overlapIndex = bboxes.findIndex(b =>
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
    let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', `${textWidth + padding}`);
    svg.setAttribute('height', `${textHeight + padding}`);
    svg.setAttribute('viewBox', `0 ${-(textHeight + padding)} ${textWidth} ${textHeight}`);
    return svg;
}

function createSvgPathElement(pathData) {
    let svgPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
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


export function
    makeSvgElementWithTextDrawingAnimation(
        text,
        animationDuration = 0.65,
        fontSize = 72,
        webFontUrl = 'https://fonts.gstatic.com/s/roboto/v20/KFOmCnqEu92Fr1Mu4mxP.ttf'
    ) {
    if (opentype === undefined) {
        console.error('opentype.js가 로드되지 않았습니다.');
        return;
    }

    opentype.load(webFontUrl, (err, font) => {
        if (err) {
            console.error('Font could not be loaded: ' + err);
            return;
        }

        const textHeight = fontSize * (font.ascender - font.descender) / font.unitsPerEm;
        const padding = fontSize * 0.25;
        const baseline = fontSize * 1.2;
        const textWidth = font.getAdvanceWidth(text, fontSize);
        const glyphPath = font.getPath(text, 0, baseline, fontSize);
        const pathData = glyphPath.toPathData();

        // 'M으로 시작, Z로 끝나는 패턴'을 모두 추출하고 겹치는 패스를 합친다.
        const regex = /M.*?Z/g;
        let matches = pathData.match(regex);
        let combinedPaths = combineOverlappingPaths(matches);

        let svg = createSvgElement(textWidth, textHeight, padding);
        combinedPaths.forEach((pathData, i) => {
            let svgPathStroke = createSvgPathElement(pathData);
            let length = svgPathStroke.getTotalLength();
            applyOutlineAnimation(svgPathStroke, length, animationDuration, i);
            svg.appendChild(svgPathStroke);

            let svgPathFill = createSvgPathElement(pathData);
            applyFillAnimation(svgPathFill, length, animationDuration, i);
            svg.appendChild(svgPathFill);
        });

        document.body.appendChild(svg);
    });
}
