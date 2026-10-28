import { Suspense, useId, type ReactNode } from "react";
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import ClubIcon from "../club-icon/club-icon";

export default function FormDialog({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const id = useId();
  const fullScreen = useMediaQuery(useTheme().breakpoints.down("sm"));
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      fullWidth
      maxWidth="md"
      scroll="paper"
      aria-labelledby={id}
      PaperProps={{
        sx: { ...(fullScreen && {
          height: "calc(100dvh - var(--cercle-session-banner-height, 0px))",
          maxHeight: "calc(100dvh - var(--cercle-session-banner-height, 0px))",
        }) },
      }}
    >
      <DialogTitle
        id={`${id}-header`}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          py: 1,
          pl: { xs: 2, sm: 3 },
          pr: 1,
          flexShrink: 0,
        }}
      >
        <Typography
          id={id}
          component="span"
          sx={{ fontSize: 17, fontWeight: 700 }}
        >
          {title}
        </Typography>
        <IconButton
          onClick={onClose}
          aria-label="Fermer le formulaire"
          sx={{ width: 44, height: 44, flexShrink: 0 }}
        >
          <ClubIcon name="close" />
        </IconButton>
      </DialogTitle>
      <DialogContent
        dividers
        className="account-form"
        sx={{
          p: { xs: 2, sm: 3 },
          pb: "max(24px, env(safe-area-inset-bottom))",
          "& > .MuiCard-root": {
            border: 0,
            boxShadow: "none",
            mb: 0,
            overflow: "visible",
          },
          "& > .MuiCard-root > .MuiCardContent-root": { p: 0 },
          "& > .MuiCard-root > .MuiCardContent-root > .MuiTypography-h5:first-of-type":
            { display: "none" },
        }}
      >
        <Suspense
          fallback={
            <Box role="status" sx={{ py: 3 }}>
              Chargement…
            </Box>
          }
        >
          {open && children}
        </Suspense>
      </DialogContent>
    </Dialog>
  );
}
