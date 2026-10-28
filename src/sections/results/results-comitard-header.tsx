import { lazy, Suspense, useState } from "react";
import ProfileAvatar from "../../components/profile-avatar/profile-avatar";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import CardHeader from "@mui/material/CardHeader";
import type { ComitardWithMeta } from "../../types/results.types";
import { ComitardStatusChips } from "./results-comitard-status-ship";

const ComitardModal = lazy(() => import("../comitards/comitard-modal"));

type Props = { comitard: ComitardWithMeta };

export function ComitardHeader({ comitard }: Props) {
  const [open, setOpen] = useState(false);
  const timeLeft = Math.max(0, (comitard.enchereStop?.toMillis() ?? 0) - Date.now());

  // Results already use circle names for both the profile and bid senders.
  const cerclesData = open ? Object.fromEntries(
    [comitard.cercle, ...comitard.encheres.map((bid) => bid.sender)].map((name) => [name, { name }])
  ) : {};
  const renderStatus = (
    <Box sx={{ position: "absolute", top: 16, left: 16, right: 16, zIndex: 9 }}>
      <ComitardStatusChips comitard={comitard} isClosed={timeLeft === 0} />
    </Box>
  );

  return (
    <>
      <CardHeader
        title={`${comitard.firstname} "${comitard.nickname}" ${comitard.name}`}
        avatar={
          <ButtonBase
            onClick={() => setOpen(true)}
            aria-label={`Voir la fiche de ${comitard.firstname} ${comitard.name}`}
            sx={{ borderRadius: "50%" }}
            focusRipple
          >
            <ProfileAvatar
              alt={`${comitard.firstname} ${comitard.name}`}
              picture={comitard.picture}
              thumbnail={comitard.pictureThumbnail}
              sx={{ width: "4rem", height: "4rem" }}
            />
          </ButtonBase>
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
      {open && (
        <Suspense fallback={null}>
          <ComitardModal
            open={open}
            onClose={() => setOpen(false)}
            product={comitard}
            cercleId={comitard.cercle}
            cerclesData={cerclesData}
            timeLeft={timeLeft}
            renderStatus={renderStatus}
            renderPrice={null}
            renderWinner={renderStatus}
            displayVote={false}
            minEnchere={0}
            voteMax={0}
            isDisabled
            voteError=""
            voteErrorSeverity="error"
            loading={false}
            setVote={() => undefined}
            handleVote={() => undefined}
            won={timeLeft === 0 && comitard.encheres.length > 0}
          />
        </Suspense>
      )}
    </>
  );
}
