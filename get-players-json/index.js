const textareaEl = document.getElementById("textarea")
let teamStats = []
async function submit() {
    const textareaElValue = textareaEl.value
    const textAreaElValueSplit = textareaElValue.split("\n")
    for (let i = 0; i < textAreaElValueSplit.length; i++) {
        const textAreaElValueSplitSplit = textAreaElValueSplit[i].split("\t")
        const teamStat = {
            "player_name": textAreaElValueSplitSplit[0],
            "player_seed": Number(textAreaElValueSplitSplit[1]),
        }
        teamStats.push(teamStat)
    }

    const jsonString = JSON.stringify(teamStats, null, 4)
    const blob = new Blob([jsonString], { type: "application/json" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = "players.json"
    link.click()
}