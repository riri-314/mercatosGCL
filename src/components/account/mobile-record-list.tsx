import { useMemo, useState, type Key, type ReactNode } from "react";
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  MenuItem,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import ClubIcon from "../club-icon/club-icon";
import { normalizeSearch } from "../../utils/search";

interface SortOption<Row> {
  value: string;
  label: string;
  compare: (a: Row, b: Row) => number;
}
interface Props<Row> {
  rows: Row[];
  getKey: (row: Row) => Key;
  getSearchText: (row: Row) => string;
  renderItem: (row: Row) => ReactNode;
  label: string;
  sortOptions?: SortOption<Row>[];
  loading?: boolean;
  paginate?: boolean;
}
const pageSize = 10;

export function ResponsiveRecords<Row>({
  children,
  ...props
}: Props<Row> & { children: ReactNode }) {
  const compact = useMediaQuery(useTheme().breakpoints.down("md"));
  return compact ? <MobileRecordList {...props} /> : children;
}

export default function MobileRecordList<Row>({
  rows,
  getKey,
  getSearchText,
  renderItem,
  label,
  sortOptions = [],
  loading = false,
  paginate = true,
}: Props<Row>) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState(sortOptions[0]?.value ?? "");
  const [page, setPage] = useState(0);
  const filtered = useMemo(() => {
    const words = normalizeSearch(search).split(/\s+/).filter(Boolean);
    const matches = rows.filter((row) => {
      const text = normalizeSearch(getSearchText(row));
      return words.every((word) => text.includes(word));
    });
    const comparator = sortOptions.find(
      (option) => option.value === sort,
    )?.compare;
    return comparator ? matches.sort(comparator) : matches;
  }, [rows, search, sort, sortOptions, getSearchText]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pages - 1);
  const visible = paginate
    ? filtered.slice(currentPage * pageSize, (currentPage + 1) * pageSize)
    : filtered;
  return (
    <Box>
      <TextField
        fullWidth
        size="small"
        value={search}
        onChange={(event) => {
          setSearch(event.target.value);
          setPage(0);
        }}
        placeholder={
          label.includes("cette page") ? "Filtrer cette page…" : "Rechercher…"
        }
        inputProps={{ "aria-label": `Rechercher ${label}` }}
        sx={{ mb: 1.5, "& input": { fontSize: 16, minHeight: 26 } }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <ClubIcon name="search" sx={{ fontSize: 20 }} />
            </InputAdornment>
          ),
          endAdornment: search ? (
            <InputAdornment position="end">
              <IconButton
                aria-label="Effacer la recherche"
                onClick={() => {
                  setSearch("");
                  setPage(0);
                }}
                sx={{ width: 36, height: 36 }}
              >
                <ClubIcon name="close" sx={{ fontSize: 18 }} />
              </IconButton>
            </InputAdornment>
          ) : null,
        }}
      />
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          mb: 1.5,
        }}
      >
        <Typography
          role="status"
          sx={{ fontSize: 12, color: "text.secondary" }}
        >
          {loading
            ? "Chargement…"
            : `${filtered.length} résultat${filtered.length !== 1 ? "s" : ""}`}
        </Typography>
        {sortOptions.length > 0 && (
          <TextField
            select
            size="small"
            value={sort}
            onChange={(event) => {
              setSort(event.target.value);
              setPage(0);
            }}
            SelectProps={{ inputProps: { "aria-label": `Trier ${label}` } }}
            sx={{
              maxWidth: "70%",
              "& .MuiInputBase-root": { fontSize: 12, minHeight: 44 },
              "& fieldset": { border: 0 },
            }}
          >
            {sortOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        )}
      </Box>
      {loading && rows.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <CircularProgress size={24} />
        </Box>
      ) : visible.length === 0 ? (
        <Box
          sx={{
            p: 3,
            bgcolor: "background.paper",
            border: "1px dashed",
            borderColor: "divider",
            borderRadius: 2,
            textAlign: "center",
          }}
        >
          <Typography sx={{ fontSize: 14, color: "text.secondary" }}>
            {search
              ? "Aucun résultat pour cette recherche."
              : "Aucun élément pour le moment."}
          </Typography>
          {search && (
            <Button
              onClick={() => {
                setSearch("");
                setPage(0);
              }}
              sx={{ mt: 1 }}
            >
              Effacer la recherche
            </Button>
          )}
        </Box>
      ) : (
        <Box
          component="ul"
          sx={{
            listStyle: "none",
            p: 0,
            m: 0,
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
            gap: 1.5,
          }}
        >
          {visible.map((row) => (
            <Box component="li" key={getKey(row)} sx={{ minWidth: 0 }}>
              {renderItem(row)}
            </Box>
          ))}
        </Box>
      )}
      {paginate && pages > 1 && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 1,
            mt: 2,
          }}
        >
          <Button
            disabled={currentPage === 0}
            onClick={() => setPage(currentPage - 1)}
            sx={{ minHeight: 44 }}
          >
            Précédent
          </Button>
          <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
            {currentPage + 1} / {pages}
          </Typography>
          <Button
            disabled={currentPage + 1 >= pages}
            onClick={() => setPage(currentPage + 1)}
            sx={{ minHeight: 44 }}
          >
            Suivant
          </Button>
        </Box>
      )}
    </Box>
  );
}
