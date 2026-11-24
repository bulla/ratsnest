// The first example with a ceramic capacitor (ADR 0038, ADR 0051): one pin charges it through a
// resistor while another reads it, and the script prints how long it takes to charge.
import type { Circuit } from "ratsnest";

export default {
  format: 2,
  setup: { kind: "pico" },
  name: { en: "Capacitor timer", fr: "Chronomètre à condensateur" },
  description: {
    en: "A ceramic capacitor that GP16 charges through a resistor while GP17 reads it. The Pico counts how long the capacitor takes to charge, and the script prints it.",
    fr: "Un condensateur céramique que GP16 charge à travers une résistance pendant que GP17 le lit. Le Pico compte le temps que met le condensateur à se charger, et le script l’affiche.",
  },
  credit: {
    en: "The Pico 2 W is drawn from its datasheet, adapting the Raspberry Pi Pico 2 W pinout, © Raspberry Pi Ltd, under CC BY-SA 4.0 (creativecommons.org/licenses/by-sa/4.0). This drawing is shared under the same licence. Set in Nunito, under the SIL Open Font License 1.1.",
    fr: "Le Pico 2 W est dessiné d’après sa fiche technique, en adaptant le brochage du Raspberry Pi Pico 2 W, © Raspberry Pi Ltd, sous licence CC BY-SA 4.0 (creativecommons.org/licenses/by-sa/4.0). Ce dessin est partagé sous la même licence. Composé en Nunito, sous la licence SIL Open Font 1.1.",
  },
  steps: [
    {
      title: {
        en: "Connect the top − rail to ground",
        fr: "Reliez le rail − du haut à la masse",
      },
      parts: [{ kind: "wire", from: "a19", to: "top-19", role: "ground" }],
    },
    {
      title: { en: "The resistor, from GP16", fr: "La résistance, depuis GP16" },
      note: {
        en: "GP16 charges the capacitor through it, slowly enough for the Pico to count how long it takes.",
        fr: "GP16 charge le condensateur à travers elle, assez lentement pour que le Pico compte le temps que cela prend.",
      },
      parts: [{ kind: "resistor", ohms: 4700, from: "b21", to: "b26" }],
    },
    {
      title: {
        en: "The capacitor, one leg on ground",
        fr: "Le condensateur, une patte à la masse",
      },
      note: {
        en: "It goes in either way round. The code on the disc is its value, which the notes below explain.",
        fr: "Il se plante dans un sens ou dans l’autre. Le code sur le disque est sa valeur, que les remarques plus bas expliquent.",
      },
      parts: [
        { kind: "ceramic", nanofarads: 100, from: "e26", to: "e27" },
        { kind: "wire", from: "a27", to: "top-27", role: "ground" },
      ],
    },
    {
      title: { en: "GP17, to read the capacitor", fr: "GP17, pour lire le condensateur" },
      note: {
        en: "GP17 reads the capacitor's other leg. Once it reads high, the capacitor is charged.",
        fr: "GP17 lit l’autre patte du condensateur. Dès qu’elle lit un niveau haut, le condensateur est chargé.",
      },
      parts: [{ kind: "wire", from: "a20", to: "a26", role: "signal" }],
    },
  ],
  script: {
    en: `from machine import Pin
from time import sleep, ticks_diff, ticks_us

charge = Pin(16, Pin.OUT, value=0)
sense = Pin(17, Pin.IN)

for i in range(5):
    charge.off()
    sleep(0.1)
    start = ticks_us()
    charge.on()
    while not sense.value():
        pass
    print("Charged in", ticks_diff(ticks_us(), start), "microseconds")
    sleep(0.5)
charge.off()`,
    fr: `from machine import Pin
from time import sleep, ticks_diff, ticks_us

charge = Pin(16, Pin.OUT, value=0)
lecture = Pin(17, Pin.IN)

for i in range(5):
    charge.off()
    sleep(0.1)
    debut = ticks_us()
    charge.on()
    while not lecture.value():
        pass
    print("Chargé en", ticks_diff(ticks_us(), debut), "microsecondes")
    sleep(0.5)
charge.off()`,
  },
  test: {
    en: "The script empties the capacitor, charges it and prints how long it took, in microseconds, five times over, about the same each time. A larger capacitor, or a larger resistor, takes longer.",
    fr: "Le script vide le condensateur, le charge et affiche le temps que cela a pris, en microsecondes, cinq fois de suite, à peu près le même chaque fois. Un condensateur plus grand, ou une résistance plus grande, prend plus de temps.",
  },
} satisfies Circuit;
