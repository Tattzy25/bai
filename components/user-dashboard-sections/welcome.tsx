"use client"

export function UserWelcome() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-lg p-8 border">
        <h1 className="text-3xl font-bold mb-2">Welcome to Bridgit AI! 🎉</h1>
        <p className="text-muted-foreground mb-4">
          Your search widget is live and helping your visitors find what they need.
        </p>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition">
            View Dashboard
          </button>
          <button className="px-4 py-2 border rounded-lg hover:bg-accent transition">
            Learn More
          </button>
        </div>
      </div>

      {/* What's New */}
      <div>
        <h2 className="text-xl font-semibold mb-4">What&apos;s New</h2>
        <div className="space-y-3">
          {[
            {
              title: "New Widget Design: Minimalist",
              description: "A sleek, minimal search experience. Perfect for modern websites.",
              date: "Dec 1, 2024",
            },
            {
              title: "Advanced Analytics",
              description: "Track search trends and user behavior with detailed insights.",
              date: "Nov 28, 2024",
            },
            {
              title: "White Label Option",
              description: "Coming soon: Remove all Bridgit branding for enterprise users.",
              date: "Nov 25, 2024",
            },
          ].map((item, idx) => (
            <div key={idx} className="border rounded-lg p-4 hover:bg-accent/50 transition cursor-pointer">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">{item.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Highlights */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Tips</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              icon: "⚙️",
              title: "Customize",
              description: "Adjust colors and appearance to match your brand",
            },
            {
              icon: "🎨",
              title: "Design Gallery",
              description: "Choose from 9 different widget designs",
            },
            {
              icon: "📊",
              title: "Analytics",
              description: "See how visitors are using your search",
            },
            {
              icon: "🚀",
              title: "Deploy",
              description: "Your widget is already live and working",
            },
          ].map((tip, idx) => (
            <div key={idx} className="border rounded-lg p-4">
              <div className="text-2xl mb-2">{tip.icon}</div>
              <h3 className="font-semibold">{tip.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{tip.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Plan Info */}
      <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
        <h2 className="text-lg font-semibold mb-2">Your Current Plan</h2>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Business Plan</p>
            <p className="font-semibold">Unlimited Searches</p>
          </div>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition">
            Manage Plan
          </button>
        </div>
      </div>
    </div>
  )
}
