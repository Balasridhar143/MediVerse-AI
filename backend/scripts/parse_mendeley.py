import re
import json

path = r"C:\Users\balas\.gemini\antigravity-ide\brain\9549741f-f962-4085-93d3-2002fb1fe5a1\.system_generated\steps\103\content.md"
with open(path, "r", encoding="utf-8", errors="ignore") as f:
    text = f.read()

# Look for json state or download links
urls = re.findall(r'https?://[^\s"\'<>]+', text)
print(f"Total URLs found: {len(urls)}")
for u in sorted(set(urls)):
    if any(k in u.lower() for k in ["download", "zip", "csv", "data.mendeley", "files"]):
        print("  -", u)

# Also check for embedded json blob
json_matches = re.findall(r'(\{"id":\s*"?xxkd3kjfdd.*?\}</script>)', text, re.DOTALL)
print(f"JSON matches: {len(json_matches)}")
if not json_matches:
    json_matches = re.findall(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', text, re.DOTALL)
    print(f"Next.js data matches: {len(json_matches)}")
    if json_matches:
        try:
            data = json.loads(json_matches[0])
            print("Next.js keys:", data.keys())
            # Find files
            files_blob = str(data)
            print("Contains files?:", "files" in files_blob.lower())
            # search for direct file download
            import re
            m = re.findall(r'"downloadUrl":\s*"([^"]+)"', files_blob)
            print("Download URLs:", m)
            file_names = re.findall(r'"name":\s*"([^"]+\.(?:csv|zip|xlsx|pdf))"', files_blob)
            print("File names:", file_names)
        except Exception as e:
            print("Error parsing next data:", e)
