export default function CatalogCardSkeleton() {
  return (
    <div className="flex flex-col rounded-2xl border border-gray-100 bg-white shadow-sm">
      {/* Thumbnail skeleton */}
      <div className="h-44 w-full animate-pulse rounded-t-2xl bg-gray-200" />
 
      {/* Konten skeleton */}
      <div className="flex flex-col gap-3 p-4">
        <div className="h-3.5 w-3/4 animate-pulse rounded-full bg-gray-200" />
        <div className="h-3.5 w-1/2 animate-pulse rounded-full bg-gray-200" />
        <div className="mt-2 h-5 w-2/3 animate-pulse rounded-full bg-gray-200" />
        <div className="h-8 w-full animate-pulse rounded-xl bg-gray-100" />
      </div>
    </div>
  );
}