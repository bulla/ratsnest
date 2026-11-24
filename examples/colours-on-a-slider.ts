// The first example with a slide potentiometer (ADR 0038, ADR 0053), after day 7 of The Pi Hut's Let
// it Glow Maker Advent Calendar: the Pico reads the slider on an analogue pin, and lights two RGB
// LEDs from the reading. The slider is too long for one breadboard, so it lies across two.
import type { Circuit } from "ratsnest";

export default {
  format: 2,
  setup: { kind: "pico" },
  name: { en: "Colours on a slider", fr: "Des couleurs au curseur" },
  description: {
    en: "A slide potentiometer that the Pico reads on GP28, one of its analogue pins, and two addressable RGB LEDs that change colour as the knob slides. The slider is too long for one breadboard, so it lies across two, the second snapped onto the first. The circuit follows day 7 of The Pi Hut's Let it Glow Maker Advent Calendar.",
    fr: "Un potentiomètre à glissière que le Pico lit sur GP28, une de ses broches analogiques, et deux LED RVB adressables qui changent de couleur quand on fait glisser le bouton. Le curseur est trop long pour une seule plaque, il est donc couché à cheval sur deux, la seconde emboîtée sur la première. Le circuit suit le jour 7 du calendrier de l’Avent Let it Glow Maker de The Pi Hut.",
  },
  credit: {
    en: "The Pico 2 W is drawn from its datasheet, adapting the Raspberry Pi Pico 2 W pinout, © Raspberry Pi Ltd, under CC BY-SA 4.0 (creativecommons.org/licenses/by-sa/4.0). This drawing is shared under the same licence. Set in Nunito, under the SIL Open Font License 1.1.",
    fr: "Le Pico 2 W est dessiné d’après sa fiche technique, en adaptant le brochage du Raspberry Pi Pico 2 W, © Raspberry Pi Ltd, sous licence CC BY-SA 4.0 (creativecommons.org/licenses/by-sa/4.0). Ce dessin est partagé sous la même licence. Composé en Nunito, sous la licence SIL Open Font 1.1.",
  },
  leds: [
    {
      id: "first",
      name: { en: "first RGB LED", fr: "première LED RVB" },
      pin: { kind: "rgb", gpio: 22, count: 1 },
      colour: "rgb",
    },
    {
      id: "second",
      name: { en: "second RGB LED", fr: "seconde LED RVB" },
      pin: { kind: "rgb", gpio: 17, count: 1 },
      colour: "rgb",
    },
  ],
  steps: [
    {
      title: {
        en: "VBUS and ground on the top rails",
        fr: "VBUS et la masse sur les rails du haut",
      },
      note: {
        en: "The RGB LEDs take their power from VBUS, the USB's own voltage, which must never reach a GPIO pin.",
        fr: "Les LED RVB prennent leur alimentation sur VBUS, la tension de l’USB, qui ne doit jamais atteindre une broche GPIO.",
      },
      parts: [
        { kind: "wire", from: "a2", to: "top+2", role: "power" },
        { kind: "wire", from: "a19", to: "top-19", role: "ground" },
      ],
    },
    {
      title: {
        en: "The first RGB LED, on GP22, on a second breadboard",
        fr: "La première LED RVB, sur GP22, sur une seconde plaque",
      },
      note: {
        en: "Snap a second half-size breadboard onto the top edge of the first, column 1 over column 1. Its longest leg is data out, which joins nothing.",
        fr: "Emboîtez une seconde plaque d’essai demi-taille sur le bord du haut de la première, la colonne 1 au-dessus de la colonne 1. Sa plus longue patte est la sortie des données, qui n’est reliée à rien.",
      },
      parts: [
        { kind: "wire", from: "a13", to: "2:j13", role: "signal" },
        { kind: "wire", from: "top-14", to: "2:j14", role: "ground" },
        { kind: "wire", from: "top+16", to: "2:j16", role: "power" },
        {
          kind: "rgbLed",
          led: "first",
          power: "2:f16",
          dataOut: "2:f15",
          ground: "2:f14",
          dataIn: "2:f13",
        },
      ],
    },
    {
      title: { en: "The second RGB LED, on GP17", fr: "La seconde LED RVB, sur GP17" },
      parts: [
        { kind: "wire", from: "a20", to: "2:j20", role: "signal" },
        { kind: "wire", from: "top-21", to: "2:j21", role: "ground" },
        { kind: "wire", from: "top+23", to: "2:j23", role: "power" },
        {
          kind: "rgbLed",
          led: "second",
          dataIn: "2:f20",
          ground: "2:f21",
          dataOut: "2:f22",
          power: "2:f23",
        },
      ],
    },
    {
      title: {
        en: "The slide potentiometer, across both breadboards",
        fr: "Le potentiomètre à glissière, à cheval sur les deux plaques",
      },
      note: {
        en: "Its two legs at one end go straight into the strips of 3V3(OUT) and GP28, the wiper in GP28's. Push the cap onto its knob first.",
        fr: "Ses deux pattes d’un même bout vont tout droit dans les bandes du 3V3(OUT) et de GP28, le curseur dans celle de GP28. Enfoncez d’abord le capuchon sur son bouton.",
      },
      parts: [{ kind: "slider", ohms: 10000, wiper: "a8", end: "a6", otherEnd: "2:e6" }],
    },
    {
      title: {
        en: "Ground to its other end",
        fr: "La masse jusqu’à son autre extrémité",
      },
      parts: [
        { kind: "wire", from: "a4", to: "2:e4", role: "ground" },
        { kind: "wire", from: "2:d4", to: "2:d6", role: "ground" },
      ],
    },
  ],
  script: {
    en: `from machine import ADC, Pin
from neopixel import NeoPixel
from time import sleep

slider = ADC(Pin(28))
first = NeoPixel(Pin(22), 1)
second = NeoPixel(Pin(17), 1)

while True:
    reading = slider.read_u16()
    print(reading)
    level = reading >> 8
    first[0] = (level, 0, 255 - level)
    second[0] = (255 - level, level, 0)
    first.write()
    second.write()
    sleep(0.1)`,
    fr: `from machine import ADC, Pin
from neopixel import NeoPixel
from time import sleep

curseur = ADC(Pin(28))
premiere = NeoPixel(Pin(22), 1)
seconde = NeoPixel(Pin(17), 1)

while True:
    lecture = curseur.read_u16()
    print(lecture)
    niveau = lecture >> 8
    premiere[0] = (niveau, 0, 255 - niveau)
    seconde[0] = (255 - niveau, niveau, 0)
    premiere.write()
    seconde.write()
    sleep(0.1)`,
  },
  test: {
    en: "The script prints the slider's reading ten times a second, from near 0 at one end of its travel to near 65535 at the other. As you slide the knob, the first RGB LED goes from blue to red and the second from red to green.",
    fr: "Le script affiche la lecture du curseur dix fois par seconde, de presque 0 à un bout de sa course à presque 65535 à l’autre. Quand vous faites glisser le bouton, la première LED RVB passe du bleu au rouge, et la seconde du rouge au vert.",
  },
} satisfies Circuit;
