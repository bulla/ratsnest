// The capacitor tester and flasher (ADR 0038, ADR 0045), after a schematic the owner brought: two
// NPN transistors, crosswise, each holding the other off through a capacitor, flash two lights in
// turn. The capacitor placed last is the one to test, and its own step says so.
import type { Circuit } from "ratsnest";

export default {
  format: 2,
  setup: { kind: "supply", volts: 3, rails: "bottom" },
  name: { en: "Capacitor tester and flasher", fr: "Testeur de condensateurs et clignotant" },
  description: {
    en: "Two NPN transistors, 2N3904s, wired crosswise on two AA batteries, flash a red LED and a yellow one in turn. Each transistor's base is fed from + through a resistor, and held off for a while by a capacitor from the other's collector each time the other turns on. Put a capacitor to test in place of the last one: if the lights flash, it is good, and the larger it is, the longer the red light stays dark.",
    fr: "Deux transistors NPN, des 2N3904, câblés en croix sur deux piles AA, font clignoter tour à tour une LED rouge et une LED jaune. La base de chaque transistor est alimentée depuis le + à travers une résistance, et bloquée un moment par un condensateur venu du collecteur de l’autre, chaque fois que l’autre devient passant. Mettez un condensateur à tester à la place du dernier : si les LED clignotent, il est bon, et plus il est grand, plus la LED rouge reste longtemps éteinte.",
  },
  credit: {
    en: "This drawing comes from the one ratsnest makes of the Pico 2 W, adapting the Raspberry Pi Pico 2 W pinout, © Raspberry Pi Ltd, under CC BY-SA 4.0 (creativecommons.org/licenses/by-sa/4.0), and is shared under the same licence. Set in Nunito, under the SIL Open Font License 1.1.",
    fr: "Ce dessin vient de celui que ratsnest fait du Pico 2 W, en adaptant le brochage du Raspberry Pi Pico 2 W, © Raspberry Pi Ltd, sous licence CC BY-SA 4.0 (creativecommons.org/licenses/by-sa/4.0), et il est partagé sous la même licence. Composé en Nunito, sous la licence SIL Open Font 1.1.",
  },
  leds: [
    { id: "red", name: { en: "red LED", fr: "LED rouge" }, colour: "red" },
    { id: "yellow", name: { en: "yellow LED", fr: "LED jaune" }, colour: "yellow" },
  ],
  steps: [
    {
      title: {
        en: "The left transistor, its emitter on −",
        fr: "Le transistor de gauche, son émetteur au −",
      },
      note: {
        en: "Its flat face, where its type and model are printed, faces you. Every part stands in row f, and its legs are reached from the rows below.",
        fr: "Sa face plate, où sont imprimés son type et son modèle, est tournée vers vous. Chaque composant est planté dans la rangée f, et on rejoint ses pattes par les rangées du dessous.",
      },
      parts: [
        { kind: "transistor", model: "2N3904", emitter: "f9", base: "f10", collector: "f11" },
        { kind: "wire", from: "j9", to: "bottom-9", role: "ground" },
        { kind: "resistor", ohms: 47000, from: "j10", to: "bottom+10" },
      ],
    },
    {
      title: {
        en: "The red LED, from + to its collector",
        fr: "La LED rouge, du + à son collecteur",
      },
      parts: [
        { kind: "led", led: "red", anode: "f5", cathode: "f6" },
        { kind: "wire", from: "j5", to: "bottom+5", role: "power" },
        { kind: "resistor", ohms: 220, from: "h6", to: "h11" },
      ],
    },
    {
      title: {
        en: "The right transistor, its emitter on −",
        fr: "Le transistor de droite, son émetteur au −",
      },
      parts: [
        { kind: "transistor", model: "2N3904", emitter: "f20", base: "f21", collector: "f22" },
        { kind: "wire", from: "j20", to: "bottom-20", role: "ground" },
        { kind: "resistor", ohms: 47000, from: "j21", to: "bottom+21" },
      ],
    },
    {
      title: {
        en: "The yellow LED, from + to its collector",
        fr: "La LED jaune, du + à son collecteur",
      },
      parts: [
        { kind: "led", led: "yellow", anode: "f27", cathode: "f26" },
        { kind: "wire", from: "j27", to: "bottom+27", role: "power" },
        { kind: "resistor", ohms: 220, from: "h22", to: "h26" },
      ],
    },
    {
      title: {
        en: "A capacitor, from the left collector to the right base",
        fr: "Un condensateur, du collecteur de gauche à la base de droite",
      },
      note: {
        en: "Its + leg goes towards the collector, and its stripe towards the base.",
        fr: "Sa patte + va du côté du collecteur, et sa bande du côté de la base.",
      },
      parts: [
        { kind: "electrolytic", microfarads: 10, plus: "f14", minus: "f15" },
        { kind: "wire", from: "g11", to: "g14", role: "signal" },
        { kind: "wire", from: "h15", to: "h21", role: "signal" },
      ],
    },
    {
      title: {
        en: "The capacitor to test, from the right collector to the left base",
        fr: "Le condensateur à tester, du collecteur de droite à la base de gauche",
      },
      note: {
        en: "This is the one to swap for a capacitor you want to test, its + leg and its stripe the same way round.",
        fr: "C’est celui à remplacer par un condensateur que vous voulez tester, sa patte + et sa bande dans le même sens.",
      },
      parts: [
        { kind: "electrolytic", microfarads: 22, plus: "f18", minus: "f17" },
        { kind: "wire", from: "g22", to: "g18", role: "signal" },
        { kind: "wire", from: "i17", to: "i10", role: "signal" },
      ],
    },
  ],
  test: {
    en: "The red LED and the yellow one flash in turn, the red one dark for a little longer: the capacitor from the last step is good. To test another, disconnect the supply, put it in that one's place, the same way round, and connect the supply again. If the lights flash, it is good, and a larger one keeps the red light dark for longer. If they stay lit or dark, it is open or shorted.",
    fr: "La LED rouge et la LED jaune clignotent tour à tour, la rouge éteinte un peu plus longtemps : le condensateur de la dernière étape est bon. Pour en tester un autre, débranchez l’alimentation, mettez-le à sa place, dans le même sens, et rebranchez l’alimentation. Si les LED clignotent, il est bon, et un plus grand garde la LED rouge éteinte plus longtemps. Si elles restent allumées ou éteintes, il est coupé ou en court-circuit.",
  },
} satisfies Circuit;
