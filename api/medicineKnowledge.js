/**
 * api/medicineKnowledge.js
 * Authoritative Medical Knowledge Base & Clinical Annotation Engine across Pharmacological Classes.
 * Aligned with:
 * - Central Drugs Standard Control Organisation (CDSCO), Govt of India
 * - Indian National List of Essential Medicines (NLEM 2022)
 * - WHO Model List of Essential Medicines (23rd List, 2023)
 * - Indian Pharmacopoeia (IP) & Approved Prescribing Information
 */

export const MEDICAL_DISCLAIMER =
  "CLINICAL SAFETY MANDATE: General reference information derived from authoritative pharmacopeias (CDSCO, WHO EML, NLEM). " +
  "Reference dosage ranges and pharmacology are established clinical standards and MUST NOT be construed as individualized prescriptions. " +
  "Never adjust, initiate, or discontinue medications without direct evaluation by a registered medical practitioner or licensed pharmacist.";

// Clinical drug classes and pharmacodynamics database with distinct active classes
export const CLINICAL_DRUG_CLASSES = [
  // 1. Penicillins & Beta-Lactamase Inhibitor Combinations
  {
    class_id: "penicillins_aminopenicillins",
    keywords: ["amoxicillin", "amoxycillin", "ampicillin", "augmentin", "clavam", "moxikind", "moxclav", "tazomac", "piperacillin", "clavulanate", "clavulanic"],
    drug_class: "Penicillin & Beta-Lactamase Inhibitor Antibiotic",
    category: "Antibiotics & Anti-Infectives",
    treats_nature: "Underlying Bacterial Infection (Eradicates susceptible bacterial pathogens)",
    mechanism_of_action: "Beta-lactam bactericidal antibiotic that inhibits bacterial cell wall synthesis by binding to penicillin-binding proteins (PBPs), leading to osmotic instability and autolytic cell wall lysis. Clavulanate irreversibly inactivates beta-lactamase enzymes to restore antibacterial spectrum.",
    available_strengths: ["250 mg", "500 mg", "625 mg (500+125)", "1000 mg", "1.2 g IV"],
    dosage_forms: ["Tablet", "Dispersible Tablet", "Oral Suspension", "Injection IV"],
    approved_indications: [
      "Community-acquired bacterial pneumonia and lower respiratory infections",
      "Acute bacterial sinusitis and otitis media",
      "Urinary tract infections (pyelonephritis, cystitis)",
      "Skin and soft tissue infections (cellulitis, abscesses)",
      "Dental abscesses and odontogenic infections"
    ],
    reference_dosage: "Adults: 625 mg orally every 8 to 12 hours with meals for 5–10 days. Pediatric: 25–45 mg/kg/day divided into 2–3 doses.",
    administration_instructions: "Administer at the start of a meal to enhance absorption and minimize gastrointestinal intolerance. Complete the full prescribed course.",
    common_side_effects: ["Mild diarrhea", "Nausea", "Mild abdominal cramping", "Oral or vaginal candidiasis"],
    serious_adverse_effects: ["Anaphylaxis and angioedema", "Stevens-Johnson syndrome / Toxic Epidermal Necrolysis", "Clostridioides difficile-associated pseudomembranous colitis", "Cholestatic jaundice / acute hepatic dysfunction"],
    contraindications: ["Documented hypersensitivity to penicillins or beta-lactam antibiotics", "History of amoxicillin/clavulanate-associated cholestatic jaundice"],
    drug_interactions: ["Methotrexate (decreased renal clearance)", "Warfarin (increased INR and bleeding risk)", "Allopurinol (increased incidence of skin rashes)"],
    food_interactions: "Taking at the beginning of a meal enhances absorption and minimizes gastrointestinal distress.",
    pregnancy_precautions: "Category B. Animal studies show no teratogenicity. Used during pregnancy when clinically indicated.",
    breastfeeding_precautions: "Excreted into breast milk in trace amounts. Monitor infant for loose stools or oral thrush.",
    age_precautions: "Pediatric: Weight-based dosing required. Geriatric: Dose reduction required if eGFR < 30 mL/min.",
    storage_instructions: "Store below 25°C in a dry place protected from moisture. Reconstituted oral suspensions must be refrigerated (2°C–8°C) and discarded after 7 days.",
    schedule: "Schedule H1 Prescription Drug",
    prescription_required: true,
    source: "CDSCO / Indian Pharmacopoeia / NLEM 2022"
  },

  // 2. Fluoroquinolones (DNA Gyrase & Topoisomerase IV Inhibitors)
  {
    class_id: "fluoroquinolones",
    keywords: ["ciprofloxacin", "cifran", "ciplox", "levofloxacin", "levaquin", "l-cin", "ofloxacin", "oflox", "zanocin", "moxifloxacin", "avelox", "moxicip", "norfloxacin", "norflox"],
    drug_class: "Fluoroquinolone Antibacterial (DNA Gyrase Inhibitor)",
    category: "Antibiotics & Anti-Infectives",
    treats_nature: "Underlying Bacterial Infection (Bactericidal DNA replication arrest)",
    mechanism_of_action: "Inhibits bacterial DNA gyrase (topoisomerase II) and topoisomerase IV, enzymes essential for bacterial DNA replication, transcription, repair, and recombination, causing rapid bacterial cell death.",
    available_strengths: ["250 mg", "500 mg", "750 mg", "200 mg/100ml IV", "400 mg IV"],
    dosage_forms: ["Tablet", "Intravenous Infusion", "Eye Drops", "Ear Drops"],
    approved_indications: [
      "Complicated urinary tract infections and pyelonephritis",
      "Infectious gastroenteritis, severe enteric fever (typhoid), and traveler's diarrhea",
      "Hospital-acquired and community-acquired bacterial pneumonia",
      "Chronic bacterial prostatitis",
      "Complicated intra-abdominal infections (in combination with metronidazole)"
    ],
    reference_dosage: "Ciprofloxacin: 500 mg orally every 12 hours for 7–14 days; Levofloxacin: 500–750 mg orally once daily. Adjust for renal impairment.",
    administration_instructions: "Take with a full glass of water. Maintain abundant fluid intake. Avoid taking concurrently with antacids, iron, or calcium supplements (separate by at least 2 hours).",
    common_side_effects: ["Nausea", "Dyspepsia", "Mild diarrhea", "Dizziness", "Headache"],
    serious_adverse_effects: ["Tendinitis and tendon rupture (especially Achilles tendon)", "QTc interval prolongation and torsades de pointes", "Peripheral neuropathy (potentially irreversible)", "CNS toxicities (convulsions, hallucinations, acute psychosis)", "Exacerbation of myasthenia gravis"],
    contraindications: ["Documented hypersensitivity to fluoroquinolones", "History of tendon disorders related to fluoroquinolone administration", "Patients with myasthenia gravis"],
    drug_interactions: ["Antacids containing aluminum/magnesium, sucralfate, iron salts, and didanosine drastically impair absorption", "Theophylline (elevated theophylline toxicity)", "Warfarin (potentiates anticoagulant effect)", "Class IA and III antiarrhythmics (additive QT prolongation)"],
    food_interactions: "Dairy products (milk, yogurt) and calcium-fortified juices significantly impair absorption when consumed concurrently.",
    pregnancy_precautions: "Avoid during pregnancy due to cartilage damage observed in weight-bearing joints of juvenile animal studies.",
    breastfeeding_precautions: "Excreted into breast milk. Alternative antibiotic preferred during lactation.",
    age_precautions: "Avoid in pediatric patients below 18 years unless no therapeutic alternative exists (arthropathy risk). Use with caution in elderly patients (>60 years) due to increased risk of tendon rupture.",
    storage_instructions: "Store below 25°C in a dry place protected from direct sunlight.",
    schedule: "Schedule H1 Prescription Drug",
    prescription_required: true,
    source: "CDSCO / US FDA Boxed Warning Guidance / WHO Model List of Essential Medicines"
  },

  // 3. Cephalosporins (Cell Wall Synthesis Inhibitors)
  {
    class_id: "cephalosporins",
    keywords: ["cefixime", "zifi", "taxim-o", "ceftriaxone", "monocef", "cefpodoxime", "gudcef", "mono-cef", "cefuroxime", "ceftum", "supacef", "cephalexin", "sporidex", "cefotaxime", "taxim", "cefepime"],
    drug_class: "Cephalosporin Antibiotic (1st, 2nd, 3rd Generation)",
    category: "Antibiotics & Anti-Infectives",
    treats_nature: "Underlying Bacterial Infection (Bactericidal cell wall lysis)",
    mechanism_of_action: "Binds to penicillin-binding proteins (PBPs) located on bacterial cell membranes, inhibiting transpeptidation and cross-linking of peptidoglycan chains, leading to cell wall breakdown and bacterial autolysis.",
    available_strengths: ["100 mg", "200 mg", "500 mg", "1 g IV", "2 g IV"],
    dosage_forms: ["Tablet", "Dispersible Tablet", "Oral Suspension", "Injection IV/IM"],
    approved_indications: [
      "Acute bacterial sinusitis, pharyngitis, and tonsillitis",
      "Uncomplicated gonorrhea and pelvic inflammatory disease",
      "Bacterial meningitis and severe sepsis (Ceftriaxone IV)",
      "Acute uncomplicated and complicated urinary tract infections",
      "Bacterial enteritis and enteric fever"
    ],
    reference_dosage: "Cefixime: 200 mg orally twice daily or 400 mg once daily for 7–14 days. Ceftriaxone: 1–2 g IV/IM once daily.",
    administration_instructions: "May be taken with or without food. Ceftriaxone IV should be administered over 30 minutes.",
    common_side_effects: ["Mild diarrhea", "Nausea", "Abdominal discomfort", "Headache"],
    serious_adverse_effects: ["Anaphylactic shock", "C. difficile colitis", "Immune-mediated hemolytic anemia", "Biliary sludging (Ceftriaxone)"],
    contraindications: ["Documented severe IgE-mediated hypersensitivity to cephalosporins or severe anaphylaxis to penicillins", "Neonates (≤28 days) requiring calcium-containing IV solutions (precipitation risk)"],
    drug_interactions: ["Calcium-containing diluents (risk of insoluble ceftriaxone-calcium precipitates in lungs/kidneys)", "Warfarin (may enhance hypoprothrombinemic effect)", "Probenecid (increases cephalosporin plasma concentrations)"],
    food_interactions: "Absorption of cefuroxime axetil is enhanced when taken with food.",
    pregnancy_precautions: "Category B. Generally considered safe when clinically necessary.",
    breastfeeding_precautions: "Excreted in low concentrations into breast milk; generally compatible with nursing.",
    age_precautions: "Dosage reduction in renal impairment for renally excreted cephalosporins (cefixime, cefuroxime).",
    storage_instructions: "Store tablets below 25°C in a dry place. Reconstituted ceftriaxone vials must be used within 24 hours at room temperature or 48 hours refrigerated.",
    schedule: "Schedule H1 Prescription Drug",
    prescription_required: true,
    source: "CDSCO & Indian Pharmacopoeia / NLEM 2022"
  },

  // 4. Macrolides (50S Ribosomal Protein Synthesis Inhibitors)
  {
    class_id: "macrolides",
    keywords: ["azithromycin", "azithral", "azee", "zithromax", "clarithromycin", "claribid", "erythromycin", "roxithromycin", "roxid"],
    drug_class: "Macrolide Antibacterial (50S Ribosomal Subunit Inhibitor)",
    category: "Antibiotics & Anti-Infectives",
    treats_nature: "Underlying Bacterial Infection (Bacteriostatic protein synthesis inhibition)",
    mechanism_of_action: "Binds reversibly to the 50S ribosomal subunit of susceptible microorganisms, inhibiting transpeptidation and translocation during peptide chain elongation, arresting bacterial protein synthesis.",
    available_strengths: ["250 mg", "500 mg", "100 mg/5ml", "200 mg/5ml", "500 mg IV"],
    dosage_forms: ["Tablet", "Capsule", "Oral Suspension", "Intravenous Infusion"],
    approved_indications: [
      "Community-acquired pneumonia, acute bronchitis, and atypical respiratory infections (Mycoplasma, Chlamydia, Legionella)",
      "Streptococcal pharyngitis/tonsillitis in penicillin-allergic patients",
      "Skin and soft tissue infections",
      "Sexually transmitted genital infections (chlamydial urethritis, cervicitis)",
      "Enteric fever and traveler's diarrhea"
    ],
    reference_dosage: "Azithromycin: 500 mg orally once daily for 3 days, or 500 mg on day 1 followed by 250 mg once daily on days 2 to 5.",
    administration_instructions: "Azithromycin tablets may be taken with or without food. Extended-release suspension must be taken on an empty stomach (1 hour before or 2 hours after food).",
    common_side_effects: ["Nausea", "Diarrhea", "Abdominal cramping", "Vomiting", "Taste disturbance"],
    serious_adverse_effects: ["QTc interval prolongation and ventricular arrhythmias (torsades de pointes)", "Hepatotoxicity / cholestatic jaundice", "Infantile hypertrophic pyloric stenosis", "Clostridioides difficile colitis"],
    contraindications: ["Known hypersensitivity to azithromycin, erythromycin, or any macrolide", "History of cholestatic jaundice/hepatic dysfunction associated with prior macrolide use"],
    drug_interactions: ["Aluminum/magnesium antacids reduce peak serum levels (separate by 2 hours)", "Digoxin (elevated digoxin concentrations)", "Warfarin (increased anticoagulant effect)", "Class IA/III antiarrhythmics (additive QT prolongation)"],
    food_interactions: "May take with meals to reduce gastrointestinal upset without significantly decreasing total bioavailability of tablets.",
    pregnancy_precautions: "Category B. Azithromycin is the preferred macrolide during pregnancy when indicated.",
    breastfeeding_precautions: "Excreted into breast milk. Monitor infant for diarrhea, vomiting, and candidiasis.",
    age_precautions: "Pediatric: Weight-based dosing (10 mg/kg/day). Caution in elderly patients with pre-existing proarrhythmic cardiac conditions.",
    storage_instructions: "Store below 30°C in a dry place protected from heat and moisture.",
    schedule: "Schedule H1 Prescription Drug",
    prescription_required: true,
    source: "CDSCO & WHO Model List of Essential Medicines"
  },

  // 5. Tetracyclines (30S Ribosomal Subunit Inhibitors)
  {
    class_id: "tetracyclines",
    keywords: ["doxycycline", "doxicip", "doxy-1", "minocycline", "tetracycline"],
    drug_class: "Tetracycline Antibiotic (30S Ribosomal Subunit Inhibitor)",
    category: "Antibiotics & Anti-Infectives",
    treats_nature: "Underlying Bacterial & Atypical Pathogen Infection",
    mechanism_of_action: "Binds reversibly to the 30S ribosomal subunit, preventing the access of aminoacyl-tRNA to the ribosomal acceptor (A) site on the mRNA-ribosome complex, inhibiting bacterial protein synthesis.",
    available_strengths: ["50 mg", "100 mg", "200 mg"],
    dosage_forms: ["Capsule", "Tablet", "Injection IV"],
    approved_indications: [
      "Scrub typhus, rickettsial diseases, and vector-borne infections",
      "Moderate-to-severe inflammatory acne vulgaris and rosacea",
      "Chlamydial genital and ocular infections",
      "Community-acquired respiratory tract infections (Mycoplasma, Chlamydia pneumoniae)",
      "Prophylaxis and treatment of malaria, cholera, and anthrax"
    ],
    reference_dosage: "Adults: 100 mg orally every 12 hours on day 1, followed by 100 mg once daily (or 100 mg every 12 hours for severe infections).",
    administration_instructions: "Take with a full glass of water (at least 200 mL) in a sitting or standing posture. Do NOT lie down for at least 30 minutes after taking to prevent severe esophageal ulceration.",
    common_side_effects: ["Nausea", "Vomiting", "Dyspepsia", "Photosensitivity and sunburn rash"],
    serious_adverse_effects: ["Esophageal ulceration", "Intracranial hypertension (pseudotumor cerebri)", "Severe cutaneous adverse reactions (SJS/TEN)", "Tooth enamel hypoplasia and permanent discoloration in children"],
    contraindications: ["Documented hypersensitivity to tetracyclines", "Pregnancy and lactation", "Children under 8 years of age (causes permanent tooth discoloration and enamel hypoplasia)"],
    drug_interactions: ["Antacids containing aluminum, calcium, magnesium, or iron supplements chelate with doxycycline and prevent absorption (separate by 3 hours)", "Carbamazepine and phenytoin increase doxycycline clearance", "Oral retinoids (isotretinoin) markedly increase pseudotumor cerebri risk"],
    food_interactions: "Avoid taking concurrently with high-calcium dairy products; take 1 hour before or 2 hours after dairy.",
    pregnancy_precautions: "Category D. Contraindicated during pregnancy due to skeletal developmental arrest and permanent tooth staining in fetus.",
    breastfeeding_precautions: "Contraindicated during breastfeeding due to potential effects on dental enamel and bone growth.",
    age_precautions: "Strictly contraindicated in children under 8 years of age unless treating life-threatening infections (e.g. anthrax, Rocky Mountain spotted fever).",
    storage_instructions: "Store below 25°C in a dry place protected from light and heat.",
    schedule: "Schedule H1 Prescription Drug",
    prescription_required: true,
    source: "CDSCO & WHO Model List of Essential Medicines"
  },

  // 6. Carbapenems (Ultra-Broad-Spectrum Beta-Lactams)
  {
    class_id: "carbapenems",
    keywords: ["meropenem", "meronem", "imipenem", "ertapenem", "doripenem"],
    drug_class: "Carbapenem Beta-Lactam Antibiotic",
    category: "Antibiotics & Anti-Infectives",
    treats_nature: "Severe Multidrug-Resistant Nosocomial Infection",
    mechanism_of_action: "Ultra-broad-spectrum beta-lactam that penetrates bacterial outer membranes and irreversibly binds to high-affinity penicillin-binding proteins (PBP-2, PBP-3), causing rapid bacterial cell wall synthesis inhibition and bactericidal autolysis. Highly resistant to degradation by beta-lactamases and ESBLs.",
    available_strengths: ["500 mg IV", "1 g IV"],
    dosage_forms: ["Powder for Injection IV / Infusion"],
    approved_indications: [
      "Severe hospital-acquired pneumonia and ventilator-associated pneumonia",
      "Complicated intra-abdominal infections and peritonitis",
      "Complicated skin and soft-tissue infections",
      "Bacterial meningitis in adults and pediatric patients",
      "Septicemia and febrile neutropenia in immunocompromised patients"
    ],
    reference_dosage: "Adults: 500 mg to 1 g IV every 8 hours infused over 15 to 30 minutes (or extended 3-hour infusion for resistant pathogens).",
    administration_instructions: "Administer by intravenous infusion over 15 to 30 minutes or by intravenous bolus over 3 to 5 minutes.",
    common_side_effects: ["Diarrhea", "Nausea", "Headache", "Local injection site phlebitis", "Rash"],
    serious_adverse_effects: ["Seizures and CNS toxicity (especially in renal impairment)", "Clostridioides difficile colitis", "Severe anaphylaxis", "Thrombocytopenia and leukopenia"],
    contraindications: ["Severe hypersensitivity to carbapenems or immediate-type anaphylactic reactions to beta-lactam antibiotics"],
    drug_interactions: ["Valproic acid / Sodium valproate (drastically reduces serum valproic acid levels leading to loss of seizure control; concurrent use contraindicated)", "Probenecid (inhibits renal excretion of meropenem)"],
    food_interactions: "Not applicable (strictly parenteral intravenous administration).",
    pregnancy_precautions: "Category B. Use only if clinical benefit outweighs fetal risk.",
    breastfeeding_precautions: "Excreted in low levels in breast milk. Exercise caution when administering to nursing women.",
    age_precautions: "Dose adjustment strictly mandatory in patients with renal impairment (creatinine clearance < 50 mL/min) to avoid neurotoxicity.",
    storage_instructions: "Store dry powder below 25°C. Reconstituted solution should be used promptly or kept refrigerated (2°C–8°C) for up to 24 hours.",
    schedule: "Schedule H1 Prescription Drug (Reserve Antibiotic)",
    prescription_required: true,
    source: "CDSCO / National Treatment Guidelines for Antimicrobial Use in Infectious Diseases"
  },

  // 7. Paracetamol / Acetaminophen (Central Analgesic & Antipyretic)
  {
    class_id: "paracetamol_antipyretic",
    keywords: ["paracetamol", "acetaminophen", "dolo", "crocin", "calpol", "pacimol", "pyregesic", "febrex"],
    drug_class: "Central Analgesic & Antipyretic Agent",
    category: "Analgesics & Antipyretics",
    treats_nature: "Symptomatic Pyrexia & Mild-to-Moderate Somatic Pain",
    mechanism_of_action: "Inhibits prostaglandin synthesis in the central nervous system (predominantly via central COX variants/peroxidase site inhibition), modulating the hypothalamic thermoregulatory center to induce peripheral vasodilation and sweating (antipyresis), while blocking central pain impulse generation. Lacks significant peripheral anti-inflammatory action.",
    available_strengths: ["500 mg", "650 mg", "1000 mg IV", "120 mg/5ml", "250 mg/5ml", "100 mg/ml drops"],
    dosage_forms: ["Tablet", "Fast-Release Tablet", "Syrup / Suspension", "Oral Drops", "Intravenous Infusion", "Suppository"],
    approved_indications: [
      "Pyrexia (fever) secondary to viral, bacterial, or inflammatory etiology and post-vaccination fever",
      "Mild to moderate pain: headache, tension headache, migraine, toothache, and otalgia",
      "Musculoskeletal aches, joint pain, arthralgia, and acute muscle strain",
      "Primary dysmenorrhea and postoperative discomfort"
    ],
    reference_dosage: "Adults: 500 mg to 650 mg orally every 4 to 6 hours as needed. MAXIMUM DAILY DOSE MUST NOT EXCEED 4,000 mg (4g) in 24 hours (or 3,000 mg in chronic liver disease/elderly). Pediatric: 10–15 mg/kg per dose every 4–6 hours (max 60 mg/kg/day).",
    administration_instructions: "May be taken with or without food. Drink plenty of fluids. Avoid all concurrent over-the-counter medications containing paracetamol to prevent accidental overdose.",
    common_side_effects: ["Mild nausea", "Mild dyspepsia", "Transient pruritus or skin rash"],
    serious_adverse_effects: ["Dose-dependent acute hepatic necrosis (NAPQI metabolite toxicity)", "Acute liver failure requiring transplantation", "Acute renal tubular necrosis", "Severe cutaneous reactions (Stevens-Johnson syndrome, AGEP)"],
    contraindications: ["Severe active hepatic impairment or decompensated liver disease", "Documented hypersensitivity to paracetamol"],
    drug_interactions: ["Chronic heavy alcohol intake markedly potentiates hepatotoxic risk via CYP2E1 induction", "Warfarin: Regular high doses (>2g/day) may elevate INR and increase bleeding risk", "Isoniazid (elevates hepatotoxic metabolite formation)"],
    food_interactions: "Absorption may be slightly delayed if taken with high-carbohydrate meals, but total absorption is unaffected.",
    pregnancy_precautions: "First-line analgesic/antipyretic during all trimesters of pregnancy at lowest effective dose for shortest necessary duration.",
    breastfeeding_precautions: "Compatible with breastfeeding. Excreted in breast milk in negligible clinical quantities.",
    age_precautions: "Pediatric: Exact weight-based dosing is essential. Geriatric: Caution in frail elderly patients with low body weight (<50 kg).",
    storage_instructions: "Store below 30°C protected from direct sunlight and moisture.",
    schedule: "General Sale Formulation / Schedule H (high strength IV formulations)",
    prescription_required: false,
    source: "CDSCO & WHO Model List of Essential Medicines / IP 2022"
  },

  // 8. Opioid Analgesics & Centrally Acting Analgesics
  {
    class_id: "opioid_analgesics",
    keywords: ["tramadol", "tramazac", "ultracet", "tapentadol", "codeine", "morphine", "fentanyl", "buprenorphine"],
    drug_class: "Centrally Acting Synthetic Opioid Analgesic & SNRI",
    category: "Analgesics & Antipyretics",
    treats_nature: "Moderate to Severe Acute & Chronic Pain",
    mechanism_of_action: "Dual mechanism of action: Weak mu-opioid receptor agonism by parent drug and active M1 metabolite, combined with central neuronal reuptake inhibition of serotonin (5-HT) and norepinephrine, augmenting descending inhibitory spinal pain pathways.",
    available_strengths: ["50 mg", "100 mg", "37.5mg + 325mg (Tramadol+Paracetamol)", "100 mg/2ml Injection"],
    dosage_forms: ["Capsule", "Tablet", "Extended-Release Tablet", "Injection IV/IM"],
    approved_indications: [
      "Moderate to severe acute post-surgical and post-traumatic somatic pain",
      "Severe chronic musculoskeletal and neuropathic pain unresponsive to non-opioids",
      "Cancer-related pain management (Step 2/3 of WHO Pain Ladder)"
    ],
    reference_dosage: "Adults: 50 mg to 100 mg orally every 4 to 6 hours as needed. Maximum dose: 400 mg/day (or 300 mg/day in elderly >75 years).",
    administration_instructions: "Take with or without food. Do not chew or crush extended-release tablets. Do NOT consume alcohol during treatment.",
    common_side_effects: ["Dizziness", "Nausea", "Vomiting", "Constipation", "Somnolence", "Dry mouth", "Sweating"],
    serious_adverse_effects: ["Respiratory depression", "Seizures and convulsions (especially with SSRIs/antidepressants)", "Serotonin syndrome", "Physiological dependence, abuse, and withdrawal syndrome"],
    contraindications: ["Acute intoxication with alcohol, hypnotics, or centrally acting analgesics", "Severe respiratory depression or acute bronchial asthma", "Concurrent use of MAO inhibitors (or within 14 days)"],
    drug_interactions: ["Serotonergic antidepressants (SSRIs, SNRIs, tricyclics) markedly elevate serotonin syndrome and seizure risk", "Benzodiazepines and CNS depressants cause profound sedation and fatal respiratory arrest", "Carbamazepine significantly reduces tramadol analgesic effect"],
    food_interactions: "Avoid alcohol completely; alcohol dramatically enhances CNS depression and respiratory arrest risk.",
    pregnancy_precautions: "Category C. Avoid during pregnancy; chronic use may cause neonatal opioid withdrawal syndrome.",
    breastfeeding_precautions: "Not recommended during breastfeeding due to risk of serious infant sedation and respiratory depression.",
    age_precautions: "Contraindicated in children under 12 years of age (and adolescents under 18 years post-tonsillectomy). Dose reduction required in geriatric patients.",
    storage_instructions: "Store below 25°C in secure storage protected from unauthorized access, moisture, and heat.",
    schedule: "Schedule H1 Prescription Drug / NDPS Regulated Formulation",
    prescription_required: true,
    source: "CDSCO & Indian Pharmacopoeia / Narcotic Drugs and Psychotropic Substances Act"
  },

  // 9. Non-Steroidal Anti-Inflammatory Drugs (NSAIDs)
  {
    class_id: "nsaids_selective_nonselective",
    keywords: ["ibuprofen", "brufen", "combiflam", "diclofenac", "voveran", "aceclofenac", "zerodol", "hifenac", "naproxen", "naprosyn", "etoricoxib", "nucoxia", "etoshine", "piroxicam", "mefenamic", "meftal", "indomethacin"],
    drug_class: "Non-Steroidal Anti-Inflammatory Drug (NSAID)",
    category: "Non-Steroidal Anti-Inflammatory Drugs (NSAIDs)",
    treats_nature: "Inflammatory Pain & Peripheral Tissue Prostaglandin Suppression",
    mechanism_of_action: "Inhibits cyclooxygenase enzymes (COX-1 and/or COX-2), preventing the conversion of arachidonic acid to pro-inflammatory prostaglandins, prostacyclins, and thromboxanes, reducing peripheral inflammation, pain signaling, and hyperalgesia.",
    available_strengths: ["100 mg", "200 mg", "400 mg", "50 mg", "90 mg", "120 mg", "75 mg/3ml IM"],
    dosage_forms: ["Tablet", "Enteric-Coated Tablet", "Gel / Topical Emulsion", "Injection IM/IV"],
    approved_indications: [
      "Rheumatoid arthritis, osteoarthritis, and ankylosing spondylitis",
      "Acute musculoskeletal sprains, strains, and post-traumatic soft-tissue inflammation",
      "Post-operative acute surgical pain and dental post-extraction pain",
      "Primary spasmodic dysmenorrhea and acute gout flare"
    ],
    reference_dosage: "Aceclofenac: 100 mg twice daily; Diclofenac: 50 mg 2–3 times daily; Ibuprofen: 400 mg 3 times daily. Always prescribe at lowest effective dose with gastroprotective PPI co-therapy.",
    administration_instructions: "Take immediately after meals with a full glass of water. NEVER take on an empty stomach to prevent acute gastric ulceration.",
    common_side_effects: ["Dyspepsia", "Epigastric burning", "Nausea", "Abdominal discomfort", "Mild fluid retention"],
    serious_adverse_effects: ["Peptic ulceration, gastrointestinal hemorrhage, and perforation", "Acute renal failure and interstitial nephritis", "Increased risk of thrombotic cardiovascular events (myocardial infarction, stroke)", "Exacerbation of congestive heart failure and severe hypertension"],
    contraindications: ["Active peptic ulcer disease or gastrointestinal bleeding", "Severe heart failure (NYHA Class II–IV)", "Severe renal or hepatic failure", "History of asthma, urticaria, or allergic reactions triggered by aspirin or other NSAIDs"],
    drug_interactions: ["Anticoagulants (warfarin, apixaban) and antiplatelets markedly increase life-threatening GI bleeding risk", "ACE inhibitors and ARBs: increased risk of renal impairment and reduced antihypertensive effect (triple whammy)", "Lithium: reduced renal excretion leading to lithium toxicity", "Methotrexate toxicity"],
    food_interactions: "Take with food or milk to minimize gastric mucosal irritation.",
    pregnancy_precautions: "Strictly contraindicated in the third trimester of pregnancy (causes premature closure of fetal ductus arteriosus, oligohydramnios, and prolonged labor).",
    breastfeeding_precautions: "Ibuprofen is compatible with breastfeeding; other NSAIDs should be used with clinical caution.",
    age_precautions: "Avoid prolonged use in elderly patients due to high risk of silent GI bleeding and renal insufficiency.",
    storage_instructions: "Store below 25°C protected from light and moisture.",
    schedule: "Schedule H Prescription Drug",
    prescription_required: true,
    source: "CDSCO & Indian Pharmacopoeia / NLEM 2022"
  },

  // 10. Proton Pump Inhibitors (PPIs)
  {
    class_id: "proton_pump_inhibitors",
    keywords: ["pantoprazole", "pantocid", "pan 40", "omeprazole", "omez", "rabeprazole", "razo", "happi", "esomeprazole", "nexpro", "lansoprazole"],
    drug_class: "Proton Pump Inhibitor (Gastric H+/K+ ATPase Inhibitor)",
    category: "Gastrointestinal & Antacids",
    treats_nature: "Gastric Hyperacidity, Acid-Peptic Disorders & Mucosal Ulceration",
    mechanism_of_action: "Substituted benzimidazole that concentrates in the acidic secretory canaliculi of gastric parietal cells, converting to active sulfenamide that covalently binds to cysteine sulfhydryl groups of H+/K+ ATPase (proton pump), irreversibly inactivating the final common step of gastric acid secretion.",
    available_strengths: ["20 mg", "40 mg", "40 mg IV Injection"],
    dosage_forms: ["Enteric-Coated Tablet", "Delayed-Release Capsule", "Injection IV"],
    approved_indications: [
      "Gastroesophageal reflux disease (GERD) and erosive reflux esophagitis",
      "Gastric and duodenal peptic ulcer disease",
      "Eradication of Helicobacter pylori infection (in combination with dual antibiotics)",
      "Prophylaxis and treatment of NSAID-induced gastric and duodenal ulcers",
      "Zollinger-Ellison syndrome and pathological hypersecretory conditions"
    ],
    reference_dosage: "Adults: 40 mg orally once daily in the morning for 4 to 8 weeks. Maintenance therapy: 20–40 mg once daily.",
    administration_instructions: "Take ON AN EMPTY STOMACH, strictly 30 to 60 minutes BEFORE breakfast with a glass of water. Swallow tablets whole; do NOT crush or chew enteric-coated formulations.",
    common_side_effects: ["Headache", "Diarrhea", "Nausea", "Abdominal discomfort", "Flatulence", "Constipation"],
    serious_adverse_effects: ["Clostridioides difficile-associated diarrhea", "Hypomagnesemia with long-term therapy (>3 months)", "Vitamin B12 deficiency and iron malabsorption", "Increased risk of osteoporotic bone fractures with chronic prolonged use (>1 year)", "Acute interstitial nephritis"],
    contraindications: ["Documented hypersensitivity to substituted benzimidazoles (pantoprazole, omeprazole, rabeprazole)"],
    drug_interactions: ["Clopidogrel: Omeprazole inhibits CYP2C19, attenuating clopidogrel antiplatelet activation (pantoprazole has lower CYP2C19 affinity and is preferred)", "Ketoconazole, itraconazole, and iron salts: reduced bioavailability due to elevated gastric pH", "Methotrexate (elevated methotrexate serum concentrations)"],
    food_interactions: "Must be taken on an empty stomach before morning food for optimal antisecretory efficacy.",
    pregnancy_precautions: "Category B. Considered safe when clinically indicated for severe reflux or ulcer disease.",
    breastfeeding_precautions: "Excreted into breast milk in trace amounts. Compatible with nursing under physician advice.",
    age_precautions: "Long-term therapy in elderly requires periodic calcium, vitamin D, magnesium, and bone density monitoring.",
    storage_instructions: "Store below 25°C in moisture-proof packaging.",
    schedule: "Schedule H Prescription Drug",
    prescription_required: true,
    source: "CDSCO & WHO Model List of Essential Medicines / IP 2022"
  },

  // 11. Histamine H2-Receptor Antagonists
  {
    class_id: "h2_receptor_antagonists",
    keywords: ["famotidine", "famocid", "ranitidine", "rantac", "aciloc"],
    drug_class: "Histamine H2-Receptor Antagonist",
    category: "Gastrointestinal & Antacids",
    treats_nature: "Gastric Acid Hypersecretion & Acid Reflux Relief",
    mechanism_of_action: "Competitively inhibits histamine H2 receptors on the basolateral membrane of gastric parietal cells, blocking histamine-stimulated gastric acid and pepsin secretion, reducing basal and nocturnal acid output.",
    available_strengths: ["20 mg", "40 mg", "150 mg", "300 mg", "20 mg/2ml IV"],
    dosage_forms: ["Tablet", "Oral Solution", "Injection IV"],
    approved_indications: [
      "Nocturnal gastric acid breakthrough and mild GERD",
      "Short-term treatment of active duodenal and benign gastric ulcers",
      "Prophylaxis of stress-induced upper GI bleeding in critically ill patients"
    ],
    reference_dosage: "Famotidine: 20 mg twice daily or 40 mg once daily at bedtime for 4 to 8 weeks.",
    administration_instructions: "May be taken with or without food. Taking at bedtime is particularly effective for nocturnal acid control.",
    common_side_effects: ["Headache", "Dizziness", "Constipation", "Diarrhea"],
    serious_adverse_effects: ["Arrhythmias (bradycardia, prolonged QT) with rapid IV bolus", "Thrombocytopenia", "Confusion and hallucinations in elderly with renal failure"],
    contraindications: ["Known hypersensitivity to H2-receptor antagonists"],
    drug_interactions: ["Drugs requiring acidic gastric pH for dissolution (ketoconazole, itraconazole, atazanavir) show reduced absorption"],
    food_interactions: "Can be taken without regard to meals.",
    pregnancy_precautions: "Category B. Animal studies show no fetal harm. Use if clinically needed.",
    breastfeeding_precautions: "Excreted in breast milk; consult physician before using while nursing.",
    age_precautions: "Dose reduction necessary in moderate to severe renal impairment (eGFR < 50 mL/min).",
    storage_instructions: "Store below 25°C protected from light and moisture.",
    schedule: "Schedule H Prescription Drug",
    prescription_required: true,
    source: "CDSCO & Indian Pharmacopoeia"
  },

  // 12. Biguanides (Metformin - AMPK Activators)
  {
    class_id: "biguanide_antidiabetic",
    keywords: ["metformin", "glycomet", "gluconorm", "glucophage", "cetapin", "obimet"],
    drug_class: "Biguanide Oral Antidiabetic (AMPK Activator)",
    category: "Antidiabetic Agents",
    treats_nature: "Type 2 Diabetes Mellitus & Hyperglycemia",
    mechanism_of_action: "Activates AMP-activated protein kinase (AMPK) in hepatocytes, suppressing hepatic gluconeogenesis and glycogenolysis, reducing intestinal glucose absorption, and enhancing peripheral glucose uptake and insulin sensitivity in skeletal muscle without stimulating insulin secretion (low hypoglycemia risk).",
    available_strengths: ["500 mg", "850 mg", "1000 mg", "500 mg SR", "1000 mg SR"],
    dosage_forms: ["Tablet", "Sustained-Release (SR) Tablet", "Extended-Release (ER) Tablet"],
    approved_indications: [
      "First-line pharmacological management of Type 2 Diabetes Mellitus",
      "Impaired glucose tolerance and diabetes prevention in high-risk individuals",
      "Polycystic ovary syndrome (PCOS) insulin-resistance management and ovulatory induction"
    ],
    reference_dosage: "Initial: 500 mg orally once or twice daily with meals. Titrate gradually by 500 mg weekly up to a maximum therapeutic dose of 2,000 mg to 2,550 mg daily.",
    administration_instructions: "Take WITH OR IMMEDIATELY AFTER MEALS to minimize gastrointestinal discomfort and diarrhea. Swallow sustained-release tablets whole; do not break, chew, or crush.",
    common_side_effects: ["Diarrhea", "Nausea", "Vomiting", "Abdominal bloating and flatulence", "Metallic taste", "Anorexia"],
    serious_adverse_effects: ["Lactic acidosis (rare but life-threatening emergency, particularly with renal hypoperfusion or sepsis)", "Vitamin B12 malabsorption leading to peripheral neuropathy and megaloblastic anemia with long-term therapy (>3 years)"],
    contraindications: ["Severe renal impairment (eGFR < 30 mL/min/1.73m²)", "Acute metabolic acidosis, diabetic ketoacidosis, or lactic acidosis", "Severe congestive heart failure, acute myocardial infarction, septic shock, or acute tissue hypoxia", "Severe hepatic insufficiency"],
    drug_interactions: ["Iodinated radiographic contrast media (risk of contrast-induced nephropathy and subsequent lactic acidosis; MUST discontinue metformin 48 hours prior to and 48 hours after procedure)", "Cimetidine and dolutegravir increase metformin plasma levels", "Alcohol markedly potentiates lactic acidosis risk"],
    food_interactions: "Take with food to minimize GI side effects. Strictly avoid binge alcohol consumption.",
    pregnancy_precautions: "Category B. Increasingly used for gestational diabetes under strict specialist endocrinological supervision.",
    breastfeeding_precautions: "Excreted into breast milk in low concentrations; monitor infant blood glucose and development.",
    age_precautions: "Monitor renal function (eGFR) at least annually in all patients, and every 3 to 6 months in elderly patients or eGFR 30–59 mL/min.",
    storage_instructions: "Store below 25°C in a dry place protected from heat and moisture.",
    schedule: "Schedule H Prescription Drug",
    prescription_required: true,
    source: "CDSCO & WHO Model List of Essential Medicines / ICMR Guidelines for Type 2 Diabetes"
  },

  // 13. Sulfonylureas (Pancreatic Beta-Cell Secretagogues)
  {
    class_id: "sulfonylureas",
    keywords: ["glimepiride", "amaryl", "glimestar", "gliclazide", "diamicron", "glipizide", "glibenclamide", "daonil"],
    drug_class: "Second-Generation Sulfonylurea Antidiabetic",
    category: "Antidiabetic Agents",
    treats_nature: "Type 2 Diabetes Mellitus Pancreatic Secretagogue",
    mechanism_of_action: "Selectively binds to sulfonylurea receptors (SUR1) on pancreatic beta-cell membranes, blocking ATP-sensitive potassium (K-ATP) channels, causing membrane depolarization, calcium channel opening, calcium influx, and exocytosis of endogenous insulin granules.",
    available_strengths: ["1 mg", "2 mg", "3 mg", "4 mg", "40 mg", "80 mg", "60 mg MR"],
    dosage_forms: ["Tablet", "Modified-Release (MR) Tablet"],
    approved_indications: [
      "Second-line or combination therapy for Type 2 Diabetes Mellitus inadequately controlled by metformin and lifestyle modification"
    ],
    reference_dosage: "Glimepiride: 1 mg to 2 mg orally once daily with breakfast; titrate as needed to max 6–8 mg/day. Gliclazide MR: 30 mg to 120 mg once daily.",
    administration_instructions: "Take ONCE DAILY IMMEDIATELY BEFORE OR WITH BREAKFAST (or the first main meal of the day). NEVER take if a meal will be skipped, to prevent severe hypoglycemia.",
    common_side_effects: ["Hypoglycemia (sweating, tremor, hunger, palpitations, dizziness)", "Weight gain", "Mild nausea", "Headache"],
    serious_adverse_effects: ["Severe prolonged hypoglycemia (may require hospitalization and prolonged IV dextrose)", "Cholestatic jaundice and hepatic dysfunction", "Bone marrow suppression / hemolytic anemia", "Severe allergic cutaneous vasculitis"],
    contraindications: ["Type 1 Diabetes Mellitus", "Diabetic ketoacidosis", "Severe renal or hepatic impairment", "Documented hypersensitivity to sulfonylureas or sulfonamides"],
    drug_interactions: ["Fluconazole and clarithromycin inhibit CYP2C9, markedly increasing sulfonylurea concentration and severe hypoglycemia risk", "Beta-blockers mask warning symptoms of hypoglycemia (tremor, tachycardia)", "NSAIDs, warfarin, and ACE inhibitors potentiate hypoglycemic action"],
    food_interactions: "Must be accompanied by a carbohydrate-containing meal. Avoid skipping meals and avoid alcohol (which impairs gluconeogenesis and precipitates severe hypoglycemia).",
    pregnancy_precautions: "Category C. Insulin is the preferred agent during pregnancy; discontinue sulfonylurea.",
    breastfeeding_precautions: "Contraindicated during breastfeeding due to potential risk of neonatal hypoglycemia.",
    age_precautions: "High risk of prolonged severe hypoglycemia in elderly patients; use gliclazide or lower-dose glimepiride with caution.",
    storage_instructions: "Store below 25°C in a dry place.",
    schedule: "Schedule H Prescription Drug",
    prescription_required: true,
    source: "CDSCO & ICMR Guidelines for Management of Type 2 Diabetes"
  },

  // 14. SGLT2 Inhibitors (Sodium-Glucose Cotransporter-2 Inhibitors)
  {
    class_id: "sglt2_inhibitors",
    keywords: ["dapagliflozin", "forxiga", "dapaone", "empagliflozin", "jardiance", "canagliflozin", "invokana"],
    drug_class: "Sodium-Glucose Cotransporter-2 (SGLT2) Inhibitor",
    category: "Antidiabetic Agents",
    treats_nature: "Type 2 Diabetes, Heart Failure & Chronic Kidney Disease",
    mechanism_of_action: "Inhibits sodium-glucose cotransporter-2 (SGLT2) in the proximal renal tubules, reducing renal reabsorption of filtered glucose and lowering the renal threshold for glucose, thereby promoting glucosuria, lowering plasma glucose, inducing osmotic diuresis, and reducing cardiac preload and intraglomerular pressure.",
    available_strengths: ["5 mg", "10 mg", "25 mg"],
    dosage_forms: ["Tablet"],
    approved_indications: [
      "Type 2 Diabetes Mellitus to improve glycemic control and reduce body weight",
      "Heart Failure with reduced ejection fraction (HFrEF) and preserved ejection fraction (HFpEF) to reduce cardiovascular death and hospitalization",
      "Chronic Kidney Disease (CKD) to reduce the risk of sustained eGFR decline and end-stage kidney disease"
    ],
    reference_dosage: "Dapagliflozin: 10 mg orally once daily. Empagliflozin: 10 mg to 25 mg orally once daily in the morning.",
    administration_instructions: "Take once daily in the morning with or without food. Maintain adequate hydration throughout the day.",
    common_side_effects: ["Genital mycotic infections (vulvovaginal candidiasis, balanitis)", "Urinary tract infections", "Increased urination and mild polyuria", "Thirst and mild volume depletion"],
    serious_adverse_effects: ["Euglycemic diabetic ketoacidosis (euDKA - severe ketoacidosis with normal or near-normal blood glucose)", "Necrotizing fasciitis of the perineum (Fournier's gangrene)", "Severe volume depletion, orthostatic hypotension, and syncope", "Urosepsis and pyelonephritis"],
    contraindications: ["Patients with Type 1 Diabetes Mellitus (high risk of fatal euglycemic DKA)", "Severe renal impairment with eGFR < 20–25 mL/min (for glycemic control; can continue for cardiorenal protection as per guidelines)", "Dialysis patients"],
    drug_interactions: ["Loop diuretics and thiazides: increased risk of severe dehydration and hypotension", "Insulin and sulfonylureas: increased risk of hypoglycemia (dose reduction may be required)"],
    food_interactions: "Take with or without food. Drink abundant water throughout the day.",
    pregnancy_precautions: "Contraindicated in the second and third trimesters of pregnancy (potential risk to developing fetal kidneys).",
    breastfeeding_precautions: "Not recommended during breastfeeding.",
    age_precautions: "Geriatric patients are at increased risk of volume depletion, hypotension, and acute kidney injury.",
    storage_instructions: "Store below 30°C in moisture-proof packaging.",
    schedule: "Schedule H Prescription Drug",
    prescription_required: true,
    source: "CDSCO & ADA/KDIGO Guidelines for Diabetes and Heart Failure"
  },

  // 15. Dipeptidyl Peptidase-4 (DPP-4) Inhibitors
  {
    class_id: "dpp4_inhibitors",
    keywords: ["sitagliptin", "januvia", "vildagliptin", "galvus", "teneligliptin", "ziten", "linagliptin", "trajenta"],
    drug_class: "Dipeptidyl Peptidase-4 (DPP-4) Inhibitor (Gliptin)",
    category: "Antidiabetic Agents",
    treats_nature: "Type 2 Diabetes Mellitus Incretin Enhancement",
    mechanism_of_action: "Inhibits dipeptidyl peptidase-4 (DPP-4), an enzyme that rapidly degrades the endogenous incretin hormones GLP-1 and GIP. This elevates active incretin concentrations, stimulating glucose-dependent insulin secretion from beta cells and suppressing glucagon secretion from alpha cells, with minimal intrinsic hypoglycemia risk.",
    available_strengths: ["25 mg", "50 mg", "100 mg", "20 mg"],
    dosage_forms: ["Tablet"],
    approved_indications: [
      "Type 2 Diabetes Mellitus as monotherapy or combination therapy with metformin, sulfonylureas, or SGLT2 inhibitors"
    ],
    reference_dosage: "Sitagliptin: 100 mg once daily; Vildagliptin: 50 mg twice daily; Teneligliptin: 20 mg once daily; Linagliptin: 5 mg once daily.",
    administration_instructions: "May be taken with or without food at any time of day.",
    common_side_effects: ["Nasopharyngitis", "Upper respiratory tract infection", "Headache", "Mild dyspepsia"],
    serious_adverse_effects: ["Acute pancreatitis (persistent severe abdominal pain radiating to the back)", "Severe and disabling joint pain (arthralgia)", "Bullous pemphigoid (autoimmune blistering disease)"],
    contraindications: ["Documented hypersensitivity to gliptins", "History of acute pancreatitis"],
    drug_interactions: ["Concurrent sulfonylurea or insulin therapy increases hypoglycemia risk (dose reduction of secretagogue recommended)"],
    food_interactions: "Can be taken without regard to meals.",
    pregnancy_precautions: "Category B. Discontinue during pregnancy; switch to insulin therapy.",
    breastfeeding_precautions: "Not recommended during lactation due to lack of human safety data.",
    age_precautions: "Linagliptin requires no renal dose adjustment. Sitagliptin and vildagliptin require dose reduction in moderate to severe renal impairment.",
    storage_instructions: "Store below 25°C protected from moisture.",
    schedule: "Schedule H Prescription Drug",
    prescription_required: true,
    source: "CDSCO & ICMR Guidelines for Type 2 Diabetes"
  },

  // 16. Statins (HMG-CoA Reductase Inhibitors)
  {
    class_id: "statins_lipid_lowering",
    keywords: ["atorvastatin", "atorva", "lipitor", "rosuvastatin", "rosuvas", "crestor", "simvastatin", "pravastatin"],
    drug_class: "HMG-CoA Reductase Inhibitor (Statin)",
    category: "Cardiovascular Agents",
    treats_nature: "Hypercholesterolemia, Dyslipidemia & Atherosclerosis Prophylaxis",
    mechanism_of_action: "Competitively inhibits 3-hydroxy-3-methylglutaryl-coenzyme A (HMG-CoA) reductase, the rate-limiting enzyme in cholesterol biosynthesis. Depletion of intracellular hepatic cholesterol triggers sterol regulatory element-binding proteins (SREBPs) to upregulate cell-surface LDL receptors, clearing atherogenic LDL and VLDL particles from systemic circulation and stabilizing atherosclerotic plaques.",
    available_strengths: ["5 mg", "10 mg", "20 mg", "40 mg", "80 mg"],
    dosage_forms: ["Tablet"],
    approved_indications: [
      "Primary hypercholesterolemia and mixed dyslipidemia to reduce LDL-C, total cholesterol, and apolipoprotein B",
      "Primary prevention of cardiovascular events (myocardial infarction, stroke, coronary revascularization) in high-risk patients",
      "Secondary prevention in established coronary artery disease, acute coronary syndrome (ACS), and peripheral arterial disease"
    ],
    reference_dosage: "Atorvastatin: 10 mg to 40 mg orally once daily (up to 80 mg in acute coronary syndromes); Rosuvastatin: 5 mg to 20 mg once daily (max 40 mg).",
    administration_instructions: "Take once daily, preferably in the evening or at bedtime, with or without food. Maintain a heart-healthy diet throughout treatment.",
    common_side_effects: ["Myalgia (muscle ache/weakness)", "Headache", "Gastrointestinal upset (nausea, constipation, diarrhea)", "Mild transient elevation in hepatic transaminases"],
    serious_adverse_effects: ["Rhabdomyolysis with acute kidney failure secondary to myoglobinuria (brown-colored urine, severe muscle pain)", "Immune-mediated necrotizing myopathy (IMNM)", "Drug-induced hepatitis and liver failure", "Modest increase in HbA1c and fasting blood glucose"],
    contraindications: ["Active liver disease or unexplained persistent elevation of serum transaminases (>3x ULN)", "Pregnancy and lactation (potential teratogenicity)"],
    drug_interactions: ["CYP3A4 inhibitors (clarithromycin, itraconazole, ketoconazole, protease inhibitors) drastically increase atorvastatin/simvastatin plasma levels and rhabdomyolysis risk", "Gemfibrozil and fibrates significantly potentiate myopathy risk", "Cyclosporine: marked elevation in rosuvastatin exposure (max dose 5 mg)"],
    food_interactions: "Avoid excessive consumption of grapefruit or grapefruit juice (>1 liter daily) which inhibits CYP3A4 and increases statin toxicity.",
    pregnancy_precautions: "Category X. Strictly contraindicated during pregnancy; cholesterol is essential for fetal development.",
    breastfeeding_precautions: "Strictly contraindicated during lactation; potential disruption of infant lipid metabolism.",
    age_precautions: "Caution in elderly patients (>75 years); consider lower starting doses due to increased susceptibility to myopathy and drug interactions.",
    storage_instructions: "Store below 25°C protected from moisture.",
    schedule: "Schedule H Prescription Drug",
    prescription_required: true,
    source: "CDSCO & WHO Model List of Essential Medicines / ACC/AHA Lipid Guidelines"
  },

  // 17. Angiotensin Receptor Blockers (ARBs)
  {
    class_id: "angiotensin_receptor_blockers",
    keywords: ["telmisartan", "telma", "telmikind", "losartan", "losar", "olmesartan", "olmecip", "valsartan", "candesartan"],
    drug_class: "Angiotensin II Receptor Blocker (ARB / AT1 Antagonist)",
    category: "Cardiovascular Agents",
    treats_nature: "Essential Hypertension, Diabetic Nephropathy & Heart Failure",
    mechanism_of_action: "Selectively and competitively blocks the angiotensin II type 1 (AT1) receptor located in vascular smooth muscle and the adrenal cortex. This blocks angiotensin II-mediated vasoconstriction, aldosterone release, and renal sodium retention, resulting in vasodilation, decreased systemic vascular resistance, and blood pressure reduction without bradykinin cough.",
    available_strengths: ["20 mg", "40 mg", "80 mg", "25 mg", "50 mg", "100 mg"],
    dosage_forms: ["Tablet"],
    approved_indications: [
      "Essential systemic hypertension in adults",
      "Cardiovascular risk reduction in patients with established atherothrombotic disease",
      "Diabetic nephropathy with proteinuria in Type 2 Diabetes Mellitus",
      "Heart failure in patients intolerant to ACE inhibitors"
    ],
    reference_dosage: "Telmisartan: 40 mg to 80 mg orally once daily. Losartan: 50 mg to 100 mg once daily.",
    administration_instructions: "Take once daily with or without food at approximately the same time each day.",
    common_side_effects: ["Dizziness", "Lightheadedness", "Fatigue", "Hypotension", "Hyperkalemia"],
    serious_adverse_effects: ["Acute renal failure (especially in bilateral renal artery stenosis)", "Severe hyperkalemia (cardiac conduction abnormalities)", "Angioedema", "Fetal toxicity and neonatal death"],
    contraindications: ["Pregnancy (second and third trimesters)", "Concurrent use with aliskiren in patients with diabetes mellitus", "Severe hepatic impairment (Telmisartan is excreted almost entirely via bile)"],
    drug_interactions: ["Potassium-sparing diuretics (spironolactone), potassium supplements, and salt substitutes containing potassium markedly increase hyperkalemia risk", "NSAIDs blunt antihypertensive efficacy and precipitate acute renal failure", "Lithium: increased serum lithium concentrations and toxicity"],
    food_interactions: "Avoid potassium-enriched dietary salt substitutes without consulting your physician.",
    pregnancy_precautions: "Category D. Black Box Warning: Strictly contraindicated in pregnancy; causes fetal oligohydramnios, skull hypoplasia, and fetal death.",
    breastfeeding_precautions: "Not recommended during breastfeeding; alternative antihypertensives (methyldopa, labetalol, nifedipine) preferred.",
    age_precautions: "Monitor serum creatinine, eGFR, and potassium within 1–2 weeks of initiation in elderly patients.",
    storage_instructions: "Store below 25°C in original blister packaging to protect from atmospheric moisture.",
    schedule: "Schedule H Prescription Drug",
    prescription_required: true,
    source: "CDSCO & WHO Model List of Essential Medicines / ESC/ISH Hypertension Guidelines"
  },

  // 18. Calcium Channel Blockers (CCBs)
  {
    class_id: "calcium_channel_blockers",
    keywords: ["amlodipine", "amlong", "stamlo", "cilnidipine", "cilacar", "nifedipine", "diltiazem", "verapamil"],
    drug_class: "Dihydropyridine Calcium Channel Blocker (L-Type Ca2+ Channel Blocker)",
    category: "Cardiovascular Agents",
    treats_nature: "Hypertension & Chronic Stable Vasospastic Angina",
    mechanism_of_action: "Inhibits transmembrane influx of extracellular calcium ions through voltage-gated L-type calcium channels into arterial vascular smooth muscle and cardiac myocytes during depolarization. This causes peripheral arterial vasodilation, reducing total peripheral resistance, afterload, and myocardial oxygen demand without compromising venous return.",
    available_strengths: ["2.5 mg", "5 mg", "10 mg", "10 mg ER", "20 mg"],
    dosage_forms: ["Tablet", "Extended-Release Tablet"],
    approved_indications: [
      "Essential systemic hypertension (first-line therapy)",
      "Chronic stable angina pectoris",
      "Vasospastic (Prinzmetal's or variant) angina"
    ],
    reference_dosage: "Amlodipine: 5 mg orally once daily; may increase to 10 mg once daily after 1–2 weeks. Cilnidipine: 10 mg to 20 mg once daily.",
    administration_instructions: "Take once daily with or without food, at the same time each morning or evening.",
    common_side_effects: ["Peripheral dependent pedal edema (ankle swelling)", "Flushing", "Headache", "Dizziness", "Palpitations", "Fatigue"],
    serious_adverse_effects: ["Severe hypotension with syncope", "Exacerbation of angina or acute myocardial infarction on initiation/titration (rare reflex tachycardia)", "Gingival hyperplasia"],
    contraindications: ["Severe hypotension", "Cardiogenic shock", "Severe aortic stenosis", "Unstable angina pectoris (immediate-release formulations)"],
    drug_interactions: ["Simvastatin: Amlodipine increases simvastatin exposure (simvastatin dose MUST NOT exceed 20 mg/day)", "CYP3A4 inhibitors (ketoconazole, diltiazem) increase amlodipine concentration", "Diltiazem/Verapamil with beta-blockers: high risk of severe bradycardia and AV block"],
    food_interactions: "Grapefruit juice may slightly increase amlodipine bioavailability, but generally has minimal clinical impact compared to other CCBs.",
    pregnancy_precautions: "Category C. Labetalol or nifedipine extended-release preferred in pregnancy-induced hypertension.",
    breastfeeding_precautions: "Excreted into breast milk; compatible with nursing under physician supervision.",
    age_precautions: "Starting dose in frail or elderly patients should be reduced to 2.5 mg once daily due to decreased hepatic clearance.",
    storage_instructions: "Store below 25°C protected from light and moisture.",
    schedule: "Schedule H Prescription Drug",
    prescription_required: true,
    source: "CDSCO & Indian Pharmacopoeia / ISH Global Hypertension Guidelines"
  },

  // 19. Beta-Adrenergic Blockers
  {
    class_id: "beta_blockers",
    keywords: ["metoprolol", "betaloc", "metolar", "atenolol", "aten", "bisoprolol", "concor", "carvedilol", "carca", "propranolol", "ciplar", "nebivolol", "nebistar", "labetalol"],
    drug_class: "Cardioselective Beta-1 Adrenergic Receptor Antagonist",
    category: "Cardiovascular Agents",
    treats_nature: "Hypertension, Tachyarrhythmias, Angina & Heart Failure",
    mechanism_of_action: "Competitively antagonizes beta-1 adrenergic receptors located in cardiac tissue, reducing resting and exercise heart rate, myocardial contractility, cardiac output, and cardiac work. Also inhibits renal juxtaglomerular renin release, suppressing the renin-angiotensin-aldosterone axis.",
    available_strengths: ["12.5 mg", "25 mg", "50 mg", "100 mg", "2.5 mg", "5 mg", "3.125 mg", "6.25 mg"],
    dosage_forms: ["Tablet", "Extended-Release / Succinate Tablet", "Injection IV"],
    approved_indications: [
      "Hypertension and chronic stable angina pectoris",
      "Stable chronic heart failure with reduced ejection fraction (HFrEF - Metoprolol succinate, Bisoprolol, Carvedilol)",
      "Rate control in supraventricular tachycardias, atrial fibrillation, and sinus tachycardia",
      "Post-myocardial infarction secondary cardioprotection",
      "Migraine prophylaxis and essential tremor (Propranolol)"
    ],
    reference_dosage: "Metoprolol succinate ER: 25 mg to 100 mg orally once daily. Carvedilol: 3.125 mg to 25 mg twice daily with food.",
    administration_instructions: "Take with or immediately after food (especially carvedilol and metoprolol tartrate to improve bioavailability). Do NOT stop taking abruptly.",
    common_side_effects: ["Bradycardia (slow heart rate)", "Cold extremities", "Fatigue", "Dizziness", "Erectile dysfunction", "Sleep disturbances and vivid dreams"],
    serious_adverse_effects: ["Severe symptomatic bradycardia and high-degree atrioventricular (AV) heart block", "Acute bronchospasm in asthma / COPD", "Decompensation of acute heart failure", "Masking of early signs of hypoglycemia (sweating remains unmasked)", "Severe rebound hypertension and angina upon abrupt cessation"],
    contraindications: ["Sinus bradycardia (heart rate < 50 bpm)", "Second- or third-degree AV block (without a functioning pacemaker)", "Cardiogenic shock and decompensated acute pulmonary edema", "Severe active bronchial asthma or severe bronchospastic disease"],
    drug_interactions: ["Non-dihydropyridine CCBs (verapamil, diltiazem) cause profound bradycardia, AV block, and severe myocardial depression", "Digoxin: additive negative chronotropic effects", "Clonidine: rebound hypertension if stopped while beta-blocker is continued"],
    food_interactions: "Take with food to enhance absorption and smooth plasma peak levels.",
    pregnancy_precautions: "Category C (Labetalol is Category B and preferred in gestational hypertension). May cause fetal bradycardia and growth restriction.",
    breastfeeding_precautions: "Carvedilol, metoprolol, and labetalol are generally compatible; atenolol has higher breast milk concentration.",
    age_precautions: "Dose titration should be gradual in elderly patients with close monitoring of pulse rate and postural blood pressure.",
    storage_instructions: "Store below 25°C protected from moisture.",
    schedule: "Schedule H Prescription Drug",
    prescription_required: true,
    source: "CDSCO & ACC/AHA/ESC Heart Failure & Hypertension Guidelines"
  },

  // 20. ACE Inhibitors (Angiotensin-Converting Enzyme Inhibitors)
  {
    class_id: "ace_inhibitors",
    keywords: ["ramipril", "cardace", "enalapril", "envas", "lisinopril", "perindopril"],
    drug_class: "Angiotensin-Converting Enzyme (ACE) Inhibitor",
    category: "Cardiovascular Agents",
    treats_nature: "Hypertension, Post-MI Ventricular Remodeling & Heart Failure",
    mechanism_of_action: "Competitively inhibits angiotensin-converting enzyme (peptidyl dipeptidase), preventing the enzymatic conversion of angiotensin I to the potent vasoconstrictor angiotensin II, leading to decreased systemic vascular resistance, reduced aldosterone secretion, and attenuated degradation of vasodilator bradykinin.",
    available_strengths: ["2.5 mg", "5 mg", "10 mg"],
    dosage_forms: ["Capsule", "Tablet"],
    approved_indications: [
      "Essential hypertension",
      "Congestive heart failure (NYHA Class II–IV) to reduce mortality",
      "Post-myocardial infarction ventricular dysfunction",
      "Diabetic and non-diabetic nephropathy with microalbuminuria or proteinuria"
    ],
    reference_dosage: "Ramipril: 2.5 mg to 10 mg orally once daily. Enalapril: 5 mg to 20 mg once or twice daily.",
    administration_instructions: "Take once daily with water, with or without food. First dose should preferably be taken at bedtime to prevent first-dose postural hypotension.",
    common_side_effects: ["Persistent dry irritating non-productive cough (bradykinin-mediated, up to 15% of patients)", "Dizziness", "Headache", "Mild hyperkalemia", "Hypotension"],
    serious_adverse_effects: ["Angioedema of face, lips, tongue, and glottis with acute airway obstruction", "Acute kidney failure in bilateral renal artery stenosis", "Severe hyperkalemia", "Fetal renal dysgenesis and death in pregnancy"],
    contraindications: ["History of ACE inhibitor-induced angioedema", "Bilateral renal artery stenosis or solitary functioning kidney stenosis", "Pregnancy (second and third trimesters)"],
    drug_interactions: ["Potassium-sparing diuretics (spironolactone), potassium supplements, and NSAIDs markedly exacerbate hyperkalemia and acute renal decline", "Sacubitril/valsartan: MUST have 36-hour washout when switching to/from ACE inhibitor to avoid fatal angioedema"],
    food_interactions: "Avoid excessive dietary potassium or potassium-containing salt substitutes.",
    pregnancy_precautions: "Category D. Black Box Warning: Teratogenic and fetotoxic during pregnancy.",
    breastfeeding_precautions: "Excreted in low levels; enalapril and captopril generally considered safe during lactation.",
    age_precautions: "Titrate carefully in elderly patients with pre-existing renal impairment.",
    storage_instructions: "Store below 25°C in moisture-proof packaging.",
    schedule: "Schedule H Prescription Drug",
    prescription_required: true,
    source: "CDSCO & WHO Model List of Essential Medicines"
  },

  // 21. Second-Generation Antihistamines
  {
    class_id: "second_gen_antihistamines",
    keywords: ["cetirizine", "cetzine", "alerid", "levocetirizine", "levocet", "1-al", "fexofenadine", "allegra", "bilastine", "bilaxten", "loratadine", "claritin", "desloratadine", "chlorpheniramine", "avil"],
    drug_class: "Second-Generation Peripheral H1-Receptor Antagonist",
    category: "Allergy & Respiratory Agents",
    treats_nature: "Allergic Rhinitis, Urticaria & Histamine-Mediated Pruritus",
    mechanism_of_action: "Selectively and competitively antagonizes peripheral H1 histamine receptors on effector cells in the respiratory tract, gastrointestinal tract, and dermal capillaries. Does not readily cross the blood-brain barrier at therapeutic doses, providing potent antiallergic efficacy with minimal sedation compared to first-generation antihistamines.",
    available_strengths: ["5 mg", "10 mg", "120 mg", "180 mg", "20 mg", "5 mg/5ml syrup"],
    dosage_forms: ["Tablet", "Dispersible Tablet", "Oral Syrup", "Oral Drops"],
    approved_indications: [
      "Seasonal and perennial allergic rhinitis (sneezing, rhinorrhea, nasal itching, ocular itching)",
      "Chronic idiopathic urticaria and acute allergic dermatoses",
      "Allergic conjunctivitis and histaminic pruritus"
    ],
    reference_dosage: "Levocetirizine: 5 mg orally once daily in the evening; Cetirizine: 10 mg once daily; Fexofenadine: 120 mg or 180 mg once daily.",
    administration_instructions: "Take once daily in the evening with water. Fexofenadine should be taken with plain water; avoid fruit juices (grapefruit, apple, orange) which inhibit OATP1A2 intestinal absorption.",
    common_side_effects: ["Mild somnolence (mild in cetirizine/levocetirizine, negligible in fexofenadine/bilastine)", "Dry mouth", "Headache", "Fatigue"],
    serious_adverse_effects: ["Severe hypersensitivity reactions / angioedema", "Urinary retention in benign prostatic hyperplasia"],
    contraindications: ["Known hypersensitivity to cetirizine/levocetirizine or hydroxyzine", "End-stage renal disease (eGFR < 10 mL/min) for levocetirizine"],
    drug_interactions: ["CNS depressants and alcohol may have additive sedative effects", "Fruit juices reduce fexofenadine absorption by up to 36% (separate by at least 4 hours)"],
    food_interactions: "Take with plain water. Avoid fruit juices when taking fexofenadine.",
    pregnancy_precautions: "Category B (Cetirizine, Loratadine). Generally considered safe in pregnancy under physician supervision.",
    breastfeeding_precautions: "Excreted in low levels in breast milk; compatible with lactation.",
    age_precautions: "Dose reduction in renal impairment for cetirizine and levocetirizine. Pediatric oral drops available for ages > 6 months.",
    storage_instructions: "Store below 25°C protected from moisture.",
    schedule: "General Sale / Schedule H (high strength)",
    prescription_required: false,
    source: "CDSCO & WHO Model List of Essential Medicines / IP 2022"
  },

  // 22. Bronchodilators (Beta-2 Agonists & Anticholinergics)
  {
    class_id: "bronchodilators_respiratory",
    keywords: ["salbutamol", "asthalin", "levosalbutamol", "levolin", "formoterol", "foracort", "salmeterol", "seretide", "ipratropium", "duolin", "tiotropium", "spiriva"],
    drug_class: "Selective Beta-2 Adrenergic Agonist / Anticholinergic Bronchodilator",
    category: "Allergy & Respiratory Agents",
    treats_nature: "Bronchospasm, Asthma Attack & COPD Airway Obstruction",
    mechanism_of_action: "Stimulates beta-2 adrenergic receptors in bronchial smooth muscle, activating intracellular adenylate cyclase and converting ATP to cyclic AMP (cAMP). Elevated cAMP decreases intracellular calcium, causing relaxation of airway smooth muscle, bronchodilation, and relief of bronchospasm.",
    available_strengths: ["100 mcg/puff MDI", "200 mcg Rotacaps", "2.5 mg/2.5ml Respules", "2 mg", "4 mg"],
    dosage_forms: ["Metered-Dose Inhaler (MDI)", "Dry Powder Inhaler (Rotacaps / DPI)", "Nebulizer Solution (Respules)", "Tablet", "Syrup"],
    approved_indications: [
      "Relief and prevention of acute bronchospasm in bronchial asthma",
      "Chronic Obstructive Pulmonary Disease (COPD) bronchospasm and chronic bronchitis",
      "Exercise-induced bronchoconstriction (EIB) prophylaxis"
    ],
    reference_dosage: "Inhaler: 1 to 2 puffs (100–200 mcg) every 4 to 6 hours as needed for acute symptoms. Nebulization: 2.5 mg every 6–8 hours.",
    administration_instructions: "Administer via inhaler using a spacer device when possible. Shake well before use. Inhale slowly and deeply, then hold breath for 10 seconds before exhaling.",
    common_side_effects: ["Fine skeletal muscle tremor (especially hands)", "Tachycardia and palpitations", "Headache", "Nervousness and restlessness"],
    serious_adverse_effects: ["Severe paradoxical bronchospasm", "Hypokalemia (intracellular potassium shift with high doses)", "Myocardial ischemia and cardiac arrhythmias", "Prolonged QTc interval"],
    contraindications: ["Documented hypersensitivity to salbutamol or formulation excipients"],
    drug_interactions: ["Non-cardioselective beta-blockers (propranolol) directly antagonize bronchodilation and cause severe bronchospasm", "Diuretics: increased risk of hypokalemia", "MAO inhibitors and tricyclic antidepressants potentiate cardiovascular effects"],
    food_interactions: "No specific food interactions for inhaled formulations.",
    pregnancy_precautions: "Category C. Inhaled salbutamol is the rescue bronchodilator of choice during pregnancy.",
    breastfeeding_precautions: "Compatible with breastfeeding; minimal systemic maternal absorption from inhalation.",
    age_precautions: "Use with spacer and face mask in pediatric patients (<5 years). Caution in geriatric patients with coronary artery disease.",
    storage_instructions: "Store below 25°C away from direct heat and freezing. Do not puncture or incinerate inhaler canister.",
    schedule: "Schedule H Prescription Drug",
    prescription_required: true,
    source: "CDSCO & GINA Global Strategy for Asthma Management and Prevention"
  },

  // 23. Inhaled Corticosteroids (ICS)
  {
    class_id: "inhaled_corticosteroids",
    keywords: ["budesonide", "budecort", "pulmicort", "fluticasone", "flomist", "flovent", "beclomethasone", "beclate"],
    drug_class: "Inhaled Corticosteroid (Local Airway Glucocorticoid)",
    category: "Allergy & Respiratory Agents",
    treats_nature: "Chronic Airway Inflammation, Persistent Asthma & COPD",
    mechanism_of_action: "Diffuses across bronchial cell membranes and binds to intracellular glucocorticoid receptors, translocating to the nucleus to suppress pro-inflammatory gene transcription (NF-kB, AP-1), inhibiting cytokine synthesis, reducing airway mucosal edema, capillary permeability, and bronchial hyperresponsiveness.",
    available_strengths: ["100 mcg", "200 mcg", "400 mcg", "0.5 mg/2ml", "1 mg/2ml"],
    dosage_forms: ["Metered-Dose Inhaler (MDI)", "Dry Powder Inhaler (Rotacaps / DPI)", "Respules for Nebulization", "Nasal Spray"],
    approved_indications: [
      "First-line maintenance controller therapy for persistent bronchial asthma",
      "Maintenance treatment of severe COPD with frequent exacerbations",
      "Allergic rhinitis and nasal polyposis (Nasal Spray formulation)"
    ],
    reference_dosage: "Budesonide: 200 mcg to 800 mcg twice daily inhaled. Fluticasone: 100 mcg to 500 mcg twice daily.",
    administration_instructions: "Inhale twice daily at regular intervals. ALWAYS RINSE MOUTH THOROUGHLY WITH WATER AND SPIT OUT after each inhalation to prevent oral candidiasis (thrush) and hoarseness.",
    common_side_effects: ["Oropharyngeal candidiasis (oral thrush)", "Dysphonia (hoarseness of voice)", "Throat irritation and dry cough"],
    serious_adverse_effects: ["Adrenal suppression with very high doses", "Decreased bone mineral density with long-term high-dose therapy", "Increased risk of pneumonia in COPD patients", "Posterior subcapsular cataracts and glaucoma"],
    contraindications: ["Primary treatment of status asthmaticus or acute asthma episodes where intensive measures are required"],
    drug_interactions: ["Strong CYP3A4 inhibitors (ketoconazole, ritonavir) may increase systemic corticosteroid exposure"],
    food_interactions: "Rinse mouth with water immediately after each dose.",
    pregnancy_precautions: "Category B (Budesonide). Preferred inhaled corticosteroid during pregnancy with the most extensive safety data.",
    breastfeeding_precautions: "Compatible with breastfeeding; negligible systemic absorption.",
    age_precautions: "Monitor growth velocity in children receiving regular long-term inhaled corticosteroid therapy.",
    storage_instructions: "Store below 25°C in moisture-proof container.",
    schedule: "Schedule H Prescription Drug",
    prescription_required: true,
    source: "CDSCO & GINA Asthma Guidelines / WHO EML"
  },

  // 24. Systemic Corticosteroids
  {
    class_id: "systemic_corticosteroids",
    keywords: ["prednisolone", "wysolone", "methylprednisolone", "medrol", "dexamethasone", "dexona", "betamethasone", "betnesol", "hydrocortisone", "deflazacort", "defza"],
    drug_class: "Systemic Glucocorticoid (Anti-Inflammatory & Immunosuppressant)",
    category: "Endocrine & Corticosteroids",
    treats_nature: "Severe Inflammation, Autoimmune Flare & Anaphylaxis",
    mechanism_of_action: "Potent glucocorticoid that binds to cytoplasmic receptors, altering protein synthesis and downregulating pro-inflammatory cytokines, leukotrienes, and prostaglandins, suppressing cell-mediated and humoral immune responses, reducing capillary permeability, and stabilizing lysosomal membranes.",
    available_strengths: ["5 mg", "10 mg", "20 mg", "40 mg", "4 mg/ml IV", "100 mg IV"],
    dosage_forms: ["Tablet", "Dispersible Tablet", "Oral Solution", "Injection IV/IM"],
    approved_indications: [
      "Severe acute asthma exacerbation and status asthmaticus",
      "Severe allergic emergencies, anaphylaxis, and drug hypersensitivity reactions",
      "Rheumatoid arthritis, systemic lupus erythematosus (SLE), and vasculitis flares",
      "Nephrotic syndrome, autoimmune hepatitis, and inflammatory bowel disease",
      "Cerebral edema and severe acute infectious inflammation"
    ],
    reference_dosage: "Prednisolone: 20 mg to 60 mg orally once daily in the morning with food. Taper dose gradually over 1–3 weeks for regimens > 2 weeks.",
    administration_instructions: "Take ONCE DAILY IN THE MORNING WITH FOOD to mimic physiological cortisol circadian rhythm and minimize adrenal axis suppression. NEVER stop abruptly after courses > 2 weeks.",
    common_side_effects: ["Dyspepsia and gastric irritation", "Insomnia and mood changes (euphoria or irritability)", "Increased appetite and weight gain", "Fluid retention and facial puffiness (moon face)", "Hyperglycemia"],
    serious_adverse_effects: ["Secondary adrenal insufficiency upon sudden withdrawal", "Osteoporosis, aseptic avascular necrosis of femoral head, and pathological fractures", "Immunosuppression and reactivation of latent infections (tuberculosis, fungal)", "Peptic ulcer perforation", "Steroid-induced psychosis", "Cataracts and glaucoma"],
    contraindications: ["Systemic fungal infections", "Concurrent administration of live or live-attenuated vaccines during immunosuppressive doses", "Uncontrolled severe systemic infections (unless on specific anti-infective therapy)"],
    drug_interactions: ["NSAIDs significantly increase peptic ulceration and GI hemorrhage risk", "Enzyme inducers (phenytoin, carbamazepine, rifampin) increase steroid clearance", "Antidiabetic drugs: steroids elevate blood glucose requiring antidiabetic dose increase", "Diuretics: increased hypokalemia risk"],
    food_interactions: "Take with food or milk to reduce gastric irritation. Maintain low-sodium, high-potassium, calcium-rich diet during prolonged therapy.",
    pregnancy_precautions: "Category C. Used when benefits clearly outweigh risks. Prednisolone is largely metabolized by placental 11-beta-HSD2 protecting the fetus.",
    breastfeeding_precautions: "Compatible with nursing at low to moderate doses; for high doses, wait 4 hours after dose before breastfeeding.",
    age_precautions: "Growth suppression in children; accelerated bone loss in elderly patients.",
    storage_instructions: "Store below 25°C protected from light.",
    schedule: "Schedule H Prescription Drug",
    prescription_required: true,
    source: "CDSCO & WHO Model List of Essential Medicines"
  },

  // 25. Antiplatelet Agents
  {
    class_id: "antiplatelet_agents",
    keywords: ["aspirin", "ecosprin", "disprin", "clopidogrel", "clopilet", "deplatt", "ticagrelor", "brilinta", "prasugrel"],
    drug_class: "Antiplatelet Agent (Platelet Aggregation Inhibitor)",
    category: "Cardiovascular Agents",
    treats_nature: "Atherothrombosis Prevention & Post-Stent Thrombosis Prophylaxis",
    mechanism_of_action: "Aspirin irreversibly acetylates platelet cyclooxygenase-1 (COX-1), blocking thromboxane A2 (TXA2) synthesis for the entire 7–10 day lifespan of the platelet. Clopidogrel and ticagrelor selectively antagonize platelet P2Y12 ADP receptors, preventing ADP-mediated activation of the GPIIb/IIIa complex, blocking platelet cross-linking and thrombus formation.",
    available_strengths: ["75 mg", "150 mg", "300 mg", "90 mg"],
    dosage_forms: ["Enteric-Coated Tablet", "Film-Coated Tablet", "Dispersible Tablet"],
    approved_indications: [
      "Secondary prevention of myocardial infarction, ischemic stroke, and transient ischemic attacks (TIA)",
      "Dual Antiplatelet Therapy (DAPT) following percutaneous coronary intervention (PCI) with coronary stenting",
      "Acute coronary syndrome (ACS: STEMI, NSTEMI, unstable angina)"
    ],
    reference_dosage: "Ecosprin (Aspirin): 75 mg to 150 mg orally once daily. Clopidogrel: 75 mg once daily (300–600 mg loading dose in ACS).",
    administration_instructions: "Take once daily with water immediately after food. Swallow enteric-coated tablets whole.",
    common_side_effects: ["Mild dyspepsia", "Easy bruising (ecchymosis)", "Minor epistaxis (nosebleeds)", "Bleeding from minor cuts taking longer to stop"],
    serious_adverse_effects: ["Major gastrointestinal hemorrhage", "Intracranial hemorrhage and hemorrhagic stroke", "Thrombotic thrombocytopenic purpura (TTP - Clopidogrel)", "Severe hypersensitivity and bronchospasm in aspirin-sensitive asthmatics"],
    contraindications: ["Active pathological bleeding (peptic ulcer or intracranial hemorrhage)", "Severe thrombocytopenia or hemophilia", "Aspirin-exacerbated respiratory disease (AERD) / Samter's triad"],
    drug_interactions: ["Anticoagulants (warfarin, heparin, apixaban) exponentially increase major bleeding risk", "NSAIDs (ibuprofen) can competitively block aspirin access to COX-1 and increase GI toxicity", "Omeprazole inhibits CYP2C19, reducing active clopidogrel metabolite formation (pantoprazole preferred)"],
    food_interactions: "Take with food to minimize gastric mucosal irritation.",
    pregnancy_precautions: "Low-dose aspirin (75–150 mg) is safe and used to prevent preeclampsia in high-risk women. High-dose aspirin contraindicated in 3rd trimester.",
    breastfeeding_precautions: "Low-dose aspirin (75 mg) excreted in trace amounts; clopidogrel not recommended during nursing.",
    age_precautions: "High risk of bleeding in elderly patients (>75 years); routine PPI co-prescription recommended with DAPT.",
    storage_instructions: "Store below 25°C in a dry place protected from moisture.",
    schedule: "Schedule H Prescription Drug",
    prescription_required: true,
    source: "CDSCO & ACC/AHA Coronary Artery Disease & Antiplatelet Guidelines"
  },

  // 26. Anticoagulants (DOACs & Vitamin K Antagonists)
  {
    class_id: "anticoagulants",
    keywords: ["warfarin", "coumadin", "acitrom", "acenocoumarol", "heparin", "enoxaparin", "clexane", "apixaban", "eliquis", "rivaroxaban", "xarelto", "dabigatran", "pradaxa"],
    drug_class: "Anticoagulant (Direct Factor Xa Inhibitor / Direct Thrombin Inhibitor / VKA)",
    category: "Cardiovascular Agents",
    treats_nature: "Venous Thromboembolism & Thromboembolic Stroke Prevention",
    mechanism_of_action: "Warfarin/Acitrom inhibits vitamin K epoxide reductase, blocking gamma-carboxylation of clotting factors II, VII, IX, X and proteins C/S. Direct Oral Anticoagulants (Apixaban, Rivaroxaban) selectively and directly inhibit free and clot-bound Factor Xa, suppressing the final common pathway of the coagulation cascade and thrombin generation.",
    available_strengths: ["2.5 mg", "5 mg", "10 mg", "15 mg", "20 mg", "1 mg", "2 mg", "40 mg/0.4ml Injection"],
    dosage_forms: ["Tablet", "Prefilled Syringe for Subcutaneous Injection"],
    approved_indications: [
      "Non-valvular atrial fibrillation to reduce stroke and systemic embolism risk",
      "Treatment and secondary prevention of Deep Vein Thrombosis (DVT) and Pulmonary Embolism (PE)",
      "VTE prophylaxis following total hip or knee replacement arthroplasty",
      "Mechanical prosthetic heart valve anticoagulation (Warfarin ONLY)"
    ],
    reference_dosage: "Apixaban: 5 mg orally twice daily (2.5 mg BID if age ≥80, weight ≤60 kg, or creatinine ≥1.5 mg/dL). Rivaroxaban: 20 mg once daily with evening meal.",
    administration_instructions: "Take strictly as prescribed. Rivaroxaban 15 mg and 20 mg MUST be taken with food. Apixaban may be taken with or without food.",
    common_side_effects: ["Minor bleeding (gingival bleeding, bruising, prolonged bleeding from venipuncture)", "Mild nausea", "Anemia"],
    serious_adverse_effects: ["Major life-threatening gastrointestinal hemorrhage", "Intracranial hemorrhage and hemorrhagic stroke", "Spinal/epidural hematoma in patients undergoing neuraxial anesthesia or lumbar puncture", "Warfarin-induced skin necrosis"],
    contraindications: ["Active clinically significant pathological bleeding", "Mechanical heart valves (for DOACs; use Warfarin)", "Severe hepatic disease associated with coagulopathy", "Severe renal impairment with eGFR < 15 mL/min (DOACs)"],
    drug_interactions: ["Dual therapy with antiplatelets (aspirin, clopidogrel) or NSAIDs markedly increases major hemorrhage risk", "Combined strong P-gp and CYP3A4 inhibitors (ketoconazole, ritonavir) significantly increase DOAC exposure", "Warfarin interacts extensively with vitamin K-containing foods, antibiotics, and alcohol"],
    food_interactions: "For Warfarin: Maintain consistent intake of vitamin K-rich foods (green leafy vegetables). For Rivaroxaban: MUST take with evening food.",
    pregnancy_precautions: "Warfarin is Category X (teratogenic / fetal embryopathy). DOACs contraindicated in pregnancy; low-molecular-weight heparin (Enoxaparin) is the anticoagulant of choice.",
    breastfeeding_precautions: "DOACs not recommended during breastfeeding; Warfarin and Heparin are compatible with nursing.",
    age_precautions: "Strict dosage reduction rules apply for elderly patients with reduced renal clearance or low body weight.",
    storage_instructions: "Store below 25°C in original packaging.",
    schedule: "Schedule H Prescription Drug",
    prescription_required: true,
    source: "CDSCO & Chest / ESC Antithrombotic Guidelines"
  },

  // 27. Antifungals (Triazoles & Allylamines)
  {
    class_id: "antifungal_agents",
    keywords: ["fluconazole", "flucos", "forcan", "itraconazole", "canditral", "itaspor", "terbinafine", "tyza", "clotrimazole", "candid", "ketoconazole", "voriconazole", "amphotericin"],
    drug_class: "Triazole Antifungal / Allylamine Antifungal",
    category: "Anti-Infective & Antifungal Agents",
    treats_nature: "Superficial Cutaneous & Systemic Invasive Fungal Infections",
    mechanism_of_action: "Inhibits fungal cytochrome P450-dependent enzyme lanosterol 14-alpha-demethylase, blocking the conversion of lanosterol to ergosterol, an essential component of fungal cell membranes. Depletion of ergosterol causes cell membrane permeability, leakage of intracellular contents, and fungal cell death. Terbinafine inhibits squalene epoxidase.",
    available_strengths: ["150 mg", "200 mg", "100 mg", "250 mg", "1% Cream", "2% Cream"],
    dosage_forms: ["Capsule", "Tablet", "Topical Cream / Lotion", "Intravenous Infusion"],
    approved_indications: [
      "Vaginal candidiasis, oral thrush, and esophageal candidiasis",
      "Dermatophytosis: Tinea corporis (ringworm), Tinea cruris, Tinea pedis (athlete's foot), and onychomycosis",
      "Systemic fungal infections: Cryptococcal meningitis, histoplasmosis, and invasive aspergillosis"
    ],
    reference_dosage: "Fluconazole: 150 mg single oral dose for uncomplicated vaginal candidiasis; 200–400 mg daily for systemic infections. Itraconazole: 100–200 mg once or twice daily.",
    administration_instructions: "Itraconazole capsules MUST be taken IMMEDIATELY AFTER A FULL MEAL with an acidic beverage for proper absorption. Fluconazole can be taken with or without food.",
    common_side_effects: ["Nausea", "Abdominal discomfort", "Headache", "Rash", "Diarrhea", "Taste disturbance (terbinafine)"],
    serious_adverse_effects: ["Hepatotoxicity, acute liver injury, and cholestatic jaundice", "QTc interval prolongation and ventricular arrhythmias", "Congestive heart failure exacerbation (Itraconazole)", "Severe cutaneous adverse reactions (Stevens-Johnson syndrome)"],
    contraindications: ["Documented hypersensitivity to azoles", "Concurrent use with QTc-prolonging drugs metabolized by CYP3A4", "Ventricular dysfunction or history of heart failure (for Itraconazole)"],
    drug_interactions: ["Potent CYP3A4 inhibition increases blood levels of statins, anticoagulants, calcium channel blockers, and calcineurin inhibitors", "Gastric acid-reducing agents (PPIs, H2 blockers) severely impair itraconazole capsule absorption"],
    food_interactions: "Take itraconazole with a full meal; avoid concurrent antacids.",
    pregnancy_precautions: "Category D (high-dose or chronic fluconazole) / Category C (single 150 mg dose). Avoid oral azoles during first trimester; topical clotrimazole is preferred.",
    breastfeeding_precautions: "Fluconazole is excreted in breast milk; single 150 mg dose is compatible with nursing.",
    age_precautions: "Monitor hepatic transaminases and renal function during prolonged therapy (>14 days).",
    storage_instructions: "Store below 25°C in moisture-proof packaging.",
    schedule: "Schedule H Prescription Drug",
    prescription_required: true,
    source: "CDSCO & WHO Model List of Essential Medicines / IP 2022"
  },

  // 28. Antivirals (Nucleoside Analogues & Neuraminidase Inhibitors)
  {
    class_id: "antiviral_agents",
    keywords: ["acyclovir", "acivir", "valacyclovir", "valcivir", "oseltamivir", "antiflu", "tamiflu", "remdesivir", "tenofovir", "sofosbuvir", "entecavir"],
    drug_class: "Nucleoside Analogue / Viral Neuraminidase Inhibitor",
    category: "Anti-Infective & Antiviral Agents",
    treats_nature: "Viral Herpes, Influenza & Retroviral Replication Arrest",
    mechanism_of_action: "Acyclovir is selectively converted by viral thymidine kinase into acyclovir monophosphate, then by cellular kinases into active acyclovir triphosphate, which competitively inhibits viral DNA polymerase and acts as an obligate chain terminator in viral DNA replication. Oseltamivir inhibits influenza neuraminidase, preventing viral release from infected cells.",
    available_strengths: ["400 mg", "800 mg", "500 mg", "1000 mg", "75 mg", "3% Eye Ointment", "5% Cream"],
    dosage_forms: ["Tablet", "Capsule", "Intravenous Infusion", "Topical Cream", "Ophthalmic Ointment"],
    approved_indications: [
      "Herpes zoster (shingles) and acute chickenpox (varicella)",
      "Initial and recurrent episodes of genital herpes simplex (HSV-1 and HSV-2)",
      "Herpes simplex encephalitis and neonatal HSV infections (IV Acyclovir)",
      "Treatment and post-exposure prophylaxis of Influenza A and Influenza B (Oseltamivir)"
    ],
    reference_dosage: "Acyclovir for Shingles: 800 mg orally 5 times daily (every 4 hours while awake) for 7 days. Oseltamivir for Influenza: 75 mg orally twice daily for 5 days.",
    administration_instructions: "Take with a full glass of water. Maintain high fluid hydration throughout treatment to prevent renal tubular crystallization of acyclovir. Initiate therapy at the very first sign or symptom (within 48–72 hours).",
    common_side_effects: ["Nausea", "Vomiting", "Diarrhea", "Headache", "Malaise", "Abdominal discomfort"],
    serious_adverse_effects: ["Acute renal failure due to intratubular crystal precipitation (especially with rapid IV infusion or dehydration)", "Neurotoxicity (confusion, hallucinations, tremors, encephalopathy in renal failure)", "Severe neuropsychiatric events and delirium in children (Oseltamivir)"],
    contraindications: ["Known hypersensitivity to acyclovir, valacyclovir, or oseltamivir"],
    drug_interactions: ["Nephrotoxic medications (NSAIDs, aminoglycosides, amphotericin) markedly increase renal failure risk", "Probenecid reduces renal clearance and increases acyclovir exposure"],
    food_interactions: "Can be taken with or without food. Taking with food helps reduce nausea.",
    pregnancy_precautions: "Category B. Acyclovir has extensive registry data and is considered safe in pregnancy for maternal herpes infections.",
    breastfeeding_precautions: "Compatible with breastfeeding; excreted in low quantities in breast milk.",
    age_precautions: "Mandatory dose reduction in patients with renal impairment based on creatinine clearance.",
    storage_instructions: "Store below 25°C protected from light and moisture.",
    schedule: "Schedule H Prescription Drug",
    prescription_required: true,
    source: "CDSCO & WHO Model List of Essential Medicines / CDC STI Treatment Guidelines"
  },

  // 29. Antispasmodics & Smooth Muscle Relaxants
  {
    class_id: "antispasmodics",
    keywords: ["drotaverine", "drotikind", "drotin", "dicyclomine", "meftal-spas", "cyclopam", "mebeverine", "colospa"],
    drug_class: "Phosphodiesterase-4 Inhibitor / Antimuscarinic Antispasmodic",
    category: "Gastrointestinal & Antacids",
    treats_nature: "Smooth Muscle Spasm, Biliary/Renal Colic & Dysmenorrhea",
    mechanism_of_action: "Drotaverine selectively inhibits phosphodiesterase IV (PDE-4) in smooth muscle cells, elevating intracellular cyclic AMP (cAMP), deactivating myosin light-chain kinase (MLCK), and causing smooth muscle relaxation in gastrointestinal, biliary, and urogenital tracts without anticholinergic side effects. Dicyclomine blocks muscarinic M3 receptors.",
    available_strengths: ["40 mg", "80 mg", "10 mg", "20 mg", "135 mg", "200 mg"],
    dosage_forms: ["Tablet", "Capsule", "Injection IM/IV"],
    approved_indications: [
      "Spastic abdominal pain in irritable bowel syndrome (IBS)",
      "Biliary colic and renal/ureteric colic due to lithiasis",
      "Primary spasmodic dysmenorrhea",
      "Uterine hypermotility and spastic gastrointestinal disorders"
    ],
    reference_dosage: "Drotaverine: 40 mg to 80 mg orally 2–3 times daily. Dicyclomine: 10 mg to 20 mg 3–4 times daily.",
    administration_instructions: "Take with water, with or after meals. If experiencing drowsiness or dry mouth, avoid driving or operating machinery.",
    common_side_effects: ["Mild dizziness", "Dry mouth (dicyclomine)", "Nausea", "Headache", "Constipation", "Blurred vision (anticholinergics)"],
    serious_adverse_effects: ["Hypotension with rapid IV administration", "Urinary retention in benign prostatic hypertrophy", "Precipitation of acute angle-closure glaucoma (dicyclomine)"],
    contraindications: ["Severe hepatic, renal, or cardiac insufficiency", "Glaucoma and obstructive uropathy (for dicyclomine)", "Infants under 6 months of age (dicyclomine causes infant respiratory collapse)"],
    drug_interactions: ["Drotaverine may reduce antiparkinsonian effect of levodopa", "Anticholinergics have additive effects with antihistamines, tricyclics, and phenothiazines"],
    food_interactions: "Take after meals to minimize gastrointestinal upset.",
    pregnancy_precautions: "Category B/C. Avoid during early pregnancy unless deemed essential by an obstetrician.",
    breastfeeding_precautions: "Dicyclomine is contraindicated during lactation (respiratory arrest risk in infants). Drotaverine used with caution.",
    age_precautions: "Contraindicated in neonates and young infants. Dose reduction in elderly.",
    storage_instructions: "Store below 25°C protected from light.",
    schedule: "Schedule H Prescription Drug",
    prescription_required: true,
    source: "CDSCO & Indian Pharmacopoeia"
  },

  // 30. Antiemetics & Gastroprokinetics
  {
    class_id: "antiemetics_gastroprokinetics",
    keywords: ["ondansetron", "emeset", "ondem", "domperidone", "domstal", "pan-d", "vomistop", "metoclopramide", "perinorm", "reglan"],
    drug_class: "Selective 5-HT3 Serotonin Receptor Antagonist / Dopamine D2 Antagonist",
    category: "Gastrointestinal & Antacids",
    treats_nature: "Nausea, Vomiting & Gastric Motility Disorders",
    mechanism_of_action: "Ondansetron selectively antagonizes 5-HT3 serotonin receptors located centrally in the chemoreceptor trigger zone (CTZ) of the area postrema and peripherally on vagal nerve terminals in the gastrointestinal tract, preventing nausea and emetic reflex signaling. Domperidone blocks peripheral dopamine D2 receptors in the upper GI tract to enhance gastric emptying and esophageal sphincter tone.",
    available_strengths: ["4 mg", "8 mg", "2 mg/ml IV", "10 mg", "30 mg SR"],
    dosage_forms: ["Tablet", "Orally Disintegrating Tablet (ODT)", "Oral Syrup", "Injection IV/IM"],
    approved_indications: [
      "Prevention and treatment of nausea and vomiting induced by chemotherapy or radiotherapy",
      "Postoperative nausea and vomiting (PONV) prophylaxis and treatment",
      "Acute gastroenteritis-associated vomiting in adults and pediatric patients",
      "Gastroparesis and functional dyspepsia (Domperidone)"
    ],
    reference_dosage: "Ondansetron: 4 mg to 8 mg orally 30 minutes before meal or chemotherapy; repeat every 8–12 hours as needed. Domperidone: 10 mg 3 times daily before meals.",
    administration_instructions: "Ondansetron orally disintegrating tablets (ODT) should be placed on the tongue where they dissolve in seconds; swallow with saliva without water. Domperidone should be taken 15–30 minutes BEFORE meals.",
    common_side_effects: ["Headache", "Constipation", "Transient flushing", "Drowsiness", "Fatigue"],
    serious_adverse_effects: ["Dose-dependent QTc prolongation and torsades de pointes (Black Box Warning for IV Ondansetron > 16 mg)", "Extrapyramidal reactions / acute dystonia (Metoclopramide)", "Hyperprolactinemia, gynecomastia, and galactorrhea (Domperidone/Metoclopramide)", "Serotonin syndrome when combined with serotonergic drugs"],
    contraindications: ["Congenital long QT syndrome", "Concurrent apomorphine administration (severe hypotension and loss of consciousness)", "Mechanical bowel obstruction, perforation, or active GI bleeding"],
    drug_interactions: ["QTc-prolonging agents (antiarrhythmics, fluoroquinolones, macrolides) markedly elevate ventricular arrhythmia risk", "Strong CYP3A4 inhibitors increase domperidone concentrations"],
    food_interactions: "Take Domperidone 15–30 minutes before food for maximum prokinetic effect.",
    pregnancy_precautions: "Category B. First-line prescription antiemetic for hyperemesis gravidarum when first-line doxylamine/pyridoxine fails, preferably after 10 weeks gestation.",
    breastfeeding_precautions: "Excreted in low levels in breast milk; generally compatible with nursing.",
    age_precautions: "Caution in elderly patients with pre-existing cardiac conduction disorders.",
    storage_instructions: "Store below 25°C protected from light and moisture.",
    schedule: "Schedule H Prescription Drug",
    prescription_required: true,
    source: "CDSCO & WHO Model List of Essential Medicines / MASCC/ESMO Antiemetic Guidelines"
  },

  // 31. Anticonvulsants & Neuropathic Pain Modulators
  {
    class_id: "anticonvulsants_neuropathic",
    keywords: ["gabapentin", "gabapin", "pregabalin", "pregalin", "lyrica", "levetiracetam", "levipil", "sodium valproate", "valparin", "encorate", "carbamazepine", "tegretol", "phenytoin", "eptoin"],
    drug_class: "Voltage-Gated Calcium Channel Alpha-2-Delta Modulator / Anticonvulsant",
    category: "Neurology & Psychiatric Agents",
    treats_nature: "Seizure Disorders & Peripheral Neuropathic Pain",
    mechanism_of_action: "Gabapentin and Pregabalin bind with high affinity to the auxiliary alpha-2-delta subunit of presynaptic voltage-gated calcium channels in the central nervous system, reducing calcium influx into nerve terminals and attenuating the exocytotic release of excitatory neurotransmitters (glutamate, substance P, norepinephrine), suppressing hyperactive neuronal firing.",
    available_strengths: ["75 mg", "150 mg", "300 mg", "600 mg", "500 mg", "1000 mg", "200 mg"],
    dosage_forms: ["Capsule", "Tablet", "Extended-Release Tablet", "Oral Solution"],
    approved_indications: [
      "Peripheral neuropathic pain (diabetic peripheral neuropathy, post-herpetic neuralgia)",
      "Fibromyalgia and chronic neuropathic radiculopathy",
      "Adjunctive therapy for partial-onset seizures with or without secondary generalization",
      "Generalized anxiety disorder (Pregabalin)"
    ],
    reference_dosage: "Pregabalin: 75 mg twice daily; titrate to 150 mg twice daily. Gabapentin: 300 mg on day 1, 300 mg BID on day 2, 300 mg TID on day 3; titrate up to 1,800–3,600 mg/day divided.",
    administration_instructions: "Take orally with or without food. Do not stop taking abruptly; taper off over at least 1 week to avoid withdrawal symptoms and rebound seizures.",
    common_side_effects: ["Dizziness", "Somnolence", "Peripheral edema (fluid retention in feet/legs)", "Weight gain", "Dry mouth", "Blurred vision", "Ataxia"],
    serious_adverse_effects: ["Respiratory depression (particularly when co-prescribed with opioids or sedatives)", "Suicidal ideation and behavioral changes", "Severe angioedema", "Physiological dependence and withdrawal syndrome upon abrupt cessation"],
    contraindications: ["Documented hypersensitivity to gabapentinoids"],
    drug_interactions: ["Concurrent use with opioid analgesics (tramadol, morphine, codeine) or benzodiazepines drastically elevates fatal respiratory depression risk", "Alcohol enhances sedative and motor impairment effects"],
    food_interactions: "Can be taken with or without food. Avoid alcohol.",
    pregnancy_precautions: "Category C. Animal studies show fetal skeletal variations; use only if potential benefit justifies potential fetal risk.",
    breastfeeding_precautions: "Excreted into breast milk in significant amounts; monitor infant for drowsiness and poor weight gain.",
    age_precautions: "Dose reduction strictly mandatory in patients with renal impairment (creatinine clearance < 60 mL/min). Higher fall risk in elderly.",
    storage_instructions: "Store below 25°C protected from moisture.",
    schedule: "Schedule H Prescription Drug",
    prescription_required: true,
    source: "CDSCO & International Association for the Study of Pain (IASP) Guidelines"
  },

  // 32. Thyroid Hormone Replacement
  {
    class_id: "thyroid_hormone",
    keywords: ["levothyroxine", "thyronorm", "eltroxin", "thyrox", "synthroid"],
    drug_class: "Synthetic Thyroid Hormone (T4) Replacement",
    category: "Endocrine & Corticosteroids",
    treats_nature: "Hypothyroidism & Endogenous Thyroid Deficiency",
    mechanism_of_action: "Synthetic crystalline levorotatory isomer of thyroxine (T4) that is deiodinated in peripheral tissues by 5'-iodothyronine deiodinase to the active hormone triiodothyronine (T3). T3 enters the cell nucleus and binds to thyroid hormone receptors, regulating DNA transcription, mitochondrial oxidative metabolism, and physiological growth, development, and energy expenditure.",
    available_strengths: ["12.5 mcg", "25 mcg", "50 mcg", "75 mcg", "88 mcg", "100 mcg", "112 mcg", "125 mcg", "150 mcg"],
    dosage_forms: ["Tablet"],
    approved_indications: [
      "Primary, secondary, and tertiary hypothyroidism",
      "Pituitary thyroid-stimulating hormone (TSH) suppression in the management of well-differentiated thyroid cancer",
      "Congenital hypothyroidism (cretinism) in neonates and infants"
    ],
    reference_dosage: "Adults: Full replacement dose is approximately 1.6 mcg/kg/day (e.g., 50–100 mcg once daily). Titrate by 12.5–25 mcg every 6 to 8 weeks based on serum TSH levels.",
    administration_instructions: "Take ONCE DAILY IN THE MORNING ON AN EMPTY STOMACH with a full glass of plain water, strictly at least 30 to 60 minutes BEFORE breakfast, tea, or coffee. NEVER take with milk, tea, calcium, or iron supplements.",
    common_side_effects: ["Generally side-effect free when therapeutic dose is properly calibrated to normal TSH", "Transient hair loss during initial months of therapy in children"],
    serious_adverse_effects: ["Iatrogenic hyperthyroidism / thyrotoxicosis from overtreatment: atrial fibrillation, cardiac arrhythmias, angina pectoris, palpitations, nervousness, severe insomnia, tremors, and accelerated osteoporotic bone loss"],
    contraindications: ["Untreated subclinical or overt thyrotoxicosis", "Acute myocardial infarction or uncorrected adrenal insufficiency (initiating thyroid hormone can precipitate fatal acute adrenal crisis)"],
    drug_interactions: ["Calcium carbonate, ferrous sulfate, sucralfate, PPIs, and aluminum hydroxide drastically bind to levothyroxine and prevent absorption (separate by at least 4 hours)", "Warfarin: thyroid hormone increases catabolism of clotting factors, potentiating anticoagulant effect"],
    food_interactions: "Soybean flour, dietary fiber, coffee, and tea significantly impair absorption. Must be taken on an empty stomach with plain water only.",
    pregnancy_precautions: "Category A. Safe and ESSENTIAL during pregnancy. Maternal levothyroxine requirements typically increase by 30–50% during the first trimester to support fetal brain development.",
    breastfeeding_precautions: "Compatible with breastfeeding; minimal physiological quantities excreted in breast milk.",
    age_precautions: "In elderly patients or those with coronary artery disease, start at a low dose (12.5–25 mcg daily) to prevent unmasking latent angina or arrhythmias.",
    storage_instructions: "Store below 25°C in original moisture-tight blister packaging protected from heat, light, and humidity.",
    schedule: "Schedule H Prescription Drug",
    prescription_required: true,
    source: "CDSCO & American Thyroid Association (ATA) / Indian Endocrine Society Guidelines"
  },

  // 33. Essential Vitamins, Minerals & Hematinics
  {
    class_id: "vitamins_minerals_hematinics",
    keywords: ["vitamin d3", "cholecalciferol", "calcirol", "d-rise", "calcium", "shelcal", "cipcal", "methylcobalamin", "mecobalamin", "neurobion", "folic acid", "ferrous ascorbate", "orofer", "becosules", "zinc", "ascorbic acid"],
    drug_class: "Essential Micronutrient, Vitamin & Mineral Supplement",
    category: "Nutritional & Vitamin Supplements",
    treats_nature: "Nutritional Deficiency, Bone Mineralization & Anemia Prophylaxis",
    mechanism_of_action: "Cholecalciferol is hydroxylated in the liver to 25(OH)D and then in the kidneys to active calcitriol (1,25(OH)2D), stimulating intestinal calcium and phosphate absorption and bone mineralization. Methylcobalamin acts as a cofactor for methionine synthase in homocysteine remethylation and myelin sheath synthesis. Iron is incorporated into hemoglobin for oxygen transport.",
    available_strengths: ["60,000 IU", "500 mg + 250 IU", "1500 mcg", "5 mg", "100 mg elemental iron"],
    dosage_forms: ["Capsule", "Tablet", "Oral Granules / Sachet", "Oral Solution / Drops", "Injection IM/IV"],
    approved_indications: [
      "Prevention and treatment of Vitamin D deficiency, rickets, and osteomalacia",
      "Adjuvant therapy in postmenopausal and senile osteoporosis",
      "Peripheral neuropathy, diabetic neuropathy, and megaloblastic anemia (Vitamin B12)",
      "Iron deficiency anemia and nutritional anemia in pregnancy",
      "Neural tube defect prevention in women planning pregnancy (Folic acid)"
    ],
    reference_dosage: "Cholecalciferol for deficiency: 60,000 IU orally once weekly for 8 weeks, followed by once monthly maintenance. Methylcobalamin: 1500 mcg once daily. Calcium: 500 mg elemental calcium 1–2 times daily.",
    administration_instructions: "Cholecalciferol (fat-soluble) is best absorbed when taken WITH A MEAL CONTAINING DIETARY FAT or with milk. Calcium carbonate should be taken with meals; Calcium citrate can be taken with or without food. Iron is best absorbed on an empty stomach with citrus juice.",
    common_side_effects: ["Mild constipation (calcium/iron)", "Dark-colored or black stools (iron supplements - completely harmless)", "Mild nausea"],
    serious_adverse_effects: ["Hypercalcemia, hypercalciuria, and nephrolithiasis (kidney stones) with excessive chronic Vitamin D / Calcium megadoses", "Iron overload and accidental pediatric iron poisoning"],
    contraindications: ["Hypercalcemia and hypervitaminosis D", "Severe renal impairment with calcified nephrolithiasis", "Hemochromatosis and hemosiderosis (for iron supplements)"],
    drug_interactions: ["Calcium and iron supplements chelate with fluoroquinolones, tetracyclines, and levothyroxine, preventing their absorption (separate by at least 2–4 hours)", "Thiazide diuretics reduce renal calcium excretion and increase hypercalcemia risk with calcium"],
    food_interactions: "Take Vitamin D with fatty meals. Avoid taking iron supplements with tea, coffee, or milk (tannins and calcium block iron absorption).",
    pregnancy_precautions: "Category A. Recommended and essential during pregnancy (Folic acid 5mg pre-conception, Iron-Folic acid from 2nd trimester, Calcium-Vitamin D).",
    breastfeeding_precautions: "Compatible with breastfeeding; essential maternal nutrient.",
    age_precautions: "Ensure age-appropriate liquid formulations for pediatric rickets prophylaxis.",
    storage_instructions: "Store below 25°C in a dry place protected from light.",
    schedule: "General Sale / Nutritional Formulation",
    prescription_required: false,
    source: "CDSCO & WHO Micronutrient Guidelines / ICMR-NIN RDA 2020"
  },

  // 34. Urological Agents (Alpha-1 Blockers & 5-ARIs)
  {
    class_id: "urological_alpha_blockers",
    keywords: ["tamsulosin", "urimax", "silodosin", "silofast", "alfuzosin", "finasteride", "finax", "dutasteride", "dutas"],
    drug_class: "Selective Alpha-1A Adrenergic Antagonist / 5-Alpha Reductase Inhibitor",
    category: "Urological & Renal Agents",
    treats_nature: "Benign Prostatic Hyperplasia (BPH) & Urinary Outflow Obstruction",
    mechanism_of_action: "Tamsulosin and silodosin selectively block alpha-1A adrenergic receptors concentrated in the prostate stroma, bladder neck, and prostatic urethra, relaxing smooth muscle and reducing dynamic urethral resistance, improving peak urinary flow rate and relieving lower urinary tract symptoms (LUTS). Finasteride inhibits 5-alpha reductase, blocking conversion of testosterone to dihydrotestosterone (DHT), shrinking prostate volume.",
    available_strengths: ["0.4 mg", "8 mg", "5 mg", "0.5 mg", "0.4mg + 0.5mg Combo"],
    dosage_forms: ["Modified-Release Capsule", "Tablet"],
    approved_indications: [
      "Lower urinary tract symptoms (LUTS) suggestive of Benign Prostatic Hyperplasia (BPH)",
      "Medical expulsive therapy for distal ureteral calculi (off-label)",
      "Androgenetic alopecia in males (Finasteride 1mg)"
    ],
    reference_dosage: "Tamsulosin: 0.4 mg orally once daily approximately 30 minutes after the same meal each day. Silodosin: 8 mg once daily with food.",
    administration_instructions: "Take once daily approximately 30 minutes AFTER THE SAME MEAL each day. Swallow capsules whole; do NOT crush, chew, or open.",
    common_side_effects: ["Retrograde ejaculation (dry orgasm - harmless and reversible)", "Dizziness", "Headache", "Nasal congestion", "Mild asthenia"],
    serious_adverse_effects: ["Orthostatic hypotension and syncope (first-dose effect)", "Intraoperative Floppy Iris Syndrome (IFIS) during cataract and glaucoma surgery", "Decreased libido and erectile dysfunction (Finasteride/Dutasteride)"],
    contraindications: ["Severe hepatic impairment (Child-Pugh Class C)", "Concurrent use with potent CYP3A4 inhibitors (ketoconazole, ritonavir)"],
    drug_interactions: ["PDE-5 inhibitors (sildenafil, tadalafil) have additive vasodilatory effects; co-administer with caution to avoid symptomatic hypotension", "CYP3A4 and P-gp inhibitors increase tamsulosin plasma levels"],
    food_interactions: "Take approximately 30 minutes after food to maintain consistent absorption and minimize postural hypotension.",
    pregnancy_precautions: "Not indicated for women. Finasteride and Dutasteride are Category X: pregnant women must NOT handle crushed or broken tablets due to risk of fetal male genital malformations.",
    breastfeeding_precautions: "Not indicated for women.",
    age_precautions: "Ophthalmologist MUST be informed of tamsulosin use before planned cataract surgery to prevent IFIS complications.",
    storage_instructions: "Store below 25°C in moisture-proof packaging.",
    schedule: "Schedule H Prescription Drug",
    prescription_required: true,
    source: "CDSCO & American Urological Association (AUA) / EAU Guidelines on BPH"
  },

  // 35. Topical Cutaneous Formulations (Dermatologicals)
  {
    class_id: "topical_dermatologicals",
    keywords: ["mupirocin", "t-bact", "fusidic acid", "fucidin", "clobetasol", "tenovate", "betamethasone topical", "betnovate", "permethrin", "permite", "benzoyl peroxide", "adapalene", "deriva"],
    drug_class: "Topical Cutaneous Formulation (Antibiotic / Corticosteroid / Scabicide)",
    category: "Dermatological Agents",
    treats_nature: "Localized Cutaneous Infection, Eczematous Dermatitis & Infestation",
    mechanism_of_action: "Provides concentrated pharmacological delivery directly to epidermal and dermal target tissues. Mupirocin inhibits bacterial isoleucyl-tRNA synthetase, arresting staphylococcal and streptococcal protein synthesis. Topical corticosteroids suppress local epidermal cytokine release and vascular permeability. Permethrin disrupts sodium channels of arthropod nerve membranes.",
    available_strengths: ["2% Ointment", "2% Cream", "0.05% Cream", "5% Lotion", "2.5% Gel", "0.1% Gel"],
    dosage_forms: ["Ointment", "Cream", "Lotion", "Topical Gel"],
    approved_indications: [
      "Impetigo, folliculitis, and secondary superficial bacterial skin infections (Mupirocin)",
      "Severe plaque psoriasis, refractory eczema, and lichen planus (Clobetasol)",
      "Scabies infestation caused by Sarcoptes scabiei (Permethrin)",
      "Acne vulgaris comedones and inflammatory papules (Adapalene/Benzoyl Peroxide)"
    ],
    reference_dosage: "Apply a thin film to the affected cleansed area 1 to 3 times daily as prescribed. For Permethrin 5%: apply thoroughly from neck to soles, leave on for 8–14 hours, then wash off completely.",
    administration_instructions: "FOR EXTERNAL TOPICAL USE ONLY. Wash hands thoroughly before and after application. Avoid all contact with eyes, mucous membranes, mouth, and open deep wounds.",
    common_side_effects: ["Mild transient burning or stinging sensation at site of application", "Dry skin and peeling", "Cutaneous erythema"],
    serious_adverse_effects: ["Skin atrophy, telangiectasia, striae, and hypopigmentation with prolonged high-potency topical steroids", "Systemic absorption causing hypothalamic-pituitary-adrenal (HPA) axis suppression with extensive occlusive dressings", "Secondary cutaneous fungal or viral infections"],
    contraindications: ["Hypersensitivity to active ingredients", "Untreated viral (herpes, varicella), fungal, or tubercular cutaneous lesions for topical corticosteroids"],
    drug_interactions: ["Avoid concurrent application of other topical products on the same skin area unless directed by dermatologist"],
    food_interactions: "Not applicable (topical external cutaneous application).",
    pregnancy_precautions: "Category B/C. Short-term localized application of mild to moderate potency agents is generally safe; avoid high-potency steroids over extensive body surface areas.",
    breastfeeding_precautions: "Do NOT apply to breast or nipple area before nursing.",
    age_precautions: "Children have higher body surface area to weight ratio; high risk of systemic steroid absorption. Limit ultra-potent steroids.",
    storage_instructions: "Store below 25°C. Do not freeze. Keep tube tightly closed.",
    schedule: "Schedule H Prescription Drug",
    prescription_required: true,
    source: "CDSCO & Indian Association of Dermatologists, Venereologists and Leprologists (IADVL)"
  },

  // 36. Ophthalmic & Otic Formulations
  {
    class_id: "ophthalmic_otic_drops",
    keywords: ["carboxymethylcellulose", "refresh tears", "moxifloxacin eye drops", "vigamox", "timolol eye", "travoprost", "xylometazoline", "otrivin", "oxymetazoline", "nasivion"],
    drug_class: "Topical Ophthalmic / Otic / Nasal Formulation",
    category: "Ophthalmology & ENT",
    treats_nature: "Ocular Surface Disease, Glaucoma & Nasal Mucosal Congestion",
    mechanism_of_action: "Carboxymethylcellulose acts as a synthetic tear substitute that binds to corneal epithelial cells, increasing tear film viscosity, prolonging ocular surface retention time, and lubricating the cornea. Moxifloxacin eye drops eradicate ocular bacterial pathogens via DNA gyrase inhibition. Xylometazoline stimulates alpha-adrenergic receptors on nasal venous sinusoids, causing decongestion.",
    available_strengths: ["0.5%", "1%", "0.5% w/v", "0.004%", "0.1% w/v", "0.05% w/v"],
    dosage_forms: ["Eye Drops", "Eye Gel", "Ear Drops", "Nasal Spray / Drops"],
    approved_indications: [
      "Dry eye disease (keratoconjunctivitis sicca) and ocular surface irritation",
      "Bacterial conjunctivitis, corneal ulcers, and post-cataract surgery antimicrobial prophylaxis",
      "Elevated intraocular pressure in open-angle glaucoma (Timolol, Travoprost)",
      "Acute symptomatic relief of nasal congestion in rhinitis and sinusitis"
    ],
    reference_dosage: "Eye drops: Instill 1 to 2 drops into the affected eye(s) 3–4 times daily or as needed. Nasal spray: 1 spray into each nostril 2–3 times daily for a MAXIMUM OF 3 TO 5 CONSECUTIVE DAYS.",
    administration_instructions: "Wash hands thoroughly. Tilt head back, pull down lower eyelid to form a pocket, and instill drops without touching dropper tip to the eye or eyelashes to prevent contamination. Keep eyes closed for 1–2 minutes with punctal occlusion. Nasal decongestants MUST NOT be used for more than 5 consecutive days to prevent severe rhinitis medicamentosa.",
    common_side_effects: ["Transient mild ocular burning or stinging", "Temporary blurred vision immediately following drop instillation", "Nasal dryness and sneezing"],
    serious_adverse_effects: ["Rebound nasal congestion and chronic mucosal hypertrophy (rhinitis medicamentosa) from overuse of nasal decongestants", "Systemic beta-blockade from timolol eye drops (severe bradycardia, bronchospasm in asthmatics)"],
    contraindications: ["Documented hypersensitivity to formulation components", "Timolol eye drops contraindicated in bronchial asthma, severe COPD, and bradycardia"],
    drug_interactions: ["Systemic beta-blockers co-prescribed with ophthalmic timolol have additive systemic cardiac effects"],
    food_interactions: "Not applicable (topical local instillation).",
    pregnancy_precautions: "Artificial tears (Carboxymethylcellulose) are Category A and safe. Ophthalmic medications should be used with punctal occlusion to minimize systemic absorption.",
    breastfeeding_precautions: "Compatible with nursing; use nasolacrimal occlusion for 2 minutes following eye drop instillation.",
    age_precautions: "Pediatric nasal decongestant concentrations (0.05%) must be used for children aged 2–11 years; do not use adult formulations.",
    storage_instructions: "Store below 25°C. Discard eye drop vial 30 days after first opening to prevent microbial contamination.",
    schedule: "General Sale (Lubricants) / Schedule H (Antibiotic / Antiglaucoma Drops)",
    prescription_required: false,
    source: "CDSCO & All India Ophthalmological Society (AIOS) Guidelines"
  }
];

/**
 * Word boundary token matching helper to prevent substring collision bugs
 * (e.g. "Paraplatin" matching "para", or "Ciprofloxacin" matching "cipro" inside penicillin).
 */
function matchKeyword(text, keyword) {
  if (!text || !keyword) return false;
  const cleanKw = keyword.trim().toLowerCase();
  const cleanText = text.toLowerCase();

  // Escape special regex characters in keyword
  const escaped = cleanKw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Use boundary that matches word edge or punctuation/number separator
  const rx = new RegExp('(^|[^a-z0-9])' + escaped + '([^a-z0-9]|$)', 'i');
  return rx.test(cleanText);
}

/**
 * Enriches any medicine record with authoritative CDSCO / WHO / NLEM pharmacological metadata.
 * Complies with the 16 core attributes required for clinical patient education.
 */
export function enrichMedicineKnowledge(rawMed, targetLanguage = 'en') {
  if (!rawMed) return null;

  const brandName = (rawMed.brand_name || rawMed.name || 'Clinical Medication').trim();
  const genericName = (rawMed.generic_name || rawMed.composition || brandName).trim();
  const composition = (rawMed.composition || rawMed.active_ingredient || genericName).trim();
  const category = (rawMed.therapeutic_category || rawMed.category || 'Pharmaceutical Product').trim();

  // Search target: generic name and composition have highest priority to avoid brand collisions
  const genericTarget = `${genericName} ${composition}`.toLowerCase();
  const brandTarget = brandName.toLowerCase();
  const categoryTarget = category.toLowerCase();

  // 1. Try matching against generic name & active composition first
  let matchedRule = CLINICAL_DRUG_CLASSES.find(rule =>
    rule.keywords.some(kw => matchKeyword(genericTarget, kw))
  );

  // 2. If no match on generic, match against brand name
  if (!matchedRule) {
    matchedRule = CLINICAL_DRUG_CLASSES.find(rule =>
      rule.keywords.some(kw => matchKeyword(brandTarget, kw))
    );
  }

  // 3. Fallback matching against category
  if (!matchedRule) {
    matchedRule = CLINICAL_DRUG_CLASSES.find(rule =>
      rule.keywords.some(kw => matchKeyword(categoryTarget, kw))
    );
  }

  // Fallback clinical template if no specific pharmacological rule matched
  if (!matchedRule) {
    matchedRule = {
      class_id: "unverified_molecule",
      drug_class: "Information currently unavailable in clinical reference",
      category: "Information currently unavailable in clinical reference",
      treats_nature: "Information currently unavailable in clinical reference",
      mechanism_of_action: "Information currently unavailable in clinical reference",
      available_strengths: [rawMed.strength || "Information currently unavailable in clinical reference"],
      dosage_forms: [rawMed.formulation || rawMed.dosage_form || "Information currently unavailable in clinical reference"],
      approved_indications: ["Information currently unavailable in clinical reference"],
      reference_dosage: "Information currently unavailable in clinical reference",
      administration_instructions: "Information currently unavailable in clinical reference",
      common_side_effects: ["Information currently unavailable in clinical reference"],
      serious_adverse_effects: ["Information currently unavailable in clinical reference"],
      contraindications: ["Information currently unavailable in clinical reference"],
      drug_interactions: ["Information currently unavailable in clinical reference"],
      food_interactions: "Information currently unavailable in clinical reference",
      pregnancy_precautions: "Information currently unavailable in clinical reference",
      breastfeeding_precautions: "Information currently unavailable in clinical reference",
      age_precautions: "Information currently unavailable in clinical reference",
      storage_instructions: rawMed.storage || "Information currently unavailable in clinical reference",
      schedule: rawMed.prescription_required ? "Schedule H Prescription Drug" : "Information currently unavailable in clinical reference",
      prescription_required: Boolean(rawMed.prescription_required),
      source: "Information currently unavailable in clinical reference"
    };
  }

  // Parse active ingredients from composition or generic name
  const activeIngredients = composition
    .split('+')
    .map(s => s.trim())
    .filter(Boolean);

  // Deduce route of administration from formulation / dosage form
  const formStr = `${rawMed.dosage_form || ''} ${rawMed.formulation || ''} ${matchedRule.dosage_forms?.join(' ') || ''}`.toLowerCase();
  let routeOfAdministration = "Oral (P.O. by mouth with water)";
  if (formStr.includes("injection") || formStr.includes("iv") || formStr.includes("im") || formStr.includes("infusion")) {
    routeOfAdministration = "Intravenous / Intramuscular Injection (Parenteral)";
  } else if (formStr.includes("eye") || formStr.includes("ophthalmic")) {
    routeOfAdministration = "Ophthalmic (Instillation into conjunctival sac of eye)";
  } else if (formStr.includes("ear") || formStr.includes("otic")) {
    routeOfAdministration = "Otic (Instillation into external ear canal)";
  } else if (formStr.includes("nasal") || formStr.includes("inhal") || formStr.includes("respule") || formStr.includes("rotacap")) {
    routeOfAdministration = "Respiratory Inhalation / Intranasal";
  } else if (formStr.includes("cream") || formStr.includes("ointment") || formStr.includes("gel") || formStr.includes("lotion") || formStr.includes("topical")) {
    routeOfAdministration = "Topical Cutaneous (External skin application)";
  } else if (formStr.includes("sublingual")) {
    routeOfAdministration = "Sublingual (Dissolve under tongue)";
  }

  // Deduce food-related instructions
  let foodInstructions = matchedRule.food_interactions || "May be taken with or without food. Follow packaging instructions.";
  const ruleId = matchedRule.class_id;
  if (ruleId === "proton_pump_inhibitors") {
    foodInstructions = "Take strictly on an empty stomach at least 30 to 60 minutes before breakfast with a glass of water.";
  } else if (ruleId === "thyroid_hormone") {
    foodInstructions = "Take first thing in the morning on an empty stomach with a full glass of plain water, at least 30 to 60 minutes before breakfast, tea, or coffee.";
  } else if (ruleId === "nsaids_selective_nonselective") {
    foodInstructions = "Take immediately after meals with a full glass of water. NEVER take on an empty stomach to prevent gastric mucosal irritation.";
  } else if (ruleId === "biguanide_antidiabetic") {
    foodInstructions = "Take with or immediately after meals to reduce stomach upset and nausea.";
  } else if (ruleId === "sulfonylureas") {
    foodInstructions = "Take immediately before or with breakfast (or the first main meal). Never skip meals after taking.";
  } else if (ruleId === "penicillins_aminopenicillins") {
    foodInstructions = "Take at the start of a meal with plenty of water to enhance absorption and reduce GI distress.";
  } else if (ruleId === "tetracyclines") {
    foodInstructions = "Take with a full glass of water in an upright sitting posture. Avoid dairy products (milk, yogurt) 2 hours before or after.";
  }

  // Storage instructions
  const storageInstructions = rawMed.storage || matchedRule.storage_instructions || "Store below 25°C in a cool, dry place protected from direct sunlight and moisture. Keep blister packs intact until use. Keep strictly out of reach of children.";

  // Regulatory Schedule
  const regulatorySchedule = matchedRule.schedule || (rawMed.prescription_required ? "Schedule H Prescription Drug" : "General Healthcare Formulation (OTC / Non-Scheduled)");

  // Clinical Precautions synthesis
  const clinicalPrecautionsList = [
    matchedRule.pregnancy_precautions ? `Pregnancy: ${matchedRule.pregnancy_precautions}` : null,
    matchedRule.breastfeeding_precautions ? `Lactation: ${matchedRule.breastfeeding_precautions}` : null,
    matchedRule.age_precautions ? `Age Considerations: ${matchedRule.age_precautions}` : null,
    rawMed.precautions || null
  ].filter(Boolean);
  if (clinicalPrecautionsList.length === 0) {
    clinicalPrecautionsList.push("Information currently unavailable in clinical reference; consult physician or pharmacist");
  }
  const clinicalPrecautions = clinicalPrecautionsList.join(" • ");

  // Generic vs Brand educational explanation
  const genericVsBrand = `Generic Name (${genericName}) is the globally recognized non-proprietary chemical molecule approved by health authorities (WHO / CDSCO) that produces the therapeutic clinical effect. Brand Name (${brandName}) is the commercial trademark under which the manufacturer packages and markets this generic molecule. Both formulations contain the identical active pharmaceutical ingredient (API) and are bioequivalent in purity, efficacy, and clinical safety standards.`;

  // Safety information & Boxed Warnings
  const safetyInformation = `STATUTORY CLINICAL SAFETY NOTICE: This medication is a verified pharmaceutical preparation. Strictly follow the prescribing doctor's dosage regimen. Never self-prescribe, share, or abruptly discontinue prescription medicines without professional medical consultation. If you experience difficulty breathing, facial swelling, severe skin rash, or yellowing of the eyes/skin, seek immediate emergency medical care.`;

  // Patient-friendly explanation structure (all 6 required points)
  const patientExplanation = {
    what_it_does: `Acts as a therapeutic ${matchedRule.drug_class || category} designed to manage or treat ${matchedRule.approved_indications?.[0] || 'the diagnosed medical condition'}.`,
    why_prescribed: `Clinically prescribed by doctors to treat or alleviate: ${(matchedRule.approved_indications || []).slice(0, 3).join(', ')}.`,
    how_it_works_in_body: matchedRule.mechanism_of_action || `Works biochemically in the body by interacting with physiological target receptors to normalize cellular and systemic function.`,
    common_side_effects: (matchedRule.common_side_effects || []).slice(0, 4).join(', ') || "Mild gastrointestinal discomfort, headache, or transient dizziness.",
    important_precautions: `Take strictly as directed. Inform doctor about any pre-existing kidney, liver, or heart conditions. Avoid alcohol while taking this medication.`,
    warning_signs_requiring_medical_attention: (matchedRule.serious_adverse_effects || []).slice(0, 3).join(', ') || "Difficulty breathing, swelling of face or throat, severe skin rash, or unusual bleeding.",
    what_to_discuss_with_doctor: `Discuss your complete list of current prescription and over-the-counter medicines, any known drug allergies, and planned duration of therapy.`
  };

  // Base English Monograph
  const monograph = {
    id: rawMed.id,
    name: rawMed.name || brandName,
    medicine_name: rawMed.name || brandName,
    brand_name: rawMed.brand_name || brandName,
    generic_name: rawMed.generic_name || genericName,
    brand_names: Array.isArray(rawMed.brand_names) && rawMed.brand_names.length > 0 ? rawMed.brand_names : [brandName],
    active_ingredients: rawMed.active_ingredients || (activeIngredients.length > 0 ? activeIngredients.join(', ') : genericName),
    category: rawMed.category || matchedRule.category || category || "General Pharmaceutical Products",
    therapeutic_category: rawMed.therapeutic_category || rawMed.category || matchedRule.category || category || "General Pharmaceutical Products",
    therapeutic_classification: rawMed.therapeutic_classification || matchedRule.drug_class || "Allopathic Clinical Formulation",
    drug_classification: rawMed.therapeutic_classification || matchedRule.drug_class || "Allopathic Clinical Formulation",
    manufacturer: rawMed.manufacturer || "Licensed Indian Pharmaceutical Manufacturer",
    available_strengths: matchedRule.available_strengths || [rawMed.strength || "Standard Strength"],
    dosage_forms: matchedRule.dosage_forms || [rawMed.formulation || "Tablet"],
    available_dosage_forms: matchedRule.dosage_forms || [rawMed.formulation || "Tablet"],
    route_of_administration: routeOfAdministration,
    
    // Clinical Info
    what_medicine_is_used_for: matchedRule.approved_indications?.join("; ") || "Information currently unavailable in clinical reference",
    common_medical_uses: matchedRule.approved_indications?.join("; ") || "Information currently unavailable in clinical reference",
    approved_indications: matchedRule.approved_indications || ["Information currently unavailable in clinical reference"],
    conditions_indicated: matchedRule.approved_indications || ["Information currently unavailable in clinical reference"],
    clinical_indications: matchedRule.approved_indications || ["Information currently unavailable in clinical reference"],
    indications: matchedRule.approved_indications || ["Information currently unavailable in clinical reference"],
    treats_nature: matchedRule.treats_nature || "Underlying Clinical Condition",
    how_the_medicine_works: matchedRule.mechanism_of_action || "Information currently unavailable in clinical reference",
    mechanism_of_action: matchedRule.mechanism_of_action || "Information currently unavailable in clinical reference",
    
    common_adverse_effects: matchedRule.common_side_effects || ["Information currently unavailable in clinical reference"],
    common_side_effects: matchedRule.common_side_effects || ["Information currently unavailable in clinical reference"],
    known_adverse_effects: (matchedRule.common_side_effects || []).join(', ') || "Information currently unavailable in clinical reference",
    serious_adverse_effects: matchedRule.serious_adverse_effects || ["Information currently unavailable in clinical reference"],
    important_warnings: matchedRule.serious_adverse_effects || ["Information currently unavailable in clinical reference"],
    contraindications: matchedRule.contraindications || ["Known hypersensitivity to active pharmaceutical ingredients"],
    clinical_precautions: clinicalPrecautionsList,
    precautions: clinicalPrecautions,
    pregnancy_precautions: matchedRule.pregnancy_precautions || "Information currently unavailable in clinical reference",
    breastfeeding_precautions: matchedRule.breastfeeding_precautions || "Information currently unavailable in clinical reference",
    age_related_precautions: matchedRule.age_precautions || "Information currently unavailable in clinical reference",
    
    significant_drug_interactions: matchedRule.drug_interactions || ["Information currently unavailable in clinical reference"],
    drug_interactions: matchedRule.drug_interactions || ["Information currently unavailable in clinical reference"],
    food_interactions: foodInstructions,
    food_instructions: foodInstructions,
    storage_instructions: storageInstructions,
    storage: storageInstructions,
    
    regulatory_schedule: regulatorySchedule,
    schedule: regulatorySchedule,
    prescription_classification: regulatorySchedule,
    prescription_required: Boolean(rawMed.prescription_required),
    
    general_approved_dosage: matchedRule.reference_dosage || "Information currently unavailable in clinical reference",
    reference_dosage: matchedRule.reference_dosage || "Information currently unavailable in clinical reference",
    administration_instructions: matchedRule.administration_instructions || "Follow physician instructions",
    
    price_inr: rawMed.price,
    pack_size: rawMed.pack_size || "Standard Packaging",
    generic_vs_brand_explanation: genericVsBrand,
    patient_explanation: patientExplanation,
    safety_information: safetyInformation,
    source: matchedRule.source || "Central Drugs Standard Control Organisation (CDSCO) / Indian Pharmacopoeia / WHO EML",
    medical_source: matchedRule.source || "CDSCO / Indian Pharmacopoeia / WHO EML",
    last_verification_date: "2026-Q1",
    disclaimer: MEDICAL_DISCLAIMER
  };

  // If a non-English language is requested, translate explanatory strings while preserving exact medicine names, numbers, and active ingredients
  if (targetLanguage && targetLanguage !== 'en') {
    return translateMedicineMonograph(monograph, targetLanguage);
  }

  return monograph;
}

/**
 * Multilingual Translation Engine for Medicine Monographs
 * Supports: ta (Tamil), hi (Hindi), te (Telugu), ml (Malayalam), kn (Kannada), bn (Bengali), mr (Marathi)
 * Preserves medicine names, active ingredients, numerical values, and reference ranges verbatim.
 */
export function translateMedicineMonograph(monograph, lang) {
  if (!lang || lang === 'en') {
    return monograph;
  }

  const brand = monograph.brand_name || monograph.name || 'Medicine';
  const generic = monograph.generic_name || brand;
  const category = monograph.category || 'Pharmaceuticals';

  const I18N = {
    ta: {
      genericVsBrand: `பொதுப் பெயர் (${generic}) என்பது சுகாதார அமைப்புகளால் (WHO / CDSCO) அங்கீகரிக்கப்பட்ட வேதியியல் மூலக்கூறு ஆகும். வர்த்தகப் பெயர் (${brand}) என்பது தயாரிப்பாளர் வழங்கும் பிராண்ட் பெயர் ஆகும். இரண்டுமே ஒரே செயலில் உள்ள மூலப்பொருளை (API) கொண்டுள்ளன மற்றும் சமமான செயல்திறன் கொண்டவை.`,
      safetyInfo: `சட்டபூர்வ மருத்துவ பாதுகாப்பு அறிவிப்பு: இந்த மருந்து சரிபார்க்கப்பட்ட தயாரிப்பு ஆகும். மருத்துவர் பரிந்துரைத்த அளவை கண்டிப்பாக பின்பற்றவும். தானாக உட்கொள்வதையோ அல்லது திடீரென நிறுத்துவதையோ தவிர்க்கவும். மூச்சுத் திணறல் அல்லது ஒவ்வாமை ஏற்பட்டால் உடனடியாக மருத்துவரை அணுகவும்.`,
      whatItDoes: `இது ${category} பிரிவைச் சேர்ந்த மருந்தாகும். மருத்துவரால் கண்டறியப்பட்ட நோயைக் குணப்படுத்த அல்லது கட்டுப்படுத்த உதவுகிறது.`,
      whyPrescribed: `மருத்துவ ரீதியாக அனுமதிக்கப்பட்ட பயன்பாடுகளுக்காக பரிந்துரைக்கப்படுகிறது.`,
      howItWorks: `உடலில் உள்ள நோய்க் காரணிகளை எதிர்த்து அல்லது உடல் செயல்பாடுகளை சமநிலைப்படுத்தி செயல்படுகிறது.`,
      precautions: `மருத்துவரின் அறிவுறுத்தலின்படி உட்கொள்ளவும். கல்லீரல், சிறுநீரகம் அல்லது இதய பிரச்சினைகள் இருந்தால் மருத்துவரிடம் முன்கூட்டியே தெரிவிக்கவும்.`,
      warningSigns: `மூச்சுத் திணறல், முகம் அல்லது தொண்டை வீக்கம், கடுமையான தோல் தடிப்பு அல்லது அசாதாரண ரத்தப்போக்கு.`,
      discussDoctor: `நீங்கள் உட்கொள்ளும் அனைத்து பிற மருந்துகள் மற்றும் ஒவ்வாமைகள் குறித்து உங்கள் மருத்துவரிடம் விவாதிக்கவும்.`,
      foodPrompt: monograph.food_instructions?.includes('empty') ? `காலை உணவுக்கு 30-60 நிமிடங்களுக்கு முன் வெறும் வயிற்றில் தண்ணீருடன் உட்கொள்ளவும்.` : `வயிற்று உபாதையைத் தவிர்க்க உணவுக்குப் பின் போதுமான தண்ணீருடன் உட்கொள்ளவும்.`,
      storage: `25°C-க்கு குறைவான வெப்பநிலையில், நேரடி சூரிய ஒளி மற்றும் ஈரப்பதம் படாதவாறு குளிர்ந்த, உலர்ந்த இடத்தில் வைக்கவும். குழந்தைகளுக்கு எட்டாதவாறு வைக்கவும்.`
    },
    hi: {
      genericVsBrand: `जेनेरिक नाम (${generic}) स्वास्थ्य प्राधिकरणों (WHO / CDSCO) द्वारा अनुमोदित मूल रासायनिक अणु है जो चिकित्सीय प्रभाव उत्पन्न करता है। ब्रांड नाम (${brand}) वह ट्रेडमार्क है जिसके तहत दवा बेची जाती है। दोनों में समान सक्रिय तत्व (API) होता है और दोनों समान रूप से प्रभावी हैं।`,
      safetyInfo: `वैधानिक चिकित्सकीय सुरक्षा सूचना: यह दवा एक प्रमाणित औषधीय उत्पाद है। डॉक्टर द्वारा निर्धारित खुराक का कड़ाई से पालन करें। बिना सलाह दवा न बदलें। सांस लेने में कठिनाई या चेहरे पर सूजन होने पर तुरंत आपातकालीन चिकित्सा सहायता लें।`,
      whatItDoes: `यह ${category} वर्ग की दवा है जो रोग के प्रबंधन एवं उपचार के लिए दी जाती है।`,
      whyPrescribed: `डॉक्टर द्वारा बीमारी के लक्षणों को नियंत्रित करने एवं स्वास्थ्य सुधार के लिए निर्धारित की जाती है।`,
      howItWorks: `यह शरीर में रोग उत्पन्न करने वाले कारकों को नियंत्रित कर और शारीरिक प्रक्रियाओं को संतुलित कर काम करती है।`,
      precautions: `दवा को हमेशा डॉक्टर के परामर्श अनुसार लें। किडनी, लिवर या हृदय संबंधी किसी भी समस्या की जानकारी पहले से डॉक्टर को दें।`,
      warningSigns: `सांस लेने में तकलीफ, चेहरे/गले पर सूजन, गंभीर त्वचा पर चकत्ते या असामान्य रक्तस्राव।`,
      discussDoctor: `अपनी वर्तमान दवाओं और किसी भी एलर्जी के बारे में अपने डॉक्टर या फार्मासिस्ट से चर्चा करें।`,
      foodPrompt: monograph.food_instructions?.includes('empty') ? `नाश्ते से 30 से 60 मिनट पहले खाली पेट पानी के साथ लें।` : `पेट की परेशानी से बचने के लिए भोजन के तुरंत बाद पर्याप्त पानी के साथ लें।`,
      storage: `25°C से कम तापमान पर, सीधी धूप और नमी से सुरक्षित ठंडी और सूखी जगह पर रखें। बच्चों की पहुंच से दूर रखें।`
    },
    te: {
      genericVsBrand: `జెనరిక్ పేరు (${generic}) అనేది ఆరోగ్య సంస్థలు (WHO / CDSCO) ఆమోదించిన రసాయన అణువు. బ్రాండ్ పేరు (${brand}) అనేది కంపెనీ మార్కెటింగ్ చేసే పేరు. రెండింటిలోనూ ఒకే క్రియాశీల పదార్థం (API) ఉంటుంది మరియు ఒకే విధమైన సామర్థ్యాన్ని కలిగి ఉంటాయి.`,
      safetyInfo: `వైద్య భద్రతా నోటీసు: డాక్టర్ సూచించిన మోతాదును ఖచ్చితంగా పాటించండి. స్వంతంగా మందులు వాడటం లేదా ఆపడం చేయవద్దు. శ్వాస తీసుకోవడంలో ఇబ్బంది లేదా వాపు కనిపిస్తే వెంటనే వైద్యుడిని సంప్రదించండి.`,
      whatItDoes: `ఇది ${category} రకానికి చెందిన ఔషధం. అనారోగ్యాన్ని నియంత్రించడానికి ఉపయోగపడుతుంది.`,
      whyPrescribed: `వైద్య నిపుణుల ద్వారా గుర్తించబడిన సమస్యల నివారణకు సిఫార్సు చేయబడింది.`,
      howItWorks: `శరీరంలోని లక్ష్య కణాలపై పనిచేసి రోగ లక్షణాలను అదుపు చేస్తుంది.`,
      precautions: `కిడ్నీ, లివర్ లేదా గుండె సమస్యలు ఉన్నట్లయితే ముందే డాక్టర్‌కు తెలియజేయండి.`,
      warningSigns: `శ్వాస ఆడకపోవడం, ముఖం లేదా గొంతు వాపు, తీవ్రమైన చర్మ దద్దుర్లు.`,
      discussDoctor: `మీరు వాడుతున్న ఇతర మందుల వివరాలను డాక్టర్‌తో చర్చించండి.`,
      foodPrompt: monograph.food_instructions?.includes('empty') ? `అల్పాహారానికి 30-60 నిమిషాల ముందు ఖాళీ కడుపుతో తీసుకోండి.` : `కడుపులో మంటను నివారించడానికి భోజనం తర్వాత నీటితో తీసుకోండి.`,
      storage: `25°C కంటే తక్కువ ఉష్ణోగ్రత వద్ద, ప్రత్యక్ష సూర్యకాంతి మరియు తేమ లేని చల్లని ప్రదేశంలో నిల్వ చేయండి.`
    },
    ml: {
      genericVsBrand: `ജനറിക് നാമം (${generic}) എന്നത് ആരോഗ്യ അധികാരികൾ (WHO / CDSCO) അംഗീകരിച്ച രാസ തന്മാത്രയാണ്. ബ്രാൻഡ് നാമം (${brand}) എന്നത് നിർമ്മാതാവിന്റെ വ്യാപാര നാമമാണ്. ഇവ രണ്ടും ഒരേ ചേരുവയും ഗുണനിലവാരവും ഉള്ളവയാണ്.`,
      safetyInfo: `നിയമാനുസൃത സുരക്ഷാ മുന്നറിയിപ്പ്: ഡോക്ടറുടെ നിർദ്ദേശപ്രകാരം മാത്രം മരുന്ന് കഴിക്കുക. സ്വന്തം നിലയ്ക്ക് മരുന്ന് മാറ്റുകയോ നിർത്തുകയോ ചെയ്യരുത്. ശ്വാസതടസ്സമോ അലർജിയോ ഉണ്ടായാൽ ഉടൻ അടിയന്തര ചികിത്സ തേടുക.`,
      whatItDoes: `ഇത് ${category} വിഭാഗത്തിൽപ്പെടുന്ന ഔഷധമാണ്. രോഗം സുഖപ്പെടുത്താനും നിയന്ത്രിക്കാനും സഹായിക്കുന്നു.`,
      whyPrescribed: `ഡോക്ടർ നിർദ്ദേശിച്ച രോഗാവസ്ഥകൾക്ക് ഫലപ്രദമായി ഉപയോഗിക്കുന്നു.`,
      howItWorks: `ശരീരത്തിലെ രോഗകാരണങ്ങളെ പ്രതിരോധിച്ച് ശരീര പ്രവർത്തനങ്ങൾ സാധാരണ നിലയിലാക്കുന്നു.`,
      precautions: `കരൾ, വൃക്ക, ഹൃദയ രോഗങ്ങൾ ഉള്ളവർ ഡോക്ടറോട് മുൻകൂട്ടി പറയുക.`,
      warningSigns: `ശ്വാസമെടുക്കാൻ ബുദ്ധിമുട്ട്, മുഖത്തോ തൊണ്ടയിലോ വീക്കം, കഠിനമായ ത്വക്ക് രോഗങ്ങൾ.`,
      discussDoctor: `നിങ്ങൾ കഴിക്കുന്ന മറ്റ് മരുന്നുകളെയും അലർജികളെയും കുറിച്ച് ഡോക്ടറോട് സംസാരിക്കുക.`,
      foodPrompt: monograph.food_instructions?.includes('empty') ? `ഭക്ഷണത്തിന് 30-60 മിനിറ്റ് മുമ്പ് വെറുംവയറ്റിൽ വെള്ളത്തോടൊപ്പം കഴിക്കുക.` : `ഭക്ഷണത്തിന് ശേഷം ആവശ്യത്തിന് വെള്ളത്തോടൊപ്പം കഴിക്കുക.`,
      storage: `25 ഡിഗ്രി സെൽഷ്യസിൽ താഴെയുള്ള തണുപ്പുള്ളതും ഉണങ്ങിയതുമായ സ്ഥലത്ത് സൂക്ഷിക്കുക.`
    },
    kn: {
      genericVsBrand: `ಜೆನೆರಿಕ್ ಹೆಸರು (${generic}) ಎಂಬುದು ಆರೋಗ್ಯ ಪ್ರಾಧಿಕಾರಗಳು ಅನುಮೋದಿಸಿದ ಅಧಿಕೃತ ರಾಸಾಯನಿಕ ಸೂತ್ರವಾಗಿದೆ. ಬ್ರ್ಯಾಂಡ್ ಹೆಸರು (${brand}) ಎಂದರೆ ಕಂಪನಿಯು ನೀಡುವ ವ್ಯಾಪಾರ ಹೆಸರು. ಎರಡರಲ್ಲೂ ಒಂದೇ ಸಕ್ರಿಯ ಅಂಶವಿರುತ್ತದೆ (API).`,
      safetyInfo: `ಕಾನೂನುಬದ್ಧ ವೈದ್ಯಕೀಯ ಸುರಕ್ಷತಾ ಸೂಚನೆ: ವೈದ್ಯರ ಸೂಚನೆಗಳನ್ನು ಕಟ್ಟುನಿಟ್ಟಾಗಿ ಪಾಲಿಸಿ. ಸ್ವಯಂ ಔಷಧಿ ಸೇವಿಸಬೇಡಿ ಅಥವಾ ತಕ್ಷಣ ನಿಲ್ಲಿಸಬೇಡಿ. ಉಸಿರಾಟದ ತೊಂದರೆ ಅಥವಾ ಅಲರ್ಜಿ ಕಂಡುಬಂದರೆ ತಕ್ಷಣ ವೈದ್ಯರನ್ನು ಭೇಟಿ ಮಾಡಿ.`,
      whatItDoes: `ಇದು ${category} ವಿಭಾಗದ ಔಷಧವಾಗಿದ್ದು, ರೋಗ ನಿಯಂತ್ರಣಕ್ಕೆ ಸಹಾಯಕವಾಗಿದೆ.`,
      whyPrescribed: `ವೈದ್ಯರ ಸಲಹೆಯಂತೆ ನಿರ್ದಿಷ್ಟ ಆರೋಗ್ಯ ಸಮಸ್ಯೆಗಳ ನಿವಾರಣೆಗೆ ಸೂಚಿಸಲಾಗಿದೆ.`,
      howItWorks: `ದೇಹದ ಅಂಗಾಂಶಗಳಲ್ಲಿ ಸೂಕ್ತ ರೀತಿಯಲ್ಲಿ ಕಾರ್ಯನಿರ್ವಹಿಸಿ ರೋಗವನ್ನು ಗುಣಪಡಿಸುತ್ತದೆ.`,
      precautions: `ಕಿಡ್ನಿ, ಲಿವರ್ ಅಥವಾ ಹೃದಯ ಸಂಬಂಧಿ ಕಾಯಿಲೆಗಳಿದ್ದರೆ ವೈದ್ಯರಿಗೆ ಮುಂಚಿತವಾಗಿ ತಿಳಿಸಿ.`,
      warningSigns: `ಉಸಿರಾಟದ ತೊಂದರೆ, ಮುಖ ಅಥವಾ ಗಂಟಲಿನ ಊತ, ತೀವ್ರ ಚರ್ಮದ ತುರಿಕೆ.`,
      discussDoctor: `ನೀವು ತೆಗೆದುಕೊಳ್ಳುತ್ತಿರುವ ಇತರೆ ಔಷಧಿಗಳ ಬಗ್ಗೆ ವೈದ್ಯರೊಂದಿಗೆ ಸಮಾಲೋಚಿಸಿ.`,
      foodPrompt: monograph.food_instructions?.includes('empty') ? `ಉಪಾಹಾರಕ್ಕೆ 30-60 ನಿಮಿಷಗಳ ಮೊದಲು ಖಾಲಿ ಹೊಟ್ಟೆಯಲ್ಲಿ ಸೇವಿಸಿ.` : `ಊಟದ ನಂತರ ಸಾಕಷ್ಟು ನೀರಿನೊಂದಿಗೆ ಸೇವಿಸಿ.`,
      storage: `25°C ಗಿಂತ ಕಡಿಮೆ ತಾಪಮಾನದಲ್ಲಿ ತಂಪಾದ, ಒಣ ಸ್ಥಳದಲ್ಲಿ ಇರಿಸಿ. ಮಕ್ಕಳಿಂದ ದೂರವಿಡಿ.`
    },
    bn: {
      genericVsBrand: `জেনেরিক নাম (${generic}) হলো স্বাস্থ্য কর্তৃপক্ষ (WHO / CDSCO) দ্বারা অনুমোদিত সক্রিয় রাসায়নিক উপাদান। ব্র্যান্ড নাম (${brand}) হলো প্রস্তুতকারকের ট্রেডমার্ক। উভয় ওষুধেই সমমানের সক্রিয় উপাদান থাকে এবং তাদের কার্যকারিতা সমান।`,
      safetyInfo: `সংবিধিবদ্ধ চিকিৎসা নিরাপত্তা বিজ্ঞপ্তি: ডাক্তারের পরামর্শ অনুযায়ী সঠিক মাত্রায় ওষুধ সেবন করুন। নিজে থেকে ওষুধ খাওয়া বন্ধ করবেন না। শ্বাসকষ্ট বা অ্যালার্জির লক্ষণ দেখা দিলে দ্রুত ডাক্তারের শরণাপন্ন হন।`,
      whatItDoes: `এটি ${category} বিভাগের একটি অনুমোদিত ওষুধ যা রোগ নিরাময় ও নিয়ন্ত্রণে ব্যবহৃত হয়।`,
      whyPrescribed: `চিকিৎসক কর্তৃক নির্দিষ্ট শারীরিক অসুস্থতার চিকিৎসায় নির্ধারিত।`,
      howItWorks: `দেহের রোগ প্রতিরোধ প্রক্রিয়াকে শক্তিশালী করে এবং ক্ষতিকারক কারণগুলোকে দূর করে কাজ করে।`,
      precautions: `লিভার, কিডনি বা হৃদরোগের পূর্ব ইতিহাস থাকলে ডাক্তারকে আগেই জানান।`,
      warningSigns: `শ্বাস নিতে কষ্ট, মুখ বা গলা ফুলে যাওয়া, ত্বকে মারাত্মক ফুসকুড়ি।`,
      discussDoctor: `আপনার বর্তমান সব ধরনের ওষুধ এবং অ্যালার্জির বিষয়ে ডাক্তারের সাথে কথা বলুন।`,
      foodPrompt: monograph.food_instructions?.includes('empty') ? `সকালের খাবারের ৩০-৬০ মিনিট আগে খালি পেটে পানির সাথে খান।` : `পেটের অস্বস্তি এড়াতে খাবারের পরে পর্যাপ্ত পানির সাথে খান।`,
      storage: `২৫ ডিগ্রি সেলসিয়াসের নিচে সরাসরি সূর্যালোক ও আর্দ্রতামুক্ত স্থানে রাখুন। শিশুদের নাগালের বাইরে রাখুন।`
    },
    mr: {
      genericVsBrand: `जेनेरिक नाव (${generic}) हे आरोग्य संस्थांनी (WHO / CDSCO) प्रमाणित केलेले मूळ रासायनिक घटक आहे. ब्रँड नाव (${brand}) हे उत्पादकाचे व्यावसायिक नाव आहे. दोन्हीमध्ये समान घटक (API) असून त्यांची गुणवत्ता व परिणामकारकता एकसारखीच असते.`,
      safetyInfo: `वैधानिक वैद्यकीय सुरक्षा सूचना: डॉक्टरांच्या सल्ल्यानुसारच योग्य डोस घ्या. स्वतःहून औषध घेणे किंवा थांबवणे टाळा. श्वास घेण्यास त्रास किंवा चेहऱ्यावर सूज आल्यास त्वरित वैद्यकीय मदत घ्या.`,
      whatItDoes: `हे ${category} गटातील औषध असून आजारावर नियंत्रण व उपचारासाठी वापरले जाते.`,
      whyPrescribed: `डॉक्टरांनी निदान केलेल्या वैद्यकीय स्थितीच्या उपचारासाठी लिहून दिले जाते.`,
      howItWorks: `शरीरातील लक्षित घटकांवर कार्य करून शारीरिक संतुलन पूर्ववत करते.`,
      precautions: `मूत्रपिंड, यकृत किंवा हृदयाचे विकार असल्यास डॉक्टरांना पूर्वकल्पना द्या.`,
      warningSigns: `श्वास घेण्यास अडचण, चेहरा किंवा घशावर सूज, त्वचेवर तीव्र पुरळ.`,
      discussDoctor: `सध्या चालू असलेल्या इतर सर्व औषधांची माहिती डॉक्टरांना द्या.`,
      foodPrompt: monograph.food_instructions?.includes('empty') ? `नाश्त्याच्या ३०-६० मिनिटे आधी रिकाम्या पोटी पाण्यासोबत घ्या.` : `पोटाचा त्रास टाळण्यासाठी जेवणानंतर भरपूर पाण्यासोबत घ्या.`,
      storage: `२५°C पेक्षा कमी तापमानावर थेट सूर्यप्रकाश आणि आर्द्रतेपासून दूर थंड ठिकाणी ठेवा.`
    }
  };

  const t = I18N[lang] || I18N.ta;

  return {
    ...monograph,
    selected_language: lang,
    generic_vs_brand_explanation: t.genericVsBrand,
    safety_information: t.safetyInfo,
    food_instructions: t.foodPrompt,
    food_interactions: t.foodPrompt,
    storage_instructions: t.storage,
    storage: t.storage,
    patient_explanation: {
      what_it_does: t.whatItDoes,
      why_prescribed: t.whyPrescribed,
      how_it_works_in_body: t.howItWorks,
      common_side_effects: monograph.patient_explanation.common_side_effects,
      important_precautions: t.precautions,
      warning_signs_requiring_medical_attention: t.warningSigns,
      what_to_discuss_with_doctor: t.discussDoctor
    }
  };
}
