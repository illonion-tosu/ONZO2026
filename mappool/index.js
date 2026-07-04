import { getBeatmaps, findBeatmap, getPlayers, findPlayer } from "../_shared/core/load-data.js"
import { createTosuWsSocket } from "../_shared/core/websocket.js"

getPlayers()

/* Player Details */
const playerLeftProfilePictureEl = document.getElementById("player-left-profile-picture")
const playerLeftNameEl = document.getElementById("player-left-name")
const playerLeftSeedEl = document.getElementById("player-left-seed")
const playerLeftStarContainerEl = document.getElementById("player-left-star-container")
const playerRightProfilePictureEl = document.getElementById("player-right-profile-picture")
const playerRightNameEl = document.getElementById("player-right-name")
const playerRightSeedEl = document.getElementById("player-right-seed")
const playerRightStarContainerEl = document.getElementById("player-right-star-container")
let player1Id, player2Id
let currentBestOf, currentLeftStars, currentRightStars

const socket = createTosuWsSocket()
socket.onmessage = async event => {
    const data = JSON.parse(event.data)
    console.log(data)

    // Save data
    const clients = data.tourney.clients

    if (player1Id !== clients[0].user.id) {
        player1Id = clients[0].user.id
        playerLeftProfilePictureEl.style.backgroundImage = `url("https://a.ppy.sh/${player1Id}")`
        playerLeftNameEl.innerText = clients[0].user.name
        const player = findPlayer(player1Id)
        if (player) playerLeftSeedEl.innerText = `#${player.player_seed}`
    }
    if (player2Id !== clients[1].user.id) {
        player2Id = clients[1].user.id
        playerRightProfilePictureEl.style.backgroundImage = `url("https://a.ppy.sh/${player2Id}")`
        playerRightNameEl.innerText = clients[1].user.name
        const player = findPlayer(player2Id)
        if (player) playerRightSeedEl.innerText = `#${player.player_seed}`
    }

    // Stars
    if (currentBestOf !== data.tourney.bestOF ||
        currentLeftStars !== data.tourney.points.left ||
        currentRightStars !== data.tourney.points.right
    ) {
        // Set new values
        currentBestOf = data.tourney.bestOF
        currentLeftStars = data.tourney.points.left
        currentRightStars = data.tourney.points.right
        const currentFirstTo = Math.ceil(currentBestOf / 2)

        // Reset stars
        playerLeftStarContainerEl.innerHTML = ""
        playerRightStarContainerEl.innerHTML = ""

        // Iterate through star creation
        for (let i = 0; i < currentFirstTo; i++) {
            playerLeftStarContainerEl.append(createStar(i < currentLeftStars ? "fill" : "empty"))
            playerRightStarContainerEl.append(createStar(i < currentRightStars ? "fill" : "empty"))
        }

        // Create star
        function createStar(status) {
            const playerStar = document.createElement("div")
            playerStar.classList.add("player-star")

            const pointImg = document.createElement("img")
            pointImg.setAttribute("src", `../_shared/assets/point/point-${status}.png`)

            playerStar.append(pointImg)
            return playerStar
        }
    }
}