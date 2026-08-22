One row per ticket tier (Early Bird, Standard, VIP) inside the event-detail buy panel and checkout summary.

```jsx
<TicketTierRow name="Early Bird" price="₹599" description="First 100 tickets" remaining={12} quantity={qty} onQuantityChange={setQty} />
<TicketTierRow name="VIP" price="₹2,499" available={false} />
```
