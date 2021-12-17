import * as THREE from "../lib/three.module.js"
export class Shader {
	constructor(width, height, vertex, fragment, uniforms, attributes, options) {
		this.width = width
		this.height = height
		this.uniforms = {}
		for (let key in uniforms) {
			this.uniforms[key] = { value: uniforms[key] }
		}
		this.material = new THREE.ShaderMaterial({
			uniforms: this.uniforms,
			blending: THREE.NoBlending,
			transparent: true,
			vertexShader: vertex,
			fragmentShader: fragment
		})

		let opts = {
			minFilter: THREE.NearestFilter,
			magFilter: THREE.NearestFilter,
			format: THREE.RGBAFormat,
			type: THREE.FloatType,
			blending: THREE.NoBlending
		}
		for (let key in options) {
			opts[key] = options[key]
		}
		this.renderTarget = new THREE.WebGLRenderTarget(width, height, opts)

		let bufferGeometry = new THREE.BufferGeometry()
		for (let key in attributes) {
			bufferGeometry.setAttribute(key, attributes[key])
		}
		this.mesh = new THREE.Points(bufferGeometry, this.material)

		this.getScene().add(this.mesh)
	}
	setUniform(key, value) {
		if (!this.material.uniforms.hasOwnProperty(key)) {
			this.material.uniforms[key] = {}
		}
		this.material.uniforms[key].value = value
	}
	getTexture() {
		return this.renderTarget.texture
	}
	render(renderer, updatedUniforms) {
		this.mesh.visible = true

		for (let key in updatedUniforms) {
			this.material.uniforms[key].value = updatedUniforms[key]
		}

		renderer.setSize(this.width, this.height)
		renderer.setRenderTarget(this.renderTarget)
		renderer.render(this.getScene(), this.getCamera())
		renderer.setRenderTarget(null)
		this.mesh.visible = false
	}
	getScene() {
		if (!this.scene) {
			this.scene = new THREE.Scene()
		}
		return this.scene
	}
	getCamera() {
		if (!this.camera) {
			this.camera = new THREE.OrthographicCamera(
				-this.width / 2,
				this.width / 2,
				this.height / 2,
				-this.height / 2,
				0.1,
				100
			)
			this.camera.position.z = 1
		}
		return this.camera
	}
	dispose() {
		this.getScene().remove(this.mesh)
		this.mesh.geometry.dispose()
		this.mesh = null
		this.camera = null
		this.material.dispose()
		this.renderTarget.texture.dispose()
		this.renderTarget = null
		this.scene = null
	}
}
