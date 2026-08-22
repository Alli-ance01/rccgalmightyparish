import { describe, expect, it } from "vitest";
import { giving, juniorGroups, mainMinistries, serviceSchedule, site } from "./site";

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

  it("publishes the confirmed TAP contact, OPay, and Sunday information", () => {
    expect(site).toMatchObject({
      email: "ogundereoluwatimileyin@gmail.com",
      phone: "07046611108",
    });
    expect(site.address).toContain("Beside NNPC Filling Station");
    expect(giving).toMatchObject({
      provider: "OPay",
      accountName: "Oluwatimileyin Emmanuel Ogundere",
      accountNumber: "7046611108",
    });
    expect(serviceSchedule.find(service => service.name === "Sunday Service")?.time).toContain("8:00 AM");
    expect(serviceSchedule.find(service => service.name === "Sunday Service")?.time).toContain("9:30 AM");
  });
});
