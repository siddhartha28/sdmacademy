import { Bell, Calendar } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const revalidate = 60;

export default async function NoticesPage() {
  let notices: Awaited<ReturnType<typeof prisma.notice.findMany>> = [];
  try {
    notices = await prisma.notice.findMany({
      where: { isPublished: true },
      orderBy: { publishedAt: "desc" },
      take: 30,
    });
  } catch {
    notices = [];
  }

  return (
    <div>
      <div className="bg-primary-700 text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="text-primary-200 text-sm font-medium uppercase tracking-wider mb-2">Notice Board</p>
          <h1 className="text-4xl font-bold">Announcements</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-14">
        {notices.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-gray-100 text-gray-400 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell size={28} />
            </div>
            <h3 className="font-semibold text-gray-600">No notices at this time</h3>
            <p className="text-gray-400 text-sm mt-1">Check back soon for updates.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notices.map((notice) => (
              <div
                key={notice.id}
                className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:border-primary-200 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-primary-100 text-primary-600 p-2 rounded-lg flex-shrink-0 mt-0.5">
                    <Bell size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <h3 className="font-semibold text-gray-900">{notice.title}</h3>
                      {notice.category && (
                        <span className="text-xs bg-primary-50 text-primary-600 border border-primary-100 px-2 py-0.5 rounded-full">
                          {notice.category}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-1 mb-3">
                      <Calendar size={12} />
                      {formatDate(notice.publishedAt || notice.createdAt)}
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{notice.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
