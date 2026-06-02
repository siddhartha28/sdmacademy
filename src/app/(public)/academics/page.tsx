import { BookOpen, Monitor, Palette } from "lucide-react";
import { CLASSES, SUBJECTS_BY_CLASS } from "@/lib/constants";

export default function AcademicsPage() {
  return (
    <div>
      <div className="bg-primary-700 text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="text-primary-200 text-sm font-medium uppercase tracking-wider mb-2">Academics</p>
          <h1 className="text-4xl font-bold">Curriculum & Classes</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        {/* Board info */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            { icon: BookOpen, title: "UP Board Curriculum", desc: "Full Uttar Pradesh Board curriculum from Class 1 to 8, preparing students for UP Board examinations." },
            { icon: Monitor, title: "Computer Science", desc: "Dedicated computer classes from Class 1 onwards, building digital literacy from an early age." },
            { icon: Palette, title: "Drawing & Arts", desc: "Drawing and creative arts are integrated into the curriculum across all classes." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="bg-primary-100 text-primary-600 w-10 h-10 rounded-lg flex items-center justify-center mb-3">
                <Icon size={20} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* Classes + Subjects */}
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Classes & Subjects</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {CLASSES.slice(0, 8).map((cls) => {
            const subjects = SUBJECTS_BY_CLASS[cls.name] || [];
            return (
              <div key={cls.id} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-primary-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                    {cls.name}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {subjects.map((s) => (
                    <span
                      key={s}
                      className="text-xs bg-primary-50 text-primary-700 border border-primary-100 px-2 py-1 rounded-full"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Exams */}
        <div className="mt-10 bg-primary-50 border border-primary-100 rounded-2xl p-7">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Examination Pattern</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {["Unit Test 1", "Unit Test 2", "Half Yearly", "Annual Examination"].map((exam) => (
              <div key={exam} className="bg-white rounded-lg p-4 border border-primary-100 text-center">
                <div className="font-semibold text-primary-700 text-sm">{exam}</div>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-4">
            * Grading follows UP Board standard: A1 (91–100), A2 (81–90), B1 (71–80), B2 (61–70), C1 (51–60), C2 (41–50), D (33–40), E (Below 33)
          </p>
        </div>
      </div>
    </div>
  );
}
