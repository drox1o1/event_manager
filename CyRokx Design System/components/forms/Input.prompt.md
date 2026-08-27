A labeled text field covering the buyer-details and event-creation forms — text, email, phone, number, search and date all share this shell.

```jsx
<Input label="Email" type="email" placeholder="you@email.com" />
<Input icon="search" placeholder="Search events" />
<Input label="Phone" error="Enter a valid phone number" />
```

Focus ring uses `--shadow-focus-ring` (accent-tinted). Error state swaps the border and shows a caption below in `--color-error`. Disabled fills with `--color-muted-bg`.
