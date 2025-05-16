import SignUpForm from './SignUpForm';

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white">
      {/* Modern gradient background with animated shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-teal-500/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-teal-500/20 to-transparent rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Content */}
      <div className="relative min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo or App Name */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-teal-400 to-teal-600 bg-clip-text text-transparent">
              JOGIn
            </h1>
            <p className="mt-3 text-gray-400">
              Join the community of runners and club leaders
            </p>
          </div>

          {/* Card container for the form */}
          <div className="backdrop-blur-xl bg-white/10 rounded-2xl p-8 shadow-2xl border border-white/10">
            <h2 className="text-2xl font-semibold text-center mb-6">
              Create Your Account
            </h2>
            <SignUpForm />
          </div>

          {/* Footer links */}
          <div className="mt-8 text-center text-sm text-gray-400">
            <p>
              Already have an account?{' '}
              <a href="/auth/sign-in" className="text-teal-400 hover:text-teal-300 transition-colors">
                Sign in
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 