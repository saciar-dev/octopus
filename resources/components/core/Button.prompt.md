Pill or circular action button used for primary actions, and small round icon actions (play, back, refresh, "Go") in the Speaker Preview Manager kiosk UI.

```jsx
<Button variant="primary" size="lg" shape="circle"><PlayIcon/></Button>
<Button variant="navy">Go</Button>
<Button variant="outline" size="sm">Cancel</Button>
```

Variants: `primary` (bright blue, brand accent, drop shadow — main CTA), `navy` (brand navy fill), `outline` (accent border, transparent fill), `ghost` (soft blue background, navy text — low-emphasis). Shapes: `pill` (default, text buttons) or `circle` (icon-only, used for nav/back/play controls). Hover brightens slightly; press scales down to 0.96 — no color-darkening states in source.
