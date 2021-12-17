export const PASS_THROUGH_VERTEX = `
varying vec2 vUv; 
void main(){
    vUv = uv; 
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.);
}
 `
