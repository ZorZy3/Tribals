import { Player, Village } from "./DataLoader";

export const NAZ_TRIBE_ID = "13";
export const OP_ARRIVAL_DATE = new Date("2024-10-15T10:15:00Z");
export const NOBLE_ARRIVAL_DATE = new Date("2024-10-15T10:30:00Z");

export const TARGET_OFF_COUNT = 5;
export const TARGET_NOBLE_COUNT = 5;

export const calculateLaunchTime = (
  source: Village,
  target: Village,
  isNoble: boolean
) => {
  // minutes
  const RAM_SPEED = 30;
  const NOBLE_SPEED = 35;

  const arrivalDate = isNoble ? NOBLE_ARRIVAL_DATE : OP_ARRIVAL_DATE;

  const distance = Math.abs(
    Math.sqrt(
      Math.pow(parseInt(target.x) - parseInt(source.x), 2) +
        Math.pow(parseInt(target.y) - parseInt(source.y), 2)
    )
  );

  const speed = isNoble ? NOBLE_SPEED : RAM_SPEED;

  const travelTime = distance * speed;

  return new Date(arrivalDate.getTime() - travelTime * 60 * 1000);
};
