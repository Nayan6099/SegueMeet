"use client";

import Link from "next/link";

export default function LandingCTA() {
  return (
    <section className="py-20 bg-blue-600 text-white text-center">
      <div className="max-w-2xl mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Ready to Transform Your Meetings?
        </h2>
        <p className="mb-6 text-lg md:text-xl">
          Join organisations using SegueMeet to streamline governance and boost productivity.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/signup"
            className="px-6 py-3 bg-white text-blue-600 font-semibold rounded shadow hover:bg-gray-100 transition"
          >
            Try for Free
          </Link>
          <Link
            href="/contact"
            className="px-6 py-3 border border-white text-white font-semibold rounded hover:bg-white hover:text-blue-600 transition"
          >
            Book a Demo
          </Link>
        </div>
      </div>
    </section>
  );
}
