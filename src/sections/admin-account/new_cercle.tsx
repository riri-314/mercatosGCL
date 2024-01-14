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
import { httpsCallable } from "@firebase/functions";
import { functions } from "../../firebase_config";

interface NewCerleProps {
  refetchData: () => void;
}

export default function NewCerle({ refetchData }: NewCerleProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [cercleDescription, setCercleDescription] = useState<string>("");
  const [cercleDescriptionError, setCercleDescriptionError] =
    useState<boolean>(false);
  const [cercleName, setCercleName] = useState<string>("");
  const [cercleNameError, setCercleNameError] = useState<boolean>(false);
  const [cercleEmail, setCercleEmail] = useState<string>("");
  const [cercleEmailError, setCercleEmailError] = useState<boolean>(false);
  const [cercleError, setCercleError] = useState<string>("");
  const [cercleErrorSeverity, setCercleErrorSeverity] = useState<
    AlertColor | undefined
  >("error");
  const textLenght = 150;

  function handleNewCercle() {
    setLoading(true);
    setCercleError("");
    setCercleErrorSeverity("error");
    let error = false;
    if (cercleName == "") {
      setCercleNameError(true);
      error = true;
    }
    if (cercleEmail == "") {
      setCercleEmailError(true);
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
      const addMessage = httpsCallable(functions, "signUpUser");
      addMessage({
        email: cercleEmail,
        displayName: cercleName,
        description: cercleDescription,
      })
        .then((result) => {
          const data: any = result.data;
          //const sanitizedMessage = data.text;
          refetchData();
          setCercleErrorSeverity("success");
          setCercleError("Cercle créé avec succès");
          console.log("data:", data);
          setLoading(false);
        })
        .catch((error) => {
          setCercleError("Erreur veuillez contacter un geek");
          console.log(error);
          setLoading(false);
        });
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
                <TextField
                  label="Adress email"
                  fullWidth
                  error={cercleEmailError}
                  onChange={(e) => {
                    setCercleEmail(e.target.value);
                    if (e.target.value === "") {
                      setCercleEmailError(true);
                    } else {
                      setCercleEmailError(false);
                    }
                  }}
                />
                <FormHelperText>
                  Adress mail que le cercle va utiliser pour se connecter.
                  Attention: elle doit etre valide.
                </FormHelperText>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
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

              <Grid item xs={12} sm={6}>
                <LoadingButton
                  size="large"
                  variant="contained"
                  fullWidth
                  onClick={() => handleNewCercle()}
                  loading={loading}
                >
                  Créer cercle
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
