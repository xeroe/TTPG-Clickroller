/**
 * @fileoverview Configuration module for handling dice rolling settings.
 * @module Config
 */

import { GameObject, Player, refObject } from "@tabletop-playground/api";
import { DiceType } from "./types";
/**
 * The key used for storing and retrieving configuration data.
 */
const KEY = "clickroller";

/**
 * Enumeration representing different rolling modes.
 */
export enum modes {
  normal = 0, // Standard rolling mode
  exploding = 1, // Exploding dice rolling mode
  savage_worlds = 2, // Savage Worlds dice rolling mode
}

export enum iconStyle {
  outline = 0,
  filled,
}

export const defaultDiceList: Array<DiceType> = [
  { faces: 4, guid: "1885447D4CF808B36797CFB1DD679BAC" },
  { faces: 6, guid: "A897158B490E36F0911B03B3BE9BA52A" },
  { faces: 8, guid: "10614E404E82F969E6CFD48CAC80F363" },
  { faces: 10, guid: "9065AC5141F87F8ADE1F5AB6390BBEE4" },
  { faces: 12, guid: "9FD625E14B5EEEA9C6C998B2DB3E9085" },
  { faces: 20, guid: "0A2C628E4A706A123AA3CF9C34CAB9A1" },
];

/**
 * Interface representing configuration data.
 */
type configdata = {
  rollTimerDelay: number; // Delay before automatic rolling starts
  rollInterval: number; // Interval between dice rolls
  clearDelay: number; // Delay before clearing the dice
  mode: number; // Current rolling mode
  iconStyle: number;
  diceList: Array<DiceType>;
};

/**
 * Class for managing configuration settings.
 */
export class Config {
  /**
   * Initializes configuration data by loading it from saved data.
   */
  constructor(refObject: GameObject) {
    this.refObject = refObject;
    try {
      this.data = JSON.parse(refObject.getSavedData(KEY));
    } catch (error) {
      this.data = {
        rollTimerDelay: 1000,
        rollInterval: 200,
        clearDelay: 3000,
        mode: modes.normal, // Current rolling mode
        iconStyle: iconStyle.outline,
        diceList: defaultDiceList,
      };
      this.save();
    }
  }

  resetData() {
    this.data = {
      rollTimerDelay: 1000,
      rollInterval: 200,
      clearDelay: 3000,
      mode: modes.normal, // Current rolling mode
      iconStyle: iconStyle.outline,
      diceList: defaultDiceList,
    };
  }

  /** Configuration data */
  data: configdata;
  refObject: GameObject;
  player: Player = new Player();

  /**
   * Saves the current configuration data.
   */
  async save() {
    console.log("a");
    await this.refObject.setSavedData(JSON.stringify(this.data), KEY);
    console.log("b");
  }
}

export const config = new Config(refObject);
