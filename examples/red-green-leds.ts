// scratchpi's Red/Green LEDs, ported as one of ratsnest's examples (ADR 0014).
import type { Circuit } from "ratsnest";

export default {
  format: 1,
  name: { en: "Red/Green LEDs", fr: "LED rouge et verte" },
  description: {
    en: "Two LEDs, a red one and a green one, each wired from its own pin through a resistor to ground.",
    fr: "Deux LED, une rouge et une verte, chacune reliée de sa propre broche à la masse à travers une résistance.",
  },
  credit: {
    en: "The Pico 2 W is drawn from its datasheet, adapting the Raspberry Pi Pico 2 W pinout, © Raspberry Pi Ltd, under CC BY-SA 4.0 (creativecommons.org/licenses/by-sa/4.0). This drawing is shared under the same licence. Set in Nunito, under the SIL Open Font License 1.1.",
    fr: "Le Pico 2 W est dessiné d’après sa fiche technique, en adaptant le brochage du Raspberry Pi Pico 2 W, © Raspberry Pi Ltd, sous licence CC BY-SA 4.0 (creativecommons.org/licenses/by-sa/4.0). Ce dessin est partagé sous la même licence. Composé en Nunito, sous la licence SIL Open Font 1.1.",
  },
  leds: [
    {
      id: "red",
      name: { en: "red LED", fr: "LED rouge" },
      pin: { kind: "gpio", gpio: 15 },
      colour: "red",
    },
    {
      id: "green",
      name: { en: "green LED", fr: "LED verte" },
      pin: { kind: "gpio", gpio: 16 },
      colour: "green",
    },
  ],
  steps: [
    {
      title: { en: "Connect both − rails to ground", fr: "Reliez les deux rails − à la masse" },
      parts: [
        { kind: "wire", from: "a19", to: "top-19", role: "ground" },
        { kind: "wire", from: "j19", to: "bottom-19", role: "ground" },
      ],
    },
    {
      title: { en: "Green LED on GP16", fr: "LED verte sur GP16" },
      parts: [
        { kind: "resistor", ohms: 330, from: "a21", to: "a26" },
        { kind: "led", led: "green", anode: "e26", cathode: "e27" },
        { kind: "wire", from: "a27", to: "top-27", role: "ground" },
      ],
    },
    {
      title: { en: "Red LED on GP15", fr: "LED rouge sur GP15" },
      note: {
        en: "The same as the green one, mirrored below the channel.",
        fr: "Comme la verte, en miroir sous la rainure centrale.",
      },
      parts: [
        { kind: "resistor", ohms: 330, from: "j21", to: "j26" },
        { kind: "led", led: "red", anode: "i26", cathode: "i27" },
        { kind: "wire", from: "j27", to: "bottom-27", role: "ground" },
      ],
    },
  ],
  script: {
    en: `from machine import Pin
from time import sleep

red_led = Pin(15, Pin.OUT)
green_led = Pin(16, Pin.OUT)

for i in range(5):
    red_led.on()
    green_led.off()
    sleep(0.5)
    red_led.off()
    green_led.on()
    sleep(0.5)
green_led.off()`,
    fr: `from machine import Pin
from time import sleep

led_rouge = Pin(15, Pin.OUT)
led_verte = Pin(16, Pin.OUT)

for i in range(5):
    led_rouge.on()
    led_verte.off()
    sleep(0.5)
    led_rouge.off()
    led_verte.on()
    sleep(0.5)
led_verte.off()`,
  },
  scriptDoes: {
    en: "The two lights take turns five times, then both go off.",
    fr: "Les deux LED s’allument chacune à leur tour cinq fois, puis s’éteignent toutes les deux.",
  },
} satisfies Circuit;
