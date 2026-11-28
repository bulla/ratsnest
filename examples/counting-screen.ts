// ratsnest's first example with a screen (ADR 0060, ADR 0061): a 16 by 2 character LCD beside the
// board, on its I2C backpack's four jumpers, and a script that greets and counts through a library
// the circuit names (ADR 0062). Not one of scratchpi's (ADR 0014).
import type { Circuit } from "ratsnest";

export default {
  format: 2,
  setup: { kind: "pico" },
  name: { en: "Counting screen", fr: "Écran qui compte" },
  description: {
    en: "A character LCD of two rows of 16 beside the board, driven over I2C by GP14 and GP15 through the backpack on its back. It takes its power from VBUS. The script writes a greeting on its top row and counts the seconds on its bottom one.",
    fr: "Un afficheur LCD de deux lignes de 16 caractères à côté de la plaque, piloté en I2C par GP14 et GP15 à travers le module fixé à son dos. Il prend son alimentation sur VBUS. Le script écrit un bonjour sur sa ligne du haut et compte les secondes sur celle du bas.",
  },
  credit: {
    en: "The Pico 2 W is drawn from its datasheet, adapting the Raspberry Pi Pico 2 W pinout, © Raspberry Pi Ltd, under CC BY-SA 4.0 (creativecommons.org/licenses/by-sa/4.0). This drawing is shared under the same licence. Set in Nunito, under the SIL Open Font License 1.1.",
    fr: "Le Pico 2 W est dessiné d’après sa fiche technique, en adaptant le brochage du Raspberry Pi Pico 2 W, © Raspberry Pi Ltd, sous licence CC BY-SA 4.0 (creativecommons.org/licenses/by-sa/4.0). Ce dessin est partagé sous la même licence. Composé en Nunito, sous la licence SIL Open Font 1.1.",
  },
  steps: [
    {
      title: { en: "Take VBUS over the board", fr: "Faites passer VBUS par-dessus la plaque" },
      note: {
        en: "A long jumper that arches over the Pico. The screen takes its power from VBUS, the USB's own, rather than 3V3, and VBUS must never reach a GPIO pin.",
        fr: "Un long fil qui passe en arc par-dessus le Pico. L’écran prend son alimentation sur VBUS, celle de l’USB, plutôt que sur le 3V3, et VBUS ne doit jamais atteindre une broche GPIO.",
      },
      parts: [{ kind: "wire", from: "a2", to: "a23", role: "power", arch: true }],
    },
    {
      title: {
        en: "Bring VBUS across the channel",
        fr: "Faites traverser la rainure à VBUS",
      },
      parts: [{ kind: "wire", from: "e23", to: "f23", role: "power" }],
    },
    {
      title: { en: "LCD on GP14 and GP15", fr: "Écran LCD sur GP14 et GP15" },
      note: {
        en: "Check that the small black jumper sits on the two pins at the backpack's far end: it turns the backlight on. Then push a female-to-male jumper onto each of its four pins.",
        fr: "Vérifiez que le petit cavalier noir est bien sur les deux broches à l’autre bout du module : il allume le rétroéclairage. Enfoncez ensuite un fil femelle-mâle sur chacune de ses quatre broches.",
      },
      parts: [
        {
          kind: "lcd",
          name: { en: "LCD", fr: "écran LCD" },
          ground: "j19",
          power: "j23",
          data: "j20",
          clock: "j21",
        },
      ],
    },
  ],
  libraries: [
    {
      name: "RPI-PICO-I2C-LCD",
      url: "https://github.com/T-622/RPI-PICO-I2C-LCD",
      files: [
        "https://raw.githubusercontent.com/T-622/RPI-PICO-I2C-LCD/main/lcd_api.py",
        "https://raw.githubusercontent.com/T-622/RPI-PICO-I2C-LCD/main/pico_i2c_lcd.py",
      ],
    },
  ],
  script: {
    en: `from machine import I2C, Pin
from time import sleep
from pico_i2c_lcd import I2cLcd

i2c = I2C(1, sda=Pin(14), scl=Pin(15), freq=400000)
lcd = I2cLcd(i2c, 0x27, 2, 16)

try:
    lcd.clear()
    lcd.putstr("Hello, world!")
    lcd.move_to(0, 1)
    lcd.putstr("Seconds:")
    seconds = 0
    while True:
        lcd.move_to(9, 1)
        lcd.putstr(str(seconds))
        seconds += 1
        sleep(1)
finally:
    lcd.clear()`,
    fr: `from machine import I2C, Pin
from time import sleep
from pico_i2c_lcd import I2cLcd

i2c = I2C(1, sda=Pin(14), scl=Pin(15), freq=400000)
ecran = I2cLcd(i2c, 0x27, 2, 16)

try:
    ecran.clear()
    ecran.putstr("Bonjour !")
    ecran.move_to(0, 1)
    ecran.putstr("Secondes :")
    secondes = 0
    while True:
        ecran.move_to(11, 1)
        ecran.putstr(str(secondes))
        secondes += 1
        sleep(1)
finally:
    ecran.clear()`,
  },
  test: {
    en: "The screen writes Hello, world! on its top row, and counts the seconds on its bottom one. If it shows nothing, or a row of blocks, turn its contrast dial. Press Stop in Thonny to end the script, and the screen clears.",
    fr: "L’écran écrit Bonjour ! sur sa ligne du haut et compte les secondes sur celle du bas. S’il n’affiche rien, ou une rangée de pavés, tournez sa molette de contraste. Appuyez sur Arrêter dans Thonny pour terminer le script, et l’écran s’efface.",
  },
} satisfies Circuit;
