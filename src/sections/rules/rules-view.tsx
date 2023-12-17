import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import { CardContent } from "@mui/material";

export default function Rules() {

  return (
    <>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={5}
      >
        <Typography variant="h4" sx={{ mb: 1 }}>
          Le Règlement
        </Typography>
      </Stack>

      <Card sx={{ width: "100%", mb: 4 }}>
        <CardContent>
            Sync règlement from the db, start and stop dates also sync from the db <br />
            Toute enfreinte au règlment sera punis d'un affond de périmé en 15n* <br />
            *sous réserve de stock
        </CardContent>
      </Card>
    </>
  );
}
