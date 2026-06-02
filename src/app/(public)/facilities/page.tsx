export default function FacilitiesPage() {
  const facilities = [
    {
      name: "Smart Classrooms",
      description: "Modern classrooms equipped with projectors and interactive learning tools to make lessons engaging and effective.",
      icon: "🖥️",
    },
    {
      name: "Science Laboratory",
      description: "A well-equipped science lab enabling students to conduct experiments and develop a practical understanding of scientific concepts.",
      icon: "🔬",
    },
    {
      name: "Dance Room",
      description: "A dedicated space for classical and folk dance training, nurturing students' artistic expression and cultural appreciation.",
      icon: "🎭",
    },
    {
      name: "Creative Room",
      description: "An art and craft room where students explore painting, drawing, origami, and other creative activities.",
      icon: "🎨",
    },
    {
      name: "Playground",
      description: "A spacious playground for physical activities, sports, and outdoor games that keep students healthy and active.",
      icon: "⚽",
    },
    {
      name: "Computer Lab",
      description: "Computer literacy classes from Class 1 onwards with dedicated computers and qualified instructors.",
      icon: "💻",
    },
  ];

  return (
    <div>
      <div className="bg-primary-700 text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="text-primary-200 text-sm font-medium uppercase tracking-wider mb-2">Facilities</p>
          <h1 className="text-4xl font-bold">Our Infrastructure</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="text-center mb-10">
          <p className="text-gray-600 max-w-2xl mx-auto">
            S.D.M. Academy Shaulana provides a safe, stimulating environment where students can learn,
            explore, and grow through well-maintained, modern facilities.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {facilities.map((f) => (
            <div
              key={f.name}
              className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-primary-200 transition-all"
            >
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{f.name}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
