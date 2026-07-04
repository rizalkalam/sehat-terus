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

    if (typeof feature.properties.code !== 'string') {
      console.error(`FAIL: Feature at index ${i} lacks a valid properties.code string`);
      process.exit(1);
    }

    const name = feature.properties.name;
    const code = feature.properties.code;

    // Check if code belongs to Jawa Tengah (33) or DIY (34)
    if (!code.startsWith('33.') && !code.startsWith('34.')) {
      console.error(`FAIL: Unexpected province code for "${name}" (${code}). Must start with 33 or 34.`);
      process.exit(1);
    }

    const geomType = feature.geometry?.type;
    if (geomType !== 'Polygon' && geomType !== 'MultiPolygon') {
      console.error(`FAIL: Feature "${name}" geometry is not a Polygon or MultiPolygon, got: ${geomType}`);
      process.exit(1);
    }

    // Extract rings to validate
    const rings: any[][] = [];
    if (geomType === 'Polygon') {
      rings.push(...feature.geometry.coordinates);
    } else {
      for (const poly of feature.geometry.coordinates) {
        if (Array.isArray(poly)) {
          rings.push(...poly);
        }
      }
    }

    if (rings.length === 0) {
      console.error(`FAIL: Feature "${name}" has no coordinate rings`);
      process.exit(1);
    }

    for (const ring of rings) {
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

        // Jawa Tengah & DIY bounds: Lon: 108.0 to 112.5, Lat: -9.0 to -5.0
        if (lon < 108.0 || lon > 112.5 || lat < -9.0 || lat > -5.0) {
          console.error(`FAIL: Coordinates out of bounds for Jateng/DIY: [${lon}, ${lat}] in "${name}" (${code})`);
          process.exit(1);
        }
      }

      // First and last coordinate of the ring must be identical
      const first = ring[0];
      const last = ring[ring.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        console.error(`FAIL: Ring for "${name}" is not closed. First: ${first}, Last: ${last}`);
        process.exit(1);
      }
    }
  }

  console.log('SUCCESS: GeoJSON is valid and fits Jawa Tengah & Yogyakarta boundaries!');
}

validate();
