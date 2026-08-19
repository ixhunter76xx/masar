import assert from "node:assert/strict";

import { APP_PAGE, PAGE } from "../src/lib/motion";

for (const phase of [APP_PAGE.initial, APP_PAGE.animate, APP_PAGE.exit]) {
  assert.equal(
    "y" in phase,
    false,
    "انتقال المنطقة المحمية يجب ألّا يغيّر الموضع الرأسي",
  );
}

assert.equal(PAGE.initial.y, 6, "حركة الصفحات العامة يجب أن تبقى كما هي");
assert.equal(PAGE.animate.y, 0, "حركة الصفحات العامة يجب أن تبقى كما هي");
assert.equal(PAGE.exit.y, -3, "حركة الصفحات العامة يجب أن تبقى كما هي");

console.log("MOTION SHELL REGRESSION PASS");
