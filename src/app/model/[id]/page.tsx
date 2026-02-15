import Link from 'next/link';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  // TODO: Fetch model and return dynamic metadata
  return {
    title: `Model ${id} | Flocc Studio`,
  };
}

export default async function ModelViewPage({ params }: Props) {
  const { id } = await params;
  
  // TODO: Fetch model from database
  const model = null; // await getModel(id);

  // For now, show a placeholder
  // if (!model) {
  //   notFound();
  // }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold">
            Flocc Studio
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href={`/model/${id}/edit`}
              className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg transition"
            >
              Edit Model
            </Link>
          </nav>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Model Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Model: {id}</h1>
          <p className="text-gray-400">Model description will appear here</p>
        </div>

        {/* Simulation Canvas */}
        <div className="bg-gray-800 rounded-lg aspect-video flex items-center justify-center mb-8">
          <div className="text-gray-500">
            Simulation canvas will render here
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 mb-8">
          <button className="bg-green-600 hover:bg-green-500 px-6 py-2 rounded-lg transition">
            ▶ Play
          </button>
          <button className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded-lg transition">
            ⏸ Pause
          </button>
          <button className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded-lg transition">
            ↺ Reset
          </button>
          <div className="flex-1" />
          <button className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition">
            Fork
          </button>
          <button className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition">
            Share
          </button>
        </div>

        {/* Parameters */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Parameters</h2>
          <p className="text-gray-500">Adjustable parameters will appear here</p>
        </div>
      </div>
    </main>
  );
}
