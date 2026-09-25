> **DEPRECATED** — This file is superseded by `CLAUDE.md`. Issues, session log, and project metadata now live in CLAUDE.md. This file is retained as a historical archive only.

# AGENTS.md

Inherits root rules from `/Users/daverobertson/Desktop/Code/AGENTS.md`.

## Project Overview

Interactive visual map of an SDLC tool stack. Displays tools organized by development lifecycle phase with a hero section, category panels, and a search/filter system. Two HTML files exist: index.html (GitHub Pages entry) and sdlc_tool_stack_map.html (original source copy).

## Stack

- Static HTML + inline CSS + inline JS (single file)
- GitHub Pages hosting
- No build step, no bundler, no framework

## Key Decisions

- Single file architecture; all data, styles, and logic inline
- Dark theme with blue/mint accent palette
- Tools organized by SDLC phase with search and filter

## Issue Tracker

| ID | Severity | Status | Title | Notes |
|----|----------|--------|-------|-------|

## Session Log

[2026-03-18] [SDLCMap] [docs] Add AGENTS baseline

## Status naming

Name work with one string everywhere (chat status title, session title, Notion
Status Check Runs "Human Name"):

`Project | 🚦 | Phase | Title → state, reason | MM-DD`

- 🚦: 🟢 complete and verified · 🟡 partial · 🔴 not started, blocked or failed · ⚪ unverifiable.
  Add ⏳ scheduled, 🙋 awaiting Dave or 🚧 blocked to 🟡/🔴/⚪, never to 🟢.
- Phase: Research, Design, Build, Audit or Scheduled. MM-DD: date of the latest light change.
- Every light change gets a new name: a `RENAME:` line in chat and the Notion row updated.
- Canonical source: https://github.com/DaveHomeAssist/skills/blob/master/status-naming.md
