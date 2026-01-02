import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  alt?: string;
};

export default function Logo({ className, alt = "Atlantis" }: LogoProps) {
  return (
    <img
      src="/logo.svg"
      alt={alt}
      className={cn("h-10 w-10 rounded-lg object-contain fill-red", className)}
    />
  );
}
