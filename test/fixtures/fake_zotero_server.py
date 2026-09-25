"""Start the fake Zotero 10 local API from zotero-local-mcp's tests, with sample items.
Prints the API URL on the first line. GET /__state returns the items as JSON."""
import json
import sys
import time

sys.path.insert(0, sys.argv[1])  # zotero-local-mcp/tests
from fake_zotero import FakeZotero  # noqa: E402

fake = FakeZotero()
fake.add_item(key="AAAA2222", title="Spirometry reference values in adults",
              creators=[{"creatorType": "author", "firstName": "Tiago", "lastName": "Jacinto"}],
              date="2026", abstractNote="GLI equations.", dateAdded="2024-01-01T00:00:00Z")
fake.add_item(key="BBBB3333", title="Asthma control in primary care",
              creators=[{"creatorType": "author", "lastName": "Silva"}], date="2025",
              tags=[{"tag": "status/read"}], dateAdded="2024-02-01T00:00:00Z")

orig = fake.handle


def handle(method, url, headers, body):
    if url.endswith("/__state"):
        return 200, {"Content-Type": "application/json"}, json.dumps(fake.items).encode()
    return orig(method, url, headers, body)


fake.handle = handle
srv, url = fake.serve()
print(url, flush=True)
while True:
    time.sleep(3600)
