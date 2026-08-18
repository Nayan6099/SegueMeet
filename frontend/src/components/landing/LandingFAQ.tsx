"use client";

import { useState } from "react";

const faqs = [
  {
    question: "What is SegueMeet?",
    answer: "SegueMeet is a unified meeting‑management platform that lets you create meetings, build structured agendas, take minutes, track actions and export board packs—all in one secure place.",
  },
  {
    question: "Can I integrate SegueMeet with my existing tools?",
    answer: "Yes – SegueMeet offers a REST API and webhooks that let you connect with calendars, document storage services and custom dashboards.",
  },
  {
    question: "Is my data secure?",
    answer: "Data is stored in PostgreSQL with encryption at rest, all API traffic uses HTTPS, and role‑based access control isolates organisations.",
  },
  {
    question: "Do you offer a free trial?",
    answer: "You can sign up for a 14‑day free trial with no credit‑card required. All core features are available during the trial.",
  },
  {
    question: "What support is available?",
    answer: "We provide in‑app chat support, detailed documentation, and email assistance for paid tiers.",
  },
  {
    question: "Can I export my data?",
    answer: "Everything can be exported – minutes, actions and board packs are downloadable as PDFs or CSV files.",
  },
  {
    question: "How much does it cost?",
    answer: "Pricing is tiered by user count. Contact us for enterprise pricing or use the “Contact us” form for a custom quote.",
  },
];

export default function LandingFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-6 md:px-12">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-12">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {faqs.map((item, idx) => (
            <div key={idx} className="border border-gray-200 rounded-md">
              <button
                className="w-full text-left px-4 py-3 flex justify-between items-center focus:outline-none"
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              >
                <span className="font-medium text-gray-800">{item.question}</span>
                <svg
                  className={`w-5 h-5 transform transition-transform ${openIndex === idx ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openIndex === idx && (
                <div className="px-4 py-3 text-gray-600 bg-gray-50 border-t border-gray-200">
                  {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
