import { forwardRef } from "react";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import RouterLink from "../../routes/components/router-link";
import SvgColor from "../svg-color/svg-color";

interface LogoProps {
  disabledLink?: boolean;
  size?: number;
}
const Logo = forwardRef<HTMLDivElement, LogoProps>(
  ({ disabledLink = false, size = 56 }, ref) => {
    const logo = (
      <Box ref={ref} sx={{ display: "flex" }}>
        <SvgColor
          src="/assets/images/gcl.svg"
          sx={{ width: size, height: size, color: "primary.main" }}
        />
      </Box>
    );
    return disabledLink ? (
      logo
    ) : (
      <Link
        component={RouterLink}
        href="/"
        aria-label="GCL — accueil"
        sx={{ display: "inline-flex", flexShrink: 0 }}
      >
        {logo}
      </Link>
    );
  },
);
Logo.displayName = "Logo";
export default Logo;
