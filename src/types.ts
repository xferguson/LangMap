export type Level = "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | "Native";

export type RegionRef = string;

export interface Language {
  id: string;
  name: string;
  endonym?: string;
  speakers: { l1: number; l2: number };
  regions: RegionRef[];
}

export interface UserLanguage {
  id: string;
  level: Level;
}

export interface AppState {
  languages: UserLanguage[];
  filter: { min: Level; max: Level };
}
