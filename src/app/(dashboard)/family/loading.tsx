/**
 * Skeleton for /family while the server component resolves its data.
 *
 * Without this file Next.js shows a blank screen between the user
 * clicking the "Our Family" / "Our Circle" nav and the server-rendered
 * page arriving — which felt like the button wasn't responding on
 * mobile and was noticeably laggy on desktop. The skeleton mirrors
 * the real layout so the transition looks like progressive reveal
 * rather than a jarring pop-in.
 */
export default function FamilyHubLoading() {
  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto animate-pulse">
      {/* Hero block */}
      <section className="relative rounded-2xl overflow-hidden shadow-sm border bg-[#2C4835] dark:bg-green-950">
        <div className="grid grid-cols-1 md:grid-cols-2 min-h-[260px] md:min-h-[400px]">
          <div className="bg-[#2C4835]/80 min-h-[240px] md:min-h-full" />
          <div className="p-8 md:p-10 flex flex-col gap-5">
            <div className="h-4 w-20 rounded bg-white/10" />
            <div className="h-10 w-56 rounded bg-white/15" />
            <div className="space-y-2">
              <div className="h-3 w-full rounded bg-white/10" />
              <div className="h-3 w-3/4 rounded bg-white/10" />
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <div className="h-9 w-28 rounded-full bg-white/15" />
              <div className="h-9 w-32 rounded-full bg-white/15" />
              <div className="h-9 w-24 rounded-full bg-white/15" />
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-6 w-44 rounded bg-muted" />
          <div className="h-6 w-24 rounded bg-muted" />
        </div>
        <div className="rounded-xl border bg-card/60 min-h-[180px]" />
      </section>

      {/* Our Traditions */}
      <section className="space-y-4">
        <div className="h-6 w-40 rounded bg-muted" />
        <div className="rounded-xl border bg-card/60 h-28" />
      </section>

      {/* Goals */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-6 w-32 rounded bg-muted" />
          <div className="h-6 w-20 rounded bg-muted" />
        </div>
        <div className="rounded-xl border bg-card/60 h-24" />
      </section>

      {/* Feature cards */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-xl border bg-card p-5 space-y-3 min-h-[140px]"
          >
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-lg bg-muted" />
              <div className="h-4 w-16 rounded bg-muted" />
            </div>
            <div className="h-5 w-32 rounded bg-muted" />
            <div className="h-8 w-full rounded-md bg-muted" />
          </div>
        ))}
      </section>
    </div>
  );
}
