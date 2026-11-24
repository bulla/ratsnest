// The first example with diodes (ADR 0038, ADR 0049): each button lights a light of its own and one
// they share, and a diode on each button's way to the shared one keeps it from lighting the other's.
import type { Circuit } from "ratsnest";

export default {
  format: 2,
  setup: { kind: "supply", volts: 4.5, rails: "bottom" },
  name: { en: "Two buttons, three lights", fr: "Deux boutons, trois LED" },
  description: {
    en: "Two push buttons, BTN1 and BTN2, and three LEDs, on three AA batteries and no Pico. Each button lights a light of its own and the yellow one they share. Two diodes keep each button from lighting the other's light through the yellow LED's strip.",
    fr: "Deux boutons poussoirs, BTN1 et BTN2, et trois LED, sur trois piles AA, sans Pico. Chaque bouton allume une LED à lui et la LED jaune qu’ils partagent. Deux diodes empêchent chaque bouton d’allumer la LED de l’autre par la bande de la LED jaune.",
  },
  credit: {
    en: "This drawing comes from the one ratsnest makes of the Pico 2 W, adapting the Raspberry Pi Pico 2 W pinout, © Raspberry Pi Ltd, under CC BY-SA 4.0 (creativecommons.org/licenses/by-sa/4.0), and is shared under the same licence. Set in Nunito, under the SIL Open Font License 1.1.",
    fr: "Ce dessin vient de celui que ratsnest fait du Pico 2 W, en adaptant le brochage du Raspberry Pi Pico 2 W, © Raspberry Pi Ltd, sous licence CC BY-SA 4.0 (creativecommons.org/licenses/by-sa/4.0), et il est partagé sous la même licence. Composé en Nunito, sous la licence SIL Open Font 1.1.",
  },
  leds: [
    { id: "red", name: { en: "red LED", fr: "LED rouge" }, colour: "red" },
    { id: "green", name: { en: "green LED", fr: "LED verte" }, colour: "green" },
    { id: "yellow", name: { en: "yellow LED", fr: "LED jaune" }, colour: "yellow" },
  ],
  buttons: [
    { id: "first", name: { en: "BTN1", fr: "BTN1" }, colour: "red" },
    { id: "second", name: { en: "BTN2", fr: "BTN2" }, colour: "green" },
  ],
  steps: [
    {
      title: { en: "BTN1 and BTN2, each from +", fr: "BTN1 et BTN2, chacun depuis le +" },
      note: {
        en: "Each button's legs across the channel are always joined. Pressing one joins its right-hand legs, on +, to its left-hand ones, which carry the current on to its lights.",
        fr: "Les pattes de chaque bouton de part et d’autre de la rainure sont toujours reliées. Appuyer sur l’un relie ses pattes de droite, sur le +, à ses pattes de gauche, qui portent le courant vers ses LED.",
      },
      parts: [
        { kind: "wire", from: "j15", to: "bottom+15", role: "power" },
        { kind: "button", button: "first", columns: [13, 15] },
        { kind: "wire", from: "j23", to: "bottom+23", role: "power" },
        { kind: "button", button: "second", columns: [21, 23] },
      ],
    },
    {
      title: { en: "The red LED, BTN1's own", fr: "La LED rouge, celle de BTN1" },
      parts: [
        { kind: "resistor", ohms: 330, from: "g13", to: "g6" },
        { kind: "led", led: "red", anode: "f6", cathode: "f5" },
        { kind: "wire", from: "j5", to: "bottom-5", role: "ground" },
      ],
    },
    {
      title: { en: "The green LED, BTN2's own", fr: "La LED verte, celle de BTN2" },
      parts: [
        { kind: "resistor", ohms: 330, from: "i21", to: "i26" },
        { kind: "led", led: "green", anode: "h26", cathode: "h27" },
        { kind: "wire", from: "j27", to: "bottom-27", role: "ground" },
      ],
    },
    {
      title: { en: "The yellow LED, which both share", fr: "La LED jaune, que les deux partagent" },
      parts: [
        { kind: "resistor", ohms: 330, from: "i18", to: "i11" },
        { kind: "led", led: "yellow", anode: "f11", cathode: "f10" },
        { kind: "wire", from: "j10", to: "bottom-10", role: "ground" },
      ],
    },
    {
      title: {
        en: "The two diodes, their bands towards the yellow LED's resistor",
        fr: "Les deux diodes, leur bande vers la résistance de la LED jaune",
      },
      note: {
        en: "Each diode lets its button's current through to the yellow LED, and none back the other way. Without them, pressing BTN1 would light the green LED too, through the yellow LED's strip.",
        fr: "Chaque diode laisse passer le courant de son bouton vers la LED jaune, et rien dans l’autre sens. Sans elles, appuyer sur BTN1 allumerait aussi la LED verte, par la bande de la LED jaune.",
      },
      parts: [
        { kind: "diode", model: "1N4148", anode: "h13", cathode: "h18" },
        { kind: "diode", model: "1N4148", anode: "g21", cathode: "g18" },
      ],
    },
  ],
  test: {
    en: "Hold BTN1 down: the red and the yellow LED light. Hold BTN2 instead: the green and the yellow light. Under BTN1 the green stays dark, and under BTN2 the red, since neither diode lets current back.",
    fr: "Maintenez BTN1 enfoncé : la LED rouge et la jaune s’allument. Maintenez plutôt BTN2 : la verte et la jaune s’allument. Sous BTN1 la verte reste éteinte, et sous BTN2 la rouge, car aucune diode ne laisse le courant revenir.",
  },
} satisfies Circuit;
