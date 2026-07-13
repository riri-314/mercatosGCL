import { SyntheticEvent } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";


type Props = {
  tabValue: "1" | "2";
  search: string;
  onSearchChange: (value: string) => void;

  selectedOptions: string[];
  onSelectedOptionsChange: (value: string[]) => void;
};

const PLACEHOLDER_OPTIONS = [
  "Option A",
  "Option B",
  "Option C",
  "Option D",
  "Option E",
];

export default function ResultsToolbar({
  tabValue,
  selectedOptions,
  onSelectedOptionsChange,
}: Props) {
  const selectLabel =
    tabValue === "1"
      ? "Filtres (origine du comitard)"
      : "Filtres (vainceur de l'enchère)";

  return (
    <Box sx={{ mb: 2 }}>
      <Stack spacing={1.5}>

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          alignItems={{ xs: "stretch", md: "center" }}
          sx={{ px: { xs: 2, md: 4 } }}
        >
          <Autocomplete
            fullWidth
            multiple
            options={PLACEHOLDER_OPTIONS}
            value={selectedOptions}
            onChange={(_: SyntheticEvent, newValue: string[]) =>
              onSelectedOptionsChange(newValue)
            }
            renderInput={(params) => (
              <TextField {...params} label={selectLabel} size="small" />
            )}
            sx={{ minWidth: { xs: "100%", md: 320 } }}
          />
        </Stack>
      </Stack>
    </Box>
  );
}
