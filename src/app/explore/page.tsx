import Link from 'next/link';

export const metadata = {
  title: 'Explore Models | Flocc Studio',
  description: 'Browse and discover agent-based models',
};

export default function ExplorePage() {
  // TODO: Fetch models from database
  const models: any[] = [];

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold">
            Flocc Studio
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/explore" className="text-white font-medium">
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
          </nav>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <input
            type="search"
            placeholder="Search models..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          <select className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500">
            <option>All Tags</option>
            <option>Flocking</option>
            <option>Social</option>
            <option>Ecology</option>
            <option>Economics</option>
          </select>
          <select className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500">
            <option>Most Recent</option>
            <option>Most Popular</option>
            <option>Most Forked</option>
          </select>
        </div>

        {/* Model Grid */}
        {models.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-lg mb-4">No models yet</p>
            <Link
              href="/model/new"
              className="text-blue-400 hover:underline"
            >
              Create the first one →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {models.map((model) => (
              <Link
                key={model.id}
                href={`/model/${model.id}`}
                className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition"
              >
                <div className="aspect-video bg-gray-700 rounded mb-4 flex items-center justify-center text-gray-500">
                  {model.thumbnailUrl ? (
                    <img src={model.thumbnailUrl} alt={model.name} className="w-full h-full object-cover rounded" />
                  ) : (
                    'Preview'
                  )}
                </div>
                <h3 className="font-semibold mb-1">{model.name}</h3>
                <p className="text-sm text-gray-400 line-clamp-2">{model.description || 'No description'}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
