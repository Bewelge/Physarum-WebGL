/**
 * Adapted from https://github.com/nicoptere/physarum/blob/master/src/glsl/diffuse_decay_fs.glsl
 */
export const DIFFUSE_DECAY_FRAGMENT = `
uniform sampler2D points;
		uniform sampler2D input_texture;
		uniform vec2 resolution;
		uniform float decay;
		varying vec2 vUv;
		void main(){
		
			vec2 res = 1. / resolution;
			vec3 pixelPoint = texture2D(points, vUv).rgb;
			float pos = pixelPoint.r;
			float pos2 = pixelPoint.g;
			float pos3 = pixelPoint.b;
			
			
			//accumulator
			vec3 col = vec3(0.);
			 
			
			//blur box size
			const float dim = 5.;
		
			//weight
			float weight = 1. / pow( 2. * dim + 1., 2. ) ;
		
			for( float i = -dim; i <= dim; i++ ){
			
				for( float j = -dim; j <= dim; j++ ){
			
					vec3 val = texture2D( input_texture,  (gl_FragCoord.xy +vec2(i,j)) /resolution ).rgb;
					col += val*weight;
		
				}
			}
		
		
			gl_FragColor =  vec4( max(0.,min(1.,col.r * decay + pos)), max(0.,min(1.,col.g * decay + pos2)), max(0.,min(1.,col.b * decay+ pos3)),1.);
			
		
		}`
