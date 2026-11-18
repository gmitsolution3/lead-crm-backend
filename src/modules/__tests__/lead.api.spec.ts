import assert from "node:assert/strict";
import http from "node:http";
import { after, before, describe, it } from "node:test";
import mongoose from "mongoose";
import app from "../../app";
import connectDB from "../../config/database";

describe("Lead API Integration End-to-End", () => {
  let server: http.Server;
  let baseUrl: string;
  let createdGroupId: string = "";
  let createdLeadId: string = "";

  before(async () => {
    await connectDB();
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address() as { port: number };
        baseUrl = `http://127.0.0.1:${addr.port}/api/v1`;
        resolve();
      });
    });
  });

  after(async () => {
    if (createdGroupId) {
      try {
        await fetch(`${baseUrl}/leads/group/${encodeURIComponent(createdGroupId)}`, {
          method: "DELETE",
        });
      } catch {}
    }
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await mongoose.disconnect();
  });

  it("POST /leads/save saves a new lead into backend MongoDB", async () => {
    const testLead = {
      id: `test-lead-${Date.now()}`,
      source: "Google Maps",
      name: "Integration Test Pet Clinic",
      phone: "+1 555-987-6543",
      email: "contact@integrationpetclinic.com",
      website: "https://integrationpetclinic.com",
      address: "123 Test Street, Test City",
      facebook: "https://facebook.com/integrationpetclinic",
      instagram: "https://instagram.com/integrationpetclinic",
      linkedin: null,
      whatsapp: "+1 555-987-6543",
      searchQuery: "Integration Test Query",
    };

    createdLeadId = testLead.id;

    const res = await fetch(`${baseUrl}/leads/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testLead),
    });

    assert.equal(res.status, 200);
    const json: any = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.data.status, "ok");
    assert.ok(json.data.count >= 1);
  });

  it("GET /search-groups returns the newly saved lead and search group", async () => {
    const res = await fetch(`${baseUrl}/search-groups`);
    assert.equal(res.status, 200);
    const json: any = await res.json();
    assert.equal(json.success, true);
    assert.ok(Array.isArray(json.data));

    const group = json.data.find(
      (g: any) => g.query.toLowerCase() === "integration test query".toLowerCase()
    );
    assert.ok(group, "Created search group should exist");
    createdGroupId = group.groupId || group.id;

    const lead = group.leads.find((l: any) => l.name === "Integration Test Pet Clinic");
    assert.ok(lead, "Created lead should exist in search group");
    assert.equal(lead.phone, "+1 555-987-6543");
    assert.equal(lead.email, "contact@integrationpetclinic.com");
    assert.equal(lead.website, "https://integrationpetclinic.com");
  });

  it("GET /leads/known returns metadata for deduplication", async () => {
    const res = await fetch(
      `${baseUrl}/leads/known?query=${encodeURIComponent("Integration Test Query")}`
    );
    assert.equal(res.status, 200);
    const json: any = await res.json();
    assert.equal(json.success, true);
    assert.ok(Array.isArray(json.data.phoneDigits));
    assert.ok(json.data.phoneDigits.includes("15559876543"));
  });

  it("PATCH /leads/:leadId/remark updates lead remark", async () => {
    const res = await fetch(`${baseUrl}/leads/${encodeURIComponent(createdLeadId)}/remark`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ remark: "High priority lead", groupId: createdGroupId }),
    });

    assert.equal(res.status, 200);
    const json: any = await res.json();
    assert.equal(json.success, true);

    const group = json.data.find((g: any) => (g.groupId || g.id) === createdGroupId);
    assert.ok(group);
    const lead = group.leads.find((l: any) => (l.leadId || l.id) === createdLeadId);
    assert.ok(lead);
    assert.equal(lead.remark, "High priority lead");
  });

  it("DELETE /leads/group/:groupId cleans up the test search group", async () => {
    const res = await fetch(
      `${baseUrl}/leads/group/${encodeURIComponent(createdGroupId)}`,
      { method: "DELETE" }
    );
    assert.equal(res.status, 200);
    const json: any = await res.json();
    assert.equal(json.success, true);

    const exists = json.data.some((g: any) => (g.groupId || g.id) === createdGroupId);
    assert.equal(exists, false, "Group should no longer exist after deletion");
    createdGroupId = ""; // Mark cleaned up
  });
});
