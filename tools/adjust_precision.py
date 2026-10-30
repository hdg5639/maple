with open('js/map_data.js', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('"targetX": 280,\n            "targetY": 890.5396825396825', '"targetX": 280,\n            "targetY": 889.05')
text = text.replace('"targetX": 360,\n            "targetY": 4487.547169811321', '"targetX": 360,\n            "targetY": 4481.19')
text = text.replace('"targetX": 2440,\n            "targetY": 4435.72', '"targetX": 2440,\n            "targetY": 4411.74')

with open('js/map_data.js', 'w', encoding='utf-8') as f:
    f.write(text)

print('Adjusted precision targetY coordinates.')
