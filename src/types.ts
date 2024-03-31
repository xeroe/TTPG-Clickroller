import { Color, Dice } from "@tabletop-playground/api";

export interface DiceType {
  faces: number;
  guid: string;
  primaryColor?: Color;
  secondaryColor?: Color;
}

export type eDice = { dice: Dice; results: Array<number>; wildDie: Boolean }; // edice = extended dice (dice with result log)

export enum state {
  idle,
  spawnDice,
  waiting,
  roll,
  rollPrep,
  waitForFlatDice,
  updateResults,
  checkExploded,
  getResults,
  removeDice,
}

export enum event {
  button,
  rolled,
  flat,
}
