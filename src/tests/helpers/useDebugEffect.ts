import { useEffect, useRef } from 'react';

const ids = new WeakMap<object, number>();
let counter = 1;

const refId = (obj: object) => {
  if (!ids.has(obj)) {
    ids.set(obj, counter++);
  }
  return ids.get(obj);
};

/**
 * Debug helper to log which dependency triggers a useEffect rerun.
 */
export function useDebugEffect(
  name: string,
  effect: () => void | (() => void),
  deps: any[]
) {
  const prev = useRef<any[]>();

  useEffect(() => {
    if (prev.current) {
      deps.forEach((dep, index) => {
        const prevDep = prev.current![index];
        if (!Object.is(dep, prevDep)) {
          const describe = (val: any) =>
            val && typeof val === 'object' ? `ref#${refId(val)}` : String(val);
          console.log(
            `[${name}] dep ${index} changed: ${describe(prevDep)} -> ${describe(dep)}`
          );
        }
      });
    } else {
      console.log(`[${name}] initial run`);
    }

    prev.current = deps;
    return effect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
