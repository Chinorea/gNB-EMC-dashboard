// Re-export everything from the theme folder for easier imports
export { createAppTheme, getThemeColors, lightColors, darkColors } from './theme';
export { ThemeContextProvider, useTheme as useAppTheme } from './ThemeContext';
export { default as DarkModeToggle } from './DarkModeToggle';
