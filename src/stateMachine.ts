import Finity from "finity";
import { DiceManager } from "./diceFunctions";
import { event, state } from "./types";
import { config, modes } from "./config";
import { refObject } from "@tabletop-playground/api";

let diceManager = new DiceManager(refObject);

// prettier-ignore
export let stateMachine = createStateMachine();

export function reloadStateMachine() {
  stateMachine = createStateMachine();
}

function createStateMachine() {
  return Finity.configure<state, event>()
    .initialState(state.idle)
    .on(event.button)
    .transitionTo(state.spawnDice)

    .state(state.spawnDice)
    .do((s, c) => diceManager.spawnDice(c.eventPayload))
    .onSuccess()
    .transitionTo(state.waiting)

    .state(state.waiting)
    .on(event.button)
    .transitionTo(state.spawnDice)
    .onTimeout(config.data.rollTimerDelay)
    .transitionTo(state.rollPrep)

    .state(state.rollPrep)
    .do(() => diceManager.setDiceToRoll())
    .onSuccess()
    .transitionTo(state.roll)

    .state(state.roll)
    .onEnter(() => diceManager.rollNextDice())
    .onTimeout(config.data.rollInterval)
    .selfTransition()
    .withCondition(() => diceManager.dicesToRoll.length > 0)
    .transitionTo(state.waitForFlatDice)

    .state(state.waitForFlatDice)
    .onTimeout(10)
    .transitionTo(state.updateResults)
    .withCondition(() => diceManager.areDiceStopped())
    .selfTransition()
    .on(event.button)
    .transitionTo(state.spawnDice)
    .withAction(() => diceManager.clearDice())

    .state(state.updateResults)
    .do(() => diceManager.updateResults())
    .onSuccess()
    .transitionTo(state.checkExploded)
    .withCondition(() => config.data.mode != modes.normal)
    .transitionTo(state.getResults)

    .state(state.checkExploded)
    .do(() => diceManager.getExplodedDice())
    .onSuccess()
    .transitionTo(state.roll)
    .withCondition(() => diceManager.dicesToRoll.length > 0)
    .transitionTo(state.getResults)

    .state(state.getResults)
    .onEnter(() =>
      diceManager.getDiceResult(config.player.getName(), config.data.mode)
    )
    .onTimeout(config.data.clearDelay)
    .transitionTo(state.removeDice)
    .on(event.button)
    .transitionTo(state.spawnDice)
    .withAction(() => diceManager.clearDice())

    .state(state.removeDice)
    .do(() => diceManager.clearDice())
    .onSuccess()
    .transitionTo(state.idle)

    .global()
    .onUnhandledEvent((event, state) =>
      console.log(`Unhandled event '${event}' in state '${state}'.`)
    )
    .onStateChange((oldState, newState) =>
      console.log(
        `Changing state from '${state[oldState]}' to '${state[newState]}'`
      )
    )
    .start();
}
