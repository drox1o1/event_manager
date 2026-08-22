Generic sortable-looking table used for attendee lists, transaction records, organiser/event management. Pass a `render` per column for badges, avatars, or formatted values.

```jsx
<DataTable
  columns={[{ key: 'name', label: 'Attendee' }, { key: 'status', label: 'Status', render: r => <Badge status={r.status} /> }]}
  rows={attendees}
  actions={{ onClick: openRow }}
/>
```
