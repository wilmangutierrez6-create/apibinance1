import requests
import time
import hmac
import hashlib

API_KEY = "7WkQpM8QrpOvpz6MZ9RRm3FyuxN5CCkIU0ev1LiIfYtKe4ReuumQ4gCqnOs3bKa3"
API_SECRET = "sJfdcwOKWmZrLdzqyv7uWvnwhiNPnvz9xOq2v5kEwrL02uf7SGNyDEw2IjM2vRVY"

BASE_URL = "https://api.binance.com"

def get_c2c_trade_history():
    endpoint = "/sapi/v1/c2c/orderMatch/list"
    timestamp = int(time.time() * 1000)

    params = {
        "timestamp": timestamp,
        "recvWindow": 5000
    }

    # Crear firma HMAC SHA256
    query_string = "&".join([f"{key}={value}" for key, value in params.items()])
    signature = hmac.new(API_SECRET.encode("utf-8"), query_string.encode("utf-8"), hashlib.sha256).hexdigest()

    headers = {
        "X-MBX-APIKEY": API_KEY
    }

    response = requests.get(BASE_URL + endpoint, params={**params, "signature": signature}, headers=headers)
    return response.json()

if __name__ == "__main__":
    data = get_c2c_trade_history()
    print(data)


    try:
        print("Consultando órdenes en Binance...")
        # Forzamos la búsqueda de los últimos 100 registros
        response = exchange.sapi_get_c2c_ordermatch_listuserorderhistory({
            'tradeType': 'BOTH', 
            'rows': 100
        })
        
        raw_orders = response.get('data', [])
        
        if not raw_orders:
            print("No se encontraron órdenes. Revisa si la API Key tiene permisos de P2P.")
            return None

        processed_orders = []
        for order in raw_orders:
            if order['orderStatus'] == 'COMPLETED':
                processed_orders.append({
                    "id": order['orderNumber'],
                    "fecha": datetime.fromtimestamp(int(order['createTime'])/1000).strftime('%Y-%m-%d'),
                    "activo": order['asset'],
                    "tipo": "COMPRA" if order['tradeType'] == 'BUY' else "VENTA",
                    "monto": float(order['totalPrice']),
                    "ganancia": 0.0, 
                    "estado": "COMPLETADO"
                })
        
        return {
            "success": True,
            "ultima_actualizacion": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            "operaciones": processed_orders
        }
    except Exception as e:
        print(f"Error detectado: {e}")
        return None

if __name__ == "__main__":
    datos = fetch_binance_p2p()
    if datos:
        # Guardamos en la ruta que el frontend espera
        with open('data/p2p-data.json', 'w', encoding='utf-8') as f:
            json.dump(datos, f, indent=2)
        print("Datos guardados en data/p2p-data.json")
