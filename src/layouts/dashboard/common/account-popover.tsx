import {useState} from "react";

import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import Divider from "@mui/material/Divider";
import {alpha, styled} from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import {signOut} from "@firebase/auth";
import LoadingButton from "@mui/lab/LoadingButton";
import {auth} from "../../../firebase_config";
import {useAuth} from "../../../auth/AuthProvider";
import {useData} from "../../../data/DataProvider.tsx";
import {Popover} from "@mui/material";

// ----------------------------------------------------------------------

export default function AccountPopover() {
    const [open, setOpen] = useState(null);
    const [loading, setLoading] = useState(false);

    const {user} = useAuth();

    const {data} = useData();

    function nbFutsLeft(): number {
        const nbFuts = user?.uid && data?.data()?.cercles[user.uid]?.nbFut;
        return nbFuts ?? 0;
    }

    const handleOpen = (event: any) => {
        setOpen(event.currentTarget);
    };

    const handleClose = () => {
        setOpen(null);
    };

    const logout = async () => {
        setLoading(true);
        try {
            await signOut(auth);
            // console.log("logout succes, user: ", auth.currentUser);
        } catch {
            // console.log("logout error");
        }
        setLoading(false);
        setOpen(null);
    };

    return (<>
            <StyledTypography variant="subtitle1">
                Fûts restants : {nbFutsLeft()}
            </StyledTypography>
            <IconButton
                onClick={handleOpen}
                sx={{
                    width: (theme) => `${theme.spacing(8)}px`,
                    height: (theme) => `${theme.spacing(8)}px`,
                    background: (theme) => open ? `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.5)} 0%, ${alpha(theme.palette.primary.main, 0.5)} 100%)` : alpha(theme.palette.grey[500], 0.16),
                    "&:hover": {
                        background: (theme) => open ? `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)` : alpha(theme.palette.grey[500], 0.32),
                    },
                }}
            >
                <Avatar
                    src={user?.displayName ? "assets/images/logos_cercles/" + user?.displayName.toLowerCase() + ".svg" : "assets/images/transparent.png"}
                    imgProps={{
                        sx: {
                            objectFit: "scale-down",
                        },
                    }}
                    alt={user?.email ?? "null"}
                    sx={{
                        width: (theme) => `${theme.spacing(8)}px`, height: (theme) => `${theme.spacing(8)}px`,
                    }}
                >
                    {user?.email ? user.email : "test".charAt(0).toUpperCase()}
                </Avatar>
            </IconButton>

            <Popover
                open={!!open}
                anchorEl={open}
                onClose={handleClose}
                anchorOrigin={{vertical: "bottom", horizontal: "right"}}
                transformOrigin={{vertical: "top", horizontal: "right"}}
                PaperProps={{
                    sx: {
                        p: 0, mt: 1, ml: 0.75, width: 200,
                    },
                }}
            >
                <Box sx={{my: 1.5, px: 2}}>
                    <Typography variant="subtitle2" noWrap>
                        {user?.displayName ? user.displayName : "Pas de nom fourni"}
                    </Typography>
                    <Typography variant="body2" sx={{color: "text.secondary"}} noWrap>
                        {user?.email ? user.email : ""}
                    </Typography>
                </Box>

                <Divider sx={{borderStyle: "dashed", m: 0}}/>

                <LoadingButton
                    loading={loading}
                    onClick={logout}
                    sx={{
                        typography: "body2", color: "error.main", py: 1.5, width: "100%",
                    }}
                >
                    Logout
                </LoadingButton>
            </Popover>
        </>);
}

const StyledTypography = styled(Typography)(({theme}) => ({
    color: theme.palette.text.primary,
}));
