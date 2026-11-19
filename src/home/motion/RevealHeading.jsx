import React from "react";

export default function RevealHeading({ as: Tag = "h2", children, ...props }) {
  return (
    <Tag {...props}>
      <span className="sr-only">{children}</span>
      <span aria-hidden="true" className="reveal-heading">
        {children.split(" ").map((word, index) => (
          <React.Fragment key={index}>
            {index > 0 && " "}
            <span className="reveal-mask">
              <span className="reveal-word">{word}</span>
            </span>
          </React.Fragment>
        ))}
      </span>
    </Tag>
  );
}
