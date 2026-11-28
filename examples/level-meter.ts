// The first example with an LED bar graph and a resistor array (ADR 0038, ADR 0058, ADR 0059): five
// segments on a second breadboard, each lit by a pin of its own, GP21 to GP17, and taken to ground
// through one of the array's five resistors, whose common leg goes to ground. The script's bar
// rises a segment at a time, and falls back.
import type { Circuit } from "ratsnest";

export default {
  format: 2,
  setup: { kind: "pico" },
  name: { en: "Level meter", fr: "Vumètre" },
  description: {
    en: "A five-segment LED bar graph on a second breadboard, each segment lit by a pin of its own, GP21 to GP17, and taken to ground through one resistor of a resistor array, whose five resistors share one leg. The script lights it like a level meter: its bar rises a segment at a time, and falls back.",
    fr: "Un bargraphe à LED de cinq segments sur une seconde plaque, chaque segment allumé par une broche à lui, de GP21 à GP17, et relié à la masse par une résistance d’un réseau de résistances, dont les cinq résistances partagent une patte. Le script l’allume comme un vumètre : sa barre monte d’un segment à la fois, puis redescend.",
  },
  credit: {
    en: "The Pico 2 W is drawn from its datasheet, adapting the Raspberry Pi Pico 2 W pinout, © Raspberry Pi Ltd, under CC BY-SA 4.0 (creativecommons.org/licenses/by-sa/4.0). This drawing is shared under the same licence. Set in Nunito, under the SIL Open Font License 1.1.",
    fr: "Le Pico 2 W est dessiné d’après sa fiche technique, en adaptant le brochage du Raspberry Pi Pico 2 W, © Raspberry Pi Ltd, sous licence CC BY-SA 4.0 (creativecommons.org/licenses/by-sa/4.0). Ce dessin est partagé sous la même licence. Composé en Nunito, sous la licence SIL Open Font 1.1.",
  },
  steps: [
    {
      title: {
        en: "The bar graph, across a second breadboard's channel",
        fr: "Le bargraphe, à cheval sur la rainure d’une seconde plaque",
      },
      note: {
        en: "Snap a second half-size breadboard onto the top edge of the first, column 1 over column 1: they are made to join along their long sides. The bar graph's anodes go towards the Pico.",
        fr: "Emboîtez une seconde plaque d’essai demi-taille sur le bord du haut de la première, la colonne 1 au-dessus de la colonne 1 : elles sont faites pour s’emboîter par leurs grands côtés. Les anodes du bargraphe vont du côté du Pico.",
      },
      parts: [{ kind: "barGraph", segments: 5, colour: "red", column: 15, board: 2 }],
    },
    {
      title: {
        en: "The resistor array, beside the cathodes",
        fr: "Le réseau de résistances, à côté des cathodes",
      },
      note: {
        en: "Its dot goes on the left, over column 14: that is its common leg, and each of the others shares a strip with a segment's cathode.",
        fr: "Son point va à gauche, au-dessus de la colonne 14 : c’est sa patte commune, et chacune des autres partage une bande avec la cathode d’un segment.",
      },
      parts: [{ kind: "resistorArray", ohms: 330, resistors: 5, common: "2:d14" }],
    },
    {
      title: {
        en: "Its common leg to ground",
        fr: "Sa patte commune à la masse",
      },
      parts: [{ kind: "wire", from: "a14", to: "2:e14", role: "ground" }],
    },
    {
      title: {
        en: "Each anode to a pin, GP21 to GP17",
        fr: "Chaque anode à une broche, de GP21 à GP17",
      },
      note: {
        en: "Segments 1 to 4 go straight down to GP21, GP20, GP19 and GP18. GND comes next on the Pico, so segment 5 leans one column over to GP17.",
        fr: "Les segments 1 à 4 descendent tout droit à GP21, GP20, GP19 et GP18. Le GND vient ensuite sur le Pico, alors le segment 5 penche d’une colonne vers GP17.",
      },
      parts: [
        { kind: "wire", from: "a15", to: "2:j15", role: "signal" },
        { kind: "wire", from: "a16", to: "2:j16", role: "signal" },
        { kind: "wire", from: "a17", to: "2:j17", role: "signal" },
        { kind: "wire", from: "a18", to: "2:j18", role: "signal" },
        { kind: "wire", from: "a20", to: "2:j19", role: "signal" },
      ],
    },
  ],
  script: {
    en: `from machine import Pin
from time import sleep

segments = [Pin(gpio, Pin.OUT) for gpio in (21, 20, 19, 18, 17)]

def show(level):
    for number, segment in enumerate(segments, 1):
        segment.value(number <= level)

try:
    while True:
        for level in list(range(len(segments) + 1)) + list(range(len(segments) - 1, 0, -1)):
            show(level)
            sleep(0.15)
finally:
    show(0)`,
    fr: `from machine import Pin
from time import sleep

segments = [Pin(gpio, Pin.OUT) for gpio in (21, 20, 19, 18, 17)]

def afficher(niveau):
    for numero, segment in enumerate(segments, 1):
        segment.value(numero <= niveau)

try:
    while True:
        for niveau in list(range(len(segments) + 1)) + list(range(len(segments) - 1, 0, -1)):
            afficher(niveau)
            sleep(0.15)
finally:
    afficher(0)`,
  },
  test: {
    en: "The bar rises from segment 1, one segment at a time, until all five are lit, then falls back, over and over. Press Stop in Thonny to end the script, and every segment goes out.",
    fr: "La barre monte depuis le segment 1, un segment à la fois, jusqu’à ce que les cinq soient allumés, puis redescend, encore et encore. Appuyez sur Stop dans Thonny pour arrêter le script, et chaque segment s’éteint.",
  },
} satisfies Circuit;
