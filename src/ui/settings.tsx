/**
 * @fileoverview Functions for creating UI elements and buttons.
 * @module UI
 */

import {
  world,
  ScreenUIElement,
  HorizontalAlignment,
  Slider,
  Player,
  GameObject,
} from "@tabletop-playground/api";
import { boxChild, jsxInTTPG, parseColor, render, useRef } from "jsx-in-ttpg";
import { Modal, Tabs } from "ttpg-trh-ui";
import { Config, iconStyle, modes } from "../config";
import { reloadStateMachine } from "../stateMachine";
import { createIcons } from "./clickbuttons";

let screenIndex = -1;

/**
 * Creates a UI element for settings.
 * Adds the element to the world.
 */
export function createSettingsUi(config: Config, refObject: GameObject) {
  if (screenIndex != -1) return;
  const settingsUi = new ScreenUIElement();
  settingsUi.anchorX = 0.5;
  settingsUi.anchorY = 0.5;
  settingsUi.height = 320;
  settingsUi.width = 320;
  settingsUi.positionX = 0.5;
  settingsUi.positionY = 0.5;
  settingsUi.relativePositionX = true;
  settingsUi.relativePositionY = true;
  settingsUi.widget = render(
    <Modal
      title="Click Roller Settings"
      onClose={() => {
        closeSettingsUi();
        config.save();
        reloadStateMachine();
        createIcons(config, refObject);
      }}
    >
      <layout padding={8}>
        <verticalbox gap={4}>
          <horizontalbox gap={4}>
            <layout width={96} halign={HorizontalAlignment.Left}>
              Roll Delay
            </layout>
            {boxChild(
              1,
              <slider
                min={0.1}
                max={3}
                step={0.1}
                value={config.data.rollTimerDelay / 1000}
                inputWidth={50}
                onChange={(element: Slider, player: Player, value: number) =>
                  (config.data.rollTimerDelay = value * 1000)
                }
              />
            )}
          </horizontalbox>
          <horizontalbox gap={4}>
            <layout width={96} halign={HorizontalAlignment.Left}>
              Roll Intervall
            </layout>
            {boxChild(
              1,
              <slider
                min={0}
                max={1}
                step={0.1}
                value={config.data.rollInterval / 1000}
                inputWidth={50}
                onChange={(element: Slider, player: Player, value: number) =>
                  (config.data.rollInterval = value * 1000)
                }
              />
            )}
          </horizontalbox>
          <horizontalbox gap={4}>
            <layout width={96} halign={HorizontalAlignment.Left}>
              Clear Delay
            </layout>
            {boxChild(
              1,
              <slider
                min={0.1}
                max={10}
                step={0.1}
                value={config.data.clearDelay / 1000}
                inputWidth={50}
                onChange={(element: Slider, player: Player, value: number) =>
                  (config.data.clearDelay = value * 1000)
                }
              />
            )}
          </horizontalbox>
          <horizontalbox gap={4}>
            <layout width={96} halign={HorizontalAlignment.Left}>
              Mode
            </layout>
            {boxChild(
              1,
              <select
                options={Object.keys(modes).filter((key) =>
                  isNaN(parseInt(key, 10))
                )}
                value={modes[config.data.mode]}
                onChange={(element, player, index, option) => {
                  config.data.mode = index;
                  if (index === modes.savage_worlds) {
                    config.data.diceList[5].faces = 6;
                    config.data.diceList[5].guid =
                      "A897158B490E36F0911B03B3BE9BA52A";
                    createIcons(config, refObject);
                  }
                }}
              />
            )}
          </horizontalbox>{" "}
          <horizontalbox gap={4}>
            <layout width={96} halign={HorizontalAlignment.Left}>
              Icon Style
            </layout>
            {boxChild(
              1,
              <select
                options={Object.keys(iconStyle).filter((key) =>
                  isNaN(parseInt(key, 10))
                )}
                value={iconStyle[config.data.iconStyle]}
                onChange={(element, player, index, option) => {
                  config.data.iconStyle = index;
                  createIcons(config, refObject);
                }}
              />
            )}
          </horizontalbox>
        </verticalbox>
      </layout>
    </Modal>
  );
  screenIndex = world.addScreenUI(settingsUi);
}

function closeSettingsUi() {
  world.removeScreenUI(screenIndex);
  screenIndex = -1;
}
