import { useState } from 'react';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';

import Header from './header';
import Nav from './nav';
import Main from './main';

// ----------------------------------------------------------------------

export default function DashboardLayout({ children }:any) {
  const [openNav, setOpenNav] = useState(false);

  return (
    <>
      <Header onOpenNav={() => setOpenNav(true)} />

      <Box
        sx={{
          minHeight: 1,
          display: 'flex',
          flexDirection: { xs: 'column', lg: 'row' },
        }}
      >
        <Nav openNav={openNav} onCloseNav={() => setOpenNav(false)} />

        <Main>{children}</Main>
      </Box>
    </>
  );
}

DashboardLayout.propTypes = {
  children: PropTypes.node,
};
