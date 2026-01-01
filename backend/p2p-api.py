import os, json, ccxt
from datetime import datetime

def fetch_binance_p2p():
    # ⚠️ LLAVES DIRECTAS (Hardcoded)
    api_key = "7WkQpM8QrpOvpz6MZ9RRm3FyuxN5CCkIU0ev1LiIfYtKe4ReuumQ4gCqnOs3bKa3"
    api_secret = "sJfdcwOKWmZrLdzqyv7uWvnwhiNPnvz9xOq2v5kEwrL02uf7SGNyDEw2IjM2vRVY"
    
    exchange = ccxt.binance({
        'apiKey': api_key,
        'secret': api_secret,
        'enableRateLimit': True,
    })

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
