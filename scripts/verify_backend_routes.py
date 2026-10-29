import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend"))
import main

print("=== VERIFYING FASTAPI ROUTES ===")
api_routes = []

def extract_routes(routes, prefix=""):
    extracted = []
    for r in routes:
        if hasattr(r, "original_router"):
            p = getattr(r.include_context, "prefix", "") if hasattr(r, "include_context") else ""
            extracted.extend(extract_routes(r.original_router.routes, prefix=prefix + p))
        elif hasattr(r, "path"):
            full_path = prefix + r.path
            methods = getattr(r, "methods", None)
            extracted.append((methods, full_path))
    return extracted

for methods, path in extract_routes(main.app.routes):
    if "/api" in path:
        api_routes.append(f"{sorted(list(methods)) if methods else 'ROUTE'} {path}")

for line in sorted(set(api_routes)):
    print(line)

print(f"\nTotal API routes successfully mounted: {len(set(api_routes))}")


