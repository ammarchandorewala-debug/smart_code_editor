import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { explainError } from "./errorHelper";

function RunCodePage() {
  const location = useLocation();
  const navigate = useNavigate();

  const code = location.state?.code || "";
  const input = location.state?.input || ""; // ✅ stdin support

  const [output, setOutput] = useState("Running...");
  const [errorData, setErrorData] = useState(null);
  const [runMode, setRunMode] = useState("Executing...");

  useEffect(() => {
    runCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runCode = async () => {
    try {
      // 1. Attempt backend execution via our new Express server
      const response = await fetch("http://localhost:5000/api/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code, input }),
      });

      if (!response.ok) {
        throw new Error("Server execution failed");
      }

      const data = await response.json();
      setOutput(data.output);
      setRunMode("Server Mode (Node.js & MongoDB)");

      if (data.success) {
        setErrorData(null);
      } else {
        setErrorData(explainError(data.output));
      }

      // Save execution run to MongoDB History
      try {
        await fetch("http://localhost:5000/api/history", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code,
            language: "javascript",
            output: data.output,
            success: data.success,
          }),
        });
      } catch (dbErr) {
        console.warn("Could not log execution history to MongoDB:", dbErr.message);
      }

    } catch (err) {
      // 2. Offline Fallback: If backend server is down, run in-browser safely
      console.warn("Backend server offline. Falling back to local browser runner.", err.message);
      setRunMode("Offline Mode (In-Browser Runner)");

      const logs = [];
      const originalLog = console.log;
      const originalError = console.error;
      const originalWarn = console.warn;
      const originalPrompt = window.prompt;

      try {
        console.log = (...args) => {
          logs.push(
            args
              .map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : arg))
              .join(" ")
          );
        };
        console.error = (...args) => {
          logs.push("[ERROR] " + args.join(" "));
        };
        console.warn = (...args) => {
          logs.push("[WARN] " + args.join(" "));
        };

        let inputLines = input ? input.split("\n") : [];
        let inputIndex = 0;
        window.prompt = () => {
          if (inputIndex < inputLines.length) {
            return inputLines[inputIndex++];
          }
          return null;
        };

        // eslint-disable-next-line no-eval
        eval(code);

        setOutput(logs.join("\n") || "No Output");
        setErrorData(null);
      } catch (browserErr) {
        const errorMsg = browserErr.stack || browserErr.toString();
        setOutput(errorMsg);
        setErrorData(explainError(errorMsg));
      } finally {
        console.log = originalLog;
        console.error = originalError;
        console.warn = originalWarn;
        window.prompt = originalPrompt;
      }
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate("/")} style={styles.backButton}>⬅ Back</button>
        <h2>Output Terminal</h2>
        <span
          style={{
            ...styles.badge,
            background: runMode.includes("Server") ? "#2ea44f" : "#d73a49",
          }}
        >
          {runMode}
        </span>
      </div>

      <pre style={styles.output}>{output}</pre>

      {errorData && (
        <div style={styles.errorBox}>
          <h3>🧠 Samjho kya galat hua:</h3>
          <p><b>{errorData.message}</b></p>
          <p>{errorData.explanation}</p>

          <h4>✅ Kaise thik kare:</h4>
          <p>{errorData.fix}</p>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    background: "#1e1e1e",
    color: "#fff",
    height: "100vh",
    padding: "10px",
  },
  header: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
  },
  backButton: {
    padding: "6px 12px",
    background: "#333",
    color: "#fff",
    border: "1px solid #555",
    cursor: "pointer",
    borderRadius: "4px",
  },
  badge: {
    marginLeft: "15px",
    padding: "4px 8px",
    borderRadius: "12px",
    fontSize: "0.85em",
    fontWeight: "bold",
    color: "#fff",
  },
  output: {
    marginTop: "20px",
    background: "#000",
    padding: "15px",
    minHeight: "200px",
  },
  errorBox: {
    marginTop: "20px",
    padding: "15px",
    background: "#2d1e1e",
    border: "1px solid red",
  },
};

export default RunCodePage;