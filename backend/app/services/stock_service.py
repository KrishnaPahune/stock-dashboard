import yfinance as yf
import pandas as pd

def get_stock_data(symbol: str):
    df = yf.download(symbol, period="60d", interval="1d")

    if df.empty:
        return None

    # Flatten columns if multi-index
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = [' '.join(col).strip() for col in df.columns.values]

    df.reset_index(inplace=True)

    # 🔥 Dynamically find correct columns
    close_col = [col for col in df.columns if "Close" in col][0]
    open_col = [col for col in df.columns if "Open" in col][0]

    # Metrics
    df['Daily Return'] = (df[close_col] - df[open_col]) / df[open_col]
    df['7 Day MA'] = df[close_col].rolling(window=7).mean()

    return df

def get_summary(symbol: str):
    df = yf.download(symbol, period="1y")

    if df.empty:
        return None

    # Flatten columns
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = [' '.join(col).strip() for col in df.columns.values]

    # Dynamic column detection
    close_col = [col for col in df.columns if "Close" in col][0]
    high_col = [col for col in df.columns if "High" in col][0]
    low_col = [col for col in df.columns if "Low" in col][0]

    return {
        "52_week_high": float(df[high_col].max()),
        "52_week_low": float(df[low_col].min()),
        "average_close": float(df[close_col].mean())
    }
    
def compare_stocks(symbol1: str, symbol2: str):
    df1 = get_stock_data(symbol1)
    df2 = get_stock_data(symbol2)

    if df1 is None or df2 is None:
        return None

    return {
        "symbol1_last_close": float(df1.iloc[-1].filter(like="Close").values[0]),
        "symbol2_last_close": float(df2.iloc[-1].filter(like="Close").values[0])
    }