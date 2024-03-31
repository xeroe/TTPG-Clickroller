import {
  world,
  GameObject,
  ObjectType,
  Dice,
  Color,
  Vector,
  Rotator,
} from "@tabletop-playground/api";
import "util";
import { randomInt } from "./util";
import { event, DiceType, eDice } from "./types";
import { config, modes, defaultDiceList } from "./config";

export class DiceManager {
  constructor(refObject: GameObject) {
    this.refObject = refObject;
  }
  private refObject: GameObject;
  public diceArray: Array<eDice> = [];
  public dicesToRoll: Array<eDice> = [];
  public dicesToCheck: Array<eDice> = [];

  public setWildDie(enable: boolean) {
    if (enable) {
    }
  }

  public async spawnDice(d: number) {
    const baseVector = this.refObject.getPosition().clone().add([0, 5, 1]);
    let template = config.data.diceList[d] || defaultDiceList[d];

    let newGameObj = world.createObjectFromTemplate(template.guid, baseVector);
    if (!(newGameObj instanceof Dice)) {
      newGameObj?.destroy();
      console.log("error: object is no dice. check template");
      return;
    }
    const newDice = newGameObj as Dice;

    newDice.setObjectType(ObjectType.NonInteractive);
    newDice.setCurrentFace(randomInt(0, newDice.getNumFaces()));
    newDice.setFriction(0.1);
    newDice.setDensity(5);
    if (template.primaryColor) newDice.setPrimaryColor(template.primaryColor);
    if (template.secondaryColor)
      newDice.setSecondaryColor(template.secondaryColor);

    this.diceArray.push({
      dice: newDice,
      results: [],
      wildDie: config.data.mode === modes.savage_worlds && d === 5,
    });
    console.log(d);
    if (config.data.mode === modes.savage_worlds && d === 5)
      console.log("WILD");
    this.rearrangeDice();
  }

  private rearrangeDice() {
    const baseVector = this.refObject.getPosition().clone().add([0, 5, 1]);
    const spacing =
      (this.refObject.getSize().x + 5) / (this.diceArray.length + 1);
    baseVector.x -= (spacing * (this.diceArray.length + 1)) / 2;
    for (let i = 0; i < this.diceArray.length; i++) {
      baseVector.x += spacing;
      this.diceArray[i].dice.setPosition(baseVector);
    }
  }

  public async setDiceToRoll(dicelist: Array<eDice> = this.diceArray) {
    this.dicesToRoll = [...dicelist];
  }

  public async rollNextDice() {
    let edice = this.dicesToRoll.pop();
    if (edice) {
      edice.dice.setObjectType(ObjectType.Penetrable);
      edice.dice.roll();
      edice.dice.setObjectType(ObjectType.Ground);
      this.dicesToCheck.push(edice);
    }
  }

  public areDiceStopped() {
    let allDiceStopped = false;
    allDiceStopped = this.diceArray.every(
      (dice) =>
        dice.dice.getLinearVelocity().magnitude() === 0 &&
        dice.dice.getAngularVelocity().equals([0, 0, 0], 0)
    );
    return allDiceStopped;
  }

  public async updateResults() {
    for (let edice of this.dicesToCheck) {
      edice.results.push(edice.dice.getCurrentFaceIndex() + 1);
    }
    this.dicesToCheck = [];
  }

  public async getExplodedDice() {
    this.dicesToRoll = this.diceArray.filter(
      (dice) => dice.dice.getCurrentFaceIndex() + 1 === dice.dice.getNumFaces()
    );
  }

  private isDiceFlat(dice: Dice): boolean {
    const faceIndex = dice.getCurrentFaceIndex();
    const faceDirections = dice.getFaceDirections();
    const rotation = dice.getRotation();

    const faceVector = faceDirections[faceIndex];
    const rotatedFaceVector = rotation.rotateVector(faceVector);

    const dotProduct = 1 - rotatedFaceVector.dot(new Vector(0, 0, 1));

    return Math.abs(dotProduct) < 0.001;
  }

  public async rerollTiltedDice(dicelist: Array<eDice> = this.diceArray) {
    console.log("check");
    for (let dice of dicelist) {
      if (!this.isDiceFlat(dice.dice)) {
        dice.dice.roll();
      }
    }
    await this.areDiceStopped();
  }

  public async getDiceResult(playerName: string = "", mode?: number) {
    const isSwadeRoll: Boolean =
      this.diceArray.find((obj) => obj.wildDie === true) != undefined;

    const formattedResults = this.diceArray
      .map((dice) => {
        if (dice.results.length > 1) {
          const resultSum = dice.results.reduce(
            (sum, result) => sum + result,
            0
          );
          return `(${dice.results.join("+")})`;
        } else {
          return dice.results[0].toString(); // Um sicherzustellen, dass der Wert ein string ist
        }
      })
      .join(isSwadeRoll ? ", " : "+");

    if (isSwadeRoll) {
      const highestResult = this.diceArray
        .flatMap((dice) => dice.results)
        .reduce((max, result) => (result > max ? result : max), 0);
      world.broadcastChatMessage(
        `${playerName} rolled: ${highestResult}` // (${formattedResults}) ` // Änderung hier
      );
    } else {
      const total = this.diceArray
        .flatMap((dice) => dice.results)
        .reduce((sum, result) => sum + result, 0);

      world.broadcastChatMessage(
        `${playerName} rolled: ${formattedResults} = ${total}`
      );
    }
  }

  public async clearDice() {
    console.log("Removing all dices");
    for (let dice of this.diceArray) {
      dice.dice.destroy();
    }
    this.diceArray = [];
  }
}
