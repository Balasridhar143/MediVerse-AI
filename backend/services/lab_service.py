from typing import Dict, Any, Optional

# Verified reference database based on standard clinical pathology reference manuals
# (e.g. Tietz Textbook of Clinical Chemistry and Molecular Diagnostics)
REFERENCE_DATA = {
    "Hemoglobin": {
        "male": {"low": 13.8, "high": 17.2, "unit": "g/dL"},
        "female": {"low": 12.1, "high": 15.1, "unit": "g/dL"},
        "default": {"low": 12.0, "high": 17.0, "unit": "g/dL"},
        "source": "WHO Clinical Guidelines & Tietz Textbook of Clinical Chemistry",
        "description": "Hemoglobin is the oxygen-carrying protein in red blood cells.",
        "low_meaning": "Lower levels may indicate anemia, iron deficiency, or nutritional factors.",
        "high_meaning": "Elevated levels can be associated with dehydration, smoking, or chronic lung conditions."
    },
    "Fasting Blood Sugar": {
        "default": {"low": 70.0, "high": 99.0, "unit": "mg/dL"},
        "source": "American Diabetes Association (ADA) Clinical Guidelines",
        "description": "Measures glucose concentration in the blood after an overnight fast (minimum 8 hours).",
        "low_meaning": "Hypoglycemia (low blood sugar), which can cause shakiness, sweating, or dizziness.",
        "high_meaning": "Impaired fasting glucose or hyperglycemia. Levels 100-125 mg/dL reflect prediabetes; 126+ mg/dL warrants clinical evaluation."
    },
    "Post Prandial Blood Sugar": {
        "default": {"low": 70.0, "high": 140.0, "unit": "mg/dL"},
        "source": "American Diabetes Association (ADA) 2024 Standards of Care",
        "description": "Measures blood glucose concentration 2 hours following a meal.",
        "low_meaning": "Reactive hypoglycemia or excessive diabetic medication dosage.",
        "high_meaning": "Postprandial hyperglycemia. Readings between 140-199 mg/dL indicate impaired glucose tolerance."
    },
    "HbA1c": {
        "default": {"low": 4.0, "high": 5.6, "unit": "%"},
        "source": "National Glycohemoglobin Standardization Program (NGSP)",
        "description": "Reflects the average blood glucose concentration over the preceding 2 to 3 months.",
        "low_meaning": "Low glycated hemoglobin, commonly seen in hemolytic conditions or pregnancy.",
        "high_meaning": "5.7% to 6.4% indicates prediabetes; 6.5% or higher on repeat testing indicates diabetes."
    },
    "Total White Blood Cells (WBC)": {
        "default": {"low": 4000.0, "high": 11000.0, "unit": "cells/cumm"},
        "source": "Hematology Reference Standards (ICSH)",
        "description": "Key component of the immune system responsible for fighting infection.",
        "low_meaning": "Leukopenia, which can stem from viral infections, medications, or bone marrow conditions.",
        "high_meaning": "Leukocytosis, frequently observed in bacterial infections, physiological stress, or acute inflammation."
    },
    "Platelet Count": {
        "default": {"low": 1.5, "high": 4.5, "unit": "lakhs/cumm"},
        "source": "Clinical Laboratory Improvement Amendments (CLIA)",
        "description": "Cell fragments vital for normal blood clotting and vessel repair.",
        "low_meaning": "Thrombocytopenia, which may increase susceptibility to bleeding or bruising.",
        "high_meaning": "Thrombocytosis, which can occur reactively during acute phase responses or chronic inflammation."
    },
    "Serum Creatinine": {
        "male": {"low": 0.74, "high": 1.35, "unit": "mg/dL"},
        "female": {"low": 0.59, "high": 1.04, "unit": "mg/dL"},
        "default": {"low": 0.6, "high": 1.2, "unit": "mg/dL"},
        "source": "KDIGO Clinical Practice Guideline for Acute Kidney Injury",
        "description": "Byproduct of muscle metabolism filtered out of the blood almost entirely by the kidneys.",
        "low_meaning": "Reduced muscle mass or decreased protein intake; generally benign.",
        "high_meaning": "Decreased glomerular filtration rate or impaired renal function requiring clinical correlation."
    },
    "Total Cholesterol": {
        "default": {"low": 125.0, "high": 200.0, "unit": "mg/dL"},
        "source": "National Cholesterol Education Program (NCEP) ATP III",
        "description": "Composite measure of circulating lipids including LDL, HDL, and VLDL.",
        "low_meaning": "Severe malnutrition, malabsorption, or hyperthyroidism.",
        "high_meaning": "Hypercholesterolemia, an established risk factor in atherosclerotic cardiovascular disease."
    },
    "Blood Urea Nitrogen (BUN)": {
        "default": {"low": 7.0, "high": 20.0, "unit": "mg/dL"},
        "source": "National Kidney Foundation (NKF)",
        "description": "Waste product created when the liver breaks down proteins.",
        "low_meaning": "Low protein diet, overhydration, or liver disease.",
        "high_meaning": "Dehydration, high protein catabolism, or reduced renal excretion."
    },
    "Serum Bilirubin Total": {
        "default": {"low": 0.2, "high": 1.2, "unit": "mg/dL"},
        "source": "American Association for the Study of Liver Diseases (AASLD)",
        "description": "Yellowish pigment made during the normal breakdown of red blood cells.",
        "low_meaning": "Generally has no clinical significance.",
        "high_meaning": "Hyperbilirubinemia, which can manifest as jaundice, reflecting hepatobiliary or hemolytic disorders."
    }
}

def interpret_lab_result(
    test_name: str,
    value: float,
    unit: str,
    gender: Optional[str] = None
) -> Dict[str, Any]:
    """
    Transparently evaluates a laboratory value against clinical reference intervals.
    Never fabricates a diagnosis. Provides honest status and educational context.
    """
    matched_entry = None
    matched_key = None
    for k, v in REFERENCE_DATA.items():
        if k.lower() in test_name.lower() or test_name.lower() in k.lower():
            matched_entry = v
            matched_key = k
            break

    if not matched_entry:
        return {
            "test_name": test_name,
            "value": value,
            "unit": unit,
            "reference_range": "Unavailable for this parameter",
            "flag": "Uncertain",
            "interpretation": f"Reference interval for '{test_name}' is not established in the verified local directory. Clinical review with an attending physician is recommended.",
            "clinical_source": "Laboratory Specific / Pending Pathologist Verification",
            "disclaimer": "This analysis is for educational and clinical decision-support purposes only. It is not a diagnostic confirmation."
        }

    # Select demographic specific range if available
    norm_gender = (gender or "").lower()
    if norm_gender in ["male", "m"] and "male" in matched_entry:
        ref = matched_entry["male"]
    elif norm_gender in ["female", "f"] and "female" in matched_entry:
        ref = matched_entry["female"]
    else:
        ref = matched_entry["default"]

    low = ref["low"]
    high = ref["high"]
    ref_unit = ref["unit"]
    ref_range_str = f"{low} - {high} {ref_unit}"

    # Categorize
    if value < low:
        flag = "Low"
        detail = matched_entry.get("low_meaning", "Result is below the lower reference boundary.")
    elif value > high:
        flag = "High"
        detail = matched_entry.get("high_meaning", "Result is above the upper reference boundary.")
    else:
        flag = "Within Range"
        detail = "Value falls within established reference limits for healthy adults."

    interpretation = (
        f"{matched_entry.get('description', '')} Your result ({value} {unit}) is categorized as '{flag}'. "
        f"{detail} Individual clinical interpretation should always account for patient symptoms, medications, and clinical history."
    )

    return {
        "test_name": matched_key,
        "value": value,
        "unit": unit,
        "reference_range": ref_range_str,
        "flag": flag,
        "interpretation": interpretation,
        "clinical_source": matched_entry.get("source", "Clinical Pathology Reference Standard"),
        "disclaimer": "Educational and clinical decision-support only. Not a medical diagnosis."
    }
