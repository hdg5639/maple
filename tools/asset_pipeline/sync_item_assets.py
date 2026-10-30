# tools/asset_pipeline/sync_item_assets.py
"""
Scrapes and synchronizes authentic classic MapleStory item assets (PNG pixel icons)
directly from official WZ archives via maplestory.io.
"""

import os
import urllib.request
import time
import json

OUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'assets', 'items'))
os.makedirs(OUT_DIR, exist_ok=True)

HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

ITEM_ID_MAPPING = {
    # 1. Potions & Consumables
    'red_potion': 2000000,
    'orange_potion': 2000001,
    'white_potion': 2000002,
    'blue_potion': 2000003,
    'elixir': 2000004,
    'power_elixir': 2000005,
    'mana_elixir': 2000006,
    'town_scroll': 2030000,

    # 2. Classic Enhancement Scrolls
    'scroll_atk_100': 2044000,
    'scroll_atk_60': 2044001,
    'scroll_atk_10': 2044002,
    'scroll_def_100': 2040000,
    'scroll_glove_atk_60': 2040801,
    'scroll_shoe_speed_60': 2040701,
    'scroll_cursed_atk_70': 2044005,
    'scroll_cursed_atk_30': 2044004,
    'scroll_chaos_60': 2049000,
    'scroll_clean_slate_10': 2049100,

    # 3. Swords
    'wp_wood_sword': 1302000,
    'wp_two_handed_sword': 1402001,
    'wp_highlander': 1402005,
    'wp_zwei_hander': 1402006,
    'wp_gryunhill': 1402014,
    'wp_spatha': 1402029,
    'wp_dragon_claymore': 1402037,

    # 4. Daggers
    'wp_beginner_dagger': 1332007,
    'wp_fruit_dagger': 1332002,
    'wp_taeguk_fan': 1332025,
    'wp_geta': 1332014,
    'wp_kandine': 1332027,
    'wp_blood_dagger': 1332034,
    'wp_dragon_toenail': 1332055,

    # 5. Claws
    'wp_garnier': 1472000,
    'wp_meba': 1472005,
    'wp_scorp': 1472023,
    'wp_slain': 1472026,
    'wp_kandeo': 1472032,
    'wp_cobra_steer': 1472048,
    'wp_dragon_sleve': 1472055,

    # 6. Bows
    'wp_hunter_bow': 1452000,
    'wp_battle_bow': 1452002,
    'wp_ryden': 1452005,
    'wp_red_viper': 1452009,
    'wp_metus': 1452019,
    'wp_golden_hingel': 1452021,
    'wp_dragon_shinebow': 1452045,

    # 7. Wands & Staffs
    'wp_wood_wand': 1372005,
    'wp_fairy_wand': 1372000,
    'wp_wizard_wand': 1372002,
    'wp_thorns': 1372010,
    'wp_evil_wings': 1382009,
    'wp_caig': 1382016,
    'wp_dragon_wand': 1382039,

    # 8. Helmets
    'helm_brown_bamboo': 1002067,
    'helm_bone_helm': 1002357,
    'helm_maple_hat': 1002419,
    'helm_zakum': 1002430,
    'zakum_helm': 1002430,

    # 9. Overalls / Tops / Bottoms
    'top_blue_tunic': 1040002,
    'bot_jean_pants': 1060002,
    'ov_bone_armor': 1050018,
    'ov_sauna_robe': 1050037,
    'ov_dark_pirate': 1050062,
    'ov_dragon_robe': 1050092,

    # 10. Gloves
    'glv_work_glove': 1082002,
    'glv_leather_glove': 1082005,
    'glv_dark_cleave': 1082085,
    'glv_dragon_glove': 1082149,

    # 11. Shoes
    'sho_leather_boots': 1072001,
    'sho_snow_shoes': 1072037,
    'sho_wing_boots': 1072153,
    'sho_dragon_boots': 1072238,

    # 12. Capes
    'cape_ragged': 1102041,
    'cape_icarus': 1102042,
    'cape_goblin': 1102043,

    # 13. Shields
    'shd_pan_lid': 1092008,
    'pan_lid': 1092008,
    'shd_wood_tower': 1092014,
    'shd_maple_shield': 1092030,

    # 14. Monster Drops & Etc Items
    'snail_shell': 4000000,
    'blue_snail_shell': 4000001,
    'red_snail_shell': 4000002,
    'slime_liquid': 4000004,
    'mushroom_cap': 4000007,
    'orange_mushroom_cap': 4000008,
    'horny_mushroom_cap': 4000009,
    'zombie_mushroom_charm': 4000010,
    'ribbon': 4000018,
    'pig_ribbon': 4000018,
    'wild_boar_tooth': 4000020,
    'fire_boar_tooth': 4000021,
    'octopus_leg': 4000024,
    'curse_eye_tail': 4000043,
    'jr_wraith_cloth': 4000052,
    'coolie_zombie_tooth': 4000073,
    'death_teddy_soul': 4000156,
    'king_slime_crown': 4001017,
    'fire_eye': 4001013,
    'horntail_scale': 4001083,
    'boss_coin': 4000038,

    # 15. Coordi & Visual Items
    'hat_transparent': 1002140,
    'hat_crown': 1002444,
    'hat_bandana': 1002000,
    'face_blush': 1012055,
    'face_leaf': 1012057,
    'eye_sunglasses': 1022047,
    'eye_star_patch': 1022026,
    'clothes_hoodie': 1040010,
    'clothes_royal': 1050012,
    'clothes_school': 1050045,
    'cape_angel_wings': 1102049,
    'cape_balrog_wings': 1102048,
    'ws_transparent': 1702000,
    'ws_rose': 1702001,
    'ws_flame_katana': 1702002
}

def download_item_icon(item_id, target_path):
    versions = ['GMS/62', 'GMS/83', 'KMS/65']
    for ver in versions:
        url = f"https://maplestory.io/api/{ver}/item/{item_id}/icon"
        try:
            req = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(req, timeout=8) as resp:
                data = resp.read()
                if len(data) > 100:
                    with open(target_path, 'wb') as f:
                        f.write(data)
                    return True
        except Exception:
            continue
    return False

def sync_all_items():
    print(f"=== Scraping & Synchronizing {len(ITEM_ID_MAPPING)} Authentic Classic MapleStory Item Assets ===")
    success_count = 0
    fail_count = 0

    for item_key, maple_id in ITEM_ID_MAPPING.items():
        out_file = os.path.join(OUT_DIR, f"{item_key}.png")
        if os.path.exists(out_file) and os.path.getsize(out_file) > 100:
            print(f"[EXISTS] {item_key}.png (Maple ID: {maple_id})")
            success_count += 1
            continue

        ok = download_item_icon(maple_id, out_file)
        if ok:
            sz = os.path.getsize(out_file)
            print(f"[DOWNLOADED] {item_key}.png (Maple ID: {maple_id}, {sz} bytes)")
            success_count += 1
        else:
            print(f"[FAILED] {item_key} (Maple ID: {maple_id})")
            fail_count += 1

        time.sleep(0.05)

    print(f"\n=== Sync Complete! Succeeded: {success_count}, Failed: {fail_count} ===")

if __name__ == '__main__':
    sync_all_items()
