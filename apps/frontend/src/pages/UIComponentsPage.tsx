import { useOutletContext } from 'react-router-dom'
import type { LayoutContext } from '../App'
import {
  Button,
  TextInput,
  Textarea,
  Select,
  Combobox,
  Toggle,
  Checkbox,
  Radio,
  FileUpload,
} from '../components/ui'
import AppFooter from '../components/AppFooter'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-surface/40 border border-surface-variant rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-text-main mb-6 flex items-center gap-2">
        <span className="w-1.5 h-6 bg-primary rounded-full" />
        {title}
      </h3>
      {children}
    </section>
  )
}

export default function UIComponentsPage() {
  useOutletContext<LayoutContext>()

  return (
    <div>
      <div className="h-16" />
      <div className="p-container-margin space-y-gutter">
        <div className="mb-4">
          <h2 className="text-3xl font-bold text-text-main mb-2">
            Servio UI Component Library
          </h2>
          <p className="text-text-muted max-w-2xl">
            A comprehensive guide to the restaurant management system design system.
            High-performance components with emerald accents.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          <Section title="Text Inputs & Messaging">
            <div className="space-y-4">
              <TextInput label="Default Input" placeholder="Enter your name..." />
              <TextInput
                label="Focus Input (Active)"
                value="Active typing..."
                autoFocus
              />
              <TextInput label="Disabled Input" value="Disabled Input" disabled />
            </div>
            <div className="mt-4">
              <Textarea label="Textarea (Notes)" placeholder="Enter detailed notes here..." rows={5} />
            </div>
          </Section>

          <Section title="Select & Combobox">
            <p className="text-xs text-text-muted mb-5 -mt-2">
              <span className="text-primary font-semibold">Select</span> — single-select with search &nbsp;|&nbsp;
              <span className="text-primary font-semibold">Combobox</span> — multi-select with search &amp; checkboxes
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className="block text-sm font-medium text-text-muted mb-4">Select (single, searchable)</p>
                <Select
                  placeholder="Select Option"
                  options={[
                    { value: 'table-1', label: 'Table 1' },
                    { value: 'table-2', label: 'Table 2' },
                    { value: 'table-3', label: 'Table 3' },
                    { value: 'table-4', label: 'Table 4' },
                    { value: 'table-5', label: 'Table 5' },
                    { value: 'table-6', label: 'Table 6' },
                  ]}
                />
              </div>
              <div>
                <p className="block text-sm font-medium text-text-muted mb-4">Combobox (multi-select, searchable)</p>
                <Combobox
                  placeholder="Select tables..."
                  options={[
                    { value: 'table-1', label: 'Table 1' },
                    { value: 'table-2', label: 'Table 2' },
                    { value: 'table-3', label: 'Table 3' },
                    { value: 'table-4', label: 'Table 4' },
                    { value: 'table-5', label: 'Table 5' },
                    { value: 'table-6', label: 'Table 6' },
                  ]}
                />
              </div>
            </div>
          </Section>

          <Section title="Action Buttons">
            <div className="flex flex-wrap gap-4">
              <Button variant="primary">Primary Action</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline Button</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="primary" disabled>Disabled</Button>
            </div>
            <div className="mt-8 flex gap-6 items-center">
              <Toggle label="Toggle On" defaultChecked />
              <Toggle label="Toggle Off" />
            </div>
          </Section>

          <Section title="Selection Controls">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <p className="text-sm font-medium text-text-muted mb-4">Checkboxes</p>
                <Checkbox label="Remember me" defaultChecked />
                <Checkbox label="Email notifications" />
                <Checkbox label="Disabled state" disabled defaultChecked />
              </div>
              <div className="space-y-4">
                <p className="text-sm font-medium text-text-muted mb-4">Radio Buttons</p>
                <Radio name="options" label="Option A" defaultChecked />
                <Radio name="options" label="Option B" />
                <Radio name="options" label="Option C" />
              </div>
            </div>
          </Section>

          <Section title="Real-time Validation">
            <div className="space-y-6">
              <TextInput
                label="Item Name"
                hint="Required"
                value="Truffle Risotto"
                validation="valid"
                validationMessage="Valid"
              />
              <Select
                label="Category"
                hint="Required"
                placeholder="Select Category"
                options={[
                  { value: 'appetizer', label: 'Appetizer' },
                  { value: 'main', label: 'Main Course' },
                  { value: 'dessert', label: 'Dessert' },
                ]}
                validation="error"
                validationMessage="Please select a category"
              />
              <TextInput
                label="Price"
                hint="$"
                value="95.00"
                validation="warning"
                validationMessage="Price seems high for this category"
              />
            </div>
          </Section>

          <Section title="Assets & Pickers">
            <div className="space-y-6">
              <FileUpload />
            </div>
          </Section>
        </div>

        <div className="flex justify-end gap-4 p-6 bg-surface/20 border border-surface-variant rounded-2xl">
          <Button variant="secondary">Cancel Changes</Button>
          <Button variant="primary">Save UI Library Configuration</Button>
        </div>

        <AppFooter />
      </div>
    </div>
  )
}
