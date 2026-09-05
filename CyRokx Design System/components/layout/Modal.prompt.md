Dialog shell for confirm/form/detail modals — moderation reject reason, delete-event confirm, ticket detail.

```jsx
<Modal title="Reject event?" onClose={close} footer={<><Button variant="ghost" onClick={close}>Cancel</Button><Button variant="destructive">Reject</Button></>}>
  <Textarea label="Reason" placeholder="Let the organiser know what to fix" />
</Modal>
```
