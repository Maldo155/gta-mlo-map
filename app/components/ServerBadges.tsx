"use client";

type Props = {
  ogServer?: boolean | null;
  verified?: boolean | null;
};

const pillBase = {
  display: "inline-flex" as const,
  alignItems: "center" as const,
  padding: "3px 10px",
  borderRadius: 999,
  fontSize: 10,
  fontWeight: 700,
  textTransform: "uppercase" as const,
  letterSpacing: 0.5,
  boxShadow: "0 0 12px currentColor",
};

export default function ServerBadges({ ogServer, verified }: Props) {
  if (!ogServer && !verified) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 10,
        right: 10,
        left: "auto",
        zIndex: 10,
        display: "flex",
        flexDirection: "row",
        gap: 8,
        flexWrap: "wrap",
        justifyContent: "flex-end",
      }}
    >
      {ogServer && (
        <span
          title="OG — One of the first 20 servers"
          style={{
            ...pillBase,
            background: "rgba(30, 10, 50, 0.85)",
            border: "1px solid rgba(168, 85, 247, 0.7)",
            color: "#c084fc",
            boxShadow: "0 0 12px rgba(168, 85, 247, 0.5)",
          }}
        >
          OG
        </span>
      )}
      {verified && (
        <span
          title="Verified"
          style={{
            ...pillBase,
            background: "rgba(15, 25, 50, 0.85)",
            border: "1px solid rgba(59, 130, 246, 0.7)",
            color: "#93c5fd",
            boxShadow: "0 0 12px rgba(59, 130, 246, 0.5)",
          }}
        >
          ✓ Verified
        </span>
      )}
    </div>
  );
}
