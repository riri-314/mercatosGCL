import { useState } from "react";
import Avatar, { type AvatarProps } from "@mui/material/Avatar";

type Props = Omit<AvatarProps, "src" | "srcSet"> & { picture?: string; thumbnail?: string };

export default function ProfileAvatar({ picture, thumbnail, alt = "", ...props }: Props) {
  const [failed, setFailed] = useState<{ thumbnail?: string; picture?: string }>({});
  const source = thumbnail && thumbnail !== failed.thumbnail ? thumbnail
    : picture && picture !== failed.picture ? picture : undefined;
  // Passing src to MUI Avatar would preload it with new Image(), bypassing native lazy loading.
  return <Avatar {...props}>
    {source && <img src={source} alt={alt} loading="lazy" decoding="async"
      onError={() => setFailed(previous => ({ ...previous, [source === thumbnail ? "thumbnail" : "picture"]: source }))}
      style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
  </Avatar>;
}
