import React, { useEffect, useState } from "react";

const fallbackAdvance = (char) =>
  char === " "
    ? 28
    : /[ilI]/.test(char)
      ? 27
      : /[mwM]/.test(char)
        ? 83
        : char === "V"
          ? 77
          : 56;
function layout(text, measure) {
  let x = 0;
  return {
    letters: [...text].map((char, index) => {
      const letter = { char, x, index };
      x += (char === "V" ? 77 : measure(char)) - 2;
      return letter;
    }),
    width: x + 4,
  };
}
export default function BrandHeading({
  text,
  as: Tag = "h2",
  id,
  className = "",
}) {
  const [letters, setLetters] = useState(() => layout(text, fallbackAdvance));
  useEffect(() => {
    let alive = true;
    const update = () => {
      if (!alive) return;
      const context = document.createElement("canvas").getContext("2d");
      if (!context) return;
      context.font = "650 100px Bricolage, Arial, sans-serif";
      setLetters(layout(text, (char) => context.measureText(char).width));
    };
    document.fonts.load("650 100px Bricolage").then(update, update);
    return () => {
      alive = false;
    };
  }, [text]);
  return (
    <Tag id={id} className={`brand-heading ${className}`}>
      <span className="sr-only">{text}</span>
      <svg
        viewBox={`0 12 ${letters.width} 112`}
        aria-hidden="true"
        focusable="false"
      >
        <g
          fill="currentColor"
          fontFamily="Bricolage,Arial,sans-serif"
          fontSize="100"
          fontWeight="650"
        >
          {letters.letters.map((letter) =>
            letter.char === "V" ? (
              <path
                key={letter.index}
                transform={`translate(${letter.x},17.3) scale(1,.827)`}
                d="M0 25H17L38 81 59 25H76L47 100H29Z"
              />
            ) : (
              <text key={letter.index} x={letter.x} y="100">
                {letter.char}
              </text>
            ),
          )}
        </g>
      </svg>
    </Tag>
  );
}
