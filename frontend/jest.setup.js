import { structuredClone as nodeStructuredClone } from "node:util";

if (typeof structuredClone === "undefined") {
  global.structuredClone = nodeStructuredClone ?? ((obj) => JSON.parse(JSON.stringify(obj)));
}

import "fake-indexeddb/auto";
import "@testing-library/jest-dom";

