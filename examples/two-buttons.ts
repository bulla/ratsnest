// scratchpi's Two buttons, ported as one of ratsnest's examples (ADR 0014).
import type { Circuit } from "ratsnest";

export default {
  format: 2,
  name: { en: "Two buttons", fr: "Deux boutons" },
  description: {
    en: "Two push buttons, one on each side of the Pico: BTN1 on GP16 and BTN2 on GP15. Each is pulled down, so its pin reads low until it is held. Held in both hands, it is a gamepad.",
    fr: "Deux boutons poussoirs, un de chaque côté du Pico : BTN1 sur GP16 et BTN2 sur GP15. Chacun a une résistance de rappel à la masse : sa broche lit un niveau bas tant qu’on n’appuie pas dessus. Tenu à deux mains, c’est une manette.",
  },
  credit: {
    en: "The Pico 2 W is drawn from its datasheet, adapting the Raspberry Pi Pico 2 W pinout, © Raspberry Pi Ltd, under CC BY-SA 4.0 (creativecommons.org/licenses/by-sa/4.0). This drawing is shared under the same licence. Set in Nunito, under the SIL Open Font License 1.1.",
    fr: "Le Pico 2 W est dessiné d’après sa fiche technique, en adaptant le brochage du Raspberry Pi Pico 2 W, © Raspberry Pi Ltd, sous licence CC BY-SA 4.0 (creativecommons.org/licenses/by-sa/4.0). Ce dessin est partagé sous la même licence. Composé en Nunito, sous la licence SIL Open Font 1.1.",
  },
  buttons: [
    {
      id: "right",
      name: { en: "BTN1", fr: "BTN1" },
      pin: { kind: "gpio", gpio: 16 },
      colour: "red",
    },
    {
      id: "left",
      name: { en: "BTN2", fr: "BTN2" },
      pin: { kind: "gpio", gpio: 15 },
      colour: "green",
    },
  ],
  steps: [
    {
      title: {
        en: "Connect the bottom − rail to ground",
        fr: "Reliez le rail − du bas à la masse",
      },
      parts: [{ kind: "wire", from: "j19", to: "bottom-19", role: "ground" }],
    },
    {
      title: { en: "Connect 3V3 to the top + rail", fr: "Reliez le 3V3 au rail + du haut" },
      note: {
        en: "Take it from 3V3(OUT). VBUS and VSYS, at the same end of the Pico, carry the USB's full voltage, which a GPIO pin must never see.",
        fr: "Prenez-le sur 3V3(OUT). VBUS et VSYS, au même bout du Pico, portent toute la tension de l’USB, qu’une broche GPIO ne doit jamais recevoir.",
      },
      parts: [{ kind: "wire", from: "a6", to: "top+7", role: "power" }],
    },
    {
      title: { en: "BTN2 on GP15", fr: "BTN2 sur GP15" },
      note: {
        en: "Its pin is reached below the channel and its supply comes in above. The button sits across the channel, and its legs join the two halves.",
        fr: "On rejoint sa broche sous la rainure centrale, et son alimentation arrive par le haut. Le bouton est à cheval sur la rainure, et ses pattes en relient les deux moitiés.",
      },
      parts: [
        { kind: "wire", from: "j21", to: "j23", role: "signal" },
        { kind: "button", button: "left", columns: [23, 25] },
        { kind: "wire", from: "a25", to: "top+26", role: "power" },
      ],
    },
    {
      title: {
        en: "Hold GP15 low with a resistor",
        fr: "Maintenez GP15 au niveau bas avec une résistance",
      },
      note: {
        en: "Without it the pin floats while the button is up, and reads a press nobody made.",
        fr: "Sans elle, la broche flotte tant que le bouton est relâché, et lit un appui que personne n’a fait.",
      },
      parts: [{ kind: "resistor", ohms: 4700, from: "i23", to: "bottom-22" }],
    },
    {
      title: { en: "BTN1 on GP16", fr: "BTN1 sur GP16" },
      note: {
        en: "Further along the channel than BTN2, so each hand has a button of its own.",
        fr: "Plus loin le long de la rainure que BTN2, pour que chaque main ait son propre bouton.",
      },
      parts: [
        { kind: "wire", from: "b21", to: "b27", role: "signal" },
        { kind: "button", button: "right", columns: [27, 29] },
        { kind: "wire", from: "a29", to: "top+28", role: "power" },
      ],
    },
    {
      title: {
        en: "Hold GP16 low with a resistor",
        fr: "Maintenez GP16 au niveau bas avec une résistance",
      },
      note: {
        en: "It goes in below the channel, beside BTN2's. The button's legs join GP16's column to the holes under it.",
        fr: "Elle se place sous la rainure, à côté de celle de BTN2. Les pattes du bouton relient la colonne de GP16 aux trous qui sont en dessous.",
      },
      parts: [
        { kind: "resistor", ohms: 4700, from: "i27", to: "i30" },
        { kind: "wire", from: "j30", to: "bottom-28", role: "ground" },
      ],
    },
  ],
  script: {
    en: `from machine import Pin
from time import sleep

btn1 = Pin(16, Pin.IN)
btn2 = Pin(15, Pin.IN)

shown = None
while True:
    now = (btn1.value(), btn2.value())
    if now != shown:
        print("btn1:", now[0], "btn2:", now[1])
        shown = now
    sleep(0.02)`,
    fr: `from machine import Pin
from time import sleep

btn1 = Pin(16, Pin.IN)
btn2 = Pin(15, Pin.IN)

shown = None
while True:
    now = (btn1.value(), btn2.value())
    if now != shown:
        print("btn1:", now[0], "btn2:", now[1])
        shown = now
    sleep(0.02)`,
  },
  scriptDoes: {
    en: "Thonny's Shell shows 1 beside a button while it is held down, and 0 once it is let go. Press Stop in Thonny to end the script.",
    fr: "La console de Thonny affiche 1 à côté d’un bouton tant qu’il est enfoncé, et 0 dès qu’il est relâché. Appuyez sur Arrêter dans Thonny pour terminer le script.",
  },
} satisfies Circuit;
