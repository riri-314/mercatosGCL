import { Grid, Typography } from "@mui/material";
export default function FormSection({ title }: { title: string }) {
  return (
    <Grid item xs={12}>
      <Typography
        component="h3"
        variant="subtitle1"
        sx={{ borderBottom: "1px solid", borderColor: "divider", pb: 1, mt: 1 }}
      >
        {title}
      </Typography>
    </Grid>
  );
}
