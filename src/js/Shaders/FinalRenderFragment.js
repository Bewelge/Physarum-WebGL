export const FINAL_RENDER_FRAGMENT = `
uniform sampler2D diffuseTexture;
			uniform sampler2D pointsTexture;
			uniform float isMonochrome;
			uniform float trailOpacity;
			uniform float dotOpacity;
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

			vec4 trailPixel = isMonochrome * vec4((trail.r + trail.g + trail.b + trail.a)/4.) + (1. - isMonochrome) * trail;
			vec4 dotPixel = isMonochrome * vec4((points.r + points.g + points.b + points.a)/4.) + (1. - isMonochrome) * points; 
			vec4 mixedCol = trailPixel * trailOpacity + dotOpacity * dotPixel;
			vec3 customCol = (mixedCol.r * col0 + mixedCol.g * col1 + mixedCol.b * col2);

				gl_FragColor = vec4(customCol,mixedCol.a);
				// trailPixel * trailOpacity + dotOpacity * dotPixel;//vec4( dotVal * dotColor.xyz    / 255.,1.);

			}
            `
