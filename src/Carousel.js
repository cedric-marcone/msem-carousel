import React, { useRef, useEffect, memo, cloneElement } from "react";

const patchProps = ({ type, props }) => {
  if (type !== "img") return props;
  const { src, ...rest } = props;
  return { ...rest, "data-src": src };
};
const patchChildren = (children) => {
  return children.map((child) => {
    const subs = child.props.children;
    const patchedProps = patchProps(child);
    const patchedChildren = Array.isArray(subs) ? patchChildren(subs) : subs;
    return { ...child, props: { ...patchedProps, children: patchedChildren } };
  });
};

const patchLink = (goto) => (link, index) => {
  return cloneElement(link, { onClick: goto(index) });
};
const patchLinks = (nav, goto) => {
  return { ...nav, props: { ...nav.props, children: nav.props.children.map(patchLink(goto)) } };
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

const reorderChildren = (children, index) => {
  return [...children.slice(index, children.length), ...children.slice(0, index)];
};

const doubleRaf = (cb) => requestAnimationFrame(() => requestAnimationFrame(cb));

const initFadeStyles = (slides, duration) => {
  slides.forEach(({ style }, index) =>
    Object.assign(style, {
      transition: `opacity ${duration} cubic-bezier(.4, 0, .2, 1)`,
      opacity: index ? 0 : 1,
      position: index ? "absolute" : undefined
    })
  );
};

const styles = {
  position: "relative",
  width: "100%",
  overflow: "hidden"
};
const innerStyles = {
  display: "flex",
  transition: "transform cubic-bezier(.4, 0, .2, 1)"
};

const fadeHooks = () => ({
  prePrev: () => {},
  postPrev: (_, first, last) => {
    last.style.opacity = 1;
    first.style.opacity = 0;
  },
  preNext: (_, sibling) => {
    sibling.style.opacity = 1;
  },
  postNext: (_, first) => {
    first.style.opacity = 0;
  }
});

const moveHooks = (transitionMs) => ({
  prePrev: (inner) => {
    inner.style.transitionDuration = "0s";
    inner.style.transform = `translate(-100%, 0)`;
  },
  postPrev: (inner) => {
    inner.style.transitionDuration = transitionMs;
    inner.style.transform = `translate(0, 0)`;
  },
  preNext: (inner) => {
    inner.style.transform = `translate(-100%, 0)`;
    inner.style.transitionDuration = transitionMs;
  },
  postNext: (inner) => {
    inner.style.transitionDuration = "0s";
    inner.style.transform = `translate(0, 0)`;
  }
});

const Carousel = ({ duration = 3000, transition = 240, auto, fade, prevButton, nextButton, navigation, children }) => {
  const inner = useRef();
  const original = useRef();
  const interval = useRef();
  const transitioning = useRef();
  const transitionMs = `${transition}ms`;
  const targetHooks = fade ? fadeHooks : moveHooks;
  const hooks = targetHooks(transitionMs);

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
      hooks.prePrev(el, first, last);
      el.removeChild(last);
      el.insertBefore(last, first);
      doubleRaf(() => {
        hooks.postPrev(el, first, last);
        setTimeout(endTransition, transition);
      });
    });
  };

  const next = () => {
    if (!beginTransition()) return;
    const el = inner.current;
    const first = el.firstChild;
    const sibling = first.nextSibling;
    loadImages(sibling).then(() => {
      hooks.preNext(el, sibling);
      setTimeout(() => {
        hooks.postNext(el, first);
        el.removeChild(first);
        el.appendChild(first);
        doubleRaf(endTransition);
      }, transition);
    });
  };

  const goto = (index) => () => {
    if (!beginTransition()) return;
    const initial = original.current;
    loadImages(initial[index]).then(() => {
      if (fade) initial[index].style.opacity = 1;
      const reordered = reorderChildren(initial, index);
      const el = inner.current;
      reordered.forEach((child) => {
        el.removeChild(child);
        el.appendChild(child);
      });
      endTransition();
    });
  };

  useEffect(() => {
    const initial = Array.from(inner.current.children);
    original.current = initial;
    if (fade) initFadeStyles(initial, transitionMs);
    const first = inner.current.firstChild;
    loadImages(first).then(endTransition);
    return beginTransition;
  });

  return (
    <div style={styles}>
      <div style={innerStyles} ref={inner}>
        {patchChildren(children)}
      </div>
      {prevButton && cloneElement(prevButton, { onClick: prev })}
      {nextButton && cloneElement(nextButton, { onClick: next })}
      {navigation && patchLinks(navigation, goto)}
    </div>
  );
};

export default memo(Carousel);
