import { ExtrudeGeometry } from 'three';

import type { Font } from './FontLoader';

export interface TextGeometrySettings {
	height?: number;
	depth?: number;
	bevelThickness?: number;
	bevelSize?: number;
	bevelOffset?: number;
	bevelEnabled?: boolean;
	size?: number;
	curveSegments?: number;
	bevelSegments?: number;
	font: Font;
}

export class TextGeometry extends ExtrudeGeometry {
	constructor(text: string, parameters: TextGeometrySettings) {
		const setParameters = {
			height: 50,
			depth: 50,
			bevelThickness: 10,
			bevelSize: 8,
			bevelEnabled: false,
			...parameters
		};

		const font = setParameters.font;

		if (font === undefined) {
			super(); // generate default extrude geometry
		} else {
			const shapes = font.generateShapes(text, setParameters.size);
			super(shapes, setParameters);
		}

		this.type = 'TextGeometry';
	}
}
