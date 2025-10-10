"use client"

interface Category {
  id: string
  name: string
  slug: string
  color: string
  icon: string
  order: number
}

interface CategoryFilterProps {
  categories: Category[]
  selectedCategory: string
  onCategoryChange: (category: string) => void
  className?: string
}

export default function CategoryFilter({
  categories,
  selectedCategory,
  onCategoryChange,
  className = "",
}: CategoryFilterProps) {
  const getIcon = (iconName: string) => {
    const icons = {
      "book-open": (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
      ),
      scroll: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      ),
      calendar: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      ),
      "calendar-days": (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      ),
    }
    return icons[iconName as keyof typeof icons] || icons["book-open"]
  }

  return (
    <div className={`bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden ${className}`}>
      <div className="p-4 bg-gradient-to-r from-green-800 to-green-700 text-white">
        <h3 className="font-semibold flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-7H5m14 14H5" />
          </svg>
          Categories
        </h3>
      </div>

      <div className="p-4">
        <div className="space-y-2">
          <button
            onClick={() => onCategoryChange("")}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
              selectedCategory === ""
                ? "bg-green-100 text-green-800 border-2 border-green-300"
                : "text-gray-600 hover:bg-gray-50 border-2 border-transparent"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                selectedCategory === "" ? "bg-green-800 text-white" : "bg-gray-200 text-gray-600"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
              </svg>
            </div>
            <span className="font-medium">All Categories</span>
          </button>

          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.slug)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
                selectedCategory === category.slug
                  ? "text-white border-2 border-opacity-50"
                  : "text-gray-600 hover:bg-gray-50 border-2 border-transparent"
              }`}
              style={{
                backgroundColor: selectedCategory === category.slug ? category.color : undefined,
                borderColor: selectedCategory === category.slug ? category.color : undefined,
              }}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  selectedCategory === category.slug ? "bg-white/20 text-white" : "text-white"
                }`}
                style={{
                  backgroundColor: selectedCategory === category.slug ? undefined : category.color,
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {getIcon(category.icon)}
                </svg>
              </div>
              <span className="font-medium">{category.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
