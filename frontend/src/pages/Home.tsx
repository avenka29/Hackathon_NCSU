import { Link } from 'react-router-dom';
import { type ReactNode } from 'react';
import Silk from '../components/Silk';
import { useInView } from '../hooks/useInView';
import { Shield, PhoneCall, BarChart3 } from 'lucide-react';

/* ─── Scroll-reveal wrapper ─── */

type AnimationType = 'fade-in-up' | 'fade-in' | 'scale-in';

interface AnimatedSectionProps {
  children: ReactNode;
  animation?: AnimationType;
  delay?: string;
  className?: string;
  threshold?: number;
  rootMargin?: string;
}

function AnimatedSection({
  children,
  animation = 'fade-in-up',
  delay = '',
  className = '',
  threshold,
  rootMargin,
}: AnimatedSectionProps) {
  const [ref, isInView] = useInView<HTMLDivElement>({ threshold, rootMargin });

  return (
    <div
      ref={ref}
      className={`${isInView ? `animate-${animation}` : 'animate-hidden'} ${delay} ${className}`}
    >
      {children}
    </div>
  );
}

/* ─── Home page ─── */

function Home() {
  const stats = [
    { value: '$10.3B', label: 'Lost to scams in 2023', sublabel: 'FBI IC3 Report' },
    { value: '1 in 3', label: 'Employees click phishing links', sublabel: 'Industry Average' },
    { value: '300%', label: 'Increase in AI-powered scams', sublabel: 'Since 2021' },
  ];

  const steps = [
    {
      step: '01',
      icon: Shield,
      title: 'Create Scenario',
      description:
        'Choose from real-world scam templates or build custom phishing scenarios tailored to your organization.',
    },
    {
      step: '02',
      icon: PhoneCall,
      title: 'Simulate Call',
      description:
        'Our AI places realistic voice phishing calls to your employees to test their response in real time.',
    },
    {
      step: '03',
      icon: BarChart3,
      title: 'Analyze Results',
      description:
        'Get detailed reports on who was vulnerable, what data was leaked, and how to improve your defenses.',
    },
  ];

  return (
    <div className="bg-[#0f172a]">
      {/* ═══ Hero Section ═══ */}
      <section className="min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 z-0 w-full h-full bg-[#0f172a]">
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
      </section>

      {/* ═══ Stats Section ═══ */}
      <section className="bg-[#0f172a] py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">The Threat Is Real</h2>
            <p className="text-blue-200 text-lg max-w-2xl mx-auto">
              Cybercrime is accelerating. Your employees are the first line of defense.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, i) => (
              <AnimatedSection
                key={stat.label}
                animation="scale-in"
                delay={`delay-${(i + 1) * 200}`}
                className="text-center p-8 rounded-2xl bg-white/5 border border-white/10"
              >
                <p className="text-4xl md:text-5xl font-bold text-white mb-2">{stat.value}</p>
                <p className="text-blue-100 text-lg font-medium">{stat.label}</p>
                <p className="text-blue-300/60 text-sm mt-1">{stat.sublabel}</p>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Mission Section ═══ */}
      <section className="bg-[#f8fafc] py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <AnimatedSection>
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-3">
              Our Mission
            </p>
          </AnimatedSection>

          <AnimatedSection animation="fade-in-up" delay="delay-100">
            <h2 className="text-3xl md:text-4xl font-bold text-[#0f172a] mb-6">
              Stop Scammers Before They Strike
            </h2>
          </AnimatedSection>

          <AnimatedSection animation="fade-in" delay="delay-300">
            <p className="text-lg text-slate-600 leading-relaxed mb-6">
              We believe that awareness is the strongest defense against social engineering. Our
              platform simulates realistic phishing calls and emails so your team can recognize
              threats before real damage is done.
            </p>
          </AnimatedSection>

          <AnimatedSection animation="fade-in" delay="delay-500">
            <p className="text-lg text-slate-600 leading-relaxed">
              Built by cybersecurity researchers, powered by AI, and designed to make security
              training something people actually remember.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══ How It Works ═══ */}
      <section className="bg-white py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider mb-3">
              How It Works
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0f172a]">
              Three Steps to a Safer Team
            </h2>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((card, i) => (
              <AnimatedSection
                key={card.step}
                animation="fade-in-up"
                delay={`delay-${(i + 1) * 200}`}
                className="relative p-8 rounded-2xl border border-slate-200 hover:shadow-lg transition-shadow"
              >
                <span className="text-5xl font-bold text-slate-100 absolute top-4 right-6">
                  {card.step}
                </span>
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-5">
                  <card.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-[#0f172a] mb-3">{card.title}</h3>
                <p className="text-slate-600 leading-relaxed">{card.description}</p>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA Section ═══ */}
      <section className="bg-[#0f172a] py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <AnimatedSection animation="scale-in">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Test Your Team?
            </h2>
            <p className="text-blue-200 text-lg mb-10 max-w-xl mx-auto">
              Start running realistic phishing simulations today and find out who needs training
              before a real attack happens.
            </p>
            <Link
              to="/people"
              className="inline-block px-10 py-4 bg-white text-[#0f172a] font-semibold rounded-lg hover:bg-blue-50 transition shadow-lg text-lg"
            >
              Get Started
            </Link>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}

export default Home;
