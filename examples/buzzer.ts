// scratchpi's Buzzer, ported as one of ratsnest's examples (ADR 0014).
import type { Circuit } from "ratsnest";

export default {
  format: 2,
  name: { en: "Buzzer", fr: "Buzzer" },
  description: {
    en: "A passive buzzer and a push button, BTN1. The buzzer is wired from its pin to ground, and switching the pin on and off hundreds of times a second makes a note: how fast is which note. The button is pulled down, so its pin reads low until it is held.",
    fr: "Un buzzer passif et un bouton poussoir, BTN1. Le buzzer est relié de sa broche à la masse, et allumer puis éteindre la broche des centaines de fois par seconde fait une note : la vitesse décide de la note. Le bouton a une résistance de rappel à la masse : sa broche lit un niveau bas tant qu’on n’appuie pas dessus.",
  },
  credit: {
    en: "The Pico 2 W is drawn from its datasheet, adapting the Raspberry Pi Pico 2 W pinout, © Raspberry Pi Ltd, under CC BY-SA 4.0 (creativecommons.org/licenses/by-sa/4.0). This drawing is shared under the same licence. Set in Nunito, under the SIL Open Font License 1.1.",
    fr: "Le Pico 2 W est dessiné d’après sa fiche technique, en adaptant le brochage du Raspberry Pi Pico 2 W, © Raspberry Pi Ltd, sous licence CC BY-SA 4.0 (creativecommons.org/licenses/by-sa/4.0). Ce dessin est partagé sous la même licence. Composé en Nunito, sous la licence SIL Open Font 1.1.",
  },
  buttons: [
    {
      id: "button",
      name: { en: "BTN1", fr: "BTN1" },
      pin: { kind: "gpio", gpio: 16 },
      colour: "red",
    },
  ],
  buzzers: [
    {
      id: "buzzer",
      name: { en: "buzzer", fr: "buzzer" },
      pin: { kind: "gpio", gpio: 15 },
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
      title: { en: "Connect 3V3 to the top + rail", fr: "Reliez le 3V3 au rail + du haut" },
      note: {
        en: "Take it from 3V3(OUT). VBUS and VSYS, at the same end of the Pico, carry the USB's full voltage, which a GPIO pin must never see.",
        fr: "Prenez-le sur 3V3(OUT). VBUS et VSYS, au même bout du Pico, portent toute la tension de l’USB, qu’une broche GPIO ne doit jamais recevoir.",
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
      title: { en: "Buzzer on GP15", fr: "Buzzer sur GP15" },
      note: {
        en: "It has to be a passive buzzer. An active one plays its own note whatever the program asks for.",
        fr: "Il faut un buzzer passif. Un buzzer actif joue sa propre note, quoi que demande le programme.",
      },
      parts: [
        { kind: "wire", from: "j21", to: "j26", role: "signal" },
        { kind: "buzzer", buzzer: "buzzer", plus: "i26", minus: "i29" },
        { kind: "wire", from: "j29", to: "bottom-29", role: "ground" },
      ],
    },
  ],
  script: {
    en: `from machine import Pin, PWM
from time import sleep

buzzer = PWM(Pin(15))
btn1 = Pin(16, Pin.IN)

try:
    while True:
        if btn1.value():
            buzzer.freq(880)
            buzzer.duty_u16(32768)
        else:
            buzzer.duty_u16(0)
        sleep(0.02)
finally:
    buzzer.duty_u16(0)`,
    fr: `from machine import Pin, PWM
from time import sleep

buzzer = PWM(Pin(15))
btn1 = Pin(16, Pin.IN)

try:
    while True:
        if btn1.value():
            buzzer.freq(880)
            buzzer.duty_u16(32768)
        else:
            buzzer.duty_u16(0)
        sleep(0.02)
finally:
    buzzer.duty_u16(0)`,
  },
  test: {
    en: "Hold the button down and the buzzer plays a high A. Let go and it stops. Press Stop in Thonny to end the script.",
    fr: "Maintenez le bouton enfoncé et le buzzer joue un LA aigu. Relâchez-le et il se tait. Appuyez sur Arrêter dans Thonny pour terminer le script.",
  },
} satisfies Circuit;
