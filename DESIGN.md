---
name: TerraCare System
colors:
  surface: '#fdfae3'
  surface-dim: '#dedbc4'
  surface-bright: '#fdfae3'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f8f4dd'
  surface-container: '#f2efd7'
  surface-container-high: '#ece9d2'
  surface-container-highest: '#e6e3cc'
  on-surface: '#1c1c0e'
  on-surface-variant: '#504539'
  inverse-surface: '#323122'
  inverse-on-surface: '#f5f1da'
  outline: '#827568'
  outline-variant: '#d4c4b5'
  surface-tint: '#7f561f'
  primary: '#7f561f'
  on-primary: '#ffffff'
  primary-container: '#ba894d'
  on-primary-container: '#402500'
  inverse-primary: '#f4bc7b'
  secondary: '#5a6233'
  on-secondary: '#ffffff'
  secondary-container: '#dce5a9'
  on-secondary-container: '#5f6737'
  tertiary: '#636035'
  on-tertiary: '#ffffff'
  tertiary-container: '#b2ad7b'
  on-tertiary-container: '#434119'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffddb8'
  primary-fixed-dim: '#f4bc7b'
  on-primary-fixed: '#2b1700'
  on-primary-fixed-variant: '#643f07'
  secondary-fixed: '#dfe8ac'
  secondary-fixed-dim: '#c3cc92'
  on-secondary-fixed: '#181e00'
  on-secondary-fixed-variant: '#434a1d'
  tertiary-fixed: '#eae5ae'
  tertiary-fixed-dim: '#cdc894'
  on-tertiary-fixed: '#1e1c00'
  on-tertiary-fixed-variant: '#4b481f'
  background: '#fdfae3'
  on-background: '#1c1c0e'
  surface-variant: '#e6e3cc'
typography:
  headline-xl:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter-desktop: 24px
  gutter-mobile: 16px
  margin-desktop: 40px
  margin-mobile: 20px
---

## Brand & Style

The design system is built upon a foundation of **Organic Modernism**, blending professional healthcare standards with a grounded, earth-toned aesthetic. The brand personality is empathetic, steadfast, and approachable, specifically tailored to resonate with rural communities who value reliability and a connection to the land.

The visual style utilizes a high-end **Corporate / Modern** framework but softens the clinical coldness typically found in health tech. It prioritizes clarity and high legibility to ensure accessibility for users with varying levels of digital literacy. The emotional response is one of calm reassurance—moving away from "emergency red" tones toward harvest-inspired hues that signal growth and stability.

## Colors

The palette is derived from natural landscapes to foster trust and familiarity. 

- **Primary (#ba894d):** Used for critical calls to action, active states, and primary branding. It provides high contrast against the light background while maintaining a warm, sun-baked earth tone.
- **Secondary (#adb67e):** Used for wellness indicators, success states, and secondary navigational elements. This sage-like green represents health and vitality.
- **Tertiary (#d3ce99):** Applied to decorative elements, subtle accents, and low-priority information containers.
- **Neutral (#ebe8d1):** Utilized for structural borders, disabled states, and large-scale surface divisions.
- **Background (#fdfae3):** A warm, paper-like off-white that reduces eye strain and provides a soft, accessible canvas for all content.

## Typography

The design system employs **Hanken Grotesk** for all typographic needs. This choice ensures a clean, bold, and contemporary sans-serif appearance that remains highly legible at small sizes. 

Headlines are set with tight tracking and heavy weights to establish a clear information hierarchy. Body text utilizes a generous line height (1.5x) to accommodate elderly users and those reading on mobile devices in high-glare outdoor environments. Labels and utility text use increased letter spacing and semi-bold weights to ensure they are distinguishable from body copy.

## Layout & Spacing

This design system uses a **Fluid Grid** model based on an 8px base unit. 

- **Desktop:** 12-column grid with a maximum width of 1280px. Large margins (40px) create breathing room, reinforcing the "calm" brand pillar.
- **Tablet:** 8-column grid with 24px margins. Elements reflow to stack vertically when they exceed 50% of the viewport width.
- **Mobile:** 4-column grid with 16px gutters and 20px margins. Touch targets are prioritized, with a minimum height of 48px for all interactive elements.

Whitespace is used intentionally as a functional tool to separate complex medical data, preventing cognitive overload for the user.

## Elevation & Depth

Visual hierarchy is achieved through **Tonal Layers** and **Low-Contrast Outlines** rather than aggressive shadows. This keeps the interface feeling "flat" and grounded, similar to physical paperwork or traditional charts.

- **Level 0 (Base):** The Background color (#fdfae3).
- **Level 1 (Cards):** Pure white (#ffffff) surfaces with a 1px border using the Neutral tone (#ebe8d1).
- **Level 2 (Popovers/Modals):** Pure white surfaces with a very soft, diffused shadow (0px 4px 20px rgba(186, 137, 77, 0.08)) to provide a subtle "lift" without breaking the organic aesthetic.

Avoid heavy blurs or glassmorphism, as these can feel overly "techy" and may distract from the core healthcare information.

## Shapes

The design system utilizes **Rounded** geometry (0.5rem base radius). This specific level of roundedness strikes a balance between the precision of a professional medical tool and the friendliness of a community-focused service. 

- **Primary Buttons & Inputs:** 0.5rem (8px) corner radius.
- **Containers/Cards:** 1rem (16px) corner radius.
- **Search Bars/Badges:** Pill-shaped (fully rounded) to distinguish them from actionable buttons.

## Components

### Buttons
Primary action buttons are solid #ba894d with white text. Secondary buttons use an outline of #adb67e with the same color for text. Hover states should involve a subtle darkening of the fill, maintaining the warm tone.

### Input Fields
Fields feature a white background, a 1px border in #ebe8d1, and 16px of horizontal padding. On focus, the border shifts to the secondary green (#adb67e) to provide a clear, "healthy" affordance for data entry.

### Cards
Cards are the primary organizational unit. They should have a 1px #ebe8d1 border and no shadow. Header sections within cards can be subtly tinted with #fdfae3 to separate metadata from content.

### Chips & Badges
Used for status indicators (e.g., "Confirmed," "Pending"). They use the secondary and tertiary colors with 12% opacity fills and 100% opacity text of the same hue.

### Lists
Healthcare data lists should feature generous 16px vertical padding between items with a light divider (#ebe8d1) to ensure items are easily scanable for rural users who may be navigating the app on older mobile devices.