// scratchpi's RGB LED, ported as one of ratsnest's examples (ADR 0014).
import type { Circuit } from "ratsnest";

export default {
  format: 2,
  setup: { type: "pico" },
  name: { en: "RGB LED", fr: "LED RVB" },
  description: {
    en: "Four buttons in a cross, and an RGB LED that can be lit in any colour. It is an addressable LED, with a controller of its own: it takes its colour as data on GP28 and its power from VBUS, and needs no resistor. It goes on a second breadboard above the first.",
    fr: "Quatre boutons en croix, et une LED RVB qu’on peut allumer dans n’importe quelle couleur. C’est une LED adressable, avec son propre contrôleur : elle reçoit sa couleur en données sur GP28 et son alimentation de VBUS, et n’a besoin d’aucune résistance. Elle se branche sur une seconde plaque, au-dessus de la première.",
  },
  credit: {
    en: "The Pico 2 W is drawn from its datasheet, adapting the Raspberry Pi Pico 2 W pinout, © Raspberry Pi Ltd, under CC BY-SA 4.0 (creativecommons.org/licenses/by-sa/4.0). This drawing is shared under the same licence. Set in Nunito, under the SIL Open Font License 1.1.",
    fr: "Le Pico 2 W est dessiné d’après sa fiche technique, en adaptant le brochage du Raspberry Pi Pico 2 W, © Raspberry Pi Ltd, sous licence CC BY-SA 4.0 (creativecommons.org/licenses/by-sa/4.0). Ce dessin est partagé sous la même licence. Composé en Nunito, sous la licence SIL Open Font 1.1.",
  },
  leds: [
    {
      id: "rgb",
      name: { en: "RGB LED", fr: "LED RVB" },
      pin: { kind: "rgb", gpio: 28, count: 1 },
      colour: "rgb",
    },
  ],
  buttons: [
    {
      id: "right",
      name: { en: "BTN1", fr: "BTN1" },
      pin: { kind: "gpio", gpio: 16 },
      colour: "red",
    },
    {
      id: "left",
      name: { en: "BTN2", fr: "BTN2" },
      pin: { kind: "gpio", gpio: 15 },
      colour: "green",
    },
    {
      id: "up",
      name: { en: "BTN3", fr: "BTN3" },
      pin: { kind: "gpio", gpio: 18 },
      colour: "blue",
    },
    {
      id: "down",
      name: { en: "BTN4", fr: "BTN4" },
      pin: { kind: "gpio", gpio: 13 },
      colour: "yellow",
    },
  ],
  steps: [
    {
      title: { en: "Connect 3V3 to the top + rail", fr: "Reliez le 3V3 au rail + du haut" },
      note: {
        en: "Take it from 3V3(OUT). VBUS and VSYS, at the same end of the Pico, carry the USB's full voltage, which a GPIO pin must never see.",
        fr: "Prenez-le sur 3V3(OUT). VBUS et VSYS, au même bout du Pico, portent toute la tension de l’USB, qu’une broche GPIO ne doit jamais recevoir.",
      },
      parts: [{ kind: "wire", from: "a6", to: "top+7", role: "power" }],
    },
    {
      title: {
        en: "Connect the bottom − rail to ground",
        fr: "Reliez le rail − du bas à la masse",
      },
      parts: [{ kind: "wire", from: "j14", to: "bottom-14", role: "ground" }],
    },
    {
      title: {
        en: "Bring 3V3 through the middle of the cross",
        fr: "Amenez le 3V3 par le milieu de la croix",
      },
      note: {
        en: "The middle of the d-pad is the one place the channel is not under a button. 3V3 crosses it there, and goes on to the bottom + rail.",
        fr: "Le milieu de la croix directionnelle est le seul endroit où la rainure centrale n’est pas sous un bouton. Le 3V3 la traverse là, et continue jusqu’au rail + du bas.",
      },
      parts: [
        { kind: "wire", from: "a26", to: "top+27", role: "power" },
        { kind: "wire", from: "e26", to: "f26", role: "power" },
        { kind: "wire", from: "j26", to: "bottom+27", role: "power" },
      ],
    },
    {
      title: { en: "BTN3 on GP18", fr: "BTN3 sur GP18" },
      note: {
        en: "It sits above the channel, not across it. Its two legs in a column are always joined, and pressing it joins its left-hand column to its right-hand one.",
        fr: "Il est au-dessus de la rainure centrale, pas à cheval dessus. Ses deux pattes d’une même colonne sont toujours reliées, et appuyer relie sa colonne de gauche à sa colonne de droite.",
      },
      parts: [
        { kind: "wire", from: "a18", to: "a25", role: "signal" },
        { kind: "button", button: "up", columns: [25, 27], rows: ["b", "e"] },
        { kind: "wire", from: "a27", to: "top+28", role: "power" },
      ],
    },
    {
      title: {
        en: "Hold GP18 low with a resistor",
        fr: "Maintenez GP18 au niveau bas avec une résistance",
      },
      note: {
        en: "The button has no hole to spare beside it, so the resistor goes by the pin instead, into the strip of one of the Pico's GND pins.",
        fr: "Il ne reste pas de trou libre à côté du bouton, alors la résistance se place près de la broche, dans la bande d’une des broches GND du Pico.",
      },
      parts: [{ kind: "resistor", ohms: 4700, from: "b18", to: "b14" }],
    },
    {
      title: { en: "BTN4 on GP13", fr: "BTN4 sur GP13" },
      note: {
        en: "Below the channel, under BTN3. Its jumper is a long one that arches over the bottom of the board, because every hole a flat one could run along is taken. Its 3V3 comes from the middle of the cross.",
        fr: "Sous la rainure centrale, en dessous de BTN3. Son fil est un long fil qui passe par-dessus le bas de la plaque, car tous les trous le long desquels un fil à plat pourrait passer sont pris. Son 3V3 vient du milieu de la croix.",
      },
      parts: [
        { kind: "wire", from: "j18", to: "j25", role: "signal", arch: true },
        { kind: "button", button: "down", columns: [25, 27], rows: ["f", "i"] },
        { kind: "wire", from: "i26", to: "j27", role: "power" },
      ],
    },
    {
      title: {
        en: "Hold GP13 low with a resistor",
        fr: "Maintenez GP13 au niveau bas avec une résistance",
      },
      note: {
        en: "Straight from the pin to the − rail: between the Pico and the rail there is no room for it to lie flat.",
        fr: "Directement de la broche au rail − : entre le Pico et le rail, il n’y a pas la place de la coucher.",
      },
      parts: [{ kind: "resistor", ohms: 4700, from: "i18", to: "bottom-17" }],
    },
    {
      title: { en: "BTN2 on GP15", fr: "BTN2 sur GP15" },
      note: {
        en: "Across the channel, its 3V3 from the bottom + rail.",
        fr: "À cheval sur la rainure centrale, son 3V3 venant du rail + du bas.",
      },
      parts: [
        { kind: "wire", from: "i21", to: "i22", role: "signal" },
        { kind: "button", button: "left", columns: [22, 24] },
        { kind: "wire", from: "j24", to: "bottom+23", role: "power" },
      ],
    },
    {
      title: {
        en: "Hold GP15 low with a resistor",
        fr: "Maintenez GP15 au niveau bas avec une résistance",
      },
      note: {
        en: "By the pin, into the bottom − rail.",
        fr: "Près de la broche, jusqu’au rail − du bas.",
      },
      parts: [{ kind: "resistor", ohms: 4700, from: "j21", to: "bottom-22" }],
    },
    {
      title: { en: "BTN1 on GP16", fr: "BTN1 sur GP16" },
      note: {
        en: "The far side of the cross. BTN3 and BTN4 take the only free hole in each of their columns, so no flat jumper can get past them: GP16's is a long one that arches over the top of the board.",
        fr: "L’autre côté de la croix. BTN3 et BTN4 prennent le seul trou libre de chacune de leurs colonnes, alors aucun fil à plat ne peut passer : celui de GP16 est un long fil qui passe par-dessus le haut de la plaque.",
      },
      parts: [
        { kind: "wire", from: "b21", to: "b28", role: "signal", arch: true },
        { kind: "button", button: "right", columns: [28, 30] },
        { kind: "wire", from: "a30", to: "top+29", role: "power" },
      ],
    },
    {
      title: {
        en: "Hold GP16 low with a resistor",
        fr: "Maintenez GP16 au niveau bas avec une résistance",
      },
      note: {
        en: "Below the channel, where the button's legs carry GP16, down to the bottom − rail.",
        fr: "Sous la rainure centrale, où les pattes du bouton prolongent GP16, jusqu’au rail − du bas.",
      },
      parts: [{ kind: "resistor", ohms: 4700, from: "h28", to: "bottom-28" }],
    },
    {
      title: {
        en: "Take VBUS, ground and GP28 up to a second breadboard",
        fr: "Montez VBUS, la masse et GP28 jusqu’à une seconde plaque",
      },
      note: {
        en: "Snap a second half-size breadboard onto the top edge of the first, column 1 over column 1: they are made to join along their long sides. The LED takes its power from VBUS rather than 3V3, and VBUS must never reach a GPIO pin.",
        fr: "Emboîtez une seconde plaque d’essai demi-taille sur le bord du haut de la première, la colonne 1 au-dessus de la colonne 1 : elles sont faites pour s’emboîter par leurs grands côtés. La LED prend son alimentation sur VBUS plutôt que sur le 3V3, et VBUS ne doit jamais atteindre une broche GPIO.",
      },
      parts: [
        { kind: "wire", from: "a2", to: "2:j2", role: "power" },
        { kind: "wire", from: "a4", to: "2:j4", role: "ground" },
        { kind: "wire", from: "a8", to: "2:j8", role: "signal" },
      ],
    },
    {
      title: { en: "RGB LED on GP28", fr: "LED RVB sur GP28" },
      note: {
        en: "Its longest leg is data out, which joins nothing while there is only one LED. It needs no resistor: it has a controller of its own, which sets its current.",
        fr: "Sa plus longue patte est la sortie des données, qui n’est reliée à rien tant qu’il n’y a qu’une LED. Elle n’a besoin d’aucune résistance : elle a son propre contrôleur, qui règle son courant.",
      },
      parts: [
        {
          kind: "rgbLed",
          led: "rgb",
          power: "2:f2",
          dataOut: "2:f3",
          ground: "2:f4",
          dataIn: "2:f5",
        },
        { kind: "wire", from: "2:h8", to: "2:h5", role: "signal" },
      ],
    },
  ],
  script: {
    en: `from machine import Pin
from neopixel import NeoPixel
from time import sleep

rgb_led = NeoPixel(Pin(28), 1)
btn1 = Pin(16, Pin.IN)
btn2 = Pin(15, Pin.IN)
btn3 = Pin(18, Pin.IN)
btn4 = Pin(13, Pin.IN)

caps = (
    (btn1, (255, 0, 0)),
    (btn2, (0, 255, 0)),
    (btn3, (0, 0, 255)),
    (btn4, (255, 150, 0)),
)

while True:
    colour = (0, 0, 0)
    for button, cap in caps:
        if button.value():
            colour = cap
    rgb_led[0] = colour
    rgb_led.write()
    sleep(0.02)`,
    fr: `from machine import Pin
from neopixel import NeoPixel
from time import sleep

led_rvb = NeoPixel(Pin(28), 1)
btn1 = Pin(16, Pin.IN)
btn2 = Pin(15, Pin.IN)
btn3 = Pin(18, Pin.IN)
btn4 = Pin(13, Pin.IN)

caps = (
    (btn1, (255, 0, 0)),
    (btn2, (0, 255, 0)),
    (btn3, (0, 0, 255)),
    (btn4, (255, 150, 0)),
)

while True:
    colour = (0, 0, 0)
    for button, cap in caps:
        if button.value():
            colour = cap
    led_rvb[0] = colour
    led_rvb.write()
    sleep(0.02)`,
  },
  test: {
    en: "Hold a button down and the LED lights in its cap's colour: BTN1 red, BTN2 green, BTN3 blue and BTN4 yellow. Let go and it goes out. Press Stop in Thonny to end the script.",
    fr: "Maintenez un bouton enfoncé et la LED s’allume de la couleur de son capuchon : BTN1 en rouge, BTN2 en vert, BTN3 en bleu et BTN4 en jaune. Relâchez-le et elle s’éteint. Appuyez sur Arrêter dans Thonny pour terminer le script.",
  },
} satisfies Circuit;
