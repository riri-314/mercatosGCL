import { useId } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";

interface WarningModalProps {
  title: string;
  message: string;
  open: boolean;
  loading: boolean;
  error: null | string;
  done: boolean;
  close: () => void;
  onProceed: () => void;
}

export default function WarningModal({
  title,
  message,
  open,
  loading,
  error,
  done,
  close,
  onProceed,
}: WarningModalProps) {
  const id = useId();
  return (
    <Dialog
      open={open}
      onClose={close}
      maxWidth="sm"
      fullWidth
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-message`}
      PaperProps={{
        sx: {
          m: 2,
          width: "calc(100% - 32px)",
          maxHeight: "calc(100dvh - 32px)",
        },
      }}
    >
      <DialogTitle id={`${id}-title`}>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText
          id={`${id}-message`}
          sx={{ overflowWrap: "anywhere" }}
        >
          {error || (done ? "Changement effectué." : message)}
        </DialogContentText>
      </DialogContent>
      <DialogActions
        sx={{
          p: 2,
          gap: 1,
          "& .MuiButton-root": { minHeight: 48, flex: 1, ml: "0 !important" },
        }}
      >
        {error || done ? (
          <Button onClick={close} variant="contained">
            Fermer
          </Button>
        ) : (
          <>
            <Button onClick={close} variant="outlined">
              Annuler
            </Button>
            <LoadingButton
              onClick={onProceed}
              loading={loading}
              variant="contained"
            >
              Procéder
            </LoadingButton>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
