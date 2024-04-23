import React, {useState, useEffect} from "react";

import cx from "classnames";
import s from "./loader.scss";

export default function Loader({className, millisecondsTimer, type = "bars", width = 16}) {

  const [timeLeft, setTimeLeft] = useState(millisecondsTimer);

  useEffect(() => {
    // Exit early when we reach 0
    if (!timeLeft) return;

    // Save intervalid to clear the interval when the component re-renders
    const intervalId = setInterval(() => {
      setTimeLeft(timeLeft - 50);
    }, 50);

    // Clear interval on re-render to avoid memory leaks
    return () => clearInterval(intervalId);

    // Add timeLeft as a dependency to re-rerun the effect when we update it
  }, [timeLeft]);

  const renderBars = () => {
    return (
      <>
        <div />
        <div />
        <div />
      </>
    );
  };

  const renderCircle = () => {
    return <div />;
  };

  const renderTimer = () => {
    const radius = (width - width * 0.1875) / 2;
    const dashArray = radius * Math.PI * 2;
    const dashOffset = dashArray - (timeLeft / millisecondsTimer) * dashArray;

    return (
      <>
        <svg width={width} height={width} viewBox={`0 0 ${width} ${width}`}>
          <circle r={radius} cx={width / 2} cy={width / 2} />
          <circle
            r={radius}
            cx={width / 2}
            cy={width / 2}
            transform={`rotate(-90 ${width / 2} ${width / 2})`}
            style={{
              strokeDasharray: dashArray,
              strokeDashoffset: dashOffset,
            }}
          />
        </svg>
        <span>{Math.floor(timeLeft / 1000)}</span>
      </>
    );
  };

  return (
    <div
      className={cx(s.loader, className, {[s[type]]: true})}
      style={{width: width, height: width, fontSize: width}}
    >
      {type === "bars" && renderBars()}
      {type === "circle" && renderCircle()}
      {type === "timer" && renderTimer()}
      {type === "timerAndCircle" && (timeLeft > 0 ? renderTimer() : renderCircle())}
    </div>
  );
}
