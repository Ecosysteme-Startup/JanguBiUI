/** « Jeudi de la 25e semaine » : le « e » des ordinaux en exposant, comme dans la maquette. */
export const OrdinalText = ({ text }: { text: string }) => {
  const parts = text.split(/(\d+(?:e|er|re)\b)/);
  return (
    <>
      {parts.map((part, i) => {
        const match = /^(\d+)(e|er|re)$/.exec(part);
        return match ? (
          <span key={i}>
            {match[1]}
            <sup className="text-[0.6em] leading-none">{match[2]}</sup>
          </span>
        ) : (
          part
        );
      })}
    </>
  );
};
