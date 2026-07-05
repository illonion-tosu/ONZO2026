import { updateChat } from "../_shared/core/chat.js"
import { getBeatmaps, findBeatmap, getPlayers, findPlayer, initialiseApi, getApi } from "../_shared/core/load-data.js"
import { delay } from "../_shared/core/utils.js"
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
initialiseApi()
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
    for (let i = 0; i < currentFirstTo; i++) {
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
        teamHistoryCrown.setAttribute("src", "static/match-history/crown-none.png")
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

const nowPlayingAreaEl = document.getElementById("now-playing-area")
// Now playing metadata
const nowPlayingBackgroundEl = document.getElementById("now-playing-background")
const nowPlayingArtistEl = document.getElementById("now-playing-artist")
const nowPlayingTitleEl = document.getElementById("now-playing-title")
const nowPlayingMapperEl = document.getElementById("now-playing-mapper")
const nowPlayingDifficultyEl = document.getElementById("now-playing-difficulty")
// Now playing stats
const nowPlayingStatNumberCsEl = document.getElementById("now-playing-stat-number-cs")
const nowPlayingStatNumberArEl = document.getElementById("now-playing-stat-number-ar")
const nowPlayingStatNumberOdEl = document.getElementById("now-playing-stat-number-od")
const nowPlayingStatNumberSrEl = document.getElementById("now-playing-stat-number-sr")
// Now playing final score
const nowPlayingFinalScoreEl = document.getElementById("now-playing-final-score")
const nowPlayingLeftFinalScoreEl = document.getElementById("now-playing-left-final-score")
const nowPlayingRightFinalScoreEl = document.getElementById("now-playing-right-final-score")
// Now playing bottom
const nowPlayingModIdEl = document.getElementById("now-playing-mod-id")
const nowPlayingPickEl = document.getElementById("now-playing-pick")
const nowPlayingPickTbEl = document.getElementById("now-playing-pick-tb")

// Map click Event
let hasPickedYet = false
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

    // Picks
    if (action === "pick") {
        const currentContainer = team === "left" ? teamHistoryLeftAreaEl : teamHistoryRightAreaEl
        for (let i = 0; i < currentContainer.childElementCount; i++) {
            const child  = currentContainer.children[i]

            // Set pick info
            if (child.dataset.id !== undefined) continue
            nowPlayingAreaEl.dataset.id = currentMapId
            child.dataset.id = currentMapId
            child.style.display = "flex"
            child.children[0].children[1].setAttribute("src", `static/mods/${currentMap.mod.toUpperCase()}${currentMap.order}.png`)
            child.children[0].style.backgroundImage = `url("https://assets.ppy.sh/beatmaps/${currentMap.beatmapset_id}/covers/cover.jpg")`

            // Mark as picked
            const modId = document.getElementById(`${currentMap.mod.toLowerCase()}${currentMap.order}`)
            modId.firstElementChild.setAttribute("src", modId.firstElementChild.getAttribute("src").replace("unpicked", "picked"))
            
            // Set now playing information
            nowPlayingBackgroundEl.style.backgroundImage = `url("https://assets.ppy.sh/beatmaps/${currentMap.beatmapset_id}/covers/cover.jpg")`
            nowPlayingArtistEl.textContent = currentMap.artist
            nowPlayingTitleEl.textContent = currentMap.title
            nowPlayingMapperEl.textContent = currentMap.creator
            nowPlayingDifficultyEl.textContent = `[${currentMap.version}]`

            // Set now playing stats
            let currentSr = Math.round(Number(currentMap.difficultyrating) * 100) / 100
            let currentCs = Math.round(Number(currentMap.diff_size) * 10) / 10
            let currentAr = Math.round(Number(currentMap.diff_approach) * 10) / 10
            let currentOd = Math.round(Number(currentMap.diff_overall) * 10) / 10

            switch (currentMap.mod) {
                case "HR":
                    currentCs = Math.min(Math.round(Number(currentMap.diff_size) * 1.3 * 10) / 10, 10)
                    currentAr = Math.min(Math.round(Number(currentMap.diff_approach) * 1.4 * 10) / 10, 10)
                    currentOd = Math.min(Math.round(Number(currentMap.diff_overall) * 1.4 * 10) / 10, 10)
                    break
                case "DT":
                    if (currentAr > 5) currentAr = Math.round((((1200 - (( 1200 - (currentAr - 5) * 150) * 2 / 3)) / 150) + 5) * 10) / 10
                    else currentAr = Math.round((1800 - ((1800 - currentAr * 120) * 2 / 3)) / 120 * 10) / 10
                    currentOd = Math.round((79.5 - (( 79.5 - 6 * currentOd) * 2 / 3)) / 6 * 10) / 10
                    // currentBpm = Math.round(currentBpm * 1.5)
                    // currentLength = Math.round(currentLength / 1.5)
                    break
                case "EZ":
                    currentCs /= 2
                    currentAr /= 2
                    currentOd /= 2
            }

            nowPlayingStatNumberCsEl.textContent = currentCs.toFixed(1)
            nowPlayingStatNumberArEl.textContent = currentAr.toFixed(1)
            nowPlayingStatNumberOdEl.textContent = currentOd.toFixed(1)
            nowPlayingStatNumberSrEl.textContent = currentSr.toFixed(2)

            // Final score
            nowPlayingFinalScoreEl.style.display = "none"

            // Bottom area
            nowPlayingModIdEl.setAttribute("src", `static/mods/${currentMap.mod.toUpperCase()}${currentMap.order}.png`)
            nowPlayingModIdEl.style.display = "block"

            if (currentMap.mod === "TB") {
                nowPlayingPickEl.setAttribute("src", `static/picks/tb-pick.png`)
                nowPlayingPickTbEl.style.display = "block"
            } else {
                nowPlayingPickEl.setAttribute("src", `static/picks/${team}-pick.png`)
                nowPlayingPickTbEl.style.display = "none"
            }

            currentPicker = team
            setCurrentPicker(currentPicker)
            hasPickedYet = true

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

// Now Playing Information
let currentId, currentChecksum, updateData = false

// IPC State
let ipcState

const socket = createTosuWsSocket()
socket.onmessage = async event => {
    const data = JSON.parse(event.data)

    // Save data
    const clients = data.tourney.clients
    const chatData = data.tourney.chat

    if (player1Id !== clients[0].user.id) {
        player1Id = clients[0].user.id
        playerLeftProfilePictureEl.style.backgroundImage = `url("https://a.ppy.sh/${player1Id}")`
        playerLeftNameEl.innerText = clients[0].user.name
        const player = findPlayer(clients[0].user.name)
        if (player) playerLeftSeedEl.innerText = `#${player.player_seed}`
    }
    if (player2Id !== clients[1].user.id) {
        player2Id = clients[1].user.id
        playerRightProfilePictureEl.style.backgroundImage = `url("https://a.ppy.sh/${player2Id}")`
        playerRightNameEl.innerText = clients[1].user.name
        const player = findPlayer(clients[1].user.name)
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

        // Mappool map
    if (currentId !== data.beatmap.id || currentChecksum !== data.beatmap.checksum) {
        currentId = data.beatmap.id
        currentChecksum = data.beatmap.checksum

        // Find element
        const element = document.getElementById(currentId)
        
        // Click event
        if (isAutopickToggled && element && (!element.hasAttribute("data-is-autopicked") || element.getAttribute("data-is-autopicked") !== "true")) {
            // Check if autopicked already
            const event = new MouseEvent('mousedown', {
                bubbles: true,
                cancelable: true,
                view: window,
                button: (currentNextPicker === "left")? 0 : 2
            })
            element.dispatchEvent(event)
            element.setAttribute("data-is-autopicked", "true")

            setCurrentPicker(currentNextPicker)
            if (currentNextPicker === "left") setNextPicker("right")
            else if (currentNextPicker === "right") setNextPicker("left")
            waitingForPickEl.style.display = "none"
        }

        // If map not picked yet, set now playing details
        if (!hasPickedYet) {
            updateData = true
            await delay(250)
        }
    }

    // Update now playing information
    if (updateData) {
        const beatmapData = data.beatmap
        updateData = false
        nowPlayingBackgroundEl.style.backgroundImage = `url("${window.location.origin}/Songs/${data.folders.beatmap}/${data.files.background}")`
        nowPlayingArtistEl.textContent = beatmapData.artist
        nowPlayingTitleEl.textContent = beatmapData.title
        nowPlayingMapperEl.textContent = beatmapData.mapper
        nowPlayingDifficultyEl.textContent = `${beatmapData.version}`
        nowPlayingStatNumberCsEl.textContent = beatmapData.stats.cs.converted
        nowPlayingStatNumberArEl.textContent = beatmapData.stats.ar.converted
        nowPlayingStatNumberOdEl.textContent = beatmapData.stats.od.converted
        nowPlayingStatNumberSrEl.textContent = beatmapData.stats.stars.total
        nowPlayingFinalScoreEl.style.display = "none"
        nowPlayingModIdEl.style.display = "none"
        nowPlayingPickEl.style.display = "none"
        nowPlayingPickTbEl.style.display = "none"
    }

    // IPC State
    if (ipcState !== data.tourney.ipcState) {
        ipcState = data.tourney.ipcState
        if (ipcState === 4) {
            await delay(5000)
            setNextPicker(currentNextPicker)
            setTeamHistoryScore()
        }
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
        waitingForPickEl.style.display = "none"
    } else {
        waitingForPickEl.style.display = "block"
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

// Current Picker
const currentPickerEl = document.getElementById("current-picker")
let currentPicker = "none"
function setCurrentPicker(pickerTeam) {
    currentPicker = pickerTeam
    currentPickerEl.textContent = pickerTeam === "left" ? "ORAGNE" : pickerTeam === "right" ? "PURPLE" : "NONE"
    if (currentPicker === "left" || currentPicker === "right") {
        nowPlayingPickEl.style.display = "block"
        nowPlayingPickEl.setAttribute("src", `static/picks/${pickerTeam}-pick.png`)
    } else {
        nowPlayingPickEl.style.display = "none"
    }
}

const setCurrentPickerLeftEl = document.getElementById("set-current-picker-left")
const setCurrentPickerRightEl = document.getElementById("set-current-picker-right")
const currentPickerNoneEl = document.getElementById("current-picker-none")
const setNextPickerLeftEl = document.getElementById("set-next-picker-left")
const setNextPickerRightEl = document.getElementById("set-next-picker-right")
const nextPickerNoneEl = document.getElementById("next-picker-none")

// Loading buttons
window.onload = () => {
    setNextPickerLeftEl.addEventListener("click", () => setNextPicker("left"))
    setNextPickerRightEl.addEventListener("click", () => setNextPicker("right"))
    nextPickerNoneEl.addEventListener("click", () => setNextPicker("none"))
    toggleAutopickEl.addEventListener("click", () => toggleAutopick())
    setCurrentPickerLeftEl.addEventListener("click", () => setCurrentPicker("left"))
    setCurrentPickerRightEl.addEventListener("click", () => setCurrentPicker("right"))
    currentPickerNoneEl.addEventListener("click", () => setCurrentPicker("none"))
    matchHistorySetDetailsEl.addEventListener("click", () => setMatchHistoryDetails())
}

// Match history
const mpIdEl = document.getElementById("mp-id")
const matchHistorySetDetailsEl = document.getElementById("match-history-set-details")
async function setMatchHistoryDetails() {
    const response = await axios.get(`https://osu.ppy.sh/api/get_match?k=${getApi()}&mp=${mpIdEl.value}`)
    const games = response.data.games
    let setNowPlayingFinalScore = false

    // Team History Left Area
    for (let i = 0; i < games.length; i++) {
        // Find map in mappool
        const currentMap = findBeatmap(games[i].beatmap_id)
        if (!currentMap) continue

        // Set scores for each side
        const scoreLeft = games[i].scores[0].user_id == player1Id? Number(games[i].scores[0].score) : Number(games[i].scores[1].score)
        const scoreRight = games[i].scores[0].user_id == player2Id? Number(games[i].scores[0].score) : Number(games[i].scores[1].score)

        // Find map in now playing or picked areas
        // Left Area
        const teamHistoryLeftEl = teamHistoryLeftAreaEl.querySelector(`[data-id="${games[i].beatmap_id}"]`)
        if (teamHistoryLeftEl) {
            setTeamHistoryScore(teamHistoryLeftEl, scoreLeft, scoreRight)
        }

        // Right Area
        const teamHistoryRightEl = teamHistoryRightAreaEl.querySelector(`[data-id="${games[i].beatmap_id}"]`)
        if (teamHistoryRightEl) {
            setTeamHistoryScore(teamHistoryRightEl, scoreLeft, scoreRight)
        }

        // Now Playing Area
        if (nowPlayingAreaEl.dataset.id == games[i].beatmap_id) {
            setNowPlayingFinalScore = true
            nowPlayingFinalScoreEl.style.display = "flex"
            nowPlayingLeftFinalScoreEl.textContent = scoreLeft.toLocaleString()
            nowPlayingRightFinalScoreEl.textContent = scoreRight.toLocaleString()

            if (scoreLeft > scoreRight) {
                nowPlayingLeftFinalScoreEl.classList.add("now-playing-win-final-score")
                nowPlayingLeftFinalScoreEl.classList.remove("now-playing-lose-final-score")
                nowPlayingRightFinalScoreEl.classList.remove("now-playing-win-final-score")
                nowPlayingRightFinalScoreEl.classList.add("now-playing-lose-final-score")
            } else if (scoreLeft < scoreRight) {
                nowPlayingLeftFinalScoreEl.classList.remove("now-playing-win-final-score")
                nowPlayingLeftFinalScoreEl.classList.add("now-playing-lose-final-score")
                nowPlayingRightFinalScoreEl.classList.add("now-playing-win-final-score")
                nowPlayingRightFinalScoreEl.classList.remove("now-playing-lose-final-score") 
            } else {
                nowPlayingLeftFinalScoreEl.classList.remove("now-playing-win-final-score")
                nowPlayingLeftFinalScoreEl.classList.add("now-playing-lose-final-score")
                nowPlayingRightFinalScoreEl.classList.remove("now-playing-win-final-score")
                nowPlayingRightFinalScoreEl.classList.add("now-playing-lose-final-score") 
            }
        }

        if (!setNowPlayingFinalScore) {
            nowPlayingFinalScoreEl.style.display = "none"
            
        }
    }
}

function setTeamHistoryScore(element, scoreLeft, scoreRight) {
    // Set scores in correct location for this element
    const scoresEl = element.children[0].children[2]
    const scoresLeftEl = scoresEl.children[0]
    const scoresRightEl = scoresEl.children[1]
    scoresEl.style.display = "flex"
    scoresLeftEl.textContent = scoreLeft.toLocaleString()
    scoresRightEl.textContent = scoreRight.toLocaleString()

    // Set crown
    const crownEl = element.children[1]

    // Scores
    if (scoreLeft > scoreRight) {
        scoresLeftEl.classList.remove("team-history-scores-lose")
        scoresLeftEl.classList.add("team-history-scores-win")
        scoresRightEl.classList.add("team-history-scores-lose")
        scoresRightEl.classList.remove("team-history-scores-win")

        crownEl.setAttribute("src", `static/match-history/crown-orange.png`)
    } else if (scoreLeft < scoreRight) {
        scoresLeftEl.classList.add("team-history-scores-lose")
        scoresLeftEl.classList.remove("team-history-scores-win")
        scoresRightEl.classList.remove("team-history-scores-lose")
        scoresRightEl.classList.add("team-history-scores-win")

        crownEl.setAttribute("src", `static/match-history/crown-purple.png`)
    } else {
        scoresLeftEl.classList.add("team-history-scores-lose")
        scoresLeftEl.classList.remove("team-history-scores-win")
        scoresRightEl.classList.add("team-history-scores-lose")
        scoresRightEl.classList.remove("team-history-scores-win")

        crownEl.setAttribute("src", `static/match-history/crown-none.png`)
    }
}