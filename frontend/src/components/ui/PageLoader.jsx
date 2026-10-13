/** Spinner shown while a lazily-loaded page's JS file downloads. */
export default function PageLoader({ fullScreen = false }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`flex items-center justify-center ${fullScreen ? 'min-h-screen' : 'py-24'}`}
    >
      <div className="w-8 h-8 border-[3px] border-primary-200 border-t-primary-600 rounded-full animate-spin" />
    </div>
  )
}
