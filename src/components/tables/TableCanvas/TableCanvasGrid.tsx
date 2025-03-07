export function TableCanvasGrid() {
  return (
    <div className="absolute inset-0 grid grid-cols-8 grid-rows-6">
      {Array.from({ length: 48 }).map((_, i) => (
        <div key={i} className="border border-muted/10 grid-cell"></div>
      ))}
    </div>
  );
}