import * as THREE from "../lib/three.module.js"
export class PingPongShader {
	constructor(
		width,
		height,
		vertex,
		fragment,
		uniforms,
		data = null,
		attributes,
		options
	) {
		this.width = width
		this.height = height

		let opts = {
			minFilter: THREE.NearestFilter,
			magFilter: THREE.NearestFilter,
			format: THREE.RGBAFormat,
			type: THREE.FloatType,
			alpha: true,
			blending: THREE.NoBlending,
			depthText: false
		}
		for (let key in options) {
			opts[key] = options[key]
		}

		if (data == null) {
			data = new Float32Array(width * height * 4)
		}

		let texture = new THREE.DataTexture(
			data,
			width,
			height,
			THREE.RGBAFormat,
			THREE.FloatType
		)
		texture.needsUpdate = true

		this.renderTarget0 = new THREE.WebGLRenderTarget(width, height, opts)
		this.renderTarget1 = new THREE.WebGLRenderTarget(width, height, opts)

		this.renderTarget0.texture = texture.clone()
		this.renderTarget1.texture = texture

		this.currentRenderTarget = this.renderTarget0
		this.nextRenderTarget = this.renderTarget1

		this.uniforms = {
			input_texture: { value: this.getTexture() }
		}
		for (let key in uniforms) {
			this.uniforms[key] = { value: uniforms[key] }
		}
		this.material = new THREE.ShaderMaterial({
			uniforms: this.uniforms,
			blending: THREE.NoBlending,
			vertexShader: vertex,
			fragmentShader: fragment
		})
		this.material.transparent = true

		// let bufferGeometry = new THREE.BufferGeometry()
		// for (let key in attributes) {
		// 	bufferGeometry.addAttribute(key, attributes[key])
		// }
		this.mesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(), this.material)
		this.mesh.scale.set(width, height, 1)

		this.getScene().add(this.mesh)
		console.log(this)
	}
	setUniform(key, value) {
		if (!this.material.uniforms.hasOwnProperty(key)) {
			console.log("Adding " + key)
			this.material.uniforms[key] = {}
		}
		this.material.uniforms[key].value = value
	}
	getUniforms() {
		return this.material.uniforms
	}
	getTexture() {
		return this.currentRenderTarget.texture
	}
	switchRenderTargets() {
		this.currentRenderTarget =
			this.currentRenderTarget == this.renderTarget0
				? this.renderTarget1
				: this.renderTarget0
		this.nextRenderTarget =
			this.currentRenderTarget == this.renderTarget0
				? this.renderTarget1
				: this.renderTarget0
	}
	render(renderer, updatedUniforms) {
		this.switchRenderTargets()

		this.mesh.visible = true
		this.material.uniforms.input_texture.value = this.getTexture()

		for (let key in updatedUniforms) {
			this.material.uniforms[key].value = updatedUniforms[key]
		}

		renderer.setSize(this.width, this.height)
		renderer.setRenderTarget(this.nextRenderTarget)
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
}
