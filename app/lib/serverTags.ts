/** FiveM server tags for filters and display. Maps to what players look for. */

export const REGIONS = [
  { key: "NA", label: "North America" },
  { key: "EU", label: "Europe" },
  { key: "SA", label: "South America" },
  { key: "OC", label: "Oceania" },
  { key: "ASIA", label: "Asia" },
  { key: "OTHER", label: "Other" },
] as const;

export const ECONOMY_TYPES = [
  { key: "realistic", label: "Realistic" },
  { key: "boosted", label: "Boosted" },
  { key: "hardcore", label: "Hardcore" },
  { key: "vmenu", label: "vMenu" },
  { key: "custom", label: "Custom" },
] as const;

export const RP_TYPES = [
  { key: "serious", label: "Serious RP" },
  { key: "semi", label: "Semi-Serious" },
  { key: "casual", label: "Casual" },
] as const;

export const CRIMINAL_DEPTH = [
  {
    key: "heists",
    label: "Heists & robberies",
    description: "Banks, armored trucks, store robberies",
  },
  {
    key: "gangs",
    label: "Gang & turf",
    description: "Street factions, turf wars, crew RP",
  },
  {
    key: "drugs",
    label: "Drug trade",
    description: "Narcotics, distribution, trafficking",
  },
  {
    key: "vehicles",
    label: "Vehicle crime",
    description: "Theft, chop shops, grand theft auto",
  },
  {
    key: "organized",
    label: "Organized crime",
    description: "Mafia, cartels, syndicates",
  },
  {
    key: "mixed",
    label: "Mixed criminal",
    description: "Variety of criminal RP, no single focus",
  },
  {
    key: "minimal",
    label: "Minimal",
    description: "Light criminal activity, not a main focus",
  },
] as const;

export type RegionKey = (typeof REGIONS)[number]["key"];
export type EconomyTypeKey = (typeof ECONOMY_TYPES)[number]["key"];
export type RpTypeKey = (typeof RP_TYPES)[number]["key"];
export type CriminalDepthKey = (typeof CRIMINAL_DEPTH)[number]["key"];

export const LOOKING_FOR_POSITIONS = [
  { key: "leo", label: "LEO" },
  { key: "ems", label: "EMS" },
  { key: "gangs", label: "Gangs" },
  { key: "mc", label: "MC" },
  { key: "staff", label: "Staff" },
  { key: "fire", label: "Fire" },
  { key: "doj", label: "DOJ" },
  { key: "mechanic", label: "Mechanic" },
  { key: "realtor", label: "Realtor" },
  { key: "news", label: "News/Media" },
] as const;

export type LookingForKey = (typeof LOOKING_FOR_POSITIONS)[number]["key"];

export type Server = {
  id: string;
  user_id?: string | null;
  created_at?: string;
  updated_at?: string;
  server_name: string;
  claimable?: boolean | null;
  claimed_by_user_id?: string | null;
  authorized_editors?: string[] | null;
  grandfathered?: boolean | null;
  owner_name?: string | null;
  region?: RegionKey | null;
  language?: string | null;
  avg_player_count?: number | null;
  max_slots?: number | null;
  connect_url?: string | null;
  cfx_id?: string | null;
  discord_url?: string | null;
  website_url?: string | null;
  description?: string | null;
  economy_type?: EconomyTypeKey | null;
  rp_type?: RpTypeKey | null;
  whitelisted?: boolean | null;
  pd_active?: boolean | null;
  ems_active?: boolean | null;
  criminal_depth?: CriminalDepthKey | null; // deprecated, use criminal_types
  criminal_types?: CriminalDepthKey[] | null;
  criminal_other?: string | null;
  looking_for_types?: LookingForKey[] | null;
  looking_for_other?: string | null;
  civ_jobs_count?: number | null;
  custom_mlo_count?: number | null;
  custom_script_count?: number | null;
  no_pay_to_win?: boolean | null;
  controller_friendly?: boolean | null;
  new_player_friendly?: boolean | null;
  features_other?: string | null;
  mlo_ids?: string[] | null;
  creator_keys?: string[] | null;
  verified?: boolean | null;
  og_server?: boolean | null;
  featured?: boolean | null;
  featured_order?: number | null;
  banner_url?: string | null;
  thumbnail_url?: string | null;
  logo_url?: string | null;
  video_url?: string | null;
  gallery_images?: string[] | null;
  views?: number;
  like_count?: number;
};
