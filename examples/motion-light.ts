// ratsnest's first example with a part beside the board (ADR 0043, ADR 0044): a PIR motion sensor
// on jumpers, and a light it turns on for two seconds. Not one of scratchpi's (ADR 0014).
import type { Circuit } from "ratsnest";

export default {
  format: 2,
  setup: { kind: "pico" },
  name: { en: "Motion light", fr: "Lumière à détection de mouvement" },
  description: {
    en: "A PIR motion sensor beside the board, and a red LED. The sensor takes its power from VBUS and holds GP22 high while it sees someone move, and each time it does, the script lights the LED for two seconds.",
    fr: "Un détecteur de mouvement PIR à côté de la plaque, et une LED rouge. Le détecteur prend son alimentation sur VBUS et met GP22 au niveau haut tant qu’il voit quelqu’un bouger, et chaque fois, le script allume la LED pendant deux secondes.",
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
  ],
  sensors: [
    {
      id: "pir",
      name: { en: "motion sensor", fr: "détecteur de mouvement" },
      pin: { kind: "gpio", gpio: 22 },
    },
  ],
  steps: [
    {
      title: {
        en: "Connect the bottom − rail to ground",
        fr: "Reliez le rail − du bas à la masse",
      },
      parts: [{ kind: "wire", from: "j19", to: "bottom-19", role: "ground" }],
    },
    {
      title: { en: "Motion sensor on GP22", fr: "Détecteur de mouvement sur GP22" },
      note: {
        en: "Push a female-to-male jumper onto each of its pins. It takes its power from VBUS, the USB's own, rather than 3V3, and holds its pin high while it sees movement. Turn its time dial fully anticlockwise, for the shortest time, and its sensitivity dial to the middle.",
        fr: "Enfoncez un fil femelle-mâle sur chacune de ses broches. Il prend son alimentation sur VBUS, celle de l’USB, plutôt que sur le 3V3, et met sa broche au niveau haut tant qu’il voit du mouvement. Tournez son réglage de durée à fond dans le sens inverse des aiguilles d’une montre, pour la durée la plus courte, et son réglage de sensibilité à mi-course.",
      },
      parts: [{ kind: "pir", sensor: "pir", power: "a2", output: "a13", ground: "a14" }],
    },
    {
      title: { en: "Red LED on GP15", fr: "LED rouge sur GP15" },
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
motion_sensor = Pin(22, Pin.IN)

try:
    while True:
        if motion_sensor.value():
            red_led.value(1)
            sleep(2)
            red_led.value(0)
            while motion_sensor.value():
                sleep(0.05)
        sleep(0.05)
finally:
    red_led.value(0)`,
    fr: `from machine import Pin
from time import sleep

led_rouge = Pin(15, Pin.OUT)
detecteur = Pin(22, Pin.IN)

try:
    while True:
        if detecteur.value():
            led_rouge.value(1)
            sleep(2)
            led_rouge.value(0)
            while detecteur.value():
                sleep(0.05)
        sleep(0.05)
finally:
    led_rouge.value(0)`,
  },
  test: {
    en: "Wait a minute for the sensor to settle. Then wave a hand in front of its dome, and the red LED lights for two seconds. Once the sensor has seen nothing for a few seconds, the next movement lights it again. Press Stop in Thonny to end the script.",
    fr: "Attendez une minute que le détecteur se stabilise. Passez ensuite la main devant son dôme, et la LED rouge s’allume pendant deux secondes. Quand le détecteur n’a rien vu pendant quelques secondes, le mouvement suivant la rallume. Appuyez sur Arrêter dans Thonny pour terminer le script.",
  },
} satisfies Circuit;
