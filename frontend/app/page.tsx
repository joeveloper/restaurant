import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-md p-8 space-y-4">
      <h1 className="text-2xl font-bold">Food Delivery Demo</h1>
      <Link className="block rounded bg-blue-600 p-3 text-center text-white" href="/customer">Customer</Link>
      <Link className="block rounded bg-gray-800 p-3 text-center text-white" href="/restaurant">Restaurant</Link>
    </main>
  );
}
