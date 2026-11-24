---
name: crypto-lab-ui
description: Crypto Lab Academic Developer Workspace UI/UX design skill and guidelines for Next.js, RTL Arabic layouts, LTR code blocks, dark/light themes, and interactive cryptography workspaces.
---

# Crypto Lab UI/UX Design Skill

## Design Identity
Build a modern academic developer workspace for cryptography and steganography education.
Use Next.js, TypeScript, Tailwind CSS, shadcn/ui, and Lucide icons.

## Mandatory Rules
- Preserve all existing scientific content and algorithm implementations.
- Support Arabic RTL layouts and LTR code blocks.
- Support light, dark, and system themes.
- Use consistent semantic design tokens and reusable components.
- Avoid unnecessary gradients, excessive animations, and visual clutter.
- Ensure mobile-first responsive layouts.
- Follow WCAG 2.2 AA accessibility guidelines.

## Algorithm Pages
- Every algorithm page must use the shared AlgorithmLayout component.
- Include the existing scientific explanation, technical specifications, podcast player, code workspace, practical demonstrations, and available downloads.

## Code Workspace
- Display vertical code tabs on the right (in RTL).
- Display only the selected code panel.
- Support Python and JavaScript where available.
- Include syntax highlighting, line numbers, copy, download, search, and fullscreen controls.
- Never replace original working implementations with generated examples.

## Podcast Player
- Never autoplay.
- Never preload audio or audio metadata.
- Assign the audio source only after explicit user interaction.
- Do not call Gemini from the student's browser.
- Display metadata from a lightweight local manifest.
- Reuse previously generated audio.

## Quality Assurance
Before completing a UI task, verify both themes, mobile responsiveness, keyboard accessibility, RTL alignment, network requests, and preservation of existing functionality.
