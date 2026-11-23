import type { Layout, Supply } from "./circuit";
import { isRing, type ShownCircuit } from "./circuit";
import {
  buttonHole,
  coveredBy,
  type Hole,
  holeAt,
  holeOfPin,
  isUnderPico,
  legsOf,
  type Part,
  parseHole,
  type Row,
  rowsOf,
  stripOf,
  supplyLeadsOf,
} from "./drawing/breadboard";
import { formatMicrofarads, formatOhms } from "./drawing/breadboard-svg";
import { HEADER_PINS, type HeaderPin, headerPinOfGpio } from "./drawing/geometry";
import { TRANSISTORS } from "./transistors";

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
/**
 * How long a capacitor keeps a light lit, at the least: its capacitance times the light's resistor,
 * in seconds (ADR 0042). Shorter, and the light goes out too fast to be seen fading.
 */
export const FADE_SECONDS = 0.2;
/**
 * What a transistor's base resistor can be, from a 3.3 V pin (ADR 0043): enough current into the base
 * to switch a light's, and no more than a pin gives easily. 1 kΩ lets 2.6 mA in, and 10 kΩ 0.26 mA,
 * which a 2N3904 turns into all of a light's 15 mA.
 */
export const BASE_OHMS_RANGE = [1000, 10000] as const;

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

type ButtonPart = Extract<Part, { kind: "button" }>;

/**
 * The nets a layout makes, with the buttons `pressed` says are held. On a Pico, its pins join the
 * strips they are in and its grounds each other; a circuit with a supply has no Pico (ADR 0032).
 */
function wireUp(parts: readonly Part[], pressed: (part: ButtonPart) => boolean, pico = true): Nets {
  const nets = new Nets();
  if (pico) {
    for (const pin of HEADER_PINS) {
      nets.join(pinNode(pin), stripOf(holeOfPin(pin.number)));
      if (pin.kind === "ground") nets.join(pinNode(pin), "ground");
    }
  }
  for (const part of parts) {
    if (part.kind === "wire") nets.join(stripOf(part.from), stripOf(part.to));
    if (part.kind === "button") {
      const [left, right] = part.columns;
      const [first, second] = rowsOf(part);
      const hole = (row: Row, column: number) => stripOf(buttonHole(part, row, column));
      nets.join(hole(first, left), hole(second, left));
      nets.join(hole(first, right), hole(second, right));
      if (pressed(part)) nets.join(hole(first, left), hole(first, right));
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
    case "electrolytic":
      return `the ${formatMicrofarads(part.microfarads)} capacitor with its + leg in ${part.plus}`;
    case "transistor":
      return `the ${part.model} with its emitter in ${part.emitter}`;
  }
}

/** The rows in order, for counting how far apart two legs are. */
const ROW_ORDER = "abcdefghij";

/** A button's two columns, as the holes of its first row: one per side of the switch. */
const sidesOf = (part: ButtonPart): Hole[] =>
  part.columns.map((column) => buttonHole(part, rowsOf(part)[0], column));

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
    case "electrolytic":
      return sameRow(part.plus, part.minus, 1)
        ? []
        : [`${name} needs its legs in one row, one hole apart`];
    case "transistor": {
      // Its legs in its model's order, left to right, so that its flat face is towards row j.
      const [first, second, third] = TRANSISTORS[part.model].legs.map((leg) => part[leg]) as [
        Hole,
        Hole,
        Hole,
      ];
      const along =
        sameRow(first, second, 1) &&
        sameRow(second, third, 1) &&
        holeAt(second).column === holeAt(first).column + 1 &&
        holeAt(third).column === holeAt(second).column + 1;
      return along
        ? []
        : [
            `${name} needs its legs side by side in one row: ${TRANSISTORS[part.model].legs.join(", ")}, left to right, its flat face towards row j`,
          ];
    }
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

/** Every part names something the circuit has, and everything the circuit has is placed once. */
function placedProblems(circuit: ShownCircuit, parts: readonly Part[]): string[] {
  const problems: string[] = [];
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
  return problems;
}

export function wiringProblems(circuit: ShownCircuit, layout: Layout): string[] {
  const parts = layout.steps.flatMap((step) => step.parts);
  const problems: string[] = [];

  // Every leg in a hole that exists, not under the Pico, and not in a hole already taken: on a
  // circuit with a supply, the supply's two leads take theirs first (ADR 0032).
  const supply = circuit.supply;
  const taken = new Map<Hole, string>();
  if (supply) {
    const leads = supplyLeadsOf(supply.rails);
    taken.set(leads.plus, "the supply's red lead");
    taken.set(leads.minus, "the supply's black lead");
  }
  for (const part of parts) {
    const name = describe(part, circuit);
    const legs = legsOf(part);
    const missing = legs.filter((hole) => !parseHole(hole));
    if (missing.length > 0) {
      problems.push(`${name} has a leg in ${missing.join(" and ")}, which is not a hole`);
      continue;
    }
    for (const hole of legs) {
      if (!supply && isUnderPico(hole))
        problems.push(`${name} has a leg in ${hole}, under the Pico`);
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
  problems.push(...placedProblems(circuit, parts));
  if (supply) return [...problems, ...supplyWiringProblems(circuit, parts, supply)];

  // A capacitor's one use is on a supply, keeping a light lit (ADR 0038, ADR 0042).
  for (const part of parts) {
    if (part.kind === "electrolytic") {
      problems.push(
        `${describe(part, circuit)} has no use ratsnest knows on a Pico: an electrolytic capacitor keeps a light lit on a supply (ADR 0042)`,
      );
    }
  }

  const nets = wireUp(parts, () => false);
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

  // A light: pin, one resistor, the LED the right way round, ground; or a transistor's, switched by
  // its pin through the transistor's base (ADR 0043).
  const transistors = parts.filter(
    (part): part is Extract<Part, { kind: "transistor" }> => part.kind === "transistor",
  );
  const switching = new Set<Part>();
  for (const led of circuit.leds) {
    const part = parts.find((p) => p.kind === "led" && p.led === led.id);
    if (part?.kind !== "led" || led.pin?.kind !== "gpio") continue;
    const name = `the ${led.name}`;
    const pin = gpioNet(led.pin.gpio, name);
    if (!pin) continue;
    const anode = net(part.anode);
    const cathode = net(part.cathode);
    const where = `GP${led.pin.gpio}`;

    // A light on a transistor's collector, straight or through its resistor, is that transistor's.
    const reaches = (leg: string, collector: string) =>
      leg === collector || between(leg, collector).length === 1;
    const transistor = transistors.find(
      (t) => reaches(cathode, net(t.collector)) || reaches(anode, net(t.collector)),
    );
    if (transistor) {
      switching.add(transistor);
      const tName = describe(transistor, circuit);
      const collector = net(transistor.collector);
      // An NPN switches a light's low side, from 3V3 down to its collector, and a PNP its high side,
      // from its collector down to ground (ADR 0044): which rail its emitter is on, and which of the
      // light's legs faces it, are all that differ.
      const npn = TRANSISTORS[transistor.model].type === "NPN";
      const [toward, away] = npn ? [cathode, anode] : [anode, cathode];
      const [rail, railName] = npn ? [power, POWER_LABEL] : [ground, "ground"];
      const collectorName = `the ${transistor.model}'s collector`;
      if (reaches(away, collector) && !reaches(toward, collector)) {
        problems.push(
          npn
            ? `${name} is in backwards: its long leg must be towards ${POWER_LABEL}, and its short leg towards ${collectorName}`
            : `${name} is in backwards: its long leg must be towards ${collectorName}, and its short leg towards ground`,
        );
        continue;
      }
      if (net(transistor.emitter) !== (npn ? ground : power)) {
        problems.push(`${tName} has its emitter off ${npn ? "ground" : POWER_LABEL}`);
      }
      const base = net(transistor.base);
      const bases = between(pin, base);
      if (base === pin) {
        problems.push(
          `${tName} has its base straight on ${where}: a resistor of ${BASE_OHMS_RANGE.map(formatOhms).join(" to ")} goes between them`,
        );
      } else if (bases.length !== 1) {
        problems.push(`${tName} has its base off ${where}: one resistor goes between them`);
      } else {
        const resistor = bases[0] as Extract<Part, { kind: "resistor" }>;
        accounted.add(resistor);
        if (!inRange(resistor, BASE_OHMS_RANGE)) {
          problems.push(
            `${tName}'s base resistor is ${formatOhms(resistor.ohms)}, outside ${BASE_OHMS_RANGE.map(formatOhms).join(" to ")}`,
          );
        }
      }
      // Between its rail and the collector through one resistor, on either side of the light.
      const [middle, series] =
        toward === collector
          ? [away, between(rail, away)]
          : away === rail
            ? [toward, between(toward, collector)]
            : [undefined, []];
      if (!middle || series.length !== 1 || terminals.get(middle) !== 2) {
        problems.push(
          npn
            ? `${name} is not wired from ${railName} through one resistor to ${collectorName}`
            : `${name} is not wired from ${collectorName} through one resistor to ${railName}`,
        );
        continue;
      }
      const resistor = series[0] as Extract<Part, { kind: "resistor" }>;
      accounted.add(resistor);
      if (!inRange(resistor, LIGHT_OHMS_RANGE)) {
        problems.push(
          `${name}'s resistor is ${formatOhms(resistor.ohms)}, outside ${LIGHT_OHMS_RANGE.map(formatOhms).join(" to ")}`,
        );
      }
      continue;
    }

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
    if ((part?.kind !== "rgbLed" && part?.kind !== "ring") || led.pin?.kind !== "rgb") continue;
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
    if (part?.kind !== "button" || !button.pin) continue;
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

  for (const transistor of transistors) {
    if (!switching.has(transistor)) {
      problems.push(
        TRANSISTORS[transistor.model].type === "NPN"
          ? `${describe(transistor, circuit)} switches no light: its emitter goes on ground, its base through a resistor from a light's pin, and its collector under the light`
          : `${describe(transistor, circuit)} switches no light: its emitter goes on ${POWER_LABEL}, its base through a resistor from a light's pin, and its collector over the light`,
      );
    }
  }

  for (const resistor of resistors) {
    if (!accounted.has(resistor)) {
      problems.push(
        `${describe(resistor, circuit)} is not a light's resistor, a pull-down or a transistor's base resistor`,
      );
    }
  }

  // Shorts: a pin joined to ground, pressed or not, and two pins joined to each other while
  // nothing is pressed — pressing a button is exactly a pin meeting 3V3.
  const shorts = (pressed: boolean): string[] => {
    const state = wireUp(parts, () => pressed);
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

/**
 * A circuit with a supply, held to its + and − rails rather than to a Pico's pins (ADR 0033): every
 * light between + and − through one resistor, with buttons on its way; every button switching a
 * light; no short, with every button held; wires in the colour of what they carry; and nothing with
 * a leg that joins nothing. Its parts are already placed, each once.
 */
function supplyWiringProblems(
  circuit: ShownCircuit,
  parts: readonly Part[],
  supply: Supply,
): string[] {
  const problems: string[] = [];
  const leads = supplyLeadsOf(supply.rails);
  const buttons = parts.filter((part): part is ButtonPart => part.kind === "button");
  const resistors = parts.filter(
    (part): part is Extract<Part, { kind: "resistor" }> => part.kind === "resistor",
  );
  const lights = parts.filter(
    (part): part is Extract<Part, { kind: "led" }> => part.kind === "led",
  );

  /** The nets with every button held but those `released` names. */
  const held = (released: ReadonlySet<Part> = new Set()) =>
    wireUp(parts, (part) => !released.has(part), false);
  const open = wireUp(parts, () => false, false);
  const all = held();
  const plusOf = (nets: Nets) => nets.find(stripOf(leads.plus));
  const minusOf = (nets: Nets) => nets.find(stripOf(leads.minus));

  // A short first: + joined to −, with nothing held, or with every button held, which joins the
  // most any of them can.
  if (plusOf(open) === minusOf(open)) {
    return [...problems, "the supply's + and − are joined: a short across it"];
  }
  if (plusOf(all) === minusOf(all)) {
    return [...problems, "the supply's + and − are joined while every button is held: a short"];
  }

  /** How many legs, and leads, each net of `nets` has, a button's sides left out. */
  const legsIn = (nets: Nets) => {
    const counts = new Map<string, number>();
    const count = (node: string) => counts.set(node, (counts.get(node) ?? 0) + 1);
    count(nets.find(stripOf(leads.plus)));
    count(nets.find(stripOf(leads.minus)));
    for (const part of parts) {
      if (part.kind === "wire" || part.kind === "button") continue;
      for (const hole of legsOf(part)) count(nets.find(stripOf(hole)));
    }
    return counts;
  };

  /** The resistors with one end in each of two nets. */
  const between = (nets: Nets, a: string, b: string) =>
    resistors.filter((r) => {
      const ends = [nets.find(stripOf(r.from)), nets.find(stripOf(r.to))];
      return a !== b && ends.includes(a) && ends.includes(b);
    });

  /** Whether a light has a way from + through a resistor to −, in the nets given. */
  const lit = (light: Extract<Part, { kind: "led" }>, nets: Nets) => {
    const [plus, minus] = [plusOf(nets), minusOf(nets)];
    const anode = nets.find(stripOf(light.anode));
    const cathode = nets.find(stripOf(light.cathode));
    return (
      (cathode === minus && between(nets, plus, anode).length > 0) ||
      (anode === plus && between(nets, cathode, minus).length > 0)
    );
  };

  // Every light, with every button held: the right way round, between + and −, through exactly one
  // resistor of its own, of a value that lights it safely.
  const accounted = new Set<Part>();
  const legs = legsIn(all);
  const [plus, minus] = [plusOf(all), minusOf(all)];
  for (const light of lights) {
    const name = describe(light, circuit);
    const anode = all.find(stripOf(light.anode));
    const cathode = all.find(stripOf(light.cathode));
    if (anode === minus || cathode === plus) {
      problems.push(`${name} is in backwards: its long leg must be towards +`);
      continue;
    }
    if (anode === plus && cathode === minus) {
      problems.push(`${name} has no resistor between + and −`);
      continue;
    }
    const [middle, series] =
      cathode === minus
        ? [anode, between(all, plus, anode)]
        : anode === plus
          ? [cathode, between(all, cathode, minus)]
          : [undefined, []];
    if (!middle || series.length !== 1 || legs.get(middle) !== 2) {
      problems.push(`${name} is not wired from + through one resistor to −`);
      continue;
    }
    const resistor = series[0] as Extract<Part, { kind: "resistor" }>;
    accounted.add(resistor);
    if (resistor.ohms < LIGHT_OHMS_RANGE[0] || resistor.ohms > LIGHT_OHMS_RANGE[1]) {
      problems.push(
        `${name}'s resistor is ${formatOhms(resistor.ohms)}, outside ${LIGHT_OHMS_RANGE.map(formatOhms).join(" to ")}`,
      );
    }
  }
  for (const resistor of resistors) {
    if (!accounted.has(resistor)) {
      problems.push(`${describe(resistor, circuit)} is not a light's resistor`);
    }
  }

  // Every capacitor keeps a light lit (ADR 0042): its − leg on −, its + leg between a button and a
  // light's resistor, which a button charges and the light empties, slowly enough to be seen.
  for (const capacitor of parts) {
    if (capacitor.kind !== "electrolytic") continue;
    const name = describe(capacitor, circuit);
    const plusLeg = open.find(stripOf(capacitor.plus));
    const minusLeg = open.find(stripOf(capacitor.minus));
    const [plus, minus] = [plusOf(open), minusOf(open)];
    if (plusLeg === minus || minusLeg === plus) {
      problems.push(
        `${name} is in backwards: its − leg, under the stripe, goes towards −, and its + leg towards +`,
      );
      continue;
    }
    if (minusLeg !== minus) {
      problems.push(`${name} has its − leg, under the stripe, off −: it goes straight to −`);
      continue;
    }
    if (plusLeg === plus) {
      problems.push(
        `${name} is across the supply, where it keeps no light lit: its + leg goes between a button and a light's resistor`,
      );
      continue;
    }
    // What a held button charges it from, and the light it then empties into, through its resistor.
    const charged = all.find(stripOf(capacitor.plus)) === plusOf(all);
    const kept = lights.flatMap((light) => {
      const anode = open.find(stripOf(light.anode));
      const cathode = open.find(stripOf(light.cathode));
      return cathode === minus ? between(open, plusLeg, anode) : [];
    });
    if (!charged || kept.length !== 1) {
      problems.push(
        `${name} keeps no light lit: its + leg goes between a button and a light's resistor, and its − leg to −`,
      );
      continue;
    }
    const resistor = kept[0] as Extract<Part, { kind: "resistor" }>;
    const seconds = resistor.ohms * capacitor.microfarads * 1e-6;
    if (seconds < FADE_SECONDS) {
      problems.push(
        `${name} empties through the ${formatOhms(resistor.ohms)} resistor in about ${Math.round(seconds * 100) / 100} s, too fast to see its light fade: with that resistor it needs ${formatMicrofarads(Math.ceil(FADE_SECONDS / (resistor.ohms * 1e-6)))} or more`,
      );
    }
  }

  // Every button switches a light: let go of it alone, and a light lit while all are held goes out.
  if (problems.length === 0) {
    for (const button of buttons) {
      const without = held(new Set([button]));
      if (!lights.some((light) => lit(light, all) && !lit(light, without))) {
        problems.push(
          `${describe(button, circuit)} switches no light: it goes on a light's way, between + and the light or between the light and −`,
        );
      }
    }
  }

  // Wires in the colour of what they carry, with nothing held: red on +, black on −, and yellow
  // anything else, such as the line from a button to its light.
  for (const part of parts) {
    if (part.kind !== "wire") continue;
    const node = open.find(stripOf(part.from));
    const on = node === plusOf(open) ? "power" : node === minusOf(open) ? "ground" : "signal";
    if (on !== part.role) {
      const carries = { power: "+", ground: "−", signal: "neither + nor −" }[on];
      problems.push(
        `${describe(part, circuit)} is ${WIRE_COLOUR[part.role]}, but carries ${carries}: red is for +, black for −, yellow for anything else`,
      );
    }
  }

  // Nothing left with a leg in a net of its own, with nothing held.
  const terminals = legsIn(open);
  for (const part of buttons) {
    for (const hole of sidesOf(part)) {
      const node = open.find(stripOf(hole));
      terminals.set(node, (terminals.get(node) ?? 0) + 1);
    }
  }
  for (const part of parts) {
    if (part.kind === "wire") continue;
    for (const hole of part.kind === "button" ? sidesOf(part) : legsOf(part)) {
      if ((terminals.get(open.find(stripOf(hole))) ?? 0) < 2) {
        problems.push(`${describe(part, circuit)} has a leg in ${hole} that joins nothing`);
      }
    }
  }
  return problems;
}
