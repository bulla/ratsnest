// The first example with a capacitor (ADR 0038, ADR 0042): a button charges it across a light and its
// resistor, and once the button is let go the capacitor empties into the light, which fades out.
import type { Circuit } from "ratsnest";

export default {
  format: 2,
  setup: { kind: "supply", volts: 4.5, rails: "bottom" },
  name: { en: "Fading light", fr: "Lumière qui s’éteint doucement" },
  description: {
    en: "A red LED, a push button, BTN1, and a capacitor, on three AA batteries and no Pico. Holding the button lights the light and fills the capacitor. Let go, and the capacitor empties into the light, which fades out over a second or two.",
    fr: "Une LED rouge, un bouton poussoir, BTN1, et un condensateur, sur trois piles AA, sans Pico. Maintenir le bouton allume la LED et remplit le condensateur. Relâchez-le, et le condensateur se vide dans la LED, qui s’éteint doucement en une seconde ou deux.",
  },
  credit: {
    en: "This drawing comes from the one ratsnest makes of the Pico 2 W, adapting the Raspberry Pi Pico 2 W pinout, © Raspberry Pi Ltd, under CC BY-SA 4.0 (creativecommons.org/licenses/by-sa/4.0), and is shared under the same licence. Set in Nunito, under the SIL Open Font License 1.1.",
    fr: "Ce dessin vient de celui que ratsnest fait du Pico 2 W, en adaptant le brochage du Raspberry Pi Pico 2 W, © Raspberry Pi Ltd, sous licence CC BY-SA 4.0 (creativecommons.org/licenses/by-sa/4.0), et il est partagé sous la même licence. Composé en Nunito, sous la licence SIL Open Font 1.1.",
  },
  leds: [{ id: "red", name: { en: "red LED", fr: "LED rouge" }, colour: "red" }],
  buttons: [{ id: "button", name: { en: "BTN1", fr: "BTN1" }, colour: "green" }],
  steps: [
    {
      title: { en: "BTN1, from + to the capacitor", fr: "BTN1, du + au condensateur" },
      note: {
        en: "The button's legs across the channel are always joined. Pressing it joins its left-hand legs to its right-hand ones, which carry the current on to the capacitor and the light.",
        fr: "Les pattes du bouton de part et d’autre de la rainure sont toujours reliées. Appuyer relie ses pattes de gauche à ses pattes de droite, qui portent le courant vers le condensateur et la LED.",
      },
      parts: [
        { kind: "wire", from: "j3", to: "bottom+3", role: "power" },
        { kind: "button", button: "button", columns: [3, 5] },
      ],
    },
    {
      title: { en: "The capacitor, the right way round", fr: "Le condensateur, dans le bon sens" },
      note: {
        en: "Its stripe and its shorter leg are its − side, which goes to the − rail. While the button is held, the capacitor fills in an instant.",
        fr: "Sa bande et sa patte la plus courte sont son côté −, qui va au rail −. Tant que le bouton est maintenu, le condensateur se remplit en un instant.",
      },
      parts: [
        { kind: "electrolytic", microfarads: 470, plus: "i5", minus: "i4" },
        { kind: "wire", from: "j4", to: "bottom-4", role: "ground" },
      ],
    },
    {
      title: {
        en: "The red LED, through its resistor",
        fr: "La LED rouge, à travers sa résistance",
      },
      note: {
        en: "The resistor sets how fast the capacitor empties into the light: a larger one makes the light dimmer, and its fade longer.",
        fr: "La résistance règle la vitesse à laquelle le condensateur se vide dans la LED : plus elle est grande, plus la LED est faible, et plus elle met de temps à s’éteindre.",
      },
      parts: [
        { kind: "resistor", ohms: 1000, from: "j5", to: "j10" },
        { kind: "led", led: "red", anode: "h10", cathode: "h11" },
        { kind: "wire", from: "j11", to: "bottom-11", role: "ground" },
      ],
    },
  ],
  test: {
    en: "Hold BTN1 down and the red LED lights. Let go and it does not go out at once: it fades over a second or two, as the capacitor empties into it.",
    fr: "Maintenez BTN1 enfoncé et la LED rouge s’allume. Relâchez-le : elle ne s’éteint pas d’un coup, mais faiblit en une seconde ou deux, tandis que le condensateur se vide dans la LED.",
  },
} satisfies Circuit;
