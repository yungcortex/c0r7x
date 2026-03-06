export function initLoadingScreen() {
  return new Promise(resolve => {
    const screen = document.getElementById('loading-screen');
    if (!screen) return resolve();

    setTimeout(() => {
      screen.classList.add('hidden');
      setTimeout(() => {
        screen.remove();
        resolve();
      }, 800);
    }, 2500);
  });
}
