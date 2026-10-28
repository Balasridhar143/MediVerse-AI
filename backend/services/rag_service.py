import os
from typing import List, Dict, Any
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Curated, appropriately licensed evidence-based clinical documents
MEDICAL_KNOWLEDGE_BASE = [
    {
        "id": "doc_htn_01",
        "title": "AHA/ACC Clinical Guidelines: Blood Pressure Classifications & Hypertension",
        "source": "American Heart Association / American College of Cardiology Practice Guidelines",
        "text": (
            "Normal adult blood pressure is defined as systolic < 120 mm Hg and diastolic < 80 mm Hg. "
            "Elevated blood pressure is categorized as systolic 120-129 mm Hg and diastolic < 80 mm Hg. "
            "Stage 1 Hypertension corresponds to systolic 130-139 mm Hg or diastolic 80-89 mm Hg. "
            "Stage 2 Hypertension corresponds to systolic >= 140 mm Hg or diastolic >= 90 mm Hg. "
            "Hypertensive crisis is defined as systolic > 180 mm Hg and/or diastolic > 120 mm Hg, requiring immediate clinical evaluation. "
            "Lifestyle interventions include dietary sodium restriction, weight optimization, aerobic exercise, and DASH dietary pattern."
        )
    },
    {
        "id": "doc_dm_02",
        "title": "ADA Standards of Care: Diabetes Screening & Glycated Hemoglobin (HbA1c)",
        "source": "American Diabetes Association (ADA) Standards of Care in Diabetes",
        "text": (
            "Screening for diabetes should be performed using fasting plasma glucose (FPG), HbA1c, or 2-hour 75g oral glucose tolerance test. "
            "Normoglycemia is defined as FPG < 100 mg/dL (5.6 mmol/L) or HbA1c < 5.7% (39 mmol/mol). "
            "Prediabetes is defined as FPG 100-125 mg/dL (impaired fasting glucose) or HbA1c 5.7%-6.4% (39-47 mmol/mol). "
            "Diabetes mellitus is diagnosed when HbA1c >= 6.5% (48 mmol/mol), FPG >= 126 mg/dL (7.0 mmol/L), or random plasma glucose >= 200 mg/dL with classic hyperglycemic symptoms. "
            "In the absence of unequivocal hyperglycemia, results require repeat confirmation."
        )
    },
    {
        "id": "doc_cbc_03",
        "title": "Complete Blood Count & Leukocytosis Diagnostic Pathways",
        "source": "International Council for Standardization in Haematology (ICSH)",
        "text": (
            "The adult reference range for total white blood cell (WBC) count is typically 4,000 to 11,000 cells/cumm (4.0-11.0 x 10^9/L). "
            "Leukocytosis is defined as an elevated total leukocyte count exceeding 11,000 cells/cumm. "
            "Common etiologies of neutrophilic leukocytosis include bacterial infections, physiological stress, acute tissue necrosis, and corticosteroid therapy. "
            "Leukopenia is defined as WBC < 4,000 cells/cumm, frequently observed in acute viral infections, autoimmune conditions, or medication-induced myelosuppression. "
            "Differential leukocyte analysis is essential to identify neutrophil, lymphocyte, monocyte, eosinophil, or basophil predominance."
        )
    },
    {
        "id": "doc_renal_04",
        "title": "KDIGO Practice Guidelines: Renal Function & Serum Creatinine Assessment",
        "source": "Kidney Disease: Improving Global Outcomes (KDIGO) Clinical Practice Guidelines",
        "text": (
            "Serum creatinine is an end-product of muscle catabolism eliminated predominantly by glomerular filtration. "
            "Typical adult reference intervals are 0.74-1.35 mg/dL in males and 0.59-1.04 mg/dL in females, reflecting baseline muscle mass. "
            "Acute Kidney Injury (AKI) is diagnosed by an increase in serum creatinine by >= 0.3 mg/dL within 48 hours or an increase to >= 1.5 times baseline within 7 days. "
            "Chronic Kidney Disease (CKD) is characterized by persistent abnormalities in kidney structure or function (eGFR < 60 mL/min/1.73 m2 or albuminuria >= 30 mg/24 hours) for > 3 months."
        )
    },
    {
        "id": "doc_lipid_05",
        "title": "NCEP ATP III Guidelines: Lipid Profile & Atherosclerotic Cardiovascular Risk",
        "source": "National Cholesterol Education Program Adult Treatment Panel III",
        "text": (
            "Total cholesterol levels are classified as desirable (< 200 mg/dL), borderline high (200-239 mg/dL), and high (>= 240 mg/dL). "
            "Low-density lipoprotein (LDL) cholesterol is the primary atherogenic lipoprotein target: optimal is < 100 mg/dL, near optimal 100-129 mg/dL, borderline high 130-159 mg/dL, and high 160-189 mg/dL. "
            "High-density lipoprotein (HDL) cholesterol is protective: < 40 mg/dL is considered low/undesirable, whereas >= 60 mg/dL is considered high and protective. "
            "Triglyceride levels are normal at < 150 mg/dL, borderline 150-199 mg/dL, and elevated at >= 200 mg/dL."
        )
    },
    {
        "id": "doc_lft_06",
        "title": "AASLD Guidelines: Liver Function Tests & Bilirubin Pathophysiology",
        "source": "American Association for the Study of Liver Diseases Practice Guidelines",
        "text": (
            "Total serum bilirubin encompasses unconjugated (indirect) and conjugated (direct) fractions. "
            "Normal total bilirubin in adults is 0.2 to 1.2 mg/dL. Jaundice becomes clinically apparent when serum bilirubin exceeds 2.5-3.0 mg/dL. "
            "Unconjugated hyperbilirubinemia points toward hemolytic states, impaired hepatic uptake, or congenital conjugation deficiencies such as Gilbert syndrome. "
            "Conjugated hyperbilirubinemia reflects hepatocellular injury, intrahepatic cholestasis, or extrahepatic biliary duct obstruction. "
            "Enzymatic correlation with ALT, AST, Alkaline Phosphatase (ALP), and GGT is mandatory."
        )
    }
]

class MedicalRAGService:
    def __init__(self):
        self.documents = MEDICAL_KNOWLEDGE_BASE
        self.vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))
        corpus = [f"{doc['title']} {doc['text']}" for doc in self.documents]
        self.doc_vectors = self.vectorizer.fit_transform(corpus)

    def retrieve(self, query: str, top_k: int = 2) -> List[Dict[str, Any]]:
        """Performs cosine similarity search over indexed clinical documents."""
        query_vec = self.vectorizer.transform([query])
        scores = cosine_similarity(query_vec, self.doc_vectors).flatten()
        
        # Rank by score descending
        ranked_indices = scores.argsort()[::-1][:top_k]
        
        results = []
        for idx in ranked_indices:
            score = float(scores[idx])
            if score > 0.05:  # Relevance threshold
                doc = self.documents[idx]
                results.append({
                    "title": doc["title"],
                    "source": doc["source"],
                    "excerpt": doc["text"],
                    "score": round(score, 4)
                })
        return results

    def answer_query(self, query: str, top_k: int = 2) -> Dict[str, Any]:
        """
        Retrieves grounded evidence and synthesizes transparent clinical response.
        If external LLM is not configured, provides explicitly attributed evidence synthesis.
        """
        retrieved_excerpts = self.retrieve(query, top_k=top_k)
        
        if not retrieved_excerpts:
            return {
                "query": query,
                "answer": (
                    "Available evidence in the local verified clinical reference database is insufficient to answer this query safely. "
                    "No relevant clinical practice guidelines matched the query terms. Please consult a qualified healthcare provider."
                ),
                "sources": [],
                "evidence_grounded": False,
                "disclaimer": "AI Decision Support: No diagnostic confirmation. Consult a medical professional."
            }

        # Check if an external LLM API key is present
        api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("OPENAI_API_KEY")
        if api_key and os.environ.get("GEMINI_API_KEY"):
            try:
                # Grounded generation using Google GenAI SDK if key is valid
                from google import genai
                client = genai.Client(api_key=api_key)
                context_str = "\n\n".join([f"[{e['source']}]: {e['excerpt']}" for e in retrieved_excerpts])
                prompt = (
                    f"You are a medical decision support assistant. Rely EXCLUSIVELY on the verified clinical evidence below. "
                    f"Do NOT invent clinical facts or fabricate diagnoses.\n\n"
                    f"CLINICAL EVIDENCE:\n{context_str}\n\n"
                    f"QUESTION: {query}\n\n"
                    f"Provide an evidence-grounded, clear explanation citing the sources."
                )
                response = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt
                )
                return {
                    "query": query,
                    "answer": response.text,
                    "sources": retrieved_excerpts,
                    "evidence_grounded": True,
                    "disclaimer": "Retrieved from clinical practice guidelines. For clinical decision-support only."
                }
            except Exception:
                pass  # Fall back to evidence-grounded synthesis below

        # Evidence-grounded synthesis fallback
        lead_source = retrieved_excerpts[0]
        synthesis = (
            f"Based on retrieved clinical evidence from '{lead_source['source']}':\n\n"
            f"{lead_source['excerpt']}\n\n"
            f"Source Attribution: {lead_source['title']} ({lead_source['source']})."
        )
        if len(retrieved_excerpts) > 1:
            second_source = retrieved_excerpts[1]
            synthesis += f"\n\nAdditional clinical correlation from '{second_source['title']}':\n{second_source['excerpt'][:200]}..."

        return {
            "query": query,
            "answer": synthesis,
            "sources": retrieved_excerpts,
            "evidence_grounded": True,
            "disclaimer": "AI Decision Support: Derived directly from verified clinical literature. Educational and decision-support only."
        }

rag_service = MedicalRAGService()
