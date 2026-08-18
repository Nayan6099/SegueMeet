"use client";

import Image from "next/image";

const testimonials = [
  {
    quote: "SegueMeet transformed the way our board meets – everything is now structured and searchable.",
    name: "Laura Chen",
    title: "Board Chair",
    company: "Global Finance Corp",
    avatar: "https://i.pravatar.cc/80?img=1",
    rating: 5,
  },
  {
    quote: "The agenda builder saved us hours of preparation. Our meetings run smoother than ever.",
    name: "Mark Patel",
    title: "Operations Manager",
    company: "TechSolutions Ltd",
    avatar: "https://i.pravatar.cc/80?img=2",
    rating: 5,
  },
  {
    quote: "Action tracking keeps our teams accountable and transparent. Highly recommended!",
    name: "Sofia García",
    title: "HR Director",
    company: "HealthPlus",
    avatar: "https://i.pravatar.cc/80?img=3",
    rating: 5,
  },
];

export default function LandingTestimonials() {
  return (
    <section id="testimonials" className="py-20 bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 md:px-12 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-8">
          Trusted by Organisations Worldwide
        </h2>
        <div className="grid gap-8 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="bg-white rounded-lg shadow p-6 flex flex-col items-center text-center"
            >
              <Image
                src={t.avatar}
                alt={t.name}
                width={80}
                height={80}
                className="rounded-full mb-4"
              />
              <p className="italic text-gray-600 mb-4">“{t.quote}”</p>
              <p className="font-semibold text-gray-800">{t.name}</p>
              <p className="text-sm text-gray-500">
                {t.title}, {t.company}
              </p>
              <div className="mt-2 flex justify-center space-x-1">
                {Array.from({ length: t.rating }).map((_, idx) => (
                  <svg
                    key={idx}
                    className="w-4 h-4 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.966a1 1 0 00.95.69h4.178c.969 0 1.371 1.24.588 1.81l-3.384 2.46a1 1 0 00-.364 1.118l1.286 3.966c.3.921-.755 1.688-1.54 1.118l-3.384-2.46a1 1 0 00-1.175 0l-3.384 2.46c-.784.57-1.838-.197-1.539-1.118l1.285-3.966a1 1 0 00-.363-1.118L2.34 9.393c-.783-.57-.38-1.81.588-1.81h4.178a1 1 0 00.951-.69l1.286-3.966z" />
                  </svg>
                ))}
              </div>
            </div>
          ))}
        </div>
          <div className="mt-12 flex flex-wrap justify-center gap-6">
            {["Global Finance Corp", "TechSolutions Ltd", "HealthPlus", "NovaCorp", "BrightPath"].map((name, i) => (
              <div
                key={i}
                className="flex items-center justify-center px-5 py-2 bg-white border border-gray-200 rounded-full shadow-sm text-sm font-semibold text-gray-500 tracking-wide"
                style={{ minWidth: 120 }}
              >
                {name}
              </div>
            ))}
          </div>
      </div>
    </section>
  );
}
