/**
 * Site config – flip flags to switch features without deleting code.
 */
export const siteConfig = {
  /** Nav style: "actionWheel" = GTA-style radial menu, "expandable" = horizontal spread on hover, "mega" = dropdown, "classic" = always-visible links */
  navStyle: "actionWheel" as "actionWheel" | "expandable" | "mega" | "classic",
} as const;
