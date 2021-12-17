export const RENDER_DOTS_FRAGMENT = `
uniform sampler2D particleTexture;
uniform bool isParticleTexture;
varying float team;
void main(){
    float d = 1.-length( .5 - gl_PointCoord.xy );
    float r = 0.;
    float g = 0.;
    float b = 1.;
    if (team == 0.) {
        r = 1.;
        g= 0.;
        b = 0.;
    } else if (team == 1. ) {
        r = 0.;
        g = 1.;
        b = 0.;
    }
    vec2 coord = gl_PointCoord;
    float sin_factor = sin(0.);
    float cos_factor = cos(0.);
    coord = vec2((coord.x - 0.5) , coord.y - 0.5) * mat2(cos_factor, sin_factor, -sin_factor, cos_factor);

    coord += 0.5;
    if (isParticleTexture){
        gl_FragColor =  vec4( r,g, b ,1.) * texture2D(particleTexture,gl_PointCoord);
    } else {
        gl_FragColor =  vec4( r,g, b ,1.) ;//* texture2D(particleTexture,gl_PointCoord);
    }
}
`
