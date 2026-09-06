const { createDefaultPreset } = require("ts-jest");
const path = require("node:path");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  transform: {
    ...tsJestTransformCfg,
  },
  coverageReporters: [["lcov", { projectRoot: path.resolve(__dirname, "..") }], "text"],
};
