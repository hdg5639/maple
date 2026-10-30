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
import random
import uuid
import signal

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

# Global server instance for graceful shutdown
_GLOBAL_SERVER_INSTANCE = None

# ==============================================================================
# 1. SQLite Database Initialization & Account/Character Management (WAL Enabled)
# ==============================================================================
def get_db():
    conn = sqlite3.connect(DB_PATH, timeout=10.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA synchronous = NORMAL;")
    return conn

def init_db():
    conn = get_db()
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
    try:
        cur.execute('ALTER TABLE characters ADD COLUMN job_tier INTEGER DEFAULT 0')
    except Exception:
        pass
    cur.execute('''
        CREATE TABLE IF NOT EXISTS snail_race_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            round_id TEXT NOT NULL,
            server_seed TEXT NOT NULL,
            server_seed_hash TEXT NOT NULL,
            client_seed TEXT NOT NULL,
            winner_index INTEGER NOT NULL,
            bet_amount INTEGER NOT NULL,
            payout INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

def hash_pw(pw: str) -> str:
    return hashlib.sha256(pw.encode('utf-8')).hexdigest()

def make_starter_inventory():
    return {
        "equip": [
            {
                "item_uuid": f"eq_{uuid.uuid4().hex[:12]}",
                "id": "wp_wood_sword",
                "name": "초보자 목검",
                "category": "전사 한손검",
                "type": "weapon",
                "weaponType": "sword",
                "atk": 7,
                "statVariation": 0,
                "upgradeSlots": 7,
                "successCount": 0,
                "equipped": True
            },
            {
                "item_uuid": f"eq_{uuid.uuid4().hex[:12]}",
                "id": "eq_bandana",
                "name": "빨간 띠",
                "type": "hat",
                "def": 3,
                "statVariation": 0,
                "upgradeSlots": 7,
                "successCount": 0,
                "equipped": True
            }
        ],
        "use": [
            { "id": "red_potion", "name": "빨간 포션", "count": 15, "healHp": 50 },
            { "id": "blue_potion", "name": "파란 포션", "count": 10, "healMp": 50 },
            { "id": "scroll_atk_60", "name": "무기 공격력 주문서 60%", "type": "scroll", "count": 2, "rate": 0.6, "bonusAtk": 2 },
            { "id": "scroll_atk_10", "name": "무기 공격력 주문서 10%", "type": "scroll", "count": 1, "rate": 0.1, "bonusAtk": 5 },
            { "id": "scroll_atk_100", "name": "무기 공격력 주문서 100%", "type": "scroll", "count": 3, "rate": 1.0, "bonusAtk": 1 }
        ],
        "setup": [
            { "id": "chair_relax", "name": "릴렉스 체어", "type": "chair", "count": 1, "desc": "휴식을 취하며 10초마다 HP를 50 회복합니다." }
        ],
        "etc": [
            { "id": "snail_shell", "name": "달팽이의 껍질", "count": 5 },
            { "id": "slime_liquid", "name": "물컹물컹한 액체", "count": 2 }
        ],
        "cash": []
    }

def parse_character_row(char_row):
    # Support both sqlite3.Row dict-like access and tuple index fallback
    if hasattr(char_row, 'keys'):
        k = char_row.keys()
        return {
            "charId": char_row["id"],
            "accountId": char_row["account_id"],
            "name": char_row["name"],
            "job": char_row["job"],
            "jobTier": char_row["job_tier"] if "job_tier" in k and char_row["job_tier"] is not None else 0,
            "level": char_row["level"],
            "exp": char_row["exp"],
            "hp": char_row["hp"],
            "maxHp": char_row["max_hp"],
            "mp": char_row["mp"],
            "maxMp": char_row["max_mp"],
            "str": char_row["str"],
            "dex": char_row["dex"],
            "int": char_row["int_stat"],
            "luk": char_row["luk"],
            "ap": char_row["ap"],
            "sp": char_row["sp"],
            "fame": char_row["fame"],
            "meso": char_row["meso"],
            "currentMap": char_row["current_map"],
            "x": char_row["x"],
            "y": char_row["y"],
            "inventory": json.loads(char_row["inventory"]) if char_row["inventory"] else make_starter_inventory(),
            "skills": json.loads(char_row["skills"]) if char_row["skills"] else {},
            "quickslots": json.loads(char_row["quickslots"]) if char_row["quickslots"] else []
        }
    return {
        "charId": char_row[0],
        "accountId": char_row[1],
        "name": char_row[2],
        "job": char_row[3],
        "jobTier": char_row[25] if len(char_row) > 25 and char_row[25] is not None else 0,
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
        "inventory": json.loads(char_row[21]) if char_row[21] else make_starter_inventory(),
        "skills": json.loads(char_row[22]) if char_row[22] else {},
        "quickslots": json.loads(char_row[23]) if char_row[23] else []
    }

def db_register_user(username, password):
    try:
        conn = get_db()
        cur = conn.cursor()
        p_hash = hash_pw(password)
        cur.execute("INSERT INTO accounts (username, password_hash) VALUES (?, ?)", (username, p_hash))
        acc_id = cur.lastrowid
        conn.commit()
        conn.close()
        return True, "회원가입이 완료되었습니다!", acc_id
    except sqlite3.IntegrityError:
        return False, "이미 존재하는 아이디입니다.", None
    except Exception as e:
        return False, f"등록 오류: {str(e)}", None

def db_login_user(username, password):
    try:
        conn = get_db()
        cur = conn.cursor()
        p_hash = hash_pw(password)
        cur.execute("SELECT id FROM accounts WHERE username = ? AND password_hash = ?", (username, p_hash))
        row = cur.fetchone()
        if not row:
            conn.close()
            return False, "아이디 또는 비밀번호가 일치하지 않습니다.", None, []

        acc_id = row[0]
        cur.execute("SELECT * FROM characters WHERE account_id = ? ORDER BY id ASC", (acc_id,))
        char_rows = cur.fetchall()
        characters = [parse_character_row(r) for r in char_rows]
        conn.close()

        return True, "로그인 성공!", acc_id, characters
    except Exception as e:
        return False, f"로그인 오류: {str(e)}", None, []

def db_create_character(acc_id, name, str_val, dex_val, int_val, luk_val):
    try:
        # Validate 4/4 Classic Dice Rule: total sum == 25, each >= 4
        if str_val < 4 or dex_val < 4 or int_val < 4 or luk_val < 4:
            return False, "모든 스탯은 최소 4 이상이어야 합니다.", None
        if (str_val + dex_val + int_val + luk_val) != 25:
            return False, f"주사위 4대 스탯의 합은 반드시 25여야 합니다. (현재: {str_val+dex_val+int_val+luk_val})", None

        name = name.strip()
        if len(name) < 2 or len(name) > 12:
            return False, "캐릭터 이름은 2자 이상 12자 이하여야 합니다.", None

        conn = get_db()
        cur = conn.cursor()
        # Check slot limit (max 4 characters)
        cur.execute("SELECT COUNT(*) FROM characters WHERE account_id = ?", (acc_id,))
        count = cur.fetchone()[0]
        if count >= 4:
            conn.close()
            return False, "캐릭터 슬롯이 가득 찼습니다. (최대 4개)", None

        # Check unique name across all characters
        cur.execute("SELECT id FROM characters WHERE name = ?", (name,))
        if cur.fetchone():
            conn.close()
            return False, "이미 사용 중인 캐릭터 이름입니다.", None

        starter_inven = make_starter_inventory()
        cur.execute('''
            INSERT INTO characters (
                account_id, name, job, level, exp, hp, max_hp, mp, max_mp,
                str, dex, int_stat, luk, ap, sp, fame, meso,
                current_map, x, y, inventory, skills, quickslots
            ) VALUES (
                ?, ?, '초보자', 1, 0, 100, 100, 50, 50,
                ?, ?, ?, ?, 0, 3, 0, 1000,
                'henesys_hhg', 1050.0, 1320.0, ?, '{}', '[]'
            )
        ''', (
            acc_id, name, str_val, dex_val, int_val, luk_val,
            json.dumps(starter_inven)
        ))
        new_char_id = cur.lastrowid
        cur.execute("SELECT * FROM characters WHERE id = ?", (new_char_id,))
        char_row = cur.fetchone()
        conn.commit()
        conn.close()

        char_data = parse_character_row(char_row)
        return True, "캐릭터가 성공적으로 생성되었습니다!", char_data
    except Exception as e:
        return False, f"캐릭터 생성 오류: {str(e)}", None

def db_get_character(char_id):
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT * FROM characters WHERE id = ?", (char_id,))
        row = cur.fetchone()
        conn.close()
        if not row:
            return None
        return parse_character_row(row)
    except Exception:
        return None

def db_save_character(char_data):
    if not char_data or not char_data.get('charId'):
        return False
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute('''
            UPDATE characters SET
                job = ?, job_tier = ?, level = ?, exp = ?, hp = ?, max_hp = ?, mp = ?, max_mp = ?,
                str = ?, dex = ?, int_stat = ?, luk = ?, ap = ?, sp = ?, fame = ?, meso = ?,
                current_map = ?, x = ?, y = ?,
                inventory = ?, skills = ?, quickslots = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (
            char_data.get('job', '초보자'),
            char_data.get('jobTier', 0),
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

def db_server_enchant(char_id, item_uuid, scroll_id):
    """Server-authoritative scroll enhancement calculation with immediate commit."""
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT inventory FROM characters WHERE id = ?", (char_id,))
        row = cur.fetchone()
        if not row:
            conn.close()
            return False, "캐릭터를 찾을 수 없습니다.", None

        inventory = json.loads(row[0]) if row[0] else {}
        use_list = inventory.get("use", [])
        equip_list = inventory.get("equip", [])

        # Find scroll
        scroll_idx = next((i for i, s in enumerate(use_list) if s.get("id") == scroll_id), -1)
        if scroll_idx == -1 or use_list[scroll_idx].get("count", 0) <= 0:
            conn.close()
            return False, "주문서가 부족합니다.", None

        # Find equip target
        equip_item = next((eq for eq in equip_list if eq.get("item_uuid") == item_uuid or eq.get("id") == item_uuid), None)
        if not equip_item:
            conn.close()
            return False, "강화할 대상 장비를 찾을 수 없습니다.", None

        upgrade_slots = equip_item.get("upgradeSlots", 7)
        if upgrade_slots <= 0:
            conn.close()
            return False, "업그레이드 가능 횟수가 남아있지 않습니다.", None

        # Deduct scroll
        use_list[scroll_idx]["count"] -= 1
        if use_list[scroll_idx]["count"] <= 0:
            use_list.pop(scroll_idx)

        # Roll chance
        scroll_obj = use_list[scroll_idx] if scroll_idx < len(use_list) else {}
        rate = 0.6
        bonus_atk = 2
        bonus_def = 0
        if "60" in scroll_id:
            rate = 0.6
            bonus_atk = 2
        elif "10" in scroll_id:
            rate = 0.1
            bonus_atk = 5
        elif "100" in scroll_id:
            rate = 1.0
            bonus_atk = 1
        if "def" in scroll_id:
            bonus_def = bonus_atk
            bonus_atk = 0

        is_success = random.random() < rate
        equip_item["upgradeSlots"] = upgrade_slots - 1
        if is_success:
            equip_item["successCount"] = equip_item.get("successCount", 0) + 1
            if bonus_atk > 0:
                equip_item["atk"] = equip_item.get("atk", 0) + bonus_atk
            if bonus_def > 0:
                equip_item["def"] = equip_item.get("def", 0) + bonus_def
            msg = f"✨ 주문서 강화 성공! (잔여 슬롯: {equip_item['upgradeSlots']})"
        else:
            msg = f"💨 주문서가 미끄러졌습니다... (잔여 슬롯: {equip_item['upgradeSlots']})"

        # Immediate DB Commit
        cur.execute("UPDATE characters SET inventory = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (
            json.dumps(inventory),
            char_id
        ))
        conn.commit()
        conn.close()

        return True, msg, {
            "success": is_success,
            "item": equip_item,
            "inventory": inventory
        }
    except Exception as e:
        return False, f"강화 오류: {str(e)}", None

def db_update_fame(target_name):
    try:
        conn = get_db()
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
# 3. HTTP Server with Beacon Save Endpoint (Zero-Loss Defense)
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
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        # Beacon emergency auto-save handler on beforeunload
        if self.path == '/api/save' or self.path == '/api/save/':
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            try:
                data = json.loads(body.decode('utf-8'))
                char_data = data.get('character')
                if char_data:
                    db_save_character(char_data)
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(b'{"status":"ok"}')
                    return
            except Exception as e:
                sys.stderr.write(f"[BEACON SAVE ERROR] {e}\n")
            self.send_response(400)
            self.end_headers()
            return
        self.send_response(404)
        self.end_headers()

    def log_message(self, format, *args):
        pass

# ==============================================================================
# 4. Real-Time Multiplayer WebSocket Game Server
# ==============================================================================
class MultiplayerServer:
    def __init__(self):
        self.clients = {}  # socket -> player_session
        self.player_sockets = {}  # player_id -> socket

    def flush_all_sessions(self):
        """Emergency DB Flush for all active sessions on server shutdown."""
        count = 0
        for sock, player in list(self.clients.items()):
            if player.get('authenticated') and player.get('charData'):
                cdata = player['charData']
                cdata['x'] = player.get('x', cdata.get('x', 1050.0))
                cdata['y'] = player.get('y', cdata.get('y', 1320.0))
                cdata['currentMap'] = player.get('currentMap', cdata.get('currentMap', 'henesys_hhg'))
                db_save_character(cdata)
                count += 1
        if count > 0:
            sys.stdout.write(f"[SHUTDOWN FLUSH] Safely saved {count} active player sessions to SQLite DB.\n")
            sys.stdout.flush()

    async def broadcast_to_map(self, map_key, message, exclude_sock=None):
        raw = json.dumps(message)
        dead = []
        for sock, p in list(self.clients.items()):
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
            if p.get('authenticated') and p.get('charData'):
                # Immediate persistence on disconnect
                db_save_character(p['charData'])
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
            'authenticated': False,
            'accountId': None,
            'charData': None
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
                        ok, msg, acc_id = db_register_user(u, p)
                        await websocket.send(json.dumps({
                            'type': 'auth_result',
                            'success': ok,
                            'message': msg,
                            'accountId': acc_id
                        }))

                # 2. Login Account (Returns all characters for lobby)
                elif msg_type == 'auth_login':
                    u = data.get('username', '').strip()
                    p = data.get('password', '').strip()
                    ok, msg, acc_id, characters = db_login_user(u, p)
                    if ok:
                        curr_player['accountId'] = acc_id
                        await websocket.send(json.dumps({
                            'type': 'auth_lobby_info',
                            'success': True,
                            'accountId': acc_id,
                            'username': u,
                            'characters': characters,
                            'onlineCount': len(self.clients)
                        }))
                    else:
                        await websocket.send(json.dumps({
                            'type': 'auth_result',
                            'success': False,
                            'message': msg
                        }))

                # 3. Create Character with 4/4 Dice Stats Rule
                elif msg_type == 'character_create':
                    acc_id = curr_player.get('accountId') or data.get('accountId')
                    if not acc_id:
                        await websocket.send(json.dumps({
                            'type': 'character_create_result',
                            'success': False,
                            'message': '계정 로그인이 필요합니다.'
                        }))
                        continue

                    cname = data.get('name', '').strip()
                    str_s = int(data.get('str', 4))
                    dex_s = int(data.get('dex', 4))
                    int_s = int(data.get('int', 4))
                    luk_s = int(data.get('luk', 4))

                    ok, msg, char_obj = db_create_character(acc_id, cname, str_s, dex_s, int_s, luk_s)
                    if ok:
                        # Fetch all characters after creation
                        conn = get_db()
                        cur = conn.cursor()
                        cur.execute("SELECT * FROM characters WHERE account_id = ? ORDER BY id ASC", (acc_id,))
                        all_chars = [parse_character_row(r) for r in cur.fetchall()]
                        conn.close()

                        await websocket.send(json.dumps({
                            'type': 'character_create_result',
                            'success': True,
                            'message': msg,
                            'character': char_obj,
                            'characters': all_chars
                        }))
                    else:
                        await websocket.send(json.dumps({
                            'type': 'character_create_result',
                            'success': False,
                            'message': msg
                        }))

                # 4. Select Character & Enter Game World (Safe Respawn Guard)
                elif msg_type == 'character_select':
                    char_id = data.get('charId')
                    char_info = db_get_character(char_id)
                    if char_info:
                        curr_player['authenticated'] = True
                        curr_player['name'] = char_info['name']
                        curr_player['job'] = char_info['job']
                        curr_player['level'] = char_info['level']
                        curr_player['currentMap'] = char_info['currentMap']
                        curr_player['x'] = char_info['x']
                        curr_player['y'] = char_info['y']
                        curr_player['fame'] = char_info['fame']
                        curr_player['charData'] = char_info

                        # Notify login success with 3-second safe i-Frame spawn flag
                        await websocket.send(json.dumps({
                            'type': 'auth_login_success',
                            'character': char_info,
                            'onlineCount': len(self.clients),
                            'safeSpawn': True,
                            'invincibleDuration': 3.0
                        }))

                        # Broadcast join
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

                        # Existing players in map
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
                            'message': '선택한 캐릭터를 찾을 수 없습니다.'
                        }))

                # 5. Save Character State to DB (Zero-Delay Tier 1 Persistence)
                elif msg_type == 'save_character':
                    cdata = data.get('character', {})
                    if curr_player.get('authenticated') and cdata:
                        curr_player['charData'] = cdata
                        db_save_character(cdata)
                        await websocket.send(json.dumps({
                            'type': 'save_ack',
                            'timestamp': data.get('timestamp')
                        }))

                # 6. Server-Authoritative Scroll Enhancement
                elif msg_type == 'server_enchant':
                    char_id = curr_player.get('charData', {}).get('charId') or data.get('charId')
                    item_uuid = data.get('item_uuid')
                    scroll_id = data.get('scroll_id')
                    ok, msg, res_data = db_server_enchant(char_id, item_uuid, scroll_id)
                    await websocket.send(json.dumps({
                        'type': 'server_enchant_result',
                        'success': ok,
                        'message': msg,
                        'data': res_data
                    }))

                # 7. Movement Synchronization
                elif msg_type == 'player_move':
                    curr_player['x'] = data.get('x', curr_player['x'])
                    curr_player['y'] = data.get('y', curr_player['y'])
                    curr_player['vx'] = data.get('vx', 0)
                    curr_player['vy'] = data.get('vy', 0)
                    curr_player['facing'] = data.get('facing', 'left')
                    curr_player['onLadder'] = data.get('onLadder', False)
                    curr_player['action'] = data.get('action', 'stand_0')
                    new_map = data.get('currentMap')

                    if new_map and new_map != curr_player['currentMap']:
                        old_map = curr_player['currentMap']
                        curr_player['currentMap'] = new_map
                        await self.broadcast_to_map(old_map, {
                            'type': 'player_leave',
                            'id': curr_player['id'],
                            'name': curr_player['name']
                        }, exclude_sock=websocket)
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

                # 8. Attack / Skill Animation Sync
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

                # 9. Chat Message Broadcast
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

                # 10. Fame Up Interaction
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
# 5. Main Execution: Threaded HTTP + Async WebSocket + Graceful Shutdown
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
    global _GLOBAL_SERVER_INSTANCE
    server = MultiplayerServer()
    _GLOBAL_SERVER_INSTANCE = server
    async with websockets.serve(server.handle_connection, "0.0.0.0", WS_PORT):
        await asyncio.Future()  # run forever

def setup_graceful_shutdown():
    def shutdown_handler(signum, frame):
        print(f"\n[서버 종료 신호 수신 ({signum})] 인메모리 세션을 DB에 안전하게 플러시합니다...")
        if _GLOBAL_SERVER_INSTANCE:
            _GLOBAL_SERVER_INSTANCE.flush_all_sessions()
        sys.exit(0)

    try:
        signal.signal(signal.SIGINT, shutdown_handler)
        signal.signal(signal.SIGTERM, shutdown_handler)
    except Exception:
        pass

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
    setup_graceful_shutdown()
    lan_ips = get_lan_ips()
    primary_lan = lan_ips[0] if lan_ips else "127.0.0.1"

    local_url = f"http://localhost:{HTTP_PORT}"
    lan_url = f"http://{primary_lan}:{HTTP_PORT}"

    print("=" * 70)
    print("🍁 OpenMaple Classic: LAN & 실시간 멀티플레이 통합 서버 v3.0 (Zero-Loss WAL)")
    print("=" * 70)
    print(f"💻 로컬(내 PC) 웹 접속 주소     : {local_url}")
    print(f"📱 LAN (스마트폰/친구 PC) 주소 : {lan_url}")
    print(f"⚡ 실시간 멀티플레이 웹소켓 포트 : {WS_PORT}")
    print(f"🗄️ 계정 및 캐릭터 DB 파일       : {DB_PATH}")
    print("-" * 70)
    print("✨ SQLite WAL 저널링, 4/4 주사위 캐릭터 생성, 5대 인벤토리 격리,")
    print("   Tier 1 즉각 영속화 및 Graceful Flush 가 활성화되었습니다.")
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
        if _GLOBAL_SERVER_INSTANCE:
            _GLOBAL_SERVER_INSTANCE.flush_all_sessions()
        print("\n[서버 종료] 멀티플레이 서버가 안전하게 종료되었습니다.")

if __name__ == "__main__":
    run()
