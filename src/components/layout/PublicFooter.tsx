import Link from "next/link";
import { GraduationCap, MapPin, Phone, Mail } from "lucide-react";
import { SCHOOL_INFO } from "@/lib/constants";

export default function PublicFooter() {
  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* School Info */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="bg-primary-500 text-white p-1.5 rounded-lg">
                <GraduationCap size={20} />
              </div>
              <div>
                <div className="font-bold text-white text-sm">S.D.M. Academy Shaulana</div>
                <div className="text-xs text-gray-500">Est. {SCHOOL_INFO.established}</div>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-gray-400 mb-3">
              Affiliated with UP Board · Classes Play to 8 · Committed to holistic education since 2006.
            </p>
            <p className="text-sm italic text-primary-400">{SCHOOL_INFO.motto}</p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              {[
                ["/about", "About Us"],
                ["/academics", "Academics"],
                ["/admissions", "Admissions"],
                ["/facilities", "Facilities"],
                ["/notices", "Notice Board"],
                ["/contact", "Contact"],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="hover:text-primary-400 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin size={15} className="mt-0.5 text-primary-400 flex-shrink-0" />
                {SCHOOL_INFO.address}
              </li>
              <li className="flex items-center gap-2">
                <Phone size={15} className="text-primary-400 flex-shrink-0" />
                {SCHOOL_INFO.phone}
              </li>
              <li className="flex items-center gap-2">
                <Mail size={15} className="text-primary-400 flex-shrink-0" />
                {SCHOOL_INFO.email}
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-600">
          <p>© {new Date().getFullYear()} S.D.M. Academy Shaulana. All rights reserved.</p>
          <Link href="/login" className="hover:text-primary-400 transition-colors">
            Staff Portal Login →
          </Link>
        </div>
      </div>
    </footer>
  );
}
