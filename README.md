# smash_matchups

Made in response to a comment I saw.

Parses the [smash.gg database](https://github.com/smashdata/ThePlayerDatabase) for matchup information in Smash Ultimate.

## Usage

-   Download the smash.gg database and put it in this root directory

-   Install: `bun install`

-   Run: `bun run main.ts`

Control the minimum number of tournament entries with the entrants command line flag: `bun run main.ts --entrants 100`

-   Output is written to [`output.csv`](./output.csv), ordered from most to least extreme

