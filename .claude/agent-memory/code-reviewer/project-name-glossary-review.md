---
name: project-name-glossary-review
description: English-names glossary (content/i18n/names) review 25/10/2026 — client chunks with harvested content trip security:dist; lesson labels vs untranslated prompts
metadata:
  type: project
---

Any new client-shipped content chunk (e.g. the name glossary, `names-glossary-*.js`) is scanned by `pnpm security:dist`, which runs only after a web build on CI, not in `content:check`. On 25/10/2026 the glossary harvested quest step `label`s, and one label contained another quest's answer text, so the mobile CI went red.

**Why:** `questSecrets` does substring matching on answer text of 16+ characters. Harvesting lesson labels into a shared client file collides with it.

**How to apply:**
- When reviewing a new client-side content bundle, run `questSecrets` against it yourself, and check the mobile workflow (`gh run list`).
- In English mode, lesson prompts without an `en` twin stay Vietnamese. Flag any change that translates the answer labels of such steps (mixed-language questions).
- Grading compares answers by id, so translating a label never changes the grading.
