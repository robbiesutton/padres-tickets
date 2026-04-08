import { Bone } from '@/components/skeleton';

export default function Loading() {
  return (
    <div className="flex flex-1 flex-col bg-[#fefefe]">
      <div className="max-w-[1024px] mx-auto w-full px-4 pt-4 pb-6 md:px-10 md:pt-8 md:pb-10 flex-1">
        {/* Header */}
        <div className="mb-6">
          <Bone w="180px" h="32px" delay={0} />
        </div>

        {/* Content blocks */}
        <div className="flex flex-col gap-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <Bone key={i} w="100%" h="80px" r={10} delay={i * 0.08} />
          ))}
        </div>
      </div>
    </div>
  );
}
