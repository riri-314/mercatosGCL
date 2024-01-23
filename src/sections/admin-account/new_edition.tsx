import Card from "@mui/material/Card";
import {Alert, AlertColor, CardContent, Grid, Typography,} from "@mui/material";
import {DocumentData} from "@firebase/firestore";
import {DateTimePicker} from "@mui/x-date-pickers/DateTimePicker";
import {Dayjs} from "dayjs";
import {LocalizationProvider} from "@mui/x-date-pickers/LocalizationProvider";
import {AdapterDayjs} from "@mui/x-date-pickers/AdapterDayjs";
import LoadingButton from "@mui/lab/LoadingButton";
import QuantityInput from "../../components/inputs/numberInput";
import UnstyledSelectIntroduction from "../../components/inputs/select";
import {useState} from "react";
import {newEdition} from "../../utils/admin-tools";

import '@mdxeditor/editor/style.css';
import {
    BlockTypeSelect,
    BoldItalicUnderlineToggles,
    headingsPlugin,
    InsertTable,
    listsPlugin,
    ListsToggle,
    MDXEditor,
    tablePlugin,
    toolbarPlugin,
    UndoRedo,
    CreateLink,
    linkDialogPlugin,
    InsertThematicBreak,
    thematicBreakPlugin
} from '@mdxeditor/editor'

interface DataContextValue {
    data: DocumentData;
    refetchData: () => void;
}

//  <DateTimePicker defaultValue={dayjs('2022-04-17T15:30')} />
export default function NewEdition({data, refetchData}: DataContextValue) {

    const [rules, setRules] = useState<string>(data.rules ? data.rules : "");
    // const [rulesError, setRulesError] = useState<boolean>(false);        not needed if the addionnal rules are not mandatory
    const [start, setStart] = useState<Dayjs | null>(null);
    const [stop, setStop] = useState<Dayjs | null>(null);
    const [nbFut, setNbFut] = useState<number>(data.nbFut ? data.nbFut : 100);
    const [nbFutError, setNbFutError] = useState<boolean>(false);
    const [duration, setDuration] = useState<number>(
        data.duration ? data.duration : 16
    );
    const [durationError, setDurationError] = useState<boolean>(false);
    const [nbComitard, setNbComitard] = useState<number>(
        data.nbComitard ? data.nbComitard : 5
    );
    const [nbComitardError, setNbComitardError] = useState<boolean>(false);
    const [enchereMin, setEnchereMin] = useState<number>(
        data.enchereMin ? data.enchereMin : 1
    );
    const [enchereMinError, setEnchereMinError] = useState<boolean>(false);
    const [enchereMax, setEnchereMax] = useState<number>(
        data.enchereMax ? data.enchereMax : 100
    );
    const [enchereMaxError, setEnchereMaxError] = useState<boolean>(false);
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
        if (rules == "") {
            setError("Les règles ne peuvent pas être vide");
            //setRulesError(true);
            setLoading(false);
            return;
        } else if (duration == 0) {
            setError("La durée d'une enchère doit être supérieur à 0");
            setDurationError(true);
            setLoading(false);
            return;
        } else if (!validateDates()) {
            setError(
                "La date de fin doit être supérieur à la date de début et la période les séparant doit être plus grande que la durée d'une enchere"
            );
            setLoading(false);
            return;
        } else if (nbFut <= 0) {
            setError("Le nombre de fut doit être supérieur à 0");
            setNbFutError(true);
            setLoading(false);
            return;
        } else if (nbComitard <= 0) {
            setError("Le nombre de comitard doit être supérieur à 0");
            setNbComitardError(true);
            setLoading(false);
            return;
        } else if (enchereMin > enchereMax) {
            setError("L'enchère minimum doit être inférieur à l'enchère maximum");
            setEnchereMinError(true);
            setEnchereMaxError(true);
            setLoading(false);
            return;
        } else if (enchereMin > nbFut) {
            setError(
                "L'enchère minimum doit être inférieur au nombre de futs par cercle"
            );
            setEnchereMinError(true);
            setNbFutError(true);
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
        const ret = await newEdition(
            rules,
            start,
            stop,
            nbFut,
            duration,
            nbComitard,
            enchereMin,
            enchereMax,
            remboursementVendeur,
            remboursementPerdant,
            remboursementGagnant
        );
        console.log("ret: ", ret);
        if (ret) {
            refetchData();
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
            <Card sx={{width: "100%", mb: 4}}>
                <CardContent>
                    <Typography variant="h5" sx={{mb: 1}}>
                        Créer nouvelle édition
                    </Typography>

                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={12}>
                            <MDXEditor
                                onChange={(e) => {
                                    setRules(e);
                                }}
                                markdown={rules}
                                plugins={[
                                    tablePlugin(),
                                    listsPlugin(),
                                    headingsPlugin(),
                                    linkDialogPlugin(),
                                    thematicBreakPlugin(),
                                    toolbarPlugin({
                                        toolbarContents: () => (
                                            <>
                                                {' '}
                                                <UndoRedo/>
                                                <BlockTypeSelect/>
                                                <BoldItalicUnderlineToggles/>
                                                <ListsToggle/>
                                                <InsertTable/>
                                                <CreateLink/>
                                                <InsertThematicBreak/>
                                            </>
                                        )
                                    })
                                ]}
                            />
                        </Grid>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <Grid item xs={12} sm={6}>
                                <DateTimePicker
                                    label="Début du mercato"
                                    sx={{width: "100%", color: "red"}}
                                    onChange={(e: Dayjs | null) => setStart(e)}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <DateTimePicker
                                    label="Fin du mercato"
                                    onChange={(e: Dayjs | null) => setStop(e)}
                                    sx={{width: "100%"}}
                                />
                            </Grid>
                        </LocalizationProvider>

                        <Grid item xs={12} sm={4}>
                            <QuantityInput
                                title="Nombre de futs par cercles"
                                min={1}
                                error={nbFutError}
                                helpText={`Nombre de futs qu'un cercle possède initialement. Défaut: ${
                                    data.nbFut ? data.nbFut : 100
                                }`}
                                change={(_event: any, val: any) => {
                                    setNbFut(val);
                                    if (!val) {
                                        setNbFutError(true);
                                    } else {
                                        setNbFutError(false);
                                    }
                                }}
                            />
                        </Grid>


                        {/*TODO reduce help width to match input width */}
                        <Grid item xs={12} sm={4}>
                            <QuantityInput
                                title="Nombre de comitards max/cercles"
                                min={1}
                                error={nbComitardError}
                                helpText={`Nombre de comitard qu'un cercle peut proposer à l'enchère. Défaut:  ${
                                    data.nbComitard ? data.nbComitard : 5
                                }`}
                                change={(_event: any, val: any) => {
                                    setNbComitard(val);
                                    if (!val) {
                                        setNbComitardError(true);
                                    } else {
                                        setNbComitardError(false);
                                    }
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={4}>
                            <QuantityInput
                                title="Durée d'une enchère"
                                min={1}
                                error={durationError}
                                helpText={`Durée d'une enchère en heures. Défaut: ${
                                    data.duration ? data.duration : 16
                                }`}
                                change={(_event: any, val: any) => {
                                    setDuration(val);
                                    if (!val) {
                                        setDurationError(true);
                                    } else {
                                        setDurationError(false);
                                    }
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <QuantityInput
                                title="Enchère minimum"
                                min={1}
                                error={enchereMinError}
                                helpText={`Enchere minimum qu'il cercle peut mettre sur un comitard. Defaut: ${
                                    data.enchereMin ? data.enchereMin : 1
                                }`}
                                change={(_event: any, val: any) => {
                                    setEnchereMin(val);
                                    if (!val) {
                                        setEnchereMinError(true);
                                    } else {
                                        setEnchereMinError(false);
                                    }
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <QuantityInput
                                title="Enchere maximum"
                                min={1}
                                error={enchereMaxError}
                                helpText={`Enchere maximum qu'il cercle peut mettre sur un comitard. Defaut ${
                                    data.enchereMax ? data.enchereMax : 100
                                }`}
                                change={(_event: any, val: any) => {
                                    setEnchereMax(val);
                                    if (!val) {
                                        setEnchereMaxError(true);
                                    } else {
                                        setEnchereMaxError(false);
                                    }
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <UnstyledSelectIntroduction
                                defaultValue={remboursementVendeur}
                                option={{
                                    "100%": 1,
                                    "75%": 0.75,
                                    "50%": 0.5,
                                    "25%": 0.25,
                                    "0%": 0,
                                }}
                                helpText={`Pourcentage de la somme des futs mis en enchère qui est remboursée au cercle vendant son comitard. Défaut: ${
                                    data.remboursementVendeur
                                        ? data.remboursementVendeur * 100
                                        : 50
                                }%`}
                                change={(_event: any, val: any) => setRemboursementVendeur(val)}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <UnstyledSelectIntroduction
                                defaultValue={remboursementPerdant}
                                option={{
                                    "100%": 1,
                                    "75%": 0.75,
                                    "50%": 0.5,
                                    "25%": 0.25,
                                    "0%": 0,
                                }}
                                helpText={`Pourcentage de la somme des futs mis en enchère qui est remboursé au cercle perdant l'enchère. Défaut: ${
                                    data.remboursementPerdant
                                        ? data.remboursementPerdant * 100
                                        : 100
                                }%`}
                                change={(_event: any, val: any) => setRemboursementPerdant(val)}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <UnstyledSelectIntroduction
                                defaultValue={remboursementGagnant}
                                option={{
                                    "100%": 1,
                                    "75%": 0.75,
                                    "50%": 0.5,
                                    "25%": 0.25,
                                    "0%": 0,
                                }}
                                helpText={`Pourcentage de la somme des futs mis en enchère qui est remboursé au cercle gagnant l'enchère. Défaut: ${
                                    data.remboursementGagnant
                                        ? data.remboursementGagnant * 100
                                        : 0
                                }%`}
                                change={(_event: any, val: any) => setRemboursementGagnant(val)}
                            />
                        </Grid>

                        <Grid item xs={12} sm={12}>
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
                    {error && (
                        <Alert sx={{mt: 3}} severity={errorType}>
                            {error}
                        </Alert>
                    )}
                </CardContent>
            </Card>
        </>
    );
}

