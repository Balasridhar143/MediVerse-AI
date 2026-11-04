/**
 * api/reportRAG.js
 * Comprehensive Medical Report RAG Analysis Pipeline
 * 
 * Pipeline:
 * Report Upload → Document Type Detection → OCR/PDF Extraction → Text Cleaning → 
 * Medical Entity & Parameter Extraction → Reference Range Comparison → 
 * Evidence-Based RAG Knowledge Retrieval → AI Clinical Explanation Synthesis → 
 * Structured Results Output & Database Persistence
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

let PDFParse = null;
try {
  const pdfMod = require('pdf-parse');
  PDFParse = pdfMod.PDFParse || pdfMod;
} catch (e) {
  console.warn('[PDF Parser] pdf-parse loader warning:', e.message);
}

let Tesseract = null;
try {
  const tMod = require('tesseract.js');
  Tesseract = tMod.default || tMod;
} catch (e) {
  console.warn('[OCR Engine] tesseract.js loader warning:', e.message);
}

// =========================================================================
// 1. COMPREHENSIVE CLINICAL RAG KNOWLEDGE BASE
// =========================================================================
export const CLINICAL_RAG_KNOWLEDGE_BASE = [
  {
    id: "kb_cbc_hemoglobin",
    category: "Hematology",
    topics: ["hemoglobin", "hb", "hgb", "anemia", "rbc", "erythrocytes", "iron deficiency", "polycythemia"],
    title: "WHO Guidelines on the Assessment of Anemia & Hemoglobin Concentrations",
    source: "World Health Organization (WHO) Nutritional & Diagnostic Protocols",
    source_url: "https://www.who.int/publications/i/item/9789240019256",
    verified_at: "2026-Q1",
    content: "Normal adult hemoglobin values are 13.8–17.2 g/dL in men and 12.1–15.1 g/dL in non-pregnant women. Values below 12.0 g/dL indicate anemia, most commonly iron deficiency, blood loss, or nutritional deficit. Hemoglobin levels below 7.0 g/dL represent severe anemia requiring urgent medical attention. Elevated levels above 17.5 g/dL may suggest hemoconcentration, chronic smoking, hypoxemic lung disease, or polycythemia."
  },
  {
    id: "kb_diabetes_glucose",
    category: "Endocrinology",
    topics: ["fasting blood sugar", "fbs", "glucose", "post prandial", "ppbs", "random blood sugar", "rbs", "diabetes", "hyperglycemia", "hypoglycemia"],
    title: "ADA Standards of Care in Diabetes: Diagnostic Fasting and Postprandial Cutoffs",
    source: "American Diabetes Association (ADA) Clinical Practice Recommendations",
    source_url: "https://diabetesjournals.org/care/issue/47/Supplement_1",
    verified_at: "2026-Q1",
    content: "Normal fasting plasma glucose is 70 to 99 mg/dL. Fasting glucose of 100 to 125 mg/dL defines Impaired Fasting Glucose (Prediabetes). Fasting glucose of 126 mg/dL or higher on two separate occasions confirms Diabetes Mellitus. Postprandial glucose (2 hours after meal) is normal below 140 mg/dL, while 140–199 mg/dL indicates Impaired Glucose Tolerance. Fasting glucose below 55 mg/dL is classified as severe hypoglycemia requiring immediate glucose administration."
  },
  {
    id: "kb_glycated_hba1c",
    category: "Endocrinology",
    topics: ["hba1c", "glycated hemoglobin", "average glucose", "glycemic control"],
    title: "National Glycohemoglobin Standardization Program (NGSP) Clinical Standards",
    source: "International Expert Committee on Glycated Hemoglobin & NGSP Standards",
    source_url: "https://ngsp.org/guidelines.asp",
    verified_at: "2026-Q1",
    content: "HbA1c reflects average blood glucose over preceding 90–120 days. Normal non-diabetic range is below 5.7%. Prediabetes range is 5.7% to 6.4%. Diabetes is diagnosed at HbA1c 6.5% or greater. For established diabetics, clinical guidelines generally target < 7.0% to minimize microvascular complications (retinopathy, nephropathy, neuropathy)."
  },
  {
    id: "kb_hematology_wbc",
    category: "Hematology",
    topics: ["wbc", "white blood cells", "leukocytes", "tlc", "infection", "leukocytosis", "leukopenia", "neutrophils"],
    title: "ICSH Reference Framework for Complete Blood Count & Leukocyte Differentials",
    source: "International Council for Standardization in Haematology (ICSH)",
    source_url: "https://icsh.org/",
    verified_at: "2026-Q1",
    content: "The normal total leukocyte (WBC) count in adults ranges from 4,000 to 11,000 cells/cumm. Leukocytosis (> 11,000 cells/cumm) typically indicates acute bacterial infection, severe physical stress, inflammation, or corticosteroid response. Values > 25,000 cells/cumm indicate a leukemoid reaction or acute hematologic crisis. Leukopenia (< 4,000 cells/cumm) can indicate viral suppression (dengue, influenza), drug toxicity, or bone marrow disorders."
  },
  {
    id: "kb_hematology_platelets",
    category: "Hematology",
    topics: ["platelet count", "platelets", "thrombocytes", "thrombocytopenia", "bleeding", "clotting"],
    title: "Clinical Practice Guideline on the Evaluation of Thrombocytopenia",
    source: "American Society of Hematology (ASH) Evidence-Based Guidelines",
    source_url: "https://www.hematology.org/education/clinicians/guidelines",
    verified_at: "2026-Q1",
    content: "Normal platelet count ranges from 1.5 to 4.5 lakhs/cumm (150,000–450,000 /mcL). Thrombocytopenia (< 1.5 lakhs/cumm) can result from viral infections (dengue, malaria), autoimmune destruction (ITP), or medication side effects. Platelet counts below 50,000/cumm present critical hemorrhagic risk requiring strict activity restriction and medical consultation. Platelets < 20,000/cumm require urgent clinical hematology evaluation."
  },
  {
    id: "kb_renal_creatinine",
    category: "Nephrology",
    topics: ["serum creatinine", "creatinine", "kidney", "renal", "egfr", "nephropathy", "rft", "kft"],
    title: "KDIGO Clinical Practice Guideline for the Evaluation and Management of Kidney Disease",
    source: "Kidney Disease: Improving Global Outcomes (KDIGO) Practice Guidelines",
    source_url: "https://kdigo.org/guidelines/",
    verified_at: "2026-Q1",
    content: "Normal serum creatinine is 0.70–1.30 mg/dL in adult males and 0.60–1.10 mg/dL in adult females. Creatinine is a byproduct of muscle breakdown eliminated almost exclusively by renal glomerular filtration. Elevations reflect reduced renal filtration. Acute elevations > 0.3 mg/dL within 48 hours or values > 2.0 mg/dL warrant immediate clinical nephrology evaluation to exclude Acute Kidney Injury (AKI) and prevent chronic structural damage."
  },
  {
    id: "kb_renal_bun",
    category: "Nephrology",
    topics: ["bun", "blood urea nitrogen", "urea", "dehydration", "uremia", "rft"],
    title: "National Kidney Foundation (NKF) Clinical Guideline on Nitrogenous Markers",
    source: "National Kidney Foundation (NKF) KDOQI Protocols",
    source_url: "https://www.kidney.org/",
    verified_at: "2026-Q1",
    content: "Normal Blood Urea Nitrogen (BUN) is 7.0 to 20.0 mg/dL (Serum Urea: 15–40 mg/dL). Elevated BUN occurs in renal hypoperfusion, severe dehydration, congestive heart failure, high protein catabolism, gastrointestinal bleeding, or parenchymal renal disease. A BUN to Creatinine ratio > 20:1 strongly suggests prerenal azotemia or dehydration."
  },
  {
    id: "kb_cardiac_lipids",
    category: "Cardiology",
    topics: ["total cholesterol", "cholesterol", "triglycerides", "ldl", "hdl", "vldl", "lipid profile", "atherosclerosis"],
    title: "AHA/ACC Multi-Society Guideline on the Management of Blood Cholesterol",
    source: "American College of Cardiology & American Heart Association Cardiovascular Task Force",
    source_url: "https://www.ahajournals.org/doi/10.1161/CIR.0000000000000625",
    verified_at: "2026-Q1",
    content: "Total cholesterol should ideally be < 200 mg/dL; 200–239 mg/dL is borderline high, and >= 240 mg/dL is high risk for atherosclerotic cardiovascular disease. LDL cholesterol should be < 100 mg/dL (< 70 mg/dL in high risk patients). HDL cholesterol should be > 40 mg/dL in men and > 50 mg/dL in women. Triglycerides should be < 150 mg/dL; 150–199 mg/dL is borderline, 200–499 mg/dL is high, and >= 500 mg/dL carries significant risk of acute pancreatitis."
  },
  {
    id: "kb_hepatic_liver",
    category: "Hepatology",
    topics: ["bilirubin", "total bilirubin", "liver", "jaundice", "sgot", "ast", "sgpt", "alt", "alp", "alkaline phosphatase", "lft", "hepatitis"],
    title: "ACG Clinical Guideline: Evaluation of Abnormal Liver Chemistries",
    source: "American College of Gastroenterology (ACG) Clinical Practice Committee",
    source_url: "https://journals.lww.com/ajg/fulltext/2017/01000/acg_clinical_guideline__evaluation_of_abnormal.19.aspx",
    verified_at: "2026-Q1",
    content: "Total serum bilirubin is normally 0.2 to 1.2 mg/dL. Elevated levels above 2.5 mg/dL cause scleral icterus and jaundice, indicative of hepatobiliary obstruction, hepatocellular injury, or hemolysis. SGPT (ALT) and SGOT (AST) are transaminases; normal range is typically 10–40 U/L. Significant elevation (> 3x upper limit of normal) reflects active hepatic parenchymal inflammation."
  },
  {
    id: "kb_thyroid_tsh",
    category: "Endocrinology",
    topics: ["tsh", "thyroid", "thyroid stimulating hormone", "t3", "t4", "hypothyroidism", "hyperthyroidism"],
    title: "ATA Guidelines for the Diagnosis and Management of Thyroid Disease",
    source: "American Thyroid Association (ATA) & Endocrine Society Task Force",
    source_url: "https://www.thyroid.org/professionals/ata-professional-guidelines/",
    verified_at: "2026-Q1",
    content: "Normal adult TSH is 0.45 to 4.50 mIU/L. TSH above 4.50 mIU/L with normal or low free T4 indicates primary hypothyroidism, causing fatigue, weight gain, cold intolerance, and bradycardia. TSH below 0.40 mIU/L indicates hyperthyroidism, prompting investigation for Graves' disease or toxic thyroid nodules."
  }
];

// =========================================================================
// 2. COMPREHENSIVE CLINICAL LAB TEST DICTIONARY
// =========================================================================
export const CLINICAL_LAB_TEST_DICTIONARY = [
  // --- 1. Complete Blood Count (CBC) ---
  {
    canonical: "hemoglobin",
    name: "Hemoglobin",
    regex: /(?:Hemoglobin|Haemoglobin|Hb|HGB)\s*[:=\-|\t]?\s*(\d+(?:\.\d+)?)\s*(g\/dL|g\/L|gm\/dl|g\/dl|g\|dl|gidl)?/i,
    unit: "g/dL",
    ref_low: 12.0,
    ref_high: 17.0,
    critical_low: 7.0,
    critical_high: 19.0,
    purpose: "Transports oxygen from your lungs to tissues throughout your body via red blood cells.",
    meaning: "Oxygen-carrying iron-rich protein in red blood cells.",
    low_reason: "Iron deficiency, occult blood loss, chronic kidney disease, nutritional deficits, or hemolytic anemia.",
    high_reason: "Dehydration, chronic smoking, hypoxemic lung disease, or primary bone marrow polycythemia."
  },
  {
    canonical: "wbc_count",
    name: "Total WBC Count (TLC)",
    regex: /(?:Total\s+(?:Leucocyte|Leukocyte|WBC)\s+Count|TLC|WBC\s+Count|White\s+Blood\s+Cells?)\s*[:=\-|\t]?\s*(\d+(?:,\d+)?(?:\.\d+)?)\s*(cells\/cumm|\/cumm|\/uL|10\^3\/uL|cumm)?/i,
    unit: "cells/cumm",
    ref_low: 4000.0,
    ref_high: 11000.0,
    critical_low: 2000.0,
    critical_high: 25000.0,
    purpose: "Primary cellular defense system that fights off bacterial, viral, and fungal infections.",
    meaning: "Total circulating white blood cells serving as the immune system's primary defense.",
    low_reason: "Viral suppression (dengue, influenza), drug toxicity, autoimmune conditions, or bone marrow disorders.",
    high_reason: "Acute bacterial or viral infection, tissue inflammation, physical stress, or corticosteroid response."
  },
  {
    canonical: "rbc_count",
    name: "RBC Count",
    regex: /(?:RBC(?:\s+Count)?|Red\s+Blood\s+Cells?|Erythrocytes?)\s*[:=\-|\t]?\s*(\d+(?:\.\d+)?)\s*(mil\/uL|million\/cumm|10\^6\/uL|mill\/cumm)?/i,
    unit: "million/cumm",
    ref_low: 4.2,
    ref_high: 5.9,
    purpose: "Transports oxygen and carbon dioxide between the lungs and body tissues.",
    meaning: "Total circulating red blood cells responsible for oxygen transport.",
    low_reason: "Anemia, acute or chronic bleeding, nutritional deficiencies (iron, B12), or bone marrow disorders.",
    high_reason: "Erythrocytosis, severe dehydration, congenital heart defect, or polycythemia vera."
  },
  {
    canonical: "platelets",
    name: "Platelet Count",
    regex: /(?:Platelet(?:\s+Count)?|Platelets|Thrombocytes?)\s*[:=\-|\t]?\s*(\d+(?:,\d+)?(?:\.\d+)?)\s*(lakhs\/cumm|lacs\/cumm|\/cumm|\/uL|10\^3\/uL|thousand\/cumm)?/i,
    unit: "lakhs/cumm",
    ref_low: 1.5,
    ref_high: 4.5,
    critical_low: 0.5,
    critical_high: 9.0,
    purpose: "Tiny cell fragments that form blood clots to prevent and stop bleeding.",
    meaning: "Circulating cell fragments essential for normal blood clotting and vascular repair.",
    low_reason: "Viral infections (dengue, chikungunya), autoimmune destruction (ITP), splenic enlargement, or medication side effects.",
    high_reason: "Reactive thrombocytosis (infection, tissue injury, iron deficiency) or myeloproliferative disorders."
  },
  {
    canonical: "pcv",
    name: "Packed Cell Volume (PCV / Hematocrit)",
    regex: /(?:PCV|Packed\s+Cell\s+Volume|Hematocrit|HCT)\s*[:=\-|\t]?\s*(\d+(?:\.\d+)?)\s*(%)?/i,
    unit: "%",
    ref_low: 36.0,
    ref_high: 50.0,
    critical_low: 20.0,
    critical_high: 60.0,
    purpose: "Measures the proportion of your blood that is made up of red blood cells.",
    meaning: "Percentage of total blood volume occupied by red blood cells.",
    low_reason: "Anemia, blood loss, fluid retention, or nutritional deficiencies.",
    high_reason: "Dehydration, high altitude acclimatization, chronic hypoxia, or polycythemia."
  },
  {
    canonical: "mcv",
    name: "Mean Corpuscular Volume (MCV)",
    regex: /(?:MCV|Mean\s+Corpuscular\s+Volume)\s*[:=\-|\t]?\s*(\d+(?:\.\d+)?)\s*(fL|fl)?/i,
    unit: "fL",
    ref_low: 80.0,
    ref_high: 100.0,
    critical_low: 65.0,
    critical_high: 120.0,
    purpose: "Measures the average physical size of your red blood cells.",
    meaning: "Average volume of a single red blood cell.",
    low_reason: "Microcytic anemia: Iron deficiency anemia, thalassemia trait, or chronic disease anemia.",
    high_reason: "Macrocytic anemia: Vitamin B12 deficiency, folate deficiency, chronic liver disease, or alcohol excess."
  },
  {
    canonical: "mch",
    name: "Mean Corpuscular Hemoglobin (MCH)",
    regex: /(?:MCH|Mean\s+Corpuscular\s+Hemoglobin)\s*[:=\-|\t]?\s*(\d+(?:\.\d+)?)\s*(pg)?/i,
    unit: "pg",
    ref_low: 27.0,
    ref_high: 32.0,
    purpose: "Measures the average amount of hemoglobin inside each red blood cell.",
    meaning: "Average weight of hemoglobin per red blood cell.",
    low_reason: "Hypochromic anemia, iron deficiency, or hemoglobinopathies.",
    high_reason: "Macrocytic anemia or hyperlipidemia interference."
  },
  {
    canonical: "neutrophils",
    name: "Neutrophils (Polymorphs)",
    regex: /(?:Neutrophils?|Polymorphs?)\s*[:=\-|\t]?\s*(\d+(?:\.\d+)?)\s*(%)?/i,
    unit: "%",
    ref_low: 40.0,
    ref_high: 75.0,
    critical_low: 15.0,
    critical_high: 90.0,
    purpose: "First-responder white blood cells that defend against acute bacterial infections.",
    meaning: "Primary granulocyte responding to acute bacterial infections and tissue trauma.",
    low_reason: "Neutropenia: viral infections, chemotherapy, autoimmune disease, or severe sepsis.",
    high_reason: "Neutrophilia: acute bacterial infection, physical stress, tissue necrosis, or inflammation."
  },
  {
    canonical: "lymphocytes",
    name: "Lymphocytes",
    regex: /(?:Lymphocytes?)\s*[:=\-|\t]?\s*(\d+(?:\.\d+)?)\s*(%)?/i,
    unit: "%",
    ref_low: 20.0,
    ref_high: 45.0,
    critical_low: 5.0,
    critical_high: 70.0,
    purpose: "Specialized immune cells (T-cells, B-cells) that target viruses and create antibodies.",
    meaning: "White blood cells providing adaptive immunity and viral defense.",
    low_reason: "Immunodeficiency, acute corticosteroid therapy, or acute systemic stress.",
    high_reason: "Viral infections (infectious mononucleosis, viral hepatitis), tuberculosis, or chronic lymphocytic leukemia."
  },
  {
    canonical: "eosinophils",
    name: "Eosinophils",
    regex: /(?:Eosinophils?)\s*[:=\-|\t]?\s*(\d+(?:\.\d+)?)\s*(%)?/i,
    unit: "%",
    ref_low: 1.0,
    ref_high: 6.0,
    critical_low: 0.0,
    critical_high: 20.0,
    purpose: "White blood cells that fight parasitic infections and participate in allergic reactions.",
    meaning: "Immune cells active in allergic responses and anti-parasitic defense.",
    low_reason: "Acute stress, elevated corticosteroid levels, or acute bacteremia.",
    high_reason: "Eosinophilia: allergic conditions (asthma, eczema, rhinitis), parasitic infestation, or drug reactions."
  },
  {
    canonical: "esr",
    name: "ESR (Erythrocyte Sedimentation Rate)",
    regex: /(?:ESR|Erythrocyte\s+Sedimentation\s+Rate)\s*[:=\-|\t]?\s*(\d+(?:\.\d+)?)\s*(mm\/hr)?/i,
    unit: "mm/hr",
    ref_low: 0.0,
    ref_high: 20.0,
    critical_low: 0.0,
    critical_high: 100.0,
    purpose: "Non-specific inflammatory marker measuring how quickly red blood cells settle.",
    meaning: "Non-specific general biomarker for active systemic inflammation or infection.",
    low_reason: "Polycythemia, sickle cell disease, or extreme hypofibrinogenemia.",
    high_reason: "Active inflammation, bacterial infection, autoimmune disease (rheumatoid arthritis, lupus), or tissue damage."
  },

  // --- 2. Glycemic / Diabetes Panel ---
  {
    canonical: "fasting_glucose",
    name: "Fasting Blood Sugar (Glucose)",
    regex: /(?:Fasting\s+(?:Blood\s+)?(?:Sugar|Glucose)|FBS)\s*[:=\-|\t]?\s*(\d+(?:\.\d+)?)\s*(mg\/dL|mmol\/L|mg\/dl|mg\|dl)?/i,
    unit: "mg/dL",
    ref_low: 70.0,
    ref_high: 99.0,
    critical_low: 50.0,
    critical_high: 300.0,
    purpose: "Measures blood sugar level after an overnight fast to assess diabetes risk.",
    meaning: "Circulating blood glucose concentration following an 8 to 12 hour fast.",
    low_reason: "Hypoglycemia: excess antidiabetic medication, prolonged fasting, or heavy alcohol intake.",
    high_reason: "Impaired Fasting Glucose (Prediabetes: 100–125 mg/dL) or Diabetes Mellitus (>=126 mg/dL)."
  },
  {
    canonical: "pp_glucose",
    name: "Post Prandial Blood Sugar (PPBS)",
    regex: /(?:Post\s+Prandial\s+(?:Blood\s+)?(?:Sugar|Glucose)|PPBS)\s*[:=\-|\t]?\s*(\d+(?:\.\d+)?)\s*(mg\/dL|mmol\/L|mg\/dl)?/i,
    unit: "mg/dL",
    ref_low: 70.0,
    ref_high: 140.0,
    critical_low: 50.0,
    critical_high: 350.0,
    purpose: "Evaluates how effectively your body processes glucose 2 hours after a meal.",
    meaning: "Blood glucose measured 2 hours following a meal to assess insulin response.",
    low_reason: "Reactive hypoglycemia or delayed gastric emptying.",
    high_reason: "Impaired Glucose Tolerance (140–199 mg/dL) or uncontrolled Diabetes (>=200 mg/dL)."
  },
  {
    canonical: "random_glucose",
    name: "Random Blood Sugar (RBS)",
    regex: /(?:Random\s+(?:Blood\s+)?(?:Sugar|Glucose)|RBS)\s*[:=\-|\t]?\s*(\d+(?:\.\d+)?)\s*(mg\/dL|mmol\/L|mg\/dl)?/i,
    unit: "mg/dL",
    ref_low: 70.0,
    ref_high: 140.0,
    critical_low: 50.0,
    critical_high: 300.0,
    purpose: "Snapshot of blood sugar taken at any time regardless of meals.",
    meaning: "Blood glucose level checked at any arbitrary point in time.",
    low_reason: "Hypoglycemia, delayed eating, or excess diabetic medication.",
    high_reason: "Possible diabetes mellitus if >= 200 mg/dL with classic symptoms (polyuria, polydipsia)."
  },
  {
    canonical: "hba1c",
    name: "HbA1c (Glycated Hemoglobin)",
    regex: /(?:HbA1c|Glycated\s+Hemoglobin|A1C)\s*[:=\-|\t]?\s*(\d+(?:\.\d+)?)\s*(%)?/i,
    unit: "%",
    ref_low: 4.0,
    ref_high: 5.6,
    critical_low: 3.5,
    critical_high: 11.0,
    purpose: "Measures average 3-month blood sugar control by looking at glucose-coated hemoglobin.",
    meaning: "Percentage of hemoglobin bound to glucose over the preceding 90 to 120 days.",
    low_reason: "Recent acute blood loss, hemolytic anemia, or frequent severe hypoglycemic episodes.",
    high_reason: "Prediabetes (5.7%–6.4%) or Diabetes Mellitus (>= 6.5%), indicating need for glycemic optimization."
  },

  // --- 3. Renal / Kidney Function (RFT / KFT) ---
  {
    canonical: "serum_creatinine",
    name: "Serum Creatinine",
    regex: /(?:Serum\s+Creatinine|Creatinine|S\.Creatinine)\s*[:=\-|\t]?\s*(\d+(?:\.\d+)?)\s*(mg\/dL|umol\/L|mg\/dl)?/i,
    unit: "mg/dL",
    ref_low: 0.70,
    ref_high: 1.30,
    critical_low: 0.3,
    critical_high: 3.0,
    purpose: "Assesses how well your kidneys are filtering waste products from muscle activity.",
    meaning: "Waste byproduct of muscle metabolism filtered out almost exclusively by the kidneys.",
    low_reason: "Low muscle mass, severe malnutrition, or overhydration.",
    high_reason: "Reduced kidney filtration, Acute Kidney Injury (AKI), chronic kidney disease, or severe dehydration."
  },
  {
    canonical: "blood_urea",
    name: "Blood Urea / BUN",
    regex: /(?:Blood\s+Urea|Serum\s+Urea|BUN|Blood\s+Urea\s+Nitrogen|Urea)\s*[:=\-|\t]?\s*(\d+(?:\.\d+)?)\s*(mg\/dL|mg\/dl)?/i,
    unit: "mg/dL",
    ref_low: 15.0,
    ref_high: 40.0,
    critical_low: 5.0,
    critical_high: 80.0,
    purpose: "Evaluates kidney function and hydration by measuring protein waste in the blood.",
    meaning: "Nitrogenous waste product resulting from dietary and tissue protein breakdown.",
    low_reason: "Low protein intake, severe liver disease, malnutrition, or fluid overload.",
    high_reason: "Prerenal dehydration, decreased kidney perfusion, high protein catabolism, or renal impairment."
  },
  {
    canonical: "uric_acid",
    name: "Serum Uric Acid",
    regex: /(?:Serum\s+Uric\s+Acid|Uric\s+Acid)\s*[:=\-|\t]?\s*(\d+(?:\.\d+)?)\s*(mg\/dL|mg\/dl)?/i,
    unit: "mg/dL",
    ref_low: 3.5,
    ref_high: 7.2,
    critical_low: 1.5,
    critical_high: 12.0,
    purpose: "Detects excess uric acid, which can form painful crystals in joints or kidney stones.",
    meaning: "Byproduct of purine breakdown excreted primarily by renal tubules.",
    low_reason: "Low purine diet, liver disease, or allopurinol therapy.",
    high_reason: "Hyperuricemia, gouty arthritis, kidney stones (nephrolithiasis), or reduced renal excretion."
  },

  // --- 4. Liver Function Tests (LFT) ---
  {
    canonical: "total_bilirubin",
    name: "Serum Bilirubin Total",
    regex: /(?:Total\s+Bilirubin|Bilirubin\s+Total|S\.Bilirubin\s+Total)\s*[:=\-|\t]?\s*(\d+(?:\.\d+)?)\s*(mg\/dL|mg\/dl)?/i,
    unit: "mg/dL",
    ref_low: 0.2,
    ref_high: 1.2,
    critical_low: 0.1,
    critical_high: 3.5,
    purpose: "Measures yellow pigment produced during normal breakdown of red blood cells to check liver health.",
    meaning: "Yellow pigment cleared from circulation and processed by liver hepatocytes.",
    low_reason: "Generally of no clinical pathological significance.",
    high_reason: "Jaundice, viral or drug-induced hepatitis, cholestasis, bile duct obstruction, or hemolysis."
  },
  {
    canonical: "sgpt_alt",
    name: "SGPT / ALT (Alanine Aminotransferase)",
    regex: /(?:SGPT(?:\s*\(ALT\))?|ALT(?:\s*\(SGPT\))?|Alanine\s+Aminotransferase)\s*[:=\-|\t]?\s*(\d+(?:\.\d+)?)\s*(U\/L|IU\/L|u\/l)?/i,
    unit: "U/L",
    ref_low: 7.0,
    ref_high: 56.0,
    critical_low: 0.0,
    critical_high: 300.0,
    purpose: "Liver-specific enzyme that enters the bloodstream when liver cells are stressed or injured.",
    meaning: "Key intracellular enzyme highly concentrated in hepatocytes; sensitive marker of liver cell stress.",
    low_reason: "Normal physiological finding; healthy liver integrity.",
    high_reason: "Liver cell inflammation, viral hepatitis, fatty liver (NAFLD), alcohol use, or medication effect."
  },
  {
    canonical: "sgot_ast",
    name: "SGOT / AST (Aspartate Aminotransferase)",
    regex: /(?:SGOT(?:\s*\(AST\))?|AST(?:\s*\(SGOT\))?|Aspartate\s+Aminotransferase)\s*[:=\-|\t]?\s*(\d+(?:\.\d+)?)\s*(U\/L|IU\/L|u\/l)?/i,
    unit: "U/L",
    ref_low: 10.0,
    ref_high: 40.0,
    critical_low: 0.0,
    critical_high: 300.0,
    purpose: "Enzyme found in liver and muscle cells; elevated when tissue inflammation is present.",
    meaning: "Enzyme present in liver cells, cardiac muscle, and skeletal muscle.",
    low_reason: "Normal physiological finding.",
    high_reason: "Liver inflammation, alcohol intake, strenuous physical exercise, or muscle injury."
  },
  {
    canonical: "alkaline_phosphatase",
    name: "Alkaline Phosphatase (ALP)",
    regex: /(?:Alkaline\s+Phosphatase|ALP)\s*[:=\-|\t]?\s*(\d+(?:\.\d+)?)\s*(U\/L|IU\/L|u\/l)?/i,
    unit: "U/L",
    ref_low: 44.0,
    ref_high: 147.0,
    critical_low: 15.0,
    critical_high: 450.0,
    purpose: "Enzyme associated with bile ducts in the liver and bone remodeling.",
    meaning: "Enzyme concentrated in biliary epithelial cells and bone osteoblasts.",
    low_reason: "Zinc deficiency, severe malnutrition, or hypothyroidism.",
    high_reason: "Biliary tract blockage (gallstones), cholestasis, active bone healing, or liver inflammation."
  },

  // --- 5. Lipid / Cardiovascular Profile ---
  {
    canonical: "total_cholesterol",
    name: "Total Cholesterol",
    regex: /(?:Total\s+Cholesterol|Cholesterol\s+Total|S\.Cholesterol)\s*[:=\-|\t]?\s*(\d+(?:\.\d+)?)\s*(mg\/dL|mmol\/L|mg\/dl)?/i,
    unit: "mg/dL",
    ref_low: 125.0,
    ref_high: 200.0,
    critical_low: 90.0,
    critical_high: 300.0,
    purpose: "Measures all circulating cholesterol to assess cardiovascular and arterial health.",
    meaning: "Total concentration of circulating lipoproteins carrying sterols throughout the vascular system.",
    low_reason: "Severe malabsorption, hyperthyroidism, or severe liver dysfunction.",
    high_reason: "Hypercholesterolemia, familial lipid disorder, hypothyroidism; increases arterial plaque risk."
  },
  {
    canonical: "triglycerides",
    name: "Triglycerides",
    regex: /(?:Triglycerides?|S\.Triglycerides?)\s*[:=\-|\t]?\s*(\d+(?:\.\d+)?)\s*(mg\/dL|mmol\/L|mg\/dl)?/i,
    unit: "mg/dL",
    ref_low: 50.0,
    ref_high: 150.0,
    critical_low: 25.0,
    critical_high: 500.0,
    purpose: "Measures common dietary fats in blood; high levels correlate with heart and pancreas risk.",
    meaning: "Primary storage form of fat in the body transported in bloodstream.",
    low_reason: "Strict low-fat diet, malnutrition, or hyperthyroidism.",
    high_reason: "Hypertriglyceridemia, metabolic syndrome, excess refined carbohydrates/sugar, obesity, alcohol use."
  },
  {
    canonical: "hdl_cholesterol",
    name: "HDL Cholesterol (Good Cholesterol)",
    regex: /(?:HDL(?:\s+Cholesterol)?)\s*[:=\-|\t]?\s*(\d+(?:\.\d+)?)\s*(mg\/dL|mmol\/L|mg\/dl)?/i,
    unit: "mg/dL",
    ref_low: 40.0,
    ref_high: 60.0,
    critical_low: 25.0,
    critical_high: 100.0,
    purpose: "Protective cholesterol that removes excess fats from arteries back to the liver.",
    meaning: "High-Density Lipoprotein that scavenges excess cholesterol from arterial tissues.",
    low_reason: "Sedentary lifestyle, smoking, obesity, type 2 diabetes; elevates heart disease risk.",
    high_reason: "Cardioprotective finding; associated with regular physical exercise and balanced diet."
  },
  {
    canonical: "ldl_cholesterol",
    name: "LDL Cholesterol (Bad Cholesterol)",
    regex: /(?:LDL(?:\s+Cholesterol)?)\s*[:=\-|\t]?\s*(\d+(?:\.\d+)?)\s*(mg\/dL|mmol\/L|mg\/dl)?/i,
    unit: "mg/dL",
    ref_low: 50.0,
    ref_high: 100.0,
    critical_low: 20.0,
    critical_high: 190.0,
    purpose: "Carries cholesterol to arteries; excess can lead to plaque buildup and atherosclerosis.",
    meaning: "Low-Density Lipoprotein responsible for depositing cholesterol along blood vessel walls.",
    low_reason: "Aggressive statin therapy, severe malnutrition, or hypolipidemia.",
    high_reason: "Elevated risk of coronary artery disease, atherosclerosis, and myocardial infarction."
  },

  // --- 6. Thyroid Function Panel ---
  {
    canonical: "tsh",
    name: "Thyroid Stimulating Hormone (TSH)",
    regex: /(?:TSH|Thyroid\s+Stimulating\s+Hormone)\s*[:=\-|\t]?\s*(\d+(?:\.\d+)?)\s*(mIU\/L|uIU\/mL|uIU\/ml)?/i,
    unit: "mIU/L",
    ref_low: 0.45,
    ref_high: 4.50,
    critical_low: 0.05,
    critical_high: 20.0,
    purpose: "Pituitary hormone that directs the thyroid gland on how much metabolic hormone to produce.",
    meaning: "Anterior pituitary hormone regulating thyroid gland hormone production.",
    low_reason: "Hyperthyroidism: Graves' disease, toxic multinodular goiter, or excessive thyroid replacement.",
    high_reason: "Hypothyroidism (Hashimoto's thyroiditis), subclinical thyroid failure, or iodine deficiency."
  },

  // --- 7. Vitamins, Minerals & Micronutrients ---
  {
    canonical: "serum_calcium",
    name: "Serum Calcium",
    regex: /(?:Serum\s+Calcium|Calcium)\s*[:=\-|\t]?\s*(\d+(?:\.\d+)?)\s*(mg\/dL|mg\/dl)?/i,
    unit: "mg/dL",
    ref_low: 8.5,
    ref_high: 10.5,
    critical_low: 6.5,
    critical_high: 13.0,
    purpose: "Essential mineral for bone strength, heart rhythm, nerve signals, and muscle contraction.",
    meaning: "Essential mineral maintaining bone mineralization, myocardial rhythm, and nerve firing.",
    low_reason: "Hypocalcemia, hypoparathyroidism, vitamin D deficiency, or chronic renal failure.",
    high_reason: "Hyperparathyroidism, bone metastasis, excessive vitamin D intake, or granulomatous disease."
  },
  {
    canonical: "vitamin_d",
    name: "Vitamin D (25-OH)",
    regex: /(?:Vitamin\s+D(?:\s+Total)?|25-OH\s+Vitamin\s+D)\s*[:=\-|\t]?\s*(\d+(?:\.\d+)?)\s*(ng\/mL|nmol\/L|ng\/ml)?/i,
    unit: "ng/mL",
    ref_low: 30.0,
    ref_high: 100.0,
    critical_low: 10.0,
    critical_high: 150.0,
    purpose: "Crucial fat-soluble vitamin for calcium absorption, bone health, and immune function.",
    meaning: "Steroid hormone precursor essential for bone mineral density and immune regulation.",
    low_reason: "Vitamin D deficiency (<20 ng/mL), insufficient sun exposure, malabsorption, or poor dietary intake.",
    high_reason: "Excessive vitamin D supplement megadosing."
  },
  {
    canonical: "vitamin_b12",
    name: "Vitamin B12",
    regex: /(?:Vitamin\s+B12|B12|Cobalamin)\s*[:=\-|\t]?\s*(\d+(?:\.\d+)?)\s*(pg\/mL|pmol\/L|pg\/ml)?/i,
    unit: "pg/mL",
    ref_low: 211.0,
    ref_high: 911.0,
    critical_low: 100.0,
    critical_high: 1500.0,
    purpose: "Vital vitamin for red blood cell formation, nerve function, and DNA synthesis.",
    meaning: "Water-soluble vitamin essential for hematopoiesis and nerve myelin integrity.",
    low_reason: "Pernicious anemia, strict vegan diet without supplement, malabsorption, or metformin use.",
    high_reason: "Over-supplementation, chronic myeloid leukemia, or severe hepatic disease."
  }
];

// =========================================================================
// 3. ROBUST DOCUMENT TEXT EXTRACTION (PDF, OCR FOR SCANS & IMAGES)
// =========================================================================
export async function extractTextFromDocument(fileBuffer, mimeType, filename) {
  if (!fileBuffer || fileBuffer.length === 0) {
    return "";
  }

  const isPdf = (mimeType && mimeType.includes('pdf')) || (filename && filename.toLowerCase().endsWith('.pdf'));
  const isImage = (mimeType && (mimeType.includes('image') || mimeType.includes('jpeg') || mimeType.includes('png') || mimeType.includes('jpg'))) ||
    (filename && /\.(jpe?g|png|webp|gif|bmp)$/i.test(filename));

  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.VITE_GEMINI_API_KEY;

  // 1. Digital PDF extraction via modern PDFParse
  if (isPdf && PDFParse) {
    try {
      const parser = new PDFParse({ data: fileBuffer });
      const getTextWithTimeout = Promise.race([
        parser.getText(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('PDFParse getText timed out')), 5000))
      ]);
      const data = await getTextWithTimeout;
      const extracted = data && data.text ? data.text.trim() : "";

      // If digital PDF yielded meaningful text (>= 40 chars with words), return it
      if (extracted.length >= 40 && /[a-zA-Z]{3,}/.test(extracted)) {
        await parser.destroy();
        return cleanDocumentText(extracted);
      }

      // If text is very short or empty, this is likely a SCANNED PDF:
      console.log('[PDF Parser] Digital stream sparse or empty. Invoking OCR on scanned page image...');
      try {
        const screenshot = await parser.getScreenshot({ page: 1 });
        await parser.destroy();
        if (screenshot && screenshot.pages && screenshot.pages[0] && screenshot.pages[0].dataUrl) {
          const pageImg = screenshot.pages[0].dataUrl;
          // Try Gemini vision first if key available
          if (geminiApiKey) {
            const geminiText = await extractTextWithGeminiVision(geminiApiKey, pageImg, 'image/png');
            if (geminiText && geminiText.length > 20) {
              return cleanDocumentText(geminiText);
            }
          }
          // Fallback to local Tesseract OCR
          if (Tesseract) {
            console.log('[OCR] Executing Tesseract OCR on scanned PDF page...');
            const ocrResult = await Tesseract.recognize(pageImg, 'eng');
            if (ocrResult?.data?.text && ocrResult.data.text.trim().length > 10) {
              return cleanDocumentText(ocrResult.data.text);
            }
          }
        }
      } catch (screenshotErr) {
        console.warn('[PDF Parser] Scanned page screenshot notice:', screenshotErr.message);
      }
    } catch (pdfErr) {
      console.warn('[PDF Parser] PDF parse error:', pdfErr.message);
    }
  }

  // 2. Image document extraction (PNG, JPG, JPEG, WEBP)
  if (isImage) {
    console.log('[OCR] Processing uploaded medical report image via OCR...');
    // A. Try Gemini multimodal vision first if configured
    if (geminiApiKey) {
      try {
        const mediaMime = mimeType || (filename && filename.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg');
        const geminiText = await extractTextWithGeminiVision(geminiApiKey, fileBuffer, mediaMime);
        if (geminiText && geminiText.length > 20) {
          return cleanDocumentText(geminiText);
        }
      } catch (geminiErr) {
        console.warn('[Gemini Vision] Image OCR notice:', geminiErr.message);
      }
    }

    // B. Local Tesseract OCR fallback (runs purely in Node/WASM)
    if (Tesseract) {
      try {
        const ocrResult = await Tesseract.recognize(fileBuffer, 'eng');
        if (ocrResult?.data?.text && ocrResult.data.text.trim().length > 10) {
          return cleanDocumentText(ocrResult.data.text);
        }
      } catch (tessErr) {
        console.warn('[Tesseract OCR] Optical recognition notice:', tessErr.message);
      }
    }
  }

  // 3. Fallback extraction of printable strings from buffer
  try {
    const rawStr = fileBuffer.toString('utf8');
    const printable = rawStr.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ').replace(/\s+/g, ' ').trim();
    if (printable.length > 20 && /[a-zA-Z]{3,}/.test(printable)) {
      return printable.slice(0, 50000);
    }
  } catch (rawErr) {
    console.warn('[Raw Text Parser] Fallback extraction warning:', rawErr.message);
  }

  return "";
}

/**
 * Extracts text from image/PDF using Google GenAI if key is present.
 */
async function extractTextWithGeminiVision(apiKey, bufferOrDataUrl, mimeType) {
  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });
    let base64Data = '';
    if (typeof bufferOrDataUrl === 'string') {
      base64Data = bufferOrDataUrl.replace(/^data:[^;]+;base64,/, '');
    } else if (Buffer.isBuffer(bufferOrDataUrl)) {
      base64Data = bufferOrDataUrl.toString('base64');
    }

    const generatePromise = ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        "Extract all medical test names, patient values, measurement units, and reference intervals verbatim from this diagnostic laboratory report. Keep table rows intact.",
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType || 'image/png'
          }
        }
      ]
    });
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Gemini OCR timed out after 8000ms')), 8000));
    const response = await Promise.race([generatePromise, timeoutPromise]);
    return response?.text?.trim() || '';
  } catch (err) {
    console.warn('[Gemini Vision OCR Helper]', err.message);
    return '';
  }
}

/**
 * Cleans extracted text, standardizing linebreaks and whitespace.
 */
function cleanDocumentText(text) {
  if (!text) return "";
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

// =========================================================================
// 4. ENTITY EXTRACTION & REFERENCE INTERVAL COMPARISON
// =========================================================================
export function extractAndCompareLabEntities(text) {
  const extractedTests = [];
  const matchedCanonicalKeys = new Set();

  if (!text) {
    return [];
  }

  // 1. Authoritative Clinical Dictionary Matching
  const cleanSearchText = text
    .replace(/(?:Test\s*Name|Investigation|Parameter)\s*[:=\-|\t]?\s*/gi, '')
    .replace(/(?:Value|Result|Observed\s*Value)\s*[:=\-|\t]?\s*/gi, '');

  for (const dict of CLINICAL_LAB_TEST_DICTIONARY) {
    const match = text.match(dict.regex) || cleanSearchText.match(dict.regex);
    if (match) {
      let rawVal = match[1].replace(/,/g, '');
      let numVal = parseFloat(rawVal);
      if (isNaN(numVal)) continue;

      let unit = match[2] || dict.unit;

      // Normalize common OCR misreads in units
      if (/g[i|l]dl/i.test(unit)) unit = "g/dL";
      if (/mg[i|l]dl/i.test(unit)) unit = "mg/dL";

      // Handle platelet scale (e.g. 220,000 -> 2.2 lakhs)
      if (dict.canonical === "platelets" && numVal > 1000) {
        numVal = Math.round((numVal / 100000) * 100) / 100;
        unit = "lakhs/cumm";
      }

      let status = "Normal";
      let isCritical = false;

      if (numVal < dict.ref_low) {
        status = "Below reference range";
        if (dict.critical_low !== undefined && numVal <= dict.critical_low) {
          status = "Critical Low";
          isCritical = true;
        }
      } else if (numVal > dict.ref_high) {
        status = "Above reference range";
        if (dict.critical_high !== undefined && numVal >= dict.critical_high) {
          status = "Critical High";
          isCritical = true;
        }
      }

      const explanation = status === "Normal"
        ? `${dict.name} (${numVal} ${unit}) is within normal physiological bounds (${dict.ref_low} - ${dict.ref_high} ${unit}).`
        : `${dict.name} (${numVal} ${unit}) is ${status} (Normal: ${dict.ref_low} - ${dict.ref_high} ${unit}). ${status.includes('Below') ? dict.low_reason : dict.high_reason}`;

      extractedTests.push({
        canonical: dict.canonical,
        test_name: dict.name,
        name: dict.name,
        patient_value: numVal,
        value: numVal,
        unit: unit,
        reference_range: `${dict.ref_low} - ${dict.ref_high} ${unit}`,
        referenceRange: `${dict.ref_low} - ${dict.ref_high} ${unit}`,
        status: status,
        flag: status === "Normal" ? "Normal" : isCritical ? "Critical" : "Review",
        is_critical: isCritical,
        purpose: dict.purpose,
        meaning: dict.meaning,
        possible_reasons: status.includes('Below') ? dict.low_reason : status.includes('Above') ? dict.high_reason : 'Within expected physiological limits.',
        explanation: explanation
      });

      matchedCanonicalKeys.add(dict.canonical);
      matchedCanonicalKeys.add(dict.name.toLowerCase());
    }
  }

  // 2. Flexible Tabular / Line Extractor for Any Other Laboratory Test
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  for (const line of lines) {
    // Ignore common non-test header lines
    if (/^(patient|doctor|hospital|age|gender|date|page|test name|investigation|parameter|sample|status|method|technology|verified by|dr\.)/i.test(line)) {
      continue;
    }

    // Match patterns like:
    // [Test Name] [:|=|\t| ] [Number] [Unit] [Range: Min - Max or < Max or > Min] [Flag]
    const rowMatch = line.match(/^([A-Za-z0-9\s()\/.\-_+]+?)\s*[:|=|\t|]\s*(\d+(?:,\d+)?(?:\.\d+)?)\s*([A-Za-z\/%^0-9]+)?\s*(?:\(?\s*(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)\s*\)?|[<>]\s*(\d+(?:\.\d+)?))?\s*([A-Za-z*]+)?$/i)
      || line.match(/^([A-Za-z0-9\s()\/.\-_+]{3,35})\s+(\d+(?:,\d+)?(?:\.\d+)?)\s+([A-Za-z\/%^0-9]+)?\s+(?:(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)|[<>]\s*(\d+(?:\.\d+)?))\s*([A-Za-z*]+)?$/i);

    if (rowMatch) {
      const rawName = rowMatch[1].trim();
      const normName = rawName.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (rawName.length < 3 || matchedCanonicalKeys.has(normName) || matchedCanonicalKeys.has(rawName.toLowerCase())) {
        continue;
      }

      const numVal = parseFloat(rowMatch[2].replace(/,/g, ''));
      if (isNaN(numVal)) continue;

      const unit = rowMatch[3] || 'units';
      const refLow = rowMatch[4] !== undefined ? parseFloat(rowMatch[4]) : (rowMatch[6] ? 0 : null);
      const refHigh = rowMatch[5] !== undefined ? parseFloat(rowMatch[5]) : (rowMatch[6] ? parseFloat(rowMatch[6]) : null);
      const rawFlag = (rowMatch[7] || '').toUpperCase();

      let status = "Normal";
      let isCritical = false;

      if (refLow !== null && refHigh !== null) {
        if (numVal < refLow) status = "Below reference range";
        else if (numVal > refHigh) status = "Above reference range";
      } else if (rawFlag.includes('H') || rawFlag.includes('HIGH')) {
        status = "Above reference range";
      } else if (rawFlag.includes('L') || rawFlag.includes('LOW')) {
        status = "Below reference range";
      }

      if (rawFlag.includes('CRIT') || rawFlag.includes('*')) {
        isCritical = true;
      }

      const refStr = (refLow !== null && refHigh !== null) ? `${refLow} - ${refHigh} ${unit}` : 'Standard reference interval';

      extractedTests.push({
        canonical: normName,
        test_name: rawName,
        name: rawName,
        patient_value: numVal,
        value: numVal,
        unit: unit,
        reference_range: refStr,
        referenceRange: refStr,
        status: status,
        flag: status === "Normal" ? "Normal" : isCritical ? "Critical" : "Review",
        is_critical: isCritical,
        purpose: `Diagnostic evaluation of ${rawName}.`,
        meaning: `Measured laboratory observation for ${rawName}.`,
        possible_reasons: status === "Normal" ? "Result aligns with expected laboratory parameters." : "Deviation requires clinical correlation with physical symptoms and medical history.",
        explanation: `${rawName}: Measured value ${numVal} ${unit}. Status: ${status}.`
      });

      matchedCanonicalKeys.add(normName);
      matchedCanonicalKeys.add(rawName.toLowerCase());
    }
  }

  return extractedTests;
}

// =========================================================================
// 5. DETAILED PATIENT-FRIENDLY EXPLANATION GENERATOR
// =========================================================================
export function generateDetailedExplanation({
  testResults = [],
  patientName = 'Patient',
  reportType = 'Blood Tests',
  hospital = 'Clinical Laboratory',
  date = new Date().toISOString().split('T')[0]
}) {
  const totalCount = testResults.length;
  const normalItems = testResults.filter(t => t.status === "Normal" || t.flag === "Normal");
  const abnormalItems = testResults.filter(t => t.status !== "Normal" && t.status !== "Unable to determine");
  const criticalItems = testResults.filter(t => t.is_critical);

  const normalCount = normalItems.length;
  const abnormalCount = abnormalItems.length;
  const criticalCount = criticalItems.length;

  // 1. Overall Report Summary
  let overallSummary = "";
  if (totalCount === 0) {
    overallSummary = `Your ${reportType} report from ${hospital} was successfully uploaded and securely archived in your digital health records. No quantitative numerical values could be matched from the document. The original file is available for direct physician review and download.`;
  } else if (abnormalCount === 0) {
    overallSummary = `Comprehensive analysis of your ${reportType} report conducted at ${hospital} on ${date} for ${patientName}. All ${totalCount} evaluated laboratory parameters are within normal, healthy physiological limits. Your readings reflect stable baseline organ function across the tested domains.`;
  } else {
    overallSummary = `Diagnostic analysis of your ${reportType} report for ${patientName} (${hospital}, ${date}). A total of ${totalCount} parameters were extracted and evaluated against clinical reference manuals. ${normalCount} parameter(s) fall within healthy target bounds, while ${abnormalCount} parameter(s) show deviation (${abnormalItems.map(a => `${a.test_name}: ${a.patient_value} ${a.unit}`).join(', ')}). These findings require review with your doctor to determine appropriate clinical context.`;
  }

  // 2. Normal Findings List
  const normalFindings = normalItems.map(t => 
    `${t.test_name} (${t.patient_value} ${t.unit}) is within normal limits (${t.reference_range}). This indicates healthy physiological functioning for this biomarker.`
  );

  // 3. Abnormal Findings List
  const abnormalFindings = abnormalItems.map(t => ({
    test_name: t.test_name,
    value: `${t.patient_value} ${t.unit}`,
    reference_range: t.reference_range,
    status: t.status,
    is_critical: t.is_critical,
    significance: t.possible_reasons || `Observed reading of ${t.patient_value} ${t.unit} is outside established laboratory reference bounds.`,
    possible_causes: t.possible_reasons
  }));

  // 4. Possible Significance of Abnormal Values
  let possibleSignificance = "";
  if (abnormalCount === 0) {
    possibleSignificance = "No significant abnormalities detected in this panel. All test results align with standard physiological reference intervals.";
  } else {
    possibleSignificance = `The observed deviations in ${abnormalItems.map(a => a.test_name).join(', ')} warrant structured clinical correlation. A single abnormal lab measurement does not constitute a disease diagnosis. Readings can be temporarily altered by diet, hydration status, mild recent infections, physical exertion, or medications. Your attending doctor will evaluate these values alongside your symptoms to determine if repeat confirmatory testing or medical support is appropriate.`;
  }

  // 5. Important Precautions
  const precautions = [
    "Do not independently start, stop, or change doses of any prescription medications based on this laboratory report.",
    "Avoid self-treating abnormal results with unverified over-the-counter supplements or antibiotics without physician approval.",
    "Maintain balanced daily hydration and dietary habits unless specific restrictions have been advised by your medical provider.",
    "If you experience severe fatigue, shortness of breath, dizziness, sudden chest pain, or high fever, seek immediate medical consultation."
  ];

  // 6. Questions for Doctor
  const doctorDiscussionQuestions = [];
  if (abnormalCount > 0) {
    doctorDiscussionQuestions.push(`What is the most likely cause of my abnormal ${abnormalItems.slice(0, 2).map(a => a.test_name).join(' and ')} levels?`);
    doctorDiscussionQuestions.push("Do any of these readings warrant repeat confirmatory testing or additional diagnostic scans?");
    doctorDiscussionQuestions.push("Could any of my current daily medications, hydration, or diet have influenced these specific test numbers?");
  } else {
    doctorDiscussionQuestions.push("Based on these normal results, when should I schedule my next routine checkup?");
    doctorDiscussionQuestions.push("Are there any preventative lifestyle or dietary recommendations based on my overall health profile?");
  }
  doctorDiscussionQuestions.push("When should a repeat follow-up diagnostic panel be scheduled?");

  // 7. Recommended Next Steps
  const recommendations = [
    "Schedule a follow-up consultation with your attending physician to review these laboratory findings in person or via telemedicine.",
    "Keep this digitized report accessible in your MediVerse patient profile and share it with your consulting clinician.",
    abnormalCount > 0
      ? "Plan for a repeat follow-up test in 2 to 4 weeks if recommended by your physician to track longitudinal parameter stabilization."
      : "Continue your healthy routine and schedule routine annual blood work as part of regular preventative wellness."
  ];

  // 8. Test Evaluations (Each Test & Its Purpose)
  const testEvaluations = testResults.map(t => {
    const purposeText = t.purpose || `Diagnostic biomarker assessment of ${t.test_name}.`;
    const measuresText = t.meaning || t.what_it_measures || purposeText;
    
    // Enrich parameter in place so subsequent table renders have complete metadata
    t.purpose = purposeText;
    t.what_it_measures = measuresText;
    t.easyMeaning = purposeText;
    t.meaning = measuresText;

    return {
      test_name: t.test_name,
      purpose: purposeText,
      what_it_measures: measuresText,
      observed_value: `${t.patient_value} ${t.unit}`,
      reference_range: t.reference_range,
      status: t.status,
      is_critical: Boolean(t.is_critical),
      interpretation: `${t.test_name} was recorded at ${t.patient_value} ${t.unit} (reference interval: ${t.reference_range}). Status: ${t.status}.`,
      possible_significance: t.possible_reasons || 'Aligns with laboratory standard parameters.'
    };
  });

  const disclaimer = "MEDICAL DECISION SUPPORT DISCLAIMER: This automated AI analysis is generated exclusively for patient health literacy and clinical decision support. It does NOT constitute a definitive medical diagnosis, clinical prognosis, or prescription. All laboratory findings must be reviewed and correlated with physical examination by a qualified, registered medical practitioner.";

  return {
    overall_summary: overallSummary,
    summary: overallSummary,
    simpleExplanation: overallSummary,
    findings_summary: abnormalCount === 0
      ? "All parameters fall within established reference intervals."
      : `${abnormalCount} parameter(s) deviate from standard laboratory bounds (${abnormalItems.map(a => a.test_name).join(', ')}).`,
    whatThisMeans: possibleSignificance,
    normal_findings: normalFindings,
    abnormal_findings: abnormalFindings,
    possible_significance: possibleSignificance,
    precautions: precautions,
    doctor_discussion_questions: doctorDiscussionQuestions,
    questionsForDoctor: doctorDiscussionQuestions,
    recommendations: recommendations,
    test_evaluations: testEvaluations,
    disclaimer: disclaimer
  };
}

/**
 * Step 5: Synthesize Patient-Friendly Clinical Explanation using Google GenAI (Gemini API)
 * with robust error handling, controlled retries, and clinical RAG fallback.
 */
export async function generateAiPatientFriendlyExplanation({
  testResults = [],
  patientName = 'Patient',
  reportType = 'Blood Tests',
  hospital = 'Clinical Laboratory',
  date = new Date().toISOString().split('T')[0],
  extractedText = '',
  language = 'en',
  ragSources = []
}) {
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.VITE_GEMINI_API_KEY;

  // 1. Build deterministic grounded baseline first
  const fallbackExplanation = generateDetailedExplanation({
    testResults,
    patientName,
    reportType,
    hospital,
    date
  });

  if (!geminiApiKey || testResults.length === 0) {
    console.log('[Step 5 AI Explanation] Using grounded Clinical RAG engine (Gemini key not provided or empty tests)');
    if (language && language !== 'en') {
      return translateReportAnalysis({ ai_explanation: fallbackExplanation, parameters: testResults, structured_data: {} }, language).ai_explanation;
    }
    return fallbackExplanation;
  }

  // 2. Format clinical prompt with tests, values, reference intervals, abnormal findings and RAG citations
  const abnormalTests = testResults.filter(t => t.status !== 'Normal' && t.flag !== 'Normal');
  const normalTests = testResults.filter(t => t.status === 'Normal' || t.flag === 'Normal');

  const testListPrompt = testResults.map((t, idx) => 
    `${idx + 1}. ${t.test_name}: Observed ${t.patient_value} ${t.unit} (Reference Range: ${t.reference_range}) -> Status: ${t.status}${t.is_critical ? ' [CRITICAL ALERT]' : ''}`
  ).join('\n');

  const guidelinesPrompt = (ragSources || []).map(g => 
    `- ${g.title || g.guideline} (${g.source || 'Medical Guideline'}): ${g.content}`
  ).join('\n');

  const prompt = `You are MediVerse AI's Senior Clinical Intelligence & Patient Communication Specialist.
Generate Step 5: Patient-Friendly Clinical Explanation for a patient review.

PATIENT & REPORT DETAILS:
- Patient Name: ${patientName}
- Diagnostic Category: ${reportType}
- Laboratory / Facility: ${hospital}
- Date: ${date}
- Target Language: ${language === 'ta' ? 'Tamil' : language === 'hi' ? 'Hindi' : 'English'}

EXTRACTED LABORATORY TESTS & MEASUREMENTS:
${testListPrompt}

CLINICAL GUIDELINE EVIDENCE (RAG KNOWLEDGE BASE):
${guidelinesPrompt || 'Standard international clinical laboratory guidelines (WHO, ADA, ICSH, KDIGO).'}

MANDATORY RESPONSE REQUIREMENTS:
1. Ground every statement strictly in the provided measured values and clinical guidelines. Do not invent unmeasured tests.
2. Explain what each test is and what it measures in clear, accessible language suitable for a patient without medical training.
3. For abnormal results, explain possible physiological factors (diet, hydration, mild stress, or health conditions) calmly without panic.
4. Provide structured, actionable precautions and insightful questions the patient can ask their consulting physician.
5. Provide practical recommended next steps.
6. Include a strict clinical safety disclaimer reminding the patient that this is educational decision support and not a substitute for a licensed doctor.

OUTPUT FORMAT:
Respond ONLY with a valid, parseable JSON object matching this exact structure:
{
  "overall_summary": "2-3 comprehensive, encouraging sentences summarizing the overall report findings.",
  "simpleExplanation": "1-2 concise, plain-language sentences summarizing the core results.",
  "findings_summary": "Summary of normal vs abnormal parameter counts and key takeaways.",
  "whatThisMeans": "Everyday language explanation of what these laboratory findings indicate for the patient's health.",
  "normal_findings": ["List of tests within healthy target bounds and what their normal status signifies."],
  "abnormal_findings": [
    {
      "test_name": "Test Name",
      "value": "Measured value with unit",
      "reference_range": "Expected interval",
      "status": "High or Low status",
      "significance": "What this deviation might indicate clinically.",
      "possible_causes": "Common physiological or pathological causes."
    }
  ],
  "possible_significance": "Detailed paragraph exploring the clinical context of deviations, temporary factors (hydration, recent meals), and the importance of doctor evaluation.",
  "precautions": [
    "At least 4 actionable patient safety precautions (e.g. do not modify prescribed medications, avoid unverified supplements, maintain hydration, warning signs)."
  ],
  "doctor_discussion_questions": [
    "At least 3-4 specific, high-yield questions for the patient to ask their doctor during their next visit."
  ],
  "recommendations": [
    "At least 3 practical recommended next steps."
  ],
  "test_evaluations": [
    {
      "test_name": "Test Name",
      "purpose": "What this test is used for in medicine.",
      "what_it_measures": "Exactly what biological substance or cell type this measures in the human body.",
      "observed_value": "Measured value and unit",
      "reference_range": "Expected normal interval",
      "status": "Normal / Above / Below",
      "is_critical": false,
      "interpretation": "Clear patient-friendly interpretation of this specific number.",
      "possible_significance": "Healthy target range OR potential clinical factors."
    }
  ],
  "disclaimer": "CLINICAL DECISION SUPPORT DISCLAIMER: This automated AI analysis is generated exclusively for patient health literacy and clinical decision support. It does NOT constitute a definitive medical diagnosis, clinical prognosis, or prescription. All laboratory findings must be reviewed and correlated with physical examination by a qualified, registered medical practitioner."
}`;

  // 3. Invoke Google GenAI with controlled timeout & 1 retry
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      console.log(`[Step 5 AI Explanation] Generating with Gemini 2.0 Flash (attempt ${attempt}/2)...`);
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: geminiApiKey });

      const generatePromise = ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Gemini explanation synthesis timed out after 12000ms')), 12000)
      );

      const response = await Promise.race([generatePromise, timeoutPromise]);
      const rawText = response?.text?.trim() || '';

      if (!rawText) {
        throw new Error('Empty response received from Gemini model.');
      }

      // Clean JSON if wrapped in markdown code blocks
      const cleanJson = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsed = JSON.parse(cleanJson);

      // Validate core required keys
      if (!parsed.overall_summary && !parsed.summary) {
        throw new Error('AI response missing overall_summary key.');
      }

      // Synchronize alias keys for maximum frontend compatibility across both analyzers
      parsed.summary = parsed.overall_summary || parsed.summary;
      parsed.simpleExplanation = parsed.simpleExplanation || parsed.overall_summary;
      parsed.whatThisMeans = parsed.whatThisMeans || parsed.possible_significance || parsed.findings_summary;
      parsed.questionsForDoctor = parsed.doctor_discussion_questions || parsed.questionsForDoctor || [];
      parsed.doctor_discussion_questions = parsed.questionsForDoctor;
      parsed.disclaimer = parsed.disclaimer || fallbackExplanation.disclaimer;

      // Enrich testResults array with detailed purpose & what_it_measures generated by AI
      if (Array.isArray(parsed.test_evaluations)) {
        testResults.forEach(param => {
          const evalMatch = parsed.test_evaluations.find(e => 
            (e.test_name && param.test_name && e.test_name.toLowerCase() === param.test_name.toLowerCase()) ||
            (e.test_name && param.name && e.test_name.toLowerCase() === param.name.toLowerCase())
          );
          if (evalMatch) {
            param.purpose = evalMatch.purpose || param.purpose;
            param.what_it_measures = evalMatch.what_it_measures || evalMatch.purpose || param.meaning;
            param.easyMeaning = evalMatch.purpose || param.easyMeaning;
            param.meaning = evalMatch.what_it_measures || param.meaning;
            param.explanation = evalMatch.interpretation || param.explanation;
            if (evalMatch.possible_significance) {
              param.possible_reasons = evalMatch.possible_significance;
            }
          }
        });
      }

      console.log(`[Step 5 AI Explanation] Gemini generation successful for ${testResults.length} test parameters.`);
      return parsed;
    } catch (err) {
      console.warn(`[Step 5 AI Explanation] Attempt ${attempt} failed:`, err.message);
      if (attempt === 2) {
        console.warn('[Step 5 AI Explanation] Falling back to structured clinical RAG engine.');
        if (language && language !== 'en') {
          return translateReportAnalysis({ ai_explanation: fallbackExplanation, parameters: testResults, structured_data: {} }, language).ai_explanation;
        }
        return fallbackExplanation;
      }
      // Small pause before retry
      await new Promise(r => setTimeout(r, 600));
    }
  }

  return fallbackExplanation;
}

// =========================================================================
// 6. MULTILINGUAL EXPLANATION TRANSLATOR
// =========================================================================
export function translateReportAnalysis(analysis, language = 'en') {
  if (!language || language === 'en') {
    return analysis;
  }

  const normalCount = analysis.structured_data?.normal_parameters || 0;
  const abnormalCount = analysis.structured_data?.abnormal_parameters || 0;
  const totalCount = analysis.structured_data?.total_tests_analyzed || 0;
  const repType = analysis.structured_data?.report_type || 'Blood Tests';

  const I18N_REPORTS = {
    ta: {
      summary: `${repType} மருத்துவ அறிக்கை மெடிவர்ஸ் AI மூலம் விரிவாக ஆய்வு செய்யப்பட்டது. மொத்தம் ${totalCount} ஆய்வக அளவீடுகள் பகுப்பாய்வு செய்யப்பட்டன. இதில் ${normalCount} அளவீடுகள் சாதாரண வரம்பிற்குள் உள்ளன, ${abnormalCount} அளவீடுகள் மருத்துவரின் ஆலோசனைக்கு பரிந்துரைக்கப்படுகின்றன.`,
      normalFindings: `பகுப்பாய்வு செய்யப்பட்ட அனைத்து அளவீடுகளும் மருத்துவ இயல்பு வரம்பிற்குள் உள்ளன.`,
      abnormalFindings: `${abnormalCount} அளவீடுகள் நிலையான குறிப்பு வரம்பிற்கு வெளியே உள்ளன. உங்கள் மருத்துவரிடம் ஆலோசிக்கவும்.`,
      significance: `அளவீடுகளில் காணப்படும் மாறுதல்கள் உடனடியாக நோய் என்று கருதப்படக்கூடாது. நீர்ச்சத்து, உணவுமுறை அல்லது சமீபத்திய தொற்று காரணமாகவும் இவை மாறலாம். உங்கள் மருத்துவரிடம் முழுமையாக ஆலோசிக்கவும்.`,
      recs: [
        `இந்த ஆய்வக முடிவுகளை உங்கள் அறிகுறிகளுடன் ஒப்பிட்டுப் பார்க்க உங்கள் மருத்துவரிடம் ஆலோசனை பெறவும்.`,
        `மருத்துவரின் ஆலோசனையின்றி பரிந்துரைக்கப்பட்ட மருந்துகளின் அளவை மாற்றவோ நிறுத்தவோ வேண்டாம்.`,
        `மறு பரிசோதனைக்குச் செல்லும் முன் போதுமான அளவு தண்ணீர் குடித்து நீரேற்றத்துடன் இருக்கவும்.`
      ],
      precautions: [
        `மருத்துவரின் ஆலோசனையின்றி சுயமாக மருந்துகளை எடுத்துக்கொள்வதைத் தவிர்க்கவும்.`,
        `பரிந்துரைக்கப்பட்ட மருந்துகளின் அளவை சொந்தமாக மாற்ற வேண்டாம்.`,
        `மயக்கம், மூச்சுத்திணறல் அல்லது அதிக காய்ச்சல் ஏற்பட்டால் உடனடியாக மருத்துவரை அணுகவும்.`
      ],
      questions: [
        `மாறுபட்ட அளவீடுகளுக்கு உடனடி மருந்து மாற்றம் அல்லது தொடர் பரிசோதனைகள் தேவையா?`,
        `எனது தற்போதைய உணவுமுறை அல்லது மருந்துகள் இந்த அளவீடுகளில் தாக்கத்தை ஏற்படுத்தியிருக்குமா?`,
        `அடுத்த வழக்கமான பரிசோதனையை எப்போது மேற்கொள்ள வேண்டும்?`
      ],
      disclaimer: `மருத்துவ முடிவு ஆதரவு அறிவிப்பு: இந்த தன்னியக்க பகுப்பாய்வு கல்வி மற்றும் மருத்துவ ஆதரவிற்காக மட்டுமே வழங்கப்படுகிறது. இது ஒரு திட்டவட்டமான நோயறிதல் அல்ல. எப்போதும் தகுதிவாய்ந்த மருத்துவரை அணுகவும்.`
    },
    hi: {
      summary: `${repType} रिपोर्ट का मेडीवर्स एआई द्वारा संपूर्ण क्लिनिकल विश्लेषण किया गया। कुल ${totalCount} परीक्षण मापदंडों का मूल्यांकन किया गया। इनमें से ${normalCount} सामान्य सीमा में हैं और ${abnormalCount} मापदंडों पर डॉक्टर की समीक्षा आवश्यक है।`,
      normalFindings: `विश्लेषण किए गए सभी पैरामीटर सामान्य संदर्भ सीमाओं के भीतर हैं।`,
      abnormalFindings: `${abnormalCount} पैरामीटर सामान्य संदर्भ सीमा से बाहर हैं। कृपया अपने डॉक्टर से परामर्श लें।`,
      significance: `लैब रिपोर्ट में विचलन का अर्थ तुरंत कोई गंभीर बीमारी नहीं होता। खान-पान, पानी की कमी या तनाव से भी रीडिंग बदल सकती है। उचित मार्गदर्शन के लिए अपने चिकित्सक से परामर्श करें।`,
      recs: [
        `इन लैब परिणामों को अपने शारीरिक लक्षणों से जोड़ने के लिए अपने डॉक्टर से परामर्श करें।`,
        `लैब रिपोर्ट के आधार पर स्वयं दवाओं की खुराक में कोई बदलाव न करें या दवा बंद न करें।`,
        `अगले परीक्षण से पहले पर्याप्त मात्रा में पानी पिएं और शरीर को हाइड्रेटेड रखें।`
      ],
      precautions: [
        `डॉक्टर की सलाह के बिना स्वयं कोई नई दवा या सप्लीमेंट न लें।`,
        `अपनी निर्धारित दवाओं का समय और खुराक डॉक्टर के निर्देशानुसार ही रखें।`,
        `चक्कर आना, सांस फूलना या अत्यधिक कमजोरी महसूस होने पर तुरंत नजदीकी स्वास्थ्य केंद्र जाएं।`
      ],
      questions: [
        `क्या इन असामान्य मानों के लिए तत्काल दवा में बदलाव या दोबारा जांच की आवश्यकता है?`,
        `क्या मेरे वर्तमान आहार या दवाओं ने इन परीक्षण परिणामों को प्रभावित किया हो सकता है?`,
        `अगला नियमित फॉलो-अप या दोबारा जांच कब करानी चाहिए?`
      ],
      disclaimer: `चिकित्सकीय सुरक्षा सूचना: यह स्वचालित विश्लेषण केवल शैक्षिक एवं निर्णय समर्थन हेतु है। यह कोई अंतिम निदान नहीं है। हमेशा प्रमाणित चिकित्सक से परामर्श लें।`
    }
  };

  const t = I18N_REPORTS[language] || I18N_REPORTS.ta;
  const findings = abnormalCount === 0 ? t.normalFindings : t.abnormalFindings;

  const translatedParams = (analysis.parameters || []).map(p => {
    let localStatus = p.status;
    let localFlag = p.flag;
    if (p.status === 'Normal') {
      localStatus = language === 'ta' ? 'இயல்பு வரம்பு (Normal)' : language === 'hi' ? 'सामान्य सीमा (Normal)' : p.status;
      localFlag = 'Normal';
    } else if (p.status.includes('Above') || p.status.includes('High')) {
      localStatus = language === 'ta' ? 'அதிக அளவு (Above)' : language === 'hi' ? 'उच्च सीमा (Above)' : p.status;
      localFlag = p.is_critical ? 'Critical' : 'Review';
    } else if (p.status.includes('Below') || p.status.includes('Low')) {
      localStatus = language === 'ta' ? 'குறைந்த அளவு (Below)' : language === 'hi' ? 'कम सीमा (Below)' : p.status;
      localFlag = p.is_critical ? 'Critical' : 'Review';
    }

    return {
      ...p,
      status: localStatus,
      flag: localFlag,
      explanation: `${p.test_name}: ${p.patient_value} ${p.unit} (${p.reference_range}). ${localStatus}.`
    };
  });

  return {
    ...analysis,
    selected_language: language,
    parameters: translatedParams,
    extracted_parameters: translatedParams,
    test_results_table: translatedParams,
    structured_data: {
      ...analysis.structured_data,
      important_findings: findings,
      overall_summary: t.summary
    },
    report_summary: {
      ...analysis.report_summary,
      important_findings: findings,
      overall_summary: t.summary
    },
    ai_explanation: {
      ...analysis.ai_explanation,
      overall_summary: t.summary,
      summary: t.summary,
      simpleExplanation: t.summary,
      findings_summary: findings,
      whatThisMeans: t.significance,
      possible_significance: t.significance,
      recommendations: t.recs,
      precautions: t.precautions || analysis.ai_explanation?.precautions,
      doctor_discussion_questions: t.questions,
      questionsForDoctor: t.questions,
      disclaimer: t.disclaimer
    }
  };
}

// =========================================================================
// 7. RAG KNOWLEDGE RETRIEVAL
// =========================================================================
export function retrieveRAGKnowledge(text = '', testResults = [], limit = 3) {
  const queryText = (String(text) + ' ' + (Array.isArray(testResults) ? testResults.map(t => `${t.test_name} ${t.status}`).join(' ') : '')).toLowerCase();

  const scoredEntries = CLINICAL_RAG_KNOWLEDGE_BASE.map(entry => {
    let score = 0;
    for (const topic of entry.topics) {
      if (queryText.includes(topic.toLowerCase())) {
        score += 2;
      }
    }
    if (Array.isArray(testResults)) {
      for (const t of testResults) {
        if (t.status !== 'Normal') {
          if (entry.topics.some(tp => (t.test_name || '').toLowerCase().includes(tp))) {
            score += 3;
          }
        }
      }
    }
    return { entry, score };
  });

  const sorted = scoredEntries
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => ({
      id: item.entry.id,
      title: item.entry.title,
      guideline: item.entry.title,
      source: item.entry.source,
      source_url: item.entry.source_url,
      content: item.entry.content
    }));

  if (sorted.length === 0 && CLINICAL_RAG_KNOWLEDGE_BASE.length > 0) {
    return CLINICAL_RAG_KNOWLEDGE_BASE.slice(0, limit).map(entry => ({
      id: entry.id,
      title: entry.title,
      guideline: entry.title,
      source: entry.source,
      source_url: entry.source_url,
      content: entry.content
    }));
  }

  return sorted;
}

// =========================================================================
// 8. END-TO-END MEDICAL REPORT RAG ANALYSIS PIPELINE
// =========================================================================
export async function executeMedicalReportRAGPipeline({
  fileBuffer,
  fileName = 'report.pdf',
  mimeType = 'application/pdf',
  patientName = 'Patient',
  reportType = 'Blood Tests',
  hospital = 'Clinical Laboratory',
  rawText = '',
  language = 'en'
}) {
  console.log(`[RAG Pipeline] Initiating clinical analysis for "${fileName}" (${reportType})...`);

  // 1. Text Extraction (Digital PDF or OCR for scanned documents & images)
  let extractedText = (rawText || '').trim();
  if (!extractedText && fileBuffer) {
    extractedText = await extractTextFromDocument(fileBuffer, mimeType, fileName);
  }

  console.log(`[RAG Pipeline] Extracted document character count: ${extractedText.length}`);

  // 2. Entity & Value Extraction + Clinical Reference Comparison
  let testResults = extractAndCompareLabEntities(extractedText);
  console.log(`[RAG Pipeline] Extracted quantitative test parameters count: ${testResults.length}`);

  // 3. Grounded RAG Knowledge Retrieval
  const ragSources = retrieveRAGKnowledge(extractedText, testResults, 3);

  // 4. Generate Detailed Patient-Friendly Explanation (Step 5)
  const todayStr = new Date().toISOString().split('T')[0];
  const explanation = await generateAiPatientFriendlyExplanation({
    testResults,
    patientName,
    reportType,
    hospital,
    date: todayStr,
    extractedText,
    language,
    ragSources
  });

  const normalCount = testResults.filter(t => t.status === "Normal" || t.flag === "Normal").length;
  const abnormalCount = testResults.filter(t => t.status !== "Normal" && t.status !== "Unable to determine").length;
  const criticalCount = testResults.filter(t => t.is_critical).length;

  const baseResult = {
    status: 'COMPLETED',
    analysis_status: 'COMPLETED',
    parameters: testResults,
    extracted_parameters: testResults,
    test_results_table: testResults,
    structured_data: {
      report_type: reportType,
      date_of_report: todayStr,
      hospital_or_lab: hospital,
      important_findings: explanation.findings_summary,
      overall_summary: explanation.overall_summary,
      total_tests_analyzed: testResults.length,
      normal_parameters: normalCount,
      abnormal_parameters: abnormalCount,
      critical_parameters: criticalCount
    },
    report_summary: {
      report_type: reportType,
      date_of_report: todayStr,
      hospital_or_lab: hospital,
      important_findings: explanation.findings_summary,
      overall_summary: explanation.overall_summary,
      total_tests_analyzed: testResults.length,
      normal_parameters: normalCount,
      abnormal_parameters: abnormalCount,
      critical_parameters: criticalCount
    },
    ai_explanation: explanation,
    clinical_explanation: {
      summary: explanation.overall_summary,
      findings_summary: explanation.findings_summary,
      recommendations: explanation.recommendations,
      doctor_discussion_questions: explanation.doctor_discussion_questions
    },
    medical_recommendations: {
      evidence_guidance: explanation.recommendations,
      safety_disclaimer: explanation.disclaimer
    },
    rag_citations: ragSources,
    rag_sources: ragSources,
    extracted_text: extractedText,
    extracted_text_preview: extractedText.slice(0, 1000)
  };

  if (language && language !== 'en') {
    return translateReportAnalysis(baseResult, language);
  }

  return baseResult;
}
