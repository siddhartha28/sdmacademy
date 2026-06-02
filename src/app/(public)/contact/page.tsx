import { Phone, Mail, MapPin, Clock, MessageCircle } from "lucide-react";
import { SCHOOL_INFO } from "@/lib/constants";

export default function ContactPage() {
  return (
    <div>
      <div className="bg-primary-700 text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="text-primary-200 text-sm font-medium uppercase tracking-wider mb-2">Contact</p>
          <h1 className="text-4xl font-bold">Get in Touch</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>
            <div className="space-y-5">
              {[
                {
                  icon: MapPin,
                  title: "Address",
                  content: SCHOOL_INFO.address,
                  link: null,
                },
                {
                  icon: Phone,
                  title: "Phone",
                  content: SCHOOL_INFO.phone,
                  link: `tel:${SCHOOL_INFO.phone}`,
                },
                {
                  icon: MessageCircle,
                  title: "WhatsApp",
                  content: SCHOOL_INFO.whatsapp,
                  link: `https://wa.me/${SCHOOL_INFO.whatsapp.replace(/\D/g, "")}`,
                },
                {
                  icon: Mail,
                  title: "Email",
                  content: SCHOOL_INFO.email,
                  link: `mailto:${SCHOOL_INFO.email}`,
                },
                {
                  icon: Clock,
                  title: "School Hours",
                  content: "Monday – Saturday: 8:00 AM – 2:00 PM",
                  link: null,
                },
              ].map(({ icon: Icon, title, content, link }) => (
                <div key={title} className="flex items-start gap-4">
                  <div className="bg-primary-100 text-primary-600 p-2.5 rounded-lg flex-shrink-0">
                    <Icon size={18} />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{title}</div>
                    {link ? (
                      <a href={link} className="text-primary-600 hover:underline text-sm mt-0.5">
                        {content}
                      </a>
                    ) : (
                      <div className="text-gray-600 text-sm mt-0.5">{content}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex gap-3">
              <a
                href={`tel:${SCHOOL_INFO.phone}`}
                className="flex-1 bg-primary-500 hover:bg-primary-600 text-white text-center py-3 rounded-xl font-semibold text-sm transition-colors"
              >
                Call Now
              </a>
              <a
                href={`https://wa.me/${SCHOOL_INFO.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-green-500 hover:bg-green-600 text-white text-center py-3 rounded-xl font-semibold text-sm transition-colors"
              >
                WhatsApp
              </a>
            </div>
          </div>

          {/* Map embed placeholder */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Find Us</h2>
            <div className="rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 h-72 flex items-center justify-center">
              <iframe
                src="https://maps.google.com/maps?q=Shaulana+Dhaulana+Hapur+UP&z=14&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="School location"
              />
            </div>
            <div className="mt-4 bg-primary-50 border border-primary-100 rounded-xl p-4 text-sm text-primary-700">
              <strong>S.D.M. Academy Shaulana</strong><br />
              {SCHOOL_INFO.address}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
