/**
 * api/reportRAG.js
 * Comprehensive Medical Report RAG Analysis Pipeline
 * 
 * Pipeline:
 * Report Upload → File Validation → OCR/PDF Extraction → Text Cleaning → 
 * Medical Entity Extraction → Test & Value Detection → Reference Range Comparison → 
 * RAG Knowledge Retrieval → Clinical Analysis Synthesis → Structured Results Output
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
let PDFParse = null;
try {
  const pdfMod = require('pdf-parse');
  PDFParse = pdfMod.PDFParse || pdfMod;
} catch (e) {
  // fallback loader
}

// Comprehensive evidence-based clinical knowledge base for RAG retrieval
export const CLINICAL_RAG_KNOWLEDGE_BASE = [
  {
    id: "kb_cbc_hemoglobin",
    category: "Hematology",
    topics: ["hemoglobin", "hb", "anemia", "rbc", "erythrocytes", "iron deficiency", "polycythemia"],
    title: "WHO Guidelines on the Assessment of Anemia & Hemoglobin Concentrations",
    source: "World Health Organization (WHO) Nutritional & Diagnostic Protocols",
    source_url: "https://www.who.int/publications/i/item/9789240019256",
    verified_at: "2026-Q1",
    content: "Normal adult hemoglobin values are 13.8–17.2 g/dL in men and 12.1–15.1 g/dL in non-pregnant women. Values below 12.0 g/dL indicate anemia, most commonly iron deficiency, blood loss, or nutritional deficit. Hemoglobin levels below 7.0 g/dL represent severe anemia requiring urgent medical attention. Elevated levels above 17.5 g/dL may suggest hemoconcentration, chronic smoking, hypoxemic lung disease, or polycythemia."
  },
  {
    id: "kb_diabetes_glucose",
    category: "Endocrinology",
    topics: ["fasting blood sugar", "fbs", "glucose", "post prandial", "ppbs", "diabetes", "hyperglycemia", "hypoglycemia"],
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
    topics: ["wbc", "white blood cells", "leukocytes", "infection", "leukocytosis", "leukopenia"],
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
    topics: ["serum creatinine", "creatinine", "kidney", "renal", "egfr", "nephropathy"],
    title: "KDIGO Clinical Practice Guideline for the Evaluation and Management of Kidney Disease",
    source: "Kidney Disease: Improving Global Outcomes (KDIGO) Practice Guidelines",
    source_url: "https://kdigo.org/guidelines/",
    verified_at: "2026-Q1",
    content: "Normal serum creatinine is 0.74–1.35 mg/dL in adult males and 0.59–1.04 mg/dL in adult females. Creatinine is a byproduct of muscle breakdown eliminated almost exclusively by renal glomerular filtration. Elevations reflect reduced renal filtration. Acute elevations > 0.3 mg/dL within 48 hours or values > 2.5 mg/dL warrant immediate clinical nephrology evaluation to exclude Acute Kidney Injury (AKI) and prevent chronic structural damage."
  },
  {
    id: "kb_renal_bun",
    category: "Nephrology",
    topics: ["bun", "blood urea nitrogen", "urea", "dehydration", "uremia"],
    title: "National Kidney Foundation (NKF) Clinical Guideline on Nitrogenous Markers",
    source: "National Kidney Foundation (NKF) KDOQI Protocols",
    source_url: "https://www.kidney.org/",
    verified_at: "2026-Q1",
    content: "Normal Blood Urea Nitrogen (BUN) is 7.0 to 20.0 mg/dL (Serum Urea: 15–40 mg/dL). Elevated BUN occurs in renal hypoperfusion, severe dehydration, congestive heart failure, high protein catabolism, gastrointestinal bleeding, or parenchymal renal disease. A BUN to Creatinine ratio > 20:1 strongly suggests prerenal azotemia or dehydration."
  },
  {
    id: "kb_cardiac_lipids",
    category: "Cardiology",
    topics: ["total cholesterol", "cholesterol", "triglycerides", "ldl", "hdl", "lipid profile", "atherosclerosis"],
    title: "AHA/ACC Multi-Society Guideline on the Management of Blood Cholesterol",
    source: "American College of Cardiology & American Heart Association Cardiovascular Task Force",
    source_url: "https://www.ahajournals.org/doi/10.1161/CIR.0000000000000625",
    verified_at: "2026-Q1",
    content: "Total cholesterol should ideally be < 200 mg/dL; 200–239 mg/dL is borderline high, and >= 240 mg/dL is high risk for atherosclerotic cardiovascular disease. Triglycerides should be < 150 mg/dL; 150–199 mg/dL is borderline, 200–499 mg/dL is high, and >= 500 mg/dL carries significant risk of acute pancreatitis requiring immediate dietary and pharmacotherapy intervention."
  },
  {
    id: "kb_hepatic_liver",
    category: "Hepatology",
    topics: ["bilirubin", "total bilirubin", "liver", "jaundice", "sgot", "ast", "sgpt", "alt", "hepatitis"],
    title: "ACG Clinical Guideline: Evaluation of Abnormal Liver Chemistries",
    source: "American College of Gastroenterology (ACG) Clinical Practice Committee",
    source_url: "https://journals.lww.com/ajg/fulltext/2017/01000/acg_clinical_guideline__evaluation_of_abnormal.19.aspx",
    verified_at: "2026-Q1",
    content: "Total serum bilirubin is normally 0.2 to 1.2 mg/dL. Elevated levels above 2.5 mg/dL cause noticeable scleral icterus and jaundice, indicative of hepatobiliary obstruction, hepatocellular injury, or hemolysis. SGPT (ALT) and SGOT (AST) are transaminases; normal range is typically 10–40 U/L. Significant elevation (> 3x upper limit of normal) reflects active hepatic parenchymal inflammation."
  },
  {
    id: "kb_thyroid_tsh",
    category: "Endocrinology",
    topics: ["tsh", "thyroid", "thyroid stimulating hormone", "hypothyroidism", "hyperthyroidism"],
    title: "ATA Guidelines for the Diagnosis and Management of Thyroid Disease",
    source: "American Thyroid Association (ATA) & Endocrine Society Task Force",
    source_url: "https://www.thyroid.org/professionals/ata-professional-guidelines/",
    verified_at: "2026-Q1",
    content: "Normal adult TSH is 0.45 to 4.50 mIU/L. TSH above 4.50 mIU/L with normal or low free T4 indicates primary hypothyroidism (subclinical if T4 normal, overt if T4 low), causing fatigue, weight gain, cold intolerance, and bradycardia. TSH below 0.40 mIU/L indicates hyperthyroidism, prompting investigation for Graves' disease or toxic thyroid nodules."
  }
];

// Clinical reference ranges for automated entity & value detection across major diagnostic panels
export const CLINICAL_LAB_TEST_DICTIONARY = [
  // 1. Complete Blood Count (CBC) Panel
  {
    name: "Hemoglobin",
    regex: /(?:Hemoglobin|Hb|HGB)\s*[:=\-]?\s*(\d+(?:\.\d+)?)\s*(g\/dL|g\/L|gm\/dl)?/i,
    unit: "g/dL",
    ref_low: 12.0,
    ref_high: 17.0,
    critical_low: 7.0,
    critical_high: 19.0,
    meaning: "Oxygen-carrying iron-rich protein in red blood cells that transports oxygen from the lungs to body tissues.",
    low_reason: "Iron deficiency, blood loss, chronic kidney disease, nutritional deficits, or hemolytic anemia.",
    high_reason: "Dehydration, chronic smoking, hypoxemic lung disease, or primary bone marrow polycythemia."
  },
  {
    name: "RBC Count",
    regex: /(?:RBC|Red\s+Blood\s+Cells?|Erythrocytes?)\s*[:=\-]?\s*(\d+(?:\.\d+)?)\s*(mil\/uL|million\/cumm|10\^6\/uL)?/i,
    unit: "million/cumm",
    ref_low: 4.2,
    ref_high: 5.9,
    critical_low: 2.5,
    critical_high: 7.5,
    meaning: "Total circulating red blood cells responsible for oxygen transport and tissue respiration.",
    low_reason: "Anemia, bleeding, bone marrow failure, hemolysis, or nutritional deficiencies.",
    high_reason: "Erythrocytosis, severe dehydration, congenital heart defect, or polycythemia vera."
  },
  {
    name: "Packed Cell Volume (PCV / Hematocrit)",
    regex: /(?:PCV|Packed\s+Cell\s+Volume|Hematocrit|HCT)\s*[:=\-]?\s*(\d+(?:\.\d+)?)\s*(%)?/i,
    unit: "%",
    ref_low: 36.0,
    ref_high: 50.0,
    critical_low: 20.0,
    critical_high: 60.0,
    meaning: "Proportion of total blood volume composed of red blood cells.",
    low_reason: "Anemia, acute blood loss, overhydration, or bone marrow suppression.",
    high_reason: "Dehydration, chronic hypoxia, chronic obstructive pulmonary disease, or polycythemia."
  },
  {
    name: "Total White Blood Cells (WBC / TLC)",
    regex: /(?:Total\s+WBC|WBC\s+Count|Total\s+Leukocytes?|TLC)\s*[:=\-]?\s*(\d+(?:,\d+)?(?:\.\d+)?)\s*(cells\/cumm|\/mcL|10\^3\/uL|\/cumm)?/i,
    unit: "cells/cumm",
    ref_low: 4000.0,
    ref_high: 11000.0,
    critical_low: 2000.0,
    critical_high: 30000.0,
    meaning: "Total count of immune defense white blood cells that protect the body against infectious organisms and inflammation.",
    low_reason: "Viral infections (dengue, influenza), drug-induced bone marrow suppression, or autoimmune conditions.",
    high_reason: "Active bacterial infection, acute inflammatory processes, tissue necrosis, or severe physiological stress."
  },
  {
    name: "Platelet Count",
    regex: /(?:Platelet\s+Count|Platelets?)\s*[:=\-]?\s*(\d+(?:,\d+)?(?:\.\d+)?)\s*(lakhs\/cumm|\/mcL|10\^3\/uL|\/uL|\/cumm)?/i,
    unit: "lakhs/cumm",
    ref_low: 1.5,
    ref_high: 4.5,
    critical_low: 0.5,
    critical_high: 9.0,
    meaning: "Essential disc-shaped cell fragments required for hemostasis, clot formation, and vascular repair.",
    low_reason: "Thrombocytopenia, viral fevers (dengue, chikungunya), autoimmune destruction (ITP), or splenomegaly.",
    high_reason: "Reactive thrombocytosis secondary to acute infection, iron deficiency, or myeloproliferative disorders."
  },
  {
    name: "Neutrophils",
    regex: /(?:Neutrophils?|Polymorphs?)\s*[:=\-]?\s*(\d+(?:\.\d+)?)\s*(%)?/i,
    unit: "%",
    ref_low: 40.0,
    ref_high: 75.0,
    critical_low: 15.0,
    critical_high: 90.0,
    meaning: "First-responder phagocytic white blood cells targeting acute bacterial pathogens.",
    low_reason: "Neutropenia, severe viral infections, chemotherapy, or autoimmune suppression.",
    high_reason: "Acute bacterial infection, tissue injury, acute systemic inflammation, or glucocorticoid use."
  },
  {
    name: "Lymphocytes",
    regex: /(?:Lymphocytes?)\s*[:=\-]?\s*(\d+(?:\.\d+)?)\s*(%)?/i,
    unit: "%",
    ref_low: 20.0,
    ref_high: 45.0,
    critical_low: 5.0,
    critical_high: 70.0,
    meaning: "Specialized immune cells (B-cells, T-cells) providing adaptive immunity and viral defense.",
    low_reason: "Immunodeficiency, acute steroid exposure, or acute stress reaction.",
    high_reason: "Viral infections (infectious mononucleosis, viral hepatitis, CMV) or chronic lymphocytic leukemia."
  },
  {
    name: "Eosinophils",
    regex: /(?:Eosinophils?)\s*[:=\-]?\s*(\d+(?:\.\d+)?)\s*(%)?/i,
    unit: "%",
    ref_low: 1.0,
    ref_high: 6.0,
    critical_low: 0.0,
    critical_high: 20.0,
    meaning: "White blood cells active against parasitic infections and allergic/atopic responses.",
    low_reason: "Acute stress, bacteremia, or elevated cortisol.",
    high_reason: "Allergic conditions (asthma, allergic rhinitis), parasitic worm infestation, or drug hypersensitivity."
  },
  {
    name: "ESR (Erythrocyte Sedimentation Rate)",
    regex: /(?:ESR|Erythrocyte\s+Sedimentation\s+Rate)\s*[:=\-]?\s*(\d+(?:\.\d+)?)\s*(mm\/hr)?/i,
    unit: "mm/hr",
    ref_low: 0.0,
    ref_high: 20.0,
    critical_low: 0.0,
    critical_high: 100.0,
    meaning: "Rate at which red blood cells sediment in anticoagulated blood, serving as a non-specific inflammatory biomarker.",
    low_reason: "Polycythemia, sickle cell disease, or severe hypofibrinogenemia.",
    high_reason: "Systemic inflammation, autoimmune disease (rheumatoid arthritis, lupus), chronic infections, or malignancy."
  },

  // 2. Diabetes & Glycemic Panel
  {
    name: "Fasting Blood Sugar (Glucose)",
    regex: /(?:Fasting\s+(?:Blood\s+)?(?:Sugar|Glucose)(?:\s*\([^)]+\))?|FBS(?:\s*\([^)]+\))?)\s*[:=\-]?\s*(\d+(?:\.\d+)?)\s*(mg\/dL|mmol\/L)?/i,
    unit: "mg/dL",
    ref_low: 70.0,
    ref_high: 99.0,
    critical_low: 50.0,
    critical_high: 300.0,
    meaning: "Circulating glucose concentration measured after an overnight fast of at least 8 to 12 hours.",
    low_reason: "Excessive antidiabetic medication, prolonged fasting, insulinoma, or heavy alcohol consumption.",
    high_reason: "Impaired fasting glucose / Prediabetes (100–125 mg/dL), or Diabetes Mellitus (>=126 mg/dL)."
  },
  {
    name: "Post Prandial Blood Sugar",
    regex: /(?:Post\s+Prandial\s+(?:Blood\s+)?(?:Sugar|Glucose)(?:\s*\([^)]+\))?|PPBS(?:\s*\([^)]+\))?)\s*[:=\-]?\s*(\d+(?:\.\d+)?)\s*(mg\/dL|mmol\/L)?/i,
    unit: "mg/dL",
    ref_low: 70.0,
    ref_high: 140.0,
    critical_low: 50.0,
    critical_high: 350.0,
    meaning: "Circulating blood glucose level measured exactly 2 hours after completing a standardized meal.",
    low_reason: "Reactive hypoglycemia, excessive mealtime insulin, or delayed gastric emptying.",
    high_reason: "Impaired glucose tolerance (140–199 mg/dL) or uncontrolled diabetes mellitus (>=200 mg/dL)."
  },
  {
    name: "HbA1c (Glycated Hemoglobin)",
    regex: /(?:HbA1c(?:\s*\([^)]+\))?|Glycated\s+Hemoglobin(?:\s*\([^)]+\))?)\s*[:=\-]?\s*(\d+(?:\.\d+)?)\s*(%)?/i,
    unit: "%",
    ref_low: 4.0,
    ref_high: 5.6,
    critical_low: 3.5,
    critical_high: 11.0,
    meaning: "Percentage of red blood cell hemoglobin bound to glucose, reflecting mean blood glucose over the preceding 3 months.",
    low_reason: "Hemolytic anemia, recent acute hemorrhage, or frequent severe hypoglycemic episodes.",
    high_reason: "Prediabetes (5.7%–6.4%) or Diabetes Mellitus (>=6.5%); indicates need for glycemic management."
  },

  // 3. Renal / Kidney Function Panel
  {
    name: "Serum Creatinine",
    regex: /(?:Serum\s+Creatinine|Creatinine)\s*[:=\-]?\s*(\d+(?:\.\d+)?)\s*(mg\/dL|umol\/L)?/i,
    unit: "mg/dL",
    ref_low: 0.70,
    ref_high: 1.30,
    critical_low: 0.3,
    critical_high: 3.5,
    meaning: "Normal breakdown product of creatine phosphate in skeletal muscle, filtered out of the blood exclusively by the kidneys.",
    low_reason: "Decreased muscle mass, severe malnutrition, advanced liver failure, or overhydration.",
    high_reason: "Impaired glomerular filtration, Acute Kidney Injury (AKI), chronic kidney disease, or dehydration."
  },
  {
    name: "Blood Urea Nitrogen (BUN / Urea)",
    regex: /(?:BUN|Blood\s+Urea\s+Nitrogen|Serum\s+Urea|Urea)\s*[:=\-]?\s*(\d+(?:\.\d+)?)\s*(mg\/dL)?/i,
    unit: "mg/dL",
    ref_low: 7.0,
    ref_high: 20.0,
    critical_low: 3.0,
    critical_high: 60.0,
    meaning: "Nitrogenous waste product resulting from dietary and tissue protein breakdown, excreted by renal tubular filtration.",
    low_reason: "Low protein diet, malnutrition, severe liver disease, or physiological fluid overload.",
    high_reason: "Prerenal dehydration, reduced kidney perfusion, high protein catabolism, or gastrointestinal bleeding."
  },
  {
    name: "Serum Uric Acid",
    regex: /(?:Serum\s+Uric\s+Acid|Uric\s+Acid)\s*[:=\-]?\s*(\d+(?:\.\d+)?)\s*(mg\/dL)?/i,
    unit: "mg/dL",
    ref_low: 3.5,
    ref_high: 7.2,
    critical_low: 1.5,
    critical_high: 12.0,
    meaning: "Byproduct of purine nucleotide metabolism excreted primarily by the kidneys.",
    low_reason: "Fanconi syndrome, low purine intake, or heavy allopurinol dosage.",
    high_reason: "Hyperuricemia, gouty arthritis, nephrolithiasis (kidney stones), or impaired renal uric acid excretion."
  },

  // 4. Liver / Hepatic Function Panel
  {
    name: "Serum Bilirubin Total",
    regex: /(?:Total\s+Bilirubin|Bilirubin\s+Total)\s*[:=\-]?\s*(\d+(?:\.\d+)?)\s*(mg\/dL)?/i,
    unit: "mg/dL",
    ref_low: 0.2,
    ref_high: 1.2,
    critical_low: 0.1,
    critical_high: 3.5,
    meaning: "Yellow tetrapyrrole pigment produced by the degradation of heme during normal red blood cell clearance.",
    low_reason: "Generally of no clinical pathological significance.",
    high_reason: "Jaundice, viral hepatitis, alcoholic liver injury, cholestasis, biliary duct obstruction, or hemolysis."
  },
  {
    name: "SGPT / ALT (Alanine Aminotransferase)",
    regex: /(?:SGPT|ALT|Alanine\s+Aminotransferase)\s*[:=\-]?\s*(\d+(?:\.\d+)?)\s*(U\/L|IU\/L)?/i,
    unit: "U/L",
    ref_low: 7.0,
    ref_high: 56.0,
    critical_low: 0.0,
    critical_high: 300.0,
    meaning: "Key intracellular enzyme highly concentrated in hepatocytes; serves as a sensitive marker of acute liver injury.",
    low_reason: "Normal physiological finding; no pathological significance.",
    high_reason: "Hepatocellular injury, viral hepatitis, non-alcoholic fatty liver disease (NAFLD), or medication hepatotoxicity."
  },
  {
    name: "SGOT / AST (Aspartate Aminotransferase)",
    regex: /(?:SGOT|AST|Aspartate\s+Aminotransferase)\s*[:=\-]?\s*(\d+(?:\.\d+)?)\s*(U\/L|IU\/L)?/i,
    unit: "U/L",
    ref_low: 10.0,
    ref_high: 40.0,
    critical_low: 0.0,
    critical_high: 300.0,
    meaning: "Enzyme present in liver cells, cardiac muscle, and skeletal muscle; elevated during hepatocellular damage.",
    low_reason: "Normal physiological finding.",
    high_reason: "Hepatic parenchymal necrosis, acute alcohol intake, strenuous exercise, or myocardial ischemia."
  },
  {
    name: "Alkaline Phosphatase (ALP)",
    regex: /(?:Alkaline\s+Phosphatase|ALP)\s*[:=\-]?\s*(\d+(?:\.\d+)?)\s*(U\/L|IU\/L)?/i,
    unit: "U/L",
    ref_low: 44.0,
    ref_high: 147.0,
    critical_low: 15.0,
    critical_high: 450.0,
    meaning: "Enzyme concentrated in biliary epithelial cells and osteoblasts of growing/remodeling bone.",
    low_reason: "Zinc deficiency, severe malnutrition, or hypothyroidism.",
    high_reason: "Biliary tract obstruction (gallstones, stricture), cholestasis, active bone healing, or Paget's disease."
  },

  // 5. Lipid / Cardiovascular Profile
  {
    name: "Total Cholesterol",
    regex: /(?:Total\s+Cholesterol|Cholesterol\s+Total)\s*[:=\-]?\s*(\d+(?:\.\d+)?)\s*(mg\/dL|mmol\/L)?/i,
    unit: "mg/dL",
    ref_low: 125.0,
    ref_high: 200.0,
    critical_low: 90.0,
    critical_high: 320.0,
    meaning: "Composite measurement of all circulating lipoproteins carrying sterols throughout the cardiovascular system.",
    low_reason: "Severe malabsorption, hyperthyroidism, or severe chronic liver disease.",
    high_reason: "Hypercholesterolemia, familial lipid disorders, hypothyroidism, and increased risk of arterial plaque buildup."
  },
  {
    name: "Triglycerides",
    regex: /(?:Triglycerides?)\s*[:=\-]?\s*(\d+(?:\.\d+)?)\s*(mg\/dL|mmol\/L)?/i,
    unit: "mg/dL",
    ref_low: 50.0,
    ref_high: 150.0,
    critical_low: 25.0,
    critical_high: 500.0,
    meaning: "Primary chemical form of fat stored in adipose tissue and transported in circulating blood.",
    low_reason: "Low-fat dietary regimen, malabsorption, or hyperthyroidism.",
    high_reason: "Hypertriglyceridemia, metabolic syndrome, uncontrolled diabetes, obesity; values >500 mg/dL increase pancreatitis risk."
  },
  {
    name: "HDL Cholesterol (Good Cholesterol)",
    regex: /(?:HDL(?:\s+Cholesterol)?)\s*[:=\-]?\s*(\d+(?:\.\d+)?)\s*(mg\/dL|mmol\/L)?/i,
    unit: "mg/dL",
    ref_low: 40.0,
    ref_high: 60.0,
    critical_low: 25.0,
    critical_high: 100.0,
    meaning: "High-Density Lipoprotein that removes excess cholesterol from arterial tissues and transports it to the liver for excretion.",
    low_reason: "Sedentary lifestyle, smoking, type 2 diabetes, elevated cardiovascular atherosclerotic risk.",
    high_reason: "Protective cardioprotective factor; regular aerobic exercise and healthy lifestyle."
  },
  {
    name: "LDL Cholesterol (Bad Cholesterol)",
    regex: /(?:LDL(?:\s+Cholesterol)?)\s*[:=\-]?\s*(\d+(?:\.\d+)?)\s*(mg\/dL|mmol\/L)?/i,
    unit: "mg/dL",
    ref_low: 50.0,
    ref_high: 100.0,
    critical_low: 20.0,
    critical_high: 190.0,
    meaning: "Low-Density Lipoprotein responsible for depositing cholesterol along arterial walls and plaque progression.",
    low_reason: "Aggressive statin therapy, severe malnutrition, or hypolipidemia.",
    high_reason: "Elevated risk of coronary artery disease, myocardial infarction, and atherosclerotic stroke."
  },

  // 6. Thyroid Function Panel
  {
    name: "Thyroid Stimulating Hormone (TSH)",
    regex: /(?:TSH(?:\s*-\s*[A-Za-z\s]+|\s*\([^)]+\))?|Thyroid\s+Stimulating\s+Hormone(?:\s*\([^)]+\))?)\s*[:=\-]?\s*(\d+(?:\.\d+)?)\s*(mIU\/L|uIU\/mL)?/i,
    unit: "mIU/L",
    ref_low: 0.45,
    ref_high: 4.50,
    critical_low: 0.05,
    critical_high: 20.0,
    meaning: "Anterior pituitary hormone that stimulates the thyroid gland to produce and secrete T3 and T4 metabolic hormones.",
    low_reason: "Hyperthyroidism, Graves' disease, toxic multinodular goiter, or excessive thyroid hormone replacement.",
    high_reason: "Hypothyroidism (Hashimoto's thyroiditis), iodine deficiency, or subclinical thyroid failure."
  },

  // 7. Electrolytes & Micronutrients
  {
    name: "Serum Calcium",
    regex: /(?:Serum\s+Calcium|Calcium)\s*[:=\-]?\s*(\d+(?:\.\d+)?)\s*(mg\/dL)?/i,
    unit: "mg/dL",
    ref_low: 8.5,
    ref_high: 10.5,
    critical_low: 6.5,
    critical_high: 13.0,
    meaning: "Essential mineral for myocardial contractility, neuromuscular transmission, and skeletal bone integrity.",
    low_reason: "Hypocalcemia, hypoparathyroidism, vitamin D deficiency, or chronic kidney failure.",
    high_reason: "Hypercalcemia, primary hyperparathyroidism, bone metastases, or excessive vitamin D supplementation."
  },
  {
    name: "Vitamin D (25-OH)",
    regex: /(?:Vitamin\s+D(?:\s+Total)?|25-OH\s+Vitamin\s+D)\s*[:=\-]?\s*(\d+(?:\.\d+)?)\s*(ng\/mL|nmol\/L)?/i,
    unit: "ng/mL",
    ref_low: 30.0,
    ref_high: 100.0,
    critical_low: 10.0,
    critical_high: 150.0,
    meaning: "Fat-soluble secosteroid essential for intestinal calcium absorption and bone mineral metabolism.",
    low_reason: "Vitamin D deficiency (<20 ng/mL), insufficient sunlight exposure, malabsorption, or poor dietary intake.",
    high_reason: "Vitamin D toxicity from excessive over-the-counter supplementation."
  },
  {
    name: "Vitamin B12",
    regex: /(?:Vitamin\s+B12|B12|Cobalamin)\s*[:=\-]?\s*(\d+(?:\.\d+)?)\s*(pg\/mL|pmol\/L)?/i,
    unit: "pg/mL",
    ref_low: 211.0,
    ref_high: 911.0,
    critical_low: 100.0,
    critical_high: 1500.0,
    meaning: "Water-soluble vitamin essential for red blood cell hematopoiesis and neurological myelin sheath maintenance.",
    low_reason: "Megaloblastic anemia, peripheral neuropathy, strict vegan diet without supplementation, or pernicious anemia.",
    high_reason: "Excessive vitamin supplementation, severe liver disease, or chronic myeloid leukemia."
  }
];

/**
 * Extracts raw text from uploaded PDF, image, or text buffer.
 * Supports PDF parsing via modern PDFParse class and multimodal OCR via @google/genai if GEMINI_API_KEY is present.
 */
export async function extractTextFromDocument(fileBuffer, mimeType, filename) {
  if (!fileBuffer || fileBuffer.length === 0) {
    return "";
  }

  const isPdf = (mimeType && mimeType.includes('pdf')) || (filename && filename.toLowerCase().endsWith('.pdf'));
  const isImage = (mimeType && (mimeType.includes('image') || mimeType.includes('jpeg') || mimeType.includes('png') || mimeType.includes('jpg'))) ||
    (filename && /\.(jpe?g|png|webp|gif|bmp)$/i.test(filename));

  // 1. Try Gemini Multimodal Vision / OCR if API key is provided in environment
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (geminiApiKey && (isImage || isPdf)) {
    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: geminiApiKey });
      const prompt = "Extract all text, laboratory test names, numerical values, measurement units, and reference intervals verbatim from this diagnostic medical report. Output the extracted text clearly.";
      const mediaPart = {
        inlineData: {
          data: fileBuffer.toString('base64'),
          mimeType: mimeType || (isPdf ? 'application/pdf' : 'image/png')
        }
      };
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [prompt, mediaPart]
      });
      if (response && response.text && response.text.trim().length > 10) {
        return response.text.trim();
      }
    } catch (geminiErr) {
      console.warn('[Gemini Vision OCR] Optical recognition notice:', geminiErr.message);
    }
  }

  // 2. Standard PDF text extraction via PDFParse
  if (isPdf) {
    try {
      if (PDFParse) {
        const parser = new PDFParse({ data: fileBuffer });
        const data = await parser.getText();
        await parser.destroy();
        if (data && data.text && data.text.trim()) {
          return data.text.trim();
        }
      }
    } catch (e) {
      console.warn('[PDF Parser] Standard PDFParse failed, attempting fallback raw string extraction:', e.message);
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
 * Parses laboratory values, units, and compares with clinical reference bounds.
 * Uses both clinical dictionary regexes and tabular column heuristics.
 */
export function extractAndCompareLabEntities(text) {
  const extractedTests = [];
  const matchedTestKeys = new Set();

  if (!text) {
    return [];
  }

  // 1. Match against authoritative clinical dictionary
  for (const dict of CLINICAL_LAB_TEST_DICTIONARY) {
    const match = text.match(dict.regex);
    if (match) {
      let rawVal = match[1].replace(/,/g, '');
      let numVal = parseFloat(rawVal);
      if (isNaN(numVal)) continue;

      let unit = match[2] || dict.unit;

      // Handle platelets format: if written as 220000 -> 2.2 lakhs
      if (dict.name === "Platelet Count" && numVal > 1000) {
        numVal = Math.round((numVal / 100000) * 100) / 100;
        unit = "lakhs/cumm";
      }

      let status = "Normal";
      let isCritical = false;

      if (numVal < dict.ref_low) {
        status = "Below reference range";
        if (dict.critical_low && numVal <= dict.critical_low) {
          status = "Critical flag";
          isCritical = true;
        }
      } else if (numVal > dict.ref_high) {
        status = "Above reference range";
        if (dict.critical_high && numVal >= dict.critical_high) {
          status = "Critical flag";
          isCritical = true;
        }
      }

      const explanation = status === "Normal"
        ? `${dict.name} (${numVal} ${unit}) is within physiological reference intervals (${dict.ref_low} - ${dict.ref_high} ${unit}). ${dict.meaning}`
        : `${dict.name} (${numVal} ${unit}) is ${status} (Normal: ${dict.ref_low} - ${dict.ref_high} ${unit}). ${status.includes('Below') ? dict.low_reason : dict.high_reason}`;

      extractedTests.push({
        test_name: dict.name,
        patient_value: numVal,
        unit: unit,
        reference_range: `${dict.ref_low} - ${dict.ref_high} ${unit}`,
        status: status,
        flag: status === "Normal" ? "Normal" : isCritical ? "Critical" : "Review",
        is_critical: isCritical,
        meaning: dict.meaning,
        possible_reasons: status.includes('Below') ? dict.low_reason : dict.high_reason,
        explanation: explanation
      });

      matchedTestKeys.add(dict.name.toLowerCase());
    }
  }

  // 2. Tabular row parsing for tests formatted in standard columns
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  for (const line of lines) {
    // Pattern: [Test Name] [Value] [Unit?] [Low] - [High] [Flag?]
    const tableMatch = line.match(/^([A-Za-z\s()\/.\-_]+?)\s+(\d+(?:\.\d+)?)\s*([A-Za-z\/%^0-9]+)?\s+(?:(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)|[<>]\s*(\d+(?:\.\d+)?))\s*([A-Za-z*]+)?$/);
    if (tableMatch) {
      const rawName = tableMatch[1].trim();
      if (rawName.length < 3 || /^(date|page|patient|doctor|hospital|age|gender|sample|result|test|status|sr|no)/i.test(rawName)) continue;
      if (matchedTestKeys.has(rawName.toLowerCase())) continue;

      const numVal = parseFloat(tableMatch[2]);
      const unit = tableMatch[3] || 'units';
      const refLow = tableMatch[4] ? parseFloat(tableMatch[4]) : (tableMatch[6] ? 0 : null);
      const refHigh = tableMatch[5] ? parseFloat(tableMatch[5]) : (tableMatch[6] ? parseFloat(tableMatch[6]) : null);
      const rawFlag = (tableMatch[7] || '').toUpperCase();

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

      extractedTests.push({
        test_name: rawName,
        patient_value: numVal,
        unit: unit,
        reference_range: refLow !== null && refHigh !== null ? `${refLow} - ${refHigh} ${unit}` : 'Standard reference interval',
        status: status,
        flag: status === "Normal" ? "Normal" : isCritical ? "Critical" : "Review",
        is_critical: isCritical,
        meaning: `Measured observation for ${rawName}.`,
        possible_reasons: status === "Normal" ? "Value aligns with laboratory bounds." : "Correlate with clinical history and review with your physician.",
        explanation: `${rawName}: Observed value ${numVal} ${unit}. Status: ${status}.`
      });

      matchedTestKeys.add(rawName.toLowerCase());
    }
  }

  return extractedTests;
}

/**
 * Multilingual Report Explanation Translator
 * Supports 8 languages: English (en), Tamil (ta), Hindi (hi), Telugu (te), Malayalam (ml), Kannada (kn), Bengali (bn), Marathi (mr).
 * Translates clinical evaluations, findings, recommendations, and discussion points
 * while strictly preserving original numbers, units, test names, and reference ranges verbatim.
 */
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
      summary: `${repType} மருத்துவ அறிக்கை மெடிவர்ஸ் AI மூலம் ஆய்வு செய்யப்பட்டது. மொத்தம் ${totalCount} ஆய்வக அளவீடுகள் பகுப்பாய்வு செய்யப்பட்டன. இதில் ${normalCount} அளவீடுகள் சாதாரண வரம்பிற்குள் உள்ளன, ${abnormalCount} அளவீடுகள் மருத்துவ மறுஆய்வுக்கு பரிந்துரைக்கப்படுகின்றன.`,
      normalFindings: `பகுப்பாய்வு செய்யப்பட்ட அனைத்து அளவீடுகளும் மருத்துவ இயல்பு வரம்பிற்குள் உள்ளன.`,
      abnormalFindings: `${abnormalCount} அளவீடுகள் நிலையான குறிப்பு வரம்பிற்கு வெளியே உள்ளன. உங்கள் மருத்துவரிடம் ஆலோசிக்கவும்.`,
      recs: [
        `இந்த ஆய்வக முடிவுகளை உங்கள் அறிகுறிகளுடன் ஒப்பிட்டுப் பார்க்க உங்கள் மருத்துவரிடம் ஆலோசனை பெறவும்.`,
        `மருத்துவரின் ஆலோசனையின்றி பரிந்துரைக்கப்பட்ட மருந்துகளின் அளவை மாற்றவோ நிறுத்தவோ வேண்டாம்.`,
        `மறு பரிசோதனைக்குச் செல்லும் முன் போதுமான அளவு தண்ணீர் குடித்து நீரேற்றத்துடன் இருக்கவும்.`
      ],
      questions: [
        `மாறுபட்ட அளவீடுகளுக்கு உடனடி மருந்து மாற்றம் அல்லது தொடர் பரிசோதனைகள் தேவையா?`,
        `எனது தற்போதைய உணவுமுறை, மருந்துகள் அல்லது நீர்ச்சத்து இந்த அளவீடுகளில் மாற்றத்தை ஏற்படுத்தியிருக்குமா?`,
        `அடுத்த வழக்கமான பரிசோதனையை எப்போது மேற்கொள்ள வேண்டும்?`
      ],
      disclaimer: `மருத்துவ முடிவு ஆதரவு அறிவிப்பு: இந்த தன்னியக்க பகுப்பாய்வு கல்வி மற்றும் மருத்துவ ஆதரவிற்காக மட்டுமே வழங்கப்படுகிறது. இது ஒரு திட்டவட்டமான நோயறிதல் அல்ல. எப்போதும் தகுதிவாய்ந்த மருத்துவரை அணுகவும்.`
    },
    hi: {
      summary: `${repType} रिपोर्ट का मेडीवर्स एआई द्वारा क्लिनिकल विश्लेषण किया गया। कुल ${totalCount} परीक्षण मापदंडों का मूल्यांकन किया गया। इनमें से ${normalCount} सामान्य सीमा में हैं और ${abnormalCount} मापदंडों पर डॉक्टर की समीक्षा आवश्यक है।`,
      normalFindings: `विश्लेषण किए गए सभी पैरामीटर सामान्य संदर्भ सीमाओं के भीतर हैं।`,
      abnormalFindings: `${abnormalCount} पैरामीटर सामान्य संदर्भ सीमा से बाहर हैं। कृपया अपने डॉक्टर से परामर्श लें।`,
      recs: [
        `इन लैब परिणामों को अपने शारीरिक लक्षणों से जोड़ने के लिए अपने डॉक्टर से परामर्श करें।`,
        `लैब रिपोर्ट के आधार पर स्वयं दवाओं की खुराक में कोई बदलाव न करें या दवा बंद न करें।`,
        `अगले परीक्षण से पहले पर्याप्त मात्रा में पानी पिएं और शरीर को हाइड्रेटेड रखें।`
      ],
      questions: [
        `क्या इन असामान्य मानों के लिए तत्काल दवा में बदलाव या दोबारा जांच की आवश्यकता है?`,
        `क्या मेरे वर्तमान आहार, दवाओं या जलयोजन स्तर ने इन परीक्षण परिणामों को प्रभावित किया हो सकता है?`,
        `अगला नियमित फॉलो-अप या दोबारा जांच कब करानी चाहिए?`
      ],
      disclaimer: `चिकित्सकीय सुरक्षा सूचना: यह स्वचालित विश्लेषण केवल शैक्षिक एवं निर्णय समर्थन हेतु है। यह कोई अंतिम निदान नहीं है। हमेशा प्रमाणित चिकित्सक से परामर्श लें।`
    },
    te: {
      summary: `${repType} నివేదిక మెడివర్స్ AI ద్వారా సమీక్షించబడింది. మొత్తం ${totalCount} పరీక్షలు విశ్లేషించబడ్డాయి. వీటిలో ${normalCount} సాధారణ పరిధిలో ఉన్నాయి, ${abnormalCount} పరీక్షలకు వైద్యుని పరిశీలన అవసరం.`,
      normalFindings: `విశ్లేషించబడిన అన్ని పరీక్షా విలువలు సాధారణ పరిధిలోనే ఉన్నాయి.`,
      abnormalFindings: `${abnormalCount} పరీక్షా విలువలు సాధారణ పరిమితికి వెలుపల ఉన్నాయి. డాక్టర్‌ను సంప్రదించండి.`,
      recs: [
        `ఈ ప్రయోగశాల ఫలితాలను మీ ఆరోగ్య లక్షణాలతో సరిచూసుకోవడానికి డాక్టర్‌ను సంప్రదించండి.`,
        `స్వంత నిర్ణయంతో మందుల మోతాదును మార్చడం లేదా నిలిపివేయడం చేయవద్దు.`,
        `తదుపరి పరీక్షకు ముందు తగినంత నీరు త్రాగి శరీరాన్ని హైడ్రేటెడ్‌గా ఉంచండి.`
      ],
      questions: [
        `అసాధారణ విలువల కోసం మందుల మార్పులు లేదా పునఃపరీక్ష అవసరమా?`,
        `నా ప్రస్తుత ఆహారం లేదా మందులు ఈ ఫలితాలపై ప్రభావం చూపాయా?`,
        `తదుపరి పరీక్షను ఎప్పుడు నిర్వహించాలి?`
      ],
      disclaimer: `వైద్య భద్రతా సమాచారం: ఈ స్వయంచాలక విశ్లేషణ అవగాహన కొరకు మాత్రమే. ఎల్లప్పుడూ అర్హతగల వైద్యుడిని సంప్రదించండి.`
    },
    ml: {
      summary: `${repType} റിപ്പോർട്ട് മെഡിവേഴ്സ് AI വഴി പരിശോധിച്ചു. ആകെ ${totalCount} ലാബ് പരിശോധനകൾ വിശകലനം ചെയ്തു. ഇതിൽ ${normalCount} എണ്ണം സാധാരണ പരിധിയിലാണ്, ${abnormalCount} പരിശോധനകൾ ഡോക്ടറുടെ വിലയിരുത്തലിനായി നിർദ്ദേശിക്കുന്നു.`,
      normalFindings: `പരിശോധിച്ച എല്ലാ അളവുകളും സാധാരണ പരിധിക്കുള്ളിലാണ്.`,
      abnormalFindings: `${abnormalCount} അളവുകൾ സാധാരണ റഫറൻസ് പരിധിക്ക് പുറത്താണ്. ഡോക്ടറോട് സംസാരിക്കുക.`,
      recs: [
        `ഈ കണ്ടെത്തലുകൾ നിങ്ങളുടെ ശാരീരിക ലക്ഷണങ്ങളുമായി താരതമ്യം ചെയ്യാൻ ഡോക്ടറുടെ ഉപദേശം തേടുക.`,
        `സ്വന്തം നിലയ്ക്ക് മരുന്നുകളുടെ അളവ് മാറ്റുകയോ നിർത്തുകയോ ചെയ്യരുത്.`,
        `വീണ്ടും പരിശോധന നടത്തുന്നതിന് മുൻപ് ആവശ്യത്തിന് വെള്ളം കുടിക്കുക.`
      ],
      questions: [
        `വ്യതിയാനമുള്ള അളവുകൾക്ക് അടിയന്തര മരുന്ന് മാറ്റമോ തുടർപരിശോധനയോ ആവശ്യമുണ്ടോ?`,
        `നിലവിലെ ഭക്ഷണരീതിയോ മരുന്നുകളോ ഈ അളവുകളെ സ്വാധീനിച്ചിട്ടുണ്ടോ?`,
        `അടുത്ത പരിശോധന എപ്പോഴാണ് നടത്തേണ്ടത്?`
      ],
      disclaimer: `മെഡിക്കൽ സുരക്ഷാ അറിയിപ്പ്: ഈ വിശകലനം പഠനാവശ്യത്തിന് മാത്രമുള്ളതാണ്. എല്ലായ്പ്പോഴും ഡോക്ടറുടെ സേവനം തേടുക.`
    },
    kn: {
      summary: `${repType} ವರದಿಯನ್ನು ಮೆಡಿವರ್ಸ್ AI ಮೂಲಕ ವಿಶ್ಲೇಷಿಸಲಾಗಿದೆ. ಒಟ್ಟು ${totalCount} ಪರೀಕ್ಷಾ ನಿಯತಾಂಕಗಳನ್ನು ಮೌಲ್ಯಮಾಪನ ಮಾಡಲಾಗಿದೆ. ${normalCount} ಸಾಮಾನ್ಯ ಮಿತಿಯಲ್ಲಿದ್ದರೆ, ${abnormalCount} ನಿಯತಾಂಕಗಳಿಗೆ ವೈದ್ಯರ ಪರಿಶೀಲನೆ ಅಗತ್ಯವಿದೆ.`,
      normalFindings: `ವಿಶ್ಲೇಷಿಸಲಾದ ಎಲ್ಲಾ ಪರೀಕ್ಷೆಗಳು ಸಾಮಾನ್ಯ ಮಿತಿಯೊಳಗೆ ಇವೆ.`,
      abnormalFindings: `${abnormalCount} ಪರೀಕ್ಷೆಗಳು ಸಾಮಾನ್ಯ ಮಿತಿಗಿಂತ ಹೊರಗಿವೆ. ದಯವಿಟ್ಟು ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ.`,
      recs: [
        `ಈ ವರದಿಯ ಫಲಿತಾಂಶಗಳನ್ನು ನಿಮ್ಮ ಆರೋಗ್ಯದ ಲಕ್ಷಣಗಳೊಂದಿಗೆ ಪರಿಶೀಲಿಸಲು ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ.`,
        `ಸ್ವಯಂಪ್ರೇರಿತವಾಗಿ ಔಷಧಿಗಳ ಡೋಸ್ ಬದಲಾಯಿಸಬೇಡಿ ಅಥವಾ ನಿಲ್ಲಿಸಬೇಡಿ.`,
        `ಮತ್ತೊಮ್ಮೆ ಪರೀಕ್ಷೆ ಮಾಡುವ ಮುನ್ನ ಸಾಕಷ್ಟು ನೀರು ಕುಡಿಯಿರಿ.`
      ],
      questions: [
        `ಅಸಹಜ ಮೌಲ್ಯಗಳಿಗೆ ತಕ್ಷಣದ ಔಷಧಿ ಬದಲಾವಣೆ ಅಗತ್ಯವಿದೆಯೇ?`,
        `ನನ್ನ ಪ್ರಸ್ತುತ ಆಹಾರ ಅಥವಾ ಔಷಧಿಗಳು ಈ ಫಲಿತಾಂಶದ ಮೇಲೆ ಪ್ರಭಾವ ಬೀರಿದೆಯೇ?`,
        `ಮುಂದಿನ ತಪಾಸಣೆಯನ್ನು ಯಾವಾಗ ಮಾಡಿಸಿಕೊಳ್ಳಬೇಕು?`
      ],
      disclaimer: `ವೈದ್ಯಕೀಯ ಸುರಕ್ಷತಾ ಸೂಚನೆ: ಈ ವಿಶ್ಲೇಷಣೆಯು ಮಾಹಿತಿಗಾಗಿ ಮಾತ್ರ. ಯಾವಾಗಲೂ ಅರ್ಹ ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ.`
    },
    bn: {
      summary: `${repType} রিপোর্টটি মেডিভার্স এআই দ্বারা বিশ্লেষণ করা হয়েছে। মোট ${totalCount} টি পরীক্ষার মান মূল্যায়ন করা হয়েছে। এর মধ্যে ${normalCount} টি স্বাভাবিক সীমার মধ্যে রয়েছে এবং ${abnormalCount} টি মানে ডাক্তারের পর্যালোচনা প্রয়োজন।`,
      normalFindings: `বিশ্লেষিত সমস্ত প্যারামিটার স্বাভাবিক সীমার মধ্যে রয়েছে।`,
      abnormalFindings: `${abnormalCount} টি প্যারামিটার স্বাভাবিক সীমার বাইরে রয়েছে। ডাক্তারের পরামর্শ নিন।`,
      recs: [
        `ল্যাব ফলাফলের সাথে আপনার শারীরিক লক্ষণ মিলিয়ে দেখতে ডাক্তারের পরামর্শ নিন।`,
        `নিজ থেকে ওষুধের ডোজ পরিবর্তন করবেন না বা বন্ধ করবেন না।`,
        `পুনরায় পরীক্ষার আগে পর্যাপ্ত জল পান করুন।`
      ],
      questions: [
        `অস্বাভাবিক মানগুলির জন্য কোনো ওষুধ পরিবর্তন বা পুনরায় পরীক্ষা দরকার কি?`,
        `আমার বর্তমান খাদ্যাভ্যাস বা ওষুধ কি এই ফলাফলে প্রভাব ফেলতে পারে?`,
        `পরবর্তী নিয়মিত পরীক্ষা কবে করানো উচিত?`
      ],
      disclaimer: `চিকিৎসা সুরক্ষা বিজ্ঞপ্তি: এই স্বয়ংক্রিয় বিশ্লেষণ শুধুমাত্র শিক্ষামূলক সহায়তার জন্য। সর্বদা ডাক্তারের পরামর্শ নিন।`
    },
    mr: {
      summary: `${repType} अहवालाचे मेडीव्हर्स AI द्वारे विश्लेषण करण्यात आले. एकूण ${totalCount} चाचण्यांचे मूल्यमापन केले गेले. यापैकी ${normalCount} चाचण्या सामान्य मर्यादेत आहेत आणि ${abnormalCount} चाचण्यांवर डॉक्टरांचा सल्ला आवश्यक आहे.`,
      normalFindings: `विश्लेषण केलेले सर्व मापदंड सामान्य मर्यादेत आहेत.`,
      abnormalFindings: `${abnormalCount} मापदंड सामान्य संदर्भ मर्यादेबाहेर आहेत. कृपया डॉक्टरांचा सल्ला घ्या.`,
      recs: [
        `या अहवालाचे निष्कर्ष तुमच्या शारीरिक लक्षणांशी ताडून पाहण्यासाठी डॉक्टरांचा सल्ला घ्या.`,
        `स्वतःहून औषधांचा डोस बदलू नका किंवा औषध बंद करू नका.`,
        `पुढील तपासणीपूर्वी पुरेसे पाणी प्या.`
      ],
      questions: [
        `असामान्य मूल्यांसाठी औषधात बदल किंवा पुन्हा तपासणी आवश्यक आहे का?`,
        `माझ्या सध्याच्या आहाराचा किंवा औषधांचा या निष्कर्षांवर परिणाम झाला आहे का?`,
        `पुढील तपासणी कधी करावी?`
      ],
      disclaimer: `वैद्यकीय सूचना: हे स्वयंचलित विश्लेषण केवळ मार्गदर्शनासाठी आहे. नेहमी तज्ज्ञ डॉक्टरांचा सल्ला घ्या.`
    }
  };

  const t = I18N_REPORTS[language] || I18N_REPORTS.ta;
  const findings = abnormalCount === 0 ? t.normalFindings : t.abnormalFindings;

  // Translate test parameter explanations
  const translatedParams = (analysis.parameters || []).map(p => {
    let localStatus = p.status;
    let localFlag = p.flag;
    if (p.status === 'Normal') {
      localStatus = language === 'ta' ? 'இயல்பு வரம்பு' : language === 'hi' ? 'सामान्य सीमा' : p.status;
      localFlag = 'Normal';
    } else if (p.status.includes('Above')) {
      localStatus = language === 'ta' ? 'அதிக அளவு (Above)' : language === 'hi' ? 'उच्च सीमा (Above)' : p.status;
      localFlag = p.is_critical ? 'Critical' : 'Review';
    } else if (p.status.includes('Below')) {
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
    status: 'COMPLETED',
    analysis_status: 'COMPLETED',
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
      summary: t.summary,
      findings_summary: findings,
      recommendations: t.recs,
      doctor_discussion_questions: t.questions,
      disclaimer: t.disclaimer
    },
    clinical_explanation: {
      summary: t.summary,
      findings_summary: findings,
      recommendations: t.recs,
      doctor_discussion_questions: t.questions
    }
  };
}

/**
 * Grounded RAG Knowledge Retrieval
 * Retrieves evidence-based clinical guidelines matching the extracted parameters and text.
 */
export function retrieveRAGKnowledge(text = '', testResults = [], limit = 3) {
  const queryText = (String(text) + ' ' + (Array.isArray(testResults) ? testResults.map(t => `${t.test_name} ${t.status}`).join(' ') : '')).toLowerCase();

  const scoredEntries = CLINICAL_RAG_KNOWLEDGE_BASE.map(entry => {
    let score = 0;
    for (const topic of entry.topics) {
      if (queryText.includes(topic.toLowerCase())) {
        score += 2;
      }
    }
    // Also reward matching abnormal parameters
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

/**
 * Executes complete end-to-end RAG analysis pipeline.
 */
export async function executeMedicalReportRAGPipeline({
  fileBuffer,
  fileName,
  mimeType,
  patientName = 'Patient',
  reportType = 'Blood Tests',
  hospital = 'Clinical Laboratory',
  rawText = '',
  language = 'en'
}) {
  // 1. Text Extraction
  let extractedText = (rawText || '').trim();
  if (!extractedText && fileBuffer) {
    extractedText = await extractTextFromDocument(fileBuffer, mimeType, fileName);
  }

  // 2. Entity & Value Extraction + Reference Range Comparison
  let testResults = extractAndCompareLabEntities(extractedText);

  // 3. RAG Knowledge Retrieval
  const ragSources = retrieveRAGKnowledge(extractedText, testResults, 3);

  // 4. Counts & Highlights
  const normalCount = testResults.filter(t => t.status === "Normal" || t.flag === "Normal").length;
  const abnormalCount = testResults.filter(t => t.status !== "Normal" && t.status !== "Unable to determine").length;
  const criticalCount = testResults.filter(t => t.is_critical).length;

  const abnormalItems = testResults.filter(t => t.status !== "Normal");
  let findingsSummary = "";
  if (testResults.length === 0) {
    findingsSummary = "Document uploaded and securely archived in digital medical records. Original file is preserved and available for clinician review and download.";
  } else if (abnormalCount === 0) {
    findingsSummary = "All analyzed parameters fall within established reference ranges.";
  } else {
    findingsSummary = `${abnormalCount} parameter(s) are outside standard reference intervals (${abnormalItems.map(a => `${a.test_name}: ${a.status}`).join(', ')}).`;
  }

  // 5. Medical Recommendations (Cautious, Evidence-Based)
  const recommendations = [];
  if (criticalCount > 0) {
    recommendations.push("URGENT CLINICAL REVIEW: One or more parameters exhibit marked deviations. Promptly contact your physician or visit a healthcare center.");
  }
  if (abnormalCount > 0) {
    recommendations.push("Schedule a follow-up consultation with your attending medical doctor to correlate these laboratory findings with your physical symptoms and history.");
  }
  if (testResults.length === 0) {
    recommendations.push("The original uploaded document is stored securely in your medical records and can be opened or downloaded anytime.");
    recommendations.push("Share this document directly with your attending physician during consultation for clinical evaluation.");
  } else {
    recommendations.push("Do not start, stop, or adjust prescription dosages independently based on these laboratory values alone.");
    recommendations.push("Maintain standard hydration and bring previous historical lab reports to your appointment for longitudinal trend analysis.");
  }

  // Questions for doctor
  const doctorDiscussionQuestions = [
    "Do any of the highlighted laboratory values require immediate medical intervention or repeat confirmatory testing?",
    "Could my current medications, dietary habits, or hydration status have influenced these specific test numbers?",
    "When should I schedule the next routine follow-up or repeat diagnostic panel?"
  ];

  const overallSummary = testResults.length === 0
    ? `This ${reportType} document was uploaded and securely recorded in patient medical records. The original document is available for direct clinical review and download.`
    : `This ${reportType} was processed using Mediverse AI's clinical RAG pipeline. ` +
      `A total of ${testResults.length} test parameter(s) were extracted and evaluated against clinical reference manuals. ` +
      `${normalCount} parameter(s) are within normal physiological bounds, and ${abnormalCount} parameter(s) warrant clinical review. ` +
      findingsSummary;

  const baseResult = {
    status: 'COMPLETED',
    analysis_status: 'COMPLETED',
    parameters: testResults,
    extracted_parameters: testResults,
    test_results_table: testResults,
    structured_data: {
      report_type: reportType,
      date_of_report: new Date().toISOString().split('T')[0],
      hospital_or_lab: hospital,
      important_findings: findingsSummary,
      overall_summary: overallSummary,
      total_tests_analyzed: testResults.length,
      normal_parameters: normalCount,
      abnormal_parameters: abnormalCount,
      critical_parameters: criticalCount,
    },
    report_summary: {
      report_type: reportType,
      date_of_report: new Date().toISOString().split('T')[0],
      hospital_or_lab: hospital,
      important_findings: findingsSummary,
      overall_summary: overallSummary,
      total_tests_analyzed: testResults.length,
      normal_parameters: normalCount,
      abnormal_parameters: abnormalCount,
      critical_parameters: criticalCount,
    },
    ai_explanation: {
      summary: overallSummary,
      findings_summary: findingsSummary,
      recommendations: recommendations,
      doctor_discussion_questions: doctorDiscussionQuestions,
      test_evaluations: testResults.map(t => ({
        test_name: t.test_name,
        measures: t.meaning,
        interpretation: t.explanation,
        possible_causes: t.possible_reasons,
        evaluation_needed: t.status !== "Normal"
      })),
      disclaimer: "MEDICAL DECISION SUPPORT DISCLAIMER: This automated analysis is designed strictly for educational and clinical decision support. It does NOT constitute a definitive medical diagnosis, prescription, or clinical treatment directive. Always consult a qualified registered medical practitioner."
    },
    clinical_explanation: {
      summary: overallSummary,
      findings_summary: findingsSummary,
      recommendations: recommendations,
      doctor_discussion_questions: doctorDiscussionQuestions
    },
    medical_recommendations: {
      evidence_guidance: recommendations,
      safety_disclaimer: "MEDICAL DECISION SUPPORT DISCLAIMER: This automated analysis is designed strictly for educational and clinical decision support. It does NOT constitute a definitive medical diagnosis, prescription, or clinical treatment directive. Always consult a qualified registered medical practitioner."
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
