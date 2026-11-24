// The first example with a DIP switch (ADR 0038, ADR 0054): five switches, each from ground to a
// pin of its own, which the script pulls up inside the Pico and reads, printing which switches are
// on.
import type { Circuit } from "ratsnest";

export default {
  format: 2,
  setup: { kind: "pico" },
  name: { en: "Five switches", fr: "Cinq interrupteurs" },
  description: {
    en: "A DIP switch of five switches on a second breadboard, each read by a pin of its own, GP22 to GP18. Each goes to ground, and the script holds its pin high with the Pico's own pull-up, so a switch turned on reads 0. Wired to 3V3 instead, a switch turned off could still read on, since the Pico 2 W cannot hold its pin low on its own.",
    fr: "Un interrupteur DIP de cinq interrupteurs sur une seconde plaque, chacun lu par une broche à lui, de GP22 à GP18. Chacun va à la masse, et le script maintient sa broche au niveau haut avec la résistance de tirage du Pico, si bien qu’un interrupteur en marche lit 0. Relié au 3V3, un interrupteur à l’arrêt pourrait encore se lire en marche, car le Pico 2 W ne sait pas maintenir sa broche au niveau bas tout seul.",
  },
  credit: {
    en: "The Pico 2 W is drawn from its datasheet, adapting the Raspberry Pi Pico 2 W pinout, © Raspberry Pi Ltd, under CC BY-SA 4.0 (creativecommons.org/licenses/by-sa/4.0). This drawing is shared under the same licence. Set in Nunito, under the SIL Open Font License 1.1.",
    fr: "Le Pico 2 W est dessiné d’après sa fiche technique, en adaptant le brochage du Raspberry Pi Pico 2 W, © Raspberry Pi Ltd, sous licence CC BY-SA 4.0 (creativecommons.org/licenses/by-sa/4.0). Ce dessin est partagé sous la même licence. Composé en Nunito, sous la licence SIL Open Font 1.1.",
  },
  steps: [
    {
      title: {
        en: "Ground up to a second breadboard's top − rail",
        fr: "La masse jusqu’au rail − du haut d’une seconde plaque",
      },
      note: {
        en: "Snap a second half-size breadboard onto the top edge of the first, column 1 over column 1: they are made to join along their long sides.",
        fr: "Emboîtez une seconde plaque d’essai demi-taille sur le bord du haut de la première, la colonne 1 au-dessus de la colonne 1 : elles sont faites pour s’emboîter par leurs grands côtés.",
      },
      parts: [{ kind: "wire", from: "a19", to: "2:top-19", role: "ground" }],
    },
    {
      title: {
        en: "The DIP switch, across the second breadboard's channel",
        fr: "L’interrupteur DIP, à cheval sur la rainure de la seconde plaque",
      },
      note: {
        en: "Turn every switch off before it goes in, away from ON. Each switch joins the leg above the channel to the one below it while it is on.",
        fr: "Mettez chaque interrupteur à l’arrêt avant de le planter, à l’opposé de ON. Chaque interrupteur relie la patte au-dessus de la rainure à celle du dessous tant qu’il est en marche.",
      },
      parts: [{ kind: "dipSwitch", switches: 5, column: 13, board: 2 }],
    },
    {
      title: {
        en: "Each switch's top leg to ground",
        fr: "La patte du haut de chaque interrupteur à la masse",
      },
      parts: [
        { kind: "wire", from: "2:a13", to: "2:top-13", role: "ground" },
        { kind: "wire", from: "2:a14", to: "2:top-14", role: "ground" },
        { kind: "wire", from: "2:a15", to: "2:top-15", role: "ground" },
        { kind: "wire", from: "2:a16", to: "2:top-16", role: "ground" },
        { kind: "wire", from: "2:a17", to: "2:top-17", role: "ground" },
      ],
    },
    {
      title: {
        en: "Each switch's bottom leg to a pin, GP22 to GP18",
        fr: "La patte du bas de chaque interrupteur à une broche, de GP22 à GP18",
      },
      note: {
        en: "Switch 1's goes straight down to GP22. GND comes next on the Pico, so the other four lean one column over to GP21, GP20, GP19 and GP18.",
        fr: "Celle de l’interrupteur 1 descend tout droit à GP22. Le GND vient ensuite sur le Pico, alors les quatre autres penchent d’une colonne vers GP21, GP20, GP19 et GP18.",
      },
      parts: [
        { kind: "wire", from: "a13", to: "2:j13", role: "signal" },
        { kind: "wire", from: "a15", to: "2:j14", role: "signal" },
        { kind: "wire", from: "a16", to: "2:j15", role: "signal" },
        { kind: "wire", from: "a17", to: "2:j16", role: "signal" },
        { kind: "wire", from: "a18", to: "2:j17", role: "signal" },
      ],
    },
  ],
  script: {
    en: `from machine import Pin
from time import sleep

switches = [Pin(gpio, Pin.IN, Pin.PULL_UP) for gpio in (22, 21, 20, 19, 18)]

while True:
    on = [str(number) for number, switch in enumerate(switches, 1) if switch.value() == 0]
    print("On:", " ".join(on) if on else "none")
    sleep(0.5)`,
    fr: `from machine import Pin
from time import sleep

interrupteurs = [Pin(gpio, Pin.IN, Pin.PULL_UP) for gpio in (22, 21, 20, 19, 18)]

while True:
    en_marche = [str(numero) for numero, interrupteur in enumerate(interrupteurs, 1) if interrupteur.value() == 0]
    print("En marche", " ".join(en_marche) if en_marche else "aucun")
    sleep(0.5)`,
  },
  test: {
    en: "Twice a second, the script prints which switches are on, by their numbers, or none. Turn each one on and off, and see its number come and go.",
    fr: "Deux fois par seconde, le script affiche les numéros des interrupteurs en marche, ou aucun. Mettez chacun en marche puis à l’arrêt, et regardez son numéro apparaître puis disparaître.",
  },
} satisfies Circuit;
