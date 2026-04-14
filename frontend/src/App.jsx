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
  const [summary1, setSummary1] = useState(null);
  const [summary2, setSummary2] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch companies
  useEffect(() => {
    axios.get("http://127.0.0.1:8000/companies")
      .then(res => setCompanies(res.data.companies))
      .catch(() => setError("⚠️ Failed to load companies"));
  }, []);

  // Fetch stock data
  const fetchData = async (symbol1, symbol2 = null) => {
    if (!symbol1) return;

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

      // % Change stock1
      const latest1 = data1[data1.length - 1][closeKey];
      const previous1 = data1[data1.length - 2][closeKey];
      const percentChange1 = (((latest1 - previous1) / previous1) * 100).toFixed(2);

      const dataset = [
        {
          label: symbol1,
          data: data1.map(item => item[closeKey]),
          borderWidth: 2,
        }
      ];

      setSummary1(prev => ({
        ...prev,
        percent_change: percentChange1
      }));

      if (symbol2) {
        const res2 = await axios.get(`http://127.0.0.1:8000/data/${symbol2}`);
        const data2 = res2.data;

        const closeKey2 = Object.keys(data2[0]).find(k => k.includes("Close"));

        dataset.push({
          label: symbol2,
          data: data2.map(item => item[closeKey2]),
          borderWidth: 2,
        });

        // % Change stock2
        const latest2 = data2[data2.length - 1][closeKey2];
        const previous2 = data2[data2.length - 2][closeKey2];
        const percentChange2 = (((latest2 - previous2) / previous2) * 100).toFixed(2);

        setSummary2(prev => ({
          ...prev,
          percent_change: percentChange2
        }));
      }

      setChartData({
        labels,
        datasets: dataset,
      });

    } catch (err) {
      console.error(err);
      setError("⚠️ Failed to fetch stock data.");
      setChartData(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch summary
  const fetchSummary = async (symbol, type) => {
    try {
      const res = await axios.get(`http://127.0.0.1:8000/summary/${symbol}`);

      if (type === "stock1") {
        setSummary1(res.data);
      } else {
        setSummary2(res.data);
      }

    } catch (err) {
      console.error(err);
      setError("⚠️ Failed to fetch summary.");
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
              fetchSummary(s, "stock1");
            }}
          >
            <option value="">Select Stock 1</option>
            {companies.map((c, i) => (
              <option key={i} value={c.symbol}>{c.name}</option>
            ))}
          </select>

          <select
            disabled={loading}
            onChange={(e) => {
              const s = e.target.value;

              if (!s) {
                // reset stock2
                setStock2(null);
                setSummary2(null);
                if (stock1) fetchData(stock1);
                return;
              }

              setStock2(s);
              if (stock1) fetchData(stock1, s);
              fetchSummary(s, "stock2");
            }}
          >
            <option value="">None</option>
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
        {summary1 && (
          <div style={{
            marginTop: "20px",
            padding: "15px",
            background: "#f0f4f8",
            borderRadius: "8px"
          }}>
            <h3>📌 Comparison Summary</h3>

            <table style={{ width: "100%", marginTop: "10px", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th></th>
                  <th>{stock1}</th>
                  {stock2 && summary2 && <th>{stock2}</th>}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><b>52W High</b></td>
                  <td>{summary1["52_week_high"]}</td>
                  {stock2 && summary2 && <td>{summary2["52_week_high"]}</td>}
                </tr>

                <tr>
                  <td><b>52W Low</b></td>
                  <td>{summary1["52_week_low"]}</td>
                  {stock2 && summary2 && <td>{summary2["52_week_low"]}</td>}
                </tr>

                <tr>
                  <td><b>Avg Close</b></td>
                  <td>{summary1["average_close"]}</td>
                  {stock2 && summary2 && <td>{summary2["average_close"]}</td>}
                </tr>

                <tr>
                  <td><b>Daily Change</b></td>

                  <td style={{
                    color: summary1?.percent_change >= 0 ? "green" : "red"
                  }}>
                    {summary1?.percent_change ? summary1.percent_change + "%" : "-"}
                  </td>

                  {stock2 && summary2 && (
                    <td style={{
                      color: summary2?.percent_change >= 0 ? "green" : "red"
                    }}>
                      {summary2?.percent_change ? summary2.percent_change + "%" : "-"}
                    </td>
                  )}
                </tr>
              </tbody>
            </table>
          </div>
        )}

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