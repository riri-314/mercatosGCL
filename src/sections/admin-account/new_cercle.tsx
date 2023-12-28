import {
  Alert,
  AlertColor,
  Box,
  CardContent,
  Grid,
  TextField,
} from "@mui/material";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { LoadingButton } from "@mui/lab";
import { addCercle } from "../../utils/admin-tools";
import { DocumentData } from "@firebase/firestore";

interface NewCercleProps {
    data: DocumentData;
    id: string;
  }

export default function NewCerle({data, id}: NewCercleProps) {
  const [cercleDescription, setCercleDescription] = useState<string>("");
  const [cercleName, setCercleName] = useState<string>("");
  const [cercleEmail, setCercleEmail] = useState<string>("");
  const [cercleError, setCercleError] = useState<string>("");
  const [cercleErrorSeverity, setCercleErrorSeverity] = useState<
    AlertColor | undefined
  >("error");

  function handleNewCercle() {
    setCercleError("");
    setCercleErrorSeverity("error");
    console.log(cercleDescription);
    console.log(cercleName);
    if (cercleName === "" || cercleEmail === "") {
      setCercleError("Le nom et email du cercle et ne peuvent pas être vide");
      return;
    } else {
      //create cercle
      try {
        addCercle(
          id,
          cercleEmail,
          data.votes,
          cercleDescription
        );
        setCercleError("Succes !");
        setCercleErrorSeverity("success");
      } catch {
        setCercleError("Erreur inconnue. Contacte l'administrateur");
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
                <TextField
                  label="Adress email"
                  fullWidth
                  onChange={(e) => setCercleEmail(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Nom du cercle"
                  fullWidth
                  onChange={(e) => setCercleName(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Description"
                  multiline
                  maxRows={4}
                  fullWidth
                  onChange={(e) => {
                    setCercleDescription(e.target.value);
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <LoadingButton
                  size="large"
                  variant="contained"
                  fullWidth
                  onClick={() => handleNewCercle()}
                >
                  Créer cercle
                </LoadingButton>
              </Grid>
            </Grid>
          </Box>
          {cercleError && (
            <Alert sx={{ mt: 3 }} severity={cercleErrorSeverity}>
              {cercleError}
            </Alert>
          )}
        </CardContent>
      </Card>
    </>
  );
}
