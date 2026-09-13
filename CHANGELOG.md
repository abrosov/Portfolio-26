# Changelog

All notable changes to this project are recorded here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Every release is tagged in git, so any version can be inspected or restored — see
[Releases and rollback](#releases-and-rollback) at the bottom of this file.

## [Unreleased]

Nothing yet.

## [0.1.0] — 2026-09-13

First public release: the complete portfolio — home, five case studies and a
contact page — built from the Figma design.

### Added

#### Foundation

- Scaffolded a static Astro site with a token-based structure, where every colour,
  type style and spacing value lives in `src/styles/tokens.css` and nothing is
  hardcoded in a component.
- Self-hosted Helvetica Now Display and Playfair Display, with the headline
  ampersand subset from Playfair to match the calligraphic glyph in the design.
- Drew the decorative background grid behind every page and settled it at 30% opacity.

#### Pages

- Built the home page from the Figma design — hero, selected cases, expertise and
  work experience.
- Added five case study pages — Climate Tech Viewer, HirePeak, AI Test Optimizer,
  Cognitive Structuring and the blockchain products — sharing one layout and one
  spacing scale in `src/styles/case.css`.
- Added the contact page on its own palette, with a Formspree-backed form, field
  state scale and inline validation.

#### Motion

- Revealed content on scroll with an IntersectionObserver, staggering the hero so
  the portrait, headline and statement arrive in sequence.
- Pinned each case study's start screen and solution panels with sticky sections,
  so every screen holds for a beat while the next slides over it.
- Cross-faded the background between pages, and made the sticky header transparent
  over the content it covers.
- Zoomed case imagery on hover inside its clipped frame, only where a pointer can
  actually hover.

#### Responsive

- Stepped the grid from twelve columns to six below 1180px and to two below 768px,
  holding the layout at 450px — the narrowest width the design covers.
- Rebuilt the hero and the case pages for tablet and mobile from the annotated
  mockups, scaling type fluidly and stacking outcomes two-up.
- Switched off the pinned case transitions below 1024px, where there is not enough
  viewport height for them to read.

## Releases and rollback

Each release is tagged `vMAJOR.MINOR.PATCH` on `main`.

```bash
git tag --list                 # every released version
git show v0.1.0                # what a release contains
git checkout v0.1.0            # inspect a release (detached HEAD)
git checkout main              # return to the latest work
```

To undo something after release, prefer a revert — it keeps the history intact and
is itself reversible:

```bash
git revert <commit>            # undo one commit on main
git revert v0.1.0..HEAD        # undo everything published since 0.1.0
```

Resetting the branch back to a tag rewrites history and discards the work after it,
so use it only on unpublished commits:

```bash
git reset --hard v0.1.0
```

### Version policy

- **MAJOR** — a redesign that replaces the current visual language.
- **MINOR** — a new page, case study or section.
- **PATCH** — copy edits, styling corrections and fixes.

[Unreleased]: https://github.com/abrosov/Portfolio-26/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/abrosov/Portfolio-26/releases/tag/v0.1.0
