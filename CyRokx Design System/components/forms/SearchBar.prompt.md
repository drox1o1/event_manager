The two-field search used in the homepage hero (over the featured image) and collapsed into the sticky nav on scroll/listing pages.

```jsx
<SearchBar keyword={q} onKeywordChange={e => setQ(e.target.value)} location={city} onLocationChange={e => setCity(e.target.value)} onSubmit={runSearch} />
```
