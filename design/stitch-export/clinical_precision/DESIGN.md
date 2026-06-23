---
name: Clinical Precision
colors:
  surface: '#f7f9ff'
  surface-dim: '#d7dae0'
  surface-bright: '#f7f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f4fa'
  surface-container: '#ebeef4'
  surface-container-high: '#e5e8ee'
  surface-container-highest: '#dfe3e8'
  on-surface: '#181c20'
  on-surface-variant: '#3f4850'
  inverse-surface: '#2d3135'
  inverse-on-surface: '#eef1f7'
  outline: '#707881'
  outline-variant: '#bfc7d2'
  surface-tint: '#006398'
  primary: '#006194'
  on-primary: '#ffffff'
  primary-container: '#007bb9'
  on-primary-container: '#fdfcff'
  inverse-primary: '#93ccff'
  secondary: '#006a61'
  on-secondary: '#ffffff'
  secondary-container: '#86f2e4'
  on-secondary-container: '#006f66'
  tertiary: '#894d00'
  on-tertiary: '#ffffff'
  tertiary-container: '#ac6200'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#cce5ff'
  primary-fixed-dim: '#93ccff'
  on-primary-fixed: '#001d31'
  on-primary-fixed-variant: '#004b73'
  secondary-fixed: '#89f5e7'
  secondary-fixed-dim: '#6bd8cb'
  on-secondary-fixed: '#00201d'
  on-secondary-fixed-variant: '#005049'
  tertiary-fixed: '#ffdcc0'
  tertiary-fixed-dim: '#ffb875'
  on-tertiary-fixed: '#2d1600'
  on-tertiary-fixed-variant: '#6b3b00'
  background: '#f7f9ff'
  on-background: '#181c20'
  surface-variant: '#dfe3e8'
typography:
  display:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  container-max: 1440px
  sidebar-width: 260px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style

This design system is engineered for high-stakes healthcare environments where clarity, speed of cognition, and professional trust are paramount. The aesthetic follows a **Modern Corporate** direction—balancing clinical sterility with human-centric warmth. 

The visual language emphasizes stability through a structured grid, generous white space to reduce cognitive load, and a refined "functionalist" approach. The interface stays out of the way of the data, ensuring that practitioners can focus on patient outcomes without visual distraction. Every element is designed to feel intentional, calibrated, and highly accessible, meeting WCAG 2.1 AA standards as a baseline.

## Colors

The color palette is anchored by "Trust Blue" (Sky 600) and "Clinical Teal" (Teal 600), colors associated with hygiene, technology, and calm. 

- **Primary:** Used for main actions, active states, and primary navigation indicators.
- **Secondary:** Reserved for supporting data visualizations and secondary interactive elements.
- **Surface & Backgrounds:** Utilize a range of cool grays (Slate) to create subtle separation between headers, sidebars, and main content areas.
- **Semantic Colors:** Status colors (Success, Warning, Error) are used exclusively for system feedback and patient status indicators to maintain their communicative power.

## Typography

The design system utilizes **Inter** for its exceptional legibility in data-heavy environments and its neutral, systematic tone. 

- **Scale:** A tight typographic scale ensures that large amounts of information can be displayed on a single screen without sacrificing readability.
- **Weights:** Use Regular (400) for long-form data, Medium (500) for UI labels/buttons, and Semibold (600) for section headers.
- **Tabular Numerals:** For data tables and medical readings, always enable `tnum` (tabular figures) to ensure numbers align vertically for quick comparison.

## Layout & Spacing

The system uses a **Fixed-Fluid Hybrid** grid. The primary sidebar remains fixed, while the main content area utilizes a 12-column fluid grid that caps at 1440px to prevent excessive line lengths in electronic health records (EHR).

- **The 4px Rule:** All spacing (padding, margins, gap) must be multiples of 4px to maintain a rhythmic vertical flow.
- **Sidebar:** A collapsed state (64px) and expanded state (260px) are available to maximize workspace.
- **Density:** Use "Comfortable" spacing for patient-facing portals and "Compact" spacing for practitioner dashboards where data density is a requirement.

## Elevation & Depth

Hierarchy is established through **Tonal Layering** rather than heavy shadows. This minimizes visual clutter in complex interfaces.

- **Level 0 (Background):** Slate-50 or White. Used for the main canvas.
- **Level 1 (Cards/Surface):** White with a 1px border (#E2E8F0). Used for grouping patient data and modules.
- **Level 2 (Popovers/Modals):** Subtle ambient shadow (Y: 4px, Blur: 12px, 5% Opacity Black) to provide focus on top of the main UI.
- **Interactions:** Hover states on interactive rows or cards should use a very subtle background tint (Slate-50) rather than an elevation change.

## Shapes

The design system adopts a **Soft (0.25rem)** roundedness profile. This provides a modern, approachable feel while maintaining the precision associated with medical instruments.

- **Small Components:** Buttons, inputs, and tags use `rounded` (4px).
- **Large Components:** Cards and modals use `rounded-lg` (8px).
- **Status Badges:** Use a "capsule" or fully rounded shape to differentiate them clearly from buttons or input fields.

## Components

### Data Tables
Tables are the core of this system. They must feature sticky headers, zebra-striping (optional for density), and clear sorting indicators. Row heights are set to 48px for standard and 40px for compact views.

### Status Badges
Used for appointment and clinical statuses. They use a soft background (10% opacity of the semantic color) with high-contrast text.
- **Scheduled:** Secondary (Teal)
- **Completed:** Success (Emerald)
- **Cancelled:** Error (Red)
- **Pending:** Warning (Amber)

### Sidebar
The enterprise sidebar is structured with a top-level organization switcher, primary navigation links with 20px icons, and a bottom-aligned user profile/settings section. 

### Cards
Cards are "ghost-bordered" (1px Slate-200) with no shadow. They include a header area for titles and actions, separated by a thin divider.

### Form Inputs
Inputs use a 1px Slate-300 border that shifts to Primary-600 on focus with a 2px outer glow. Labels are always positioned above the field for maximum legibility.