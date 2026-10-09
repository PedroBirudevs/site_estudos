export default function Loading() {
  return (
    <div className="space-y-8" aria-busy>
      <div className="space-y-3">
        <div className="skeleton h-4 w-24" />
        <div className="skeleton h-9 w-64 max-w-full" />
      </div>
      <div className="flex gap-3 border-b border-borda pb-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-6 w-24" />
        ))}
      </div>
      <div className="card space-y-3">
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-5/6" />
        <div className="skeleton h-4 w-2/3" />
      </div>
    </div>
  );
}
