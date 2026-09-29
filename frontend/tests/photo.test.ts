/**
 * @jest-environment jsdom
 */
// Adjust this import to wherever preparePhoto lives
import { preparePhoto } from "../lib/photo";

const MAX_LEN = 180000;
const TEN_MB = 10 * 1024 * 1024;

function makeFile(type = "image/jpeg", size?: number): File {
  const file = new File(["x"], "photo", { type });
  if (size !== undefined) Object.defineProperty(file, "size", { value: size });
  return file;
}

// A string of exactly n characters, standing in for a data URL
const dataUrl = (n: number) => "a".repeat(n);

describe("preparePhoto", () => {
  const originalImage = globalThis.Image;
  const originalCreate = URL.createObjectURL;
  const originalRevoke = URL.revokeObjectURL;

  let imgW: number;
  let imgH: number;
  let decodeMock: jest.Mock;
  let ctx: { fillStyle: string; fillRect: jest.Mock; drawImage: jest.Mock };
  let getContextSpy: jest.SpyInstance;
  let toDataURLSpy: jest.SpyInstance;

  beforeEach(() => {
    imgW = 800;
    imgH = 600;
    decodeMock = jest.fn().mockResolvedValue(undefined);

    // Class fields are read at construction, so tests can change imgW/imgH first
    class MockImage {
      width = imgW;
      height = imgH;
      src = "";
      decode = () => decodeMock();
    }
    globalThis.Image = MockImage as unknown as typeof Image;

    URL.createObjectURL = jest.fn(() => "blob:mock");
    URL.revokeObjectURL = jest.fn();

    ctx = { fillStyle: "", fillRect: jest.fn(), drawImage: jest.fn() };
    getContextSpy = jest
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockImplementation((() => ctx) as never);
    toDataURLSpy = jest
      .spyOn(HTMLCanvasElement.prototype, "toDataURL")
      .mockImplementation(() => dataUrl(1000));
  });

  afterEach(() => {
    globalThis.Image = originalImage;
    URL.createObjectURL = originalCreate;
    URL.revokeObjectURL = originalRevoke;
    jest.restoreAllMocks();
  });

  describe("validation", () => {
    test("rejects unsupported file types before doing any work", async () => {
      await expect(preparePhoto(makeFile("image/gif"), 500)).rejects.toThrow(
        "Choose a JPEG, PNG or WebP image.",
      );
      expect(URL.createObjectURL).not.toHaveBeenCalled();
    });

    test("rejects non-image files", async () => {
      await expect(preparePhoto(makeFile("application/pdf"), 500)).rejects.toThrow(
        "Choose a JPEG, PNG or WebP image.",
      );
    });

    test.each(["image/jpeg", "image/png", "image/webp"])("accepts %s", async (type) => {
      await expect(preparePhoto(makeFile(type), 500)).resolves.toEqual(expect.any(String));
    });

    test("rejects files larger than 10 MB", async () => {
      await expect(preparePhoto(makeFile("image/jpeg", TEN_MB + 1), 500)).rejects.toThrow(
        "Choose a photo smaller than 10 MB.",
      );
      expect(URL.createObjectURL).not.toHaveBeenCalled();
    });

    test("accepts a file of exactly 10 MB", async () => {
      await expect(preparePhoto(makeFile("image/jpeg", TEN_MB), 500)).resolves.toEqual(
        expect.any(String),
      );
    });
  });

  describe("resizing", () => {
    const drawnSize = () => {
      const [, , , w, h] = ctx.drawImage.mock.calls[0];
      return { w, h };
    };

    test("downscales a landscape image so the longest side equals size", async () => {
      imgW = 4000;
      imgH = 2000;
      await preparePhoto(makeFile(), 1000);
      expect(drawnSize()).toEqual({ w: 1000, h: 500 });
    });

    test("downscales a portrait image so the longest side equals size", async () => {
      imgW = 2000;
      imgH = 4000;
      await preparePhoto(makeFile(), 1000);
      expect(drawnSize()).toEqual({ w: 500, h: 1000 });
    });

    test("never upscales small images", async () => {
      imgW = 200;
      imgH = 100;
      await preparePhoto(makeFile(), 1000);
      expect(drawnSize()).toEqual({ w: 200, h: 100 });
    });

    test("keeps each dimension at least 1px for extreme aspect ratios", async () => {
      imgW = 10000;
      imgH = 1;
      await preparePhoto(makeFile(), 100);
      expect(drawnSize()).toEqual({ w: 100, h: 1 });
    });

    test("paints a white background before drawing the image", async () => {
      await preparePhoto(makeFile(), 1000);
      expect(ctx.fillStyle).toBe("#ffffff");
      expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 800, 600);
      expect(ctx.fillRect.mock.invocationCallOrder[0]).toBeLessThan(
        ctx.drawImage.mock.invocationCallOrder[0],
      );
    });

    test("draws the image at the origin", async () => {
      await preparePhoto(makeFile(), 1000);
      const [, x, y] = ctx.drawImage.mock.calls[0];
      expect([x, y]).toEqual([0, 0]);
    });
  });

  describe("compression", () => {
    test("returns the first attempt (quality 0.85) when it is small enough", async () => {
      const out = await preparePhoto(makeFile(), 1000);
      expect(out).toBe(dataUrl(1000));
      expect(toDataURLSpy).toHaveBeenCalledTimes(1);
      expect(toDataURLSpy).toHaveBeenCalledWith("image/jpeg", 0.85);
    });

    test("steps quality down until the result fits", async () => {
      toDataURLSpy
        .mockReturnValueOnce(dataUrl(MAX_LEN + 500)) // .85
        .mockReturnValueOnce(dataUrl(MAX_LEN + 100)) // .7
        .mockReturnValueOnce(dataUrl(50000)); // .5

      const out = await preparePhoto(makeFile(), 1000);

      expect(out).toBe(dataUrl(50000));
      expect(toDataURLSpy.mock.calls.map((c) => c[1])).toEqual([0.85, 0.7, 0.5]);
    });

    test("accepts a result of exactly 180,000 characters", async () => {
      toDataURLSpy.mockReturnValue(dataUrl(MAX_LEN));
      await expect(preparePhoto(makeFile(), 1000)).resolves.toHaveLength(MAX_LEN);
    });

    test("rejects a result of 180,001 characters at every quality", async () => {
      toDataURLSpy.mockReturnValue(dataUrl(MAX_LEN + 1));
      await expect(preparePhoto(makeFile(), 1000)).rejects.toThrow(
        "This image has too much detail. Choose a smaller photo.",
      );
      expect(toDataURLSpy.mock.calls.map((c) => c[1])).toEqual([0.85, 0.7, 0.5, 0.3]);
    });

    test("succeeds on the last quality level (0.3)", async () => {
      toDataURLSpy
        .mockReturnValueOnce(dataUrl(MAX_LEN + 1))
        .mockReturnValueOnce(dataUrl(MAX_LEN + 1))
        .mockReturnValueOnce(dataUrl(MAX_LEN + 1))
        .mockReturnValueOnce(dataUrl(1234));
      await expect(preparePhoto(makeFile(), 1000)).resolves.toBe(dataUrl(1234));
    });
  });

  describe("error handling", () => {
    test("throws when a 2D canvas context is unavailable", async () => {
      getContextSpy.mockImplementation((() => null) as never);
      await expect(preparePhoto(makeFile(), 1000)).rejects.toThrow(
        "Your browser could not process the image.",
      );
    });

    test("propagates decode failures", async () => {
      decodeMock.mockRejectedValue(new Error("decode failed"));
      await expect(preparePhoto(makeFile(), 1000)).rejects.toThrow("decode failed");
    });
  });

  describe("object URL cleanup", () => {
    test("creates the URL from the file and revokes it on success", async () => {
      const file = makeFile();
      await preparePhoto(file, 1000);
      expect(URL.createObjectURL).toHaveBeenCalledWith(file);
      expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock");
    });

    test("revokes the URL when decoding fails", async () => {
      decodeMock.mockRejectedValue(new Error("decode failed"));
      await expect(preparePhoto(makeFile(), 1000)).rejects.toThrow();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock");
    });

    test("revokes the URL when there is no canvas context", async () => {
      getContextSpy.mockImplementation((() => null) as never);
      await expect(preparePhoto(makeFile(), 1000)).rejects.toThrow();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock");
    });

    test("revokes the URL when the image is too detailed", async () => {
      toDataURLSpy.mockReturnValue(dataUrl(MAX_LEN + 1));
      await expect(preparePhoto(makeFile(), 1000)).rejects.toThrow();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock");
    });
  });
});