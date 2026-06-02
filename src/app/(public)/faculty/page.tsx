import { GraduationCap, Users } from "lucide-react";

export default function FacultyPage() {
  return (
    <div>
      <div className="bg-primary-700 text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="text-primary-200 text-sm font-medium uppercase tracking-wider mb-2">Faculty</p>
          <h1 className="text-4xl font-bold">Our Teaching Staff</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="text-center max-w-xl mx-auto mb-12">
          <div className="bg-primary-50 border border-primary-100 rounded-2xl p-8">
            <div className="bg-primary-100 text-primary-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users size={30} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Faculty Directory — Coming Soon</h2>
            <p className="text-gray-500 text-sm">
              Our dedicated teaching staff profiles are being updated. Please visit the school
              or contact us for more information about our faculty.
            </p>
          </div>
        </div>

        {/* Principal card */}
        <div className="max-w-sm mx-auto">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm text-center">
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <GraduationCap size={32} className="text-primary-600" />
            </div>
            <h3 className="font-bold text-gray-900 text-lg">Ms. Mansi Sharma</h3>
            <p className="text-primary-600 font-medium text-sm mt-1">Principal</p>
            <p className="text-gray-500 text-sm mt-3">
              Leading S.D.M. Academy with a vision for quality education and holistic development.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
