import RenderDimensions from "./RenderDimensions.js"
import { PhysarumRender } from "./physarumRender.js"
import { Stats } from "../lib/stats.module.js"

var renderDimensions = new RenderDimensions()
var threeJsHandler = new PhysarumRender(renderDimensions)
var stats = Stats()
window.onload = () => {
	stats.showPanel(0)
	document.body.appendChild(stats.dom)
	threeJsHandler.init()
	console.log(stats)
	render()
}
function render() {
	stats.begin()
	threeJsHandler.render()
	stats.end()
	window.requestAnimationFrame(render)
}
