export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex h-10 w-10 select-none items-center justify-center rounded-lg bg-black dark:bg-white dark:text-black">
        <span className="font-bold text-lg text-white dark:text-black">CX</span>
        <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white dark:border-black bg-green-500" />
      </div>
      <span className="font-bold text-xl dark:text-white">CLIMEX</span>
    </div>
  );
}
