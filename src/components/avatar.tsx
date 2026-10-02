// Square blue tile with the first letter, like the team and member cards on the chapter website.
export default function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const box = size === "lg" ? "size-14 rounded-2xl text-2xl" : size === "md" ? "size-10 rounded-xl text-lg" : "size-8 rounded-lg text-sm";
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center bg-[linear-gradient(135deg,#1a8dff,#0066e0)] font-bold text-white ${box}`}
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}
