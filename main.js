const disabledThemeButtons = document.querySelectorAll(
  ".gateway-modes .button:disabled"
);

disabledThemeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    button.blur();
  });
});

const gatewayBody = document.querySelector(".gateway-body");
const gatewayOrbs = Array.from(document.querySelectorAll(".gateway-body .bg-orb"));

if (gatewayBody && gatewayOrbs.length > 0) {
  const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  let animationFrameId = null;

  const orbConfigs = [
    {
      element: gatewayOrbs[0],
      ampX: 60,
      ampY: 46,
      driftX: 24,
      driftY: 20,
      microX: 10,
      microY: 8,
      speed: 0.00031,
      phase: 0,
      scaleAmp: 0.022,
    },
    {
      element: gatewayOrbs[1],
      ampX: 52,
      ampY: 54,
      driftX: 22,
      driftY: 18,
      microX: 8,
      microY: 10,
      speed: 0.00028,
      phase: 2.1,
      scaleAmp: 0.02,
    },
    {
      element: gatewayOrbs[2],
      ampX: 42,
      ampY: 36,
      driftX: 16,
      driftY: 14,
      microX: 7,
      microY: 6,
      speed: 0.00034,
      phase: 4.4,
      scaleAmp: 0.017,
    },
  ].filter((config) => Boolean(config.element));

  const animateOrbs = (timestamp) => {
    orbConfigs.forEach((config) => {
      const time = timestamp * config.speed + config.phase;
      const envelope = 1 + Math.sin(time * 0.21 + config.phase) * 0.12;
      const idleX =
        (Math.sin(time * 1.07) * config.ampX +
          Math.cos(time * 0.53 + config.phase * 1.7) * config.driftX +
          Math.sin(time * 2.08 + config.phase) * config.microX) *
        envelope;
      const idleY =
        (Math.cos(time * 0.91 + config.phase * 0.4) * config.ampY +
          Math.sin(time * 0.49) * config.driftY +
          Math.cos(time * 1.87 + config.phase * 0.7) * config.microY) *
        envelope;
      const scale = 1 + Math.sin(time * 1.37) * config.scaleAmp;
      config.element.style.setProperty("--orb-x", `${idleX.toFixed(2)}px`);
      config.element.style.setProperty("--orb-y", `${idleY.toFixed(2)}px`);
      config.element.style.setProperty("--orb-scale", scale.toFixed(4));
    });

    animationFrameId = window.requestAnimationFrame(animateOrbs);
  };

  const startOrbAnimation = () => {
    if (reduceMotionQuery.matches || animationFrameId !== null) return;
    animationFrameId = window.requestAnimationFrame(animateOrbs);
  };

  const stopOrbAnimation = () => {
    if (animationFrameId !== null) {
      window.cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    orbConfigs.forEach((config) => {
      config.element.style.removeProperty("--orb-x");
      config.element.style.removeProperty("--orb-y");
      config.element.style.removeProperty("--orb-scale");
    });
  };

  const onMotionPreferenceChange = () => {
    if (reduceMotionQuery.matches) {
      stopOrbAnimation();
      return;
    }
    startOrbAnimation();
  };

  if (typeof reduceMotionQuery.addEventListener === "function") {
    reduceMotionQuery.addEventListener("change", onMotionPreferenceChange);
  } else if (typeof reduceMotionQuery.addListener === "function") {
    reduceMotionQuery.addListener(onMotionPreferenceChange);
  }

  onMotionPreferenceChange();
}
