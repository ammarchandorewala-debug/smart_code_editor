import React, { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { useNavigate } from "react-router-dom";

function Firstcodepage() {
  const navigate = useNavigate();

  // 1. Core Editor State
  const [code, setCode] = useState(() => {
    return (
      localStorage.getItem("savedCode") ||
      `// Write JS code\nconsole.log("Hello Ammar");\n`
    );
  });

  // 2. Database & State Integration
  const [snippets, setSnippets] = useState([]);
  const [history, setHistory] = useState([]);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [activeTab, setActiveTab] = useState("snippets"); // "snippets" | "history"

  useEffect(() => {
    localStorage.setItem("savedCode", code);
  }, [code]);

  // Fetch snippets and execution history from MongoDB on mount
  useEffect(() => {
    checkConnectionAndFetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkConnectionAndFetchData = async () => {
    try {
      // Check server health
      const res = await fetch("http://localhost:5000/");
      if (res.ok) {
        setIsBackendConnected(true);
        fetchSnippets();
        fetchHistory();
      } else {
        setIsBackendConnected(false);
      }
    } catch (err) {
      console.warn("Backend server not running. Using offline browser mode.");
      setIsBackendConnected(false);
    }
  };

  const fetchSnippets = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/snippets");
      if (res.ok) {
        const data = await res.json();
        setSnippets(data);
      }
    } catch (err) {
      console.error("Error fetching snippets:", err);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/history");
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error("Error fetching history:", err);
    }
  };

  // 3. Save Code to MongoDB
  const handleSaveSnippet = async () => {
    if (!isBackendConnected) {
      alert("❌ Backend is offline. Connect MongoDB to save code templates!");
      return;
    }

    const title = prompt("Enter snippet title (e.g. 'Bubble Sort'):");
    if (!title) return;

    try {
      const res = await fetch("http://localhost:5000/api/snippets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          code,
          language: "javascript",
          description: "Saved code snippet",
        }),
      });

      if (res.ok) {
        alert("🎉 Code successfully saved to MongoDB database!");
        fetchSnippets();
      } else {
        alert("Failed to save snippet.");
      }
    } catch (err) {
      alert("Error contacting backend: " + err.message);
    }
  };

  // 4. Delete Snippet from DB
  const handleDeleteSnippet = async (id, e) => {
    e.stopPropagation(); // Prevents loading the snippet when clicking delete
    if (!window.confirm("Are you sure you want to delete this snippet?")) return;

    try {
      const res = await fetch(`http://localhost:5000/api/snippets/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchSnippets();
      }
    } catch (err) {
      console.error("Error deleting snippet:", err);
    }
  };

  // 5. Delete History Record
  const handleDeleteHistory = async (id, e) => {
    e.stopPropagation();
    try {
      const res = await fetch(`http://localhost:5000/api/history/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchHistory();
      }
    } catch (err) {
      console.error("Error deleting history:", err);
    }
  };

  // 6. Navigation Actions
  const handleRun = () => {
    navigate("/run", { state: { code } });
  };

  const handleStepRun = () => {
    navigate("/step", { state: { code } });
  };

  const handleFlowchart = () => {
    navigate("/flowchart", { state: { code } });
  };

  return (
    <div style={styles.container}>
      {/* 🚀 Header */}
      <div style={styles.header}>
        <div style={styles.brandBox}>
          <h2 style={styles.brand}>⚡ Studio Editor</h2>
          <span
            style={{
              ...styles.statusIndicator,
              background: isBackendConnected ? "#2ea44f" : "#d73a49",
            }}
          >
            {isBackendConnected ? "● Online (MongoDB)" : "● Offline (Local Runner)"}
          </span>
        </div>

        <div style={styles.btnGroup}>
          <button onClick={handleSaveSnippet} style={styles.saveButton}>
            Save to DB 💾
          </button>
          <div style={styles.divider} />
          <button onClick={handleRun} style={styles.runButton}>
            Run ▶️
          </button>
          <button onClick={handleStepRun} style={styles.stepButton}>
            Step Run 🧠
          </button>
          <button onClick={handleFlowchart} style={styles.flowButton}>
            Flowchart 📊
          </button>
        </div>
      </div>

      {/* 💻 Workspace Layout */}
      <div style={styles.workspace}>
        {/* Left Sidebar: Snippets & History */}
        <div style={styles.sidebar}>
          <div style={styles.sidebarTabs}>
            <button
              onClick={() => setActiveTab("snippets")}
              style={{
                ...styles.tabButton,
                borderBottom:
                  activeTab === "snippets" ? "2px solid #007acc" : "none",
                color: activeTab === "snippets" ? "#fff" : "#888",
              }}
            >
              Saved Snippets 💾
            </button>
            <button
              onClick={() => setActiveTab("history")}
              style={{
                ...styles.tabButton,
                borderBottom:
                  activeTab === "history" ? "2px solid #007acc" : "none",
                color: activeTab === "history" ? "#fff" : "#888",
              }}
            >
              History 📜
            </button>
          </div>

          <div style={styles.sidebarContent}>
            {activeTab === "snippets" ? (
              // Saved Snippets Tab
              snippets.length === 0 ? (
                <div style={styles.emptyText}>
                  {isBackendConnected
                    ? "No saved code. Write some code and click 'Save to DB'!"
                    : "Connect to MongoDB backend to view saved templates."}
                </div>
              ) : (
                snippets.map((snip) => (
                  <div
                    key={snip._id}
                    onClick={() => setCode(snip.code)}
                    style={styles.snippetCard}
                  >
                    <div style={styles.cardHeader}>
                      <span style={styles.cardTitle}>{snip.title}</span>
                      <button
                        onClick={(e) => handleDeleteSnippet(snip._id, e)}
                        style={styles.cardDelete}
                        title="Delete snippet"
                      >
                        🗑️
                      </button>
                    </div>
                    <span style={styles.cardTime}>
                      {new Date(snip.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )
            ) : (
              // Run History Tab
              history.length === 0 ? (
                <div style={styles.emptyText}>
                  No execution history logs yet. Run code to log runs.
                </div>
              ) : (
                history.map((hist) => (
                  <div
                    key={hist._id}
                    onClick={() => setCode(hist.code)}
                    style={styles.historyCard}
                  >
                    <div style={styles.cardHeader}>
                      <span
                        style={{
                          ...styles.historyBadge,
                          background: hist.success ? "#2ea44f" : "#d73a49",
                        }}
                      >
                        {hist.success ? "Success" : "Error"}
                      </span>
                      <button
                        onClick={(e) => handleDeleteHistory(hist._id, e)}
                        style={styles.cardDelete}
                        title="Delete log"
                      >
                        🗑️
                      </button>
                    </div>
                    <pre style={styles.historyPreview}>
                      {hist.output.length > 50
                        ? hist.output.substring(0, 50) + "..."
                        : hist.output}
                    </pre>
                    <span style={styles.cardTime}>
                      {new Date(hist.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              ))}
          </div>
        </div>

        {/* Monaco Editor Container */}
        <div style={styles.editorArea}>
          <Editor
            height="calc(100vh - 60px)"
            defaultLanguage="javascript"
            value={code}
            theme="vs-dark"
            onChange={(value) => setCode(value || "")}
            options={{
              automaticLayout: true,
              fontSize: 14,
              minimap: { enabled: false },
              padding: { top: 10 },
            }}
          />
        </div>
      </div>
    </div>
  );
}

// 🎨 Premium Styling
const styles = {
  container: {
    background: "#1e1e1e",
    color: "#fff",
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 20px",
    height: "60px",
    background: "#181818",
    borderBottom: "1px solid #282828",
  },
  brandBox: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
  },
  brand: {
    margin: 0,
    fontSize: "1.2rem",
    fontWeight: "bold",
    letterSpacing: "0.5px",
    color: "#007acc",
  },
  statusIndicator: {
    fontSize: "0.75rem",
    padding: "3px 8px",
    borderRadius: "10px",
    fontWeight: "600",
    color: "#fff",
    letterSpacing: "0.3px",
  },
  btnGroup: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  divider: {
    width: "1px",
    height: "20px",
    background: "#3c3c3c",
    margin: "0 5px",
  },
  saveButton: {
    padding: "6px 12px",
    background: "transparent",
    color: "#fff",
    border: "1px solid #007acc",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: "500",
    transition: "background 0.2s",
  },
  runButton: {
    padding: "6px 12px",
    background: "#007acc",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: "600",
  },
  stepButton: {
    padding: "6px 12px",
    background: "#333",
    color: "#fff",
    border: "1px solid #555",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.85rem",
  },
  flowButton: {
    padding: "6px 12px",
    background: "#333",
    color: "#fff",
    border: "1px solid #555",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.85rem",
  },
  workspace: {
    display: "flex",
    flex: 1,
    height: "calc(100vh - 60px)",
  },
  sidebar: {
    width: "280px",
    background: "#252526",
    borderRight: "1px solid #282828",
    display: "flex",
    flexDirection: "column",
  },
  sidebarTabs: {
    display: "flex",
    borderBottom: "1px solid #3c3c3c",
    height: "40px",
  },
  tabButton: {
    flex: 1,
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: "600",
    transition: "all 0.2s",
  },
  sidebarContent: {
    flex: 1,
    overflowY: "auto",
    padding: "15px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  emptyText: {
    color: "#888",
    fontSize: "0.8rem",
    textAlign: "center",
    marginTop: "20px",
    lineHeight: "1.4",
  },
  snippetCard: {
    background: "#1e1e1e",
    border: "1px solid #3c3c3c",
    borderRadius: "6px",
    padding: "10px",
    cursor: "pointer",
    transition: "transform 0.15s, border-color 0.15s",
  },
  historyCard: {
    background: "#1e1e1e",
    border: "1px solid #3c3c3c",
    borderRadius: "6px",
    padding: "10px",
    cursor: "pointer",
    transition: "transform 0.15s, border-color 0.15s",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "5px",
  },
  cardTitle: {
    fontWeight: "600",
    fontSize: "0.85rem",
    color: "#e1e1e1",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "180px",
  },
  historyBadge: {
    fontSize: "0.7rem",
    padding: "2px 6px",
    borderRadius: "4px",
    color: "#fff",
    fontWeight: "bold",
  },
  historyPreview: {
    margin: "5px 0",
    fontSize: "0.75rem",
    color: "#aaa",
    background: "#151515",
    padding: "4px",
    borderRadius: "4px",
    fontFamily: "monospace",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  cardTime: {
    fontSize: "0.7rem",
    color: "#777",
  },
  cardDelete: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: "0.85rem",
    padding: "2px 4px",
    borderRadius: "3px",
  },
  editorArea: {
    flex: 1,
    background: "#1e1e1e",
  },
};

export default Firstcodepage;