import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 text-center">
      <div className="space-y-4 max-w-md">
        <h1 className="text-3xl font-black">Page not found</h1>
        <p className="text-sm text-gray-400">
          That URL does not exist. Head back to the leaderboard.
        </p>
        <Link href="/leaderboard" className="btn-primary inline-block py-3 px-8 text-sm font-bold">
          Go to rankings
        </Link>
      </div>
    </div>
  );
}
