# Chinmay Mahananda — Portfolio

Personal portfolio site for Chinmay Mahananda — Silicon & ML Systems Engineer, MS ECE at Northeastern University. Built to showcase work in VLSI design, systolic-array hardware accelerators, and machine learning systems.

**Live:** [https://chinmaymahananda.github.io](https://chinmaymahananda.github.io)

---

## Key features

- **Interactive systolic-array skill matrix** — a 4x4 processing-element grid representing technical competencies; hovering a node propagates a data-bus wave to its row/column and surfaces detail on that skill.
- **Interactive hardware simulators** — an 8-bit ALU stepper (`ADD`/`SUB`/`AND`/`OR`/`XOR` with flag outputs), an INT8 MAC accumulator stepper, and a guided PCB bring-up/debug walkthrough.
- **Terminal-style verification panel** — a simulated CLI that runs through RTL/Verilog compilation and testbench output, styled after a hardware bring-up log.
- **Animated background canvas** — an HTML5 Canvas layer drawing PCB-style orthogonal trace routing between floating points.

## Tech stack

- **Core:** semantic HTML5, vanilla JavaScript (ES6+), HTML5 Canvas API — no framework, no build step.
- **Styling:** vanilla CSS3 with HSL design tokens, glassmorphism panels, responsive grid layouts, and custom keyframe animations. All interactive animations use `transform`/`opacity` rather than layout-affecting properties, for smooth, GPU-composited motion.
- **Design language:** minimalist, Porsche-inspired visual identity — clean surfaces, restrained color, precision typography.
- **SEO:** meta descriptors, Open Graph tags, responsive viewport configuration.

## Structure

```
├── index.html    # markup + content
├── styles.css    # design tokens, layout, animations
└── script.js     # interactivity: cursor tracking, simulators, terminal, matrix hover
```

No build tooling or dependencies — it's a static site, deployed directly via GitHub Pages from `main`.
