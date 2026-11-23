// ratsnest's first example with no Pico (ADR 0032): a supply on the bottom rails, and a button that
// lights a light while it is held. Not one of scratchpi's, unlike the seven before it (ADR 0014).
import type { Circuit } from "ratsnest";

export default {
  format: 1,
  name: { en: "Button on batteries", fr: "Bouton sur piles" },
  description: {
    en: "A red LED and a push button, BTN1, on three AA batteries and no Pico. The button joins the light to the + rail while it is held, so the light shines only then.",
    fr: "Une LED rouge et un bouton poussoir, BTN1, sur trois piles AA, sans Pico. Le bouton relie la LED au rail + tant qu’on le maintient : elle ne s’allume qu’alors.",
  },
  supply: { volts: 4.5, rails: "bottom" },
  leds: [{ id: "red", name: { en: "red LED", fr: "LED rouge" }, colour: "red" }],
  buttons: [{ id: "button", name: { en: "BTN1", fr: "BTN1" }, colour: "red" }],
  steps: [
    {
      title: { en: "BTN1 between + and the light", fr: "BTN1 entre le + et la LED" },
      note: {
        en: "The button's legs across the channel are always joined. Pressing it joins its left-hand legs to its right-hand ones, so the current goes on to the light only while it is held.",
        fr: "Les pattes du bouton de part et d’autre de la rainure sont toujours reliées. Appuyer relie ses pattes de gauche à ses pattes de droite : le courant ne passe vers la LED que tant qu’on le maintient.",
      },
      parts: [
        { kind: "wire", from: "j8", to: "bottom+8", role: "power" },
        { kind: "button", button: "button", columns: [8, 10] },
      ],
    },
    {
      title: {
        en: "The red LED, through its resistor",
        fr: "La LED rouge, à travers sa résistance",
      },
      parts: [
        { kind: "resistor", ohms: 330, from: "i10", to: "i15" },
        { kind: "led", led: "red", anode: "h15", cathode: "h16" },
        { kind: "wire", from: "j16", to: "bottom-16", role: "ground" },
      ],
    },
  ],
  test: {
    en: "Hold BTN1 down and the red LED lights. Let go and it goes out.",
    fr: "Maintenez BTN1 enfoncé et la LED rouge s’allume. Relâchez-le et elle s’éteint.",
  },
} satisfies Circuit;
