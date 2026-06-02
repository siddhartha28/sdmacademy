import { GraduationCap, Target, Eye, Users } from "lucide-react";
import { SCHOOL_INFO } from "@/lib/constants";

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <div className="bg-primary-700 text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="text-primary-200 text-sm font-medium uppercase tracking-wider mb-2">About Us</p>
          <h1 className="text-4xl font-bold">Our Story</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">School History</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              S.D.M. Academy Shaulana was established in 2006 with a vision to provide quality education
              to children in the Shaulana, Dhaulana, and surrounding areas of Hapur district, Uttar Pradesh.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              Affiliated with the Uttar Pradesh Madhyamik Shiksha Parishad (UP Board), the school offers
              classes from Play Group through Class 8, combining the UP Board curriculum with additional
              subjects like Computer Science and Drawing.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Over nearly two decades, we have grown into a trusted educational institution known for
              holistic development, personal attention, and a nurturing environment.
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-primary-50 border border-primary-100 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-primary-500 text-white p-2 rounded-lg"><Target size={18} /></div>
                <h3 className="font-semibold text-gray-900">Our Mission</h3>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                To provide accessible, quality education that builds character, critical thinking, and
                confidence in every student — preparing them for a bright future.
              </p>
            </div>
            <div className="bg-primary-50 border border-primary-100 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-primary-500 text-white p-2 rounded-lg"><Eye size={18} /></div>
                <h3 className="font-semibold text-gray-900">Our Vision</h3>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                To be the leading educational institution in Hapur district, where every child is nurtured
                to achieve their full potential through excellence in teaching and a love for learning.
              </p>
            </div>
          </div>
        </div>

        {/* Principal */}
        <div className="mt-14 bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
              <GraduationCap size={28} className="text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-primary-600 font-medium uppercase tracking-wider mb-1">Principal&apos;s Message</p>
              <h3 className="text-xl font-bold text-gray-900 mb-1">{SCHOOL_INFO.principal}</h3>
              <p className="text-sm text-gray-400 mb-4">Principal, S.D.M. Academy Shaulana</p>
              <p className="text-gray-600 leading-relaxed italic">
                &ldquo;At S.D.M. Academy, we believe every child carries the light of potential within them.
                Our role as educators is to fan that flame — through dedicated teaching, a safe and
                encouraging environment, and by instilling values that go beyond textbooks.
                We welcome you to our school family.&rdquo;
              </p>
            </div>
          </div>
        </div>

        {/* Key Facts */}
        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-5">
          {[
            { label: "Established", value: SCHOOL_INFO.established },
            { label: "Affiliation", value: SCHOOL_INFO.affiliation },
            { label: "Classes", value: SCHOOL_INFO.classes },
            { label: "Location", value: "Hapur, UP" },
          ].map((f) => (
            <div key={f.label} className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-center">
              <div className="font-bold text-primary-600 text-lg">{f.value}</div>
              <div className="text-sm text-gray-500 mt-1">{f.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
