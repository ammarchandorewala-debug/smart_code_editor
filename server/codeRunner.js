const vm = require("vm");

/**
 * Runs JavaScript/Node.js code in a sandboxed VM context.
 * Supports execution timeout and console log redirection.
 * @param {string} code - The code to run.
 * @param {string} input - The stdin string (simulated via mocking prompt()).
 * @returns {object} { success: boolean, output: string }
 */
function runJavaScript(code, input = "") {
  const logs = [];
  const inputLines = input ? input.split("\n") : [];
  let inputIndex = 0;

  // Custom sandboxed global context
  const sandbox = {
    console: {
      log: (...args) => {
        logs.push(
          args
            .map((arg) => (typeof arg === "object" ? JSON.stringify(arg) : arg))
            .join(" ")
        );
      },
      error: (...args) => {
        logs.push("[ERROR] " + args.join(" "));
      },
      warn: (...args) => {
        logs.push("[WARN] " + args.join(" "));
      },
    },
    // Mock global prompt() to simulate standard input (stdin)
    prompt: () => {
      if (inputIndex < inputLines.length) {
        return inputLines[inputIndex++];
      }
      return null;
    },
    // Make standard helper functions available in the sandbox
    setTimeout: (cb, delay) => cb(), // Run sync inside vm
    setInterval: (cb, delay) => cb(), // Run sync inside vm
  };

  try {
    const context = vm.createContext(sandbox);

    // Run the code with a 3-second timeout to prevent infinite loop crashes
    vm.runInNewContext(code, context, { timeout: 3000 });

    return {
      success: true,
      output: logs.join("\n") || "No Output",
    };
  } catch (error) {
    if (error.code === "ERR_SCRIPT_EXECUTION_TIMEOUT") {
      return {
        success: false,
        output: logs.join("\n") + "\n[ERROR] Time Limit Exceeded: Script execution timed out (limit: 3 seconds). Check for infinite loops!",
      };
    }
    return {
      success: false,
      output: logs.join("\n") + "\n" + (error.stack || error.toString()),
    };
  }
}

module.exports = {
  runJavaScript,
};
