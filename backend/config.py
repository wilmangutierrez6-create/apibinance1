"""
Configuración para el script P2P
"""

# Configuración de la API
API_SETTINGS = {
    "base_url": "https://api.binance.com",
    "endpoint": "/sapi/v1/c2c/orderMatch/listUserOrderHistory",
    "timeout": 30,
    "max_pages": 10,
    "rows_per_page": 100
}

# Configuración de análisis
ANALYSIS_SETTINGS = {
    "default_days_back": 30,
    "commission_rate": 0.0014,  # 0.14%
    "output_dir": "data",
    "output_file": "p2p-data.json"
}
