import Grid from "@mui/material/Unstable_Grid2";
import {useData} from "../data/DataProvider.tsx";
import {CardContent, CardHeader, Theme } from "@mui/material";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import {Timestamp} from "@firebase/firestore";
import {useState } from "react";
import Avatar from "@mui/material/Avatar";
import Iconify from "../components/iconify/iconify.tsx";
import Label from "../components/label/label.tsx";

import {LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList} from "recharts";


import {useTheme} from "@mui/material/styles";

import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import Alert from "@mui/material/Alert";

// ----------------------------------------------------------------------


interface Enchere {
    date: Timestamp;
    sender: string;
    vote: number;
}

interface Comitard {
    firstname: string;
    name: string;
    nickname: string;
    nbEtoiles: number;
    age: number;
    enchereProcessed: boolean;
    enchereStart: Timestamp | undefined;
    enchereStop: Timestamp | undefined;
    estLeSeul: string;
    etatCivil: string;
    pointFaible: string;
    pointFort: string;
    post: string;
    teneurTaule: number;
    picture: string;
    cercle: string;
    encheres: Enchere[];
}

interface Cercle {
    name: string;
    description: string;
    nbFut: number;
    comitards: Comitard[];
}

interface ComitardResultCardProps {
    comitard: Comitard;
}

const ComitardResultCard = ({comitard}: ComitardResultCardProps) => {
    const theme: Theme = useTheme();
    const [timeOrDate, setTimeOrDate] = useState(true);
    //const isClosed = comitard.enchereStop?.toMillis() < Date.now();
    const isClosed = (comitard.enchereStop?.toMillis() ?? Infinity) < Date.now();
    //console.log(comitard)


    // Format the last vote
    const lastEnchere = comitard.encheres.at(-1);

    function formatTimeLeft(time: number): string {
        const hours = Math.floor(time / (1000 * 60 * 60));
        const minutes = Math.floor((time % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((time % (1000 * 60)) / 1000);

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        } else {
            return `${seconds}s`;
        }
    }

    const CustomTooltip = ({active, payload}: any) => {
        if (active && payload && payload.length) {
            return (
                <div style={{
                    backgroundColor: "white",
                    padding: "8px",
                    boxShadow: theme.shadows[3],
                    borderRadius: "5px",
                    lineHeight: "0.5rem"
                }}>
                    <p><strong>{payload[0].payload.sender}</strong></p>
                    <p>{payload[0].value} futs</p>
                    <p>{payload[0].payload.time.toLocaleString()}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <Card>
            <CardHeader
                title={`${comitard.firstname} "${comitard.nickname}" ${comitard.name}`}
                avatar={<Avatar alt={`${comitard.firstname} ${comitard.name}`} src={comitard.picture}
                                sx={{width: "4rem", height: "4rem"}}/>}
                subheader={comitard.cercle}
                titleTypographyProps={{
                    sx: {
                        display: "-webkit-box",  // Use a box model for flex behavior
                        overflow: "hidden", // Hide the overflow
                        textOverflow: "ellipsis", // Show ellipsis for overflow text
                        WebkitLineClamp: 2,  // Limit to two lines
                        WebkitBoxOrient: "vertical", // Ensure vertical orientation
                        lineHeight: "1.2",  // Optional: Adjust line height if needed
                    },
                }}
            />
            <CardContent sx={{pl: 3, pr: 3}}>
                <Box sx={{display: "flex", justifyContent: "space-between"}}>
                    <Label variant="filled" color="info" sx={{textTransform: "uppercase"}}>
                        <Iconify icon="mdi:court-hammer" sx={{mr: "0.3rem"}}/>
                        {lastEnchere?.vote ?? ""} futs
                    </Label>
                    {
                        isClosed ?
                            <Label variant="filled" color="success" sx={{textTransform: "uppercase"}}>
                                <Iconify icon="solar:cup-bold" sx={{mr: "0.3rem"}}/>
                                {lastEnchere?.sender}
                            </Label>
                            :
                            <Label
                                variant="filled"
                                color="error"
                                onClick={() => setTimeOrDate(!timeOrDate)}
                                sx={{
                                    textTransform: "uppercase",
                                    display: "inline-flex",
                                }}
                            >
                                <Iconify icon={timeOrDate ? "jam:clock" : "jam:calendar"} sx={{mr: "0.3rem"}}/>
                                <Box component="span">
                                    {timeOrDate ? (
                                        <span>{comitard.enchereStop ? formatTimeLeft(comitard.enchereStop.toMillis() - Date.now()) : "N/A"}</span>
                                    ) : (
                                        <Box sx={{
                                            height: theme.spacing(3),
                                            fontSize: "0.5rem",
                                            display: "flex",
                                            flexDirection: "column",
                                            justifyContent: "space-evenly",
                                            alignItems: "center"
                                        }}>
                                            <span>{comitard.enchereStop ? comitard.enchereStop.toDate().toLocaleDateString() : "N/A"}</span>
                                            <span>{comitard.enchereStop ? comitard.enchereStop.toDate().toLocaleTimeString() : "N/A"}</span>
                                        </Box>
                                    )}
                                </Box>
                            </Label>
                    }

                </Box>

                <Box sx={{height: theme.spacing(16), mt: 2, ml: -4, mb: -2, mr: 1}}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={comitard.encheres.map((enchere) => ({
                            time: new Date(enchere.date.toMillis()),
                            votes: enchere.vote,
                            sender: enchere.sender,
                        }))}>
                            <XAxis
                                dataKey="time"
                                padding={{ left: 20, right: 20 }}
                            />
                            <YAxis
                                padding={{ top: 10, bottom: 10 }}
                            />
                            <Tooltip content={<CustomTooltip/>}/>
                            <Line type="monotone" dataKey="votes"
                                  stroke={isClosed ? theme.palette.success.main : theme.palette.info.main}
                                  strokeWidth={2}>
                                <LabelList
                                    dataKey="sender"
                                    position="bottom"
                                    content={(props) => {
                                        const { x, y, value } = props;
                                        return (
                                            <text
                                                x={x}
                                                dx={6}
                                                y={y}
                                                dy={4}
                                                fontSize={10}
                                                fill="#666"
                                                textAnchor="inside"
                                                transform={`rotate(90, ${x}, ${y})`}
                                            >
                                                {value}
                                            </text>
                                        );
                                    }}
                                />

                            </Line>
                        </LineChart>
                    </ResponsiveContainer>
                </Box>
            </CardContent>
        </Card>
    );
};

export default function ResultsPage() {
    const {data} = useData();

    const cercles = new Map<string, Cercle>();

    const cerclesData = data?.data().cercles;
    if (cerclesData && typeof cerclesData === 'object') {
        Object.keys(cerclesData).forEach((cercleID: string) => {
            // build correct Cercle object
            const cercle: Cercle = {
                name: cerclesData[cercleID].name,
                description: cerclesData[cercleID].description,
                nbFut: cerclesData[cercleID].nbFut,
                comitards: Object.values(cerclesData[cercleID].comitards) as Comitard[],
            };

            cercles.set(cercleID, cercle);
        });
    }

    // store all comitards in 2 arrays with criteria bids (open, closed)
    const runningComitards: Comitard[] = [];
    const closedComitards: Comitard[] = [];
    // for each cercle get the comitard if running or closed (closed = enchereStop < now, running = enchereStop > now, ignore if enchereStop = undefined)
    cercles.forEach((cercle) => {
        cercle.comitards.forEach((comitard) => {
            if (comitard.enchereStop) {
                const enchereArray: Enchere[] = [];
                const enchereData = comitard.encheres;
                //const enchereData: { [key: string]: Enchere } = comitard.encheres;

                if (enchereData && typeof enchereData === 'object') {
                    Object.keys(enchereData).forEach((enchereID: any) => {
                        // build correct Enchere object
                        const enchere: Enchere = {
                            date: enchereData[enchereID].date,
                            sender: cercles.get(enchereData[enchereID].sender)?.name ?? "",
                            vote: enchereData[enchereID].vote,
                        };

                        enchereArray.push(enchere);
                    });
                }
                comitard.encheres = enchereArray.sort((a, b) => a.date.toMillis() - b.date.toMillis());
                comitard.cercle = cercle.name;


                if (comitard.enchereStop.toMillis() > Date.now()) {
                    runningComitards.push(comitard);
                } else {
                    closedComitards.push(comitard);
                }
            }
        });
    });


    const [value, setValue] = useState('1');

    const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
        setValue(newValue);
    };

    return (
        <>
            <TabContext value={value}>
                <Box sx={{borderBottom: 1, borderColor: 'divider'}}>
                    <TabList onChange={handleChange}>
                        <Tab label="Enchères en cours" value="1" sx={{ml: 4}}/>
                        <Tab label="Enchères remportées" value="2"/>
                    </TabList>
                </Box>
                <TabPanel value="1">
                    <Alert severity="info" sx={{mb: 2}}>
                        Il est possible de voir la date de fin de l'enchère ou le temps restant en cliquant sur l'étiquette orange
                    </Alert>
                    <Grid container spacing={2}>
                        {/* for each Comitard in runningComitards */}
                        {runningComitards.map((comitard) => (
                            <Grid xl={3} md={4} sm={6} xs={12}>
                                <ComitardResultCard comitard={comitard}/>
                            </Grid>
                        ))}
                    </Grid>
                </TabPanel>
                <TabPanel value="2">
                    <Grid container spacing={2}>
                    {/* for each Comitard in runningComitards */}
                    {closedComitards.map((comitard) => (
                        <Grid xl={3} md={4} sm={6} xs={12}>
                            <ComitardResultCard comitard={comitard}/>
                        </Grid>
                    ))}
                </Grid>
                </TabPanel>
            </TabContext>
        </>
    );
}
