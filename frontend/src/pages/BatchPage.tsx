import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

type Person = { id: string; name: string; role: string; email: string };

export default function BatchPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedPeople = (location.state?.selectedPeople ?? []) as Person[];
  const [description, setDescription] = useState("Please verify your account immediately.");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!description.trim()) {
      alert("Please enter an email description");
      return;
    }

    setSending(true);
    
    try {
      console.log("Sending batch request:", {
        recipients: selectedPeople,
        description
      });

      const response = await fetch("http://localhost:8000/api/email/campaign/batch", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          recipients: selectedPeople, 
          description 
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      alert(`✅ Successfully sent ${data.count} emails (${data.failed} failed)`);
      navigate("/people");
    } catch (error) {
      console.error("Failed to send batch emails:", error);
      alert(`❌ Failed to send emails: ${error}`);
    } finally {
      setSending(false);
    }
  };

  if (selectedPeople.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">No people selected</h1>
        <button 
          onClick={() => navigate("/people")}
          className="text-blue-600 hover:underline"
        >
          ← Back to People
        </button>
      </div>
    );
  }

  return (
    <div>
      <button 
        onClick={() => navigate("/people")} 
        className="mb-6 text-blue-600 hover:underline"
      >
        ← Back to People
      </button>
      
      <h1 className="text-2xl font-bold mb-6">Batch Send Campaign</h1>

      <div className="bg-white rounded-lg border p-6 mb-6">
        <h2 className="font-semibold mb-4">
          Sending to {selectedPeople.length} {selectedPeople.length === 1 ? 'person' : 'people'}
        </h2>
        <ul className="space-y-2">
          {selectedPeople.map((p) => (
            <li key={p.id} className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              <span className="font-medium">{p.name}</span>
              <span className="text-slate-500">({p.email})</span>
              <span className="text-xs bg-slate-100 px-2 py-1 rounded">{p.role}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white rounded-lg border p-6 mb-6">
        <label className="block font-medium mb-2">
          Email Message
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={5}
          placeholder="Enter the phishing email message..."
        />
        <p className="text-sm text-slate-500 mt-2">
          This will be sent as the body of the phishing simulation email.
        </p>
      </div>

      <button
        onClick={handleSend}
        disabled={sending}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {sending ? "Sending..." : `Send to ${selectedPeople.length} ${selectedPeople.length === 1 ? 'person' : 'people'}`}
      </button>
    </div>
  );
}