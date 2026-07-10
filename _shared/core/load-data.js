let allBeatmaps = []
let allPlayers = []
let api

export async function getBeatmaps() {
    const response = await axios.get("../_data/beatmaps.json")
    allBeatmaps = response.data
    return allBeatmaps
}

export function findBeatmap(beatmap_id) {
    return allBeatmaps.beatmaps.find(beatmap => Number(beatmap.beatmap_id) === Number(beatmap_id))
}

export async function getPlayers() {
    const response = await axios.get("../_data/players.json")
    allPlayers = response.data
    return allPlayers
}

export function findPlayer(player_id) {
    return allPlayers.find(player => player.player_id === player_id)
}

export async function initialiseApi() {
    const response = await axios.get("../_data/osu-api.json")
    api = response.data.api
}

export function getApi() {
    return api
}