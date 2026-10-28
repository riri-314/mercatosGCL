import { uploadProfilePictures } from "../../utils/upload-profile-pictures";
import { getEditionData } from "../../data/edition-data";
import LoadingButton from "@mui/lab/LoadingButton";
import {
  Alert,
  AlertColor,
  FormHelperText,
  Grid,
  TextField,
} from "@mui/material";
import UnstyledSelectIntroduction from "../../components/inputs/select";
import QuantityInput from "../../components/inputs/numberInput";
import { useState } from "react";
import PictureInput from "../../components/inputs/pictureInput";
import { ImageListType } from "react-images-uploading";
import { functions } from "../../firebase_functions";
import { DocumentData } from "firebase/firestore";
import { useAuth } from "../../auth/AuthProvider";
import { httpsCallable } from "firebase/functions";
import { requireMutationSuccess } from "../../utils/callable-result";

interface NewComitardProps {
  data: DocumentData;
  admin: boolean;
  refetchData: () => void;
}

const changerCampus = {
  "Possible": 1,
  "Pas possible": 2,
  "Bouillant mort!": 3,
  "Pas du tout possible": 4,
};

export default function NewComitard({
  data,
  admin,
  refetchData,
}: NewComitardProps) {
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
  const [picture, setPicture] = useState<ImageListType>([]);
  const [pictureError, setPictureError] = useState(false);
  const [pictureUpload, setPictureUpload] = useState<number | undefined>(
    undefined
  );
  const [error, setError] = useState("");
  const [errorSeverity, setErrorSeverity] = useState<AlertColor | undefined>(
    "error"
  );
  const [loading, setLoading] = useState(false);
  const [formVersion, setFormVersion] = useState(0);
  const [campus, setCampus] = useState(null);
  const [campusError, setCampusError] = useState(false);

  const { user } = useAuth();

  const txtlenght1 = 30;
  const txtlenght2 = 150;

  function cerclesOption() {
    const out: { [key: string]: string } = {}; // Add type annotation to the 'out' object
    for (const [key, value] of Object.entries((getEditionData(data) ?? {}).cercles)) {
      if (typeof value === "object" && value !== null) {
        out[(value as { name: string }).name] = key; // Add type assertion to 'value'
      }
    }
    return out;
  }

  async function handleNewComitard() {
    setLoading(true);
    let error = false;
    setError("");
    if (name.trim().length === 0 || name.length > txtlenght1) {
      setNameError(true);
      error = true;
    } else {
      setNameError(false);
    }
    if (firstname.trim().length === 0 || firstname.length > txtlenght1) {
      error = true;
      setFirstnameError(true);
    } else {
      setFirstnameError(false);
    }
    if (nickname.trim().length === 0 || nickname.length > txtlenght1) {
      error = true;
      setNicknameError(true);
    } else {
      setNicknameError(false);
    }
    if (post.trim().length === 0 || post.length > txtlenght1) {
      error = true;
      setPostError(true);
    } else {
      setPostError(false);
    }
    if (admin) {
      if (!cercle) {
        error = true;
        setCercleError(true);
      } else {
        setCercleError(false);
      }
    }
    if (teneurTaule == undefined || teneurTaule < 0 || teneurTaule > 10) {
      error = true;
      setTeneurTauleError(true);
    } else {
      setTeneurTauleError(false);
    }
    if (etatCivil.trim().length === 0 || etatCivil.length > txtlenght2) {
      error = true;
      setEtatCivilError(true);
    } else {
      setEtatCivilError(false);
    }
    if (age == undefined || age < 0 || age > 99) {
      error = true;
      setAgeError(true);
    } else {
      setAgeError(false);
    }
    if (nbEtoiles == undefined || nbEtoiles < 0 || nbEtoiles > 10) {
      error = true;
      setNbEtoilesError(true);
    } else {
      setNbEtoilesError(false);
    }
    if (pointFort.trim().length === 0 || pointFort.length > txtlenght2) {
      error = true;
      setPointFortError(true);
    } else {
      setPointFortError(false);
    }
    if (pointFaible.trim().length === 0 || pointFaible.length > txtlenght2) {
      error = true;
      setPointFaibleError(true);
    } else {
      setPointFaibleError(false);
    }
    if (estLeSeul.trim().length === 0 || estLeSeul.length > txtlenght2) {
      error = true;
      setEstLeSeulError(true);
    } else {
      setEstLeSeulError(false);
    }
    if (picture[0] != null && picture[0].file !== undefined) {
      setPictureError(false);
    } else {
      error = true;
      setPictureError(true);
    }
    if (!campus) {
      error = true;
      setCampusError(true);
    } else {
      setCampusError(false);
    }

    if (!error) {
      try {
        const pictures = await uploadProfilePictures(picture[0], data.id, user!.uid, setPictureUpload);
        try {
          const result = await httpsCallable(functions, "addcomitard")({
            editionId: data.id, name, firstname, nickname, post, cercle: cercle || null,
            teneurTaule, etatCivil, age, campus, nbEtoiles, pointFort, pointFaible, estLeSeul,
            ...pictures,
          });
          requireMutationSuccess(result.data);
          refetchData();
          setErrorSeverity("success");
          setError("Comitard créé avec succès");
          setName(""); setFirstname(""); setNickname(""); setPost(""); setCercle(null);
          setTeneurTaule(null); setEtatCivil(""); setAge(null); setNbEtoiles(null);
          setPointFort(""); setPointFaible(""); setEstLeSeul(""); setPicture([]); setCampus(null);
          setFormVersion(version => version + 1);
        } catch (cause) {
          setErrorSeverity("error");
          setError("Une erreur est survenue lors de la création du comitard. " + String(cause));
        }
      } catch (cause) {
        setErrorSeverity("error");
        setError("Une erreur est survenue lors de l'upload de l'image. " + String(cause));
      } finally {
        setPictureUpload(undefined);
        setLoading(false);
      }
    } else {
      setLoading(false);
      setErrorSeverity("error");
      setError("Certains champs sont incorrects. Petit con.");
    }
  }

  return (
    <>
    <Grid container spacing={2} key={formVersion}>
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
          label="Poste"
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
          Poste du comitard. Max {txtlenght1} caractères.{" "}
          {post.length}/{txtlenght1}
        </FormHelperText>
      </Grid>
      {admin && (
        <Grid item xs={12} sm={6}>
          <UnstyledSelectIntroduction
            isError={cercleError}
            option={cerclesOption()}
            helpText={"Cercle du comitard"}
            change={(_event: any, val: any) => {
              setCercle(val);
              setCercleError(false);
            }}
          />
        </Grid>
      )}
      <Grid item xs={12} sm={6}>
        <QuantityInput
          title="Teneur en taule du comitard"
          min={0}
          max={10}
          error={teneurTauleError}
          helpText={`Teneur en taule du comitard de 0 à 10`}
          change={(_event: any, val: any) => {
            setTeneurTaule(val);
            if (val == undefined) {
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
            if (val == undefined) {
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
            if (val == undefined) {
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
      <Grid item xs={12} sm={admin ? 6 : 12}>
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
          Max {txtlenght2} caractères. {estLeSeul.length}/{txtlenght2}
        </FormHelperText>
      </Grid>
      <Grid item xs={12} sm={6}>
        <UnstyledSelectIntroduction
          isError={campusError}
          option={changerCampus}
          helpText={"Chaud changer de campus?"}
          change={(_event: any, val: any) => {
            setCampus(val);
            setCampusError(false);
          }}
        />
      </Grid>
      <Grid item xs={12} sm={12}>
        <PictureInput
          change={(images: ImageListType) => {
            setPicture(images);
            if (images.length > 0) {
              setPictureError(false);
            } else {
              setPictureError(true);
            }
          }}
          error={pictureError}
          upload={pictureUpload}
        />
      </Grid>

      <Grid item xs={12} sm={12}>
        <LoadingButton
          size="large"
          variant="contained"
          fullWidth
          onClick={handleNewComitard}
          loading={loading}
        >
          Créer comitard
        </LoadingButton>
      </Grid>
    </Grid>
    {error && (
      <Alert sx={{ mt: 3 }} severity={errorSeverity}>
        {error}
      </Alert>
    )}
    </>
  );
}
