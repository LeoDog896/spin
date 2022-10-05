import { ShapePath, Shape } from 'three';

interface FontData {
  glyphs: { [key: string] : {
    x_min: number;
    x_max: number;
    ha: number;
    o: string;
    _cachedOutline?: string[];
  } };
  resolution: number;
  boundingBox: {
    yMin: number;
    yMax: number;
    xMin: number;
    xMax: number;
  }
  underlineThickness: number;
  familyName: string;
}

export class Font {
	isFont: boolean;
	type: string;
	data: FontData;

	constructor(data: FontData) {
		this.isFont = true;

		this.type = 'Font';

		this.data = data;
	}

	generateShapes(text: string, size = 100): Shape[] {
		const shapes = [];
		const paths = createPaths(text, size, this.data);

		for (let p = 0; p < paths.length; p++) {
			shapes.push(...paths[p].toShapes(false));
		}

		return shapes;
	}
}

function createPaths(text: string, size: number, data: FontData) {
	const chars = [...text];
	const scale = size / data.resolution;
	const line_height =
		(data.boundingBox.yMax - data.boundingBox.yMin) * scale;

	const paths = [];

	let offsetX = 0,
		offsetY = 0;

	for (let i = 0; i < chars.length; i++) {
		const char = chars[i];

		if (char === '\n') {
			offsetX = 0;
			offsetY -= line_height;
		} else {
			const ret = createPath(char, scale, offsetX, offsetY, data);
			offsetX += ret.offsetX;
			paths.push(ret.path);
		}
	}

	return paths;
}

function createPath(char: string, scale: number, offsetX: number, offsetY: number, data: FontData) {
	const glyph = data.glyphs[char] || data.glyphs['?'];

	if (!glyph) {
		throw Error(
			'THREE.Font: character "' + char + '" does not exists in font family ' + data.familyName + '.'
		);
	}

	const path = new ShapePath();

	if (glyph.o) {
		const outline = glyph._cachedOutline || (glyph._cachedOutline = glyph.o.split(' '));

		for (let i = 0, l = outline.length; i < l; ) {
			const action = outline[i++];

			switch (action) {
				case 'm': {
					// moveTo

					const x = +outline[i++] * scale + offsetX;
					const y = +outline[i++] * scale + offsetY;

					path.moveTo(x, y);

					break;
				}
				case 'l': {
					// lineTo

					const x = +outline[i++] * scale + offsetX;
					const y = +outline[i++] * scale + offsetY;

					path.lineTo(x, y);

					break;
				}
				case 'q': {
					// quadraticCurveTo

					const cpx = +outline[i++] * scale + offsetX;
					const cpy = +outline[i++] * scale + offsetY;
					const cpx1 = +outline[i++] * scale + offsetX;
					const cpy1 = +outline[i++] * scale + offsetY;

					path.quadraticCurveTo(cpx1, cpy1, cpx, cpy);

					break;
				}
				case 'b': {
					// bezierCurveTo

					const cpx = +outline[i++] * scale + offsetX;
					const cpy = +outline[i++] * scale + offsetY;
					const cpx1 = +outline[i++] * scale + offsetX;
					const cpy1 = +outline[i++] * scale + offsetY;
					const cpx2 = +outline[i++] * scale + offsetX;
					const cpy2 = +outline[i++] * scale + offsetY;

					path.bezierCurveTo(cpx1, cpy1, cpx2, cpy2, cpx, cpy);

					break;
				}
			}
		}
	}

	return { offsetX: glyph.ha * scale, path: path };
}
