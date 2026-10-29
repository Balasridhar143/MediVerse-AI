import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend"))
import main

print("=== VERIFYING FASTAPI ROUTES ===")
api_routes = []
for r in main.app.routes:
    path = getattr(r, "path", None)
    methods = getattr(r, "methods", None)
    if path and "/api" in path:
        api_routes.append(f"{list(methods) if methods else 'ROUTE'} {path}")

for line in sorted(api_routes):
    print(line)

print(f"\nTotal API routes successfully mounted: {len(api_routes)}")

