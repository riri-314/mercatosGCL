import {
  Alert,
  AlertColor,
  Box,
  CardContent,
  FormHelperText,
  Grid,
  TextField,
} from "@mui/material";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { LoadingButton } from "@mui/lab";
import { db } from "../../firebase_config";
import QuantityInput from "../../components/inputs/numberInput.tsx";
import { doc, updateDoc } from "@firebase/firestore";

/**
 * Props for the NewCerle component.
 */
interface NewCerleProps {
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

export default function EditCerle({
  data,
  editionId,
  close,
  refetchData,
}: NewCerleProps) {
  console.log("data:", data);
  const [loading, setLoading] = useState<boolean>(false);
  const [cercleDescription, setCercleDescription] = useState<string>(
    data.description
  );
  const [cercleDescriptionError, setCercleDescriptionError] =
    useState<boolean>(false);
  const [cercleName, setCercleName] = useState<string>(data.name);
  const [cercleNameError, setCercleNameError] = useState<boolean>(false);

  const [cercleEmail, setCercleEmail] = useState<string>("");

  const [nbFut, setNbFut] = useState<number>(data.nbFut);
  const [nbFutError, setNbFutError] = useState<boolean>(false);

  const [cercleError, setCercleError] = useState<string>("");
  const [cercleErrorSeverity, setCercleErrorSeverity] = useState<
    AlertColor | undefined
  >("error");
  const textLenght = 150;

  async function handleNewCercle() {
    setLoading(true);
    setCercleError("");
    setCercleErrorSeverity("error");
    let error = false;
    if (cercleName == "") {
      setCercleNameError(true);
      error = true;
    }
    if (nbFut < 0) {
      setNbFutError(true);
      error = true;
    }

    if (cercleDescription.length > textLenght || cercleDescription == "") {
      setCercleDescriptionError(true);
      error = true;
    }
    if (error) {
      setCercleError("Veuillez remplir les champs");
      setLoading(false);
    } else {
      try {
        const docRef = doc(db, "editions", editionId);
        await updateDoc(docRef, {
          [`cercles.${data.id}`]: {
            name: cercleName,
            description: cercleDescription,
            nbFut: nbFut,
          },
        });
        refetchData();
        setCercleErrorSeverity("success");
        setCercleError("Cercle mis à jour avec succès");
        setLoading(false);
      } catch (error) {
        setCercleError("Erreur veuillez contacter un geek");
        console.log(error);
        setLoading(false);
      }
    }
  }

  return (
    <>
      <Card sx={{ width: "100%", mb: 4 }}>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 1 }}>
            Créer nouveau cercle
          </Typography>
          <Box component="form" noValidate autoComplete="off">
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <QuantityInput
                  defaultValue={data.nbFut}
                  title="Nombre de futs"
                  min={1}
                  error={nbFutError}
                  helpText={`Nombre de futs restants`}
                  change={(
                    _event:
                      | React.FocusEvent<HTMLInputElement>
                      | React.PointerEvent
                      | React.KeyboardEvent,
                    val: number | undefined
                  ) => {
                    if (typeof val !== "undefined") {
                      setNbFut(val);
                      setNbFutError(false);
                    } else {
                      setNbFutError(true);
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  defaultValue={data.name}
                  label="Nom du cercle"
                  fullWidth
                  error={cercleNameError}
                  onChange={(e) => {
                    setCercleName(e.target.value);
                    if (e.target.value === "") {
                      setCercleNameError(true);
                    } else {
                      setCercleNameError(false);
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  defaultValue={data.description}
                  label="Description"
                  multiline
                  maxRows={4}
                  error={cercleDescriptionError}
                  fullWidth
                  onChange={(e) => {
                    if (e.target.value.length < textLenght) {
                      setCercleDescription(e.target.value);
                    }
                    if (e.target.value === "") {
                      setCercleDescriptionError(true);
                    } else {
                      setCercleDescriptionError(false);
                    }
                  }}
                />
                <FormHelperText>
                  Courte description du cercle. Max {textLenght}.{" "}
                  {cercleDescription.length}/{textLenght}
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
                  onClick={() => handleNewCercle()}
                  loading={loading}
                >
                  Mettre à jour cercle
                </LoadingButton>
              </Grid>
            </Grid>
            {cercleError && (
              <Alert sx={{ mt: 3 }} severity={cercleErrorSeverity}>
                {cercleError}
              </Alert>
            )}
          </Box>
        </CardContent>
      </Card>
    </>
  );
}
