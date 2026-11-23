// The PNP transistor's example (ADR 0038, ADR 0045): GP16 switches a light through a 2N3906 on the
// high side, between 3V3 and the light, so the light is lit while the pin is low.
import type { Circuit } from "ratsnest";

export default {
  format: 2,
  setup: { kind: "pico" },
  name: { en: "High-side switch", fr: "Interrupteur côté haut" },
  description: {
    en: "A red LED that GP16 switches through a PNP transistor, a 2N3906, which sits between 3V3 and the light. The transistor lets 3V3 through to the light while the pin is low, so the light is lit when the pin is off.",
    fr: "Une LED rouge que GP16 commande à travers un transistor PNP, un 2N3906, placé entre le 3V3 et la LED. Le transistor laisse passer le 3V3 vers la LED tant que la broche est au niveau bas : la LED est allumée quand la broche est éteinte.",
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
        en: "Take 3V3 from 3V3(OUT), never from VBUS: a PNP transistor's emitter on the USB's full voltage would stay on whatever the pin did.",
        fr: "Prenez le 3V3 sur 3V3(OUT), jamais sur VBUS : un transistor PNP dont l’émetteur serait sur toute la tension de l’USB resterait passant quoi que fasse la broche.",
      },
      parts: [
        { kind: "wire", from: "a19", to: "top-19", role: "ground" },
        { kind: "wire", from: "a6", to: "top+7", role: "power" },
      ],
    },
    {
      title: {
        en: "The transistor, its emitter on 3V3",
        fr: "Le transistor, son émetteur au 3V3",
      },
      note: {
        en: "Its flat face, where its type and model are printed, faces the channel. A PNP transistor's emitter goes towards +, where an NPN one's goes to ground.",
        fr: "Sa face plate, où sont imprimés son type et son modèle, est tournée vers la rainure. L’émetteur d’un transistor PNP va vers le +, là où celui d’un NPN va à la masse.",
      },
      parts: [
        { kind: "transistor", model: "2N3906", emitter: "e24", base: "e25", collector: "e26" },
        { kind: "wire", from: "a24", to: "top+25", role: "power" },
      ],
    },
    {
      title: {
        en: "Its base, from GP16 through a resistor",
        fr: "Sa base, depuis GP16 à travers une résistance",
      },
      note: {
        en: "While the pin is high, the base is at the emitter's voltage and the transistor is off. Taking the pin low draws a little current out of the base, and turns it on.",
        fr: "Tant que la broche est au niveau haut, la base est à la tension de l’émetteur et le transistor est bloqué. Mettre la broche au niveau bas tire un peu de courant de la base, et le rend passant.",
      },
      parts: [{ kind: "resistor", ohms: 1000, from: "b21", to: "b25" }],
    },
    {
      title: {
        en: "The red LED, from the collector to ground",
        fr: "La LED rouge, du collecteur à la masse",
      },
      parts: [
        { kind: "resistor", ohms: 330, from: "a26", to: "a29" },
        { kind: "led", led: "red", anode: "e29", cathode: "e30" },
        { kind: "wire", from: "a30", to: "top-29", role: "ground" },
      ],
    },
  ],
  script: {
    en: `from machine import Pin
from time import sleep

# High is off and low is on: the light starts off.
light = Pin(16, Pin.OUT, value=1)

try:
    while True:
        light.toggle()
        sleep(0.5)
finally:
    light.on()`,
    fr: `from machine import Pin
from time import sleep

# Haut, c’est éteint, et bas, allumé : la LED commence éteinte.
lumiere = Pin(16, Pin.OUT, value=1)

try:
    while True:
        lumiere.toggle()
        sleep(0.5)
finally:
    lumiere.on()`,
  },
  test: {
    en: "The red LED blinks once a second, lit while GP16 is low. Press Stop in Thonny to end the script, which leaves the pin high and the light off.",
    fr: "La LED rouge clignote une fois par seconde, allumée tant que GP16 est au niveau bas. Appuyez sur Arrêter dans Thonny pour terminer le script, qui laisse la broche au niveau haut et la LED éteinte.",
  },
} satisfies Circuit;
