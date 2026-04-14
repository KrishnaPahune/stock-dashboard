import { useEffect, useState } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Legend,
} from "chart.js";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Legend);

function App() {
  const [companies, setCompanies] = useState([]);
  const [stock1, setStock1] = useState(null);
  const [stock2, setStock2] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch companies
  useEffect(() => {
    axios.get("http://127.0.0.1:8000/companies")
      .then(res => setCompanies(res.data.companies))
      .catch(() => setError("⚠️ Failed to load companies"));
  }, []);

  // Fetch and compare data
  const fetchData = async (symbol1, symbol2 = null) => {
    try {
      setLoading(true);
      setError(null);

      const res1 = await axios.get(`http://127.0.0.1:8000/data/${symbol1}`);
      const data1 = res1.data;

      if (!data1 || data1.length < 2) {
        throw new Error("Not enough data");
      }

      const labels = data1.map(item => item.Date);
      const closeKey = Object.keys(data1[0]).find(k => k.includes("Close"));

      // 🔥 % Change calculation
      const latest = data1[data1.length - 1][closeKey];
      const previous = data1[data1.length - 2][closeKey];
      const percentChange = (((latest - previous) / previous) * 100).toFixed(2);

      const dataset = [
        {
          label: symbol1,
          data: data1.map(item => item[closeKey]),
          borderWidth: 2,
        }
      ];

      if (symbol2) {
        const res2 = await axios.get(`http://127.0.0.1:8000/data/${symbol2}`);
        const data2 = res2.data;

        const closeKey2 = Object.keys(data2[0]).find(k => k.includes("Close"));

        dataset.push({
          label: symbol2,
          data: data2.map(item => item[closeKey2]),
          borderWidth: 2,
        });
      }

      setChartData({
        labels,
        datasets: dataset,
      });

      // Merge summary + % change
      setSummary(prev => ({
        ...prev,
        percent_change: percentChange
      }));

    } catch (err) {
      console.error(err);
      setError("⚠️ Failed to fetch stock data.");
      setChartData(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch summary
  const fetchSummary = async (symbol) => {
    try {
      const res = await axios.get(`http://127.0.0.1:8000/summary/${symbol}`);
      setSummary(res.data);
    } catch (err) {
      console.error(err);
      setError("⚠️ Failed to fetch summary.");
      setSummary(null);
    }
  };

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      padding: "30px",
      fontFamily: "Arial",
      background: "#f5f7fa",
      minHeight: "100vh"
    }}>
      <div style={{
        width: "800px",
        background: "white",
        padding: "20px",
        borderRadius: "10px",
        boxShadow: "0 4px 10px rgba(0,0,0,0.1)"
      }}>
        {/* 🔥 Title */}
        <h1 style={{ textAlign: "center" }}>
          📊 Stock Intelligence Dashboard
        </h1>
        <p style={{ textAlign: "center", color: "gray" }}>
          Analyze • Compare • Visualize Market Trends
        </p>

        {/* Dropdowns */}
        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
          <select
            disabled={loading}
            onChange={(e) => {
              const s = e.target.value;
              setStock1(s);
              fetchData(s, stock2);
              fetchSummary(s);
            }}
          >
            <option>Select Stock 1</option>
            {companies.map((c, i) => (
              <option key={i} value={c.symbol}>{c.name}</option>
            ))}
          </select>

          <select
            disabled={loading}
            onChange={(e) => {
              const s = e.target.value;
              setStock2(s);
              if (stock1) fetchData(stock1, s);
            }}
          >
            <option>Select Stock 2 (optional)</option>
            {companies.map((c, i) => (
              <option key={i} value={c.symbol}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Error */}
        {error && (
          <p style={{ color: "red", marginTop: "15px" }}>
            {error}
          </p>
        )}

        {/* Loading */}
        {loading && <p style={{ marginTop: "20px" }}>Loading data...</p>}

        {/* Chart */}
        <div style={{ marginTop: "30px" }}>
          {chartData && !loading && <Line data={chartData} />}
        </div>

        {/* Summary */}
        {summary && (
          <div style={{
            marginTop: "20px",
            padding: "15px",
            background: "#f0f4f8",
            borderRadius: "8px"
          }}>
            <h3>📌 Summary</h3>
            <p>52 Week High: {summary["52_week_high"]}</p>
            <p>52 Week Low: {summary["52_week_low"]}</p>
            <p>Average Close: {summary["average_close"]}</p>

            {/* 🔥 % Change */}
            {summary.percent_change && (
              <p>
                Daily Change:
                <span style={{
                  color: summary.percent_change >= 0 ? "green" : "red",
                  marginLeft: "5px"
                }}>
                  {summary.percent_change}%
                </span>
              </p>
            )}
          </div>
        )}

        {/* 🔥 Footer */}
        <p style={{
          textAlign: "center",
          marginTop: "30px",
          fontSize: "12px",
          color: "gray"
        }}>
          Built by Krishna • Powered by FastAPI & React
        </p>
      </div>
    </div>
  );
}

export default App;