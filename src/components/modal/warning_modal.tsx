import { Button, Card, CardContent, Modal, Typography } from "@mui/material";
import { LoadingButton } from "@mui/lab";

interface WarningModalProps {
  title: string; //title of the modal eg. Warning your going to destroy the world and all it's glory
  message: string; //message to diplsay on the modal
  open: boolean; //let open the modal
  loading: boolean; //let the proceed button load
  error: null | string; //let some console log message
  done: boolean; //let know if the action is done
  close: () => void; //let close the modal
  onProceed: () => void; //let run a functionwhen user proceed
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
  return (
    <Modal
      open={open}
      onClose={close}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
      sx={{
        m: 3,
        overflow: "scroll",
        maxWidth: 800,
        ml: "auto",
        mr: "auto",
      }}
    >
      <Card sx={{ width: "100%", mb: 4 }}>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 1 }}>
            {title}
          </Typography>
          <Typography sx={{ mb: 1 }}>{error ? error : message}</Typography>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            {!error ? (
              !done ? (
                <>
                  <Button
                    onClick={close}
                    sx={{ width: "48%" }}
                    size="large"
                    variant="contained"
                    color="error"
                  >
                    Annuler
                  </Button>
                  <LoadingButton
                    onClick={onProceed}
                    sx={{ width: "48%" }}
                    loading={loading}
                    size="large"
                    variant="contained"
                  >
                    Procéder
                  </LoadingButton>
                </>
              ) : (
                <Button
                  onClick={close}
                  sx={{ width: "48%" }}
                  size="large"
                  variant="contained"
                  color="success"
                >
                  Changment effectué, fermer
                </Button>
              )
            ) : (
              <Button
                onClick={close}
                sx={{ width: "48%" }}
                size="large"
                variant="contained"
                color="error"
              >
                Error, fermer
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </Modal>
  );
}
