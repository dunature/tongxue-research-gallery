"""Usage: python3 evidence/verify-public-assets.py https://your-site.onrender.com"""
import concurrent.futures
import hashlib
import json
from pathlib import Path
import sys
import urllib.request

root = Path(__file__).resolve().parent.parent
base = sys.argv[1].rstrip('/')
assets = json.loads((root / 'asset-manifest.json').read_text())

def check(row):
    request = urllib.request.Request(base + '/' + row['path'] + '?v=research-1', headers={
        'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8'})
    with urllib.request.urlopen(request, timeout=90) as response:
        body = response.read()
        result = {'path': row['path'], 'bytes': len(body),
                  'sha256': hashlib.sha256(body).hexdigest(),
                  'contentType': response.headers.get('Content-Type'),
                  'cacheControl': response.headers.get('Cache-Control', '')}
    result['passed'] = (result['sha256'] == row['sha256']
                        and result['contentType'] == 'image/png'
                        and 'no-transform' in result['cacheControl'])
    return result

report = {'url': base, 'assets': [], 'passed': False}
output = root / 'evidence/public-assets.json'
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    for row in pool.map(check, assets):
        report['assets'].append(row)
        output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
        print(row['path'], row['passed'], flush=True)
report['passed'] = len(report['assets']) == 80 and all(row['passed'] for row in report['assets'])
output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
assert report['passed'], 'At least one public PNG differs from its original or lacks no-transform'
