import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange?: (v: number) => void;
  size?: "sm" | "md" | "lg";
  readOnly?: boolean;
}

export function StarRating({ value, onChange, size = "lg", readOnly }: StarRatingProps) {
  const sizes = { sm: "h-4 w-4", md: "h-6 w-6", lg: "h-9 w-9" };
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(n)}
          className={cn(
            "transition-transform",
            !readOnly && "hover:scale-110 active:scale-95 cursor-pointer",
            readOnly && "cursor-default"
          )}
          aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
        >
          <Star
            className={cn(
              sizes[size],
              n <= value
                ? "fill-primary text-primary"
                : "fill-transparent text-muted-foreground/40"
            )}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );
}
