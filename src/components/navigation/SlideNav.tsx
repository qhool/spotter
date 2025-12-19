import React, { useRef, useEffect, useState } from 'react';
import { PageLeftSolid, PageRightSolid } from 'iconoir-react';
import './SlideNav.css';

interface SlideNavItem {
  text: string;
  onClick: () => void;
}

interface SlideNavProps {
  items: SlideNavItem[];
  selectedIndex: number;
}

export function SlideNav({ items, selectedIndex }: SlideNavProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [translateX, setTranslateX] = useState(0);
  const [hoveredGroup, setHoveredGroup] = useState<number | null>(null);

  const handleGroupHover = (index: number) => {
    setHoveredGroup(index);
  };

  const handleGroupLeave = () => {
    setHoveredGroup(null);
  };

  // Calculate the offset needed to center the selected item
  useEffect(() => {
    console.log('Slidenav layout effect');
    if (!outerRef.current || !innerRef.current || !itemRefs.current[selectedIndex]) {
      return;
    }

    const outerRect = outerRef.current.getBoundingClientRect();
    const selectedItemRect = itemRefs.current[selectedIndex]!.getBoundingClientRect();

    const outerCenter = outerRect.width / 2 + outerRect.left;
    const selectedItemCenter = selectedItemRect.left + selectedItemRect.width / 2;
    // Calculate the offset needed to center the selected item text (ignoring icons)
    const offset = selectedItemCenter - outerCenter;

    // getBoundingClientRect returns values *including* current translation, and
    // the current value of translateX might not be reflected there yet
    const translate = new DOMMatrix(getComputedStyle(innerRef.current).transform);

    setTranslateX(translate.e - offset);
  }, [selectedIndex, items]);

  return (
    <div className="slide-nav-outer" ref={outerRef}>
      <div 
        className="slide-nav-inner"
        ref={innerRef}
        style={{ transform: `translateX(${translateX}px)` }}
      >
        {items.map((item, index) => {
          const isVisible = Math.abs(index - selectedIndex) <= 1;
          const isLeftAdjacent = index === selectedIndex - 1;
          const isRightAdjacent = index === selectedIndex + 1;
          const isGroupHovered = hoveredGroup === index;
          
          return (
            <React.Fragment key={index}>
              {/* Left icon for left-adjacent item */}
              {isLeftAdjacent && (
                <PageLeftSolid 
                  className={`slide-nav-icon nav-item-${index} ${isGroupHovered ? 'group-hover' : ''}`}
                  style={{ visibility: isVisible ? 'visible' : 'hidden' }}
                  onClick={item.onClick}
                  onMouseEnter={() => handleGroupHover(index)}
                  onMouseLeave={handleGroupLeave}
                />
              )}
              
              <button 
                ref={el => itemRefs.current[index] = el}
                className={`slide-nav-item nav-item-${index} ${index === selectedIndex ? 'active' : ''} ${isGroupHovered ? 'group-hover' : ''}`}
                style={{ visibility: isVisible ? 'visible' : 'hidden' }}
                onClick={item.onClick}
                onMouseEnter={() => handleGroupHover(index)}
                onMouseLeave={handleGroupLeave}
              >
                {item.text}
              </button>
              
              {/* Right icon for right-adjacent item */}
              {isRightAdjacent && (
                <PageRightSolid 
                  className={`slide-nav-icon nav-item-${index} ${isGroupHovered ? 'group-hover' : ''}`}
                  style={{ visibility: isVisible ? 'visible' : 'hidden' }}
                  onClick={item.onClick}
                  onMouseEnter={() => handleGroupHover(index)}
                  onMouseLeave={handleGroupLeave}
                />
              )}
              
              {index < items.length - 1 && (
                <span 
                  className="slide-nav-dot"
                  style={{ visibility: isVisible && Math.abs((index + 1) - selectedIndex) <= 1 ? 'visible' : 'hidden' }}
                >
                  •
                </span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}