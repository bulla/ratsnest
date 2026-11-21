// scratchpi's Light ring, ported as one of ratsnest's examples (ADR 0014).
import type { Circuit } from "ratsnest";

export default {
  format: 1,
  name: { en: "Light ring", fr: "Anneau lumineux" },
  description: {
    en: "A ring of twelve RGB LEDs and a push button, BTN1. The ring's LEDs are addressable: each takes its colour as data, one after the other down one wire from GP15, so each can be lit in a colour of its own. The ring takes its power from VBUS and needs no resistor.",
    fr: "Un anneau de douze LED RVB et un bouton poussoir, BTN1. Les LED de l’anneau sont adressables : chacune reçoit sa couleur en données, l’une après l’autre, par un seul fil depuis GP15, et chacune peut donc s’allumer dans sa propre couleur. L’anneau prend son alimentation de VBUS et n’a besoin d’aucune résistance.",
  },
  leds: [
    {
      id: "ring",
      name: { en: "LED ring", fr: "anneau de LED" },
      pin: { kind: "rgb", gpio: 15, count: 12 },
      colour: "rgb",
    },
  ],
  buttons: [
    {
      id: "button",
      name: { en: "BTN1", fr: "BTN1" },
      pin: { kind: "gpio", gpio: 16 },
      colour: "red",
    },
  ],
  steps: [
    {
      title: { en: "Connect the top − rail to ground", fr: "Reliez le rail − du haut à la masse" },
      parts: [{ kind: "wire", from: "a19", to: "top-19", role: "ground" }],
    },
    {
      title: { en: "Connect 3V3 to the top + rail", fr: "Reliez le 3V3 au rail + du haut" },
      note: {
        en: "Take it from 3V3(OUT). VBUS and VSYS, at the same end of the Pico, carry 5 V from the USB, which a GPIO pin must never see.",
        fr: "Prenez-le sur 3V3(OUT). VBUS et VSYS, au même bout du Pico, portent les 5 V de l’USB, qu’une broche GPIO ne doit jamais recevoir.",
      },
      parts: [{ kind: "wire", from: "a6", to: "top+7", role: "power" }],
    },
    {
      title: { en: "BTN1 on GP16", fr: "BTN1 sur GP16" },
      note: {
        en: "The button's legs across the channel are always joined. Pressing it joins its left-hand legs to its right-hand ones, which is why it has to sit across the channel.",
        fr: "Les pattes du bouton de part et d’autre de la rainure sont toujours reliées. Appuyer relie ses pattes de gauche à ses pattes de droite ; c’est pourquoi il doit être à cheval sur la rainure.",
      },
      parts: [
        { kind: "wire", from: "a21", to: "a23", role: "signal" },
        { kind: "button", button: "button", columns: [23, 25] },
        { kind: "wire", from: "a25", to: "top+26", role: "power" },
      ],
    },
    {
      title: {
        en: "Hold GP16 low with a resistor",
        fr: "Maintenez GP16 au niveau bas avec une résistance",
      },
      note: {
        en: "Without it the pin floats while the button is up, and reads a press nobody made.",
        fr: "Sans elle, la broche flotte tant que le bouton est relâché, et lit un appui que personne n’a fait.",
      },
      parts: [
        { kind: "resistor", ohms: 4700, from: "b23", to: "b27" },
        { kind: "wire", from: "a27", to: "top-27", role: "ground" },
      ],
    },
    {
      title: {
        en: "Take 5 V from VBUS over the board",
        fr: "Amenez le 5 V de VBUS par-dessus la plaque",
      },
      note: {
        en: "A long jumper that arches over the top of the board, since everything along the top rows is taken. The ring takes 5 V from VBUS rather than 3V3, and 5 V must never reach a GPIO pin or the button.",
        fr: "Un long fil qui passe par-dessus le haut de la plaque, car tout est pris le long des rangées du haut. L’anneau prend le 5 V sur VBUS plutôt que le 3V3, et le 5 V ne doit jamais atteindre une broche GPIO ni le bouton.",
      },
      parts: [{ kind: "wire", from: "a2", to: "a28", role: "power", arch: true }],
    },
    {
      title: {
        en: "Bring 5 V and ground across the channel",
        fr: "Amenez le 5 V et la masse de l’autre côté de la rainure centrale",
      },
      note: {
        en: "Ground comes from the strip BTN1's pull-down already joins to the − rail.",
        fr: "La masse vient de la bande que la résistance de rappel de BTN1 relie déjà au rail −.",
      },
      parts: [
        { kind: "wire", from: "e27", to: "f27", role: "ground" },
        { kind: "wire", from: "e28", to: "f28", role: "power" },
      ],
    },
    {
      title: { en: "LED ring on GP15", fr: "Anneau de LED sur GP15" },
      note: {
        en: "Stand it up in the bottom row with its LEDs facing the Pico, so that its back, where its pins are named, faces you. The drawing lays it down below the board so that its LEDs show. LED 0 is the one by the pins. It needs no resistor: each LED has a controller of its own.",
        fr: "Plantez-le debout dans la rangée du bas, ses LED tournées vers le Pico, pour que son dos, où ses broches sont nommées, soit tourné vers vous. Le dessin le couche sous la plaque pour qu’on voie ses LED. La LED 0 est celle près des broches. Il n’a besoin d’aucune résistance : chaque LED a son propre contrôleur.",
      },
      parts: [
        { kind: "ring", led: "ring", dataOut: "j26", ground: "j27", power: "j28", dataIn: "j29" },
        { kind: "wire", from: "i21", to: "i29", role: "signal" },
      ],
    },
  ],
  script: {
    en: `from machine import Pin
from neopixel import NeoPixel
from time import sleep

led_ring = NeoPixel(Pin(15), 12)
btn1 = Pin(16, Pin.IN)

led = 0
try:
    while True:
        if btn1.value():
            colour = (0, 0, 255)
        else:
            colour = (255, 0, 0)
        led_ring.fill((0, 0, 0))
        led_ring[led] = colour
        led_ring.write()
        led = (led + 1) % 12
        sleep(0.2)
finally:
    led_ring.fill((0, 0, 0))
    led_ring.write()`,
    fr: `from machine import Pin
from neopixel import NeoPixel
from time import sleep

anneau_de_led = NeoPixel(Pin(15), 12)
btn1 = Pin(16, Pin.IN)

led = 0
try:
    while True:
        if btn1.value():
            colour = (0, 0, 255)
        else:
            colour = (255, 0, 0)
        anneau_de_led.fill((0, 0, 0))
        anneau_de_led[led] = colour
        anneau_de_led.write()
        led = (led + 1) % 12
        sleep(0.2)
finally:
    anneau_de_led.fill((0, 0, 0))
    anneau_de_led.write()`,
  },
  scriptDoes: {
    en: "A red light goes round the ring, one LED at a time, from LED 0, the one by the pins: it shows which way the numbers go. Hold the button down and it goes round blue. Press Stop in Thonny to end the script, and the ring goes out.",
    fr: "Une lumière rouge fait le tour de l’anneau, une LED à la fois, à partir de la LED 0, celle près des broches : elle montre dans quel sens vont les numéros. Maintenez le bouton enfoncé et elle tourne en bleu. Appuyez sur Arrêter dans Thonny pour terminer le script, et l’anneau s’éteint.",
  },
} satisfies Circuit;
