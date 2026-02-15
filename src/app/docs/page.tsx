import Link from 'next/link';

export const metadata = {
  title: 'Documentation | Flocc Studio',
  description: 'Learn how to use Flocc Studio for agent-based modeling',
};

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
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
            <Link href="/docs" className="text-white font-medium">
              Docs
            </Link>
            <Link
              href="/model/new"
              className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg transition"
            >
              Create Model
            </Link>
          </nav>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Documentation</h1>

        <div className="prose prose-invert max-w-none">
          <h2>Getting Started</h2>
          <p>
            Flocc Studio is a visual environment for creating agent-based models. 
            You can create simulations without writing any code — just define your 
            agents, their behaviors, and watch them interact.
          </p>

          <h3>Creating Your First Model</h3>
          <ol>
            <li>Click &quot;Create Model&quot; to open the editor</li>
            <li>Add an agent type (e.g., &quot;Bird&quot;)</li>
            <li>Add behaviors to define how agents move and interact</li>
            <li>Set up a population to spawn agents</li>
            <li>Press Play to run the simulation</li>
          </ol>

          <h2>Agent Types</h2>
          <p>
            Agent types define the different kinds of entities in your model. 
            Each type has:
          </p>
          <ul>
            <li><strong>Name</strong> — A label for the agent type</li>
            <li><strong>Appearance</strong> — Color, shape, and size</li>
            <li><strong>Properties</strong> — Custom data each agent carries</li>
            <li><strong>Behaviors</strong> — Rules that govern agent actions</li>
          </ul>

          <h2>Behaviors</h2>
          <p>
            Behaviors are the rules that agents follow each tick of the simulation. 
            Available behaviors include:
          </p>
          <ul>
            <li><strong>Random Walk</strong> — Move in a random direction</li>
            <li><strong>Move Toward</strong> — Move toward a target</li>
            <li><strong>Move Away</strong> — Flee from a target</li>
            <li><strong>If Nearby</strong> — Conditional behavior based on proximity</li>
            <li><strong>On Collision</strong> — React when touching another agent</li>
          </ul>

          <h2>Sharing Models</h2>
          <p>
            Once you&apos;re happy with your model, you can:
          </p>
          <ul>
            <li>Save it to your account</li>
            <li>Make it public for others to view and fork</li>
            <li>Embed it on other websites</li>
            <li>Export as standalone code</li>
          </ul>

          <h2>Learn More</h2>
          <p>
            Flocc Studio is built on{' '}
            <a href="https://flocc.network" className="text-blue-400 hover:underline">
              Flocc
            </a>
            , an open-source JavaScript library for agent-based modeling.
          </p>
        </div>
      </div>
    </main>
  );
}
