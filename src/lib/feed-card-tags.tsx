import type { UnifiedFeedItem } from "@/lib/feed-items";
import { Sparkles, TrendingUp, Users, TrendingDown } from "lucide-react";

export function buildSignalCardTags(input: {
  feedItem: UnifiedFeedItem | null;
  fallbackLabels: string[];
}) {
  const indicatorTags = (input.feedItem?.indicators ?? []).slice(0, 3).map((indicator) => ({
    icon:
      indicator.tone === "strong"
        ? <Sparkles size={14} />
        : indicator.tone === "positive"
          ? <TrendingUp size={14} />
          : <Users size={14} />,
    label: indicator.label,
  }));

  if (indicatorTags.length > 0) {
    return indicatorTags;
  }

  return input.fallbackLabels.map((tag, index) => ({
    icon: index === 1 ? <TrendingDown size={14} /> : index === 2 ? <Users size={14} /> : <TrendingUp size={14} />,
    label: tag,
  }));
}
