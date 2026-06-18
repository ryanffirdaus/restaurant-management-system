export default function AppFooter() {
  return (
    <footer className="p-container-margin border-t border-outline mt-8">
      <div className="flex justify-between items-center opacity-40">
        <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
          System Status: Operational • v2.4.1
        </p>
        <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
          Last Sync: {new Date().toLocaleTimeString()}
        </p>
      </div>
    </footer>
  )
}
