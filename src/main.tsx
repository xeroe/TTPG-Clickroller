import {
  refObject,
  Button,
  Player,
  SnapPoint,
  GameObject,
  Dice,
  Text,
  UIElement,
  Vector,
  Rotator,
  ContentButton,
} from "@tabletop-playground/api";

import { createClickUi, createIcons } from "./ui/clickbuttons";
import { createSettingsUi } from "./ui/settings";
import { stateMachine } from "./stateMachine";
import { event, state } from "./types";
import { config } from "./config";
/**
 * Configuration settings of the eiller.
 */

let currentPlayer = new Player();
/**
 * An event handler for button clicks.
 * @param {Button} button The clicked button.
 * @param {Player} player The player who clicked the button.
 */
const clickHandler = (button: Button, player: Player) => {
  stateMachine.handle(event.button, parseInt(button.getText()));
  config.player = player;
};

/**
 * Creates the UI for click buttons and adds it to the reference object.
 */

refObject.addUI(createClickUi(clickHandler));
createIcons(config);

async function snapHandler(
  object: GameObject,
  player: Player,
  snapPoint: SnapPoint
) {
  let ref = snapPoint.getParentObject();
  if (object instanceof Dice && object.isValid() && ref instanceof GameObject) {
    let dice = object as Dice;
    let index = 5 - snapPoint.getIndex();

    config.data.diceList[index].guid = dice.getTemplateId();
    config.data.diceList[index].faces = dice.getNumFaces();
    config.data.diceList[index].primaryColor = dice.getPrimaryColor();
    config.data.diceList[index].secondaryColor = dice.getSecondaryColor();
    config.save();
    createIcons(config, ref);

    await new Promise((resolve) => setTimeout(resolve, 500));
    if (object.isValid()) object.destroy();
  }
}
/**
 * Adds a custom "Settings" action to the reference object.
 */
//world.startDebugMode();
refObject.addCustomAction("Settings", "Settings", "Settings");
refObject.onCustomAction.add((object, player) =>
  createSettingsUi(config, object)
);
refObject.onSnappedTo.add(snapHandler);
