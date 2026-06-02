import Link from "next/link";
import Image from "next/image";
import {
  BookOpen, Users, Award, ChevronRight,
  ClipboardCheck, DollarSign, BarChart3, Bell,
} from "lucide-react";
import { SCHOOL_INFO } from "@/lib/constants";

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative bg-primary-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-800 to-primary-950 opacity-90" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
          <div className="max-w-3xl">
            <div className="flex items-center gap-4 mb-6">
              <Image src="/logo.png" alt="SDM Academy Logo" width={80} height={80} className="rounded-full border-4 border-white/20 shadow-xl flex-shrink-0" />
              <div className="inline-flex items-center gap-2 bg-primary-700/60 border border-primary-600/40 text-primary-200 px-3 py-1.5 rounded-full text-sm font-medium">
                UP Board Affiliated · Est. {SCHOOL_INFO.established}
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4">
              {SCHOOL_INFO.name}
            </h1>
            <p className="text-xl text-primary-200 font-light italic mb-2">{SCHOOL_INFO.motto}</p>
            <p className="text-primary-300 text-base mb-2">{SCHOOL_INFO.mottoEnglish}</p>
            <p className="text-primary-300 mt-4 mb-8 text-lg">{SCHOOL_INFO.address}</p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/admissions"
                className="bg-white text-primary-700 hover:bg-primary-50 px-6 py-3 rounded-xl font-semibold text-base transition-colors shadow"
              >
                Admissions Open
              </Link>
              <Link
                href="/about"
                className="border border-primary-400 text-white hover:bg-primary-700 px-6 py-3 rounded-xl font-semibold text-base transition-colors"
              >
                Know More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: "18+", label: "Years of Excellence" },
              { value: "Play–8", label: "Classes Offered" },
              { value: "UP Board", label: "Affiliation" },
              { value: "Hapur", label: "District" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl font-bold text-primary-600">{stat.value}</div>
                <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-primary-600 font-semibold text-sm uppercase tracking-wider">About Our School</span>
            <h2 className="text-3xl font-bold text-gray-900 mt-2 mb-4">
              Nurturing Bright Minds Since 2006
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              S.D.M. Academy Shaulana is a UP Board affiliated institution committed to providing quality
              education from Play Group to Class 8. Located in Shaulana, Dhaulana, Hapur, we combine
              academics with co-curricular activities for holistic development.
            </p>
            <p className="text-gray-600 leading-relaxed mb-6">
              Under the guidance of Principal Ms. Mansi Sharma, our dedicated faculty ensures every
              student receives personalised attention and care.
            </p>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 text-primary-600 font-semibold hover:text-primary-700"
            >
              Read More <ChevronRight size={18} />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: BookOpen, title: "Academics", desc: "UP Board curriculum with Computer & Drawing" },
              { icon: Award, title: "Activities", desc: "Dance, arts, sports, and creative programs" },
              { icon: Users, title: "Faculty", desc: "Experienced and dedicated teaching staff" },
              { icon: GraduationCap, title: "Results", desc: "Consistent academic performance" },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-primary-50 rounded-xl p-4 border border-primary-100">
                <div className="bg-primary-500 text-white p-2 rounded-lg w-fit mb-3">
                  <Icon size={18} />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
                <p className="text-xs text-gray-500 mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Facilities */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <span className="text-primary-600 font-semibold text-sm uppercase tracking-wider">Our Facilities</span>
            <h2 className="text-3xl font-bold text-gray-900 mt-2">World-Class Learning Environment</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { name: "Smart Classrooms", icon: "🖥️" },
              { name: "Science Lab", icon: "🔬" },
              { name: "Dance Room", icon: "🎭" },
              { name: "Creative Room", icon: "🎨" },
              { name: "Playground", icon: "⚽" },
            ].map((f) => (
              <div
                key={f.name}
                className="bg-white rounded-xl p-5 text-center border border-gray-200 shadow-sm hover:border-primary-300 hover:shadow-md transition-all"
              >
                <div className="text-3xl mb-3">{f.icon}</div>
                <div className="text-sm font-semibold text-gray-700">{f.name}</div>
              </div>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link href="/facilities" className="text-primary-600 font-medium hover:underline">
              Explore All Facilities →
            </Link>
          </div>
        </div>
      </section>

      {/* ERP Features Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-10">
          <span className="text-primary-600 font-semibold text-sm uppercase tracking-wider">School Management System</span>
          <h2 className="text-3xl font-bold text-gray-900 mt-2">Everything Managed in One Place</h2>
          <p className="text-gray-500 mt-3 max-w-2xl mx-auto">
            Attendance, fees, marks, report cards, notices — all digitized and accessible for teachers and staff.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: ClipboardCheck, title: "Smart Attendance", desc: "One-tap mobile attendance with auto-lock and principal override", color: "bg-blue-50 text-blue-600" },
            { icon: DollarSign, title: "Fee Management", desc: "Track dues, record payments, generate receipts with one click", color: "bg-green-50 text-green-600" },
            { icon: BookOpen, title: "Report Cards", desc: "UP Board style PDF report cards with auto-grade calculation", color: "bg-purple-50 text-purple-600" },
            { icon: BarChart3, title: "Analytics", desc: "Real-time insights on attendance, fees, and performance", color: "bg-amber-50 text-amber-600" },
          ].map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${color}`}>
                <Icon size={20} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-500">{desc}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-xl font-semibold shadow transition-colors"
          >
            Access Staff Portal <ChevronRight size={18} />
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary-600 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Enroll Your Child Today</h2>
          <p className="text-primary-100 text-lg mb-8">
            Admissions open for session 2025–26. Visit the school or call us to know more.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/admissions"
              className="bg-white text-primary-700 hover:bg-primary-50 px-6 py-3 rounded-xl font-semibold transition-colors shadow"
            >
              Admission Info
            </Link>
            <Link
              href="/contact"
              className="border-2 border-white text-white hover:bg-primary-700 px-6 py-3 rounded-xl font-semibold transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
