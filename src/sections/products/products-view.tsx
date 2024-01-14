import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";

import { useAuth } from "../../auth/AuthProvider";
import { useData } from "../../data/DataProvider";
import { DocumentData } from "@firebase/firestore";
import Loading from "../loading/loading";
import ProductCard from "./product-card";

// ----------------------------------------------------------------------

interface DataContextValue {
  data: DocumentData | null;
  refetchData: () => void;
}

export default function ProductsView() {
  const user = useAuth();
  const { data } = useData() as DataContextValue;

  return (
    <Container>
      {data ? (
        Object.keys(data.data().cercles).map((cercleId) => (
          <div key={cercleId} style={{ marginBottom: "20px" }}>
            <Typography sx={{m: 3}} variant="h3">{data.data().cercles[cercleId].name}</Typography>
            <Grid container spacing={3}>
              {data.data().cercles[cercleId].comitards &&
                Object.keys(data.data().cercles[cercleId].comitards).map(
                  (comitardID: any) => (
                    <Grid key={comitardID} item xs={12} sm={6} md={3}>
                      <ProductCard
                        product={
                          data.data().cercles[cercleId].comitards[comitardID]
                        }
                        loged={user ? true : false}
                      />
                    </Grid>
                  )
                )}
            </Grid>
          </div>
        ))
      ) : (
        <Loading />
      )}
    </Container>
  );
}
