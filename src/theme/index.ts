/**
 * The design system's public surface.
 *
 * Scheme-independent tokens (`space`, `radius`, `type`, `motion`) are plain
 * exports. Anything that changes between light and dark comes from
 * `useTheme()` / `useStyles()` so a component can never bake a colour in.
 */

export {
  motion,
  onPhoto,
  radius,
  space,
  type,
  type CrowdStep,
  type MealTagTheme,
  type MealTheme,
  type Palette,
  type RushTheme,
  type Scheme,
  type ShadowStep,
  type TypeToken,
} from './tokens';

export { ThemeProvider, useStyles, useTheme, type Theme } from './ThemeProvider';
