"use client";

// Icons replaced with emojis for simplicity

const features = [
  {
    icon: <span className="text-3xl" role="img" aria-label="Agenda">🗂️</span>,
    title: "Agenda Builder",
    description: "Create structured agendas with ready‑made templates or from scratch.",
  },
  {
    icon: <span className="text-3xl" role="img" aria-label="Minutes">📝</span>,
    title: "Minutes & Notes",
    description: "Capture decisions, action items and attendees in a clean editor.",
  },
  {
    icon: <span className="text-3xl" role="img" aria-label="Tracking">📊</span>,
    title: "Action Tracking",
    description: "Assign, monitor and close action items in real time.",
  },
  {
    icon: <span className="text-3xl" role="img" aria-label="Documents">📁</span>,
    title: "Document Management",
    description: "Organise, share and version meeting documents.",
  },
  {
    icon: <span className="text-3xl" role="img" aria-label="Audit">✅</span>,
    title: "Audit Trail",
    description: "Full, immutable record of every change and decision.",
  },
  {
    icon: <span className="text-3xl" role="img" aria-label="Export">📦</span>,
    title: "Board Pack Export",
    description: "Generate professional PDF packs for distribution.",
  },
];

export default function LandingFeatures() {
  return (
    <section id="features" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-12">
          Powerful Features
        </h2>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, idx) => (
            <div
              key={idx}
              className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center text-center"
            >
              <div className="mb-4">{f.icon}</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">{f.title}</h3>
              <p className="text-gray-600">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
