"use client";

export function TrustStrip() {
  const badges = [
    {
      icon: "✓",
      title: "Verified Survey Plan",
      description: "Confirmed by licensed surveyors",
    },
    {
      icon: "👥",
      title: "Community Confirmed",
      description: "Local stakeholders validated",
    },
    {
      icon: "📋",
      title: "Family Ownership Disclosed",
      description: "Complete ownership history",
    },
    {
      icon: "⚖️",
      title: "No Court Disputes",
      description: "Clear legal history",
    },
  ];

  return (
    <div className="bg-white py-8 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-center text-sm font-bold text-gray-600 uppercase tracking-widest mb-8">
          Every listing verified for trust
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {badges.map((badge, idx) => (
            <div
              key={idx}
              className="flex items-center gap-4 p-4 rounded-lg border border-orange-200 bg-orange-50 hover:bg-orange-100 transition-all transform hover:scale-105 hover:shadow-lg cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-orange-500 text-white flex items-center justify-center text-xl font-bold flex-shrink-0">
                {badge.icon}
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">{badge.title}</h4>
                <p className="text-xs text-gray-600">{badge.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
