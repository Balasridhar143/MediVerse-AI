import http from 'http';
import app from '../api/index.js';

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) {
    console.log(`  [PASS] ${msg}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${msg}`);
    failed++;
  }
}

async function run() {
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`Test server running on port ${port}...`);

  try {
    console.log('Testing /api/medicines/knowledge-base...');
    const resKB = await fetch(`${baseUrl}/api/medicines/knowledge-base?search=ciplox`).then(r => r.json());
    assert(resKB.medicines && resKB.medicines.length > 0, 'Found medicines for search "ciplox"');
    if (resKB.medicines && resKB.medicines.length > 0) {
      const ciplox = resKB.medicines[0];
      assert(ciplox.drug_classification.includes('Fluoroquinolone'), `Ciplox is classified as Fluoroquinolone (${ciplox.drug_classification})`);
      assert(Boolean(ciplox.generic_vs_brand_explanation), 'generic_vs_brand_explanation is present in API response');
      assert(Boolean(ciplox.food_instructions), 'food_instructions is present');
      assert(Boolean(ciplox.route_of_administration), 'route_of_administration is present');
    }

    console.log('Testing /api/hospitals with coordinates (Chennai Central: 13.0827, 80.2707)...');
    const resHosp = await fetch(`${baseUrl}/api/hospitals?latitude=13.0827&longitude=80.2707&sort_by=distance`).then(r => r.json());
    assert(resHosp.items && resHosp.items.length > 0, 'Hospital items returned');
    const first = resHosp.items[0];
    const second = resHosp.items[1];
    assert(first.distance_km !== null && first.distance_km !== undefined, `First hospital has distance_km (${first.distance_km} km)`);
    assert(first.distance_km <= second.distance_km, `Hospitals sorted ascending by distance (${first.distance_km} <= ${second.distance_km})`);

    console.log('Testing /api/doctors by hospital...');
    const resDocHosp = await fetch(`${baseUrl}/api/doctors?hospital=Apollo`).then(r => r.json());
    assert(Array.isArray(resDocHosp) && resDocHosp.length > 0, 'Found doctors affiliated with Apollo');
    const allApollo = resDocHosp.every(d => (d.hospital || '').toLowerCase().includes('apollo'));
    assert(allApollo, 'All returned doctors are affiliated with Apollo');

    console.log('Testing /api/doctors by symptom / mapped specialty...');
    const resDocSkin = await fetch(`${baseUrl}/api/doctors?search=skin`).then(r => r.json());
    assert(Array.isArray(resDocSkin) && resDocSkin.length > 0, 'Doctors returned for "skin"');
    const hasDerma = resDocSkin.some(d => (d.specialization || '').toLowerCase().includes('dermatology') || (d.department || '').toLowerCase().includes('dermatology'));
    assert(hasDerma, 'Searching "skin" returned Dermatology specialists');

    const resDocHeart = await fetch(`${baseUrl}/api/doctors?search=heart`).then(r => r.json());
    assert(Array.isArray(resDocHeart) && resDocHeart.length > 0, 'Doctors returned for "heart"');
    const hasCardio = resDocHeart.some(d => (d.specialization || '').toLowerCase().includes('cardiology') || (d.department || '').toLowerCase().includes('cardiology'));
    assert(hasCardio, 'Searching "heart" returned Cardiology specialists');

    console.log(`\nENDPOINT TESTS COMPLETE: ${passed} PASSES, ${failed} FAILURES.`);
  } finally {
    server.close();
  }

  if (failed > 0) process.exit(1);
  process.exit(0);
}

run().catch(e => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
