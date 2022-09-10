import {
	ExtrudeGeometry
} from 'three';

import type { Font } from "./FontLoader"

export interface TextGeometrySettings {
  height?: number;
  depth?: number;
  bevelThickness?: number;
  bevelSize?: number;
  bevelEnabled?: boolean;
  size?: number;
  font: Font;
}

export class TextGeometry extends ExtrudeGeometry {

	constructor( text: string, parameters: TextGeometrySettings ) {

		const font = parameters.font;

		if ( font === undefined ) {

			super(); // generate default extrude geometry

		} else {

			const shapes = font.generateShapes( text, parameters.size );

			// translate parameters to ExtrudeGeometry API

			parameters.depth = parameters.height !== undefined ? parameters.height : 50;

			// defaults

			if ( parameters.bevelThickness === undefined ) parameters.bevelThickness = 10;
			if ( parameters.bevelSize === undefined ) parameters.bevelSize = 8;
			if ( parameters.bevelEnabled === undefined ) parameters.bevelEnabled = false;

			super( shapes, parameters );

		}

		this.type = 'TextGeometry';

	}

}
