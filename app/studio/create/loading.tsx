/** Skeleton while create page chunk and data load. Keeps interaction feeling fast. */
export default function CreateLoading() {
  return (
    <div className="max-w-none -mx-4 md:-mx-8 w-[calc(100%+2rem)] md:w-[calc(100%+4rem)] min-h-[calc(100vh-140px)] flex flex-col md:flex-row animate-pulse">
      <div className="w-full md:w-[55%] min-w-0 flex flex-col bg-[#080808]">
        <div className="flex-1 overflow-hidden px-6 md:px-11 pt-10 pb-44">
          <div className="h-4 w-24 bg-[#ffffff0a] rounded mb-2" />
          <div className="h-6 w-48 bg-[#ffffff0a] rounded mb-8" />
          <div className="space-y-8">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <div className="h-3 w-20 bg-[#ffffff0a] rounded mb-2" />
                <div className="h-5 w-36 bg-[#ffffff0a] rounded mb-4" />
                <div className="h-24 bg-[#ffffff0a] rounded-xl" />
              </div>
            ))}
          </div>
        </div>
        <div className="fixed bottom-0 left-0 right-0 md:relative border-t border-[#ffffff06] bg-[#080808] p-4 md:p-6">
          <div className="h-12 max-w-md mx-auto bg-[#ffffff0a] rounded-xl" />
        </div>
      </div>
      <div className="w-full md:w-[45%] min-w-0 sticky top-0 hidden md:flex flex-col bg-[#111111] border-l border-[#ffffff06] items-center justify-center min-h-[400px] p-8">
        <div className="w-64 aspect-square bg-[#ffffff08] rounded-2xl" />
        <div className="h-3 w-32 bg-[#ffffff0a] rounded mt-4" />
      </div>
    </div>
  );
}
