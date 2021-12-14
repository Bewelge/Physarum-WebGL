function rndFloat(min, max) {
	return min + (max - min) * fxrand()
}
function rndInt(min, max) {
	return Math.round(min + (max - min) * fxrand())
}

function isSafari() {
	return (
		!!navigator.userAgent.match(/Safari/i) &&
		!navigator.userAgent.match(/Chrome/i)
	)
}

export { rndFloat, rndInt, isSafari }
