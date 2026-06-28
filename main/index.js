import { getBeatmaps, getPlayers, findPlayer } from "../_shared/core/load-data.js"
import { delay } from "../_shared/core/utils.js"
import { createTosuWsSocket } from "../_shared/core/websocket.js"

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

getPlayers()

/* Player Details */
const playerLeftProfilePictureEl = document.getElementById("player-left-profile-picture")
const playerLeftNameEl = document.getElementById("player-left-name")
const playerLeftSeedEl = document.getElementById("player-left-seed")
const playerLeftStarContainerEl = document.getElementById("player-left-star-container")
const playerLeftLineEl = document.getElementById("player-left-line")
const playerLeftLine2El = document.getElementById("player-left-line-2")
const playerLeftHitNumber100El = document.getElementById("player-left-hit-number-100")
const playerLeftHitNumber50El = document.getElementById("player-left-hit-number-50")
const playerLeftHitNumberMissEl = document.getElementById("player-left-hit-number-miss")
const playerRightProfilePictureEl = document.getElementById("player-right-profile-picture")
const playerRightNameEl = document.getElementById("player-right-name")
const playerRightSeedEl = document.getElementById("player-right-seed")
const playerRightStarContainerEl = document.getElementById("player-right-star-container")
const playerRightLineEl = document.getElementById("player-right-line")
const playerRightLine2El = document.getElementById("player-right-line-2")
const playerRightHitNumber100El = document.getElementById("player-right-hit-number-100")
const playerRightHitNumber50El = document.getElementById("player-right-hit-number-50")
const playerRightHitNumberMissEl = document.getElementById("player-right-hit-number-miss")
let player1Id, player2Id
let currentBestOf, currentLeftStars, currentRightStars

// Score Visibility
const scoreLeftNumberEl = document.getElementById("score-left-number")
const scoreBarEl = document.getElementById("score-bar")
const scoreLeftDifferenceEl = document.getElementById("score-left-difference")
const scoreRightDifferenceEl = document.getElementById("score-right-difference")
const scoreLeftDifferenceNumberEl = document.getElementById("score-left-difference-number")
const scoreRightDifferenceNumberEl = document.getElementById("score-right-difference-number")
const scoreRightNumberEl = document.getElementById("score-right-number")
let scoreVisible

const animations = {
    scoreLeftNumber: new CountUpImage(scoreLeftNumberEl, 0, 0, 0, 0.2, { useEasing: true, useGrouping: true, separator: ",", decimal: ".", suffix: ""}),
    scoreRightNumber: new CountUpImage(scoreRightNumberEl, 0, 0, 0, 0.2, { useEasing: true, useGrouping: true, separator: ",", decimal: ".", suffix: ""}),
    scoreLeftDifferenceNumber: new CountUp(scoreLeftDifferenceNumberEl, 0, 0, 0, 0.2, { useEasing: true, useGrouping: true, separator: ",", decimal: ".", suffix: ""}),
    scoreRightDifferenceNumber: new CountUp(scoreRightDifferenceNumberEl, 0, 0, 0, 0.2, { useEasing: true, useGrouping: true, separator: ",", decimal: ".", suffix: ""}),
}

// Score Bar
const scoreLeftBarEl = document.getElementById("score-left-bar")
const scoreRightBarEl = document.getElementById("score-right-bar")
const scoreLeftPointEndEl = document.getElementById("score-left-point-end")
const scoreRightPointEndEl = document.getElementById("score-right-point-end")
const scoreMiddlePointEndEl = document.getElementById("score-middle-point-end")
const scoreBarMaxWidth = 705 / 2

const socket = createTosuWsSocket()
socket.onmessage = async event => {
    const data = JSON.parse(event.data)
    console.log(data)

    // Save data
    const clients = data.tourney.clients
    const client0Hits = clients[0].play.hits
    const client1Hits = clients[0].play.hits

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

    // Hits 
    playerLeftHitNumber100El.textContent = client0Hits["100"] + client0Hits["geki"]
    playerLeftHitNumber50El.textContent = client0Hits["50"]
    playerLeftHitNumberMissEl.textContent = client0Hits["0"]
    playerRightHitNumber100El.textContent = client1Hits["100"] + client1Hits["geki"]
    playerRightHitNumber50El.textContent = client1Hits["50"]
    playerRightHitNumberMissEl.textContent = client1Hits["0"]

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
            pointImg.setAttribute("src", `static/point/point-${status}.png`)

            playerStar.append(pointImg)
            return pointImg
        }

        await delay(250)

        // Adjust width of line
        playerLeftLineEl.style.width = `${playerLeftLine2El.getBoundingClientRect().width}px`
        playerRightLineEl.style.width = `${playerRightLine2El.getBoundingClientRect().width}px`
    }

    // Score visibility
    if (scoreVisible !== data.tourney.scoreVisible) {
        scoreVisible = data.tourney.scoreVisible
        
        if (scoreVisible) {
            scoreLeftNumberEl.style.opacity = 1
            scoreBarEl.style.opacity = 1
            scoreLeftDifferenceEl.style.opacity = 1
            scoreRightDifferenceEl.style.opacity = 1
            scoreRightNumberEl.style.opacity = 1
        } else {
            scoreLeftNumberEl.style.opacity = 0
            scoreBarEl.style.opacity = 0
            scoreLeftDifferenceEl.style.opacity = 0
            scoreRightDifferenceEl.style.opacity = 0
            scoreRightNumberEl.style.opacity = 0
        }
    }

    // Display scores
    if (scoreVisible) {
        let currentLeftScore = data.tourney.totalScore.left
        let currentRightScore = data.tourney.totalScore.right
        animations.scoreLeftNumber.update(currentLeftScore)
        animations.scoreRightNumber.update(currentRightScore)

        const scoreDifference = Math.abs(currentLeftScore - currentRightScore)
        animations.scoreLeftDifferenceNumber.update(scoreDifference)
        animations.scoreRightDifferenceNumber.update(scoreDifference)

        // Set score bar width
        const scoreBarDifferencePercent = Math.min(scoreDifference / (300000 * multiplier), 1)
        const scoreBarRectangleWidth = Math.min(Math.pow(scoreBarDifferencePercent, 0.5) * scoreBarMaxWidth, scoreBarMaxWidth)

        // Score bar
        if (currentLeftScore > currentRightScore) {
            scoreLeftDifferenceEl.style.display = "block"
            scoreRightDifferenceEl.style.display = "none"

            scoreLeftBarEl.style.width = `${scoreBarRectangleWidth}px`
            scoreRightBarEl.style.width = "0px"

            scoreLeftPointEndEl.style.display = "block"
            scoreRightPointEndEl.style.display = "none"
            scoreMiddlePointEndEl.style.display = "none"

            scoreLeftPointEndEl.style.right = `${scoreBarMaxWidth / 2 + scoreBarRectangleWidth}px`
            scoreMiddlePointEndEl.style.left = `${scoreBarMaxWidth / 2}px`
            scoreRightPointEndEl.style.left = `${scoreBarMaxWidth / 2}px`
        } else if (currentLeftScore === currentRightScore) {
            scoreLeftDifferenceEl.style.display = "none"
            scoreRightDifferenceEl.style.display = "none"

            scoreLeftBarEl.style.width = "0px"
            scoreRightBarEl.style.width = "0px"

            scoreLeftPointEndEl.style.display = "none"
            scoreRightPointEndEl.style.display = "block"
            scoreMiddlePointEndEl.style.display = "none"

            scoreLeftPointEndEl.style.right = `${scoreBarMaxWidth / 2}px`
            scoreMiddlePointEndEl.style.left = `${scoreBarMaxWidth / 2}px`
            scoreRightPointEndEl.style.left = `${scoreBarMaxWidth / 2}px`
        } else if (currentLeftScore < currentRightScore) {
            scoreLeftDifferenceEl.style.display = "none"
            scoreRightDifferenceEl.style.display = "block"

            scoreLeftBarEl.style.width = "0px"
            scoreRightBarEl.style.width = `${scoreBarRectangleWidth}px`

            scoreLeftPointEndEl.style.display = "none"
            scoreRightPointEndEl.style.display = "none"
            scoreMiddlePointEndEl.style.display = "none"

            scoreLeftPointEndEl.style.right = `${scoreBarMaxWidth / 2}px`
            scoreMiddlePointEndEl.style.left = `${scoreBarMaxWidth / 2}px`
            scoreRightPointEndEl.style.left = `${scoreBarMaxWidth / 2 + scoreBarRectangleWidth}px`
        }
    }
}