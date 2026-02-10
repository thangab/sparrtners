import { SanityBlock, blockText } from '@/lib/sanity';
import Image from 'next/image';

type SanityBlockContentProps = {
  blocks?: SanityBlock[] | null;
};

export function SanityBlockContent({ blocks }: SanityBlockContentProps) {
  if (!blocks || blocks.length === 0) return null;
  const toAnchorId = (value: string) =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  return (
    <div className="space-y-4 text-[15px] leading-7 text-slate-700 md:text-base">
      {blocks.map((block, index) => {
        if (block._type === 'image' && block.url) {
          return (
            <figure key={`${index}-${block.url}`} className="my-6 space-y-2">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                <Image
                  src={block.url}
                  alt={block.alt || 'Image article'}
                  width={1600}
                  height={900}
                  className="h-auto w-full object-cover"
                />
              </div>
              {block.alt ? (
                <figcaption className="text-xs text-slate-500">{block.alt}</figcaption>
              ) : null}
            </figure>
          );
        }

        const text = blockText(block);
        if (!text) return null;

        if (block.style === 'h2') {
          const anchorId = toAnchorId(text);
          return (
            <h2
              id={anchorId}
              key={`${index}-${text.slice(0, 20)}`}
              className="scroll-mt-24 pt-5 text-2xl font-black tracking-tight text-slate-900"
            >
              {text}
            </h2>
          );
        }

        if (block.style === 'h3') {
          const anchorId = toAnchorId(text);
          return (
            <h3
              id={anchorId}
              key={`${index}-${text.slice(0, 20)}`}
              className="scroll-mt-24 pt-3 text-xl font-bold text-slate-900"
            >
              {text}
            </h3>
          );
        }

        if (block.listItem) {
          return (
            <p key={`${index}-${text.slice(0, 20)}`} className="pl-4">
              <span className="mr-2 text-orange-600">•</span>
              {text}
            </p>
          );
        }

        return <p key={`${index}-${text.slice(0, 20)}`}>{text}</p>;
      })}
    </div>
  );
}
