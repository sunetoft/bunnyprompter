import yfinance as yf
import pandas as pd
import json
import sys
import warnings
from datetime import datetime, timedelta

# Suppress warnings
warnings.filterwarnings("ignore")

def calculate_expected_move(stock, current_price, target_days):
    try:
        expirations = stock.options
        if not expirations:
            return None
            
        today = datetime.now()
        
        # Convert expiration strings to datetimes
        exp_dates = []
        for e in expirations:
            try:
                exp_dates.append(datetime.strptime(e, '%Y-%m-%d'))
            except:
                continue

        target_date = today + timedelta(days=target_days)
        if not exp_dates:
            return None
            
        closest_exp = min(exp_dates, key=lambda x: abs(x - target_date))
        exp_str = closest_exp.strftime('%Y-%m-%d')
        
        try:
            opt = stock.option_chain(exp_str)
            calls = opt.calls
            puts = opt.puts
            
            # ATM is the strike closest to current price
            calls['diff'] = (calls['strike'] - current_price).abs()
            puts['diff'] = (puts['strike'] - current_price).abs()
            
            atm_call = calls.sort_values('diff').iloc[0]
            atm_put = puts.sort_values('diff').iloc[0]
            
            def get_price(row):
                if row['bid'] > 0 and row['ask'] > 0:
                    return (row['bid'] + row['ask']) / 2
                return row['lastPrice']
                
            call_price = get_price(atm_call)
            put_price = get_price(atm_put)
            
            iv_val = (atm_call['impliedVolatility'] + atm_put['impliedVolatility']) / 2
            straddle_value = call_price + put_price
            expected_move = 0.85 * straddle_value
            
            return {
                "date": exp_str,
                "upper": round(current_price + expected_move, 2),
                "lower": round(current_price - expected_move, 2),
                "iv": round(iv_val * 100, 2),
                "straddle": round(straddle_value, 2)
            }
        except:
            return None
    except:
        return None

def scan_csp_opportunities(stock, current_price):
    try:
        expirations = stock.options[:10] # Look at the first 10 exp dates (usually covers 35+ days)
        if not expirations:
            return []
            
        today = datetime.now()
        opportunities = []
        
        for exp_str in expirations:
            exp_date = datetime.strptime(exp_str, '%Y-%m-%d')
            dte = (exp_date - today).days
            if dte <= 0: dte = 1
            if dte > 35: break # Only up to 35 DTE
            
            # 1. Get Expected Move for this specific expiration
            # Since we already have the exp_str, we don't need to find "closest"
            try:
                opt = stock.option_chain(exp_str)
                puts = opt.puts
                
                # Get Straddle for Expected Move
                calls = opt.calls
                calls['diff'] = (calls['strike'] - current_price).abs()
                puts['diff'] = (puts['strike'] - current_price).abs()
                
                atm_call = calls.sort_values('diff').iloc[0]
                atm_put = puts.sort_values('diff').iloc[0]
                
                def get_price(row):
                    if row['bid'] > 0 and row['ask'] > 0:
                        return (row['bid'] + row['ask']) / 2
                    return row['lastPrice']
                    
                call_p = get_price(atm_call)
                put_p = get_price(atm_put)
                expected_move_val = 0.85 * (call_p + put_p)
                lower_bound = current_price - expected_move_val
                
                # 2. Look for Puts below lower bound with ROI > 0.1%/day
                # Filter puts strike < lower_bound
                safe_puts = puts[puts['strike'] < lower_bound]
                
                for _, put in safe_puts.iterrows():
                    premium = get_price(put)
                    if premium <= 0: continue
                    
                    strike = put['strike']
                    roi_total = (premium / strike) * 100
                    roi_daily = roi_total / dte
                    
                    if roi_daily >= 0.1:
                        # Found an opportunity
                        tag = "green"
                        if dte < 8: tag = "blue"
                        elif dte < 15: tag = "purple"
                        
                        opportunities.append({
                            "dte": dte,
                            "tag": tag,
                            "strike": strike,
                            "premium": round(premium, 2),
                            "roi_daily": round(roi_daily, 3),
                            "date": exp_str
                        })
                        # We only need the best (highest strike) opportunity per expiration that meets criteria
                        break 
            except:
                continue
        return opportunities
    except:
        return []

if __name__ == "__main__":
    args = sys.argv[1:]
    skip_csp = "--skip-csp" in args
    tickers_list = [a for a in args if a != "--skip-csp"]
    
    if not tickers_list:
        print("{}")
    else:
        try:
            results = {}
            for ticker in tickers_list:
                try:
                    stock = yf.Ticker(ticker)
                    
                    # Get history for 6 months
                    history = stock.history(period="6mo") 
                    if history.empty:
                        continue
                        
                    last_close = float(history['Close'].iloc[-1])
                    prev_close = float(history['Close'].iloc[-2])
                    last_open = float(history['Open'].iloc[-1])
                    
                    daily_change = ((last_close - prev_close) / prev_close) * 100
                    gap_p = ((last_open - prev_close) / prev_close) * 100
                    
                    if len(history) >= 6:
                        week_ago_close = float(history['Close'].iloc[-6])
                        weekly_change = ((last_close - week_ago_close) / week_ago_close) * 100
                    else:
                        weekly_change = 0
                        
                    ema21_series = history['Close'].ewm(span=21, adjust=False).mean()
                    ema21 = float(ema21_series.iloc[-1])
                    dist_ema21 = ((last_close - ema21) / ema21) * 100
                    
                    sma50_series = history['Close'].rolling(window=50).mean()
                    sma50 = float(sma50_series.iloc[-1])
                    dist_sma50 = ((last_close - sma50) / sma50) * 100
                    
                    # Calculate Expected Moves for Display (Standard Horizons)
                    expected_moves = []
                    csp_opportunities = []
                    
                    if not skip_csp:
                        for h_name, h_days in [("Weekly",7), ("14-Day",14), ("1-Month",30)]:
                            em = calculate_expected_move(stock, last_close, h_days)
                            if em:
                                em["horizon"] = h_name
                                expected_moves.append(em)
                        
                        # Scan for CSP Trades
                        csp_opportunities = scan_csp_opportunities(stock, last_close)
                    
                    results[ticker] = {
                        "ticker": ticker,
                        "price": round(last_close, 2),
                        "daily_change": round(daily_change, 2),
                        "weekly_change": round(weekly_change, 2),
                        "gap_p": round(gap_p, 2),
                        "dist_ema21": round(dist_ema21, 2),
                        "dist_sma50": round(dist_sma50, 2),
                        "history": [
                            {
                                "date": date.strftime('%Y-%m-%d'),
                                "close": round(float(price), 2)
                            }
                            for date, price in history['Close'].items()
                        ],
                        "expected_moves": expected_moves,
                        "csp_opportunities": csp_opportunities
                    }
                except Exception as e:
                    results[ticker] = {"error": str(e)}
            
            print(json.dumps(results))
        except Exception as e:
            print(json.dumps({"error": str(e)}))
