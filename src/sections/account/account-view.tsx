import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import { CardContent } from "@mui/material";
import { useAuth } from "../../auth/AuthProvider";

import { DocumentData } from "@firebase/firestore";

export default function Account({data}: DocumentData) {
  const user = useAuth();
  console.log(data)
  return (
    <>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={5}
      >
        <Typography variant="h4" sx={{ mb: 1 }}>
          Hi, Welcome back {user && user?.email} 👋
        </Typography>
      </Stack>

      <Card sx={{ width: "100%", mb: 4 }}>
        <CardContent>
            Table with all comitards and their info
        </CardContent>
      </Card>

      <Card sx={{ width: "100%", mb: 4 }}>
        <CardContent>
            Table with all encheres made by the cercle
        </CardContent>
      </Card>

      <Card sx={{ width: "100%", mb: 4 }}>
        <CardContent>
            Option to reset password
        </CardContent>
      </Card>

    </>
  );
}
