import { forwardRef } from 'react';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import RouterLink from '../../routes/components/router-link';


// ----------------------------------------------------------------------

const Logo = forwardRef(({ disabledLink = false, sx }: any) => {
   
  const logo = (
     <Box
       component="img"
       src="/assets/gcl_2.svg"
       sx={{ width: 40, height: 40, cursor: 'pointer', ...sx }}
     />
   );

  if (disabledLink) {
    return logo;
  }

  return (
    <Link component={RouterLink} href="/" sx={{ display: 'contents' }}>
      {logo}
    </Link>
  );
});



export default Logo;
