import { Suspense, type ReactNode } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";

export default function DeferredPanel({ title, children }: { title: string; children: ReactNode }) {
  return <Card sx={{ width: "100%", mb: 4 }}><CardContent>
    <Accordion slotProps={{ transition: { mountOnEnter: true } }}>
      <AccordionSummary expandIcon={<span aria-hidden>⌄</span>}>
        <Typography variant="h5">{title}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Suspense fallback={<div role="status">Chargement…</div>}>{children}</Suspense>
      </AccordionDetails>
    </Accordion>
  </CardContent></Card>;
}
