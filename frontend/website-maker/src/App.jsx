import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const placeholderHtml = `
<div class="container">
  <div class="content">
    <div class="logo">⚡️</div>
    <h1>Your Creation Awaits</h1>
    <p>Describe the website you want to build in the prompt above, and watch the magic happen here.</p>
  </div>
</div>
`;

const placeholderCss = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');

body {
  margin: 0;
  font-family: 'Inter', sans-serif;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f4f8, #d9e2ec);
  color: #334155;
}

.container {
  text-align: center;
  padding: 2rem;
}

.content {
  max-width: 500px;
  margin: auto;
}

.logo {
  font-size: 4rem;
  line-height: 1;
  margin-bottom: 1rem;
  filter: drop-shadow(0 4px 10px rgba(59, 130, 246, 0.4));
}

h1 {
  font-weight: 900;
  font-size: 2.5rem;
  letter-spacing: -0.05em;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

p {
  font-size: 1rem;
  color: #475569;
  line-height: 1.6;
}

.error-container {
  padding: 2rem;
  text-align: center;
  color: #b91c1c;
}
.error-container h2 {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}
`;


export default function App() {
  const [prompt, setPrompt] = useState("");
  const [html, setHtml] = useState(placeholderHtml);
  const [css, setCss] = useState(placeholderCss);
  const [js, setJs] = useState("");
  const [loading, setLoading] = useState(false); // generate website
  const [deploying, setDeploying] = useState(false); // deploy site
  const [activeTab, setActiveTab] = useState("html");
  const [deployUrl, setDeployUrl] = useState("");
  const [showModal, setShowModal] = useState(false);
  const textareaRef = useRef(null);
  const editorTextareaRef = useRef(null);
  const editorContainerRef = useRef(null);

  // Auto-resize the prompt textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [prompt]);

  // Auto-resize and auto-scroll the editor textarea
  useEffect(() => {
    const editor = editorTextareaRef.current;
    const container = editorContainerRef.current;
    if (editor && container) {
        // 1. Resize textarea to fit content
        editor.style.height = 'auto';
        editor.style.height = `${editor.scrollHeight}px`;
        
        // 2. Scroll container to the bottom if loading
        if (loading) {
            container.scrollTop = container.scrollHeight;
        }
    }
  }, [html, css, js, loading]);


  // srcDoc updates live
  const srcDoc = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <style>${css}</style>
      </head>
      <body>
        ${html}
        <script>${js}<\/script>
      </body>
    </html>
  `;

  // 🔹 Generate website
  const generateSite = async () => {
    if (!prompt.trim()) return;
    setLoading(true);

    try {
      const res = await fetch("http://localhost:4000/generate-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        throw new Error(`Network response was not ok: ${res.statusText}`);
      }

      const data = await res.json();
      
      // Directly set the content without streaming
      setHtml(data.html || "");
      setCss(data.css || "");
      setJs(data.js || "");
      setActiveTab("html"); // Reset to HTML tab

    } catch (err) {
      console.error("Error generating site:", err);
      setCss(placeholderCss); // Ensure some styles are present for the error
      setHtml(`<div class="error-container"><h2>An error occurred</h2><p>${err.message}. Please check the console for more details.</p></div>`);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Download ZIP
  const downloadZip = async () => {
    // Dynamically load JSZip and FileSaver from CDN if not already available
    const loadScript = (src) => {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                return resolve();
            }
            const script = document.createElement("script");
            script.src = src;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Script load error for ${src}`));
            document.head.appendChild(script);
        });
    };

    try {
        await Promise.all([
            loadScript("https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"),
            loadScript("https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js")
        ]);

        const zip = new window.JSZip();
        zip.file("index.html", srcDoc);
        zip.file("style.css", css);
        zip.file("script.js", js);
        zip.generateAsync({ type: "blob" }).then((content) => {
          window.saveAs(content, "bolt-site.zip");
        });
    } catch (error) {
        console.error("Failed to load scripts for download:", error);
    }
  };

  // 🔹 Deploy website
  const deploySite = async () => {
    setDeploying(true);
    try {
      const res = await fetch("http://localhost:4000/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          "index.html": srcDoc,
          "style.css": css,
          "script.js": js,
        }),
      });
      const data = await res.json();
      setDeployUrl(data.url);
      setShowModal(true);
    } catch (err) {
      console.error("Error deploying site:", err);
    } finally {
      setDeploying(false);
    }
  };

  // Enhanced Loader Component
  const LoaderOverlay = ({ text }) => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{
        background: 'radial-gradient(ellipse at center, rgba(15, 23, 42, 0.95) 0%, rgba(0, 0, 0, 0.98) 70%)'
      }}
    >
      {/* Animated Background Grid */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(56, 189, 248, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(56, 189, 248, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }} />
      </div>
      
      {/* Central Loader */}
      <div className="relative z-10 flex flex-col items-center">
        <div className="relative mb-8">
          {/* Outer Ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
            className="w-24 h-24 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full"
          />
          {/* Inner Ring */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            className="absolute inset-2 w-20 h-20 border-2 border-blue-500/40 border-b-blue-400 rounded-full"
          />
          {/* Core */}
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="absolute inset-6 w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full shadow-lg shadow-cyan-500/50"
          />
        </div>
        
        <motion.p 
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 tracking-wide"
        >
          {text}
        </motion.p>
        
        {/* Pulse dots */}
        <div className="flex space-x-2 mt-4">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
              className="w-2 h-2 bg-cyan-400 rounded-full"
            />
          ))}
        </div>
      </div>
      
      {/* Floating particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-cyan-400/60 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: 3 + Math.random() * 2,
            delay: Math.random() * 2,
          }}
        />
      ))}
    </motion.div>
  );

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-white font-mono relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900/20 to-cyan-900/30" />
        <div className="absolute inset-0" style={{
          backgroundImage: `
            radial-gradient(circle at 25% 25%, rgba(56, 189, 248, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)
          `
        }} />
      </div>
      
      {/* Grid Overlay */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `
          linear-gradient(rgba(56, 189, 248, 0.5) 1px, transparent 1px),
          linear-gradient(90deg, rgba(56, 189, 248, 0.5) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px'
      }} />

      {/* Enhanced Navbar */}
      <motion.nav 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-10 px-8 py-6 flex justify-between items-center backdrop-blur-xl bg-slate-900/70 border-b border-cyan-500/20"
      >
        <div className="flex items-center space-x-4">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg shadow-lg shadow-cyan-500/30"
          />
          <h1 className="text-3xl font-black tracking-tight">
            <span className="text-white">Gaurav's </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600">
              Bolt
            </span>
          </h1>
          <div className="h-6 w-px bg-cyan-500/30 mx-4" />
          <span className="text-xs text-cyan-400 font-semibold tracking-wider uppercase">
            AI Website Builder
          </span>
        </div>
        
        <motion.button 
          whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(56, 189, 248, 0.3)" }}
          whileTap={{ scale: 0.95 }}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-blue-600 text-white font-bold tracking-wide shadow-lg hover:shadow-cyan-500/30 transition-all duration-300 border border-cyan-400/20"
        >
          <span className="flex items-center space-x-2">
            <span>⚡</span>
            <span>New Project</span>
          </span>
        </motion.button>
      </motion.nav>

      {/* Enhanced Prompt Section */}
      <motion.div 
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="relative z-10 p-8 border-b border-cyan-500/20 backdrop-blur-sm bg-slate-900/20"
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex items-start gap-4">
            {/* The input is now a textarea that resizes automatically */}
            <motion.textarea
              ref={textareaRef}
              whileFocus={{ scale: 1.01 }}
              className="w-full flex-grow bg-slate-800/80 backdrop-blur-md border border-cyan-500/30 rounded-2xl p-6 text-white placeholder-slate-400 shadow-inner shadow-cyan-500/10 focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 outline-none text-lg font-medium transition-all duration-300 resize-none overflow-hidden min-h-[72px]"
              placeholder="⚡ Describe your next revolutionary website..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={1}
            />
            <motion.button
              onClick={generateSite}
              disabled={loading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex-shrink-0 px-8 h-[72px] flex items-center justify-center rounded-2xl bg-black text-sky-400 border-2 border-sky-500/50 shadow-lg hover:bg-sky-400 hover:text-black hover:shadow-sky-400/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-bold tracking-wide"
            >
              {loading ? (
                <span className="flex items-center space-x-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                  />
                  <span>Building...</span>
                </span>
              ) : (
                <span className="flex items-center space-x-2">
                  <span>🚀</span>
                  <span>Build with AI</span>
                </span>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Enhanced Workspace */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 p-8 relative z-10 overflow-hidden">
        {/* Enhanced Editor */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col backdrop-blur-xl bg-slate-900/60 rounded-3xl shadow-2xl shadow-cyan-500/10 border border-cyan-500/20 overflow-hidden"
        >
          <div className="flex border-b border-cyan-500/20 bg-slate-800/50">
            {["html", "css", "js"].map((tab) => (
              <motion.button
                key={tab}
                onClick={() => setActiveTab(tab)}
                whileHover={{ y: -2 }}
                whileTap={{ y: 0 }}
                className={`flex-1 py-4 text-sm font-bold tracking-wider uppercase transition-all duration-300 relative overflow-hidden ${
                  activeTab === tab
                    ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 shadow-inner"
                    : "text-slate-400 hover:text-cyan-400 hover:bg-slate-800/50"
                }`}
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 to-blue-500"
                    transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                  />
                )}
                {tab.toUpperCase()}
              </motion.button>
            ))}
          </div>
          
          <div ref={editorContainerRef} className="flex-1 relative overflow-auto">
            <textarea
              ref={editorTextareaRef}
              className="w-full min-h-full p-6 font-mono text-sm bg-transparent text-cyan-100 focus:outline-none resize-none leading-relaxed"
              value={activeTab === "html" ? html : activeTab === "css" ? css : js}
              onChange={(e) =>
                activeTab === "html"
                  ? setHtml(e.target.value)
                  : activeTab === "css"
                  ? setCss(e.target.value)
                  : setJs(e.target.value)
              }
              placeholder={`Enter your ${activeTab.toUpperCase()} code here...`}
            />
            <div className="absolute top-4 right-4 text-xs text-slate-500 font-mono">
              {activeTab === "html" ? html.length : activeTab === "css" ? css.length : js.length} chars
            </div>
          </div>
        </motion.div>

        {/* Enhanced Preview */}
        <motion.div
          key={srcDoc}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="backdrop-blur-xl bg-slate-900/60 rounded-3xl shadow-2xl shadow-cyan-500/10 border border-cyan-500/20 overflow-hidden relative"
        >
          <div className="h-12 bg-slate-800/50 border-b border-cyan-500/20 flex items-center justify-between px-6">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <span className="text-xs text-slate-400 font-mono tracking-wider">LIVE PREVIEW</span>
          </div>
          
          <iframe
            title="preview"
            className="w-full h-[calc(100%-3rem)] bg-white"
            sandbox="allow-scripts"
            srcDoc={srcDoc}
          />
          
        </motion.div>
      </div>

      {/* Enhanced Footer */}
      <motion.footer 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="relative z-10 px-8 py-6 flex flex-col sm:flex-row justify-between items-center backdrop-blur-xl bg-slate-900/70 border-t border-cyan-500/20 gap-4 sm:gap-0"
      >
        <motion.button
          onClick={downloadZip}
          whileHover={{ scale: 1.05, boxShadow: "0 5px 15px rgba(56, 189, 248, 0.2)" }}
          whileTap={{ scale: 0.95 }}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-800/80 border border-cyan-500/30 text-cyan-300 hover:bg-slate-700/80 transition-all duration-300 font-semibold tracking-wide"
        >
          <span className="flex items-center space-x-2">
            <span>⬇️</span>
            <span>Download ZIP</span>
          </span>
        </motion.button>
        
        <motion.button
          onClick={deploySite}
          whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(16, 185, 129, 0.3)" }}
          whileTap={{ scale: 0.95 }}
          className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg hover:shadow-emerald-500/30 transition-all duration-300 font-bold tracking-wide"
        >
          <span className="flex items-center space-x-2">
            <span>🌍</span>
            <span>Deploy Live</span>
          </span>
        </motion.button>
      </motion.footer>

      {/* Enhanced Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, rotateX: -15 }}
              animate={{ scale: 1, opacity: 1, rotateX: 0 }}
              exit={{ scale: 0.8, opacity: 0, rotateX: 15 }}
              transition={{ type: "spring", bounce: 0.4, duration: 0.6 }}
              className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl lg:rounded-3xl shadow-2xl max-w-sm sm:max-w-lg w-full p-6 sm:p-8 text-center border border-cyan-500/20"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", bounce: 0.6 }}
                className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg shadow-emerald-500/30"
              >
                <span className="text-xl sm:text-2xl">🚀</span>
              </motion.div>
              
              <h2 className="text-lg sm:text-2xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">
                Deployment Successful!
              </h2>
              <p className="text-slate-400 mb-4 sm:mb-6 text-sm sm:text-base">Your website is now live and accessible worldwide</p>
              
              <div className="bg-slate-800/50 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 border border-cyan-500/20">
                <a
                  href={deployUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-cyan-400 font-mono text-xs sm:text-sm underline hover:text-cyan-300 transition-colors break-all"
                >
                  {deployUrl}
                </a>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <motion.button
                  onClick={() => navigator.clipboard.writeText(deployUrl)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto px-4 sm:px-6 py-3 rounded-xl bg-cyan-600 text-white hover:bg-cyan-700 transition-all duration-300 font-semibold text-sm sm:text-base"
                >
                  📋 Copy Link
                </motion.button>
                <motion.button
                  onClick={() => setShowModal(false)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto px-4 sm:px-6 py-3 rounded-xl bg-slate-700 text-slate-300 hover:bg-slate-600 transition-all duration-300 font-semibold text-sm sm:text-base"
                >
                  Close
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Loader Overlays */}
      <AnimatePresence>
        {loading && <LoaderOverlay text="✨ Generating your website..." />}
        {deploying && <LoaderOverlay text="🌍 Deploying to the cloud..." />}
      </AnimatePresence>
    </div>
  );
}

