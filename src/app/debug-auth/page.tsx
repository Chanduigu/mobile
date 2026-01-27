import { auth } from '@/auth';

export default async function DebugAuthPage() {
    const session = await auth();

    return (
        <div className="p-10 text-black dark:text-white">
            <h1 className="text-2xl font-bold mb-4">Auth Debugger</h1>
            <div className="space-y-4">
                <div className="p-4 border rounded-md">
                    <h2 className="font-semibold">Current Session:</h2>
                    <pre className="mt-2 bg-gray-100 p-4 rounded text-sm overflow-auto">
                        {JSON.stringify(session, null, 2)}
                    </pre>
                </div>

                <div className="p-4 border rounded-md">
                    <h2 className="font-semibold">Detected Role:</h2>
                    <p className="text-xl font-mono text-blue-600">
                        {session?.user?.role || 'UNDEFINED'}
                    </p>
                </div>

                <div className="p-4 border rounded-md">
                    <h2 className="font-semibold">User Details:</h2>
                    <p>Name: {session?.user?.name}</p>
                    <p>ID: {session?.user?.id}</p>
                </div>
            </div>
        </div>
    );
}
