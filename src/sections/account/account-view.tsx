import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import { CardContent } from "@mui/material";
import { useAuth } from "../../auth/AuthProvider";

import { DocumentData } from "@firebase/firestore";
import NewComitard from "../admin-account/new_comitard";

interface AccountProps {
  data: DocumentData;
  refetchData: () => void;
}


export default function Account({ data, refetchData }: AccountProps) {
  const { user } = useAuth();

  return (
    <>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={5}
      >
        <Typography variant="h4" sx={{ mb: 1 }}>
          Hi, Welcome back {user && user?.displayName} 👋
        </Typography>
      </Stack>

      <NewComitard data={data} admin={false} refetchData={refetchData}/>

      <Card sx={{ width: "100%", mb: 4 }}>
        <CardContent>
        <Typography variant="h5" sx={{ mb: 1 }}>
            Éditer comitard
          </Typography>
          <ComitardTable
            data={data}
            refetchData={refetchData}
            admin={false}
            error={(error) => console.log("error: ", error)}
            handleOpenModalComitard={(data: any) => {
              console.log("modal open:", data);
            }}
          />
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
