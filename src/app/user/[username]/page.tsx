import Link from 'next/link';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { username } = await params;
  return {
    title: `@${username} | Flocc Studio`,
  };
}

export default async function UserProfilePage({ params }: Props) {
  const { username } = await params;
  
  // TODO: Fetch user and their models from database
  const user = null;
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
            <Link href="/explore" className="text-gray-300 hover:text-white transition">
              Explore
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
        {/* Profile Header */}
        <div className="flex items-center gap-6 mb-8">
          <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center text-4xl">
            👤
          </div>
          <div>
            <h1 className="text-3xl font-bold">@{username}</h1>
            <p className="text-gray-400">Member since 2024</p>
          </div>
        </div>

        {/* Models */}
        <h2 className="text-xl font-semibold mb-4">Models</h2>
        {models.length === 0 ? (
          <p className="text-gray-500">No public models yet</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {models.map((model) => (
              <Link
                key={model.id}
                href={`/model/${model.id}`}
                className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition"
              >
                <div className="aspect-video bg-gray-700 rounded mb-4" />
                <h3 className="font-semibold">{model.name}</h3>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
