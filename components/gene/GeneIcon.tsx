/**
 * Compact visual identity for Gene: a restrained circular monogram built with
 * inline SVG (no remote images, no icon library). Decorative, so hidden from
 * assistive tech by default.
 */
export function GeneIcon({
  size = 40,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={[
        "inline-flex items-center justify-center rounded-full",
        "bg-indigo-600 text-white ring-1 ring-inset ring-indigo-500/40",
        "dark:bg-indigo-500",
        className ?? "",
      ].join(" ")}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg
        width={size * 0.6}
        height={size * 0.6}
        viewBox="0 0 24 24"
        fill="none"
        role="presentation"
      >
        <path
          d="M15.5 8.2A4.4 4.4 0 1 0 16 14v-1.9h-3"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="19.5" cy="5.5" r="1.4" fill="currentColor" />
      </svg>
    </span>
  );
}
