(() => {
    const winnerSection = document.getElementById("winner-page");
    (async () => {
        const response = await fetch("/getwinner");
        const data = await response.json();
        if (data.emoji) {
            winnerSection.innerHTML = data.emoji;
        }
    })();
})();
