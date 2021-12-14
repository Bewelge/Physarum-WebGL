import RenderDimensions from "./js/RenderDimensions.js"
import { PhysarumRender, ThreeJsHandler } from "./js/physarumRender.js"

var renderDimensions = new RenderDimensions()
var threeJsHandler = new PhysarumRender(renderDimensions)
window.onload = () => {
	threeJsHandler.init()
	render()
}
var time = 0
function render() {
	threeJsHandler.render()
	window.requestAnimationFrame(render)
}
