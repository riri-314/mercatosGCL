import {
  Alert,
  AlertColor,
  Box,
  FormHelperText,
  Grid,
  TextField,
} from "@mui/material";
import { useState } from "react";
import { LoadingButton } from "@mui/lab";
import { updateMDP } from "../../utils/admin-tools";

/**
 * Props for the NewMDP component.
 */
interface ChangeMDPProps {
  /**
   * Data of the table.
   */
  data: Record<string, any>;

  editionId: string;

  close: () => void;

  /**
   * Function to refetch the data.
   */
  refetchData: () => void;
}

export default function EditMDP({
  data,
  editionId,
  close,
  refetchData,
}: ChangeMDPProps) {
  console.log("data:", data);
  const [loading, setLoading] = useState<boolean>(false);

  const [newMDP, setNewMDP] = useState<string>(data.description);
  const [newMDPError, setNewMDPError] = useState<boolean>(false);

  const [mdpError, setCercleError] = useState<string>("");
  const [MDPErrorSeverity, setCercleErrorSeverity] = useState<
    AlertColor | undefined
  >("error");

  const textLenght = 32;

  async function handleNewMDP() {
    setCercleError("");
    setLoading(true);
    console.log("handleNewMDP called with newMDP:", newMDP, editionId, data.id);
    // check if mdp is valid
    const mdpRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!mdpRegex.test(newMDP)) {
      setCercleError(
        "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.",
      );
      setCercleErrorSeverity("error");
      setLoading(false);
      return;
    }
    if (newMDP.length > textLenght) {
      setCercleError("Le mot de passe doit contenir au maximum 32 caractères.");
      setCercleErrorSeverity("error");
      setLoading(false);
      return;
    }

    // call cloud function to update mdp

    const result = await updateMDP(data.id, newMDP);
    if (result === 1) {
      setCercleError("Mot de passe mis à jour avec succès !");
      setCercleErrorSeverity("success");
      refetchData();
    } else {
      setCercleError("Une erreur est survenue lors de la mise à jour du mot de passe.");
      setCercleErrorSeverity("error");
    }
    setLoading(false);
  }

  return (
    <>
      <Box component="form" noValidate autoComplete="off">
        Changer le mot de passe du cercle <strong>{data.name}</strong> avec id{" "}
        {data.id} et description "{data.description}"
        <br />
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={12}>
            <TextField
              label="Nouveau mot de passe"
              multiline
              maxRows={4}
              error={newMDPError}
              fullWidth
              onChange={(e) => {
                if (e.target.value.length < textLenght) {
                  setNewMDP(e.target.value);
                }
                if (e.target.value === "") {
                  setNewMDPError(true);
                } else {
                  setNewMDPError(false);
                }
              }}
            />
            <FormHelperText>
              Minimum 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre et 1
              caractère spécial. Max 32 caractères.
            </FormHelperText>
          </Grid>

          <Grid item xs={12} sm={12}>
            <LoadingButton
              color="error"
              size="large"
              variant="contained"
              fullWidth
              onClick={close}
            >
              Annuler
            </LoadingButton>
          </Grid>

          <Grid item xs={12} sm={12}>
            <LoadingButton
              size="large"
              variant="contained"
              fullWidth
              onClick={() => handleNewMDP()}
              loading={loading}
            >
              Mettre à jour mot de passe
            </LoadingButton>
          </Grid>
        </Grid>
        {mdpError && (
          <Alert sx={{ mt: 3 }} severity={MDPErrorSeverity}>
            {mdpError}
          </Alert>
        )}
      </Box>
    </>
  );
}
