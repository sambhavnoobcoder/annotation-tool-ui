import requests
import json

url = "https://devb2cdatamanagement.bytelearn.ai/cache/set"

payload = json.dumps({
  "key": "unique-key",
  "data": {
    "id": "",
    "image_url": "",
    "annotation_file_url": "",
    "tags": [],
    "annotator-name": ""
  },
  "source": "object_detection_annotations"
})
headers = {
  'Ignore-Auth': 'true',
  'Content-Type': 'application/json'
}

response = requests.request("POST", url, headers=headers, data=payload)

print(response.text)