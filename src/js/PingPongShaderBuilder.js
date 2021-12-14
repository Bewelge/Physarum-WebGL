import { PingPongShader } from "../../src/js/PingPongShader.js"

export class PingPongShaderBuilder {
	constructor() {}
	withVertex(vertexString) {
		this.vertexString = vertexString
		return this
	}
	withFragment(fragmentString) {
		this.fragmentString = fragmentString
		return this
	}
	withDimensions(width, height) {
		this.width = width
		this.height = height
		return this
	}
	withTextureData(data) {
		this.data = data
		return this
	}
	withUniform(key, val) {
		if (!this.uniforms) {
			this.uniforms = {}
		}
		this.uniforms[key] = val
		return this
	}
	withUniforms(obj) {
		if (!this.uniforms) {
			this.uniforms = {}
		}
		Object.entries(obj).forEach(entry => {
			this.uniforms[entry[0]] = entry[1]
		})
		return this
	}

	withAttribute(key, val) {
		if (!this.attributes) {
			this.attributes = {}
		}
		this.attributes[key] = val
		return this
	}
	withAttributes(obj) {
		if (!this.attributes) {
			this.attributes = {}
		}
		Object.entries(obj).forEach(entry => {
			this.attributes[entry[0]] = entry[1]
		})
		return this
	}

	create() {
		return new PingPongShader(
			this.width,
			this.height,
			this.vertexString,
			this.fragmentString,
			this.uniforms,
			this.data,
			this.attributes
		)
	}
}
