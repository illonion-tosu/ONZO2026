import { getBeatmaps } from "../_shared/core/beatmaps.js"
import { delay } from "../_shared/core/utils.js"

const roundAreaEl = document.getElementById("round-area")
const roundNameEl = document.getElementById("round-name")

getBeatmaps().then(async beatmaps => {
    // Set round images
    roundAreaEl.setAttribute("src", `static/bracket-title/${beatmaps.roundName}-border.png`)
    roundNameEl.setAttribute("src", `static/bracket-title/${beatmaps.roundName}.png`)

    // Get details for round area
    await delay(250)
    const roundAreaElWidth = roundAreaEl.getBoundingClientRect().width
    const roundAreaElHeight = roundAreaEl.getBoundingClientRect().height
    roundNameEl.style.top = `${35 + roundAreaElHeight / 2}px`
    roundNameEl.style.left = `${949 + roundAreaElWidth / 2}px`
})