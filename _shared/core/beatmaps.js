let allBeatmaps = []

export async function getBeatmaps() {
    const response = await axios.get("../_data/beatmaps.json")
    allBeatmaps = response.data
    return allBeatmaps
}