/**
 * Class to handle all the calculation of dimensions of the Notes & Keys on Screen-
 */
export default class RenderDimensions {
	constructor() {
		window.addEventListener("resize", this.resize.bind(this))
		this.resizeCallbacks = []

		this.resize()
	}
	/**
	 * Recompute all dimensions dependent on Screen Size
	 */
	resize() {
		//update because these settings can cause a resize before the _value is updated

		this.width = Math.floor(window.innerWidth)
		this.height = Math.floor(window.innerHeight)

		this.resizeCallbacks.forEach(func => func())
	}
	registerResizeCallback(callback) {
		this.resizeCallbacks.push(callback)
	}
}
