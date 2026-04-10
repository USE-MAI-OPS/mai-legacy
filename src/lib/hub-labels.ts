import type { HubType } from "@/types/database";

export function getHubLabel(type: HubType): string {
  return type === "family" ? "Family" : "Circle";
}

export function getHubIcon(type: HubType): string {
  return type === "family" ? "Users" : "CircleDot";
}

export function getHubPageTitle(name: string, type: HubType): string {
  return `${name} ${getHubLabel(type)} Hub`;
}
