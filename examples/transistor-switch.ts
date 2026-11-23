// The first example with a transistor (ADR 0038, ADR 0044): a pin switches a light through a 2N3904,
// whose base takes a little current from the pin and lets the light's own through from 3V3.
import type { Circuit } from "ratsnest";

export default {
  format: 2,
  setup: { kind: "pico" },
  name: { en: "Transistor switch", fr: "Interrupteur à transistor" },
  description: {
    en: "A red LED that GP16 switches through an NPN transistor, a 2N3904. The pin only feeds the transistor's base through a resistor; the light's own current comes from 3V3, through the transistor, while the pin is high.",
    fr: "Une LED rouge que GP16 commande à travers un transistor NPN, un 2N3904. La broche n’alimente que la base du transistor, à travers une résistance ; le courant de la LED vient du 3V3, à travers le transistor, tant que la broche est au niveau haut.",
  },
  credit: {
    en: "The Pico 2 W is drawn from its datasheet, adapting the Raspberry Pi Pico 2 W pinout, © Raspberry Pi Ltd, under CC BY-SA 4.0 (creativecommons.org/licenses/by-sa/4.0). This drawing is shared under the same licence. Set in Nunito, under the SIL Open Font License 1.1.",
    fr: "Le Pico 2 W est dessiné d’après sa fiche technique, en adaptant le brochage du Raspberry Pi Pico 2 W, © Raspberry Pi Ltd, sous licence CC BY-SA 4.0 (creativecommons.org/licenses/by-sa/4.0). Ce dessin est partagé sous la même licence. Composé en Nunito, sous la licence SIL Open Font 1.1.",
  },
  leds: [
    {
      id: "red",
      name: { en: "red LED", fr: "LED rouge" },
      pin: { kind: "gpio", gpio: 16 },
      colour: "red",
    },
  ],
  steps: [
    {
      title: {
        en: "Connect the top rails to ground and to 3V3",
        fr: "Reliez les rails du haut à la masse et au 3V3",
      },
      note: {
        en: "Take 3V3 from 3V3(OUT). VBUS and VSYS, at the same end of the Pico, carry the USB's full voltage, which a GPIO pin must never see.",
        fr: "Prenez le 3V3 sur 3V3(OUT). VBUS et VSYS, au même bout du Pico, portent toute la tension de l’USB, qu’une broche GPIO ne doit jamais recevoir.",
      },
      parts: [
        { kind: "wire", from: "a19", to: "top-19", role: "ground" },
        { kind: "wire", from: "a6", to: "top+7", role: "power" },
      ],
    },
    {
      title: {
        en: "The transistor, its emitter on ground",
        fr: "Le transistor, son émetteur à la masse",
      },
      note: {
        en: "Its flat face, where its type and model are printed, faces the channel. Turned round, its emitter and its collector would swap places.",
        fr: "Sa face plate, où sont imprimés son type et son modèle, est tournée vers la rainure. Retourné, son émetteur et son collecteur échangeraient leurs places.",
      },
      parts: [
        { kind: "transistor", model: "2N3904", emitter: "e24", base: "e25", collector: "e26" },
        { kind: "wire", from: "a24", to: "top-25", role: "ground" },
      ],
    },
    {
      title: {
        en: "Its base, from GP16 through a resistor",
        fr: "Sa base, depuis GP16 à travers une résistance",
      },
      note: {
        en: "The resistor keeps the current the pin gives the base small. That little current is enough to let the light's own through the transistor.",
        fr: "La résistance limite le courant que la broche donne à la base. Ce petit courant suffit à laisser passer celui de la LED à travers le transistor.",
      },
      parts: [{ kind: "resistor", ohms: 1000, from: "b21", to: "b25" }],
    },
    {
      title: { en: "The red LED, from + to the collector", fr: "La LED rouge, du + au collecteur" },
      parts: [
        { kind: "led", led: "red", anode: "e30", cathode: "e29" },
        { kind: "wire", from: "a30", to: "top+29", role: "power" },
        { kind: "resistor", ohms: 330, from: "a26", to: "a29" },
      ],
    },
  ],
  script: {
    en: `from machine import Pin
from time import sleep

light = Pin(16, Pin.OUT)

try:
    while True:
        light.toggle()
        sleep(0.5)
finally:
    light.off()`,
    fr: `from machine import Pin
from time import sleep

lumiere = Pin(16, Pin.OUT)

try:
    while True:
        lumiere.toggle()
        sleep(0.5)
finally:
    lumiere.off()`,
  },
  test: {
    en: "The red LED blinks once a second: each time GP16 goes high, the transistor lets the light's current through. Press Stop in Thonny to end the script.",
    fr: "La LED rouge clignote une fois par seconde : chaque fois que GP16 passe au niveau haut, le transistor laisse passer le courant de la LED. Appuyez sur Arrêter dans Thonny pour terminer le script.",
  },
} satisfies Circuit;
