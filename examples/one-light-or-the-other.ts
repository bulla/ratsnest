// The first example with a slide switch (ADR 0038, ADR 0052): its middle leg on +, and each outer leg
// on a light's way, so that it lights one light or the other, and stays so when let go.
import type { Circuit } from "ratsnest";

export default {
  format: 2,
  setup: { kind: "supply", volts: 4.5, rails: "bottom" },
  name: { en: "One light or the other", fr: "Une LED ou l’autre" },
  description: {
    en: "An SPDT slide switch and two LEDs, on three AA batteries and no Pico. The switch lights the red LED or the green one, whichever way it is slid, and stays as it is when let go, which a push button cannot do.",
    fr: "Un interrupteur à glissière inverseur et deux LED, sur trois piles AA, sans Pico. L’interrupteur allume la LED rouge ou la verte, selon le côté où on le pousse, et reste ainsi une fois lâché, ce qu’un bouton poussoir ne sait pas faire.",
  },
  credit: {
    en: "This drawing comes from the one ratsnest makes of the Pico 2 W, adapting the Raspberry Pi Pico 2 W pinout, © Raspberry Pi Ltd, under CC BY-SA 4.0 (creativecommons.org/licenses/by-sa/4.0), and is shared under the same licence. Set in Nunito, under the SIL Open Font License 1.1.",
    fr: "Ce dessin vient de celui que ratsnest fait du Pico 2 W, en adaptant le brochage du Raspberry Pi Pico 2 W, © Raspberry Pi Ltd, sous licence CC BY-SA 4.0 (creativecommons.org/licenses/by-sa/4.0), et il est partagé sous la même licence. Composé en Nunito, sous la licence SIL Open Font 1.1.",
  },
  leds: [
    { id: "red", name: { en: "red LED", fr: "LED rouge" }, colour: "red" },
    { id: "green", name: { en: "green LED", fr: "LED verte" }, colour: "green" },
  ],
  steps: [
    {
      title: {
        en: "The slide switch, its middle leg on +",
        fr: "L’interrupteur, sa patte du milieu sur le +",
      },
      note: {
        en: "Its legs are a hole apart, as the breadboard's are, so it goes straight in. Its slide may be either way for now.",
        fr: "Ses pattes sont espacées d’un trou, comme ceux de la plaque, il s’y plante donc tout droit. Sa glissière peut être d’un côté ou de l’autre pour l’instant.",
      },
      parts: [
        { kind: "slideSwitch", left: "f14", middle: "f15", right: "f16" },
        { kind: "wire", from: "j15", to: "bottom+15", role: "power" },
      ],
    },
    {
      title: {
        en: "The red LED, from its left leg",
        fr: "La LED rouge, depuis sa patte de gauche",
      },
      parts: [
        { kind: "resistor", ohms: 330, from: "h14", to: "h8" },
        { kind: "led", led: "red", anode: "g8", cathode: "g7" },
        { kind: "wire", from: "j7", to: "bottom-7", role: "ground" },
      ],
    },
    {
      title: {
        en: "The green LED, from its right leg",
        fr: "La LED verte, depuis sa patte de droite",
      },
      parts: [
        { kind: "resistor", ohms: 330, from: "i16", to: "i22" },
        { kind: "led", led: "green", anode: "g22", cathode: "g23" },
        { kind: "wire", from: "j23", to: "bottom-23", role: "ground" },
      ],
    },
  ],
  test: {
    en: "Slide the switch one way: the red LED lights. Slide it the other way: the green LED lights instead, and the red one goes out. Each stays lit when you let go.",
    fr: "Poussez l’interrupteur d’un côté : la LED rouge s’allume. Poussez-le de l’autre : la verte s’allume à sa place, et la rouge s’éteint. Chacune reste allumée quand vous le lâchez.",
  },
} satisfies Circuit;
