import { DataLoader, Village } from "./DataLoader";
import { Command, groupCommandsByPlayer, printPlan } from "./Printer";
import {
  calculateLaunchTime,
  NAZ_TRIBE_ID,
  TARGET_NOBLE_COUNT,
  TARGET_OFF_COUNT,
} from "./Utils";

// ------- LOAD DATA -------
const dl = new DataLoader();
await dl.load();

// ------- GENERATE COMMANDS -------
const COMMANDS_LIST: Command[] = [];

console.log({
  "Available Off": dl.availableOff.length,
  "True Targets": dl.trueTargets.length,
  "Fake Targets": dl.fakeTargets.length,
});

// For each true target we need to find 5 off commands and 5 true noble commands
function processTargets(
  targets: Village[],
  isFake: boolean,
  assignNobles?: boolean,
  assignOff?: boolean
) {
  for (const target of targets) {
    let assignedNoblesCheck = 0;
    let assignedOffCheck = 0;

    const missingNobles = assignNobles
      ? TARGET_NOBLE_COUNT - target.sentNobles
      : 0;
    const missingOff = assignOff ? TARGET_OFF_COUNT - target.sentOff : 0;
    // console.log("Target is: ", target.toString());

    let targetResolved = false;
    // const nearestPlayers = dl.nearestPlayers(
    //   target,
    //   NAZ_TRIBE_ID,
    //   !isFake,
    //   missingOff,
    //   missingNobles
    // );

    const nearestVillages = dl.nearestVillages(target, assignNobles);

    //const village = nearestVillages[0]
    for (const village of nearestVillages) {

      if (targetResolved) continue;

      if (isFake && village.fakesAvailable <= 0) continue;
      if (!isFake && !village.offAvailable) continue;

      const player = dl.playerById(village.playerId)!;
      //if (!player) continue;  //******************************************* */
      //console.log(player.id);
      if (assignNobles && player.usedNobles >= player.totalNobles) continue;

      if (assignNobles) {
        const distance = Math.sqrt(
          Math.pow(parseInt(village.x) - parseInt(target.x), 2) +
            Math.pow(parseInt(village.y) - parseInt(target.y), 2)
        );

        if (distance >= 70) {
          continue;
        }

        village.assignedNobles += 1;
        target.sentNobles += 1;
        player.usedNobles += 1;

        village.fakesAvailable -= isFake ? 1 : 0;
        if (!isFake) village.offAvailable = false;

        COMMANDS_LIST.push({
          target: target,
          targetPlayer: dl.playerById(target.playerId)!,
          source: village,
          sourcePlayer: dl.playerById(village.playerId)!,
          isHeavyAttack: !isFake,
          isNoble: true,
        });

        assignedNoblesCheck += 1;
      } else if (assignOff) {
        target.sentOff += 1;
        COMMANDS_LIST.push({
          target: target,
          targetPlayer: dl.playerById(target.playerId)!,
          source: village,
          sourcePlayer: dl.playerById(village.playerId)!,
          isHeavyAttack: !isFake,
          isNoble: false,
        });

        if (!isFake) village.offAvailable = false;
        village.fakesAvailable -= isFake ? 1 : 0;
        assignedOffCheck += 1;
      }

      targetResolved =
        assignedNoblesCheck >= missingNobles && assignedOffCheck >= missingOff;
    }


    // for (const result of nearestPlayers) {
    //   if (targetResolved) continue;

    //   // console.log(
    //   //   `Target ${target.toString()} needs ${missingNobles} nobles and ${missingOff} offs`
    //   // );
    //   const player = dl.playerById(result.id);
    //   if (!player) continue;

    //   // Check if player has enough available fakes
    //   if (isFake) {
    //     let currentlyAvailableFakes = result.villages.reduce((acc, v) => {
    //       return v.fakesAvailable + acc;
    //     }, 0);

    //     if (currentlyAvailableFakes < missingNobles + missingOff) {
    //       continue;
    //     }
    //   }

    //   // Check if player has enough available offs
    //   else {
    //     let currentlyAvailableOffs = result.villages.reduce((acc, v) => {
    //       if (v.offAvailable) return acc + 1;
    //       return acc;
    //     }, 0);

    //     if (currentlyAvailableOffs < missingNobles + missingOff) {
    //       continue;
    //     }
    //   }

    //   // Assign nobles first
    //   let playerAssignedNobles = 0;
    //   let playerAssignedOffs = 0;

    //   if (assignNobles) {
    //     for (const village of result.villages) {
    //       if (player.usedNobles >= player.totalNobles) continue;

    //       if (!isFake && !village.offAvailable) continue;
    //       if (isFake && village.fakesAvailable <= 0) continue;

    //       const distance = Math.sqrt(
    //         Math.pow(parseInt(village.x) - parseInt(target.x), 2) +
    //           Math.pow(parseInt(village.y) - parseInt(target.y), 2)
    //       );

    //       if (distance >= 70) {
    //         continue;
    //       }

    //       if (!isFake) village.offAvailable = false;

    //       village.assignedNobles += 1;
    //       target.sentNobles += 1;
    //       player.usedNobles += 1;
    //       playerAssignedNobles += 1;

    //       village.fakesAvailable -= isFake ? 1 : 0;

    //       COMMANDS_LIST.push({
    //         target: target,
    //         targetPlayer: dl.playerById(target.playerId)!,
    //         source: village,
    //         sourcePlayer: player,
    //         isHeavyAttack: !isFake,
    //         isNoble: true,
    //       });

    //       // console.log(
    //       //   `Assigned noble from ${village.toString()} to ${target.toString()}`
    //       // );

    //       assignedNoblesCheck += 1;

    //       if (assignedNoblesCheck >= missingNobles) {
    //         break;
    //       }
    //     }
    //   }
    //   // Assign off

    //   if (assignOff) {
    //     for (const village of result.villages) {
    //       if (!isFake && !village.offAvailable) continue;
    //       if (isFake && village.fakesAvailable <= 0) continue;

    //       target.sentOff += 1;
    //       COMMANDS_LIST.push({
    //         target: target,
    //         targetPlayer: dl.playerById(target.playerId)!,
    //         source: village,
    //         sourcePlayer: player,
    //         isHeavyAttack: !isFake,
    //         isNoble: false,
    //       });

    //       if (!isFake) village.offAvailable = false;
    //       village.fakesAvailable -= isFake ? 1 : 0;
    //       playerAssignedOffs += 1;
    //       assignedOffCheck += 1;

    //       if (assignedOffCheck >= missingOff) {
    //         break;
    //       }
    //     }
    //   }

    //   // console.log(
    //   //   `Player ${
    //   //     player.name
    //   //   } assigned ${playerAssignedNobles} nobles and ${playerAssignedOffs} offs towards target ${target.toString()}`
    //   // );

    //   targetResolved =
    //     assignedNoblesCheck >= missingNobles && assignedOffCheck >= missingOff;
    // }
  }
}

processTargets(dl.trueTargets, false, true, false);
processTargets(dl.fakeTargets, true, true, false);
processTargets(dl.trueTargets, false, false, true);
processTargets(dl.fakeTargets, true, false, true);

COMMANDS_LIST.forEach((command) => {
  const launchTime = calculateLaunchTime(
    command.source,
    command.target,
    command.isNoble
  );

  command.launchTime = launchTime;
});

// ------- PRINT COMMANDS -------

const commandsByPlayer = groupCommandsByPlayer(COMMANDS_LIST);

for (const player of dl.players.filter((p) => p.tribeId === NAZ_TRIBE_ID)) {
  if (!commandsByPlayer[player.id]) {
    console.log(`Player ${player.name} has no commands`);
    continue;
  }

  let playerPlan = ``;
  playerPlan += printPlan(commandsByPlayer, player.id, true, player.name);
  playerPlan += printPlan(commandsByPlayer, player.id, false, player.name);
}

// ------- CHECK COMMANDS -------

console.log("Total commands:", COMMANDS_LIST.length);

const offCommands = COMMANDS_LIST.filter((c) => !c.isNoble).length;
const assignedOffs = dl.trueTargets.reduce((acc, t) => {
  return acc + t.sentOff;
}, 0);
const assignedFakeOffs = dl.fakeTargets.reduce((acc, t) => {
  return acc + t.sentOff;
}, 0);

const totalTargets = dl.trueTargets.length + dl.fakeTargets.length;
console.log(
  `[OFF] Comandi totali ${offCommands} / ${totalTargets * TARGET_OFF_COUNT}`
);
console.log(
  `[OFF] Comandi target veri: ${assignedOffs} / ${
    dl.trueTargets.length * TARGET_OFF_COUNT
  }`
);
console.log(
  `[OFF] Comandi target fake: ${assignedFakeOffs} / ${
    dl.fakeTargets.length * TARGET_OFF_COUNT
  }`
);

const nobleCommands = COMMANDS_LIST.filter((c) => c.isNoble).length;
const assignedNobles = dl.trueTargets.reduce((acc, t) => {
  return acc + t.sentNobles;
}, 0);
const assignedFakeNobles = dl.fakeTargets.reduce((acc, t) => {
  return acc + t.sentNobles;
}, 0);

console.log(
  `[NOBLES] Comandi totali ${nobleCommands} / ${
    totalTargets * TARGET_NOBLE_COUNT
  }`
);
console.log(
  `[NOBLES] Comandi target veri: ${assignedNobles} / ${
    dl.trueTargets.length * TARGET_NOBLE_COUNT
  }`
);
console.log(
  `[NOBLES] Comandi target fake: ${assignedFakeNobles} / ${
    dl.fakeTargets.length * TARGET_NOBLE_COUNT
  }`
);

for (const target of dl.trueTargets) {
  if (
    target.sentNobles >= TARGET_NOBLE_COUNT &&
    target.sentOff >= TARGET_OFF_COUNT
  )
    continue;
  console.log(
    `TRUE Target ${target.toString()} has ${target.sentNobles} nobles and ${
      target.sentOff
    } offs`
  );
}

//for (const target of dl.fakeTargets) {
//  if (
//    target.sentNobles >= TARGET_NOBLE_COUNT &&
//    target.sentOff >= TARGET_OFF_COUNT
//  )
//    continue;
//  console.log(
//    `FAKE Target ${target.toString()} has ${target.sentNobles} nobles and ${
//      target.sentOff
//    } offs`
//  );
//}

// Check how many free nobles and offs we have left
//for (const player of dl.players.filter((p) => p.tribeId === NAZ_TRIBE_ID)) {
//  console.log(
//    `Player ${player.name} has ${
//      player.totalNobles - player.usedNobles
//    } nobles left`
//  );
//}

//for (const village of dl.availableOff) {
//  if (!village.offAvailable) continue;
//  console.log(`Village ${village.toString()} has available off`);
//}



// ------- HANDLE MISSING COMMANDS -------
// for (const player of dl.players.filter((p) => p.tribeId === NAZ_TRIBE_ID)) {
//   console.log(
//     `Player ${player.name} has ${
//       player.totalNobles - player.usedNobles
//     } nobles left`
//   );
// }

// const missingFakeNoblesCount = MISSING_NOBLES.reduce((acc, n) => {
//   return acc + n.fakeAmount;
// }, 0);

// console.log("Missing fake nobles:", missingFakeNoblesCount);

// const missingTrueNoblesCount = MISSING_NOBLES.reduce((acc, n) => {
//   return acc + n.trueAmount;
// }, 0);

// console.log("Missing true nobles:", missingTrueNoblesCount);

// const missingFakeOffCount = MISSING_OFF.reduce((acc, n) => {
//   return acc + n.fakeAmount;
// }, 0);

// console.log("Missing fake off:", missingFakeOffCount);

// const missingTrueOffCount = MISSING_OFF.reduce((acc, n) => {
//   return acc + n.trueAmount;
// }, 0);

// console.log("Missing true off:", missingTrueOffCount);

// console.log("Total commands:", COMMANDS_LIST.length);
