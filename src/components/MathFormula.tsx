import React, { useMemo } from 'react';
import { renderTeX } from '../utils/mathEngine';

interface MathFormulaProps {
  math: string;
  displayMode?: boolean;
  className?: string;
}

export const MathFormula: React.FC<MathFormulaProps> = ({
  math,
  displayMode = false,
  className = '',
}) => {
  const html = useMemo(() => {
    return renderTeX(math, displayMode);
  }, [math, displayMode]);

  return (
    <span
      className={`inline-block select-none transition-opacity ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
