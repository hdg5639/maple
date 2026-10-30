# verify_item_assets_e2e.py
import subprocess
import urllib.request
import json
import asyncio
import websockets
import sys
import tempfile

async def run_verification():
    chrome_path = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
    target_url = 'http://localhost:8000/'
    profile_dir = tempfile.TemporaryDirectory(prefix='maple-item-asset-qa-', ignore_cleanup_errors=True)

    proc = subprocess.Popen([
        chrome_path,
        '--headless=new',
        '--remote-debugging-port=9222',
        f'--user-data-dir={profile_dir.name}',
        '--window-size=1280,800',
        '--disable-gpu',
        target_url
    ])

    await asyncio.sleep(2.5)

    try:
        req = urllib.request.urlopen('http://localhost:9222/json')
        tabs = json.loads(req.read())
        target_tab = next((t for t in tabs if '8000' in t.get('url', '')), None)
        if not target_tab:
            raise RuntimeError("Target tab not found on port 9222!")

        ws_url = target_tab['webSocketDebuggerUrl']
        async with websockets.connect(ws_url) as ws:
            await ws.send(json.dumps({'id': 1, 'method': 'Runtime.enable'}))
            await ws.send(json.dumps({'id': 2, 'method': 'Network.enable'}))

            msg_id = 10
            errors = []
            net_404s = []

            async def eval_js(expr):
                nonlocal msg_id
                msg_id += 1
                curr_id = msg_id
                await ws.send(json.dumps({
                    'id': curr_id,
                    'method': 'Runtime.evaluate',
                    'params': {'expression': expr, 'returnByValue': True}
                }))
                while True:
                    resp = json.loads(await ws.recv())
                    if resp.get('method') == 'Runtime.exceptionThrown':
                        errors.append(resp['params'])
                    elif resp.get('method') == 'Network.responseReceived':
                        res = resp.get('params', {}).get('response', {})
                        st = res.get('status', 200)
                        if st >= 400:
                            net_404s.append((st, res.get('url', '')))
                    elif resp.get('id') == curr_id:
                        res = resp.get('result', {})
                        if 'exceptionDetails' in res:
                            print(f"[JS EXCEPTION] {res['exceptionDetails']}")
                        return res.get('result', {}).get('value')

            # Wait for game initialization
            for _ in range(100):
                if await eval_js("Boolean(window.game && window.game.player && window.game.ui)"):
                    break
                await asyncio.sleep(0.1)
            else:
                raise RuntimeError("Game initialization timed out!")

            print("[1] Verifying Inventory Icons across tabs...")
            inv_test = await eval_js("""(() => {
                const ui = window.game.ui;
                const p = window.game.player;
                ui.toggleWindow('win-inventory');

                const tabs = ['equip', 'use', 'setup', 'etc'];
                const tabResults = {};

                for (const tab of tabs) {
                    ui.renderInventoryTab(tab);
                    const slots = document.querySelectorAll('#inven-grid .inven-slot');
                    const imgSlots = [];
                    const emojiSlots = [];
                    slots.forEach((slot, idx) => {
                        const img = slot.querySelector('img.item-icon-img');
                        const iconSpan = slot.querySelector('.slot-icon');
                        if (img) {
                            imgSlots.push({
                                src: img.getAttribute('src'),
                                naturalWidth: img.naturalWidth,
                                naturalHeight: img.naturalHeight,
                                complete: img.complete
                            });
                        } else if (iconSpan && iconSpan.textContent.trim() && !slot.classList.contains('empty')) {
                            emojiSlots.push(iconSpan.textContent.trim());
                        }
                    });
                    tabResults[tab] = {
                        totalSlots: slots.length,
                        imgCount: imgSlots.length,
                        emojiCount: emojiSlots.length,
                        firstThreeImages: imgSlots.slice(0, 3)
                    };
                }
                ui.toggleWindow('win-inventory');
                return tabResults;
            })()""")
            print(f"Inventory Test Result: {json.dumps(inv_test, indent=2, ensure_ascii=False)}")
            assert inv_test['equip']['imgCount'] > 0, "No item icon images found in Equip tab!"
            assert inv_test['use']['imgCount'] > 0, "No item icon images found in Use tab!"
            assert inv_test['equip']['emojiCount'] == 0, f"Found fallback emojis in Equip tab: {inv_test['equip']}"
            assert inv_test['use']['emojiCount'] == 0, f"Found fallback emojis in Use tab: {inv_test['use']}"

            print("[2] Verifying Shop Buy & Sell List Item Icons...")
            shop_test = await eval_js("""(() => {
                const ui = window.game.ui;
                ui.showShopModal();

                // Buy List
                const buyImgs = Array.from(document.querySelectorAll('#shop-buy-list .shop-item-row img.shop-item-icon-img')).map(img => ({
                    src: img.getAttribute('src'),
                    complete: img.complete,
                    width: img.naturalWidth,
                    height: img.naturalHeight
                }));

                // Sell list
                const sellImgs = Array.from(document.querySelectorAll('#shop-sell-list .shop-item-row img.shop-item-icon-img')).map(img => ({
                    src: img.getAttribute('src'),
                    complete: img.complete,
                    width: img.naturalWidth,
                    height: img.naturalHeight
                }));

                const modal = document.getElementById('modal-maple-shop');
                if (modal) modal.style.display = 'none';

                return {
                    buyImgsCount: buyImgs.length,
                    sellImgsCount: sellImgs.length,
                    sampleBuy: buyImgs.slice(0, 3),
                    sampleSell: sellImgs.slice(0, 3)
                };
            })()""")
            print(f"Shop Test Result: {json.dumps(shop_test, indent=2, ensure_ascii=False)}")
            assert shop_test['buyImgsCount'] > 0, "No shop item icons in Buy list!"
            assert shop_test['sellImgsCount'] > 0, "No shop item icons in Sell list!"

            print("[3] Verifying Armory & Throwing Star Icons...")
            armory_test = await eval_js("""(() => {
                const ui = window.game.ui;
                ui.toggleWindow('win-armory');
                ui.renderArmoryWindow('swords');

                const armoryImgs = Array.from(document.querySelectorAll('#armory-grid-container img')).map(img => ({
                    src: img.getAttribute('src'),
                    complete: img.complete,
                    width: img.naturalWidth,
                    height: img.naturalHeight
                }));

                ui.toggleWindow('win-armory');
                return {
                    armoryImgsCount: armoryImgs.length,
                    sample: armoryImgs.slice(0, 3)
                };
            })()""")
            print(f"Armory Test Result: {json.dumps(armory_test, indent=2, ensure_ascii=False)}")
            assert armory_test['armoryImgsCount'] > 0, "No armory item icons rendered!"

            print("[4] Verifying Dropped Item Sprites on Map...")
            drop_test = await eval_js("""(() => {
                const g = window.game;
                g.spawnDrop('scroll_gloves_atk_60', 1, 500, 1300, '장갑 공격력 주문서 60%');
                g.spawnDrop('red_potion', 1, 520, 1300, '빨간 포션');
                g.spawnDrop('snail_shell', 1, 540, 1300, '달팽이의 껍질');

                const dropsData = g.drops.map(d => {
                    const sprite = window.sprites.getItemDropSprite(d.type);
                    return {
                        id: d.id,
                        type: d.type,
                        name: d.name,
                        hasSprite: Boolean(sprite && sprite.src)
                    };
                });

                return dropsData;
            })()""")
            print(f"Drop Test Result: {json.dumps(drop_test, indent=2, ensure_ascii=False)}")
            assert len(drop_test) >= 3, "Failed to spawn test drops!"
            assert all(d['hasSprite'] for d in drop_test), "Drop sprite missing for some drops!"

            # Give a small pause to let all image loads complete and catch any 404s
            await asyncio.sleep(1.0)

            print(f"\n[5] Zero Defect Verification:")
            print(f"  Console Exceptions: {len(errors)}")
            print(f"  Network 404s: {len(net_404s)}")
            if net_404s:
                print(f"  404 details: {net_404s}")
            assert len(errors) == 0, f"Detected {len(errors)} console errors!"
            assert len(net_404s) == 0, f"Detected {len(net_404s)} 404 network errors!"

            print("\n========================================================")
            print("  ALL ITEM ASSET INTEGRATION TESTS PASSED 100%!")
            print("========================================================")

    finally:
        try:
            proc.terminate()
            proc.wait(timeout=5)
        except Exception:
            proc.kill()
        profile_dir.cleanup()

if __name__ == '__main__':
    asyncio.run(run_verification())
