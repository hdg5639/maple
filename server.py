# server.py - Integrated LAN Web & Real-Time Multiplayer WebSocket Server for OpenMaple Classic
import http.server
import socketserver
import socket
import webbrowser
import os
import sys
import json
import sqlite3
import hashlib
import asyncio
import threading
import websockets

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

HTTP_PORT = 8000
WS_PORT = 8001
DIRECTORY = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(DIRECTORY, "openmaple.db")

# ==============================================================================
# 1. SQLite Database Initialization & Account Management
# ==============================================================================
def init_db():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute('''
        CREATE TABLE IF NOT EXISTS accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    cur.execute('''
        CREATE TABLE IF NOT EXISTS characters (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            account_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            job TEXT DEFAULT '초보자',
            level INTEGER DEFAULT 1,
            exp INTEGER DEFAULT 0,
            hp INTEGER DEFAULT 100,
            max_hp INTEGER DEFAULT 100,
            mp INTEGER DEFAULT 50,
            max_mp INTEGER DEFAULT 50,
            str INTEGER DEFAULT 12,
            dex INTEGER DEFAULT 10,
            int_stat INTEGER DEFAULT 8,
            luk INTEGER DEFAULT 8,
            ap INTEGER DEFAULT 0,
            sp INTEGER DEFAULT 0,
            fame INTEGER DEFAULT 0,
            meso INTEGER DEFAULT 500,
            current_map TEXT DEFAULT 'henesys_hhg',
            x REAL DEFAULT 1050.0,
            y REAL DEFAULT 1320.0,
            inventory TEXT DEFAULT '{}',
            skills TEXT DEFAULT '{}',
            quickslots TEXT DEFAULT '[]',
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(account_id) REFERENCES accounts(id)
        )
    ''')
    conn.commit()
    conn.close()

def hash_pw(pw: str) -> str:
    return hashlib.sha256(pw.encode('utf-8')).hexdigest()

def db_register_user(username, password):
    try:
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        p_hash = hash_pw(password)
        cur.execute("INSERT INTO accounts (username, password_hash) VALUES (?, ?)", (username, p_hash))
        acc_id = cur.lastrowid
        # Create default starting character
        cur.execute('''
            INSERT INTO characters (account_id, name, job, level, exp, hp, max_hp, mp, max_mp, meso, current_map, x, y)
            VALUES (?, ?, '초보자', 1, 0, 100, 100, 50, 50, 1000, 'henesys_hhg', 1050.0, 1320.0)
        ''', (acc_id, username))
        conn.commit()
        conn.close()
        return True, "회원가입이 완료되었습니다!"
    except sqlite3.IntegrityError:
        return False, "이미 존재하는 아이디입니다."
    except Exception as e:
        return False, f"등록 오류: {str(e)}"

def db_login_user(username, password):
    try:
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        p_hash = hash_pw(password)
        cur.execute("SELECT id FROM accounts WHERE username = ? AND password_hash = ?", (username, p_hash))
        row = cur.fetchone()
        if not row:
            conn.close()
            return False, "아이디 또는 비밀번호가 일치하지 않습니다.", None

        acc_id = row[0]
        cur.execute("SELECT * FROM characters WHERE account_id = ?", (acc_id,))
        char_row = cur.fetchone()
        conn.close()

        if not char_row:
            return False, "캐릭터 정보를 찾을 수 없습니다.", None

        char_data = {
            "accountId": acc_id,
            "charId": char_row[0],
            "name": char_row[2],
            "job": char_row[3],
            "level": char_row[4],
            "exp": char_row[5],
            "hp": char_row[6],
            "maxHp": char_row[7],
            "mp": char_row[8],
            "maxMp": char_row[9],
            "str": char_row[10],
            "dex": char_row[11],
            "int": char_row[12],
            "luk": char_row[13],
            "ap": char_row[14],
            "sp": char_row[15],
            "fame": char_row[16],
            "meso": char_row[17],
            "currentMap": char_row[18],
            "x": char_row[19],
            "y": char_row[20],
            "inventory": json.loads(char_row[21]) if char_row[21] else {},
            "skills": json.loads(char_row[22]) if char_row[22] else {},
            "quickslots": json.loads(char_row[23]) if char_row[23] else []
        }
        return True, "로그인 성공!", char_data
    except Exception as e:
        return False, f"로그인 오류: {str(e)}", None

def db_save_character(char_data):
    try:
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute('''
            UPDATE characters SET
                level = ?, exp = ?, hp = ?, max_hp = ?, mp = ?, max_mp = ?,
                str = ?, dex = ?, int_stat = ?, luk = ?, ap = ?, sp = ?, fame = ?, meso = ?,
                current_map = ?, x = ?, y = ?,
                inventory = ?, skills = ?, quickslots = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (
            char_data.get('level', 1),
            char_data.get('exp', 0),
            char_data.get('hp', 100),
            char_data.get('maxHp', 100),
            char_data.get('mp', 50),
            char_data.get('maxMp', 50),
            char_data.get('str', 12),
            char_data.get('dex', 10),
            char_data.get('int', 8),
            char_data.get('luk', 8),
            char_data.get('ap', 0),
            char_data.get('sp', 0),
            char_data.get('fame', 0),
            char_data.get('meso', 0),
            char_data.get('currentMap', 'henesys_hhg'),
            char_data.get('x', 1050.0),
            char_data.get('y', 1320.0),
            json.dumps(char_data.get('inventory', {})),
            json.dumps(char_data.get('skills', {})),
            json.dumps(char_data.get('quickslots', [])),
            char_data.get('charId')
        ))
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        sys.stderr.write(f"[DB SAVE ERROR] {e}\n")
        return False

def db_update_fame(target_name):
    try:
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute("UPDATE characters SET fame = fame + 1 WHERE name = ?", (target_name,))
        cur.execute("SELECT fame FROM characters WHERE name = ?", (target_name,))
        row = cur.fetchone()
        conn.commit()
        conn.close()
        return row[0] if row else None
    except Exception:
        return None

# ==============================================================================
# 2. LAN IP Discovery
# ==============================================================================
def get_lan_ips():
    ips = []
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        primary = s.getsockname()[0]
        s.close()
        if primary and not primary.startswith('127.'):
            ips.append(primary)
    except Exception:
        pass

    try:
        host = socket.gethostname()
        for ip in socket.gethostbyname_ex(host)[2]:
            if not ip.startswith('127.') and ip not in ips:
                ips.append(ip)
    except Exception:
        pass

    return ips

# ==============================================================================
# 3. HTTP Server (Static Files)
# ==============================================================================
class ThreadingHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    request_queue_size = 128

class NoCacheHTTPHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

    def log_message(self, format, *args):
        # Mute normal static file GET logs to keep terminal clean
        pass

# ==============================================================================
# 4. Real-Time Multiplayer WebSocket Game Server
# ==============================================================================
class MultiplayerServer:
    def __init__(self):
        # socket -> player_session
        self.clients = {}
        # player_id -> socket
        self.player_sockets = {}

    async def broadcast_to_map(self, map_key, message, exclude_sock=None):
        raw = json.dumps(message)
        dead = []
        for sock, p in self.clients.items():
            if sock != exclude_sock and p.get('currentMap') == map_key:
                try:
                    await sock.send(raw)
                except Exception:
                    dead.append(sock)
        for d in dead:
            self.remove_client(d)

    async def broadcast_global(self, message, exclude_sock=None):
        raw = json.dumps(message)
        dead = []
        for sock in list(self.clients.keys()):
            if sock != exclude_sock:
                try:
                    await sock.send(raw)
                except Exception:
                    dead.append(sock)
        for d in dead:
            self.remove_client(d)

    def remove_client(self, websocket):
        p = self.clients.pop(websocket, None)
        if p and 'id' in p:
            self.player_sockets.pop(p['id'], None)
            asyncio.create_task(self.broadcast_global({
                'type': 'player_leave',
                'id': p['id'],
                'name': p.get('name', '모험가')
            }))

    async def handle_connection(self, websocket):
        client_id = f"user_{id(websocket)}_{len(self.clients) + 1}"
        self.clients[websocket] = {
            'id': client_id,
            'name': '단풍모험가',
            'job': '초보자',
            'level': 1,
            'currentMap': 'henesys_hhg',
            'x': 1050.0,
            'y': 1320.0,
            'vx': 0,
            'vy': 0,
            'facing': 'left',
            'onLadder': False,
            'action': 'stand_0',
            'fame': 0,
            'authenticated': False
        }
        self.player_sockets[client_id] = websocket

        # Send Welcome & Online Count
        await websocket.send(json.dumps({
            'type': 'welcome',
            'id': client_id,
            'onlineCount': len(self.clients)
        }))

        try:
            async for raw in websocket:
                data = json.loads(raw)
                msg_type = data.get('type')
                curr_player = self.clients.get(websocket)
                if not curr_player:
                    break

                # 1. Register Account
                if msg_type == 'auth_register':
                    u = data.get('username', '').strip()
                    p = data.get('password', '').strip()
                    if len(u) < 2 or len(p) < 2:
                        await websocket.send(json.dumps({
                            'type': 'auth_result',
                            'success': False,
                            'message': '아이디와 비밀번호는 2자리 이상이어야 합니다.'
                        }))
                    else:
                        ok, msg = db_register_user(u, p)
                        await websocket.send(json.dumps({
                            'type': 'auth_result',
                            'success': ok,
                            'message': msg
                        }))

                # 2. Login Account
                elif msg_type == 'auth_login':
                    u = data.get('username', '').strip()
                    p = data.get('password', '').strip()
                    ok, msg, char_info = db_login_user(u, p)
                    if ok and char_info:
                        curr_player['authenticated'] = True
                        curr_player['name'] = char_info['name']
                        curr_player['job'] = char_info['job']
                        curr_player['level'] = char_info['level']
                        curr_player['currentMap'] = char_info['currentMap']
                        curr_player['x'] = char_info['x']
                        curr_player['y'] = char_info['y']
                        curr_player['fame'] = char_info['fame']
                        curr_player['charData'] = char_info

                        # Notify login success to self with full save state
                        await websocket.send(json.dumps({
                            'type': 'auth_login_success',
                            'character': char_info,
                            'onlineCount': len(self.clients)
                        }))

                        # Broadcast join to others in the same map
                        await self.broadcast_to_map(curr_player['currentMap'], {
                            'type': 'player_join',
                            'player': {
                                'id': curr_player['id'],
                                'name': curr_player['name'],
                                'job': curr_player['job'],
                                'level': curr_player['level'],
                                'currentMap': curr_player['currentMap'],
                                'x': curr_player['x'],
                                'y': curr_player['y'],
                                'facing': curr_player['facing'],
                                'fame': curr_player['fame']
                            }
                        }, exclude_sock=websocket)

                        # Send list of existing players in this map to the joining player
                        map_players = [
                            {
                                'id': other['id'],
                                'name': other['name'],
                                'job': other['job'],
                                'level': other['level'],
                                'currentMap': other['currentMap'],
                                'x': other['x'],
                                'y': other['y'],
                                'facing': other['facing'],
                                'fame': other['fame'],
                                'action': other.get('action', 'stand_0')
                            }
                            for s, other in self.clients.items()
                            if s != websocket and other.get('currentMap') == curr_player['currentMap']
                        ]
                        await websocket.send(json.dumps({
                            'type': 'room_players',
                            'players': map_players
                        }))
                    else:
                        await websocket.send(json.dumps({
                            'type': 'auth_result',
                            'success': False,
                            'message': msg
                        }))

                # 3. Save Character State to DB
                elif msg_type == 'save_character':
                    cdata = data.get('character', {})
                    if curr_player.get('authenticated') and cdata:
                        db_save_character(cdata)
                        await websocket.send(json.dumps({
                            'type': 'save_ack',
                            'timestamp': data.get('timestamp')
                        }))

                # 4. Movement Synchronization
                elif msg_type == 'player_move':
                    curr_player['x'] = data.get('x', curr_player['x'])
                    curr_player['y'] = data.get('y', curr_player['y'])
                    curr_player['vx'] = data.get('vx', 0)
                    curr_player['vy'] = data.get('vy', 0)
                    curr_player['facing'] = data.get('facing', 'left')
                    curr_player['onLadder'] = data.get('onLadder', False)
                    curr_player['action'] = data.get('action', 'stand_0')
                    new_map = data.get('currentMap')

                    # Map transition detection
                    if new_map and new_map != curr_player['currentMap']:
                        old_map = curr_player['currentMap']
                        curr_player['currentMap'] = new_map
                        # Notify old map players
                        await self.broadcast_to_map(old_map, {
                            'type': 'player_leave',
                            'id': curr_player['id'],
                            'name': curr_player['name']
                        }, exclude_sock=websocket)
                        # Notify new map players
                        await self.broadcast_to_map(new_map, {
                            'type': 'player_join',
                            'player': {
                                'id': curr_player['id'],
                                'name': curr_player['name'],
                                'job': curr_player['job'],
                                'level': curr_player['level'],
                                'currentMap': curr_player['currentMap'],
                                'x': curr_player['x'],
                                'y': curr_player['y'],
                                'facing': curr_player['facing'],
                                'fame': curr_player['fame']
                            }
                        }, exclude_sock=websocket)
                        # Send new map existing players to self
                        map_players = [
                            {
                                'id': other['id'],
                                'name': other['name'],
                                'job': other['job'],
                                'level': other['level'],
                                'currentMap': other['currentMap'],
                                'x': other['x'],
                                'y': other['y'],
                                'facing': other['facing'],
                                'fame': other['fame'],
                                'action': other.get('action', 'stand_0')
                            }
                            for s, other in self.clients.items()
                            if s != websocket and other.get('currentMap') == new_map
                        ]
                        await websocket.send(json.dumps({
                            'type': 'room_players',
                            'players': map_players
                        }))
                    else:
                        # Broadcast move to peers in same map
                        await self.broadcast_to_map(curr_player['currentMap'], {
                            'type': 'peer_move',
                            'id': curr_player['id'],
                            'x': curr_player['x'],
                            'y': curr_player['y'],
                            'vx': curr_player['vx'],
                            'vy': curr_player['vy'],
                            'facing': curr_player['facing'],
                            'onLadder': curr_player['onLadder'],
                            'action': curr_player['action']
                        }, exclude_sock=websocket)

                # 5. Attack / Skill Animation Sync
                elif msg_type == 'player_action':
                    await self.broadcast_to_map(curr_player['currentMap'], {
                        'type': 'peer_action',
                        'id': curr_player['id'],
                        'action': data.get('action', 'attack'),
                        'skillId': data.get('skillId'),
                        'x': curr_player['x'],
                        'y': curr_player['y'],
                        'facing': curr_player['facing']
                    }, exclude_sock=websocket)

                # 6. Chat Message Broadcast
                elif msg_type == 'chat_message':
                    text = data.get('text', '').strip()
                    channel = data.get('channel', 'ALL')
                    if text:
                        await self.broadcast_global({
                            'type': 'chat_broadcast',
                            'senderId': curr_player['id'],
                            'senderName': curr_player['name'],
                            'job': curr_player['job'],
                            'level': curr_player['level'],
                            'channel': channel,
                            'text': text,
                            'x': curr_player['x'],
                            'y': curr_player['y'],
                            'map': curr_player['currentMap']
                        })

                # 7. Fame Up Interaction
                elif msg_type == 'fame_up':
                    target_name = data.get('targetName')
                    if target_name and target_name != curr_player['name']:
                        new_fame = db_update_fame(target_name)
                        await self.broadcast_global({
                            'type': 'fame_broadcast',
                            'fromName': curr_player['name'],
                            'targetName': target_name,
                            'newFame': new_fame
                        })

        except websockets.exceptions.ConnectionClosed:
            pass
        finally:
            self.remove_client(websocket)

# ==============================================================================
# 5. Main Execution: Threaded HTTP + Async WebSocket
# ==============================================================================
def start_http_server(lan_ips):
    port = HTTP_PORT
    while port < HTTP_PORT + 20:
        try:
            with ThreadingHTTPServer(("0.0.0.0", port), NoCacheHTTPHandler) as httpd:
                httpd.serve_forever()
                break
        except OSError:
            port += 1

async def start_ws_server():
    server = MultiplayerServer()
    async with websockets.serve(server.handle_connection, "0.0.0.0", WS_PORT):
        await asyncio.Future()  # run forever

def run():
    global HTTP_PORT, WS_PORT
    import argparse
    parser = argparse.ArgumentParser(description="OpenMaple Classic Server")
    parser.add_argument("--port", "-p", type=int, default=8000, help="HTTP server port")
    parser.add_argument("--ws-port", type=int, default=None, help="WebSocket server port")
    parser.add_argument("--no-browser", action="store_true", help="Do not open browser")
    args, unknown = parser.parse_known_args()

    HTTP_PORT = args.port
    WS_PORT = args.ws_port if args.ws_port is not None else (HTTP_PORT + 1)

    init_db()
    lan_ips = get_lan_ips()
    primary_lan = lan_ips[0] if lan_ips else "127.0.0.1"

    local_url = f"http://localhost:{HTTP_PORT}"
    lan_url = f"http://{primary_lan}:{HTTP_PORT}"

    print("=" * 70)
    print("🍁 OpenMaple Classic: LAN & 실시간 멀티플레이 통합 서버 v2.0")
    print("=" * 70)
    print(f"💻 로컬(내 PC) 웹 접속 주소     : {local_url}")
    print(f"📱 LAN (스마트폰/친구 PC) 주소 : {lan_url}")
    print(f"⚡ 실시간 멀티플레이 웹소켓 포트 : {WS_PORT}")
    print(f"🗄️ 계정 및 캐릭터 DB 파일       : {DB_PATH}")
    print("-" * 70)
    print("✨ 같은 Wi-Fi/공유기 네트워크의 모든 기기에서 위 LAN 주소로 접속하면")
    print("   ID/PW 로그인, 캐릭터 실시간 동기화, 채팅, 인기도 상호작용이 가능합니다!")
    print("🛑 서버를 종료하려면 Ctrl + C 를 누르세요.")
    print("=" * 70)
    sys.stdout.flush()

    # Start HTTP server in a daemon thread
    http_thread = threading.Thread(target=start_http_server, args=(lan_ips,), daemon=True)
    http_thread.start()

    # Open local browser
    if not args.no_browser:
        try:
            webbrowser.open(local_url)
        except Exception:
            pass

    # Run WebSocket server in main thread
    try:
        asyncio.run(start_ws_server())
    except KeyboardInterrupt:
        print("\n[서버 종료] 멀티플레이 서버가 안전하게 종료되었습니다.")

if __name__ == "__main__":
    run()
