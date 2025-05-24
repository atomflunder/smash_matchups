import { Database } from "bun:sqlite";
import { parseArgs } from "util";

type Game = {
    winner_id: string;
    loser_id: string;
    winner_score: string | number;
    loser_score: string | number;
    winner_char: string;
    loser_char: string;
    stage: string;
};

type Set = Game[];

type Matchup = {
    char1: string;
    char2: string;
    winsChar1: number;
    winsChar2: number;
    percentage: number;
};

function getAllSets(): Set[] {
    const db = new Database("./ultimate_player_database.db");

    const { values } = parseArgs({
        args: Bun.argv,
        options: {
            entrants: {
                type: "string",
            },
        },
        strict: true,
        allowPositionals: true,
    });

    let entrants = "0";
    if (values.entrants) {
        entrants = values.entrants;
    }

    const query = db.query(
        `SELECT s.game_data
FROM sets s
JOIN tournament_info t ON s.tournament_key = t.key
WHERE s.game_data != '[]'
AND t.entrants >= ${entrants};`
    );

    const allSets = query.all() as { game_data: string }[];

    return allSets.map((s) => JSON.parse(s.game_data));
}

function getMatchupMap(sets: Set[]): Map<string, Matchup> {
    const matchupMap = new Map<string, Matchup>();

    for (const set of sets) {
        if (!set || Object.keys(set).length === 0) {
            continue;
        }

        for (const game of set) {
            const chars = [game.winner_char, game.loser_char].sort();

            let [char1, char2] = chars;

            if (!char1 || !char2) {
                continue;
            }

            char1 = char1.replace("ultimate/", "");
            char2 = char2.replace("ultimate/", "");

            const char1Win = game.winner_char === chars[0];
            const char2Win = game.winner_char === chars[1];

            const mapKey = `${chars[0]}-${chars[1]}`;

            const matchup = matchupMap.get(mapKey);

            if (!matchup) {
                matchupMap.set(mapKey, {
                    char1: char1 || "",
                    char2: char2 || "",
                    winsChar1: Number(char1Win),
                    winsChar2: Number(char2Win),
                    percentage:
                        Number(char1Win) /
                        (Number(char1Win) + Number(char2Win)),
                });

                continue;
            }

            const winsChar1 = matchup.winsChar1 + Number(char1Win);
            const winsChar2 = matchup.winsChar2 + Number(char2Win);
            const percentage = winsChar1 / (winsChar1 + winsChar2);

            matchupMap.set(mapKey, {
                char1,
                char2,
                winsChar1,
                winsChar2,
                percentage,
            });
        }
    }

    return matchupMap;
}

async function writeOutput(matchupMap: Map<string, Matchup>) {
    let str =
        "winner,loser,winner_wins,loser_wins,total_games,win_percentage,lose_percentage\n";

    for (const entry of [...matchupMap.entries()].sort(
        (a, b) =>
            Math.abs(b[1].percentage - 0.5) - Math.abs(a[1].percentage - 0.5)
    )) {
        const { char1, char2, winsChar1, winsChar2, percentage } = entry[1];

        const totalGames = winsChar1 + winsChar2;

        let winner: string;
        let loser: string;
        let winnerWins: number;
        let loserWins: number;

        if (winsChar1 >= winsChar2) {
            winner = char1;
            loser = char2;
            winnerWins = winsChar1;
            loserWins = winsChar2;
        } else {
            winner = char2;
            loser = char1;
            winnerWins = winsChar2;
            loserWins = winsChar1;
        }

        const winPercent = percentage * 100;
        const losePercent = 100 - winPercent;

        str += `${winner},${loser},${winnerWins},${loserWins},${totalGames},${winPercent.toFixed(
            2
        )},${losePercent.toFixed(2)}\n`;
    }

    await Bun.write("./output.csv", str);
}

await writeOutput(getMatchupMap(getAllSets()));

