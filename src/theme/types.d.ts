import type { customShadows } from './custom-shadows';

declare module '@mui/material/styles' {
  interface Theme {
    customShadows: ReturnType<typeof customShadows>;
  }
  interface ThemeOptions {
    customShadows?: ReturnType<typeof customShadows>;
  }
  interface PaletteColor {
    lighter?: string;
    darker?: string;
  }
  interface SimplePaletteColorOptions {
    lighter?: string;
    darker?: string;
  }
  interface TypeBackground {
    neutral: string;
  }
}

declare module '@mui/material/styles/createTypography' {
  interface Typography {
    fontWeightSemiBold: number;
  }
  interface TypographyOptions {
    fontWeightSemiBold?: number;
  }
}
