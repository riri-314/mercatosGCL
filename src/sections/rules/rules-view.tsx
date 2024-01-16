import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import {CardContent} from "@mui/material";
import Loading from "../loading/loading.tsx";
import Container from "@mui/material/Container";
import {useData} from "../../data/DataProvider.tsx";
import {DocumentData} from "@firebase/firestore";


interface DataContextValue {
  data: DocumentData | null;
  refetchData: () => void;
}

export default function Rules() {

    const {data} = useData() as DataContextValue;

    return (
        <>
            <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                mb={5}
            >
                <Typography variant="h4" sx={{mb: 1}}>
                    Le Règlement
                </Typography>
            </Stack>

            <Card sx={{width: "100%", mb: 4}}>
                <CardContent>
                    <Container>
                        { data ? (
                            data.data().rules
                        ) : (
                            <Loading />
                        ) }
                    </Container>
                </CardContent>
            </Card>
        </>
    );
}
