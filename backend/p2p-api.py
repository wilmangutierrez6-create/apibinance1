.#!/usr/bin/env python3
"""
Script para obtener datos P2P de Binance
Versión completa con API real
"""
import os
import sys
import json
import time
import hmac
import hashlib
import requests
import pandas as pd
import urllib.parse
from datetime import datetime, timedelta

# Configuración
BASE_URL = "https://api.binance.com"

def get_signature(params, secret):
    """Generar firma HMAC SHA256"""
    query = urllib.parse.urlencode(params)
    return hmac.new(
        secret.encode('utf-8'),
        query.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

def fetch_binance_p2p_data(api_key, api_secret, days_back=7):
    """Obtener datos históricos P2P de Binance"""
    
    all_orders = []
    end_time = int(time.time() * 1000)
    start_time = end_time - (days_back * 24 * 60 * 60 * 1000)
    
    print(f"📅 Buscando datos desde: {datetime.fromtimestamp(start_time/1000)}")
    print(f"📅 Hasta: {datetime.fromtimestamp(end_time/1000)}")
    
    # Obtener órdenes COMPRADOR (BUY)
    print("\n🔵 Obteniendo órdenes de COMPRA...")
    buy_orders = fetch_orders_by_type(api_key, api_secret, "BUY", start_time, end_time)
    print(f"   ✅ Órdenes de COMPRA: {len(buy_orders)}")
    
    # Obtener órdenes VENDEDOR (SELL)
    print("\n🟢 Obteniendo órdenes de VENTA...")
    sell_orders = fetch_orders_by_type(api_key, api_secret, "SELL", start_time, end_time)
    print(f"   ✅ Órdenes de VENTA: {len(sell_orders)}")
    
    # Combinar todas las órdenes
    all_orders = buy_orders + sell_orders
    print(f"\n📊 TOTAL ÓRDENES: {len(all_orders)}")
    
    return all_orders

def fetch_orders_by_type(api_key, api_secret, trade_type, start_time, end_time):
    """Obtener órdenes por tipo (BUY/SELL)"""
    orders = []
    page = 1
    max_pages = 10  # Límite de páginas por seguridad
    
    while page <= max_pages:
        try:
            params = {
                "tradeType": trade_type,
                "startTimestamp": start_time,
                "endTimestamp": end_time,
                "page": page,
                "rows": 100,
                "timestamp": int(time.time() * 1000)
            }
            
            params["signature"] = get_signature(params, api_secret)
            headers = {"X-MBX-APIKEY": api_key}
            
            response = requests.get(
                f"{BASE_URL}/sapi/v1/c2c/orderMatch/listUserOrderHistory",
                headers=headers,
                params=params,
                timeout=30
            )
            
            if response.status_code != 200:
                print(f"   ❌ Error HTTP {response.status_code}")
                break
            
            data = response.json()
            
            if "data" not in data or not data["data"]:
                break  # No hay más datos
            
            orders.extend(data["data"])
            print(f"   📄 Página {page}: {len(data['data'])} órdenes")
            
            # Si obtenemos menos de 100 órdenes, es la última página
            if len(data["data"]) < 100:
                break
            
            page += 1
            time.sleep(0.2)  # Pausa para no sobrecargar la API
            
        except Exception as e:
            print(f"   ⚠️ Error en página {page}: {str(e)[:100]}")
            break
    
    return orders

def process_orders_data(orders):
    """Procesar y analizar los datos de órdenes"""
    if not orders:
        return None
    
    # Convertir a DataFrame
    df = pd.DataFrame(orders)
    
    # Filtrar solo órdenes completadas
    df = df[df["orderStatus"] == "COMPLETED"].copy()
    
    if df.empty:
        print("⚠️ No hay órdenes COMPLETADAS")
        return None
    
    # Convertir tipos de datos
    df["amount"] = pd.to_numeric(df["amount"], errors='coerce')
    df["unitPrice"] = pd.to_numeric(df["unitPrice"], errors='coerce')
    df["totalPrice"] = pd.to_numeric(df["totalPrice"], errors='coerce')
    
    # Convertir timestamps a fechas
    df["fecha_hora"] = pd.to_datetime(df["createTime"], unit="ms")
    df["fecha"] = df["fecha_hora"].dt.strftime('%Y-%m-%d')
    df["hora"] = df["fecha_hora"].dt.strftime('%H:%M:%S')
    
    # Calcular valores en USDT
    df["total_usdt"] = df.apply(
        lambda x: x["totalPrice"] / x["unitPrice"] if x["tradeType"] == "SELL" else x["amount"],
        axis=1
    )
    
    # Calcular comisión (0.14% de Binance)
    df["comision"] = df["total_usdt"] * 0.0014
    df["neto_usdt"] = df["total_usdt"] - df["comision"]
    
    # Resumen por día
    resumen_diario = []
    for fecha, grupo in df.groupby("fecha"):
        compras = grupo[grupo["tradeType"] == "BUY"]["neto_usdt"].sum()
        ventas = grupo[grupo["tradeType"] == "SELL"]["neto_usdt"].sum()
        ganancia = ventas - compras
        
        resumen_diario.append({
            "fecha": fecha,
            "compras_usdt": round(float(compras), 2),
            "ventas_usdt": round(float(ventas), 2),
            "ganancia_usdt": round(float(ganancia), 2),
            "operaciones": int(len(grupo)),
            "detalle": {
                "compras": int(len(grupo[grupo["tradeType"] == "BUY"])),
                "ventas": int(len(grupo[grupo["tradeType"] == "SELL"]))
            }
        })
    
    # Ordenar por fecha
    resumen_diario.sort(key=lambda x: x["fecha"])
    
    # Calcular totales
    compras_total = sum(item["compras_usdt"] for item in resumen_diario)
    ventas_total = sum(item["ventas_usdt"] for item in resumen_diario)
    ganancia_total = sum(item["ganancia_usdt"] for item in resumen_diario)
    
    # Preparar resultado final
    resultado = {
        "success": True,
        "timestamp": datetime.now().isoformat(),
        "total_operaciones": int(len(df)),
        "periodo_dias": int((df["fecha_hora"].max() - df["fecha_hora"].min()).days) + 1,
        "compras_total": round(float(compras_total), 2),
        "ventas_total": round(float(ventas_total), 2),
        "ganancia_total": round(float(ganancia_total), 2),
        "resumen_diario": resumen_diario,
        "ultima_actualizacion": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        "metadata": {
            "moneda_base": "USDT",
            "comision_porcentaje": 0.14,
            "ordenes_analizadas": int(len(df))
        }
    }
    
    return resultado

def save_to_json(data, filename="data/p2p-data.json"):
    """Guardar datos en formato JSON"""
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False, default=str)
    
    print(f"💾 Datos guardados en: {filename}")
    return filename

def main():
    """Función principal"""
    print("=" * 60)
    print("🚀 BINANCE P2P DATA FETCHER")
    print("=" * 60)
    
    # Obtener credenciales de variables de entorno
    API_KEY = os.environ.get("BINANCE_API_KEY")
    API_SECRET = os.environ.get("BINANCE_API_SECRET")
    
    # Validar credenciales
    if not API_KEY or not API_SECRET:
        print("❌ ERROR: Credenciales no configuradas")
        print("\n🔧 Configura estos Secrets en GitHub:")
        print("   1. BINANCE_API_KEY")
        print("   2. BINANCE_API_SECRET")
        print("\n📍 Ve a: Settings > Secrets and variables > Actions")
        sys.exit(1)
    
    print("✅ Credenciales cargadas correctamente")
    print(f"🔑 API Key: {'*' * 10}{API_KEY[-4:] if len(API_KEY) > 4 else '****'}")
    print(f"🔒 API Secret: {'*' * 10}{API_SECRET[-4:] if len(API_SECRET) > 4 else '****'}")
    
    try:
        # Paso 1: Obtener datos de Binance
        print("\n" + "=" * 60)
        print("📥 CONECTANDO CON API DE BINANCE")
        print("=" * 60)
        
        orders = fetch_binance_p2p_data(API_KEY, API_SECRET, days_back=30)
        
        if not orders:
            print("\n⚠️ No se encontraron órdenes en los últimos 30 días")
            result_data = {
                "success": False,
                "message": "No se encontraron órdenes P2P",
                "timestamp": datetime.now().isoformat()
            }
        else:
            # Paso 2: Procesar datos
            print("\n" + "=" * 60)
            print("📊 PROCESANDO DATOS")
            print("=" * 60)
            
            result_data = process_orders_data(orders)
            
            if not result_data:
                result_data = {
                    "success": False,
                    "message": "No hay órdenes completadas para analizar",
                    "timestamp": datetime.now().isoformat(),
                    "total_ordenes": len(orders)
                }
        
        # Paso 3: Guardar resultados
        print("\n" + "=" * 60)
        print("💾 GUARDANDO RESULTADOS")
        print("=" * 60)
        
        filename = save_to_json(result_data)
        
        # Mostrar resumen
        if result_data.get("success"):
            print(f"\n📈 RESUMEN FINAL:")
            print(f"   📅 Período analizado: {result_data.get('periodo_dias', 'N/A')} días")
            print(f"   📊 Total operaciones: {result_data.get('total_operaciones', 0)}")
            print(f"   💰 Compras total: ${result_data.get('compras_total', 0):,.2f}")
            print(f"   💰 Ventas total: ${result_data.get('ventas_total', 0):,.2f}")
            print(f"   📈 Ganancia total: ${result_data.get('ganancia_total', 0):,.2f}")
            print(f"   🕐 Última actualización: {result_data.get('ultima_actualizacion', 'N/A')}")
        
        print("\n" + "=" * 60)
        print("✅ PROCESO COMPLETADO EXITOSAMENTE")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ ERROR CRÍTICO: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # Guardar error
        error_data = {
            "success": False,
            "error": str(e),
            "timestamp": datetime.now().isoformat(),
            "message": "Error al obtener datos de Binance"
        }
        
        save_to_json(error_data)
        sys.exit(1)

if __name__ == "__main__":
    main()
