import ProfileAvatar from "../../components/profile-avatar/profile-avatar";
import CardHeader from "@mui/material/CardHeader";
import type { ComitardWithMeta } from "../../types/results.types";

type Props = { comitard: ComitardWithMeta };

export function ComitardHeader({ comitard }: Props) {
  return (
    <CardHeader
      title={`${comitard.firstname} "${comitard.nickname}" ${comitard.name}`}
      avatar={
        <ProfileAvatar
          alt={`${comitard.firstname} ${comitard.name}`}
          picture={comitard.picture}
          thumbnail={comitard.pictureThumbnail}
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