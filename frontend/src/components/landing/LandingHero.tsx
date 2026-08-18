"use client";

import Link from "next/link";
import Image from "next/image";

export default function LandingHero() {
  return (
    <section className="relative min-h-screen bg-gradient-to-br from-blue-600 to-teal-500 text-white flex flex-col">
      {/* Navigation Bar */}
      <nav className="flex items-center justify-between px-6 py-4 md:px-12 bg-transparent">
        <div className="text-2xl font-bold">SegueMeet</div>
        <ul className="hidden md:flex space-x-6 text-sm font-medium">
          <li><Link href="#product">Product</Link></li>
          <li><Link href="#features">Features</Link></li>
          <li><Link href="#pricing">Pricing</Link></li>
          <li><Link href="#resources">Resources</Link></li>
          <li><Link href="#about">About</Link></li>
        </ul>
        <Link
          href="/login"
          className="ml-4 px-4 py-2 border border-white rounded hover:bg-white hover:text-blue-600 transition"
        >
          Login →
        </Link>
      </nav>

      {/* Hero Content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 md:px-0">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
          Governance Without the Chaos
        </h1>
        <p className="max-w-2xl text-lg md:text-xl mb-8">
          Build agendas, capture minutes, track actions, and generate board packs—all in one secure platform.
        </p>
        <div className="flex gap-4">
          <Link
            href="/signup"
            className="px-6 py-3 bg-white text-blue-600 font-semibold rounded shadow hover:bg-gray-100 transition"
          >
            Try for Free
          </Link>
          <Link
            href="/login"
            className="px-6 py-3 border border-white text-white font-semibold rounded hover:bg-white hover:text-blue-600 transition"
          >
            Login →
          </Link>
        </div>
      </div>
    </section>
  );
}
