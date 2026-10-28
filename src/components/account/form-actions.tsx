import type { ReactNode } from "react";
import { Alert, Box, Grid, type AlertColor } from "@mui/material";

export default function FormActions({
  children,
  error,
  severity = "error",
}: {
  children: ReactNode;
  error?: string;
  severity?: AlertColor;
}) {
  return (
    <Grid
      item
      xs={12}
      sx={{
        position: "sticky",
        bottom: "var(--account-action-bottom, 0px)",
        zIndex: 2,
        bgcolor: "background.paper",
        borderTop: "1px solid",
        borderColor: "divider",
        mt: 1,
        pb: 1,
      }}
    >
      {error && (
        <Alert severity={severity} sx={{ mb: 1.5 }}>
          {error}
        </Alert>
      )}
      <Box
        sx={{
          display: "flex",
          gap: 1,
          "& .MuiButton-root": {
            flex: 1,
            minWidth: 0,
            minHeight: 48,
            whiteSpace: "normal",
            fontSize: { xs: 12, sm: 14 },
          },
        }}
      >
        {children}
      </Box>
    </Grid>
  );
}
