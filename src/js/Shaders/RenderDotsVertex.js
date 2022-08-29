export const RENDER_DOTS_VERTEX = `
uniform sampler2D positionTexture;
uniform vec3 dotSizes;
varying float team;
void main(){ 
    vec4 posText = texture2D(positionTexture,uv ) ;
    gl_Position=  projectionMatrix * modelViewMatrix * vec4(posText.xy,0.,1.);
    team = posText.a;
    gl_PointSize = dotSizes[int(team)];
}
`
