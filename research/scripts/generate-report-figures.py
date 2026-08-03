import json
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt


ROOT = Path(__file__).resolve().parents[2]
DATABASE_PATH = ROOT / "data" / "processed" / "wanhua-community-associations.json"
OUTPUT = ROOT / "report" / "output" / "figures"

with DATABASE_PATH.open(encoding="utf-8") as handle:
    database = json.load(handle)

OUTPUT.mkdir(parents=True, exist_ok=True)
plt.rcParams.update({"font.family": "DejaVu Sans", "axes.spines.top": False, "axes.spines.right": False})

decades = database["quality_summary"]["establishment_decade_counts"]
fig, ax = plt.subplots(figsize=(8, 4.5), constrained_layout=True)
ax.bar([f"{year}s" for year in decades], list(decades.values()), color="#145c4f")
ax.set_title("Known establishment records by decade")
ax.set_ylabel("Associations")
ax.grid(axis="y", color="#d4ccbe", linewidth=0.8)
for extension in ("png", "svg"):
    fig.savefig(OUTPUT / f"establishment-decades.{extension}", dpi=180, facecolor="#f2eee6")
plt.close(fig)

quality = database["quality_summary"]
labels = ["Coordinates", "Established date", "Registration", "Complete core"]
values = [quality["coordinate_records"], quality["establishment_date_records"], quality["registration_number_records"], quality["complete_core_records"]]
fig, ax = plt.subplots(figsize=(8, 4.5), constrained_layout=True)
bars = ax.barh(labels, values, color=["#145c4f", "#c6922c", "#b64e3b", "#182620"])
ax.set_xlim(0, database["coverage"]["record_count"])
ax.set_title("Core field coverage")
ax.set_xlabel(f"Records (n={database['coverage']['record_count']})")
ax.grid(axis="x", color="#d4ccbe", linewidth=0.8)
ax.bar_label(bars, padding=4)
for extension in ("png", "svg"):
    fig.savefig(OUTPUT / f"data-coverage.{extension}", dpi=180, facecolor="#f2eee6")
plt.close(fig)

print(json.dumps({"status": "generated", "figures": 4}, indent=2))
