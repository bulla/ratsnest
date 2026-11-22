import type { Layout, ShownCircuit } from "../circuit";
import { SKILL_CREDIT } from "./credit";

/** The test circuits' credit: ratsnest's, as the `circuit` skill gives it (ADR 0035). */
export const CREDIT = SKILL_CREDIT.en;

/**
 * The engine's own circuits, for its tests to build on and break on purpose. They are copies of
 * scratchpi's seven circuits and layouts (ADR 0001), renamed by what they hold, so that no test in
 * `src/` names a circuit that ships (ADR 0007): the ones that ship are `examples/`, from M3.
 */
export const FIXTURE_IDS = [
  "two-lights",
  "light-and-button",
  "buzzer-and-button",
  "button-each-side",
  "d-pad",
  "rgb-led-and-d-pad",
  "ring-and-button",
] as const;

export type FixtureId = (typeof FIXTURE_IDS)[number];

export interface Fixture {
  readonly circuit: ShownCircuit;
  readonly layout: Layout;
}

export const FIXTURES: Record<FixtureId, Fixture> = {
  "two-lights": {
    circuit: {
      name: "Two lights",
      description:
        "A red light and a green one, each wired from its own pin through a resistor to ground.",
      credit: CREDIT,
      leds: [
        { id: "red", name: "red LED", pin: { kind: "gpio", gpio: 15 }, colour: "red" },
        { id: "green", name: "green LED", pin: { kind: "gpio", gpio: 16 }, colour: "green" },
      ],
      buttons: [],
      buzzers: [],
    },
    layout: {
      steps: [
        {
          title: "Connect both − rails to ground",
          parts: [
            { kind: "wire", from: "a19", to: "top-19", role: "ground" },
            { kind: "wire", from: "j19", to: "bottom-19", role: "ground" },
          ],
        },
        {
          title: "Green LED on GP16",
          parts: [
            { kind: "resistor", ohms: 330, from: "a21", to: "a26" },
            { kind: "led", led: "green", anode: "e26", cathode: "e27" },
            { kind: "wire", from: "a27", to: "top-27", role: "ground" },
          ],
        },
        {
          title: "Red LED on GP15",
          parts: [
            { kind: "resistor", ohms: 330, from: "j21", to: "j26" },
            { kind: "led", led: "red", anode: "i26", cathode: "i27" },
            { kind: "wire", from: "j27", to: "bottom-27", role: "ground" },
          ],
          note: "The same as the green one, mirrored below the channel.",
        },
      ],
      script:
        "from machine import Pin\nfrom time import sleep\n\nred_led = Pin(15, Pin.OUT)\ngreen_led = Pin(16, Pin.OUT)\n\nfor i in range(5):\n    red_led.on()\n    green_led.off()\n    sleep(0.5)\n    red_led.off()\n    green_led.on()\n    sleep(0.5)\ngreen_led.off()",
      scriptDoes: "The two lights take turns five times, then both go off.",
    },
  },
  "light-and-button": {
    circuit: {
      name: "A light and a button",
      description:
        "A red light, and a push button pulled down so its pin reads low until it is held.",
      credit: CREDIT,
      leds: [{ id: "red", name: "red LED", pin: { kind: "gpio", gpio: 15 }, colour: "red" }],
      buttons: [{ id: "button", name: "BTN1", pin: { kind: "gpio", gpio: 16 }, colour: "red" }],
      buzzers: [],
    },
    layout: {
      steps: [
        {
          title: "Connect both − rails to ground",
          parts: [
            { kind: "wire", from: "a19", to: "top-19", role: "ground" },
            { kind: "wire", from: "j19", to: "bottom-19", role: "ground" },
          ],
        },
        {
          title: "Connect 3V3 to the top + rail",
          note: "Take it from 3V3(OUT). VBUS and VSYS, at the same end of the Pico, carry the USB's full voltage, which a GPIO pin must never see.",
          parts: [{ kind: "wire", from: "a6", to: "top+7", role: "power" }],
        },
        {
          title: "BTN1 on GP16",
          note: "The button's legs across the channel are always joined. Pressing it joins its left-hand legs to its right-hand ones, which is why it has to sit across the channel.",
          parts: [
            { kind: "wire", from: "a21", to: "a23", role: "signal" },
            { kind: "button", button: "button", columns: [23, 25] },
            { kind: "wire", from: "a25", to: "top+26", role: "power" },
          ],
        },
        {
          title: "Hold GP16 low with a resistor",
          note: "Without it the pin floats while the button is up, and reads a press nobody made.",
          parts: [
            { kind: "resistor", ohms: 4700, from: "b23", to: "b27" },
            { kind: "wire", from: "a27", to: "top-27", role: "ground" },
          ],
        },
        {
          title: "Red LED on GP15",
          parts: [
            { kind: "resistor", ohms: 330, from: "j21", to: "j26" },
            { kind: "led", led: "red", anode: "i26", cathode: "i27" },
            { kind: "wire", from: "j27", to: "bottom-27", role: "ground" },
          ],
        },
      ],
      script:
        "from machine import Pin\nfrom time import sleep\n\nred_led = Pin(15, Pin.OUT)\nbtn1 = Pin(16, Pin.IN)\n\nwhile True:\n    red_led.value(btn1.value())\n    sleep(0.02)",
      scriptDoes:
        "Hold the button down and the red LED lights. Let go and it goes out. Press Stop in Thonny to end the script.",
    },
  },
  "buzzer-and-button": {
    circuit: {
      name: "A buzzer and a button",
      description: "A passive buzzer wired from its pin to ground, and a push button.",
      credit: CREDIT,
      leds: [],
      buttons: [{ id: "button", name: "BTN1", pin: { kind: "gpio", gpio: 16 }, colour: "red" }],
      buzzers: [{ id: "buzzer", name: "buzzer", pin: { kind: "gpio", gpio: 15 } }],
    },
    layout: {
      steps: [
        {
          title: "Connect both − rails to ground",
          parts: [
            { kind: "wire", from: "a19", to: "top-19", role: "ground" },
            { kind: "wire", from: "j19", to: "bottom-19", role: "ground" },
          ],
        },
        {
          title: "Connect 3V3 to the top + rail",
          note: "Take it from 3V3(OUT). VBUS and VSYS, at the same end of the Pico, carry the USB's full voltage, which a GPIO pin must never see.",
          parts: [{ kind: "wire", from: "a6", to: "top+7", role: "power" }],
        },
        {
          title: "BTN1 on GP16",
          note: "The button's legs across the channel are always joined. Pressing it joins its left-hand legs to its right-hand ones, which is why it has to sit across the channel.",
          parts: [
            { kind: "wire", from: "a21", to: "a23", role: "signal" },
            { kind: "button", button: "button", columns: [23, 25] },
            { kind: "wire", from: "a25", to: "top+26", role: "power" },
          ],
        },
        {
          title: "Hold GP16 low with a resistor",
          note: "Without it the pin floats while the button is up, and reads a press nobody made.",
          parts: [
            { kind: "resistor", ohms: 4700, from: "b23", to: "b27" },
            { kind: "wire", from: "a27", to: "top-27", role: "ground" },
          ],
        },
        {
          title: "Buzzer on GP15",
          note: "It has to be a passive buzzer. An active one plays its own note whatever the program asks for.",
          parts: [
            { kind: "wire", from: "j21", to: "j26", role: "signal" },
            { kind: "buzzer", buzzer: "buzzer", plus: "i26", minus: "i29" },
            { kind: "wire", from: "j29", to: "bottom-29", role: "ground" },
          ],
        },
      ],
      script:
        "from machine import Pin, PWM\nfrom time import sleep\n\nbuzzer = PWM(Pin(15))\nbtn1 = Pin(16, Pin.IN)\n\ntry:\n    while True:\n        if btn1.value():\n            buzzer.freq(880)\n            buzzer.duty_u16(32768)\n        else:\n            buzzer.duty_u16(0)\n        sleep(0.02)\nfinally:\n    buzzer.duty_u16(0)",
      scriptDoes:
        "Hold the button down and the buzzer plays a high A. Let go and it stops. Press Stop in Thonny to end the script.",
    },
  },
  "button-each-side": {
    circuit: {
      name: "A button each side",
      description: "Two push buttons, one on each side of the Pico, each pulled down.",
      credit: CREDIT,
      leds: [],
      buttons: [
        { id: "right", name: "BTN1", pin: { kind: "gpio", gpio: 16 }, colour: "red" },
        { id: "left", name: "BTN2", pin: { kind: "gpio", gpio: 15 }, colour: "green" },
      ],
      buzzers: [],
    },
    layout: {
      steps: [
        {
          title: "Connect the bottom − rail to ground",
          parts: [{ kind: "wire", from: "j19", to: "bottom-19", role: "ground" }],
        },
        {
          title: "Connect 3V3 to the top + rail",
          note: "Take it from 3V3(OUT). VBUS and VSYS, at the same end of the Pico, carry the USB's full voltage, which a GPIO pin must never see.",
          parts: [{ kind: "wire", from: "a6", to: "top+7", role: "power" }],
        },
        {
          title: "BTN2 on GP15",
          note: "Its pin is reached below the channel and its supply comes in above. The button sits across the channel, and its legs join the two halves.",
          parts: [
            { kind: "wire", from: "j21", to: "j23", role: "signal" },
            { kind: "button", button: "left", columns: [23, 25] },
            { kind: "wire", from: "a25", to: "top+26", role: "power" },
          ],
        },
        {
          title: "Hold GP15 low with a resistor",
          note: "Without it the pin floats while the button is up, and reads a press nobody made.",
          parts: [{ kind: "resistor", ohms: 4700, from: "i23", to: "bottom-22" }],
        },
        {
          title: "BTN1 on GP16",
          note: "Further along the channel than BTN2, so each hand has a button of its own.",
          parts: [
            { kind: "wire", from: "b21", to: "b27", role: "signal" },
            { kind: "button", button: "right", columns: [27, 29] },
            { kind: "wire", from: "a29", to: "top+28", role: "power" },
          ],
        },
        {
          title: "Hold GP16 low with a resistor",
          note: "It goes in below the channel, beside BTN2's. The button's legs join GP16's column to the holes under it.",
          parts: [
            { kind: "resistor", ohms: 4700, from: "i27", to: "i30" },
            { kind: "wire", from: "j30", to: "bottom-28", role: "ground" },
          ],
        },
      ],
      script:
        'from machine import Pin\nfrom time import sleep\n\nbtn1 = Pin(16, Pin.IN)\nbtn2 = Pin(15, Pin.IN)\n\nshown = None\nwhile True:\n    now = (btn1.value(), btn2.value())\n    if now != shown:\n        print("btn1:", now[0], "btn2:", now[1])\n        shown = now\n    sleep(0.02)',
      scriptDoes:
        "Thonny's Shell shows 1 beside a button while it is held down, and 0 once it is let go. Press Stop in Thonny to end the script.",
    },
  },
  "d-pad": {
    circuit: {
      name: "A d-pad",
      description:
        "Four push buttons in a cross, each pulled down, two of them reached by jumpers that arch over the board.",
      credit: CREDIT,
      leds: [],
      buttons: [
        { id: "right", name: "BTN1", pin: { kind: "gpio", gpio: 16 }, colour: "red" },
        { id: "left", name: "BTN2", pin: { kind: "gpio", gpio: 15 }, colour: "green" },
        { id: "up", name: "BTN3", pin: { kind: "gpio", gpio: 18 }, colour: "blue" },
        { id: "down", name: "BTN4", pin: { kind: "gpio", gpio: 13 }, colour: "yellow" },
      ],
      buzzers: [],
    },
    layout: {
      steps: [
        {
          title: "Connect 3V3 to the top + rail",
          note: "Take it from 3V3(OUT). VBUS and VSYS, at the same end of the Pico, carry the USB's full voltage, which a GPIO pin must never see.",
          parts: [{ kind: "wire", from: "a6", to: "top+7", role: "power" }],
        },
        {
          title: "Connect the bottom − rail to ground",
          parts: [{ kind: "wire", from: "j14", to: "bottom-14", role: "ground" }],
        },
        {
          title: "Bring 3V3 through the middle of the cross",
          note: "The middle of the d-pad is the one place the channel is not under a button. 3V3 crosses it there, and goes on to the bottom + rail.",
          parts: [
            { kind: "wire", from: "a26", to: "top+27", role: "power" },
            { kind: "wire", from: "e26", to: "f26", role: "power" },
            { kind: "wire", from: "j26", to: "bottom+27", role: "power" },
          ],
        },
        {
          title: "BTN3 on GP18",
          note: "It sits above the channel, not across it. Its two legs in a column are always joined, and pressing it joins its left-hand column to its right-hand one.",
          parts: [
            { kind: "wire", from: "a18", to: "a25", role: "signal" },
            { kind: "button", button: "up", columns: [25, 27], rows: ["b", "e"] },
            { kind: "wire", from: "a27", to: "top+28", role: "power" },
          ],
        },
        {
          title: "Hold GP18 low with a resistor",
          note: "The button has no hole to spare beside it, so the resistor goes by the pin instead, into the strip of one of the Pico's GND pins.",
          parts: [{ kind: "resistor", ohms: 4700, from: "b18", to: "b14" }],
        },
        {
          title: "BTN4 on GP13",
          note: "Below the channel, under BTN3. Its jumper is a long one that arches over the bottom of the board, because every hole a flat one could run along is taken. Its 3V3 comes from the middle of the cross.",
          parts: [
            { kind: "wire", from: "j18", to: "j25", role: "signal", arch: true },
            { kind: "button", button: "down", columns: [25, 27], rows: ["f", "i"] },
            { kind: "wire", from: "i26", to: "j27", role: "power" },
          ],
        },
        {
          title: "Hold GP13 low with a resistor",
          note: "Straight from the pin to the − rail: between the Pico and the rail there is no room for it to lie flat.",
          parts: [{ kind: "resistor", ohms: 4700, from: "i18", to: "bottom-17" }],
        },
        {
          title: "BTN2 on GP15",
          note: "Across the channel, its 3V3 from the bottom + rail.",
          parts: [
            { kind: "wire", from: "i21", to: "i22", role: "signal" },
            { kind: "button", button: "left", columns: [22, 24] },
            { kind: "wire", from: "j24", to: "bottom+23", role: "power" },
          ],
        },
        {
          title: "Hold GP15 low with a resistor",
          note: "By the pin, into the bottom − rail.",
          parts: [{ kind: "resistor", ohms: 4700, from: "j21", to: "bottom-22" }],
        },
        {
          title: "BTN1 on GP16",
          note: "The far side of the cross. BTN3 and BTN4 take the only free hole in each of their columns, so no flat jumper can get past them: GP16's is a long one that arches over the top of the board.",
          parts: [
            { kind: "wire", from: "b21", to: "b28", role: "signal", arch: true },
            { kind: "button", button: "right", columns: [28, 30] },
            { kind: "wire", from: "a30", to: "top+29", role: "power" },
          ],
        },
        {
          title: "Hold GP16 low with a resistor",
          note: "Below the channel, where the button's legs carry GP16, down to the bottom − rail.",
          parts: [{ kind: "resistor", ohms: 4700, from: "h28", to: "bottom-28" }],
        },
      ],
      script:
        'from machine import Pin\nfrom time import sleep\n\nbtn1 = Pin(16, Pin.IN)\nbtn2 = Pin(15, Pin.IN)\nbtn3 = Pin(18, Pin.IN)\nbtn4 = Pin(13, Pin.IN)\n\nbuttons = {\n    "btn1": btn1,\n    "btn2": btn2,\n    "btn3": btn3,\n    "btn4": btn4,\n}\n\nshown = {}\nwhile True:\n    for name, button in buttons.items():\n        level = button.value()\n        if shown.get(name) != level:\n            print(name + ":", level)\n            shown[name] = level\n    sleep(0.02)',
      scriptDoes:
        "Thonny's Shell shows 1 beside a button while it is held down, and 0 once it is let go. Press Stop in Thonny to end the script.",
    },
  },
  "rgb-led-and-d-pad": {
    circuit: {
      name: "An RGB LED and a d-pad",
      description:
        "Four buttons in a cross, and an addressable RGB LED on a second breadboard above the first.",
      credit: CREDIT,
      leds: [
        { id: "rgb", name: "RGB LED", pin: { kind: "rgb", gpio: 28, count: 1 }, colour: "rgb" },
      ],
      buttons: [
        { id: "right", name: "BTN1", pin: { kind: "gpio", gpio: 16 }, colour: "red" },
        { id: "left", name: "BTN2", pin: { kind: "gpio", gpio: 15 }, colour: "green" },
        { id: "up", name: "BTN3", pin: { kind: "gpio", gpio: 18 }, colour: "blue" },
        { id: "down", name: "BTN4", pin: { kind: "gpio", gpio: 13 }, colour: "yellow" },
      ],
      buzzers: [],
    },
    layout: {
      steps: [
        {
          title: "Connect 3V3 to the top + rail",
          note: "Take it from 3V3(OUT). VBUS and VSYS, at the same end of the Pico, carry the USB's full voltage, which a GPIO pin must never see.",
          parts: [{ kind: "wire", from: "a6", to: "top+7", role: "power" }],
        },
        {
          title: "Connect the bottom − rail to ground",
          parts: [{ kind: "wire", from: "j14", to: "bottom-14", role: "ground" }],
        },
        {
          title: "Bring 3V3 through the middle of the cross",
          note: "The middle of the d-pad is the one place the channel is not under a button. 3V3 crosses it there, and goes on to the bottom + rail.",
          parts: [
            { kind: "wire", from: "a26", to: "top+27", role: "power" },
            { kind: "wire", from: "e26", to: "f26", role: "power" },
            { kind: "wire", from: "j26", to: "bottom+27", role: "power" },
          ],
        },
        {
          title: "BTN3 on GP18",
          note: "It sits above the channel, not across it. Its two legs in a column are always joined, and pressing it joins its left-hand column to its right-hand one.",
          parts: [
            { kind: "wire", from: "a18", to: "a25", role: "signal" },
            { kind: "button", button: "up", columns: [25, 27], rows: ["b", "e"] },
            { kind: "wire", from: "a27", to: "top+28", role: "power" },
          ],
        },
        {
          title: "Hold GP18 low with a resistor",
          note: "The button has no hole to spare beside it, so the resistor goes by the pin instead, into the strip of one of the Pico's GND pins.",
          parts: [{ kind: "resistor", ohms: 4700, from: "b18", to: "b14" }],
        },
        {
          title: "BTN4 on GP13",
          note: "Below the channel, under BTN3. Its jumper is a long one that arches over the bottom of the board, because every hole a flat one could run along is taken. Its 3V3 comes from the middle of the cross.",
          parts: [
            { kind: "wire", from: "j18", to: "j25", role: "signal", arch: true },
            { kind: "button", button: "down", columns: [25, 27], rows: ["f", "i"] },
            { kind: "wire", from: "i26", to: "j27", role: "power" },
          ],
        },
        {
          title: "Hold GP13 low with a resistor",
          note: "Straight from the pin to the − rail: between the Pico and the rail there is no room for it to lie flat.",
          parts: [{ kind: "resistor", ohms: 4700, from: "i18", to: "bottom-17" }],
        },
        {
          title: "BTN2 on GP15",
          note: "Across the channel, its 3V3 from the bottom + rail.",
          parts: [
            { kind: "wire", from: "i21", to: "i22", role: "signal" },
            { kind: "button", button: "left", columns: [22, 24] },
            { kind: "wire", from: "j24", to: "bottom+23", role: "power" },
          ],
        },
        {
          title: "Hold GP15 low with a resistor",
          note: "By the pin, into the bottom − rail.",
          parts: [{ kind: "resistor", ohms: 4700, from: "j21", to: "bottom-22" }],
        },
        {
          title: "BTN1 on GP16",
          note: "The far side of the cross. BTN3 and BTN4 take the only free hole in each of their columns, so no flat jumper can get past them: GP16's is a long one that arches over the top of the board.",
          parts: [
            { kind: "wire", from: "b21", to: "b28", role: "signal", arch: true },
            { kind: "button", button: "right", columns: [28, 30] },
            { kind: "wire", from: "a30", to: "top+29", role: "power" },
          ],
        },
        {
          title: "Hold GP16 low with a resistor",
          note: "Below the channel, where the button's legs carry GP16, down to the bottom − rail.",
          parts: [{ kind: "resistor", ohms: 4700, from: "h28", to: "bottom-28" }],
        },
        {
          title: "Take VBUS, ground and GP28 up to a second breadboard",
          note: "Snap a second half-size breadboard onto the top edge of the first, column 1 over column 1: they are made to join along their long sides. The LED takes its power from VBUS rather than 3V3, and VBUS must never reach a GPIO pin.",
          parts: [
            { kind: "wire", from: "a2", to: "2:j2", role: "power" },
            { kind: "wire", from: "a4", to: "2:j4", role: "ground" },
            { kind: "wire", from: "a8", to: "2:j8", role: "signal" },
          ],
        },
        {
          title: "RGB LED on GP28",
          note: "Its longest leg is data out, which joins nothing while there is only one LED. It needs no resistor: it has a controller of its own, which sets its current.",
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
      script:
        "from machine import Pin\nfrom neopixel import NeoPixel\nfrom time import sleep\n\nrgb_led = NeoPixel(Pin(28), 1)\nbtn1 = Pin(16, Pin.IN)\nbtn2 = Pin(15, Pin.IN)\nbtn3 = Pin(18, Pin.IN)\nbtn4 = Pin(13, Pin.IN)\n\ncaps = (\n    (btn1, (255, 0, 0)),\n    (btn2, (0, 255, 0)),\n    (btn3, (0, 0, 255)),\n    (btn4, (255, 150, 0)),\n)\n\nwhile True:\n    colour = (0, 0, 0)\n    for button, cap in caps:\n        if button.value():\n            colour = cap\n    rgb_led[0] = colour\n    rgb_led.write()\n    sleep(0.02)",
      scriptDoes:
        "Hold a button down and the LED lights in its cap's colour: BTN1 red, BTN2 green, BTN3 blue and BTN4 yellow. Let go and it goes out. Press Stop in Thonny to end the script.",
    },
  },
  "ring-and-button": {
    circuit: {
      name: "A ring and a button",
      description: "A ring of twelve addressable RGB LEDs standing in row j, and a push button.",
      credit: CREDIT,
      leds: [
        { id: "ring", name: "LED ring", pin: { kind: "rgb", gpio: 15, count: 12 }, colour: "rgb" },
      ],
      buttons: [{ id: "button", name: "BTN1", pin: { kind: "gpio", gpio: 16 }, colour: "red" }],
      buzzers: [],
    },
    layout: {
      steps: [
        {
          title: "Connect the top − rail to ground",
          parts: [{ kind: "wire", from: "a19", to: "top-19", role: "ground" }],
        },
        {
          title: "Connect 3V3 to the top + rail",
          note: "Take it from 3V3(OUT). VBUS and VSYS, at the same end of the Pico, carry the USB's full voltage, which a GPIO pin must never see.",
          parts: [{ kind: "wire", from: "a6", to: "top+7", role: "power" }],
        },
        {
          title: "BTN1 on GP16",
          note: "The button's legs across the channel are always joined. Pressing it joins its left-hand legs to its right-hand ones, which is why it has to sit across the channel.",
          parts: [
            { kind: "wire", from: "a21", to: "a23", role: "signal" },
            { kind: "button", button: "button", columns: [23, 25] },
            { kind: "wire", from: "a25", to: "top+26", role: "power" },
          ],
        },
        {
          title: "Hold GP16 low with a resistor",
          note: "Without it the pin floats while the button is up, and reads a press nobody made.",
          parts: [
            { kind: "resistor", ohms: 4700, from: "b23", to: "b27" },
            { kind: "wire", from: "a27", to: "top-27", role: "ground" },
          ],
        },
        {
          title: "Take VBUS over the board",
          note: "A long jumper that arches over the top of the board, since everything along the top rows is taken. The ring takes its power from VBUS rather than 3V3, and VBUS must never reach a GPIO pin or the button.",
          parts: [{ kind: "wire", from: "a2", to: "a28", role: "power", arch: true }],
        },
        {
          title: "Bring VBUS and ground across the channel",
          note: "Ground comes from the strip BTN1's pull-down already joins to the − rail.",
          parts: [
            { kind: "wire", from: "e27", to: "f27", role: "ground" },
            { kind: "wire", from: "e28", to: "f28", role: "power" },
          ],
        },
        {
          title: "LED ring on GP15",
          note: "Stand it up in the bottom row with its LEDs facing the Pico, so that its back, where its pins are named, faces you. The drawing lays it down below the board so that its LEDs show. LED 0 is the one by the pins. It needs no resistor: each LED has a controller of its own.",
          parts: [
            {
              kind: "ring",
              led: "ring",
              dataOut: "j26",
              ground: "j27",
              power: "j28",
              dataIn: "j29",
            },
            { kind: "wire", from: "i21", to: "i29", role: "signal" },
          ],
        },
      ],
      script:
        "from machine import Pin\nfrom neopixel import NeoPixel\nfrom time import sleep\n\nled_ring = NeoPixel(Pin(15), 12)\nbtn1 = Pin(16, Pin.IN)\n\nled = 0\ntry:\n    while True:\n        if btn1.value():\n            colour = (0, 0, 255)\n        else:\n            colour = (255, 0, 0)\n        led_ring.fill((0, 0, 0))\n        led_ring[led] = colour\n        led_ring.write()\n        led = (led + 1) % 12\n        sleep(0.2)\nfinally:\n    led_ring.fill((0, 0, 0))\n    led_ring.write()",
      scriptDoes:
        "A red light goes round the ring, one LED at a time, from LED 0, the one by the pins: it shows which way the numbers go. Hold the button down and it goes round blue. Press Stop in Thonny to end the script, and the ring goes out.",
    },
  },
};
