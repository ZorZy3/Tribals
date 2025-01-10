//@ts-ignore
import fs from "fs";
import { parse } from "csv-parse/sync";
import { TARGET_NOBLE_COUNT, TARGET_OFF_COUNT } from "./Utils";

export class Player {
  id: string;
  name: string;
  tribeId: string;
  villageCount: string;
  points: string;
  rank: string;
  totalNobles: number;
  usedNobles: number;
}

Player.prototype.toString = function () {
  return `${this.name}`;
};

export class Village {
  // Constructor with all optional fields
  constructor({
    id = "",
    name = "",
    x = "",
    y = "",
    playerId = "",
    points = "",
    assignedNobles = 0,
    offAvailable = true,
    fakesAvailable = 4,
    player = null,
  }: any) {
    this.id = id;
    this.name = name;
    this.x = x;
    this.y = y;
    this.playerId = playerId;
    this.points = points;
    this.assignedNobles = assignedNobles;
    this.offAvailable = offAvailable;
    this.fakesAvailable = fakesAvailable;
    this.player = player;

    this.sentNobles = 0;
    this.sentOff = 0;
  }

  id: string;
  name: string;
  x: string;
  y: string;
  playerId: string;
  points: string;
  assignedNobles: number;
  offAvailable: boolean;
  fakesAvailable: number;
  player: Player;

  sentNobles: number;
  sentOff: number;

  public toString() {
    return `${this.name} (${this.x}|${this.y}) [${this.player?.name}]`;
  }
}

export class DataLoader {
  players: Player[] = [];
  villaggi: Village[] = [];

  availableOff: Village[] = [];
  trueTargets: Village[] = [];
  fakeTargets: Village[] = [];

  constructor() {}

  readFile(path: string) {
    const data = fs.readFileSync(path, { encoding: "utf8", flag: "r" });
    return data;
  }

  async load() {
    await this.loadPlayer();
    await this.loadVillaggi();
    await this.loadOffNaz();
    await this.loadTrueTargets();
    await this.loadFakeTargets();
    await this.loadMaxNobles();
  }

  private async loadOffNaz() {
    const off_naz = this.readFile("data/NAZ_OFF.txt");

    const coords = off_naz.split("\n").map((line) => {
      const [x, y] = line.split("|");
      return { x, y };
    });

    this.availableOff = coords.map((c) => this.villageByCoords(c.x, c.y));
  }

  private async loadTrueTargets() {
    const true_targets = this.readFile("data/TARGET_VERI.txt");

    const coords = true_targets.split("\n").map((line) => {
      const [x, y] = line.split("|");
      return { x, y };
    });

    this.trueTargets = coords.map((c) => this.villageByCoords(c.x, c.y));
  }

  private async loadFakeTargets() {
    const fake_targets = this.readFile("data/TARGET_FAKE.txt");

    const coords = fake_targets.split("\n").map((line) => {
      const [x, y] = line.split("|");
      return { x, y };
    });

    this.fakeTargets = coords.map((c) => this.villageByCoords(c.x, c.y));
  }

  private async loadPlayer() {
    const fileData = this.readFile("data/players.csv");

    const records = parse(fileData, {
      columns: true,
      skip_empty_lines: true,
    });

    this.players = records.map(
      (record: any) =>
        ({
          id: record["id"] ?? "0",
          name: record["name"] ?? "a",
          tribeId: record["tribe_id"] ?? "0",
          villageCount: record["village_count"] ?? "0",
          points: record["points"] ?? "0",
          rank: record["rank"] ?? "0",
          totalNobles: 0,
          usedNobles: 0,
        } as Player)
    );

    //console.log(this.players.map(p => p.id));
    //console.log(records);

  }

  private async loadVillaggi() {
    const fileData = this.readFile("data/village.csv");

    const records = parse(fileData, {
      columns: true,
      skip_empty_lines: true,
    });

    this.villaggi = records.map(
      (record: any) =>
        new Village({
          id: record["id"],
          name: decodeURIComponent(record["name"]),
          x: record["x"],
          y: record["y"],
          playerId: record["player_id"],
          points: record["points"],
          assignedNobles: 0,
          offAvailable: true,
          fakesAvailable: 3,
          player: this.playerById(record["player_id"]),
        })
    );
  }

  private async loadMaxNobles() {
    const fileData = this.readFile("data/PLAYER_MAX_NOBILI.csv");

    const records = parse(fileData, {
      columns: true,
      skip_empty_lines: true,
    });

    let total = 0;

    const maxNobles = records as { name: string; max_nobles: string }[];

    maxNobles.forEach((mn) => {
      const player = this.players.find((p) => p.name === mn.name);
      if (player) {
        // console.log(`Player ${player.name} has ${mn.max_nobles} nobles`);
        total += parseInt(mn.max_nobles);
        player.totalNobles = parseInt(mn.max_nobles);
      }
    });

    console.log(`Total nobles: ${total}`);
  }

  playerById(id: string) {
    return this.players.find((p) => p.id === id);
  }

  playerByVillageCoords(x: string, y: string) {
    const village = this.villaggi.find((v) => v.x === x && v.y === y);
    if (!village) return null;
    return this.players.find((p) => p.id === village.playerId);
  }

  villageByCoords(x: string, y: string) {
    return this.villaggi.find((v) => v.x === x && v.y === y);
  }

  nearestVillages(target: Village, near?: boolean) {
    const x = parseInt(target.x);
    const y = parseInt(target.y);

    const nearest = this.availableOff
      .filter((v) => v.x !== target.x && v.y !== target.y)
      .map((v) => {
        const vx = parseInt(v.x);
        const vy = parseInt(v.y);

        const dist = Math.sqrt((vx - x) ** 2 + (vy - y) ** 2);

        return { village: v, dist };
      })
      .sort((a, b) => (near ? a.dist - b.dist : b.dist - a.dist));

    return nearest.map((n) => n.village);
  }

  // Find nearest village to a given village
  // nearestPlayers(
  //   village: Village,
  //   targetTribeId: string,
  //   isHeavy: boolean,
  //   targetOffCount: number,
  //   targetNobleCount: number
  // ): {
  //   id: string;
  //   name: string;
  //   villages: Village[];
  //   distanceSum: number;
  //   distanceAvg?: number;
  // }[] {
  //   const x = parseInt(village.x);
  //   const y = parseInt(village.y);

  //   const nearest = this.availableOff
  //     .filter((v) => v.x !== village.x && v.y !== village.y)
  //     .filter((v) => this.playerById(v.playerId)?.tribeId === targetTribeId)
  //     .filter((v) => !isHeavy || v.offAvailable)
  //     .filter((v) => isHeavy || v.fakesAvailable >= 0)
  //     .map((v) => {
  //       const vx = parseInt(v.x);
  //       const vy = parseInt(v.y);

  //       const dist = Math.sqrt((vx - x) ** 2 + (vy - y) ** 2);

  //       return { village: v, dist };
  //     })
  //     .sort((a, b) => a.dist - b.dist);

  //   const offByPlayer = {};
  //   const noblesByPlayer = {};

  //   let result = nearest.reduce((acc, v) => {
  //     const player = this.playerById(v.village.playerId)!;

  //     if (!offByPlayer[player.id]) {
  //       offByPlayer[player.id] = 0;
  //     }

  //     if (!noblesByPlayer[player.id]) {
  //       noblesByPlayer[player.id] = 0;
  //     }

  //     if (
  //       offByPlayer[player.id] >= TARGET_OFF_COUNT * 2 &&
  //       noblesByPlayer[player.id] >= TARGET_NOBLE_COUNT * 2
  //     ) {
  //       return acc;
  //     }

  //     // if isHeavy is true the off is always available
  //     if (isHeavy) {
  //       if (noblesByPlayer[player.id] < targetNobleCount) {
  //         noblesByPlayer[player.id]++;
  //       } else if (offByPlayer[player.id] < targetOffCount) {
  //         offByPlayer[player.id]++;
  //       }
  //     }

  //     const playerData = acc.find((p) => p.id === player.id);

  //     if (playerData) {
  //       playerData.villages.push(v.village);
  //       playerData.distanceSum += v.dist;
  //     } else {
  //       acc.push({
  //         id: player.id,
  //         name: player.name,
  //         villages: [v.village],
  //         distanceSum: v.dist,
  //       });
  //     }

  //     return acc;
  //   }, [] as { id: string; name: string; villages: Village[]; distanceSum: number }[]);

  //   const players = result.map((r) => ({
  //     ...r,
  //     distanceAvg: r.distanceSum / r.villages.length,
  //   }));

  //   players.sort((a, b) => a.distanceAvg - b.distanceAvg);

  //   return players;
  // }
}
