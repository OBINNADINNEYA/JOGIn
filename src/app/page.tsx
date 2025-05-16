import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background overlay */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black opacity-90"
        style={{
          backgroundImage: `url('/images/bg.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundBlend: 'overlay',
        }}
      />

      {/* Content */}
      <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8">
        <h1 className="text-6xl font-bold mb-8 tracking-tight">
          JOGIn
        </h1>
        <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
          Connect with local running clubs and fellow runners. 
          Track your progress, join events, and be part of an active community.
        </p>

        <div className="space-y-4 sm:space-y-0 sm:space-x-4 flex flex-col sm:flex-row justify-center">
          <Link
            href="/auth/sign-up"
            className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 md:text-lg"
          >
            Get Started
          </Link>
          <Link
            href="/auth/sign-in"
            className="inline-flex items-center justify-center px-8 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-300 hover:bg-gray-800 md:text-lg"
          >
            Sign In
          </Link>
        </div>

        <div className="mt-16">
          <h2 className="text-2xl font-semibold mb-6">Choose Your Path</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-gray-800 bg-opacity-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">For Runners</h3>
              <ul className="text-gray-300 space-y-2">
                <li>• Find local running clubs</li>
                <li>• Join group runs and events</li>
                <li>• Track your progress</li>
                <li>• Connect with fellow runners</li>
              </ul>
            </div>
            <div className="bg-gray-800 bg-opacity-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">For Club Leaders</h3>
              <ul className="text-gray-300 space-y-2">
                <li>• Create and manage your club</li>
                <li>• Organize events and runs</li>
                <li>• Engage with members</li>
                <li>• Access analytics and insights</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 