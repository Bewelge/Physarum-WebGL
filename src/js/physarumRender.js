import { rndFloat, rndInt } from "./Util.js"
import * as THREE from "../lib/three.module.js"
import GUI from "../lib/lil-gui.esm.js"
import { ShaderBuilder } from "./ShaderBuilder.js"
import { PingPongShaderBuilder } from "./PingPongShaderBuilder.js"
import { orthographicCamera, Vector } from "./ThreeJsUtils.js"
import { MouseSpawnTexture } from "./MouseSpawnTexture.js"
import { InfoDialog } from "./InfoDialog.js"
import { INFO_TEXT } from "./InfoText.js"
import { UPDATE_DOTS_FRAGMENT } from "./Shaders/UpdateDotsFragment.js"
import { PASS_THROUGH_VERTEX } from "./Shaders/PassThroughVertex.js"
import { RENDER_DOTS_VERTEX } from "./Shaders/RenderDotsVertex.js"
import { RENDER_DOTS_FRAGMENT } from "./Shaders/RenderDotsFragment.js"
import { DIFFUSE_DECAY_FRAGMENT } from "./Shaders/DiffuseDecayFragment.js"
import { FINAL_RENDER_FRAGMENT } from "./Shaders/FinalRenderFragment.js"

var WIDTH = 128

var mouseDown = false
var forShow = false
export class PhysarumRender {
	constructor(renderDimensions) {
		this.dims = renderDimensions
	}
	init() {
		this.width = forShow ? 800 : window.innerWidth
		this.height = forShow ? 800 : window.innerHeight
		this.textureLoader = new THREE.TextureLoader()

		this.initScene()

		this.initMouse()

		this.initSettings()

		this.initShaders()

		if (!forShow) {
			this.initGUI()
		}

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
		this.mousePos = { x: 0, y: 0 }

		this.mouseSpawnTexture = new MouseSpawnTexture(WIDTH, WIDTH)
		if (!forShow) {
			this.renderer.domElement.addEventListener("mousemove", ev => {
				ev.preventDefault()
				this.mousePos = {
					x: ev.clientX - this.width * 0.5,
					y: this.height * 0.5 - ev.clientY
				}
			})
			this.renderer.domElement.addEventListener("touchmove", ev => {
				ev.preventDefault()
				if (ev.touches) {
					this.mousePos = {
						x: ev.touches[0].clientX - this.width * 0.5,
						y: this.height * 0.5 - ev.touches[0].clientY
					}
				}
			})
			this.renderer.domElement.addEventListener(
				"mousedown",
				ev => (mouseDown = true)
			)
			this.renderer.domElement.addEventListener("touchstart", ev => {
				ev.preventDefault()
				mouseDown = true
			})
			document.addEventListener("mouseup touchend", ev => (mouseDown = false))
		}
	}

	initSettings() {
		let moveSpeed0 = rndFloat(1, 5)
		let moveSpeed1 = rndFloat(1, 5)
		let moveSpeed2 = rndFloat(1, 5)
		let rotationAngle0 = rndFloat(0.1, 0.3)
		let rotationAngle1 = rndFloat(0.1, 0.3)
		let rotationAngle2 = rndFloat(0.1, 0.3)
		this.settings = {
			mouseRad: 100,
			mousePlaceAmount: 200,
			mousePlaceRadius: 50,
			mousePlaceColor: 0,

			isMonochrome: rndFloat(0, 1) < 0.1 ? true : false,
			dotOpacity: 0,
			trailOpacity: 1,

			isParticleTexture: false,
			particleTexture: "None",
			decay: rndFloat(0.9, 0.99),
			isDisplacement: false,

			moveSpeed: [moveSpeed0, moveSpeed1, moveSpeed2],
			sensorDistance: [
				6 + rndFloat(1.5, 3) * moveSpeed0,
				6 + rndFloat(1.5, 3) * moveSpeed1,
				6 + rndFloat(1.5, 3) * moveSpeed2
			],
			rotationAngle: [rotationAngle0, rotationAngle1, rotationAngle2],
			sensorAngle: [
				Math.max(0.2, rndFloat(1, 1.5) * rotationAngle0),
				Math.max(0.2, rndFloat(1, 1.5) * rotationAngle1),
				Math.max(0.2, rndFloat(1, 1.5) * rotationAngle2)
			],
			infectious: [rndInt(0, 1), rndInt(0, 1), rndInt(0, 1)],
			dotSizes: [1, 1, 1], //rndFloat(1, 2), rndFloat(1, 2), rndFloat(1, 2)],
			attract0: [rndFloat(0.1, 1), rndFloat(-1, 0), rndFloat(-1, 0)],
			attract1: [rndFloat(-1, 0), rndFloat(0.1, 1), rndFloat(-1, 0)],
			attract2: [rndFloat(-1, 0), rndFloat(-1, 0), rndFloat(0.1, 1)]
		}
	}
	initShaders() {
		let dotAmount = WIDTH * WIDTH

		let arrays = this.getDataArrays(dotAmount)

		this.diffuseShader = new PingPongShaderBuilder()
			.withDimensions(this.width, this.height)
			.withVertex(PASS_THROUGH_VERTEX)
			.withFragment(DIFFUSE_DECAY_FRAGMENT)
			.withUniform("points", null)
			.withUniform("decay", this.settings.decay)
			.withUniform("resolution", new THREE.Vector2(this.width, this.height))
			.create()

		this.getUpdateDotsShader(arrays.positionsAndDirections)
		this.getRenderDotsShader(arrays.pos, arrays.uvs)

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
			vertexShader: PASS_THROUGH_VERTEX,
			fragmentShader: FINAL_RENDER_FRAGMENT
		})

		this.finalMesh = new THREE.Mesh(
			new THREE.PlaneBufferGeometry(),
			this.finalMat
		)
		this.finalMesh.position.set(0, 0, 0)
		this.finalMesh.scale.set(this.width, this.height, 1)

		this.scene.add(this.finalMesh)
	}
	getDataArrays(dotAmount) {
		let pos = new Float32Array(dotAmount * 3)
		let uvs = new Float32Array(dotAmount * 2)
		let positionsAndDirections = new Float32Array(dotAmount * 4)
		let teamAmount = rndInt(3, 3)
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
				x = (2.5 / 5) * this.width
				y = (2 / 5) * this.height
			} else if (rnd < 2 / 3) {
				x = (2 / 5) * this.width
				y = (3 / 5) * this.height
				startInd = Math.floor((dotAmount * 1) / 3)
			} else {
				x = (3 / 5) * this.width
				y = (3 / 5) * this.height
				startInd = Math.floor((dotAmount * 2) / 3)
			}
			y -= this.height * 0.5
			x -= this.width * 0.5

			let rndAng = rndFloat(0, Math.PI * 2)
			let radius = rndInt(0, 1)
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
		return { pos, uvs, positionsAndDirections }
	}
	changeParticleAmount(newAmount) {
		WIDTH = Math.sqrt(newAmount)
		let arrays = this.getDataArrays(newAmount)
		this.updateDotsShader.dispose()
		this.renderDotsShader.dispose()
		this.renderDotsShader = null
		this.getRenderDotsShader(arrays.pos, arrays.uvs)
		this.updateDotsShader = null
		this.getUpdateDotsShader(arrays.positionsAndDirections)
		this.mouseSpawnTexture.dispose()
		this.mouseSpawnTexture = new MouseSpawnTexture(WIDTH, WIDTH)
	}
	getUpdateDotsShader(positionsAndDirections) {
		if (!this.updateDotsShader) {
			this.updateDotsShader = new PingPongShaderBuilder()
				.withDimensions(WIDTH, WIDTH)
				.withVertex(PASS_THROUGH_VERTEX)
				.withFragment(UPDATE_DOTS_FRAGMENT)
				.withTextureData(positionsAndDirections)
				.withUniform("diffuseTexture", null)
				.withUniform("pointsTexture", null)
				.withUniform("mouseSpawnTexture", null)
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
		}
		return this.updateDotsShader
	}

	getRenderDotsShader(pos, uvs) {
		if (!this.renderDotsShader) {
			this.renderDotsShader = new ShaderBuilder()
				.withDimensions(this.width, this.height)
				.withVertex(RENDER_DOTS_VERTEX)
				.withFragment(RENDER_DOTS_FRAGMENT)
				.withUniform("isParticleTexture", this.settings.isParticleTexture)
				.withUniform("particleTexture", null)
				.withUniform("positionTexture", null)
				.withUniform("dotSizes", Vector(this.settings.dotSizes))
				.withUniform("resolution", Vector([this.width, this.height]))
				.withAttribute("position", new THREE.BufferAttribute(pos, 3, false))
				.withAttribute("uv", new THREE.BufferAttribute(uvs, 2, false))
				.create()
		}
		return this.renderDotsShader
	}

	render() {
		// if (!this.ticker) {
		// 	this.ticker = 0
		// 	this.toSpawn = 3
		// 	this.tickDur = 5
		// 	this.spawned = 0
		// }
		// this.ticker++
		// if (
		// 	this.ticker % this.tickDur == 0 &&
		// 	this.ticker > 100 &&
		// 	this.spawned < WIDTH * WIDTH
		// ) {
		// 	// this.tickDur = Math.max(1, this.tickDur - 1)
		// 	// this.updateDotsShader.setUniform(
		// 	// 	"mouseRad",
		// 	// 	500 - (500 * this.spawned) / (WIDTH * WIDTH)
		// 	// )
		// 	this.mouseSpawnTexture.drawMouse(
		// 		{
		// 			x:
		// 				Math.cos(this.ticker / 20) *
		// 				Math.pow(100 - (100 * this.spawned) / (WIDTH * WIDTH), 1),
		// 			y:
		// 				Math.sin(this.ticker / 20) *
		// 				Math.pow(100 - (100 * this.spawned) / (WIDTH * WIDTH), 1)
		// 		},
		// 		1,
		// 		(5 * this.ticker) / this.tickDur,
		// 		Math.floor(Math.abs(this.toSpawn))
		// 	)

		// 	this.updateDotsShader.setUniform(
		// 		"mouseSpawnTexture",
		// 		this.mouseSpawnTexture.getTexture()
		// 	)
		// 	this.toSpawn = (this.toSpawn - 0.025) % 3
		// 	this.spawned += (5 * this.ticker) / this.tickDur
		// }
		if (mouseDown) {
			this.mouseSpawnTexture.drawMouse(
				this.mousePos,
				this.settings.mousePlaceRadius,
				this.settings.mousePlaceAmount,
				this.settings.mousePlaceColor
			)

			this.updateDotsShader.setUniform(
				"mouseSpawnTexture",
				this.mouseSpawnTexture.getTexture()
			)
		}

		this.diffuseShader.setUniform("points", this.renderDotsShader.getTexture())
		this.diffuseShader.render(this.renderer)

		this.getUpdateDotsShader().setUniform(
			"mousePos",
			new THREE.Vector2(this.mousePos.x, this.mousePos.y)
		)

		this.getUpdateDotsShader().setUniform(
			"pointsTexture",
			this.renderDotsShader.getTexture()
		)
		this.getUpdateDotsShader().setUniform(
			"diffuseTexture",
			this.diffuseShader.getTexture()
		)

		this.getUpdateDotsShader().render(this.renderer, {})

		this.getRenderDotsShader().setUniform(
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

		this.mouseSpawnTexture.clear()
		this.updateDotsShader.setUniform(
			"mouseSpawnTexture",
			this.mouseSpawnTexture.getTexture()
		)
	}
	initGUI() {
		let infoButton = document.createElement("div")
		infoButton.classList.add("infoButton")
		document.body.appendChild(infoButton)

		let infoField = document.createElement("div")
		infoField.classList.add("infoField")
		infoField.innerHTML = "i"
		infoButton.appendChild(infoField)

		infoButton.onclick = () => {
			InfoDialog.create(INFO_TEXT, () => {})
		}

		let gui = new GUI()
		this.gui = gui
		this.particleAmount = WIDTH * WIDTH

		let amountFolder = this.gui.addFolder("Particle amount")
		for (let i = 0; i < 6; i++) {
			let amnt = Math.pow(Math.pow(2, 6 + 1 * i), 2)
			amountFolder
				.add(
					{
						changeParticleAmount: this.changeParticleAmount.bind(this, amnt)
					},
					"changeParticleAmount"
				)
				.name(amnt)
		}

		let placing = {
			Red: true,
			Green: false,
			Blue: false,
			Random: false
		}

		let controls = gui.addFolder("Controls")
		controls
			.add(
				this.settings,
				"mouseRad",

				0,
				500,
				0.1
			)
			.name("Mouse push radius")
			.onChange(() =>
				this.getUpdateDotsShader().setUniform(
					"mouseRad",
					this.settings.mouseRad
				)
			)

		controls
			.add(this.settings, "mousePlaceRadius", 1, 500, 1)
			.name("Click spawn radius")

		controls
			.add(this.settings, "mousePlaceAmount", 1, 500000, 1)
			.name("Click spawn amount")

		let placingColors = controls.addFolder("Place color")
		for (let key in placing) {
			placingColors.add(placing, key).onChange(() => {
				for (let key2 in placing) {
					placing[key2] = false
				}
				placing[key] = true
				this.settings.mousePlaceColor =
					key == "Red" ? 0 : key == "Green" ? 1 : key == "Blue" ? 2 : -1
				placingColors.controllers.forEach(contr => contr.updateDisplay())
			})
		}
		gui
			.add(this.diffuseShader.getUniforms().decay, "value", 0.01, 0.99, 0.01)
			.name("Decay")
		gui
			.add(this.settings, "isDisplacement")
			.name("One particle per pixel")
			.onChange(() => {
				this.getUpdateDotsShader().setUniform(
					"isDisplacement",
					this.settings.isDisplacement
				)
			})

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
					this.getUpdateDotsShader().setUniform(
						"sensorAngle",
						Vector(this.settings.sensorAngle)
					)
				)

			group
				.add(this.settings.rotationAngle, i, 0.01, 2, 0.01)
				.name("Rotation Angle")
				.onChange(() =>
					this.getUpdateDotsShader().setUniform(
						"rotationAngle",
						Vector(this.settings.rotationAngle)
					)
				)

			group
				.add(this.settings.sensorDistance, i, 0.1, 50, 0.1)
				.name("Sensor Distance")
				.onChange(() =>
					this.getUpdateDotsShader().setUniform(
						"sensorDistance",
						Vector(this.settings.sensorDistance)
					)
				)

			group
				.add(this.settings.moveSpeed, i, 0.1, 20, 0.1)
				.name("Move Distance")
				.onChange(() =>
					this.getUpdateDotsShader().setUniform(
						"moveSpeed",
						Vector(this.settings.moveSpeed)
					)
				)

			group
				.add(this.settings.dotSizes, i, 1, 5, 1)
				.name("Dot Size")
				.onChange(() =>
					this.getRenderDotsShader().setUniform(
						"dotSizes",
						Vector(this.settings.dotSizes)
					)
				)

			group
				.add(this.settings.infectious, i, 0, 1, 1)
				.name("Infectious to  " + teamNames[(i + 1) % 3])
				.onChange(() =>
					this.getUpdateDotsShader().setUniform(
						"infectious",
						Vector(this.settings.infectious)
					)
				)

			for (let j = 0; j < 3; j++) {
				group
					.add(this.settings["attract" + i], j, -1, 1, 0.05)
					.name("Attraction to " + teamNames[j])
					.onChange(() =>
						this.getUpdateDotsShader().setUniform(
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
				this.getRenderDotsShader().setUniform(
					"isParticleTexture",
					this.settings.particleTexture != "None"
				)
				if (this.settings.particleTexture != "None") {
					this.textureLoader.load(
						"../src/images/particles/" + this.settings.particleTexture + ".png",
						tex => this.getRenderDotsShader().setUniform("particleTexture", tex)
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
}
