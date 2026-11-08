"""
Stock prediction engine using yfinance + simple technical analysis.
Predicts top-5 best future sell days within the next 30 trading days.
"""

import yfinance as yf
import numpy as np
import pandas as pd
from datetime import datetime, timedelta


def compute_rsi(series: pd.Series, period: int = 14) -> pd.Series:
    delta = series.diff()
    gain  = delta.clip(lower=0).rolling(period).mean()
    loss  = (-delta.clip(upper=0)).rolling(period).mean()
    rs    = gain / loss.replace(0, np.nan)
    return 100 - (100 / (1 + rs))


def predict_best_sell_days(ticker: str, amount: float, buy_date_str: str) -> dict:
    """
    Returns top-5 predicted sell days with:
      - date
      - predicted_price
      - estimated_return_pct
      - estimated_profit
      - confidence_score (0-100)
      - signal_summary
    """
    try:
        buy_date = datetime.strptime(buy_date_str, "%Y-%m-%d")
    except ValueError:
        return {"error": f"Invalid date format. Use YYYY-MM-DD (got '{buy_date_str}')"}

    # Fetch historical data (2 years for decent training signal)
    start = (buy_date - timedelta(days=730)).strftime("%Y-%m-%d")
    end   = datetime.utcnow().strftime("%Y-%m-%d")

    try:
        stock = yf.Ticker(ticker)
        hist  = stock.history(start=start, end=end)
    except Exception as e:
        return {"error": f"Could not fetch data for '{ticker}': {str(e)}"}

    if hist.empty or len(hist) < 30:
        return {"error": f"Not enough historical data for '{ticker}'. Check the ticker symbol."}

    # ── Buy-price on or after buy_date ────────────────────────────────────────
    hist.index = pd.to_datetime(hist.index).tz_localize(None)
    future_rows = hist[hist.index >= buy_date]
    if future_rows.empty:
        # buy date in the future; use latest price
        buy_price = float(hist["Close"].iloc[-1])
    else:
        buy_price = float(future_rows["Close"].iloc[0])

    shares_owned = amount / buy_price

    # ── Technical features ────────────────────────────────────────────────────
    close = hist["Close"]
    hist["MA7"]    = close.rolling(7).mean()
    hist["MA21"]   = close.rolling(21).mean()
    hist["MA50"]   = close.rolling(50).mean()
    hist["RSI"]    = compute_rsi(close, 14)
    hist["MACD"]   = close.ewm(span=12).mean() - close.ewm(span=26).mean()
    hist["Signal"] = hist["MACD"].ewm(span=9).mean()
    hist["Hist"]   = hist["MACD"] - hist["Signal"]

    bb_mid = close.rolling(20).mean()
    bb_std = close.rolling(20).std()
    hist["BB_upper"] = bb_mid + 2 * bb_std
    hist["BB_lower"] = bb_mid - 2 * bb_std

    # Daily return momentum
    hist["Return1"] = close.pct_change(1)
    hist["Return5"] = close.pct_change(5)

    # ── Simple linear-trend price projection ─────────────────────────────────
    last_30 = close.tail(30).values
    x = np.arange(len(last_30))
    slope, intercept = np.polyfit(x, last_30, 1)
    last_price = float(close.iloc[-1])

    candidate_days = []
    today = datetime.utcnow().date()

    # Generate next 30 trading-day candidates (Mon–Fri, skip obvious holidays)
    trading_day_count = 0
    check_date = today + timedelta(days=1)
    while trading_day_count < 30:
        if check_date.weekday() < 5:          # Mon–Fri
            projected_offset = len(last_30) + trading_day_count
            projected_price  = intercept + slope * projected_offset

            # Seasonality bump: use the avg return for that weekday
            weekday_returns = hist[hist.index.dayofweek == check_date.weekday()]["Return1"].dropna()
            weekday_factor  = 1 + float(weekday_returns.mean()) if not weekday_returns.empty else 1.0

            projected_price *= weekday_factor

            # ── Scoring: combine multiple signals ─────────────────────────────
            score = 50.0  # neutral baseline

            # Trend: slope positive → higher score
            if slope > 0:
                score += min(15, slope / last_price * 1000)
            else:
                score += max(-15, slope / last_price * 1000)

            # RSI (sell when overbought or approaching overbought)
            rsi_now = float(hist["RSI"].iloc[-1]) if not hist["RSI"].isna().all() else 50
            if rsi_now > 65:
                score += 12
            elif rsi_now > 55:
                score += 6
            elif rsi_now < 35:
                score -= 10

            # MACD histogram positive
            macd_hist_now = float(hist["Hist"].iloc[-1]) if not hist["Hist"].isna().all() else 0
            if macd_hist_now > 0:
                score += 8
            else:
                score -= 5

            # Price near upper Bollinger Band
            bb_upper_now = float(hist["BB_upper"].iloc[-1]) if not hist["BB_upper"].isna().all() else last_price
            if last_price >= bb_upper_now * 0.97:
                score += 10

            # MA crossover bullish
            ma7  = float(hist["MA7"].iloc[-1])  if not hist["MA7"].isna().all()  else last_price
            ma21 = float(hist["MA21"].iloc[-1]) if not hist["MA21"].isna().all() else last_price
            if ma7 > ma21:
                score += 7
            else:
                score -= 4

            # Recency: earlier days slightly penalised (give trend time to develop)
            score -= trading_day_count * 0.3

            # Clamp
            score = max(5, min(95, score))

            candidate_days.append({
                "date": check_date.strftime("%Y-%m-%d"),
                "predicted_price": round(float(projected_price), 4),
                "score": score,
            })
            trading_day_count += 1
        check_date += timedelta(days=1)

    # ── Pick top-5 by score ───────────────────────────────────────────────────
    top5 = sorted(candidate_days, key=lambda d: d["score"], reverse=True)[:5]
    top5 = sorted(top5, key=lambda d: d["date"])   # chronological order

    results = []
    for day in top5:
        pp = day["predicted_price"]
        ret_pct = ((pp - buy_price) / buy_price) * 100
        profit  = (pp - buy_price) * shares_owned

        # Human-readable signal summary
        signals = []
        if slope > 0:
            signals.append("Uptrend detected")
        if rsi_now > 60:
            signals.append(f"RSI overbought ({rsi_now:.1f})")
        if macd_hist_now > 0:
            signals.append("MACD bullish crossover")
        if ma7 > ma21:
            signals.append("MA7 above MA21")
        if not signals:
            signals.append("Moderate momentum")

        results.append({
            "date":               day["date"],
            "predicted_price":    round(pp, 2),
            "confidence_score":   round(day["score"], 1),
            "estimated_return_pct": round(ret_pct, 2),
            "estimated_profit":   round(profit, 2),
            "signal_summary":     " · ".join(signals),
        })

    # ── Info block ────────────────────────────────────────────────────────────
    info = {}
    try:
        raw_info = stock.info
        info = {
            "name":     raw_info.get("longName", ticker),
            "sector":   raw_info.get("sector", "—"),
            "currency": raw_info.get("currency", "USD"),
        }
    except Exception:
        info = {"name": ticker, "sector": "—", "currency": "USD"}

    return {
        "ticker":        ticker,
        "stock_info":    info,
        "buy_date":      buy_date_str,
        "buy_price":     round(buy_price, 2),
        "current_price": round(last_price, 2),
        "amount_invested": round(amount, 2),
        "shares_owned":  round(shares_owned, 4),
        "top5_sell_days": results,
        "disclaimer": (
            "⚠️  These predictions are generated by an algorithmic model and "
            "are NOT financial advice. Stock markets are inherently unpredictable. "
            "Always consult a certified financial advisor before investing. "
            "Invest only what you can afford to lose."
        ),
    }
