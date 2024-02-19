import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import {CardContent} from "@mui/material";
import Loading from "../loading/loading.tsx";
import {useData} from "../../data/DataProvider.tsx";
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import Iconify from "../../components/iconify/iconify.tsx";
import Box from "@mui/material/Box";

export default function Rules() {

    const {data} = useData();

    return (<>
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
                    {data ? (<>
                            <Markdown remarkPlugins={[remarkGfm]}
                                      rehypePlugins={[rehypeRaw]}>{data.data().rules}</Markdown>

                            <hr/>

                            <Box sx={{display: "flex", alignItems: "center", mt: 2, gap: (theme) => theme.spacing(1)}}>
                                <Iconify sx={{color: (theme: any) => theme.palette.primary.main}}
                                         icon="solar:playback-speed-bold-duotone"/>
                                <Typography variant="h5">Contexte initial</Typography>
                            </Box>
                            <ul>
                                <li>
                                    <strong>Nombre initial de fûts : </strong>
                                    {data?.data().nbFut} fûts
                                </li>
                                <li>
                                    <strong>Nombre maximum de comitards par cercle : </strong>
                                    {data?.data().nbComitard} comitards
                                </li>
                            </ul>

                            <Box sx={{display: "flex", alignItems: "center", mt: 2, gap: (theme) => theme.spacing(1)}}>
                                <Iconify sx={{color: (theme: any) => theme.palette.primary.main}}
                                         icon="solar:clock-circle-line-duotone"/>
                                <Typography variant="h5">Durée du mercato</Typography>
                            </Box>

                            <ul>
                                <li><strong>Début du mercato : </strong>
                                    {new Date(data?.data().start.seconds * 1000).toLocaleString()}</li>
                                <li>
                                    <strong>Fin du mercato : </strong>
                                    {new Date(data?.data().stop.seconds * 1000).toLocaleString()}
                                </li>
                            </ul>


                            <Box sx={{display: "flex", alignItems: "center", mt: 2, gap: (theme) => theme.spacing(1)}}>
                                <Iconify sx={{color: (theme: any) => theme.palette.primary.main}}
                                         icon="solar:user-hand-up-bold-duotone"/>
                                <Typography variant="h5">Enchères</Typography>
                            </Box>

                            <ul>
                                <li>
                                    <strong>Durée d'une enchères : </strong>
                                    {data?.data().duration}h
                                </li>
                                <li>
                                    <strong>Enchère minimum : </strong>
                                    {data?.data().enchereMin} fûts
                                </li>
                                <li>
                                    <strong>Enchère maximum : </strong>
                                    {data?.data().enchereMax} fûts
                                </li>
                            </ul>

                            <Box sx={{display: "flex", alignItems: "center", mt: 2, gap: (theme) => theme.spacing(1)}}>
                                <Iconify sx={{color: (theme: any) => theme.palette.primary.main}}
                                         icon="solar:chart-2-bold-duotone"/>
                                <Typography variant="h5">Gains/remboursements par enchère</Typography>
                            </Box>

                            <ul>
                                <li>
                                    <strong>Bénéfice lors de la vente d'un comitard : </strong>
                                    {data?.data().remboursementVendeur * 100}% du prix d'achat
                                </li>
                                <li>
                                    <strong>Remboursement pour le perdant d'une enchère : </strong>
                                    {data?.data().remboursementPerdant * 100}% du prix d'achat
                                </li>
                                <li>
                                    <strong>Remboursement pour le gagnant d'une enchère : </strong>
                                    {data?.data().remboursementGagnant * 100}% du prix d'achat
                                </li>
                            </ul>
                        </>) : (<Loading/>)}
                </CardContent>

            </Card>
        </>);
}
