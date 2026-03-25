# BenchBuddy Design

## Figma

**Main design file**: [Padres Tickets — Figma](https://www.figma.com/design/7Flm8oSNkfYT78MLs0U8Zc/Padres-Tickets?node-id=138-110&t=2aGdKIn8uThHZJ3a-1)

## Design Branch Workflow

This `design` branch is dedicated to UI/UX implementation work. It is based on the `benchbuddy-rewrite` branch (Next.js + React + TypeScript + Tailwind CSS v4).

### Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS v4
- **Typography**: DM Sans (Google Fonts)
- **Design tokens**: Defined in `src/app/globals.css`

### Key UI Files

| Path | Purpose |
|---|---|
| `src/app/globals.css` | Design tokens, Tailwind theme, global styles |
| `tailwind.config.ts` | Tailwind configuration |
| `src/app/layout.tsx` | Root layout, fonts, providers |
| `src/app/dashboard/` | Dashboard pages |
| `src/app/(auth)/` | Login and signup pages |
| `src/components/` | Reusable UI components |
