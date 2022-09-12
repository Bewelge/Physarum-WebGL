export const FINAL_RENDER_FRAGMENT = `
uniform sampler2D diffuseTexture;
			uniform sampler2D pointsTexture;
			uniform float isMonochrome;
			uniform float trailOpacity;
			uniform float dotOpacity;
			uniform bool isFlatShading;
			uniform float colorThreshold;
			uniform vec2 resolution;
			uniform vec4 dotColor;
			uniform vec4 trailColor; 
			uniform vec3 col0;
			uniform vec3 col1;
			uniform vec3 col2;
			varying vec2 vUv;
			void main(){
				vec2 uv = gl_FragCoord.xy / resolution.xy;
				vec4 trail = texture2D(diffuseTexture, vUv);
				vec4 points = texture2D(pointsTexture,vUv);

			vec4 trailPixel = isMonochrome * vec4(vec3((trail.r + trail.g   + trail.b + trail.a ) / 4. ),trail.a) + (1. - isMonochrome) * trail;
			vec4 dotPixel = isMonochrome * vec4( vec3((points.r + points.g  + points.b + points.a) / 4.),points.a) + (1. - isMonochrome) * points; 
			vec4 mixedCol =  trailPixel  * trailOpacity + dotOpacity * dotPixel;
			vec3 customCol = isMonochrome * mixedCol.rgb + (1. - isMonochrome) * (mixedCol.r * col0 + mixedCol.g * col1 + mixedCol.b * col2);
			if (isFlatShading) {

				if (mixedCol.r > colorThreshold && mixedCol.r > mixedCol.b && mixedCol.r > mixedCol.g) {
					customCol =  col0;
				} else if (mixedCol.g > colorThreshold &&  mixedCol.g > mixedCol.b && mixedCol.g > mixedCol.r) {
					customCol = col1;
				} else if (mixedCol.b > colorThreshold && mixedCol.b > mixedCol.g && mixedCol.b > mixedCol.r) { 
					customCol = col2;
				}
			} 

				// if (trailPixel.rgb == vec3(0.)) {
				// 	gl_FragColor = vec4(1.);
				// } 
				// else {
					
					
				if (false) {
					
					float alpha =   (customCol.r + customCol.g  + customCol.b ) / 3.;
				gl_FragColor = 
						mix(
						isMonochrome * (vec4(1.) - vec4(customCol,1.)) +
						(1. - isMonochrome) * vec4(customCol,1.),
						vec4(1.),0.5);
				} else {
				gl_FragColor = vec4(customCol,1.);
				}
				
				

			}
            `
