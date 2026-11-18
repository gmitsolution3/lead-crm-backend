import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  extractPhoneDigits,
  findDuplicateInfo,
  normalizeUrl,
  sortLeadsBySourcePriority,
} from "../lead/lead.service";

describe("Lead Service Utilities", () => {
  it("normalizes URLs accurately", () => {
    assert.equal(
      normalizeUrl("https://www.example.com/shop/"),
      "example.com/shop",
    );
    assert.equal(normalizeUrl("http://sub.domain.org"), "sub.domain.org");
    assert.equal(normalizeUrl(""), "");
  });

  it("extracts phone digits properly", () => {
    assert.equal(extractPhoneDigits("+1 (555) 123-4567"), "15551234567");
    assert.equal(extractPhoneDigits("01712-345678"), "01712345678");
  });

  it("detects duplicates by matching phone digits", () => {
    const existing = [
      {
        name: "Acme Corp",
        phone: "+1 555-123-4567",
        website: "https://acme.com",
      },
    ];

    const duplicate = {
      name: "Acme New",
      phone: "555-123-4567",
      website: "",
    };

    const result = findDuplicateInfo(duplicate, existing);
    assert.equal(result.index, 0);
    assert.equal(result.by, "phone");
  });

  it("detects duplicates by matching normalized name and website", () => {
    const existing = [
      {
        name: "Tech Solutions",
        phone: "",
        website: "https://techsolutions.io",
      },
    ];

    const duplicate = {
      name: "Tech Solutions",
      phone: "",
      website: "http://www.techsolutions.io/",
    };

    const result = findDuplicateInfo(duplicate, existing);
    assert.equal(result.index, 0);
    assert.equal(result.by, "website");
  });

  it("detects duplicates by matching id", () => {
    const existing = [
      {
        id: "lead-123",
        leadId: "lead-123",
        name: "Acme Corp",
      },
    ];

    const duplicate = {
      id: "lead-123",
      name: "Acme Corp Updated",
    };

    const result = findDuplicateInfo(duplicate, existing);
    assert.equal(result.index, 0);
    assert.equal(result.by, "id");
  });

  it("sorts leads by source priority: Map -> Facebook -> LinkedIn", () => {
    const rawLeads = [
      { name: "Shop C", source: "LinkedIn", createdAt: 100 },
      { name: "Shop B", source: "Facebook", createdAt: 100 },
      { name: "Shop A", source: "Google Maps", createdAt: 100 },
      { name: "Shop D", source: "Website", createdAt: 100 },
      { name: "Shop A2", source: "Google Maps", createdAt: 200 },
    ];

    const sorted = sortLeadsBySourcePriority(rawLeads);
    assert.deepEqual(
      sorted.map((l) => l.name),
      ["Shop A2", "Shop A", "Shop B", "Shop C", "Shop D"],
    );
  });
});
