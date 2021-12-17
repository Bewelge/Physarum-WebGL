export class InfoDialog {
	static create(message, confirmCallback) {
		let dialog = document.createElement("div")
		dialog.classList.add("notification")

		let textPanel = document.createElement("div")
		textPanel.classList.add("notificationText")
		textPanel.innerHTML = message

		let evListener = () => {
			document.body.removeChild(dialog)
			document.body.removeEventListener("click", evListener)
		}
		dialog.appendChild(textPanel)
		document.body.appendChild(dialog)
		window.setTimeout(
			() => document.body.addEventListener("click", evListener),
			50
		)
	}
}
