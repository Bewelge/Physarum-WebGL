import * as THREE from "../lib/three.module.js"

export const Vector = arr => {
	return arr.length == 2
		? new THREE.Vector2(arr[0], arr[1])
		: arr.length == 3
		? new THREE.Vector3(arr[0], arr[1], arr[2])
		: arr.length == 4
		? new THREE.Vector4(arr[0], arr[1], arr[2], arr[3])
		: console.error("Cant create vector with " + arr.length + " elements")
}

export const orthographicCamer = (w, h) =>
	new THREE.OrthographicCamera(-w / 2, w / 2, h / 2, -h / 2, 0.1, 100)
