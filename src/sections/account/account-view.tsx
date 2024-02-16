import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import { Alert, CardContent, Modal } from "@mui/material";
import { useAuth } from "../../auth/AuthProvider";

import { DocumentData } from "@firebase/firestore";
import NewComitard from "../admin-account/new_comitard";
import ComitardTable from "../admin-account/comitard_table";
import { useState } from "react";
import EditComitard from "../admin-account/edit_comitard";

interface AccountProps {
  data: DocumentData;
  refetchData: () => void;
}

export default function Account({ data, refetchData }: AccountProps) {
  const { user } = useAuth();

  const [errorComitardEdit, setErrorComitardEdit] = useState("");
  const [openModalComitard, setOpenModalComitard] = useState(false);
  const [modalComitardData, setModalComitardData] = useState<any | null>(null);

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

      <NewComitard data={data} admin={false} refetchData={refetchData} />

      <Card sx={{ width: "100%", mb: 4 }}>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 1 }}>
            Éditer comitard
          </Typography>
          <ComitardTable
            data={data}
            refetchData={refetchData}
            admin={false}
            error={(error) => setErrorComitardEdit(error)}
            handleOpenModalComitard={(data: any) => {
              setOpenModalComitard(true);
              setModalComitardData(data);
              console.log("modal open:", data);
            }}
          />
          {errorComitardEdit && (
            <Alert sx={{ mt: 3 }} severity={"error"}>
              {errorComitardEdit}
            </Alert>
          )}
        </CardContent>
      </Card>

      <Modal
        open={openModalComitard}
        onClose={() => setOpenModalComitard(false)}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
        sx={{
          m: 3,
          overflow: "scroll",
          maxWidth: 800,
          ml: "auto",
          mr: "auto",
        }}
      >
        <EditComitard
          refetchData={refetchData}
          data={modalComitardData}
          activeData={data}
          close={() => setOpenModalComitard(false)}
          admin={false}
        />
      </Modal>

      <Card sx={{ width: "100%", mb: 4 }}>
        <CardContent>Table with all encheres made by the cercle</CardContent>
      </Card>

      <Card sx={{ width: "100%", mb: 4 }}>
        <CardContent>Option to reset password</CardContent>
      </Card>
    </>
  );
}
