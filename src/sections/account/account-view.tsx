import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import { CardContent } from "@mui/material";
import { useAuth } from "../../auth/AuthProvider";

export default function Account() {
  const user = useAuth();

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
          Create new event {"->"} add cercle ? {"->"} start and stop dates{" "}
          {"->"} edit description ? (precise that start and stop dates are shown
          by default) <br />
          Table listing events and which one is active <br />
        </CardContent>
      </Card>

      <Card sx={{ width: "100%", mb: 4 }}>
        <CardContent>
          Add/Edit/Remove cercle <br />
        </CardContent>
      </Card>

      <Card sx={{ width: "100%", mb: 4 }}>
        <CardContent>
          Add/Edit/Remove comitard <br />
        </CardContent>
      </Card>

      <Card sx={{ width: "100%", mb: 4 }}>
        <CardContent>
          Debug card <br />
          Init db <br />
        </CardContent>
      </Card>
    </>
  );
}
