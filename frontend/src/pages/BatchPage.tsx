import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

type Person = { id: string; name: string; role: string };

export default function BatchPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedPeople = (location.state?.selectedPeople ?? []) as Person[];
  const [description, setDescription] = useState('');

  const handleSend = () => {
    console.log('Batch send (mock):', { description, to: selectedPeople });
    alert(
      `Mock send:\nTo: ${selectedPeople.map((p) => p.name).join(', ')}\n\nDescription:\n${description}`
    );
    navigate('/people');
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => navigate('/people')}
        className="mb-6 text-blue-600 hover:underline"
      >
        ← Back to People
      </button>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Batch send</h1>

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-2">Sending to ({selectedPeople.length} people)</h2>
        <ul className="text-gray-600 list-disc list-inside">
          {selectedPeople.map((p) => (
            <li key={p.id}>{p.name}</li>
          ))}
        </ul>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <label className="block font-medium text-gray-700 mb-2" htmlFor="batch-desc">
          Description (what to send)
        </label>
        <textarea
          id="batch-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the email or message to send. Gemini will use this to generate and send the email."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows={5}
        />
      </div>

      <button
        type="button"
        onClick={handleSend}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
      >
        Send
      </button>
    </div>
  );
}