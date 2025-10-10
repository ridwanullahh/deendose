export default function LoadingSpinner({
  size = "md",
  className = "",
}: { size?: "sm" | "md" | "lg"; className?: string }) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${sizeClasses[size]} animate-spin`}>
        <div className="w-full h-full border-4 border-green-200 border-t-green-800 rounded-full"></div>
      </div>
    </div>
  )
}
