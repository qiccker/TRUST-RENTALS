import { Input } from "../ui/Field";
function CustomerInfoForm({ value, onChange }) {
  return <div className="grid gap-4 md:grid-cols-2">
      <Input
    label="Full name"
    value={value.customerName}
    onChange={(event) => onChange({ ...value, customerName: event.target.value })}
    autoComplete="name"
    required
  />
      <Input
    label="Email"
    type="email"
    value={value.customerEmail}
    onChange={(event) => onChange({ ...value, customerEmail: event.target.value })}
    autoComplete="email"
    required
  />
      <Input
    label="Phone"
    value={value.customerPhone}
    onChange={(event) => onChange({ ...value, customerPhone: event.target.value })}
    autoComplete="tel"
    className="md:col-span-2"
  />
    </div>;
}
export {
  CustomerInfoForm
};
