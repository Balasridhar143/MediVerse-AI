import http from 'http';
import axios from 'axios';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { neon } from '@neondatabase/serverless';

dotenv.config({ path: '.env.local' });

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL is missing from .env.local');
  process.exit(1);
}

const sql = neon(dbUrl);
const JWT_SECRET = process.env.JWT_SECRET_KEY || process.env.JWT_SECRET || 'mediverse_jwt_secret_key_prod_2026';

async function main() {
  console.log('=== VERIFICATION: MEDICINE DETAILS PAGE & MONOGRAPH FIX ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  // 1. Launch test Express server
  const { default: app } = await import('../api/index.js');
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`Live API Server active on ${baseUrl}\n`);

  try {
    const testPatientId = `usr_test_pat_${Date.now()}`;
    const patientToken = jwt.sign(
      { sub: testPatientId, id: testPatientId, role: 'patient', full_name: 'Anita Roy' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // -------------------------------------------------------------
    // TEST 1: Retrieve medicines from knowledge base listing
    // -------------------------------------------------------------
    console.log('--- TEST 1: Retrieve Knowledge Base Medicine List ---');
    const kbRes = await axios.get(`${baseUrl}/medicines/knowledge-base?limit=10`);
    assert(kbRes.status === 200, 'GET /medicines/knowledge-base returned HTTP 200');
    assert(Array.isArray(kbRes.data.medicines) && kbRes.data.medicines.length > 0, `Returned ${kbRes.data.medicines.length} verified medications`);
    assert(Boolean(kbRes.data.total) && kbRes.data.total >= 5000, `Total database size confirmed (${kbRes.data.total} records)`);

    const medsList = kbRes.data.medicines;
    const firstMed = medsList[0];
    const secondMed = medsList[1];
    const thirdMed = medsList[2];

    console.log(`Sample Medicine 1: "${firstMed.brand_name}" (ID: ${firstMed.id})`);
    console.log(`Sample Medicine 2: "${secondMed.brand_name}" (ID: ${secondMed.id})`);
    console.log(`Sample Medicine 3: "${thirdMed.brand_name}" (ID: ${thirdMed.id})`);

    // -------------------------------------------------------------
    // TEST 2: Click/Direct access to Medicine 1
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Medicine 1 Monograph Details Retrieval ---');
    const med1Res = await axios.get(`${baseUrl}/medicines/${encodeURIComponent(firstMed.id)}/knowledge`);
    assert(med1Res.status === 200, `GET /medicines/${firstMed.id}/knowledge returned HTTP 200`);
    assert(Boolean(med1Res.data.medicine), 'Response contains enriched medicine payload');
    
    const m1 = med1Res.data.medicine;
    assert(m1.id === firstMed.id, 'Returned medicine ID strictly matches requested medicine');
    assert(m1.brand_name === firstMed.brand_name, 'Brand name matches accurately');
    assert(Boolean(m1.generic_name), `Generic name present: "${m1.generic_name}"`);
    assert(Boolean(m1.active_ingredients || m1.composition), 'Active ingredients present');
    assert(Boolean(m1.category || m1.therapeutic_category), 'Medicine category present');
    assert(Boolean(m1.drug_classification || m1.treats_nature), 'Therapeutic class present');
    assert(Boolean(m1.available_strengths), 'Available strengths present');
    assert(Boolean(m1.dosage_forms || m1.dosage_form), 'Dosage form present');
    assert(Boolean(m1.route_of_administration), `Route of administration present: "${m1.route_of_administration}"`);
    assert(Boolean(m1.common_side_effects), 'Common side effects documented');
    assert(Boolean(m1.serious_adverse_effects || m1.important_warnings), 'Serious adverse effects / warnings documented');
    assert(Boolean(m1.contraindications), 'Contraindications documented');
    assert(Boolean(m1.drug_interactions), 'Drug interactions documented');
    assert(Boolean(m1.food_interactions || m1.food_instructions), 'Food interactions documented');
    assert(Boolean(m1.storage_instructions || m1.storage), 'Storage instructions documented');
    assert(Boolean(m1.patient_explanation?.what_it_does), 'Patient-friendly explanation "What it does" present');
    assert(Boolean(m1.patient_explanation?.why_prescribed), 'Patient-friendly explanation "Why prescribed" present');
    assert(Boolean(m1.patient_explanation?.how_it_works_in_body), 'Patient-friendly explanation "How it works" present');

    // -------------------------------------------------------------
    // TEST 3: Click/Direct access to Medicine 2 (Different medicine verification)
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Medicine 2 Details Isolation (No Crosstalk) ---');
    const med2Res = await axios.get(`${baseUrl}/medicines/${encodeURIComponent(secondMed.id)}/knowledge`);
    assert(med2Res.status === 200, `GET /medicines/${secondMed.id}/knowledge returned HTTP 200`);
    const m2 = med2Res.data.medicine;
    assert(m2.id === secondMed.id, 'Medicine 2 ID strictly matches requested second medicine');
    assert(m2.brand_name === secondMed.brand_name, 'Medicine 2 brand name matches second medicine');
    assert(m2.id !== m1.id, 'Medicine 2 ID is distinct from Medicine 1 ID');
    assert(m2.brand_name !== m1.brand_name, 'Medicine 2 brand name is distinct from Medicine 1');

    // -------------------------------------------------------------
    // TEST 4: Direct Access via standard /medicines/:id endpoint
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Direct Endpoint /medicines/:id Retrieval ---');
    const standardRes = await axios.get(`${baseUrl}/medicines/${encodeURIComponent(firstMed.id)}`);
    assert(standardRes.status === 200, `GET /medicines/${firstMed.id} returned HTTP 200`);
    assert(standardRes.data.brand_name === firstMed.brand_name, 'Standard endpoint returned correct medicine data');

    // -------------------------------------------------------------
    // TEST 5: Multilingual Monograph Support
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Multilingual Monograph Translations ---');
    const tamilRes = await axios.get(`${baseUrl}/medicines/${encodeURIComponent(firstMed.id)}/knowledge?lang=ta`);
    assert(tamilRes.status === 200, 'Tamil language monograph request succeeded');
    const mTamil = tamilRes.data.medicine;
    assert(Boolean(mTamil.patient_explanation?.what_it_does), 'Tamil patient explanation synthesized');

    const hindiRes = await axios.get(`${baseUrl}/medicines/${encodeURIComponent(firstMed.id)}/knowledge?lang=hi`);
    assert(hindiRes.status === 200, 'Hindi language monograph request succeeded');

    // -------------------------------------------------------------
    // TEST 6: Invalid Medicine ID Error Handling (HTTP 404)
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: Invalid Medicine ID Handling ---');
    try {
      await axios.get(`${baseUrl}/medicines/invalid_med_xyz_99999/knowledge`);
      assert(false, 'Invalid medicine request should fail with 404');
    } catch (err) {
      assert(err.response?.status === 404, 'Invalid medicine returns HTTP 404 Not Found');
      assert(Boolean(err.response?.data?.detail), 'Meaningful error detail returned');
    }

    try {
      await axios.get(`${baseUrl}/medicines/invalid_med_xyz_99999`);
      assert(false, 'Invalid medicine standard endpoint should fail with 404');
    } catch (err) {
      assert(err.response?.status === 404, 'Invalid medicine standard endpoint returns HTTP 404 Not Found');
    }

    // -------------------------------------------------------------
    // TEST 7: Search and Category Filtering
    // -------------------------------------------------------------
    console.log('\n--- TEST 7: Search & Category Filtering ---');
    const searchRes = await axios.get(`${baseUrl}/medicines/knowledge-base?search=Paracetamol`);
    assert(searchRes.status === 200, 'Search for "Paracetamol" succeeded');
    assert(searchRes.data.medicines.length > 0, `Search returned ${searchRes.data.medicines.length} matches`);
    const nonMatching = searchRes.data.medicines.filter(m => {
      const text = `${m.brand_name || ''} ${m.generic_name || ''} ${m.composition || ''} ${m.active_ingredient || ''} ${m.uses || ''} ${m.common_medical_uses || ''}`.toLowerCase();
      return !(text.includes('paracetamol') || text.includes('acetaminophen') || text.includes('dolo') || text.includes('crocin') || text.includes('calpol') || text.includes('pacimol'));
    });
    if (nonMatching.length > 0) {
      console.log('Non matching samples from Paracetamol search:', nonMatching.map(m => ({ brand: m.brand_name, generic: m.generic_name, comp: m.composition, cat: m.category, uses: m.common_medical_uses })));
    }
    assert(searchRes.data.medicines.length > 0, 'Search for Paracetamol returned valid result set');
    assert(searchRes.data.medicines.some(m => (m.generic_name || m.brand_name || '').toLowerCase().includes('paracetamol')), 'Search contains verified Paracetamol products');

    // Category filter test
    const catRes = await axios.get(`${baseUrl}/medicines/knowledge-base?category=Antibiotics`);
    assert(catRes.status === 200, 'Category filter "Antibiotics" succeeded');
    assert(catRes.data.medicines.length > 0, `Antibiotics filter returned ${catRes.data.medicines.length} matches`);

    // -------------------------------------------------------------
    // TEST 8: Preserving Other Patient Portal Features
    // -------------------------------------------------------------
    console.log('\n--- TEST 8: Verifying Preservation of Other Features ---');
    // Reports endpoint
    const reportsRes = await axios.get(`${baseUrl}/reports`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    assert(reportsRes.status === 200, 'Patient Medical Reports endpoint unaffected (HTTP 200)');

    // Health endpoint
    const healthRes = await axios.get(`${baseUrl}/health`);
    assert(healthRes.status === 200, 'System Health endpoint operational (HTTP 200)');

    console.log(`\n=== FINAL VERIFICATION RESULT: ${passed} PASSED, ${failed} FAILED ===\n`);
  } catch (err) {
    console.error('Fatal test error:', err.message);
  } finally {
    server.close();
  }
}

main().catch(console.error);

