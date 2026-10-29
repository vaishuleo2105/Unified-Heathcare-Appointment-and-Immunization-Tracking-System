import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('target_doc_paragraphs.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print(f"Total paragraphs in json: {len(data)}")

check_indices = [
    41, 42, 43, 44,       # Synopsis
    73, 75, 76, 77, 78, 79, 81, 85, 87, 88, 90, 92, # Ch 1
    99, 101, 102, 103, 113, 115, 116, # Ch 2
    150, 152, 158, 164, 168, 193, 203, 213, 232, # Ch 3
    235, 237, 241, 244, 245, 247, 248, 249, 253, # Ch 4
    277, 279, 281, 293, 295, 298, 314, 315, 317, 319,
    331, 333, 335, 336, 347, 348, 349, 350, 351, 353, 357,
    370, 372, 377, 380, 391, 393, 395, 407, 409, 411,
    426, 428, 430, 442, 444, 446, 468, 470, 472, 475,
    501, 503, 504, 507, 509, 511, 513, 515, 517, # Ch 5
    524, 526, 527, 528, 529, 530 # Ch 6
]

for idx in check_indices:
    if idx < len(data):
        item = data[idx]
        text_preview = item['text'][:60].replace('\n', ' ')
        print(f"P{idx}: {text_preview}")
