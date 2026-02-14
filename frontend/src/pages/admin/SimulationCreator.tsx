import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

type SimulationType = 'email' | 'phone';

const SimulationCreator: React.FC = () => {
  const navigate = useNavigate();
  const [simulationType, setSimulationType] = useState<SimulationType>('email');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    emailSubject: '',
    emailBody: '',
    senderEmail: '',
    senderName: '',
    phoneScript: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Creating simulation:', { simulationType, ...formData });
    navigate('/admin/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Create Phishing Simulation</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Simulation Type</label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setSimulationType('email')}
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition ${
                  simulationType === 'email' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                }`}
              >
                📧 Email Phishing
              </button>
              <button
                type="button"
                onClick={() => setSimulationType('phone')}
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition ${
                  simulationType === 'phone' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                }`}
              >
                📞 Phone Call Phishing
              </button>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., IT Security Alert Simulation"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
          </div>

          {simulationType === 'email' && (
            <div className="space-y-4 mb-6 border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Email Content</h3>
              <input
                type="text"
                value={formData.emailSubject}
                onChange={(e) => setFormData({ ...formData, emailSubject: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Subject Line"
              />
              <textarea
                value={formData.emailBody}
                onChange={(e) => setFormData({ ...formData, emailBody: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                rows={8}
                placeholder="Email body..."
              />
            </div>
          )}

          {simulationType === 'phone' && (
            <div className="space-y-4 mb-6 border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Phone Call Content</h3>
              <textarea
                value={formData.phoneScript}
                onChange={(e) => setFormData({ ...formData, phoneScript: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                rows={8}
                placeholder="Call script..."
              />
            </div>
          )}

          <div className="flex justify-end gap-4">
            <button type="button" onClick={() => navigate('/admin/dashboard')} className="px-6 py-2 border rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Create Simulation
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default SimulationCreator;