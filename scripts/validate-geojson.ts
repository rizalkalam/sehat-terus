import * as fs from 'fs';
import * as path from 'path';

const geojsonPath = path.join(__dirname, '../frontend/public/geojson/sleman-kecamatan.geojson');

const expectedKecamatan = [
  'Turi', 'Pakem', 'Cangkringan', 'Tempel', 'Sleman', 'Ngaglik',
  'Ngemplak', 'Minggir', 'Seyegan', 'Mlati', 'Moyudan', 'Godean',
  'Gamping', 'Depok', 'Kalasan', 'Berbah', 'Prambanan'
];

function validate() {
  console.log(`Starting validation for: ${geojsonPath}`);
  
  if (!fs.existsSync(geojsonPath)) {
    console.error('FAIL: GeoJSON file does not exist!');
    process.exit(1);
  }

  const rawData = fs.readFileSync(geojsonPath, 'utf8');
  let data: any;
  try {
    data = JSON.parse(rawData);
  } catch (e: any) {
    console.error('FAIL: GeoJSON is not valid JSON!', e.message);
    process.exit(1);
  }

  if (data.type !== 'FeatureCollection') {
    console.error(`FAIL: Expected type to be "FeatureCollection", got "${data.type}"`);
    process.exit(1);
  }

  if (!Array.isArray(data.features)) {
    console.error('FAIL: "features" is not an array!');
    process.exit(1);
  }

  console.log(`Found ${data.features.length} features.`);

  const foundNames: string[] = [];

  for (let i = 0; i < data.features.length; i++) {
    const feature = data.features[i];
    
    if (feature.type !== 'Feature') {
      console.error(`FAIL: Feature at index ${i} is not of type "Feature"`);
      process.exit(1);
    }

    if (!feature.properties || typeof feature.properties.name !== 'string') {
      console.error(`FAIL: Feature at index ${i} lacks a valid properties.name string`);
      process.exit(1);
    }

    const name = feature.properties.name;
    foundNames.push(name);

    if (!expectedKecamatan.includes(name)) {
      console.error(`FAIL: Unexpected kecamatan name: "${name}"`);
      process.exit(1);
    }

    if (!feature.geometry || feature.geometry.type !== 'Polygon') {
      console.error(`FAIL: Feature "${name}" geometry is not a Polygon`);
      process.exit(1);
    }

    const coordinates = feature.geometry.coordinates;
    if (!Array.isArray(coordinates) || coordinates.length === 0) {
      console.error(`FAIL: Feature "${name}" has invalid coordinates array`);
      process.exit(1);
    }

    // Verify outer ring
    const ring = coordinates[0];
    if (!Array.isArray(ring) || ring.length < 4) {
      console.error(`FAIL: Feature "${name}" outer ring must have at least 4 coordinates`);
      process.exit(1);
    }

    // Check bounds
    for (const coord of ring) {
      if (!Array.isArray(coord) || coord.length < 2) {
        console.error(`FAIL: Feature "${name}" coord is not [long, lat]`);
        process.exit(1);
      }
      const [lon, lat] = coord;
      if (typeof lon !== 'number' || typeof lat !== 'number') {
        console.error(`FAIL: Coordinates must be numbers: [${lon}, ${lat}]`);
        process.exit(1);
      }

      // Sleman is approx Lon: 110.2 to 110.5, Lat: -7.85 to -7.50
      if (lon < 110.1 || lon > 110.6 || lat < -7.9 || lat > -7.4) {
        console.error(`FAIL: Coordinates out of bounds for Sleman: [${lon}, ${lat}]`);
        process.exit(1);
      }
    }

    // First and last coordinate of the polygon must be identical
    const first = ring[0];
    const last = ring[ring.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      console.error(`FAIL: Polygon for "${name}" is not closed. First: ${first}, Last: ${last}`);
      process.exit(1);
    }
  }

  // Check if all expected kecamatan are present
  for (const name of expectedKecamatan) {
    if (!foundNames.includes(name)) {
      console.warn(`WARNING: Missing expected kecamatan: "${name}"`);
    }
  }

  console.log('SUCCESS: GeoJSON is valid and fits Sleman boundaries!');
}

validate();
