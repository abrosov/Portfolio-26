## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## Project conventions

Personal portfolio for Alex (Design Engineer). Built from Figma designs; pixel-perfect UI recreation is a priority.

- **Stack**: Astro (static), plain CSS, vanilla JS only where needed. No extra libraries without discussion.
- **Design tokens**: all colors, spacing, and type styles live in `src/styles/tokens.css` as CSS variables, rebuilt from Figma text/color tokens. Never hardcode values in components.
- **Fonts**: Playfair Display (self-hosted, Google Fonts) + Helvetica Now Display (licensed; files provided by Alex, self-hosted in `public/fonts/`).
- **Structure**: `src/layouts/BaseLayout.astro` is the shared shell; shared UI (nav, footer) in `src/components/`; case studies share one consistent structure/spacing.
- **Pages**: Home, 4 case study pages (same template, some sections optional), contact form.
- **Case studies**: four pages in `src/pages/cases/` — `climate-tech-viewer`, `blockchain-products`
  (one page carrying Custodial Keeper, Linear Marketplace and Unwind X, each with its own anchor),
  `ai-test-optimizer` and `cognitive-structuring`. Built on `CaseLayout.astro`. All shared spacing and
  column placement lives in `src/styles/case.css` so the four pages stay consistent — put section
  rhythm there, not in a page. `CaseFeature.astro` renders a "Solution Details" panel.
- **Case transitions**: both scroll effects are `position: sticky; top: 0` with an opaque background.
  The start screen pins inside `.case-opening` while the full-bleed screen slides over it; the
  `.feature-stack` panels each pin in turn so the next slides over the last. Sticky sections need a
  bounding wrapper, or they stay pinned for the whole page and show through later sections.
- **Contact form**: posts to a form service (Formspree/Web3Forms) — no backend.
- **Animations**: CSS transitions + small vanilla JS (e.g. IntersectionObserver for scroll reveals). Mobile reference: https://bndigital.co/en-gb/cases/catch-brand-identity-platform (desktop-only Figma).
- **Deploy target**: Vercel via GitHub.
