import { DataLoader, Player, Village } from "./DataLoader";

export interface Command {
  target: Village;
  targetPlayer: Player;
  source: Village;
  sourcePlayer: Player;
  isHeavyAttack: boolean;
  isNoble: boolean;
  launchTime?: Date;
}

export const groupCommandsByPlayer = (commandList: Command[]) => {
  // Group commands by player
  const commandsByPlayer: Record<string, Command[]> = {};

  for (const command of commandList) {
    if (!commandsByPlayer[command.sourcePlayer.id]) {
      commandsByPlayer[command.sourcePlayer.id] = [];
    }

    commandsByPlayer[command.sourcePlayer.id].push(command);
  }

  return commandsByPlayer;
};

export const printPlan = (
  commandsByPlayer: Record<string, Command[]>,
  playerId: string,
  isNoble?: boolean,
  playerName?: string
) => {
  let plan = `\n\nPlayer ${playerName} - ${
    isNoble ? "Noble" : "Ram"
  } attacks\n`;

  const count = commandsByPlayer[playerId].filter(
    (c) => c.isNoble === isNoble
  ).length;

  console.log(
    `\n\nPlayer ${playerName} - ${count} ${isNoble ? "Noble" : "Ram"} attacks`
  );

  // Sort commands by launch time

  commandsByPlayer[playerId].sort((a, b) => {
    if (!a.launchTime || !b.launchTime) {
      throw new Error("Command doesn't have launch time");
    }

    return a.launchTime.getTime() - b.launchTime.getTime();
  });

  for (const command of commandsByPlayer[playerId]) {
    if (isNoble && !command.isNoble) continue;
    if (!isNoble && command.isNoble) continue;

    const distance =
      Math.round(
        Math.sqrt(
          Math.pow(parseInt(command.target.x) - parseInt(command.source.x), 2) +
            Math.pow(parseInt(command.target.y) - parseInt(command.source.y), 2)
        ) * 100
      ) / 100;
    const unit = command.isNoble ? "snob" : "ram";

    if (!command.launchTime)
      throw new Error("Command doesn't have launch time");

    const hours =
      command.launchTime.getHours() < 10
        ? `0${command.launchTime.getHours()}`
        : command.launchTime.getHours();
    const minutes =
      command.launchTime.getMinutes() < 10
        ? `0${command.launchTime.getMinutes()}`
        : command.launchTime.getMinutes();
    const seconds =
      command.launchTime.getSeconds() < 10
        ? `0${command.launchTime.getSeconds()}`
        : command.launchTime.getSeconds();

    const day =
      command.launchTime.getDate() < 10
        ? `0${command.launchTime.getDate()}`
        : command.launchTime.getDate();

    const month =
      command.launchTime.getMonth() < 10
        ? `0${command.launchTime.getMonth()}`
        : command.launchTime.getMonth();

    const formattedLaunchTime = `[b]${hours}:${minutes}:${seconds}[/b] ${day}/${month}`;

    if (command.isNoble && distance > 70) {
      throw new Error("Noble is too far from target");
    }

    const planRow = `${
      command.isHeavyAttack ? "V" : "F"
    } [unit]${unit}[/unit] ${formattedLaunchTime} | ${command.source.x}|${
      command.source.y
    } > ${command.target.x}|${command.target.y} [url=game.php?village=${
      command.source.id
    }&screen=place&target=${command.target.id}]Attack[/url]`;
    console.log(planRow);

    plan += planRow + "\n";
  }

  return plan;
};

export const printAllPlans = (dl: DataLoader, commandList: Command[]) => {
  const commandsByPlayer = groupCommandsByPlayer(commandList);

  // Print commands by player
  for (const playerId in commandsByPlayer) {
    const player = dl.playerById(playerId);
    if (!player) continue;

    if (player.name !== "CANEMINI") continue;

    console.log(`\n\nPlayer ${player.name} (${player.id})`);

    // Sort commands by launch time
    commandsByPlayer[playerId].sort((a, b) => {
      if (!a.launchTime || !b.launchTime) {
        throw new Error("Command doesn't have launch time");
      }

      return a.launchTime.getTime() - b.launchTime.getTime();
    });

    printPlan(commandsByPlayer, playerId, true);
  }
};
