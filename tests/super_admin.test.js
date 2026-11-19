import assert from "node:assert/strict";
import test from "node:test";
import { getPermissions, SUPER_ADMIN_EMAIL } from "../src/auth/permissions.js";

test("the platform owner remains an admin regardless of profile role or email casing", () => {
  assert.deepEqual(getPermissions("general", SUPER_ADMIN_EMAIL.toUpperCase()), {
    isAdmin: true,
    isSuperAdmin: true,
    isAdvance: false,
    isAdvanceOrAdmin: true,
    isGeneral: false,
  });
});

test("other admins keep admin access but not super-admin permissions", () => {
  const permissions = getPermissions("admin", "another-admin@gmail.com");
  assert.equal(permissions.isAdmin, true);
  assert.equal(permissions.isSuperAdmin, false);
});

test("regular members do not receive admin permissions", () => {
  const permissions = getPermissions("general", "learner@gmail.com");
  assert.equal(permissions.isAdmin, false);
  assert.equal(permissions.isSuperAdmin, false);
});
