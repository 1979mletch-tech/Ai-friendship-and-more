import { describe, expect, it } from "vitest";
import { detectSafetyRisk } from "./safety";

describe("detectSafetyRisk", () => {
  it("flags immediate danger language", () => {
    expect(detectSafetyRisk("I want to kill myself")).toBe(true);
    expect(detectSafetyRisk("I might hurt them")).toBe(true);
    expect(detectSafetyRisk("I keep thinking about self harm")).toBe(true);
    expect(detectSafetyRisk("I have pills for an overdose")).toBe(true);
    expect(detectSafetyRisk("I want to stab someone")).toBe(true);
    expect(detectSafetyRisk("I could make a bomb")).toBe(true);
  });

  it("does not flag neutral conversations", () => {
    expect(detectSafetyRisk("Can we plan my weekend?")).toBe(false);
  });
});
