import { describe, expect, it } from "vitest";
import { juniorGroups, mainMinistries, serviceSchedule } from "./site";

describe("TAP public information", () => {
  it("keeps the required ministry names intact", () => {
    expect(mainMinistries.map(ministry => ministry.name)).toEqual([
      "Almighty Elders",
      "Almighty Excellent Men",
      "Almighty Good Women",
      "Almighty YAYA (Youth & Young Adults)",
    ]);
    expect(juniorGroups.map(group => group.name)).toEqual([
      "Super Teens",
      "Lower Teens",
      "Preteens/9–12",
      "6–6",
      "3–5",
    ]);
  });

  it("keeps the required service schedule entries intact", () => {
    expect(serviceSchedule.map(service => service.name)).toEqual([
      "Sunday Service",
      "House Fellowship",
      "Digging Deep",
      "Youth Prayer Meeting",
      "Faith Clinic",
      "Holy Ghost Service Vigil",
    ]);
  });
});
