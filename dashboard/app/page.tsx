import database from "./data/wanhua-community-associations.json";
import activities from "./data/wanhua-community-activities.json";
import sdgCandidates from "./data/wanhua-community-sdg-candidates.json";
import { WanhuaDashboard, type ActivityStatistics, type Database, type SDGCandidateStatistics } from "./components/WanhuaDashboard";

export default function Home() {
  return <WanhuaDashboard database={database as Database} activities={activities as ActivityStatistics} sdgCandidates={sdgCandidates as SDGCandidateStatistics} googleMapsApiKey={process.env.GOOGLE_MAPS_API_KEY} />;
}
