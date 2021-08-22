# SPDX-FileCopyrightText: 2021 codedust
#
# SPDX-License-Identifier: EUPL-1.2

from pyquery import PyQuery as pq
import requests

download_location = 'web/leika.csv'
fimportal_catalog_url = 'https://fimportal.de/kataloge'
fimportal_base_url = 'https://fimportal.de'

# get csv download link
d = pq(url=fimportal_catalog_url)
download_elements = d('.Leistungen a.download-link')
download_links = list(map(lambda x: d(x).attr('href'), download_elements))
csv_links = list(filter(lambda x: x.endswith('.csv'), download_links))
assert len(csv_links) == 1

# download csv
assert csv_links[0].startswith('/') # relative url
url = fimportal_base_url + csv_links[0]

print(f"Downloading from {url}")
r = requests.get(url)
r.encoding = 'ISO-8859-1'

print(f"Writing to {download_location}")
with open(download_location, 'wb') as file:
    file.write(bytes(r.text, 'UTF-8'))
