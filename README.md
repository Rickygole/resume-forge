# Resume Forge

Paste a job description, get a prompt carrying the whole verified corpus, run it
in Claude, paste the JSON back, and print a PDF in the exact layout the
`career-ops/resume-build` pipeline produces.

Static site. No server, no API key, no network calls at runtime. Everything
happens in the browser, so nothing you paste is uploaded anywhere.

## Why it is shaped this way

The resume layout is not cosmetic. The CSS in `public/resume.css` is ported
verbatim from `build.py`, so printing from Chrome goes through the same renderer
with the same stylesheet and lands on the same page geometry.

The prompt carries the rules that took a long time to learn: no invented
numbers, capability prose is not accomplishment, three first-author papers not
four, scope disclosures below the bullets, and XYZ as a content spec rather than
a grammar template, because uniform `, by` phrasing is what makes a page read as
machine written.

## The gates

After rendering, the page runs the mechanical checks:

- em and en dashes, and any non-ASCII character
- a forbidden-claims list covering production, on-call, tools he has never used,
  and the two Bias Lab figures no source supports
- publication authorship, including the Prescriptive Persistence author order
- bullet count, median and maximum word length
- the share of bullets carrying no `, by` clause, targeting 25 to 55 percent
- distinct opening verbs and the most-repeated one
- measured page count against the target

Hyphenated tokens are wrapped in nowrap spans automatically, which is what stops
`pdftotext -raw` welding two words together across a line break.

## Corpus

`corpus/` holds the master CV text and the READMEs of the **public** project
repos. The private repos are excluded on purpose, since this site is public.
Facts from those go in the extra-instructions box by hand.

Refresh after updating the master CV or any README:

```bash
python3 tools/build-corpus.py
```

## Printing

Chrome's print dialog: margins **None**, background graphics **off**, headers
and footers **unchecked**. The `@page` rule supplies the real margins.

## Local run

```bash
python3 -m http.server 8080 --directory public
```
