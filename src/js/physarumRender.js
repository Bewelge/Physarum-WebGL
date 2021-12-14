import { rndFloat, rndInt } from "./Util.js"
import * as THREE from "../lib/three.module.js"
import GUI from "../lib/lil-gui.esm.js"
import { ShaderBuilder } from "./ShaderBuilder.js"
import { PingPongShaderBuilder } from "./PingPongShaderBuilder.js"
import {
	orthographicCamer as orthographicCamera,
	Vector
} from "./ThreeJsUtils.js"

const WIDTH = 1024
var paused = false

export class PhysarumRender {
	constructor(renderDimensions) {
		this.dims = renderDimensions
	}
	init() {
		this.width = window.innerWidth
		this.height = window.innerHeight
		this.textureLoader = new THREE.TextureLoader()

		this.initScene()

		this.initMouse()

		this.initSettings()

		this.initShaders()

		this.initGUI()

		document.body.appendChild(this.renderer.domElement)
	}
	initScene() {
		this.scene = new THREE.Scene()

		this.camera = orthographicCamera(this.width, this.height)
		this.camera.position.z = 1

		this.renderer = new THREE.WebGLRenderer({
			alpha: true,
			blending: THREE.NoBlending
		})

		this.renderer.setSize(this.width, this.height)
	}

	initMouse() {
		this.mousePos = { x: 10, y: 10 }
		let mouseDown = false
		var counter = 0
		window.addEventListener("mousemove", ev => {
			this.mousePos = {
				x: ev.clientX - this.width * 0.5,
				y: this.height * 0.5 - ev.clientY
			}

			if (mouseDown) {
				let radius = 100
				let amnt = 50
				let texture = this.updateDotsShader.nextRenderTarget.texture
				let textureData = texture.image.data
				for (let i = counter; i < counter + amnt; i++) {
					let rndAng = rndFloat(0, Math.PI * 2)
					let rndDis = rndFloat(0, radius)
					let x = this.mousePos.x
					let y = this.mousePos.y
					textureData[i * 4] = x + rndDis * Math.cos(rndAng)
					textureData[i * 4 + 1] = y + rndDis * Math.sin(rndAng)
					textureData[i * 4 + 2] = rndAng
					textureData[i * 4 + 3] = 2
				}
				counter += amnt
				this.renderer.copyTextureToTexture(
					new THREE.Vector2(0, 0),
					texture,
					texture
				)
			}
		})
		window.addEventListener("mousedown", ev => (mouseDown = true))
		window.addEventListener("mouseup", ev => (mouseDown = false))
	}

	initSettings() {
		let moveSpeed0 = rndFloat(1, 4)
		let moveSpeed1 = rndFloat(1, 4)
		let moveSpeed2 = rndFloat(1, 4)
		let rotationAngle0 = rndFloat(0.1, 1)
		let rotationAngle1 = rndFloat(0.1, 1)
		let rotationAngle2 = rndFloat(0.1, 1)
		this.settings = {
			decay: rndFloat(0.9, 0.99),
			particleTexture: "None",
			isParticleTexture: false,
			isDisplacement: false,
			isMonochrome: false,
			dotOpacity: 1,
			trailOpacity: 1,
			mouseRad: 0,
			moveSpeed: [moveSpeed0, moveSpeed1, moveSpeed2],
			sensorDistance: [
				rndFloat(1.5, 6) * moveSpeed0,
				rndFloat(1.5, 6) * moveSpeed1,
				rndFloat(1.5, 6) * moveSpeed2
			],
			rotationAngle: [rotationAngle0, rotationAngle1, rotationAngle2],
			sensorAngle: [
				Math.min(1, rndFloat(1, 1.5) * rotationAngle0),
				Math.min(1, rndFloat(1, 1.5) * rotationAngle1),
				Math.min(1, rndFloat(1, 1.5) * rotationAngle2)
			],
			infectious: [rndInt(0, 1), rndInt(0, 1), rndInt(0, 1)],
			dotSizes: [rndFloat(1, 1), rndFloat(1, 1), rndFloat(1, 1)],
			attract0: [rndFloat(0.1, 1), rndFloat(-1, 1), rndFloat(-1, 1)],
			attract1: [rndFloat(-1, 1), rndFloat(0.1, 1), rndFloat(-1, 1)],
			attract2: [rndFloat(-1, 1), rndFloat(-1, 1), rndFloat(0.1, 1)]
		}
	}

	initShaders() {
		let dotAmount = WIDTH * WIDTH
		let pos = new Float32Array(dotAmount * 3)
		let uvs = new Float32Array(dotAmount * 2)
		let positionsAndDirections = new Float32Array(dotAmount * 4)
		let teamAmount = rndInt(1, 3)
		for (let i = 0; i < dotAmount; i++) {
			pos[i * 3] = pos[i * 3 + 1] = pos[i * 3 + 2] = 0

			uvs[i * 2] = (i % WIDTH) / WIDTH
			uvs[i * 2 + 1] = ~~(i / WIDTH) / WIDTH

			let id = i * 4
			let rnd = i / dotAmount
			let x = 0
			let y = 0
			let startInd = 0
			if (rnd < 1 / 3) {
				x = (1 / 5) * this.width
				y = (2.5 / 5) * this.height
			} else if (rnd < 2 / 3) {
				x = (2.5 / 5) * this.width
				y = (2.5 / 5) * this.height
				startInd = Math.floor((dotAmount * 1) / 3)
			} else {
				x = (4 / 5) * this.width
				y = (2.5 / 5) * this.height
				startInd = Math.floor((dotAmount * 2) / 3)
			}
			y -= this.height * 0.5
			x -= this.width * 0.5

			let rndAng = rndFloat(0, Math.PI * 2)
			let radius = rndInt(0, 150)
			let rndDis = rndFloat(0, radius)
			//x
			positionsAndDirections[id++] = x + rndDis * Math.cos(rndAng)
			//y
			positionsAndDirections[id++] = y + rndDis * Math.sin(rndAng)
			//direction
			positionsAndDirections[id++] = rndAng // ((rnd % (1 / 3)) / (1 / 3)) * Math.PI * 2 // rndFloat(0, Math.PI * 2)
			//team (0-> red, 1-> green, 2-> blue)
			positionsAndDirections[id] =
				(rnd < 2 / 3 ? (rnd < 1 / 3 ? 0 : 1) : 2) % teamAmount
		}

		this.diffuseShader = new PingPongShaderBuilder()
			.withDimensions(this.width, this.height)
			.withVertex(document.getElementById("passThroughVertex").textContent)
			.withFragment(document.getElementById("diffuseDecayFragment").textContent)
			.withUniform("points", null)
			.withUniform("decay", this.settings.decay)
			.withUniform("resolution", new THREE.Vector2(this.width, this.height))
			.create()

		this.updateDotsShader = new PingPongShaderBuilder()
			.withDimensions(WIDTH, WIDTH)
			.withVertex(document.getElementById("passThroughVertex").textContent)
			.withFragment(
				document.getElementById("fragmentShaderPosition").textContent
			)
			.withTextureData(positionsAndDirections)
			.withUniform("diffuseTexture", null)
			.withUniform("pointsTexture", null)
			.withUniform("resolution", Vector([this.width, this.height]))
			.withUniform("textureDimensions", Vector([WIDTH, WIDTH]))
			.withUniform("mouseRad", this.settings.mouseRad)
			.withUniform("mousePos", Vector([this.mousePos.x, this.mousePos.y]))
			.withUniform("isDisplacement", this.settings.isDisplacement)
			.withUniform("sensorAngle", Vector(this.settings.sensorAngle))
			.withUniform("rotationAngle", Vector(this.settings.rotationAngle))
			.withUniform("sensorDistance", Vector(this.settings.sensorDistance))
			.withUniform("attract0", Vector(this.settings.attract0))
			.withUniform("attract1", Vector(this.settings.attract1))
			.withUniform("attract2", Vector(this.settings.attract2))
			.withUniform("moveSpeed", Vector(this.settings.moveSpeed))
			.withUniform("infectious", Vector(this.settings.infectious))
			.create()

		this.renderDotsShader = new ShaderBuilder()
			.withDimensions(this.width, this.height)
			.withVertex(document.getElementById("renderDotsVertex").textContent)
			.withFragment(document.getElementById("renderDotsFragment").textContent)
			.withUniform("isParticleTexture", this.settings.isParticleTexture)
			.withUniform("particleTexture", null)
			.withUniform("positionTexture", null)
			.withUniform("dotSizes", Vector(this.settings.dotSizes))
			.withAttribute("position", new THREE.BufferAttribute(pos, 3, false))
			.withAttribute("uv", new THREE.BufferAttribute(uvs, 2, false))
			.create()
		if (this.settings.particleTexture != "None") {
			this.textureLoader.load(
				"../src/images/particles/" + this.settings.particleTexture + ".png",
				tex => {
					console.log("loaded" + this.settings.particleTexture)
					this.renderDotsShader.setUniform("particleTexture", tex)
				}
			)
		}

		this.finalMat = new THREE.ShaderMaterial({
			uniforms: {
				diffuseTexture: {
					value: null
				},
				pointsTexture: {
					value: null
				},
				dotOpacity: { value: this.settings.dotOpacity },
				trailOpacity: { value: this.settings.trailOpacity },
				isMonochrome: { value: this.settings.isMonochrome }
			},
			transparent: true,
			blending: THREE.AdditiveBlending,
			vertexShader: document.getElementById("passThroughVertex").textContent,
			fragmentShader: document.getElementById("finalRenderFragment").textContent
		})

		this.finalMesh = new THREE.Mesh(
			new THREE.PlaneBufferGeometry(),
			this.finalMat
		)
		this.finalMesh.position.set(0, 0, 0.5)
		this.finalMesh.scale.set(this.width, this.height, 1)

		// let pg = new THREE.BufferGeometry()
		// pg.addAttribute("position", new THREE.BufferAttribute(pos, 3, false))
		// pg.addAttribute("uv", new THREE.BufferAttribute(uvs, 2, true))
		// this.mesh = new THREE.Points(pg, this.renderDotsMat)
		// this.mesh.scale.set(1, 1, 1)
		this.scene.add(this.finalMesh)

		this.renderDotsShader.setUniform(
			"resolution",
			new THREE.Vector2(this.width, this.height)
		)
		// let materials = [this.updatePosMat]
		// materials.forEach(material => {
		// 	material.uniforms.resolution = {
		// 		value: new THREE.Vector2(this.width, this.height)
		// 	}
		// })

		// this.cnvs = []
		// for (let i = 0; i < 5; i++) {
		// 	this.cnvs.push(createCanvas(this.dims.width, this.dims.height))
		// 	document.body.appendChild(this.cnvs[this.cnvs.length - 1])
		// }
	}
	initGUI() {
		let gui = new GUI()
		this.gui = gui

		gui
			.add(this.diffuseShader.getUniforms().decay, "value", 0.01, 0.99, 0.01)
			.name("decay")
		gui
			.add(
				this.updateDotsShader.material.uniforms.mouseRad,
				"value",
				0,
				250,
				0.1
			)
			.name("mouseRad")

		gui
			.add(this.updateDotsShader.material.uniforms.isDisplacement, "value")
			.name("disallow_displacement")

		let renderingFolder = gui.addFolder("Rendering")
		renderingFolder
			.add(this.finalMat.uniforms.isMonochrome, "value", 0, 1, 1)
			.name("Monochrome")
		renderingFolder
			.add(this.finalMat.uniforms.dotOpacity, "value", 0, 1, 0.01)
			.name("Dots opacity")
		renderingFolder
			.add(this.finalMat.uniforms.trailOpacity, "value", 0, 1, 0.01)
			.name("Trails opacity")

		let teamNames = ["Red Slime", "Green Slime", "Blue Slime"]
		this.guiGroups = []
		for (let i = 0; i < 3; i++) {
			let group = gui.addFolder(teamNames[i])
			this.guiGroups.push(group)
			group
				.add(this.settings.sensorAngle, i, 0.01, 2, 0.01)
				.name("Sensor Angle")
				.onChange(() =>
					this.updateDotsShader.setUniform(
						"sensorAngle",
						Vector(this.settings.sensorAngle)
					)
				)

			group
				.add(this.settings.rotationAngle, i, 0.01, 2, 0.01)
				.name("Rotation Angle")
				.onChange(() =>
					this.updateDotsShader.setUniform(
						"rotationAngle",
						Vector(this.settings.rotationAngle)
					)
				)

			group
				.add(this.settings.sensorDistance, i, 0.1, 50, 0.1)
				.name("Sensor Distance")
				.onChange(() =>
					this.updateDotsShader.setUniform(
						"sensorDistance",
						Vector(this.settings.sensorDistance)
					)
				)

			group
				.add(this.settings.moveSpeed, i, 0.1, 20, 0.1)
				.name("Move Distance")
				.onChange(() =>
					this.updateDotsShader.setUniform(
						"moveSpeed",
						Vector(this.settings.moveSpeed)
					)
				)

			group
				.add(this.settings.dotSizes, i, 1, 5, 1)
				.name("Dot Size")
				.onChange(() =>
					this.renderDotsShader.setUniform(
						"dotSizes",
						Vector(this.settings.dotSizes)
					)
				)

			group
				.add(this.settings.infectious, i, 0, 1, 1)
				.name("Infectious to  " + teamNames[(i + 1) % 3])
				.onChange(() =>
					this.updateDotsShader.setUniform(
						"infectious",
						Vector(this.settings.infectious)
					)
				)
			for (let j = 0; j < 3; j++) {
				group
					.add(this.settings["attract" + i], j, -1, 1, 0.05)
					.name("Attraction to " + teamNames[j])
					.onChange(() =>
						this.updateDotsShader.setUniform(
							"attract" + i,
							Vector(this.settings["attract" + i])
						)
					)
			}

			group
				.add(
					{ randomizeSettings: this.randomizeSettings.bind(this, i) },
					"randomizeSettings"
				)
				.name("Randomize " + teamNames[i] + " Settings")

			// group.controllers.forEach(contr => contr.listen())
		}
		gui
			.add(
				{ randomizeSettings: this.randomizeSettings.bind(this, -1) },
				"randomizeSettings"
			)
			.name("Randomize All Settings")
		gui
			.add(
				this.settings,
				"particleTexture",
				"None,circle_01,circle_02,circle_03,circle_04,circle_05,dirt_01,dirt_02,dirt_03,fire_01,fire_02,flame_01,flame_02,flame_03,flame_04,flame_05,flame_06,flare_01,light_01,light_02,light_03,magic_01,magic_02,magic_03,magic_04,magic_05,muzzle_01,muzzle_02,muzzle_03,muzzle_04,muzzle_05,scorch_01,scorch_02,scorch_03,scratch_01,slash_01,slash_02,slash_03,slash_04,smoke_01,smoke_02,smoke_03,smoke_04,smoke_05,smoke_06,smoke_07,smoke_08,smoke_09,smoke_10,spark_01,spark_02,spark_03,spark_04,spark_05,spark_06,spark_07,star_01,star_02,star_03,star_04,star_05,star_06,star_07,star_08,star_09,symbol_01,symbol_02,trace_01,trace_02,trace_03,trace_04,trace_05,trace_06,trace_07,twirl_01,twirl_02,twirl_03,window_01,window_02,window_03,window_04".split(
					","
				)
			)
			.name("Dot Texture")
			.onChange(() => {
				this.renderDotsShader.setUniform(
					"isParticleTexture",
					this.settings.particleTexture != "None"
				)
				if (this.settings.particleTexture != "None") {
					this.textureLoader.load(
						"../src/images/particles/" + this.settings.particleTexture + ".png",
						tex => this.renderDotsShader.setUniform("particleTexture", tex)
					)
				}
			})
	}
	randomizeSettings(teamIndex) {
		if (teamIndex == -1) {
			this.randomizeSettings(0)
			this.randomizeSettings(1)
			this.randomizeSettings(2)
			return
		}
		this.settings.moveSpeed[teamIndex] = rndFloat(1, 5)
		this.settings.sensorDistance[teamIndex] = Math.min(
			50,
			rndFloat(1.5, 6) * this.settings.moveSpeed[teamIndex]
		)
		this.settings.rotationAngle[teamIndex] = rndFloat(0.3, 1)
		this.settings.sensorAngle[teamIndex] = Math.min(
			1,
			rndFloat(1, 1.5) * this.settings.rotationAngle[teamIndex]
		)
		this.settings.infectious[teamIndex] = rndInt(0, 1)
		this.settings.dotSizes[teamIndex] = rndFloat(1, 1)

		for (let i = 0; i < 3; i++) {
			this.settings["attract" + teamIndex][i] = rndFloat(
				i == teamIndex ? 0 : -1,
				1
			)
		}

		this.guiGroups[teamIndex].controllers.forEach(contr => {
			contr._onChange ? contr._onChange() : null
			contr.updateDisplay()
		})
	}
	getCurrentPositionCanvas() {
		this.diffuseShader.setUniform("points", this.renderDotsShader.getTexture())
		this.diffuseShader.render(this.renderer)

		this.updateDotsShader.setUniform(
			"mousePos",
			new THREE.Vector2(this.mousePos.x, this.mousePos.y)
		)
		this.updateDotsShader.setUniform(
			"pointsTexture",
			this.renderDotsShader.getTexture()
		)
		this.updateDotsShader.setUniform(
			"diffuseTexture",
			this.diffuseShader.getTexture()
		)

		this.updateDotsShader.render(this.renderer)

		let cnv = document.createElement("canvas")
		cnv.width = WIDTH
		cnv.height = WIDTH
		let c = cnv.getContext("2d")
		c.drawImage(this.renderer.domElement)
	}
	render() {
		this.diffuseShader.setUniform("points", this.renderDotsShader.getTexture())
		this.diffuseShader.render(this.renderer)

		this.updateDotsShader.setUniform(
			"mousePos",
			new THREE.Vector2(this.mousePos.x, this.mousePos.y)
		)
		this.updateDotsShader.setUniform(
			"pointsTexture",
			this.renderDotsShader.getTexture()
		)
		this.updateDotsShader.setUniform(
			"diffuseTexture",
			this.diffuseShader.getTexture()
		)

		this.updateDotsShader.render(this.renderer)

		this.renderDotsShader.setUniform(
			"positionTexture",
			this.updateDotsShader.getTexture()
		)
		this.renderDotsShader.render(this.renderer)

		this.finalMesh.material.uniforms.pointsTexture.value =
			this.renderDotsShader.getTexture()
		this.finalMesh.material.uniforms.diffuseTexture.value =
			this.diffuseShader.getTexture()

		this.renderer.setSize(this.width, this.height)
		this.renderer.clear()
		this.renderer.render(this.scene, this.camera)
	}
}

function createCanvas(w, h) {
	let cnv = document.createElement("canvas")
	cnv.width = w
	cnv.height = h
	return cnv
}
