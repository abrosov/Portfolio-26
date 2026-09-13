# Portfolio '26

Personal portfolio of Alex Abrosov — Design Engineer, Barcelona. A static site
built from the Figma design: home, five case studies and a contact page.

Current version: **0.1.0** — see [CHANGELOG.md](CHANGELOG.md).

## Stack

- [Astro](https://docs.astro.build) — static output, no client framework
- Plain CSS with design tokens; vanilla JS only where motion needs it
- Self-hosted fonts: Helvetica Now Display (licensed) and Playfair Display
- Deployed to Vercel

## Commands

| Command           | Action                                       |
| :---------------- | :------------------------------------------- |
| `npm install`     | Install dependencies                          |
| `npm run dev`     | Start the dev server at `localhost:4321`      |
| `npm run build`   | Build the production site to `./dist/`        |
| `npm run preview` | Preview the production build locally          |

Requires Node 22.12 or newer.

## Structure

```text
src/
├── layouts/         BaseLayout (shared shell) and CaseLayout
├── components/      Header, footer, section title, case feature, image
├── pages/
│   ├── index.astro  Home
│   ├── contact.astro
│   └── cases/       Five case studies on one shared template
└── styles/
    ├── tokens.css   Design tokens — colours, type, spacing, motion
    ├── global.css   Reset, text styles, 12-column grid, scroll reveal
    └── case.css     Shared case study rhythm and column placement
public/
├── fonts/           Self-hosted woff2
└── images/          Case imagery, exported from Figma
```

## Conventions

- **Tokens first.** Colours, type styles, spacing and motion values belong in
  `tokens.css`. Components reference variables; they never hardcode a value.
- **One case template.** Every case study shares `CaseLayout` and `case.css`, so
  section rhythm changes in one place rather than five.
- **Grid.** Twelve columns on desktop, six below 1180px, two below 768px, driven by
  `--grid-columns`.
- **Motion.** CSS transitions plus small vanilla JS. Everything respects
  `prefers-reduced-motion`.

## Versioning

Releases follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html) and are
tagged in git. [CHANGELOG.md](CHANGELOG.md) records what shipped in each one and how
to inspect or roll back to a previous release.
