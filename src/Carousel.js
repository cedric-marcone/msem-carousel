import React, { useRef, useEffect, useState, memo, cloneElement } from "react";

const raf = requestAnimationFrame;
const doubleRaf = (cb) => raf(() => raf(cb));

const reorderChildren = (children, initial) => {
  return [
    ...children.slice(initial, children.length),
    ...children.slice(0, initial),
  ];
};

const patchProps = ({ type, props }) => {
  if (type !== "img") return props;
  const { src, ...rest } = props;
  return { ...rest, "data-src": src };
};

const patchChildren = (children) => {
  return children.map((child) => ({
    ...child,
    props: {
      ...patchProps(child),
      children: Array.isArray(child.props.children)
        ? patchChildren(child.props.children)
        : child.props.children,
    },
  }));
};

const loadImage = (img) => {
  return new Promise((resolve) => {
    if (!img.src) {
      img.onload = resolve;
      img.src = img.dataset.src;
      delete img.dataset.src;
    } else {
      resolve();
    }
  });
};

const loadImages = (slide) => {
  const imgs = Array.from(slide.querySelectorAll("img"));
  return Promise.all(imgs.map(loadImage));
};

const styles = {
  position: "relative",
  width: "100%",
  overflow: "hidden",
};
const innerStyles = {
  display: "flex",
  transition: "transform cubic-bezier(.4, 0, .2, 1)",
};

const Carousel = ({
  duration = 3000,
  transition = 240,
  auto,
  prevButton,
  nextButton,
  navigation,
  children,
}) => {
  const [current, setCurrent] = useState(0);
  const inner = useRef();
  const interval = useRef();
  const transitioning = useRef();
  const transitionMs = `${transition}ms`;

  const beginTransition = () => {
    if (transitioning.current) return false;
    transitioning.current = true;
    clearInterval(interval.current);
    return true;
  };

  const endTransition = () => {
    transitioning.current = false;
    if (auto) interval.current = setInterval(next, duration);
  };

  const prev = () => {
    if (!beginTransition()) return;
    const el = inner.current;
    const first = el.firstChild;
    const last = el.lastChild;
    loadImages(last).then(() => {
      el.style.transitionDuration = "0s";
      el.style.transform = `translate(-100%, 0)`;
      el.removeChild(last);
      el.insertBefore(last, first);
      doubleRaf(() => {
        el.style.transitionDuration = transitionMs;
        el.style.transform = `translate(0, 0)`;
        setTimeout(endTransition, transition);
      });
    });
  };

  const next = () => {
    if (!beginTransition()) return;
    const el = inner.current;
    const first = el.firstChild;

    loadImages(first.nextSibling).then(() => {
      el.style.transitionDuration = transitionMs;
      el.style.transform = `translate(-100%, 0)`;
      setTimeout(() => {
        el.style.transitionDuration = "0s";
        el.style.transform = `translate(0, 0)`;
        el.removeChild(first);
        el.appendChild(first);
        doubleRaf(() => {
          el.style.transitionDuration = transitionMs;
          endTransition();
        });
      }, transition);
    });
  };

  const navClicked = (index) => () => {
    setCurrent(index);
  };

  const activateLink = (link, index) => {
    return cloneElement(link, { onClick: navClicked(index) });
  };
  const activateNavigation = (nav) => {
    return {
      ...nav,
      props: { ...nav.props, children: nav.props.children.map(activateLink) },
    };
  };

  useEffect(() => {
    const first = inner.current.firstChild;
    loadImages(first).then(endTransition);
    return beginTransition;
  });

  return (
    <div style={styles}>
      <div style={innerStyles} ref={inner}>
        {patchChildren(reorderChildren(children, current))}
      </div>
      {prevButton && cloneElement(prevButton, { onClick: prev })}
      {nextButton && cloneElement(nextButton, { onClick: next })}
      {navigation && activateNavigation(navigation)}
    </div>
  );
};

export default memo(Carousel);
