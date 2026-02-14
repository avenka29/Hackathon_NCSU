import { Link } from 'react-router-dom';
import Silk from '../components/Silk';

function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Silk speed={5} scale={1} color="#1E3A5F" noiseIntensity={1.5} rotation={0} />
      </div>
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-md">
          Cybersecurity Awareness Training
        </h1>
        <p className="text-lg md:text-xl text-blue-100 max-w-xl mb-10 drop-shadow-md">
          Train your employees to recognize phishing with realistic simulations.
        </p>
        <Link
          to="/people"
          className="inline-block px-8 py-4 bg-white text-blue-900 font-semibold rounded-lg hover:bg-blue-50 transition shadow-lg"
        >
          Start Here →
        </Link>
      </div>
    </div>
  );
}

export default Home;