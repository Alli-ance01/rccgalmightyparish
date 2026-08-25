export const ministryOptions = [
  { value: "almighty-elders", label: "Almighty Elders" },
  { value: "almighty-excellent-men", label: "Almighty Excellent Men" },
  { value: "almighty-good-women", label: "Almighty Good Women" },
  { value: "almighty-yaya", label: "Almighty YAYA" },
  { value: "junior-church-family", label: "Junior Church family" },
] as const;
export type MinistryOptionValue = (typeof ministryOptions)[number]["value"];

export const juniorCategoryOptions = [
  { value: "super-teens", label: "Super Teens" },
  { value: "junior-teens", label: "Junior Teens" },
  { value: "preteens-9-12", label: "Preteens / 9–12" },
  { value: "ages-6-8", label: "6–8" },
  { value: "ages-0-5", label: "0–5" },
] as const;
export type JuniorCategoryOptionValue = (typeof juniorCategoryOptions)[number]["value"];

export const availabilityOptions = [
  { value: "sunday", label: "Mostly Sundays" },
  { value: "weekday", label: "Mostly weekdays" },
  { value: "flexible", label: "Flexible" },
] as const;
export type AvailabilityOptionValue = (typeof availabilityOptions)[number]["value"];
