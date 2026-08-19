"use client";

// Icons replaced with emojis for simplicity
import Image from "next/image";

const steps = [
  {
    number: 1,
    title: "Create a Meeting",
    description: "Pick date, time and location in seconds.",
    icon: "📅", // calendar emoji
    // placeholder image url
    img: "/images/create_meeting.jpg",
  },
  {
    number: 2,
    title: "Build Your Agenda",
    description: "Use ready‑made templates or craft a custom agenda.",
    icon: "✏️", // edit emoji
    img: "/images/build_agenda.jpg",
  },
  {
    number: 3,
    title: "Take Minutes",
    description: "Record decisions, attendees and action items live.",
    icon: "✅", // check circle emoji
    img: "/images/take_minutes.jpg",
  },
  {
    number: 4,
    title: "Track Actions",
    description: "Assign owners, set due dates, watch progress.",
    icon: "⏰", // clock emoji
    img: "/images/track_actions.jpg",
  },
  {
    number: 5,
    title: "Generate Board Pack",
    description: "Export a polished PDF for stakeholders.",
    icon: "📁", // export emoji
    img: "/images/build_agenda.jpg",
  },
];

export default function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-12">
          How It Works
        </h2>
        <div className="space-y-12">
          {steps.map((step) => (
            <div
              key={step.number}
              className="flex flex-col md:flex-row items-center md:items-start"
            >
              <div className="flex-shrink-0 w-16 h-16 md:w-24 md:h-24 flex items-center justify-center bg-teal-100 rounded-full mb-4 md:mb-0">
                {step.icon}
              </div>
              <div className="md:ml-8">
                <h3 className="text-2xl font-semibold text-gray-800 mb-2">
                  {step.number}. {step.title}
                </h3>
                <p className="text-gray-600 mb-4">{step.description}</p>
                <div className="w-full max-w-md">
                  <Image
                    src={step.img}
                    alt={step.title}
                    width={800}
                    height={400}
                    className="rounded-lg shadow-lg"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
