import { describe, expect, it } from "vitest";
import { filterArchiveItems } from "./archiveSearch";

describe("filterArchiveItems", () => {
  const items = [
    { title: "Sunday worship", body: "A family gathering", mediaType: "image" },
    { title: "Youth prayer update", altText: "Young adults in prayer", mediaType: "video" },
  ];

  it("matches title, body, alt text, and media type without case sensitivity", () => {
    expect(filterArchiveItems(items, "family")).toEqual([items[0]]);
    expect(filterArchiveItems(items, "YOUNG ADULTS")).toEqual([items[1]]);
    expect(filterArchiveItems(items, "video")).toEqual([items[1]]);
  });

  it("returns the source items when the search is blank", () => {
    expect(filterArchiveItems(items, "  ")).toEqual(items);
  });
});
