"use client";

import Link from "next/link";
import Image from "next/image";

export default function LandingFooter() {
  return (
    <footer className="bg-gray-900 text-gray-200 py-12">
      <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Logo */}
        <div>
          <div className="text-2xl font-bold mb-4">SegueMeet</div>
          <p className="text-sm">© {new Date().getFullYear()} SegueMeet. All rights reserved.</p>
        </div>
        {/* Navigation columns */}
        <div>
          <h4 className="font-semibold mb-3 text-gray-100">Product</h4>
          <ul className="space-y-2">
            <li><Link href="/meetings">Meetings</Link></li>
            <li><Link href="/agenda">Agenda</Link></li>
            <li><Link href="/minutes">Minutes</Link></li>
            <li><Link href="/actions">Actions</Link></li>
            <li><Link href="/documents">Documents</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-gray-100">Resources</h4>
          <ul className="space-y-2">
            <li><Link href="/docs">Docs</Link></li>
            <li><Link href="/blog">Blog</Link></li>
            <li><Link href="/guides">Guides</Link></li>
            <li><Link href="/webinars">Webinars</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-gray-100">Company</h4>
          <ul className="space-y-2">
            <li><Link href="/about">About</Link></li>
            <li><Link href="/pricing">Pricing</Link></li>
            <li><Link href="/contact">Contact</Link></li>
            <li><Link href="/careers">Careers</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-gray-100">Legal</h4>
          <ul className="space-y-2">
            <li><Link href="/terms">Terms</Link></li>
            <li><Link href="/privacy">Privacy</Link></li>
            <li><Link href="/security">Security</Link></li>
          </ul>
        </div>
        {/* Social icons */}
        <div className="md:col-span-4 flex space-x-4 mt-6 justify-center">
          <Link href="https://linkedin.com" aria-label="LinkedIn" className="hover:text-white transition">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.761 0 5-2.239 5-5v-14c0-2.761-2.239-5-5-5zm-11 19h-3v-9h3v9zm-1.5-10.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.784 1.764-1.75 1.764zm13.5 10.268h-3v-4.5c0-1.084-.021-2.479-1.514-2.479-1.514 0-1.748 1.181-1.748 2.399v4.58h-3v-9h2.881v1.233h.041c.401-.761 1.381-1.562 2.842-1.562 3.04 0 3.6 2.001 3.6 4.599v5.73z" />
            </svg>
          </Link>
          <Link href="https://twitter.com" aria-label="Twitter" className="hover:text-white transition">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M24 4.557a9.83 9.83 0 01-2.828.775 4.932 4.932 0 002.165-2.724c-.951.564-2.005.974-3.127 1.195a4.916 4.916 0 00-8.384 4.482c-4.083-.205-7.702-2.162-10.124-5.138a4.822 4.822 0 00-.666 2.475c0 1.708.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.062c0 2.385 1.698 4.374 3.946 4.827-.413.112-.849.171-1.296.171-.317 0-.626-.031-.928-.088.627 1.956 2.444 3.379 4.6 3.419a9.867 9.867 0 01-6.102 2.104c-.395 0-.787-.023-1.175-.069a13.945 13.945 0 007.557 2.212c9.054 0 14-7.496 14-13.986 0-.213-.005-.425-.014-.637a9.936 9.936 0 002.457-2.548l-.047-.02z" />
            </svg>
          </Link>
        </div>
      </div>
    </footer>
  );
}
