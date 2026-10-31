import https from 'https';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { enrichMedicineKnowledge } from '../api/medicineKnowledge.js';

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const agent = new https.Agent({ keepAlive: true, timeout: 60000, rejectUnauthorized: false });

function executeNeonSql(queryStr, retries = 4) {
  return new Promise((resolve, reject) => {
    const run = (attempt) => {
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
            if (attempt < retries) {
              setTimeout(() => run(attempt + 1), 1000 * attempt);
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${body}`));
            }
          }
        });
      });
      req.on('error', (err) => {
        if (attempt < retries) {
          setTimeout(() => run(attempt + 1), 1200 * attempt);
        } else {
          reject(err);
        }
      });
      req.write(payload);
      req.end();
    };
    run(1);
  });
}

const MARQUEE_MEDICINES = [
  {
    id: 'MED-IN-58235',
    brand_name: 'Dolo 650 Tablet',
    generic_name: 'Paracetamol (650mg)',
    composition: 'Paracetamol (650mg)',
    category: 'Antipyretics',
    formulation: 'Tablet',
    manufacturer: 'Micro Labs Ltd',
    price: 34.27,
    pack_size: 'strip of 15 tablets',
    prescription_required: false
  },
  {
    id: 'MED-IN-94173',
    brand_name: 'Glycomet 500 SR Tablet',
    generic_name: 'Metformin (500mg)',
    composition: 'Metformin (500mg)',
    category: 'Diabetes medicines',
    formulation: 'Tablet',
    manufacturer: 'USV Ltd',
    price: 47.71,
    pack_size: 'strip of 20 tablet sr',
    prescription_required: true
  },
  {
    id: 'MED-IN-214783',
    brand_name: 'Thyronorm 25mcg Tablet',
    generic_name: 'Thyroxine (25mcg)',
    composition: 'Thyroxine (25mcg)',
    category: 'Thyroid medicines',
    formulation: 'Tablet',
    manufacturer: 'Abbott Healthcare Pvt Ltd',
    price: 194.56,
    pack_size: 'bottle of 120 tablets',
    prescription_required: true
  },
  {
    id: 'MED-IN-214810',
    brand_name: 'Thyronorm 50mcg Tablet',
    generic_name: 'Thyroxine (50mcg)',
    composition: 'Thyroxine (50mcg)',
    category: 'Thyroid medicines',
    formulation: 'Tablet',
    manufacturer: 'Abbott Healthcare Pvt Ltd',
    price: 146.24,
    pack_size: 'bottle of 120 tablets',
    prescription_required: true
  },
  {
    id: 'MED-IN-CROCIN',
    brand_name: 'Crocin Advance 500 Tablet',
    generic_name: 'Paracetamol (500mg)',
    composition: 'Paracetamol (500mg)',
    category: 'Antipyretics',
    formulation: 'Tablet',
    manufacturer: 'GlaxoSmithKline Pharmaceuticals Ltd',
    price: 20.00,
    pack_size: 'strip of 15 tablets',
    prescription_required: false
  },
  {
    id: 'MED-IN-SHELCAL',
    brand_name: 'Shelcal 500 Tablet',
    generic_name: 'Calcium (500mg) + Vitamin D3 (250IU)',
    composition: 'Calcium Carbonate (500mg) + Vitamin D3 (250IU)',
    category: 'Bone and joint medicines',
    formulation: 'Tablet',
    manufacturer: 'Torrent Pharmaceuticals Ltd',
    price: 131.50,
    pack_size: 'strip of 15 tablets',
    prescription_required: false
  },
  {
    id: 'MED-IN-ECOSPRIN',
    brand_name: 'Ecosprin 75 Tablet',
    generic_name: 'Aspirin (75mg)',
    composition: 'Aspirin (75mg)',
    category: 'Antiplatelet medicines',
    formulation: 'Tablet',
    manufacturer: 'USV Ltd',
    price: 5.43,
    pack_size: 'strip of 14 tablets',
    prescription_required: true
  },
  {
    id: 'MED-IN-PAN40',
    brand_name: 'Pan 40 Tablet',
    generic_name: 'Pantoprazole (40mg)',
    composition: 'Pantoprazole (40mg)',
    category: 'Acidity and ulcer medicines',
    formulation: 'Tablet',
    manufacturer: 'Alkem Laboratories Ltd',
    price: 155.00,
    pack_size: 'strip of 15 tablets',
    prescription_required: true
  },
  {
    id: 'MED-IN-TELMA40',
    brand_name: 'Telma 40 Tablet',
    generic_name: 'Telmisartan (40mg)',
    composition: 'Telmisartan (40mg)',
    category: 'Blood pressure medicines',
    formulation: 'Tablet',
    manufacturer: 'Glenmark Pharmaceuticals Ltd',
    price: 236.00,
    pack_size: 'strip of 15 tablets',
    prescription_required: true
  },
  {
    id: 'MED-IN-BECOSULES',
    brand_name: 'Becosules Performance Capsule',
    generic_name: 'Vitamin B-Complex with Vitamin C',
    composition: 'Thiamine + Riboflavin + Niacinamide + Pyridoxine + Cyanocobalamin + Ascorbic Acid',
    category: 'Vitamins and minerals',
    formulation: 'Capsule',
    manufacturer: 'Pfizer Ltd',
    price: 52.00,
    pack_size: 'strip of 20 capsules',
    prescription_required: false
  }
];

function escapeSqlString(str) {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

function formatSqlArray(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return "ARRAY[]::text[]";
  const elements = arr.map(item => `'${String(item).replace(/'/g, "''")}'`).join(', ');
  return `ARRAY[${elements}]::text[]`;
}

async function insertMarquee() {
  console.log('Inserting marquee Indian pharmaceutical products...');
  for (const m of MARQUEE_MEDICINES) {
    const enriched = enrichMedicineKnowledge(m);
    const sqlStr = `
      INSERT INTO medicines (
        id, brand_name, generic_name, active_ingredient, composition,
        therapeutic_category, dosage_form, available_strengths, dosage_forms,
        route_of_administration, approved_indications, reference_dosage,
        common_side_effects, serious_adverse_effects, contraindications,
        drug_interactions, prescription_required, schedule, manufacturer,
        price, pack_size, source_reference, verification_date
      ) VALUES (
        ${escapeSqlString(m.id)},
        ${escapeSqlString(m.brand_name)},
        ${escapeSqlString(m.generic_name)},
        ${escapeSqlString(m.composition)},
        ${escapeSqlString(m.composition)},
        ${escapeSqlString(m.category)},
        ${escapeSqlString(m.formulation)},
        ${formatSqlArray(enriched?.available_strengths || ['500 mg', '650 mg'])},
        ${formatSqlArray(enriched?.available_dosage_forms || [m.formulation])},
        'Oral',
        ${escapeSqlString((enriched?.clinical_indications || []).join('; ') || 'Standard Clinical Prescription')},
        ${escapeSqlString(enriched?.general_approved_dosage || 'As prescribed by physician')},
        ${formatSqlArray(enriched?.common_side_effects || ['Mild nausea'])},
        ${formatSqlArray(enriched?.serious_adverse_effects || ['Hypersensitivity reaction'])},
        ${formatSqlArray(enriched?.contraindications || ['Known hypersensitivity'])},
        ${formatSqlArray(enriched?.drug_interactions || ['Consult physician'])},
        ${Boolean(m.prescription_required)},
        ${escapeSqlString(enriched?.prescription_classification || 'Schedule H')},
        ${escapeSqlString(m.manufacturer)},
        ${m.price},
        ${escapeSqlString(m.pack_size)},
        'CDSCO / WHO Essential Medicines / NLEM',
        '2026-Q1'
      )
      ON CONFLICT (id) DO UPDATE SET
        brand_name = EXCLUDED.brand_name,
        generic_name = EXCLUDED.generic_name,
        therapeutic_category = EXCLUDED.therapeutic_category,
        composition = EXCLUDED.composition,
        manufacturer = EXCLUDED.manufacturer,
        price = EXCLUDED.price;
    `;
    await executeNeonSql(sqlStr);
    console.log(`  ✓ Synced ${m.brand_name} (${m.generic_name})`);
  }

  // Update api/expandedMedicines.json as well
  const fs = await import('fs');
  const path = 'api/expandedMedicines.json';
  if (fs.existsSync(path)) {
    const list = JSON.parse(fs.readFileSync(path, 'utf8'));
    for (const m of MARQUEE_MEDICINES) {
      const idx = list.findIndex(x => x.id === m.id);
      const enriched = enrichMedicineKnowledge(m);
      const fullObj = {
        id: m.id,
        brand_name: m.brand_name,
        generic_name: m.generic_name,
        active_ingredient: m.composition,
        composition: m.composition,
        therapeutic_category: m.category,
        dosage_form: m.formulation,
        available_strengths: enriched?.available_strengths || ['500 mg', '650 mg'],
        dosage_forms: enriched?.available_dosage_forms || [m.formulation],
        route_of_administration: 'Oral',
        approved_indications: (enriched?.clinical_indications || []).join('; ') || 'Standard Clinical Prescription',
        reference_dosage: enriched?.general_approved_dosage || 'As prescribed by physician',
        common_side_effects: enriched?.common_side_effects || ['Mild nausea'],
        serious_adverse_effects: enriched?.serious_adverse_effects || ['Hypersensitivity reaction'],
        contraindications: enriched?.contraindications || ['Known hypersensitivity'],
        drug_interactions: enriched?.drug_interactions || ['Consult physician'],
        prescription_required: Boolean(m.prescription_required),
        schedule: enriched?.prescription_classification || 'Schedule H',
        manufacturer: m.manufacturer,
        price: m.price,
        pack_size: m.pack_size,
        source_reference: 'CDSCO / WHO Essential Medicines / NLEM',
        verification_date: '2026-Q1'
      };
      if (idx >= 0) {
        list[idx] = fullObj;
      } else {
        list.push(fullObj);
      }
    }
    fs.writeFileSync(path, JSON.stringify(list, null, 2), 'utf8');
    console.log(`  ✓ Updated api/expandedMedicines.json (total now ${list.length} records)`);
  }
}

insertMarquee().catch(console.error);

