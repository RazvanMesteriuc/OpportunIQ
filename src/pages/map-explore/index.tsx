import { PublicLayout } from "@/components/layout/public-layout";
import { QuickExploreMap } from "@/components/maps/quick-explore-map";

export default function MapExplorePage() {
  return (
    <PublicLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Explorare rapidă pe hartă</h1>
          <p className="text-sm text-slate-600">
            Instrument secundar de orientare vizuală pentru densitatea de oportunități pe zone. Nu înlocuiește feed-ul principal.
          </p>
        </div>
        <QuickExploreMap />
      </div>
    </PublicLayout>
  );
}
