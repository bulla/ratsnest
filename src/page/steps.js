// A circuit's wiring page (ADR 0004): a step picks out its own parts in the drawing, and the
// script can be copied. Inlined into the page as it is, so it is plain script with no imports,
// and the page reads completely without it. It says nothing of its own: the words on the Copy
// button are the page's, in the page's language.
(() => {
  const drawing = document.querySelector(".breadboard-drawing");
  const steps = Array.from(document.querySelectorAll(".step"));
  if (!drawing) return;
  const parts = Array.from(drawing.querySelectorAll(".part"));
  let pinned = null;
  const canHover = window.matchMedia?.("(hover: hover)").matches ?? false;

  // Two or more lights take turns in the last step, the way the script makes them.
  const leds = drawing.querySelectorAll('[data-kind="led"]');
  if (leds.length > 1) {
    leds.forEach((led, i) => {
      led.setAttribute("data-phase", String(i % 2));
    });
  }

  const show = (step) => {
    const groups = step ? step.getAttribute("data-groups").split(" ") : [];
    drawing.classList.toggle("focus", groups.length > 0);
    drawing.classList.toggle("testing", Boolean(step?.hasAttribute("data-test")));
    for (const part of parts) {
      const own = (part.getAttribute("data-g") ?? "").split(" ");
      part.classList.toggle(
        "on",
        own.some((group) => groups.includes(group)),
      );
    }
  };

  for (const step of steps) {
    step.addEventListener("click", () => {
      pinned = pinned === step ? null : step;
      for (const other of steps) other.setAttribute("aria-pressed", String(other === pinned));
      show(pinned);
    });
    step.addEventListener("mouseenter", () => {
      if (canHover) show(step);
    });
    step.addEventListener("mouseleave", () => {
      if (canHover) show(pinned);
    });
  }

  for (const button of document.querySelectorAll(".copy")) {
    const code = document.getElementById(button.getAttribute("data-copies") ?? "");
    if (!code) continue;
    const copy = button.textContent;
    button.addEventListener("click", () => {
      const select = () => {
        const range = document.createRange();
        range.selectNodeContents(code);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
        button.textContent = button.getAttribute("data-selected") ?? copy;
      };
      if (navigator.clipboard) {
        navigator.clipboard.writeText(code.textContent ?? "").then(() => {
          button.textContent = button.getAttribute("data-copied") ?? copy;
        }, select);
      } else {
        select();
      }
      setTimeout(() => {
        button.textContent = copy;
      }, 1800);
    });
  }
})();
