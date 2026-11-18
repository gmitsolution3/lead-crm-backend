import assert from "node:assert/strict";
import { describe, it } from "node:test";
import app from "../../app";

describe("Health API", () => {
  it("should have express app defined", () => {
    assert.ok(app);
  });
});

