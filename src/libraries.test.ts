import { describe, expect, it } from "bun:test";
import { fileNameOf, isAddress, isModuleFile } from "./libraries";

describe("a library's addresses (ADR 0062)", () => {
  it("are https, with a host, and nothing a link could not hold", () => {
    expect(isAddress("https://github.com/T-622/RPI-PICO-I2C-LCD")).toBe(true);
    for (const bad of [
      "http://github.com/T-622/RPI-PICO-I2C-LCD",
      "github.com/T-622/RPI-PICO-I2C-LCD",
      "https://",
      'https://example.org/a"b.py',
      "https://example.org/a b.py",
      "javascript:alert(1)",
    ]) {
      expect(isAddress(bad), bad).toBe(false);
    }
  });

  it("name each file by the last part of its address, which is what the reader saves it as", () => {
    expect(
      fileNameOf("https://raw.githubusercontent.com/T-622/RPI-PICO-I2C-LCD/main/pico_i2c_lcd.py"),
    ).toBe("pico_i2c_lcd.py");
    expect(fileNameOf("https://example.org/lib/ssd1306.mpy?raw=1")).toBe("ssd1306.mpy");
  });

  it("are MicroPython modules, which an import names", () => {
    for (const good of ["lcd_api.py", "ssd1306.mpy", "_private.py"]) {
      expect(isModuleFile(good), good).toBe(true);
    }
    for (const bad of ["RPI-PICO-I2C-LCD", "lcd-api.py", "1lcd.py", "lcd_api.txt", ".py"]) {
      expect(isModuleFile(bad), bad).toBe(false);
    }
  });
});
