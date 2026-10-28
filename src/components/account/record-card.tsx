import { useId, useState, type ReactNode } from "react";
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Typography,
} from "@mui/material";

export interface RecordAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
}
export default function RecordCard({
  title,
  subtitle,
  avatar,
  details,
  actions,
  moreActions = [],
}: {
  title: string;
  subtitle?: string;
  avatar?: ReactNode;
  details?: ReactNode;
  actions?: ReactNode;
  moreActions?: RecordAction[];
}) {
  const id = useId();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  return (
    <Paper
      component="article"
      aria-label={title}
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 2,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        {avatar}
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            component="h3"
            sx={{ fontSize: 14, fontWeight: 700, overflowWrap: "anywhere" }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              sx={{
                fontSize: 12,
                color: "text.secondary",
                mt: 0.5,
                overflowWrap: "anywhere",
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
        {moreActions.length > 0 && (
          <IconButton
            aria-label={`Actions pour ${title}`}
            aria-haspopup="menu"
            aria-expanded={Boolean(anchor)}
            aria-controls={anchor ? id : undefined}
            onClick={(event) => setAnchor(event.currentTarget)}
            sx={{ width: 44, height: 44, flexShrink: 0, fontSize: 24 }}
          >
            ⋮
          </IconButton>
        )}
      </Box>
      {details}
      {actions && (
        <Box
          sx={{
            mt: "auto",
            display: "flex",
            flexWrap: "wrap",
            gap: 1,
            "& .MuiButton-root": { minHeight: 44, flex: 1 },
          }}
        >
          {actions}
        </Box>
      )}
      <Menu
        id={id}
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
      >
        {moreActions.map((action) => (
          <MenuItem
            key={action.label}
            disabled={action.disabled}
            onClick={() => {
              setAnchor(null);
              action.onClick();
            }}
            sx={{
              minHeight: "48px !important",
              whiteSpace: "normal",
              color: action.destructive ? "error.main" : undefined,
            }}
          >
            {action.label}
          </MenuItem>
        ))}
      </Menu>
    </Paper>
  );
}
