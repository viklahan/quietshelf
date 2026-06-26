FoundCheckbox is the "Found it" control on manuscript cards — quiet box, ember check that scales in.

```jsx
<FoundCheckbox checked={found} onChange={setFound} />
<FoundCheckbox checked label="Clipped" />
```

Controlled component; renders as a `role="checkbox"` button with visible focus. Pair with the card's done treatment when checked.
