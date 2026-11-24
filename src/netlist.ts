import { formatNanofarads } from "./ceramics";
import type { Layout, LedColour, Supply } from "./circuit";
import { isRing, type ShownCircuit, SUPPLY_VOLTS, THREE_VOLT_COLOURS } from "./circuit";
import { DIODE_VOLTS } from "./diodes";
import {
  buttonHole,
  coveredBy,
  coveredBySlidePotentiometer,
  type Hole,
  holeAt,
  holeCentre,
  holeOfPin,
  isUnderPico,
  legsOf,
  type Part,
  parseHole,
  type Row,
  rowsOf,
  SLIDE_POTENTIOMETER_LENGTH_MM,
  stripOf,
  supplyLeadsOf,
} from "./drawing/breadboard";
import { formatMicrofarads, formatOhms } from "./drawing/breadboard-svg";
import { HEADER_PINS, type HeaderPin, headerPinOfGpio, PIN_PITCH_MM } from "./drawing/geometry";
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
 * in seconds (ADR 0043). Shorter, and the light goes out too fast to be seen fading.
 */
export const FADE_SECONDS = 0.2;
/**
 * What a transistor's base resistor can be, from a 3.3 V pin (ADR 0044): enough current into the base
 * to switch a light's, and no more than a pin gives easily. 1 kΩ lets 2.6 mA in, and 10 kΩ 0.26 mA,
 * which a 2N3904 turns into all of a light's 15 mA.
 */
export const BASE_OHMS_RANGE = [1000, 10000] as const;
/**
 * What a flasher's base resistor can be, from + (ADR 0046): it sets, with its capacitor, how long
 * its transistor stays off, and feeds the base enough to light its light the rest of the time. At
 * 3 V, 47 kΩ lets 49 µA in, which a 2N3904 turns into a light's few milliamperes.
 */
export const FLASHER_BASE_OHMS_RANGE = [10000, 100000] as const;
/**
 * How long each half of a flasher's beat can last, in seconds: about 0.69 times its base resistor
 * times its capacitor (ADR 0046). Shorter, and the lights blur into one; longer, and they seem to
 * have stopped.
 */
export const FLASH_SECONDS_RANGE = [0.1, 5] as const;
/**
 * What a ceramic capacitor's charging resistor can be (ADR 0051): little current from its pin, and
 * strong enough to empty the capacitor past an RP2350 input that leaks while it is between low and
 * high, which erratum E9 puts at 8.2 kΩ, as for a pull-down.
 */
export const CHARGE_OHMS_RANGE = [1000, 8200] as const;
/**
 * How long a capacitor takes to charge through its resistor, at the least: the two's time constant,
 * in seconds (ADR 0051). Shorter, and the script's loop cannot time it.
 */
export const TIMING_SECONDS = 0.0001;
/**
 * What a slide potentiometer can be, from 3V3(OUT) to ground (ADR 0053): little current through it,
 * 3.3 mA at most, and low enough for the Pico's analogue input to read it steadily.
 */
export const SLIDE_POTENTIOMETER_OHMS_RANGE = [1000, 100000] as const;
/** The GPIOs a Pico 2 W can read a voltage on, its analogue inputs (ADR 0053). */
export const ANALOGUE_GPIOS = [26, 27, 28] as const;
/**
 * What a light's resistor needs left of a supply's voltage, at the least, once the light and the diodes
 * on its way have taken theirs (ADR 0049): below it, a light glows too dimly to be sure of.
 */
export const HEADROOM_VOLTS = 0.5;
/** What a light takes itself, about: 3 V for a blue, white, green, aqua, pink or purple one (ADR 0033). */
const lightVolts = (colour: LedColour): number =>
  (THREE_VOLT_COLOURS as readonly string[]).includes(colour) ? 3 : 2;

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
type Diode = Extract<Part, { kind: "diode" }>;
type Light = Extract<Part, { kind: "led" }>;
type ResistorPart = Extract<Part, { kind: "resistor" }>;
type SlideSwitch = Extract<Part, { kind: "slideSwitch" }>;
type Transistor = Extract<Part, { kind: "transistor" }>;

/**
 * How many diodes, each the right way round, each net is reached through from + and from −
 * (ADR 0049): 0 for the rail itself, and nothing for a net it does not reach. A diode lets current
 * through from its anode to its cathode alone, and the way with the fewest is the one the current
 * takes, each diode on it taking about 0.7 V.
 */
interface Reach {
  readonly fed: ReadonlyMap<string, number>;
  readonly drained: ReadonlyMap<string, number>;
}

/**
 * A light's way from + to −: up from its long leg to a net + reaches, and down from its short leg to
 * one − reaches, through resistors and diodes the right way round, with nothing else on a net between
 * (ADR 0033, ADR 0049). `top` and `bottom` are where it meets what + and − reach.
 */
interface Way {
  readonly resistors: readonly ResistorPart[];
  readonly diodes: readonly Diode[];
  readonly top: string;
  readonly bottom: string;
}

/**
 * The nets a layout makes, with the buttons `pressed` says are held, and each slide switch's middle
 * leg joined to the outer leg `slid` says it is slid towards, or to neither (ADR 0052). On a Pico, its
 * pins join the strips they are in and its grounds each other; a circuit with a supply has no Pico
 * (ADR 0032).
 */
function wireUp(
  parts: readonly Part[],
  pressed: (part: ButtonPart) => boolean,
  pico = true,
  slid: (part: SlideSwitch) => Hole | undefined = () => undefined,
): Nets {
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
    if (part.kind === "slideSwitch") {
      const towards = slid(part);
      if (towards !== undefined) nets.join(stripOf(part.middle), stripOf(towards));
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
    case "diode":
      return `the ${part.model} with its anode in ${part.anode}`;
    case "ceramic":
      return `the ${formatNanofarads(part.nanofarads)} capacitor with its legs in ${part.from} and ${part.to}`;
    case "slideSwitch":
      return `the slide switch with its middle leg in ${part.middle}`;
    case "slidePotentiometer":
      return `the ${formatOhms(part.ohms)} slide potentiometer with its wiper in ${part.wiper}`;
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
    case "ceramic":
      return sameRow(part.from, part.to, 1)
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
    case "slidePotentiometer": {
      // Its wiper two holes from the end beside it, in one row, and its other end 17 rows along from
      // that end, in its column, on the other board (ADR 0053).
      const [wiper, end, other] = [part.wiper, part.end, part.otherEnd].map(holeAt);
      const [e, o] = [holeCentre(part.end), holeCentre(part.otherEnd)];
      const pair = sameRow(part.wiper, part.end, 2);
      const along =
        wiper?.kind === "main" &&
        end?.kind === "main" &&
        other?.kind === "main" &&
        Math.abs(o.x - e.x) < 0.01 &&
        Math.abs(Math.abs(o.y - e.y) - SLIDE_POTENTIOMETER_LENGTH_MM) < 0.01;
      return pair && along
        ? []
        : [
            `${name} needs its wiper two holes from the end beside it, in one row, and its other end in that end's column, 17 rows along, on the other breadboard`,
          ];
    }
    case "slideSwitch": {
      // Side by side, left to right, its middle leg between the other two (ADR 0052).
      const along =
        sameRow(part.left, part.middle, 1) &&
        sameRow(part.middle, part.right, 1) &&
        holeAt(part.middle).column === holeAt(part.left).column + 1 &&
        holeAt(part.right).column === holeAt(part.middle).column + 1;
      return along
        ? []
        : [
            `${name} needs its three legs side by side in one row: left, middle and right, left to right`,
          ];
    }
    case "diode": {
      // Lying as a resistor does, long enough for its body and its band (ADR 0049).
      const [a, k] = [holeCentre(part.anode), holeCentre(part.cathode)];
      if (stripOf(part.anode) === stripOf(part.cathode)) {
        return [`${name} has both ends in one strip, so it does nothing`];
      }
      return Math.hypot(k.x - a.x, k.y - a.y) < 3 * PIN_PITCH_MM - 0.01
        ? [`${name} needs its legs three holes apart or more, for its body to lie between them`]
        : [];
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
  // Nothing in a hole a button's body covers: it sits on the board over them (scratchpi's ADR 0154),
  // nor under a slide potentiometer's, which lies on them (ADR 0053).
  for (const part of parts) {
    if (part.kind !== "button" && part.kind !== "slidePotentiometer") continue;
    for (const hole of part.kind === "button"
      ? coveredBy(part)
      : coveredBySlidePotentiometer(part)) {
      const under = taken.get(hole);
      if (under) problems.push(`${under} has a leg in ${hole}, under ${describe(part, circuit)}`);
    }
  }
  if (problems.length > 0) return problems;
  problems.push(...placedProblems(circuit, parts));
  if (supply) return [...problems, ...supplyWiringProblems(circuit, parts, supply)];

  // A capacitor's one use is on a supply, keeping a light lit (ADR 0038, ADR 0043), a diode's
  // keeping a light's current one way, on a supply (ADR 0049), and a slide switch's lighting one
  // light or the other, on a supply too (ADR 0052).
  for (const part of parts) {
    if (part.kind === "electrolytic") {
      problems.push(
        `${describe(part, circuit)} has no use ratsnest knows on a Pico: an electrolytic capacitor keeps a light lit on a supply (ADR 0043)`,
      );
    }
    if (part.kind === "diode") {
      problems.push(
        `${describe(part, circuit)} has no use ratsnest knows on a Pico: a diode keeps a light's current one way on a supply (ADR 0049)`,
      );
    }
    if (part.kind === "slideSwitch") {
      problems.push(
        `${describe(part, circuit)} has no use ratsnest knows on a Pico: a slide switch lights one light or the other on a supply (ADR 0052)`,
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
  // its pin through the transistor's base (ADR 0044).
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
      // from its collector down to ground (ADR 0045): which rail its emitter is on, and which of the
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

  // A ceramic capacitor, timed by a pair of pins (ADR 0051): one leg straight on ground, the other on
  // the pin that reads it, and one resistor to it from a second pin, which charges it.
  for (const capacitor of parts) {
    if (capacitor.kind !== "ceramic") continue;
    const name = describe(capacitor, circuit);
    const [first, second] = [net(capacitor.from), net(capacitor.to)];
    const node = first === ground ? second : second === ground ? first : undefined;
    if (node === undefined || node === ground) {
      problems.push(`${name} has neither leg on ground: one goes straight to ground`);
      continue;
    }
    const readers = pinsIn(node).filter((pin) => pin.kind === "gpio");
    if (readers.length !== 1) {
      problems.push(
        readers.length === 0
          ? `${name} has its other leg on no pin: a pin goes straight to it, to read it`
          : `${name} has its other leg on ${readers.map((pin) => pin.label).join(" and ")}: one pin reads it, and another charges it through a resistor`,
      );
      continue;
    }
    const chargers = resistors.filter((r) => {
      const ends = [net(r.from), net(r.to)];
      const far = ends[0] === node ? ends[1] : ends[1] === node ? ends[0] : undefined;
      return far !== undefined && far !== node && pinsIn(far).some((pin) => pin.kind === "gpio");
    });
    const [resistor] = chargers;
    if (!resistor || chargers.length !== 1) {
      problems.push(
        `${name} is charged by no pin: one resistor goes to its other leg from a second pin`,
      );
      continue;
    }
    accounted.add(resistor);
    if ((terminals.get(node) ?? 0) !== 3) {
      problems.push(
        `${name} has something else on its other leg: only its resistor and the pin that reads it go there`,
      );
    }
    if (!inRange(resistor, CHARGE_OHMS_RANGE)) {
      problems.push(
        `${name}'s resistor is ${formatOhms(resistor.ohms)}, outside ${CHARGE_OHMS_RANGE.map(formatOhms).join(" to ")}`,
      );
      continue;
    }
    const seconds = resistor.ohms * capacitor.nanofarads * 1e-9;
    if (seconds < TIMING_SECONDS) {
      problems.push(
        `${name} charges through the ${formatOhms(resistor.ohms)} resistor in about ${Math.round(seconds * 1e6)} µs, too fast for the script to time: with that resistor it needs ${formatNanofarads(Math.ceil(TIMING_SECONDS / (resistor.ohms * 1e-9)))} or more`,
      );
    }
  }

  // A slide potentiometer, read by the Pico (ADR 0053): a divider from 3V3(OUT) to ground, one end on
  // each, and its wiper straight on an analogue pin, with nothing else on it.
  for (const potentiometer of parts) {
    if (potentiometer.kind !== "slidePotentiometer") continue;
    const name = describe(potentiometer, circuit);
    const ends = [net(potentiometer.end), net(potentiometer.otherEnd)];
    const wiper = net(potentiometer.wiper);
    const analogue = ANALOGUE_GPIOS.map((gpio) => `GP${gpio}`);
    if (wiper === power || wiper === ground) {
      problems.push(
        `${name} has its wiper on ${wiper === power ? POWER_LABEL : "ground"}: its wiper, beside one end, goes to an analogue pin, ${analogue.join(", ").replace(/, (?=[^,]*$)/, " or ")}, and its two ends to ${POWER_LABEL} and ground`,
      );
      continue;
    }
    if (!(ends.includes(power) && ends.includes(ground))) {
      const on = ends.map((end) =>
        end === power
          ? POWER_LABEL
          : end === ground
            ? "ground"
            : (pinsIn(end)[0]?.label ?? "nothing"),
      );
      problems.push(
        `${name} has its ends on ${on.join(" and ")}: one end goes on ${POWER_LABEL} and the other on ground`,
      );
      continue;
    }
    const pins = pinsIn(wiper).filter((pin) => pin.kind === "gpio");
    const [pin] = pins;
    if (!pin || pins.length !== 1) {
      problems.push(
        `${name} has its wiper on ${pins.length === 0 ? "no pin" : pins.map((p) => p.label).join(" and ")}: it goes straight to one analogue pin, ${analogue.join(", ").replace(/, (?=[^,]*$)/, " or ")}`,
      );
      continue;
    }
    if (!analogue.includes(pin.label)) {
      problems.push(
        `${name} has its wiper on ${pin.label}, which reads no voltage: an analogue pin, ${analogue.join(", ").replace(/, (?=[^,]*$)/, " or ")}, does`,
      );
      continue;
    }
    if ((terminals.get(wiper) ?? 0) !== 2) {
      problems.push(
        `${name} has something else on its wiper: only its analogue pin, ${pin.label}, goes there`,
      );
    }
    if (
      potentiometer.ohms < SLIDE_POTENTIOMETER_OHMS_RANGE[0] ||
      potentiometer.ohms > SLIDE_POTENTIOMETER_OHMS_RANGE[1]
    ) {
      problems.push(
        `${name} is ${formatOhms(potentiometer.ohms)}, outside ${SLIDE_POTENTIOMETER_OHMS_RANGE.map(formatOhms).join(" to ")}`,
      );
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
        `${describe(resistor, circuit)} is not a light's resistor, a pull-down, a transistor's base resistor or a capacitor's charging resistor`,
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

  const slides = parts.filter((part): part is SlideSwitch => part.kind === "slideSwitch");
  /**
   * Every way the slide switches can be set, each slid towards its left leg or its right one
   * (ADR 0052): one way, setting nothing, where there is none.
   */
  const settings = slides.reduce<ReadonlyMap<SlideSwitch, Hole>[]>(
    (sofar, slide) =>
      sofar.flatMap((setting) =>
        [slide.left, slide.right].map((leg) => new Map([...setting, [slide, leg]])),
      ),
    [new Map()],
  );
  /** How a problem says which way the switches are set: nothing, where there is none. */
  const setAs = (setting: ReadonlyMap<SlideSwitch, Hole>) =>
    [...setting].map(([slide, leg]) => `${describe(slide, circuit)} is slid towards ${leg}`);
  /** The nets with every button held but those `released` names, the switches set as `setting` is. */
  const held = (
    released: ReadonlySet<Part> = new Set(),
    setting: ReadonlyMap<SlideSwitch, Hole> = new Map(),
  ) =>
    wireUp(
      parts,
      (part) => !released.has(part),
      false,
      (slide) => setting.get(slide),
    );
  /** Nothing held, and every slide switch joined to neither of its outer legs. */
  const open = wireUp(parts, () => false, false);
  /** Every button held, at each way the switches can be set: what lights each light. */
  const states = settings.map((setting) => held(new Set(), setting));
  const plusOf = (nets: Nets) => nets.find(stripOf(leads.plus));
  const minusOf = (nets: Nets) => nets.find(stripOf(leads.minus));

  // A short first: + joined to −, with nothing held, or with every button held, which joins the
  // most any of them can, at every way the switches can be set.
  for (const setting of settings) {
    const set = setAs(setting);
    const unheld = wireUp(
      parts,
      () => false,
      false,
      (slide) => setting.get(slide),
    );
    if (plusOf(unheld) === minusOf(unheld)) {
      const when = set.length > 0 ? ` while ${set.join(" and ")}` : "";
      return [...problems, `the supply's + and − are joined${when}: a short across it`];
    }
    const all = held(new Set(), setting);
    if (plusOf(all) === minusOf(all)) {
      const when = ["every button is held", ...set].join(" and ");
      return [...problems, `the supply's + and − are joined while ${when}: a short`];
    }
  }

  // A ceramic capacitor's one use is on a Pico, which times it (ADR 0051), and a slide
  // potentiometer's too, which reads it (ADR 0053).
  for (const part of parts) {
    if (part.kind === "ceramic") {
      problems.push(
        `${describe(part, circuit)} has no use ratsnest knows on a supply: a ceramic capacitor is timed by a Pico's pins (ADR 0051)`,
      );
    }
    if (part.kind === "slidePotentiometer") {
      problems.push(
        `${describe(part, circuit)} has no use ratsnest knows on a supply: a slide potentiometer is read by a Pico's analogue pin (ADR 0053)`,
      );
    }
  }

  const diodes = parts.filter((part): part is Diode => part.kind === "diode");
  /** What + and − reach through the diodes, as `through` has them: as placed, or one turned round. */
  const reachOf = (nets: Nets, through: readonly Diode[] = diodes): Reach => {
    const spread = (start: string, forward: boolean) => {
      const levels = new Map([[start, 0]]);
      for (let frontier = [start]; frontier.length > 0; ) {
        const next: string[] = [];
        for (const node of frontier) {
          for (const diode of through) {
            const [from, to] = forward
              ? [diode.anode, diode.cathode]
              : [diode.cathode, diode.anode];
            const target = nets.find(stripOf(to));
            if (nets.find(stripOf(from)) !== node || levels.has(target)) continue;
            levels.set(target, (levels.get(node) ?? 0) + 1);
            next.push(target);
          }
        }
        frontier = next;
      }
      return levels;
    };
    return { fed: spread(plusOf(nets), true), drained: spread(minusOf(nets), false) };
  };
  /**
   * Whether a part only joins strips, as the nets have it: a wire, a button and a slide switch, whose
   * legs are left out of the legs a light's way passes.
   */
  const joins = (part: Part) =>
    part.kind === "wire" || part.kind === "button" || part.kind === "slideSwitch";
  /**
   * The legs in each net, with the diodes as `through` has them, a button's sides and a slide switch's
   * legs left out.
   */
  const legsAt = (nets: Nets, through: readonly Diode[]) => {
    const at = new Map<string, { part: Part; hole: Hole }[]>();
    for (const placed of parts) {
      if (joins(placed)) continue;
      const part = placed.kind === "diode" ? (through[diodes.indexOf(placed)] ?? placed) : placed;
      for (const hole of legsOf(part)) {
        const node = nets.find(stripOf(hole));
        at.set(node, [...(at.get(node) ?? []), { part, hole }]);
      }
    }
    return at;
  };
  /** A light's way in `nets`, or nothing if a walk from either leg meets anything but its own. */
  const wayOf = (
    light: Light,
    nets: Nets,
    reach: Reach,
    through: readonly Diode[] = diodes,
  ): Way | undefined => {
    const at = legsAt(nets, through);
    const walk = (start: string, up: boolean) => {
      const resistors: ResistorPart[] = [];
      const passed: Diode[] = [];
      let node = start;
      let from: Part = light;
      while (!(up ? reach.fed : reach.drained).has(node)) {
        const here = (at.get(node) ?? []).filter((leg) => leg.part !== from);
        const [leg] = here;
        if (here.length !== 1 || !leg || resistors.length + passed.length > parts.length) return;
        const { part, hole } = leg;
        if (part.kind === "resistor") {
          resistors.push(part);
          node = nets.find(stripOf(hole === part.from ? part.to : part.from));
        } else if (part.kind === "diode" && hole === (up ? part.cathode : part.anode)) {
          passed.push(part);
          node = nets.find(stripOf(up ? part.anode : part.cathode));
        } else return;
        from = part;
      }
      return { resistors, diodes: passed, end: node };
    };
    const up = walk(nets.find(stripOf(light.anode)), true);
    const down = walk(nets.find(stripOf(light.cathode)), false);
    if (!up || !down) return undefined;
    return {
      resistors: [...up.resistors, ...down.resistors],
      diodes: [...up.diodes, ...down.diodes],
      top: up.end,
      bottom: down.end,
    };
  };

  // A diode the right way round from + to −, alone or with others, is a short too (ADR 0049), at
  // every way the switches can be set.
  for (const [nets, when] of settings.flatMap((setting) => {
    const set = setAs(setting);
    const unheld = wireUp(
      parts,
      () => false,
      false,
      (slide) => setting.get(slide),
    );
    return [
      [unheld, set.length > 0 ? ` while ${set.join(" and ")}` : ""],
      [held(new Set(), setting), ` while ${["every button is held", ...set].join(" and ")}`],
    ] as const;
  })) {
    const reach = reachOf(nets);
    const across = diodes.find(
      (diode) =>
        reach.fed.has(nets.find(stripOf(diode.anode))) &&
        reach.drained.has(nets.find(stripOf(diode.cathode))),
    );
    if (across) {
      return [
        ...problems,
        `${describe(across, circuit)} lets the supply's current straight from + to −${when}, with nothing to hold it back: a short`,
      ];
    }
  }

  /**
   * How many legs, and leads, each net of `nets` has, a button's sides and a slide switch's legs left
   * out.
   */
  const legsIn = (nets: Nets) => {
    const counts = new Map<string, number>();
    const count = (node: string) => counts.set(node, (counts.get(node) ?? 0) + 1);
    count(nets.find(stripOf(leads.plus)));
    count(nets.find(stripOf(leads.minus)));
    for (const part of parts) {
      if (joins(part)) continue;
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
  const lit = (light: Light, nets: Nets) =>
    (wayOf(light, nets, reachOf(nets))?.resistors.length ?? 0) > 0;

  /** What a light comes to in one state of the board, every button held. */
  interface Verdict {
    readonly problems: readonly string[];
    /** Its resistor, once it is wired from + through it to −, of a value in range or not. */
    readonly resistor?: ResistorPart;
    /** The transistor it is on the collector of, if any. */
    readonly transistor?: Transistor;
    /** Its way from + to −, once it is wired so, and what + and − reach. */
    readonly way?: Way;
    readonly reach: Reach;
  }
  // A light on a transistor's collector is that transistor's, as on a Pico (ADR 0044, ADR 0046).
  const transistors = parts.filter((part): part is Transistor => part.kind === "transistor");
  const outOfRange = (light: Light, resistor: ResistorPart): string[] =>
    resistor.ohms < LIGHT_OHMS_RANGE[0] || resistor.ohms > LIGHT_OHMS_RANGE[1]
      ? [
          `${describe(light, circuit)}'s resistor is ${formatOhms(resistor.ohms)}, outside ${LIGHT_OHMS_RANGE.map(formatOhms).join(" to ")}`,
        ]
      : [];
  /**
   * A light, in nets with every button held: the right way round, between + and −, through exactly
   * one resistor of its own, of a value that lights it safely.
   */
  const judge = (light: Light, all: Nets): Verdict => {
    const name = describe(light, circuit);
    const legs = legsIn(all);
    const plus = plusOf(all);
    const reach = reachOf(all);
    const reaches = (leg: string, collector: string) =>
      leg === collector || between(all, leg, collector).length === 1;
    const anode = all.find(stripOf(light.anode));
    const cathode = all.find(stripOf(light.cathode));
    const transistor = transistors.find((t) => {
      const collector = all.find(stripOf(t.collector));
      return reaches(cathode, collector) || reaches(anode, collector);
    });
    if (transistor) {
      const collector = all.find(stripOf(transistor.collector));
      const collectorName = `the ${transistor.model}'s collector`;
      if (reaches(anode, collector) && !reaches(cathode, collector)) {
        return {
          problems: [
            `${name} is in backwards: its long leg must be towards +, and its short leg towards ${collectorName}`,
          ],
          transistor,
          reach,
        };
      }
      const [middle, series] =
        cathode === collector
          ? [anode, between(all, plus, anode)]
          : anode === plus
            ? [cathode, between(all, cathode, collector)]
            : [undefined, []];
      const [resistor] = series;
      if (!middle || !resistor || series.length !== 1 || legs.get(middle) !== 2) {
        return {
          problems: [`${name} is not wired from + through one resistor to ${collectorName}`],
          transistor,
          reach,
        };
      }
      return { problems: outOfRange(light, resistor), resistor, transistor, reach };
    }
    // What + and − reach through diodes counts as + and − (ADR 0049).
    if (reach.drained.has(anode) || reach.fed.has(cathode)) {
      return { problems: [`${name} is in backwards: its long leg must be towards +`], reach };
    }
    if (reach.fed.has(anode) && reach.drained.has(cathode)) {
      return { problems: [`${name} has no resistor between + and −`], reach };
    }
    const way = wayOf(light, all, reach);
    const [resistor] = way?.resistors ?? [];
    if (!way || !resistor || way.resistors.length !== 1) {
      return { problems: [`${name} is not wired from + through one resistor to −`], reach };
    }
    return { problems: outOfRange(light, resistor), resistor, way, reach };
  };

  // Every light, judged with every button held and the switches set the first way that wires it from
  // + to − (ADR 0052): with no slide switch, the one way there is. The resistor it takes at every way
  // that does is its own.
  const accounted = new Set<Part>();
  const switching = new Set<Part>();
  const ways = new Map<Light, Verdict>();
  for (const light of lights) {
    const verdicts = states.map((all) => judge(light, all));
    const chosen = verdicts.find((verdict) => verdict.resistor) ?? (verdicts[0] as Verdict);
    problems.push(...chosen.problems);
    for (const verdict of verdicts) {
      if (verdict.transistor) switching.add(verdict.transistor);
      if (verdict.resistor) accounted.add(verdict.resistor);
    }
    if (chosen.way) ways.set(light, chosen);
  }

  // Every diode on a light's way, the right way round (ADR 0049): in the way itself, or taking the
  // current from + to where a light's way starts, or from where one ends to −, its band towards −, at
  // some way the switches can be set.
  const carries = (diode: Diode, through: readonly Diode[], all: Nets): boolean => {
    const reached = reachOf(all, through);
    const lit = lights.flatMap((light) => {
      const way = wayOf(light, all, reached, through);
      return way?.resistors.length === 1 ? [way] : [];
    });
    if (lit.some((way) => way.diodes.includes(diode))) return true;
    const node = (hole: Hole) => all.find(stripOf(hole));
    const tops = new Set(lit.map((way) => way.top));
    const bottoms = new Set(lit.map((way) => way.bottom));
    // A step further from + than its anode, into a light's way or a diode that takes it on.
    const feeds = (each: Diode): boolean => {
      const anode = reached.fed.get(node(each.anode));
      return (
        anode !== undefined &&
        reached.fed.get(node(each.cathode)) === anode + 1 &&
        (tops.has(node(each.cathode)) ||
          through.some((next) => node(next.anode) === node(each.cathode) && feeds(next)))
      );
    };
    const drains = (each: Diode): boolean => {
      const cathode = reached.drained.get(node(each.cathode));
      return (
        cathode !== undefined &&
        reached.drained.get(node(each.anode)) === cathode + 1 &&
        (bottoms.has(node(each.anode)) ||
          through.some((next) => node(next.cathode) === node(each.anode) && drains(next)))
      );
    };
    return feeds(diode) || drains(diode);
  };
  for (const diode of diodes) {
    if (states.some((all) => carries(diode, diodes, all))) continue;
    const turned = { ...diode, anode: diode.cathode, cathode: diode.anode };
    const name = describe(diode, circuit);
    const others = diodes.map((each) => (each === diode ? turned : each));
    problems.push(
      states.some((all) => carries(turned, others, all))
        ? `${name} is in backwards: its band, at its cathode, goes towards −, the way its light's current runs`
        : `${name} is on no light's way: it goes between + and a light's resistor, or between a light and −, its band towards −`,
    );
  }

  // Enough of the supply left for each light once the diodes on its way have taken theirs (ADR 0049).
  for (const [light, { way, reach }] of ways) {
    if (!way) continue;
    const count =
      way.diodes.length + (reach.fed.get(way.top) ?? 0) + (reach.drained.get(way.bottom) ?? 0);
    if (count === 0) continue;
    const colour = circuit.leds.find((led) => led.id === light.led)?.colour;
    const left = (volts: number) =>
      volts - lightVolts(colour === "rgb" || !colour ? "red" : colour) - count * DIODE_VOLTS;
    if (left(supply.volts) >= HEADROOM_VOLTS) continue;
    const enough = SUPPLY_VOLTS.find((volts) => left(volts) >= HEADROOM_VOLTS);
    problems.push(
      `${describe(light, circuit)} has ${count === 1 ? "a diode" : `${count} diodes`} on its way, each taking about ${DIODE_VOLTS} V, which leaves too little of the ${supply.volts} V supply to light it: ${enough ? `take \`volts: ${enough}\`` : "take fewer diodes"}`,
    );
  }
  // Two NPN transistors, crosswise, make a flasher (ADR 0046): each one's emitter on −, its light on
  // its collector, its base fed from + through a resistor, and a capacitor from the other one's
  // collector to its base, which holds it off for a while each time the other turns on.
  const capacitors = parts.filter(
    (part): part is Extract<Part, { kind: "electrolytic" }> => part.kind === "electrolytic",
  );
  const coupling = new Set<Part>();
  const netOf = (hole: Hole) => open.find(stripOf(hole));
  for (const transistor of transistors) {
    const name = describe(transistor, circuit);
    if (TRANSISTORS[transistor.model].type !== "NPN") {
      problems.push(
        `${name} has no use ratsnest knows on a supply: two NPN transistors make a flasher (ADR 0046)`,
      );
      continue;
    }
    if (!switching.has(transistor)) {
      problems.push(
        `${name} switches no light: its collector goes under a light, which goes to + through its resistor`,
      );
    }
    if (netOf(transistor.emitter) !== minusOf(open)) {
      problems.push(`${name} has its emitter off −`);
    }
    const base = netOf(transistor.base);
    const range = FLASHER_BASE_OHMS_RANGE.map(formatOhms).join(" to ");
    const feeds = between(open, plusOf(open), base);
    let fed: Extract<Part, { kind: "resistor" }> | undefined;
    if (base === plusOf(open)) {
      problems.push(`${name} has its base straight on +: a resistor of ${range} goes between them`);
    } else if (feeds.length !== 1) {
      problems.push(`${name} has its base off +: one resistor of ${range} goes between them`);
    } else {
      fed = feeds[0] as Extract<Part, { kind: "resistor" }>;
      accounted.add(fed);
      if (fed.ohms < FLASHER_BASE_OHMS_RANGE[0] || fed.ohms > FLASHER_BASE_OHMS_RANGE[1]) {
        problems.push(`${name}'s base resistor is ${formatOhms(fed.ohms)}, outside ${range}`);
        fed = undefined;
      }
    }
    // The other transistors' collectors, one of which its capacitor comes from.
    const others = transistors
      .filter((other) => other !== transistor)
      .map((other) => netOf(other.collector));
    const crosswise = capacitors.filter((capacitor) => {
      const ends = [netOf(capacitor.plus), netOf(capacitor.minus)];
      return ends.includes(base) && others.some((collector) => ends.includes(collector));
    });
    if (crosswise.length !== 1) {
      problems.push(
        `${name} needs one capacitor from the other transistor's collector to its base: two transistors, each with one, make a flasher`,
      );
      continue;
    }
    const capacitor = crosswise[0] as Extract<Part, { kind: "electrolytic" }>;
    coupling.add(capacitor);
    if (netOf(capacitor.minus) !== base) {
      problems.push(
        `${describe(capacitor, circuit)} is in backwards: its + leg goes towards the collector, and its − leg, under the stripe, towards the base`,
      );
      continue;
    }
    if (fed) {
      const seconds = 0.69 * fed.ohms * capacitor.microfarads * 1e-6;
      const [shortest, longest] = FLASH_SECONDS_RANGE;
      const said = `the ${formatOhms(fed.ohms)} resistor and ${describe(capacitor, circuit)} hold ${name} off for about ${Math.round(seconds * 100) / 100} s at a time`;
      if (seconds < shortest) {
        problems.push(`${said}, too fast to see the lights flash: ${shortest} s at least`);
      } else if (seconds > longest) {
        problems.push(`${said}, so slowly that they seem to have stopped: ${longest} s at most`);
      }
    }
  }

  for (const resistor of resistors) {
    if (!accounted.has(resistor)) {
      problems.push(
        `${describe(resistor, circuit)} is not a light's resistor, or a flasher's base resistor`,
      );
    }
  }

  // Every other capacitor keeps a light lit (ADR 0043): its − leg on −, its + leg between a button
  // and a light's resistor, which a button charges and the light empties, slowly enough to be seen.
  for (const capacitor of capacitors) {
    if (coupling.has(capacitor)) continue;
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
    const charged = states.some((all) => all.find(stripOf(capacitor.plus)) === plusOf(all));
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

  // Every button switches a light: let go of it alone, and a light lit while all are held goes out,
  // at some way the switches can be set.
  if (problems.length === 0) {
    for (const button of buttons) {
      const switches = settings.some((setting) => {
        const all = held(new Set(), setting);
        const without = held(new Set([button]), setting);
        return lights.some((light) => lit(light, all) && !lit(light, without));
      });
      if (!switches) {
        problems.push(
          `${describe(button, circuit)} switches no light: it goes on a light's way, between + and the light or between the light and −`,
        );
      }
    }
    // And every slide switch lights one light or the other (ADR 0052): slid towards either outer leg,
    // with every button held, it lights a light that slid the other way it does not.
    for (const slide of slides) {
      for (const [leg, other] of [
        [slide.left, slide.right],
        [slide.right, slide.left],
      ] as const) {
        const ownLight = settings.some((setting) => {
          if (setting.get(slide) !== leg) return false;
          const there = held(new Set(), setting);
          const back = held(new Set(), new Map([...setting, [slide, other]]));
          return lights.some((light) => lit(light, there) && !lit(light, back));
        });
        if (!ownLight) {
          problems.push(
            `${describe(slide, circuit)} lights no light of its own when slid towards ${leg}: each outer leg goes on a light's way, so that it lights one light or the other`,
          );
        }
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
  for (const hole of [...buttons.flatMap(sidesOf), ...slides.flatMap(legsOf)]) {
    const node = open.find(stripOf(hole));
    terminals.set(node, (terminals.get(node) ?? 0) + 1);
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
