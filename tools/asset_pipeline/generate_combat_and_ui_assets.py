import os
from PIL import Image, ImageDraw, ImageFont

os.makedirs('assets/ui/damage', exist_ok=True)
os.makedirs('assets/ui/drops', exist_ok=True)
os.makedirs('assets/projectiles', exist_ok=True)

# 1. Generate Classic Maple Damage Numbers (0-9)
# Normal: Violet/Pink with thick outline
# Critical: Flaming Yellow/Orange/Red with thick outline (Matches Zakum reference #3!)

def create_damage_digit(char, is_crit=False):
    w, h = (36, 44) if is_crit else (28, 36)
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(im)
    
    # Try using Impact or Arial Black or default
    font_size = 32 if is_crit else 24
    font = None
    for font_name in ["impact.ttf", "ariblk.ttf", "arialbd.ttf", "Arial Black.ttf"]:
        try:
            font = ImageFont.truetype(font_name, font_size)
            break
        except Exception:
            pass
    if font is None:
        font = ImageFont.load_default()
        
    bbox = draw.textbbox((0, 0), char, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = (w - tw) // 2
    y = (h - th) // 2 - 2

    # Draw thick dark outline (8 directions)
    outline_color = (120, 25, 10, 255) if is_crit else (50, 15, 90, 255)
    outline_width = 3 if is_crit else 2
    for ox in range(-outline_width, outline_width + 1):
        for oy in range(-outline_width, outline_width + 1):
            if ox*ox + oy*oy <= outline_width*outline_width:
                draw.text((x + ox, y + oy), char, font=font, fill=outline_color)

    # Base mask for gradient fill
    mask = Image.new('L', (w, h), 0)
    mdraw = ImageDraw.Draw(mask)
    mdraw.text((x, y), char, font=font, fill=255)
    
    # Create gradient fill
    grad = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(grad)
    for gy in range(h):
        t = gy / max(1, h - 1)
        if is_crit:
            # Yellow (#fff568) -> Orange (#ff8a00) -> Red (#d61500)
            if t < 0.4:
                r = 255
                g = int(245 - t/0.4 * 105)
                b = int(104 - t/0.4 * 104)
            else:
                tt = (t - 0.4) / 0.6
                r = int(255 - tt * 41)
                g = int(140 - tt * 119)
                b = 0
            gdraw.line([(0, gy), (w, gy)], fill=(r, g, b, 255))
        else:
            # White (#ffffff) -> Pink (#ff7ae3) -> Purple (#9c1fd1)
            if t < 0.4:
                r = 255
                g = int(255 - t/0.4 * 133)
                b = int(255 - t/0.4 * 28)
            else:
                tt = (t - 0.4) / 0.6
                r = int(255 - tt * 99)
                g = int(122 - tt * 91)
                b = int(227 - tt * 18)
            gdraw.line([(0, gy), (w, gy)], fill=(r, g, b, 255))

    im.paste(grad, (0, 0), mask)
    return im

for d in "0123456789":
    create_damage_digit(d, False).save(f'assets/ui/damage/normal_{d}.png')
    create_damage_digit(d, True).save(f'assets/ui/damage/crit_{d}.png')

# Critical burst star
star_im = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
sdraw = ImageDraw.Draw(star_im)
sdraw.polygon([(16, 0), (20, 11), (31, 11), (22, 18), (26, 30), (16, 22), (6, 30), (10, 18), (1, 11), (12, 11)], fill=(255, 230, 0, 255), outline=(150, 40, 0, 255))
star_im.save('assets/ui/damage/crit_star.png')

# MISS sprite
miss_im = Image.new('RGBA', (64, 28), (0, 0, 0, 0))
mdraw = ImageDraw.Draw(miss_im)
# Purple block 3D MISS text
for ox in range(-2, 3):
    for oy in range(-2, 3):
        mdraw.text((6 + ox, 4 + oy), "MISS", fill=(30, 10, 60, 255))
mdraw.text((6, 4), "MISS", fill=(190, 140, 255, 255))
miss_im.save('assets/ui/damage/miss.png')

# 2. Projectiles: Arrow, Shuriken, Energy Bolt
# Arrow
arrow = Image.new('RGBA', (32, 12), (0, 0, 0, 0))
adraw = ImageDraw.Draw(arrow)
# Shaft
adraw.line([(4, 6), (28, 6)], fill=(139, 69, 19, 255), width=2)
# Arrowhead
adraw.polygon([(26, 2), (31, 6), (26, 10)], fill=(192, 192, 192, 255), outline=(50, 50, 50, 255))
# Fletching
adraw.polygon([(4, 3), (8, 6), (4, 9), (1, 6)], fill=(255, 255, 255, 255), outline=(100, 100, 100, 255))
arrow.save('assets/projectiles/arrow.png')

# Shuriken (Ilbi / Subi 4-point throwing star)
shuriken = Image.new('RGBA', (20, 20), (0, 0, 0, 0))
sdraw = ImageDraw.Draw(shuriken)
sdraw.polygon([(10, 0), (13, 7), (20, 10), (13, 13), (10, 20), (7, 13), (0, 10), (7, 7)], fill=(210, 215, 220, 255), outline=(30, 35, 40, 255))
sdraw.ellipse([(8, 8), (12, 12)], fill=(20, 20, 25, 255))
shuriken.save('assets/projectiles/shuriken.png')

# Energy Bolt (Magic sphere with core)
ebolt = Image.new('RGBA', (24, 24), (0, 0, 0, 0))
edraw = ImageDraw.Draw(ebolt)
edraw.ellipse([(1, 1), (22, 22)], fill=(168, 85, 247, 180), outline=(236, 72, 153, 255))
edraw.ellipse([(4, 4), (19, 19)], fill=(216, 180, 254, 230))
edraw.ellipse([(7, 7), (16, 16)], fill=(255, 255, 255, 255))
ebolt.save('assets/projectiles/energy_bolt.png')

# 3. Meso Drops (Bronze coin, Silver coin, Gold coin pile, Money bag)
# Bronze coin (10 mesos)
b_coin = Image.new('RGBA', (16, 16), (0, 0, 0, 0))
bdraw = ImageDraw.Draw(b_coin)
bdraw.ellipse([(1, 1), (14, 14)], fill=(195, 110, 45, 255), outline=(75, 30, 10, 255), width=1)
bdraw.ellipse([(4, 4), (11, 11)], fill=(230, 150, 75, 255))
b_coin.save('assets/ui/drops/meso_bronze.png')

# Silver coin (50 mesos)
s_coin = Image.new('RGBA', (18, 18), (0, 0, 0, 0))
sdraw = ImageDraw.Draw(s_coin)
sdraw.ellipse([(1, 1), (16, 16)], fill=(185, 195, 205, 255), outline=(50, 60, 70, 255), width=1)
sdraw.ellipse([(4, 4), (13, 13)], fill=(235, 240, 250, 255))
s_coin.save('assets/ui/drops/meso_silver.png')

# Gold coin pile (100+ mesos)
g_coins = Image.new('RGBA', (22, 18), (0, 0, 0, 0))
gdraw = ImageDraw.Draw(g_coins)
# Back coin
gdraw.ellipse([(1, 5), (14, 16)], fill=(210, 155, 20, 255), outline=(75, 45, 5, 255))
# Right coin
gdraw.ellipse([(8, 4), (20, 15)], fill=(240, 185, 30, 255), outline=(75, 45, 5, 255))
# Front coin
gdraw.ellipse([(4, 1), (17, 12)], fill=(255, 225, 70, 255), outline=(75, 45, 5, 255))
g_coins.save('assets/ui/drops/meso_gold.png')

# Fat Money bag (1000+ mesos)
m_bag = Image.new('RGBA', (24, 24), (0, 0, 0, 0))
mdraw = ImageDraw.Draw(m_bag)
# Bag body
mdraw.ellipse([(2, 7), (21, 22)], fill=(215, 170, 85, 255), outline=(80, 50, 15, 255), width=2)
# Neck tie
mdraw.line([(7, 8), (17, 8)], fill=(180, 30, 30, 255), width=2)
# Pouch top
mdraw.polygon([(7, 7), (12, 2), (17, 7)], fill=(230, 190, 110, 255), outline=(80, 50, 15, 255))
# $ mark on belly
mdraw.text((9, 9), "$", fill=(80, 50, 15, 255))
m_bag.save('assets/ui/drops/meso_bag.png')

print("All combat, damage digits, projectiles, and drop assets successfully created!")
