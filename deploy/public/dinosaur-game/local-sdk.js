// Local adapter: no ads or remote tracking. Breaks resolve at once so play continues.
(() => {
  const noop = () => {};
  window.PokiSDK = {
    adBlocked: true,
    init: () => Promise.resolve(),
    setDebug: noop,
    gameLoadingStart: noop,
    gameLoadingProgress: noop,
    gameLoadingFinished: noop,
    gameplayStart: noop,
    gameplayStop: noop,
    happyTime: noop,
    commercialBreak: () => Promise.resolve(),
    rewardedBreak: () => Promise.resolve(false)
  };
})();
