import type { Layout } from "./circuit";
import { isRing, type ShownCircuit } from "./circuit";
import {
  coveredBy,
  type Hole,
  holeAt,
  holeOfPin,
  isUnderPico,
  legsOf,
  type Part,
  parseHole,
  rowsOf,
  stripOf,
} from "./drawing/breadboard";
import { formatOhms } from "./drawing/breadboard-svg";
import { HEADER_PINS, type HeaderPin, headerPinOfGpio } from "./drawing/geometry";

/**
 * What a layout actually wires up, compared with what its circuit says it is (scratchpi's ADR 0082).
 *
 * A breadboard is a handful of metal strips. `stripOf` says which one a hole touches; the
 * Pico joins each pin to the strip it is pushed into, and all its grounds to each other;
 * a jumper joins two strips; a button joins its legs across the channel, and its two sides
 * only while pressed. What those joins leave is the netlist. Everything else — a resistor,
 * an LED, a buzzer — has a leg in one net and a leg in another, and whether it is between
 * the right two is the whole question.
 *
 * The answer is a list of problems, each naming the part, so a test can say which one is
 * wrong rather than only that something is.
 */

/** The 3V3 a button presses against: the regulator's output, not the 5 V ones. */
const POWER_LABEL = "3V3(OUT)";

/** The 5 V an RGB LED and the ring take (scratchpi's ADR 0222, 0234): the USB's own, straight through. */
const FIVE_VOLT_LABEL = "VBUS";

/** What a light's resistor can be for a 3.3 V pin: bright enough to see, and safe. */
export const LIGHT_OHMS_RANGE = [220, 1000] as const;
/**
 * What a pull-down can be: no burden on 3V3 while a button is held, and strong enough to hold
 * the pin low on an RP2350 whose inputs leak, which erratum E9 puts at 8.2 kΩ (scratchpi's ADR 0159).
 */
export const PULL_DOWN_OHMS_RANGE = [1000, 8200] as const;

/** Union–find over strip names, pin names and the one shared ground. */
class Nets {
  private readonly parent = new Map<string, string>();

  find(node: string): string {
    let root = node;
    while (this.parent.has(root) && this.parent.get(root) !== root) {
      root = this.parent.get(root) as string;
    }
    this.parent.set(node, root);
    return root;
  }

  join(a: string, b: string): void {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra !== rb) this.parent.set(ra, rb);
  }
}

const pinNode = (pin: HeaderPin) => `pin ${pin.number}`;

function wireUp(parts: readonly Part[], pressed: boolean): Nets {
  const nets = new Nets();
  for (const pin of HEADER_PINS) {
    nets.join(pinNode(pin), stripOf(holeOfPin(pin.number)));
    if (pin.kind === "ground") nets.join(pinNode(pin), "ground");
  }
  for (const part of parts) {
    if (part.kind === "wire") nets.join(stripOf(part.from), stripOf(part.to));
    if (part.kind === "button") {
      const [left, right] = part.columns;
      const [first, second] = rowsOf(part);
      nets.join(stripOf(`${first}${left}`), stripOf(`${second}${left}`));
      nets.join(stripOf(`${first}${right}`), stripOf(`${second}${right}`));
      if (pressed) nets.join(stripOf(`${first}${left}`), stripOf(`${first}${right}`));
    }
  }
  return nets;
}

const WIRE_COLOUR = { ground: "black", power: "red", signal: "yellow" } as const;

/** The id of the circuit's component a part is, for the parts that are one. */
function componentOf(part: Part): string | undefined {
  switch (part.kind) {
    case "led":
      return part.led;
    case "button":
      return part.button;
    case "buzzer":
      return part.buzzer;
    case "rgbLed":
    case "ring":
      return part.led;
    default:
      return undefined;
  }
}

/** How a problem names a part: the way the page would, with its holes. */
function describe(part: Part, circuit: ShownCircuit): string {
  switch (part.kind) {
    case "wire":
      return `the ${WIRE_COLOUR[part.role]} wire from ${part.from} to ${part.to}`;
    case "resistor":
      return `the ${formatOhms(part.ohms)} resistor from ${part.from} to ${part.to}`;
    case "led":
      return `the ${circuit.leds.find((led) => led.id === part.led)?.name ?? `LED "${part.led}"`}`;
    case "button":
      // A button's name is a reference, `BTN1`, and takes no article (scratchpi's ADR 0173).
      return (
        circuit.buttons.find((b) => b.id === part.button)?.name ?? `the button "${part.button}"`
      );
    case "buzzer":
      return `the ${circuit.buzzers.find((b) => b.id === part.buzzer)?.name ?? `buzzer "${part.buzzer}"`}`;
    case "rgbLed":
      return `the ${circuit.leds.find((led) => led.id === part.led)?.name ?? `RGB LED "${part.led}"`}`;
    case "ring":
      return `the ${circuit.leds.find((led) => led.id === part.led)?.name ?? `ring "${part.led}"`}`;
  }
}

/** The rows in order, for counting how far apart two legs are. */
const ROW_ORDER = "abcdefghij";

/** A button's two columns, as the holes of its first row: one per side of the switch. */
const sidesOf = (part: Extract<Part, { kind: "button" }>): Hole[] =>
  part.columns.map((column) => `${rowsOf(part)[0]}${column}`);

/** Holes a part's shape fixes: an LED's legs are one hole apart, a buzzer's three. */
function shapeProblems(part: Part, name: string): string[] {
  const sameRow = (a: Hole, b: Hole, apart: number) => {
    const at = holeAt(a);
    const bt = holeAt(b);
    return (
      at.kind === "main" &&
      bt.kind === "main" &&
      at.board === bt.board &&
      at.row === bt.row &&
      Math.abs(at.column - bt.column) === apart
    );
  };
  switch (part.kind) {
    case "led":
      return sameRow(part.anode, part.cathode, 1)
        ? []
        : [`${name} needs its legs in one row, one hole apart`];
    case "buzzer":
      return sameRow(part.plus, part.minus, 3)
        ? []
        : [`${name} needs its legs in one row, three holes apart`];
    case "rgbLed":
    case "ring": {
      // Side by side, in the guide's order, whichever way round it faces (scratchpi's ADR 0222, 0238).
      const legs = legsOf(part);
      const along = legs.slice(1).every((leg, i) => sameRow(legs[i] as Hole, leg, 1));
      const columns = legs.map((leg) => holeAt(leg).column);
      const step = (columns[1] ?? 0) - (columns[0] ?? 0);
      const inOrder = columns.every((column, i) => column === (columns[0] ?? 0) + i * step);
      return along && inOrder ? [] : [`${name} needs its four legs side by side in one row`];
    }
    case "button": {
      const [left, right] = part.columns;
      const [first, second] = rowsOf(part);
      const apart = ROW_ORDER.indexOf(second) - ROW_ORDER.indexOf(first);
      return [
        ...(right - left === 2 ? [] : [`${name} needs its legs two columns apart`]),
        ...(apart === 3 || (first === "e" && second === "f")
          ? []
          : [`${name} needs its legs three rows apart, or across the channel`]),
      ];
    }
    default:
      return stripOf(legsOf(part)[0] as Hole) === stripOf(legsOf(part)[1] as Hole)
        ? [`${name} has both ends in one strip, so it does nothing`]
        : [];
  }
}

export function wiringProblems(circuit: ShownCircuit, layout: Layout): string[] {
  const parts = layout.steps.flatMap((step) => step.parts);
  const problems: string[] = [];

  // Every leg in a hole that exists, not under the Pico, and not in a hole already taken.
  const taken = new Map<Hole, string>();
  for (const part of parts) {
    const name = describe(part, circuit);
    const legs = legsOf(part);
    const missing = legs.filter((hole) => !parseHole(hole));
    if (missing.length > 0) {
      problems.push(`${name} has a leg in ${missing.join(" and ")}, which is not a hole`);
      continue;
    }
    for (const hole of legs) {
      if (isUnderPico(hole)) problems.push(`${name} has a leg in ${hole}, under the Pico`);
      const already = taken.get(hole);
      if (already) problems.push(`${name} and ${already} both have a leg in ${hole}`);
      taken.set(hole, name);
    }
    problems.push(...shapeProblems(part, name));
  }
  // Nothing in a hole a button's body covers: it sits on the board over them (scratchpi's ADR 0154).
  for (const part of parts) {
    if (part.kind !== "button") continue;
    for (const hole of coveredBy(part)) {
      const under = taken.get(hole);
      if (under) problems.push(`${under} has a leg in ${hole}, under ${describe(part, circuit)}`);
    }
  }
  if (problems.length > 0) return problems;

  const nets = wireUp(parts, false);
  const net = (hole: Hole) => nets.find(stripOf(hole));
  const ground = nets.find("ground");
  const powerPin = HEADER_PINS.find((pin) => pin.label === POWER_LABEL);
  const power = powerPin ? nets.find(pinNode(powerPin)) : "";
  const pinsIn = (node: string) => HEADER_PINS.filter((pin) => nets.find(pinNode(pin)) === node);

  const gpioNet = (gpio: number, what: string): string | undefined => {
    const pin = headerPinOfGpio(gpio);
    if (!pin) problems.push(`${what} is on GP${gpio}, which the Pico does not break out`);
    return pin ? nets.find(pinNode(pin)) : undefined;
  };

  // How many things are plugged into each net: a leg, or a Pico pin.
  const terminals = new Map<string, number>();
  const count = (node: string) => terminals.set(node, (terminals.get(node) ?? 0) + 1);
  for (const pin of HEADER_PINS) count(nets.find(pinNode(pin)));
  for (const part of parts) {
    if (part.kind === "wire") continue;
    const holes = part.kind === "button" ? sidesOf(part) : legsOf(part);
    for (const hole of holes) count(net(hole));
  }

  const resistors = parts.filter(
    (part): part is Extract<Part, { kind: "resistor" }> => part.kind === "resistor",
  );
  const accounted = new Set<Part>();
  const between = (a: string, b: string) =>
    resistors.filter((r) => {
      const ends = [net(r.from), net(r.to)];
      return ends.includes(a) && ends.includes(b) && a !== b;
    });
  const inRange = (r: { ohms: number }, [low, high]: readonly [number, number]) =>
    r.ohms >= low && r.ohms <= high;

  // Every part names something the circuit has, and everything the circuit has is placed once.
  const kinds = [
    ["led", circuit.leds.filter((l) => l.colour !== "rgb").map((l) => l.id), "light"],
    [
      "rgbLed",
      circuit.leds.filter((l) => l.colour === "rgb" && !isRing(l)).map((l) => l.id),
      "RGB LED",
    ],
    ["ring", circuit.leds.filter(isRing).map((l) => l.id), "ring"],
    ["button", circuit.buttons.map((b) => b.id), "button"],
    ["buzzer", circuit.buzzers.map((b) => b.id), "buzzer"],
  ] as const;
  for (const [kind, ids, noun] of kinds) {
    const placed = parts
      .filter((part) => part.kind === kind)
      .map(componentOf)
      .filter((id): id is string => id !== undefined);
    for (const id of ids) {
      const times = placed.filter((p) => p === id).length;
      if (times !== 1) problems.push(`the ${noun} "${id}" is placed ${times} times, not once`);
    }
    for (const id of placed) {
      if (!(ids as readonly string[]).includes(id)) {
        problems.push(`a ${noun} "${id}" is placed that ${circuit.name} does not have`);
      }
    }
  }

  // A light: pin, one resistor, the LED the right way round, ground.
  for (const led of circuit.leds) {
    const part = parts.find((p) => p.kind === "led" && p.led === led.id);
    if (part?.kind !== "led" || led.pin.kind !== "gpio") continue;
    const name = `the ${led.name}`;
    const pin = gpioNet(led.pin.gpio, name);
    if (!pin) continue;
    const anode = net(part.anode);
    const cathode = net(part.cathode);
    const where = `GP${led.pin.gpio}`;

    if (anode === ground || cathode === pin) {
      problems.push(`${name} is in backwards: its long leg must be towards ${where}`);
      continue;
    }
    if (anode === pin && cathode === ground) {
      problems.push(`${name} has no resistor between ${where} and ground`);
      continue;
    }
    // The resistor on either side of the LED, and nothing else on the net between them.
    const [middle, series] =
      cathode === ground
        ? [anode, between(pin, anode)]
        : anode === pin
          ? [cathode, between(cathode, ground)]
          : [undefined, []];
    if (!middle || series.length !== 1 || terminals.get(middle) !== 2) {
      problems.push(`${name} is not wired from ${where} through one resistor to ground`);
      continue;
    }
    const resistor = series[0] as Extract<Part, { kind: "resistor" }>;
    accounted.add(resistor);
    if (!inRange(resistor, LIGHT_OHMS_RANGE)) {
      problems.push(
        `${name}'s resistor is ${formatOhms(resistor.ohms)}, outside ${LIGHT_OHMS_RANGE.map(formatOhms).join(" to ")}`,
      );
    }
  }

  // An RGB LED (scratchpi's ADR 0222), and the ring (scratchpi's ADR 0234): +5 V from VBUS, ground, data in from its
  // pin, and data out joined to nothing. No resistor: each controller sets its own current.
  const fiveVoltPin = HEADER_PINS.find((pin) => pin.label === FIVE_VOLT_LABEL);
  const fiveVolt = fiveVoltPin ? nets.find(pinNode(fiveVoltPin)) : "";
  for (const led of circuit.leds) {
    const part = parts.find((p) => (p.kind === "rgbLed" || p.kind === "ring") && p.led === led.id);
    if ((part?.kind !== "rgbLed" && part?.kind !== "ring") || led.pin.kind !== "rgb") continue;
    const name = `the ${led.name}`;
    const pin = gpioNet(led.pin.gpio, name);
    if (!pin) continue;
    if (net(part.power) !== fiveVolt) {
      problems.push(`${name}'s +5 V leg is not on ${FIVE_VOLT_LABEL}`);
    }
    if (net(part.ground) !== ground) problems.push(`${name}'s ground leg is not on ground`);
    if (net(part.dataIn) !== pin) {
      problems.push(`${name}'s data in is not on GP${led.pin.gpio}`);
    }
    if ((terminals.get(net(part.dataOut)) ?? 0) !== 1) {
      problems.push(`${name}'s data out is joined to something, and must join nothing`);
    }
  }

  // A button: between its pin and 3V3, open until pressed, and pulled down to ground.
  for (const button of circuit.buttons) {
    const part = parts.find((p) => p.kind === "button" && p.button === button.id);
    if (part?.kind !== "button") continue;
    const name = button.name;
    const pin = gpioNet(button.pin.gpio, name);
    if (!pin) continue;
    const sides = sidesOf(part).map(net);
    if (!(sides.includes(pin) && sides.includes(power) && pin !== power)) {
      problems.push(`${name} is not between GP${button.pin.gpio} and ${POWER_LABEL}`);
    }
    const pullDown = between(pin, ground);
    if (pullDown.length !== 1) {
      problems.push(
        `${name} needs one resistor from GP${button.pin.gpio} to ground, not ${pullDown.length}`,
      );
    } else {
      const resistor = pullDown[0] as Extract<Part, { kind: "resistor" }>;
      accounted.add(resistor);
      if (!inRange(resistor, PULL_DOWN_OHMS_RANGE)) {
        problems.push(
          `${name}'s pull-down is ${formatOhms(resistor.ohms)}, outside ${PULL_DOWN_OHMS_RANGE.map(formatOhms).join(" to ")}`,
        );
      }
    }
  }

  // A buzzer: from its pin to ground, the + leg on the pin.
  for (const buzzer of circuit.buzzers) {
    const part = parts.find((p) => p.kind === "buzzer" && p.buzzer === buzzer.id);
    if (part?.kind !== "buzzer") continue;
    const name = `the ${buzzer.name}`;
    const pin = gpioNet(buzzer.pin.gpio, name);
    if (!pin) continue;
    if (net(part.plus) === ground && net(part.minus) === pin) {
      problems.push(`${name} is in backwards: its + leg must be on GP${buzzer.pin.gpio}`);
    } else if (net(part.plus) !== pin || net(part.minus) !== ground) {
      problems.push(`${name} is not between GP${buzzer.pin.gpio} and ground`);
    }
  }

  for (const resistor of resistors) {
    if (!accounted.has(resistor)) {
      problems.push(`${describe(resistor, circuit)} is not a light's resistor or a pull-down`);
    }
  }

  // Shorts: a pin joined to ground, pressed or not, and two pins joined to each other while
  // nothing is pressed — pressing a button is exactly a pin meeting 3V3.
  const shorts = (pressed: boolean): string[] => {
    const state = wireUp(parts, pressed);
    const found: string[] = [];
    const seen = new Set<string>();
    for (const pin of HEADER_PINS) {
      const node = state.find(pinNode(pin));
      if (seen.has(node)) continue;
      seen.add(node);
      const pins = HEADER_PINS.filter((p) => state.find(pinNode(p)) === node);
      const others = pins.filter((p) => p.kind !== "ground");
      const names = others.map((p) => p.label).join(" and ");
      if (others.length > 0 && pins.length > others.length) {
        found.push(`${names} ${others.length > 1 ? "are" : "is"} joined to ground`);
      } else if (!pressed && others.length > 1) {
        found.push(`${names} are joined`);
      }
    }
    return found;
  };
  const open = shorts(false);
  problems.push(
    ...open,
    ...shorts(true)
      .filter((short) => !open.includes(short))
      .map((short) => `${short} while the button is pressed`),
  );

  // Wires in the colour of what they carry. A red one carries 3V3, or the 5 V of VBUS where
  // a part takes it (scratchpi's ADR 0222): anywhere else, VBUS on a red wire is a mistake.
  const takesFiveVolts = parts.some((part) => part.kind === "rgbLed" || part.kind === "ring");
  for (const part of parts) {
    if (part.kind !== "wire") continue;
    const pins = pinsIn(net(part.from));
    const carries =
      part.role === "ground"
        ? pins.some((p) => p.kind === "ground")
        : part.role === "power"
          ? pins.some(
              (p) => p.label === POWER_LABEL || (p.label === FIVE_VOLT_LABEL && takesFiveVolts),
            )
          : pins.some((p) => p.kind === "gpio") && pins.every((p) => p.kind === "gpio");
    if (!carries) {
      problems.push(
        `${describe(part, circuit)} is ${WIRE_COLOUR[part.role]}, but does not carry ${part.role}`,
      );
    }
  }

  // Nothing left with a leg in a net of its own, but an RGB LED's data out, which is meant to.
  for (const part of parts) {
    if (part.kind === "wire") continue;
    const holes =
      part.kind === "button"
        ? sidesOf(part)
        : part.kind === "rgbLed" || part.kind === "ring"
          ? legsOf(part).filter((leg) => leg !== part.dataOut)
          : legsOf(part);
    for (const hole of holes) {
      if ((terminals.get(net(hole)) ?? 0) < 2) {
        problems.push(`${describe(part, circuit)} has a leg in ${hole} that joins nothing`);
      }
    }
  }

  return problems;
}
