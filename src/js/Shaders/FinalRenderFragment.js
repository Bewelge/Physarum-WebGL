export const FINAL_RENDER_FRAGMENT = `
uniform sampler2D diffuseTexture;
			uniform sampler2D pointsTexture;
			uniform float isMonochrome;
			uniform float trailOpacity;
			uniform float dotOpacity;
			uniform vec2 resolution;
			uniform vec4 dotColor;
			uniform vec4 trailColor; 
			varying vec2 vUv;
			void main(){
				vec2 uv = gl_FragCoord.xy / resolution.xy;
				vec4 trail = texture2D(diffuseTexture, vUv);
				vec4 points = texture2D(pointsTexture,vUv);

			vec4 trailPixel = isMonochrome * vec4((trail.r + trail.g + trail.b + trail.a)/4.) + (1. - isMonochrome) * trail;
			vec4 dotPixel = isMonochrome * vec4((points.r + points.g + points.b + points.a)/4.) + (1. - isMonochrome) * points; 

				gl_FragColor = trailPixel * trailOpacity + dotOpacity * dotPixel;//vec4( dotVal * dotColor.xyz    / 255.,1.);

			}
            `
