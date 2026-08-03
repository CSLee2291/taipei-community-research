import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const checkOnly = process.argv.includes("--check");
const datasetNames = ["CommunityProfile", "CommunityActivities", "CommunityAwards", "CommunitySDGs", "CommunityFunding", "CommunityAIRanking"];

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') quoted = false;
      else field += character;
    } else if (character === '"') quoted = true;
    else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else field += character;
  }
  assert.equal(quoted, false, "CSV contains an unclosed quoted field");
  if (field || row.length) rows.push([...row, field.replace(/\r$/, "")]);
  return rows;
}

function coerce(value, property, label) {
  if (value === "") return null;
  const types = Array.isArray(property.type) ? property.type : [property.type];
  if (types.includes("boolean")) {
    assert(["true", "false"].includes(value), `${label}: invalid boolean`);
    return value === "true";
  }
  if (types.includes("integer")) {
    const parsed = Number(value);
    assert(Number.isInteger(parsed), `${label}: invalid integer`);
    return parsed;
  }
  if (types.includes("number")) {
    const parsed = Number(value);
    assert(Number.isFinite(parsed), `${label}: invalid number`);
    return parsed;
  }
  return value;
}

const summary = {};
for (const datasetName of datasetNames) {
  const csvPath = path.join(repositoryRoot, "data/csv", `${datasetName}.csv`);
  const jsonPath = path.join(repositoryRoot, "data/json", `${datasetName}.json`);
  const schemaPath = path.join(repositoryRoot, "data/schema", `${datasetName}.schema.json`);
  const [csvText, schemaText, currentText] = await Promise.all([
    fs.readFile(csvPath, "utf8"),
    fs.readFile(schemaPath, "utf8"),
    fs.readFile(jsonPath, "utf8"),
  ]);
  const schema = JSON.parse(schemaText);
  const current = JSON.parse(currentText);
  const [header, ...rows] = parseCsv(csvText);
  const fields = Object.keys(schema.items.properties);
  assert.deepEqual(header, fields, `${datasetName}: CSV header differs from schema`);
  const records = rows.map((row, rowIndex) => Object.fromEntries(fields.map((field, columnIndex) => [
    field,
    coerce(row[columnIndex] ?? "", schema.items.properties[field], `${datasetName} row ${rowIndex + 2} ${field}`),
  ])));
  const publication = {
    dataset: datasetName,
    schema_version: current.schema_version,
    generated_at: checkOnly ? current.generated_at : new Date().toISOString(),
    record_count: records.length,
    records,
  };
  const nextText = `${JSON.stringify(publication, null, 2)}\n`;
  if (checkOnly) assert.equal(nextText, currentText, `${datasetName}.json is not synchronized with its CSV and schema`);
  else await fs.writeFile(jsonPath, nextText, "utf8");
  summary[datasetName] = records.length;
}

console.log(JSON.stringify({ status: checkOnly ? "synchronized" : "exported", datasets: summary }, null, 2));
