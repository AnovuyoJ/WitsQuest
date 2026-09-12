import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, test } from "@jest/globals";
import CampusArtwork, { campusScene } from "../components/collection/CampusArtwork";

afterEach(() => {
  cleanup();
});

test("campusScene maps title keywords to correct image filenames", () => {
  expect(campusScene("Main Library")).toBe("wits library.jpg");
  expect(campusScene("Tower of Light")).toBe("Tower of  light.jpg");
  expect(campusScene("MSL Building")).toBe("TW Khambule building @Wits University.jpg");
  expect(campusScene("Great Hall")).toBe("Wits university (1).jpg");
  expect(campusScene("History Museum")).toBe("Wits university (1).jpg");
  expect(campusScene("Heritage Site")).toBe("Wits university (1).jpg");
  expect(campusScene("Khambule Building")).toBe("TW Khambule building @Wits University.jpg");
  expect(campusScene("Science Faculty")).toBe("TW Khambule building @Wits University.jpg");
  expect(campusScene("Mathematics Dept")).toBe("TW Khambule building @Wits University.jpg");
  expect(campusScene("CLM Building")).toBe("Wits CLM building.jpg");
  expect(campusScene("Commerce Building")).toBe("Wits CLM building.jpg");
  expect(campusScene("Law School")).toBe("Wits CLM building.jpg");
  expect(campusScene("Management Studies")).toBe("Wits CLM building.jpg");
  expect(campusScene("Fountain Quad")).toBe("Wits university fountain.jpg");
  expect(campusScene("Water Feature")).toBe("Wits university fountain.jpg");
  expect(campusScene("Botanical Garden")).toBe("wits university.jpg");
  expect(campusScene("Tree Park")).toBe("wits university.jpg");
  expect(campusScene("Nature Ecology")).toBe("wits university.jpg");
  expect(campusScene("Bus Stop")).toBe("Wits.jpg");
  expect(campusScene("Transport Hub")).toBe("Wits.jpg");
});

test("campusScene falls back to hashed selection for unmatched titles", () => {
  const fallback = campusScene("Random Unmatched Location 123");
  const allowed = [
    "995436323902947317.jpg",
    "🤍.jpg",
    "wits university.jpg",
    "Wits university fountain.jpg",
  ];
  expect(allowed.includes(fallback)).toBe(true);
});

test("CampusArtwork renders span with background styles and hidden aria", () => {
  const { container } = render(<CampusArtwork title="Main Library" className="extra-class" />);
  const span = container.querySelector("span");

  expect(span).not.toBeNull();
  expect(span?.getAttribute("aria-hidden")).toBe("true");
  expect(span?.className).toContain("extra-class");
  expect(span?.style.backgroundPosition).toBe("center");
});

test("CampusArtwork applies special center 65% position for Great Hall photo", () => {
  const { container } = render(<CampusArtwork title="Great Hall" />);
  const span = container.querySelector("span");

  expect(span).not.toBeNull();
  expect(span?.style.backgroundPosition).toBe("center 65%");
});