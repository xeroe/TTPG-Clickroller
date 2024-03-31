/**
 * @fileoverview Functions for creating UI elements and buttons.
 * @module UI
 */

import {
  UIElement,
  Vector,
  Rotator,
  refObject,
  GameObject,
} from "@tabletop-playground/api";
import { jsxInTTPG, render } from "jsx-in-ttpg";
import { Config, iconStyle, modes } from "../config";

/**
 * Creates a vertical UI element with buttons for clicking.
 * @param {Function} clickHandler The handler function for button clicks.
 * @returns {UIElement} The created UI element.
 */
export function createClickUi(clickHandler: any) {
  const ui = new UIElement();
  ui.position = new Vector(0, 0, 0.2);
  ui.rotation = new Rotator(180, 0, 0);
  ui.widget = render(
    <verticalbox gap={9.5}>
      <button size={7} onClick={clickHandler}>
        {"5"}
      </button>
      <button size={7} onClick={clickHandler}>
        {"4"}
      </button>
      <button size={7} onClick={clickHandler}>
        {"3"}
      </button>
      <button size={7} onClick={clickHandler}>
        {"2"}
      </button>
      <button size={7} onClick={clickHandler}>
        {"1"}
      </button>
      <button size={7} onClick={clickHandler}>
        {"0"}
      </button>
    </verticalbox>
  );
  return ui;
}

const icons = [
  {
    faces: 4,
    font: "DpolyFourSider.ttf",
    anchorY: 0.72,
    anchorX: 0.45,
    text: "4",
    textB: "$",
  },
  {
    faces: 6,
    font: "DpolySixSider.ttf",
    anchorY: 0.71,
    anchorX: 0.35,
    text: "f",
    textB: "F",
  },
  {
    faces: 8,
    font: "DpolyEightSider.ttf",
    anchorY: 0.67,
    anchorX: 0.4,
    text: "h",
    textB: "H",
  },
  {
    faces: 10,
    font: "DpolyTenSider.ttf",
    anchorY: 0.7,
    anchorX: 0.4,
    text: "l",
    textB: "L",
  },
  {
    faces: 12,
    font: "DpolyTwelveSider.ttf",
    anchorY: 0.65,
    anchorX: 0.3,
    text: "l",
    textB: "L",
  },
  {
    faces: 20,
    font: "DpolyTwentySider.ttf",
    anchorY: 0.65,
    anchorX: 0.3,
    text: "t",
    textB: "T",
  },
  {
    faces: 100, //d100 (zehnerstellen)
    font: "DpolyTenSider.ttf",
    anchorY: 0.7,
    anchorX: 0.4,
    text: "k",
    textB: "K",
  },
];

const fallbackIcon = {
  faces: 0, //d100 (zehnerstellen)
  font: "",
  anchorY: 0.5,
  anchorX: 0.4,
  text: "?",
  textB: "?",
};

let iconUiList: Array<UIElement> = [];
export async function createIcons(config: Config, ref: GameObject = refObject) {
  let snaps = ref.getAllSnapPoints().reverse();

  if (snaps.length < 6 || icons.length < 6) return;

  for (let i = 0; i < config.data.diceList.length; i++) {
    let dice = config.data.diceList[i];
    let snap = snaps[i];
    let icon = icons.find((icon) => icon.faces === dice.faces) || fallbackIcon;
    let text =
      config.data.iconStyle === iconStyle.outline ? icon.text : icon.textB;
    if (
      i === config.data.diceList.length - 1 &&
      config.data.mode === modes.savage_worlds
    )
      text =
        config.data.iconStyle !== iconStyle.outline ? icon.text : icon.textB;

    let ui = new UIElement();
    ui.position = snap.getLocalPosition();
    ui.position.z = 0.13;
    ui.rotation = new Rotator(0, 0, -90);
    ui.scale = 0.1;
    ui.anchorY = icon.anchorY;
    ui.anchorX = icon.anchorX;
    ui.widget = render(
      <text font={icon.font} fontPackage={ref.getPackageId()} size={120}>
        {text}
      </text>
    );

    if (iconUiList[i]) ref.setUI(i + 1, ui);
    else ref.addUI(ui);

    iconUiList[i] = ui;
  }
}
