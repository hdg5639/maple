import subprocess
import asyncio
import websockets
import urllib.request
import json
import base64
import os

async def main():
    chrome_path = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
    os.makedirs('captures', exist_ok=True)
    
    # Let's search Google Images for classic MapleStory Henesys
    search_queries = [
        ("henesys_hunting_ground_1", "https://www.google.com/search?tbm=isch&q=%EB%A9%94%EC%9D%B4%ED%94%8C%EC%8A%A4%ED%86%A0%EB%A6%AC+%ED%97%A4%EB%84%A4%EC%8B%9C%EC%8A%A4+%EC%82%AC%EB%3%A5%ED%84%B0+1+%EC%8A%A4%ED%81%AC%EB%A6%B0%EC%83%B7"),
        ("classic_maple_ui", "https://www.google.com/search?tbm=isch&q=%EB%B9%85%EB%B1%85%EC%A0%84+%EB%A9%94%EC%9D%B4%ED%94%8C%EC%8A%A4%ED%86%A0%EB%A6%AC+%EC%9D%B8%EA%B2%8C%EC%9E%84+%EC%8A%A4%ED%81%AC%EB%A6%B0%EC%83%B7"),
        ("classic_monsters", "https://www.google.com/search?tbm=isch&q=%EB%A9%94%EC%9D%B4%ED%94%8C%EC%8A%A4%ED%86%A0%EB%A6%AC+%EC%A3%BC%ED%99%A9%EB%B2%84%EC%84%AF+%EC%8A%AC%EB%9D%BC%EC%9E%84+%EB%A8%B8%EC%89%AC%EB%87%98+%EB%8F%84%ED%8A%B8"),
        ("namu_henesys", "https://namu.wiki/w/%ED%97%A4%EB%84%A4%EC%8B%9C%EC%8A%A4/%EB%B9%85%EB%B1%85%20%EC%9D%B4%EC%A0%84")
    ]

    for name, target_url in search_queries:
        print(f"Loading {name}: {target_url[:60]}...")
        proc = subprocess.Popen([
            chrome_path,
            '--headless=new',
            '--remote-debugging-port=9223',
            '--window-size=1280,1024',
            '--disable-gpu',
            '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            target_url
        ])

        await asyncio.sleep(3.5)

        try:
            req = urllib.request.urlopen('http://localhost:9223/json')
            tabs = json.loads(req.read())
            target_tab = tabs[0]
            ws_url = target_tab['webSocketDebuggerUrl']

            async with websockets.connect(ws_url) as ws:
                await ws.send(json.dumps({'id': 1, 'method': 'Page.enable'}))
                await ws.send(json.dumps({'id': 2, 'method': 'Runtime.enable'}))
                
                # Wait for content to render
                await asyncio.sleep(2)

                # Capture full screenshot
                await ws.send(json.dumps({'id': 3, 'method': 'Page.captureScreenshot'}))
                while True:
                    resp = json.loads(await ws.recv())
                    if resp.get('id') == 3:
                        data = base64.b64decode(resp['result']['data'])
                        filepath = os.path.join('captures', f'{name}.png')
                        with open(filepath, 'wb') as f:
                            f.write(data)
                        print(f"Saved screenshot: {filepath} ({len(data)} bytes)")
                        break

                # Extract direct image urls from DOM
                await ws.send(json.dumps({
                    'id': 4,
                    'method': 'Runtime.evaluate',
                    'params': {
                        'expression': "Array.from(document.querySelectorAll('img')).map(i => i.src).filter(s => s && s.startsWith('http'))",
                        'returnByValue': True
                    }
                }))
                while True:
                    resp = json.loads(await ws.recv())
                    if resp.get('id') == 4:
                        img_urls = resp.get('result', {}).get('result', {}).get('value', [])
                        print(f"Found {len(img_urls)} direct images in page.")
                        # Save first few images
                        for i, iurl in enumerate(img_urls[:5]):
                            try:
                                ireq = urllib.request.Request(iurl, headers={'User-Agent': 'Mozilla/5.0'})
                                with urllib.request.urlopen(ireq, timeout=4) as iresp:
                                    idata = iresp.read()
                                    if len(idata) > 5000:
                                        ifpath = os.path.join('captures', f'{name}_img_{i+1}.png')
                                        with open(ifpath, 'wb') as f:
                                            f.write(idata)
                                        print(f"Saved sub-image: {ifpath} ({len(idata)} bytes)")
                            except Exception:
                                pass
                        break
        except Exception as e:
            print(f"Error processing {name}: {e}")
        finally:
            proc.terminate()
            await asyncio.sleep(1)

if __name__ == '__main__':
    asyncio.run(main())
