import json

nic_path = r"C:\Users\balas\OneDrive\Desktop\SEM PROJECT\data\raw\hospitals\public_health_facilities_nic.geojson"
osm_path = r"C:\Users\balas\OneDrive\Desktop\SEM PROJECT\data\raw\hospitals\hotosm_ind_health_facilities_osm_geojson\health_facilities.geojson"

with open(nic_path, 'r', encoding='utf-8') as f:
    for line in f:
        if '"properties"' in line:
            print("NIC sample properties snippet:", line[:300])
            break

with open(osm_path, 'r', encoding='utf-8') as f:
    for line in f:
        if '"type": "Feature"' in line or '"Feature"' in line:
            print("OSM sample feature snippet:", line[:400])
            break
