if (typeof structuredClone === "undefined") {
    global.structuredClone = require("node:util").structuredClone ?? ((obj) => JSON.parse(JSON.stringify(obj)));
}

import "fake-indexeddb/auto";
import "@testing-library/jest-dom";

