import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = (file: string) => readFileSync(resolve(process.cwd(), "client/src/pages", file), "utf8");

describe("public content-cover rendering", () => {
  it("renders configured event, sermon, news, and ministry visuals on public cards and detail journeys", () => {
    expect(source("Events.tsx")).toContain("event.coverImageUrl && <img");
    expect(source("EventDetail.tsx")).toContain("event.coverImageUrl && <img");
    expect(source("Sermons.tsx")).toContain("sermon.coverImageUrl && <img");
    expect(source("SermonDetail.tsx")).toContain("sermon.coverImageUrl && <img");
    expect(source("News.tsx")).toContain("post.coverImageUrl && <img");
    expect(source("PostDetail.tsx")).toContain("post.coverImageUrl && <img");
    expect(source("Ministries.tsx")).toContain("ministry.managed?.heroImageUrl && <img");
    expect(source("MinistryDetail.tsx")).toContain("managed?.heroImageUrl && <img");
  });
});
