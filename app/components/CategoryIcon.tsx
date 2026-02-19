"use client";

type Category = {
  key: string;
  icon: string;
  iconImage?: string;
};

export default function CategoryIcon({
  cat,
  size = 16,
  style,
}: {
  cat: Category;
  size?: number;
  style?: React.CSSProperties;
}) {
  if ((cat as { iconImage?: string }).iconImage) {
    return (
      <img
        src={(cat as { iconImage: string }).iconImage}
        alt=""
        style={{
          width: size,
          height: size,
          objectFit: "contain",
          display: "inline-block",
          verticalAlign: "middle",
          ...style,
        }}
      />
    );
  }
  return <span style={{ ...style }}>{(cat as { icon: string }).icon}</span>;
}
