"""
Stock prediction engine using yfinance + technical analysis.
Predicts top-5 best future sell days within the next 30 trading days.
"""

import yfinance as yf
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings("ignore")


def compute_rsi(series: pd.Series, period: int = 14) -> pd.Series:
    delta = series.diff()
    gain  = delta.clip(lower=0).rolling(period).mean()
    loss  = (-delta.clip(upper=0)).rolling(period).mean()
    rs    = gain / loss.replace(0, np.nan)
    return 100 - (100 / (1 + rs))


def fetch_stock_data(ticker: str):
    """Try multiple methods to fetch stock data reliably."""
    stock = yf.Ticker(ticker)

    # Method 1: use period (most reliable with yfinance)
    try:
        hist = stock.history(period="2y", auto_adjust=True)
        if hist is not None and len(hist) >= 20:
            return stock, hist
    except Exception:
        pass

    # Method 2: explicit date range
    try:
        end   = datetime.utcnow().strftime("%Y-%m-%d")
        start = (datetime.utcnow() - timedelta(days=730)).strftime("%Y-%m-%d")
        hist  = stock.history(start=start, end=end, auto_adjust=True)
        if hist is not None and len(hist) >= 20:
            return stock, hist
    except Exception:
        pass

    # Method 3: shorter period fallback
    try:
        hist = stock.history(period="1y", auto_adjust=True)
        if hist is not None and len(hist) >= 20:
            return stock, hist
    except Exception:
        pass

    return stock, pd.DataFrame()


def predict_best_sell_days(ticker: str, amount: float, buy_date_str: str) -> dict:
    """
    Returns top-5 predicted sell days with:
      - date, predicted_price, estimated_return_pct,
        estimated_profit, confidence_score, signal_summary
    """
    try:
        buy_date = datetime.strptime(buy_date_str, "%Y-%m-%d")
    except ValueError:
        return {"error": f"Invalid date format. Use YYYY-MM-DD (got '{buy_date_str}')"}

    # ── Fetch data ────────────────────────────────────────────────────────────
    try:
        stock, hist = fetch_stock_data(ticker)
    except Exception as e:
        return {"error": f"Could not fetch data for '{ticker}': {str(e)}"}

    if hist is None or hist.empty:
        return {"error": f"No data returned for '{ticker}'. Please verify the ticker symbol. For NSE stocks use .NS (e.g. TCS.NS), for BSE use .BO (e.g. TCS.BO)."}

    if len(hist) < 20:
        return {"error": f"Not enough historical data for '{ticker}' (got {len(hist)} rows, need 20+). Try a different date range or ticker."}

    # ── Normalize index ───────────────────────────────────────────────────────
    hist.index = pd.to_datetime(hist.index)
    if hist.index.tz is not None:
        hist.index = hist.index.tz_localize(None)

    close = hist["Close"].dropna()
    if len(close) < 20:
        return {"error": f"Not enough clean price data for '{ticker}'. Try again."}

    # ── Buy price ─────────────────────────────────────────────────────────────
    future_rows = hist[hist.index >= buy_date]
    if future_rows.empty or buy_date > datetime.utcnow():
        buy_price = float(close.iloc[-1])
    else:
        buy_price = float(future_rows["Close"].iloc[0])

    if buy_price <= 0:
        return {"error": f"Invalid buy price for '{ticker}'. Please check the ticker and date."}

    shares_owned = amount / buy_price

    # ── Technical indicators ──────────────────────────────────────────────────
    hist = hist.copy()
    hist["MA7"]  = close.rolling(7).mean()
    hist["MA21"] = close.rolling(21).mean()
    hist["RSI"]  = compute_rsi(close, 14)

    hist["MACD"]   = close.ewm(span=12, adjust=False).mean() - close.ewm(span=26, adjust=False).mean()
    hist["Signal"] = hist["MACD"].ewm(span=9, adjust=False).mean()
    hist["MACDHist"] = hist["MACD"] - hist["Signal"]

    bb_mid = close.rolling(20).mean()
    bb_std = close.rolling(20).std()
    hist["BB_upper"] = bb_mid + 2 * bb_std
    hist["BB_lower"] = bb_mid - 2 * bb_std

    hist["Return1"] = close.pct_change(1)

    # ── Linear trend from last 30 (or available) days ────────────────────────
    window = min(30, len(close))
    last_n = close.tail(window).values
    x = np.arange(len(last_n))
    slope, intercept = np.polyfit(x, last_n, 1)
    last_price = float(close.iloc[-1])

    # Safe helper to get last non-NaN value
    def last_val(col, default):
        s = hist[col].dropna()
        return float(s.iloc[-1]) if not s.empty else default

    rsi_now      = last_val("RSI", 50)
    macd_hist_now = last_val("MACDHist", 0)
    ma7_now      = last_val("MA7", last_price)
    ma21_now     = last_val("MA21", last_price)
    bb_upper_now = last_val("BB_upper", last_price * 1.05)

    # ── Generate 30 future trading days ──────────────────────────────────────
    candidate_days = []
    today = datetime.utcnow().date()
    check_date = today + timedelta(days=1)
    trading_day_count = 0

    while trading_day_count < 30:
        if check_date.weekday() < 5:   # Mon–Fri only
            projected_offset = window + trading_day_count
            projected_price  = intercept + slope * projected_offset

            # Weekday seasonality
            weekday_col = hist["Return1"].dropna()
            weekday_mask = hist.index.dayofweek == check_date.weekday()
            weekday_returns = hist.loc[weekday_mask, "Return1"].dropna()
            weekday_factor  = 1 + float(weekday_returns.mean()) if not weekday_returns.empty else 1.0
            projected_price *= weekday_factor

            # Ensure price stays in a realistic band (±40% of current)
            projected_price = max(last_price * 0.6, min(last_price * 1.4, projected_price))

            # ── Score ──────────────────────────────────────────────────────
            score = 50.0

            # Trend direction
            if slope > 0:
                score += min(15, slope / last_price * 1000)
            else:
                score += max(-15, slope / last_price * 1000)

            # RSI signal (overbought zones = good to sell)
            if rsi_now > 65:
                score += 12
            elif rsi_now > 55:
                score += 6
            elif rsi_now < 35:
                score -= 10

            # MACD histogram
            score += 8 if macd_hist_now > 0 else -5

            # Bollinger Band proximity
            if last_price >= bb_upper_now * 0.97:
                score += 10

            # MA crossover
            score += 7 if ma7_now > ma21_now else -4

            # Slight penalty for further dates (less certainty)
            score -= trading_day_count * 0.3

            score = max(5, min(95, score))

            candidate_days.append({
                "date": check_date.strftime("%Y-%m-%d"),
                "predicted_price": float(projected_price),
                "score": score,
            })
            trading_day_count += 1

        check_date += timedelta(days=1)

    # ── Pick top-5 by score, return in chronological order ───────────────────
    top5 = sorted(candidate_days, key=lambda d: d["score"], reverse=True)[:5]
    top5 = sorted(top5, key=lambda d: d["date"])

    results = []
    for day in top5:
        pp      = day["predicted_price"]
        ret_pct = ((pp - buy_price) / buy_price) * 100
        profit  = (pp - buy_price) * shares_owned

        signals = []
        if slope > 0:
            signals.append("Uptrend detected")
        if rsi_now > 60:
            signals.append(f"RSI {rsi_now:.0f} — overbought zone")
        if macd_hist_now > 0:
            signals.append("MACD bullish")
        if ma7_now > ma21_now:
            signals.append("MA7 above MA21")
        if not signals:
            signals.append("Neutral momentum")

        results.append({
            "date":                 day["date"],
            "predicted_price":      round(pp, 2),
            "confidence_score":     round(day["score"], 1),
            "estimated_return_pct": round(ret_pct, 2),
            "estimated_profit":     round(profit, 2),
            "signal_summary":       " · ".join(signals),
        })

    # ── Stock info ────────────────────────────────────────────────────────────
    info = {"name": ticker, "sector": "—", "currency": "USD"}
    try:
        raw = stock.info or {}
        info = {
            "name":     raw.get("longName") or raw.get("shortName") or ticker,
            "sector":   raw.get("sector", "—"),
            "currency": raw.get("currency", "INR" if ".NS" in ticker or ".BO" in ticker else "USD"),
        }
    except Exception:
        pass

    return {
        "ticker":           ticker,
        "stock_info":       info,
        "buy_date":         buy_date_str,
        "buy_price":        round(buy_price, 2),
        "current_price":    round(last_price, 2),
        "amount_invested":  round(amount, 2),
        "shares_owned":     round(shares_owned, 4),
        "top5_sell_days":   results,
        "disclaimer": (
            "⚠️  These predictions are generated by an algorithmic model and "
            "are NOT financial advice. Stock markets are inherently unpredictable. "
            "Always consult a certified financial advisor before investing. "
            "Invest only what you can afford to lose."
        ),
    }
