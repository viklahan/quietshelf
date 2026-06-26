Button is QFC's typewriter-stamp button: mono, uppercase, letterspaced. One primary (ember) per view — everything else is secondary, ghost, or danger.

```jsx
<Button size="lg" icon="sparkles">Map My Visuals</Button>
<Button variant="secondary" icon="copy">Copy for Notion</Button>
<Button variant="ghost">Cancel</Button>
<Button variant="danger" icon="rotate-ccw">Start a new script</Button>
```

Variants: primary, secondary, ghost, danger. Sizes: sm, md, lg (lg only for the single main CTA). `icon` / `iconAfter` take Icon names.
