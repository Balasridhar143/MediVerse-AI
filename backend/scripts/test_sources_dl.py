import urllib.request

urls = [
    ("WHO Health Indicators IND", "https://data.humdata.org/dataset/f2c18cd9-d24c-4213-9095-1dd971c118e2/resource/f9244c30-81e8-4ba0-87cb-9bd5be6d699d/download/health_indicators_ind.csv"),
    ("World Bank Health IND", "https://data.humdata.org/dataset/75e5f354-5b70-4fd1-b51b-d06b7ccc099d/resource/fc32e686-760e-48b1-8580-12710ba49097/download/health_ind.csv"),
    ("DHS Subnational IND", "https://data.humdata.org/dataset/4fac924f-9f4b-4017-9c80-011e9dcfd09e/resource/939c9236-3c47-48ec-8474-7e9b02c703a5/download/dhs-quickstats_subnational_ind.csv"),
    ("Indian Medicine Dataset", "https://raw.githubusercontent.com/junioralive/Indian-Medicine-Dataset/main/indian_medicine_data.csv"),
    ("ICD10 Terminology", "https://huggingface.co/datasets/awacke1/ICD10-Clinical-Terminology/raw/main/ICD10.csv"),
    ("MedQuAD Knowledge", "https://raw.githubusercontent.com/abachaa/MedQuAD/master/1_CancerGov_QA/0000001.xml")
]

for name, u in urls:
    try:
        req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=15) as resp:
            print(f"[{name}] SUCCESS: Length = {resp.headers.get('Content-Length')} bytes, Type = {resp.headers.get('Content-Type')}")
    except Exception as e:
        print(f"[{name}] FAIL: {e}")
