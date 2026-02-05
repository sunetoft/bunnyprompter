import yfinance as yf
import json
import requests
import warnings
from datetime import datetime

# Suppress warnings
warnings.filterwarnings("ignore")

def get_fear_and_greed():
    try:
        url = "https://production.dataviz.cnn.io/index/fearandgreed/graphdata"
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Referer": "https://www.cnn.com/markets/fear-and-greed"
        }
        response = requests.get(url, headers=headers, timeout=10)
        data = response.json()
        
        fng = data.get("fear_and_greed", {})
        return {
            "score": round(fng.get("score", 0), 1),
            "rating": fng.get("rating", "Neutral").capitalize(),
            "timestamp": fng.get("timestamp", "")
        }
    except Exception as e:
        return {"error": str(e)}

def get_btc_data():
    try:
        btc = yf.Ticker("BTC-USD")
        history = btc.history(period="3d") # Fetching 3 days to ensure we have context
        if history.empty or len(history) < 2:
            # Fallback if history is empty (e.g. at session start)
            info = btc.info
            price = info.get('regularMarketPrice') or info.get('currentPrice')
            if not price:
                # One last try with fast_info
                price = btc.fast_info.last_price
            
            return {
                "price": round(price, 2) if price else 0,
                "change_p": 0.0
            }
            
        last_price = history['Close'].iloc[-1]
        prev_price = history['Close'].iloc[-2]
        change_p = ((last_price - prev_price) / prev_price) * 100
        
        return {
            "price": round(last_price, 2),
            "change_p": round(change_p, 2)
        }
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    results = {
        "fear_greed": get_fear_and_greed(),
        "btc": get_btc_data()
    }
    print(json.dumps(results))
