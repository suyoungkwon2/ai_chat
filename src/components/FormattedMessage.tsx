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
              {part}
            </div>
          );
        }

        return (
          <div key={index} className="bubble__dialogue">
            {part}
          </div>
        );
      })}
    </>
  );
};

export default FormattedMessage; 