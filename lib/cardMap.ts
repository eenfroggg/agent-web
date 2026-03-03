export const cardMap: Record<string, string[]> = {
  victor: ["V-01", "V-02", "V-03", "V-04", "V-05"],
  sophia: ["S-01", "S-02", "S-03", "S-04", "S-05"],
  kai: ["K-01", "K-02", "K-03", "K-04", "K-05"],
  leonard: ["L-01", "L-02", "L-03", "L-04", "L-05"],
};

export const suspects = ["victor", "sophia", "kai", "leonard"] as const;

export const suspectLabel: Record<(typeof suspects)[number], string> = {
  victor: "빅터",
  sophia: "소피아",
  kai: "카이",
  leonard: "레오나드",
};
