import { Suspense, type ReactNode } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Card,
  Typography,
} from "@mui/material";
import ClubIcon from "../club-icon/club-icon";

export default function DeferredPanel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Card sx={{ width: 1, mb: 2, overflow: "visible" }}>
      <Accordion
        slotProps={{ transition: { mountOnEnter: true } }}
        sx={{
          "&::before": { display: "none" },
          "&.Mui-expanded": { m: 0 },
          boxShadow: "none",
        }}
      >
        <AccordionSummary
          expandIcon={
            <ClubIcon
              name="arrow"
              sx={{ fontSize: 18, transform: "rotate(90deg)" }}
            />
          }
          sx={{
            minHeight: 56,
            px: 2,
            "& .MuiAccordionSummary-content": { my: 1.5 },
          }}
        >
          <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
            {title}
          </Typography>
        </AccordionSummary>
        <AccordionDetails
          className="account-form"
          sx={{ p: { xs: 2, sm: 3 }, pt: "0 !important" }}
        >
          <Suspense fallback={<div role="status">Chargement…</div>}>
            {children}
          </Suspense>
        </AccordionDetails>
      </Accordion>
    </Card>
  );
}
