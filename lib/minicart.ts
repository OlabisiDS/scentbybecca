export const openMiniCart = () => { if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("sbb-minicart")); };
