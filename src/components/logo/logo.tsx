import { forwardRef } from 'react';
import Link from '@mui/material/Link';
import RouterLink from '../../routes/components/router-link';
import { styled } from "@mui/material/styles";
import SvgColor from "../svg-color/svg-color.tsx";

// ----------------------------------------------------------------------

interface LogoProps {
  disabledLink?: boolean;
}

const Logo = forwardRef<HTMLDivElement, LogoProps>(
  ({ disabledLink = false }, ref) => {

    const logo = (
      <StyledLogo
        ref={ref}
        src="/assets/images/gcl.svg"
      />
    );

    if (disabledLink) {
      return logo;
    }

    return (
      <Link
        component={RouterLink}
        href="/"
        sx={{ display: 'contents' }}
      >
        {logo}
      </Link>
    );
  }
);

Logo.displayName = "Logo";

const StyledLogo = styled(SvgColor)(({ theme }) => ({
  color: theme.palette.primary.main,
  cursor: 'pointer',
  padding: theme.spacing(4),
  marginLeft: theme.spacing(4),
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

export default Logo;