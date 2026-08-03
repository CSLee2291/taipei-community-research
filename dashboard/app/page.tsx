import database from "./data/wanhua-community-associations.json";
import activities from "./data/wanhua-community-activities.json";
import { WanhuaDashboard, type ActivityStatistics, type Database } from "./components/WanhuaDashboard";

export default function Home() {
  return <WanhuaDashboard database={database as Database} activities={activities as ActivityStatistics} googleMapsApiKey={process.env.GOOGLE_MAPS_API_KEY} />;
}
