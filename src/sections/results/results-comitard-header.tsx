import Avatar from "@mui/material/Avatar";
import CardHeader from "@mui/material/CardHeader";
import type { ComitardWithMeta } from "../../types/results.types";

type Props = { comitard: ComitardWithMeta };

export function ComitardHeader({ comitard }: Props) {
  return (
    <CardHeader
      title={`${comitard.firstname} "${comitard.nickname}" ${comitard.name}`}
      avatar={
        <Avatar
          alt={`${comitard.firstname} ${comitard.name}`}
          src={comitard.picture}
          sx={{ width: "4rem", height: "4rem" }}
        />
      }
      subheader={comitard.cercle}
      titleTypographyProps={{
        sx: {
          display: "-webkit-box",
          overflow: "hidden",
          textOverflow: "ellipsis",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          lineHeight: "1.2",
        },
      }}
    />
  );
}