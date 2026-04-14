from fastapi import APIRouter, HTTPException
from app.services.stock_service import get_stock_data, get_summary, compare_stocks


router = APIRouter()

COMPANIES = [
    {"symbol": "INFY.NS", "name": "Infosys"},
    {"symbol": "TCS.NS", "name": "Tata Consultancy Services"},
    {"symbol": "RELIANCE.NS", "name": "Reliance Industries"},
    {"symbol": "HDFCBANK.NS", "name": "HDFC Bank"}
]
@router.get("/data/{symbol}")
def get_data(symbol: str):
    df = get_stock_data(symbol)

    if df is None or df.empty:
        raise HTTPException(status_code=404, detail="No data found")

    df = df.tail(30)

    # Clean for JSON
    df = df.fillna(0)
    df['Date'] = df['Date'].astype(str)

    return df.to_dict(orient="records")

@router.get("/companies")
def get_companies():
    return {"companies": COMPANIES}

@router.get("/summary/{symbol}")
def summary(symbol: str):
    data = get_summary(symbol)

    if data is None:
        raise HTTPException(status_code=404, detail="No data found")

    return data

@router.get("/compare")
def compare(symbol1: str, symbol2: str):
    data = compare_stocks(symbol1, symbol2)

    if data is None:
        raise HTTPException(status_code=404, detail="Invalid symbols")

    return data
