import Link from 'next/link';

export default function ForbiddenPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4">
            <h1 className="text-6xl font-bold text-red-500 mb-4">403</h1>
            <h2 className="text-2xl font-semibold mb-6">Access Forbidden</h2>
            <p className="text-slate-400 mb-8 text-center max-w-md">
                You do not have the required permissions to access this resource.
                Please contact your administrator if you believe this is an error.
            </p>
            <Link
                href="/dashboard"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
            >
                Return to Dashboard
            </Link>
        </div>
    );
}
