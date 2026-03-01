import os

filepath = r'd:\BoonraksaSystem\client\src\components\Order\OrderTechnicalSpecs.jsx'

with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Line 197 (0-indexed: 196) has garbled text after </div>, and line 198 has stale </button>
lines[196] = '            </div>\r\n'
del lines[197]

with open(filepath, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print('Fixed!')
