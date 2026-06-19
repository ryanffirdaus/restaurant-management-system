interface SectionProps {
  title: string
  children: React.ReactNode
}

export default function Section({ title, children }: SectionProps) {
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
