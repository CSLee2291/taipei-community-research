import database from "./data/wanhua-community-associations.json";
import { WanhuaDashboard, type Database } from "./components/WanhuaDashboard";

export default function Home() {
  return <WanhuaDashboard database={database as Database} />;
}
