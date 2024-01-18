import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import {CardContent} from "@mui/material";
import Loading from "../loading/loading.tsx";
import {useData} from "../../data/DataProvider.tsx";
import {DocumentData} from "@firebase/firestore";
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'


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
                <CardContent sx={{ml: 2}}>
                    {data ? (
                        <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{data.data().rules}</Markdown>
                    ) : (
                        <Loading/>
                    )}
                </CardContent>

            </Card>
        </>
    );
}
