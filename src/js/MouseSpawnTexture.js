import * as THREE from "../lib/three.module.js"
import { rndFloat } from "./Util.js"

export class MouseSpawnTexture {
	constructor(width, height) {
		this.counter = 0
		this.toClear = 0
		let data = new Float32Array(width * height * 4)
		this.data = data
		for (let i = 0; i < data.length; i++) {
			data[i] = 0
		}
		this.dataTexture = new THREE.DataTexture(
			data,
			width,
			height,
			THREE.RGBAFormat,
			THREE.FloatType
		)
	}
	drawMouse(pos, radius, amount, color) {
		let team = () => {
			if (color != -1) {
				return color
			} else {
				let rnd = rndFloat(0, 1)
				return rnd < 2 / 3 ? (rnd < 1 / 3 ? 0 : 1) : 2
			}
		}
		for (let i = this.counter; i < this.counter + amount; i++) {
			let rndAng = rndFloat(0, Math.PI * 2)
			let rndDis = rndFloat(0, radius)
			let x = pos.x
			let y = pos.y

			let index = (i * 4) % this.data.length
			this.data[index] = x + rndDis * Math.cos(rndAng)
			this.data[index + 1] = y + rndDis * Math.sin(rndAng)
			this.data[index + 2] = rndAng
			this.data[index + 3] = team()
		}
		this.toClear += amount
		this.counter = (this.counter + amount) % (this.data.length / 4)
		this.dataTexture.needsUpdate = true
	}
	clear() {
		for (let i = this.counter - this.toClear; i < this.counter; i++) {
			let index = (i * 4 + this.data.length) % this.data.length
			this.data[index] = 0
			this.data[index + 1] = 0
			this.data[index + 2] = 0
			this.data[index + 3] = 0
		}
		this.toClear = 0
		this.dataTexture.needsUpdate = true
	}
	getTexture() {
		return this.dataTexture
	}
	dispose() {
		this.dataTexture.dispose()
		this.data = null
	}
}
