import { updateChat } from "../_shared/core/chat.js"
import { getBeatmaps, findBeatmap, getPlayers, findPlayer } from "../_shared/core/load-data.js"
import { createTosuWsSocket } from "../_shared/core/websocket.js"

// Banned Maps
const bannedLeftMapsEl = document.getElementById("banned-left-maps")
const bannedRightMapsEl = document.getElementById("banned-right-maps")

// Team history
const teamHistoryLeftAreaEl = document.getElementById("team-history-left-area")
const teamHistoryRightAreaEl = document.getElementById("team-history-right-area")

const mappoolManagementMapsEl = document.getElementById("mappool-management-maps")
let roundName, allBeatmaps
let currentBestOf, currentBanCount, currentFirstTo
getPlayers()
getBeatmaps().then((beatmaps) => {
    roundName = beatmaps.roundName
    allBeatmaps = beatmaps.beatmaps

    // Set best of / first to information
    switch (roundName) {
        case "ROUND OF 32": case "ROUND OF 16":
            currentBestOf = 9
            currentBanCount = 1
            break
        case "QUARTERFINALS": case "SEMIFINALS":
            currentBestOf = 11
            currentBanCount = 2
            break
        case "FINALS": case "GRAND FINALS":
            currentBestOf = 13
            currentBanCount = 2
            break
    }
    currentFirstTo = Math.ceil(currentBestOf / 2)

    // Set ban images
    for (let i = 0; i < currentBanCount; i++) {
        bannedLeftMapsEl.append(createImage())
        bannedRightMapsEl.append(createImage())
    }

    // Create image
    function createImage() {
        const image = document.createElement("img")
        return image
    }

    // Set pick containers
    for (let i = 0; i < currentFirstTo - 1; i++) {
        teamHistoryLeftAreaEl.append(createPickContainer())
        teamHistoryRightAreaEl.append(createPickContainer())
    }

    // Create pick contianer
    function createPickContainer() {
        // Team history map
        const teamHistoryMap = document.createElement("div")
        teamHistoryMap.classList.add("team-history-map")

        // Team history map side
        const teamHistoryMapSide = document.createElement("div")
        teamHistoryMapSide.classList.add(`team-history-map-left`)

        // Song history panel
        const songHistoryPanel = document.createElement("img")
        songHistoryPanel.setAttribute("src", "static/match-history/song-history-panel.png")

        // Team history mod
        const teamHistoryMod = document.createElement("img")
        teamHistoryMod.classList.add("team-history-mod")

        // Team history scores
        const teamHistoryScores = document.createElement("div")
        teamHistoryScores.classList.add("team-history-scores")

        // Team history score left
        const teamHistoryScoreLeft = document.createElement("span")
        const teamHistoryScoreRight = document.createElement("span")
        teamHistoryScores.append(teamHistoryScoreLeft, " - ", teamHistoryScoreRight)
        teamHistoryMapSide.append(songHistoryPanel, teamHistoryMod, teamHistoryScores)

        // Team history crown
        const teamHistoryCrown = document.createElement("img")
        teamHistoryCrown.classList.add("team-history-crown")
        teamHistoryMap.append(teamHistoryMapSide, teamHistoryCrown)
        
        return teamHistoryMap
    }

    for (let i = 0; i < allBeatmaps.length; i++) {
        // Set mod images
        const mod = document.getElementById(`${allBeatmaps[i].mod.toLowerCase()}${allBeatmaps[i].order}`)
        mod.dataset.id = allBeatmaps[i].beatmap_id
        const image = mod.children[0]
        if (image.getAttribute("src").includes("locked")) {
            image.setAttribute("src", `static/mappool-picks/unpicked/${allBeatmaps[i].mod.toUpperCase()}.png`)
        }

        // Create buttons
        const button = document.createElement("button")
        button.textContent = `${allBeatmaps[i].mod}${allBeatmaps[i].order}`
        button.addEventListener("mousedown", mapClickEvent)
        button.addEventListener("contextmenu", event => event.preventDefault())
        button.setAttribute("id", allBeatmaps[i].beatmap_id)
        button.dataset.id = allBeatmaps[i].beatmap_id
        mappoolManagementMapsEl.append(button)
    }
})

// Mappool Area Lines
const mappoolAreaLine1El = document.getElementById("mappool-area-line-1")
const mappoolAreaLine2El = document.getElementById("mappool-area-line-2")

// Map click Event
function mapClickEvent(event) {
    // Figure out whether it is a pick or ban
    const currentMapId = this.dataset.id
    const currentMap = findBeatmap(currentMapId)
    if (!currentMap) return

    // Team
    let team
    if (event.button === 0) team = "left"
    else if (event.button === 2) team = "right"
    if (!team) return

    // Action
    let action = "pick"
    if (event.ctrlKey) action = "ban"

    console.log("map check 2")

    // Check if map exists in bans and picks
    const mapCheck = !!(
        mappoolAreaLine1El.querySelector(`[data-id="${currentMapId}"]`)
            ?.firstElementChild
            ?.getAttribute("src")
            ?.includes("/picked/") ||
        mappoolAreaLine2El.querySelector(`[data-id="${currentMapId}"]`)
            ?.firstElementChild
            ?.getAttribute("src")
            ?.includes("/picked/")
    )
    if (mapCheck) return

    console.log("map check")
    
    // Bans
    if (action === "ban") {
        const currentContainer = team === "left" ? bannedLeftMapsEl : bannedRightMapsEl

        for (let i = 0; i < currentContainer.childElementCount; i++) {
            const child = currentContainer.children[i]

            // Set ban image
            if (child.dataset.id !== undefined) continue
            child.dataset.id = currentMapId
            child.setAttribute("src", `static/banned-mods/${currentMap.mod.toUpperCase()}${currentMap.order}.png`)

            // Mark as picked
            const modId = document.getElementById(`${currentMap.mod.toLowerCase()}${currentMap.order}`)
            modId.firstElementChild.setAttribute("src", modId.firstElementChild.getAttribute("src").replace("unpicked", "picked"))
            break
        }
    }
}

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
let currentStarBestOf, currentLeftStars, currentRightStars

/* Chat */
const chatDisplayContainerEl = document.getElementById("chat-display-container")
let chatLen

const socket = createTosuWsSocket()
socket.onmessage = async event => {
    const data = JSON.parse(event.data)
    console.log(data)

    // Save data
    const clients = data.tourney.clients
    const chatData = data.tourney.chat

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
    if (currentStarBestOf !== data.tourney.bestOF ||
        currentLeftStars !== data.tourney.points.left ||
        currentRightStars !== data.tourney.points.right
    ) {
        // Set new values
        currentStarBestOf = data.tourney.bestOF
        currentLeftStars = data.tourney.points.left
        currentRightStars = data.tourney.points.right
        const currentFirstTo = Math.ceil(currentStarBestOf / 2)

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

    // Chat

    if (chatLen !== chatData.length) {
        chatLen = updateChat(chatLen, chatData, chatDisplayContainerEl)
    }
}

// Next Picker
const nextPickerEl = document.getElementById("next-picker")
const waitingForPickEl = document.getElementById("waiting-for-pick")
let currentNextPicker = "none"
function setNextPicker(pickerTeam) {
    currentNextPicker = pickerTeam
    nextPickerEl.textContent = pickerTeam === "left" ? "ORAGNE" : pickerTeam === "right" ? "PURPLE" : "NONE"
    if (currentNextPicker === "none") {
        waitingForPickEl.textContent = ""
    } else {
        waitingForPickEl.textContent = `waiting for ${pickerTeam === "left"? "orange": "purple"}'s pick...`
        waitingForPickEl.classList.remove("wait-for-pick-left")
        waitingForPickEl.classList.remove("wait-for-pick-right")
        waitingForPickEl.classList.add(`wait-for-pick-${pickerTeam}`)
    }
    
}

// Toggle Autopick
const toggleAutopickEl = document.getElementById("toggle-autopick")
let isAutopickToggled = false
function toggleAutopick() {
    isAutopickToggled = !isAutopickToggled
    toggleAutopickEl.textContent = `TOGGLE AUTOPICK: ${isAutopickToggled? "ON": "OFF"}`
    if (isAutopickToggled) {
        toggleAutopickEl.classList.remove("toggle-inactive")
        toggleAutopickEl.classList.add("toggle-active")
    } else {
        toggleAutopickEl.classList.add("toggle-inactive")
        toggleAutopickEl.classList.remove("toggle-active")
    }
}

const setNextPickerLeftEl = document.getElementById("set-next-picker-left")
const setNextPickerRightEl = document.getElementById("set-next-picker-right")
const nextPickerNoneEl = document.getElementById("next-picker-none")

// Loading buttons\
window.onload = () => {
    setNextPickerLeftEl.addEventListener("click", () => setNextPicker("left"))
    setNextPickerRightEl.addEventListener("click", () => setNextPicker("right"))
    nextPickerNoneEl.addEventListener("click", () => setNextPicker("none"))
    toggleAutopickEl.addEventListener("click", () => toggleAutopick())
}