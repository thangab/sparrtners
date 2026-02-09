import { Star } from 'lucide-react';

type TrustScoreProps = {
  score?: number | null;
  reviewCount?: number | null;
  size?: 'sm' | 'md';
  showReviewCount?: boolean;
};

export function TrustScore({
  score,
  reviewCount,
  size = 'md',
  showReviewCount = true,
}: TrustScoreProps) {
  const safeScore =
    typeof score === 'number' && Number.isFinite(score)
      ? Math.max(0, Math.min(5, score))
      : null;
  const safeCount =
    typeof reviewCount === 'number' && Number.isFinite(reviewCount)
      ? Math.max(0, reviewCount)
      : 0;
  const filledStars = safeScore == null ? 0 : Math.round(safeScore);
  const starClass = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';

  if (safeScore == null || safeCount === 0) {
    return (
      <div className="inline-flex items-center gap-1.5 text-xs text-slate-500">
        <Star className={`${starClass} text-slate-300`} />
        <span>Nouveau profil</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 text-xs">
      <span className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, index) => {
          const active = index < filledStars;
          return (
            <Star
              key={index}
              className={`${starClass} ${
                active
                  ? 'fill-amber-400 text-amber-400'
                  : 'fill-transparent text-slate-300'
              }`}
            />
          );
        })}
      </span>
      <span className="font-semibold text-slate-900">{safeScore.toFixed(1)}</span>
      {showReviewCount ? (
        <span className="text-slate-500">({safeCount} avis)</span>
      ) : null}
    </div>
  );
}
