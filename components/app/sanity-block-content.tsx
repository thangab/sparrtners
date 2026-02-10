import { SanityBlock, blockText } from '@/lib/sanity';

type SanityBlockContentProps = {
  blocks?: SanityBlock[] | null;
};

export function SanityBlockContent({ blocks }: SanityBlockContentProps) {
  if (!blocks || blocks.length === 0) return null;

  return (
    <div className="space-y-3 text-sm leading-7 text-slate-700 md:text-base">
      {blocks.map((block, index) => {
        const text = blockText(block);
        if (!text) return null;

        if (block.style === 'h2') {
          return (
            <h2 key={`${index}-${text.slice(0, 20)}`} className="pt-2 text-2xl font-bold text-slate-900">
              {text}
            </h2>
          );
        }

        if (block.style === 'h3') {
          return (
            <h3 key={`${index}-${text.slice(0, 20)}`} className="pt-1 text-xl font-semibold text-slate-900">
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
