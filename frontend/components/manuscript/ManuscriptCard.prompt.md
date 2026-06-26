ManuscriptCard is the signature element — one shot-list segment as an index card: mono segment id + timing, oxblood index-card rule, the script excerpt typeset generously, mood stamp, clock duration, three ranked SearchChips, and a FoundCheckbox. When `found`, the card fades and gets a rotated ember "found" stamp.

```jsx
<ManuscriptCard
  index={3}
  startTime="0:42"
  endTime="1:05"
  excerpt="The city empties out after midnight, and that's when the real work begins."
  mood="tense"
  clipDurationSeconds={9}
  terms={['empty city street night', 'desk lamp writing', 'rain on window']}
  found={found}
  onFoundChange={setFound}
/>
```

Stack cards in a single column with `gap: var(--space-4)`. The kit's deal-in animation is applied by the parent via `style={{ animationDelay }}`.
