import { useId, useState, type ReactNode } from "react";
import { Box, Tab, Tabs, TextField } from "@mui/material";

export interface AccountSection {
  id: string;
  label: string;
  content: ReactNode;
}

export default function AccountTabs({
  sections,
}: {
  sections: AccountSection[];
}) {
  const id = useId();
  const [selected, setSelected] = useState(sections[0].id);
  const [visited, setVisited] = useState(() => new Set([sections[0].id]));
  const select = (value: string) => {
    setSelected(value);
    setVisited((previous) => new Set(previous).add(value));
  };
  const compact = sections.length > 3;
  return (
    <>
      <Box
        sx={{
          position: "sticky",
          top: { xs: 64, lg: 76 },
          zIndex: 10,
          bgcolor: "background.default",
          pt: 1,
          mb: 3,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        {compact && (
          <TextField
            select
            fullWidth
            label="Section"
            value={selected}
            onChange={(event) => select(event.target.value)}
            SelectProps={{ native: true }}
            sx={{ display: { xs: "block", sm: "none" }, mb: 2 }}
          >
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.label}
              </option>
            ))}
          </TextField>
        )}
        <Tabs
          value={selected}
          onChange={(_, value) => select(value)}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="Sections du compte"
          sx={{
            display: compact ? { xs: "none", sm: "flex" } : "flex",
            "& .MuiTab-root": {
              minHeight: 48,
              minWidth: 0,
              px: 2,
              fontSize: 13,
            },
          }}
        >
          {sections.map((section) => (
            <Tab
              key={section.id}
              value={section.id}
              id={`${id}-tab-${section.id}`}
              aria-controls={`${id}-panel-${section.id}`}
              label={section.label}
            />
          ))}
        </Tabs>
      </Box>
      {sections.map(
        (section) =>
          visited.has(section.id) && (
            <Box
              key={section.id}
              id={`${id}-panel-${section.id}`}
              role="tabpanel"
              aria-label={section.label}
              hidden={selected !== section.id}
              sx={{ minWidth: 0 }}
            >
              {section.content}
            </Box>
          ),
      )}
    </>
  );
}
