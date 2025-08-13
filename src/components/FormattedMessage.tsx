import React from 'react';

interface FormattedMessageProps {
  text: string;
}

const FormattedMessage: React.FC<FormattedMessageProps> = ({ text }) => {
  const parts = text.split('*');

  return (
    <>
      {parts.map((part, index) => {
        if (!part) return null;

        if (index % 2 === 1) {
          return (
            <div key={index} className="bubble__situation">
              {part.split('\n').map((line, lineIndex) => (
                <React.Fragment key={lineIndex}>
                  {lineIndex > 0 && <br />}
                  {line}
                </React.Fragment>
              ))}
            </div>
          );
        }

        return (
          <div key={index} className="bubble__dialogue">
            {part.split('\n').map((line, lineIndex) => (
              <React.Fragment key={lineIndex}>
                {lineIndex > 0 && <br />}
                {line}
              </React.Fragment>
            ))}
          </div>
        );
      })}
    </>
  );
};

export default FormattedMessage; 