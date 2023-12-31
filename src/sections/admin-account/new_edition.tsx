import Card from "@mui/material/Card";
import {
  Alert,
  AlertColor,
  CardContent,
  FormHelperText,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import { DocumentData } from "@firebase/firestore";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { Dayjs } from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import LoadingButton from "@mui/lab/LoadingButton";
import QuantityInput from "../../components/inputs/numberInput";
import UnstyledSelectIntroduction from "../../components/inputs/select";
import { useState } from "react";
import { newEdition } from "../../utils/admin-tools";

interface NewEditionProps {
  data: DocumentData;
  id: string;
}
//  <DateTimePicker defaultValue={dayjs('2022-04-17T15:30')} />
export default function NewEdition({ data, id }: NewEditionProps) {
  console.log(id)
  const [rules, setRules] = useState<string>(data.rules ? data.rules : "");
  const [start, setStart] = useState<Dayjs | null>(null);
  const [stop, setStop] = useState<Dayjs | null>(null);
  const [nbFut, setNbFut] = useState<number>(data.nbFut ? data.nbFut : 100);
  const [duration, setDuration] = useState<number>(
    data.duration ? data.duration : 16
  );
  const [nbComitard, setNbComitard] = useState<number>(
    data.nbComitard ? data.nbComitard : 5
  );
  const [enchereMin, setEnchereMin] = useState<number>(
    data.enchereMin ? data.enchereMin : 1
  );
  const [enchereMax, setEnchereMax] = useState<number>(
    data.enchereMax ? data.enchereMax : 100
  );
  const [remboursementVendeur, setRemboursementVendeur] = useState<number>(
    data.remboursementVendeur ? data.remboursementVendeur : 0.5
  );
  const [remboursementPerdant, setRemboursementPerdant] = useState<number>(
    data.remboursementPerdant ? data.remboursementPerdant : 1
  );
  const [remboursementGagnant, setRemboursementGagnant] = useState<number>(
    data.remboursementGagnant ? data.remboursementGagnant : 0
  );

  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorType, setErrorType] = useState<AlertColor | undefined>("error");

  function validateDates() {
    if (start && stop && start.isAfter(stop)) {
      // Handle error when stop date is before start date
      return false;
    }

    const contestDuration = stop && start ? stop.diff(start, "minute") : 0;
    console.log(contestDuration);
    if (duration == 0 || duration * 60 >= contestDuration) {
      // Handle error when auction duration is greater than contest duration
      return false;
    }

    return true;
  }

  async function handleCreateEdition() {
    //window.location.reload();
    setLoading(true);
    setErrorType("error");
    setError("");
    if (duration == 0) {
      setError("La durée d'une enchere doit être supérieur à 0");
      setLoading(false);
      return;
    } else if (!validateDates()) {
      setError(
        "La date de fin doit être supérieur à la date de début et la période les séparant doit etre plus grande que la durée d'une enchere"
      );
      setLoading(false);
      return;
    } else if (rules == "") {
      setError("Les régles ne peuvent pas être vide");
      setLoading(false);
      return;
    } else if (nbFut <= 0) {
      setError("Le nombre de fut doit être supérieur à 0");
      setLoading(false);
      return;
    } else if (nbComitard <= 0) {
      setError("Le nombre de comitard doit être supérieur à 0");
      setLoading(false);
      return;
    } else if (enchereMin > enchereMax) {
      setError("L'enchere minimum doit être inférieur à l'enchere maximum");
      setLoading(false);

      return;
    } else if (
      remboursementVendeur < 0 ||
      remboursementVendeur < 0 ||
      remboursementVendeur < 0
    ) {
      setError("Les remboursements doivent être supérieur à 0");
      setLoading(false);

      return;
    }
    const ret = await newEdition(rules, start, stop, nbFut, duration, nbComitard, enchereMin, enchereMax, remboursementVendeur, remboursementPerdant, remboursementGagnant)
    console.log("ret: ",ret)
    if (ret) {
      setErrorType("success");
      setError("Edition créée");
      // load modal that ask to reload the website to fetch new data.
    } else {
      setErrorType("error");
      setError("Erreur lors de la création de l'édition, contactez un geek");
    }

    setLoading(false);
    console.log("create edition");
  }
  // stop come after start. Duration of auction cannot be gretter than the duration of the contest (stop - start)
  // echere minimum < enchere maximum
  // enchere minimum > 0

  return (
    <>
      <Card sx={{ width: "100%", mb: 4 }}>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 1 }}>
            Créer nouvelle édition
          </Typography>
          {error && (
            <Alert sx={{ mb: 3 }} severity={errorType}>
              {error}
            </Alert>
          )}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Régles"
                multiline
                maxRows={4}
                fullWidth
                value={rules}
                onChange={(e) => setRules(e.target.value)}
              />
              <FormHelperText>
                Régles affichées dans l'onglet réglement. Les infos entées ci
                dessous y sont automatiquement présentes. Defaut: description de
                l'année passé
              </FormHelperText>
            </Grid>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Grid item xs={12} sm={6}>
                <DateTimePicker
                  label="Start date"
                  sx={{ width: "100%" }}
                  onChange={(e: Dayjs | null) => setStart(e)}
                />
                <FormHelperText>Début du concours</FormHelperText>
              </Grid>
              <Grid item xs={12} sm={6}>
                <DateTimePicker
                  label="Stop date"
                  onChange={(e: Dayjs | null) => setStop(e)}
                  sx={{ width: "100%" }}
                />
                <FormHelperText>Fin du concours</FormHelperText>
              </Grid>
            </LocalizationProvider>
            <Grid item xs={12} sm={6}>
              <QuantityInput
                title="Nombre de futs par cercles"
                min={1}
                helpText={`Nombre de futs qu'un cercle posséde initialement. Defaut: ${
                  data.nbFut ? data.nbFut : 100
                }`}
                change={(_event: any, val: any) => setNbFut(val)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <QuantityInput
                title="Duration d'une enchere"
                min={1}
                helpText={`Duration d'une enchere en heures. Defaut: ${
                  data.duration ? data.duration : 16
                }`}
                change={(_event: any, val: any) => setDuration(val)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <QuantityInput
                title="Nombre de comitards max par cercles"
                min={1}
                helpText={`Nombre de comitard qu'un cercle peut proposer à l'enchere. Defaut:  ${
                  data.nbComitard ? data.nbComitard : 5
                }`}
                change={(_event: any, val: any) => setNbComitard(val)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <QuantityInput
                title="Enchere minimum"
                min={1}
                helpText={`Enchere minimum qu'il cercle peut mettre sur un comitard. Defaut: ${
                  data.enchereMin ? data.enchereMin : 1
                }`}
                change={(_event: any, val: any) => setEnchereMin(val)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <QuantityInput
                title="Enchere maximum"
                helpText={`Enchere maximum qu'il cercle peut mettre sur un comitard. Defaut ${
                  data.enchereMax ? data.enchereMax : 100
                }`}
                change={(_event: any, val: any) => setEnchereMax(val)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <UnstyledSelectIntroduction
                defaultValue={remboursementVendeur}
                option={{
                  "100%": 1,
                  "75%": 0.75,
                  "50%": 0.5,
                  "25%": 0.25,
                  "0%": 0,
                }}
                helpText={`Pourcentage de la somme des futs mis en enchere qui est remboursé au cercle vendant son comitard. Defaut: ${
                  data.remboursementVendeur
                    ? data.remboursementVendeur * 100
                    : 50
                }%`}
                change={(_event: any, val: any) => setRemboursementVendeur(val)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <UnstyledSelectIntroduction
                defaultValue={remboursementPerdant}
                option={{
                  "100%": 1,
                  "75%": 0.75,
                  "50%": 0.5,
                  "25%": 0.25,
                  "0%": 0,
                }}
                helpText={`Pourcentage de la somme des futs mis en enchere qui est remboursé au cercle perdant. Defaut: ${
                  data.remboursementPerdant
                    ? data.remboursementPerdant * 100
                    : 100
                }%`}
                change={(_event: any, val: any) => setRemboursementPerdant(val)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <UnstyledSelectIntroduction
                defaultValue={remboursementGagnant}
                option={{
                  "100%": 1,
                  "75%": 0.75,
                  "50%": 0.5,
                  "25%": 0.25,
                  "0%": 0,
                }}
                helpText={`Pourcentage de la somme des futs mis en enchere qui est remboursé au cercle gagnant. Defaut: ${
                  data.remboursementGagnant
                    ? data.remboursementGagnant * 100
                    : 0
                }%`}
                change={(_event: any, val: any) => setRemboursementGagnant(val)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <LoadingButton
                size="large"
                variant="contained"
                fullWidth
                loading={loading}
                onClick={handleCreateEdition}
              >
                Créer édition
              </LoadingButton>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </>
  );
}
