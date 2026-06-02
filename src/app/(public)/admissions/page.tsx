import Link from "next/link";
import { Phone, MapPin, CheckCircle, Info } from "lucide-react";
import { SCHOOL_INFO } from "@/lib/constants";

export default function AdmissionsPage() {
  const steps = [
    { step: "01", title: "Visit the School", desc: "Come to the school office during working hours (Mon–Sat, 8 AM – 2 PM) to collect the admission form." },
    { step: "02", title: "Fill the Form", desc: "Complete the admission form with student details — name, date of birth, parent information, and previous school (if any)." },
    { step: "03", title: "Submit Documents", desc: "Submit the form along with required documents and the admission fee." },
    { step: "04", title: "Confirmation", desc: "On approval, you will receive a student ID, class assignment, and fee receipt. Welcome to the SDM family!" },
  ];

  const docs = [
    "Birth Certificate",
    "Aadhar Card (Child + Parent)",
    "Passport size photos (4)",
    "Previous school TC (if applicable)",
    "Previous school report card",
  ];

  return (
    <div>
      <div className="bg-primary-700 text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="text-primary-200 text-sm font-medium uppercase tracking-wider mb-2">Admissions</p>
          <h1 className="text-4xl font-bold">Join S.D.M. Academy</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <div className="bg-primary-50 border border-primary-200 rounded-xl p-5 mb-8">
              <div className="flex items-center gap-2 text-primary-700 font-semibold mb-2">
                <Info size={18} />
                Admissions Open — Session 2025–26
              </div>
              <p className="text-sm text-gray-600">
                We are currently accepting applications for Play Group through Class 8. 
                Seats are limited — apply early to secure your child&apos;s place.
              </p>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-4">Admission Process</h2>
            <div className="space-y-4">
              {steps.map((s) => (
                <div key={s.step} className="flex gap-4">
                  <div className="flex-shrink-0 w-9 h-9 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {s.step}
                  </div>
                  <div className="pb-4 border-b border-gray-100 last:border-0">
                    <div className="font-semibold text-gray-900 text-sm">{s.title}</div>
                    <div className="text-sm text-gray-500 mt-1">{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Required Documents</h3>
              <ul className="space-y-2">
                {docs.map((d) => (
                  <li key={d} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle size={15} className="text-success flex-shrink-0" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">Contact for Admissions</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="bg-primary-100 text-primary-600 p-2 rounded-lg">
                    <Phone size={16} />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{SCHOOL_INFO.phone}</div>
                    <div className="text-gray-400 text-xs">Call or WhatsApp</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="bg-primary-100 text-primary-600 p-2 rounded-lg">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Visit Us</div>
                    <div className="text-gray-400 text-xs">{SCHOOL_INFO.address}</div>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 flex gap-3">
                <Link
                  href={`tel:${SCHOOL_INFO.phone}`}
                  className="flex-1 bg-primary-500 hover:bg-primary-600 text-white text-center py-2.5 rounded-lg text-sm font-semibold transition-colors"
                >
                  Call Now
                </Link>
                <Link
                  href="/contact"
                  className="flex-1 border border-gray-300 hover:border-primary-400 text-gray-700 text-center py-2.5 rounded-lg text-sm font-semibold transition-colors"
                >
                  Get Directions
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
