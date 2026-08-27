The core discovery unit — used in the homepage featured row, listing grid, search results, and category/city pages. Lifts with a stronger shadow on hover, never a border.

```jsx
<EventCard
  image="/events/jazz-night.jpg"
  category="Music"
  title="Jazz Night at The Terrace"
  date="Sat, 12 Jul"
  city="Mumbai"
  priceFrom="₹799"
  onClick={() => openEvent(id)}
/>
<EventCard title="Sold-out Comedy Night" date="Fri, 4 Jul" city="Delhi" priceFrom="₹499" soldOut />
```

No `image` renders a neutral placeholder tile with a photo icon — swap in real event photography before shipping; imagery is the hero on every discovery screen.
