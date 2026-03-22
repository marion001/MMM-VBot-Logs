'''
Code By: Vũ Tuyển
GitHub VBot: https://github.com/marion001/VBot_Offline.git
Facebook Group: https://www.facebook.com/groups/1148385343358824
Facebook: https://www.facebook.com/TWFyaW9uMDAx
Mail: VBot.Assistant@gmail.com
'''

#Thư viện Lib của VBot
import Lib

#Cổng Port WEBSOCKET
WS_PORT = 8765

clients = set()

_vbot_ws_started = False

#WEBSOCKET SERVER
async def handler(websocket):
    clients.add(websocket)
    try:
        await websocket.wait_closed()
    finally:
        clients.discard(websocket)

async def broadcast(message: str):
    if not clients:
        return
    dead = []
    for ws in list(clients):
        try:
            await ws.send(message)
        except:
            dead.append(ws)
    for ws in dead:
        clients.discard(ws)

#EVENT LOOP RIÊNG
ws_loop = Lib.asyncio.new_event_loop()

def start_ws_server():
    Lib.asyncio.set_event_loop(ws_loop)
    async def start():
        return await Lib.websockets.serve(handler, "0.0.0.0", WS_PORT)
    ws_loop.run_until_complete(start())
    print(f"[MagicMirror Logs VBot] Máy Chủ WebSocket Dev_Logs đã được chạy dùng cho MagicMiror ws://0.0.0.0:{WS_PORT}")
    ws_loop.run_forever()

if not _vbot_ws_started:
    _vbot_ws_started = True
    Lib.threading.Thread(target=start_ws_server, daemon=True).start()

#CACHE JSON
_json_dumps = Lib.json.dumps

#SEND LOG
def send_log(msg: str):
    if not clients:
        return
    if ws_loop.is_running():
        payload = _json_dumps({"text": msg})
        Lib.asyncio.run_coroutine_threadsafe(broadcast(payload), ws_loop)

#Giữ nguyên hàm def logs_dev(logs_text)
#Mọi thứ chỉ được sửa đổi code bên trong hàm này
#Các bạn có thể code tùy biến hiển thị logs theo ý muốn như: hiển thị lên màn hình, đẩy logs lên server khác, V..v...

def logs_dev(logs_text):
    send_log(logs_text)