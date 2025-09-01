import { useState } from "react";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker?url";
GlobalWorkerOptions.workerSrc = pdfWorker;

function App() {
  const [resumeText, setResumeText] = useState("");
  const [advice, setAdvice] = useState([]);
  const [loading, setLoading] = useState(false);
  const [textReady, setTextReady] = useState(false);

  // Multilingual resume keywords
  const resumeKeywords = [
    // English
    "experience", "education", "skills", "projects", "certifications", "summary", "contact",
    // French
    "expérience", "formation", "compétences", "projets", "certifications", "résumé", "contact",
    // Italian
    "esperienza", "istruzione", "competenze", "progetti", "certificazioni", "contatti", "profilo",
    // German
    "erfahrung", "bildung", "fähigkeiten", "projekte", "zertifikate", "kontakt", "lebenslauf",
    // Spanish
    "experiencia", "educación", "habilidades", "proyectos", "certificaciones", "contacto", "perfil",
  ];

  // Check if text looks like a resume
  const isResume = (text) => {
    const lower = text.toLowerCase();
    const matches = resumeKeywords.filter((k) => lower.includes(k));
    return matches.length >= 3; // at least 3 keywords match
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setTextReady(false);
    setAdvice([]);
    const reader = new FileReader();

    reader.onload = async function () {
      try {
        const typedArray = new Uint8Array(this.result);
        const pdf = await getDocument({ data: typedArray }).promise;
        let text = "";

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map((item) => item.str).join(" ") + "\n";
        }

        setResumeText(text.trim());
        setTextReady(true);

        if (!isResume(text)) {
          alert("⚠️ This PDF does not seem to be a resume.");
        }
      } catch (err) {
        console.error("❌ Error reading PDF:", err);
        alert("Failed to read the PDF file.");
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleSubmit = async () => {
    if (!resumeText || !textReady) {
      alert("Please upload your resume first!");
      return;
    }

    if (!isResume(resumeText)) {
      alert("⚠️ This PDF does not seem to be a resume.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume: resumeText }),
      });

      const data = await response.json();
      setAdvice(data.advice || ["No advice returned."]);
    } catch (err) {
      console.error(err);
      setAdvice(["❌ Error connecting to backend."]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <h1 className="text-xl font-bold">🚀 CVBoost</h1>
      </header>

      <main className="max-w-3xl mx-auto p-6">
        <h2 className="text-2xl font-semibold mb-4">Upload Your Resume</h2>

        <div className="bg-white shadow-md rounded-xl p-6">
          <input
            type="file"
            accept="application/pdf"
            onChange={handlePdfUpload}
            className="mb-4"
          />

          <button
            onClick={handleSubmit}
            disabled={!resumeText || loading || !textReady || !isResume(resumeText)}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "⏳ Analyzing..." : "Analyze Resume"}
          </button>
        </div>

        {textReady && (
          <div className="mt-6 bg-gray-100 p-4 rounded-lg text-sm text-gray-700 max-h-48 overflow-y-auto">
            <strong>📄 Extracted Text Preview:</strong>
            <p className="mt-2 whitespace-pre-line">{resumeText.slice(0, 500)}...</p>
          </div>
        )}

        {advice.length > 0 && (
          <div className="mt-6 bg-white shadow-md rounded-xl p-6">
            <h3 className="text-lg font-bold mb-3">💡 Advice:</h3>
            <ul className="list-disc list-inside space-y-2">
              {advice.map((item, index) => (
                <li key={index} className="text-gray-700">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
