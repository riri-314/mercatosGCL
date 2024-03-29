import LoadingButton from "@mui/lab/LoadingButton";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Alert,
    AlertColor,
    CardContent,
    FormHelperText,
    Grid,
    TextField, Theme,
} from "@mui/material";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import UnstyledSelectIntroduction from "../../components/inputs/select";
import QuantityInput from "../../components/inputs/numberInput";
import { useState} from "react";
import PictureInput from "../../components/inputs/pictureInput";
import {ImageListType} from "react-images-uploading";
import {functions, storage} from "../../firebase_config";
import {getDownloadURL, ref, uploadBytesResumable} from "@firebase/storage";
import {v4 as uuidv4} from "uuid";
import {DocumentData} from "@firebase/firestore";
import {useAuth} from "../../auth/AuthProvider";
import {httpsCallable} from "@firebase/functions";
import Iconify from "../../components/iconify/iconify.tsx";

interface NewComitardProps {
    data: DocumentData;
    admin: boolean;
    refetchData: () => void;
}

export default function NewComitard({
                                        data, admin, refetchData,
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
    const [pictureUpload, setPictureUpload] = useState<number | undefined>(undefined);
    const [error, setError] = useState("");
    const [errorSeverity, setErrorSeverity] = useState<AlertColor | undefined>("error");
    const [loading, setLoading] = useState(false);

    const {user} = useAuth();

    const txtlenght1 = 30;
    const txtlenght2 = 150;

    function cerclesOption() {
        const out: { [key: string]: string } = {}; // Add type annotation to the 'out' object
        for (const [key, value] of Object.entries(data.data().cercles)) {
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
        if (etatCivil.length === 0 || etatCivil.length > txtlenght2) {
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
        if (picture[0] != null && picture[0].file !== undefined) {
            setPictureError(false);
        } else {
            error = true;
            setPictureError(true);
        }

        if (!error) {
            console.log("Check user input ok");
            const storageRef = ref(storage, `${data.id}/${user?.uid}/${uuidv4()}`);

            const uploadTask = uploadBytesResumable(storageRef, picture[0].file as File);
            uploadTask.on("state_changed", (snapshot) => {
                // Observe state change events such as progress, pause, and resume
                // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log("Upload is " + progress + "% done");
                setPictureUpload(progress);
                switch (snapshot.state) {
                    case "paused":
                        console.log("Upload is paused");
                        break;
                    case "running":
                        console.log("Upload is running");
                        break;
                }
            }, (error) => {
                // Handle unsuccessful uploads
                console.log("error uploading file: ", error);
                setPictureUpload(undefined);
                setErrorSeverity("error");
                setError("Une erreur est survenue lors de l'upload de l'image.");
                setLoading(false);

                return;
            }, () => {
                getDownloadURL(uploadTask.snapshot.ref)
                    .then((downloadURL) => {
                        console.log("File available at", downloadURL);
                        const data1 = {
                            editionId: data.id,
                            name: name,
                            firstname: firstname,
                            nickname: nickname,
                            post: post,
                            cercle: cercle ? cercle : null,
                            teneurTaule: teneurTaule,
                            etatCivil: etatCivil,
                            age: age,
                            nbEtoiles: nbEtoiles,
                            pointFort: pointFort,
                            pointFaible: pointFaible,
                            estLeSeul: estLeSeul,
                            picture: downloadURL,
                        };
                        const addMessage = httpsCallable(functions, "addComitard");
                        addMessage(data1).then((result) => {
                            const data: any = result.data;
                            // reload data
                            refetchData();
                            console.log("data:", data);
                            setPictureUpload(undefined);
                            setErrorSeverity("success");
                            setError("Comitard créé avec succès");
                            // empty fields
                            setName("");
                            setFirstname("");
                            setNickname("");
                            setPost("");
                            setCercle(null);
                            setTeneurTaule(null);
                            setEtatCivil("");
                            setAge(null);
                            setNbEtoiles(null);
                            setPointFort("");
                            setPointFaible("");
                            setEstLeSeul("");
                            setPicture([]);
                            setLoading(false);
                        }).catch((error) => {
                            console.log("error:", error);
                            setPictureUpload(undefined);
                            setErrorSeverity("error");
                            setError("Une erreur est survenue lors de la création du comitard. serveur error.");
                            setLoading(false);
                        });
                        // call cloud function with all arguments and wait for response
                    })
                    .catch((error) => {
                        console.log("error uploading file: ", error);
                        setPictureUpload(undefined);
                        setErrorSeverity("error");
                        setError("Une erreur est survenue lors de l'upload de l'image.");
                        setLoading(false);
                    });
            });
        } else {
            setLoading(false);
            setErrorSeverity("error");
            setError("Certains champs sont incorrects. Petit con.");
        }
    }

    return (<>
            <Card sx={{width: "100%", mb: 4}}>
                <CardContent>
                    <Accordion>
                        <AccordionSummary expandIcon={<Iconify width={40} icon="solar:double-alt-arrow-down-bold-duotone" sx={{color: (theme : Theme) => `${theme.palette.primary.main}`}} />}>
                            <Typography variant="h5"> Créer nouveau comitard </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
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
                                        Poste du comitard. Max {txtlenght1} caractères. {post.length}/
                                        {txtlenght1}
                                    </FormHelperText>
                                </Grid>
                                {admin && (<Grid item xs={12} sm={6}>
                                        <UnstyledSelectIntroduction
                                            isError={cercleError}
                                            option={cerclesOption()}
                                            helpText={"Cercle du comitard"}
                                            change={(_event: any, val: any) => {
                                                setCercle(val);
                                                setCercleError(false);
                                            }}
                                        />
                                    </Grid>)}
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
                                        Max {txtlenght2} caractères. {estLeSeul.length}/
                                        {txtlenght2}
                                    </FormHelperText>
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
                            {error && (<Alert sx={{mt: 3}} severity={errorSeverity}>
                                    {error}
                                </Alert>)}
                        </AccordionDetails>
                    </Accordion>
                </CardContent>
            </Card>
        </>);
}
