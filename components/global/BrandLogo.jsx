import Link from "next/link";
import { cn } from "@/lib/utils";

const sizes = {
  sm: {
    root: "gap-2",
    mark: "size-8 rounded-lg text-base",
    text: "text-lg sm:text-xl",
  },
  md: {
    root: "gap-2",
    mark: "size-9 rounded-xl text-lg",
    text: "text-xl",
  },
  lg: {
    root: "gap-3",
    mark: "size-11 rounded-2xl text-xl",
    text: "text-3xl",
  },
};

export default function BrandLogo({
  href = "/",
  size = "md",
  className,
  markClassName,
  textClassName,
}) {
  const styles = sizes[size] || sizes.md;

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center font-bold text-customRed transition-opacity hover:opacity-85",
        styles.root,
        className
      )}
    >
      <span
        className={cn(
          "grid place-items-center bg-customRed font-black text-white shadow-md shadow-customRed/20",
          styles.mark,
          markClassName
        )}
      >
        F
      </span>
      <span className={cn("whitespace-nowrap", styles.text, textClassName)}>
        FunBx
      </span>
    </Link>
  );
}
