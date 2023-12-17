import { useMemo } from 'react';

import CssBaseline from '@mui/material/CssBaseline';
import { createTheme, ThemeProvider as MUIThemeProvider } from '@mui/material/styles';

import { typography } from './typography';
import { customShadows } from './custom-shadows';
import { palette } from './palette';
import { shadows } from './shadows';
import { overrides } from './overrides';

// ----------------------------------------------------------------------

export default function ThemeProvider({ children }: any) {
  const memoizedValue = useMemo(
    () => ({
      palette: palette(),
      typography,
      shadows: shadows(),
      customShadows: customShadows(),
      shape: { borderRadius: 8 },
    }),
    []
  );

  const theme = createTheme(memoizedValue);

  theme.components = overrides(theme);

  return (
    <MUIThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MUIThemeProvider>
  );
}


