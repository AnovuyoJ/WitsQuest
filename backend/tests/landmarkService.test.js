const { lookupLandmark, requireLandmark } = require("../services/landmarkService");
const originalFetch = global.fetch;
beforeEach(() => { global.fetch = jest.fn(); });
afterEach(() => { global.fetch = originalFetch; });

test("queries campus areas and nearby named features; chooses nearest and caches", async () => {
  global.fetch.mockResolvedValue({ ok: true, json: async () => ({ elements: [
    { type: "way", id: 2, tags: { name: "Far Hall" }, center: { lat: -26.191, lon: 28.03 } },
    { type: "node", id: 1, tags: { name: "Great Hall" }, lat: -26.19, lon: 28.03 },
  ] }) });
  expect(await lookupLandmark(-26.19, 28.03)).toEqual({ name: "Great Hall", osmUrl: "https://www.openstreetmap.org/node/1" });
  const query = global.fetch.mock.calls[0][1].body.get("data");
  expect(query).toContain('area.containing[amenity~"^(university|college)$"]');
  expect(query).toContain("(area.campus)(around:150,-26.19,28.03)");
  await lookupLandmark(-26.19, 28.03);
  expect(global.fetch).toHaveBeenCalledTimes(1);
});

test("empty mapped results do not verify a location", async () => {
  global.fetch.mockResolvedValue({ ok: true, json: async () => ({ elements: [] }) });
  await expect(requireLandmark(0, 0)).rejects.toMatchObject({ status: 422 });
});

test.each([
  () => Promise.reject(new Error("Timeout")),
  async () => ({ ok: false }),
  async () => ({ ok: true, json: async () => ({ elements: [], remark: "runtime error" }) }),
  async () => ({ ok: true, json: async () => ({ invalid: true }) }),
])("upstream failures are retryable and never cached as a match", async implementation => {
  global.fetch.mockImplementation(implementation);
  await expect(requireLandmark(1, 1)).rejects.toMatchObject({ status: 503 });
  await expect(requireLandmark(1, 1)).rejects.toMatchObject({ status: 503 });
  expect(global.fetch).toHaveBeenCalledTimes(2);
});

test("invalid coordinates never reach Overpass", async () => {
  await expect(lookupLandmark('0);out;', 0)).rejects.toMatchObject({ status: 400 });
  await expect(lookupLandmark(91, 0)).rejects.toMatchObject({ status: 400 });
  expect(global.fetch).not.toHaveBeenCalled();
});
