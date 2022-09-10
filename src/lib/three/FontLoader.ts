import {
	ShapePath
} from 'three';

export class Font {

  isFont: boolean;
  type: string;
  data: any;

	constructor( data: any ) {

		this.isFont = true;

		this.type = 'Font';

		this.data = data;

	}

	generateShapes( text: string, size = 100 ) {

		const shapes = [];
		const paths = createPaths( text, size, this.data );

		for ( let p = 0, pl = paths.length; p < pl; p ++ ) {

			shapes.push( ...paths[ p ].toShapes(false) );

		}

		return shapes;

	}

}

function createPaths( text: string, size: number, data: any ) {

	const chars = Array.from( text );
	const scale = size / data.resolution;
	const line_height = ( data.boundingBox.yMax - data.boundingBox.yMin + data.underlineThickness ) * scale;

	const paths = [];

	let offsetX = 0, offsetY = 0;

	for ( let i = 0; i < chars.length; i ++ ) {

		const char = chars[ i ];

		if ( char === '\n' ) {

			offsetX = 0;
			offsetY -= line_height;

		} else {

			const ret = createPath( char, scale, offsetX, offsetY, data );
			offsetX += ret.offsetX;
			paths.push( ret.path );

		}

	}

	return paths;

}

function createPath( char: string, scale: number, offsetX: number, offsetY: number, data: any ) {

	const glyph = data.glyphs[ char ] || data.glyphs[ '?' ];

	if ( ! glyph ) {

		throw Error( 'THREE.Font: character "' + char + '" does not exists in font family ' + data.familyName + '.' );

	}

	const path = new ShapePath();

	if ( glyph.o ) {

		const outline = glyph._cachedOutline || ( glyph._cachedOutline = glyph.o.split( ' ' ) );

		for ( let i = 0, l = outline.length; i < l; ) {

			const action = outline[ i ++ ];

			switch ( action ) {

				case 'm': { // moveTo

					const x = outline[ i ++ ] * scale + offsetX;
					const y = outline[ i ++ ] * scale + offsetY;

					path.moveTo( x, y );

					break;

				} case 'l': { // lineTo

					const x = outline[ i ++ ] * scale + offsetX;
					const y = outline[ i ++ ] * scale + offsetY;

					path.lineTo( x, y );

					break;

				} case 'q': { // quadraticCurveTo

					const cpx = outline[ i ++ ] * scale + offsetX;
					const cpy = outline[ i ++ ] * scale + offsetY;
					const cpx1 = outline[ i ++ ] * scale + offsetX;
					const cpy1 = outline[ i ++ ] * scale + offsetY;

					path.quadraticCurveTo( cpx1, cpy1, cpx, cpy );

					break;
				}
				case 'b': { // bezierCurveTo

					const cpx = outline[ i ++ ] * scale + offsetX;
					const cpy = outline[ i ++ ] * scale + offsetY;
					const cpx1 = outline[ i ++ ] * scale + offsetX;
					const cpy1 = outline[ i ++ ] * scale + offsetY;
					const cpx2 = outline[ i ++ ] * scale + offsetX;
					const cpy2 = outline[ i ++ ] * scale + offsetY;

					path.bezierCurveTo( cpx1, cpy1, cpx2, cpy2, cpx, cpy );

					break;
				}

			}

		}

	}

	return { offsetX: glyph.ha * scale, path: path };

}
