import { useLayoutEffect, useState } from 'react';

export function useControlsSlot(portalId: string) {
  const [element, setElement] = useState<Element | null>(null);
  useLayoutEffect(() => {
    setElement(document.getElementById(portalId));
  }, [portalId]);
  return element;
}