import nextJest from "next/jest.js";
import { fileURLToPath } from "node:url";

const createJestConfig = nextJest({ dir: "./" });

export default createJestConfig({
  testEnvironment: "jest-environment-jsdom",
  setupFiles: ["<rootDir>/jest.env.js"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  coverageReporters: [["lcov", { projectRoot: fileURLToPath(new URL("../", import.meta.url)) }], "text"],
});
