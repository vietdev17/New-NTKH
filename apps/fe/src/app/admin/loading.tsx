export default function AdminLoading() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 rounded-full border-3 border-primary-200 border-t-primary-500 animate-spin" />
        <p className="text-sm text-gray-400">Dang tai...</p>
      </div>
    </div>
  );
}
