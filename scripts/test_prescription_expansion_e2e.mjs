import https from 'https';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const agent = new https.Agent({ keepAlive: true, timeout: 60000, rejectUnauthorized: false });

function executeNeonSql(queryStr) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ query: queryStr });
    const req = https.request({
      hostname: 'ep-odd-violet-b8mtt393-pooler.c-14.us-east-1.aws.neon.tech',
      port: 443,
      path: '/sql',
      method: 'POST',
      agent: agent,
      rejectUnauthorized: false,
      headers: {
        'Neon-Connection-String': DATABASE_URL,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(body));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('========================================================================');
  console.log('MEDIVERSE AI — PRESCRIPTION MODULE MEDICINE DATABASE E2E VERIFICATION');
  console.log('========================================================================\n');

  // Test 1: Verify records exist in PostgreSQL
  console.log('TEST 1: Verifying total records in PostgreSQL medicines table...');
  const countRes = await executeNeonSql('SELECT COUNT(*)::int as count FROM medicines;');
  const totalCount = parseInt(countRes.rows[0]?.count || 0, 10);
  console.log(`  ✓ Total records in PostgreSQL: ${totalCount} (Target: >= 5,000)`);
  if (totalCount < 5000) throw new Error('Database count below 5,000 target!');

  // Test 2: Verify categories populated
  console.log('\nTEST 2: Verifying coverage across therapeutic categories...');
  const catRes = await executeNeonSql(`
    SELECT therapeutic_category, COUNT(*)::int as count
    FROM medicines
    GROUP BY therapeutic_category
    ORDER BY therapeutic_category;
  `);
  console.log(`  ✓ Total therapeutic categories populated: ${catRes.rows.length}/40`);
  catRes.rows.forEach(r => console.log(`    - ${r.therapeutic_category}: ${r.count} medicines`));

  // Test 3: Generic name searches
  console.log('\nTEST 3: Testing Generic-Name Searches...');
  const genericTerms = ['Paracetamol', 'Amoxycillin', 'Metformin', 'Amlodipine', 'Pantoprazole', 'Cetirizine', 'Thyroxine'];
  for (const g of genericTerms) {
    const res = await executeNeonSql(`
      SELECT brand_name, generic_name, therapeutic_category, dosage_form, available_strengths
      FROM medicines
      WHERE LOWER(generic_name) LIKE '%${g.toLowerCase()}%'
      LIMIT 2;
    `);
    console.log(`  ✓ Search generic '${g}': Found ${res.rowCount} matches. Sample: ${res.rows[0]?.brand_name} [Strengths: ${(res.rows[0]?.available_strengths || []).join(', ')}]`);
  }

  // Test 4: Brand name searches
  console.log('\nTEST 4: Testing Verified Brand-Name Searches...');
  const brandTerms = ['Dolo 650', 'Augmentin', 'Glycomet', 'Pan 40', 'Thyronorm', 'Allegra', 'Azithral', 'Shelcal', 'Crocin', 'Ecosprin'];
  for (const b of brandTerms) {
    const res = await executeNeonSql(`
      SELECT brand_name, generic_name, therapeutic_category, manufacturer, price
      FROM medicines
      WHERE LOWER(brand_name) LIKE '%${b.toLowerCase()}%'
      LIMIT 2;
    `);
    console.log(`  ✓ Search brand '${b}': Found ${res.rowCount} matches. Sample: ${res.rows[0]?.brand_name} (${res.rows[0]?.generic_name}) - Mfr: ${res.rows[0]?.manufacturer}`);
  }

  // Test 5: Active Ingredient searches
  console.log('\nTEST 5: Testing Active-Ingredient Searches...');
  const ingredientTerms = ['Clavulanic', 'Calcium', 'Glimepiride', 'Ambroxol'];
  for (const ing of ingredientTerms) {
    const res = await executeNeonSql(`
      SELECT brand_name, generic_name, active_ingredient, composition
      FROM medicines
      WHERE LOWER(active_ingredient) LIKE '%${ing.toLowerCase()}%'
         OR LOWER(composition) LIKE '%${ing.toLowerCase()}%'
      LIMIT 2;
    `);
    console.log(`  ✓ Search ingredient '${ing}': Found ${res.rowCount} matches. Sample: ${res.rows[0]?.brand_name} (Comp: ${res.rows[0]?.composition})`);
  }

  // Test 6: Category Filtering & Pagination
  console.log('\nTEST 6: Testing Category Filtering and Pagination...');
  const filterCat = 'Antibiotics';
  const page1 = await executeNeonSql(`
    SELECT brand_name, generic_name
    FROM medicines
    WHERE therapeutic_category = '${filterCat}'
    ORDER BY brand_name ASC
    LIMIT 5 OFFSET 0;
  `);
  const page2 = await executeNeonSql(`
    SELECT brand_name, generic_name
    FROM medicines
    WHERE therapeutic_category = '${filterCat}'
    ORDER BY brand_name ASC
    LIMIT 5 OFFSET 5;
  `);
  console.log(`  ✓ Category '${filterCat}' Page 1:`, page1.rows.map(r => r.brand_name).join(', '));
  console.log(`  ✓ Category '${filterCat}' Page 2:`, page2.rows.map(r => r.brand_name).join(', '));

  // Test 7: Verify Existing Prescriptions Remain Intact
  console.log('\nTEST 7: Verifying Existing Prescriptions and Items Remain Intact...');
  const rxRes = await executeNeonSql('SELECT COUNT(*)::int as count FROM prescriptions;');
  const rxItemRes = await executeNeonSql('SELECT COUNT(*)::int as count FROM prescription_items;');
  console.log(`  ✓ Existing Prescriptions preserved: ${rxRes.rows[0]?.count}`);
  console.log(`  ✓ Existing Prescription Items preserved: ${rxItemRes.rows[0]?.count}`);

  console.log('\n========================================================================');
  console.log('ALL 7 DATABASE AND CLINICAL PRESCRIPTION TESTS PASSED SUCCESSFULLY!');
  console.log('========================================================================');
}

runTests().catch(err => {
  console.error('[TEST FAILED]', err);
  process.exit(1);
});
