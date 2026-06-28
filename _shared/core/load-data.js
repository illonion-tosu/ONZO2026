let allBeatmaps = []
let allPlayers = []

export async function getBeatmaps() {
    const response = await axios.get("../_data/beatmaps.json")
    allBeatmaps = response.data
    return allBeatmaps
}

export function findBeatmap(beatmap_id) {
    return allBeatmaps.find(beatmap => Number(beatmap.beatmap_id) === Number(beatmap_id))
}

export async function getPlayers() {
    const response = await axios.get("../_data/players.json")
    allBeatmaps = response.data
    return allBeatmaps
}

export function findPlayer(player_id) {
    return allPlayers.find(player => Number(player.player_id) === Number(player_id))
}