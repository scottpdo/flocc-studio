import Link from 'next/link';
import { AuthButtons } from '@/components/auth/AuthButtons';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold">
            Flocc Studio
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/explore" className="text-gray-300 hover:text-white transition">
              Explore
            </Link>
            <Link href="/docs" className="text-gray-300 hover:text-white transition">
              Docs
            </Link>
            <Link
              href="/model/new"
              className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg transition"
            >
              Create Model
            </Link>
            <AuthButtons />
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 py-24 text-center">
        <h1 className="text-5xl font-bold mb-6">
          Agent-Based Modeling
          <br />
          <span className="text-blue-400">Made Visual</span>
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
          Create, simulate, and share agent-based models directly in your browser.
          No code required — just drag, drop, and explore.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/model/new"
            className="bg-blue-600 hover:bg-blue-500 px-8 py-3 rounded-lg text-lg font-semibold transition"
          >
            Start Creating
          </Link>
          <Link
            href="/explore"
            className="bg-gray-800 hover:bg-gray-700 px-8 py-3 rounded-lg text-lg font-semibold transition"
          >
            Browse Models
          </Link>
        </div>
      </section>

      {/* Featured Models Preview */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold mb-8">Featured Models</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Placeholder cards */}
          {['Flocking', 'Schelling Segregation', 'Predator-Prey'].map((name) => (
            <div
              key={name}
              className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition cursor-pointer"
            >
              <div className="aspect-video bg-gray-700 rounded mb-4 flex items-center justify-center text-gray-500">
                Preview
              </div>
              <h3 className="font-semibold mb-1">{name}</h3>
              <p className="text-sm text-gray-400">Classic ABM example</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center text-gray-500">
          <p>
            Built with{' '}
            <a href="https://flocc.network" className="text-blue-400 hover:underline">
              Flocc
            </a>
          </p>
        </div>
      </footer>
    </main>
  );
}
