# MediVerse AI — Clinical Laboratory Datasets Manifest & Documentation

This directory manages genuine, documented clinical and laboratory datasets for AI/ML experimentation and laboratory analysis.

## Dataset Investigation & Status Matrix

| Dataset | Primary Source | Access Model | Verification Status | Usage in MediVerse |
| :--- | :--- | :--- | :--- | :--- |
| **LabQAR** | [GitHub: balubhasuran/LabQAR](https://github.com/balubhasuran/LabQAR) | Public (Open Source, CC-BY 4.0 / MIT) | Verified Public Repository | Laboratory Question Answering & Reference Ranges |
| **MCMED** | [GitHub: dkimlab/MCMED](https://github.com/dkimlab/MCMED) | Public Research Repo | Verified Research Repo | Multi-Center Medical Laboratory Standards |
| **MCLD** | [Mendeley Data: xxkd3kjfdd/1](https://data.mendeley.com/datasets/xxkd3kjfdd/1) | Direct Download via Mendeley | Public with Citation | Multi-Center Clinical Chemistry Records |
| **MIMIC-IV** | [PhysioNet / MIT: mimic.mit.edu](https://mimic.mit.edu/docs/iv/) | Credentialed (CITI Training & DUA required) | Restricted Access (Not public direct download) | Manual download instructions provided below |

## Manual Download Instructions for Restricted/External Datasets

### 1. Multi-Center Clinical Laboratory Dataset (MCLD)
- **URL**: https://data.mendeley.com/datasets/xxkd3kjfdd/1
- **File**: Download the primary ZIP or CSV tables and place into `data/raw/mcld/`.
- **License**: Creative Commons Attribution 4.0 International (CC BY 4.0).

### 2. LabQAR (Laboratory Question Answering and Reference Ranges)
- **URL**: https://raw.githubusercontent.com/balubhasuran/LabQAR/master/data/
- **Script**: The automated script `backend/scripts/prepare_dataset.py` fetches the public LabQAR files into `data/raw/labqar/` when internet is available.

### 3. MIMIC-IV Clinical Database
- **URL**: https://physionet.org/content/mimiciv/
- **Requirements**: Completion of "Data or Specimens Only Research" CITI training and signed Data Use Agreement on PhysioNet. Do not attempt unauthenticated automated downloads. Place verified de-identified CSV extracts (e.g. `labevents.csv.gz`) into `data/raw/mimiciv/`.

## Directory Layout
```
data/
├── README.md               # Dataset manifest and licensing details
├── raw/                    # Untouched, original downloaded datasets
│   ├── labqar/
│   └── mcld/
└── processed/              # Cleaned, standardized datasets for ML experiments
    └── lab_experiments.csv
```
