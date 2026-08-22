The primary call-to-action control — accent-filled for primary actions, outlined/ghost for secondary, red fill for destructive confirms.

```jsx
<Button variant="primary" size="md">Buy tickets</Button>
<Button variant="secondary">Edit</Button>
<Button variant="ghost" size="sm">Cancel</Button>
<Button variant="destructive">Delete event</Button>
<Button loading>Processing…</Button>
```

Variants: primary, secondary, ghost, destructive. Sizes: sm (32px), md (44px), lg (52px). Only one primary button per view — everything else should be secondary or ghost. `loading` shows a spinner and disables the button; `fullWidth` stretches to the container (used in mobile checkout).
