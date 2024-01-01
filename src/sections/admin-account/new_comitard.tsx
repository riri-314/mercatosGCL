import LoadingButton from "@mui/lab/LoadingButton";
import {
  Alert,
  AlertColor,
  CardContent,
  FormHelperText,
  Grid,
  TextField,
} from "@mui/material";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import UnstyledSelectIntroduction from "../../components/inputs/select";
import QuantityInput from "../../components/inputs/numberInput";
import { useState } from "react";

export default function NewComitard() {
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState(false);
  const [firstname, setFirstname] = useState("");
  const [firstnameError, setFirstnameError] = useState(false);
  const [nickname, setNickname] = useState("");
  const [nicknameError, setNicknameError] = useState(false);
  const [post, setPost] = useState("");
  const [postError, setPostError] = useState(false);
  const [cercle, setCercle] = useState(null);
  const [cercleError, setCercleError] = useState(false);
  const [teneurTaule, setTeneurTaule] = useState(null);
  const [teneurTauleError, setTeneurTauleError] = useState(false);
  const [etatCivil, setEtatCivil] = useState("");
  const [etatCivilError, setEtatCivilError] = useState(false);
  const [age, setAge] = useState(null);
  const [ageError, setAgeError] = useState(false);
  const [nbEtoiles, setNbEtoiles] = useState(null);
  const [nbEtoilesError, setNbEtoilesError] = useState(false);
  const [pointFort, setPointFort] = useState("");
  const [pointFortError, setPointFortError] = useState(false);
  const [pointFaible, setPointFaible] = useState("");
  const [pointFaibleError, setPointFaibleError] = useState(false);
  const [estLeSeul, setEstLeSeul] = useState("");
  const [estLeSeulError, setEstLeSeulError] = useState(false);

  const [error, setError] = useState("");
  const [errorSeverity, setErrorSeverity] = useState<AlertColor | undefined>("error");

  const txtlenght1 = 30;
  const txtlenght2 = 150;

  async function handleNewComitard() {
    let error = false;
    if (name.length === 0 || name.length > txtlenght1) {
      setNameError(true);
      error = true;
    } else {
      setNameError(false);
    }
    if (firstname.length === 0 || firstname.length > txtlenght1) {
      error = true;
      setFirstnameError(true);
    } else {
      setFirstnameError(false);
    }
    if (nickname.length === 0 || nickname.length > txtlenght1) {
      error = true;
      setNicknameError(true);
    } else {
      setNicknameError(false);
    }
    if (post.length === 0 || post.length > txtlenght1) {
      error = true;
      setPostError(true);
    } else {
      setPostError(false);
    }
    if (!cercle) {
      error = true;
      setCercleError(true);
    } else {
      setCercleError(false);
    }
    if (!teneurTaule) {
      error = true;
      setTeneurTauleError(true);
    } else {
      setTeneurTauleError(false);
    }
    if (etatCivil.length === 0 || etatCivil.length > txtlenght2) {
      error = true;
      setEtatCivilError(true);
    } else {
      setEtatCivilError(false);
    }
    if (!age) {
      error = true;
      setAgeError(true);
    } else {
      setAgeError(false);
    }
    if (!nbEtoiles) {
      error = true;
      setNbEtoilesError(true);
    } else {
      setNbEtoilesError(false);
    }
    if (pointFort.length === 0 || pointFort.length > txtlenght2) {
      error = true;
      setPointFortError(true);
    } else {
      setPointFortError(false);
    }
    if (pointFaible.length === 0 || pointFaible.length > txtlenght2) {
      error = true;
      setPointFaibleError(true);
    } else {
      setPointFaibleError(false);
    }
    if (estLeSeul.length === 0 || estLeSeul.length > txtlenght2) {
      error = true;
      setEstLeSeulError(true);
    } else {
      setEstLeSeulError(false);
    }
    if (!error) {
      console.log("ok");
      // add comitard to db
      setErrorSeverity("success");
      setError("Comitard créé avec succès");
    } else {
      setErrorSeverity("error");
      setError("Certains champs sont incorrects");
    }
  }

  return (
    <>
      <Card sx={{ width: "100%", mb: 4 }}>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 1 }}>
            Créer nouveau comitard
          </Typography>
          {error && (
            <Alert sx={{ mb: 3 }} severity={errorSeverity}>
              {error}
            </Alert>
          )}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                error={nameError}
                label="Nom"
                value={name}
                fullWidth
                onChange={(e) => {
                  let value = e.target.value;
                  if (value.length <= txtlenght1) {
                    setName(value);
                  }
                  if (value.length == 0) {
                    setNameError(true);
                  } else {
                    setNameError(false);
                  }
                }}
              />
              <FormHelperText>
                Nom civil du comitard. Max {txtlenght1} caractères.{" "}
                {name.length}/{txtlenght1}
              </FormHelperText>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Prénom"
                error={firstnameError}
                fullWidth
                value={firstname}
                onChange={(e) => {
                  let value = e.target.value;
                  if (value.length <= txtlenght1) {
                    setFirstname(value);
                  }
                  if (value.length == 0) {
                    setFirstnameError(true);
                  } else {
                    setFirstnameError(false);
                  }
                }}
              />
              <FormHelperText>
                Prénom civil du comitard. Max {txtlenght1} caractères.{" "}
                {firstname.length}/{txtlenght1}
              </FormHelperText>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Surnom"
                error={nicknameError}
                fullWidth
                value={nickname}
                onChange={(e) => {
                  let value = e.target.value;
                  if (value.length <= txtlenght1) {
                    setNickname(value);
                  }
                  if (value.length == 0) {
                    setNicknameError(true);
                  } else {
                    setNicknameError(false);
                  }
                }}
              />
              <FormHelperText>
                Surnom du comitard. Max {txtlenght1} caractères.{" "}
                {nickname.length}/{txtlenght1}
              </FormHelperText>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Post"
                error={postError}
                fullWidth
                value={post}
                onChange={(e) => {
                  let value = e.target.value;
                  if (value.length <= txtlenght1) {
                    setPost(value);
                  }
                  if (value.length == 0) {
                    setPostError(true);
                  } else {
                    setPostError(false);
                  }
                }}
              />
              <FormHelperText>
                Post du comitard. Max {txtlenght1} caractères. {post.length}/
                {txtlenght1}
              </FormHelperText>
            </Grid>
            <Grid item xs={12} sm={6}>
              <UnstyledSelectIntroduction
                isError={cercleError}
                option={{
                  MDS: 1,
                  CESEC: 2,
                  CI: 3,
                  AGRO: 4,
                  CEP: 5,
                }}
                helpText={"Cercle du comitard"}
                change={(_event: any, val: any) => {
                  setCercle(val);
                  setCercleError(false);
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <QuantityInput
                title="Teneur en taule du comitard"
                min={0}
                max={10}
                error={teneurTauleError}
                helpText={`Teneur en taule du comitard de 0 à 10`}
                change={(_event: any, val: any) => {
                  setTeneurTaule(val);
                  if (!val) {
                    setTeneurTauleError(true);
                  } else {
                    setTeneurTauleError(false);
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="État civil"
                fullWidth
                value={etatCivil}
                error={etatCivilError}
                onChange={(e) => {
                  let value = e.target.value;
                  if (value.length <= txtlenght2) {
                    setEtatCivil(value);
                  }
                  if (value.length == 0) {
                    setEtatCivilError(true);
                  } else {
                    setEtatCivilError(false);
                  }
                }}
              />
              <FormHelperText>
                État civil du comitard. Max {txtlenght2} caractères.{" "}
                {etatCivil.length}/{txtlenght2}
              </FormHelperText>
            </Grid>
            <Grid item xs={12} sm={6}>
              <QuantityInput
                title="Age du comitard"
                min={0}
                max={99}
                error={ageError}
                helpText={`Age du comitard de 0 à 99`}
                change={(_event: any, val: any) => {
                  setAge(val);
                  if (!val) {
                    setAgeError(true);
                  } else {
                    setAgeError(false);
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <QuantityInput
                title="Nombre d'étoiles du comitard"
                min={0}
                max={10}
                error={nbEtoilesError}
                helpText={`Nombre d'étoiles du comitard de 0 à 10 (plus que 10 étoiles faut décrocher)`}
                change={(_event: any, val: any) => {
                  setNbEtoiles(val);
                  if (!val) {
                    setNbEtoilesError(true);
                  } else {
                    setNbEtoilesError(false);
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Point fort"
                fullWidth
                multiline
                maxRows={4}
                error={pointFortError}
                value={pointFort}
                onChange={(e) => {
                  let value = e.target.value;
                  if (value.length <= txtlenght2) {
                    setPointFort(value);
                  }
                  if (value.length == 0) {
                    setPointFortError(true);
                  } else {
                    setPointFortError(false);
                  }
                }}
              />
              <FormHelperText>
                Point fort du comitard. Max {txtlenght2} caractères.{" "}
                {pointFort.length}/{txtlenght2}
              </FormHelperText>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Point faible"
                fullWidth
                multiline
                maxRows={4}
                error={pointFaibleError}
                value={pointFaible}
                onChange={(e) => {
                  let value = e.target.value;
                  if (value.length <= txtlenght2) {
                    setPointFaible(value);
                  }
                  if (value.length == 0) {
                    setPointFaibleError(true);
                  } else {
                    setPointFaibleError(false);
                  }
                }}
              />
              <FormHelperText>
                Point faible du comitard. Max {txtlenght2} caractères.{" "}
                {pointFaible.length}/{txtlenght2}
              </FormHelperText>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Est le seul"
                fullWidth
                multiline
                maxRows={4}
                error={estLeSeulError}
                value={estLeSeul}
                onChange={(e) => {
                  let value = e.target.value;
                  if (value.length <= txtlenght2) {
                    setEstLeSeul(value);
                  }
                  if (value.length == 0) {
                    setEstLeSeulError(true);
                  } else {
                    setEstLeSeulError(false);
                  }
                }}
              />
              <FormHelperText>
                Est le seul... Max {txtlenght2} caractères. {estLeSeul.length}/
                {txtlenght2}
              </FormHelperText>
            </Grid>
            <Grid item xs={12} sm={6}>
              <LoadingButton size="large" variant="contained" fullWidth onClick={handleNewComitard}>
                Créer comitard
              </LoadingButton>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </>
  );
}
