---
name: OmniTable Management
colors:
  surface: '#FFFFFF'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#45464d'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#0b1c30'
  on-tertiary-container: '#75859d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#d3e4fe'
  tertiary-fixed-dim: '#b7c8e1'
  on-tertiary-fixed: '#0b1c30'
  on-tertiary-fixed-variant: '#38485d'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
  danger: '#EF4444'
  warning: '#F59E0B'
  border: '#E2E8F0'
  text-main: '#1E293B'
  text-muted: '#64748B'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  mono-data:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  container-padding: 24px
  gutter: 16px
  sidebar-width: 260px
  sidebar-collapsed: 72px
  touch-target-min: 44px
---

## Brand & Style

The design system is engineered for **Operational Excellence**. It targets high-stakes restaurant environments where speed, clarity, and data density are paramount. The personality is authoritative, systematic, and utilitarian, ensuring that managers and staff can process complex information—like inventory alerts and real-time sales—at a glance.

The chosen design style is **Corporate / Modern** with a focus on **High-Density Utility**. It utilizes a structured grid, clear visual hierarchies, and a refined professional palette. The aesthetic avoids unnecessary decoration in favor of performance-oriented components that prioritize legibility in high-pressure "busy hour" scenarios.

- **Primary Goal:** Minimize cognitive load while maximizing information density.
- **Tone:** Professional, reliable, and precise.
- **Visual Language:** Sharp edges, subtle depth, and intentional use of color to signal system status (Critical, Warning, Success).

## Colors

The color palette is rooted in **Deep Slate (#0F172A)** to provide a stable, professional foundation. The background uses a cool **Light Gray/Blue (#F8FAFC)** to reduce eye strain during long shifts. 

Functional signaling is strictly enforced:
- **Emerald Green (#10B981):** Used for "Success" states, active orders, and positive financial trends.
- **Amber (#F59E0B):** Reserved for "Warning" states like low stock or late shift arrivals.
- **Red (#EF4444):** Dedicated to "Critical" issues such as out-of-stock inventory or canceled transactions.

High contrast is maintained between text and background to ensure readability in the varied lighting conditions of restaurant front-of-house and back-of-house environments.

## Typography

This design system uses **Inter** exclusively to take advantage of its exceptional legibility and modern, neutral tone. 

- **Data Tables:** Use the `mono-data` role which enables tabular num features, ensuring that columns of prices and quantities align perfectly for easier scanning.
- **Headlines:** Keep weights bold to anchor sections of the dashboard.
- **Labels:** Small labels use increased letter-spacing and uppercase styling for "Critical" or "Low" tags to ensure they are distinct from body text.
- **Hierarchy:** Primary emphasis is placed on numerical values (Revenue, Quantities) through increased font weight.

## Layout & Spacing

The design system utilizes a **Fixed Grid** for the primary dashboard and a **Fluid Content Area**. 

- **Sidebar:** A fixed, collapsible sidebar (260px) anchors the navigation on the left. On tablet, this collapses to an icon-only view (72px).
- **KPI Grid:** A 4-column layout on desktop, reflowing to 2 columns on tablet and 1 on mobile.
- **Data Tables:** High-density spacing with 8px vertical padding per row to maximize the number of visible records (orders/inventory).
- **POS Interface:** Switches to a specialized layout with `touch-target-min` of 44px for all buttons to accommodate rapid, tactile input on tablets or touch-screens.
- **Breakpoints:** 
  - Mobile: < 768px (Switch to bottom nav).
  - Tablet: 768px - 1280px (Collapsible sidebar).
  - Desktop: > 1280px (Standard expanded view).

## Elevation & Depth

Visual hierarchy is established through **Tonal Layering** rather than heavy shadows, maintaining a clean, "flat-plus" aesthetic.

- **Level 0 (Background):** `#F8FAFC` - The canvas.
- **Level 1 (Cards/Sidebar):** `#FFFFFF` - Primary containers with a subtle 1px border of `#E2E8F0`.
- **Level 2 (Modals/Popovers):** Surface white with a soft, neutral shadow (Blur: 12px, Opacity: 0.05, Color: `#0F172A`) to indicate temporary interaction layers.
- **Active States:** Subtle inset shadows or color fills (Emerald Green) denote selected items in the POS grid or active navigation links.

Avoid heavy blurs or frosted glass effects to ensure maximum performance on lower-spec hardware often used for POS terminals.

## Shapes

The design system adopts a **Soft (0.25rem)** roundedness profile to balance modern aesthetics with efficient use of screen real estate.

- **Standard Elements:** Inputs, buttons, and cards use a 4px radius.
- **Status Tags:** Use a slightly higher `rounded-lg` (8px) to distinguish them as secondary UI elements (e.g., "Critical" chips).
- **POS Product Cards:** Maintain the 4px radius to ensure a tight, professional grid layout that maximizes the number of products visible on one screen.

## Components

### Buttons & Inputs
- **Primary Action:** Solid `#0F172A` with white text.
- **POS Buttons:** Large, high-contrast buttons for "Pay" or "Add Item". Minimum height of 48px for POS-specific actions.
- **Inputs:** Clean white backgrounds with 1px border. Focus state uses a 2px Emerald Green ring.

### Chips & Status Indicators
- **Severity Levels:** 
  - *Critical:* Red background (10% opacity) with Red bold text.
  - *Warning:* Amber background (10% opacity) with Amber bold text.
  - *Success/Low:* Emerald background (10% opacity) with Emerald bold text.
- Use these for Inventory levels and Order status.

### Data Tables
- Use a "Zebra Stripe" or subtle border-bottom approach for rows.
- Header row is sticky and uses a light grey tint (`#F1F5F9`).

### KPI Cards
- Feature a large `display-lg` metric and a smaller trend indicator (`+12.5%`).
- Trend indicators should be color-coded (Green for growth, Red for loss).

### Real-Time Activity Feed
- Compact list items with a vertical timeline thread on the left.
- Time stamps use `label-sm` in `text-muted`.

### Branch Selector
- A persistent dropdown in the header or top-left of the content area. Should allow for "Select All" or individual branch filtering.