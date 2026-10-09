export default function Loading() {
  return (
    <div className="space-y-12" aria-busy>
      <div className="space-y-3">
        <div className="skeleton h-4 w-40" />
        <div className="skeleton h-10 w-72 max-w-full" />
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card space-y-3">
            <div className="skeleton h-4 w-32" />
            <div className="skeleton h-8 w-16" />
          </div>
        ))}
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card space-y-4">
            <div className="skeleton size-10" />
            <div className="skeleton h-5 w-3/4" />
            <div className="skeleton h-4 w-1/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
